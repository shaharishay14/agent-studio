"""
Server-Sent Events (SSE) streaming utilities for real-time agent updates.
"""
import json
import time
from typing import AsyncGenerator, Generator, Dict, Any


def format_sse_event(event_type: str, data: Dict[Any, Any]) -> str:
    """
    Format data as Server-Sent Events (SSE) message.

    Args:
        event_type: Type of event (status, tool_call_start, content_delta, etc.)
        data: Dictionary of event data

    Returns:
        Formatted SSE message string
    """
    json_data = json.dumps(data)
    return f"event: {event_type}\ndata: {json_data}\n\n"


class WordBuffer:
    """
    Buffers text content and yields complete words for streaming.
    Provides a better UX than character-by-character streaming.
    """

    def __init__(self):
        self.buffer = ""
        self.word_delimiters = {' ', '\n', '\t', '.', ',', '!', '?', ';', ':'}

    def add(self, text: str) -> Generator[str, None, None]:
        """
        Add text to buffer and yield complete words.

        Args:
            text: Text chunk to add

        Yields:
            Complete words ready to be sent
        """
        self.buffer += text

        # Check if we have any word delimiters
        while any(delimiter in self.buffer for delimiter in self.word_delimiters):
            # Find the earliest delimiter
            delimiter_positions = [
                (self.buffer.find(d), d)
                for d in self.word_delimiters
                if d in self.buffer
            ]
            delimiter_positions = [(pos, d) for pos, d in delimiter_positions if pos != -1]

            if not delimiter_positions:
                break

            # Get the earliest delimiter
            pos, delimiter = min(delimiter_positions, key=lambda x: x[0])

            # Yield the word including the delimiter
            word = self.buffer[:pos + 1]
            if word.strip():  # Only yield if not empty
                yield word

            # Remove from buffer
            self.buffer = self.buffer[pos + 1:]

    def flush(self) -> str:
        """
        Flush remaining buffer content.

        Returns:
            Remaining text in buffer
        """
        result = self.buffer
        self.buffer = ""
        return result


def create_sse_generator(async_gen: AsyncGenerator) -> Generator[str, None, None]:
    """
    Convert async generator to sync generator for Django StreamingHttpResponse.

    Args:
        async_gen: Async generator that yields SSE events

    Yields:
        SSE formatted strings
    """
    import asyncio

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    try:
        while True:
            try:
                event = loop.run_until_complete(async_gen.__anext__())
                yield event
            except StopAsyncIteration:
                break
    finally:
        loop.close()


def send_heartbeat() -> str:
    """
    Create a heartbeat/keepalive event to maintain connection.

    Returns:
        SSE formatted heartbeat message
    """
    return format_sse_event('heartbeat', {'timestamp': time.time()})


def send_status_event(status: str, message: str = "") -> str:
    """
    Create a status update event.

    Args:
        status: Status type (thinking, tool_calling, responding, complete)
        message: Optional descriptive message

    Returns:
        SSE formatted status event
    """
    return format_sse_event('status', {
        'status': status,
        'message': message,
        'timestamp': time.time()
    })


def send_tool_call_start_event(tool_name: str, parameters: Dict[Any, Any]) -> str:
    """
    Create a tool call start event.

    Args:
        tool_name: Name of the tool being called
        parameters: Tool parameters

    Returns:
        SSE formatted tool call start event
    """
    return format_sse_event('tool_call_start', {
        'tool': tool_name,
        'parameters': parameters,
        'timestamp': time.time()
    })


def send_tool_call_result_event(tool_name: str, success: bool, result: Any, error: str = None) -> str:
    """
    Create a tool call result event.

    Args:
        tool_name: Name of the tool that was called
        success: Whether tool execution succeeded
        result: Tool execution result
        error: Error message if failed

    Returns:
        SSE formatted tool call result event
    """
    return format_sse_event('tool_call_result', {
        'tool': tool_name,
        'success': success,
        'result': result,
        'error': error,
        'timestamp': time.time()
    })


def send_content_delta_event(content: str, index: int = 0) -> str:
    """
    Create a content delta event for streaming text.

    Args:
        content: Text chunk to send
        index: Optional index for ordering

    Returns:
        SSE formatted content delta event
    """
    return format_sse_event('content_delta', {
        'content': content,
        'index': index,
        'timestamp': time.time()
    })


def send_message_complete_event(message_id: str = None, content: str = None, created_at: str = None) -> str:
    """
    Create a message complete event.

    Args:
        message_id: UUID of saved message (optional for ephemeral mode)
        content: Full message content
        created_at: Timestamp of message creation (optional for ephemeral mode)

    Returns:
        SSE formatted message complete event
    """
    return format_sse_event('message_complete', {
        'message_id': str(message_id) if message_id else None,
        'content': content,
        'created_at': created_at,
        'timestamp': time.time()
    })


def send_done_event() -> str:
    """
    Create a done event to signal stream completion.

    Returns:
        SSE formatted done event
    """
    return format_sse_event('done', {'timestamp': time.time()})


def send_error_event(error: str, details: str = None) -> str:
    """
    Create an error event.

    Args:
        error: Error message
        details: Optional detailed error information

    Returns:
        SSE formatted error event
    """
    return format_sse_event('error', {
        'error': error,
        'details': details,
        'timestamp': time.time()
    })
