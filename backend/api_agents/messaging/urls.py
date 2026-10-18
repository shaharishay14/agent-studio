"""
Messaging URL Configuration
"""
from django.urls import path
from .views import (
    connect_telegram_bot,
    disconnect_messaging_channel,
    get_messaging_channels,
    telegram_webhook,
)


urlpatterns = [
    # Telegram bot integration (agent-specific)
    path('agents/<uuid:agent_id>/telegram/connect/', connect_telegram_bot, name='telegram_connect'),
    path('agents/<uuid:agent_id>/disconnect/', disconnect_messaging_channel, name='messaging_disconnect'),
    path('agents/<uuid:agent_id>/channels/', get_messaging_channels, name='messaging_channels'),

    # Telegram webhook (public endpoint for Telegram servers)
    path('telegram/webhook/<uuid:agent_id>/', telegram_webhook, name='telegram_webhook'),
]
