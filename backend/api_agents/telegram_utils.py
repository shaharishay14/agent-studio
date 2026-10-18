"""
Backward compatibility re-export of Telegram utilities.

This module provides backward compatibility for imports that previously used:
    from api_agents.telegram_utils import verify_bot_token, set_webhook, etc.

The actual implementation has moved to:
    from api_agents.messaging.telegram_utils import verify_bot_token, set_webhook, etc.

This file should be removed after updating all internal imports.
"""

from .messaging.telegram_utils import (
    TelegramAPIError,
    get_telegram_api_url,
    verify_bot_token,
    set_webhook,
    delete_webhook,
    send_message,
    send_typing_action
)

__all__ = [
    'TelegramAPIError',
    'get_telegram_api_url',
    'verify_bot_token',
    'set_webhook',
    'delete_webhook',
    'send_message',
    'send_typing_action'
]
