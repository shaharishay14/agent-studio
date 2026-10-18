# Connections Endpoints (`/api/connections/`)

Complete documentation for tool integration and connection management endpoints.

## Overview

The Connections API manages integrations with third-party tools (Gmail, Slack, GitHub, etc.) via Composio. All endpoints require authentication.

**Base Path:** `/api/connections/`

**Authentication:** Required (JWT token in HttpOnly cookie)

---

## Standard CRUD Operations

### 1. GET `/api/connections/` - List Connections

**Purpose:** Quick read-only endpoint that returns list of active tool connections for the authenticated user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "user": "username",
    "tool_name": "GMAIL",
    "auth_config_id": "ac_xxx",
    "connected_at": "2024-01-01T00:00:00Z",
    "last_used": "2024-01-01T00:00:00Z",
    "is_active": true,
    "metadata": {}
  }
]
```

**Response Fields:**

- `id`: Integer - Database ID of the connection
- `user`: String - Username of the connection owner
- `tool_name`: String - Tool identifier (e.g., "GMAIL", "SLACK")
- `auth_config_id`: String - Composio auth configuration ID
- `connected_at`: DateTime - When the connection was first created
- `last_used`: DateTime - When the connection was last updated
- `is_active`: Boolean - Whether the connection is currently active
- `metadata`: Object - Additional connection metadata

**Notes:**

- **Fast read-only endpoint** - Does not sync with Composio, just returns local database state
- Only returns connections owned by the authenticated user
- Only returns active connections (`is_active=true`)
- Ordered by connection date (newest first)
- For up-to-date connection status with sync, use `available_tools` endpoint instead

---

### 2. POST `/api/connections/` - Create Connection (Start Auth Flow)

**Purpose:** Initiates OAuth authentication flow for a tool and creates/updates a local connection record.

**Authentication:** Required

**Request Body:**

```json
{
  "tool_name": "GMAIL", // Required, tool identifier (e.g., "GMAIL", "SLACK")
  "waba_id": "string", // Optional, for WhatsApp only
  "phone_number_id": "string" // Optional, for WhatsApp only
}
```

**Response (201 Created or 200 OK):**

```json
{
  "success": true,
  "auth_url": "https://composio.dev/oauth/...",
  "connection": {
    "id": "integer",
    "tool_name": "GMAIL",
    "is_active": false,
    "metadata": {
      "status": "pending_auth"
    }
  }
}
```

**Error Responses:**

- `400`: Validation error or tool not configured
- `401`: Authentication required

**Notes:**

- Opens OAuth flow in new window (frontend should handle this)
- Creates local connection record with `is_active=False` and `status="pending_auth"`
- Returns `auth_url` for OAuth flow
- For WhatsApp, requires `waba_id` and `phone_number_id`
- Returns 201 if new record created, 200 if existing record updated

**Flow:**

1. Frontend calls this endpoint
2. Backend contacts Composio to get auth URL
3. Frontend opens auth URL in popup
4. User completes OAuth
5. Frontend calls `/api/connections/check_connections/` to sync status

---

### 3. DELETE `/api/connections/{id}/` - Disconnect Tool

**Purpose:** Disconnects a tool from Composio and completely deletes the local connection record.

**Authentication:** Required

**URL Parameters:**

- `id` (integer, required): The database ID of the connection to delete
  - **Important:** This must be an ID from YOUR connections (obtained from `GET /api/connections/`)
  - You can ONLY delete connections that belong to your authenticated account
  - Attempting to delete another user's connection returns `404` (not found)

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Connection 123 for GMAIL has been completely deleted",
  "composio_disconnect": {
    "success": true,
    "message": "Disconnected from GMAIL"
  }
}
```

**Error Responses:**

- `401`: Authentication credentials not provided or invalid
- `404`: Connection not found or not owned by user
- `500`: Unexpected server error

**Notes:**

- **Authentication enforced:** Users can only delete their own connections
- **Scope filtering:** Connection lookup automatically filtered by authenticated user via `get_queryset()`
- **Security:** Even if you know another user's connection ID, you cannot delete it (returns 404)
- **Composio disconnect:** Attempts to disconnect from Composio first
- **Complete deletion:** Deletes entire local database record (all fields)
- Local record is deleted regardless of Composio disconnect result (handles already-disconnected case)

**How to get the ID:**

1. Call `GET /api/connections/` to list your connections
2. Use the `id` field from the connection you want to delete
3. Call `DELETE /api/connections/{id}/` with that ID

---

## Custom Actions

### 4. GET `/api/connections/available_tools/` - Get Available Tools with Connection Status

**Purpose:** Returns list of all available tools with metadata (name, description, category) and connection status. **This endpoint automatically syncs connections from Composio** and returns the current connection status for each tool.

**Authentication:** Required

**Request:**

- Method: `GET`
- URL: `/api/connections/available_tools/`
- Headers: JWT token in HttpOnly cookie (required)
- Body: None
- Parameters: None

**Response (200 OK):**

```json
{
  "tools": [
    {
      "tool_name": "GMAIL",
      "name": "Gmail",
      "description": "Send, receive, and manage emails with Gmail integration",
      "category": "communication",
      "is_active": true
    },
    {
      "tool_name": "GOOGLEDRIVE",
      "name": "Google Drive",
      "description": "Upload, download, and manage files in Google Drive",
      "category": "productivity",
      "is_active": false
    },
    {
      "tool_name": "SLACK",
      "name": "Slack",
      "description": "Send messages and manage Slack workspace communications",
      "category": "messaging",
      "is_active": true
    },
    {
      "tool_name": "TWITTER",
      "name": "Twitter",
      "description": "Post tweets, manage followers, and interact on Twitter",
      "category": "social",
      "is_active": false
    }
    // ... more tools
  ],
  "count": 18
}
```

**Response Fields:**

Each tool object contains:
- `tool_name`: String - Backend tool identifier (e.g., "GMAIL", "GOOGLEDRIVE")
- `name`: String - Display name of the tool (e.g., "Gmail", "Google Drive")
- `description`: String - Description of what the tool does
- `category`: String - Category classification (e.g., "communication", "productivity", "social", "messaging")
- `is_active`: Boolean - **true if user is connected to this tool, false otherwise**

Root response fields:
- `tools`: Array - List of all available tools with their metadata and connection status
- `count`: Integer - Total number of available tools

**Error Responses:**

- `401`: Authentication credentials not provided or invalid

**Notes:**

- **Authentication required:** Users must be signed in to access this endpoint
- **Side-effectful:** Automatically syncs connections from Composio (writes to database)
- **Combines available_tools + check_connections:** This endpoint internally calls the connection sync logic from `check_connections` before returning the tools list
- **Graceful degradation:** If connection sync fails, continues with tool list (is_active will be based on local database state)
- **Automatic sync behavior:**
  - Fetches ground truth from Composio API
  - Updates local database with active connections
  - Preserves `auth_config_id` from initial OAuth flow
  - Marks connections no longer in Composio as inactive
  - Returns tools list with accurate `is_active` status
- **Replaces manual check_connections calls:** Frontend no longer needs to call `check_connections` separately after OAuth - just call `available_tools` to get updated status
- Tools are sorted alphabetically by key
- Used by frontend to display available integrations with real-time connection status on the integrations page

**Frontend Example:**

```javascript
// Fetch available tools (uses HttpOnly cookie automatically)
fetch("/api/connections/available_tools/", {
  credentials: 'include'  // Include cookies for authentication
})
  .then((response) => response.json())
  .then((data) => {
    console.log("Available tools:", data.tools);
    console.log("Count:", data.count);

    // Display tools with connection status
    data.tools.forEach(tool => {
      const status = tool.is_active ? "✓ Connected" : "Not connected";
      console.log(`${tool.name} (${tool.category}): ${tool.description} - ${status}`);
    });

    // Filter connected tools
    const connectedTools = data.tools.filter(tool => tool.is_active);
    console.log("Connected tools:", connectedTools);
  });
```

```bash
# Using curl (authenticated with cookie)
curl -X GET http://localhost:8000/api/connections/available_tools/ \
  --cookie "your-jwt-cookie"
```

---

### 5. GET `/api/connections/check_connections/` - Sync Connections (Internal)

**Purpose:** Synchronizes local connection state with Composio API (ground truth).

**⚠️ Important Notes:**
- **Hidden from Swagger UI** - This endpoint is for internal use only and will not appear in API documentation
- **Use `available_tools` instead** - This endpoint's logic is now wrapped inside `available_tools`. Frontend code should call `available_tools` instead, which automatically syncs connections and returns the tools list with connection status in a single request.
- **Legacy support only** - This endpoint remains available for backwards compatibility but is not recommended for new code.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "integer",
    "tool_name": "GMAIL",
    "is_active": true,
    "auth_config_id": "ac_xxx",
    "composio_connection_id": "conn_xxx",
    "composio_entity_id": "user_123",
    "connected_at": "2024-01-01T00:00:00Z",
    "last_used": "2024-01-01T00:00:00Z",
    "metadata": {
      "status": "connected"
    }
  }
]
```

**Notes:**

- **Side-effectful:** Writes to database
- Fetches actual connections from Composio API (ground truth)
- Upserts each connection as `is_active=True`
- **Preserves `auth_config_id`** from initial OAuth flow (fixes pending_auth issue)
- Updates metadata status from `pending_auth` to `connected`
- Marks local records not in Composio as `is_active=False`
- Returns refreshed list of active connections
- **Must be called after OAuth flow completes** to activate pending connections

**Flow:**

1. Frontend calls this after user completes OAuth in popup
2. Backend queries Composio for user's active connections
3. Backend updates local database:
   - Sets `is_active=True`
   - Sets `composio_connection_id` and `composio_entity_id`
   - Preserves `auth_config_id` from initial creation
   - Updates metadata status to `connected`
4. Returns updated list of active connections

---

## Connection Model

### Fields

- `id`: Integer (primary key, local database ID)
- `tool_name`: String (e.g., `"GMAIL"`, `"SLACK"`)
- `auth_config_id`: String (Composio auth config ID)
- `composio_connection_id`: String (Composio connection ID)
- `composio_entity_id`: String (e.g., `"user_123"`)
- `connected_at`: DateTime
- `last_used`: DateTime
- `is_active`: Boolean (true if connection is active)
- `metadata`: JSON object (additional connection metadata)

### Tool Names

Available tool names (from `composio_config.py`):

- `GMAIL`
- `GOOGLEDRIVE`
- `GOOGLEDOCS`
- `GOOGLESHEETS`
- `GOOGLECALENDAR`
- `SLACK`
- `TELEGRAM`
- `NOTION`
- `REDDIT`
- `TWITTER`
- `GITHUB`
- `STRIPE`
- `INSTAGRAM`
- `WHATSAPP`
- `FACEBOOK`
- `SHOPIFY`
- `OUTLOOK`
- `LINKEDIN`

---

## Usage Examples

### List Connections

```bash
GET /api/connections/
```

### Connect Gmail

```bash
POST /api/connections/
{
  "tool_name": "GMAIL"
}
# Response includes auth_url - open in popup
```

### Connect WhatsApp (requires additional fields)

```bash
POST /api/connections/
{
  "tool_name": "WHATSAPP",
  "waba_id": "123456789012345",
  "phone_number_id": "987654321098765"
}
```

### Sync Connections (after OAuth)

```bash
GET /api/connections/check_connections/
```

### Disconnect Tool

```bash
DELETE /api/connections/{id}/
```

### Get Available Tools

```bash
GET /api/connections/available_tools/
```

---

## OAuth Flow

### Updated Flow (Recommended)

1. **Frontend:** Call `POST /api/connections/` with `tool_name`
2. **Backend:** Returns `auth_url` and creates pending connection
3. **Frontend:** Open `auth_url` in popup window
4. **User:** Completes OAuth in popup
5. **Frontend:** Call `GET /api/connections/available_tools/` to sync and get updated tools list
6. **Backend:** Syncs connections from Composio and returns all tools with updated connection status

### Legacy Flow (Still Supported)

1. **Frontend:** Call `POST /api/connections/` with `tool_name`
2. **Backend:** Returns `auth_url` and creates pending connection
3. **Frontend:** Open `auth_url` in popup window
4. **User:** Completes OAuth in popup
5. **Frontend:** Call `GET /api/connections/check_connections/` to sync
6. **Backend:** Updates connection status to active
7. **Frontend:** Call `GET /api/connections/available_tools/` to get updated tools list

**Note:** The updated flow is more efficient as it combines steps 5-7 into a single API call.

---

## Security Notes

- All endpoints require authentication (except `available_tools`)
- Users can only see/manage their own connections
- Connection IDs are local database IDs, not Composio IDs
- OAuth tokens are stored securely by Composio (not in local database)

---

## Error Handling

- **Tool not configured:** Returns error if auth config not found in `auth_configs.json`
- **OAuth failure:** Composio returns error, passed through to frontend
- **Sync failure:** Logs error but continues with local state
