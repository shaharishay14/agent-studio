"""
Context Injection Manager
-------------------------
Orchestrates the injection of all contextual information into agent prompts.
Combines system context (date, user) with app-specific guidance and agent tools guidance.

ENHANCED with:
- Conversation memory (recent topics, platforms, files, actions)
- Intent resolution patterns (vague language mapping)
- Data resolution rules (real-time data, date calculation, stock market calendar)
"""

import datetime
from typing import List, Dict, Any, Optional
from collections import Counter
from .app_context_library import get_contexts_for_connected_apps
from .agent_tools_context_library import get_contexts_for_agent_tools


class ContextInjectionManager:
    """
    Manages the complete context injection pipeline for agents.
    Combines system-level context with application-specific guidance.
    """

    def __init__(self):
        """Initialize the context manager"""
        pass

    def build_complete_context(
        self,
        user,
        agent_model,
        connected_apps: List[str] = None,
        agent_tools: List[str] = None,
        chat_history: List[Dict[str, str]] = None,
        user_message: str = None,
        include_app_guidance: bool = True,
        include_agent_tools_guidance: bool = True,
        **kwargs
    ) -> str:
        """
        Build the complete context string to inject into agent prompt.

        Args:
            user: Django user instance
            agent_model: Agent model instance
            connected_apps: List of connected app names (e.g., ["GMAIL", "SLACK"])
            agent_tools: List of agent tool names (e.g., ["weather", "calculator", "yahoo_finance"])
            chat_history: Recent conversation messages
            user_message: Current user message
            include_app_guidance: Whether to include Composio app-specific guidance
            include_agent_tools_guidance: Whether to include agent tools guidance
            **kwargs: Additional parameters

        Returns:
            Complete formatted context string
        """
        context_parts = []

        # 1. System Context (Date, Time, User Identity)
        system_context = self._build_system_context(user)
        if system_context:
            context_parts.append(system_context)

        # 2. Conversation Memory Context (NEW - recent topics, platforms, files, actions)
        if chat_history or user_message:
            conversation_memory = self._build_conversation_memory_context(
                chat_history or [], user_message
            )
            if conversation_memory:
                context_parts.append(conversation_memory)

        # 3. Intent Resolution Patterns (NEW - vague language mapping)
        intent_patterns = self._build_intent_resolution_patterns()
        if intent_patterns:
            context_parts.append(intent_patterns)

        # 4. Data Resolution Rules (NEW - real-time data, dates, stock market)
        data_rules = self._build_data_resolution_rules(agent_tools or [])
        if data_rules:
            context_parts.append(data_rules)

        # 5. Operational Rules (Tool Usage, Autonomy)
        operational_rules = self._build_operational_rules()
        if operational_rules:
            context_parts.append(operational_rules)

        # 6. App-Specific Guidance (Composio connected apps)
        if include_app_guidance and connected_apps:
            app_context = get_contexts_for_connected_apps(connected_apps)
            if app_context:
                context_parts.append(app_context)

        # 7. Agent Tools Guidance (weather, calculator, yahoo_finance, etc.)
        if include_agent_tools_guidance and agent_tools:
            agent_tools_context = get_contexts_for_agent_tools(agent_tools)
            if agent_tools_context:
                context_parts.append(agent_tools_context)

        # 8. Additional Custom Context
        custom_context = kwargs.get('custom_context')
        if custom_context:
            context_parts.append(custom_context)

        if not context_parts:
            return ""

        return "\n".join(context_parts)

    def _build_system_context(self, user) -> str:
        """Build system-level context (date, time, user identity)"""
        now = datetime.datetime.now()
        current_time = now.strftime("%A, %B %d, %Y at %I:%M %p")
        current_date_short = now.strftime("%Y-%m-%d")
        day_of_week = now.strftime("%A")
        current_year = now.year

        # Build user identity string
        user_info_parts = [f"User ID: {user.id}"]

        if hasattr(user, 'username') and user.username:
            user_info_parts.append(f"Username: {user.username}")
        if hasattr(user, 'email') and user.email:
            user_info_parts.append(f"Email: {user.email}")
        if hasattr(user, 'first_name') and user.first_name:
            name = user.first_name
            if hasattr(user, 'last_name') and user.last_name:
                name += f" {user.last_name}"
            user_info_parts.append(f"Name: {name}")

        user_context = ", ".join(user_info_parts)

        return f"""
{'='*80}
🌍 SYSTEM CONTEXT
{'='*80}

📅 **CURRENT DATE & TIME**
• Full Date/Time: {current_time}
• ISO Date: {current_date_short}
• Day of Week: {day_of_week}
• Year: {current_year}
• ⚠️  IMPORTANT: When user mentions "today", "current", "latest", "now", or "this year", use these values!

👤 **USER IDENTITY**
• {user_context}
• 🔐 Authentication: You are already authenticated as this user for ALL connected services.
• ⚠️  NEVER ask the user for their account credentials, usernames, handles, or IDs.
• You have full authorized access to perform actions on their behalf.

{'='*80}
"""

    def _build_operational_rules(self) -> str:
        """Build operational and behavioral rules for the agent"""
        return """
🤖 OPERATIONAL RULES & BEST PRACTICES
{'='*80}

**1. AUTONOMOUS EXECUTION**
• Execute actions immediately without asking for permission.
• Don't ask "Would you like me to..." or "Should I..." - just do it.
• Only ask for clarification if CRITICAL information is missing (e.g., recipient email address, file name).
• **FOR CONTENT CREATION (posts, emails, documents):**
  • If content details are provided → Create and post/send immediately
  • If content is vague/missing → Draft it first, show to user, then ask for confirmation
  • ❌ NEVER draft multiple times - if you drafted it once, use that draft
  • ✅ Example: "Create a Twitter post about our product" → Draft once, get approval, post
• After completion, provide a brief confirmation of what was done.

**2. TOOL USAGE vs TEXT SIMULATION - CRITICAL RULE**
• ⚠️  CRITICAL: When you have a tool available, you MUST USE IT. NEVER just say you will do it.
• ❌ NEVER write: "I'll send an email to..." or "Here's what I would post..." or "I will share this on Twitter"
• ❌ NEVER claim completion without actually calling the tool and seeing a success response
• ✅ ALWAYS: Actually call the tool FIRST, wait for the response, THEN report what happened
• **YOU CANNOT POST/SEND/CREATE ANYTHING WITHOUT CALLING A TOOL**
• If you don't see a tool being called in your response, YOU DID NOT DO THE ACTION
• Example:
  • User: "Send email to john@example.com saying hello"
  • ❌ Wrong: "I'll send an email to john@example.com with the message 'Hello'"
  • ❌ Wrong: "Here's the email I'll send: [content]. I'll share this now!"
  • ✅ Correct: [Calls GMAIL_SEND_EMAIL] → "✅ Email sent successfully to john@example.com"
• Example 2:
  • User: "Post this to Twitter"
  • ❌ Wrong: "Here's the post: [content]. I'll share this on Twitter!"
  • ❌ Wrong: "I created this tweet and will post it now!"
  • ✅ Correct: [Calls TWITTER_CREATION_OF_A_POST] → "✅ Posted to Twitter successfully!"

**3. FILE HANDLING - CRITICAL RULE FOR ATTACHMENTS**
• ⚠️  CRITICAL: When you see "📎 **File Available:**" in the message, you MUST use that file.
• The file path is shown in a code block after "🔧 **For tool calls:**"
• **EXTRACT THE EXACT PATH** from the code block and use it as the tool parameter.
• ❌ NEVER say "there's an issue with the file path" - the path is ALWAYS valid
• ❌ NEVER say "please check the file path" - just USE the path shown
• ❌ NEVER say "unfortunately there was an issue with the image upload" - CALL THE TOOL FIRST

**TWITTER IMAGE/VIDEO POSTING - EXACT WORKFLOW:**
When user wants to post an image/video to Twitter:
1. FIRST: Call TWITTER_UPLOAD_MEDIA
   • Parameter: file="/tmp/files_abc/image.png" (exact path from code block)
   • Returns: {"data": {"media_id_string": "1234567890"}}
2. SECOND: Call TWITTER_CREATION_OF_A_POST
   • Parameters: {
       "text": "Your tweet text here",
       "media_media_ids": ["1234567890"]  ← Use the media_id from step 1
     }
3. DONE: Report success with tweet link

**CRITICAL - WHAT NOT TO DO:**
• ❌ DO NOT skip TWITTER_UPLOAD_MEDIA and go straight to post creation
• ❌ DO NOT say "there was an issue" without calling the tools first
• ❌ DO NOT try to pass file path in media_media_ids (it expects media IDs, not paths)

**Example of CORRECT execution:**
User: "Post this image to Twitter with the text 'Check this out!'"
File: /tmp/files_xyz/photo.jpg

✅ CORRECT:
Step 1: Call TWITTER_UPLOAD_MEDIA(file="/tmp/files_xyz/photo.jpg")
        → Get media_id: "1455952740635586573"
Step 2: Call TWITTER_CREATION_OF_A_POST(text="Check this out!", media_media_ids=["1455952740635586573"])
        → Success!

❌ WRONG:
"Unfortunately, there was an issue with the image upload. Please check the file path."
(This is WRONG because you never called the tools!)

**4. ALWAYS RETRY TOOLS - IGNORE PAST FAILURES**
• ⚠️  CRITICAL: If a tool failed in the past conversation, you MUST try it again when requested.
• DO NOT assume a tool doesn't work based on previous errors in the chat history.
• Previous failures may have been due to:
  • Temporary API issues (now resolved)
  • Missing permissions (now granted)
  • Configuration issues (now fixed)
  • Network problems (now working)
• **ALWAYS attempt to use the tool** - let the CURRENT execution determine success/failure.
• Examples:
  • ❌ WRONG: "I can't post to Twitter because it didn't work before"
  • ❌ WRONG: "Based on the previous error, I don't have access to Twitter"
  • ✅ CORRECT: [Calls TWITTER_CREATION_OF_A_POST and waits for response]
  • If it fails NOW → Show the exact current error
  • If it succeeds NOW → Great! Report success
• The user may have fixed the issue - always give tools a fresh chance.

**5. VERIFICATION & IDEMPOTENCY**
• **Calendar Events**: Search for existing events BEFORE creating new ones (avoid duplicates).
• **Email/Messages**: After sending, assume success unless you get an error. Don't retry blindly.
• **Social Posts**: After posting, verify success. Never retry without confirmation (duplicate posts are bad UX).
• **File Operations**: Check if files exist before uploading to avoid duplicates.

**6. MULTI-STEP WORKFLOWS**
• Some tasks require multiple steps - execute them in sequence:
  • Example: "Email this Drive file" → Find file → Download → Attach → Send
  • Example: "Schedule meeting" → Check calendar for conflicts → Create event → Confirm
• Complete all steps without asking for approval between each step.

**6. ERROR HANDLING - CRITICAL: QUOTE EXACT ERRORS**
• When a tool fails, you MUST copy the exact error text from the tool response.
• ❌ NEVER say "permissions issue", "account restricted", "something went wrong"
• ✅ ALWAYS use this format: "Twitter API error: '[paste exact error here]'"
• Include the full error message verbatim, even if it's long or technical.
• Don't summarize, don't paraphrase, don't interpret - COPY THE EXACT ERROR TEXT.
• If you see an error in the tool response, wrap it in quotes and show it to the user.
• Examples:
  • ❌ WRONG: "I'm unable to post due to a permissions issue"
  • ❌ WRONG: "Your account is restricted"
  • ✅ CORRECT: "Twitter API error: '403 Forbidden - Write access is not allowed for this connection'"
  • ✅ CORRECT: "Error from TWITTER_CREATION_OF_A_POST: 'User authentication token has expired'"
• After showing the exact error, you can add: "This means [explanation]. Please check your account."

**7. CURRENT/LIVE DATA**
• If user asks for "current stock prices", "latest news", "today's weather", you need real-time data.
• Use web search tools if available, or explain you need a search tool for live data.
• Don't hallucinate or provide outdated information from your training data.

**8. FILE HANDLING**
• **File Attachments**: When files are attached, their content is automatically extracted and provided as preview.
• **Text Files**: PDFs, DOCX, TXT, and code files are extracted for you to read directly.
• **Using Files**:
  • For sending/uploading: Use the file path provided (e.g., GMAIL_SEND_EMAIL_WITH_ATTACHMENT)
  • For referencing content: You can see the extracted text preview in the file context
  • For analysis: Read the preview to understand the content before taking action
• **File Workflows**:
  • "Send this file via email" → Use GMAIL_SEND_EMAIL_WITH_ATTACHMENT with the file path
  • "Upload this to Drive" → Use GOOGLEDRIVE_CREATE_FILE with the file path
  • "Summarize this document" → Read the extracted text preview and provide summary
  • "Post this image to Instagram" → Use INSTAGRAM_CREATE_POST with the image file path
• **Best Practice**: Always acknowledge the file in your response (e.g., "I've sent report.pdf to john@example.com")

{'='*80}
"""

    def _build_conversation_memory_context(
        self, chat_history: List[Dict[str, str]], current_message: Optional[str]
    ) -> str:
        """
        Build conversation memory context from recent chat history.
        Extracts recent topics, platforms mentioned, files discussed, and actions taken.
        """
        if not chat_history and not current_message:
            return ""

        # Extract information
        recent_topics = self._extract_recent_topics(chat_history, current_message or "")
        recent_platforms = self._extract_recent_platforms(chat_history, current_message or "")
        recent_files = self._extract_recent_files(chat_history)
        recent_actions = self._extract_recent_actions(chat_history)
        last_assistant_action = self._extract_last_assistant_action(chat_history)

        # Build context string
        memory_parts = []

        if recent_topics:
            topics_str = ", ".join(recent_topics[:5])
            memory_parts.append(f"• Recent Topics: {topics_str}")

        if recent_platforms:
            platforms_str = ", ".join([f"{p[0]} ({p[1]}x)" for p in recent_platforms[:3]])
            memory_parts.append(f"• Platforms Used: {platforms_str}")

        if recent_files:
            files_str = ", ".join(recent_files[:3])
            if len(recent_files) > 3:
                files_str += f" (+ {len(recent_files) - 3} more)"
            memory_parts.append(f"• Recent Files: {files_str}")

        if recent_actions:
            actions_str = ", ".join(recent_actions[:3])
            memory_parts.append(f"• Recent Actions: {actions_str}")

        if last_assistant_action:
            memory_parts.append(f"• Last Action: {last_assistant_action}")

        if not memory_parts:
            return ""

        return f"""
💭 CONVERSATION MEMORY
{'='*80}
{chr(10).join(memory_parts)}

⚠️  USE THIS CONTEXT: When user says "this", "it", "that", or mentions a platform without full context,
   refer to the above memory to understand what they're referencing.

{'='*80}
"""

    def _build_intent_resolution_patterns(self) -> str:
        """
        Build intent resolution patterns for vague language mapping.
        Helps agent understand slang and ambiguous references.
        """
        return """
🧠 INTENT RESOLUTION PATTERNS
{'='*80}

**VAGUE LANGUAGE MAPPING**

When user says vague verbs, map them to concrete actions:

• "launch" / "drop" / "blast" / "fire" / "release"
  → Interpret as: POST (to social media) or SEND (to messaging/email)
  → Check conversation memory and connected apps to determine platform
  → If unclear, prioritize most recently used platform

• "share" / "push" / "throw" / "toss"
  → Interpret as: POST or SEND or UPLOAD (depending on context)
  → Look for platform hints in conversation
  → If no platform mentioned: infer from connected apps and recent actions

• "this" / "it" / "that" / "the file" / "the doc"
  → Refer to: Most recent file attachment OR content just generated OR topic being discussed
  → Check conversation memory for recent files
  → If assistant just generated substantial content (>200 chars), "this" refers to that content

• "yesterday" / "last week" / "previous" / "earlier"
  → MUST calculate exact date based on current system date
  → For stock/market queries: Adjust to last business day if falls on weekend
  → Never guess or use outdated training data

**AUTONOMOUS DECISION PROTOCOL**

1. **Analyze Context**: Use conversation memory + connected apps + recent actions
2. **Make Decision**: Choose most likely interpretation based on evidence
3. **Execute Immediately**: Don't ask for clarification unless TRULY ambiguous (e.g., "send to" with no recipient)
4. **Confirm After**: Brief confirmation of what action was taken

**EXAMPLES**

User: "launch this to twitter"
→ Action: POST | Platform: TWITTER | Content: Most recent file or generated content | Confidence: HIGH ✅

User: "share about Amazon stock yesterday's analysis"
→ Action: POST or SEND | Platform: Infer from connected apps | Content: Must SEARCH for Amazon stock data for calculated 'yesterday' date first | Confidence: MEDIUM ⚠️

User: "drop the report"
→ Action: POST or SEND | Platform: Check recent platforms | Content: File named 'report' or recent file | Confidence: MEDIUM ⚠️

{'='*80}
"""

    def _build_data_resolution_rules(self, agent_tools: List[str]) -> str:
        """
        Build data resolution rules for real-time data and date calculations.
        Ensures agent uses search tools instead of hallucinating.
        """
        # Check which tools are available
        has_yahoo_finance = "yahoo_finance" in agent_tools
        has_web_search = "web_search" in agent_tools
        has_weather = "weather" in agent_tools

        search_tool_guidance = ""
        if has_yahoo_finance:
            search_tool_guidance += "\n  • Yahoo Finance tool is AVAILABLE → Use for stock/market data"
        if has_web_search:
            search_tool_guidance += "\n  • Web Search tool is AVAILABLE → Use for general current information"
        if has_weather:
            search_tool_guidance += "\n  • Weather tool is AVAILABLE → Use for weather queries"

        if not search_tool_guidance:
            search_tool_guidance = "\n  • ⚠️  NO SEARCH TOOLS AVAILABLE → Inform user you cannot fetch real-time data"

        return f"""
🔍 DATA RESOLUTION RULES
{{'='*80}}

**REAL-TIME DATA REQUIREMENTS**

⚠️  CRITICAL: If user asks for "current", "today", "latest", "now" data, you MUST use search tools.
❌ NEVER use your training data (knowledge cutoff: January 2025) for current events/prices/data.

**AUTO-SEARCH TRIGGERS:**

• **Stock/Market Data**: "current price", "stock analysis", "ticker", "market"
  → MUST search for current data using available tools
  → Calculate date for "yesterday's close" using system date
  → Adjust to last business day if weekend (Saturday → Friday, Sunday → Friday)

• **News/Events**: "latest news", "today's headlines", "current events"
  → MUST use web search for up-to-date information

• **Weather**: "today's weather", "forecast", "temperature"
  → Use weather tool if available, otherwise web search

• **General "Current" Queries**: Any query with "current", "today", "now", "latest"
  → Default to web search for accurate information

**AVAILABLE TOOLS:**{search_tool_guidance}

**DATE CALCULATION PROTOCOL:**

1. **Extract Date Reference**: "yesterday", "last week", "previous day", "ago"
2. **Calculate Exact Date**: Use current system date (provided above) to compute target date
3. **Business Day Adjustment** (for stocks/markets):
   • If target date is Saturday (weekday=5): Use Friday (date - 1 day)
   • If target date is Sunday (weekday=6): Use Friday (date - 2 days)
4. **Use Calculated Date**: Pass exact date to search tools
5. **Never Guess**: If you can't calculate the date, ask the user for clarification

**EXAMPLES**

User: "What's Amazon stock price today?"
→ ACTION: Use Yahoo Finance or Web Search to get CURRENT Amazon (AMZN) stock price
→ DO NOT use training data from 2024 or earlier

User: "Share about Amazon stock yesterday's analysis"
→ STEP 1: Calculate yesterday's date (system date - 1 day, adjust if weekend)
→ STEP 2: Search for Amazon stock data for that specific date
→ STEP 3: Generate analysis from search results
→ STEP 4: Post/Send to identified platform

User: "What was the weather like last Tuesday?"
→ ACTION: Calculate date for last Tuesday, then use weather tool or web search
→ DO NOT hallucinate weather data

{{'='*80}}
"""

    # Helper methods for conversation memory extraction

    def _extract_recent_topics(self, chat_history: List[Dict], current_message: str) -> List[str]:
        """Extract key topics from conversation"""
        topic_keywords = [
            "stock", "weather", "email", "calendar", "meeting", "post", "tweet",
            "twitter", "analysis", "report", "summary", "file", "document",
            "upload", "download", "schedule", "send", "share"
        ]

        topics = []
        all_text = current_message.lower()

        # Add from history
        for msg in chat_history[-5:]:  # Last 5 messages
            all_text += " " + msg.get('content', '').lower()

        # Extract topics
        for keyword in topic_keywords:
            if keyword in all_text and keyword not in topics:
                topics.append(keyword)

        return topics[:5]

    def _extract_recent_platforms(self, chat_history: List[Dict], current_message: str) -> List[tuple]:
        """Extract platforms mentioned and their frequency"""
        platform_keywords = {
            "twitter": "TWITTER",
            "tweet": "TWITTER",
            "gmail": "GMAIL",
            "email": "GMAIL",
            "slack": "SLACK",
            "calendar": "GOOGLECALENDAR",
            "drive": "GOOGLEDRIVE",
        }

        platform_counts = Counter()
        all_text = current_message.lower()

        for msg in chat_history[-5:]:
            all_text += " " + msg.get('content', '').lower()

        for keyword, platform in platform_keywords.items():
            if keyword in all_text:
                # Count occurrences
                platform_counts[platform] += all_text.count(keyword)

        # Return as (platform, count) tuples
        return platform_counts.most_common(3)

    def _extract_recent_files(self, chat_history: List[Dict]) -> List[str]:
        """Extract file names mentioned in conversation"""
        files = []
        file_extensions = ['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.jpg', '.png']

        for msg in chat_history[-5:]:
            content = msg.get('content', '')
            # Look for file names (basic pattern matching)
            for ext in file_extensions:
                if ext in content.lower():
                    # Extract filename (simple approach)
                    words = content.split()
                    for word in words:
                        if ext in word.lower() and word not in files:
                            files.append(word.strip('.,!?"'))

        return files[:3]

    def _extract_recent_actions(self, chat_history: List[Dict]) -> List[str]:
        """Extract actions taken in conversation"""
        action_keywords = ["sent", "posted", "created", "scheduled", "uploaded", "downloaded", "shared"]
        actions = []

        for msg in chat_history[-3:]:  # Last 3 messages
            if msg.get('role') == 'assistant':
                content = msg.get('content', '').lower()
                for keyword in action_keywords:
                    if keyword in content:
                        # Try to extract action phrase
                        if keyword + " to" in content:
                            actions.append(keyword + " to [platform]")
                        elif keyword + " email" in content:
                            actions.append(keyword + " email")
                        elif keyword:
                            actions.append(keyword)
                        break  # One action per message

        return list(set(actions))[:3]

    def _extract_last_assistant_action(self, chat_history: List[Dict]) -> Optional[str]:
        """Extract the last action the assistant took"""
        for msg in reversed(chat_history[-5:]):
            if msg.get('role') == 'assistant':
                content = msg.get('content', '')
                # Look for action indicators
                action_verbs = ["sent", "posted", "created", "scheduled", "uploaded", "shared"]
                for verb in action_verbs:
                    if verb in content.lower():
                        # Extract a brief summary (first 80 chars)
                        return content[:80] + ("..." if len(content) > 80 else "")
        return None


# Global instance for easy access
_context_manager_instance = None


def get_context_manager() -> ContextInjectionManager:
    """Get or create the global context manager instance"""
    global _context_manager_instance
    if _context_manager_instance is None:
        _context_manager_instance = ContextInjectionManager()
    return _context_manager_instance
