from rest_framework import serializers
from ..messaging import models as messaging_models


class MessagingChannelSerializer(serializers.ModelSerializer):
    """Serializer for messaging channel connections"""
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = messaging_models.MessagingChannel
        fields = [
            'id', 'platform', 'platform_display', 'bot_username',
            'status', 'status_display', 'message_count',
            'last_message_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'message_count', 'last_message_at', 'created_at', 'updated_at']


class ConnectTelegramBotSerializer(serializers.Serializer):
    """Serializer for connecting a Telegram bot to an agent"""
    bot_token = serializers.CharField(
        required=True,
        help_text="Telegram bot token from @BotFather (e.g., 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
    )

    def validate_bot_token(self, value):
        """Validate bot token format"""
        if ':' not in value or len(value) < 20:
            raise serializers.ValidationError("Invalid bot token format")
        return value


class DisconnectMessagingChannelSerializer(serializers.Serializer):
    """Serializer for disconnecting a messaging channel"""
    platform = serializers.ChoiceField(
        choices=['telegram', 'whatsapp'],
        required=True,
        help_text="Platform to disconnect (telegram or whatsapp)"
    )
