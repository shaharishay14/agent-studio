"""
Tool Call Interceptor - Controller Pattern Component

Intercepts and validates tool calls before execution to ensure:
- Parameter sanitization (security)
- Business logic enforcement (determinism)
- Observability (structured logging)
"""

import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ToolCallValidation:
    """Result of tool call validation"""
    allowed: bool
    tool_call: Any = None
    error: Optional[str] = None
    warnings: list = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class ToolCallInterceptor:
    """
    Intercepts tool calls before execution to validate parameters and enforce business logic.

    This is the "Controller" layer that sits between the Brain (LLM) and Body (Executor).
    """

    def __init__(self):
        self.validation_rules = {
            'GOOGLEDRIVE_DOWNLOAD_FILE': self._validate_drive_download,
            'GMAIL_SEND_EMAIL': self._validate_gmail_send,
            'GOOGLEDOCS_CREATE_DOCUMENT': self._validate_docs_create,
            'GOOGLECALENDAR_CREATE_EVENT': self._validate_calendar_event,
        }

    async def intercept_tool_call(self, tool_call) -> ToolCallValidation:
        """
        Main interception point - validates tool call before execution.

        Args:
            tool_call: Tool call object from LLM (has .function.name and .function.arguments)

        Returns:
            ToolCallValidation with allowed=True/False and optional error message
        """
        tool_name = tool_call.function.name

        # Log what the Brain requested (observability)
        logger.info("BRAIN_REQUEST", extra={
            'tool': tool_name,
            'params': tool_call.function.arguments[:200]  # First 200 chars
        })

        # Apply sanitization to all parameters
        try:
            import json
            params = json.loads(tool_call.function.arguments)
            sanitized_params = self._sanitize_params(params)

            # Update tool call with sanitized params
            tool_call.function.arguments = json.dumps(sanitized_params)

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in tool call arguments: {e}")
            return ToolCallValidation(
                allowed=False,
                error=f"Invalid parameters format: {str(e)}"
            )

        # Apply tool-specific validation rules
        if tool_name in self.validation_rules:
            validation_func = self.validation_rules[tool_name]
            validation_result = validation_func(sanitized_params)

            if not validation_result.allowed:
                logger.warning("TOOL_CALL_REJECTED", extra={
                    'tool': tool_name,
                    'reason': validation_result.error
                })
                return validation_result

        # All checks passed
        logger.info("TOOL_CALL_APPROVED", extra={
            'tool': tool_name,
            'params_sanitized': True
        })

        return ToolCallValidation(
            allowed=True,
            tool_call=tool_call
        )

    def _sanitize_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize all parameters to prevent injection attacks.

        - Remove null bytes
        - Escape special characters
        - Validate data types
        """
        sanitized = {}

        for key, value in params.items():
            if isinstance(value, str):
                # Remove null bytes
                value = value.replace('\x00', '')
                # Limit string length
                value = value[:10000]
                # Escape common injection patterns
                value = value.replace('${', '\\${')
                value = value.replace('`', '\\`')

            elif isinstance(value, dict):
                # Recursively sanitize nested dicts
                value = self._sanitize_params(value)

            elif isinstance(value, list):
                # Sanitize lists
                value = [self._sanitize_params({0: item})[0] if isinstance(item, dict)
                        else item for item in value[:100]]  # Limit list size

            sanitized[key] = value

        return sanitized

    def _validate_drive_download(self, params: Dict[str, Any]) -> ToolCallValidation:
        """Validate Google Drive download parameters"""
        if not params.get('file_id'):
            return ToolCallValidation(
                allowed=False,
                error="Missing file_id - need to search for file first"
            )

        # Validate file_id format (basic check)
        file_id = params['file_id']
        if not isinstance(file_id, str) or len(file_id) < 10:
            return ToolCallValidation(
                allowed=False,
                error=f"Invalid file_id format: {file_id}"
            )

        return ToolCallValidation(allowed=True)

    def _validate_gmail_send(self, params: Dict[str, Any]) -> ToolCallValidation:
        """Validate Gmail send parameters"""
        warnings = []

        # Check required fields
        if not params.get('to'):
            return ToolCallValidation(
                allowed=False,
                error="Missing 'to' email address"
            )

        if not params.get('subject') and not params.get('body'):
            warnings.append("Email has no subject or body")

        # Validate email format (basic)
        email = params.get('to')
        if '@' not in str(email):
            return ToolCallValidation(
                allowed=False,
                error=f"Invalid email format: {email}"
            )

        return ToolCallValidation(
            allowed=True,
            warnings=warnings
        )

    def _validate_docs_create(self, params: Dict[str, Any]) -> ToolCallValidation:
        """Validate Google Docs creation parameters"""
        if not params.get('title'):
            return ToolCallValidation(
                allowed=False,
                error="Missing document title"
            )

        return ToolCallValidation(allowed=True)

    def _validate_calendar_event(self, params: Dict[str, Any]) -> ToolCallValidation:
        """Validate Google Calendar event parameters"""
        if not params.get('summary'):
            return ToolCallValidation(
                allowed=False,
                error="Missing event summary/title"
            )

        if not params.get('start_time'):
            return ToolCallValidation(
                allowed=False,
                error="Missing event start time"
            )

        return ToolCallValidation(allowed=True)
