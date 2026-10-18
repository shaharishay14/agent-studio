"""
Suppress drf-spectacular warnings for views that already have proper @extend_schema decorators.
"""
import sys
import io
from contextlib import contextmanager


class FilteredStderr(io.TextIOWrapper):
    """Custom stderr that filters out specific warning messages"""
    
    def __init__(self, original_stderr):
        self.original_stderr = original_stderr
        self.buffer = original_stderr.buffer
        super().__init__(self.buffer, encoding=original_stderr.encoding, errors=original_stderr.errors)
    
    def write(self, text):
        # Filter out specific warning messages
        if any(phrase in text for phrase in [
            'unable to guess serializer',
            'AbstractTokenStrategy is deprecated',
            'could not resolve authenticator',
            'could not derive type of path parameter'
        ]):
            return  # Suppress these warnings
        return self.original_stderr.write(text)
    
    def flush(self):
        return self.original_stderr.flush()


@contextmanager
def suppress_spectacular_warnings():
    """Context manager to suppress drf-spectacular warnings during schema generation"""
    original_stderr = sys.stderr
    try:
        sys.stderr = FilteredStderr(original_stderr)
        yield
    finally:
        sys.stderr = original_stderr

