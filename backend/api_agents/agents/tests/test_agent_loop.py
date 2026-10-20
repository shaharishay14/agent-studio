"""
Agent loop and context tests (fixes #1 and #2): multi-step tool use, error recovery, the step limit,
the tool result cap, the gate inside the loop, and chat history compaction.
"""

import pytest
from django.core.cache import cache

from api_agents.agents.services import agent_service
from .conftest import reply, tool_call

pytestmark = pytest.mark.django_db(transaction=True)


def ok(data):
    return {'success': True, 'data': data}


async def test_multi_step_task_runs_tools_until_the_model_answers(make_service, agent, events):
    service = make_service(
        replies=[reply(tool_calls=[tool_call('1', 'get_stock_data', {'ticker': 'AAPL'})]),
                 reply(tool_calls=[tool_call('2', 'calculate', {'expression': '30 * 200'})]),
                 reply(content='30 shares cost $6000')],
        tool_fn=lambda name, **args: ok({'tool': name}),
    )
    answer = await service._chat_with_agent_tools(agent, 'price of 30 AAPL shares?', callback=events)

    assert answer == '30 shares cost $6000'
    assert len(service.openai_client.calls) == 3
    assert all('tools' in call for call in service.openai_client.calls)          # tools on every step
    streamed = ''.join(data['content'] for event, data in events.recorded if event == 'content_delta')
    assert streamed == answer


async def test_tool_crash_goes_back_to_the_model_as_an_error(make_service, agent):
    def flaky(name, **args):
        if args.get('ticker') == 'APPLE':
            raise ValueError('Unknown ticker APPLE')
        return ok(200)

    service = make_service(
        replies=[reply(tool_calls=[tool_call('1', 'get_stock_data', {'ticker': 'APPLE'})]),
                 reply(tool_calls=[tool_call('2', 'get_stock_data', {'ticker': 'AAPL'})]),
                 reply(content='AAPL is 200')],
        tool_fn=flaky,
    )
    assert await service._chat_with_agent_tools(agent, 'apple stock?') == 'AAPL is 200'
    assert 'Unknown ticker' in service.openai_client.tool_messages(1)[0]['content']


async def test_step_limit_forces_a_final_answer_without_tools(make_service, agent):
    steps = agent_service.MAX_AGENT_STEPS
    service = make_service(
        replies=[reply(tool_calls=[tool_call(str(i), 'calculate', {'expression': '1+1'})]) for i in range(steps)]
                + [reply(content='partial answer')],
        tool_fn=lambda name, **args: ok(2),
    )
    assert await service._chat_with_agent_tools(agent, 'loop forever') == 'partial answer'
    assert len(service.openai_client.calls) == steps + 1
    assert 'tools' not in service.openai_client.calls[-1]


async def test_big_tool_result_is_capped_and_marked(make_service, agent):
    service = make_service(
        replies=[reply(tool_calls=[tool_call('1', 'web_search', {'query': 'x'})]), reply(content='done')],
        tool_fn=lambda name, **args: ok('x' * 100_000),
    )
    await service._chat_with_agent_tools(agent, 'search')
    content = service.openai_client.tool_messages(1)[0]['content']
    assert 'TRUNCATED' in content and len(content) < agent_service.MAX_TOOL_RESULT_CHARS + 600
    assert content.startswith('<untrusted_tool_output tool="web_search">')


async def test_unknown_tool_is_denied_by_the_gate_and_never_runs(make_service, agent):
    executed = []
    service = make_service(
        replies=[reply(tool_calls=[tool_call('1', 'send_email', {'to': 'x'})]), reply(content="I can't do that")],
        tool_fn=lambda name, **args: executed.append(name) or ok(1),
    )
    assert await service._chat_with_agent_tools(agent, 'email someone') == "I can't do that"
    assert executed == [] and 'not allowed' in service.openai_client.tool_messages(1)[0]['content']


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
