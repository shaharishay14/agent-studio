from rest_framework import serializers
from ..agents import models as agent_models
import json


class FlexibleListField(serializers.ListField):
    """
    Custom ListField that handles both JSON string and array formats.
    Needed for multipart/form-data where arrays are sent as JSON strings.
    Frontend sends: ['["GMAIL"]'] (list with JSON string) via multipart data.
    """
    def to_internal_value(self, data):
        # If data is a string, try to parse it as JSON
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (json.JSONDecodeError, ValueError):
                # If it's not valid JSON, treat it as a single-item list
                data = [data]

        # If data is a list, check if first item is a JSON string
        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], str):
            try:
                # Try to parse the first item as JSON (common in multipart/form-data)
                parsed = json.loads(data[0])
                if isinstance(parsed, list):
                    data = parsed
            except (json.JSONDecodeError, ValueError):
                # Not JSON, leave as is
                pass

        # Now proceed with normal ListField validation
        return super().to_internal_value(data)


class AgentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for agent templates"""
    category_display_name = serializers.ReadOnlyField(help_text="Human-readable category name")
    category_icon = serializers.ReadOnlyField(help_text="Emoji icon for the category")

    class Meta:
        model = agent_models.AgentTemplate
        fields = [
            'id', 'name', 'description', 'system_prompt',
            'category', 'category_display_name', 'category_icon',
            'default_tools', 'default_agent_tools', 'icon',
            'usage_count', 'created_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'category_display_name', 'category_icon']


class AgentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    message_count = serializers.SerializerMethodField()
    avatar = serializers.ImageField(write_only=True, required=False, help_text="Avatar image file (JPG or PNG, max 5MB)")
    avatar_base64 = serializers.SerializerMethodField(help_text="Base64-encoded avatar image for display (read-only)")

    # 'app_connections' handles both JSON string (multipart/form-data) and array (application/json)
    # Use FlexibleListField to parse JSON strings from multipart data
    app_connections = FlexibleListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        allow_empty=True,
        help_text="List of tool names to enable for this agent (e.g., ['GMAIL', 'SLACK']). Can be sent as JSON string in multipart data."
    )

    # Make 'name' optional - will be generated from prompt if not provided
    name = serializers.CharField(required=False, allow_blank=True, max_length=200)

    # Agent-specific tools (non-Composio) - read-only for now
    agent_tools = serializers.JSONField(read_only=True)

    # Template ID (nullable)
    template_id = serializers.UUIDField(source='template.id', read_only=True, allow_null=True, help_text="ID of the template used to create this agent (if any)")

    # Missing connections (calculated field)
    missing_connections = serializers.SerializerMethodField(help_text="List of tools from template that user hasn't connected yet")

    class Meta:
        model = agent_models.Agent
        fields = [
            'name', 'prompt', 'avatar_base64', 'app_connections', 'agent_tools',
            'missing_connections', 'created_at', 'id', 'template_id',
            'user', 'updated_at', 'message_count', 'avatar'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_message_count(self, obj) -> int:
        return obj.messages.count()

    def get_missing_connections(self, obj) -> list:
        """Calculate which tools from template are not yet connected"""
        # Only calculate if agent was created from a template
        if not obj.template:
            return []

        # Get user's active connections
        from api_agents.tools.models import ComposioConnection
        user_connections = set(
            ComposioConnection.objects.filter(
                user=obj.user,
                is_active=True,
                deleted_at__isnull=True
            ).values_list('tool_name', flat=True)
        )

        # Compare with template's default tools
        template_tools = set(obj.template.default_tools or [])
        missing = list(template_tools - user_connections)

        return missing

    def get_avatar_base64(self, obj) -> str | None:
        """Returns the avatar image as a base64-encoded data URI, or None if no avatar exists"""
        if obj.avatar_image:
            import base64
            try:
                # Get the image data
                image_data = obj.get_avatar_content()
                if image_data:
                    # Encode to base64
                    base64_data = base64.b64encode(image_data).decode('utf-8')
                    # Return as data URI
                    mime_type = obj.avatar_mime_type or 'image/jpeg'
                    return f"data:{mime_type};base64,{base64_data}"
            except Exception as e:
                # Log error but don't fail the entire serialization
                print(f"Error encoding avatar to base64: {e}")
        return None

    def validate_avatar(self, value):
        """Validate avatar file size and type"""
        if value:
            # Validate file size (5MB max)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f'File size exceeds maximum allowed size of 5MB. Your file is {value.size / (1024 * 1024):.2f}MB.'
                )

            # Validate file type
            if value.content_type not in ['image/jpeg', 'image/jpg', 'image/png']:
                raise serializers.ValidationError(
                    f'Invalid file format. Only JPG and PNG images are supported. Your file type: {value.content_type}'
                )

        return value


class UnifiedAgentCreateSerializer(serializers.Serializer):
    """
    Unified serializer for creating agents via all 3 methods:
    1. YOLO Mode: Only prompt required, name auto-generated
    2. Manual Mode: Name + prompt required, user controls everything
    3. Template Mode: template_id provided, uses template as base with optional overrides
    """
    template_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="UUID of agent template to instantiate (Template Mode)"
    )
    name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Agent name (required for Manual Mode, auto-generated for YOLO Mode, optional override for Template Mode)"
    )
    prompt = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="System prompt (required for YOLO/Manual, optional override for Template Mode)"
    )
    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text="Avatar image file (JPG or PNG, max 5MB)"
    )
    app_connections = FlexibleListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        allow_empty=True,
        help_text="List of app connection slugs (e.g., ['GMAIL', 'SLACK'])"
    )
    agent_tools = FlexibleListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        allow_empty=True,
        help_text="List of agent tool names (e.g., ['weather', 'calculator'])"
    )
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        help_text="List of files to attach to this agent"
    )

    def validate(self, data):
        """Cross-field validation to ensure correct mode requirements"""
        template_id = data.get('template_id')
        name = data.get('name', '').strip()
        prompt = data.get('prompt', '').strip()

        # Template Mode: template_id provided
        if template_id:
            # Template mode - prompt and name are optional (will use template defaults)
            return data

        # Manual or YOLO Mode: no template_id
        # Require prompt for both modes
        if not prompt:
            raise serializers.ValidationError({
                'prompt': 'This field is required when not using a template.'
            })

        return data

    def validate_avatar(self, value):
        """Validate avatar file size and type"""
        if value:
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f'File size exceeds maximum allowed size of 5MB. Your file is {value.size / (1024 * 1024):.2f}MB.'
                )
            if value.content_type not in ['image/jpeg', 'image/jpg', 'image/png']:
                raise serializers.ValidationError(
                    f'Invalid file format. Only JPG and PNG images are supported. Your file type: {value.content_type}'
                )
        return value

    def validate_files(self, value):
        """Validate file attachments"""
        if value:
            max_file_size = 10 * 1024 * 1024  # 10MB per file
            for file in value:
                if file.size > max_file_size:
                    raise serializers.ValidationError(
                        f'File {file.name} exceeds maximum allowed size of 10MB. File is {file.size / (1024 * 1024):.2f}MB.'
                    )
        return value


class ChatMessageSerializer(serializers.ModelSerializer):
    # Explicitly define agent field to serialize UUID correctly
    agent = serializers.UUIDField(read_only=True, source='agent.id')

    class Meta:
        model = agent_models.ChatMessage
        fields = ['id', 'agent', 'role', 'content', 'attachments', 'created_at']
        read_only_fields = ['created_at']


class AgentChatRequestSerializer(serializers.Serializer):
    """Request serializer for agent chat endpoint (agent ID comes from URL)"""
    message = serializers.CharField(help_text="The message to send to the agent")
    files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=list,
        help_text="Optional list of files to upload inline with the message (automatically marked as temporary and deleted after use). All persistent files from the agent's database are automatically loaded."
    )
    is_ephemeral = serializers.BooleanField(
        required=False,
        default=False,
        help_text="If true, the conversation will not be saved to the database (for embedded/public use)"
    )


class AgentChatResponseSerializer(serializers.Serializer):
    """Response serializer for agent chat endpoint"""
    user_message = ChatMessageSerializer(help_text="The user message that was sent")
    assistant_message = ChatMessageSerializer(help_text="The assistant's response message")


class SuggestedPromptsRequestSerializer(serializers.Serializer):
    """Request serializer for generating suggested prompts"""
    prompt = serializers.CharField(
        help_text="The agent's purpose/prompt used to generate relevant example prompts"
    )
    app_connections = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
        allow_empty=True,
        help_text="List of tool names the agent will use (e.g., ['GMAIL', 'SLACK'])"
    )


class SuggestedPromptsResponseSerializer(serializers.Serializer):
    """Response serializer for suggested prompts"""
    suggested_prompts = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of 3 suggested prompts the user can use with this agent"
    )
