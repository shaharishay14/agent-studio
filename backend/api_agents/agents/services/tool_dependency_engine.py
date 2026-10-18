"""
Tool Dependency Engine
----------------------
Manages tool dependencies and ensures required tools are included.
Solves the "missing dependency tool" problem (e.g., Gmail + Drive needs Download).
"""

from typing import List, Set, Dict


class ToolDependencyEngine:
    """
    Engine that enforces tool dependency rules.
    When certain tools are selected, automatically includes required dependencies.
    """

    def __init__(self):
        """Initialize with dependency rules"""
        self.dependency_rules = self._build_dependency_rules()

    def _build_dependency_rules(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Build dependency rules for tool combinations.

        Structure:
        {
            "condition": "when these apps/patterns are present",
            "rules": [
                {
                    "if": "pattern to match",
                    "then_add": ["tools to add"]
                }
            ]
        }
        """
        return {
            # === GMAIL + DRIVE INTEGRATION ===
            "gmail_drive_attachment": {
                "description": "When Gmail and Drive are both present, ensure file operations are available",
                "apps": ["GMAIL", "GOOGLEDRIVE"],
                "ensure_tools": [
                    "GOOGLEDRIVE_FIND_FILE",
                    "GOOGLEDRIVE_DOWNLOAD_FILE",
                    "GOOGLEDRIVE_GET_FILE_LINK",
                    "GMAIL_SEND_EMAIL_WITH_ATTACHMENT"
                ]
            },

            # === CALENDAR OPERATIONS ===
            "calendar_idempotency": {
                "description": "When Calendar is used, ensure search/find tools for duplicate checking",
                "apps": ["GOOGLECALENDAR"],
                "ensure_tools": [
                    "GOOGLECALENDAR_FIND_EVENT",
                    "GOOGLECALENDAR_LIST_EVENTS"
                ]
            },

            # === SLACK + DRIVE INTEGRATION ===
            "slack_drive_sharing": {
                "description": "When Slack and Drive are both present, ensure file operations",
                "apps": ["SLACK", "GOOGLEDRIVE"],
                "ensure_tools": [
                    "GOOGLEDRIVE_FIND_FILE",
                    "GOOGLEDRIVE_DOWNLOAD_FILE",
                    "SLACK_UPLOAD_FILE"
                ]
            },

            # === EMAIL SYSTEMS + ANY FILE STORAGE ===
            "email_file_integration": {
                "description": "When Gmail/Outlook and any file storage are present",
                "apps": [["GMAIL", "OUTLOOK"], ["GOOGLEDRIVE", "DROPBOX", "ONEDRIVE"]],
                "ensure_tools": []  # Will be dynamically determined
            },

            # === SOCIAL MEDIA + DRIVE ===
            "social_media_drive": {
                "description": "When social media and Drive are present, ensure media operations",
                "apps": [["TWITTER", "INSTAGRAM", "FACEBOOK", "LINKEDIN"], ["GOOGLEDRIVE"]],
                "ensure_tools": [
                    "GOOGLEDRIVE_FIND_FILE",
                    "GOOGLEDRIVE_DOWNLOAD_FILE"
                ]
            },

            # === GITHUB FILE OPERATIONS ===
            "github_file_ops": {
                "description": "When GitHub is present, ensure file read/write tools",
                "apps": ["GITHUB"],
                "ensure_tools": [
                    "GITHUB_GET_FILE",
                    "GITHUB_CREATE_OR_UPDATE_FILE"
                ]
            },

            # === NOTION SEARCH ===
            "notion_search": {
                "description": "When Notion is used, ensure search is available",
                "apps": ["NOTION"],
                "ensure_tools": [
                    "NOTION_SEARCH",
                    "NOTION_QUERY_DATABASE"
                ]
            },

            # === SHEETS + DRIVE ===
            "sheets_drive": {
                "description": "When Sheets is used, ensure Drive operations for sharing",
                "apps": ["GOOGLESHEETS"],
                "ensure_tools": [
                    "GOOGLEDRIVE_GET_FILE_LINK",
                    "GOOGLEDRIVE_SHARE_FILE"
                ]
            },

            # === ZOOM + CALENDAR ===
            "zoom_calendar_integration": {
                "description": "When Zoom and Calendar are both present, enable scheduling integration",
                "apps": ["ZOOM", "GOOGLECALENDAR"],
                "ensure_tools": [
                    "ZOOM_CREATE_MEETING",
                    "GOOGLECALENDAR_CREATE_EVENT"
                ]
            }
        }

    def enforce_dependencies(
        self,
        selected_tools: List[str],
        connected_apps: List[str]
    ) -> List[str]:
        """
        Enforce tool dependencies based on selected tools and connected apps.

        IMPORTANT: Only adds dependency tools when the original selected_tools
        are non-empty. This prevents adding irrelevant tools when AI returns empty.

        Args:
            selected_tools: List of tool slugs already selected
            connected_apps: List of connected app names (e.g., ["GMAIL", "GOOGLEDRIVE"])

        Returns:
            Enhanced list of tool slugs with dependencies added
        """
        tools_set = set(selected_tools)
        apps_set = set(app.upper() for app in connected_apps)

        print(f"🔍 Enforcing dependencies for {len(tools_set)} tools across {len(apps_set)} apps")

        # === FIX: Only enforce dependencies if tools were actually selected ===
        # If AI returned empty tools [], don't add any dependencies
        # This prevents Calendar tools being added for stock queries
        if not selected_tools:
            print(f"  ⏭️  No tools selected by AI - skipping dependency enforcement")
            return []

        # Check each dependency rule
        for rule_name, rule in self.dependency_rules.items():
            if self._rule_applies(rule, apps_set, tools_set):
                # Add required tools
                added_count = 0
                for tool in rule.get("ensure_tools", []):
                    if tool not in tools_set:
                        tools_set.add(tool)
                        added_count += 1

                if added_count > 0:
                    print(f"  ✅ Applied rule '{rule_name}': added {added_count} dependency tool(s)")

        final_tools = list(tools_set)
        added_tools = len(final_tools) - len(selected_tools)

        if added_tools > 0:
            print(f"📦 Dependency enforcement: {len(selected_tools)} → {len(final_tools)} tools (+{added_tools})")

        return final_tools

    def _rule_applies(
        self,
        rule: Dict,
        connected_apps: Set[str],
        selected_tools: Set[str]
    ) -> bool:
        """Check if a dependency rule applies to current context"""
        rule_apps = rule.get("apps", [])

        # Handle simple app list: ["GMAIL", "GOOGLEDRIVE"]
        if isinstance(rule_apps, list) and all(isinstance(app, str) for app in rule_apps):
            # All apps in the rule must be present
            return all(app.upper() in connected_apps for app in rule_apps)

        # Handle OR conditions: [["GMAIL", "OUTLOOK"], ["DRIVE", "DROPBOX"]]
        elif isinstance(rule_apps, list) and any(isinstance(group, list) for group in rule_apps):
            # At least one app from each group must be present
            for group in rule_apps:
                if isinstance(group, list):
                    if not any(app.upper() in connected_apps for app in group):
                        return False
                else:
                    if group.upper() not in connected_apps:
                        return False
            return True

        return False


# Global instance
_tool_dependency_engine_instance = None


def get_tool_dependency_engine() -> ToolDependencyEngine:
    """Get or create the global tool dependency engine instance"""
    global _tool_dependency_engine_instance
    if _tool_dependency_engine_instance is None:
        _tool_dependency_engine_instance = ToolDependencyEngine()
    return _tool_dependency_engine_instance
