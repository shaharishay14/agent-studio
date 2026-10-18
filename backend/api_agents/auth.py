"""
Backward compatibility re-export of authentication module.

This module provides backward compatibility for imports that previously used:
    from api_agents.auth import CookieJWTAuthentication

The actual implementation has moved to:
    from api_agents.authentication.auth import CookieJWTAuthentication

This file should be removed after updating all internal imports.
"""

from .authentication.auth import CookieJWTAuthentication

__all__ = ['CookieJWTAuthentication']
