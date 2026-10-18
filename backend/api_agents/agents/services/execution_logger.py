"""
Execution Logger & Debugger - Tracks every decision the agent makes for debugging.

This logger records:
1. Intent resolution decisions (what was vague, what it resolved to, confidence)
2. Context snapshot (apps, files, recent topics)
3. Pre-execution validation results
4. Tool selection reasoning
5. Model selection (why mini vs 4o)
6. Final actions taken
7. Execution results

Provides comprehensive audit trail for debugging inconsistencies.
"""

import json
import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from .intent_resolution_engine import IntentResolution
from .pre_execution_validator import ValidationResult


@dataclass
class ExecutionLog:
    """Single execution log entry."""
    timestamp: str
    agent_id: str
    user_id: str
    user_message: str

    # Intent Resolution
    resolved_intent: Dict[str, Any]
    intent_confidence: int

    # Context Snapshot
    connected_apps: List[str]
    available_files: List[str]
    agent_tools: List[str]
    chat_history_length: int
    recent_topics: List[str]

    # Validation
    validation_passed: bool
    validation_confidence: int
    blocking_issues: List[str]
    warnings: List[str]
    required_actions: List[str]

    # Tool Selection
    selected_tools: List[str]
    tool_selection_reasoning: str

    # Model Selection
    selected_model: str
    model_selection_reasoning: str

    # Execution
    execution_status: str  # pending, in_progress, completed, failed
    execution_steps: List[str]
    tool_results: List[Dict[str, Any]]
    final_output: Optional[str]
    error_message: Optional[str]

    # Metrics
    total_duration_ms: Optional[int]
    tool_call_count: int

    # Debug Flags
    had_vague_language: bool
    had_date_calculation: bool
    had_platform_inference: bool
    had_content_resolution: bool
    required_web_search: bool


class ExecutionLogger:
    """
    Comprehensive logger for agent execution debugging.
    Tracks every decision and provides audit trail.
    """

    def __init__(self):
        """Initialize the logger."""
        self.current_log: Optional[ExecutionLog] = None
        self.log_history: List[ExecutionLog] = []
        self.max_history = 100  # Keep last 100 logs in memory

    def start_execution(
        self,
        agent_id: str,
        user_id: str,
        user_message: str,
        connected_apps: List[str],
        available_files: List[Dict[str, Any]],
        agent_tools: List[str],
        chat_history: List[Dict[str, str]]
    ) -> str:
        """
        Starts a new execution log.
        Returns log ID (timestamp-based).
        """
        timestamp = datetime.datetime.now().isoformat()

        # Extract file names for logging
        file_names = [
            f.get('file_name') or f.get('name') or 'unnamed'
            for f in available_files
        ]

        # Extract recent topics from chat history
        recent_topics = self._extract_recent_topics(chat_history, user_message)

        self.current_log = ExecutionLog(
            timestamp=timestamp,
            agent_id=agent_id,
            user_id=user_id,
            user_message=user_message,
            resolved_intent={},
            intent_confidence=0,
            connected_apps=connected_apps,
            available_files=file_names,
            agent_tools=agent_tools,
            chat_history_length=len(chat_history),
            recent_topics=recent_topics,
            validation_passed=False,
            validation_confidence=0,
            blocking_issues=[],
            warnings=[],
            required_actions=[],
            selected_tools=[],
            tool_selection_reasoning="",
            selected_model="",
            model_selection_reasoning="",
            execution_status="pending",
            execution_steps=[],
            tool_results=[],
            final_output=None,
            error_message=None,
            total_duration_ms=None,
            tool_call_count=0,
            had_vague_language=False,
            had_date_calculation=False,
            had_platform_inference=False,
            had_content_resolution=False,
            required_web_search=False
        )

        return timestamp

    def log_intent_resolution(self, intent: IntentResolution):
        """Logs the intent resolution results."""
        if not self.current_log:
            return

        self.current_log.resolved_intent = {
            "action": intent.action,
            "platform": intent.platform,
            "content_reference": intent.content_reference,
            "calculated_date": str(intent.calculated_date) if intent.calculated_date else None,
            "reasoning": intent.reasoning,
            "missing_requirements": intent.missing_requirements,
            "fallback_options": intent.fallback_options
        }
        self.current_log.intent_confidence = intent.confidence

        # Set debug flags
        vague_verbs = ["launch", "drop", "blast", "share", "push", "throw"]
        self.current_log.had_vague_language = any(
            verb in self.current_log.user_message.lower()
            for verb in vague_verbs
        )
        self.current_log.had_date_calculation = intent.calculated_date is not None
        self.current_log.had_platform_inference = intent.platform is not None
        self.current_log.had_content_resolution = intent.content_reference is not None

        # Log decision
        self._add_execution_step(f"Intent Resolution: {intent.reasoning} (Confidence: {intent.confidence}%)")

    def log_validation(self, validation: ValidationResult):
        """Logs the pre-execution validation results."""
        if not self.current_log:
            return

        self.current_log.validation_passed = validation.passed
        self.current_log.validation_confidence = validation.confidence
        self.current_log.blocking_issues = validation.blocking_issues
        self.current_log.warnings = validation.warnings
        self.current_log.required_actions = validation.required_actions

        # Log decision
        status = "✅ PASSED" if validation.passed else "❌ BLOCKED"
        self._add_execution_step(f"Validation: {status} - {validation.validation_summary}")

        if not validation.passed:
            self.current_log.execution_status = "blocked"

    def log_tool_selection(self, selected_tools: List[str], reasoning: str):
        """Logs tool selection decisions."""
        if not self.current_log:
            return

        self.current_log.selected_tools = selected_tools
        self.current_log.tool_selection_reasoning = reasoning

        # Check if web search was required
        search_tools = ["WEB_SEARCH", "TAVILY", "SERPAPI", "GOOGLE_SEARCH"]
        self.current_log.required_web_search = any(
            tool.upper() in [st.upper() for st in search_tools]
            for tool in selected_tools
        )

        # Log decision
        tools_summary = ", ".join(selected_tools[:5])
        if len(selected_tools) > 5:
            tools_summary += f" (+ {len(selected_tools) - 5} more)"
        self._add_execution_step(f"Tool Selection: {tools_summary} | Reason: {reasoning}")

    def log_model_selection(self, model: str, reasoning: str):
        """Logs model selection (gpt-4o-mini vs gpt-4o)."""
        if not self.current_log:
            return

        self.current_log.selected_model = model
        self.current_log.model_selection_reasoning = reasoning

        # Log decision
        self._add_execution_step(f"Model Selection: {model} | Reason: {reasoning}")

    def log_execution_start(self):
        """Marks execution as started."""
        if not self.current_log:
            return

        self.current_log.execution_status = "in_progress"
        self._add_execution_step("Execution Started")

    def log_tool_call(self, tool_name: str, result: Dict[str, Any]):
        """Logs individual tool call and result."""
        if not self.current_log:
            return

        self.current_log.tool_call_count += 1
        self.current_log.tool_results.append({
            "tool": tool_name,
            "result": result,
            "timestamp": datetime.datetime.now().isoformat()
        })

        # Log step
        success = result.get('success', False) if isinstance(result, dict) else True
        status_emoji = "✅" if success else "❌"
        self._add_execution_step(f"{status_emoji} Tool Call: {tool_name}")

    def log_execution_complete(self, final_output: str, duration_ms: int):
        """Marks execution as completed."""
        if not self.current_log:
            return

        self.current_log.execution_status = "completed"
        self.current_log.final_output = final_output
        self.current_log.total_duration_ms = duration_ms

        self._add_execution_step(f"Execution Completed (Duration: {duration_ms}ms)")

        # Archive to history
        self._archive_current_log()

    def log_execution_error(self, error_message: str):
        """Marks execution as failed with error."""
        if not self.current_log:
            return

        self.current_log.execution_status = "failed"
        self.current_log.error_message = error_message

        self._add_execution_step(f"❌ Execution Failed: {error_message}")

        # Archive to history
        self._archive_current_log()

    def _add_execution_step(self, step: str):
        """Adds a step to execution steps list."""
        if self.current_log:
            self.current_log.execution_steps.append(step)

    def _extract_recent_topics(self, chat_history: List[Dict], current_message: str) -> List[str]:
        """Extracts key topics from recent conversation."""
        topics = []

        # Keywords to look for
        topic_keywords = [
            "stock", "weather", "email", "calendar", "meeting",
            "twitter", "post", "analysis", "report", "summary",
            "file", "document", "upload", "download"
        ]

        # Check current message
        for keyword in topic_keywords:
            if keyword in current_message.lower():
                topics.append(keyword)

        # Check last 3 messages
        for msg in chat_history[-3:]:
            content = msg.get('content', '').lower()
            for keyword in topic_keywords:
                if keyword in content and keyword not in topics:
                    topics.append(keyword)

        return topics[:5]  # Max 5 topics

    def _archive_current_log(self):
        """Archives current log to history."""
        if self.current_log:
            self.log_history.append(self.current_log)

            # Maintain max history size
            if len(self.log_history) > self.max_history:
                self.log_history = self.log_history[-self.max_history:]

            self.current_log = None

    def get_current_log(self) -> Optional[ExecutionLog]:
        """Returns the current active log."""
        return self.current_log

    def get_log_history(self, limit: int = 50) -> List[ExecutionLog]:
        """Returns recent log history."""
        return self.log_history[-limit:]

    def get_logs_by_agent(self, agent_id: str, limit: int = 20) -> List[ExecutionLog]:
        """Returns logs for specific agent."""
        agent_logs = [log for log in self.log_history if log.agent_id == agent_id]
        return agent_logs[-limit:]

    def get_failed_executions(self, limit: int = 20) -> List[ExecutionLog]:
        """Returns failed execution logs for debugging."""
        failed = [log for log in self.log_history if log.execution_status == "failed"]
        return failed[-limit:]

    def get_low_confidence_executions(self, threshold: int = 60, limit: int = 20) -> List[ExecutionLog]:
        """Returns executions with low confidence scores."""
        low_conf = [
            log for log in self.log_history
            if log.intent_confidence < threshold or log.validation_confidence < threshold
        ]
        return low_conf[-limit:]

    def export_log_as_dict(self, log: ExecutionLog) -> Dict[str, Any]:
        """Exports log as dictionary for JSON serialization."""
        return asdict(log)

    def export_log_as_json(self, log: ExecutionLog) -> str:
        """Exports log as JSON string."""
        return json.dumps(self.export_log_as_dict(log), indent=2)

    def get_execution_summary(self, log: ExecutionLog) -> str:
        """Generates human-readable summary of execution."""
        summary_lines = [
            f"=== Execution Log: {log.timestamp} ===",
            f"User: {log.user_id} | Agent: {log.agent_id}",
            f"Message: \"{log.user_message}\"",
            "",
            f"Intent: {log.resolved_intent.get('action', 'unknown')} → {log.resolved_intent.get('platform', 'N/A')} (Confidence: {log.intent_confidence}%)",
            f"Validation: {'✅ Passed' if log.validation_passed else '❌ Failed'} (Confidence: {log.validation_confidence}%)",
            f"Tools: {', '.join(log.selected_tools[:3])}{'...' if len(log.selected_tools) > 3 else ''}",
            f"Model: {log.selected_model}",
            "",
            f"Status: {log.execution_status.upper()}",
            f"Duration: {log.total_duration_ms}ms" if log.total_duration_ms else "Duration: N/A",
            f"Tool Calls: {log.tool_call_count}",
            "",
            "Debug Flags:",
            f"  - Vague Language: {'✅' if log.had_vague_language else '❌'}",
            f"  - Date Calculation: {'✅' if log.had_date_calculation else '❌'}",
            f"  - Platform Inference: {'✅' if log.had_platform_inference else '❌'}",
            f"  - Content Resolution: {'✅' if log.had_content_resolution else '❌'}",
            f"  - Web Search Required: {'✅' if log.required_web_search else '❌'}",
        ]

        if log.blocking_issues:
            summary_lines.append("")
            summary_lines.append("Blocking Issues:")
            for issue in log.blocking_issues:
                summary_lines.append(f"  - {issue}")

        if log.warnings:
            summary_lines.append("")
            summary_lines.append("Warnings:")
            for warning in log.warnings:
                summary_lines.append(f"  - {warning}")

        if log.error_message:
            summary_lines.append("")
            summary_lines.append(f"❌ Error: {log.error_message}")

        summary_lines.append("")
        summary_lines.append("Execution Steps:")
        for i, step in enumerate(log.execution_steps, 1):
            summary_lines.append(f"  {i}. {step}")

        return "\n".join(summary_lines)

    def print_current_log(self):
        """Prints current log to console (for debugging)."""
        if self.current_log:
            print(self.get_execution_summary(self.current_log))
        else:
            print("No active execution log")

    def get_statistics(self) -> Dict[str, Any]:
        """Returns aggregate statistics across all logs."""
        if not self.log_history:
            return {"message": "No logs available"}

        total_logs = len(self.log_history)
        completed = sum(1 for log in self.log_history if log.execution_status == "completed")
        failed = sum(1 for log in self.log_history if log.execution_status == "failed")
        blocked = sum(1 for log in self.log_history if log.execution_status == "blocked")

        avg_confidence = sum(log.intent_confidence for log in self.log_history) / total_logs
        avg_duration = sum(
            log.total_duration_ms for log in self.log_history if log.total_duration_ms
        ) / max(1, sum(1 for log in self.log_history if log.total_duration_ms))

        vague_language_count = sum(1 for log in self.log_history if log.had_vague_language)
        date_calc_count = sum(1 for log in self.log_history if log.had_date_calculation)
        platform_infer_count = sum(1 for log in self.log_history if log.had_platform_inference)

        return {
            "total_executions": total_logs,
            "completed": completed,
            "failed": failed,
            "blocked": blocked,
            "success_rate": f"{(completed / total_logs * 100):.1f}%",
            "avg_intent_confidence": f"{avg_confidence:.1f}%",
            "avg_duration_ms": f"{avg_duration:.0f}",
            "vague_language_detected": vague_language_count,
            "date_calculations": date_calc_count,
            "platform_inferences": platform_infer_count,
        }


# Singleton instance
_logger = None

def get_execution_logger() -> ExecutionLogger:
    """Returns singleton instance of ExecutionLogger."""
    global _logger
    if _logger is None:
        _logger = ExecutionLogger()
    return _logger
