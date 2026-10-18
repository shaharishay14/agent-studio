"""
Backward compatibility re-export of agent tools configuration.

This module provides backward compatibility for imports that previously used:
    from api_agents.agent_tools_config import AGENT_TOOLS, get_all_tool_names, is_valid_tool

The actual implementation has moved to:
    from api_agents.agents.tools_config import AGENT_TOOLS, get_all_tool_names, is_valid_tool

This file should be removed after updating all internal imports.
"""

from .agents.tools_config import (
    AGENT_TOOLS,
    get_tool_metadata,
    get_all_tool_names,
    is_valid_tool,
    AGENT_TOOLS_OPENAI_FUNCTIONS,
    get_openai_functions_for_tools
)

__all__ = [
    'AGENT_TOOLS',
    'get_tool_metadata',
    'get_all_tool_names',
    'is_valid_tool',
    'AGENT_TOOLS_OPENAI_FUNCTIONS',
    'get_openai_functions_for_tools'
]
