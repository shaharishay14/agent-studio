from django.db import models
from django.conf import settings


class UsageLog(models.Model):
    """Log of credit usage for tracking and analytics"""
    ACTION_TYPES = [
        ('message', 'Chat Message'),
        ('tool_call', 'Tool Execution'),
        ('admin_add', 'Admin Credit Addition'),
        ('purchase', 'Credit Purchase'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='usage_logs')
    agent = models.ForeignKey('api_agents.Agent', on_delete=models.SET_NULL, null=True, blank=True, related_name='usage_logs')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES, default='message')
    credits_used = models.IntegerField(help_text="Number of credits used (positive) or added (negative)")
    credits_remaining = models.IntegerField(help_text="User's credit balance after this transaction")
    description = models.TextField(blank=True, help_text="Optional description of the action")
    metadata = models.JSONField(default=dict, help_text="Additional metadata (e.g., message length, tool name)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
        ]

    def __str__(self):
        action = "used" if self.credits_used > 0 else "received"
        return f"{self.user.username} {action} {abs(self.credits_used)} credits - {self.get_action_type_display()}"
