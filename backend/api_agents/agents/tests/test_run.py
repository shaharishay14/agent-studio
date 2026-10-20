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

@pytest.mark.parametrize('apps, has_client, allow, builtins, uses_apps', [
    (['GMAIL'], True, True, ['weather'], True),      # connected apps + built-ins: one Runner
    (['GMAIL'], True, False, ['weather'], False),    # Telegram stranger: no owner apps
    (['GMAIL'], False, True, ['weather'], False),    # Composio not configured
    ([], True, True, ['weather'], False),            # built-in tools only
    ([], True, True, [], False),                     # plain chat: same Runner, no tools
])
async def test_run_sends_every_agent_to_the_same_runner(make_service, agent, apps, has_client, allow, builtins, uses_apps):
    agent.app_connections, agent.agent_tools = apps, builtins
    service = make_service()
    service.composio_client = object() if has_client else None
    service._chat_with_composio = AsyncMock(return_value='runner')

    assert await service.run(agent, 'hi', allow_connected_apps=allow) == 'runner'
    kwargs = service._chat_with_composio.call_args.kwargs
    assert kwargs['use_phase2_optimization'] is uses_apps           # Composio tools only when allowed
    assert [tool.name for tool in kwargs['extra_tools']] == (['get_weather'] if builtins else [])


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


# --- honest failures (fix #6 step 5) -------------------------------------------------------------------

async def test_failure_after_an_email_says_what_was_already_done(runner_service, agent):
    build, composio_calls = runner_service
    agent.unattended_write_tools = ['GMAIL_SEND_EMAIL']               # a workflow: nobody to approve
    service, model = build([
        [call('1', 'GMAIL_SEND_EMAIL', {'recipient_email': 'owner@me.com', 'body': 'report'})],
        ConnectionError('Slack step blew up'),
    ])
    answer = await service.run(agent, 'Email me the report, then post it to Slack')

    assert composio_calls == [('GMAIL_SEND_EMAIL', {'recipient_email': 'owner@me.com', 'body': 'report'})]
    assert 'already done' in answer and 'Gmail · Send email (to owner@me.com)' in answer
    assert 'Slack step blew up' not in answer                          # internal details stay in the logs
    assert service.openai_client.calls == []                           # no second, tool-less model answered


async def test_timeout_before_anything_happened_says_nothing_changed(runner_service, agent):
    build, _ = runner_service
    service, model = build([TimeoutError()])
    answer = await service.run(agent, 'summarize my inbox')
    assert answer.startswith('This took too long') and 'Nothing was changed' in answer
    assert service.openai_client.calls == []


def test_failure_message_lists_only_actions_that_changed_something():
    from api_agents.agents.services.agent_service import honest_failure_message
    from api_agents.agents.services.tool_policy import describe_action
    assert describe_action('GMAIL_SEND_EMAIL', {'recipient_email': 'Dana@co.com'}) == 'Gmail · Send email (to dana@co.com)'
    assert describe_action('get_weather', {'location': 'Paris'}) == 'Get weather'
    assert 'Nothing was changed' in honest_failure_message([])
