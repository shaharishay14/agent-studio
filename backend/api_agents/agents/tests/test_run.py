"""
Fix #6 tests: the single entry point AgentService.run(), and a full run through the real
Agents SDK Runner with a scripted model, built-in and Composio tools together behind the gate.
"""

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from agents import FunctionTool, set_tracing_disabled
from agents.items import ModelResponse
from agents.models.interface import Model
from agents.usage import Usage
from asgiref.sync import sync_to_async
from openai.types.responses import ResponseFunctionToolCall, ResponseOutputMessage, ResponseOutputText

from api_agents.models import ToolApproval
from api_agents.agents.services import agent_service as agent_service_module

pytestmark = pytest.mark.django_db(transaction=True)
set_tracing_disabled(True)


# --- a scripted model for the real Runner -----------------------------------------------------------

class ScriptedModel(Model):
    """Plays back one list of output items per turn, and records what the Runner sent it."""

    def __init__(self, turns):
        self.turns = list(turns)
        self.inputs = []
        self.tool_names = []

    async def get_response(self, system_instructions, input, model_settings, tools, output_schema, handoffs,
                           tracing, **kwargs):
        self.inputs.append(input)
        self.tool_names.append(sorted(tool.name for tool in tools))
        return ModelResponse(output=self.turns.pop(0), usage=Usage(), response_id=None)

    def stream_response(self, *args, **kwargs):
        raise NotImplementedError


def call(call_id, name, arguments):
    return ResponseFunctionToolCall(id=f'fc_{call_id}', call_id=f'call_{call_id}', name=name,
                                    arguments=json.dumps(arguments), type='function_call', status='completed')


def say(text):
    return ResponseOutputMessage(id='msg_1', role='assistant', status='completed', type='message',
                                 content=[ResponseOutputText(text=text, type='output_text', annotations=[])])


def tool_outputs(model, turn):
    """Tool results the Runner sent to the model at the start of a turn."""
    return {item['call_id']: item['output'] for item in model.inputs[turn]
            if isinstance(item, dict) and item.get('type') == 'function_call_output'}


@pytest.fixture
def runner_service(make_service, agent):
    """An AgentService whose Composio path uses fake Gmail/GitHub tools and a scripted model."""
    agent.app_connections = ['GMAIL']
    composio_calls = []

    def composio_tool(slug):
        async def invoke(ctx, payload):
            composio_calls.append((slug, json.loads(payload)))
            return json.dumps({'successful': True, 'data': {'slug': slug}})
        return FunctionTool(name=slug, description=slug, params_json_schema={'type': 'object', 'properties': {}},
                            on_invoke_tool=invoke, strict_json_schema=False)

    def build(turns):
        service = make_service(tool_fn=lambda name, **args: {'success': True, 'data': {'tool': name, **args}})
        service.composio_client = object()
        model = ScriptedModel(turns)
        strategy = SimpleNamespace(select_model=lambda **kw: model, get_selection_reasoning=lambda **kw: '',
                                   _calculate_complexity_score=lambda *a: 0)
        slugs = ['GMAIL_SEND_EMAIL', 'GITHUB_DELETE_A_REPOSITORY']
        service._load_all_tools_for_apps = AsyncMock(return_value=slugs)
        service._load_tools_cached = AsyncMock(return_value=[composio_tool(slug) for slug in slugs])
        patcher = patch.object(agent_service_module, 'get_model_selection_strategy', return_value=strategy)
        patcher.start()
        return service, model, patcher

    yield build, composio_calls
    patch.stopall()


async def approve_when_asked(callback):
    for _ in range(500):  # give up after ~5s: no card means the test should fail, not hang
        if any(event == 'approval_required' for event, _ in callback.recorded):
            break
        await asyncio.sleep(0.01)
    else:
        return
    approval_id = [data for event, data in callback.recorded if event == 'approval_required'][-1]['approval_id']
    await sync_to_async(ToolApproval.objects.filter(id=approval_id).update)(status=ToolApproval.STATUS_APPROVED)


# --- the full loop -----------------------------------------------------------------------------------

async def test_builtin_and_composio_tools_run_in_one_runner_behind_the_gate(runner_service, agent, events,
                                                                             fast_approvals):
    build, composio_calls = runner_service
    service, model, _ = build([
        [call('1', 'get_weather', {'location': 'Paris'})],                          # built-in: runs freely
        [call('2', 'GMAIL_SEND_EMAIL', {'recipient_email': 'dana@co.com'})],        # write: needs approval
        [say('Sent Dana the Paris weather.')],
    ])
    answer, _ = await asyncio.gather(
        service.run(agent, 'Get the weather in Paris and email it to dana@co.com', callback=events),
        approve_when_asked(events),
    )

    assert answer == 'Sent Dana the Paris weather.'
    # one tool list: built-in and Composio tools side by side
    assert model.tool_names[0] == ['GITHUB_DELETE_A_REPOSITORY', 'GMAIL_SEND_EMAIL', 'calculate', 'get_weather']
    # the built-in tool's result reached the model; the write ran only after approval
    assert 'Paris' in tool_outputs(model, 1)['call_1']
    assert composio_calls == [('GMAIL_SEND_EMAIL', {'recipient_email': 'dana@co.com'})]
    assert tool_outputs(model, 2)['call_2'].startswith('<untrusted_tool_output tool="GMAIL_SEND_EMAIL">')
    assert await sync_to_async(ToolApproval.objects.get)() and \
        (await sync_to_async(ToolApproval.objects.get)()).status == ToolApproval.STATUS_APPROVED
    # the UI was told which tools ran
    assert [d['tool'] for e, d in events.recorded if e == 'tool_call_start'] == ['get_weather', 'GMAIL_SEND_EMAIL']


async def test_destructive_tool_is_denied_inside_the_runner(runner_service, agent):
    build, composio_calls = runner_service
    service, model, _ = build([
        [call('1', 'GITHUB_DELETE_A_REPOSITORY', {'repo': 'prod'})],
        [say("I can't delete repositories.")],
    ])
    assert await service.run(agent, 'delete the prod repo') == "I can't delete repositories."
    assert composio_calls == []
    assert 'not allowed' in tool_outputs(model, 1)['call_1']


# --- one rule for every caller -------------------------------------------------------------------------

@pytest.mark.parametrize('apps, has_client, allow, builtins, expected', [
    (['GMAIL'], True, True, ['weather'], 'composio'),       # connected apps + built-ins: one Runner
    (['GMAIL'], True, False, ['weather'], 'agent_tools'),   # Telegram stranger: no owner apps
    (['GMAIL'], False, True, ['weather'], 'agent_tools'),   # Composio not configured
    ([], True, True, ['weather'], 'agent_tools'),
    ([], True, True, [], 'no_tools'),
])
async def test_run_routes_every_caller_the_same_way(make_service, agent, apps, has_client, allow, builtins, expected):
    agent.app_connections, agent.agent_tools = apps, builtins
    service = make_service()
    service.composio_client = object() if has_client else None
    service._chat_with_composio = AsyncMock(return_value='composio')
    service._chat_with_agent_tools = AsyncMock(return_value='agent_tools')
    service._chat_without_tools = AsyncMock(return_value='no_tools')

    assert await service.run(agent, 'hi', allow_connected_apps=allow) == expected
    if expected == 'composio':
        kwargs = service._chat_with_composio.call_args.kwargs
        assert kwargs['use_phase2_optimization'] is True
        assert [tool.name for tool in kwargs['extra_tools']] == ['get_weather']
