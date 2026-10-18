"""
Agent Tools Configuration
--------------------------
Defines available agent-specific tools (non-Composio) that can be added to agents.
These tools are managed by the backend and don't require external connections.
"""

AGENT_TOOLS = {
    'weather': {
        'name': 'Weather',
        'description': 'Get current weather and forecasts for any location worldwide',
        'icon': '🌤️',
        'category': 'information',
        'requires_api_key': False,  # Uses free Open-Meteo API
        'api_key_name': None
    },
    'calculator': {
        'name': 'Calculator',
        'description': 'Perform mathematical calculations and evaluate expressions',
        'icon': '🧮',
        'category': 'utility',
        'requires_api_key': False,
        'api_key_name': None
    },
    'yahoo_finance': {
        'name': 'Yahoo Finance',
        'description': 'Get stock prices, market data, and financial information',
        'icon': '📈',
        'category': 'finance',
        'requires_api_key': False,  # Uses yfinance library
        'api_key_name': None
    },
    'youtube': {
        'name': 'YouTube',
        'description': 'Search YouTube videos and get video information',
        'icon': '📺',
        'category': 'media',
        'requires_api_key': True,  # YouTube Data API v3
        'api_key_name': 'YOUTUBE_API_KEY'
    },
    'web_search': {
        'name': 'Web Search',
        'description': 'Search the web for current information and answers',
        'icon': '🔍',
        'category': 'information',
        'requires_api_key': True,  # SerpAPI
        'api_key_name': 'SERPAPI_KEY'
    },
    'website_reader': {
        'name': 'Website Reader',
        'description': 'Read and extract content from any website URL',
        'icon': '🌐',
        'category': 'information',
        'requires_api_key': False,
        'api_key_name': None
    }
}


def get_tool_metadata(tool_name: str) -> dict:
    """Get metadata for a specific tool"""
    return AGENT_TOOLS.get(tool_name, {})


def get_all_tool_names() -> list:
    """Get list of all available tool names"""
    return list(AGENT_TOOLS.keys())


def is_valid_tool(tool_name: str) -> bool:
    """Check if a tool name is valid"""
    return tool_name in AGENT_TOOLS


# OpenAI function definitions for agent tools
AGENT_TOOLS_OPENAI_FUNCTIONS = {
    'weather': {
        'type': 'function',
        'function': {
            'name': 'get_weather',
            'description': 'Get current weather information for any location worldwide. Returns temperature, humidity, weather conditions, wind speed, and feels like temperature.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'location': {
                        'type': 'string',
                        'description': 'The location to get weather for (e.g., "London", "New York", "Tokyo", "Paris, France")'
                    }
                },
                'required': ['location']
            }
        }
    },
    'calculator': {
        'type': 'function',
        'function': {
            'name': 'calculate',
            'description': 'Perform mathematical calculations. Supports basic arithmetic (+, -, *, /), exponents (**), modulo (%), and common math functions like sqrt, sin, cos, tan, log, etc. Example: "2 + 2", "sqrt(16)", "5 ** 3"',
            'parameters': {
                'type': 'object',
                'properties': {
                    'expression': {
                        'type': 'string',
                        'description': 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "10 * (5 + 3)")'
                    }
                },
                'required': ['expression']
            }
        }
    },
    'yahoo_finance': {
        'type': 'function',
        'function': {
            'name': 'get_stock_data',
            'description': 'Get stock price and market data for a ticker symbol. Returns current price, change, percent change, volume, market cap, and other financial metrics.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'ticker': {
                        'type': 'string',
                        'description': 'Stock ticker symbol (e.g., "AAPL" for Apple, "GOOGL" for Google, "MSFT" for Microsoft)'
                    }
                },
                'required': ['ticker']
            }
        }
    },
    'youtube': {
        'type': 'function',
        'function': {
            'name': 'search_youtube',
            'description': 'Search YouTube for videos. Returns video titles, descriptions, URLs, channel names, view counts, and publish dates.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {
                        'type': 'string',
                        'description': 'The search query (e.g., "Python tutorials", "cooking recipes", "music videos")'
                    },
                    'max_results': {
                        'type': 'integer',
                        'description': 'Maximum number of results to return (default: 5)',
                        'default': 5
                    }
                },
                'required': ['query']
            }
        }
    },
    'web_search': {
        'type': 'function',
        'function': {
            'name': 'web_search',
            'description': 'Search the web for current information and answers. Returns titles, descriptions, URLs, and snippets from search results.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {
                        'type': 'string',
                        'description': 'The search query (e.g., "latest news", "Python tutorials", "weather in London")'
                    },
                    'num_results': {
                        'type': 'integer',
                        'description': 'Number of results to return (default: 5)',
                        'default': 5
                    }
                },
                'required': ['query']
            }
        }
    },
    'website_reader': {
        'type': 'function',
        'function': {
            'name': 'read_website',
            'description': 'Read and extract text content from any website URL. Returns the main text content, title, and metadata from the page.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'url': {
                        'type': 'string',
                        'description': 'The full URL of the website to read (e.g., "https://example.com/article")'
                    }
                },
                'required': ['url']
            }
        }
    }
}


def get_openai_functions_for_tools(tool_names: list) -> list:
    """
    Convert a list of agent tool names to OpenAI function definitions.

    Args:
        tool_names: List of tool names enabled for the agent

    Returns:
        List of OpenAI function definitions
    """
    functions = []
    for tool_name in tool_names:
        if tool_name in AGENT_TOOLS_OPENAI_FUNCTIONS:
            functions.append(AGENT_TOOLS_OPENAI_FUNCTIONS[tool_name])
    return functions
