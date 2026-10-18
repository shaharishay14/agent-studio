from rest_framework import serializers
from ..files import models as file_models
from ..agents import models as agent_models


class FileAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for file attachments stored in database"""
    download_url = serializers.SerializerMethodField()
    agent_id = serializers.UUIDField(write_only=True, required=True, help_text="UUID of the agent this file belongs to")
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    is_temporary = serializers.BooleanField(default=False, required=False, help_text="If true, file will be auto-deleted after being used in a message")

    class Meta:
        model = file_models.FileAttachment
        fields = ['id', 'agent_id', 'agent_name', 'original_filename', 'file_size', 'mime_type', 'is_temporary', 'uploaded_at', 'download_url']
        read_only_fields = ['uploaded_at', 'download_url', 'agent_name']
        # Note: file_content is not included in serializer for security/performance

    def get_download_url(self, obj) -> str | None:
        """Returns the URL to download the file content"""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/files/{obj.id}/download/')
        return None

    def validate_agent_id(self, value):
        """Validate that agent exists and belongs to the user"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is required")

        try:
            agent = agent_models.Agent.objects.get(id=value, user=request.user)
        except agent_models.Agent.DoesNotExist:
            raise serializers.ValidationError("Agent not found or doesn't belong to you")

        return value


class ChatRequestSerializer(serializers.Serializer):
    """Legacy serializer - deprecated"""
    message = serializers.CharField()
    agent_id = serializers.IntegerField()
    file_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )
