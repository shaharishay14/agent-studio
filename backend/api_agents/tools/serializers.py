from rest_framework import serializers
from ..tools import models as tool_models


class AvailableToolSerializer(serializers.Serializer):
    """Serializer for individual tool in available tools response"""
    tool_name = serializers.CharField(help_text="Backend tool identifier (e.g., 'GMAIL', 'SLACK')")
    name = serializers.CharField(help_text="Display name of the tool (e.g., 'Gmail', 'Slack')")
    description = serializers.CharField(help_text="Description of what the tool does")
    category = serializers.CharField(help_text="Category classification (e.g., 'communication', 'productivity')")
    is_active = serializers.BooleanField(help_text="True if user is connected to this tool, false otherwise")
    connection_id = serializers.IntegerField(allow_null=True, help_text="Database ID of the connection. Null if not connected. Use this ID to delete the connection.")


class AvailableToolsResponseSerializer(serializers.Serializer):
    """Serializer for available tools endpoint response"""
    tools = serializers.ListField(
        child=AvailableToolSerializer(),
        help_text="List of all available tools with metadata and connection status"
    )
    count = serializers.IntegerField(
        help_text="Total number of available tools"
    )


class AgentAvailableToolSerializer(serializers.Serializer):
    """Serializer for individual tool in agent available tools response"""
    tool_name = serializers.CharField(help_text="Backend tool identifier (e.g., 'GMAIL', 'SLACK')")
    name = serializers.CharField(help_text="Display name of the tool (e.g., 'Gmail', 'Slack')")
    description = serializers.CharField(help_text="Description of what the tool does")
    category = serializers.CharField(help_text="Category classification (e.g., 'communication', 'productivity')")
    is_connected_to_account = serializers.BooleanField(help_text="True if tool is connected at account level (via /api/connections/)")
    is_connected_to_agent = serializers.BooleanField(help_text="True if this specific agent is using the tool")
    connection_id = serializers.IntegerField(allow_null=True, help_text="Database ID of the account-level connection. Null if not connected.")


class AgentAvailableToolsResponseSerializer(serializers.Serializer):
    """Serializer for agent available tools endpoint response"""
    tools = serializers.ListField(
        child=AgentAvailableToolSerializer(),
        help_text="List of all available tools with agent-specific connection status"
    )
    count = serializers.IntegerField(
        help_text="Total number of available tools"
    )


class ComposioConnectionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = tool_models.ComposioConnection
        fields = ['id', 'user', 'tool_name', 'auth_config_id', 'connected_at', 'last_used', 'is_active', 'metadata']
        read_only_fields = ['connected_at', 'last_used']


class ConnectionCreateRequestSerializer(serializers.Serializer):
    tool_name = serializers.CharField()
    waba_id = serializers.CharField(required=False, allow_blank=True)
    phone_number_id = serializers.CharField(required=False, allow_blank=True)


class ConnectionAuthResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    auth_url = serializers.CharField(required=False, allow_blank=True)
    connection = ComposioConnectionSerializer()


class DisconnectResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField(required=False, allow_blank=True)
    error = serializers.CharField(required=False, allow_blank=True)


class AgentToolSerializer(serializers.Serializer):
    """Serializer for individual agent tool"""
    tool_name = serializers.CharField(help_text="Backend tool identifier (e.g., 'weather', 'calculator')")
    name = serializers.CharField(help_text="Display name of the tool (e.g., 'Weather', 'Calculator')")
    description = serializers.CharField(help_text="Description of what the tool does")
    icon = serializers.CharField(help_text="Emoji icon for the tool")
    category = serializers.CharField(help_text="Category classification (e.g., 'information', 'utility')")
    is_enabled = serializers.BooleanField(help_text="True if this tool is enabled for the agent")


class AppConnectionDisplaySerializer(serializers.Serializer):
    """Serializer for displaying available tools (Composio apps + agent tools) with connection status"""
    app_slug = serializers.CharField(help_text="Tool identifier (e.g., 'GMAIL', 'weather', 'calculator')")
    name = serializers.CharField(help_text="Display name (e.g., 'Gmail', 'Weather', 'Calculator')")
    description = serializers.CharField(help_text="Description of what the tool does")
    category = serializers.CharField(help_text="Category (e.g., 'email', 'productivity', 'information')")
    icon = serializers.CharField(required=False, allow_null=True, help_text="Icon emoji for agent tools (null for Composio apps)")
    is_connected = serializers.BooleanField(help_text="True if user has an active connection (always True for agent tools)")
    is_composio_app = serializers.BooleanField(help_text="True if this is a Composio app, False if it's an agent tool")
    requires_api_key = serializers.BooleanField(help_text="True if this agent tool requires an API key (only relevant for agent tools)")


class AgentToolsResponseSerializer(serializers.Serializer):
    """Response serializer for agent tools list"""
    tools = serializers.ListField(
        child=AgentToolSerializer(),
        help_text="List of all available agent tools with metadata and enabled status"
    )
    count = serializers.IntegerField(help_text="Total number of available agent tools")


class AddAgentToolRequestSerializer(serializers.Serializer):
    """Request serializer for adding an agent tool"""
    tool_name = serializers.CharField(
        help_text="Name of the tool to add (e.g., 'weather', 'calculator')"
    )


class AddAgentToolResponseSerializer(serializers.Serializer):
    """Response serializer for adding an agent tool"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    agent_tools = serializers.ListField(child=serializers.CharField())


class ConnectToolToAgentRequestSerializer(serializers.Serializer):
    """Request serializer for connecting a Composio tool to an agent"""
    tool_name = serializers.CharField(
        help_text="Name of the Composio tool to connect (e.g., 'GMAIL', 'SLACK')"
    )
    redirect_url = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional redirect URL after OAuth completes"
    )


class ConnectToolToAgentResponseSerializer(serializers.Serializer):
    """Response serializer for connecting a tool to an agent"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    auth_url = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="OAuth URL to visit if account-level connection is needed"
    )
    requires_auth = serializers.BooleanField(
        help_text="Whether user needs to complete OAuth flow"
    )
    app_connections = serializers.ListField(
        child=serializers.CharField(),
        help_text="Updated list of tools connected to this agent"
    )
