"""
Backward compatibility re-export of AgentService.

This module provides backward compatibility for imports that previously used:
    from api_agents.agent_service import AgentService

The actual implementation has moved to:
    from api_agents.agents.services.agent_service import AgentService

This file should be removed after updating all internal imports.
"""

from .agents.services.agent_service import AgentService

__all__ = ['AgentService']
