"""
Agent loop and context tests (fixes #1, #2, and #6 step 3): multi-step tool use, error recovery,
the step limit with an honest final answer, and the tool result cap, all through the real Agents SDK
Runner with a scripted model; plus chat history compaction.
"""

import json

import pytest
from django.core.cache import cache

from api_agents.agents.services import agent_service
from .conftest import call, reply, say

pytestmark = pytest.mark.django_db(transaction=True)


def ok(data):
    return {'success': True, 'data': data}


async def test_multi_step_task_runs_tools_until_the_model_answers(make_service, agent, scripted_model, events):
    service = make_service(tool_fn=lambda name, **args: ok({'tool': name, **args}))
    model = scripted_model([
        [call('1', 'get_weather', {'location': 'Paris'})],
        [call('2', 'calculate', {'expression': '18 * 9 / 5 + 32'})],
        [say('It is 64.4F in Paris')],
    ])
    assert await service.run(agent, 'Paris weather in Fahrenheit?', callback=events) == 'It is 64.4F in Paris'
    # the answer was streamed to the UI in pieces, in order
    deltas = [data for event, data in events.recorded if event == 'content_delta']
    assert len(deltas) > 1 and ''.join(d['content'] for d in deltas) == 'It is 64.4F in Paris'
    assert [d['index'] for d in deltas] == list(range(len(deltas)))
    assert model.tool_names[0] == ['calculate', 'get_weather']            # built-in only: no Composio tools
    assert 'Paris' in model.tool_outputs(1)['call_1']                      # step 2 saw step 1's result
    assert '18 * 9' in model.tool_outputs(2)['call_2']


async def test_tool_crash_goes_back_to_the_model_as_an_error(make_service, agent, scripted_model):
    def flaky(name, **args):
        if args.get('location') == 'Atlantis':
            raise ValueError('Unknown place Atlantis')
        return ok({'location': args.get('location')})

    service = make_service(tool_fn=flaky)
    model = scripted_model([
        [call('1', 'get_weather', {'location': 'Atlantis'})],
        [call('2', 'get_weather', {'location': 'Athens'})],
        [say('Athens is sunny')],
    ])
    assert await service.run(agent, 'weather in Atlantis?') == 'Athens is sunny'
    assert 'Unknown place Atlantis' in model.tool_outputs(1)['call_1']


async def test_step_limit_forces_an_honest_final_answer(make_service, agent, scripted_model):
    steps = agent_service.MAX_AGENT_STEPS
    service = make_service(tool_fn=lambda name, **args: ok(2))
    model = scripted_model([[call(str(i), 'calculate', {'expression': '1+1'})] for i in range(steps)]
                           + [[say('I could not finish: still calculating')]])

    assert await service.run(agent, 'loop forever') == 'I could not finish: still calculating'
    assert len(model.inputs) == steps + 1
    assert model.tool_names[-1] == []                                       # the last call has no tools
    final_input = model.inputs[-1]
    assert final_input[-1] == {'role': 'system', 'content': agent_service.STEP_LIMIT_INSTRUCTION}
    # ...and it still has everything the agent did, so it can't pretend
    assert sum(1 for item in final_input if isinstance(item, dict) and item.get('type') == 'function_call_output') == steps


async def test_big_tool_result_is_capped_and_marked(make_service, agent, scripted_model):
    agent.agent_tools = ['web_search']
    service = make_service(tool_fn=lambda name, **args: ok('x' * 100_000))
    model = scripted_model([[call('1', 'web_search', {'query': 'x'})], [say('done')]])

    await service.run(agent, 'search')
    content = model.tool_outputs(1)['call_1']
    assert 'TRUNCATED' in content and len(content) < agent_service.MAX_TOOL_RESULT_CHARS + 600
    assert content.startswith('<untrusted_tool_output tool="web_search">')


async def test_plain_chat_agent_streams_through_the_same_runner(make_service, agent, scripted_model, events):
    agent.agent_tools = []
    service = make_service()
    model = scripted_model([[say('Hello! How can I help?')]])
    assert await service.run(agent, 'hi', callback=events) == 'Hello! How can I help?'
    assert model.tool_names == [[]]
    assert ''.join(d['content'] for e, d in events.recorded if e == 'content_delta') == 'Hello! How can I help?'


async def test_failure_before_anything_happened_is_retried(make_service, agent, scripted_model):
    service = make_service(tool_fn=lambda name, **args: ok(1))
    model = scripted_model([ConnectionError('blip'), [say('ok after retry')]])
    assert await service.run(agent, 'hi') == 'ok after retry'
    assert len(model.inputs) == 2


async def test_failure_after_a_tool_ran_is_not_retried(make_service, agent, scripted_model):
    ran = []
    service = make_service(tool_fn=lambda name, **args: ran.append(name) or ok(1))
    model = scripted_model([[call('1', 'get_weather', {'location': 'Paris'})], ConnectionError('blip'),
                            [call('2', 'get_weather', {'location': 'Paris'})], [say('ran twice')]])
    with pytest.raises(agent_service.RunAlreadyStartedError):
        await service._run_with_step_limit(agent_service.Runner(), _sdk_agent(service, agent), [{'role': 'user', 'content': 'hi'}])
    assert ran == ['get_weather']                                       # the tool ran once, not again


def _sdk_agent(service, agent):
    """The SDK agent the Runner path builds, with the model taken from the scripted model fixture."""
    from api_agents.agents.services.tool_policy import PermissionGate, guard_function_tools
    model = agent_service.get_model_selection_strategy().select_model()
    tools = guard_function_tools(service._builtin_function_tools(agent), PermissionGate(service.user, agent))
    return agent_service.ComposioAgent(name='t', instructions='', tools=tools, model=model)


# --- compaction (fix #2) ------------------------------------------------------------------------

def older(count, start=0):
    return [{'role': 'user', 'content': f'm{i}', 'created_at': i} for i in range(start, start + count)]


async def test_compaction_summarizes_in_batches_and_rolls_forward(make_service, agent):
    cache.clear()
    service = make_service(replies=[reply(content='SUM1'), reply(content='SUM2')])

    few = await service.compact_chat_history(agent.id, older(5))
    assert [m['content'] for m in few] == [f'm{i}' for i in range(5)] and not service.openai_client.calls

    first = await service.compact_chat_history(agent.id, older(12))
    assert len(first) == 1 and 'SUM1' in first[0]['content'] and first[0]['role'] == 'user'

    later = await service.compact_chat_history(agent.id, older(14))
    assert 'SUM1' in later[0]['content'] and [m['content'] for m in later[1:]] == ['m12', 'm13']

    rolled = await service.compact_chat_history(agent.id, older(22))
    assert 'SUM1' in service.openai_client.calls[1]['messages'][0]['content']   # old summary fed into the new one
    assert len(rolled) == 1 and 'SUM2' in rolled[0]['content']


async def test_compaction_failure_keeps_messages(make_service, agent):
    cache.clear()
    service = make_service(replies=[])                 # no scripted reply: the summary call fails
    result = await service.compact_chat_history(agent.id, older(10))
    assert len(result) == 10


def test_sanitize_for_prompt_keeps_text_as_written():
    text = 'Hi! Email Dana:\n"Meeting moved, don\'t be late"\x00'
    assert agent_service.sanitize_for_prompt(text) == text.replace('\x00', '')
    assert len(agent_service.sanitize_for_prompt('x' * 20_000)) == 10_000
