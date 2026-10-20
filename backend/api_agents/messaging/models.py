from django.db import models


class MessagingChannel(models.Model):
    """Connect agents to messaging platforms (Telegram, WhatsApp)"""
    PLATFORM_CHOICES = [
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('error', 'Error'),
    ]

    agent = models.ForeignKey('api_agents.Agent', on_delete=models.CASCADE, related_name='messaging_channels')
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)

    # Platform-specific credentials
    bot_token = models.CharField(max_length=500, blank=True, help_text="Telegram bot token")
    bot_username = models.CharField(max_length=200, blank=True, help_text="Telegram bot username")
    webhook_url = models.URLField(blank=True, max_length=500, help_text="Webhook URL for this channel")

    # Security: Telegram sends this secret with every update, so we know the request is really from Telegram.
    # Without it, anyone knowing the webhook URL could fake messages "from" any Telegram user.
    webhook_secret = models.CharField(max_length=64, blank=True, help_text="Secret Telegram sends in X-Telegram-Bot-Api-Secret-Token")

    # The agent owner's own Telegram account: only messages from it get the owner's apps and history
    owner_external_user_id = models.CharField(max_length=200, blank=True, help_text="Platform user ID of the agent owner")
    owner_link_code = models.CharField(max_length=16, blank=True, help_text="One-time code the owner sends as /link <code>")

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_error = models.TextField(blank=True, help_text="Last error message if status is 'error'")

    # Statistics
    message_count = models.IntegerField(default=0, help_text="Total messages processed")
    last_message_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['agent', 'platform']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.agent.name} - {self.get_platform_display()}"


class MessagingSession(models.Model):
    """Track active conversations on messaging platforms"""
    channel = models.ForeignKey(MessagingChannel, on_delete=models.CASCADE, related_name='sessions')

    # External user identification
    external_user_id = models.CharField(max_length=200, help_text="Platform user ID (Telegram user ID or WhatsApp phone)")
    external_chat_id = models.CharField(max_length=200, help_text="Platform chat ID for sending responses")
    external_username = models.CharField(max_length=200, blank=True, help_text="Username from the platform")

    # Session state
    is_active = models.BooleanField(default=True)
    message_count = models.IntegerField(default=0)

    # Recent messages for senders who aren't the owner. Kept here, not in ChatMessage,
    # so strangers never see the owner's history and never write into it.
    recent_messages = models.JSONField(default=list, blank=True)

    # Conversation history (stored in ChatMessage model via agent)
    last_message_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['channel', 'external_user_id']
        ordering = ['-last_message_at']
        indexes = [
            models.Index(fields=['channel', 'is_active']),
            models.Index(fields=['external_user_id']),
        ]

    def __str__(self):
        return f"{self.channel.agent.name} - {self.external_username or self.external_user_id}"
