"""
Circuit Breaker for Hallucination Loop Detection

Detects when LLM is stuck calling the same tool repeatedly and prevents
wasted API calls and execution time.
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreakerResult:
    """Result of circuit breaker check"""
    continue_execution: bool
    error_message: Optional[str] = None
    detected_loop: bool = False
    loop_tool: Optional[str] = None
    loop_count: int = 0


class CircuitBreaker:
    """
    Detects and prevents hallucination loops where LLM repeatedly calls same tool.

    This is a safety mechanism to prevent:
    - Infinite loops (wasting 30-60s)
    - Excessive API calls (cost)
    - Poor user experience (stuck agents)
    """

    def __init__(self, window_size: int = 5, max_repeats: int = 3):
        """
        Args:
            window_size: How many recent messages to check (default: 5)
            max_repeats: Maximum times a tool can repeat in window (default: 3)
        """
        self.window_size = window_size
        self.max_repeats = max_repeats
        self.tool_history: List[str] = []

    def check_hallucination_loop(self, chat_history: List[Dict[str, Any]]) -> CircuitBreakerResult:
        """
        Check if agent is stuck in a loop calling same tool repeatedly.

        Args:
            chat_history: Full chat history with tool calls

        Returns:
            CircuitBreakerResult indicating whether to continue or abort
        """
        # Extract recent tool calls
        recent_tools = self._extract_recent_tools(chat_history, self.window_size)

        if not recent_tools:
            return CircuitBreakerResult(continue_execution=True)

        # Count occurrences of each tool
        tool_counts = defaultdict(int)
        for tool_name in recent_tools:
            tool_counts[tool_name] += 1

        # Check if any tool is repeating too much
        for tool_name, count in tool_counts.items():
            if count >= self.max_repeats:
                logger.error("HALLUCINATION_LOOP_DETECTED", extra={
                    'tool': tool_name,
                    'count': count,
                    'window': self.window_size,
                    'recent_tools': recent_tools
                })

                return CircuitBreakerResult(
                    continue_execution=False,
                    detected_loop=True,
                    loop_tool=tool_name,
                    loop_count=count,
                    error_message=f"Detected loop: '{tool_name}' called {count} times in last {self.window_size} messages. Aborting to prevent infinite loop."
                )

        # Also check if the LAST tool is about to repeat immediately
        if len(recent_tools) >= 2:
            last_tool = recent_tools[-1]
            second_last_tool = recent_tools[-2]

            if last_tool == second_last_tool:
                consecutive_count = 1
                for i in range(len(recent_tools) - 2, -1, -1):
                    if recent_tools[i] == last_tool:
                        consecutive_count += 1
                    else:
                        break

                if consecutive_count >= 2:
                    logger.warning("CONSECUTIVE_TOOL_REPETITION", extra={
                        'tool': last_tool,
                        'consecutive': consecutive_count
                    })

        return CircuitBreakerResult(continue_execution=True)

    def check_tool_before_execution(self, tool_name: str) -> CircuitBreakerResult:
        """
        Check if about to execute a tool that would trigger the circuit breaker.

        Args:
            tool_name: Name of tool about to be executed

        Returns:
            CircuitBreakerResult indicating whether to proceed
        """
        # Add to local history
        self.tool_history.append(tool_name)

        # Keep only last window_size tools
        if len(self.tool_history) > self.window_size:
            self.tool_history = self.tool_history[-self.window_size:]

        # Count occurrences
        count = self.tool_history.count(tool_name)

        if count >= self.max_repeats:
            logger.error("CIRCUIT_BREAKER_TRIGGERED", extra={
                'tool': tool_name,
                'count': count,
                'history': self.tool_history
            })

            return CircuitBreakerResult(
                continue_execution=False,
                detected_loop=True,
                loop_tool=tool_name,
                loop_count=count,
                error_message=f"Circuit breaker triggered: '{tool_name}' would be called {count} times. Preventing loop."
            )

        return CircuitBreakerResult(continue_execution=True)

    def reset(self):
        """Reset the circuit breaker state"""
        self.tool_history.clear()
        logger.info("Circuit breaker reset")

    def _extract_recent_tools(self, chat_history: List[Dict[str, Any]], limit: int) -> List[str]:
        """
        Extract tool names from recent chat history.

        Args:
            chat_history: Full chat history
            limit: Number of recent messages to check

        Returns:
            List of tool names in chronological order
        """
        tools = []
        recent_messages = chat_history[-limit:] if chat_history else []

        for message in recent_messages:
            # Check if message has tool_calls (assistant messages)
            if message.get('role') == 'assistant' and message.get('tool_calls'):
                for tool_call in message['tool_calls']:
                    if hasattr(tool_call, 'function'):
                        tools.append(tool_call.function.name)
                    elif isinstance(tool_call, dict) and 'function' in tool_call:
                        tools.append(tool_call['function']['name'])

        return tools
