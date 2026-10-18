"""
Pytest configuration for agent service tests.
Sets up common fixtures and mocks for testing without live connections.
"""

import pytest
import os
import sys
from unittest.mock import Mock, MagicMock, patch

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

# Disable Django setup for unit tests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Mock Django models and dependencies
@pytest.fixture(autouse=True)
def mock_django_setup():
    """Mock Django setup for tests."""
    with patch('django.setup'):
        yield


@pytest.fixture
def mock_user():
    """Create a mock user object."""
    user = Mock()
    user.id = 1
    user.username = "test_user"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_agent():
    """Create a mock agent object with default configuration."""
    agent = Mock()
    agent.id = "test-agent-123"
    agent.name = "Test Agent"
    agent.user = Mock(username="test_user")
    agent.connected_apps.all.return_value = [
        Mock(app_name="GMAIL"),
        Mock(app_name="GOOGLEDRIVE"),
        Mock(app_name="GOOGLECALENDAR")
    ]
    agent.enabled_agent_tools = ["yahoo_finance", "web_search"]
    agent.file_attachments.all.return_value = []
    return agent


@pytest.fixture
def mock_composio_client():
    """Create a mock Composio client."""
    with patch('api_agents.agents.services.agent_service.Composio') as MockComposio:
        client = MagicMock()
        entity = MagicMock()

        # Mock entity methods
        entity.execute.return_value = {
            'status': 'success',
            'result': 'Action completed successfully'
        }
        entity.get_tools.return_value = [
            Mock(slug="GMAIL_SEND_EMAIL"),
            Mock(slug="GOOGLEDRIVE_CREATE_DOCUMENT")
        ]

        client.get_entity.return_value = entity
        MockComposio.return_value = client

        yield client


@pytest.fixture
def mock_openai_client():
    """Create a mock OpenAI client."""
    with patch('openai.ChatCompletion.create') as mock_create:
        mock_create.return_value = {
            'choices': [{
                'message': {
                    'content': 'Test response'
                }
            }]
        }
        yield mock_create


@pytest.fixture
def sample_stock_data_with_markdown():
    """Sample stock data with heavy markdown formatting."""
    return """
    ### AAPL (Apple Inc.) Stock Analysis

    ## **Current Trading Information**

    **Price:** $242.84 USD
    **Change:** +$5.62 (+2.37%)

    ### Key Metrics:
    - **Market Cap:** $3.85T
    - **P/E Ratio:** 32.5
    - **52 Week High:** $250.80
    - **52 Week Low:** $164.08

    ## Technical Analysis
    * **RSI:** 58.3 (Neutral)
    * **MACD:** Bullish crossover
    * **Moving Averages:**
      - 50-day MA: $235.20
      - 200-day MA: $195.50

    ```
    Volume: 45,234,123 shares
    Average Volume: 52,123,456 shares
    ```

    ### **Investment Recommendation**
    Based on current metrics, AAPL shows **strong** momentum.
    """


@pytest.fixture
def sample_clean_stock_data():
    """Expected output after markdown cleaning."""
    return """
    AAPL (Apple Inc.) Stock Analysis

    Current Trading Information

    Price: $242.84 USD
    Change: +$5.62 (+2.37%)

    Key Metrics:
    Market Cap: $3.85T
    P/E Ratio: 32.5
    52 Week High: $250.80
    52 Week Low: $164.08

    Technical Analysis
    RSI: 58.3 (Neutral)
    MACD: Bullish crossover
    Moving Averages:
      50-day MA: $235.20
      200-day MA: $195.50

    Volume: 45,234,123 shares
    Average Volume: 52,123,456 shares

    Investment Recommendation
    Based on current metrics, AAPL shows strong momentum.
    """


@pytest.fixture
def sample_tasks():
    """Sample task list for multi-task execution."""
    return [
        {
            'action': 'send_email',
            'platform': 'gmail',
            'tool_slugs': ['GMAIL_SEND_EMAIL']
        },
        {
            'action': 'create_document',
            'platform': 'googledrive',
            'tool_slugs': ['GOOGLEDOCS_CREATE_DOCUMENT']
        }
    ]


# Configure asyncio for pytest
@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# Mock environment variables
@pytest.fixture(autouse=True)
def mock_env_vars(monkeypatch):
    """Set up test environment variables."""
    monkeypatch.setenv("COMPOSIO_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("DJANGO_SECRET_KEY", "test-secret-key")