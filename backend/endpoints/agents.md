# Agents Endpoints (`/api/agents/`)

Complete documentation for AI Agent management endpoints.

## Overview

The Agents API allows users to create, manage, and interact with AI agents. All endpoints require authentication.

**Base Path:** `/api/agents/`

**Authentication:** Required (JWT token in HttpOnly cookie)

---

## Standard CRUD Operations

### 1. GET `/api/agents/` - List Agents

**Purpose:** Returns list of all agents owned by the authenticated user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "name": "string",
    "prompt": "string",
    "app_connections": ["GMAIL", "SLACK"],
    "tools": ["GMAIL_SEND_EMAIL", "SLACK_SEND_MESSAGE", ...],
    "user": "string",
    "message_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes:**

- Only returns agents owned by the authenticated user
- Ordered by creation date (newest first)

---

### 2. POST `/api/agents/` - Create Agent

**Purpose:** Creates a new AI agent with specified configuration. Agent name is automatically generated from the prompt using AI.

**Authentication:** Required

**Request Body:**

```json
{
  "prompt": "string", // Required, agent's purpose/instructions
  "name": "string", // Optional, if not provided will be auto-generated from prompt
  "app_connections": ["GMAIL", "SLACK"] // Optional, list of connected apps. Can be empty or omitted.
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Email And Meeting Manager", // Auto-generated from prompt if not provided
  "prompt": "string",
  "app_connections": ["GMAIL", "SLACK"],
  "tools": ["GMAIL_SEND_EMAIL", ...],  // Auto-generated from app_connections
  "user": "string",
  "message_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required

**Notes:**

- **New:** Agent `name` is auto-generated from `prompt` using AI if not provided
- **New:** `app_connections` is optional - can be empty or omitted to create agent with no tools (tools can be added later)
- `tools` list is automatically generated from `app_connections`
- User is automatically set from authentication token
- If `app_connections` is empty or omitted, agent is created with no tools

---

### 3. GET `/api/agents/{id}/` - Get Agent Details

**Purpose:** Returns detailed information about a specific agent.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "prompt": "string",
  "app_connections": ["GMAIL", "SLACK"],
  "tools": ["GMAIL_SEND_EMAIL", ...],
  "user": "string",
  "message_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404`: Agent not found or not owned by user

---

### 4. PUT `/api/agents/{id}/` - Update Agent (Full)

**Purpose:** Fully updates an agent (all fields required).

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string",
  "prompt": "string",
  "app_connections": ["GMAIL", "SLACK"]
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "prompt": "string",
  "app_connections": ["GMAIL", "SLACK"],
  "tools": ["GMAIL_SEND_EMAIL", ...],  // Re-generated from app_connections
  "user": "string",
  "message_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Notes:**

- `tools` list is automatically re-generated from `app_connections`

---

### 5. PATCH `/api/agents/{id}/` - Update Agent (Partial)

**Purpose:** Partially updates an agent (only provided fields).

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string" // Optional, only update name
  // Other fields optional
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "prompt": "string",
  "app_connections": ["GMAIL", "SLACK"],
  "tools": ["GMAIL_SEND_EMAIL", ...],
  "user": "string",
  "message_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Notes:**

- Only provided fields are updated
- `tools` list is re-generated if `app_connections` is updated

---

### 6. DELETE `/api/agents/{id}/` - Delete Agent

**Purpose:** Deletes an agent and all associated chat messages.

**Authentication:** Required

**Request Body:** None

**Response (204 No Content):** Empty response

**Error Responses:**

- `404`: Agent not found or not owned by user

**Notes:**

- Also deletes all chat messages associated with the agent

---

## Custom Actions

### 7. GET `/api/agents/{id}/messages/` - Get Agent Messages

**Purpose:** Retrieves all chat messages for a specific agent.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "string",
    "attachments": [],
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "uuid",
    "role": "assistant",
    "content": "string",
    "attachments": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes:**

- Messages returned in chronological order (oldest first)
- Includes both user and assistant messages
- Attachments are included if present

---

### 8. POST `/api/agents/{id}/chat/` - Chat with Agent

**Purpose:** Sends a message to the agent and receives a response. Core chat functionality.

**Authentication:** Required

**Request Body:**

```json
{
  "message": "string",        // Required, user message
  "file_ids": ["uuid", ...]  // Optional, array of file attachment IDs
}
```

**Response (200 OK):**

```json
{
  "user_message": {
    "id": "uuid",
    "role": "user",
    "content": "string",
    "attachments": [...],
    "created_at": "2024-01-01T00:00:00Z"
  },
  "assistant_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "string",
    "attachments": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

- `400`: Validation error (e.g., message is required)
- `500`: Server error during chat execution

**Notes:**

- Agent dynamically selects tools based on message content and chat history
- Supports file attachments via `file_ids`
- Both messages are saved to the database
- Uses last 6 messages as chat history for context
- Falls back to basic chat if no tools are needed

**Chat Flow:**

1. Validates message and file attachments
2. Saves user message to database
3. Builds chat history (last 6 messages)
4. Dynamically selects tools based on prompt and history
5. Executes chat with Composio or fallback to basic chat
6. Saves assistant response
7. Returns both messages

---

## Agent Model

### Fields

- `id`: UUID (primary key)
- `name`: String (agent name)
- `prompt`: String (system prompt for the agent)
- `app_connections`: Array of strings (e.g., `["GMAIL", "SLACK"]`)
- `tools`: Array of strings (auto-generated from `app_connections`)
- `user`: String (username of owner)
- `message_count`: Integer (number of chat messages)
- `created_at`: DateTime
- `updated_at`: DateTime

### Tool Generation

The `tools` list is automatically generated from `app_connections` using a hardcoded configuration. Each app connection maps to a set of tool slugs (e.g., `GMAIL` → `["GMAIL_SEND_EMAIL", "GMAIL_FETCH_EMAILS", ...]`).

---

## Usage Examples

### Create an Agent (with auto-generated name)

```bash
POST /api/agents/
{
  "prompt": "You are a helpful email assistant that manages my emails and schedules meetings."
  // name will be auto-generated, e.g., "Email And Meeting Assistant"
}
```

### Create an Agent (with tools)

```bash
POST /api/agents/
{
  "prompt": "You are a helpful email assistant.",
  "app_connections": ["GMAIL", "GOOGLEDRIVE"]
  // name will be auto-generated
}
```

### Create an Agent (with custom name)

```bash
POST /api/agents/
{
  "name": "My Custom Agent Name",
  "prompt": "You are a helpful email assistant.",
  "app_connections": ["GMAIL", "GOOGLEDRIVE"]
}
```

### Chat with Agent

```bash
POST /api/agents/{id}/chat/
{
  "message": "Send an email to john@example.com",
  "file_ids": []
}
```

### Get Chat History

```bash
GET /api/agents/{id}/messages/
```

---

## Limits and Constraints

- **Message History:** Last 6 messages used for context
- **File Attachments:** Supported via file upload endpoint
