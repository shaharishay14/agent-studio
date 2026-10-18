"""
Backward compatibility re-export of AgentToolsService.

This module provides backward compatibility for imports that previously used:
    from api_agents.agent_tools_service import AgentToolsService

The actual implementation has moved to:
    from api_agents.agents.services.agent_tools_service import AgentToolsService

This file should be removed after updating all internal imports.
"""

from .agents.services.agent_tools_service import AgentToolsService

__all__ = ['AgentToolsService']
