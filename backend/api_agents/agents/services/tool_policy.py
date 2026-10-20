"""
Tool Permission Policy
----------------------
Decides what the agent may do with each tool, no matter what the model (or text it read) asks for:
- READ:  runs freely
- WRITE: runs only after the user approves it in the chat UI
- DENY:  never runs (destructive actions, and any tool we don't recognize)

Denials are returned to the model as tool errors, so it can explain to the user instead of failing.
"""

import asyncio
import dataclasses
import json
import logging
import time
from enum import Enum
from typing import Any, Dict, List, Optional

from asgiref.sync import sync_to_async
from django.utils import timezone

logger = logging.getLogger(__name__)


class ToolAccess(str, Enum):
    READ = 'read'
    WRITE = 'write'
    DENY = 'deny'


# How long a write action waits for the user's decision. Must stay well under
# gunicorn's 120s worker timeout, since the chat request is open while we wait.
APPROVAL_TIMEOUT_SECONDS = 60
APPROVAL_POLL_SECONDS = 1

# Built-in agent tools (agent_tools_service.py) are all read-only
BUILTIN_TOOL_ACCESS = {
    'get_weather': ToolAccess.READ,
    'calculate': ToolAccess.READ,
    'get_stock_data': ToolAccess.READ,
    'search_youtube': ToolAccess.READ,
    'web_search': ToolAccess.READ,
    'read_website': ToolAccess.READ,
}

# Explicit decisions for Composio slugs the verb rules get wrong, or that need a stricter rule
TOOL_ACCESS_OVERRIDES = {
    'TWITTER_FULL_ARCHIVE_SEARCH': ToolAccess.READ,           # "ARCHIVE" is a noun here
    'TWITTER_BOOKMARKS_BY_USER': ToolAccess.READ,
    'TWITTER_FOLLOWERS_BY_USER_ID': ToolAccess.READ,
    'TWITTER_FOLLOWING_BY_USER_ID': ToolAccess.READ,
    'TWITTER_USER_HOME_TIMELINE_BY_USER_ID': ToolAccess.READ,
    'GOOGLECALENDAR_EVENTS_INSTANCES': ToolAccess.READ,
    'STRIPE_CONFIRM_PAYMENT_INTENT': ToolAccess.DENY,          # moves money
    'CANVA_EXCHANGE_OAUTH20_ACCESS_OR_REFRESH_TOKEN': ToolAccess.DENY,  # handles credentials
}

# A slug containing any of these anywhere is denied (destructive or hard to undo)
DENY_VERBS = {
    'DELETE', 'DELETES', 'REMOVE', 'REMOVES', 'TRASH', 'DESTROY', 'PURGE', 'CLEAR', 'REVOKE',
    'WIPE', 'ERASE', 'UNINSTALL', 'DEACTIVATE', 'CANCEL', 'EMPTY', 'BAN', 'KICK',
}

# Otherwise the first verb in the slug decides
WRITE_VERBS = {
    'SEND', 'SENDS', 'POST', 'CREATE', 'CREATES', 'UPDATE', 'UPDATES', 'EDIT', 'REPLY', 'FORWARD',
    'SHARE', 'INVITE', 'UPLOAD', 'MOVE', 'ADD', 'ADDS', 'SET', 'PATCH', 'PUT', 'INSERT', 'APPEND',
    'REPLACE', 'SCHEDULE', 'SCHEDULES', 'PUBLISH', 'COMMENT', 'STAR', 'UNSTAR', 'LABEL', 'MODIFY',
    'ARCHIVE', 'UNARCHIVE', 'MERGE', 'UNMERGE', 'CLOSE', 'OPEN', 'ASSIGN', 'UNASSIGN', 'RENAME',
    'COPY', 'DUPLICATE', 'FORK', 'MARK', 'FOLLOW', 'UNFOLLOW', 'LIKE', 'UNLIKE', 'PIN', 'PINS',
    'UNPIN', 'ENABLE', 'DISABLE', 'TOGGLE', 'START', 'STOP', 'END', 'CHANGE', 'CONFIGURE',
    'CUSTOMIZE', 'HIDE', 'UNHIDE', 'EXECUTE', 'RUN', 'TRIGGER', 'INITIATE', 'INITIATES', 'APPROVE',
    'SUBMIT', 'CONFIRM', 'ENCRYPT', 'GENERATE', 'EXPORT', 'IMPORT', 'BATCH', 'RESTORE', 'UNTRASH',
    'REVERSE', 'RESPOND', 'REACT', 'TRANSFER', 'SYNC', 'BLOCK', 'UNBLOCK', 'JOIN', 'LEAVE', 'MUTE',
    'UNMUTE', 'LOCK', 'UNLOCK', 'REQUEST', 'UPSERT', 'RESOLVE', 'REOPEN', 'CONVERT', 'TAG', 'UNTAG',
    'SAVE', 'RETWEET', 'QUOTE', 'REPOST', 'SUBSCRIBE', 'UNSUBSCRIBE', 'WATCH', 'UNWATCH', 'DISMISS',
    'ACCEPT', 'DECLINE', 'REJECT', 'APPLY', 'PROCESS', 'RESET', 'EMBED', 'MAKE', 'REORDER', 'SORT',
    'FORMAT', 'WRITE', 'DRAFT', 'REGISTER', 'REGISTERS', 'TRACK',
}
READ_VERBS = {
    'GET', 'LIST', 'LISTS', 'FETCH', 'SEARCH', 'FIND', 'READ', 'RETRIEVE', 'QUERY', 'VIEW',
    'DESCRIBE', 'COUNT', 'CHECK', 'LOOKUP', 'DOWNLOAD', 'EXTRACT', 'PREVIEW', 'VALIDATE', 'LOOK',
    'SHOW', 'BROWSE', 'LOAD', 'COMPARE', 'PING', 'PARSE', 'DETECT', 'DISCOVER', 'RENDER', 'AGGREGATE',
}


def classify_tool(tool_name: str) -> ToolAccess:
    """
    Returns the access level for a tool. Order: explicit lists, then destructive verbs,
    then the first known verb. Anything unrecognized is denied (default deny).
    """
    if tool_name in BUILTIN_TOOL_ACCESS:
        return BUILTIN_TOOL_ACCESS[tool_name]
    if tool_name in TOOL_ACCESS_OVERRIDES:
        return TOOL_ACCESS_OVERRIDES[tool_name]

    # Composio slugs look like APP_VERB_OBJECT, e.g. GMAIL_SEND_EMAIL. Skip the app name.
    tokens = tool_name.upper().split('_')[1:]

    if DENY_VERBS.intersection(tokens):
        return ToolAccess.DENY
    for token in tokens:
        if token in WRITE_VERBS:
            return ToolAccess.WRITE
        if token in READ_VERBS:
            return ToolAccess.READ
    return ToolAccess.DENY


def denial(message: str) -> str:
    """Formats a denial as a tool result the model can read and explain to the user."""
    return json.dumps({'error': message})


class PermissionGate:
    """
    Checks every tool call against the policy before it runs.
    One gate per chat turn: it knows the user, the agent and how to reach the UI.
    """

    def __init__(self, user, agent_model, callback=None):
        self.user = user
        self.agent_model = agent_model
        self.callback = callback  # None means nobody is watching (workflows, messaging channels)

    async def check(self, tool_name: str, arguments: Dict[str, Any]) -> Optional[str]:
        """
        Returns None if the tool may run, or a denial message to give the model instead.
        """
        access = classify_tool(tool_name)
        logger.info(f"🛡️ Policy: {tool_name} -> {access.value}")

        if access == ToolAccess.READ:
            return None

        if access == ToolAccess.DENY:
            return denial(
                f'{tool_name} is not allowed: destructive or unrecognized actions are blocked by policy. '
                'Do not retry or look for a workaround. Tell the user you cannot do this, and suggest they do it themselves.'
            )

        if self.callback is None:
            if tool_name in (getattr(self.agent_model, 'unattended_write_tools', None) or []):
                await self._record_preapproved(tool_name, arguments)
                return None
            return denial(
                f'{tool_name} changes data and needs the user\'s approval, but no one is available to approve it here. '
                'Do not retry. Tell the user to pre-approve this action for the agent, or ask for it in the chat.'
            )

        return await self._ask_user(tool_name, arguments)

    async def _record_preapproved(self, tool_name: str, arguments: Dict[str, Any]) -> None:
        """Logs an unattended write in the same table as live approvals, so there's one audit trail."""
        from ..models import ToolApproval

        logger.info(f"✅ {tool_name} pre-approved for unattended runs")
        await sync_to_async(ToolApproval.objects.create)(
            agent=self.agent_model,
            user=self.user,
            tool_name=tool_name,
            arguments=arguments,
            status=ToolApproval.STATUS_PREAPPROVED,
            decided_at=timezone.now(),
        )

    async def _ask_user(self, tool_name: str, arguments: Dict[str, Any]) -> Optional[str]:
        """Saves a pending approval, shows it in the UI, and waits for the user's decision."""
        from ..models import ToolApproval

        approval = await sync_to_async(ToolApproval.objects.create)(
            agent=self.agent_model,
            user=self.user,
            tool_name=tool_name,
            arguments=arguments,
        )

        await self.callback('approval_required', {
            'approval_id': str(approval.id),
            'tool': tool_name,
            'arguments': arguments,
            'timeout_seconds': APPROVAL_TIMEOUT_SECONDS,
        })

        # Poll the DB, not memory: the approve click may be handled by a different worker process
        deadline = time.monotonic() + APPROVAL_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            await asyncio.sleep(APPROVAL_POLL_SECONDS)
            await sync_to_async(approval.refresh_from_db)(fields=['status'])
            if approval.status != ToolApproval.STATUS_PENDING:
                break
            await self.callback('heartbeat', {'message': 'Waiting for approval...', 'timestamp': time.time()})

        if approval.status == ToolApproval.STATUS_APPROVED:
            logger.info(f"✅ User approved {tool_name}")
            return None

        if approval.status == ToolApproval.STATUS_PENDING:
            # Mark expired only if the user didn't decide at the last moment
            await sync_to_async(
                ToolApproval.objects.filter(id=approval.id, status=ToolApproval.STATUS_PENDING).update
            )(status=ToolApproval.STATUS_EXPIRED, decided_at=timezone.now())
            await self.callback('approval_resolved', {'approval_id': str(approval.id), 'status': ToolApproval.STATUS_EXPIRED})
            return denial(
                f'The user did not approve {tool_name} within {APPROVAL_TIMEOUT_SECONDS} seconds, so it was not run. '
                'Do not retry. Tell the user the action is waiting for their approval and they can ask again.'
            )

        logger.info(f"🚫 User denied {tool_name}")
        return denial(
            f'The user declined {tool_name}, so it was not run. '
            'Do not retry it. Ask the user what they would like to change.'
        )


def guard_function_tools(tools: List[Any], gate: PermissionGate) -> List[Any]:
    """
    Wraps each Agents SDK FunctionTool so the gate runs before the real tool.
    Tools we can't wrap are dropped: a tool without a permission check must not reach the model.
    """
    from agents import FunctionTool
    from .agent_service import parse_json_safely

    guarded = []
    for tool in tools:
        if not isinstance(tool, FunctionTool):
            logger.warning(f"Dropping tool {getattr(tool, 'name', tool)!r}: permissions can't be enforced on it")
            continue

        def make_invoke(original_tool):
            async def invoke(ctx, input_json: str):
                arguments = parse_json_safely(input_json, default={})
                blocked = await gate.check(original_tool.name, arguments)
                if blocked:
                    return blocked
                return await original_tool.on_invoke_tool(ctx, input_json)
            return invoke

        guarded.append(dataclasses.replace(tool, on_invoke_tool=make_invoke(tool)))
    return guarded
