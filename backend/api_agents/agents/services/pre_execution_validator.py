"""
Pre-Execution Validator - Prevents hallucination by blocking tool execution
until all requirements are met.

This validator ensures the agent has everything it needs before executing tools:
1. Files exist and are accessible
2. Dates are calculated (not guessed)
3. Platforms are identified
4. Content is generated/fetched (not hallucinated)
5. Required tools are available
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from .intent_resolution_engine import IntentResolution


@dataclass
class ValidationResult:
    """Result of pre-execution validation."""
    passed: bool
    confidence: int  # 0-100
    blocking_issues: List[str]  # Critical issues that prevent execution
    warnings: List[str]  # Non-critical issues
    required_actions: List[str]  # What agent must do before executing
    validation_summary: str


class PreExecutionValidator:
    """
    Validates that the agent has all requirements before tool execution.
    Acts as a gatekeeper to prevent hallucination and premature execution.
    """

    def __init__(self):
        """Initialize the validator."""
        pass

    def validate(
        self,
        intent: IntentResolution,
        available_files: List[Dict[str, Any]],
        connected_apps: List[str],
        agent_tools: List[str],
        chat_history: List[Dict[str, str]],
        user_message: str
    ) -> ValidationResult:
        """
        Main validation method. Checks all requirements before execution.

        Args:
            intent: Resolved intent from IntentResolutionEngine
            available_files: List of available files
            connected_apps: List of connected app names
            agent_tools: List of enabled agent tools
            chat_history: Recent conversation history
            user_message: Original user message

        Returns:
            ValidationResult with pass/fail and required actions
        """
        blocking_issues = []
        warnings = []
        required_actions = []

        # Validation Gate 1: File Validation
        file_validation = self._validate_file_requirements(
            intent, available_files, user_message, chat_history
        )
        blocking_issues.extend(file_validation['blocking'])
        warnings.extend(file_validation['warnings'])
        required_actions.extend(file_validation['actions'])

        # Validation Gate 2: Date Validation
        date_validation = self._validate_date_requirements(intent, user_message)
        blocking_issues.extend(date_validation['blocking'])
        warnings.extend(date_validation['warnings'])
        required_actions.extend(date_validation['actions'])

        # Validation Gate 3: Platform Validation
        platform_validation = self._validate_platform_requirements(
            intent, connected_apps, user_message
        )
        blocking_issues.extend(platform_validation['blocking'])
        warnings.extend(platform_validation['warnings'])
        required_actions.extend(platform_validation['actions'])

        # Validation Gate 4: Content Validation
        content_validation = self._validate_content_requirements(
            intent, available_files, chat_history, user_message
        )
        blocking_issues.extend(content_validation['blocking'])
        warnings.extend(content_validation['warnings'])
        required_actions.extend(content_validation['actions'])

        # Validation Gate 5: Tool Availability
        tool_validation = self._validate_tool_availability(
            intent, connected_apps, agent_tools, user_message
        )
        blocking_issues.extend(tool_validation['blocking'])
        warnings.extend(tool_validation['warnings'])
        required_actions.extend(tool_validation['actions'])

        # Validation Gate 6: Real-time Data Validation
        data_validation = self._validate_data_requirements(
            intent, agent_tools, user_message
        )
        blocking_issues.extend(data_validation['blocking'])
        warnings.extend(data_validation['warnings'])
        required_actions.extend(data_validation['actions'])

        # Determine overall pass/fail
        passed = len(blocking_issues) == 0

        # Calculate confidence based on warnings
        confidence = 100
        if warnings:
            confidence -= len(warnings) * 10
        confidence = max(confidence, 50)

        # Build summary
        summary = self._build_validation_summary(
            passed, blocking_issues, warnings, required_actions
        )

        return ValidationResult(
            passed=passed,
            confidence=confidence,
            blocking_issues=blocking_issues,
            warnings=warnings,
            required_actions=required_actions,
            validation_summary=summary
        )

    def _validate_file_requirements(
        self,
        intent: IntentResolution,
        available_files: List[Dict],
        user_message: str,
        chat_history: List[Dict]
    ) -> Dict[str, List[str]]:
        """Validates that required files exist and are accessible."""
        blocking = []
        warnings = []
        actions = []

        # Check if action requires file
        requires_file = intent.action in ["post", "send", "upload", "share"]

        # Check for vague file references
        vague_file_refs = ["this", "it", "that", "the file", "the doc"]
        has_vague_ref = any(ref in user_message.lower() for ref in vague_file_refs)

        # Check if vague reference refers to DATA/CONTENT rather than a FILE
        data_keywords = [
            "analysis", "report", "summary", "data", "information", "details",
            "price", "stock", "weather", "forecast", "result", "calculation",
            "news", "article", "update", "status", "metrics", "stats"
        ]
        refers_to_data = any(keyword in user_message.lower() for keyword in data_keywords)

        # Check if user is asking to CREATE/GENERATE new content (not reference existing)
        creation_keywords = [
            "create", "write", "make", "generate", "compose", "draft",
            "about", "for", "regarding"  # Topic indicators
        ]
        is_creating_content = any(keyword in user_message.lower() for keyword in creation_keywords)

        # Check if intent says content will be generated
        content_will_be_generated = (
            intent.content_reference in ["generated_content", None] or
            "generated" in str(intent.content_reference).lower()
        )

        # Check if this is a CONTENT posting/sharing task (Twitter, social media, etc.)
        # These tasks use "it"/"this" to refer to the POST CONTENT, not files
        content_posting_keywords = [
            "post", "tweet", "share", "publish", "write",
            "send email", "send message", "compose"
        ]
        is_content_posting = any(keyword in user_message.lower() for keyword in content_posting_keywords)

        # Check for explicit file indicators
        explicit_file_keywords = [
            "file", "document", "pdf", "spreadsheet", "attachment",
            "drive link", "download", "upload"
        ]
        explicitly_mentions_file = any(keyword in user_message.lower() for keyword in explicit_file_keywords)

        if requires_file and has_vague_ref:
            # User said "share this" or "send the file"
            # BUT: Check if "this"/"it" refers to data/content, not a file
            if refers_to_data:
                # "Send this stock analysis" - refers to data, not a file
                # No blocking needed - the data will be generated/fetched
                pass
            elif is_creating_content or content_will_be_generated:
                # "Create a post about our product" - asking for NEW content
                # No file required - content will be generated
                pass
            elif is_content_posting and not explicitly_mentions_file:
                # "Post it on Twitter" - "it" refers to the tweet content, not a file
                # "Write this to Instagram" - "this" refers to the caption, not a file
                # No blocking needed unless user explicitly says "file"
                pass
            elif not available_files and explicitly_mentions_file:
                # CRITICAL: No file available AND user explicitly mentioned "file"/"document"
                # This is a genuine file reference
                blocking.append("File reference detected ('this'/'it') but no files available")
                actions.append("SEARCH_FOR_FILE: Check if file needs to be downloaded from Drive/Cloud")

            elif len(available_files) > 3:
                # Multiple files - ambiguous which one
                warnings.append(f"Multiple files available ({len(available_files)}). Will use most recent.")

        # Check for Drive link patterns
        drive_link_patterns = ["drive.google.com", "docs.google.com", "sheets.google.com"]
        has_drive_link = any(pattern in user_message for pattern in drive_link_patterns)

        if has_drive_link and requires_file:
            # User provided Drive link - need to download first
            file_downloaded = any(
                "google" in str(f.get('source', '')).lower() or
                "drive" in str(f.get('source', '')).lower()
                for f in available_files
            )

            if not file_downloaded:
                blocking.append("Google Drive link detected but file not downloaded yet")
                actions.append("DOWNLOAD_FILE: Use GOOGLEDRIVE_DOWNLOAD_FILE tool first")

        # Check for attachment actions without files
        attachment_keywords = ["attach", "attachment", "send file", "with file"]
        needs_attachment = any(keyword in user_message.lower() for keyword in attachment_keywords)

        if needs_attachment and not available_files:
            blocking.append("Attachment requested but no files available")
            actions.append("REQUEST_FILE: Ask user to upload file or provide file location")

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _validate_date_requirements(
        self, intent: IntentResolution, user_message: str
    ) -> Dict[str, List[str]]:
        """Validates that dates are calculated, not guessed."""
        blocking = []
        warnings = []
        actions = []

        # Date keywords that require calculation
        date_keywords = ["yesterday", "last week", "last month", "previous", "earlier", "ago"]
        has_date_reference = any(keyword in user_message.lower() for keyword in date_keywords)

        # Check if date reference is critical (requires exact calculation)
        critical_date_actions = ["stock", "price", "market", "trading", "financial", "data"]
        date_is_critical = any(keyword in user_message.lower() for keyword in critical_date_actions)

        # Check if date is descriptive/casual ("yesterday's events", "last week's summary")
        descriptive_date_phrases = ["about", "summary of", "regarding", "discussion of", "recap of"]
        date_is_descriptive = any(phrase in user_message.lower() for phrase in descriptive_date_phrases)

        if has_date_reference:
            if intent.calculated_date is None:
                # Date mentioned but not calculated
                if date_is_critical and not date_is_descriptive:
                    # CRITICAL: Stock data, financial data needs exact date
                    blocking.append(f"Date reference detected ('{user_message[:50]}...') but not calculated")
                    actions.append("CALCULATE_DATE: Use current date to compute exact date")
                else:
                    # DESCRIPTIVE: "yesterday's events" - date is context, not requirement
                    warnings.append(f"Date reference detected but not critical for this task")
            else:
                # Date calculated successfully
                warnings.append(f"Date calculated as {intent.calculated_date}. Verify with user if critical.")

        # Check for "current" or "today" with stock/market
        current_keywords = ["current", "today", "now", "latest"]
        stock_keywords = ["stock", "price", "market", "ticker"]

        needs_current_data = (
            any(ck in user_message.lower() for ck in current_keywords) and
            any(sk in user_message.lower() for sk in stock_keywords)
        )

        if needs_current_data:
            warnings.append("Current stock data requested. Must search web for real-time data.")
            actions.append("SEARCH_REALTIME_DATA: Use Yahoo Finance or Web Search tool")

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _validate_platform_requirements(
        self, intent: IntentResolution, connected_apps: List[str], user_message: str
    ) -> Dict[str, List[str]]:
        """Validates platform is identified and connected."""
        blocking = []
        warnings = []
        actions = []

        # Check if action requires platform
        requires_platform = intent.action in ["post", "send", "upload", "share"]

        if requires_platform:
            if intent.platform is None:
                # Platform not identified
                # Check if there's only ONE obvious platform for this action
                social_platforms = [app for app in connected_apps if app in ["TWITTER", "TWITTEROAUTH2", "INSTAGRAM", "LINKEDIN", "FACEBOOK"]]
                messaging_platforms = [app for app in connected_apps if app in ["GMAIL", "SLACK", "OUTLOOK"]]

                # If only one social platform and action is "post" → auto-infer
                if intent.action == "post" and len(social_platforms) == 1:
                    warnings.append(f"Platform not specified. Inferring {social_platforms[0]} (only social platform connected)")
                # If only one messaging platform and action is "send" → auto-infer
                elif intent.action == "send" and len(messaging_platforms) == 1:
                    warnings.append(f"Platform not specified. Inferring {messaging_platforms[0]} (only messaging platform connected)")
                elif intent.confidence < 60:
                    # Low confidence - genuinely ambiguous
                    blocking.append("Cannot determine target platform from context")
                    actions.append(f"INFER_PLATFORM: Choose from connected apps: {', '.join(connected_apps[:3])}")
                else:
                    # Should have been identified
                    warnings.append("Platform not explicitly mentioned. Will infer from context.")

            elif intent.platform not in connected_apps:
                # Platform identified but not connected
                blocking.append(f"Target platform {intent.platform} is not connected")
                actions.append(f"BLOCK_EXECUTION: Inform user that {intent.platform} needs to be connected")

            else:
                # Platform valid
                pass

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _validate_content_requirements(
        self,
        intent: IntentResolution,
        available_files: List[Dict],
        chat_history: List[Dict],
        user_message: str
    ) -> Dict[str, List[str]]:
        """Validates content exists and is not hallucinated."""
        blocking = []
        warnings = []
        actions = []

        # Keywords indicating content that needs generation
        generation_keywords = ["analysis", "summary", "report", "review", "breakdown"]
        needs_generation = any(keyword in user_message.lower() for keyword in generation_keywords)

        # Check if user asks to share generated content
        share_keywords = ["share", "post", "send", "upload"]
        is_sharing = any(keyword in user_message.lower() for keyword in share_keywords)

        # Check if this is a MULTI-STEP request (generate AND share in one command)
        multi_step_indicators = [
            "and share", "and send", "and post", "then share", "then send", "then post",
            "and email", "then email"
        ]
        is_multi_step = any(indicator in user_message.lower() for indicator in multi_step_indicators)

        if needs_generation and is_sharing and not is_multi_step:
            # User wants to share "analysis" - need to check if it exists
            # BUT: Skip this check for multi-step requests where content will be generated first
            content_exists = False

            # Check if assistant recently generated substantial content
            if chat_history:
                for msg in reversed(chat_history[-5:]):
                    if msg.get('role') == 'assistant':
                        content = msg.get('content', '')
                        if len(content) > 200:  # Substantial content
                            content_exists = True
                            break

            # Check if file with analysis exists
            if available_files:
                for file in available_files:
                    file_name = str(file.get('file_name', '')).lower()
                    if any(keyword in file_name for keyword in generation_keywords):
                        content_exists = True
                        break

            if not content_exists:
                # Only block if it's NOT a creation request
                creation_verbs = ["get", "fetch", "create", "generate", "find", "search"]
                is_creating = any(verb in user_message.lower() for verb in creation_verbs)

                if not is_creating:
                    blocking.append("User requests to share 'analysis' but no analysis has been generated yet")
                    actions.append("GENERATE_FIRST: Create the analysis/summary/report BEFORE sharing it")
                else:
                    # It's a multi-step task - just warn
                    warnings.append("Multi-step task detected: Will generate content first, then share")

        # Check for "this" or "it" without clear referent
        vague_refs = ["this", "it", "that"]
        has_vague_ref = any(ref in user_message.lower() for ref in vague_refs)

        if has_vague_ref and is_sharing:
            if intent.content_reference == "unresolved_reference":
                warnings.append("Vague reference ('this'/'it') detected. Will infer from context.")
                actions.append("RESOLVE_REFERENCE: Use most recent content or file")

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _validate_tool_availability(
        self,
        intent: IntentResolution,
        connected_apps: List[str],
        agent_tools: List[str],
        user_message: str
    ) -> Dict[str, List[str]]:
        """Validates required tools are available."""
        blocking = []
        warnings = []
        actions = []

        # Check platform-specific tool requirements
        if intent.platform:
            platform = intent.platform.upper()

            # Special case: Email with attachment requires specific action
            if platform in ["GMAIL", "OUTLOOK"] and "attach" in user_message.lower():
                # Need attachment-capable tool
                warnings.append(f"Email with attachment requested. Ensure SEND_EMAIL_WITH_ATTACHMENT tool is selected.")
                actions.append("SELECT_TOOL: Use GMAIL_SEND_EMAIL_WITH_ATTACHMENT instead of basic SEND_EMAIL")

            # Special case: Google Drive file sharing requires download first
            if platform in ["GOOGLEDRIVE"] and intent.action in ["send", "share"]:
                warnings.append("Sharing Drive file requires download + attach workflow")
                actions.append("MULTI_STEP: 1) DOWNLOAD_FILE from Drive, 2) SEND with attachment")

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _validate_data_requirements(
        self, intent: IntentResolution, agent_tools: List[str], user_message: str
    ) -> Dict[str, List[str]]:
        """Validates real-time data requirements."""
        blocking = []
        warnings = []
        actions = []

        # Check if message requires real-time data
        realtime_keywords = ["current", "today", "now", "latest", "stock", "price", "market"]
        needs_realtime = any(keyword in user_message.lower() for keyword in realtime_keywords)

        if needs_realtime:
            # Check for appropriate search tool
            has_finance_tool = "yahoo_finance" in agent_tools
            has_web_search = "web_search" in agent_tools
            has_any_search = has_finance_tool or has_web_search

            if not has_any_search:
                blocking.append("Real-time data requested but no search tools available (Yahoo Finance, Web Search)")
                actions.append("ENABLE_TOOL: Connect Yahoo Finance or Web Search tool")
            else:
                # Has search tool - must use it
                if "stock" in user_message.lower() or "ticker" in user_message.lower():
                    if has_finance_tool:
                        actions.append("USE_TOOL: Query Yahoo Finance for current stock data")
                    else:
                        actions.append("USE_TOOL: Search web for current stock data")
                else:
                    actions.append("USE_TOOL: Search web for current information")

        # Check for "yesterday's" stock data
        if "yesterday" in user_message.lower() and any(word in user_message.lower() for word in ["stock", "price", "market"]):
            if not (agent_tools and ("yahoo_finance" in agent_tools or "web_search" in agent_tools)):
                blocking.append("Historical stock data requested but no data tools available")
                actions.append("ENABLE_TOOL: Connect Yahoo Finance tool for historical data")

        return {"blocking": blocking, "warnings": warnings, "actions": actions}

    def _build_validation_summary(
        self,
        passed: bool,
        blocking_issues: List[str],
        warnings: List[str],
        required_actions: List[str]
    ) -> str:
        """Builds human-readable validation summary."""
        if passed:
            if warnings:
                return f"✅ VALIDATION PASSED (with {len(warnings)} warnings). Proceed with execution."
            else:
                return "✅ VALIDATION PASSED. All requirements met. Proceed with execution."
        else:
            blocking_summary = "; ".join(blocking_issues[:2])  # First 2 issues
            return f"❌ VALIDATION FAILED: {blocking_summary}. Cannot execute until resolved."

    def get_execution_strategy(self, validation: ValidationResult) -> Dict[str, Any]:
        """
        Generates execution strategy based on validation results.
        Returns step-by-step plan for agent to follow.
        """
        if not validation.passed:
            return {
                "status": "blocked",
                "reason": validation.blocking_issues[0] if validation.blocking_issues else "Unknown",
                "steps": validation.required_actions,
                "message": "Cannot execute. Resolve blocking issues first."
            }

        # Validation passed - create execution strategy
        steps = []

        # Add required actions as pre-execution steps
        for action in validation.required_actions:
            if "SEARCH" in action or "USE_TOOL" in action:
                steps.append(action)
            elif "DOWNLOAD" in action:
                steps.append(action)
            elif "RESOLVE" in action:
                steps.append(action)

        # Add main execution step
        steps.append("EXECUTE: Run main action with validated parameters")

        return {
            "status": "ready",
            "confidence": validation.confidence,
            "steps": steps,
            "warnings": validation.warnings,
            "message": "Ready to execute. Follow steps in order."
        }


# Singleton instance
_validator = None

def get_validator() -> PreExecutionValidator:
    """Returns singleton instance of PreExecutionValidator."""
    global _validator
    if _validator is None:
        _validator = PreExecutionValidator()
    return _validator
