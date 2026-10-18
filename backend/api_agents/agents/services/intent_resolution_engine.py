"""
Intent Resolution Engine - Transforms vague user language into concrete actions.

This engine analyzes user messages to:
1. Map vague verbs (launch, drop, share) to specific actions
2. Resolve ambiguous references (this, it, that) to actual content
3. Calculate dates (yesterday, last week) with business day awareness
4. Detect platforms from conversation context
5. Assign confidence scores to all decisions
"""

import re
import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass


@dataclass
class IntentResolution:
    """Result of intent resolution analysis."""
    action: str  # post, send, create, search, etc.
    platform: Optional[str]  # TWITTER, GMAIL, SLACK, etc.
    content_reference: Optional[str]  # file_name, "analysis", "report", etc.
    calculated_date: Optional[datetime.date]
    confidence: int  # 0-100
    reasoning: str  # Human-readable explanation of the decision
    missing_requirements: List[str]  # What's needed to execute
    fallback_options: List[Dict[str, Any]]  # Alternative interpretations


class IntentResolutionEngine:
    """
    Analyzes vague user prompts and resolves them to concrete actions.
    Uses conversation context, connected apps, and files to make intelligent decisions.
    """

    # Vague verb mappings
    VAGUE_VERBS = {
        "launch": ["post", "publish", "send", "deploy"],
        "drop": ["post", "publish", "release"],
        "blast": ["post", "send_mass", "broadcast"],
        "share": ["post", "send", "upload"],
        "push": ["post", "publish", "deploy"],
        "throw": ["post", "send"],
        "toss": ["post", "send"],
        "fire": ["send", "post"],
        "ship": ["send", "publish", "deploy"],
        "release": ["post", "publish"],
    }

    # Vague content references
    VAGUE_REFERENCES = ["this", "it", "that", "these", "them", "the file", "the doc", "the report"]

    # Date patterns with business day awareness
    DATE_PATTERNS = {
        "yesterday": -1,
        "last night": -1,
        "previous day": -1,
        "last week": -7,
        "last month": -30,
        "previous": -1,
        "earlier": -1,
    }

    # Platform keywords
    PLATFORM_KEYWORDS = {
        "twitter": ["TWITTER", "TWITTEROAUTH2"],
        "tweet": ["TWITTER", "TWITTEROAUTH2"],
        "x": ["TWITTER", "TWITTEROAUTH2"],
        "email": ["GMAIL", "OUTLOOK"],
        "gmail": ["GMAIL"],
        "mail": ["GMAIL", "OUTLOOK"],
        "slack": ["SLACK"],
        "calendar": ["GOOGLECALENDAR"],
        "drive": ["GOOGLEDRIVE"],
        "docs": ["GOOGLEDOCS"],
        "sheets": ["GOOGLESHEETS"],
        "instagram": ["INSTAGRAM"],
        "linkedin": ["LINKEDIN"],
        "facebook": ["FACEBOOK"],
        "github": ["GITHUB"],
        "notion": ["NOTION"],
    }

    # Real-time data keywords (triggers automatic search)
    REALTIME_DATA_KEYWORDS = [
        "stock", "price", "ticker", "market", "trading",
        "current", "today", "now", "latest", "recent",
        "news", "update", "breaking", "live"
    ]

    # Financial/Stock specific patterns
    STOCK_PATTERNS = [
        r'\b[A-Z]{1,5}\b(?:\s+stock|\s+share|\s+ticker)?',  # AAPL, TSLA, etc.
        r'(?:stock|share|ticker)\s+(?:price|analysis|data)',
    ]

    def __init__(self):
        """Initialize the intent resolution engine."""
        pass

    def resolve_intent(
        self,
        user_message: str,
        chat_history: List[Dict[str, str]] = None,
        connected_apps: List[str] = None,
        available_files: List[Dict[str, Any]] = None,
        agent_tools: List[str] = None
    ) -> IntentResolution:
        """
        Main method: Analyzes user message and returns resolved intent.

        Args:
            user_message: The vague user prompt
            chat_history: Recent conversation messages
            connected_apps: List of connected app names (e.g., ["GMAIL", "TWITTER"])
            available_files: List of files in context (attachments, Drive files, etc.)
            agent_tools: List of enabled agent tools (e.g., ["yahoo_finance", "web_search"])

        Returns:
            IntentResolution with action, platform, confidence, etc.
        """
        chat_history = chat_history or []
        connected_apps = [app.upper() for app in (connected_apps or [])]
        available_files = available_files or []
        agent_tools = agent_tools or []

        message_lower = user_message.lower()

        # Initialize resolution
        resolution = IntentResolution(
            action="unknown",
            platform=None,
            content_reference=None,
            calculated_date=None,
            confidence=0,
            reasoning="",
            missing_requirements=[],
            fallback_options=[]
        )

        # Step 1: Detect action (post, send, search, etc.)
        resolution.action, action_confidence = self._detect_action(message_lower, chat_history)

        # Step 2: Detect platform
        resolution.platform, platform_confidence = self._detect_platform(
            message_lower, chat_history, connected_apps
        )

        # Step 3: Resolve content reference (what is "this"?)
        resolution.content_reference, content_confidence = self._resolve_content_reference(
            message_lower, chat_history, available_files
        )

        # Step 4: Calculate dates if mentioned
        resolution.calculated_date, date_confidence = self._calculate_date(message_lower)

        # Step 5: Calculate overall confidence
        resolution.confidence = self._calculate_overall_confidence(
            action_confidence, platform_confidence, content_confidence, date_confidence
        )

        # Step 6: Identify missing requirements
        resolution.missing_requirements = self._identify_missing_requirements(
            resolution, available_files, connected_apps, agent_tools
        )

        # Step 7: Build reasoning
        resolution.reasoning = self._build_reasoning(
            resolution, user_message, chat_history, connected_apps
        )

        # Step 8: Generate fallback options
        resolution.fallback_options = self._generate_fallback_options(
            resolution, connected_apps
        )

        return resolution

    def _detect_action(self, message: str, chat_history: List[Dict]) -> Tuple[str, int]:
        """
        Detects the primary action verb (post, send, search, etc.).
        Returns (action, confidence_score).
        """
        # Check for vague verbs
        for vague_verb, concrete_actions in self.VAGUE_VERBS.items():
            if vague_verb in message:
                # Default to first action (most common)
                action = concrete_actions[0]
                confidence = 75  # Medium-high confidence for vague verbs
                return action, confidence

        # Check for concrete verbs
        if any(word in message for word in ["post", "tweet", "publish"]):
            return "post", 95
        if any(word in message for word in ["send", "email", "mail"]):
            return "send", 95
        if any(word in message for word in ["create", "make", "generate"]):
            return "create", 90
        if any(word in message for word in ["search", "find", "look up", "get"]):
            return "search", 90
        if any(word in message for word in ["schedule", "book", "set up"]):
            return "schedule", 90
        if any(word in message for word in ["upload", "save", "store"]):
            return "upload", 85
        if any(word in message for word in ["download", "fetch", "retrieve"]):
            return "download", 85

        # Context-based detection from chat history
        if chat_history:
            recent_actions = self._extract_recent_actions(chat_history)
            if recent_actions:
                # Assume continuation of recent action
                return recent_actions[0], 60

        # Default: assume send/post (most common)
        return "post", 40

    def _detect_platform(
        self, message: str, chat_history: List[Dict], connected_apps: List[str]
    ) -> Tuple[Optional[str], int]:
        """
        Detects the target platform (TWITTER, GMAIL, etc.).
        Returns (platform, confidence_score).
        """
        # Explicit platform mentioned in message
        for keyword, possible_platforms in self.PLATFORM_KEYWORDS.items():
            if keyword in message:
                # Filter by connected apps
                available = [p for p in possible_platforms if p in connected_apps]
                if available:
                    return available[0], 95
                else:
                    # Platform mentioned but not connected
                    return possible_platforms[0], 50

        # Check chat history for recent platform mentions
        recent_platform = self._extract_recent_platform(chat_history, connected_apps)
        if recent_platform:
            return recent_platform, 70

        # Smart default based on action and connected apps
        action_verb = self._detect_action(message, chat_history)[0]

        if action_verb == "post":
            # Prefer social media platforms
            for platform in ["TWITTER", "TWITTEROAUTH2", "LINKEDIN", "FACEBOOK"]:
                if platform in connected_apps:
                    return platform, 60

        if action_verb == "send":
            # Prefer messaging platforms
            for platform in ["GMAIL", "SLACK", "OUTLOOK"]:
                if platform in connected_apps:
                    return platform, 60

        # If only one app connected, assume that's the target
        if len(connected_apps) == 1:
            return connected_apps[0], 55

        # No platform detected
        return None, 0

    def _resolve_content_reference(
        self, message: str, chat_history: List[Dict], available_files: List[Dict]
    ) -> Tuple[Optional[str], int]:
        """
        Resolves vague references like "this", "it", "the file" to actual content.
        Returns (content_reference, confidence_score).
        """
        # Check for vague references
        has_vague_ref = any(ref in message for ref in self.VAGUE_REFERENCES)

        if not has_vague_ref:
            # Try to extract specific content mentions
            content_keywords = ["analysis", "report", "summary", "review", "document", "file"]
            for keyword in content_keywords:
                if keyword in message:
                    return keyword, 80
            return None, 100  # No vague reference = high confidence in clarity

        # Vague reference detected - need to resolve

        # 1. Check for attached files
        if available_files:
            # Most recent file
            most_recent = available_files[-1]
            file_name = most_recent.get('file_name') or most_recent.get('name')
            return file_name, 85

        # 2. Check chat history for recently mentioned content
        recent_content = self._extract_recent_content_mentions(chat_history)
        if recent_content:
            return recent_content, 70

        # 3. Check if assistant generated content recently
        if chat_history:
            for msg in reversed(chat_history[-5:]):  # Last 5 messages
                if msg.get('role') == 'assistant':
                    # Check if assistant generated something
                    content = msg.get('content', '')
                    if len(content) > 100:  # Substantial content
                        return "generated_content", 65

        # Cannot resolve
        return "unresolved_reference", 20

    def _calculate_date(self, message: str) -> Tuple[Optional[datetime.date], int]:
        """
        Calculates explicit dates from phrases like 'yesterday', 'last week'.
        Returns (calculated_date, confidence_score).
        """
        for phrase, days_offset in self.DATE_PATTERNS.items():
            if phrase in message:
                target_date = datetime.date.today() + datetime.timedelta(days=days_offset)

                # Business day adjustment for stock-related queries
                if any(keyword in message for keyword in ["stock", "market", "trading"]):
                    target_date = self._adjust_to_business_day(target_date)

                return target_date, 95

        # Check for specific date patterns (e.g., "January 5th", "01/05/2025")
        date_match = re.search(r'\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b', message)
        if date_match:
            # Would need proper date parsing here
            return None, 50  # Detected pattern but not implemented

        return None, 100  # No date mentioned = high confidence in clarity

    def _adjust_to_business_day(self, date: datetime.date) -> datetime.date:
        """Adjusts date to previous business day if it falls on weekend."""
        weekday = date.weekday()
        if weekday == 5:  # Saturday
            return date - datetime.timedelta(days=1)
        elif weekday == 6:  # Sunday
            return date - datetime.timedelta(days=2)
        return date

    def _calculate_overall_confidence(
        self, action_conf: int, platform_conf: int, content_conf: int, date_conf: int
    ) -> int:
        """
        Calculates overall confidence score (0-100) based on component confidences.
        Weighted average with action and platform being most important.
        """
        weights = {
            'action': 0.35,
            'platform': 0.35,
            'content': 0.20,
            'date': 0.10
        }

        overall = (
            action_conf * weights['action'] +
            platform_conf * weights['platform'] +
            content_conf * weights['content'] +
            date_conf * weights['date']
        )

        return int(overall)

    def _identify_missing_requirements(
        self,
        resolution: IntentResolution,
        available_files: List[Dict],
        connected_apps: List[str],
        agent_tools: List[str]
    ) -> List[str]:
        """Identifies what's missing to execute the action successfully."""
        missing = []

        # Check if content reference is resolved
        if resolution.content_reference in ["unresolved_reference", None]:
            if resolution.action in ["post", "send", "upload"]:
                if not available_files:
                    missing.append("content_or_file")

        # Check if platform is identified
        if not resolution.platform:
            if resolution.action in ["post", "send"]:
                missing.append("target_platform")

        # Check if platform is connected
        if resolution.platform and resolution.platform not in connected_apps:
            missing.append(f"platform_connection:{resolution.platform}")

        # Check if date is needed but not calculated
        if "yesterday" in resolution.reasoning.lower() and not resolution.calculated_date:
            missing.append("date_calculation")

        # Check for real-time data requirements
        if any(keyword in resolution.reasoning.lower() for keyword in self.REALTIME_DATA_KEYWORDS):
            has_search_tool = any(tool in agent_tools for tool in ["web_search", "yahoo_finance"])
            if not has_search_tool:
                missing.append("realtime_data_tool")

        return missing

    def _build_reasoning(
        self,
        resolution: IntentResolution,
        original_message: str,
        chat_history: List[Dict],
        connected_apps: List[str]
    ) -> str:
        """Builds human-readable explanation of the decision."""
        reasoning_parts = []

        # Action reasoning
        if resolution.action != "unknown":
            reasoning_parts.append(f"Action: Interpreted as '{resolution.action}'")

        # Platform reasoning
        if resolution.platform:
            reasoning_parts.append(f"Platform: Identified as {resolution.platform}")
        elif resolution.action in ["post", "send"]:
            reasoning_parts.append(f"Platform: Could not identify (connected: {', '.join(connected_apps[:3])})")

        # Content reasoning
        if resolution.content_reference:
            reasoning_parts.append(f"Content: Refers to '{resolution.content_reference}'")

        # Date reasoning
        if resolution.calculated_date:
            reasoning_parts.append(f"Date: Calculated as {resolution.calculated_date.strftime('%Y-%m-%d')}")

        # Confidence reasoning
        if resolution.confidence < 50:
            reasoning_parts.append("⚠️ Low confidence - high ambiguity")
        elif resolution.confidence < 75:
            reasoning_parts.append("⚠️ Medium confidence - some assumptions made")

        return " | ".join(reasoning_parts)

    def _generate_fallback_options(
        self, resolution: IntentResolution, connected_apps: List[str]
    ) -> List[Dict[str, Any]]:
        """Generates alternative interpretations if confidence is low."""
        fallbacks = []

        if resolution.confidence < 70 and not resolution.platform:
            # Suggest all connected social/messaging platforms
            for app in connected_apps:
                if app in ["TWITTER", "TWITTEROAUTH2", "GMAIL", "SLACK", "LINKEDIN"]:
                    fallbacks.append({
                        "platform": app,
                        "reasoning": f"Could target {app} (connected)",
                        "confidence": 50
                    })

        return fallbacks

    # Helper methods for extracting context from chat history

    def _extract_recent_actions(self, chat_history: List[Dict]) -> List[str]:
        """Extracts actions mentioned in recent chat history."""
        actions = []
        for msg in reversed(chat_history[-5:]):
            content = msg.get('content', '').lower()
            if 'post' in content or 'tweet' in content:
                actions.append('post')
            if 'send' in content or 'email' in content:
                actions.append('send')
        return actions

    def _extract_recent_platform(
        self, chat_history: List[Dict], connected_apps: List[str]
    ) -> Optional[str]:
        """Extracts platform mentioned in recent chat history."""
        for msg in reversed(chat_history[-5:]):
            content = msg.get('content', '').lower()
            for keyword, platforms in self.PLATFORM_KEYWORDS.items():
                if keyword in content:
                    for platform in platforms:
                        if platform in connected_apps:
                            return platform
        return None

    def _extract_recent_content_mentions(self, chat_history: List[Dict]) -> Optional[str]:
        """Extracts content/file mentions from recent chat history."""
        content_keywords = ["analysis", "report", "summary", "review", "document", "file", "pdf"]
        for msg in reversed(chat_history[-5:]):
            content = msg.get('content', '').lower()
            for keyword in content_keywords:
                if keyword in content:
                    return keyword
        return None

    def requires_realtime_data(self, message: str) -> bool:
        """Checks if the message requires real-time data lookup."""
        message_lower = message.lower()

        # Check for real-time keywords
        if any(keyword in message_lower for keyword in self.REALTIME_DATA_KEYWORDS):
            return True

        # Check for stock ticker patterns
        for pattern in self.STOCK_PATTERNS:
            if re.search(pattern, message, re.IGNORECASE):
                return True

        return False

    def suggest_search_tool(self, message: str, agent_tools: List[str]) -> Optional[str]:
        """
        Suggests which search tool to use based on message content.
        Returns tool name or None.
        """
        message_lower = message.lower()

        # Stock/financial data
        if any(word in message_lower for word in ["stock", "ticker", "share price", "market"]):
            if "yahoo_finance" in agent_tools:
                return "yahoo_finance"

        # Weather data
        if any(word in message_lower for word in ["weather", "temperature", "forecast"]):
            if "weather" in agent_tools:
                return "weather"

        # General web search
        if any(word in message_lower for word in ["news", "current", "latest", "search", "find"]):
            if "web_search" in agent_tools:
                return "web_search"

        # Fallback to web search if available
        if "web_search" in agent_tools:
            return "web_search"

        return None


# Singleton instance
_intent_engine = None

def get_intent_engine() -> IntentResolutionEngine:
    """Returns singleton instance of IntentResolutionEngine."""
    global _intent_engine
    if _intent_engine is None:
        _intent_engine = IntentResolutionEngine()
    return _intent_engine
