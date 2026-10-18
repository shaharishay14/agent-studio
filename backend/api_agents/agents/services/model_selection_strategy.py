"""
Model Selection Strategy
------------------------
Dynamically selects the appropriate AI model based on task complexity.
Upgrades from gpt-4o-mini to gpt-4o for complex tasks.

ENHANCED with:
- Vague language detection (launch, drop, share, this, it)
- Date calculation requirements (yesterday, last week)
- Real-time data requirements (current stock, today's news)
- Multi-step reasoning detection
"""

from typing import List, Dict, Optional
import re


class ModelSelectionStrategy:
    """
    Strategy for selecting the appropriate model based on task characteristics.
    Solves the "gpt-4o-mini can't handle complex tasks" problem.
    """

    def __init__(self):
        """Initialize with complexity detection rules"""
        self.complexity_indicators = self._build_complexity_indicators()
        self.default_model = "gpt-4o-mini"
        self.complex_model = "gpt-4o"

    def _build_complexity_indicators(self) -> Dict[str, List[str]]:
        """
        Build indicators that suggest task complexity.

        Returns:
            Dictionary mapping categories to indicator keywords/patterns
        """
        return {
            # Tasks that require deep analysis
            "analysis_tasks": [
                "analyze", "analysis", "deep dive", "investigate",
                "examine", "review", "assess", "evaluate",
                "compare", "contrast", "summarize long",
                "complex analysis"
            ],

            # Multi-step reasoning tasks
            "multi_step_reasoning": [
                "plan", "strategy", "multi-step", "multiple steps",
                "workflow", "process", "sequence", "orchestrate",
                "coordinate between", "integrate", "complex workflow"
            ],

            # Document processing
            "document_processing": [
                "pdf", "document", "read file", "parse document",
                "extract from", "summarize document", "analyze document",
                "report generation", "create presentation"
            ],

            # Code-related tasks
            "code_tasks": [
                "code review", "debug", "refactor", "implement",
                "algorithm", "optimize code", "github pull request",
                "analyze code", "write tests"
            ],

            # Calendar and scheduling (complex due to timezone/conflict handling)
            "scheduling_tasks": [
                "schedule multiple", "complex meeting", "recurring event",
                "coordinate schedules", "find available time",
                "calendar conflict", "timezone"
            ],

            # Data analysis and calculations
            "data_tasks": [
                "calculate complex", "financial analysis", "data analysis",
                "spreadsheet analysis", "pivot", "aggregate data",
                "statistical", "forecast", "predict"
            ],

            # Creative/generative tasks requiring quality
            "creative_tasks": [
                "write detailed", "compose long", "creative writing",
                "marketing copy", "professional email",
                "proposal", "presentation content"
            ],

            # Integration tasks (multiple services)
            "integration_tasks": [
                "sync between", "migrate from", "export and import",
                "backup and restore", "cross-platform"
            ],

            # NEW: Vague language that requires contextual reasoning
            "vague_language": [
                "launch this", "drop this", "blast this", "share this",
                "fire this", "release this", "push this", "send this",
                "post it", "share it", "upload it", "send it"
            ],

            # NEW: Date calculation requirements
            "date_calculation": [
                "yesterday", "last week", "last month", "previous day",
                "earlier today", "last tuesday", "a week ago", "days ago",
                "previous", "prior", "recent"
            ],

            # NEW: Real-time data requirements
            "realtime_data": [
                "current stock", "latest price", "today's market",
                "current weather", "latest news", "today's",
                "right now", "at the moment", "currently", "recent",
                "ticker", "market price"
            ],

            # NEW: Stock/Financial queries (historically problematic)
            "financial_queries": [
                "stock", "ticker", "market", "trading", "investment",
                "portfolio", "share price", "stock analysis"
            ]
        }

    def select_model(
        self,
        user_prompt: str,
        connected_apps: List[str] = None,
        chat_history: List[Dict[str, str]] = None
    ) -> str:
        """
        Select appropriate model based on task complexity.

        Args:
            user_prompt: The user's current message
            connected_apps: List of connected applications
            chat_history: Previous conversation history

        Returns:
            Model name to use ("gpt-4o-mini" or "gpt-4o")
        """
        complexity_score = self._calculate_complexity_score(
            user_prompt,
            connected_apps,
            chat_history
        )

        # Threshold for upgrading to gpt-4o
        # Lower threshold = more aggressive upgrading
        UPGRADE_THRESHOLD = 2

        if complexity_score >= UPGRADE_THRESHOLD:
            print(f"🚀 Upgrading to {self.complex_model} (complexity score: {complexity_score})")
            return self.complex_model
        else:
            print(f"⚡ Using {self.default_model} (complexity score: {complexity_score})")
            return self.default_model

    def _calculate_complexity_score(
        self,
        user_prompt: str,
        connected_apps: List[str] = None,
        chat_history: List[Dict[str, str]] = None
    ) -> int:
        """
        Calculate complexity score for the task.

        Returns:
            Integer score (0 = simple, higher = more complex)
        """
        score = 0
        prompt_lower = user_prompt.lower()

        # Check for complexity indicators in the prompt
        for category, indicators in self.complexity_indicators.items():
            for indicator in indicators:
                if indicator in prompt_lower:
                    score += 1
                    print(f"  📊 Complexity indicator found: '{indicator}' ({category})")
                    # Don't count multiple indicators from same category
                    break

        # Check for long prompts (usually more complex)
        if len(user_prompt) > 500:
            score += 1
            print(f"  📊 Long prompt detected ({len(user_prompt)} chars)")

        # Check for multiple apps (suggests integration task)
        if connected_apps and len(connected_apps) >= 3:
            score += 1
            print(f"  📊 Multiple apps connected ({len(connected_apps)} apps)")

        # Check for calendar app (historically problematic with mini)
        if connected_apps and "GOOGLECALENDAR" in [app.upper() for app in connected_apps]:
            if any(word in prompt_lower for word in ["schedule", "meeting", "event", "calendar"]):
                score += 1
                print(f"  📊 Calendar operation detected (requires precision)")

        # Check chat history for context (multi-turn conversations can be complex)
        if chat_history and len(chat_history) > 6:
            score += 1
            print(f"  📊 Long conversation history ({len(chat_history)} messages)")

        # NEW: Check for vague language (requires contextual reasoning)
        vague_verbs = ["launch", "drop", "blast", "share", "fire", "release", "push", "throw", "toss"]
        vague_refs = ["this", "it", "that", "the file", "the doc"]

        has_vague_verb = any(verb in prompt_lower for verb in vague_verbs)
        has_vague_ref = any(ref in prompt_lower for ref in vague_refs)

        if has_vague_verb or has_vague_ref:
            score += 1
            print(f"  📊 Vague language detected (requires context reasoning)")

        # NEW: Check for date calculation requirements
        date_keywords = ["yesterday", "last week", "last month", "ago", "previous"]
        if any(keyword in prompt_lower for keyword in date_keywords):
            score += 1
            print(f"  📊 Date calculation required (precision needed)")

        # NEW: Check for real-time data requirements
        realtime_keywords = ["current", "latest", "today's", "now", "ticker", "stock price"]
        if any(keyword in prompt_lower for keyword in realtime_keywords):
            score += 1
            print(f"  📊 Real-time data query (requires web search orchestration)")

        # NEW: Check for multi-tool workflows (e.g., "email this Drive file")
        multi_tool_patterns = [
            r"(send|email|share).*(drive|file|doc|pdf)",
            r"(post|tweet|share).*(file|image|doc)",
            r"(schedule|create event).*(send|email|notify)",
            r"(search|find|get).*(then|and).*(send|post|share)"
        ]
        for pattern in multi_tool_patterns:
            if re.search(pattern, prompt_lower):
                score += 1
                print(f"  📊 Multi-tool workflow detected (requires orchestration)")
                break

        return score

    def detect_vague_language(self, user_prompt: str) -> Dict[str, any]:
        """
        Explicitly detect vague language in the prompt.

        Returns:
            Dictionary with vague language detection results
        """
        prompt_lower = user_prompt.lower()

        vague_verbs = ["launch", "drop", "blast", "share", "fire", "release", "push", "throw", "toss", "ship"]
        vague_refs = ["this", "it", "that", "the file", "the doc", "the report"]

        detected_verbs = [verb for verb in vague_verbs if verb in prompt_lower]
        detected_refs = [ref for ref in vague_refs if ref in prompt_lower]

        is_vague = len(detected_verbs) > 0 or len(detected_refs) > 0

        return {
            "is_vague": is_vague,
            "vague_verbs": detected_verbs,
            "vague_references": detected_refs,
            "confidence_penalty": 20 if is_vague else 0,  # Reduce confidence by 20% if vague
            "requires_gpt4o": is_vague  # Vague language benefits from stronger model
        }

    def get_selection_reasoning(
        self,
        user_prompt: str,
        selected_model: str,
        complexity_score: int,
        connected_apps: List[str] = None
    ) -> str:
        """
        Generate human-readable reasoning for model selection.

        Returns:
            String explaining why this model was selected
        """
        reasons = []

        if selected_model == self.complex_model:
            reasons.append(f"Complexity score: {complexity_score} (threshold: 2)")

            # Detect specific reasons
            prompt_lower = user_prompt.lower()

            if any(verb in prompt_lower for verb in ["launch", "drop", "blast", "share"]):
                reasons.append("Vague language detected - requires contextual reasoning")

            if any(word in prompt_lower for word in ["yesterday", "last week", "ago"]):
                reasons.append("Date calculation required - precision critical")

            if any(word in prompt_lower for word in ["current", "stock", "ticker", "market"]):
                reasons.append("Real-time data query - needs orchestration")

            if len(user_prompt) > 500:
                reasons.append("Long prompt - complex request")

            if connected_apps and len(connected_apps) >= 3:
                reasons.append(f"Multiple apps ({len(connected_apps)}) - integration task")

        else:
            reasons.append(f"Simple task - {self.default_model} is sufficient")

        return " | ".join(reasons)

    def should_use_complex_model_for_app(self, app_name: str) -> bool:
        """
        Determine if a specific app always requires the complex model.

        Args:
            app_name: Application name

        Returns:
            True if this app should always use complex model
        """
        # Apps that consistently need the complex model
        complex_apps = {
            "GOOGLECALENDAR",  # Calendar logic is complex (timezones, conflicts)
            "GITHUB",          # Code operations need precision
            "NOTION",          # Complex data structures
            "AIRTABLE",        # Database operations
        }

        return app_name.upper() in complex_apps


# Global instance
_model_selection_strategy_instance = None


def get_model_selection_strategy() -> ModelSelectionStrategy:
    """Get or create the global model selection strategy instance"""
    global _model_selection_strategy_instance
    if _model_selection_strategy_instance is None:
        _model_selection_strategy_instance = ModelSelectionStrategy()
    return _model_selection_strategy_instance
