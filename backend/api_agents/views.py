"""
Views module - Re-exports all views from domain-specific modules for backward compatibility.

This file maintains backward compatibility by importing and re-exporting all views
from their new locations in domain-specific modules.

New structure:
- authentication/views.py: User registration, login, logout, password reset, email verification
- agents/views.py: Agent CRUD, chat, templates
- tools/views.py: Composio connections, tool management
- workflows/views.py: Triggers and workflows
- files/views.py: File attachments
- credits/views.py: Credit balance and usage
- messaging/views.py: Telegram/WhatsApp bot integration
- shared/utils.py: Helper functions
"""

# Import all views from domain modules

# Authentication views
from .authentication.views import (
    register,
    login,
    logout,
    current_user,
    csrf_token,
    refresh_access_cookie,
    password_reset_request,
    password_reset_confirm,
    resend_email_verification,
    resend_email_verification_public,
    email_verify_confirm,
    verify_email_with_token,
)

# Agent views
from .agents.views import (
    AgentViewSet,
    AgentTemplateViewSet,
)

# Tool/Connection views
from .tools.views import (
    ComposioConnectionViewSet,
)

# Workflow views
from .workflows.views import (
    TriggerViewSet,
    WorkflowViewSet,
)

# File views
from .files.views import (
    FileAttachmentViewSet,
)

# Credit views
from .credits.views import (
    credit_balance,
    credit_usage_history,
    add_credits,
)

# Messaging views
from .messaging.views import (
    connect_telegram_bot,
    disconnect_messaging_channel,
    get_messaging_channels,
    telegram_webhook,
)

# Shared utilities
from .shared.utils import (
    convert_image_to_base64,
)


# Re-export all views for backward compatibility
__all__ = [
    # Authentication
    'register',
    'login',
    'logout',
    'current_user',
    'csrf_token',
    'refresh_access_cookie',
    'password_reset_request',
    'password_reset_confirm',
    'resend_email_verification',
    'resend_email_verification_public',
    'email_verify_confirm',
    'verify_email_with_token',
    # Agents
    'AgentViewSet',
    'AgentTemplateViewSet',
    # Tools/Connections
    'ComposioConnectionViewSet',
    # Workflows
    'TriggerViewSet',
    'WorkflowViewSet',
    # Files
    'FileAttachmentViewSet',
    # Credits
    'credit_balance',
    'credit_usage_history',
    'add_credits',
    # Messaging
    'connect_telegram_bot',
    'disconnect_messaging_channel',
    'get_messaging_channels',
    'telegram_webhook',
    # Utilities
    'convert_image_to_base64',
]
