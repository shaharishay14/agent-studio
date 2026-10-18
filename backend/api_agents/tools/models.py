from django.db import models
from django.conf import settings


class ComposioConnection(models.Model):
    """Tracks which Composio tools a user has connected"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='composio_connections')
    tool_name = models.CharField(max_length=100, help_text="Tool identifier (e.g., 'GMAIL', 'GITHUB')")
    auth_config_id = models.CharField(max_length=200, blank=True, help_text="Composio auth config ID")
    composio_connection_id = models.CharField(max_length=200, blank=True, help_text="Composio connection ID (from API)")
    composio_entity_id = models.CharField(max_length=200, blank=True, help_text="Composio entity/user ID (user_{django_user_id})")
    connected_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when connection was soft-deleted. Used to prevent immediate recreation from Composio sync.")
    metadata = models.JSONField(default=dict, help_text="Additional connection metadata")

    class Meta:
        unique_together = ['user', 'tool_name']
        ordering = ['-connected_at']

    def __str__(self):
        return f"{self.user.username} - {self.tool_name}"
