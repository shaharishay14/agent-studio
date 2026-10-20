"""
HTTP-level tests: the approval endpoint and serializer (fix #4), and the Telegram webhook's
secret check, owner linking and stranger mode (fix #5).
"""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

from api_agents.models import ChatMessage, MessagingChannel, MessagingSession, ToolApproval, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api(owner):
    client = APIClient()
    client.force_authenticate(owner)
    return client


# --- approve / deny endpoint ----------------------------------------------------------------------

def approval_url(agent, approval):
    return f'/api/agents/{agent.id}/approvals/{approval.id}/'


def test_owner_decides_a_pending_approval_once(api, owner, agent):
    approval = ToolApproval.objects.create(agent=agent, user=owner, tool_name='GMAIL_SEND_EMAIL')

    assert api.post(approval_url(agent, approval), {'decision': 'approve'}, format='json').status_code == 200
    approval.refresh_from_db()
    assert approval.status == ToolApproval.STATUS_APPROVED and approval.decided_at

    # second click / replay / late click: nothing changes
    assert api.post(approval_url(agent, approval), {'decision': 'deny'}, format='json').status_code == 409
    approval.refresh_from_db()
    assert approval.status == ToolApproval.STATUS_APPROVED


def test_decision_must_be_approve_or_deny(api, owner, agent):
    approval = ToolApproval.objects.create(agent=agent, user=owner, tool_name='GMAIL_SEND_EMAIL')
    assert api.post(approval_url(agent, approval), {'decision': 'maybe'}, format='json').status_code == 400


def test_other_users_cannot_decide(owner, agent):
    approval = ToolApproval.objects.create(agent=agent, user=owner, tool_name='GMAIL_SEND_EMAIL')
    stranger = APIClient()
    stranger.force_authenticate(User.objects.create_user(username='mallory', password='pw'))

    assert stranger.post(approval_url(agent, approval), {'decision': 'approve'}, format='json').status_code == 404
    approval.refresh_from_db()
    assert approval.status == ToolApproval.STATUS_PENDING


# --- pre-approval list validation ---------------------------------------------------------------

def test_only_write_actions_can_be_preapproved(api, agent):
    url = f'/api/agents/{agent.id}/'
    rejected = api.patch(url, {'unattended_write_tools': ['GMAIL_SEND_EMAIL', 'GITHUB_DELETE_A_REPOSITORY', 'GMAIL_FETCH_EMAILS']},
                         format='json')
    assert rejected.status_code == 400
    assert 'GITHUB_DELETE_A_REPOSITORY' in str(rejected.data) and 'GMAIL_FETCH_EMAILS' in str(rejected.data)

    accepted = api.patch(url, {'unattended_write_tools': ['GMAIL_SEND_EMAIL']}, format='json')
    assert accepted.status_code == 200
    agent.refresh_from_db()
    assert agent.unattended_write_tools == ['GMAIL_SEND_EMAIL']


# --- Telegram webhook -----------------------------------------------------------------------------

class FakeAgentService:
    """Records how the webhook asked to run the agent."""
    calls = []

    def __init__(self, user):
        pass

    async def run(self, agent_model, message, chat_history=None, callback=None, file_attachments=None,
                  allow_connected_apps=True):
        FakeAgentService.calls.append({'allow_connected_apps': allow_connected_apps, 'chat_history': chat_history})
        return '**reply**'

    def _clean_markdown_formatting(self, text):
        return text.replace('**', '')


@pytest.fixture
def telegram(agent):
    agent.app_connections = ['GMAIL']
    agent.save()
    FakeAgentService.calls = []
    channel = MessagingChannel.objects.create(agent=agent, platform='telegram', bot_token='123:abc',
                                              webhook_secret='s3cret', owner_link_code='ABCD1234')
    with patch('api_agents.messaging.views.AgentService', FakeAgentService), \
         patch('api_agents.messaging.telegram_utils.send_message') as send, \
         patch('api_agents.messaging.telegram_utils.send_typing_action'), \
         patch('api_agents.credits.deduct_credits_for_message'):
        yield channel, send


def post_update(agent, text, from_id, secret='s3cret'):
    update = {'message': {'chat': {'id': from_id}, 'from': {'id': from_id, 'username': f'u{from_id}'}, 'text': text}}
    return APIClient().post(f'/api/messaging/telegram/webhook/{agent.id}/', update, format='json',
                            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=secret)


def test_webhook_rejects_requests_without_the_secret(agent, telegram):
    assert post_update(agent, 'hi', 1, secret='wrong').status_code == 403
    assert FakeAgentService.calls == []


def test_owner_links_with_the_code_and_gets_connected_apps(agent, telegram):
    channel, send = telegram
    post_update(agent, '/link ABCD1234', from_id=42)
    channel.refresh_from_db()
    assert channel.owner_external_user_id == '42' and channel.owner_link_code == ''
    assert 'Linked' in send.call_args.args[2]

    post_update(agent, 'summarize my inbox', from_id=42)
    assert FakeAgentService.calls[-1]['allow_connected_apps'] is True    # owner: connected apps allowed
    assert send.call_args.args[2] == 'reply'                             # markdown stripped for Telegram
    assert ChatMessage.objects.filter(agent=agent).count() == 2          # saved to the owner's history


def test_stranger_gets_no_owner_data(agent, telegram):
    ChatMessage.objects.create(agent=agent, role='user', content='my private web chat')
    post_update(agent, 'what is in the inbox?', from_id=99)

    call = FakeAgentService.calls[-1]
    assert call['allow_connected_apps'] is False                         # no owner apps
    assert 'my private web chat' not in str(call['chat_history'])        # no owner history
    assert ChatMessage.objects.filter(agent=agent).count() == 1          # stranger not written into it
    session = MessagingSession.objects.get(external_user_id='99')
    assert [m['role'] for m in session.recent_messages] == ['user', 'assistant']


def test_link_code_only_works_once(agent, telegram):
    post_update(agent, '/link ABCD1234', from_id=42)
    post_update(agent, '/link ABCD1234', from_id=99)                     # someone replays the code
    channel, _ = telegram
    channel.refresh_from_db()
    assert channel.owner_external_user_id == '42'
