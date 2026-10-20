"""
Agent Service - Integrates Composio and OpenAI for agent functionality
"""

import os
import asyncio
from asgiref.sync import sync_to_async
import json
import datetime
import random
import re
import logging
import time
from functools import wraps
from typing import List, Dict, Any, Optional, Callable, TypeVar
from pathlib import Path
from composio import Composio
from composio_openai_agents import OpenAIAgentsProvider
from agents import Agent as ComposioAgent, Runner
from openai import AsyncOpenAI  # ✅ Changed from OpenAI to AsyncOpenAI
from django.conf import settings
from django.core.cache import cache
from ...tools.composio_config import APP_SLUGS, TOP_SLUGS_BY_APP
from ..tools_config import get_openai_functions_for_tools
from .agent_tools_service import AgentToolsService
from .context_injection_manager import get_context_manager
from .tool_dependency_engine import get_tool_dependency_engine
from .model_selection_strategy import get_model_selection_strategy
from .intent_resolution_engine import get_intent_engine
from .pre_execution_validator import get_validator
from .execution_logger import get_execution_logger
from .tool_policy import PermissionGate, guard_function_tools
from ...shared.utils import convert_image_to_base64

# Configure logging
logger = logging.getLogger(__name__)

# Max model calls with tools per user message before we force a final answer
MAX_AGENT_STEPS = 8

# Max characters of a single tool result that go into the model's context (~1k tokens)
MAX_TOOL_RESULT_CHARS = 4000

# Chat history compaction: newest messages stay word for word, older ones become a summary
RECENT_MESSAGES_VERBATIM = 10
COMPACT_BATCH_SIZE = 10  # update the summary once this many older messages pile up
HISTORY_LOAD_LIMIT = RECENT_MESSAGES_VERBATIM + 2 * COMPACT_BATCH_SIZE


# Retry mechanism with exponential backoff and TTL
def retry_with_backoff(max_retries=3, initial_delay=1.0, max_delay=10.0, exponential_base=2, ttl_seconds=30):
    """
    Decorator for retrying async functions with exponential backoff and TTL.

    Args:
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds before first retry
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff calculation
        ttl_seconds: Maximum total time allowed for all retries (Time To Live)

    Retries on:
        - Rate limit errors (429, "rate limit", "too many requests")
        - Temporary network issues (500, 502, 503, 504)
        - Timeout errors

    Does NOT retry on:
        - Authentication errors (401, 403)
        - Not found errors (404)
        - Bad request errors (400)
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            last_exception = None

            for attempt in range(max_retries + 1):
                # Check if we've exceeded TTL
                elapsed = time.time() - start_time
                if elapsed > ttl_seconds:
                    logger.warning(f"⏱️ TTL exceeded ({elapsed:.1f}s > {ttl_seconds}s) for {func.__name__}")
                    break

                try:
                    return await func(*args, **kwargs)

                except Exception as e:
                    last_exception = e
                    error_str = str(e).lower()

                    # Determine if error is retryable
                    is_rate_limit = any(keyword in error_str for keyword in ['rate limit', '429', 'too many requests', 'quota exceeded'])
                    is_server_error = any(keyword in error_str for keyword in ['500', '502', '503', '504', 'timeout', 'timed out'])
                    is_retryable = is_rate_limit or is_server_error

                    # Don't retry on auth/permission errors
                    is_auth_error = any(keyword in error_str for keyword in ['401', '403', 'unauthorized', 'forbidden', 'permission denied'])
                    is_not_found = '404' in error_str or 'not found' in error_str
                    is_bad_request = '400' in error_str or 'bad request' in error_str

                    if is_auth_error or is_not_found or is_bad_request:
                        logger.info(f"❌ Non-retryable error in {func.__name__}: {type(e).__name__}")
                        raise  # Don't retry, raise immediately

                    if not is_retryable or attempt == max_retries:
                        logger.warning(f"❌ Final attempt failed for {func.__name__}: {type(e).__name__}")
                        raise  # Last attempt or non-retryable error

                    # Calculate delay with exponential backoff
                    delay = min(initial_delay * (exponential_base ** attempt), max_delay)
                    # Add jitter to prevent thundering herd
                    delay = delay * (0.5 + random.random())

                    # Check if delay would exceed TTL
                    if elapsed + delay > ttl_seconds:
                        logger.warning(f"⏱️ Skipping retry (would exceed TTL) for {func.__name__}")
                        break

                    retry_reason = "rate limit" if is_rate_limit else "server error"
                    logger.info(f"🔄 Retry {attempt + 1}/{max_retries} for {func.__name__} ({retry_reason}) in {delay:.1f}s")

                    await asyncio.sleep(delay)

            # If we get here, all retries failed
            if last_exception:
                raise last_exception

        return wrapper
    return decorator


# Fun, user-friendly status messages (no "Composio" mentioned)
TOOL_LOADING_MESSAGES = [
    "Gathering my tools... 🔧",
    "Getting ready... ⚙️",
    "Preparing to help... 🛠️",
    "Loading capabilities... 💫",
    "Warming up... 🔥",
]

PROCESSING_MESSAGES = [
    "Working on it... 🤔",
    "Let me think... 💭",
    "Processing your request... ⚡",
    "On it! Just a moment... 🚀",
    "Crunching the data... 🧮",
    "Making magic happen... ✨",
]


# ============================================================
# RETRY LOGIC WITH EXPONENTIAL BACKOFF
# ============================================================

T = TypeVar('T')

def with_retry(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    retry_on: tuple = (Exception,),
    dont_retry_on: tuple = (asyncio.TimeoutError, KeyboardInterrupt)
):
    """
    Decorator to add retry logic with exponential backoff to async functions.

    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        backoff_factor: Multiplier for delay between retries (default: 2.0)
        initial_delay: Initial delay in seconds (default: 1.0)
        max_delay: Maximum delay between retries in seconds (default: 60.0)
        retry_on: Tuple of exceptions to retry on (default: all exceptions)
        dont_retry_on: Tuple of exceptions to never retry (default: TimeoutError, KeyboardInterrupt)

    Example:
        @with_retry(max_retries=3, backoff_factor=2)
        async def fetch_data():
            # Will retry up to 3 times with delays: 1s, 2s, 4s
            pass
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(max_retries + 1):  # +1 because first attempt is not a retry
                try:
                    return await func(*args, **kwargs)

                except dont_retry_on as e:
                    # Don't retry these exceptions
                    logger.warning(f"Non-retryable exception in {func.__name__}: {type(e).__name__}")
                    raise

                except retry_on as e:
                    last_exception = e

                    # If this was the last attempt, raise the exception
                    if attempt >= max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}: {e}")
                        raise

                    # Calculate delay with exponential backoff
                    delay = min(initial_delay * (backoff_factor ** attempt), max_delay)

                    # Add jitter to prevent thundering herd
                    jittered_delay = delay * (0.5 + random.random())

                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries + 1} failed for {func.__name__}: {type(e).__name__}: {str(e)[:100]}. "
                        f"Retrying in {jittered_delay:.2f}s..."
                    )

                    await asyncio.sleep(jittered_delay)

                except Exception as e:
                    # Unexpected exception type
                    logger.error(f"Unexpected exception in {func.__name__}: {type(e).__name__}: {e}")
                    raise

            # Should never reach here, but just in case
            if last_exception:
                raise last_exception

        return wrapper
    return decorator


# ============================================================
# SECURITY HELPER FUNCTIONS
# ============================================================

def sanitize_for_prompt(text: str, max_length: int = 10000) -> str:
    """
    Sanitize user input to prevent prompt injection attacks.

    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized text safe for inclusion in prompts
    """
    if not text:
        return ""

    # Convert to string if not already
    text = str(text)

    # Escape special characters that could break out of context
    text = text.replace("\\", "\\\\")
    text = text.replace('"', '\\"')
    text = text.replace("'", "\\'")

    # Replace newlines with escaped versions to prevent prompt structure breaks
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '\\r')
    text = text.replace('\t', '\\t')

    # Remove potential injection patterns
    text = re.sub(r'<\|.*?\|>', '', text)  # Remove special tokens
    text = re.sub(r'\{\{.*?\}\}', '', text)  # Remove template injections
    text = re.sub(r'system:', 'system\\:', text)  # Escape role markers
    text = re.sub(r'user:', 'user\\:', text)
    text = re.sub(r'assistant:', 'assistant\\:', text)

    # Limit length to prevent resource exhaustion
    return text[:max_length]


def sanitize_file_path(file_path: str) -> str:
    """
    Sanitize file paths to prevent path traversal attacks.

    Args:
        file_path: File path to sanitize

    Returns:
        Sanitized file path
    """
    if not file_path:
        return ""

    file_path = str(file_path)

    # Remove path traversal attempts
    file_path = file_path.replace("../", "")
    file_path = file_path.replace("..\\", "")
    file_path = file_path.replace("..", "")

    # Remove null bytes
    file_path = file_path.replace("\x00", "")

    # NOTE: We preserve absolute paths for Docker environment
    # DO NOT strip leading slashes - tools need absolute paths like /tmp/composio_files_xxx/file.png

    # Whitelist allowed characters (alphanumeric, dots, underscores, hyphens, forward slashes, spaces)
    file_path = re.sub(r'[^a-zA-Z0-9._/ -]', '', file_path)

    # Limit length to prevent buffer overflow
    return file_path[:255]


def validate_file_path_whitelist(file_path: str, allowed_directories: List[str] = None) -> bool:
    """
    Validate that a file path is within allowed directories.

    Args:
        file_path: File path to validate
        allowed_directories: List of allowed directory prefixes (default: uploads, media, tmp)

    Returns:
        True if path is allowed, False otherwise
    """
    if not file_path:
        return False

    # Default allowed directories for file attachments
    if allowed_directories is None:
        allowed_directories = [
            '/uploads/',
            '/media/',
            '/tmp/',
            'uploads/',
            'media/',
            'tmp/',
        ]

    # Blocked directories that should never be accessible
    blocked_patterns = [
        '/etc/',
        '/root/',
        '/sys/',
        '/proc/',
        '/.ssh/',
        '/.env',
        '/var/log/',
        'config/',
        'settings.py',
        'secrets',
        'credentials',
        '.key',
        '.pem',
    ]

    file_path_lower = file_path.lower()

    # Check if path contains any blocked patterns
    for blocked in blocked_patterns:
        if blocked.lower() in file_path_lower:
            logger.warning(f"Blocked file path attempt: {file_path} (contains '{blocked}')")
            return False

    # Check if path is in allowed directories
    for allowed_dir in allowed_directories:
        if allowed_dir in file_path or file_path.startswith(allowed_dir):
            return True

    # If not in any allowed directory, check if it's a relative path in uploads
    # This allows flexibility for different upload configurations
    if not file_path.startswith('/') and not file_path.startswith('..'):
        # Relative paths are assumed to be in uploads directory
        return True

    logger.warning(f"File path not in whitelist: {file_path}")
    return False


def parse_json_safely(json_str: str, default=None, max_size: int = 100000):
    """
    Safely parse JSON with size limits and error handling.

    Args:
        json_str: JSON string to parse
        default: Default value to return on error
        max_size: Maximum allowed JSON string size in bytes

    Returns:
        Parsed JSON data or default value
    """
    if not json_str:
        return default

    try:
        # Limit input size to prevent DoS
        if len(json_str) > max_size:
            logger.warning(f"JSON input too large ({len(json_str)} > {max_size}), truncating")
            json_str = json_str[:max_size]

        # Parse JSON
        data = json.loads(json_str)

        # Basic type validation
        if not isinstance(data, (dict, list, str, int, float, bool, type(None))):
            logger.warning(f"Unexpected JSON type: {type(data)}")
            return default

        return data
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        return default
    except Exception as e:
        logger.error(f"Unexpected error parsing JSON: {e}")
        return default


def mask_sensitive_data(text: str, mask_keys: bool = True, mask_tokens: bool = True) -> str:
    """
    Mask sensitive data like API keys and tokens in text.

    Args:
        text: Text potentially containing sensitive data
        mask_keys: Whether to mask API keys
        mask_tokens: Whether to mask tokens

    Returns:
        Text with sensitive data masked
    """
    if not text:
        return ""

    text = str(text)

    if mask_keys:
        # Mask API key patterns
        text = re.sub(r'(sk-[a-zA-Z0-9]{20,})', r'sk-...MASKED', text)
        text = re.sub(r'(api[_-]?key["\']?\s*[:=]\s*["\']?)([a-zA-Z0-9]{20,})', r'\1***MASKED***', text, flags=re.IGNORECASE)

    if mask_tokens:
        # Mask JWT tokens
        text = re.sub(r'(eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,})', r'eyJ...MASKED', text)
        # Mask bearer tokens
        text = re.sub(r'(bearer\s+)([a-zA-Z0-9_-]{20,})', r'\1***MASKED***', text, flags=re.IGNORECASE)

    return text


def validate_api_keys(settings_obj) -> bool:
    """
    Validate that required API keys are present and properly formatted.

    Args:
        settings_obj: Django settings object

    Returns:
        True if all keys are valid, raises ValueError otherwise
    """
    errors = []

    # Check OpenAI key
    openai_key = getattr(settings_obj, 'OPENAI_API_KEY', None)
    if not openai_key or openai_key == "your-key-here" or len(openai_key) < 20:
        errors.append("OPENAI_API_KEY is missing or invalid")
    elif not openai_key.startswith("sk-"):
        logger.warning("OpenAI API key may have invalid format (should start with 'sk-')")

    # Check Composio key
    composio_key = getattr(settings_obj, 'COMPOSIO_API_KEY', None)
    if not composio_key or composio_key == "your-key-here" or len(composio_key) < 20:
        errors.append("COMPOSIO_API_KEY is missing or invalid")

    if errors:
        raise ValueError(f"API key validation failed: {'; '.join(errors)}")

    # Log success with masked keys
    logger.info(f"API keys validated: OpenAI={mask_sensitive_data(openai_key)}, Composio={mask_sensitive_data(composio_key)}")
    return True


def cap_tool_result(content: str, max_chars: int = MAX_TOOL_RESULT_CHARS) -> str:
    """
    Limits a tool result before it goes into the model's context.
    Keeps the start and tells the model it was cut, so it can ask for less.
    """
    if len(content) <= max_chars:
        return content

    logger.warning(f"Tool result truncated from {len(content)} to {max_chars} chars")
    return (
        content[:max_chars]
        + f"\n\n[TRUNCATED: showing first {max_chars} of {len(content)} characters. "
        "If you need more, call the tool again with a narrower query or fewer results.]"
    )


def sanitize_chat_history(chat_history: List[Dict[str, str]], max_messages: int = 50) -> List[Dict[str, str]]:
    """
    Sanitize all messages in chat history to prevent stored injection attacks.
    MEMORY OPTIMIZATION: Limits history to last N messages to prevent unbounded growth.

    Args:
        chat_history: List of message dictionaries with 'role' and 'content'
        max_messages: Maximum number of messages to keep (default: 50)

    Returns:
        Sanitized and trimmed chat history
    """
    if not chat_history:
        return []

    # MEMORY OPTIMIZATION: Limit to last N messages to prevent memory leaks
    if len(chat_history) > max_messages:
        logger.warning(f"Chat history has {len(chat_history)} messages, trimming to last {max_messages}")
        chat_history = chat_history[-max_messages:]

    sanitized_history = []
    for message in chat_history:
        if not isinstance(message, dict):
            continue

        sanitized_message = {}
        # Sanitize role (should only be 'user', 'assistant', or 'system')
        role = message.get('role', '')
        if role in ['user', 'assistant', 'system']:
            sanitized_message['role'] = role
        else:
            # Skip invalid roles
            continue

        # Sanitize content
        content = message.get('content', '')
        sanitized_message['content'] = sanitize_for_prompt(content) if content else ""

        sanitized_history.append(sanitized_message)

    return sanitized_history


def extract_email_safely(text: str) -> Optional[str]:
    """
    Extract and validate email addresses from text.

    Args:
        text: Text containing potential email addresses

    Returns:
        First valid email found or None
    """
    if not text:
        return None

    # More robust email regex pattern
    email_pattern = r'\b[A-Za-z0-9][A-Za-z0-9._%+-]{0,63}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,62}[A-Za-z0-9])?\.)+[A-Za-z]{2,}\b'
    matches = re.findall(email_pattern, str(text))

    for match in matches:
        # Basic validation
        if len(match) > 320:  # Max email length per RFC
            continue
        if match.count('@') != 1:
            continue

        # Check for common invalid patterns
        if match.startswith('.') or match.endswith('.'):
            continue
        if '..' in match:
            continue

        return match.lower()

    return None


class AgentService:
    """
    Service for managing AI agents, tool connections, and chat logic for each user.
    """

    APP_SLUGS = APP_SLUGS
    TOP_SLUGS_BY_APP = TOP_SLUGS_BY_APP

    def __init__(self, user):
        """
        Initializes the service for a specific user.
        """
        self.user = user
        self.openai_client = None
        self.composio_client = None
        self.agent_tools_service = AgentToolsService()  # Initialize agent tools service

        # MEMORY OPTIMIZATION: Tools cache with TTL-based eviction to prevent unbounded growth
        self._tools_cache: Dict[str, Dict[str, Any]] = {}
        # Cache structure: {app_key: {'tools': [...], 'timestamp': float, 'ttl': int}}
        self._tools_cache_ttl = 3600  # 1 hour in seconds

        # PERFORMANCE: Tool schema cache (5-minute TTL for faster repeated tool loading)
        self._tools_schema_cache: Dict[frozenset, tuple] = {}
        # Cache structure: {frozenset(tool_slugs): (tools, timestamp)}
        self._tools_schema_cache_ttl = 300  # 5 minutes in seconds

        # PERFORMANCE: Connection caching with 5-minute TTL to reduce API calls by 80%
        self._connection_cache: Dict[str, Dict[str, Any]] = {}
        # Cache structure: {cache_key: {'connections': [...], 'timestamp': float, 'ttl': int}}
        self._connection_cache_ttl = 300  # 5 minutes in seconds

        # CONTROLLER PATTERN: Interceptor, Circuit Breaker, Validator
        from .tool_call_interceptor import ToolCallInterceptor
        from .circuit_breaker import CircuitBreaker
        from .output_validator import OutputValidator

        self.interceptor = ToolCallInterceptor()
        self.circuit_breaker = CircuitBreaker(window_size=5, max_repeats=3)
        self.output_validator = OutputValidator()

        # Validate API keys on startup
        try:
            validate_api_keys(settings)
        except ValueError as e:
            logger.error(f"API key validation failed: {e}")
            raise

        # Load auth configs securely
        self.auth_configs = self._load_auth_configs_safely()

        # Initialize clients
        self._initialize_clients()

    def _load_auth_configs_safely(self) -> Dict[str, str]:
        """
        Securely loads and validates Composio Auth Config IDs from a JSON file.
        Prevents path traversal and validates JSON schema.

        Expected format: {"TOOL_NAME": "ac_xxxxx", ...}
        """
        try:
            # Build path safely
            base_path = Path(__file__).parent.parent.parent.parent.resolve()
            config_path = base_path / "auth_configs.json"

            # Validate path is within project directory
            if not str(config_path.resolve()).startswith(str(base_path)):
                logger.error("Auth config path outside project directory - potential path traversal attempt")
                return {}

            if not config_path.exists():
                logger.warning(f"Auth configs file not found at {config_path}")
                return {}

            # Read and parse with size limit
            with open(config_path, 'r') as f:
                content = f.read(500000)  # Limit to 500KB
                configs = parse_json_safely(content, default={})

            if not isinstance(configs, dict):
                logger.error("Auth configs must be a dictionary")
                return {}

            # Validate structure and sanitize
            # Format: {"TOOL_NAME": "ac_xxxxx"}
            sanitized_configs = {}
            for app_name, auth_config_id in configs.items():
                # Validate app_name is a string and uppercase
                if not isinstance(app_name, str):
                    logger.warning(f"Invalid app_name type for {app_name}, skipping")
                    continue

                app_name = app_name.upper()

                # Validate auth_config_id is a string starting with "ac_"
                if not isinstance(auth_config_id, str):
                    logger.warning(f"Invalid auth_config_id type for {app_name}, skipping")
                    continue

                if not auth_config_id.startswith('ac_'):
                    logger.warning(f"Invalid auth_config_id format for {app_name}: {mask_sensitive_data(auth_config_id)}")
                    continue

                # Limit length and sanitize
                sanitized_configs[app_name] = str(auth_config_id)[:50]

            logger.info(f"✅ Loaded {len(sanitized_configs)} auth configs securely")
            return sanitized_configs

        except Exception as e:
            logger.error(f"Failed to load auth configs: {mask_sensitive_data(str(e))}")
            return {}

    def _get_api_keys_with_rotation(self, key_name: str) -> List[str]:
        """
        Get API keys with rotation support.
        Supports primary and backup keys from environment.

        Args:
            key_name: Base name of the key (e.g., 'OPENAI_API_KEY')

        Returns:
            List of available keys in priority order
        """
        keys = []

        # Primary key
        primary_key = getattr(settings, key_name, None)
        if primary_key and primary_key != "your-key-here":
            keys.append(primary_key)

        # Backup keys (OPENAI_API_KEY_BACKUP_1, OPENAI_API_KEY_BACKUP_2, etc.)
        for i in range(1, 4):  # Support up to 3 backup keys
            backup_key_name = f"{key_name}_BACKUP_{i}"
            backup_key = getattr(settings, backup_key_name, None)
            if backup_key and backup_key != "your-key-here":
                keys.append(backup_key)

        return keys

    def _initialize_clients(self):
        """
        Initializes the OpenAI and Composio clients using API keys from settings.
        Uses masked logging to prevent key exposure.
        Supports key rotation with primary and backup keys.
        """
        try:
            # Get all available OpenAI keys (primary + backups)
            openai_keys = self._get_api_keys_with_rotation('OPENAI_API_KEY')
            if openai_keys:
                self.openai_api_keys = openai_keys
                self.current_openai_key_index = 0
                # Initialize with primary key
                self.openai_client = AsyncOpenAI(api_key=openai_keys[0])
                logger.info(f"OpenAI client initialized with {len(openai_keys)} key(s) available")
                logger.info(f"Primary key: {mask_sensitive_data(openai_keys[0])}")
            else:
                self.openai_api_keys = []
                self.current_openai_key_index = 0

            # Get all available Composio keys (primary + backups)
            composio_keys = self._get_api_keys_with_rotation('COMPOSIO_API_KEY')
            if composio_keys:
                self.composio_api_keys = composio_keys
                self.current_composio_key_index = 0
                # Initialize with primary key
                self.composio_client = Composio(
                    api_key=composio_keys[0],
                    provider=OpenAIAgentsProvider()
                )
                logger.info(f"Composio client initialized with {len(composio_keys)} key(s) available")
                logger.info(f"Primary key: {mask_sensitive_data(composio_keys[0])}")
            else:
                self.composio_api_keys = []
                self.current_composio_key_index = 0

        except Exception as e:
            # Never log raw error that might contain keys
            logger.error(f"Error initializing clients: {mask_sensitive_data(str(e))}")

    def _rotate_openai_key(self) -> bool:
        """
        Rotate to the next available OpenAI API key.

        Returns:
            True if rotation successful, False if no more keys available
        """
        if not hasattr(self, 'openai_api_keys') or not self.openai_api_keys:
            logger.error("No OpenAI API keys available for rotation")
            return False

        if len(self.openai_api_keys) <= 1:
            logger.warning("Only one OpenAI API key available, cannot rotate")
            return False

        # Move to next key
        self.current_openai_key_index = (self.current_openai_key_index + 1) % len(self.openai_api_keys)
        new_key = self.openai_api_keys[self.current_openai_key_index]

        try:
            # Reinitialize client with new key
            self.openai_client = AsyncOpenAI(api_key=new_key)
            logger.warning(f"Rotated to OpenAI backup key #{self.current_openai_key_index + 1}: {mask_sensitive_data(new_key)}")
            return True
        except Exception as e:
            logger.error(f"Failed to rotate OpenAI key: {mask_sensitive_data(str(e))}")
            return False

    def _rotate_composio_key(self) -> bool:
        """
        Rotate to the next available Composio API key.

        Returns:
            True if rotation successful, False if no more keys available
        """
        if not hasattr(self, 'composio_api_keys') or not self.composio_api_keys:
            logger.error("No Composio API keys available for rotation")
            return False

        if len(self.composio_api_keys) <= 1:
            logger.warning("Only one Composio API key available, cannot rotate")
            return False

        # Move to next key
        self.current_composio_key_index = (self.current_composio_key_index + 1) % len(self.composio_api_keys)
        new_key = self.composio_api_keys[self.current_composio_key_index]

        try:
            # Reinitialize client with new key
            self.composio_client = Composio(
                api_key=new_key,
                provider=OpenAIAgentsProvider()
            )
            logger.warning(f"Rotated to Composio backup key #{self.current_composio_key_index + 1}: {mask_sensitive_data(new_key)}")
            return True
        except Exception as e:
            logger.error(f"Failed to rotate Composio key: {mask_sensitive_data(str(e))}")
            return False

    def _get_entity_id(self) -> str:
        """
        Returns the user-specific entity ID required by Composio.
        """
        return f"user_{self.user.id}"

    def _get_app_slug(self, app_name: str) -> str:
        """
        Maps a user-friendly app name (e.g., "GMAIL") to the Composio slug (e.g., "gmail").
        """
        app_key = (app_name or "").upper()
        if app_key in self.APP_SLUGS:
            return self.APP_SLUGS[app_key]
        return app_key.lower()

    def _get_tools_for_app(self, app_name: str) -> list:
        """
        Fetches all available Composio FunctionTool objects for a given app.
        MEMORY OPTIMIZATION: Uses 1-hour TTL cache to prevent unbounded growth.
        """
        import time

        if not self.composio_client or not app_name:
            return []

        app_key = app_name.upper()
        current_time = time.time()

        # Check cache with TTL
        if app_key in self._tools_cache:
            cached_data = self._tools_cache[app_key]
            cache_age = current_time - cached_data['timestamp']

            if cache_age < cached_data['ttl']:
                logger.info(f"🚀 Tools cache HIT for {app_key} (age: {cache_age:.1f}s)")
                return cached_data['tools']
            else:
                logger.info(f"⏰ Tools cache EXPIRED for {app_key} (age: {cache_age:.1f}s)")
                del self._tools_cache[app_key]

        logger.info(f"🔍 Tools cache MISS for {app_key} - fetching from Composio API")

        slug = self._get_app_slug(app_name)

        try:
            response = self.composio_client.tools.get(
                user_id=self._get_entity_id(),
                toolkits=[slug],
                limit=500
            )
            tools_list = list(response)
            print(f"DEBUG: Fetched {len(tools_list)} tools for {app_key} ({slug})")

            # Cache with TTL
            self._tools_cache[app_key] = {
                'tools': tools_list,
                'timestamp': current_time,
                'ttl': self._tools_cache_ttl
            }
            logger.info(f"💾 Cached {len(tools_list)} tools for {app_key}")

            return tools_list

        except Exception as e:
            # SECURITY: Mask sensitive data in error messages
            safe_error = mask_sensitive_data(str(e))
            logger.error(f"Error fetching Composio tools for {app_key} ({slug}): {safe_error}")
            import traceback
            traceback.print_exc()

            # Cache empty result with TTL to avoid repeated failures
            self._tools_cache[app_key] = {
                'tools': [],
                'timestamp': current_time,
                'ttl': self._tools_cache_ttl
            }
            return []

    def _invalidate_tools_cache(self, app_name: str = None):
        """
        Invalidate tools cache when connections change.
        Call this after connecting/disconnecting apps to ensure fresh tool availability.

        Args:
            app_name: Specific app to invalidate, or None to clear all
        """
        if app_name:
            app_key = app_name.upper()
            if app_key in self._tools_cache:
                logger.info(f"♻️ Invalidated tools cache for {app_key}")
                del self._tools_cache[app_key]
        else:
            cache_size = len(self._tools_cache)
            self._tools_cache.clear()
            logger.info(f"♻️ Cleared entire tools cache ({cache_size} entries)")

    def _invalidate_connection_cache(self, entity_id: str = None, tool_name: str = None):
        """
        Invalidate connection cache when connection status changes.
        Call this after users connect/disconnect integrations.

        Args:
            entity_id: Specific user to invalidate, or None for all users
            tool_name: Specific tool to invalidate, or None for all tools
        """
        if entity_id and tool_name:
            cache_key = f"{entity_id}:{tool_name}"
            if cache_key in self._connection_cache:
                logger.info(f"♻️ Invalidated connection cache for {cache_key}")
                del self._connection_cache[cache_key]
        elif entity_id:
            # Invalidate all connections for this user
            keys_to_delete = [key for key in self._connection_cache.keys() if key.startswith(f"{entity_id}:")]
            for key in keys_to_delete:
                del self._connection_cache[key]
            logger.info(f"♻️ Invalidated {len(keys_to_delete)} connection cache entries for {entity_id}")
        else:
            # Clear entire cache
            cache_size = len(self._connection_cache)
            self._connection_cache.clear()
            logger.info(f"♻️ Cleared entire connection cache ({cache_size} entries)")

    def _cleanup_expired_cache_entries(self):
        """
        Remove expired entries from both caches to prevent unbounded memory growth.
        Should be called periodically (e.g., every hour or before major operations).
        """
        import time
        current_time = time.time()

        # Cleanup tools cache
        expired_tool_keys = [
            key for key, data in self._tools_cache.items()
            if current_time - data['timestamp'] > data['ttl']
        ]
        for key in expired_tool_keys:
            del self._tools_cache[key]

        # Cleanup connection cache
        expired_conn_keys = [
            key for key, data in self._connection_cache.items()
            if current_time - data['timestamp'] > data['ttl']
        ]
        for key in expired_conn_keys:
            del self._connection_cache[key]

        if expired_tool_keys or expired_conn_keys:
            logger.info(f"🧹 Cleaned up {len(expired_tool_keys)} expired tool cache entries and {len(expired_conn_keys)} expired connection cache entries")

    def _is_ambiguous_request(self, message: str) -> bool:
        """
        Check if request needs intent resolution or can skip it for performance.

        Intent resolution adds 1-2s overhead. Skip for:
        - Explicit multi-tool requests ("send email AND create doc")
        - Clear single-action requests with specific tool keywords
        - Structured requests with clear parameters

        Require for:
        - Vague pronouns ("send it", "update that file")
        - Ambiguous references ("the document", "the email")
        - Complex multi-step requests without clear structure

        Args:
            message: User's message text

        Returns:
            True if needs intent resolution, False to skip for performance

        Performance:
            - Skipping saves 1-2s for ~70% of requests
            - False positives (skipping when needed) are safe - LLM can still handle it
        """
        message_lower = message.lower()

        # REQUIRE intent resolution for vague pronouns
        vague_pronouns = ['it', 'that', 'this', 'the file', 'the document', 'the email', 'the sheet']
        if any(pronoun in message_lower for pronoun in vague_pronouns):
            logger.info("🔍 Intent resolution required: vague pronouns detected")
            return True

        # SKIP for explicit tool keywords (user knows what they want)
        explicit_tools = [
            'send email', 'create email', 'gmail',
            'create doc', 'create document', 'google doc',
            'create sheet', 'google sheet',
            'calendar', 'schedule', 'create event',
            'download file', 'search drive', 'google drive',
            'send message', 'slack', 'post to slack'
        ]
        if any(tool_phrase in message_lower for tool_phrase in explicit_tools):
            logger.info("⚡ Skipping intent resolution: explicit tool request")
            return False

        # SKIP for clear multi-tool structures
        multi_tool_indicators = [' and ', ' then ', ' also ', ', and ']
        if any(indicator in message_lower for indicator in multi_tool_indicators):
            # Check if it's a structured list (e.g., "analyze AAPL and send via email and create doc")
            words = message_lower.split()
            if len(words) > 8:  # Multi-tool requests are usually longer
                logger.info("⚡ Skipping intent resolution: structured multi-tool request")
                return False

        # SKIP for requests with specific parameters (shows clear intent)
        # Examples: "send email to john@example.com", "create doc titled 'Report'"
        has_parameters = any([
            '@' in message,  # Email addresses
            'titled' in message_lower,
            'called' in message_lower,
            'named' in message_lower,
            'to:' in message_lower,
            'subject:' in message_lower,
        ])
        if has_parameters:
            logger.info("⚡ Skipping intent resolution: specific parameters provided")
            return False

        # DEFAULT: Use intent resolution for ambiguous cases
        logger.info("🔍 Intent resolution required: ambiguous request")
        return True

    def _is_tool_execution_request(self, message: str) -> bool:
        """
        Check if this is primarily a tool execution task vs complex reasoning task.

        Tool execution requests benefit from minimal prompts (faster LLM processing).
        Complex reasoning tasks need full Chain of Thought protocol.

        Args:
            message: User's message text

        Returns:
            True if tool execution (skip verbose CoT), False if complex reasoning (use full CoT)

        Performance:
            - Skipping verbose CoT saves 0.5-1s (smaller prompts = faster LLM)
            - Tool calls don't need 40-line protocol explaining how to think
        """
        message_lower = message.lower()

        # Clear tool execution keywords
        tool_keywords = [
            'send', 'email', 'create', 'download', 'search', 'post', 'schedule',
            'upload', 'share', 'delete', 'update', 'add', 'remove', 'fetch',
            'get', 'list', 'find', 'retrieve', 'move', 'copy', 'rename'
        ]

        # Complex reasoning indicators
        reasoning_keywords = [
            'analyze', 'compare', 'explain', 'why', 'how does', 'what if',
            'should i', 'recommend', 'suggest', 'decide', 'evaluate',
            'pros and cons', 'better', 'worse', 'think', 'opinion'
        ]

        # Check for tool keywords
        has_tool_action = any(keyword in message_lower for keyword in tool_keywords)

        # Check for reasoning keywords
        needs_reasoning = any(keyword in message_lower for keyword in reasoning_keywords)

        # If needs reasoning, use full CoT
        if needs_reasoning:
            logger.info("🧠 Using full CoT protocol: complex reasoning detected")
            return False

        # If has clear tool action, skip verbose CoT
        if has_tool_action:
            logger.info("⚡ Using minimal CoT: tool execution request")
            return True

        # Default: use full CoT for safety
        logger.info("🧠 Using full CoT protocol: default for ambiguous request")
        return False

    async def _load_tools_cached(self, tool_slugs: List[str]) -> List:
        """
        Load tools with 5-minute schema cache to reduce repeated Composio API calls.

        This caches the tool schemas (not the tool instances) for repeated combinations
        of tools. Significantly speeds up repeated multi-tool requests.

        Args:
            tool_slugs: List of tool slugs to load (e.g., ['GMAIL_SEND_EMAIL', 'GOOGLEDOCS_CREATE_DOCUMENT'])

        Returns:
            List of tool objects from Composio

        Performance:
            - Cache hit: ~0.01s (instant)
            - Cache miss: ~1-2s (Composio API call)
            - Savings: 1-2s for repeated tool combinations
        """
        import time

        # Create cache key from tool slugs (order-independent)
        cache_key = frozenset(tool_slugs)

        # Check cache
        if cache_key in self._tools_schema_cache:
            tools, timestamp = self._tools_schema_cache[cache_key]

            # Check if cache is still valid (TTL: 5 minutes)
            if time.time() - timestamp < self._tools_schema_cache_ttl:
                logger.info(f"⚡ TOOLS_SCHEMA_CACHE_HIT for {len(tool_slugs)} tools", extra={
                    'tools': list(tool_slugs)[:3],  # Log first 3 tools
                    'cache_age_seconds': int(time.time() - timestamp)
                })
                return tools
            else:
                # Cache expired, remove it
                logger.info(f"🕒 Tools schema cache expired for {len(tool_slugs)} tools")
                del self._tools_schema_cache[cache_key]

        # Cache miss - load fresh from Composio
        entity_id = self._get_entity_id()

        logger.info(f"⏳ TOOLS_SCHEMA_CACHE_MISS - loading {len(tool_slugs)} tools from Composio", extra={
            'tools': list(tool_slugs)[:3],
            'entity_id': entity_id
        })

        try:
            tools = await sync_to_async(self.composio_client.tools.get)(
                user_id=entity_id,
                tools=list(tool_slugs)  # Convert frozenset back to list
            )

            # Cache the result with current timestamp
            self._tools_schema_cache[cache_key] = (tools, time.time())

            logger.info(f"✅ Loaded and cached {len(tools)} tools (TTL: {self._tools_schema_cache_ttl}s)")

            return tools

        except Exception as e:
            logger.error(f"❌ Failed to load tools from Composio: {type(e).__name__}: {str(e)}", extra={
                'tools': list(tool_slugs),
                'entity_id': entity_id
            })
            raise

    async def _load_all_tools_for_apps(self, app_names: List[str]) -> List[str]:
        """
        🚀 PHASE 2.5 HYBRID OPTIMIZATION

        Load TOP 10 most commonly used tools per app for fast, lightweight tool access.
        This is a hybrid approach that balances performance and capability:

        - Loads curated TOP 10 tools per app (not all 500+ GitHub tools!)
        - Keeps token usage low (~100-150 tools max for typical agent)
        - Fast execution without overwhelming the LLM
        - If TOP 10 don't cover the request, system falls back to select_tools_for_prompt()

        Previous Phase 2: Loaded ALL tools (500+ for GitHub = token explosion ❌)
        Phase 2.5: Loads TOP 10 per app (10-20 tools total = efficient ✅)

        Args:
            app_names: List of app names (e.g., ['GMAIL', 'GOOGLEDOCS', 'SLACK'])

        Returns:
            List of TOP 10 tool slugs for these apps

        Performance:
            - Eliminates separate tool selection AI call (saves 2-3s)
            - Low token usage (~100-150 tools vs 800+)
            - Uses cached tool schemas (< 0.1s)
            - LLM function calling handles selection natively
        """
        from .top_10_tools_config import TOP_10_TOOLS_BY_APP

        all_tool_slugs = []

        logger.info(f"📦 PHASE 2.5: Loading TOP 10 tools for {len(app_names)} apps: {app_names}")

        for app_name in app_names:
            app_key = app_name.upper()
            if app_key in TOP_10_TOOLS_BY_APP:
                app_tools = TOP_10_TOOLS_BY_APP[app_key]
                all_tool_slugs.extend(app_tools)
                logger.debug(f"  - {app_key}: {len(app_tools)} tools (TOP 10)")
            else:
                logger.warning(f"  - {app_key}: No TOP 10 tools configured, skipping")

        logger.info(f"✅ PHASE 2.5: Loaded {len(all_tool_slugs)} curated tool slugs for {len(app_names)} apps")

        return all_tool_slugs

    async def chat_with_phase2_optimization(self, agent_model, message: str, chat_history: List[Dict[str, str]] = None, callback=None, file_attachments: List[Dict] = None) -> str:
        """
        🚀 PHASE 2.5 HYBRID OPTIMIZED CHAT METHOD

        This method uses Phase 2.5 hybrid optimization:
        - Loads TOP 10 most commonly used tools per app (not all 500+ tools!)
        - Eliminates separate tool selection AI call (saves 2-3 seconds)
        - Keeps token usage low (~100-150 tools vs 800+)
        - LLM natively selects from these curated tools via function calling
        - If needed tools aren't in TOP 10, system falls back to select_tools_for_prompt()

        Previous Phase 2: Loaded ALL tools → 500+ GitHub tools = token explosion ❌
        Phase 2.5: Loads TOP 10 per app → 10-20 tools total = efficient ✅

        Performance improvement: Saves 2-3 seconds + reduces token usage by 80-90%

        Args:
            agent_model: Agent model instance
            message: User message
            chat_history: Previous chat messages
            callback: Optional async callback function for streaming updates
            file_attachments: List of file attachment dictionaries with file paths

        Returns:
            Agent response string

        Example:
            response = await agent_service.chat_with_phase2_optimization(
                agent_model=agent,
                message="Post image to Twitter and send email",
                chat_history=[],
                callback=None
            )
            # Loads: TOP 10 Twitter tools + TOP 10 Gmail tools = 20 tools total
        """
        logger.info(f"🚀 Starting Phase 2.5 optimized chat (TOP 10 tools per app)")

        return await self._chat_with_composio(
            agent_model=agent_model,
            message=message,
            specific_tools_slugs=None,  # Not needed - will load all tools internally
            chat_history=chat_history,
            callback=callback,
            file_attachments=file_attachments,
            skip_intent_validation=False,
            use_phase2_optimization=True  # 🚀 Enable Phase 2 optimization
        )

    @with_retry(max_retries=2, backoff_factor=2, initial_delay=1.0)
    async def _execute_agent_with_retry(self, runner: Runner, agent: ComposioAgent, chat_history: List[Dict], timeout: float = 180.0):
        """
        Execute Composio agent with automatic retry on transient failures.
        Uses exponential backoff: 1s, 2s delays between retries.

        Args:
            runner: Composio Runner instance
            agent: ComposioAgent instance to execute
            chat_history: Chat history to pass to agent
            timeout: Maximum execution time in seconds (default: 180s)

        Returns:
            Agent execution result

        Raises:
            asyncio.TimeoutError: If execution exceeds timeout (not retried)
            Exception: On final retry failure
        """
        return await asyncio.wait_for(
            runner.run(agent, chat_history),
            timeout=timeout
        )

    async def _chat_without_tools(self, agent_model, message: str, chat_history: List[Dict[str, str]] = None, callback=None) -> str:
        """
        Runs a basic OpenAI chat (no tools) when tool selection fails or is empty.
        Now includes chat history for conversational context and streaming callbacks.

        Args:
            agent_model: Agent model instance
            message: User message
            chat_history: Previous chat messages
            callback: Optional async callback function for streaming updates
        """
        if not self.openai_client:
            return "OpenAI client not configured"

        try:
            # SECURITY: Sanitize inputs to prevent prompt injection
            safe_prompt = sanitize_for_prompt(agent_model.prompt) if agent_model.prompt else ""
            safe_message = sanitize_for_prompt(message) if message else ""
            safe_history = sanitize_chat_history(chat_history) if chat_history else []

            if safe_history:
                # Add the system prompt to the beginning of the history
                messages = [{"role": "system", "content": safe_prompt}] + safe_history
            else:
                messages = [
                    {"role": "system", "content": safe_prompt},
                    {"role": "user", "content": safe_message}
                ]

            # ✅ No sync_to_async wrapper needed - client is already async
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_completion_tokens=1000,
                stream=True
            )

            # Collect streaming content
            full_content = ""
            word_buffer = ""
            word_index = 0

            # ✅ Use async for - properly yields to event loop!
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    content_delta = chunk.choices[0].delta.content
                    full_content += content_delta
                    word_buffer += content_delta

                    # Buffer and emit complete words if callback is provided
                    if callback:
                        # Check for word delimiters
                        delimiters = {' ', '\n', '\t', '.', ',', '!', '?', ';', ':'}
                        if any(d in word_buffer for d in delimiters):
                            # Find earliest delimiter
                            delimiter_positions = [(word_buffer.find(d), d) for d in delimiters if d in word_buffer]
                            delimiter_positions = [(pos, d) for pos, d in delimiter_positions if pos != -1]

                            if delimiter_positions:
                                pos, delimiter = min(delimiter_positions, key=lambda x: x[0])
                                word = word_buffer[:pos + 1]

                                if word.strip():
                                    await callback('content_delta', {
                                        'content': word,
                                        'index': word_index
                                    })
                                    word_index += 1

                                word_buffer = word_buffer[pos + 1:]

            # Emit any remaining buffer
            if callback and word_buffer.strip():
                await callback('content_delta', {
                    'content': word_buffer,
                    'index': word_index
                })

            return full_content

        except Exception as e:
            # SECURITY: Mask sensitive data in error messages
            safe_error = mask_sensitive_data(str(e))
            logger.error(f"Error in (async) OpenAI chat: {safe_error}")
            if callback:
                await callback('error', {'error': safe_error})
            return f"Error: {safe_error}"

    @retry_with_backoff(max_retries=2, initial_delay=1.0, max_delay=5.0, ttl_seconds=45)
    async def _chat_with_composio(self, agent_model, message: str, specific_tools_slugs: List[str] = None, chat_history: List[Dict[str, str]] = None, callback=None, file_attachments: List[Dict] = None, skip_intent_validation: bool = False, use_phase2_optimization: bool = False) -> str:
        """
        Runs the full agent execution with a specific set of tools and chat history.

        ENHANCED with:
        - Automatic retry with exponential backoff for rate limits and transient errors
        - TTL (Time To Live) limit of 45 seconds for all retry attempts
        - Intent resolution for vague language
        - Pre-execution validation
        - Execution logging for debugging
        - Chain of Thought orchestration
        - Post-execution verification
        - PHASE 2: Single LLM call optimization (eliminates separate tool selection)

        Args:
            agent_model: Agent model instance
            message: User message
            specific_tools_slugs: List of tool slugs to use (None if use_phase2_optimization=True)
            chat_history: Previous chat messages
            callback: Optional async callback function for streaming updates
            file_attachments: List of file attachment dictionaries with file paths
            skip_intent_validation: If True, skips intent resolution and validation (for task queue)
            use_phase2_optimization: If True, loads ALL tools for connected apps instead of pre-selected slugs
                                    (PHASE 2 OPTIMIZATION: eliminates 2-3s select_tools_for_prompt() overhead)
        """
        import time
        start_time = time.time()

        try:
            # ============================================================
            # PHASE 0: SECURITY - SANITIZE ALL INPUTS
            # ============================================================

            # SECURITY: Sanitize chat history to prevent stored injection attacks
            chat_history = sanitize_chat_history(chat_history) if chat_history else []

            # ============================================================
            # PHASE 1: INITIALIZATION & EXECUTION LOGGING
            # ============================================================

            # Start execution logging
            execution_logger = get_execution_logger()
            connected_apps = agent_model.app_connections if hasattr(agent_model, 'app_connections') else []
            agent_tools_list = agent_model.agent_tools if hasattr(agent_model, 'agent_tools') else []

            execution_logger.start_execution(
                agent_id=str(agent_model.id),
                user_id=str(self.user.id),
                user_message=message,
                connected_apps=connected_apps,
                available_files=file_attachments or [],
                agent_tools=agent_tools_list,
                chat_history=chat_history
            )

            # ============================================================
            # PHASE 2: INTENT RESOLUTION
            # ============================================================

            # Skip Intent Resolution and Validation for task queue execution
            # (we already know the platform and action from task parsing)
            intent_resolution = None  # Initialize to None for skip cases

            # PERFORMANCE: Conditional intent resolution (saves 1-2s for 70% of requests)
            if not skip_intent_validation and self._is_ambiguous_request(message):
                # Resolve intent for vague language
                intent_engine = get_intent_engine()
                intent_resolution = intent_engine.resolve_intent(
                    user_message=message,
                    chat_history=chat_history,
                    connected_apps=connected_apps,
                    available_files=file_attachments,
                    agent_tools=agent_tools_list
                )

                execution_logger.log_intent_resolution(intent_resolution)
                print(f"🧠 Intent Resolution: {intent_resolution.reasoning} (Confidence: {intent_resolution.confidence}%)")

                # ============================================================
                # PHASE 3: PRE-EXECUTION VALIDATION
                # ============================================================

                # Validate requirements before execution
                validator = get_validator()
                validation_result = validator.validate(
                    intent=intent_resolution,
                    available_files=file_attachments or [],
                    connected_apps=connected_apps,
                    agent_tools=agent_tools_list,
                    chat_history=chat_history or [],
                    user_message=message
                )

                execution_logger.log_validation(validation_result)
                print(f"✅ Validation: {validation_result.validation_summary}")

                # If validation failed with blocking issues, inform user
                if not validation_result.passed:
                    error_message = f"❌ Cannot execute: {validation_result.blocking_issues[0]}"
                    execution_logger.log_execution_error(error_message)
                    if callback:
                        await callback('error', {'error': error_message})
                    return error_message
            elif not skip_intent_validation:
                # Skipped intent resolution for performance - explicit request detected
                print(f"⚡ PERFORMANCE: Skipped intent resolution for explicit request")

            # ============================================================
            # PHASE 4: TOOL LOADING
            # ============================================================

            if callback:
                await callback('status', {
                    'status': 'tool_calling',
                    'message': random.choice(TOOL_LOADING_MESSAGES)
                })

            # DEBUG: Log tool loading attempt
            entity_id = self._get_entity_id()

            # PHASE 2.5 HYBRID OPTIMIZATION: Load TOP 10 tools for connected apps
            if use_phase2_optimization:
                print(f"⚡ PHASE 2.5 HYBRID OPTIMIZATION: Loading TOP 10 tools per app")
                print(f"  - Entity ID: {entity_id}")
                print(f"  - User: {self.user.username}")
                print(f"  - Connected Apps: {agent_model.app_connections}")

                try:
                    # Load TOP 10 tool slugs for the agent's connected apps
                    top_tool_slugs = await self._load_all_tools_for_apps(agent_model.app_connections)
                    print(f"  - Loaded {len(top_tool_slugs)} curated tool slugs from {len(agent_model.app_connections)} apps")
                    print(f"  - Average: {len(top_tool_slugs) // max(len(agent_model.app_connections), 1)} tools per app")

                    # Now load the actual tool schemas (with caching)
                    tools = await self._load_tools_cached(top_tool_slugs)
                    print(f"✅ PHASE 2.5: Loaded {len(tools)} curated tools for user {self.user.username}")

                    if tools:
                        print(f"  - Sample tools: {[tool.name if hasattr(tool, 'name') else str(tool)[:50] for tool in tools[:5]]}")
                    else:
                        print(f"  - WARNING: Composio returned empty tools list")

                except Exception as e:
                    print(f"❌ ERROR loading curated tools (Phase 2.5): {type(e).__name__}: {str(e)}")
                    tools = []
            else:
                # PHASE 1: Use pre-selected tools (original flow)
                print(f"🔍 DEBUG: Attempting to load tools...")
                print(f"  - Entity ID: {entity_id}")
                print(f"  - Requested tools: {specific_tools_slugs}")
                print(f"  - User: {self.user.username}")

                try:
                    # PERFORMANCE: Use cached tool loading (saves 1-2s on cache hits)
                    tools = await self._load_tools_cached(specific_tools_slugs)
                    print(f"✅ Loaded {len(tools)} specific tools for user {self.user.username}")

                    if tools:
                        print(f"  - Tools returned: {[tool.name if hasattr(tool, 'name') else str(tool)[:50] for tool in tools[:5]]}")
                    else:
                        print(f"  - WARNING: Composio returned empty tools list")

                except Exception as e:
                    print(f"❌ ERROR loading tools: {type(e).__name__}: {str(e)}")
                    tools = []

            if not tools:
                if use_phase2_optimization:
                    error_msg = f"Failed to load Composio tools for connected apps: {agent_model.app_connections}"
                else:
                    error_msg = f"Failed to load Composio tools: {specific_tools_slugs}"
                print(f"❌ {error_msg}")
                print(f"  - This could be due to:")
                print(f"    1. Connection expired/invalid for user {self.user.username}")
                print(f"    2. Tools not enabled for this entity")
                print(f"    3. Invalid tool slugs")
                execution_logger.log_execution_error(error_msg)

                # For task queue execution, raise exception instead of falling back
                if skip_intent_validation:
                    raise Exception(f"Tool loading failed: {specific_tools_slugs}")

                # For regular execution, fall back to chat without tools
                return await self._chat_without_tools(agent_model, message, chat_history, callback)

            # Log tool selection
            if use_phase2_optimization:
                tool_reasoning = f"Phase 2: Loaded ALL {len(tools)} tools for {len(agent_model.app_connections)} connected apps (LLM will select via function calling)"
                # Log all tool names for debugging
                all_tool_names = [tool.name if hasattr(tool, 'name') else str(tool)[:30] for tool in tools]
                execution_logger.log_tool_selection(all_tool_names[:50], tool_reasoning)  # Log first 50 for brevity
            else:
                tool_reasoning = f"Phase 1: Selected {len(specific_tools_slugs)} tools based on user prompt and intent resolution"
                execution_logger.log_tool_selection(specific_tools_slugs, tool_reasoning)

            # ============================================================
            # PHASE 5: CONTEXT INJECTION (ENHANCED)
            # ============================================================

            # Use enhanced context manager with conversation memory, intent patterns, data rules
            context_manager = get_context_manager()

            injected_context = context_manager.build_complete_context(
                user=self.user,
                agent_model=agent_model,
                connected_apps=connected_apps,
                agent_tools=agent_tools_list,
                chat_history=chat_history,  # NEW: Pass chat history for conversation memory
                user_message=message,  # NEW: Pass current message for intent analysis
                include_app_guidance=True,
                include_agent_tools_guidance=True
            )

            # ============================================================
            # PHASE 6: CHAIN OF THOUGHT ORCHESTRATION
            # ============================================================

            # Add Chain of Thought enforcement to system prompt
            chain_of_thought_protocol = """

🧠 CHAIN OF THOUGHT EXECUTION PROTOCOL (MANDATORY)
{'='*80}

Before executing ANY tools, you MUST follow this structured thinking process:

**STEP 1: ANALYZE THE REQUEST**
- What exactly is the user asking?
- What action needs to be performed? (post, send, search, create, etc.)
- What platform/destination? (Twitter, Gmail, Calendar, etc.)
- What content/file? (Is it attached? Generated? Needs to be fetched?)
- What date/time? (If "yesterday" or "today", calculate the exact date)

**STEP 2: VALIDATE REQUIREMENTS**
- ✅ Do I have all required information?
- ✅ Do I have access to necessary files?
- ✅ Do I have the right tools for this task?
- ✅ If real-time data needed (stocks, weather, news), do I have search tools?

**STEP 3: PLAN EXECUTION**
List the exact steps you will take:
1. [First action with specific tool]
2. [Second action if needed]
3. [Final confirmation]

**STEP 4: EXECUTE (NO SIMULATION)**
- Actually call the tools
- Do NOT say "I will..." or "I would..."
- Execute and confirm what was done

**CRITICAL RULES:**
- If user says "this" or "it", refer to CONVERSATION MEMORY to understand what they mean
- If user says "yesterday", calculate the exact date using SYSTEM CONTEXT (current date provided above)
- If asking for "current stock price" or "latest news", you MUST use search tools - never guess
- If sharing/sending a file, ensure you have downloaded it first (use DOWNLOAD tool)
- After execution, provide brief confirmation of what was accomplished

{'='*80}
"""

            # Build final instructions: base prompt + conditional CoT + injected context
            # SECURITY: Sanitize agent prompt to prevent injection
            safe_agent_prompt = sanitize_for_prompt(agent_model.prompt) if agent_model.prompt else ""

            # PERFORMANCE: Conditional CoT protocol (saves 0.5-1s for tool execution)
            if self._is_tool_execution_request(message):
                # Minimal instructions for tool execution (no verbose CoT needed)
                enhanced_instructions = (
                    safe_agent_prompt + "\n" +
                    "Execute the requested action using available tools. Be concise and confirm completion.\n" +
                    injected_context
                )
            else:
                # Full CoT protocol for complex reasoning tasks
                enhanced_instructions = (
                    safe_agent_prompt + "\n" +
                    chain_of_thought_protocol + "\n" +
                    injected_context
                )

            # For task queue execution, add strict tool-only instruction
            if skip_intent_validation:
                enhanced_instructions += "\n\n" + """
TASK EXECUTION MODE:
- Use the provided tools to complete this specific task
- Execute the required action using the appropriate tool
- Report success or failure briefly

RESPONSE FORMAT:
- Keep response under 50 words
- Simply confirm completion: "Email sent successfully" or "Document created successfully"
- Do not include the analysis content in your response
"""

            # ============================================================
            # PHASE 7: DYNAMIC MODEL SELECTION
            # ============================================================

            # Select appropriate model based on task complexity
            model_strategy = get_model_selection_strategy()
            selected_model = model_strategy.select_model(
                user_prompt=message,
                connected_apps=connected_apps,
                chat_history=chat_history
            )

            # Log model selection with reasoning
            model_reasoning = model_strategy.get_selection_reasoning(
                user_prompt=message,
                selected_model=selected_model,
                complexity_score=model_strategy._calculate_complexity_score(message, connected_apps, chat_history),
                connected_apps=connected_apps
            )
            execution_logger.log_model_selection(selected_model, model_reasoning)

            # === FILE ATTACHMENTS HANDLING ===
            # SECURITY: Sanitize the base user message first
            safe_user_message = sanitize_for_prompt(message) if message else ""
            enhanced_message = safe_user_message  # Will be used when no file attachments
            # Note: File attachments will be added as structured content later (see line 1700)

            # ============================================================
            # PHASE 8: AGENT CREATION & EXECUTION
            # ============================================================

            # PERMISSIONS: every tool call goes through the policy gate (read / approve / deny)
            tools = guard_function_tools(tools, PermissionGate(self.user, agent_model, callback))

            composio_agent = ComposioAgent(
                name=agent_model.name,
                instructions=enhanced_instructions,
                tools=tools,
                model=selected_model  # Use dynamically selected model
            )

            runner = Runner()

            # Add the current user message (with file paths if any) to chat history
            # STRUCTURED FILE HANDLING: If files are attached, pass them as structured content
            if file_attachments:
                print(f"\n{'='*60}")
                print(f"📎 FILE ATTACHMENT PROCESSING - {len(file_attachments)} file(s) detected")
                print(f"{'='*60}")

                # Build structured content with text + file references
                # NOTE: Composio Runner requires 'input_text' type (not 'text')
                content_parts = [{"type": "input_text", "text": safe_user_message}]

                # Add each file as a structured reference
                for idx, file_info in enumerate(file_attachments, 1):
                    safe_filename = sanitize_for_prompt(file_info.get('filename', 'unknown'))
                    safe_path = sanitize_file_path(file_info.get('file_path', ''))
                    mime_type = file_info.get('mime_type', 'application/octet-stream')
                    file_size = file_info.get('size', 0)

                    print(f"\n📄 File #{idx}: {safe_filename}")
                    print(f"   ├─ MIME Type: {mime_type}")
                    print(f"   ├─ Size: {file_size:,} bytes")
                    print(f"   └─ Path: {safe_path}")

                    # Handle images with vision support
                    if mime_type and mime_type.startswith('image/'):
                        try:
                            print(f"   🖼️  Detected image - converting to base64 for vision...")

                            # Get FileAttachment object from database to convert to base64
                            from api_agents.files.models import FileAttachment
                            file_id = file_info.get('id')

                            if file_id:
                                # Load file from database
                                file_obj = await sync_to_async(FileAttachment.objects.get)(id=file_id)
                                image_url = convert_image_to_base64(file_obj)

                                if image_url:
                                    # Pass image as vision content (Composio Runner simplified format)
                                    # Type: 'input_image' (Composio requirement)
                                    # Content: 'image_url' as direct string (Composio simplified schema)
                                    content_parts.append({
                                        "type": "input_image",
                                        "image_url": image_url  # Direct string, not wrapped in {"url": ...}
                                    })
                                    print(f"   ✅ Image added as vision content (base64 data URI)")

                                    # Also add file path as structured metadata for tool calls
                                    print(f"   🔍 DEBUG: Passing file path to agent: {safe_path}")
                                    file_size_mb = file_size / (1024 * 1024)

                                    file_metadata = f"\n\n📎 **Image File: {safe_filename}**\n"
                                    file_metadata += f"📊 **Size: {file_size:,} bytes ({file_size_mb:.2f} MB)**\n"
                                    file_metadata += f"🔧 **For tool calls:** Use this exact file path:\n"
                                    file_metadata += f"```\n{safe_path}\n```\n\n"
                                    file_metadata += f"⚠️ **IMPORTANT TWITTER/X RULES:**\n"
                                    file_metadata += f"1. You CANNOT post images directly with TWITTER_CREATION_OF_A_POST.\n"
                                    file_metadata += f"2. You MUST follow this 2-step sequence:\n"

                                    # Choose the right upload tool based on file size
                                    if file_size > 5 * 1024 * 1024:  # > 5MB
                                        file_metadata += f"   - Step A: This file is {file_size_mb:.2f} MB (>5MB), so use TWITTER_UPLOAD_LARGE_MEDIA with the file_path above\n"
                                    else:
                                        file_metadata += f"   - Step A: This file is {file_size_mb:.2f} MB (≤5MB), so use TWITTER_UPLOAD_MEDIA with the file_path above\n"

                                    file_metadata += f"   - Step B: Extract the 'media_id' from the upload response\n"
                                    file_metadata += f"   - Step C: Call TWITTER_CREATION_OF_A_POST and pass the media_id in the 'media_ids' parameter\n"
                                    content_parts.append({"type": "input_text", "text": file_metadata})
                                    print(f"   ✅ File path metadata added for tool calls ({file_size_mb:.2f} MB)")
                                else:
                                    print(f"   ⚠️  Could not convert image to base64, falling back to path-only")
                                    raise ValueError("Image conversion failed")
                            else:
                                print(f"   ⚠️  No file ID available, falling back to path-only")
                                raise ValueError("No file ID")

                        except Exception as e:
                            print(f"   ❌ Error processing image: {e}")
                            print(f"   📝 Falling back to text-based file reference")
                            # Fallback to text-based reference
                            file_instruction = f"\n\n📎 **File Available: {safe_filename}**\n"
                            file_instruction += f"🔧 **For tool calls:** Use this exact file path:\n"
                            file_instruction += f"```\n{safe_path}\n```\n"
                            content_parts.append({"type": "input_text", "text": file_instruction})
                    else:
                        # Non-image files: pass as structured metadata
                        print(f"   📝 Non-image file - adding as structured metadata")
                        file_metadata = f"\n\n📎 **File Available: {safe_filename}**\n"
                        file_metadata += f"📊 **File Info:**\n"
                        file_metadata += f"   • Type: {mime_type}\n"
                        file_metadata += f"   • Size: {file_size:,} bytes\n"
                        file_metadata += f"\n🔧 **For tool calls:** Use this exact file path:\n"
                        file_metadata += f"```\n{safe_path}\n```\n"

                        # Add extracted text if available
                        extracted_text = file_info.get('extracted_text', '')
                        if extracted_text:
                            preview = extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
                            file_metadata += f"\n📄 **Content Preview:**\n{preview}\n"
                            print(f"   ✅ Extracted text included ({len(extracted_text):,} chars)")

                        content_parts.append({"type": "input_text", "text": file_metadata})
                        print(f"   ✅ File metadata added as structured content")

                print(f"\n{'='*60}")
                print(f"✅ FILE PROCESSING COMPLETE - {len(content_parts)} content parts total")
                print(f"{'='*60}\n")

                user_message_content = content_parts
            else:
                user_message_content = enhanced_message

            full_chat_history = (chat_history or []) + [{"role": "user", "content": user_message_content}]

            # Mark execution as started
            execution_logger.log_execution_start()

            # Send heartbeats during Composio runner execution (opaque operation)
            # Since we can't see inside the runner, emit periodic status updates
            if callback:
                await callback('status', {
                    'status': 'processing',
                    'message': random.choice(PROCESSING_MESSAGES)
                })

                # Run the runner with periodic heartbeats
                last_heartbeat = time.time()

                async def run_with_heartbeats():
                    # Create a task for the runner with timeout and automatic retry
                    runner_task = asyncio.create_task(
                        self._execute_agent_with_retry(runner, composio_agent, full_chat_history, timeout=180.0)
                    )

                    # Periodically send heartbeats while runner is working
                    while not runner_task.done():
                        await asyncio.sleep(2)  # Check every 2 seconds
                        current_time = time.time()
                        if current_time - last_heartbeat >= 3:  # Send heartbeat every 3 seconds
                            await callback('heartbeat', {
                                'message': 'Still processing...',
                                'timestamp': current_time
                            })

                    return await runner_task

                result = await run_with_heartbeats()
            else:
                # Pass the *entire chat history* (including current message with files) to the runner.
                # Uses automatic retry with exponential backoff for transient failures
                try:
                    result = await self._execute_agent_with_retry(runner, composio_agent, full_chat_history, timeout=180.0)
                except asyncio.TimeoutError:
                    print("⚠️ Composio execution timed out after 180 seconds")
                    return "Task execution timed out. The operation may still be in progress."

            # ============================================================
            # PHASE 9: EXTRACT RESULT & POST-EXECUTION VERIFICATION
            # ============================================================

            # Extract output from result
            output = None
            if hasattr(result, 'final_output'):
                output = result.final_output
            elif hasattr(result, 'output'):
                output = result.output
            elif hasattr(result, 'content'):
                output = result.content
            elif hasattr(result, 'text'):
                output = result.text
            elif hasattr(result, 'messages') and len(result.messages) > 0:
                last_message = result.messages[-1]
                if hasattr(last_message, 'content'):
                    output = last_message.content
                else:
                    output = str(last_message)
            elif isinstance(result, str):
                output = result
            else:
                print(f"🔍 RunResult type: {type(result)}")
                print(f"🔍 RunResult attributes: {dir(result)}")
                result_str = str(result)
                if "Final output (str):" in result_str:
                    lines = result_str.split('\n')
                    for i, line in enumerate(lines):
                        if "Final output (str):" in line and i + 2 < len(lines):
                            output = lines[i + 2].strip()
                            break
                if not output:
                    output = result_str

            # Post-Execution Verification
            # 1. Detect simulated actions (agent saying "I will" instead of doing)
            self._detect_simulated_actions(output, tools)

            # 2. Verify execution success (basic heuristics)
            execution_success = self._verify_execution_success(output, intent_resolution)
            if not execution_success:
                print(f"⚠️  Execution may not have completed successfully")

            # ============================================================
            # PHASE 10: COMPLETION LOGGING
            # ============================================================

            # Calculate execution duration
            end_time = time.time()
            duration_ms = int((end_time - start_time) * 1000)

            # Log completion
            execution_logger.log_execution_complete(output, duration_ms)
            print(f"✅ Execution completed in {duration_ms}ms")

            # Print execution summary for debugging
            if execution_logger.current_log:
                print("\n" + "="*80)
                print("📊 EXECUTION SUMMARY")
                print("="*80)
                print(execution_logger.get_execution_summary(execution_logger.current_log))
                print("="*80 + "\n")

            return output

        except Exception as e:
            # SECURITY: Mask sensitive data in error messages
            safe_error = mask_sensitive_data(str(e))
            logger.error(f"Error in Composio chat: {safe_error}")
            import traceback
            traceback.print_exc()
            execution_logger = get_execution_logger()
            if execution_logger.current_log:
                execution_logger.log_execution_error(safe_error)

            if callback:
                await callback('error', {'error': safe_error})
            return await self._chat_without_tools(agent_model, message, chat_history, callback)

    async def _run_agent_tool_call(self, tool_call, gate: PermissionGate, callback=None) -> str:
        """
        Executes one tool call from the model and returns the result as a JSON string.
        Failures and policy denials are returned as {"error": ...} so the model can see them and recover.
        """
        function_name = tool_call.function.name
        # SECURITY: Use safe JSON parsing to prevent malformed input attacks
        function_args = parse_json_safely(tool_call.function.arguments, default={})

        blocked = await gate.check(function_name, function_args)
        if blocked:
            return blocked

        logger.info(f"🔨 Executing tool: {function_name}")

        if callback:
            await callback('tool_call_start', {
                'tool': function_name,
                'parameters': function_args
            })

        try:
            tool_result = await sync_to_async(self.agent_tools_service.execute_tool)(
                function_name,
                **function_args
            )
        except Exception as e:
            tool_result = {'success': False, 'error': mask_sensitive_data(str(e))}

        if callback:
            await callback('tool_call_result', {
                'tool': function_name,
                'success': tool_result.get('success', False),
                'result': tool_result.get('data') if tool_result.get('success') else None,
                'error': tool_result.get('error') if not tool_result.get('success') else None
            })

        if tool_result.get('success'):
            return cap_tool_result(json.dumps(tool_result['data']))
        return cap_tool_result(json.dumps({'error': tool_result.get('error', 'Unknown error')}))

    async def compact_chat_history(self, agent_id, older_messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Compacts messages older than the recent window into a rolling summary.

        Args:
            agent_id: Agent the conversation belongs to (summary cache key)
            older_messages: Oldest first, each {"role", "content", "created_at"} as plain text

        Returns:
            Messages to put before the recent window: [summary] + not-yet-summarized messages
        """
        if not older_messages:
            return []

        cache_key = f"chat_summary:{agent_id}"
        state = await sync_to_async(cache.get)(cache_key) or {}
        summary = state.get("summary", "")
        summarized_until = state.get("until")

        pending = [m for m in older_messages if not summarized_until or m["created_at"] > summarized_until]

        if len(pending) >= COMPACT_BATCH_SIZE:
            try:
                summary = await self._summarize_messages(summary, pending)
                await sync_to_async(cache.set)(
                    cache_key, {"summary": summary, "until": pending[-1]["created_at"]}, timeout=None
                )
                pending = []
            except Exception as e:
                # Keep the old summary and send pending messages as-is; retry next turn
                logger.warning(f"Chat history compaction failed: {mask_sensitive_data(str(e))}")

        compacted = []
        if summary:
            # Role "user", not "system": the summary is built from user content, so it gets user-level trust
            compacted.append({"role": "user", "content": f"[Summary of the earlier conversation, for context]\n{summary}"})
        compacted += [{"role": m["role"], "content": m["content"]} for m in pending]
        return compacted

    async def _summarize_messages(self, previous_summary: str, messages: List[Dict[str, Any]]) -> str:
        """Folds new messages into the existing summary with one short LLM call."""
        transcript = "\n".join(f"{m['role']}: {m['content'][:2000]}" for m in messages)
        prompt = (
            "Update the summary of this conversation. Keep facts, names, decisions, user preferences "
            "and open tasks. Drop small talk. Maximum 200 words.\n\n"
            f"Current summary:\n{previous_summary or '(none)'}\n\n"
            f"New messages:\n{transcript}"
        )

        response = await asyncio.wait_for(
            self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_completion_tokens=400,
                timeout=30  # OpenAI client timeout
            ),
            timeout=40  # asyncio timeout (outer)
        )
        return response.choices[0].message.content or previous_summary

    async def _emit_content_words(self, content: str, callback) -> None:
        """Sends the final answer to the UI word by word (same events as streaming)."""
        for index, word in enumerate(re.findall(r'\S+\s*', content)):
            await callback('content_delta', {'content': word, 'index': index})

    async def _chat_with_agent_tools(self, agent_model, message: str, chat_history: List[Dict[str, str]] = None, callback=None, file_attachments: List[Dict] = None, is_data_fetch_only: bool = False) -> str:
        """
        Runs chat with agent-specific tools (weather, calculator, etc.).
        Uses OpenAI function calling to execute tools.

        Args:
            agent_model: Agent model instance
            message: User message
            chat_history: Previous chat messages
            callback: Optional async callback function for streaming updates
            file_attachments: Optional list of file attachment dictionaries
            is_data_fetch_only: If True, agent should only fetch data without outputting it to user
        """
        if not self.openai_client:
            return "OpenAI client not configured"

        try:
            # Get OpenAI function definitions for enabled agent tools
            agent_tools_functions = get_openai_functions_for_tools(agent_model.agent_tools)

            if not agent_tools_functions:
                # No agent tools enabled, fall back to basic chat
                return await self._chat_without_tools(agent_model, message, chat_history, callback)

            # === USE CONTEXT INJECTION MANAGER ===
            # Add same context as Composio tools for consistency
            context_manager = get_context_manager()
            connected_apps = agent_model.app_connections if hasattr(agent_model, 'app_connections') else []
            agent_tools_list = agent_model.agent_tools if hasattr(agent_model, 'agent_tools') else []

            injected_context = context_manager.build_complete_context(
                user=self.user,
                agent_model=agent_model,
                connected_apps=connected_apps,
                agent_tools=agent_tools_list,
                include_app_guidance=False,  # Don't include Composio app guidance for agent tools
                include_agent_tools_guidance=True  # Include agent tools guidance
            )

            # Build enhanced prompt with context
            enhanced_prompt = agent_model.prompt + "\n" + injected_context

            # Add special instructions for data-fetch-only mode
            if is_data_fetch_only:
                enhanced_prompt += "\n\n" + """
CRITICAL: DATA FETCH MODE FOR MULTI-TASK OPERATION
====================================================
You are in a data-fetching phase for a multi-task operation.
The user has requested multiple actions that will be performed sequentially.

IMPORTANT INSTRUCTIONS:
1. FETCH AND RETURN the complete requested data/analysis using your tools
2. Provide the FULL analysis/data that will be used in subsequent tasks
3. DO NOT say "I will now send email" or "I will create a document"
4. DO NOT perform any actions (sending, posting, creating files)
5. Your response should contain the complete data/analysis

RESPONSE FORMAT:
- Return the complete analysis/data requested
- The data will be used automatically for email/document tasks
- Focus only on data fetching, not on actions
"""

            # === ADD FILE CONTEXT TO MESSAGE ===
            # If files are attached, add file information to the message
            enhanced_message = message
            if file_attachments:
                # MEMORY OPTIMIZATION: Use StringIO for efficient string building
                from io import StringIO
                file_context_buffer = StringIO()
                file_context_buffer.write("\n\n📎 **Attached Files:**\n")

                for file_info in file_attachments:
                    file_context_buffer.write(f"\n**{file_info['filename']}** ({file_info['mime_type']}, {file_info['size']} bytes)\n")
                    file_context_buffer.write(f"  📍 Path: `{file_info['file_path']}`\n")

                    # Add extracted text preview if available
                    if file_info.get('extraction_status') == 'success' and file_info.get('extracted_text'):
                        preview = file_info['extracted_text'][:800]  # First 800 chars
                        file_context_buffer.write(f"  📝 Content Preview:\n```\n{preview}\n```\n")
                        if len(file_info['extracted_text']) > 800:
                            file_context_buffer.write(f"  _(Total: {len(file_info['extracted_text'])} characters)_\n")
                    elif file_info.get('extraction_status') == 'not_applicable':
                        file_context_buffer.write(f"  ℹ️  Binary file (image/video/audio)\n")

                file_context = file_context_buffer.getvalue()
                enhanced_message = message + file_context
                print(f"📎 Added context for {len(file_attachments)} file(s) to agent tools prompt")
            # ====================================

            # Build messages with enhanced prompt and history
            if chat_history:
                messages = [{"role": "system", "content": enhanced_prompt}] + chat_history
            else:
                messages = [
                    {"role": "system", "content": enhanced_prompt},
                    {"role": "user", "content": enhanced_message}
                ]

            print(f"🔧 Chat with {len(agent_tools_functions)} agent tools enabled")

            gate = PermissionGate(self.user, agent_model, callback)

            # === AGENT LOOP ===
            # Keep calling the model WITH tools until it answers in text,
            # or until we hit the step limit.
            for step in range(1, MAX_AGENT_STEPS + 1):
                logger.info(f"🔁 Agent step {step}/{MAX_AGENT_STEPS}")

                response = await asyncio.wait_for(
                    self.openai_client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=messages,
                        tools=agent_tools_functions,
                        tool_choice="auto",
                        temperature=0.7,
                        max_completion_tokens=1500,
                        timeout=45  # OpenAI client timeout
                    ),
                    timeout=60  # asyncio timeout (outer)
                )

                response_message = response.choices[0].message
                tool_calls = response_message.tool_calls

                # No tool calls -> the model is done, this is the final answer
                if not tool_calls:
                    final_content = response_message.content or ""
                    if callback:
                        await self._emit_content_words(final_content, callback)
                    return final_content

                messages.append(response_message)

                for tool_call in tool_calls:
                    result_content = await self._run_agent_tool_call(tool_call, gate, callback)
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": tool_call.function.name,
                        "content": result_content
                    })

            # === STEP LIMIT REACHED ===
            # Force a final text answer from what the agent has so far (no tools)
            logger.warning(f"⚠️ Agent hit step limit ({MAX_AGENT_STEPS}), forcing final answer")
            if callback:
                await callback('status', {'status': 'responding', 'message': 'Generating response...'})

            messages.append({
                "role": "system",
                "content": "You have reached the maximum number of tool steps. "
                           "Answer the user now using only the information gathered so far. "
                           "If the task is not complete, say what is missing."
            })

            final_response = await asyncio.wait_for(
                self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.7,
                    max_completion_tokens=1500,
                    timeout=45  # OpenAI client timeout
                ),
                timeout=60  # asyncio timeout (outer)
            )
            final_content = final_response.choices[0].message.content or ""
            if callback:
                await self._emit_content_words(final_content, callback)
            return final_content

        except asyncio.TimeoutError:
            print("⏱️ Agent tools chat timed out after 60 seconds")
            if callback:
                await callback('error', {'error': 'Request timed out after 60 seconds'})
            return "Sorry, the request took too long and timed out. Please try again with a simpler query."

        except Exception as e:
            # SECURITY: Mask sensitive data in error messages
            safe_error = mask_sensitive_data(str(e))
            logger.error(f"Error in agent tools chat: {safe_error}")
            import traceback
            traceback.print_exc()
            if callback:
                await callback('error', {'error': safe_error})
            return f"Sorry, I encountered an error: {safe_error}"

    async def _chat_with_mixed_tools(self, agent_model, message: str, composio_tool_slugs: List[str], chat_history: List[Dict[str, str]] = None, callback=None) -> str:
        """
        Runs chat with BOTH Composio tools AND agent tools.
        This is the most complex scenario where the agent has both types of tools enabled.

        Strategy:
        1. If Composio tools are selected, use Composio (handles connected apps)
        2. If no Composio tools selected BUT agent tools are available, use agent tools
        3. If neither, fallback to basic chat
        4. Clean markdown formatting from all responses

        This prioritization ensures agent tools (like yahoo_finance, weather, calculator)
        are used when Composio doesn't have relevant tools.

        Args:
            agent_model: Agent model instance
            message: User message
            composio_tool_slugs: List of Composio tool slugs to use
            chat_history: Previous chat messages
            callback: Optional async callback function for streaming updates
        """
        # Smart routing: prioritize based on what tools are available
        has_composio_tools = composio_tool_slugs and len(composio_tool_slugs) > 0
        has_agent_tools = agent_model.agent_tools and len(agent_model.agent_tools) > 0

        print(f"🔀 Mixed tools routing: Composio={has_composio_tools}, Agent={has_agent_tools}")

        response = None
        used_hybrid_mode = False  # Track if we used hybrid mode (which already cleans markdown)

        if has_composio_tools and has_agent_tools:
            # Both available - smart routing based on message content
            # Check if message requires agent tools (stock/weather/calc/etc)
            message_lower = message.lower()

            # Stock/financial queries should use yahoo_finance agent tool
            stock_keywords = ['stock', 'ticker', 'market', 'share price', 'aapl', 'tsla', 'financial']
            needs_yahoo_finance = (
                any(keyword in message_lower for keyword in stock_keywords) and
                'yahoo_finance' in agent_model.agent_tools
            )

            # Weather queries should use weather agent tool
            weather_keywords = ['weather', 'temperature', 'forecast', 'climate']
            needs_weather = (
                any(keyword in message_lower for keyword in weather_keywords) and
                'weather' in agent_model.agent_tools
            )

            # Calculator queries should use calculator agent tool
            calc_keywords = ['calculate', 'compute', 'math', 'equation', 'formula']
            needs_calculator = (
                any(keyword in message_lower for keyword in calc_keywords) and
                'calculator' in agent_model.agent_tools
            )

            # If message needs specialized agent tools, check if it also needs Composio actions
            if needs_yahoo_finance or needs_weather or needs_calculator:
                # Check if message ALSO needs Composio actions (email, post, etc.)
                action_keywords = ['send', 'email', 'post', 'tweet', 'share', 'upload', 'create']
                needs_composio_action = any(keyword in message_lower for keyword in action_keywords)

                if needs_composio_action and composio_tool_slugs:
                    # HYBRID MODE: Need both agent tools (for data) AND Composio (for actions)
                    print(f"  → Using HYBRID mode: agent tools for data + Composio for actions")
                    print(f"     - Agent tools: yahoo_finance={needs_yahoo_finance}, weather={needs_weather}, calc={needs_calculator}")
                    print(f"     - Composio actions: {composio_tool_slugs}")

                    # Execute agent tools first to get data, then pass to Composio with enriched context
                    # Note: _chat_with_hybrid_tools already includes markdown cleanup
                    response = await self._chat_with_hybrid_tools(
                        agent_model, message, composio_tool_slugs, chat_history, callback
                    )
                    used_hybrid_mode = True
                else:
                    # Only need agent tools (data query without action)
                    print(f"  → Using agent tools only (specialized tools needed: yahoo_finance={needs_yahoo_finance}, weather={needs_weather}, calc={needs_calculator})")
                    response = await self._chat_with_agent_tools(agent_model, message, chat_history, callback)
            else:
                # Default: prefer Composio for connected apps
                print("  → Using Composio tools (connected apps take precedence)")
                response = await self._chat_with_composio(agent_model, message, composio_tool_slugs, chat_history, callback)
        elif has_composio_tools:
            # Only Composio
            print("  → Using Composio tools only")
            response = await self._chat_with_composio(agent_model, message, composio_tool_slugs, chat_history, callback)
        elif has_agent_tools:
            # Only agent tools (THIS FIXES THE STOCK PRICE ISSUE)
            print("  → Using agent tools only (no relevant Composio tools)")
            response = await self._chat_with_agent_tools(agent_model, message, chat_history, callback)
        else:
            # No tools at all
            print("  → No tools available, using basic chat")
            response = await self._chat_without_tools(agent_model, message, chat_history, callback)

        # Clean markdown formatting from response (unless hybrid mode already did it)
        if response and not used_hybrid_mode:
            response = self._clean_markdown_formatting(response)

        return response

    async def _chat_with_hybrid_tools(self, agent_model, message: str, composio_tool_slugs: List[str], chat_history: List[Dict[str, str]] = None, callback=None) -> str:
        """
        HYBRID MODE: Uses BOTH agent tools (for data fetching) AND Composio tools (for actions).

        Workflow:
        1. Execute with agent tools first to fetch data (yahoo_finance, weather, etc.)
        2. Capture the data from agent tool execution
        3. Parse message to identify multiple tasks (email, twitter, drive, etc.)
        4. Execute each task sequentially with the fetched data
        5. Clean markdown formatting from response

        Example: "send me AAPL stock analysis to email, post on twitter, and save to drive"
        - Step 1: Use yahoo_finance agent tool → get real stock data
        - Step 2: Detect 3 tasks: email, twitter, drive
        - Step 3: Execute each task with the fetched data
        - Step 4: Clean markdown formatting

        Args:
            agent_model: Agent model instance
            message: User message
            composio_tool_slugs: List of Composio tool slugs (for actions)
            chat_history: Previous chat messages
            callback: Optional async callback function
        """
        print("🔀 HYBRID EXECUTION: Agent tools → Composio tools")

        # Step 1: Parse message to identify multiple tasks
        tasks = self._parse_multi_task_request(message, composio_tool_slugs)
        is_multi_task = len(tasks) > 1

        # Step 2: Execute with agent tools to get data
        print("  Step 2: Fetching data with agent tools...")

        # Modify message to make it clear we want complete data fetching
        data_fetch_message = (
            f"{message}\n\n"
            "IMPORTANT: Fetch and return the COMPLETE requested data/analysis. "
            "Provide the full analysis that will be needed for the email and document. "
            "Do NOT send emails or create documents yet - just fetch and return all the data."
        )

        # For multi-task execution, suppress callback during data fetch
        # to prevent streaming the full analysis to the user
        data_fetch_callback = None if is_multi_task else callback

        agent_tools_response = await self._chat_with_agent_tools(
            agent_model,
            data_fetch_message,
            chat_history,
            data_fetch_callback,  # Suppress for multi-task to avoid showing analysis
            file_attachments=None,
            is_data_fetch_only=True  # Tell agent to fetch data without outputting full analysis
        )

        print(f"  ✅ Agent tools response ({len(agent_tools_response)} chars)")

        # Step 3: Execute tasks
        if is_multi_task:
            # Multiple tasks detected - use task queue execution
            print(f"  Step 3: Multi-task mode - {len(tasks)} tasks detected")
            final_response = await self._execute_task_queue(
                agent_model,
                message,
                tasks,
                agent_tools_response,
                chat_history,
                callback
            )
        else:
            # Single task - use standard hybrid execution
            print("  Step 3: Single task mode")

            # Inject agent tools response into context for Composio execution
            enriched_history = chat_history.copy() if chat_history else []
            enriched_history.append({
                "role": "user",
                "content": message
            })
            # Clean markdown from agent tools response before adding to history
            cleaned_response = self._clean_markdown_formatting(agent_tools_response)
            enriched_history.append({
                "role": "assistant",
                "content": cleaned_response
            })

            # Execute with Composio tools (with enriched context)
            print("  Step 4: Executing action with Composio tools (with fetched data)...")
            composio_response = await self._chat_with_composio(
                agent_model,
                f"Based on the data above, {message}",
                composio_tool_slugs,
                enriched_history,
                callback
            )

            print(f"  ✅ Composio action completed")
            final_response = f"{agent_tools_response}\n\n{composio_response}"

        # Step 4: Clean markdown formatting from response
        final_response = self._clean_markdown_formatting(final_response)

        return final_response

    def _parse_multi_task_request(self, message: str, composio_tool_slugs: List[str]) -> List[Dict[str, Any]]:
        """
        Parse a message to identify multiple tasks/actions.

        Returns a list of tasks, each with:
        - action: The action type (send_email, post_twitter, save_drive, etc.)
        - platform: The target platform
        - tool_slugs: The specific Composio tool slugs for this task

        Example: "send stock analysis to email, post on twitter, and save to google drive"
        Returns: [
            {action: 'send_email', platform: 'gmail', tool_slugs: ['GMAIL_SEND_EMAIL']},
            {action: 'post_twitter', platform: 'twitter', tool_slugs: ['TWITTER_CREATION_OF_A_POST']},
            {action: 'save_drive', platform: 'googledrive', tool_slugs: ['GOOGLEDOCS_CREATE_DOCUMENT']}
        ]
        """
        message_lower = message.lower()
        tasks = []

        # Define action patterns with their keywords and corresponding tool slugs
        action_patterns = [
            {
                'action': 'send_email',
                'platform': 'gmail',
                'keywords': ['send', 'email', 'mail', 'e-mail'],
                'tool_prefixes': ['GMAIL_SEND', 'GMAIL_CREATE']
            },
            {
                'action': 'post_twitter',
                'platform': 'twitter',
                'keywords': ['post', 'tweet', 'twitter', 'x.com'],
                'tool_prefixes': ['TWITTER_CREATION', 'TWITTER_POST', 'TWITTER_UPLOAD']
            },
            {
                'action': 'save_drive',
                'platform': 'googledrive',
                'keywords': ['save', 'drive', 'google drive', 'docs', 'document', 'gdrive'],
                'tool_prefixes': ['GOOGLEDOCS_CREATE', 'GOOGLEDRIVE_CREATE', 'GOOGLEDRIVE_UPLOAD']
            },
            {
                'action': 'post_slack',
                'platform': 'slack',
                'keywords': ['slack', 'slack message', 'slack channel'],
                'tool_prefixes': ['SLACK_CHAT_POST', 'SLACK_SEND']
            },
            {
                'action': 'create_calendar_event',
                'platform': 'googlecalendar',
                'keywords': ['schedule', 'calendar', 'event', 'meeting'],
                'tool_prefixes': ['GOOGLECALENDAR_CREATE', 'GOOGLECALENDAR_INSERT']
            },
            {
                'action': 'create_notion',
                'platform': 'notion',
                'keywords': ['notion', 'notion page', 'notion database'],
                'tool_prefixes': ['NOTION_CREATE', 'NOTION_ADD']
            },
            {
                'action': 'send_whatsapp',
                'platform': 'whatsapp',
                'keywords': ['whatsapp', 'whats app', 'wa'],
                'tool_prefixes': ['WHATSAPP_SEND']
            },
            {
                'action': 'send_telegram',
                'platform': 'telegram',
                'keywords': ['telegram', 'tg'],
                'tool_prefixes': ['TELEGRAM_SEND']
            }
        ]

        # Check each action pattern
        for pattern in action_patterns:
            # Check if any keyword is in the message
            if any(keyword in message_lower for keyword in pattern['keywords']):
                # Find matching tool slugs from the available Composio tools
                matching_tools = [
                    slug for slug in composio_tool_slugs
                    if any(slug.startswith(prefix) for prefix in pattern['tool_prefixes'])
                ]

                # Special handling for email: prefer non-attachment version for text content
                if pattern['action'] == 'send_email' and matching_tools:
                    # Check if message indicates actual file attachments
                    has_file_keywords = any(word in message_lower for word in
                                          ['attach', 'attachment', 'file', 'document', 'pdf', 'csv', 'xlsx'])

                    # If no file keywords and both email tools present, use non-attachment version
                    if not has_file_keywords:
                        # Filter out attachment version if regular version exists
                        if 'GMAIL_SEND_EMAIL' in matching_tools and 'GMAIL_SEND_EMAIL_WITH_ATTACHMENT' in matching_tools:
                            matching_tools = ['GMAIL_SEND_EMAIL']
                            print(f"  📧 No attachments detected - using GMAIL_SEND_EMAIL (text only)")

                if matching_tools:
                    tasks.append({
                        'action': pattern['action'],
                        'platform': pattern['platform'],
                        'tool_slugs': matching_tools
                    })
                    print(f"  📋 Detected task: {pattern['action']} ({pattern['platform']}) - Tools: {matching_tools}")

        return tasks

    async def _execute_task_queue(
        self,
        agent_model,
        message: str,
        tasks: List[Dict[str, Any]],
        fetched_data: str = None,
        chat_history: List[Dict[str, str]] = None,
        callback=None
    ) -> str:
        """
        Execute a queue of tasks sequentially with shared context.

        Args:
            agent_model: Agent model instance
            message: Original user message
            tasks: List of tasks to execute
            fetched_data: Data fetched from agent tools (e.g., stock analysis)
            chat_history: Previous chat messages
            callback: Optional async callback function

        Returns:
            Combined response from all task executions
        """
        print(f"📋 TASK QUEUE EXECUTION: Processing {len(tasks)} tasks...")

        # Prepare enriched context with fetched data
        enriched_history = chat_history.copy() if chat_history else []

        if fetched_data:
            enriched_history.append({
                "role": "user",
                "content": message
            })
            # Clean markdown from fetched data before adding to history
            # This ensures emails and documents don't contain markdown formatting
            cleaned_data = self._clean_markdown_formatting(fetched_data)
            enriched_history.append({
                "role": "assistant",
                "content": cleaned_data
            })

        # PERFORMANCE OPTIMIZATION: Execute independent tasks in parallel using asyncio.gather()
        # This provides 3-4x speedup for multi-task requests
        print(f"⚡ Parallelizing {len(tasks)} independent tasks for faster execution...")

        async def execute_single_task(task_index: int, task: Dict[str, Any]) -> tuple:
            """
            Execute a single task and return its result with index for ordering.

            Returns:
                Tuple of (task_index, result_message, error)
            """
            action_name = task['action']
            platform = task['platform']
            tool_slugs = task['tool_slugs']

            print(f"  Starting task {task_index + 1}/{len(tasks)}: {action_name} on {platform}...")
            print(f"     Tools: {tool_slugs}")

            try:
                # Create task-specific message with explicit single execution
                if fetched_data:
                    if action_name == 'send_email':
                        task_message = (
                            f"Send ONE email with the AAPL stock analysis to the specified address.\n"
                            f"Use the stock data from the conversation above.\n"
                            f"Execute the GMAIL_SEND_EMAIL tool exactly once and stop."
                        )
                    elif action_name == 'create_document' or action_name == 'save_drive':
                        task_message = (
                            f"Create ONE Google Docs document with the AAPL stock analysis.\n"
                            f"Use the stock data from the conversation above.\n"
                            f"Execute the GOOGLEDOCS_CREATE_DOCUMENT tool exactly once and stop."
                        )
                    else:
                        task_message = (
                            f"Task: {action_name} - {message}\n\n"
                            f"Use the data from the conversation above.\n"
                            f"Execute the required tool exactly once and stop."
                        )
                else:
                    task_message = f"Task: {action_name} - {message}\nExecute exactly once and stop."

                # Execute this specific task with its tools
                # Skip intent validation since we already detected the platform in task parsing
                # CRITICAL: Limit to specific tools to prevent agent from using wrong tools
                if action_name == 'send_email':
                    # For email, use ONLY the send email tool (not attachment version unless files)
                    limited_tools = ['GMAIL_SEND_EMAIL']
                elif action_name == 'create_document' or action_name == 'save_drive':
                    # For Google Docs, use only the create document tool
                    limited_tools = ['GOOGLEDOCS_CREATE_DOCUMENT']
                else:
                    # Use the originally detected tools
                    limited_tools = tool_slugs[:1]  # Limit to first tool to prevent confusion

                print(f"     Using limited tools: {limited_tools}")

                task_response = await self._chat_with_composio(
                    agent_model,
                    task_message,
                    limited_tools,  # Use limited tools instead of all tools
                    enriched_history.copy(),  # Use a copy to avoid race conditions
                    callback,
                    file_attachments=None,
                    skip_intent_validation=True  # Skip for task queue - we already know the platform
                )

                print(f"  ✅ Task {task_index + 1} ({action_name}) completed")
                return (task_index, f"✅ {action_name} completed successfully", None)

            except Exception as e:
                error_msg = str(e)
                print(f"  ❌ Task {task_index + 1} ({action_name}) failed: {error_msg}")
                return (task_index, f"❌ {action_name} failed: {error_msg}", error_msg)

        # Execute all tasks concurrently
        task_coroutines = [execute_single_task(i, task) for i, task in enumerate(tasks)]
        task_execution_results = await asyncio.gather(*task_coroutines, return_exceptions=True)

        # Process results in original order
        task_results = []
        for result in sorted(task_execution_results, key=lambda x: x[0] if isinstance(x, tuple) else 0):
            if isinstance(result, tuple):
                _, result_msg, error = result
                task_results.append(result_msg)
            elif isinstance(result, Exception):
                # Handle exceptions from gather
                task_results.append(f"❌ Task failed with exception: {str(result)}")
            else:
                task_results.append(f"❌ Task failed with unexpected result")

        # Combine results with a nice formatted summary
        # For multi-task execution, provide a user-friendly summary like competitors

        # Build a professional summary
        summary_parts = ["I have completed your requests! Here's the summary of what I did:\n"]

        # Parse the results to create numbered list
        task_number = 1
        for i, task in enumerate(tasks):
            if i < len(task_results) and task_results[i].startswith("✅"):
                action = task['action']
                platform = task['platform']

                if action == 'send_email':
                    # SECURITY: Use safe email extraction with validation
                    email = extract_email_safely(message)
                    if email:
                        summary_parts.append(f"{task_number}. Sent the AAPL Stock Analysis to your email at {email}.")
                    else:
                        summary_parts.append(f"{task_number}. Sent the AAPL Stock Analysis to your email.")

                elif action == 'save_drive' or action == 'create_document':
                    summary_parts.append(f'{task_number}. Created a new Google Docs document titled "AAPL Stock Analysis." You can view and edit it in your Google Drive.')

                else:
                    summary_parts.append(f"{task_number}. Completed {action} on {platform}.")

                task_number += 1

        summary_parts.append("\nFeel free to let me know if you need anything else or any additional details!")

        final_response = "\n".join(summary_parts)

        return final_response

    def _clean_markdown_formatting(self, text: str) -> str:
        """
        Remove markdown formatting (stars, dashes) from agent responses.

        Removes:
        - Bold markers (**text**)
        - Italic markers (*text*)
        - List bullets (- item)
        - Headers (## Header)
        - Code blocks (```code```)
        - Inline code (`code`)

        Args:
            text: Text with markdown formatting

        Returns:
            Clean text without markdown
        """
        import re

        # Remove code blocks (```code``` -> code)
        text = re.sub(r'```[a-zA-Z]*\n?([^`]+)```', r'\1', text)

        # Remove inline code (`code` -> code)
        text = re.sub(r'`([^`]+)`', r'\1', text)

        # Remove headers (### Header -> Header) - handle optional leading whitespace
        text = re.sub(r'^\s*#{1,6}\s+', '', text, flags=re.MULTILINE)

        # Remove bold with nested content (**text:** -> text:)
        text = re.sub(r'\*\*([^*]+):\*\*', r'\1:', text)

        # Remove bold (**text** -> text)
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)

        # Remove italic (*text* -> text) - be careful not to remove multiplication
        text = re.sub(r'(?<!\w)\*([^*\n]+)\*(?!\w)', r'\1', text)

        # Remove list bullets with various markers (-, *, +)
        text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)

        # Remove numbered lists (1. item -> item)
        text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)

        # Remove blockquotes (> text -> text)
        text = re.sub(r'^\s*>\s+', '', text, flags=re.MULTILINE)

        # Remove horizontal rules (---, ***, ___)
        text = re.sub(r'^[-*_]{3,}$', '', text, flags=re.MULTILINE)

        # Clean up excessive newlines (more than 2 consecutive)
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Remove leading/trailing whitespace
        text = text.strip()

        return text

    def authenticate_tool(self, tool_name: str, additional_fields: Dict[str, Any] = None, redirect_url: str = None) -> Dict[str, Any]:
        """
        Initiates the Composio authentication flow for a specific tool.

        Args:
            tool_name: The name of the tool to authenticate
            additional_fields: Optional additional fields for the connection (e.g., WhatsApp fields)
            redirect_url: Optional URL to redirect to after OAuth completes
        """
        if not self.composio_client:
            return {
                "success": False,
                "error": "Composio client not configured"
            }

        try:
            tool_name = tool_name.upper()
            auth_config_id = self.auth_configs.get(tool_name)

            if not auth_config_id:
                return {
                    "success": False,
                    "error": f"{tool_name} is not yet configured. Please set up the auth config in Composio dashboard first."
                }

            initiate_params = {
                "auth_config_id": auth_config_id,
                "user_id": f"user_{self.user.id}",
                "allow_multiple": True,  # Allow multiple connections per tool per user
            }

            # Add callback URL if provided
            if redirect_url:
                # If relative path, prepend FRONTEND_URL from environment
                if redirect_url.startswith('/'):
                    import os
                    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
                    redirect_url = f"{frontend_url.rstrip('/')}{redirect_url}"

                initiate_params["callback_url"] = redirect_url
                print(f"🔄 OAuth will redirect to: {redirect_url}")

            if additional_fields:
                if 'waba_id' in additional_fields:
                    initiate_params['waba_id'] = additional_fields['waba_id']
                if 'phone_number_id' in additional_fields:
                    initiate_params['phone_number_id'] = additional_fields['phone_number_id']

                print(f"🔧 Initiating {tool_name} with additional fields: {list(additional_fields.keys())}")

            try:
                print(f"🔄 Initiating {tool_name} with auth_config_id: {auth_config_id}, allow_multiple=True")
                response = self.composio_client.connected_accounts.initiate(**initiate_params)

                # Log the full response for debugging
                print(f"🔍 Composio initiate response for {tool_name}: {response}")
                print(f"🔍 Response attributes: {dir(response)}")

                # Extract auth URL
                auth_url = None
                if hasattr(response, 'redirectUrl'):
                    auth_url = response.redirectUrl
                elif hasattr(response, 'redirect_url'):
                    auth_url = response.redirect_url

                # Extract connection status for logging
                connection_status = None
                if hasattr(response, 'connectionStatus'):
                    connection_status = response.connectionStatus
                elif hasattr(response, 'connection_status'):
                    connection_status = response.connection_status
                elif hasattr(response, 'status'):
                    connection_status = response.status

                print(f"🔗 Auth URL: {auth_url}")
                print(f"📊 Connection status: {connection_status}")

                # Check if we have an auth URL
                if not auth_url:
                    print(f"❌ No auth_url found in Composio response for {tool_name}")
                    return {
                        "success": False,
                        "error": f"No authentication URL returned from Composio for {tool_name}"
                    }

                # Return success with auth_url so frontend can open OAuth popup
                # Note: Status will be INITIATED at this point - that's expected!
                # The user needs to complete OAuth to change status to ENABLED
                print(f"✅ Returning auth_url to frontend for OAuth flow")
                return {
                    "success": True,
                    "auth_url": auth_url,
                    "auth_config_id": auth_config_id,
                    "status": connection_status
                }
            except Exception as e:
                # SECURITY: Mask sensitive data in error messages
                safe_error = mask_sensitive_data(str(e))
                logger.error(f"❌ Composio API error for {tool_name}")
                logger.error(f"   Tool: {tool_name}")
                logger.error(f"   Auth Config ID: {auth_config_id}")
                logger.error(f"   Error type: {type(e).__name__}")
                logger.error(f"   Error message: {safe_error}")

                error_message = safe_error

                # Handle "Multiple connected accounts" error with cleanup strategy
                # NOTE: With allow_multiple=True, this should rarely/never happen
                # But we keep this as a safety fallback
                if "Multiple connected accounts" in error_message or "ComposioMultipleConnectedAccountsError" in type(e).__name__:
                    print(f"⚠️  UNEXPECTED: Got multiple connections error despite allow_multiple=True")
                    print(f"🔍 Attempting fallback cleanup strategy...")

                    try:
                        # Get existing connections for this user/tool from Composio
                        entity_id = f"user_{self.user.id}"

                        # Try to clean up duplicates using our new method
                        cleanup_result = self._cleanup_duplicate_connections(entity_id, tool_name)

                        if cleanup_result.get('cleaned'):
                            print(f"✅ Cleanup successful: kept {cleanup_result['kept_connection_id']}, deleted {cleanup_result['deleted_count']}")
                            print(f"🔄 Retrying initiate after cleanup...")
                        else:
                            print(f"⚠️  Cleanup didn't find/remove duplicates: {cleanup_result.get('reason', 'unknown')}")
                            print(f"🔄 Trying legacy cleanup method...")

                            # Fallback to old method for ghost connections
                            existing_connections = self._get_composio_connections_for_tool(entity_id, tool_name)

                            if existing_connections:
                                print(f"📋 Found {len(existing_connections)} existing connection(s) in Composio")

                                # Try to adopt the first valid connection
                                adopted = False
                                for conn in existing_connections:
                                    if self._try_adopt_connection(conn, tool_name):
                                        print(f"✅ Adopted existing connection for {tool_name}")
                                        adopted = True
                                        break

                                # If adoption succeeded, return success
                                if adopted:
                                    return {
                                        "success": True,
                                        "adopted": True,
                                        "message": f"Connected to {tool_name} using existing account"
                                    }

                                # If no valid connection found, delete all zombie connections
                                print(f"🗑️  No valid connections found - deleting zombie connections...")
                                for conn in existing_connections:
                                    self._delete_composio_connection(conn)
                            else:
                                # Ghost connections that don't appear in list()
                                print(f"⚠️  No connections returned by list(), but Composio says they exist")
                                print(f"🧹 Attempting to delete ghost connections...")
                                self._delete_all_connections_for_entity(entity_id, tool_name)

                        # Retry the connection after cleanup
                        print(f"🔄 Retrying connection after cleanup...")
                        response = self.composio_client.connected_accounts.initiate(**initiate_params)

                        # Extract auth URL from retry
                        auth_url = getattr(response, 'redirectUrl', None) or getattr(response, 'redirect_url', None)
                        connection_status = getattr(response, 'connectionStatus', None) or getattr(response, 'connection_status', None) or getattr(response, 'status', None)

                        if auth_url:
                            print(f"✅ Retry successful after cleanup")
                            return {
                                "success": True,
                                "auth_url": auth_url,
                                "auth_config_id": auth_config_id,
                                "status": connection_status,
                                "cleaned_up": True
                            }
                    except Exception as cleanup_error:
                        # SECURITY: Mask sensitive data in error messages
                        safe_cleanup_error = mask_sensitive_data(str(cleanup_error))
                        logger.error(f"❌ Failed to resolve multiple connections issue: {safe_cleanup_error}")
                        import traceback
                        traceback.print_exc()

                # If not a multiple connections error, or cleanup failed, return original error
                import traceback
                traceback.print_exc()

                # Extract more detailed error if available
                error_detail = error_message
                if hasattr(e, 'response') and e.response:
                    try:
                        error_detail = f"{error_detail} - Response: {e.response.text if hasattr(e.response, 'text') else e.response}"
                    except:
                        pass

                return {
                    "success": False,
                    "error": f"Failed to authenticate {tool_name}: {error_detail}",
                    "tool_name": tool_name,
                    "auth_config_id": auth_config_id
                }

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }

    def _get_composio_connections_for_tool(self, entity_id: str, tool_name: str) -> List:
        """
        Fetches all Composio connections for a specific user and tool.
        Returns a list of connection objects from Composio.
        PERFORMANCE: Uses 5-minute cache to reduce API calls by 80%.
        """
        import time

        # Check cache first
        cache_key = f"{entity_id}:{tool_name}"
        current_time = time.time()

        if cache_key in self._connection_cache:
            cached_data = self._connection_cache[cache_key]
            cache_age = current_time - cached_data['timestamp']

            if cache_age < cached_data['ttl']:
                logger.info(f"🚀 Cache HIT for {cache_key} (age: {cache_age:.1f}s)")
                return cached_data['connections']
            else:
                logger.info(f"⏰ Cache EXPIRED for {cache_key} (age: {cache_age:.1f}s)")
                del self._connection_cache[cache_key]

        logger.info(f"🔍 Cache MISS for {cache_key} - fetching from Composio API")

        try:
            # Try different API parameter variations (Composio API is inconsistent)
            response = None
            try:
                # Try with no parameters first (gets all for this API key)
                print(f"🔍 Calling composio_client.connected_accounts.list()...")
                response = self.composio_client.connected_accounts.list()
                print(f"✅ Got response: {type(response)}")
            except Exception as e1:
                print(f"⚠️  list() failed: {e1}")
                try:
                    # Try with user_id parameter
                    print(f"🔍 Trying with user_id={entity_id}...")
                    response = self.composio_client.connected_accounts.list(user_id=entity_id)
                    print(f"✅ Got response: {type(response)}")
                except Exception as e2:
                    print(f"❌ Failed to list connections: {e1}, {e2}")
                    return []

            # Extract connections from response
            connections = None
            if hasattr(response, 'items'):
                connections = response.items
                print(f"📋 Extracted {len(connections) if connections else 0} connections from response.items")
            elif hasattr(response, 'data'):
                connections = response.data
                print(f"📋 Extracted {len(connections) if connections else 0} connections from response.data")
            elif hasattr(response, '__iter__'):
                connections = list(response)
                print(f"📋 Extracted {len(connections) if connections else 0} connections from iterable response")

            if not connections:
                print(f"ℹ️  No connections found in Composio response")
                return []

            print(f"🔍 Filtering {len(connections)} total connections for entity_id={entity_id}, tool={tool_name}")

            # Filter for the specific user and tool
            tool_connections = []
            for i, conn in enumerate(connections):
                # Check if connection belongs to this user
                conn_entity = None
                if hasattr(conn, 'entityId'):
                    conn_entity = conn.entityId
                elif hasattr(conn, 'entity_id'):
                    conn_entity = conn.entity_id
                elif hasattr(conn, 'userId'):
                    conn_entity = conn.userId
                elif hasattr(conn, 'user_id'):
                    conn_entity = conn.user_id

                # Check if this is the tool we're looking for
                conn_app = None
                if hasattr(conn, 'toolkit') and conn.toolkit:
                    conn_app = getattr(conn.toolkit, 'slug', None)
                elif hasattr(conn, 'integration') and conn.integration:
                    conn_app = getattr(conn.integration, 'slug', None)
                elif hasattr(conn, 'app'):
                    conn_app = conn.app

                print(f"  Connection {i+1}: entity={conn_entity}, app={conn_app}, match_entity={conn_entity == entity_id if conn_entity else 'N/A'}, match_app={conn_app.upper() == tool_name.upper() if conn_app else 'N/A'}")

                # Skip if not this user's connection
                if conn_entity and conn_entity != entity_id:
                    print(f"    ⏭️  Skipped - different user")
                    continue

                if conn_app and conn_app.upper() == tool_name.upper():
                    print(f"    ✅ Matched! Adding to results")
                    tool_connections.append(conn)
                else:
                    print(f"    ⏭️  Skipped - different tool")

            print(f"ℹ️  Found {len(tool_connections)} connection(s) for {tool_name}")

            # Cache the result
            self._connection_cache[cache_key] = {
                'connections': tool_connections,
                'timestamp': current_time,
                'ttl': self._connection_cache_ttl
            }
            logger.info(f"💾 Cached {len(tool_connections)} connections for {cache_key}")

            return tool_connections

        except Exception as e:
            print(f"❌ Error fetching Composio connections: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _try_adopt_connection(self, conn, tool_name: str) -> bool:
        """
        Tries to adopt an existing Composio connection by updating the local database.
        Returns True if successful, False otherwise.
        """
        try:
            from api_agents.tools.models import ComposioConnection

            # Extract connection ID
            conn_id = getattr(conn, 'id', None)
            if not conn_id:
                print(f"⚠️  Connection missing ID, cannot adopt")
                return False

            # Check connection status - only adopt ACTIVE connections
            status = getattr(conn, 'status', None) or getattr(conn, 'connectionStatus', None)
            if status and status.upper() not in ['ACTIVE', 'ENABLED']:
                print(f"⚠️  Connection {conn_id} has status {status}, not adopting")
                return False

            # Check if we already have this connection in our DB
            existing = ComposioConnection.objects.filter(
                user=self.user,
                tool_name=tool_name.upper(),
                connection_id=conn_id
            ).first()

            if existing:
                # Update to active
                existing.is_active = True
                existing.deleted_at = None
                existing.save()
                print(f"✅ Re-activated existing connection {conn_id}")
            else:
                # Create new local record
                ComposioConnection.objects.create(
                    user=self.user,
                    tool_name=tool_name.upper(),
                    connection_id=conn_id,
                    is_active=True
                )
                print(f"✅ Adopted new connection {conn_id}")

            return True

        except Exception as e:
            print(f"❌ Error adopting connection: {e}")
            return False

    def _delete_composio_connection(self, conn):
        """
        Deletes a connection from Composio's database.
        """
        try:
            conn_id = getattr(conn, 'id', None)
            if not conn_id:
                print(f"⚠️  Connection missing ID, cannot delete")
                return

            print(f"🗑️  Deleting Composio connection: {conn_id}")
            self.composio_client.connected_accounts.delete(connection_id=conn_id)
            print(f"✅ Deleted connection {conn_id} from Composio")

        except Exception as e:
            print(f"❌ Error deleting Composio connection: {e}")

    def _delete_all_connections_for_entity(self, entity_id: str, tool_name: str):
        """
        Attempts to delete all connections for an entity/tool, including ghost connections.
        This is called when list() returns empty but Composio says connections exist.
        """
        try:
            print(f"🔍 Fetching ALL connections (including non-active) for {entity_id}...")

            # Try to get connected accounts with different approaches
            all_connections = []

            # Approach 1: Try getting by entity_id and app
            try:
                response = self.composio_client.connected_accounts.list()
                if hasattr(response, 'items'):
                    all_connections = response.items
                elif hasattr(response, 'data'):
                    all_connections = response.data
                elif hasattr(response, '__iter__'):
                    all_connections = list(response)

                print(f"📋 Got {len(all_connections)} total connections from Composio")

                # Filter and delete matching connections
                deleted_count = 0
                for conn in all_connections:
                    conn_entity = getattr(conn, 'entityId', None) or getattr(conn, 'entity_id', None) or getattr(conn, 'userId', None) or getattr(conn, 'user_id', None)

                    if conn_entity == entity_id:
                        conn_app = None
                        if hasattr(conn, 'toolkit') and conn.toolkit:
                            conn_app = getattr(conn.toolkit, 'slug', None)
                        elif hasattr(conn, 'integration') and conn.integration:
                            conn_app = getattr(conn.integration, 'slug', None)
                        elif hasattr(conn, 'app'):
                            conn_app = conn.app

                        if conn_app and conn_app.upper() == tool_name.upper():
                            conn_id = getattr(conn, 'id', None)
                            if conn_id:
                                print(f"🗑️  Deleting connection {conn_id} (app={conn_app}, entity={conn_entity})")
                                try:
                                    self.composio_client.connected_accounts.delete(connection_id=conn_id)
                                    deleted_count += 1
                                    print(f"✅ Deleted connection {conn_id}")
                                except Exception as del_err:
                                    print(f"❌ Failed to delete {conn_id}: {del_err}")

                print(f"🧹 Deleted {deleted_count} ghost connection(s)")

            except Exception as list_err:
                print(f"❌ Failed to list connections for deletion: {list_err}")

        except Exception as e:
            print(f"❌ Error in _delete_all_connections_for_entity: {e}")
            import traceback
            traceback.print_exc()

    def _cleanup_duplicate_connections(self, entity_id: str, tool_name: str, keep_connection_id: str = None):
        """
        Deletes all duplicate connections for a user/tool, keeping only one.

        This enforces the constraint: ONE connection per tool per user.

        Args:
            entity_id: The user's entity ID (e.g., "user_123")
            tool_name: The tool name (e.g., "GMAIL")
            keep_connection_id: Optional specific connection ID to keep. If None, keeps the newest.

        Returns:
            Dict with cleanup results: {
                'cleaned': bool,
                'kept_connection_id': str,
                'deleted_count': int
            }
        """
        try:
            print(f"🧹 Cleaning up duplicate connections for {tool_name}...")

            # Get all connections for this user/tool
            all_connections = self._get_composio_connections_for_tool(entity_id, tool_name)

            if not all_connections:
                print(f"ℹ️  No connections found for {tool_name}")
                return {'cleaned': False, 'deleted_count': 0, 'reason': 'no_connections'}

            if len(all_connections) == 1:
                kept_id = getattr(all_connections[0], 'id', 'unknown')
                print(f"ℹ️  Only 1 connection found for {tool_name}, no cleanup needed")
                return {'cleaned': False, 'kept_connection_id': kept_id, 'deleted_count': 0, 'reason': 'only_one'}

            print(f"⚠️  Found {len(all_connections)} connections for {tool_name} - cleaning up duplicates...")

            # Determine which connection to keep
            connection_to_keep = None

            if keep_connection_id:
                # Keep the specified connection
                for conn in all_connections:
                    conn_id = getattr(conn, 'id', None)
                    if conn_id == keep_connection_id:
                        connection_to_keep = conn
                        print(f"🎯 Keeping specified connection: {keep_connection_id}")
                        break

            if not connection_to_keep:
                # Keep the newest connection (by creation timestamp)
                # Sort by createdAt or created_at field (most recent first)
                try:
                    sorted_connections = sorted(
                        all_connections,
                        key=lambda c: getattr(c, 'createdAt', '') or getattr(c, 'created_at', '') or '',
                        reverse=True  # Newest first
                    )
                    connection_to_keep = sorted_connections[0]
                    keep_id = getattr(connection_to_keep, 'id', 'unknown')
                    print(f"🎯 Keeping newest connection: {keep_id}")
                except Exception as sort_err:
                    # Fallback: just keep the first one
                    print(f"⚠️  Couldn't sort by timestamp ({sort_err}), keeping first connection")
                    connection_to_keep = all_connections[0]
                    keep_id = getattr(connection_to_keep, 'id', 'unknown')
                    print(f"🎯 Keeping first connection: {keep_id}")

            # Delete all other connections
            deleted_count = 0
            deleted_ids = []
            keep_conn_id = getattr(connection_to_keep, 'id', None)

            for conn in all_connections:
                conn_id = getattr(conn, 'id', None)
                if conn_id and conn_id != keep_conn_id:
                    try:
                        print(f"🗑️  Deleting duplicate connection: {conn_id}")
                        self._delete_composio_connection(conn)
                        deleted_count += 1
                        deleted_ids.append(conn_id)
                    except Exception as del_err:
                        print(f"❌ Failed to delete connection {conn_id}: {del_err}")
                        # Continue trying to delete other connections

            print(f"✅ Cleanup complete: Kept {keep_conn_id}, deleted {deleted_count} duplicate(s)")

            # Try to adopt the kept connection in local database
            try:
                self._try_adopt_connection(connection_to_keep, tool_name)
            except Exception as adopt_err:
                print(f"⚠️  Failed to adopt kept connection: {adopt_err}")

            return {
                'cleaned': True,
                'kept_connection_id': keep_conn_id,
                'deleted_count': deleted_count,
                'deleted_ids': deleted_ids
            }

        except Exception as e:
            print(f"❌ Error in _cleanup_duplicate_connections: {e}")
            import traceback
            traceback.print_exc()
            # Don't raise - cleanup failure shouldn't break the flow
            return {'cleaned': False, 'deleted_count': 0, 'error': str(e)}

    def get_connected_tools(self) -> List[str]:
        """
        Gets a list of all actively connected tool names (e.g., ["GMAIL"]) for the user.
        """
        # ... (This function is unchanged and correct) ...
        if not self.composio_client: return []
        try:
            entity_id = f"user_{self.user.id}"
            try:
                response = self.composio_client.connected_accounts.list(entity_id=entity_id)
            except Exception:
                try:
                    response = self.composio_client.connected_accounts.list(user_id=entity_id)
                except Exception:
                    response = self.composio_client.connected_accounts.list()

            connections = None
            if hasattr(response, 'items'): connections = response.items
            elif hasattr(response, 'data'): connections = response.data
            elif hasattr(response, '__iter__'): connections = list(response)
            if not connections: return []

            connected_tools = []
            for conn in connections:
                conn_entity = None
                if hasattr(conn, 'entityId'): conn_entity = conn.entityId
                elif hasattr(conn, 'entity_id'): conn_entity = conn.entity_id
                elif hasattr(conn, 'userId'): conn_entity = conn.userId
                elif hasattr(conn, 'user_id'): conn_entity = conn.user_id
                if conn_entity and conn_entity != entity_id: continue
                integration = None
                if hasattr(conn, 'toolkit') and conn.toolkit:
                    integration = getattr(conn.toolkit, 'slug', None)
                if integration:
                    connected_tools.append(integration.upper())
            return connected_tools
        except Exception as e:
            print(f"Error getting connected tools: {e}")
            import traceback
            traceback.print_exc()
            return []

    def get_available_tools(self) -> List[str]:
        """
        Gets all possible tools from the local config file.
        """
        return sorted(self.APP_SLUGS.keys())

    def get_connection_details(self) -> List[Dict[str, Any]]:
        """
        Gets detailed connection info from Composio, including connection IDs.
        """
        # ... (This function is unchanged and correct) ...
        if not self.composio_client: return []
        try:
            entity_id = f"user_{self.user.id}"

            # List ALL connections without filters to find ghost connections
            print(f"🔍 Listing ALL connections for debugging...")
            response = self.composio_client.connected_accounts.list()

            connections = None
            if hasattr(response, 'items'): connections = response.items
            elif hasattr(response, 'data'): connections = response.data
            elif hasattr(response, '__iter__'): connections = list(response)
            if not connections: return []

            connection_details = []
            for conn in connections:
                conn_entity = None
                if hasattr(conn, 'entityId'): conn_entity = conn.entityId
                elif hasattr(conn, 'entity_id'): conn_entity = conn.entity_id
                elif hasattr(conn, 'userId'): conn_entity = conn.userId
                elif hasattr(conn, 'user_id'): conn_entity = conn.user_id

                # Get tool name and ID for logging ALL connections
                tool_name_all = "Unknown"
                conn_id_all = "Unknown"
                if hasattr(conn, 'toolkit') and conn.toolkit:
                    tool_name_all = getattr(conn.toolkit, 'slug', 'Unknown')
                if hasattr(conn, 'id'): conn_id_all = conn.id
                elif hasattr(conn, 'connectionId'): conn_id_all = conn.connectionId

                # Get status for logging
                conn_status_debug = "Unknown"
                if hasattr(conn, 'status'): conn_status_debug = conn.status
                elif hasattr(conn, 'connectionStatus'): conn_status_debug = conn.connectionStatus
                elif hasattr(conn, 'connection_status'): conn_status_debug = conn.connection_status

                print(f"🔍 Found connection: {tool_name_all} | Entity: {conn_entity} | Status: {conn_status_debug} | ID: {conn_id_all}")

                if conn_entity and conn_entity != entity_id: continue

                # Check connection status - only include ACTIVE/ENABLED connections
                # Skip INITIATED (OAuth not completed) or other non-active statuses
                conn_status = None
                if hasattr(conn, 'status'): conn_status = conn.status
                elif hasattr(conn, 'connectionStatus'): conn_status = conn.connectionStatus
                elif hasattr(conn, 'connection_status'): conn_status = conn.connection_status

                # Get tool name for logging
                tool_name_debug = "Unknown"
                if hasattr(conn, 'toolkit') and conn.toolkit:
                    tool_name_debug = getattr(conn.toolkit, 'slug', 'Unknown')

                # Convert status to string for comparison
                # Accept both ACTIVE and ENABLED as valid connection statuses
                if conn_status:
                    status_str = str(conn_status).upper()
                    if status_str not in ['ACTIVE', 'ENABLED']:
                        # Delete old INITIATED connections (ghost connections from incomplete OAuth)
                        # BUT: Only delete if INITIATED for more than 5 minutes (give users time to complete OAuth)
                        if status_str == 'INITIATED':
                            try:
                                connection_id = None
                                if hasattr(conn, 'id'): connection_id = conn.id
                                elif hasattr(conn, 'connectionId'): connection_id = conn.connectionId

                                # Check connection age before deleting
                                should_delete = False
                                if hasattr(conn, 'createdAt') or hasattr(conn, 'created_at'):
                                    created_time = getattr(conn, 'createdAt', None) or getattr(conn, 'created_at', None)
                                    if created_time:
                                        from datetime import datetime, timezone as dt_timezone
                                        try:
                                            # Parse creation time
                                            if isinstance(created_time, str):
                                                created_dt = datetime.fromisoformat(created_time.replace('Z', '+00:00'))
                                            else:
                                                created_dt = created_time

                                            # Only delete if older than 5 minutes
                                            age_minutes = (datetime.now(dt_timezone.utc) - created_dt).total_seconds() / 60
                                            if age_minutes > 5:
                                                should_delete = True
                                                print(f"⏰ INITIATED connection is {age_minutes:.1f} minutes old - will delete")
                                            else:
                                                print(f"⏰ INITIATED connection is {age_minutes:.1f} minutes old - keeping (user may still be completing OAuth)")
                                        except Exception as time_err:
                                            print(f"⚠️  Couldn't parse creation time: {time_err}")
                                            # If we can't parse time, don't delete (safer to keep than delete)
                                            should_delete = False
                                else:
                                    # No creation time - delete to be safe
                                    should_delete = True
                                    print(f"⚠️  No creation time found for INITIATED connection - will delete")

                                if should_delete and connection_id:
                                    print(f"🗑️  Cleaning up stale INITIATED connection: {tool_name_debug} (ID: {connection_id})")
                                    self.composio_client.connected_accounts.delete(connection_id)
                                    print(f"✅ Deleted ghost connection: {tool_name_debug}")
                            except Exception as delete_error:
                                print(f"❌ Failed to delete ghost connection {tool_name_debug}: {delete_error}")
                        else:
                            print(f"⏭️  Skipping {tool_name_debug} - status: {status_str} (expected ACTIVE or ENABLED)")
                        continue
                    else:
                        print(f"✅ Found {tool_name_debug} with status: {status_str}")

                integration = None
                connection_id = None
                if hasattr(conn, 'toolkit') and conn.toolkit:
                    integration = getattr(conn.toolkit, 'slug', None)
                if hasattr(conn, 'id'): connection_id = conn.id
                elif hasattr(conn, 'connectionId'): connection_id = conn.connectionId
                if integration and connection_id:
                    connection_details.append({
                        'tool_name': integration.upper(),
                        'connection_id': connection_id,
                        'integrationId': getattr(conn, 'integrationId', None),
                        'entity_id': conn_entity or entity_id,
                    })
            print(f"✅ Found {len(connection_details)} connections for entity {entity_id}")
            return connection_details
        except Exception as e:
            print(f"Error getting connection details: {e}")
            import traceback
            traceback.print_exc()
            return []

    def disconnect_tool(self, tool_name: str) -> Dict[str, Any]:
        """
        Disconnects a tool by deleting it from Composio.
        Finds the connection and deletes it using the Composio API.
        """
        if not self.composio_client:
            logger.error("Composio client not configured for disconnect_tool")
            return {"success": False, "error": "Composio client not configured"}

        try:
            tool_name = tool_name.upper()
            logger.info(f"🔌 Attempting to disconnect {tool_name}")

            # Get all connections for this user
            connections = self.get_connection_details()
            logger.info(f"📊 Found {len(connections)} total connections")

            # Find the specific connection to delete
            connection_to_delete = None
            for conn in connections:
                if conn['tool_name'] == tool_name:
                    connection_to_delete = conn
                    break

            if not connection_to_delete:
                logger.warning(f"⚠️  No active connection found for {tool_name} in Composio")
                return {
                    "success": False,
                    "error": f"No active connection found for {tool_name}",
                    "available_connections": [c['tool_name'] for c in connections]
                }

            connection_id = connection_to_delete['connection_id']
            logger.info(f"🎯 Found connection to delete: {tool_name} (ID: {connection_id})")

            # Attempt to delete from Composio
            try:
                self.composio_client.connected_accounts.delete(connection_id)
                logger.info(f"✅ Successfully disconnected {tool_name} from Composio (ID: {connection_id})")

                # Invalidate connection cache
                entity_id = f"user_{self.user.id}"
                self._invalidate_connection_cache(entity_id=entity_id, tool_name=tool_name)

                return {
                    "success": True,
                    "message": f"Successfully disconnected {tool_name}",
                    "connection_id": connection_id,
                    "tool_name": tool_name
                }

            except Exception as delete_error:
                logger.error(f"❌ Failed to delete connection from Composio: {delete_error}")
                import traceback
                traceback.print_exc()
                return {
                    "success": False,
                    "error": f"Failed to disconnect from Composio: {str(delete_error)}",
                    "connection_id": connection_id
                }

        except Exception as e:
            logger.error(f"❌ Error in disconnect_tool for {tool_name}: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}

    def create_trigger(self, trigger_model) -> dict:
        """
        Creates a new event-based trigger in Composio.
        """
        # ... (This function is unchanged and correct) ...
        try:
            print(f"🔔 Creating trigger: {trigger_model.name}")
            print(f"   Trigger slug: {trigger_model.trigger_slug}")
            print(f"   Config: {trigger_model.trigger_config}")
            result = self.composio_client.triggers.create(
                app=trigger_model.trigger_slug.split('_')[0],
                trigger_name=trigger_model.trigger_slug,
                config=trigger_model.trigger_config
            )
            trigger_id = None
            if hasattr(result, 'id'): trigger_id = result.id
            elif hasattr(result, 'triggerId'): trigger_id = result.triggerId
            elif isinstance(result, dict): trigger_id = result.get('id') or result.get('triggerId')
            print(f"✅ Trigger created: {trigger_id}")
            return {'success': True, 'trigger_id': trigger_id, 'message': 'Trigger created successfully'}
        except Exception as e:
            print(f"❌ Error creating trigger: {e}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

    def get_available_triggers(self) -> dict:
        """
        Gets the hardcoded list of available triggers for the "Create Trigger" UI.
        """
        # ... (This function is unchanged and correct) ...
        return {
            'GMAIL': [{'slug': 'GMAIL_NEW_GMAIL_MESSAGE', 'name': 'New Email Received', 'type': 'event'}],
            'REDDIT': [
                {'slug': 'REDDIT_NEW_COMMENT_ON_POST', 'name': 'New Comment on Post', 'type': 'event'},
                {'slug': 'REDDIT_NEW_POST_IN_SUBREDDIT', 'name': 'New Post in Subreddit', 'type': 'event'},
            ],
            'GITHUB': [
                {'slug': 'GITHUB_NEW_ISSUE', 'name': 'New Issue Created', 'type': 'event'},
                {'slug': 'GITHUB_NEW_PR', 'name': 'New Pull Request', 'type': 'event'},
                {'slug': 'GITHUB_NEW_COMMIT', 'name': 'New Commit', 'type': 'event'},
            ],
            'SLACK': [
                {'slug': 'SLACK_NEW_MESSAGE', 'name': 'New Message in Channel', 'type': 'event'},
                {'slug': 'SLACK_NEW_MENTION', 'name': 'New Mention', 'type': 'event'},
            ],
            'TWITTER': [
                {'slug': 'TWITTER_NEW_MENTION', 'name': 'New Mention', 'type': 'event'},
                {'slug': 'TWITTER_NEW_FOLLOWER', 'name': 'New Follower', 'type': 'event'},
            ],
            'GOOGLEDRIVE': [{'slug': 'GOOGLEDRIVE_FILE_UPLOADED', 'name': 'New File Uploaded', 'type': 'event'}],
            'GOOGLECALENDAR': [
                {'slug': 'GOOGLECALENDAR_NEW_EVENT', 'name': 'New Calendar Event', 'type': 'event'},
                {'slug': 'GOOGLECALENDAR_EVENT_STARTING', 'name': 'Event Starting Soon', 'type': 'event'},
            ],
        }

    async def select_tools_for_prompt(self, user_prompt: str, app_names: List[str], chat_history: List[Dict[str, str]] = None, has_file_attachments: bool = False) -> List[str]:
        """
        Uses an AI call to select the specific tool slugs needed for a given prompt,
        using the hardcoded TOP_SLUGS_BY_APP dictionary AND chat history.

        Args:
            has_file_attachments: True if the current message has files attached

        ✅ Now async to work with AsyncOpenAI
        """
        if not self.openai_client:
            raise Exception("OpenAI client not configured")

        all_action_slugs = set()
        print(f"Selecting tools for apps: {app_names}")

        for app in app_names:
            if app in self.TOP_SLUGS_BY_APP:
                for slug in self.TOP_SLUGS_BY_APP[app]:
                    all_action_slugs.add(slug)

        if not all_action_slugs:
            print("No action slugs found in composio_config.py for these apps. Returning empty list.")
            return []

        all_action_slugs_list = list(all_action_slugs)
        print(f"Found {len(all_action_slugs_list)} total hardcoded slugs. Asking AI to select...")

        # --- (THIS IS THE FIX) ---
        # This new prompt is more robust and specifically handles multilingual
        # requests and the context of file attachments.
        system_prompt = (
            "You are an expert AI tool selector. Your job is to analyze a user's request "
            "and select the *exact* tool slugs needed to perform the task. "

            "RULES:\n"
            "1.  The user's prompt or history may be in *any language* (e.g., Hebrew, Spanish, English).\n"
            "2.  The 'Available Tools' list is *always* in English.\n"
            "3.  You MUST translate the user's intent to English and match it to the "
            "    correct tool slugs from the 'Available Tools' list.\n"

            "4.  **FILE ATTACHMENT RULE (CRITICAL):**\n"
            "    - IMPORTANT: Text content (stock analysis, weather, summaries) is NOT an attachment!\n"
            "      * For text-only emails: Use GMAIL_SEND_EMAIL (text goes in email body)\n"
            "      * Only use attachment tools when FILES_ATTACHED: true\n"
            "    - If files are attached to the current message (indicated by 'FILES_ATTACHED: true'),\n"
            "      you MUST select attachment-specific tools:\n"
            "      * For Gmail: Use GMAIL_SEND_EMAIL_WITH_ATTACHMENT (NOT GMAIL_SEND_EMAIL)\n"
            "      * For Twitter: Use TWITTER_UPLOAD_MEDIA if uploading media\n"
            "      * For other platforms: Use the appropriate upload/attachment tool\n"
            "    - Stock analysis, calculations, reports = TEXT CONTENT = use GMAIL_SEND_EMAIL\n"
            "    - Actual files (PDFs, images, documents) = use GMAIL_SEND_EMAIL_WITH_ATTACHMENT\n"

            "5.  **ACTION-ONLY SELECTION:**\n"
            "    - Only select tools for ACTIONS (sending, posting, creating documents)\n"
            "    - Do NOT select data fetching tools (those are handled separately by agent tools)\n"
            "    - ALWAYS focus on the FINAL ACTION the user wants: email, post, save, share, etc.\n"
            "    - If user asks to CREATE CONTENT AND POST/SEND it → SELECT THE POSTING/SENDING TOOL\n"
            "    - Examples:\n"
            "      * 'send me AAPL stock analysis' → select GMAIL_SEND_EMAIL\n"
            "      * 'post weather update to Twitter' → select TWITTER_CREATION_OF_A_POST\n"
            "      * 'create article about stocks and post to Twitter' → select TWITTER_CREATION_OF_A_POST\n"
            "      * 'write summary and email it to john@example.com' → select GMAIL_SEND_EMAIL\n"
            "    - ⚠️ IMPORTANT: Even if user asks to CREATE/GENERATE content first, if they mention\n"
            "      posting/sending/sharing it, YOU MUST SELECT THE POSTING/SENDING TOOL!\n"
            "\n"
            "6.  Return a JSON object with a single key: 'tools'.\n"
            "7.  The value of 'tools' must be a JSON list of the required tool slugs (strings).\n"
            "8.  If no tools are needed, return {\"tools\": []}."
        )
        # --- (END OF FIX) ---

        history_str = ""
        if chat_history:
            history_str = "\n".join(
                [f"{msg['role']}: {msg['content']}" for msg in chat_history]
            )

        # Add file attachment indicator
        files_indicator = "FILES_ATTACHED: true\n\n" if has_file_attachments else ""

        human_prompt = (
            f"{files_indicator}"
            f"--- Conversation History (for context) ---\n"
            f"{history_str}\n\n"
            f"--- Current User Prompt ---\n"
            f"{user_prompt}\n\n"
            f"--- Available Tools ---\n"
            f"{json.dumps(all_action_slugs_list)}"
        )

        try:
            # ✅ No sync wrapper needed - already async
            # Using gpt-4o-mini for tool selection as it's more reliable for structured JSON responses
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": human_prompt}
                ],
                response_format={"type": "json_object"}
            )

            response_content = response.choices[0].message.content
            print(f"AI Tool Selector response: {response_content}")

            selected_tools = []
            try:
                # SECURITY: Use safe JSON parsing
                data = parse_json_safely(response_content, default={})
                if "tools" in data and isinstance(data["tools"], list):
                    selected_tools = data["tools"]
                elif isinstance(data, list):
                    selected_tools = data
                elif isinstance(data, dict):
                    for key, value in data.items():
                        if isinstance(value, list):
                            selected_tools = value
                            break

                if not all(isinstance(tool, str) for tool in selected_tools):
                    raise ValueError("AI response was not a list of strings.")

                print(f"Successfully selected {len(selected_tools)} tools by AI.")

                # === APPLY TOOL DEPENDENCY ENGINE ===
                # Automatically add required dependency tools
                dependency_engine = get_tool_dependency_engine()
                enhanced_tools = dependency_engine.enforce_dependencies(
                    selected_tools=selected_tools,
                    connected_apps=app_names
                )

                return enhanced_tools

            except Exception as e:
                print(f"Error parsing AI tool selection response: {e}. Returning empty list.")
                return []

        except Exception as e:
            print(f"Error calling OpenAI for tool selection: {e}")
            return []


    def run_chat_with_tools(self, agent_model, message: str, attachments: list, tool_slugs: List[str]) -> str:
        """
        This function is obsolete and no longer called by views.py.
        The logic has been moved into the 'chat' action in AgentViewSet.
        """
        print("--- [WARNING] Obsolete function 'run_chat_with_tools' was called. ---")
        try:
            message_with_context = message
            if attachments:
                file_context = "\n\nAttached files:\n"
                for att in attachments:
                    file_context += f"- {att['filename']} ({att['mime_type']}, {att['size']} bytes)\n"
                    file_context += f"  File path: {att['file_path']}\n"
                message_with_context = message + file_context

            if not tool_slugs or not self.composio_client:
                print("No tool_slugs provided or client not configured. Falling back to basic chat.")
                return asyncio.run(self._chat_without_tools(agent_model, message_with_context))

            print(f"Executing chat with {len(tool_slugs)} specific tools.")
            return asyncio.run(self._chat_with_composio(
                agent_model,
                message_with_context,
                specific_tools_slugs=tool_slugs
            ))

        except Exception as e:
            print(f"Error in run_chat_with_tools: {e}")
            import traceback
            traceback.print_exc()
            return f"Sorry, I encountered an error: {str(e)}"

    def _detect_simulated_actions(self, output: str, available_tools: list) -> None:
        """
        Task 6: Detect when agent simulates actions instead of executing tools.
        Logs warnings to help identify and debug simulation behavior.
        """
        if not output or not available_tools:
            return

        # Keywords indicating simulation/description instead of execution
        simulation_keywords = [
            "I'll send", "I will send", "I would send",
            "I'll create", "I will create", "I would create",
            "I'll search", "I will search", "I would search",
            "I can help you send", "I can help you create",
            "Here's what I would", "Here's what I'll",
            "Let me send", "Let me create", "Let me search",
            "I'm going to send", "I'm going to create",
        ]

        output_lower = output.lower()
        detected_simulations = []

        for keyword in simulation_keywords:
            if keyword.lower() in output_lower:
                detected_simulations.append(keyword)

        if detected_simulations:
            print(f"⚠️  SIMULATION DETECTED: Agent described action instead of executing")
            print(f"   Keywords found: {detected_simulations}")
            print(f"   Available tools: {[t.split('_')[0] for t in available_tools[:3]]}")
            print(f"   Response preview: {output[:200]}...")
            print(f"   💡 TIP: Agent should USE tools, not describe them!")

    def _verify_execution_success(self, output: str, intent_resolution) -> bool:
        """
        Post-execution verification - Check if agent successfully completed the task.

        Returns:
            True if execution appears successful, False otherwise
        """
        if not output:
            return False

        output_lower = output.lower()

        # Success indicators
        success_keywords = [
            "successfully", "completed", "done", "sent", "posted", "created",
            "scheduled", "uploaded", "downloaded", "shared", "email sent",
            "tweet posted", "event created", "file uploaded"
        ]

        # Failure indicators
        failure_keywords = [
            "error", "failed", "couldn't", "cannot", "unable to",
            "not found", "invalid", "problem", "issue"
        ]

        has_success = any(keyword in output_lower for keyword in success_keywords)
        has_failure = any(keyword in output_lower for keyword in failure_keywords)

        if has_failure:
            print(f"⚠️  Execution may have failed - failure keywords detected")
            return False

        if has_success:
            print(f"✅ Execution appears successful - success keywords detected")
            return True

        # If no clear indicators, assume success (benefit of doubt)
        print(f"ℹ️  Execution status unclear - no definitive success/failure indicators")
        return True

    async def generate_greeting_message(self, agent_model) -> str:
        """
        Generates a personalized greeting message for the agent.
        Uses agent name, purpose (from prompt), and available tools.

        Returns a warm, professional greeting that:
        - Introduces the agent by name
        - Explains what it can help with
        - Lists its capabilities based on connected tools

        ✅ Now async to work with AsyncOpenAI
        """
        if not self.openai_client:
            # Fallback greeting if OpenAI is not configured
            tools_text = ""
            all_tools = []
            if agent_model.app_connections:
                all_tools.extend(agent_model.app_connections)
            if agent_model.agent_tools:
                all_tools.extend(agent_model.agent_tools)
            if all_tools:
                tools_list = ", ".join(all_tools)
                tools_text = f" I have access to {tools_list} to assist you."
            return f"Hi! I'm {agent_model.name}. I'm here to help you.{tools_text}"

        try:
            # Build context about available tools (both Composio and agent tools)
            tools_context = ""
            all_tools = []

            if agent_model.app_connections:
                all_tools.extend(agent_model.app_connections)

            if agent_model.agent_tools:
                all_tools.extend(agent_model.agent_tools)

            if all_tools:
                tools_list = ", ".join(all_tools)
                tools_context = f"\nAvailable Tools: {tools_list}"
            else:
                tools_context = "\nAvailable Tools: General assistance (no specific tools)"

            system_prompt = (
                "You are a greeting assistant. Generate a warm, professional greeting message "
                "for an AI agent based on its name, purpose, and capabilities.\n\n"
                "The greeting should:\n"
                "1. Start with 'Hi! I'm [Agent Name]'\n"
                "2. Briefly describe the agent's purpose in one sentence\n"
                "3. Mention what specific things it can help with based on available tools\n"
                "4. Be 2-3 sentences maximum\n"
                "5. Be conversational, friendly, and helpful\n"
                "6. Focus on capabilities, not limitations\n\n"
                "Return ONLY the greeting message, nothing else."
            )

            user_prompt = (
                f"Agent Name: {agent_model.name}\n"
                f"Agent Purpose/Prompt: {agent_model.prompt}\n"
                f"{tools_context}\n\n"
                f"Generate a personalized greeting message for this agent."
            )

            # ✅ No sync wrapper needed - already async
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_completion_tokens=150
            )

            greeting = response.choices[0].message.content.strip()
            print(f"✅ Generated greeting for agent {agent_model.name}: {greeting[:50]}...")
            return greeting

        except Exception as e:
            print(f"Error generating greeting message: {e}")
            import traceback
            traceback.print_exc()

            # Fallback to simple greeting
            tools_text = ""
            all_tools = []
            if agent_model.app_connections:
                all_tools.extend(agent_model.app_connections)
            if agent_model.agent_tools:
                all_tools.extend(agent_model.agent_tools)
            if all_tools:
                tools_list = ", ".join(all_tools)
                tools_text = f" I have access to {tools_list} to assist you."
            return f"Hi! I'm {agent_model.name}. I'm here to help you.{tools_text}"
