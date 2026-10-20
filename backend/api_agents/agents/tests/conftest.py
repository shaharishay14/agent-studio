"""
Fixtures for the agent safety tests: real Django models and a real Agents SDK,
with the OpenAI client and outside APIs replaced by fakes.

Run from backend/:  pip install -r requirements-dev.txt && pytest
"""

import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from api_agents.models import Agent, User
from api_agents.agents.services import tool_policy
from api_agents.agents.services.agent_service import AgentService


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
