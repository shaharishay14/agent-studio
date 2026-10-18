"""
Telegram Bot API Utilities
---------------------------
Helper functions for interacting with Telegram Bot API
"""
import requests
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class TelegramAPIError(Exception):
    """Raised when Telegram API returns an error"""
    pass


def get_telegram_api_url(bot_token: str, method: str) -> str:
    """Get the Telegram API URL for a specific method"""
    return f"https://api.telegram.org/bot{bot_token}/{method}"


def verify_bot_token(bot_token: str) -> Dict[str, Any]:
    """
    Verify a Telegram bot token and get bot info.

    Args:
        bot_token: Telegram bot token from @BotFather

    Returns:
        Dict with bot info (id, username, first_name)

    Raises:
        TelegramAPIError: If token is invalid or API request fails
    """
    url = get_telegram_api_url(bot_token, 'getMe')

    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        if not data.get('ok'):
            error_description = data.get('description', 'Unknown error')
            raise TelegramAPIError(f"Telegram API error: {error_description}")

        bot_info = data.get('result', {})
        return {
            'id': bot_info.get('id'),
            'username': bot_info.get('username'),
            'first_name': bot_info.get('first_name'),
            'can_read_all_group_messages': bot_info.get('can_read_all_group_messages', False),
        }

    except requests.RequestException as e:
        logger.error(f"Failed to verify Telegram bot token: {e}")
        raise TelegramAPIError(f"Failed to connect to Telegram API: {str(e)}")


def set_webhook(bot_token: str, webhook_url: str) -> bool:
    """
    Set the webhook URL for a Telegram bot.

    Args:
        bot_token: Telegram bot token
        webhook_url: URL where Telegram will send updates

    Returns:
        True if successful

    Raises:
        TelegramAPIError: If webhook setup fails
    """
    url = get_telegram_api_url(bot_token, 'setWebhook')

    payload = {
        'url': webhook_url,
        'allowed_updates': ['message'],  # Only receive message updates
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()

        if not data.get('ok'):
            error_description = data.get('description', 'Unknown error')
            raise TelegramAPIError(f"Failed to set webhook: {error_description}")

        logger.info(f"Webhook set successfully for bot {bot_token[:10]}...")
        return True

    except requests.RequestException as e:
        logger.error(f"Failed to set webhook: {e}")
        raise TelegramAPIError(f"Failed to set webhook: {str(e)}")


def delete_webhook(bot_token: str) -> bool:
    """
    Delete the webhook for a Telegram bot.

    Args:
        bot_token: Telegram bot token

    Returns:
        True if successful
    """
    url = get_telegram_api_url(bot_token, 'deleteWebhook')

    try:
        response = requests.post(url, timeout=10)
        data = response.json()

        if data.get('ok'):
            logger.info(f"Webhook deleted for bot {bot_token[:10]}...")
            return True
        return False

    except requests.RequestException as e:
        logger.error(f"Failed to delete webhook: {e}")
        return False


def send_message(
    bot_token: str,
    chat_id: str,
    text: str,
    parse_mode: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send a message via Telegram bot.

    Args:
        bot_token: Telegram bot token
        chat_id: Telegram chat ID
        text: Message text to send
        parse_mode: Optional parse mode ('Markdown' or 'HTML')

    Returns:
        Dict with message info

    Raises:
        TelegramAPIError: If message send fails
    """
    url = get_telegram_api_url(bot_token, 'sendMessage')

    payload = {
        'chat_id': chat_id,
        'text': text,
    }

    if parse_mode:
        payload['parse_mode'] = parse_mode

    try:
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()

        if not data.get('ok'):
            error_description = data.get('description', 'Unknown error')
            raise TelegramAPIError(f"Failed to send message: {error_description}")

        return data.get('result', {})

    except requests.RequestException as e:
        logger.error(f"Failed to send Telegram message: {e}")
        raise TelegramAPIError(f"Failed to send message: {str(e)}")


def send_typing_action(bot_token: str, chat_id: str) -> bool:
    """
    Send typing indicator to show bot is processing.

    Args:
        bot_token: Telegram bot token
        chat_id: Telegram chat ID

    Returns:
        True if successful
    """
    url = get_telegram_api_url(bot_token, 'sendChatAction')

    payload = {
        'chat_id': chat_id,
        'action': 'typing',
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.json().get('ok', False)
    except:
        return False
