"""
Models module - Re-exports all models from domain-specific modules for backward compatibility.

This file maintains backward compatibility by importing and re-exporting all models
from their new locations in domain-specific modules.

New structure:
- authentication/models.py: User, UserProfile
- agents/models.py: Agent, AgentTemplate, ChatMessage
- tools/models.py: ComposioConnection
- workflows/models.py: Workflow, WorkflowExecution, Trigger, TriggerExecution
- files/models.py: FileAttachment
- messaging/models.py: MessagingChannel, MessagingSession
- credits/models.py: UsageLog
"""

# Import all models from domain modules
from .authentication.models import User, UserProfile
from .agents.models import Agent, AgentTemplate, ChatMessage
from .tools.models import ComposioConnection
from .workflows.models import Workflow, WorkflowExecution, Trigger, TriggerExecution
from .files.models import FileAttachment
from .messaging.models import MessagingChannel, MessagingSession
from .credits.models import UsageLog

# Re-export all models for backward compatibility
__all__ = [
    # Authentication
    'User',
    'UserProfile',
    # Agents
    'Agent',
    'AgentTemplate',
    'ChatMessage',
    # Tools
    'ComposioConnection',
    # Workflows
    'Workflow',
    'WorkflowExecution',
    'Trigger',
    'TriggerExecution',
    # Files
    'FileAttachment',
    # Messaging
    'MessagingChannel',
    'MessagingSession',
    # Credits
    'UsageLog',
]
