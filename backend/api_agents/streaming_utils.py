"""
Backward compatibility re-export of streaming utilities.

This module provides backward compatibility for imports that previously used:
    from api_agents.streaming_utils import format_sse_event, send_status_event, etc.

The actual implementation has moved to:
    from api_agents.shared.streaming_utils import format_sse_event, send_status_event, etc.

This file should be removed after updating all internal imports.
"""

from .shared.streaming_utils import (
    format_sse_event,
    WordBuffer,
    send_status_event,
    send_tool_call_start_event,
    send_tool_call_result_event,
    send_content_delta_event,
    send_message_complete_event,
    send_done_event,
    send_error_event
)

__all__ = [
    'format_sse_event',
    'WordBuffer',
    'send_status_event',
    'send_tool_call_start_event',
    'send_tool_call_result_event',
    'send_content_delta_event',
    'send_message_complete_event',
    'send_done_event',
    'send_error_event'
]
