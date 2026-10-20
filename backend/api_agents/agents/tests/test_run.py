"""
Fix #6 tests: the single entry point AgentService.run(), and a full run through the real
Agents SDK Runner with a scripted model, built-in and Composio tools together behind the gate.
"""

import asyncio
import json
from unittest.mock import AsyncMock

import pytest
from agents import FunctionTool
from asgiref.sync import sync_to_async

from api_agents.models import ToolApproval
from .conftest import call, say

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def runner_service(make_service, agent, scripted_model):
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
        slugs = ['GMAIL_SEND_EMAIL', 'GITHUB_DELETE_A_REPOSITORY']
        service._load_all_tools_for_apps = AsyncMock(return_value=slugs)
        service._load_tools_cached = AsyncMock(return_value=[composio_tool(slug) for slug in slugs])
        return service, scripted_model(turns)

    return build, composio_calls


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
    service, model = build([
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
    assert 'Paris' in model.tool_outputs(1)['call_1']
    assert composio_calls == [('GMAIL_SEND_EMAIL', {'recipient_email': 'dana@co.com'})]
    assert model.tool_outputs(2)['call_2'].startswith('<untrusted_tool_output tool="GMAIL_SEND_EMAIL">')
    assert await sync_to_async(ToolApproval.objects.get)() and \
        (await sync_to_async(ToolApproval.objects.get)()).status == ToolApproval.STATUS_APPROVED
    # the UI was told which tools ran
    assert [d['tool'] for e, d in events.recorded if e == 'tool_call_start'] == ['get_weather', 'GMAIL_SEND_EMAIL']


async def test_destructive_tool_is_denied_inside_the_runner(runner_service, agent):
    build, composio_calls = runner_service
    service, model = build([
        [call('1', 'GITHUB_DELETE_A_REPOSITORY', {'repo': 'prod'})],
        [say("I can't delete repositories.")],
    ])
    assert await service.run(agent, 'delete the prod repo') == "I can't delete repositories."
    assert composio_calls == []
    assert 'not allowed' in model.tool_outputs(1)['call_1']


# --- one rule for every caller -------------------------------------------------------------------------

@pytest.mark.parametrize('apps, has_client, allow, builtins, expected', [
    (['GMAIL'], True, True, ['weather'], 'composio'),       # connected apps + built-ins: one Runner
    (['GMAIL'], True, False, ['weather'], 'builtin_only'),  # Telegram stranger: no owner apps
    (['GMAIL'], False, True, ['weather'], 'builtin_only'),  # Composio not configured
    ([], True, True, ['weather'], 'builtin_only'),
    (['GMAIL'], True, False, [], 'no_tools'),               # stranger, no built-in tools
    ([], True, True, [], 'no_tools'),
])
async def test_run_routes_every_caller_the_same_way(make_service, agent, apps, has_client, allow, builtins, expected):
    agent.app_connections, agent.agent_tools = apps, builtins
    service = make_service()
    service.composio_client = object() if has_client else None
    service._chat_with_composio = AsyncMock(return_value='runner')
    service._chat_without_tools = AsyncMock(return_value='no_tools')

    result = await service.run(agent, 'hi', allow_connected_apps=allow)
    assert result == ('no_tools' if expected == 'no_tools' else 'runner')
    if expected != 'no_tools':
        kwargs = service._chat_with_composio.call_args.kwargs
        assert kwargs['use_phase2_optimization'] is (expected == 'composio')   # Composio tools only when allowed
        assert [tool.name for tool in kwargs['extra_tools']] == ['get_weather']


# --- regressions --------------------------------------------------------------------------------------

@pytest.mark.parametrize('apps, message', [
    (['GMAIL'], 'summarize my inbox'),                                   # was refused: "TWITTER is not connected"
    (['GMAIL', 'SLACK', 'GOOGLEDRIVE'], "what's the weather in London"),  # was refused: "Cannot determine target platform"
    (['GMAIL', 'SLACK', 'GOOGLEDRIVE'], 'what meetings do I have tomorrow'),
])
async def test_normal_requests_reach_the_model(runner_service, agent, apps, message):
    build, _ = runner_service
    agent.app_connections = apps
    service, model = build([[say('Here you go.')]])
    assert await service.run(agent, message) == 'Here you go.'
    assert len(model.inputs) == 1


def test_retry_wraps_the_runner_call_not_the_whole_run():
    from api_agents.agents.services.agent_service import AgentService
    # functools.wraps sets __wrapped__ on decorated functions
    assert hasattr(AgentService._execute_agent_with_retry, '__wrapped__')
    assert not hasattr(AgentService.run, '__wrapped__')
