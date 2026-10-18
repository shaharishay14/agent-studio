# Triggers Endpoints (`/api/triggers/`)

Complete documentation for automation trigger endpoints.

## Overview

The Triggers API allows users to create and manage automation triggers that execute agent actions based on events (e.g., "on new email"). All endpoints require authentication.

**Base Path:** `/api/triggers/`

**Authentication:** Required (JWT token in HttpOnly cookie)

---

## Standard CRUD Operations

### 1. GET `/api/triggers/` - List Triggers

**Purpose:** Returns list of all triggers owned by the authenticated user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "name": "Email Notification Trigger",
    "trigger_type": "event",
    "event_type": "GMAIL_NEW_EMAIL",
    "agent": "uuid",
    "action_prompt": "Notify me about this email",
    "status": "active",
    "trigger_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes:**

- Only returns triggers owned by the authenticated user
- Ordered by creation date (newest first)

---

### 2. POST `/api/triggers/` - Create Trigger

**Purpose:** Creates a new automation trigger.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string", // Required, trigger name
  "trigger_type": "event", // Required, "event" or "schedule"
  "event_type": "GMAIL_NEW_EMAIL", // Required if trigger_type is "event"
  "agent": "uuid", // Required, agent ID
  "action_prompt": "string", // Required, what the agent should do
  "status": "draft" // Optional, default "draft"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Email Notification Trigger",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "Notify me about this email",
  "status": "draft",
  "trigger_count": 0,
  "composio_trigger_id": "trigger_xxx", // If registered with Composio
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required

**Notes:**

- For event-based triggers, automatically registers with Composio
- Sets `composio_trigger_id` if registration succeeds
- User is automatically set from authentication token

---

### 3. GET `/api/triggers/{id}/` - Get Trigger Details

**Purpose:** Returns detailed information about a specific trigger.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Email Notification Trigger",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "Notify me about this email",
  "status": "active",
  "trigger_count": 5,
  "composio_trigger_id": "trigger_xxx",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404`: Trigger not found or not owned by user

---

### 4. PUT `/api/triggers/{id}/` - Update Trigger (Full)

**Purpose:** Fully updates a trigger (all fields required).

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "string",
  "status": "active"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Updated Trigger",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "Updated action",
  "status": "active",
  "trigger_count": 5,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 5. PATCH `/api/triggers/{id}/` - Update Trigger (Partial)

**Purpose:** Partially updates a trigger (only provided fields).

**Authentication:** Required

**Request Body:**

```json
{
  "status": "active" // Optional, only update status
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Email Notification Trigger",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "Notify me about this email",
  "status": "active",
  "trigger_count": 5,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 6. DELETE `/api/triggers/{id}/` - Delete Trigger

**Purpose:** Deletes a trigger and all associated execution logs.

**Authentication:** Required

**Request Body:** None

**Response (204 No Content):** Empty response

**Error Responses:**

- `404`: Trigger not found or not owned by user

**Notes:**

- Also deletes all execution logs associated with the trigger

---

## Custom Actions

### 7. GET `/api/triggers/available/` - Get Available Trigger Types

**Purpose:** Returns list of available trigger types for the UI.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "type": "GMAIL_NEW_EMAIL",
    "name": "New Email",
    "description": "Triggers when a new email is received",
    "app": "GMAIL"
  },
  {
    "type": "SLACK_NEW_MESSAGE",
    "name": "New Slack Message",
    "description": "Triggers when a new message is received in Slack",
    "app": "SLACK"
  }
]
```

**Notes:**

- Returns hardcoded list of available trigger types
- Used by frontend to display trigger options

---

### 8. POST `/api/triggers/{id}/activate/` - Activate Trigger

**Purpose:** Sets a trigger's status to 'active'.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "status": "Trigger activated"
}
```

**Notes:**

- Changes trigger status to `"active"`
- Active triggers will execute when events occur

---

### 9. POST `/api/triggers/{id}/pause/` - Pause Trigger

**Purpose:** Sets a trigger's status to 'paused'.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "status": "Trigger paused"
}
```

**Notes:**

- Changes trigger status to `"paused"`
- Paused triggers will not execute

---

### 10. POST `/api/triggers/{id}/stop/` - Stop Trigger

**Purpose:** Sets a trigger's status to 'stopped'.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "status": "Trigger stopped"
}
```

**Notes:**

- Changes trigger status to `"stopped"`
- Stopped triggers will not execute

---

### 11. GET `/api/triggers/{id}/executions/` - Get Trigger Executions

**Purpose:** Gets the 50 most recent execution logs for a trigger.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "trigger": "uuid",
    "event_data": {},
    "agent_response": "string",
    "success": true,
    "executed_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes:**

- Returns up to 50 most recent executions
- Ordered by execution date (newest first)
- Includes event data and agent response

---

### 12. POST `/api/triggers/{id}/test/` - Test Trigger

**Purpose:** Manually runs a trigger's action prompt (for testing).

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "response": "Agent response text",
  "execution_id": "uuid"
}
```

**Error Responses:**

- `500`: Server error during execution

**Notes:**

- Executes the trigger's action prompt immediately
- Uses agent's chat history for context
- Creates an execution log entry
- Increments trigger count
- Useful for testing triggers before activating

---

## Trigger Model

### Fields

- `id`: UUID (primary key)
- `name`: String (trigger name)
- `trigger_type`: String (`"event"` or `"schedule"`)
- `event_type`: String (e.g., `"GMAIL_NEW_EMAIL"`)
- `agent`: UUID (foreign key to Agent)
- `action_prompt`: String (what the agent should do)
- `status`: String (`"draft"`, `"active"`, `"paused"`, `"stopped"`)
- `trigger_count`: Integer (number of times triggered)
- `composio_trigger_id`: String (Composio trigger ID, if registered)
- `created_at`: DateTime
- `updated_at`: DateTime
- `user`: Foreign key to User (automatically set)

### Status Values

- `draft`: Trigger created but not active
- `active`: Trigger is active and will execute
- `paused`: Trigger is paused (temporarily disabled)
- `stopped`: Trigger is stopped (permanently disabled)

---

## Usage Examples

### Create Event Trigger

```bash
POST /api/triggers/
{
  "name": "Email Notification",
  "trigger_type": "event",
  "event_type": "GMAIL_NEW_EMAIL",
  "agent": "uuid",
  "action_prompt": "Summarize this email and notify me"
}
```

### Activate Trigger

```bash
POST /api/triggers/{id}/activate/
```

### Test Trigger

```bash
POST /api/triggers/{id}/test/
```

### Get Execution History

```bash
GET /api/triggers/{id}/executions/
```

---

## Trigger Execution Flow

1. **Event Occurs** (e.g., new email received)
2. **Composio Webhook** → Backend receives event
3. **Trigger Matches** → Find active trigger for event type
4. **Agent Executes** → Run action prompt with event data
5. **Execution Logged** → Save result to database
6. **Trigger Count Incremented**

---

## Security Notes

- Users can only see/manage their own triggers
- Triggers are scoped to user's agents
- Event data is validated before execution
- Execution logs are stored securely
