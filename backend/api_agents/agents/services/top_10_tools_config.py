"""
Top 10 Most Commonly Used Tools Per App
========================================

This configuration defines the TOP 10 most useful/commonly used tools for each app.
These are loaded by default in Phase 2.5 optimization for fast, lightweight tool access.

Selection Criteria:
- Most frequently used actions (create, read, update, delete)
- Core functionality users need daily
- High-impact operations (send, post, schedule, search)

If these 10 tools don't cover the user's request, the system falls back to
select_tools_for_prompt() for precise tool selection.
"""

TOP_10_TOOLS_BY_APP = {
    "TWITTER": [
        "TWITTER_CREATION_OF_A_POST",  # Post tweet
        "TWITTER_UPLOAD_MEDIA",  # Upload image/video (≤5MB)
        "TWITTER_UPLOAD_LARGE_MEDIA",  # Upload large image/video (>5MB)
        "TWITTER_GET_USERS_TWEETS_BY_ID_OR_USERNAME",  # Get tweets
        "TWITTER_SEARCH_TWEETS",  # Search tweets
        "TWITTER_DELETE_TWEET",  # Delete tweet
        "TWITTER_LIKE_TWEET",  # Like tweet
        "TWITTER_RETWEET_TWEET",  # Retweet
        "TWITTER_GET_USER_BY_USERNAME",  # Get user info
        "TWITTER_GET_TWEET_BY_ID",  # Get specific tweet
        "TWITTER_GET_FOLLOWERS_OF_A_USER",  # Get followers
    ],

    "GMAIL": [
        "GMAIL_SEND_EMAIL",  # Send email
        "GMAIL_FETCH_EMAILS",  # Fetch emails
        "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID",  # Get specific email
        "GMAIL_SEARCH_EMAILS",  # Search emails
        "GMAIL_CREATE_EMAIL_DRAFT",  # Create draft
        "GMAIL_REPLY_TO_THREAD",  # Reply to thread
        "GMAIL_DELETE_MESSAGE",  # Delete email
        "GMAIL_ADD_LABEL_TO_EMAIL",  # Add label
        "GMAIL_GET_PROFILE",  # Get profile
        "GMAIL_GET_ATTACHMENT",  # Get attachment
    ],

    "GITHUB": [
        "GITHUB_ISSUES_CREATE",  # Create issue
        "GITHUB_ISSUES_LIST_FOR_REPO",  # List issues
        "GITHUB_ISSUES_UPDATE",  # Update issue
        "GITHUB_PULLS_CREATE",  # Create PR
        "GITHUB_PULLS_LIST",  # List PRs
        "GITHUB_REPOS_CREATE_FOR_AUTHENTICATED_USER",  # Create repo
        "GITHUB_REPOS_LIST_FOR_AUTHENTICATED_USER",  # List repos
        "GITHUB_REPOS_GET_CONTENT",  # Get file content
        "GITHUB_REPOS_CREATE_OR_UPDATE_FILE_CONTENTS",  # Create/update file
        "GITHUB_USERS_GET_AUTHENTICATED",  # Get user info
    ],

    "SLACK": [
        "SLACK_CHAT_POST_MESSAGE",  # Send message
        "SLACK_CONVERSATIONS_LIST",  # List channels
        "SLACK_CONVERSATIONS_HISTORY",  # Get channel history
        "SLACK_USERS_LIST",  # List users
        "SLACK_FILES_UPLOAD",  # Upload file
        "SLACK_REACTIONS_ADD",  # Add reaction
        "SLACK_CONVERSATIONS_CREATE",  # Create channel
        "SLACK_USERS_INFO",  # Get user info
        "SLACK_SEARCH_MESSAGES",  # Search messages
        "SLACK_CHAT_DELETE",  # Delete message
    ],

    "GOOGLEDRIVE": [
        "GOOGLEDRIVE_CREATE_FILE",  # Create file
        "GOOGLEDRIVE_FIND_FILE",  # Find file
        "GOOGLEDRIVE_GET_FILE",  # Get file
        "GOOGLEDRIVE_UPDATE_FILE",  # Update file
        "GOOGLEDRIVE_DELETE_FILE",  # Delete file
        "GOOGLEDRIVE_DOWNLOAD_FILE",  # Download file
        "GOOGLEDRIVE_CREATE_FOLDER",  # Create folder
        "GOOGLEDRIVE_LIST_FILES",  # List files
        "GOOGLEDRIVE_SHARE_FILE",  # Share file
        "GOOGLEDRIVE_COPY_FILE",  # Copy file
    ],

    "GOOGLECALENDAR": [
        "GOOGLECALENDAR_CREATE_EVENT",  # Create event
        "GOOGLECALENDAR_FIND_EVENT",  # Find event
        "GOOGLECALENDAR_FIND_FREE_SLOTS",  # Find free slots
        "GOOGLECALENDAR_GET_UPCOMING_EVENTS",  # Get upcoming events
        "GOOGLECALENDAR_UPDATE_EVENT",  # Update event
        "GOOGLECALENDAR_DELETE_EVENT",  # Delete event
        "GOOGLECALENDAR_LIST_CALENDARS",  # List calendars
        "GOOGLECALENDAR_GET_EVENT",  # Get event details
        "GOOGLECALENDAR_QUICK_ADD_EVENT",  # Quick add event
        "GOOGLECALENDAR_SEARCH_EVENTS",  # Search events
    ],

    "GOOGLEDOCS": [
        "GOOGLEDOCS_CREATE_DOCUMENT",  # Create document
        "GOOGLEDOCS_GET_DOCUMENT_CONTENT",  # Get content
        "GOOGLEDOCS_WRITE_TO_DOCUMENT_USING_MARKDOWN",  # Write markdown
        "GOOGLEDOCS_APPEND_TO_DOCUMENT",  # Append content
        "GOOGLEDOCS_FIND_DOCUMENT",  # Find document
        "GOOGLEDOCS_UPDATE_DOCUMENT",  # Update document
        "GOOGLEDOCS_DELETE_DOCUMENT",  # Delete document
        "GOOGLEDOCS_SHARE_DOCUMENT",  # Share document
        "GOOGLEDOCS_COPY_DOCUMENT",  # Copy document
        "GOOGLEDOCS_GET_DOCUMENT_BY_ID",  # Get by ID
    ],

    "GOOGLESHEETS": [
        "GOOGLESHEETS_CREATE_SPREADSHEET",  # Create spreadsheet
        "GOOGLESHEETS_BATCH_UPDATE_VALUES",  # Update values
        "GOOGLESHEETS_GET_VALUES",  # Get values
        "GOOGLESHEETS_FIND_SPREADSHEET",  # Find spreadsheet
        "GOOGLESHEETS_UPDATE_CELL",  # Update cell
        "GOOGLESHEETS_ADD_ROWS",  # Add rows
        "GOOGLESHEETS_CREATE_SHEET",  # Create sheet
        "GOOGLESHEETS_DELETE_ROWS",  # Delete rows
        "GOOGLESHEETS_CLEAR_VALUES",  # Clear values
        "GOOGLESHEETS_GET_SHEET_INFO",  # Get sheet info
    ],

    "NOTION": [
        "NOTION_CREATE_PAGE",  # Create page
        "NOTION_FIND_PAGE",  # Find page
        "NOTION_GET_PAGE_CONTENT",  # Get page content
        "NOTION_UPDATE_PAGE",  # Update page
        "NOTION_CREATE_DATABASE",  # Create database
        "NOTION_QUERY_DATABASE",  # Query database
        "NOTION_CREATE_DATABASE_PAGE",  # Create database page
        "NOTION_SEARCH",  # Search
        "NOTION_APPEND_BLOCK",  # Append block
        "NOTION_GET_DATABASE",  # Get database
    ],

    "INSTAGRAM": [
        "INSTAGRAM_CREATE_CONTAINER",  # Create container (step 1)
        "INSTAGRAM_CREATE_POST",  # Publish post (step 2)
        "INSTAGRAM_GET_MEDIA_OBJECT",  # Get media
        "INSTAGRAM_GET_BUSINESS_ACCOUNT",  # Get account info
        "INSTAGRAM_GET_INSIGHTS",  # Get insights
        "INSTAGRAM_DELETE_COMMENT",  # Delete comment
        "INSTAGRAM_REPLY_TO_COMMENT",  # Reply to comment
        "INSTAGRAM_GET_COMMENTS",  # Get comments
        "INSTAGRAM_CREATE_CAROUSEL_CONTAINER",  # Create carousel
        "INSTAGRAM_GET_MEDIA_LIST",  # List media
    ],

    "LINKEDIN": [
        "LINKEDIN_CREATE_POST",  # Create post
        "LINKEDIN_GET_PROFILE",  # Get profile
        "LINKEDIN_SEND_MESSAGE",  # Send message
        "LINKEDIN_GET_POSTS",  # Get posts
        "LINKEDIN_LIKE_POST",  # Like post
        "LINKEDIN_COMMENT_ON_POST",  # Comment
        "LINKEDIN_DELETE_POST",  # Delete post
        "LINKEDIN_GET_CONNECTIONS",  # Get connections
        "LINKEDIN_SHARE_ARTICLE",  # Share article
        "LINKEDIN_UPLOAD_MEDIA",  # Upload media
    ],

    "SHOPIFY": [
        "SHOPIFY_CREATE_PRODUCT",  # Create product
        "SHOPIFY_GET_PRODUCTS",  # Get products
        "SHOPIFY_UPDATE_PRODUCT",  # Update product
        "SHOPIFY_DELETE_PRODUCT",  # Delete product
        "SHOPIFY_GET_ORDERS",  # Get orders
        "SHOPIFY_CREATE_ORDER",  # Create order
        "SHOPIFY_UPDATE_INVENTORY",  # Update inventory
        "SHOPIFY_GET_CUSTOMERS",  # Get customers
        "SHOPIFY_CREATE_VARIANT",  # Create variant
        "SHOPIFY_FULFILL_ORDER",  # Fulfill order
    ],

    "STRIPE": [
        "STRIPE_CREATE_PAYMENT_INTENT",  # Create payment
        "STRIPE_CREATE_CUSTOMER",  # Create customer
        "STRIPE_GET_PAYMENT",  # Get payment
        "STRIPE_GET_CUSTOMER",  # Get customer
        "STRIPE_CREATE_PRODUCT",  # Create product
        "STRIPE_CREATE_PRICE",  # Create price
        "STRIPE_LIST_PAYMENTS",  # List payments
        "STRIPE_REFUND_PAYMENT",  # Refund payment
        "STRIPE_UPDATE_CUSTOMER",  # Update customer
        "STRIPE_CREATE_SUBSCRIPTION",  # Create subscription
    ],

    "ASANA": [
        "ASANA_CREATE_TASK",  # Create task
        "ASANA_GET_TASKS",  # Get tasks
        "ASANA_UPDATE_TASK",  # Update task
        "ASANA_DELETE_TASK",  # Delete task
        "ASANA_CREATE_PROJECT",  # Create project
        "ASANA_GET_PROJECTS",  # Get projects
        "ASANA_ADD_COMMENT",  # Add comment
        "ASANA_GET_WORKSPACE",  # Get workspace
        "ASANA_ASSIGN_TASK",  # Assign task
        "ASANA_SEARCH_TASKS",  # Search tasks
    ],

    "AIRTABLE": [
        "AIRTABLE_CREATE_RECORD",  # Create record
        "AIRTABLE_LIST_RECORDS",  # List records
        "AIRTABLE_GET_RECORD",  # Get record
        "AIRTABLE_UPDATE_RECORD",  # Update record
        "AIRTABLE_DELETE_RECORD",  # Delete record
        "AIRTABLE_CREATE_TABLE",  # Create table
        "AIRTABLE_GET_BASE_SCHEMA",  # Get schema
        "AIRTABLE_LIST_BASES",  # List bases
        "AIRTABLE_CREATE_MULTIPLE_RECORDS",  # Create multiple
        "AIRTABLE_CREATE_FIELD",  # Create field
    ],

    "CLICKUP": [
        "CLICKUP_CREATE_TASK",  # Create task
        "CLICKUP_GET_TASKS",  # Get tasks
        "CLICKUP_UPDATE_TASK",  # Update task
        "CLICKUP_DELETE_TASK",  # Delete task
        "CLICKUP_CREATE_LIST",  # Create list
        "CLICKUP_GET_LISTS",  # Get lists
        "CLICKUP_ADD_COMMENT",  # Add comment
        "CLICKUP_GET_WORKSPACES",  # Get workspaces
        "CLICKUP_ASSIGN_TASK",  # Assign task
        "CLICKUP_SEARCH_TASKS",  # Search tasks
    ],

    "DROPBOX": [
        "DROPBOX_UPLOAD_FILE",  # Upload file
        "DROPBOX_DOWNLOAD_FILE",  # Download file
        "DROPBOX_LIST_FOLDER",  # List folder
        "DROPBOX_CREATE_FOLDER",  # Create folder
        "DROPBOX_DELETE_FILE",  # Delete file
        "DROPBOX_MOVE_FILE",  # Move file
        "DROPBOX_SHARE_FILE",  # Share file
        "DROPBOX_SEARCH",  # Search
        "DROPBOX_GET_FILE_INFO",  # Get file info
        "DROPBOX_COPY_FILE",  # Copy file
    ],

    "FIGMA": [
        "FIGMA_GET_FILE",  # Get file
        "FIGMA_GET_COMMENTS",  # Get comments
        "FIGMA_POST_COMMENT",  # Post comment
        "FIGMA_GET_TEAM_PROJECTS",  # Get projects
        "FIGMA_GET_PROJECT_FILES",  # Get project files
        "FIGMA_GET_FILE_VERSIONS",  # Get versions
        "FIGMA_GET_IMAGE",  # Get image
        "FIGMA_GET_COMPONENTS",  # Get components
        "FIGMA_GET_STYLES",  # Get styles
        "FIGMA_GET_USER",  # Get user
    ],

    "MONDAY": [
        "MONDAY_CREATE_ITEM",  # Create item
        "MONDAY_GET_ITEMS",  # Get items
        "MONDAY_UPDATE_ITEM",  # Update item
        "MONDAY_DELETE_ITEM",  # Delete item
        "MONDAY_CREATE_BOARD",  # Create board
        "MONDAY_GET_BOARDS",  # Get boards
        "MONDAY_CREATE_COLUMN",  # Create column
        "MONDAY_UPDATE_COLUMN_VALUE",  # Update column value
        "MONDAY_ADD_UPDATE",  # Add update
        "MONDAY_GET_WORKSPACES",  # Get workspaces
    ],

    "ZOOM": [
        "ZOOM_CREATE_MEETING",  # Create meeting
        "ZOOM_GET_MEETING",  # Get meeting
        "ZOOM_LIST_MEETINGS",  # List meetings
        "ZOOM_UPDATE_MEETING",  # Update meeting
        "ZOOM_DELETE_MEETING",  # Delete meeting
        "ZOOM_GET_MEETING_REGISTRANTS",  # Get registrants
        "ZOOM_CREATE_WEBINAR",  # Create webinar
        "ZOOM_LIST_RECORDINGS",  # List recordings
        "ZOOM_GET_USER",  # Get user
        "ZOOM_LIST_USERS",  # List users
    ],

    "TODOIST": [
        "TODOIST_CREATE_TASK",  # Create task
        "TODOIST_GET_TASKS",  # Get tasks
        "TODOIST_UPDATE_TASK",  # Update task
        "TODOIST_COMPLETE_TASK",  # Complete task
        "TODOIST_DELETE_TASK",  # Delete task
        "TODOIST_CREATE_PROJECT",  # Create project
        "TODOIST_GET_PROJECTS",  # Get projects
        "TODOIST_ADD_COMMENT",  # Add comment
        "TODOIST_GET_LABELS",  # Get labels
        "TODOIST_MOVE_TASK",  # Move task
    ],

    "LINEAR": [
        "LINEAR_CREATE_ISSUE",  # Create issue
        "LINEAR_GET_ISSUES",  # Get issues
        "LINEAR_UPDATE_ISSUE",  # Update issue
        "LINEAR_DELETE_ISSUE",  # Delete issue
        "LINEAR_CREATE_PROJECT",  # Create project
        "LINEAR_GET_PROJECTS",  # Get projects
        "LINEAR_ADD_COMMENT",  # Add comment
        "LINEAR_GET_TEAMS",  # Get teams
        "LINEAR_ASSIGN_ISSUE",  # Assign issue
        "LINEAR_SEARCH_ISSUES",  # Search issues
    ],

    "CANVA": [
        "CANVA_CREATE_DESIGN",  # Create design
        "CANVA_GET_DESIGN",  # Get design
        "CANVA_UPDATE_DESIGN",  # Update design
        "CANVA_DELETE_DESIGN",  # Delete design
        "CANVA_EXPORT_DESIGN",  # Export design
        "CANVA_LIST_DESIGNS",  # List designs
        "CANVA_UPLOAD_IMAGE",  # Upload image
        "CANVA_GET_FOLDERS",  # Get folders
        "CANVA_CREATE_FOLDER",  # Create folder
        "CANVA_SHARE_DESIGN",  # Share design
    ],

    "WHATSAPP": [
        "WHATSAPP_SEND_MESSAGE",  # Send message
        "WHATSAPP_SEND_MEDIA",  # Send media
        "WHATSAPP_GET_MESSAGES",  # Get messages
        "WHATSAPP_MARK_AS_READ",  # Mark as read
        "WHATSAPP_SEND_TEMPLATE",  # Send template
        "WHATSAPP_GET_BUSINESS_PROFILE",  # Get business profile
        "WHATSAPP_UPLOAD_MEDIA",  # Upload media
        "WHATSAPP_DELETE_MESSAGE",  # Delete message
        "WHATSAPP_REACT_TO_MESSAGE",  # React to message
        "WHATSAPP_GET_MEDIA",  # Get media
    ],

    "FACEBOOK": [
        "FACEBOOK_CREATE_POST",  # Create post
        "FACEBOOK_GET_POSTS",  # Get posts
        "FACEBOOK_DELETE_POST",  # Delete post
        "FACEBOOK_UPLOAD_PHOTO",  # Upload photo
        "FACEBOOK_CREATE_COMMENT",  # Create comment
        "FACEBOOK_LIKE_POST",  # Like post
        "FACEBOOK_GET_PAGE_INFO",  # Get page info
        "FACEBOOK_PUBLISH_VIDEO",  # Publish video
        "FACEBOOK_GET_INSIGHTS",  # Get insights
        "FACEBOOK_SEND_MESSAGE",  # Send message
    ],

    "REDDIT": [
        "REDDIT_SUBMIT_POST",  # Submit post
        "REDDIT_SUBMIT_COMMENT",  # Submit comment
        "REDDIT_GET_POSTS",  # Get posts
        "REDDIT_GET_COMMENTS",  # Get comments
        "REDDIT_VOTE",  # Vote
        "REDDIT_DELETE_POST",  # Delete post
        "REDDIT_GET_SUBREDDIT_INFO",  # Get subreddit info
        "REDDIT_SEARCH_POSTS",  # Search posts
        "REDDIT_GET_USER_INFO",  # Get user info
        "REDDIT_SAVE_POST",  # Save post
    ],

    "OUTLOOK": [
        "OUTLOOK_SEND_EMAIL",  # Send email
        "OUTLOOK_GET_EMAILS",  # Get emails
        "OUTLOOK_SEARCH_EMAILS",  # Search emails
        "OUTLOOK_CREATE_DRAFT",  # Create draft
        "OUTLOOK_DELETE_EMAIL",  # Delete email
        "OUTLOOK_CREATE_EVENT",  # Create event
        "OUTLOOK_GET_EVENTS",  # Get events
        "OUTLOOK_UPDATE_EVENT",  # Update event
        "OUTLOOK_GET_CONTACTS",  # Get contacts
        "OUTLOOK_CREATE_FOLDER",  # Create folder
    ],

    "GOOGLESLIDES": [
        "GOOGLESLIDES_CREATE_PRESENTATION",  # Create presentation
        "GOOGLESLIDES_GET_PRESENTATION",  # Get presentation
        "GOOGLESLIDES_ADD_SLIDE",  # Add slide
        "GOOGLESLIDES_UPDATE_SLIDE",  # Update slide
        "GOOGLESLIDES_DELETE_SLIDE",  # Delete slide
        "GOOGLESLIDES_INSERT_TEXT",  # Insert text
        "GOOGLESLIDES_INSERT_IMAGE",  # Insert image
        "GOOGLESLIDES_FIND_PRESENTATION",  # Find presentation
        "GOOGLESLIDES_DUPLICATE_SLIDE",  # Duplicate slide
        "GOOGLESLIDES_EXPORT_PRESENTATION",  # Export presentation
    ],

    "GOOGLEMEET": [
        "GOOGLEMEET_CREATE_SPACE",  # Create space
        "GOOGLEMEET_GET_SPACE",  # Get space
        "GOOGLEMEET_UPDATE_SPACE",  # Update space
        "GOOGLEMEET_END_ACTIVE_CONFERENCE",  # End conference
        "GOOGLEMEET_GET_CONFERENCE_RECORD",  # Get conference record
        "GOOGLEMEET_LIST_CONFERENCE_RECORDS",  # List conference records
        "GOOGLEMEET_GET_PARTICIPANT",  # Get participant
        "GOOGLEMEET_LIST_PARTICIPANTS",  # List participants
        "GOOGLEMEET_GET_RECORDING",  # Get recording
        "GOOGLEMEET_LIST_RECORDINGS",  # List recordings
    ],
}
