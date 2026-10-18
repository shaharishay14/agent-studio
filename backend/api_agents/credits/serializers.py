from rest_framework import serializers
from ..credits import models as credit_models


class CreditBalanceSerializer(serializers.Serializer):
    """Serializer for user credit balance"""
    total_credits = serializers.IntegerField(help_text="Current credit balance")
    credits_used = serializers.IntegerField(help_text="Total credits used historically")
    credit_refresh_date = serializers.DateTimeField(help_text="Date when credits were last refreshed", allow_null=True)
    next_refresh_date = serializers.DateTimeField(help_text="Date when credits will refresh next", allow_null=True)


class UsageLogSerializer(serializers.ModelSerializer):
    """Serializer for usage logs"""
    agent_name = serializers.CharField(source='agent.name', read_only=True, allow_null=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        model = credit_models.UsageLog
        fields = [
            'id', 'action_type', 'action_type_display', 'credits_used',
            'credits_remaining', 'description', 'metadata',
            'agent_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AddCreditsRequestSerializer(serializers.Serializer):
    """Request serializer for adding credits (admin only)"""
    user_id = serializers.UUIDField(required=True, help_text="UUID of the user to add credits to")
    amount = serializers.IntegerField(required=True, min_value=1, help_text="Number of credits to add")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Optional reason for adding credits")


class AddCreditsResponseSerializer(serializers.Serializer):
    """Response serializer for adding credits"""
    message = serializers.CharField()
    user_id = serializers.UUIDField()
    credits_added = serializers.IntegerField()
    new_balance = serializers.IntegerField()
