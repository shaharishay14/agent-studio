"""
Backward compatibility re-export of social authentication views.

This module provides backward compatibility for imports that previously used:
    from api_agents.social_auth_views import ...

The actual implementation has moved to:
    from api_agents.authentication.social_auth_views import ...

This file should be removed after updating all internal imports.
"""

# Import all public names from the new location
from .authentication.social_auth_views import *

__all__ = []
