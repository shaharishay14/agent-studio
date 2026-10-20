"""
Fixtures for the agent safety tests: real Django models and a real Agents SDK,
with the OpenAI client and outside APIs replaced by fakes.

Run from backend/:  pip install -r requirements-dev.txt && pytest
"""

import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from agents import set_tracing_disabled
from agents.items import ModelResponse
from agents.models.interface import Model
from agents.usage import Usage
from openai.types.responses import (Response, ResponseCompletedEvent, ResponseFunctionToolCall, ResponseOutputMessage,
                                    ResponseOutputText, ResponseTextDeltaEvent)

from api_agents.models import Agent, User
from api_agents.agents.services import tool_policy
from api_agents.agents.services import agent_service as agent_service_module
from api_agents.agents.services.agent_service import AgentService

set_tracing_disabled(True)


class FakeOpenAI:
    """Stands in for AsyncOpenAI: returns scripted replies and records every request."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    async def _create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(choices=[SimpleNamespace(message=self.replies.pop(0))])

    def tool_messages(self, call_index):
        """Tool results the model saw in a given request."""
        return [m for m in self.calls[call_index]['messages'] if isinstance(m, dict) and m.get('role') == 'tool']


def reply(content=None, tool_calls=None):
    return SimpleNamespace(content=content, tool_calls=tool_calls)


def tool_call(call_id, name, arguments):
    return SimpleNamespace(id=call_id, function=SimpleNamespace(name=name, arguments=json.dumps(arguments)))


class ScriptedModel(Model):
    """Stands in for the LLM inside the real Agents SDK Runner: plays back one list of output items
    per turn (or raises, if the turn is an exception), and records the input and tool names the
    Runner sent each time. Streams text in small pieces, like a real model."""

    def __init__(self, turns):
        self.turns = list(turns)
        self.inputs = []
        self.tool_names = []

    async def get_response(self, system_instructions, input, model_settings, tools, output_schema, handoffs,
                           tracing, **kwargs):
        self.inputs.append(input)
        self.tool_names.append(sorted(tool.name for tool in tools))
        turn = self.turns.pop(0)
        if isinstance(turn, Exception):
            raise turn
        return ModelResponse(output=turn, usage=Usage(), response_id=None)

    async def stream_response(self, system_instructions, input, model_settings, tools, output_schema, handoffs,
                              tracing, **kwargs):
        response = await self.get_response(system_instructions, input, model_settings, tools, output_schema,
                                           handoffs, tracing)
        sequence = 0
        for item in response.output:
            if isinstance(item, ResponseOutputMessage):
                text = item.content[0].text
                for start in range(0, len(text), 4):
                    yield ResponseTextDeltaEvent(content_index=0, delta=text[start:start + 4], item_id=item.id,
                                                 logprobs=[], output_index=0, sequence_number=sequence,
                                                 type='response.output_text.delta')
                    sequence += 1
        yield ResponseCompletedEvent(
            response=Response(id='resp', created_at=0, model='scripted', object='response', output=response.output,
                              parallel_tool_calls=False, tool_choice='auto', tools=[]),
            sequence_number=sequence, type='response.completed')

    def tool_outputs(self, turn):
        """Tool results the Runner sent to the model at the start of a turn, by call id."""
        return {item['call_id']: item['output'] for item in self.inputs[turn]
                if isinstance(item, dict) and item.get('type') == 'function_call_output'}


def call(call_id, name, arguments):
    """A tool call made by the scripted model."""
    return ResponseFunctionToolCall(id=f'fc_{call_id}', call_id=f'call_{call_id}', name=name,
                                    arguments=json.dumps(arguments), type='function_call', status='completed')


def say(text):
    """A final text answer from the scripted model."""
    return ResponseOutputMessage(id='msg_1', role='assistant', status='completed', type='message',
                                 content=[ResponseOutputText(text=text, type='output_text', annotations=[])])


@pytest.fixture
def scripted_model(monkeypatch):
    """Makes the Runner path use a ScriptedModel with the given turns, and returns it."""
    def use(turns):
        model = ScriptedModel(turns)
        strategy = SimpleNamespace(select_model=lambda **kw: model, get_selection_reasoning=lambda **kw: '',
                                   _calculate_complexity_score=lambda *a: 0)
        monkeypatch.setattr(agent_service_module, 'get_model_selection_strategy', lambda: strategy)
        return model
    return use


@pytest.fixture
def owner(db):
    return User.objects.create_user(username='owner', email='owner@me.com', password='pw')


@pytest.fixture
def agent(owner):
    return Agent.objects.create(user=owner, name='Test agent', prompt='You help the owner.', agent_tools=['weather', 'calculator'])


@pytest.fixture
def make_service(owner):
    """AgentService for the owner, without real API keys or clients."""
    def make(replies=(), tool_fn=None):
        with patch('api_agents.agents.services.agent_service.validate_api_keys'), \
             patch.object(AgentService, '_initialize_clients'):
            service = AgentService(owner)
        service.openai_client = FakeOpenAI(replies)
        if tool_fn:
            service.agent_tools_service.execute_tool = tool_fn
        return service
    return make


@pytest.fixture
def fast_approvals(monkeypatch):
    """Approvals poll quickly and time out fast, so tests don't wait 60 seconds."""
    monkeypatch.setattr(tool_policy, 'APPROVAL_POLL_SECONDS', 0.01)
    monkeypatch.setattr(tool_policy, 'APPROVAL_TIMEOUT_SECONDS', 0.2)


@pytest.fixture
def events():
    """A recording callback plus the list it records into."""
    recorded = []

    async def callback(event_type, data):
        recorded.append((event_type, data))

    callback.recorded = recorded
    return callback
