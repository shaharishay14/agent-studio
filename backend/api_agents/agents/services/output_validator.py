"""
Output Validator - Post-Execution Validation Layer

Validates tool execution results to ensure they meet expectations.
This is part of the Controller pattern's post-execution validation.
"""

import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of output validation"""
    valid: bool
    result: Any = None
    error: Optional[str] = None
    warnings: list = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class OutputValidator:
    """
    Validates tool execution results to ensure success and data integrity.

    Examples:
    - Gmail send: Verify message_id exists
    - Docs create: Verify document_url exists
    - File download: Verify file_path not empty
    """

    def __init__(self):
        self.validation_rules = {
            'GMAIL_SEND_EMAIL': self._validate_gmail_result,
            'GOOGLEDOCS_CREATE_DOCUMENT': self._validate_docs_result,
            'GOOGLEDRIVE_DOWNLOAD_FILE': self._validate_drive_download_result,
            'GOOGLECALENDAR_CREATE_EVENT': self._validate_calendar_result,
            'GOOGLEDRIVE_SEARCH_FILES': self._validate_drive_search_result,
        }

    def validate_result(self, tool_name: str, result: Any) -> ValidationResult:
        """
        Validate tool execution result.

        Args:
            tool_name: Name of the tool that was executed
            result: The result returned by the tool

        Returns:
            ValidationResult with valid=True/False and optional error message
        """
        # Log the result for observability
        logger.info("TOOL_RESULT_VALIDATION", extra={
            'tool': tool_name,
            'result_type': type(result).__name__,
            'has_success': 'success' in result if isinstance(result, dict) else False
        })

        # Check for exceptions
        if isinstance(result, Exception):
            logger.error("TOOL_EXECUTION_EXCEPTION", extra={
                'tool': tool_name,
                'exception': str(result)
            })
            return ValidationResult(
                valid=False,
                error=f"Tool execution failed: {str(result)}"
            )

        # Check for explicit success/error in result
        if isinstance(result, dict):
            if result.get('success') is False:
                error_msg = result.get('error', 'Unknown error')
                logger.warning("TOOL_RETURNED_ERROR", extra={
                    'tool': tool_name,
                    'error': error_msg
                })
                return ValidationResult(
                    valid=False,
                    error=error_msg
                )

        # Apply tool-specific validation
        if tool_name in self.validation_rules:
            validation_func = self.validation_rules[tool_name]
            return validation_func(result)

        # Generic validation: result should not be None or empty dict
        if result is None:
            return ValidationResult(
                valid=False,
                error="Tool returned None"
            )

        if isinstance(result, dict) and not result:
            return ValidationResult(
                valid=False,
                error="Tool returned empty result"
            )

        # Default: assume valid if no specific validation
        return ValidationResult(valid=True, result=result)

    def _validate_gmail_result(self, result: Any) -> ValidationResult:
        """Validate Gmail send result"""
        if not isinstance(result, dict):
            return ValidationResult(
                valid=False,
                error=f"Expected dict result, got {type(result).__name__}"
            )

        # Check for message_id (indicates successful send)
        message_id = result.get('message_id') or result.get('id') or result.get('messageId')

        if not message_id:
            return ValidationResult(
                valid=False,
                error="Email send failed - no message_id in response"
            )

        logger.info("EMAIL_SENT_SUCCESS", extra={'message_id': message_id})

        return ValidationResult(
            valid=True,
            result=result
        )

    def _validate_docs_result(self, result: Any) -> ValidationResult:
        """Validate Google Docs creation result"""
        if not isinstance(result, dict):
            return ValidationResult(
                valid=False,
                error=f"Expected dict result, got {type(result).__name__}"
            )

        # Check for document URL or ID
        doc_url = result.get('document_url') or result.get('url') or result.get('documentUrl')
        doc_id = result.get('document_id') or result.get('id') or result.get('documentId')

        if not doc_url and not doc_id:
            return ValidationResult(
                valid=False,
                error="Document creation failed - no URL or ID in response"
            )

        logger.info("DOCUMENT_CREATED_SUCCESS", extra={
            'doc_id': doc_id,
            'has_url': bool(doc_url)
        })

        return ValidationResult(
            valid=True,
            result=result
        )

    def _validate_drive_download_result(self, result: Any) -> ValidationResult:
        """Validate Google Drive download result"""
        if not isinstance(result, dict):
            return ValidationResult(
                valid=False,
                error=f"Expected dict result, got {type(result).__name__}"
            )

        # Check for file path
        file_path = result.get('file_path') or result.get('path') or result.get('local_path')

        if not file_path:
            return ValidationResult(
                valid=False,
                error="File download failed - no file_path in response"
            )

        logger.info("FILE_DOWNLOADED_SUCCESS", extra={'file_path': file_path})

        return ValidationResult(
            valid=True,
            result=result
        )

    def _validate_calendar_result(self, result: Any) -> ValidationResult:
        """Validate Google Calendar event creation result"""
        if not isinstance(result, dict):
            return ValidationResult(
                valid=False,
                error=f"Expected dict result, got {type(result).__name__}"
            )

        # Check for event ID or link
        event_id = result.get('event_id') or result.get('id') or result.get('eventId')
        event_link = result.get('htmlLink') or result.get('link')

        if not event_id and not event_link:
            return ValidationResult(
                valid=False,
                error="Calendar event creation failed - no event ID or link"
            )

        logger.info("CALENDAR_EVENT_CREATED", extra={
            'event_id': event_id,
            'has_link': bool(event_link)
        })

        return ValidationResult(
            valid=True,
            result=result
        )

    def _validate_drive_search_result(self, result: Any) -> ValidationResult:
        """Validate Google Drive search result"""
        if not isinstance(result, dict):
            return ValidationResult(
                valid=False,
                error=f"Expected dict result, got {type(result).__name__}"
            )

        # Check for files array
        files = result.get('files') or result.get('items') or []

        warnings = []
        if not files:
            warnings.append("Search returned no files")

        logger.info("DRIVE_SEARCH_COMPLETE", extra={'file_count': len(files)})

        return ValidationResult(
            valid=True,
            result=result,
            warnings=warnings
        )
