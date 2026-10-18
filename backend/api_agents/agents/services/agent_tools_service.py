"""
Agent Tools Service
-------------------
Implements agent-specific tools (non-Composio) like weather, calculator, etc.
"""

import requests
import json
import re
from typing import Dict, Any
from django.conf import settings
from bs4 import BeautifulSoup


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
            return {
                'success': False,
                'error': f'Unknown tool: {tool_name} (normalized: {normalized_tool_name})'
            }

        try:
            return method(**kwargs)
        except Exception as e:
            print(f"Error executing tool {tool_name}: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }

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
                return {
                    'success': False,
                    'error': f'Location "{location}" not found. Please try a more specific location name.'
                }

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
                    'latitude': latitude,
                    'longitude': longitude,
                    'temperature': current['temperature_2m'],
                    'feels_like': current['apparent_temperature'],
                    'humidity': current['relative_humidity_2m'],
                    'description': description,
                    'weather_code': weather_code,
                    'wind_speed': current['wind_speed_10m'],
                    'precipitation': current.get('precipitation', 0),
                    'unit': '°C'
                }
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Weather API error: {str(e)}'
            }
        except (KeyError, IndexError) as e:
            return {
                'success': False,
                'error': f'Error parsing weather data: {str(e)}'
            }

    def calculate(self, expression: str) -> Dict[str, Any]:
        """
        Safely evaluate a mathematical expression.

        Args:
            expression: Mathematical expression to evaluate

        Returns:
            dict with calculation result
        """
        try:
            # Remove any potentially dangerous characters
            # Only allow: digits, operators, parentheses, decimal points, spaces
            safe_chars = set('0123456789+-*/().,% ')
            if not all(c in safe_chars for c in expression):
                return {
                    'success': False,
                    'error': 'Expression contains invalid characters'
                }

            # Replace common math expressions
            expression = expression.replace('^', '**')  # Power operator
            expression = expression.replace('×', '*')
            expression = expression.replace('÷', '/')

            # Use eval with limited builtins for safety
            result = eval(expression, {"__builtins__": {}}, {})

            return {
                'success': True,
                'data': {
                    'expression': expression,
                    'result': result
                }
            }

        except (SyntaxError, NameError, TypeError, ZeroDivisionError) as e:
            return {
                'success': False,
                'error': f'Calculation error: {str(e)}'
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
                return {
                    'success': False,
                    'error': f'No data found for ticker: {ticker}'
                }

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
            return {
                'success': False,
                'error': 'yfinance library not installed'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Stock data error: {str(e)}'
            }

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
            return {
                'success': False,
                'error': 'YouTube API key not configured'
            }

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
                    'video_id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
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
            return {
                'success': False,
                'error': f'YouTube API error: {str(e)}'
            }

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
            return {
                'success': False,
                'error': 'Web search API key not configured'
            }

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
            for item in data.get('organic_results', []):
                results.append({
                    'title': item.get('title'),
                    'link': item.get('link'),
                    'snippet': item.get('snippet'),
                    'position': item.get('position')
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
            return {
                'success': False,
                'error': f'Web search API error: {str(e)}'
            }

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

            # Limit text length
            max_chars = 5000
            if len(text) > max_chars:
                text = text[:max_chars] + '...'

            return {
                'success': True,
                'data': {
                    'url': url,
                    'title': soup.title.string if soup.title else '',
                    'content': text,
                    'content_length': len(text)
                }
            }

        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Website read error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Content parsing error: {str(e)}'
            }

    def get_tool_function_definition(self, tool_name: str) -> Dict[str, Any]:
        """
        Get OpenAI function definition for a tool.
        Used to pass tool specs to the AI model.

        Args:
            tool_name: Name of the tool

        Returns:
            OpenAI function definition dict
        """
        definitions = {
            'weather': {
                'name': 'get_weather',
                'description': 'Get current weather information for a location',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'location': {
                            'type': 'string',
                            'description': 'City name or location (e.g., "London", "New York, US")'
                        }
                    },
                    'required': ['location']
                }
            },
            'calculator': {
                'name': 'calculate',
                'description': 'Perform mathematical calculations',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'expression': {
                            'type': 'string',
                            'description': 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")'
                        }
                    },
                    'required': ['expression']
                }
            },
            'yahoo_finance': {
                'name': 'get_stock_data',
                'description': 'Get stock market data and financial information',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'ticker': {
                            'type': 'string',
                            'description': 'Stock ticker symbol (e.g., "AAPL", "GOOGL", "TSLA")'
                        }
                    },
                    'required': ['ticker']
                }
            },
            'youtube': {
                'name': 'search_youtube',
                'description': 'Search for YouTube videos',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'query': {
                            'type': 'string',
                            'description': 'Search query for YouTube videos'
                        },
                        'max_results': {
                            'type': 'integer',
                            'description': 'Maximum number of results to return (default: 5)',
                            'default': 5
                        }
                    },
                    'required': ['query']
                }
            },
            'web_search': {
                'name': 'web_search',
                'description': 'Search the web for information',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'query': {
                            'type': 'string',
                            'description': 'Search query'
                        },
                        'num_results': {
                            'type': 'integer',
                            'description': 'Number of results to return (default: 5)',
                            'default': 5
                        }
                    },
                    'required': ['query']
                }
            },
            'website_reader': {
                'name': 'read_website',
                'description': 'Read and extract text content from a website URL',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'url': {
                            'type': 'string',
                            'description': 'Website URL to read'
                        }
                    },
                    'required': ['url']
                }
            }
        }

        return definitions.get(tool_name, {})
