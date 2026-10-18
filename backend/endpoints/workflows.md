# Workflows Endpoints (`/api/workflows/`)

Complete documentation for visual workflow management endpoints.

## Overview

The Workflows API allows users to create and manage visual workflows (built with React Flow). Workflows represent automation flows with nodes and edges. All endpoints require authentication.

**Base Path:** `/api/workflows/`

**Authentication:** Required (JWT token in HttpOnly cookie)

---

## Standard CRUD Operations

### 1. GET `/api/workflows/` - List Workflows

**Purpose:** Returns list of all workflows owned by the authenticated user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "name": "Email Processing Workflow",
    "description": "Process and categorize emails",
    "agent": "uuid",
    "status": "draft",
    "nodes": [...],
    "edges": [...],
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "execution_count": 0,
    "last_executed": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**Notes:**

- Only returns workflows owned by the authenticated user
- Ordered by creation date (newest first)

---

### 2. POST `/api/workflows/` - Create Workflow

**Purpose:** Creates a new visual workflow.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string",                    // Required, workflow name
  "description": "string",             // Optional, workflow description
  "agent": "uuid",                     // Required, agent ID
  "status": "draft",                   // Optional, default "draft"
  "nodes": [...],                      // Optional, React Flow nodes
  "edges": [...],                      // Optional, React Flow edges
  "viewport": {"x": 0, "y": 0, "zoom": 1}  // Optional, viewport state
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Email Processing Workflow",
  "description": "Process and categorize emails",
  "agent": "uuid",
  "status": "draft",
  "nodes": [],
  "edges": [],
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "execution_count": 0,
  "last_executed": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `400`: Validation errors
- `401`: Authentication required

**Notes:**

- User is automatically set from authentication token
- Nodes and edges are stored as JSON

---

### 3. GET `/api/workflows/{id}/` - Get Workflow Details

**Purpose:** Returns detailed information about a specific workflow.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Email Processing Workflow",
  "description": "Process and categorize emails",
  "agent": "uuid",
  "status": "active",
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "position": { "x": 0, "y": 0 },
      "data": {}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "execution_count": 5,
  "last_executed": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404`: Workflow not found or not owned by user

---

### 4. PUT `/api/workflows/{id}/` - Update Workflow (Full)

**Purpose:** Fully updates a workflow (all fields required).

**Authentication:** Required

**Request Body:**

```json
{
  "name": "string",
  "description": "string",
  "agent": "uuid",
  "status": "active",
  "nodes": [...],
  "edges": [...],
  "viewport": {"x": 0, "y": 0, "zoom": 1}
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Updated Workflow",
  "description": "Updated description",
  "agent": "uuid",
  "status": "active",
  "nodes": [...],
  "edges": [...],
  "viewport": {"x": 0, "y": 0, "zoom": 1},
  "execution_count": 5,
  "last_executed": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 5. PATCH `/api/workflows/{id}/` - Update Workflow (Partial)

**Purpose:** Partially updates a workflow (only provided fields).

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
  "name": "Email Processing Workflow",
  "description": "Process and categorize emails",
  "agent": "uuid",
  "status": "active",
  "nodes": [...],
  "edges": [...],
  "viewport": {"x": 0, "y": 0, "zoom": 1},
  "execution_count": 5,
  "last_executed": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 6. DELETE `/api/workflows/{id}/` - Delete Workflow

**Purpose:** Deletes a workflow and all associated execution logs.

**Authentication:** Required

**Request Body:** None

**Response (204 No Content):** Empty response

**Error Responses:**

- `404`: Workflow not found or not owned by user

**Notes:**

- Also deletes all execution logs associated with the workflow

---

## Custom Actions

### 7. GET `/api/workflows/{id}/executions/` - Get Workflow Executions

**Purpose:** Gets the 50 most recent execution logs for a workflow.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "workflow": "uuid",
    "workflow_name": "Email Processing Workflow",
    "executed_at": "2024-01-01T00:00:00Z",
    "input_data": {},
    "output_data": { "status": "success" },
    "execution_trace": [
      { "step": 1, "node": "start", "status": "completed" },
      { "step": 2, "node": "action", "status": "completed" }
    ],
    "success": true,
    "error_message": null,
    "execution_time_ms": 150
  }
]
```

**Notes:**

- Returns up to 50 most recent executions
- Ordered by execution date (newest first)
- Includes execution trace and timing information

---

### 8. POST `/api/workflows/{id}/execute/` - Execute Workflow

**Purpose:** Manually executes a workflow.

**Authentication:** Required

**Request Body:**

```json
{
  "input": {} // Optional, input data for workflow
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "execution": {
    "id": "uuid",
    "workflow": "uuid",
    "workflow_name": "Email Processing Workflow",
    "executed_at": "2024-01-01T00:00:00Z",
    "input_data": {},
    "output_data": {
      "status": "success",
      "message": "Workflow executed successfully (MOCK)"
    },
    "execution_trace": [
      { "step": 1, "node": "start", "status": "completed" },
      { "step": 2, "node": "action", "status": "completed" }
    ],
    "success": true,
    "execution_time_ms": 150
  }
}
```

**Error Responses:**

- `500`: Server error during execution

**Notes:**

- Currently a mock implementation
- Creates execution log entry
- Increments execution count
- Updates last_executed timestamp

---

### 9. POST `/api/workflows/{id}/activate/` - Activate Workflow

**Purpose:** Sets a workflow's status to 'active'.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Email Processing Workflow",
  "status": "active",
  ...
}
```

**Notes:**

- Changes workflow status to `"active"`
- Active workflows can be executed

---

### 10. POST `/api/workflows/{id}/pause/` - Pause Workflow

**Purpose:** Sets a workflow's status to 'paused'.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "Email Processing Workflow",
  "status": "paused",
  ...
}
```

**Notes:**

- Changes workflow status to `"paused"`
- Paused workflows will not execute automatically

---

### 11. POST `/api/workflows/duplicate/` - Duplicate Workflow

**Purpose:** Creates a copy of an existing workflow.

**Authentication:** Required

**Request Body:**

```json
{
  "workflow_id": "uuid" // Required, ID of workflow to duplicate
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Email Processing Workflow (Copy)",
  "description": "Process and categorize emails",
  "agent": "uuid",
  "status": "draft",
  "nodes": [...],
  "edges": [...],
  "viewport": {"x": 0, "y": 0, "zoom": 1},
  "execution_count": 0,
  "last_executed": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**

- `404`: Workflow not found or not owned by user

**Notes:**

- Creates a new workflow with "(Copy)" appended to name
- Copies all nodes, edges, and viewport
- Sets status to "draft"
- Resets execution count

---

## Workflow Model

### Fields

- `id`: UUID (primary key)
- `name`: String (workflow name)
- `description`: String (workflow description)
- `agent`: UUID (foreign key to Agent)
- `status`: String (`"draft"`, `"active"`, `"paused"`)
- `nodes`: JSON array (React Flow nodes)
- `edges`: JSON array (React Flow edges)
- `viewport`: JSON object (viewport state: `{x, y, zoom}`)
- `execution_count`: Integer (number of executions)
- `last_executed`: DateTime (last execution time)
- `created_at`: DateTime
- `updated_at`: DateTime
- `user`: Foreign key to User (automatically set)

### Status Values

- `draft`: Workflow created but not active
- `active`: Workflow is active and can be executed
- `paused`: Workflow is paused (temporarily disabled)

### React Flow Structure

**Nodes:**

```json
{
  "id": "node-1",
  "type": "start",
  "position": { "x": 0, "y": 0 },
  "data": {}
}
```

**Edges:**

```json
{
  "id": "edge-1",
  "source": "node-1",
  "target": "node-2"
}
```

**Viewport:**

```json
{
  "x": 0,
  "y": 0,
  "zoom": 1
}
```

---

## Usage Examples

### Create Workflow

```bash
POST /api/workflows/
{
  "name": "Email Processing",
  "description": "Process and categorize emails",
  "agent": "uuid",
  "status": "draft",
  "nodes": [],
  "edges": [],
  "viewport": {"x": 0, "y": 0, "zoom": 1}
}
```

### Update Workflow Nodes/Edges

```bash
PATCH /api/workflows/{id}/
{
  "nodes": [...],
  "edges": [...],
  "viewport": {"x": 100, "y": 100, "zoom": 1.5}
}
```

### Execute Workflow

```bash
POST /api/workflows/{id}/execute/
{
  "input": {"email_id": "123"}
}
```

### Duplicate Workflow

```bash
POST /api/workflows/duplicate/
{
  "workflow_id": "uuid"
}
```

---

## Workflow Execution

**Current Status:** Mock implementation

The execution endpoint currently:

1. Accepts input data
2. Creates execution log with mock output
3. Records execution trace
4. Updates execution count and timestamp

**Future Implementation:**

- Actual workflow execution logic
- Node-by-node execution
- Error handling and rollback
- Conditional branching
- Loop support

---

## Security Notes

- Users can only see/manage their own workflows
- Workflows are scoped to user's agents
- Node/edge data is validated before saving
- Execution logs are stored securely
