"""
Comprehensive tests for AgentService with focus on edge cases.
Tests the hybrid execution flow, markdown cleaning, and task queue without live Composio connections.
"""

import os
import sys
import django
from django.conf import settings

# Configure Django settings before any imports
if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'api_agents',
        ],
        SECRET_KEY='test-secret-key',
        USE_TZ=True,
    )
    django.setup()

import pytest
import asyncio
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime
import json

# Now we can import after Django is set up
with patch('api_agents.agents.models'):
    from api_agents.agents.services.agent_service import AgentService

# Mock the other imports
with patch('api_agents.agents.services.intent_resolution_engine'):
    from api_agents.agents.services.intent_resolution_engine import IntentResolution

with patch('api_agents.agents.services.pre_execution_validator'):
    from api_agents.agents.services.pre_execution_validator import ValidationResult


class TestMarkdownCleaning:
    """Test markdown cleaning functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.service = AgentService(self.user_mock, self.agent_mock)

    def test_clean_markdown_headers(self):
        """Test removal of markdown headers."""
        text = "### AAPL Stock Analysis\n## Overview\n# Main Title"
        cleaned = self.service._clean_markdown_formatting(text)
        assert "###" not in cleaned
        assert "##" not in cleaned
        assert "#" not in cleaned
        assert "AAPL Stock Analysis" in cleaned

    def test_clean_markdown_bold(self):
        """Test removal of bold markdown."""
        text = "**Important:** This is **bold** text with **nested: content**"
        cleaned = self.service._clean_markdown_formatting(text)
        assert "**" not in cleaned
        assert "Important:" in cleaned
        assert "bold" in cleaned
        assert "nested: content" in cleaned

    def test_clean_markdown_lists(self):
        """Test removal of list markers."""
        text = """
        - Item 1
        * Item 2
        + Item 3
        • Bullet item
        """
        cleaned = self.service._clean_markdown_formatting(text)
        assert "-" not in cleaned.split("Item 1")[0]
        assert "*" not in cleaned.split("Item 2")[0]
        assert "+" not in cleaned.split("Item 3")[0]
        assert "•" not in cleaned
        assert "Item 1" in cleaned
        assert "Item 2" in cleaned

    def test_clean_markdown_code_blocks(self):
        """Test removal of code blocks."""
        text = "```python\nprint('hello')\n```\nNormal text"
        cleaned = self.service._clean_markdown_formatting(text)
        assert "```" not in cleaned
        assert "print('hello')" in cleaned
        assert "Normal text" in cleaned

    def test_clean_markdown_complex(self):
        """Test cleaning complex markdown with multiple elements."""
        text = """
        ### **Stock Analysis Report**

        **Date:** December 4, 2025

        ## Key Metrics:
        - **Price:** $242.84
        - **Volume:** 15.2M
        * **Change:** +2.3%

        ```
        P/E Ratio: 32.5
        Market Cap: $3.85T
        ```

        ### Summary
        The stock showed **strong** performance today.
        """
        cleaned = self.service._clean_markdown_formatting(text)

        # Check all markdown is removed
        assert "###" not in cleaned
        assert "**" not in cleaned
        assert "```" not in cleaned
        assert not any(line.strip().startswith("-") for line in cleaned.split("\n"))
        assert not any(line.strip().startswith("*") for line in cleaned.split("\n"))

        # Check content is preserved
        assert "Stock Analysis Report" in cleaned
        assert "Date: December 4, 2025" in cleaned
        assert "Price: $242.84" in cleaned
        assert "P/E Ratio: 32.5" in cleaned
        assert "strong performance" in cleaned


class TestHybridExecution:
    """Test hybrid execution flow with mocked Composio."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.agent_mock.user = self.user_mock
        self.agent_mock.connected_apps.all.return_value = [
            Mock(app_name="GMAIL"),
            Mock(app_name="GOOGLEDRIVE")
        ]
        self.agent_mock.enabled_agent_tools = ["yahoo_finance"]

        self.service = AgentService(self.user_mock, self.agent_mock)

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_agent_tools')
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_composio')
    @patch('api_agents.agents.services.agent_service.AgentService._select_composio_tools_with_ai')
    async def test_hybrid_execution_success(self, mock_select_tools, mock_composio, mock_agent_tools):
        """Test successful hybrid execution flow."""
        # Mock tool selection
        mock_select_tools.return_value = {
            'tools': ['GMAIL_SEND_EMAIL'],
            'platform': 'gmail',
            'action': 'send_email'
        }

        # Mock agent tools response (with markdown)
        mock_agent_tools.return_value = """
        ### AAPL Stock Analysis
        **Current Price:** $242.84
        - Volume: 15.2M
        - Change: +2.3%
        """

        # Mock Composio response
        mock_composio.return_value = "Email sent successfully"

        # Execute hybrid flow
        result = await self.service._execute_hybrid(
            agent_model=self.agent_mock,
            message="Send me AAPL stock analysis",
            composio_tool_slugs=['GMAIL_SEND_EMAIL'],
            agent_tool_slugs=['yahoo_finance'],
            chat_history=[],
            callback=None
        )

        # Verify agent tools were called
        mock_agent_tools.assert_called_once()

        # Verify Composio was called with cleaned data
        mock_composio.assert_called_once()
        call_args = mock_composio.call_args
        enriched_history = call_args[1][3]  # 4th argument is enriched_history

        # Check that markdown was cleaned in the enriched history
        assistant_content = enriched_history[-1]['content']
        assert "###" not in assistant_content
        assert "**" not in assistant_content
        assert "AAPL Stock Analysis" in assistant_content
        assert "Current Price: $242.84" in assistant_content

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._parse_multi_task_intent')
    @patch('api_agents.agents.services.agent_service.AgentService._execute_task_queue')
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_agent_tools')
    async def test_multi_task_execution(self, mock_agent_tools, mock_task_queue, mock_parse_tasks):
        """Test multi-task execution flow."""
        # Mock task parsing
        mock_parse_tasks.return_value = [
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

        # Mock agent tools response with markdown
        mock_agent_tools.return_value = "### Stock Report\n**AAPL:** $242.84"

        # Mock task queue execution
        mock_task_queue.return_value = "All tasks completed"

        # Execute
        message = "Send AAPL analysis to my email and save to Google Docs"
        result = await self.service._execute_hybrid(
            agent_model=self.agent_mock,
            message=message,
            composio_tool_slugs=['GMAIL_SEND_EMAIL', 'GOOGLEDOCS_CREATE_DOCUMENT'],
            agent_tool_slugs=['yahoo_finance'],
            chat_history=[],
            callback=None
        )

        # Verify task queue was called with cleaned data
        mock_task_queue.assert_called_once()
        call_args = mock_task_queue.call_args
        fetched_data = call_args[1][3]  # 4th argument is fetched_data

        # Data should be the raw response (cleaning happens inside task queue)
        assert fetched_data == "### Stock Report\n**AAPL:** $242.84"


class TestTaskQueueExecution:
    """Test task queue execution with edge cases."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.service = AgentService(self.user_mock, self.agent_mock)

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_composio')
    async def test_task_queue_with_markdown_cleaning(self, mock_composio):
        """Test that task queue cleans markdown before passing to Composio."""
        mock_composio.return_value = "Task completed"

        tasks = [
            {
                'action': 'send_email',
                'platform': 'gmail',
                'tool_slugs': ['GMAIL_SEND_EMAIL']
            }
        ]

        # Fetched data with markdown
        fetched_data = """
        ### Analysis Report
        **Key Points:**
        - Point 1
        * Point 2
        """

        await self.service._execute_task_queue(
            agent_model=self.agent_mock,
            message="Send analysis",
            tasks=tasks,
            fetched_data=fetched_data,
            chat_history=[],
            callback=None
        )

        # Verify Composio was called with cleaned data
        call_args = mock_composio.call_args
        enriched_history = call_args[1][3]  # enriched_history argument

        # Check the assistant content in enriched history
        assistant_msg = next(
            (msg for msg in enriched_history if msg['role'] == 'assistant'),
            None
        )

        assert assistant_msg is not None
        content = assistant_msg['content']
        assert "###" not in content
        assert "**" not in content
        assert "Analysis Report" in content
        assert "Key Points:" in content

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_composio')
    async def test_task_queue_multiple_tasks(self, mock_composio):
        """Test execution of multiple tasks in sequence."""
        mock_composio.side_effect = [
            "Email sent",
            "Document created",
            "Posted to Twitter"
        ]

        tasks = [
            {'action': 'send_email', 'platform': 'gmail', 'tool_slugs': ['GMAIL_SEND_EMAIL']},
            {'action': 'create_document', 'platform': 'googledrive', 'tool_slugs': ['GOOGLEDOCS_CREATE_DOCUMENT']},
            {'action': 'post', 'platform': 'twitter', 'tool_slugs': ['TWITTER_CREATE_TWEET']}
        ]

        result = await self.service._execute_task_queue(
            agent_model=self.agent_mock,
            message="Multiple tasks",
            tasks=tasks,
            fetched_data="Data",
            chat_history=[],
            callback=None
        )

        # Verify all tasks were executed
        assert mock_composio.call_count == 3
        assert "✅ send_email completed" in result
        assert "✅ create_document completed" in result
        assert "✅ post completed" in result


class TestValidationEdgeCases:
    """Test validation edge cases and error handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.service = AgentService(self.user_mock, self.agent_mock)

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.get_validator')
    async def test_validation_failure_handling(self, mock_get_validator):
        """Test handling of validation failures."""
        # Mock validation failure
        mock_validator = Mock()
        mock_validator.validate.return_value = ValidationResult(
            passed=False,
            confidence=30,
            blocking_issues=["Target platform Gmail is not connected"],
            warnings=[],
            required_actions=["Connect Gmail account"],
            validation_summary="❌ VALIDATION FAILED: Target platform Gmail is not connected"
        )
        mock_get_validator.return_value = mock_validator

        # Create callback to capture error
        error_captured = None
        async def callback(event_type, data):
            nonlocal error_captured
            if event_type == 'error':
                error_captured = data['error']

        # Execute with validation enabled
        result = await self.service._chat_with_composio(
            agent_model=self.agent_mock,
            message="Send email",
            specific_tools_slugs=['GMAIL_SEND_EMAIL'],
            chat_history=[],
            callback=callback,
            skip_intent_validation=False
        )

        # Verify error was returned correctly
        assert "Cannot execute" in result
        assert "Gmail is not connected" in result
        assert error_captured is not None

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_agent_tools')
    async def test_empty_agent_tools_response(self, mock_agent_tools):
        """Test handling of empty agent tools response."""
        mock_agent_tools.return_value = ""

        # Should handle empty response gracefully
        result = await self.service._execute_hybrid(
            agent_model=self.agent_mock,
            message="Send analysis",
            composio_tool_slugs=['GMAIL_SEND_EMAIL'],
            agent_tool_slugs=['yahoo_finance'],
            chat_history=[],
            callback=None
        )

        # Should still attempt execution even with empty data
        assert result is not None

    @pytest.mark.asyncio
    async def test_markdown_cleaning_with_none(self):
        """Test markdown cleaning handles None values."""
        result = self.service._clean_markdown_formatting(None)
        assert result == ""

    @pytest.mark.asyncio
    async def test_markdown_cleaning_with_empty_string(self):
        """Test markdown cleaning handles empty strings."""
        result = self.service._clean_markdown_formatting("")
        assert result == ""

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_composio')
    async def test_task_queue_with_exception(self, mock_composio):
        """Test task queue handles exceptions gracefully."""
        mock_composio.side_effect = Exception("Composio API error")

        tasks = [
            {'action': 'send_email', 'platform': 'gmail', 'tool_slugs': ['GMAIL_SEND_EMAIL']}
        ]

        # Should handle exception and return error message
        result = await self.service._execute_task_queue(
            agent_model=self.agent_mock,
            message="Send email",
            tasks=tasks,
            fetched_data="Data",
            chat_history=[],
            callback=None
        )

        assert "Error" in result or "error" in result.lower()


class TestTimeoutHandling:
    """Test timeout and cancellation scenarios."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.service = AgentService(self.user_mock, self.agent_mock)

    @pytest.mark.asyncio
    async def test_composio_timeout(self):
        """Test handling of Composio timeout."""
        with patch('api_agents.agents.services.agent_service.AgentService._get_composio_client') as mock_client:
            mock_entity = AsyncMock()
            mock_entity.execute.side_effect = asyncio.TimeoutError("Request timeout")
            mock_client.return_value.get_entity.return_value = mock_entity

            result = await self.service._chat_with_composio(
                agent_model=self.agent_mock,
                message="Send email",
                specific_tools_slugs=['GMAIL_SEND_EMAIL'],
                chat_history=[],
                callback=None,
                skip_intent_validation=True
            )

            # Should handle timeout gracefully
            assert "timeout" in result.lower() or "error" in result.lower()


class TestIntegrationScenarios:
    """Test complete integration scenarios."""

    def setup_method(self):
        """Set up test fixtures."""
        self.user_mock = Mock()
        self.user_mock.username = "test_user"
        self.agent_mock = Mock()
        self.agent_mock.id = "test_agent_id"
        self.agent_mock.connected_apps.all.return_value = [
            Mock(app_name="GMAIL"),
            Mock(app_name="GOOGLEDRIVE"),
            Mock(app_name="GOOGLECALENDAR")
        ]
        self.agent_mock.enabled_agent_tools = ["yahoo_finance", "web_search"]

        self.service = AgentService(self.user_mock, self.agent_mock)

    @pytest.mark.asyncio
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_agent_tools')
    @patch('api_agents.agents.services.agent_service.AgentService._chat_with_composio')
    @patch('api_agents.agents.services.agent_service.AgentService._select_composio_tools_with_ai')
    async def test_stock_analysis_email_flow(self, mock_select_tools, mock_composio, mock_agent_tools):
        """Test the complete flow of fetching stock data and sending email."""
        # Setup
        mock_select_tools.return_value = {
            'tools': ['GMAIL_SEND_EMAIL'],
            'platform': 'gmail',
            'action': 'send_email'
        }

        # Mock stock data with heavy markdown
        mock_agent_tools.return_value = """
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

        mock_composio.return_value = "Email sent successfully with analysis"

        # Execute
        result = await self.service._execute_hybrid(
            agent_model=self.agent_mock,
            message="Send me detailed AAPL stock analysis to my email",
            composio_tool_slugs=['GMAIL_SEND_EMAIL'],
            agent_tool_slugs=['yahoo_finance'],
            chat_history=[],
            callback=None
        )

        # Verify the flow
        mock_agent_tools.assert_called_once()
        mock_composio.assert_called_once()

        # Get enriched history passed to Composio
        call_args = mock_composio.call_args
        enriched_history = call_args[1][3]
        assistant_content = enriched_history[-1]['content']

        # Verify all markdown was cleaned
        assert "###" not in assistant_content
        assert "##" not in assistant_content
        assert "**" not in assistant_content
        assert "```" not in assistant_content
        assert not any(line.strip().startswith("*") for line in assistant_content.split("\n"))
        assert not any(line.strip().startswith("-") for line in assistant_content.split("\n"))

        # Verify content was preserved
        assert "AAPL (Apple Inc.) Stock Analysis" in assistant_content
        assert "Price: $242.84 USD" in assistant_content
        assert "Market Cap: $3.85T" in assistant_content
        assert "strong momentum" in assistant_content

        assert "Email sent successfully" in result


# Test runner configuration
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])