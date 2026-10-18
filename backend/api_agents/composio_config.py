"""
Backward compatibility re-export of Composio configuration.

This module provides backward compatibility for imports that previously used:
    from api_agents.composio_config import APP_SLUGS, APP_METADATA, TOP_SLUGS_BY_APP

The actual implementation has moved to:
    from api_agents.tools.composio_config import APP_SLUGS, APP_METADATA, TOP_SLUGS_BY_APP

This file should be removed after updating all internal imports.
"""

from .tools.composio_config import (
    APP_SLUGS,
    APP_METADATA,
    TOP_SLUGS_BY_APP
)

__all__ = [
    'APP_SLUGS',
    'TOP_SLUGS_BY_APP',
    'APP_METADATA'
]
