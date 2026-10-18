"""
Serializers module - Re-exports all serializers from domain-specific modules for backward compatibility.

This file maintains backward compatibility by importing and re-exporting all serializers
from their new locations in domain-specific modules.

New structure:
- authentication/serializers.py: User, registration, login, OAuth serializers
- agents/serializers.py: Agent, template, chat serializers
- tools/serializers.py: Connection, tool serializers
- workflows/serializers.py: Workflow, trigger serializers
- files/serializers.py: File attachment serializers
- messaging/serializers.py: Messaging channel serializers
- credits/serializers.py: Credit and usage log serializers
"""

# Import all serializers from domain modules
from .authentication.serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    RegistrationResponseSerializer,
    LoginRequestSerializer,
    LoginResponseSerializer,
    LogoutResponseSerializer,
    GoogleLoginRequestSerializer,
    OAuthLoginResponseSerializer,
    GitHubLoginRequestSerializer,
    EmailVerificationResendResponseSerializer,
    EmailVerificationConfirmResponseSerializer,
    TokenRefreshCookieResponseSerializer,
    PasswordResetRequestSerializer,
    PasswordResetRequestResponseSerializer,
    PasswordResetConfirmRequestSerializer,
    PasswordResetConfirmResponseSerializer,
)

from .agents.serializers import (
    FlexibleListField,
    AgentTemplateSerializer,
    AgentSerializer,
    UnifiedAgentCreateSerializer,
    ChatMessageSerializer,
    AgentChatRequestSerializer,
    AgentChatResponseSerializer,
    SuggestedPromptsRequestSerializer,
    SuggestedPromptsResponseSerializer,
)

from .tools.serializers import (
    AvailableToolSerializer,
    AvailableToolsResponseSerializer,
    AgentAvailableToolSerializer,
    AgentAvailableToolsResponseSerializer,
    ComposioConnectionSerializer,
    ConnectionCreateRequestSerializer,
    ConnectionAuthResponseSerializer,
    DisconnectResponseSerializer,
    AgentToolSerializer,
    AppConnectionDisplaySerializer,
    AgentToolsResponseSerializer,
    AddAgentToolRequestSerializer,
    AddAgentToolResponseSerializer,
    ConnectToolToAgentRequestSerializer,
    ConnectToolToAgentResponseSerializer,
)

from .workflows.serializers import (
    TriggerSerializer,
    TriggerExecutionSerializer,
    WorkflowSerializer,
    WorkflowExecutionSerializer,
)

from .files.serializers import (
    FileAttachmentSerializer,
    ChatRequestSerializer,
)

from .messaging.serializers import (
    MessagingChannelSerializer,
    ConnectTelegramBotSerializer,
    DisconnectMessagingChannelSerializer,
)

from .credits.serializers import (
    CreditBalanceSerializer,
    UsageLogSerializer,
    AddCreditsRequestSerializer,
    AddCreditsResponseSerializer,
)

# Re-export all serializers for backward compatibility
__all__ = [
    # Authentication
    'UserSerializer',
    'UserRegistrationSerializer',
    'RegistrationResponseSerializer',
    'LoginRequestSerializer',
    'LoginResponseSerializer',
    'LogoutResponseSerializer',
    'GoogleLoginRequestSerializer',
    'OAuthLoginResponseSerializer',
    'GitHubLoginRequestSerializer',
    'EmailVerificationResendResponseSerializer',
    'EmailVerificationConfirmResponseSerializer',
    'TokenRefreshCookieResponseSerializer',
    'PasswordResetRequestSerializer',
    'PasswordResetRequestResponseSerializer',
    'PasswordResetConfirmRequestSerializer',
    'PasswordResetConfirmResponseSerializer',
    # Agents
    'FlexibleListField',
    'AgentTemplateSerializer',
    'AgentSerializer',
    'UnifiedAgentCreateSerializer',
    'ChatMessageSerializer',
    'AgentChatRequestSerializer',
    'AgentChatResponseSerializer',
    'SuggestedPromptsRequestSerializer',
    'SuggestedPromptsResponseSerializer',
    # Tools
    'AvailableToolSerializer',
    'AvailableToolsResponseSerializer',
    'AgentAvailableToolSerializer',
    'AgentAvailableToolsResponseSerializer',
    'ComposioConnectionSerializer',
    'ConnectionCreateRequestSerializer',
    'ConnectionAuthResponseSerializer',
    'DisconnectResponseSerializer',
    'AgentToolSerializer',
    'AppConnectionDisplaySerializer',
    'AgentToolsResponseSerializer',
    'AddAgentToolRequestSerializer',
    'AddAgentToolResponseSerializer',
    'ConnectToolToAgentRequestSerializer',
    'ConnectToolToAgentResponseSerializer',
    # Workflows
    'TriggerSerializer',
    'TriggerExecutionSerializer',
    'WorkflowSerializer',
    'WorkflowExecutionSerializer',
    # Files
    'FileAttachmentSerializer',
    'ChatRequestSerializer',
    # Messaging
    'MessagingChannelSerializer',
    'ConnectTelegramBotSerializer',
    'DisconnectMessagingChannelSerializer',
    # Credits
    'CreditBalanceSerializer',
    'UsageLogSerializer',
    'AddCreditsRequestSerializer',
    'AddCreditsResponseSerializer',
]
