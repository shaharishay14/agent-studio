"""
Agent Tools Service
-------------------
Implements agent-specific tools (non-Composio) like weather, calculator, etc.
"""

import ast
import math
import operator
import requests
import json
import re
from typing import Dict, Any
from django.conf import settings
from bs4 import BeautifulSoup


def tool_error(problem: str, next_step: str) -> Dict[str, Any]:
    """
    Builds a tool error the model can act on: what went wrong + what to do next.
    """
    return {'success': False, 'error': f'{problem} Next step: {next_step}'}


def api_error(service: str, e: Exception) -> Dict[str, Any]:
    """
    Turns a requests exception into a tool error without the raw message.
    Raw messages include the request URL, which can contain API keys.
    """
    if isinstance(e, (requests.exceptions.Timeout, requests.exceptions.ConnectionError)):
        return tool_error(f'{service} did not respond.', f'Retry once. If it fails again, tell the user {service} is unavailable.')

    status = getattr(getattr(e, 'response', None), 'status_code', None)
    if status in (401, 403):
        return tool_error(f'{service} rejected the request (HTTP {status}).', f'Do not retry. Tell the user {service} access is not configured or not allowed.')
    if status == 429:
        return tool_error(f'{service} rate limit reached (HTTP 429).', 'Do not retry now. Tell the user to try again in a minute.')
    if status == 404:
        return tool_error(f'{service} returned "not found" (HTTP 404).', 'Check the input is correct before retrying.')
    if status and status >= 500:
        return tool_error(f'{service} had a server error (HTTP {status}).', f'Retry once. If it fails again, tell the user {service} is unavailable.')
    return tool_error(f'{service} request failed.', f'Do not retry. Tell the user {service} is unavailable.')


def clamp_int(value, low: int, high: int, default: int) -> int:
    """Keeps a model-provided count within limits (models sometimes ask for 100 results, or pass "5")."""
    try:
        return max(low, min(high, int(value)))
    except (TypeError, ValueError):
        return default


# Calculator: only these operators, functions and constants are allowed
CALC_OPERATORS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv, ast.Mod: operator.mod,
    ast.Pow: operator.pow, ast.USub: operator.neg, ast.UAdd: operator.pos,
}
CALC_FUNCTIONS = {
    'sqrt': math.sqrt, 'log': math.log, 'log10': math.log10, 'exp': math.exp,
    'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
    'abs': abs, 'round': round, 'floor': math.floor, 'ceil': math.ceil,
}
CALC_CONSTANTS = {'pi': math.pi, 'e': math.e}
CALC_MAX_EXPONENT = 1000  # blocks things like 9 ** 9 ** 9 that would hang the server


def _eval_math_node(node):
    """Evaluates a parsed expression, allowing only numbers, CALC_OPERATORS, CALC_FUNCTIONS and CALC_CONSTANTS."""
    if isinstance(node, ast.Expression):
        return _eval_math_node(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.Name) and node.id in CALC_CONSTANTS:
        return CALC_CONSTANTS[node.id]
    if isinstance(node, ast.UnaryOp) and type(node.op) in CALC_OPERATORS:
        return CALC_OPERATORS[type(node.op)](_eval_math_node(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in CALC_OPERATORS:
        left, right = _eval_math_node(node.left), _eval_math_node(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > CALC_MAX_EXPONENT:
            raise ValueError(f'Exponent {right} is too large (max {CALC_MAX_EXPONENT}).')
        return CALC_OPERATORS[type(node.op)](left, right)
    if (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
            and node.func.id in CALC_FUNCTIONS and not node.keywords):
        return CALC_FUNCTIONS[node.func.id](*[_eval_math_node(arg) for arg in node.args])

    raise ValueError(f'"{ast.unparse(node)}" is not supported.')


class AgentToolsService:
    """Service class for executing agent-specific tools"""

    def __init__(self):
        """Initialize service with API keys from settings"""
        self.youtube_api_key = getattr(settings, 'YOUTUBE_API_KEY', '')
        self.serpapi_key = getattr(settings, 'SERPAPI_KEY', '')

    def execute_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a specific agent tool.

        Args:
            tool_name: Name of the tool to execute (can be tool name or function name)
            **kwargs: Tool-specific parameters

        Returns:
            dict with 'success', 'data', and optional 'error' keys
        """
        # Map OpenAI function names to tool names
        function_to_tool = {
            'get_weather': 'weather',
            'calculate': 'calculator',
            'get_stock_data': 'yahoo_finance',
            'search_youtube': 'youtube',
            'web_search': 'web_search',
            'read_website': 'website_reader'
        }

        # Convert function name to tool name if needed
        normalized_tool_name = function_to_tool.get(tool_name, tool_name)

        tool_methods = {
            'weather': self.get_weather,
            'calculator': self.calculate,
            'yahoo_finance': self.get_stock_data,
            'youtube': self.search_youtube,
            'web_search': self.web_search,
            'website_reader': self.read_website
        }

        method = tool_methods.get(normalized_tool_name)
        if not method:
            return tool_error(
                f'There is no tool named "{tool_name}".',
                f'Use one of the tools you were given: {", ".join(function_to_tool)}.'
            )

        try:
            return method(**kwargs)
        except TypeError as e:
            # Wrong or missing arguments, e.g. "got an unexpected keyword argument 'city'"
            return tool_error(f'Wrong arguments for {tool_name}: {e}', 'Call it again with exactly the parameters in its schema.')
        except Exception as e:
            print(f"Error executing tool {tool_name}: {e}")
            import traceback
            traceback.print_exc()
            return tool_error(f'{tool_name} failed unexpectedly.', 'Do not retry. Tell the user this tool is not working right now.')

    def get_weather(self, location: str) -> Dict[str, Any]:
        """
        Get current weather for a location using Open-Meteo API (free, no API key needed).

        Args:
            location: City name or location string

        Returns:
            dict with weather data
        """
        try:
            # Step 1: Geocode the location to get coordinates
            geocode_url = 'https://geocoding-api.open-meteo.com/v1/search'
            geocode_params = {
                'name': location,
                'count': 1,
                'language': 'en',
                'format': 'json'
            }

            geocode_response = requests.get(geocode_url, params=geocode_params, timeout=10)
            geocode_response.raise_for_status()
            geocode_data = geocode_response.json()

            if not geocode_data.get('results'):
                return tool_error(
                    f'Location "{location}" was not found.',
                    'Retry with just the city name in English (e.g. "Tel Aviv", not "TLV"). If it still fails, ask the user.'
                )

            # Get the first result
            location_data = geocode_data['results'][0]
            latitude = location_data['latitude']
            longitude = location_data['longitude']
            location_name = location_data['name']
            country = location_data.get('country', '')
            admin1 = location_data.get('admin1', '')  # State/region

            # Step 2: Get weather data using coordinates
            weather_url = 'https://api.open-meteo.com/v1/forecast'
            weather_params = {
                'latitude': latitude,
                'longitude': longitude,
                'current': 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
                'timezone': 'auto',
                'temperature_unit': 'celsius',
                'wind_speed_unit': 'kmh'
            }

            weather_response = requests.get(weather_url, params=weather_params, timeout=10)
            weather_response.raise_for_status()
            weather_data = weather_response.json()

            current = weather_data['current']

            # Map weather codes to descriptions
            weather_descriptions = {
                0: 'Clear sky',
                1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                45: 'Foggy', 48: 'Depositing rime fog',
                51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
                56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
                61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
                66: 'Light freezing rain', 67: 'Heavy freezing rain',
                71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
                77: 'Snow grains',
                80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
                85: 'Slight snow showers', 86: 'Heavy snow showers',
                95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
            }

            weather_code = current.get('weather_code', 0)
            description = weather_descriptions.get(weather_code, 'Unknown')

            # Build full location string
            full_location = location_name
            if admin1:
                full_location += f', {admin1}'
            if country:
                full_location += f', {country}'

            return {
                'success': True,
                'data': {
                    'location': full_location,
                    'temperature_c': current['temperature_2m'],
                    'feels_like_c': current['apparent_temperature'],
                    'humidity_percent': current['relative_humidity_2m'],
                    'conditions': description,
                    'wind_kmh': current['wind_speed_10m'],
                    'precipitation_mm': current.get('precipitation', 0)
                }
            }

        except requests.exceptions.RequestException as e:
            return api_error('The weather service', e)
        except (KeyError, IndexError):
            return tool_error('The weather service returned data in an unexpected format.', 'Do not retry. Tell the user weather is unavailable right now.')

    def calculate(self, expression: str) -> Dict[str, Any]:
        """
        Safely evaluate a mathematical expression (parsed, never passed to eval).

        Args:
            expression: Mathematical expression to evaluate

        Returns:
            dict with calculation result
        """
        allowed = ('numbers, + - * / // % ** (or ^), parentheses, '
                   f'functions {", ".join(CALC_FUNCTIONS)}, constants {", ".join(CALC_CONSTANTS)}')

        normalized = expression.replace('^', '**').replace('×', '*').replace('÷', '/')

        try:
            result = _eval_math_node(ast.parse(normalized, mode='eval'))
        except SyntaxError:
            return tool_error(
                f'Could not parse "{expression}".',
                f'Rewrite it using only {allowed}. Example: "10 * (5 + 3)".'
            )
        except ZeroDivisionError:
            return tool_error(f'"{expression}" divides by zero.', 'Check the numbers, or tell the user the result is undefined.')
        except (ValueError, TypeError, OverflowError) as e:
            return tool_error(f'Cannot calculate "{expression}": {e}', f'Use only {allowed}.')

        return {
            'success': True,
            'data': {
                'expression': expression,
                'result': result
            }
        }

    def get_stock_data(self, ticker: str) -> Dict[str, Any]:
        """
        Get stock data using yfinance library.

        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL', 'GOOGL')

        Returns:
            dict with stock data
        """
        try:
            import yfinance as yf

            stock_ticker = yf.Ticker(ticker.upper())
            info = stock_ticker.info

            # Get recent price data
            hist = stock_ticker.history(period='1d')

            if hist.empty:
                return tool_error(
                    f'No market data for "{ticker}".',
                    'Make sure it is a ticker symbol (e.g. "AAPL"), not a company name ("Apple"). If unsure of the symbol, ask the user.'
                )

            current_price = hist['Close'].iloc[-1]

            return {
                'success': True,
                'data': {
                    'symbol': ticker.upper(),
                    'name': info.get('longName', ticker),
                    'current_price': round(current_price, 2),
                    'currency': info.get('currency', 'USD'),
                    'market_cap': info.get('marketCap'),
                    'pe_ratio': info.get('trailingPE'),
                    '52_week_high': info.get('fiftyTwoWeekHigh'),
                    '52_week_low': info.get('fiftyTwoWeekLow')
                }
            }

        except ImportError:
            return tool_error('The stock data library is not installed on the server.', 'Do not retry. Tell the user stock data is unavailable.')
        except Exception:
            return tool_error(f'Could not get stock data for "{ticker}".', 'Retry once. If it fails again, tell the user stock data is unavailable.')

    def search_youtube(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """
        Search YouTube videos using YouTube Data API v3.

        Args:
            query: Search query string
            max_results: Maximum number of results to return

        Returns:
            dict with video search results
        """
        if not self.youtube_api_key:
            return tool_error('YouTube search is not configured on the server.', 'Do not retry. Tell the user YouTube search is unavailable.')

        max_results = clamp_int(max_results, 1, 10, default=5)

        try:
            url = 'https://www.googleapis.com/youtube/v3/search'
            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'maxResults': max_results,
                'key': self.youtube_api_key
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            videos = []
            for item in data.get('items', []):
                videos.append({
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'][:200],
                    'channel': item['snippet']['channelTitle'],
                    'published_at': item['snippet']['publishedAt'],
                    'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                })

            return {
                'success': True,
                'data': {
                    'query': query,
                    'results_count': len(videos),
                    'videos': videos
                }
            }

        except requests.exceptions.RequestException as e:
            return api_error('YouTube', e)

    def web_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search the web using SerpAPI.

        Args:
            query: Search query string
            num_results: Number of results to return

        Returns:
            dict with search results
        """
        if not self.serpapi_key:
            return tool_error('Web search is not configured on the server.', 'Do not retry. Tell the user web search is unavailable.')

        num_results = clamp_int(num_results, 1, 10, default=5)

        try:
            url = 'https://serpapi.com/search'
            params = {
                'q': query,
                'num': num_results,
                'api_key': self.serpapi_key,
                'engine': 'google'
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            results = []
            for item in data.get('organic_results', [])[:num_results]:
                results.append({
                    'title': item.get('title'),
                    'url': item.get('link'),
                    'snippet': item.get('snippet')
                })

            return {
                'success': True,
                'data': {
                    'query': query,
                    'results_count': len(results),
                    'results': results
                }
            }

        except requests.exceptions.RequestException as e:
            return api_error('Web search', e)

    def read_website(self, url: str) -> Dict[str, Any]:
        """
        Read and extract text content from a website.

        Args:
            url: Website URL to read

        Returns:
            dict with website content
        """
        try:
            # Validate URL format
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Remove script and style elements
            for script in soup(['script', 'style']):
                script.decompose()

            # Get text content
            text = soup.get_text()

            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)

            # Limit text length (below the context cap in agent_service, which adds JSON overhead)
            max_chars = 3500
            truncated = len(text) > max_chars

            return {
                'success': True,
                'data': {
                    'url': url,
                    'title': soup.title.string if soup.title else '',
                    'content': text[:max_chars],
                    'truncated': truncated
                }
            }

        except requests.exceptions.RequestException as e:
            return api_error(f'The website {url}', e)
        except Exception:
            return tool_error(f'Could not extract text from {url}.', 'Try a different URL, for example another web_search result.')
