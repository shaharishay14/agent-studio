"""
Application Context Library
---------------------------
Provides expert-level guidance for each integrated application.
Each function returns concise, actionable context about how to use that app effectively.

Design Principles:
- Token-efficient (150-300 tokens per app)
- Action-oriented (what to DO, not just what the app is)
- Covers common workflows and pitfalls
- Includes dependency chains (e.g., Download before Attach)
"""

import datetime
from typing import Dict, Callable


def get_gmail_context() -> str:
    """Gmail - Email management automation specialist"""
    return """
📧 **GMAIL AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF THREADING:**
In Gmail, context is king.
• message_id: Identifies SINGLE email (for deleting, labels, fetching content)
• thread_id: Identifies CONVERSATION (chain of emails)
• CRITICAL: When replying, you need thread_id of the conversation, not just message_id

**SENDING & REPLYING WORKFLOWS:**
• New Cold Email: Use Send Email (requires: recipient, subject, body)
• Drafting for Review: Use Create email draft (safer when user doesn't say "send")
• Replying to Thread: Use Reply to email thread (requires: thread_id, recipient)
• PRO-TIP: When drafting reply, LEAVE SUBJECT EMPTY or Gmail breaks the thread

**INBOX MANAGEMENT (Labels not Folders):**
• "Move to Folder X" = Add Label X + Remove Label 'INBOX'
• Tool: Modify email labels
• Bulk Operations: Use Batch delete/modify (don't loop one by one)

**SEARCH OPERATORS (Critical for Fetch emails):**
• From user: q="from:jane@example.com"
• Unread only: q="is:unread"
• Time-based: q="after:2024/01/01 before:2024/02/01"
• Has attachment: q="has:attachment"
• Get full context: Use thread_id to fetch entire conversation history

**PARAMETER RULES:**
• user_id: Default to 'me' unless managing delegated account
• is_html: Set True if body contains <br>, <b>, <ul> tags
• Pagination: Warn users when searching "all emails from 2020" (multiple steps needed)

**ERROR HANDLING:**
• Invalid email: Ask user to verify recipient address
• Thread not found: May be deleted - send new email with same subject
• Attachment errors: Verify s3key is valid and file was uploaded

**EXAMPLE WORKFLOW:**
User: "Draft reply to Client X about Budget"
1. Fetch emails q="from:Client X subject:Budget" → get thread_id
2. Create email draft with thread_id + recipient + body
3. LEAVE SUBJECT EMPTY to keep in same thread

**ATTACHMENT WORKFLOW:**
User: "Send quarterly report.pdf to boss@company.com"
1. Check if file available (s3key from upload)
2. Send Email with recipient + subject + attachments=[{s3key, name}]
"""


def get_googledrive_context() -> str:
    """Google Drive - File storage and management automation specialist"""
    return """
📁 **GOOGLE DRIVE AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF FILE IDS:**
Environment is ID-based, not Path-based.
• Names are NOT unique: Two files can have same name in same folder
• Paths are illusions: Files exist independently; folders are just "parents"
• PROTOCOL: Search First → Verify → Execute using file_id

**SEARCHING & DISCOVERY (Master the q Query):**
• Standard: q="name = 'Project Alpha'"
• Fuzzy: q="name contains 'Budget'" (safer for imprecise user input)
• Inside folder: q="'[FOLDER_ID]' in parents"
• File type: q="mimeType = 'application/vnd.google-apps.folder'"
• Text search: q="fullText contains 'urgent'" (searches content, not just titles)

**CREATING & UPLOADING:**
• Google Workspace (Docs/Sheets/Slides): Use Create a File from Text
• Upload Files (<5MB): Use Upload File
• Upload Large Files: Use Resumable Upload
• Create Folders: Use Create a folder (find parent_id first if nested)

**ORGANIZATION (Moving Files):**
Moving = Updating Parents (files can have multiple parents)
1. Find folder (target) → get folder_id
2. Find file (target) → get file_id
3. Move File with file_id + folder_id

**SHARING & PERMISSIONS:**
• Share: Use Add file sharing preference
  - Roles: reader (view), commenter, writer (edit)
  - Type: user (specific email), anyone (public link)
• Revoke: Delete Permission (need permission_id via List Permissions)

**MIME TYPES (Critical):**
• Folder: application/vnd.google-apps.folder
• Google Doc: application/vnd.google-apps.document
• Google Sheet: application/vnd.google-apps.spreadsheet
• Export Google Docs: Must specify conversion MIME (pdf/text/docx)

**ERROR HANDLING:**
• File not found: Broaden search (use "contains" vs "=")
• Insufficient permissions: User only has viewer access - inform limitation
• Ambiguous: Multiple files with same name → list with dates, ask user to choose
• Empty Trash: Irreversible - always confirm unless "force delete"

**EXAMPLE WORKFLOW:**
User: "Share 'Quarterly Review' PDF with bob@company.com as editor"
1. Find file q="name = 'Quarterly Review' and mimeType = 'application/pdf'" → file_id
2. Add file sharing preference: file_id + role="writer" + type="user" + email

**LIST FOLDER WORKFLOW:**
User: "List files in Marketing folder"
1. Find folder name="Marketing" → folder_id
2. Find file q="'folder_id' in parents" → list results
"""


def get_googlecalendar_context() -> str:
    """Google Calendar - Event and meeting management automation specialist"""
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    return f"""
📅 **GOOGLE CALENDAR AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF TIME:**
Relative time is poison - "Tomorrow at 2 PM" is meaningless without reference date and timezone.
• ISO 8601 is KING: All API calls require YYYY-MM-DDTHH:MM:SS format
• PROTOCOL:
  1. Contextualize: Fetch current date/time if user uses "tomorrow", "next Tuesday", "in an hour"
  2. Locate: Confirm timezone (default to system timezone or ask)
  3. Calculate: Convert "Tuesday 2 PM" to "2024-10-24T14:00:00" BEFORE calling tools

**TODAY'S DATE: {current_date}** (Use when user says "today" or "tomorrow")

**SCHEDULING (Events):**
• Quick & Dirty: Use Quick Add Event
  - Use case: "Lunch with Bob tomorrow at 1pm" (API handles parsing)
• Precise & Professional: Use Create Event
  - Requirements: start_datetime, event_duration_hour, attendees
  - Use case: "45-min Zoom with client@email.com Monday 10 AM EST"
• Modifying: Use Patch Event (updates ONLY specified fields)
  - Why: Update Google event might wipe fields you didn't re-submit

**AVAILABILITY & CONFLICTS:**
• "Am I free?": Use Find free slots
  - Params: time_min (now), time_max (end of day/week)
• "When are WE free?": Use Query Free/Busy Information
  - Use case: Check multiple calendar_ids (you + colleague)

**SEARCH & RETRIEVAL:**
• Find Events: Use Find event
  - Query: Text search ("Dentist") or time range (timeMin, timeMax)
• List Everything: Use List Events
  - WARNING: Returns lots of data - always bound with time ranges

**PARAMETER RULES:**
• calendar_id: Default to 'primary' unless specific calendar mentioned
• Recurrence Rules (RRULE): Follow iCalendar RFC 5545 (FREQ=DAILY;COUNT=5)
• Attendees: List of objects [{"email": "user@example.com"}]

**ERROR HANDLING:**
• Time range error: Ensure timeMin strictly BEFORE timeMax
• Event not found: Broaden search window or check secondary calendars
• Quota exceeded: Add delay between bulk operations (like clearing calendar)
• CRITICAL: ALWAYS search before creating to avoid duplicates

**EXAMPLE WORKFLOWS:**
User: "Move my 3 PM meeting to 4 PM"
1. Get current date and time → today's date
2. Find event timeMin="TodayT15:00:00" timeMax="TodayT16:00:00" → event_id
3. Patch Event: event_id + start_datetime="TodayT16:00:00" + end_datetime="TodayT17:00:00"

User: "Schedule standup every Monday at 10 AM"
1. Create Event: summary="Standup" + start_datetime="[Next Monday]T10:00:00"
2. recurrence=["RRULE:FREQ=WEEKLY;BYDAY=MO"]

User: "Clear my calendar for rest of day"
1. List Events timeMin=[Now] timeMax=[End of Day]
2. Iterate: Delete event (id: event_1), Delete event (id: event_2)...
"""


def get_slack_context() -> str:
    """Slack - Digital workplace communication specialist"""
    return """
💬 **SLACK COMMUNICATION SPECIALIST**

**THE GOLDEN RULE OF SLACK IDS:**
• Channels (C...): Public channels usually start with C
• Users (U...): Users start with U
• Groups/MPIMs (G...): Private groups or multi-person DMs start with G
• Direct Messages (D...): 1:1 DMs start with D
• Protocol:
  - NEVER guess an ID
  - ALWAYS Find users (by email) or Find channels (by name) first
  - Timestamps (ts): Every message has unique ID called ts (e.g., 1535262.002) - You need this to Reply, React, or Delete

**MESSAGING & COMMUNICATION:**
• Standard Message:
  - Use Send message
  - Params: channel_id, text
• Threaded Reply (Crucial for organization):
  - Use Send message WITH thread_ts
  - Source: You must get parent message's ts from Fetch conversation history
• DMing a User:
  1. Find users (Get user_id)
  2. Open DM (Input user_id) → Returns channel_id (starts with D...)
  3. Send message (Input channel_id)

**CHANNEL MANAGEMENT:**
• Creating Spaces:
  - Use Create channel (public/private)
  - Use Invite users to channel to populate it
• Finding Content:
  - Use Search messages (Query: "budget from:@boss")
  - Use Fetch conversation history to read last X messages in channel

**ADVANCED INTERACTION (BLOCKS & FILES):**
• Rich Text/UI:
  - Send message tool accepts blocks (JSON) - If user asks for "Poll" or "Form," you can construct simple Block Kit JSON (Section + Actions), but standard text is safer if you aren't sure
• Files:
  - Use Upload or create a file in Slack
  - Params: channels (ID), content (Text snippet) or file (Binary)

**PARAMETER CONSTRAINTS & VALIDATION:**
• channel ID: Required for almost all operations - You cannot send message to "#general" (string); you must send it to C12345 (ID)
• ts (Timestamp): Is a string, not float - Keep precision exact (e.g., "1234.5678")
• Presence: Set user presence only accepts "auto" or "away" - You cannot set it to "Busy" or "In a meeting" via this specific tool (use Set Slack Status for text status)

**ERROR HANDLING:**
• "User not in channel": You cannot post to private channel you (the bot) haven't been invited to - Ask user to invite you
• "Channel not found": If Find channels fails, channel might be private
• "Rate Limit": Slack is strict - If you are blasting messages, you will get 429s - Slow down

**DECISION TREE EXAMPLES:**
User Request: "Message Alice asking for the Q3 report"
Reasoning & Execution:
1. Find Alice: Find users (query: "Alice") → Returns U_ALICE
2. Open Channel: Open DM (users: U_ALICE) → Returns D_CHAT_1
3. Send: Send message (channel="D_CHAT_1", text="Hi Alice, do you have the Q3 report?")

User Request: "Summarize the last 10 messages in #general"
Reasoning & Execution:
1. Find Channel: Find channels (name: "general") → Returns C_GENERAL
2. Fetch History: Fetch conversation history (channel="C_GENERAL", limit=10)
3. Process: Read the JSON text and summarize

User Request: "React with a thumbs up to the last message in #random"
Reasoning & Execution:
1. Find Channel: C_RANDOM
2. Get Context: Fetch conversation history (channel: C_RANDOM, limit: 1) → Returns message with ts="162...001"
3. React: Add reaction to message (channel="C_RANDOM", timestamp="162...001", name="thumbsup")
"""


def get_twitter_context() -> str:
    """Twitter/X - Social media automation specialist"""
    return """
🐦 **TWITTER/X AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF IDS:**
Users will say @username, but API tools need NUMERIC USER IDs.
• IF user provides @username and tool requires user_id:
  1. STOP - Do not guess the ID
  2. EXECUTE Twitter lookup user tool to get numeric ID
  3. PROCEED with original request using retrieved ID

**POSTING WORKFLOWS:**
• Standard Tweet: Use create post tool with text
• Reply: Get tweet ID first (via search) → Use create post with reply_to_tweet_id
• Quote Tweet: Use create post with text + quote_tweet_id
• Thread: Create first post → capture ID → create second with reply_to_tweet_id

**MEDIA POSTING (CRITICAL 2-STEP PROCESS):**
❌ WRONG: Cannot send image directly in create post
✅ CORRECT:
  Step 1: Upload media (get media_id)
  Step 2: Create post with media_ids parameter

**SEARCH & MONITORING:**
• Recent (7 days): Use search recent tweets
• Query optimization: "from:username -is:retweet" (cleaner results)
• Monitor user: Get their ID → search "from:username"

**PARAMETER RULES:**
• tweet_id: Must be STRING not number
• media_ids: Must be ARRAY of strings ["123"]
• Always add "-is:retweet" to searches unless specifically requested

**ERROR HANDLING:**
• "Duplicate Content": Modify text slightly
• Username not found: Ask user to verify spelling
• Rate limit: Inform user and suggest wait time

**EXAMPLE WORKFLOW:**
User: "Reply to @TechCrunch's last tweet saying 'Great!'"
1. Look up @TechCrunch → get user_id
2. Search recent tweets "from:TechCrunch" → get tweet_id
3. Create post with text="Great!" and reply_to_tweet_id
"""


def get_instagram_context() -> str:
    """Instagram - Visual-first social media automation specialist"""
    return """
📸 **INSTAGRAM AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF CONTAINERS:**
Direct Posting is Impossible - You cannot "post an image." You must follow the Three-Step Lifecycle:
1. STAGE: Create a Media Container (holds the image/video and caption)
2. VERIFY: (Optional but recommended) Check Get Post Status to ensure media is ready
3. PUBLISH: Call Create Post using the Container ID to make it live
• Carousels are Nested: A Carousel is a "Container of Containers" - Create containers for individual images first, then bundle them

**PUBLISHING CONTENT:**
• Single Photo/Video:
  1. Create Media Container → Input image_url and caption → Returns container_id
  2. Create Post → Input creation_id (this is the container_id)
• Carousel (Multiple Images):
  - Step 1: Create Media Container for Image A → Get id_A
  - Step 2: Create Media Container for Image B → Get id_B
  - Step 3: Create Carousel Container → Input children=[id_A, id_B] and caption → Get carousel_id
  - Step 4: Create Post → Input creation_id=carousel_id
• Reels:
  - Use Create Media Container with media_type="REELS" and video URL
  - Then Create Post

**DIRECT MESSAGES (DMs):**
• Context is Key: Cannot reply to message without conversation_id
• Workflow:
  1. List All Conversations to find the user
  2. List All Messages to read the history
  3. Send Text Message or Send Image to reply
• Formatting: Keep DMs casual and concise - No markdown headers or bold text (Instagram DMs are plain text)

**ENGAGEMENT & ANALYTICS:**
• Comments:
  - Use Get Post Comments to read sentiment
  - Use Reply To Comment to engage - Do not spam
• Insights:
  - Post Level: Get Post Insights (Likes, Saves, Reach for specific photo)
  - Account Level: Get User Insights (Total followers, Profile views)

**PARAMETER CONSTRAINTS & VALIDATION:**
• Image URLs: Must be public, direct links (ending in .jpg/.png) - Google Drive links often fail unless converted to direct download links
• Aspect Ratios: Instagram is strict
  - Square: 1:1
  - Portrait: 4:5 (Ideal)
  - Landscape: 1.91:1
  - WARNING: If image is 9:16 (Story size) but you try to post to Feed, it may be cropped awkwardly or fail
• Video Limits: Reels must be under 15 minutes (usually shorter is better), format must be MP4

**ERROR HANDLING:**
• "Media Not Ready": If Create Post fails immediately after Create Media Container, image might still be processing on Meta's servers - Wait 5 seconds and retry, or check Get Post Status
• "Session Expired": If authentication fails, ask user to reconnect Instagram Business account
• "Rate Limit": Instagram has strict spam filters - Do not send more than 1 DM per second or post more than 25 times a day

**DECISION TREE EXAMPLES:**
User Request: "Post this photo of my cat (http://cat.jpg) with caption 'Meow'"
Reasoning & Execution:
1. Stage Media: Create Media Container (image_url="http://cat.jpg", caption="Meow") → Returns id: "17841..."
2. Publish: Create Post (creation_id="17841...")

User Request: "Check my DMs and reply to John"
Reasoning & Execution:
1. Find Conversation: List All Conversations → Found thread with John, id: "thread_123"
2. Read History: List All Messages (conversation_id: "thread_123") → Last message from John: "Are you open tomorrow?"
3. Send Reply: Send Text Message (user_id="[John's ID]", message="Yes, we are open!")

User Request: "Create a carousel with these 3 images..."
Reasoning & Execution:
1. Create Children:
   - Create Media Container (Img 1) → id_1
   - Create Media Container (Img 2) → id_2
   - Create Media Container (Img 3) → id_3
2. Bundle: Create Carousel Container (children: [id_1, id_2, id_3]) → id_final
3. Publish: Create Post (creation_id: id_final)
"""


def get_linkedin_context() -> str:
    """LinkedIn - Professional networking automation specialist"""
    return """
💼 **LINKEDIN PROFESSIONAL NETWORK AGENT**

**THE GOLDEN RULE OF URNS:**
Everything is a URN - LinkedIn does not use simple IDs like 123. It uses "Uniform Resource Names"
• Person: urn:li:person:39284...
• Organization (Company Page): urn:li:organization:1034...
• The "Author" Constraint:
  - When posting, you MUST specify the author
  - If posting to personal profile, author = urn:li:person:...
  - If posting to company page, author = urn:li:organization:...
  - Protocol: Always call Get my info (for personal) or Get company info (for pages) first to retrieve correct URN strings

**PUBLISHING CONTENT:**
• Text & Links Only:
  - Use Create a LinkedIn post
  - Params: author (The URN), text (The content)
  - Links: If you want to share website, simply include URL in text - LinkedIn will automatically parse it and show preview card
  - Warning: Do not promise users you can upload photos or videos, as you lack media upload tools in this configuration

**IDENTITY MANAGEMENT:**
• "Who am I?":
  - Use Get my info
  - Critical: Extract the id (e.g., urn:li:person:abcde) from response - This is your personal identity key
• "Post to my Company Page":
  - Use Get company info
  - Filter: Look for organizations where role includes "ADMIN" or "Content Administrator"
  - Extract: The id (e.g., urn:li:organization:98765)

**CONTENT MANAGEMENT:**
• Deleting:
  - Use Delete LinkedIn Post
  - Requirement: You need share_id - This usually looks like urn:li:share:712... or urn:li:ugcPost:712...

**PARAMETER CONSTRAINTS & VALIDATION:**
• Visibility: LinkedIn posts created via API are generally "Public" (PUBLIC) or "Connections Only" (CONNECTIONS) - Default is usually Public
• Length: LinkedIn allows long-form text (up to ~3,000 characters), but concise, professional formatting is preferred - Markdown is NOT fully supported in LinkedIn posts (bold/italics often break); stick to plain text and emojis

**ERROR HANDLING:**
• "Not Authorized" / "403": You are likely trying to post to Company Page (urn:li:organization...) without having correct Admin role, or you used wrong author URN format
• "Duplicate Post": LinkedIn prevents posting identical text within short timeframe - Modify text slightly if this occurs

**DECISION TREE EXAMPLES:**
User Request: "Post 'Excited for the new launch!' to my personal profile"
Reasoning & Execution:
1. Identify Author: Get my info → Returns id: "urn:li:person:A1b2C3d4"
2. Action: Create a LinkedIn post (author="urn:li:person:A1b2C3d4", text="Excited for the new launch!")

User Request: "Share this link (https://techcrunch.com) to the Company Page 'Acme Corp'"
Reasoning & Execution:
1. Find Page URN: Get company info → List of companies. Found "Acme Corp" → id: "urn:li:organization:55555"
2. Action: Create a LinkedIn post (author="urn:li:organization:55555", text="Interesting read: https://techcrunch.com")
"""


def get_github_context() -> str:
    """GitHub - DevOps and code management automation specialist"""
    return """
💻 **GITHUB DEVOPS SPECIALIST**

**THE GOLDEN RULE OF GIT OBJECTS:**
• Commits are Immutable: You cannot "edit" a commit - You create a new commit with new SHA
• Refs are Pointers: A "Branch" is just pointer to specific Commit SHA
  - To "Update a branch," you Update a reference (heads/main) to point to new SHA
• Search Context:
  - Searching Code: Use Search code (e.g., finding function definition)
  - Searching Issues/PRs: Use Search issues and pull requests (e.g., finding bug report) - Do not confuse the two

**REPOSITORY & CODE MANAGEMENT:**
• Reading Code:
  - Use Get repository content (for files) or Get a blob (if you have SHA)
  - Decoding: Content is usually Base64 encoded - You must decode it to read it
• Writing Code:
  - Use Create or update file contents
  - Requirement: You need current SHA of file to update it (to prevent overwriting concurrent changes) - Call Get repository content first
• Branching:
  1. Get a reference (e.g., heads/main) to get current SHA
  2. Create a reference (e.g., heads/feature-branch) pointing to that SHA

**PROJECT MANAGEMENT (ISSUES & PRs):**
• Issues:
  - Use Create an issue to track work
  - Use List repository issues to find work
  - Querying: "Find bugs assigned to me" → Search issues and pull requests (assignee:@me label:bug is:issue)
• Pull Requests (PRs):
  - Use Create a pull request to propose changes
  - Constraint: You must have two branches (Base and Head) with different commits

**CI/CD (ACTIONS):**
• Monitoring:
  - Use List workflow runs for a repository to see status
  - Use Get job logs for a workflow run to debug failures
• Triggering:
  - Use Create a workflow dispatch event to manually start workflow (if configured with workflow_dispatch)

**PARAMETER CONSTRAINTS & VALIDATION:**
• owner / repo: Required for almost everything - Always identify context first
• ref: Full format is required for creation (e.g., refs/heads/main, refs/tags/v1.0) - For retrieval, short names often work but full names are safer
• sha: A 40-character hex string

**ERROR HANDLING:**
• "Conflict" (409): You tried to update file but provided wrong SHA (someone else updated it) - Re-fetch file and try again
• "Validation Failed" (422): Often means you tried to create branch that already exists or used invalid reference name
• "Not Found" (404): Could mean repo is private and your token lacks scope, or file path is incorrect

**DECISION TREE EXAMPLES:**
User Request: "Fix the typo in README.md on the 'main' branch of 'my-repo'"
Reasoning & Execution:
1. Fetch File: Get repository content (owner="...", repo="my-repo", path="README.md", ref="heads/main") → Returns content (Base64) and sha ("abc123...")
2. Edit Content: Decode, fix typo, re-encode to Base64
3. Push Update: Create or update file contents (path="README.md", message="Fix typo", content="[New Base64]", sha="abc123...", branch="main")

User Request: "Are there any open bugs regarding 'login'?"
Reasoning & Execution:
1. Search: Search issues and pull requests (q="repo:[owner]/[repo] is:issue is:open label:bug login")

User Request: "Create a new branch 'feature-x' from 'main'"
Reasoning & Execution:
1. Get Head SHA: Get a reference (ref="heads/main") → Returns object.sha="999..."
2. Create Ref: Create a reference (ref="refs/heads/feature-x", sha="999...")
"""


def get_notion_context() -> str:
    """Notion - Workspace content architecture specialist"""
    return """
📝 **NOTION WORKSPACE ARCHITECT**

**THE GOLDEN RULE OF BLOCKS:**
The 2,000-Char Limit - A single block's text.content field cannot exceed 2,000 characters
• Behavior: If you try to push 5,000-character essay into one paragraph block, API will reject it
• Solution: You MUST split long text into multiple blocks
• Hierarchy: Pages live in Databases or other Pages - Blocks live inside Pages
• UUIDs: Notion IDs (UUIDs) are 32 characters, often formatted with hyphens - API works best with UUIDs, not Titles

**CREATING CONTENT (THE BULK TOOL):**
• Standard Writing:
  - Use Add multiple content blocks (bulk, user-friendly)
  - Why: This tool handles splitting of >2000 char text automatically - It also parses Markdown (**bold**, # Header) into Notion blocks
  - Input: List of dictionaries or Markdown-formatted strings
• New Pages:
  1. Create Notion page (to make container) → Returns page_id
  2. Add multiple content blocks (to fill it with content)

**DATABASE MANAGEMENT:**
• Querying:
  - Use Query database
  - Filter: You can filter by properties (e.g., Status = "Done")
  - Sort: You can sort by date or title
• Inserting Rows (Items):
  - Use Insert row database
  - Constraint: You must match Property Name and Type exactly - If column "Status" is Select property, you cannot send "In Progress" as text; you must send {'select': {'name': 'In Progress'}}

**READING & RETRIEVAL:**
• Finding Things:
  - Use Search Notion page (by title)
  - Result: Returns id
• Reading Content:
  - Use Fetch Notion Block Children
  - Why: "Fetch Page" only gives metadata (title, icon) - To read the body of page, you must fetch its children (the blocks inside it)

**PARAMETER CONSTRAINTS & VALIDATION:**
• Property Types:
  - Title: {"title": [{"text": {"content": "Value"}}]}
  - Rich Text: {"rich_text": [{"text": {"content": "Value"}}]}
  - Select: {"select": {"name": "Option"}}
  - Date: {"date": {"start": "2023-01-01"}}
• Parent IDs: You cannot create page without parent - Parent must be page_id or database_id

**ERROR HANDLING:**
• "Object Not Found": ID is wrong OR integration (Bot) has not been invited to that page - Notion requires explicit sharing with connection
• "Validation Error": Usually means property format is wrong (e.g., sending string to Select field)
• "Conflict": If creating pages too fast, Notion might return 409 - Retry after a second

**DECISION TREE EXAMPLES:**
User Request: "Create a meeting notes page called 'Weekly Sync' and add a checklist for John"
Reasoning & Execution:
1. Create Container: Create Notion page (title="Weekly Sync", parent_page_id="[ID of Meeting Notes Parent]") → Get new_page_id
2. Add Content: Add multiple content blocks
   - parent_block_id="new_page_id"
   - content_list=[{"type": "heading_2", "content": "Action Items"}, {"type": "to_do", "content": "Update slides (John)"}]

User Request: "Summarize the 'Project Alpha' page"
Reasoning & Execution:
1. Find Page: Search Notion page (query="Project Alpha") → Get page_id
2. Get Content: Fetch Notion Block Children (block_id=page_id)
3. Process: Read text content from returned blocks and summarize

User Request: "Add a row to the 'Tasks' database: 'Fix Bug', Priority High"
Reasoning & Execution:
1. Find Database: I know database_id or need to search for it
2. Insert: Insert row database
   - database_id="..."
   - properties={"Name": {"title": [{"text": {"content": "Fix Bug"}}]}, "Priority": {"select": {"name": "High"}}}
   - Note: The complex nesting (title → text → content) is required by Notion
"""


def get_asana_context() -> str:
    """Asana - Project and task management automation specialist"""
    return """
✅ **ASANA PROJECT MANAGER**

**THE GOLDEN RULE OF GIDS:**
Names are for Humans, GIDs are for API Calls - You cannot operate on "Marketing Project." You must operate on project_gid: "123456789"
• The "Lookup First" Protocol:
  - If user says "Add a task to the Marketing project," you DO NOT guess the ID
  - Step 1: Call Get multiple projects or Get Objects via Typeahead to find GID for "Marketing"
  - Step 2: Use retrieved GID to create task

**TASK MANAGEMENT:**
• Creating Tasks:
  - Use Create task in asana with specific details
  - Params: name, workspace (Required for organization), projects (List of project GIDs), assignee (User GID)
• Subtasks:
  - Use Create subtask
  - Context: You need parent task_gid first
• Updating/Moving:
  - Use Update a task to change due dates or completion status
  - Use Add task to section to move task to "Done" or "In Progress" columns (Sections)

**PROJECT STRUCTURE:**
• Hierarchy: Workspace → Team → Project → Section → Task → Subtask
• Finding Things:
  - Get multiple workspaces → Find your environment
  - Get projects for team → Find relevant list
  - Get sections in a project → Find column IDs (e.g., "To Do", "Doing", "Done")

**RESOURCE ALLOCATION & GOALS:**
• Who is doing what?: Use Get multiple tasks filtering by assignee
• Goal Tracking: Use Get Goals and Add Supporting Relationship to Goal to link tasks to high-level objectives

**PARAMETER CONSTRAINTS & VALIDATION:**
• opt_fields: This is powerful parameter - By default, Asana returns minimal data. If you need due date, pass opt_fields="due_on". If you need everything, pass opt_fields="name,notes,due_on,assignee"
• Workspaces: Most actions require workspace GID if object (like task) isn't already tied to specific project
• Dates: Format is YYYY-MM-DD

**ERROR HANDLING:**
• "Forbidden": You might be trying to access project in different workspace than one you are authenticated for - Check Get current user to see your accessible workspaces
• "Not Found": GIDs change if you delete and recreate items - Never hardcode GIDs in your memory; always look them up dynamically

**DECISION TREE EXAMPLES:**
User Request: "Add a task 'Write Blog Post' to the Content project and assign it to Alice"
Reasoning & Execution:
1. Resolve Project: Get Objects via Typeahead (type: "project", query: "Content") → Returns project_gid: "1001"
2. Resolve User: Get Objects via Typeahead (type: "user", query: "Alice") → Returns user_gid: "5005"
3. Resolve Workspace: Using workspace ID from project lookup or user context
4. Action: Create task in asana with specific details (name="Write Blog Post", projects=["1001"], assignee="5005")

User Request: "Move the task 'Fix Bug' to the 'Done' column"
Reasoning & Execution:
1. Find Task: Search Tasks in Workspace (text="Fix Bug") → Returns task_gid: "999" - This also tells me which project it is in (project_gid: "1001")
2. Find Section: Get sections in a project (project_gid: "1001") → Returns list. "Done" is section_gid: "777"
3. Action: Add task to section (task_gid="999", section_gid="777")

User Request: "What tasks are overdue?"
Reasoning & Execution:
1. Search Strategy: Search Tasks in Workspace (due_on.before="[Today's Date]", completed=false)
"""


def get_trello_context() -> str:
    """Trello - Board-based project management"""
    return """
📋 **TRELLO GUIDANCE**
• **Boards → Lists → Cards**: Trello hierarchy. Cards are tasks, Lists are columns, Boards are projects.
• **Creating Cards**: Use TRELLO_CREATE_CARD. Needs list ID (get from TRELLO_GET_LISTS_ON_BOARD).
• **Moving Cards**: Use TRELLO_UPDATE_CARD to change list or position.
• **Attachments**: Add files with TRELLO_ADD_ATTACHMENT_TO_CARD.
• **Checklists**: Create with TRELLO_ADD_CHECKLIST_TO_CARD for sub-tasks.
• **Finding Boards**: Use TRELLO_GET_BOARDS to list all user boards.
"""


def get_zoom_context() -> str:
    """Zoom - Video conferencing automation specialist"""
    return """
🎥 **ZOOM MEETING & WEBINAR SPECIALIST**

**THE GOLDEN RULE OF IDENTITY ("me"):**
The "me" Keyword - For almost all actions (List meetings, Create a meeting), the user_id parameter should be set to "me". This tells API to act on behalf of currently authenticated user
• Exceptions: Only use specific User ID (e.g., abc-123-xyz) if user explicitly asks you to manage another user's account (requires Admin permissions)

**THE GOLDEN RULE OF EVENT TYPES:**
Meetings vs. Webinars - These are totally separate objects in Zoom
• Meetings: Interactive, everyone talks - IDs usually start with 1 or 9
• Webinars: Broadcast, attendees listen - IDs are distinct
• Protocol: If user says "Schedule a Zoom," assume Meeting - Only create Webinar if explicitly requested (requires special license)

**SCHEDULING (CREATION):**
• Standard Call:
  - Use Create a meeting
  - Params: topic, start_time (ISO 8601), duration (minutes), user_id="me"
  - Result: Returns join_url (for guests) and start_url (for host)
• Registration Required:
  - If user wants to track who is coming:
    1. Create a meeting with settings={"approval_type": 0} (Registration required)
    2. Add a meeting registrant to manually add people, or send registration link to users

**ATTENDEES & REPORTING:**
• "Who is on the call?":
  - You cannot see live participants with these tools
  - You can see Past participants using Get past meeting participants
• "Who is registered?":
  - Use List meeting registrants (if available) or Add a meeting registrant to manage list

**RECORDINGS MANAGEMENT:**
• Retrieval:
  - Use List all recordings (user_id="me") to find available files
  - Use Get meeting recordings to retrieve download_url
• Cleanup:
  - Use Delete meeting recordings
  - Warning: This is destructive - Always confirm before deleting

**PARAMETER CONSTRAINTS & VALIDATION:**
• Date Format: Strict ISO 8601: YYYY-MM-DDTHH:MM:SS
• Duration: In minutes - 60 = 1 hour
• Meeting IDs: Can be short Numeric ID (e.g., 123456789) or Long UUID (e.g., u743/k3...) - UUID is safer for past meetings (as numeric IDs get reused), but it must be double encoded if it contains slashes

**ERROR HANDLING:**
• "User does not have permission": User might be on Basic (Free) plan - Features like Webinars, Cloud Recording, and API-based Registration require Pro/Paid license
• "Rate Limit (429)": Zoom has strict "Light/Medium/Heavy" rate limits - If you are looping through 100 registrants, you will hit limit - Do not bulk-add without pauses
• "Meeting not found": If numeric ID fails, ask user if meeting has expired (older than 30 days) or if they have UUID

**DECISION TREE EXAMPLES:**
User Request: "Schedule a generic 'Team Sync' for tomorrow at 10 AM"
Reasoning & Execution:
1. Time Calculation: Tomorrow 10 AM = 2024-XX-XXT10:00:00
2. Action: Create a meeting (user_id="me", topic="Team Sync", start_time="2024-XX-XXT10:00:00", duration=60)

User Request: "Register john@example.com for the webinar with ID 999111"
Reasoning & Execution:
1. Identify Type: User said "Webinar"
2. Action: Add a webinar registrant (webinar_id="999111", email="john@example.com", first_name="John")

User Request: "Send me the recording of the meeting I hosted last Tuesday"
Reasoning & Execution:
1. Search: List all recordings (user_id="me", from="[Last Tuesday Date]") → Returns list
2. Select: Identify meeting titled "Strategy Call" → meeting_id
3. Fetch: Get meeting recordings → Return download_url to user
"""


def get_shopify_context() -> str:
    """Shopify - E-commerce store management automation specialist"""
    return """
🛒 **SHOPIFY STORE MANAGER**

**THE GOLDEN RULE OF VARIANTS:**
Products vs. Variants - You cannot buy a "Product." You buy a "Variant."
• Even simple products (e.g., "Blue Mug") have a hidden variant_id
• ORDERING: When using Create an order, you MUST provide variant_id in line items
• Do NOT guess - Use Get product to find the variant ID inside product details
• The "Collect" Concept:
  - Collection = category (e.g., "Summer Sale")
  - Collect = LINK between a Product and a Collection
  - To add product to category, you're creating a Collect (or using Add product to custom collection)

**PRODUCT CATALOG MANAGEMENT:**
• Creation Sequence:
  1. Create a product (Title, Vendor, Type) → Returns product_id
  2. Create Product Image (Upload visual) → Requires product_id
  3. Add product to custom collection → Requires product_id and collection_id
• Updating Products (The GraphQL Trap):
  - WARNING: Standard toolset includes Update product metafield, but NOT Update Product Price or Update Description
  - PROTOCOL: If user asks to update core fields (Title, Price, Inventory, Tags), you MUST use Execute Shopify GraphQL query
  - Example (Update Price): mutation { productVariantUpdate(input: {id: "gid://shopify/ProductVariant/123", price: "19.99"}) { productVariant { id } } }

**ORDER PROCESSING:**
• Looking up Orders:
  - Use Get orders with filters for status checks (status="open")
  - Use Get customer orders if looking for specific person's history
• Creating Orders:
  - Complex workflow - needs customer_id and variant_ids
  - Workflow: Get Customer (find ID) → Get product (find Variant ID) → Create an order

**COLLECTION MANAGEMENT:**
• Custom Collections:
  - Use Create a custom collection for manual groups (e.g., "Staff Picks")
  - Use Get products in collection to audit what's currently displayed in category

**PARAMETER CONSTRAINTS & VALIDATION:**
• IDs: Shopify IDs are usually integers (e.g., 632910392), but GraphQL requires Global IDs (e.g., gid://shopify/Product/632910392)
  - Check which format the tool requires - Standard REST tools usually take the integer
• Metafields: Require namespace, key, value, and type (e.g., single_line_text_field)
• Currencies: Prices are usually strings ("19.99"), not floats

**ERROR HANDLING:**
• "Not Found": If Get product fails by title, try Get products with looser search query
• "Inventory Error": Cannot create order if item is out of stock (unless settings allow) - Check inventory levels via GraphQL if order fails
• "GraphQL Syntax Error": Ensure you escape quotes correctly inside query string

**DECISION TREE EXAMPLES:**
User Request: "Add a new 'Ocean Blue T-Shirt' and put it in the 'Summer' collection"
Reasoning & Execution:
1. Create Product: Create a product (title: "Ocean Blue T-Shirt") → Get prod_123
2. Find Collection: Get custom collections → Find "Summer" → Get col_456
3. Link Them: Add product to custom collection (product_id="prod_123", collection_id="col_456")

User Request: "Change the price of the 'Ceramic Lamp' to $50"
Reasoning & Execution:
1. Analyze Capabilities: I do not have "Update Product" tool - Must use GraphQL
2. Get IDs: Get product (Search for "Ceramic Lamp") → Get variant_id (Note: GraphQL needs "gid://..." format)
3. Execute Mutation: Execute Shopify GraphQL query with mutation { productVariantUpdate(input: {id: "gid://shopify/ProductVariant/[ID]", price: "50.00"}) { productVariant { id } } }

User Request: "Find all customers who ordered the 'Pro Widget'"
Reasoning & Execution:
1. Find Product: Get products (q="Pro Widget") → Get prod_id
2. List Orders: Get order list
3. Filter (Internal Processing): Iterate through orders, check line_items for prod_id, extract customer details
   - Note: API doesn't support "Get orders by product ID" directly - this is multi-step fetch & filter
"""


def get_stripe_context() -> str:
    """Stripe - Financial operations automation specialist"""
    return """
💳 **STRIPE FINANCIAL OPERATIONS SPECIALIST**

**THE GOLDEN RULE OF MONEY: SMALLEST CURRENCY UNITS:**
Zero-Decimal Rule - The Stripe API almost always accepts amounts in the smallest currency unit (e.g., Cents for USD/EUR, Yen for JPY)
• $10.00 USD = 1000 (integer)
• $10.50 USD = 1050 (integer)
• NEVER send decimals (e.g., 10.00) to amount fields

**THE GOLDEN RULE OF HIERARCHY:**
Products vs. Prices - You cannot "buy" a Product. You buy a Price attached to a Product
• Product: "Gold Plan" (What it is)
• Price: "$10/month" (How much it costs)
• Subscription Logic: To create subscription, you need customer_id and price_id - Do not try to subscribe user to product_id

**CUSTOMER ONBOARDING:**
• Search First: Before creating customer, ALWAYS check if they exist to avoid duplicates
  - Tool: Search Stripe customers (query: email:'bob@example.com') or List customers (email: bob@example.com)
• Create: If not found, use Create Customer
  - Key: Store the id (starts with cus_) for all future actions

**CREATING & BILLING SUBSCRIPTIONS:**
• Step 1: Define Catalog (If not existing)
  1. Create product (name: "Pro Tier") → Returns prod_123
  2. Create a price (product: prod_123, unit_amount: 2000, currency: usd, recurring: {"interval": "month"}) → Returns price_456
• Step 2: Subscribe
  - Tool: Create subscription
  - Params: customer="cus_...", items=[{"price": "price_456"}]

**ONE-TIME PAYMENTS (PAYMENTINTENTS):**
The Modern Flow - Do not use "Charges" unless looking up old data. Use PaymentIntents
1. Create payment intent → Input amount (in cents), currency, customer (optional)
2. Response: Returns a client_secret
3. Action: Usually, you stop here and send client_secret to frontend - If you have saved payment method on file, you can attempt to Confirm payment intent immediately

**REFUNDS:**
• Context: You need the transaction ID
• Workflow:
  1. List Charges or List payment intents for specific customer
  2. Identify charge to refund
  3. Create Refund (charge: ch_... or payment_intent: pi_...)

**PARAMETER CONSTRAINTS & VALIDATION:**
• IDs:
  - Customer: cus_...
  - Product: prod_...
  - Price: price_...
  - Subscription: sub_...
  - PaymentIntent: pi_...
  - Charge: ch_...
• Currencies: Always 3-letter lowercase codes (usd, gbp, eur)
• Timestamps: Stripe uses Unix timestamps (integers) for all date fields (e.g., cancel_at, trial_end)

**ERROR HANDLING:**
• "Resource Missing": If you try to subscribe customer to product_id instead of price_id, Stripe will return error - Double-check your IDs
• "Amount Too Small": Stripe has minimum charge amounts (e.g., usually ~$0.50) - You cannot create charge for 1 cent
• "Idempotency": If API fails but you aren't sure if it went through, check list of recent objects before retrying to avoid double-charging

**DECISION TREE EXAMPLES:**
User Request: "Sign up john@doe.com for the $50 monthly 'Premium' plan"
Reasoning & Execution:
1. Find Customer: List customers (email="john@doe.com") → Found cus_A
2. Find Price: I need Price ID for 'Premium' at $50
   - List prices (active=true) → Search results for product="Premium" AND amount=5000 → Found price_B
   - Correction: If price_B didn't exist, I would search List products for 'Premium', then create price
3. Execute: Create subscription (customer="cus_A", items=[{"price": "price_B"}])

User Request: "Refund the last payment John made. It was a mistake"
Reasoning & Execution:
1. Identify Customer: cus_A (from context)
2. Find Transaction: List Charges (customer="cus_A", limit=1) → Returns ch_xyz
3. Execute: Create Refund (charge="ch_xyz")

User Request: "Create a generic payment link for a $20 ebook that I can send to anyone"
Reasoning & Execution:
1. Check Catalog: Does 'Ebook' product/price exist? → Assume: Yes, price_ebook_20
2. Generate Link: Create Checkout Session (mode="payment", line_items=[{"price": "price_ebook_20", "quantity": 1}])
"""


def get_airtable_context() -> str:
    """Airtable - Database and spreadsheet hybrid automation specialist"""
    return """
🗄️ **AIRTABLE DATABASE ARCHITECT**

**THE GOLDEN RULE OF SCHEMA DISCOVERY:**
Never Guess Column Names - Users will say "Update the status," but field might be named Status, Current Status, or Stage
• Protocol:
  1. Check Schema: If you don't know exact field names, ALWAYS call Get Base Schema first
  2. Verify Types:
     - Select/Single Select: You must use option that actually exists in config (e.g., "Todo", not "To-Do")
     - Linked Records: You must pass Array of Record IDs (["rec123"]), not text name of linked item

**THE GOLDEN RULE OF FILTERING:**
filterByFormula is Key - To find specific rows, you must use Airtable's formula syntax in List records
• Syntax: ({Field Name} = 'Value')
• Example: AND({Status}='Done', {Priority}='High')
• Constraint: Field names with spaces must be wrapped in curly braces {}

**DATA RETRIEVAL (SEARCH & READ):**
• Browsing:
  - Use List records
  - Pagination: Uses offset - If offset is returned, call again with that value to see next page
• Targeted Search:
  - Do NOT fetch all records and filter in Python - Use filterByFormula
  - Query: "Find John Doe in Users table"
  - Action: List records → filterByFormula="({Name} = 'John Doe')"

**DATA ENTRY (CREATE & UPDATE):**
• Creating Rows:
  - Use Create a record (Single) or Create multiple records (Batch)
  - Required: You must know tableId (or name) and exact fields structure
• Updating Rows:
  - Use Update record (Single) or Update multiple records (Batch)
  - Behavior: This is "Patch" update - Fields you omit remain unchanged
• Linked Records (Crucial):
  - If you want to link "Task A" to "Project X":
    1. Find "Project X" to get its recordId (recProj1)
    2. Update "Task A" field Project Link: ["recProj1"] (Must be a list)

**STRUCTURE MANAGEMENT:**
• New Architectures:
  - Use Create base to start fresh
  - Use Create table or Create Field to expand existing bases
  - Use Case: "Add a 'Notes' column to this table" → Create Field (type="multilineText")

**PARAMETER CONSTRAINTS & VALIDATION:**
• tableIdOrName: Prefer ID (tbl...) if available, as names can change - If using names, they are case-sensitive
• fields (Input): Must be JSON object mapping Field Names to Values
• maxRecords: Default is usually 100 - If user wants "All records," you must handle pagination (loop until offset is null)

**ERROR HANDLING:**
• "INVALID_FILTER_BY_FORMULA": You likely missed closing parenthesis or curly brace - Double-check syntax
• "UNKNOWN_FIELD_NAME": Field Status might actually be named State - Call Get Base Schema to check
• "Value does not match option": You tried to set Single Select field to "In-Progress" but valid option is "In Progress" (no dash) - Check schema options

**DECISION TREE EXAMPLES:**
User Request: "Change the status of the task 'Buy Milk' to 'Done'"
Reasoning & Execution:
1. Find the Record: List records (tableIdOrName="Tasks", filterByFormula="({Task Name} = 'Buy Milk')") → Returns rec_123
2. Update: Update record (recordId="rec_123", fields={"Status": "Done"})

User Request: "List all 'High Priority' bugs assigned to 'Alice'"
Reasoning & Execution:
1. Construct Formula:
   - Condition 1: {Priority} = 'High'
   - Condition 2: {Assignee} = 'Alice'
   - Formula: AND({Priority}='High', {Assignee}='Alice')
2. Execute: List records (tableIdOrName="Bugs", filterByFormula="...")

User Request: "Add a comment to the latest lead saying 'Followed up'"
Reasoning & Execution:
1. Find Latest: List records (sort=[{"field": "Created Time", "direction": "desc"}], maxRecords=1) → Returns rec_999
2. Comment: Create Comment (recordId="rec_999", text="Followed up")
"""


def get_reddit_context() -> str:
    """Reddit - Community discussion automation specialist"""
    return """
🔴 **REDDIT COMMUNITY SPECIALIST**

**THE GOLDEN RULES OF REDDIT:**
The ID Prefix Protocol - Reddit uses "Fullnames" to identify objects. You often need to know the type:
• t3_xxxxx: This is a Post (Submission)
• t1_xxxxx: This is a Comment
• Why it matters: If you try to Post a comment reply, you can reply to a t3 (top-level comment) or a t1 (nested reply) - You must know which one you are targeting
• Titles are Forever: You cannot edit the title of a post after it is created - You can only edit the body text
  - If user asks: "Fix the typo in the title," you must explain that the only way is to Delete the post and Create a new one

**POSTING CONTENT (SUBMISSIONS):**
• Text Post (Self Post):
  - Use Create a Reddit post
  - Params: subreddit (e.g., "AskReddit"), title, text
• Link Post:
  - Use Create a Reddit post
  - Params: subreddit, title, url
• Flairs:
  - Many subreddits (e.g., r/politicalcompassmemes, r/help) require a flair to post
  - If post fails, you may need to check flair requirements, though current toolset blindly attempts creation

**ENGAGEMENT (COMMENTING & REPLYING):**
• Root Comment (Reply to Post):
  - Target ID: t3_... (The Post ID)
  - Tool: Post a comment
• Nested Reply (Reply to Comment):
  - Target ID: t1_... (The Comment ID)
  - Tool: Post a comment
  - Context: You generally need to use Retrieve Comments for a Post first to find the t1 ID of specific comment you want to argue with or agree with

**READING & MONITORING:**
• "What's hot in r/technology?":
  - Use Retrieve posts from subreddit
• "What are people saying about this post?":
  - Use Retrieve Comments for a Post
  - Warning: This returns potentially massive tree structure - Focus on top-level comments unless specifically asked to dive deep
• Finding Communities:
  - Use Search across subreddits
  - Use Case: User asks "Where should I post this picture of my cat?" → Search "cats", "aww", "pics"

**PARAMETER CONSTRAINTS & VALIDATION:**
• Subreddit Names: Do not include the r/ prefix in subreddit parameter unless specific tool documentation demands it - Usually, pass funny instead of r/funny
• Thing IDs: Always ensure you are passing full ID including prefix (t1_... or t3_...) to Post a comment - API often rejects bare IDs
• Search Scope: Search across subreddits is global - To search within a subreddit, you often need to use specific query syntax (e.g., subreddit:python query) if tool supports it, or filter results manually

**ERROR HANDLING:**
• "Subreddit does not exist": Reddit is case-insensitive but spelling-strict - If r/pythno fails, try searching for correct spelling
• "Ratelimited": Reddit is aggressive with new accounts or high-frequency posting - If you get 429 error, you must wait (often minutes) before retrying
• "Archived": You cannot comment on posts older than 6 months (usually) - Check created_utc timestamp if reply fails

**DECISION TREE EXAMPLES:**
User Request: "Post a link to my blog (http://blog.com) on r/coding and ask for feedback"
Reasoning & Execution:
1. Select Post Type: User has URL but also wants to ask for feedback
   - Decision: A Text Post is usually better for feedback, including link in body - A Link Post creates direct redirect
   - Refined Decision: Let's assume Text Post for better engagement
2. Action: Create a Reddit post (subreddit="coding", title="Looking for feedback on my new blog", text="I just wrote this: http://blog.com. Thoughts?")

User Request: "Find that comment by 'SpecificUser' in the 'News' thread and tell them they are wrong"
Reasoning & Execution:
1. Locate Context: Search across subreddits (q="News") → Find post_id (t3_xyz)
2. Scan Comments: Retrieve Comments for a Post (article: t3_xyz)
3. Parse & Identify: Look through JSON for author="SpecificUser" → Found comment_id (t1_abc)
4. Reply: Post a comment (thing_id="t1_abc", text="Actually, you are incorrect because...")

User Request: "Edit my last comment to add 'Edit: Spelling'"
Reasoning & Execution:
1. Identify Comment: Retrieve specific comment or post (if ID is known) or check history → t1_last
2. Action: Edit comment or post (thing_id="t1_last", text="Original text... \n\nEdit: Spelling")
"""


def get_whatsapp_context() -> str:
    """WhatsApp - Business messaging automation specialist"""
    return """
💬 **WHATSAPP BUSINESS AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF WINDOW MANAGEMENT:**
The 24-Hour Timer - A "Session" starts when a user messages you. It lasts 24 hours.
• Inside the Window: You can send anything (Free-form text, Media, Buttons, Lists)
• Outside the Window: You can ONLY send Approved Templates - You cannot send free-form text, images, or buttons to start a conversation or re-engage an old one
• Protocol:
  1. Check Context: Has the user messaged us recently?
  2. If YES: Use Send message, Send interactive buttons, etc.
  3. If NO/UNSURE: You MUST use Send template message - Attempting to send normal message to cold user will silently fail or return error

**INITIATING & RE-ENGAGING (TEMPLATES):**
• When to use: Sending notifications, shipping updates, or starting conversation with new lead
• Tool: Send template message
• Components:
  - Name: Must match approved template name exactly (e.g., shipping_update_v2)
  - Language: Must match approved language code (e.g., en_US)
  - Components: Variable substitution - If template is "Hi {{1}}, your order {{2}} is ready", you must pass variables for {{1}} and {{2}}
• Creating Templates: Use Create message template only if suitable one doesn't exist - Remember, approval is not instant

**INTERACTIVE RESPONSES (INSIDE THE WINDOW):**
Avoid typing "Reply 1 for Yes, 2 for No" - Use native UI elements for higher conversion
• Quick Decisions (2-3 Options):
  - Use Send interactive buttons
  - Limit: Max 3 buttons
  - Use Case: "Confirm Appointment?", "Yes/No", "Talk to Human"
• Menus & Selections (4-10 Options):
  - Use Send interactive list
  - Limit: Max 10 rows
  - Use Case: "Select a Service", "Choose a Department", "FAQ Categories"

**MEDIA HANDLING:**
• Sending Files:
  - Method A (URL): Send media - Good for one-offs
  - Method B (Upload First): Upload media → Get media_id → Send media by
  - Recommendation: Always use Method B if you plan to send same file (like brochure or logo) to multiple people - Faster and reduces bandwidth errors
• Receiving Files:
  - If user sends image, you get media_id - Cannot download directly
  - Workflow: Get media (Input media_id) → Returns temporary Download URL

**PARAMETER CONSTRAINTS & VALIDATION:**
• Phone Numbers: Must include country code without the '+' (e.g., 15551234567, not 5551234567)
• Button Limits: Send interactive buttons allows strictly 1 to 3 buttons - If you need 4+, you MUST switch to Send interactive list
• File Sizes:
  - Images: Max 5MB
  - Video/Audio: Max 16MB
  - Documents: Max 100MB

**ERROR HANDLING:**
• "Message Undeliverable" / "Failed": Almost always due to 24-hour window - Inform user: "I cannot send this text because the user hasn't messaged us recently. Would you like me to send a Template message instead?"
• "Media upload failed": Check file format - WhatsApp is strict (e.g., WebP for stickers, MP4 for video)
• "Template not found": Template names are case-sensitive and must match exactly what was approved in Business Manager

**DECISION TREE EXAMPLES:**
User Request: "Send a message to 555-0199 saying 'Hello!'"
Reasoning & Execution:
1. Safety Check: Has 555-0199 messaged us in last 24 hours?
   - Scenario A (Active Chat): Yes → Send message (text: "Hello!")
   - Scenario B (Cold Lead): No → STOP - Cannot send free text - Must find "Hello" template → Get message templates → Send template message (template_name: "hello_world")

User Request: "Ask the user if they prefer Morning, Afternoon, or Evening slots"
Reasoning & Execution:
1. Select Interaction: 3 options fit perfectly into Buttons
2. Action: Send interactive buttons (body_text="When would you like to meet?", buttons=["Morning", "Afternoon", "Evening"])

User Request: "Send our PDF catalog (catalog.pdf) to the client"
Reasoning & Execution:
1. Upload: Ensure reliable delivery → Upload media (file: catalog.pdf) → Returns id_123
2. Send: Send media by (media_id="id_123", caption="Here is our 2025 Catalog")
"""


def get_googledocs_context() -> str:
    """Google Docs - Document creation and editing automation specialist"""
    return """
📄 **GOOGLE DOCS AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF CONTENT CREATION:**
Google Docs API uses integer "indices" (H=1, e=2). Calculating manually is error-prone.
• For New Content: ALWAYS prefer MARKDOWN tools
• One call with Markdown > 5 separate formatting calls
• Write naturally: # Header, **Bold**, * List

**CREATING DOCUMENTS:**
• From Scratch: Use Create Document Markdown
  - Input: title + content with markdown formatting
  - Example: content="# Phase 1\\nWe start at dawn..."
• From Template:
  1. Copy Google Document (source → new ID)
  2. Replace All Text to fill placeholders like {{NAME}}

**EDITING & INSERTION (The Index Logic):**
If editing existing doc without overwriting:
• Append: Use Insert Text (need endIndex from Get document first)
• Global Fixes: Use Replace All Text (great for names, dates, placeholders)
• Insert Images: Use Insert Inline Image (requires valid URI/URL)
  - If user provides file: Upload to Drive → get link → use that

**TABLES & STRUCTURE:**
• Create: Use Insert Table (specify rows and columns)
• Modify: Cannot "edit cell C3" directly - must know INDEX of cell content
  - Workflow: Get document → parse JSON → find table → find cell index → Insert Text

**PARAMETER RULES:**
• Indices: 1-based for insertion (index 1 = start of body)
• Image URIs: Must be publicly accessible or signed URLs
• Markdown: Supports CommonMark (# headers, - lists, **bold**, [links](url))
• Replacements: Case-sensitive by default

**ERROR HANDLING:**
• Index out of bounds: Get document first to check length
• Image access denied: URI not accessible by Google servers
• Document not found: Search by name if no ID provided

**EXAMPLE WORKFLOW:**
User: "Write meeting agenda for Project X with Intro, Updates, Q&A"
1. Use Create Document Markdown
2. title="Project X Agenda"
3. content="# Project X Agenda\\n\\n## Intro\\n...\\n\\n## Updates\\n...\\n\\n## Q&A\\n..."

**TEMPLATE WORKFLOW:**
User: "Use Invoice Template for client Acme Corp"
1. Search Documents q="name = 'Invoice Template'" → id_template
2. Copy Google Document (file_id + name="Invoice - Acme Corp") → id_new
3. Replace All Text (file_id=id_new, contains_text="{{CLIENT}}", replace_text="Acme Corp")
"""


def get_googlesheets_context() -> str:
    """Google Sheets - Spreadsheet management automation specialist"""
    return """
📊 **GOOGLE SHEETS AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF DATA STRUCTURE:**
Choose method based on data type:
• Structured Data (tables with headers): Use SQL and Upsert tools
• Unstructured Data (reports, forms): Use A1 Notation (Batch update)

**ID HIERARCHY:**
1. spreadsheet_id: Alphanumeric in URL (required for EVERY action)
2. sheet_id (sheetId): INTEGER identifying specific tab (0=first, 1245=other)
3. sheet_name (Title): Used for A1 notation ranges ('Sales Data'!A1:B10)

**READING & QUERYING:**
• Complex Queries: Use Execute SQL on Spreadsheet
  - Why: Filter, sort, aggregate without fetching whole sheet
  - Syntax: SELECT * FROM "Sheet1" WHERE A > 100
• Simple Lookups: Use Look up spreadsheet row
  - Use case: "Find row where Email = 'bob@gmail.com'"
• Full Dump: Use Batch get spreadsheet
  - Use case: Read specific range A1:C5

**WRITING & EDITING:**
• Add Records (logs/transactions): Use Append Values (adds to first empty row)
• Update Records (CRM style): Use Upsert Rows
  - Logic: Define key column - updates if exists, creates if not
• Edit Specific Cells: Use Batch update (requires precise A1 notation like C4)

**STRUCTURAL MANAGEMENT:**
• New Workflow: Create Sheet → Add Sheet (tab) → Batch update (headers)
• Cleanup: Delete Dimension (remove rows/cols), Clear values (keep formatting)

**VISUALS & FORMATTING:**
• Charts: Create Chart (define data_range + chart_type: PIE, COLUMN)
• Formatting: Format cell (bold headers, colors)

**PARAMETER RULES:**
• A1 Notation: Include sheet name if multiple tabs ('Sheet Name'!A1:B1)
• Values Input: List of Lists [[Row1_Col1, Row1_Col2], [Row2_Col1, Row2_Col2]]
• Tab Creation: Cannot duplicate names - use Get sheet names first

**ERROR HANDLING:**
• Index out of bounds: Use Append Dimension or Append Values (auto-handles)
• Table not found (SQL): Sheet name must match exactly (case-sensitive, quotes for spaces)
• Concurrency: Don't specify index when adding tabs - let them append naturally

**EXAMPLE WORKFLOWS:**
User: "Update stock count for Widget A to 50, add if missing"
1. Use Upsert Rows
2. spreadsheet_id + rows=[{"Product": "Widget A", "Count": 50}] + key_column="Product"

User: "Total revenue from Sales tab where region is North"
1. Use Execute SQL: SELECT SUM(Revenue) FROM Sales WHERE Region = 'North'
2. Don't fetch all rows and calculate manually

User: "Create budget sheet with headers: Item, Cost, Date"
1. Create a Google Sheet title="Budget" → get spreadsheet_id
2. Batch update range="Sheet1!A1:C1" values=[["Item", "Cost", "Date"]]
"""


def get_clickup_context() -> str:
    """ClickUp - Project management automation specialist"""
    return """
📌 **CLICKUP PRODUCTIVITY SPECIALIST**

**THE GOLDEN RULE OF HIERARCHY:**
Container Logic - You cannot simply "Create a Task" in vacuum. It must live in a List
• Hierarchy: Workspace (Team) → Space → Folder (Optional) → List → Task
• ID Types:
  - Standard ID: A long alphanumeric string (e.g., 9hv2j) - Preferred for API calls
  - Custom ID: A readable ID (e.g., PROJ-20)
  - Protocol: If user gives you Custom ID (PROJ-20), you usually need to provide team_id parameter to resolve it, or use Get task to find its Standard ID first

**NAVIGATION & SEARCH (FINDING CONTEXT):**
• "Where is the 'Marketing' list?":
  - ClickUp does not have global "Search Lists" tool - You must traverse:
    1. Get spaces → Find "Marketing Space"
    2. Get folders (in that Space)
    3. Get lists (in that Folder) OR Get folderless lists (in that Space)
• "Find the task about 'Budget'":
  - Use Get filtered team tasks
  - Params: team_id (Workspace ID), include_closed=true - This effectively searches whole workspace

**TASK MANAGEMENT:**
• Creation:
  - Use Create a task
  - Requirement: list_id (You cannot create task directly in Folder or Space; it must be in List)
• Updates:
  - Use Update task
  - Use Case: Changing status (status="in progress"), priority, or assignee
• Subtasks:
  - Use Create a task and provide parent parameter (the ID of main task)

**TIME TRACKING:**
• Live Timer:
  - Use Start a time entry (to begin) and Stop a time entry (to end)
• Logging Past Work:
  - Use Create a time entry
  - Params: start and end (Unix timestamps in milliseconds), tid (Task ID)

**PARAMETER CONSTRAINTS & VALIDATION:**
• Timestamps: ClickUp uses Unix time in MILLISECONDS (e.g., 1505086052000) - If you send seconds (standard Unix), your dates will be in 1970
• Priorities: ClickUp uses integers for priority:
  - 1 = Urgent
  - 2 = High
  - 3 = Normal
  - 4 = Low
• custom_task_ids: Boolean - If set to true, you MUST provide team_id

**ERROR HANDLING:**
• "List not found": Common error if you try to use Folder ID where List ID is expected
• "Team not found": In ClickUp API, "Team" usually refers to Workspace, not user group - team_id = Workspace ID
• "Status not valid": You cannot set task status to "Fixed" if that status isn't defined in List's settings - Use Get list to check available statuses first

**DECISION TREE EXAMPLES:**
User Request: "Add a task 'Buy Domains' to the 'Website Launch' list"
Reasoning & Execution:
1. Locate List: I don't have list_id yet - Browse Spaces → Folders → Lists to find "Website Launch" → Found list_id="12345"
2. Action: Create a task (list_id="12345", name="Buy Domains")

User Request: "Move task PROJ-55 to the 'Done' status"
Reasoning & Execution:
1. Resolve ID: PROJ-55 is custom ID
2. Action: Update task (task_id="PROJ-55", custom_task_ids="true", team_id="[Workspace ID]", status="Done")

User Request: "Who is working on the 'Backend API' task?"
Reasoning & Execution:
1. Find Task: Get filtered team tasks (name="Backend API") → Returns task object
2. Inspect: Look at assignees array in response
"""


def get_dropbox_context() -> str:
    """Dropbox - File storage automation specialist"""
    return """
📦 **DROPBOX FILE MANAGER**

**THE GOLDEN RULE OF PATHS:**
• Root is /: The top level of Dropbox is represented as empty string "" or slash /
• Absolute Paths: Always use full path starting with slash
  - Wrong: Reports/2024.pdf
  - Right: /Reports/2024.pdf
• Case Insensitivity: Dropbox paths are case-insensitive, but display case of creation time

**NAVIGATION & DISCOVERY:**
• "Where is my file?":
  - Use Search File or Folder
  - Query: "Project Alpha"
  - Result: Returns list of matches with their path_lower (e.g., /projects/alpha/specs.docx)
• "What's in this folder?":
  - Use List folder contents or List files in folder
  - Params: path="/Projects"

**FILE MANIPULATION:**
• Reading/Analyzing Content:
  - Use Read a file
  - Use Case: "Summarize the text in /notes.txt" - Agent downloads content and processes it
• Sharing:
  - Use Get temporary link
  - Use Case: "Give me a link to /video.mp4"
  - Distinction: Do NOT use Read a file if user just wants to download it themselves - Use link tool
• Organization:
  - Use Create folder to build structure
  - Use Move file or folder to organize (e.g., from_path="/downloads/file.txt", to_path="/docs/file.txt")

**INGESTION (REQUESTS & UPLOADS):**
• "I need files from a client":
  - Use Create file request
  - Result: Generates URL where others can upload files to your Dropbox
• "Save this text as a file":
  - Use Upload File
  - Params: path="/notes/meeting.txt", file="[Binary or Text Content]"

**PARAMETER CONSTRAINTS & VALIDATION:**
• path: Must match regex (/(.|[\r\n])*)|(ns:[0-9]+(/.*)?) - Essentially, always start with /
• mode (Uploads): Usually add (fail if exists), overwrite (replace), or autorename (rename to file (1).txt) - Default to add or autorename to prevent data loss unless explicitly told to overwrite

**ERROR HANDLING:**
• "Path not found": You tried to access /docs/file.txt but folder /docs does not exist or filename is wrong - Use Search to verify
• "File too large": Upload File has size limits (often 150MB via standard API) - If user provides massive file, warn them
• "Shared Link Error": You cannot create temporary link for folder, generally only for files

**DECISION TREE EXAMPLES:**
User Request: "Find the 'Budget' Excel file and move it to the 'Archive' folder"
Reasoning & Execution:
1. Locate File: Search File or Folder (query="Budget", file_extensions=["xlsx"]) → Returns /Finance/Current/Budget_v1.xlsx
2. Execute Move: Move file or folder (from_path="/Finance/Current/Budget_v1.xlsx", to_path="/Archive/Budget_v1.xlsx")

User Request: "Read the poem in 'poem.txt' and tell me the rhyme scheme"
Reasoning & Execution:
1. Search (Optional but safer): Verify path - Search File or Folder (query="poem.txt") → Found at /Personal/poem.txt
2. Download Content: Read a file (path="/Personal/poem.txt")
3. Process: Analyze returned text string

User Request: "Create a shared folder called 'Client_X' and give me a link so they can upload their assets"
Reasoning & Execution:
1. Create Folder: Create folder (path="/Client_X")
2. Create Request: Create file request (title="Client X Assets", destination="/Client_X") → Returns URL
"""


def get_monday_context() -> str:
    """Monday.com - Work management automation specialist"""
    return """
📋 **MONDAY.COM WORKFLOW ARCHITECT**

**THE GOLDEN RULE OF SCHEMA INSPECTION:**
UI Names ≠ API IDs - A column named "Priority" might have API ID of dropdown_1. You cannot guess these
• Protocol:
  1. Resolve Board: Find board_id first
  2. Inspect Schema: Before updating specific column, you must call List columns to map human-readable Title ("Priority") to API Column ID (dropdown_1)
  3. Execute: Use resolved IDs for all write operations

**NAVIGATION & DISCOVERY:**
• Top-Down Traversal:
  - Get workspaces → Find the environment
  - List Monday boards → Find specific "Table" (Board)
  - List groups → Find "Section" (Group) within Board
• Finding Data:
  - Use List board items to get high-level overview
  - Use List columns to understand data types (Text, Number, People, Status) available on that board

**ITEM MANIPULATION (ROWS):**
• Creation:
  - Use Create item
  - Requirement: You need board_id - Ideally, you also provide group_id to place it correctly; otherwise, it lands in default top group
• Simple Updates (Text/Status/Dropdown):
  - Use Change simple column value
  - Why: It accepts simple strings - This is efficient for "Mark as Done" or "Set Priority High"
• Complex Updates (People/Timeline/Date):
  - Use Update item
  - Complexity: This requires JSON string for column_values parameter
  - Example (People): {"people_1": {"personsAndTeams": [{"id": 12345, "kind": "person"}]}}
  - Note: You must lookup User IDs via List users before assigning them

**STRUCTURE MANAGEMENT:**
• New Architecture:
  - Use Create a Monday board to start new project
  - Use Create column and Create group to define schema and workflow stages

**PARAMETER CONSTRAINTS & VALIDATION:**
• column_values: Must be JSON string, not dictionary object
• group_id: Required for creating items in specific sections - If omitted, item appears at very top of board
• Data Types:
  - Status: String value must match one of defined labels exactly (e.g., "Done", "Working on it") - If create_labels_if_missing is false, invalid strings will fail
  - Date: ISO format YYYY-MM-DD

**ERROR HANDLING:**
• "Column ID not found": You likely used column Title (e.g., "Status") instead of ID (e.g., "status5")
• "User not found": You cannot assign user by name string "Alice" - You must use integer ID
• "Complexity Budget": Monday.com API has complexity limit - If fetching List board items for massive board, it might fail - Suggest filtering or pagination

**DECISION TREE EXAMPLES:**
User Request: "Add a task 'Fix API Bug' to the 'Bugs' group on the 'Engineering' board"
Reasoning & Execution:
1. Find Board: List Monday boards → Find "Engineering" (board_id: 101)
2. Find Group: List groups (board_id: 101) → Find "Bugs" (group_id: "topics")
   - Note: Group IDs are often strings like "topics", "new_group", or UUIDs
3. Action: Create item (item_name="Fix API Bug", board_id=101, group_id="topics")

User Request: "Change the status of the 'Login' task to 'Done'"
Reasoning & Execution:
1. Find Task: List board items (board_id: 101) → Find "Login" (item_id: 999)
2. Find Column: List columns (board_id: 101) → Find column titled "Status" → It is status_column
3. Action: Change simple column value (item_id=999, board_id=101, column_id="status_column", value="Done")

User Request: "Assign Alice to the 'Homepage' task"
Reasoning & Execution:
1. Resolve User: List users → Find "Alice" (user_id: 555)
2. Resolve Column: List columns → Find "Owner" column (people_column)
3. Action: Update item (item_id=..., board_id=..., column_values='{"people_column": {"personsAndTeams": [{"id": 555, "kind": "person"}]}}')
"""


def get_linear_context() -> str:
    """Linear - Issue tracking automation specialist"""
    return """
🎯 **LINEAR GRAPH ARCHITECT**

**THE GOLDEN RULE OF SCOPED RESOLUTION:**
Global Names do not exist - A state named "In Progress" is not global constant. It is specific object with unique UUID that exists only within context of specific Team
• Protocol:
  1. Resolve Scope (Shard): Identify team_id first - Almost all write operations require valid Team UUID
  2. Map Schema: Once inside Team scope, use "List" or "Get" tools to map human-readable names (e.g., "Cycle 42", "Done") to their specific UUIDs
  3. Execute Mutation: Perform actions using resolved UUIDs only

**DISCOVERY & TOPOLOGY (THE LOOKUP PHASE):**
• Root Traversal: Start with Get all teams - You cannot route issue without knowing which Team (Shard) it belongs to (e.g., "Engineering" vs. "Design")
• State Mapping (CRITICAL):
  - To move issue, you must fetch valid state options for its team using List Linear states
  - Why? UUID for "In Progress" in Backend Team is completely different from UUID for "In Progress" in Frontend Team
• User Resolution: Use List Linear users or Get current user to resolve names to assignee_id UUIDs

**ISSUE LIFECYCLE (THE STATE MACHINE):**
• Instantiation (Create linear issue):
  - Mandatory: team_id and title
  - Optional (but recommended): priority (1=Urgent, 4=None), assignee_id, and cycle_id
• State Transitions:
  - Use Update issue to change status
  - Constraint: You must supply state_id - Never attempt to pass string like "Done" to API
• Iterative Work:
  - Use Get cycles by team ID to find "Active" cycle UUID for sprint planning

**ADVANCED QUERYING (GRAPHQL PASSTHROUGH):**
• Fallback: If specific "Get" or "List" tool does not exist (e.g., finding issue by custom field), use Run Query or Mutation
• Syntax: Write valid GraphQL
  - Example: query { issues(filter: { title: { contains: "Bug" } }) { nodes { id title } } }

**PARAMETER CONSTRAINTS & VALIDATION:**
• priority: Integer scale: 0 (No Priority), 1 (Urgent), 2 (High), 3 (Normal), 4 (Low)
• team_id: The fundamental foreign key - If user doesn't specify team, you must ask for it
• issue_id vs identifier:
  - identifier = "ENG-123" (Human readable)
  - id = UUID (Machine readable)
  - Note: Most update tools require UUID - Always resolve ENG-123 to UUID first

**ERROR HANDLING & LIMITATIONS:**
• "State not found": You likely used State ID from Team A while trying to update issue in Team B - State IDs are not polymorphic
• "Resource not found": Check your UUIDs - Linear is strictly typed; Cycle UUID cannot be passed into Project ID field
• "Drafts": If user is "brainstorming," use Manage draft or List issue drafts - Do not clutter live board with half-baked ideas unless explicitly told to

**DECISION TREE EXAMPLES:**
User Request: "Create a high-priority bug in the Core team about 'Memory Leaks' and assign it to Sarah"
Reasoning & Execution:
1. Resolve Team: Get all teams → Find "Core" (ID: team_core_123)
2. Resolve User: List Linear users → Find "Sarah" (ID: user_sarah_456)
3. Action: Create linear issue (team_id="team_core_123", title="Memory Leaks", priority=1, assignee_id="user_sarah_456")

User Request: "Move the issue ENG-101 to 'Code Review'"
Reasoning & Execution:
1. Hydrate Context: Get Linear issue (ID/Key: "ENG-101") → Returns issue object containing team_id: "team_eng_999"
2. Resolve State Schema: List Linear states (team_id: "team_eng_999") → Found "Code Review" (ID: state_review_777)
3. Action: Update issue (issue_id="[UUID_FROM_STEP_1]", state_id="state_review_777")

User Request: "What issues are in the current cycle for the API team?"
Reasoning & Execution:
1. Resolve Team: Get all teams → Find "API" (ID: team_api_888)
2. Find Active Cycle: Get cycles by team ID (team_id: team_api_888) → Filter results for isCurrent: true → (Cycle ID: cycle_abc_123)
3. Query Issues: Run Query or Mutation - query { cycle(id: "cycle_abc_123") { issues { nodes { title identifier state { name } } } } }
"""


def get_figma_context() -> str:
    """Figma - Design operations automation specialist"""
    return """
🎨 **FIGMA DESIGN OPERATIONS SPECIALIST**

**THE GOLDEN RULE OF DISCOVERY:**
Never Guess IDs - You cannot access file named "Homepage" by typing "Homepage". You need its file_key (e.g., AbC123XyZ)
• The "Discover" Tool:
  - If user provides URL: Use Discover Figma Resources to extract file_key and node_id
  - If user provides name: Use Discover Figma Resources to browse Team/Project structure until you find it
• Nodes vs. Files:
  - File: The entire canvas (file_key)
  - Node: A specific frame, button, or layer (node_id, e.g., 1:2)

**INSPECTING DESIGNS (READING):**
• High-Level Structure:
  - Use Get file json with simplify=True
  - Why: Raw API returns massive JSONs - Simplified version gives you "AI-friendly" tree of layers and text
• Visuals:
  - Use Render images of file nodes or Download Figma Images
  - Use Case: "Show me the 'Submit' button" → Render node 1:5
• Design Systems:
  - Use Extract design tokens to get colors, fonts, and spacing in code-ready format

**FEEDBACK & COLLABORATION:**
• Commenting:
  - Use Add a comment to a file
  - Precision: If possible, attach comment to specific node_id or coordinates (client_meta) so designer knows exactly where to look
• Dev Handoff:
  - Use Create dev resources to attach Jira ticket or GitHub PR to specific frame (node_id)

**DESIGN LOGIC (VARIABLES & STYLES):**
• Variables (Advanced):
  - Use Get local variables to see logic (e.g., "Light Mode" vs "Dark Mode")
  - Use Create, modify, or delete variables to update values (e.g., changing color token globally)

**PARAMETER CONSTRAINTS & VALIDATION:**
• file_key: Alphanumeric string found in URL
• node_id: Usually formatted as Number:Number (e.g., 0:1, 123:456) - Use Discover Figma Resources to find these; do not guess
• Colors: Figma often uses RGBA floats (0.0 to 1.0) instead of 0-255 - Extract design tokens handles this conversion for you

**ERROR HANDLING:**
• "File Not Found": User might not have shared file with integration - Ask them to invite your service account email to file
• "Node Not Found": Nodes can be deleted or renamed - Always refresh file structure (Get file json) if node ID fails
• "Rate Limit": Figma API is strict - If inspecting massive file, try to fetch only specific pages or nodes if possible

**DECISION TREE EXAMPLES:**
User Request: "Get the colors from the 'Dashboard' file (https://figma.com/file/xyz/Dashboard)"
Reasoning & Execution:
1. Extract Key: Discover Figma Resources (figma_url="https://figma.com/file/xyz/Dashboard") → Returns file_key="xyz"
2. Extract Tokens: Extract design tokens (file_key="xyz")

User Request: "Add a comment on the 'Login' frame saying 'Update this icon'"
Reasoning & Execution:
1. Find Frame: Get file json (file_key="...") → Search JSON for node named "Login" → Get node_id="10:20"
2. Post Comment: Add a comment to a file (file_key="...", message="Update this icon", client_meta={"node_id": "10:20"})

User Request: "Export the 'Hero Image' as a PNG"
Reasoning & Execution:
1. Find Node: Get file json → Find "Hero Image" → node_id="5:5"
2. Render: Download Figma Images (file_key="...", nodes=["5:5"], format="png")
"""


def get_canva_context() -> str:
    """Canva - Graphic design automation specialist"""
    return """
🎨 **CANVA PIPELINE MANAGER**

**THE GOLDEN RULE OF ASYNC PROCESSING:**
Trigger ≠ Result - Asking to "Upload an image" or "Export a design" does NOT return the file. It returns a job_id
• Protocol:
  1. Initiate: Call creation tool (Upload, Export, Resize, Import)
  2. Capture: Extract job_id from immediate response
  3. Poll (The Loop): You must check status endpoint repeatedly until status equals success or failed
  4. Resolve: Only when success is confirmed do you retrieve final asset_id or download_url

**ASSET INGESTION (THE "UPLOAD" QUEUE):**
• Direct Upload: Use Create Asset Upload Job for local files
• Remote Ingestion: Use Create URL Asset Upload Job to pull from public web links without downloading locally first
• Post-Processing: Once async job finishes and you have asset_id, you can use Update asset s name and tags by id to organize it for searchability

**DESIGN COMPOSITION & MODIFICATION:**
• Instantiation:
  - Fresh: Use Create canva design with optional asset to start from blank or specific image
  - Import: Use Create Design Import Job to convert PDF/PSD/PPTX into editable Canva designs (Async)
  - Templating (Enterprise): Use Initiate canva design autofill job to programmatically inject data into Brand Templates
• Mutation:
  - Resizing: Use Create Design Resize Job to generate variants (e.g., turning Instagram Post into Story)
  - Collaboration: Use Create design comment in preview api to leave feedback

**STRUCTURE & ORGANIZATION (THE FILE SYSTEM):**
• Folder Traversal: Use List folder items by type with sorting - You must distinguish between folder, design, and asset
• Relocation: Use Move item to specified folder
  - Constraint: You cannot "move" file by updating its metadata - You must physically call move endpoint with design_id and destination folder_id

**EXPORT & EXTRACTION (THE "RENDER" QUEUE):**
• Rendering: Use Create Canva Design Export Job
• Parameters: You must specify format (pdf, jpg, mp4) and quality
• Final Delivery: Result of polling loop is temporary download_url - Provide this link to user immediately, as it expires

**PARAMETER CONSTRAINTS & VALIDATION:**
• job_id vs design_id: Do not confuse these - You cannot ask for status of design_id. You cannot "open" a job_id
• Export Formats: Valid values are typically jpg, png, pdf, pptx, gif, mp4
• Preview APIs: Tools labeled "Preview API" (like Comments) are volatile - If they fail, inform user feature might be temporarily unavailable

**ERROR HANDLING:**
• "Job Failed": If polling result is failed, look for error object in response and report specific reason (e.g., "File too large", "Unsupported format") to user
• "404 on Download Link": Remind user that export links are temporary - If they wait too long, you must run Export Job again
• "Permission Denied": Many features (Autofill, Brand Templates, Resizing) are gated behind Canva Enterprise/Pro - If endpoint fails with 403, check user's subscription tier capabilities

**DECISION TREE EXAMPLES:**
User Request: "Upload 'logo.png' and give me the ID so I can use it"
Reasoning & Execution:
1. Initiate Job: Create Asset Upload Job → Returns job_id: "job_upload_123"
2. Poll Status: Fetch asset upload job status (id: "job_upload_123") → status: "in_progress" → WAIT → Retry: status: "success", asset: { id: "asset_xyz_789" }
3. Final Output: "Upload complete. The Asset ID is asset_xyz_789"

User Request: "Convert the 'Q3 Report' design to a PDF"
Reasoning & Execution:
1. Search (Optional): List User Designs → Find "Q3 Report" (ID: design_abc_555)
2. Initiate Export: Create Canva Design Export Job (design_id="design_abc_555", format="pdf") → Returns job_id: "job_export_999"
3. Poll Status: Get design export job result (id: "job_export_999") → status: "success", urls: ["https://canva-download..."]
4. Action: Provide URL to user

User Request: "Move all designs from the 'Drafts' folder to 'Final'"
Reasoning & Execution:
1. Resolve Paths: Retrieve folder details (or List folders) to get IDs for "Drafts" (folder_A) and "Final" (folder_B)
2. List Contents: List folder items by type (folder_id: folder_A)
3. Iterate & Move: Filter for items where type == "design" → Move item to specified folder (item_id: design_1, to_folder: folder_B) → Move item to specified folder (item_id: design_2, to_folder: folder_B)
"""


def get_todoist_context() -> str:
    """Todoist - Task management automation specialist"""
    return """
✅ **TODOIST HIERARCHY ARCHITECT**

**THE GOLDEN RULE OF ID RESOLUTION:**
UI Names ≠ API IDs - A project named "Work" is an object with specific project_id (e.g., 220474322). A label named "Urgent" is an object with label_id
• Protocol:
  1. Query: Use "Get" or "List" tools to map human-readable names to IDs
  2. Resolve: Extract specific integer/UUID
  3. Execute: Perform mutations (Create, Update, Delete) using only resolved IDs

**DISCOVERY & TRAVERSAL (THE "SELECT" QUERIES):**
• Project Level: Use Get all projects to build root map - You cannot interact with project without its project_id
• Section Level: Once project_id is resolved, use Get All Sections to map internal structure
• Task Level (The Filter Engine):
  - Get All Tasks is your primary query engine
  - Crucial Limitation: This tool ONLY returns INCOMPLETE (active) tasks - It returns null for completed history
  - Query Logic: Use filter parameter to simulate SQL-like queries (e.g., filter="#Work & today", filter="@urgent")

**ITEM MANIPULATION (CRUD):**
• Creation (Create task):
  - Routing: Always prefer specifying project_id and section_id to place data correctly - If omitted, it lands in "Inbox"
  - NLP Parsing: Content field supports natural language processing (e.g., "Buy milk tomorrow at 10am") which API automatically parses into due dates
• State Change:
  - Completion: Use Close Task - This is one-way state transition out of active view
  - Restoration: Use Reopen Task if task ID is known but currently inactive
• Mutation:
  - Use Update Task for content, priority, or due date changes
  - Note: You cannot move task to different project via Update Task; you must typically re-create or use specific move endpoints if available (currently not in toolset, implies re-creation logic if requested)

**STRUCTURE MANAGEMENT (SCHEMA):**
• Namespace Definition: Use Create Project to define high-level containers
• Segmentation: Use Create Section to partition projects (e.g., "To Do", "In Progress", "Done" kanban style)
• Tagging: Use Create Label for cross-project metadata

**PARAMETER CONSTRAINTS & VALIDATION:**
• task_id / project_id: Must be numeric integers or string representations of integers
• filter (in Get All Tasks):
  - Correct: today, overdue, #ProjectName, p1 (Priority 1)
  - Incorrect: completed (API will fail or return empty)
• priority: Integers 1 (Normal) to 4 (Urgent) - Note: Todoist UI reverses this (P1 is highest), but API treats 4 as highest urgency

**ERROR HANDLING & LIMITATIONS:**
• "Task not found": Task is likely already completed - Remember, Get All Tasks has visibility scope set to active only
• "Ambiguous Reference": If filter="Buy" returns 5 tasks, do not delete/close one at random - Ask user to clarify which specific task to act upon
• "Missing ID": Never hallucinate an ID - If you cannot resolve Name to ID via available tools, stop and ask user

**DECISION TREE EXAMPLES:**
User Request: "Add a task 'Fix Bug' to the 'Backend' section of the 'Agent Studio' project"
Reasoning & Execution:
1. Resolve Project: Get all projects → Find "Agent Studio" (ID: 111)
2. Resolve Section: Get All Sections (project_id=111) → Find "Backend" (ID: 222)
3. Action: Create task (content="Fix Bug", project_id=111, section_id=222)

User Request: "Mark the task about 'Docker' as done"
Reasoning & Execution:
1. Search (Query): Get All Tasks (filter="Docker") → Found task "Update Docker Container" (ID: 999)
2. Action: Close Task (task_id=999)

User Request: "Delete the 'Temporary' label"
Reasoning & Execution:
1. Resolve Label: Check if Get All Tasks returns label metadata, or ask user for ID - Assumption: If user provided ID 555
2. Action: Delete Label (label_id=555)
"""


def get_outlook_context() -> str:
    """Outlook - Email and calendar automation specialist"""
    return """
📧 **OUTLOOK EMAIL & CALENDAR SPECIALIST**

**THE GOLDEN RULE OF ODATA & TIME:**
UTC is the Universal Truth - API usually returns times in UTC. When talking to user, you must convert this to their local time (using Get supported time zones or context)
• Filtering: You have two search tools. Know when to use which:
  - Query Emails (OData): Precise metadata filtering - Use for "Unread emails," "Emails from last week," "High importance"
  - Search Outlook messages (KQL): Full-text search - Use for "Emails about 'Project Alpha'," "From: Bob body:'budget'"

**CALENDAR MANAGEMENT:**
• Scheduling:
  - Use Create Calendar Event
  - Critical: start_datetime and end_datetime must be strings in ISO format (e.g., 2023-10-27T14:00:00)
  - Timezones: Always specify timezone, or API might assume UTC and schedule meeting at 3 AM
• Availability:
  - "Am I free?": Use Get schedule (Free/Busy) or Get Calendar View (List of actual events)
  - Recommendation: Get Calendar View is better for "What is on my calendar?", while Get schedule is better for "Find a time for a meeting"

**EMAIL OPERATIONS:**
• Reading:
  - Use Get mail delta for syncing (advanced) or List Messages for general browsing
  - Use Search Outlook messages if user is looking for something specific
• Writing:
  - New Email: Send email
  - Reply: Reply to Email (Simple text) or Create a draft reply (Complex/HTML, allows review)
  - Attachments:
    - Small: Pass directly in Send email
    - Large: You generally can't handle >3MB files easily in one go - Stick to text unless user provides small file link

**ORGANIZATION:**
• Rules & Folders:
  - Use Create Email Rule to automate filing
  - Use Move message to folder to organize
  - Context: You often need to find folder_id first using List mail folders before moving a message

**PARAMETER CONSTRAINTS & VALIDATION:**
• message_id / event_id: These are long, case-sensitive strings - Never truncate them
• Email Addresses: Must be valid - Multiples are usually separated by semi-colons or passed as JSON list depending on tool
• Body Format: content_type usually defaults to "Text" but "HTML" is supported if you want to send bold/lists

**ERROR HANDLING:**
• "Resource Not Found": Message might have been moved or deleted - Try searching again
• "Timezone Error": If API complains about time formats, ensure you are sending ISO string without 'Z' at end if you are also passing time_zone parameter, or with 'Z' if passing UTC

**DECISION TREE EXAMPLES:**
User Request: "Schedule a 30-min call with Alice at 2pm tomorrow"
Reasoning & Execution:
1. Calculate Time: Tomorrow 2 PM = 2023-10-25T14:00:00. End = 14:30:00
2. Action: Create Calendar Event (subject="Call with Alice", start_datetime="...", end_datetime="...", attendees=["alice@example.com"])

User Request: "Find that email from John about the 'Budget' and forward it to Sarah"
Reasoning & Execution:
1. Search: Search Outlook messages (Query: from:John subject:Budget) → Returns message_id_123
2. Forward: Forward message (message_id="message_id_123", to_recipients=["sarah@example.com"])

User Request: "What's my first meeting today?"
Reasoning & Execution:
1. Define Window: Today Start (00:00) to Today End (23:59)
2. Fetch View: Get Calendar View (start_datetime="...", end_datetime="...")
3. Process: Sort by start time and return first one
"""


def get_facebook_context() -> str:
    """Facebook - Page management automation specialist"""
    return """
📘 **FACEBOOK PAGE AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF PAGE SCOPE:**
Identity Check - Before acting, you must know which Page you are controlling
• Use List Managed Pages or Get User Pages to see available pages
• Most actions require page_id and page_access_token (handled by system, but you must select correct Page ID)
• The "Like" Constraint: API allows you to retrieve all reaction types (Love, Haha, Wow), but you can only give one reaction type: LIKE
  - If user asks: "Heart this comment," you must execute a Like or explain the limitation

**PUBLISHING & CONTENT:**
• Text Posts: Use Create Post (Params: message, page_id)
• Visual Content:
  - Single Photo: Use Create Photo Post (URL) or Upload Photo (file)
  - Video: Use Create Video Post (URL) or Upload Video (File)
  - Multi-Photo (Albums):
    1. Create Photo Album (Optional, or use existing)
    2. Upload Photos Batch or Add Photos to Album
• Scheduling: You can schedule posts for future by adding scheduled_publish_time (Unix timestamp) to Create Post action
  - To manage: Use Get Scheduled Posts and Publish Scheduled Post

**COMMUNITY MANAGEMENT (COMMENTS & DMs):**
• Public Engagement:
  - Reading: Get Page Posts → Get Comments (for specific post)
  - Replying: Create Comment (requires object_id—the ID of post or comment you are replying to)
  - Reacting: Add Reaction (Default: LIKE)
• Private Messaging (Messenger):
  - Context: You generally respond to inbound messages - Cannot spam users who haven't interacted with Page
  - Workflow:
    1. Get Page Conversations (Find thread)
    2. Get Conversation Messages (Read history)
    3. Send Message (Text) or Send Media Message (Image/Video)

**ANALYTICS (INSIGHTS):**
Distinguish between Whole Page and Specific Post
• "How is my page doing?": Use Get Page Insights
  - Metrics: page_impressions, page_fans, page_views_total
• "How did that link post perform?": Use Get Post Insights
  - Metrics: post_impressions, post_clicks, post_reactions_by_type_total

**PARAMETER CONSTRAINTS & VALIDATION:**
• object_id: Generic term in Facebook - Can be post_id, comment_id, or photo_id - Ensure you are using ID of specific item you want to interact with
• Video Limits: Large video uploads (>100MB) via Upload Video use resumable protocol automatically - For Create Video Post (via URL), ensure server hosting video allows Facebook's crawler to access it
• Search Limitations: Search Pages often returns error #10 unless app has specific high-level permissions ("Page Public Content Access") - If this fails, inform user they need App Review approval

**ERROR HANDLING:**
• "Permissions Error": If Create Post fails, check if page_access_token is valid or if user only has "Analyst" role (view only) vs. "Editor/Admin" role (can post)
• "Spam Filter": If Send Message fails, user might have blocked page or 24-hour messaging window has closed
• "Unsupported Request": If you try to Add Reaction with type="LOVE", API will likely fail or default to LIKE - Stick to LIKE

**DECISION TREE EXAMPLES:**
User Request: "Reply to the top comment on my last post saying 'Thanks!'"
Reasoning & Execution:
1. Find Post: Get Page Posts (limit: 1) → Get post_id
2. Find Comment: Get Comments (object_id: post_id) → Get comment_id of first/top result
3. Action: Create Comment (object_id="[comment_id]", message="Thanks!")

User Request: "Post a video of our new product (http://vid.mp4) and schedule it for tomorrow at 9 AM"
Reasoning & Execution:
1. Time Calculation: Calculate Unix timestamp for "Tomorrow 9 AM" → 1730000000
2. Action: Create Video Post (file_url="http://vid.mp4", description="New Product Launch!", scheduled_publish_time=1730000000, published=false)

User Request: "Who manages this page? I need to remove John"
Reasoning & Execution:
1. Audit Roles: Get Page Roles (page_id: "...")
2. Review: Identify user ID associated with "John"
3. Action: Remove Page Task (page_id="...", user_id="[John's ID]")
"""


def get_googlemeet_context() -> str:
    """Google Meet - Video conferencing automation specialist"""
    return """
🎥 **GOOGLE MEET AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF MEET vs CALENDAR:**
• You do NOT schedule meetings: "Schedule meeting for 2 PM" = CALENDAR task
• You generate Spaces: Create the virtual room (URL)
• You retrieve Artifacts: Fetch transcripts, recordings, attendance from past calls

**ID HIERARCHY:**
1. meeting_space/meeting_code: Permanent ID (abc-defg-hij) for joining/config
2. conference_record_id: Specific instance ID (call that happened on Oct 12th)
   - CRITICAL: Transcripts and recordings attach to record_id, NOT meeting code

**CREATING MEETING ROOMS (Instant):**
• "Need a link now": Use Create a Meet
  - Returns: meetingUri (link) + meetingCode
  - Config: Set access controls (Open to everyone vs Restricted)

**RETRIEVING ARTIFACTS (Transcripts & Recordings):**
Cannot "get transcript for meeting code ABC" - must find specific record first
Workflow:
1. Find Record: List Conference Records
   - Filter: filter="start_time > '2023-01-01'" or by meeting_code
2. Select ID: Pick conference_record_id matching user's timeframe
3. Fetch Artifact:
   - Get transcripts by conference record ID (text)
   - Get recordings by conference record ID (video files)

**ANALYTICS & ATTENDANCE:**
• "Who was on call?":
  1. Find conference_record_id (List Conference Records)
  2. List Participant Sessions
  - Output: Shows sessions (join/leave times)
  - Note: User rejoined = appears twice, must consolidate

**PARAMETER RULES:**
• meeting_code: Format 3-4-3 characters (abc-defg-hij)
• Filters: List Conference Records uses specific string filters - careful with dates
• Latency: Transcripts/recordings not immediate - wait few minutes after meeting ends

**ERROR HANDLING:**
• No recording found: Meeting may not have been recorded (API returns empty)
• Invalid space name: Use full resource name (spaces/abc-defg-hij), not just code
• 404 on artifacts: Meeting just ended - warn user to wait

**EXAMPLE WORKFLOWS:**
User: "Create meeting link for client call"
1. Use Create a Meet
2. config={"accessType": "TRUSTED"} (safe default)

User: "Get transcript from standup this morning"
1. List Conference Records filter="start_time >= '[Today]T00:00:00Z'"
2. Find record with space_name="Daily Standup" → conf_123
3. Get transcripts by conference record ID: conf_123

User: "Did John attend All-Hands last Friday?"
1. List Conference Records (search All-Hands in timeframe)
2. List Participant Sessions (conference_record_id)
3. Search returned list for "John Doe"
"""


def get_googleslides_context() -> str:
    """Google Slides - Presentation software automation specialist"""
    return """
📽️ **GOOGLE SLIDES AUTOMATION SPECIALIST**

**THE GOLDEN RULE OF ABSTRACTION:**
Content over Coordinates - Raw API requires X/Y positioning which is brittle for AI.
• ALWAYS prefer MARKDOWN tools over raw API
• Think in "Title", "Bullet Points", "Images" NOT "pixels"
• Use --- (triple dash) to separate slides

**CREATING NEW PRESENTATIONS:**
• One-Shot Method (BEST): Use Create Slides from Markdown
  - Input: title + markdown="# Agenda\\n* Item 1\\n* Item 2\\n---\\n# Data\\n..."
  - Why: Creates file AND populates it in one go, applies smart layouts automatically
• Manual Method:
  1. Create Google Slides Presentation → get ID
  2. Update Presentation (Batch/Markdown) → add content

**EDITING & UPDATING:**
• Append Slides: Use Update Presentation (Batch/Markdown)
  - Action: Provide new markdown, tool handles insertion
• Modify Existing: Cannot easily "edit word 3 on slide 5"
  - Strategy: DELETE bad slide + APPEND corrected version (easier than patching)

**INSPECTION & VISUALS:**
• "What does Slide 3 look like?": Use Get Page Thumbnail → returns image URL
• "Read content": Use Get Presentation or Get Presentation Page
  - WARNING: JSON response is huge - only request specific pages if possible

**FORMATTING SYNTAX (Markdown++):**
• Slide Separator: --- (must be on own line)
• Titles: # Main Title (first line of slide)
• Subtitles/Body: Standard text below title
• Bullets: * Item or - Item
• Images: ![Alt Text](https://image-url.com)
  - Tool auto-fits image to layout (Title and Content vs Title and Two Columns)

**PARAMETER RULES:**
• Image URLs: Must be publicly accessible (local file paths fail)
• Slide Count: Keep under ~20 slides per batch for stability
• Templates: Markdown tool applies default "Professional" theme
  - Cannot change master theme (Dark Mode) via Markdown alone

**ERROR HANDLING:**
• Invalid format: Check for missing --- separator or misplaced image links
• 404 not found: Verify presentation_id (long and case-sensitive)

**EXAMPLE WORKFLOWS:**
User: "Make pitch deck for StartUp X: Title, Problem, Solution"
1. Draft content:
   - Slide 1: # StartUp X\\n**Pitch Deck**
   - Slide 2: # The Problem\\nCurrent solutions too slow
   - Slide 3: # The Solution\\nOur AI is 10x faster
2. Create Slides from Markdown: title="StartUp X Pitch" + markdown=[content joined by ---]

User: "Add Thank You slide to Q3 Report presentation"
1. Have presentation_id from context/search
2. Update Presentation: presentation_id + markdown="# Thank You\\nAny questions?"
"""


# === CONTEXT REGISTRY ===
# Maps app names (from composio_config.py) to their context functions

CONTEXT_REGISTRY: Dict[str, Callable[[], str]] = {
    "GMAIL": get_gmail_context,
    "GOOGLEDRIVE": get_googledrive_context,
    "GOOGLECALENDAR": get_googlecalendar_context,
    "SLACK": get_slack_context,
    "TWITTER": get_twitter_context,
    "INSTAGRAM": get_instagram_context,
    "LINKEDIN": get_linkedin_context,
    "GITHUB": get_github_context,
    "NOTION": get_notion_context,
    "ASANA": get_asana_context,
    "ZOOM": get_zoom_context,
    "SHOPIFY": get_shopify_context,
    "STRIPE": get_stripe_context,
    "AIRTABLE": get_airtable_context,
    "REDDIT": get_reddit_context,
    "WHATSAPP": get_whatsapp_context,
    "GOOGLEDOCS": get_googledocs_context,
    "GOOGLESHEETS": get_googlesheets_context,
    "CLICKUP": get_clickup_context,
    "DROPBOX": get_dropbox_context,
    "MONDAY": get_monday_context,
    "LINEAR": get_linear_context,
    "FIGMA": get_figma_context,
    "CANVA": get_canva_context,
    "TODOIST": get_todoist_context,
    "OUTLOOK": get_outlook_context,
    "FACEBOOK": get_facebook_context,
    "GOOGLEMEET": get_googlemeet_context,
    "GOOGLESLIDES": get_googleslides_context,
}


def get_app_context(app_name: str) -> str:
    """
    Get expert context for a specific app.

    Args:
        app_name: Application name (e.g., "GMAIL", "SLACK")

    Returns:
        Context string with guidance for that app, or empty string if not found
    """
    context_func = CONTEXT_REGISTRY.get(app_name.upper())
    if context_func:
        try:
            return context_func()
        except Exception as e:
            print(f"⚠️  Error getting context for {app_name}: {e}")
            return ""
    return ""


def get_contexts_for_connected_apps(connected_apps: list) -> str:
    """
    Get combined context for all connected apps.

    Args:
        connected_apps: List of app names (e.g., ["GMAIL", "SLACK", "GOOGLEDRIVE"])

    Returns:
        Combined context string with guidance for all connected apps
    """
    if not connected_apps:
        return ""

    contexts = []
    contexts.append("\n" + "="*80)
    contexts.append("📚 APPLICATION-SPECIFIC GUIDANCE")
    contexts.append("="*80)
    contexts.append("Below is expert guidance for each connected application.\n")

    for app in connected_apps:
        context = get_app_context(app)
        if context:
            contexts.append(context)

    contexts.append("="*80 + "\n")

    return "\n".join(contexts)
