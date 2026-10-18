"""
Agent Tools Context Library
----------------------------
Provides expert-level guidance for agent-specific tools (non-Composio).
Each function returns concise, actionable context about how to use that tool effectively.

Design Principles:
- Token-efficient (100-200 tokens per tool)
- Action-oriented (what to DO, not just what the tool is)
- Covers common use cases and pitfalls
- Helps agent understand WHEN to use each tool
"""

from typing import Dict, Callable


def get_weather_tool_context() -> str:
    """Weather tool - Get current weather for any location"""
    return """
🌤️ **WEATHER TOOL**
• **Purpose**: Get real-time weather data for any location worldwide
• **When to Use**: User asks about weather, temperature, conditions, forecast
• **Usage**: get_weather(location="City, Country")
• **Examples**:
  - "What's the weather in London?" → get_weather(location="London, UK")
  - "Temperature in NYC?" → get_weather(location="New York, USA")
• **Returns**: Temperature (°C), humidity, conditions, wind speed, feels-like
• **Best Practice**: Always include country for clarity (e.g., "Paris, France" not just "Paris")
• **Coverage**: Any location worldwide with city name
"""


def get_calculator_tool_context() -> str:
    """Calculator tool - Perform mathematical calculations"""
    return """
🔢 **CALCULATOR TOOL**
• **Purpose**: Safely evaluate mathematical expressions
• **When to Use**: User asks to calculate, compute, or do math
• **Usage**: calculate(expression="your math expression")
• **Supported**: Addition (+), Subtraction (-), Multiplication (*), Division (/), Power (^), Parentheses
• **Examples**:
  - "What's 15% tip on $50?" → calculate(expression="50 * 0.15")
  - "2 to the power of 10" → calculate(expression="2^10")
  - "Average of 10, 20, 30" → calculate(expression="(10 + 20 + 30) / 3")
• **Security**: Only math operators allowed - no code execution
• **Best Practice**: Use for ANY calculation user requests, even simple ones
"""


def get_yahoo_finance_tool_context() -> str:
    """Yahoo Finance tool - Get stock market data"""
    return """
📈 **YAHOO FINANCE TOOL**
• **Purpose**: Get real-time stock quotes, prices, and financial data
• **When to Use**: User asks about stock prices, market data, company valuations
• **Usage**: get_stock_data(ticker="STOCK_SYMBOL")
• **Common Tickers**:
  - AAPL (Apple), GOOGL (Google), MSFT (Microsoft)
  - AMZN (Amazon), TSLA (Tesla), META (Facebook)
  - NFLX (Netflix), NVDA (Nvidia), BTC-USD (Bitcoin)
• **Examples**:
  - "What's Apple stock price?" → get_stock_data(ticker="AAPL")
  - "How much is Tesla trading for?" → get_stock_data(ticker="TSLA")
• **Returns**: Current price, market cap, P/E ratio, 52-week high/low, currency
• **CRITICAL**: Use ticker symbols (AAPL), NOT company names (Apple Inc.)
• **Coverage**: US stocks, major international stocks, crypto (BTC-USD, ETH-USD)
"""


def get_youtube_tool_context() -> str:
    """YouTube search tool"""
    return """
🎥 **YOUTUBE SEARCH TOOL**
• **Purpose**: Search for YouTube videos and get direct links
• **When to Use**: User asks to find videos, tutorials, music, or content on YouTube
• **Usage**: search_youtube(query="search term", max_results=5)
• **Examples**:
  - "Find Python tutorials" → search_youtube(query="Python programming tutorial", max_results=5)
  - "Show me jazz music" → search_youtube(query="smooth jazz music", max_results=5)
• **Returns**: Video titles, full URLs (youtube.com/watch?v=...), descriptions, channels, publish dates
• **Max Results**: 1-50 (default 5)
• **Best Practice**: Use specific search terms for better results
• **URLs**: Return the full YouTube URLs to user for easy access
"""


def get_web_search_tool_context() -> str:
    """Web search tool using SerpAPI"""
    return """
🔍 **WEB SEARCH TOOL**
• **Purpose**: Search the web for current, real-time information
• **When to Use**:
  - User asks for "current", "latest", "today", "now", "recent"
  - News, current events, real-time data
  - Information beyond your knowledge cutoff (January 2025)
  - Live data: sports scores, stock news, breaking news
• **Usage**: web_search(query="your search query", num_results=5)
• **Examples**:
  - "Latest AI news" → web_search(query="latest AI news December 2025", num_results=5)
  - "Current Bitcoin price" → web_search(query="Bitcoin price today", num_results=3)
  - "Who won the game yesterday?" → web_search(query="[team] game result yesterday", num_results=3)
• **Returns**: Search result titles, URLs, snippets
• **Best Practice**: Include time-relevant keywords ("today", "2025", "latest")
• **CRITICAL**: Use this when user asks for CURRENT information you don't have
"""


def get_website_reader_tool_context() -> str:
    """Website content reader"""
    return """
🌐 **WEBSITE READER TOOL**
• **Purpose**: Read and extract text content from any public webpage
• **When to Use**: User provides a URL and asks you to read it, analyze it, or summarize it
• **Usage**: read_website(url="https://example.com")
• **What It Does**:
  - Fetches webpage HTML
  - Extracts clean text (removes ads, scripts, navigation)
  - Returns page title and main content
• **Examples**:
  - "Read this article: [URL]" → read_website(url="[URL]")
  - "Summarize this page" → read_website(url="[URL]") then summarize
• **Limitations**:
  - Max 5000 characters (truncated if longer)
  - Only HTML pages (not PDFs, documents, or images)
  - Cannot bypass paywalls or login-protected pages
• **Best Practice**: Use when user shares a URL and wants content from it
"""


# Agent Tools Context Registry
AGENT_TOOLS_CONTEXT_REGISTRY: Dict[str, Callable[[], str]] = {
    "weather": get_weather_tool_context,
    "calculator": get_calculator_tool_context,
    "yahoo_finance": get_yahoo_finance_tool_context,
    "youtube": get_youtube_tool_context,
    "web_search": get_web_search_tool_context,
    "website_reader": get_website_reader_tool_context,
}


def get_agent_tool_context(tool_name: str) -> str:
    """
    Get expert context for a specific agent tool.

    Args:
        tool_name: Agent tool name (e.g., "weather", "calculator", "yahoo_finance")

    Returns:
        Context string with guidance for that tool, or empty string if not found
    """
    context_func = AGENT_TOOLS_CONTEXT_REGISTRY.get(tool_name.lower())
    if context_func:
        try:
            return context_func()
        except Exception as e:
            print(f"⚠️  Error getting context for agent tool {tool_name}: {e}")
            return ""
    return ""


def get_contexts_for_agent_tools(agent_tools: list) -> str:
    """
    Get combined context for all enabled agent tools.

    Args:
        agent_tools: List of agent tool names (e.g., ["weather", "calculator", "yahoo_finance"])

    Returns:
        Combined context string with guidance for all enabled agent tools
    """
    if not agent_tools:
        return ""

    contexts = []
    contexts.append("\n" + "="*80)
    contexts.append("🛠️  AGENT TOOLS GUIDANCE")
    contexts.append("="*80)
    contexts.append("Below is expert guidance for your available agent tools.\n")

    for tool in agent_tools:
        context = get_agent_tool_context(tool)
        if context:
            contexts.append(context)

    if len(contexts) == 3:  # Only headers, no tools found
        return ""

    contexts.append("="*80 + "\n")

    return "\n".join(contexts)
