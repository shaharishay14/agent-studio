# Files Endpoints (`/api/files/`)

Complete documentation for file upload and management endpoints.

## Overview

The Files API allows users to upload and manage file attachments that can be used in agent chats. **Files are stored in the database as binary data** (not on the filesystem). **Each file must be associated with a specific agent.** All endpoints require authentication.

**Base Path:** `/api/files/`

**Authentication:** Required (JWT token in HttpOnly cookie)

**Storage:** Files are stored directly in the database as binary data using Django's `BinaryField`. This provides better portability, easier backups, and simpler deployment compared to filesystem storage.

**Important:** Files are always associated with a specific agent. The `agent_id` is required when uploading files and is included in all file responses as `agent_name`.

---

## Standard CRUD Operations

### 1. GET `/api/files/` - List Files

**Purpose:** Returns list of all file attachments owned by the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `agent_id` (optional, UUID): Filter files by agent

**Request Body:** None

**Response (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "agent_name": "Email Assistant",
    "original_filename": "document.pdf",
    "file_size": 1024,
    "mime_type": "application/pdf",
    "uploaded_at": "2024-01-01T00:00:00Z",
    "download_url": "http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/"
  }
]
```

**Notes:**

- Only returns files owned by the authenticated user
- Ordered by upload date (newest first)
- Each file includes a `download_url` to retrieve the binary content
- Each file includes `agent_name` (read-only) showing which agent it belongs to
- Can be filtered by `agent_id` query parameter to get files for a specific agent

---

### 2. POST `/api/files/` - Upload File

**Purpose:** Uploads a new file attachment associated with a specific agent.

**Authentication:** Required

**Request Body:** `multipart/form-data`

```
file: [binary file data]
agent_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6" (UUID, required)
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent_name": "Email Assistant",
  "original_filename": "document.pdf",
  "file_size": 1024,
  "mime_type": "application/pdf",
  "uploaded_at": "2024-01-01T00:00:00Z",
  "download_url": "http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/"
}
```

**Error Responses:**

- `400`: No file provided, no agent_id provided, or agent not found
- `401`: Authentication required
- `500`: Server error during upload

**Notes:**

- **`agent_id` is required** - files must be associated with an agent
- **File content is stored in the database as binary data** (not on filesystem)
- Original filename is preserved
- File size and MIME type are automatically detected
- User is automatically set from authentication token
- Agent must belong to the authenticated user
- Response includes `agent_name` (read-only) for display purposes
- Use the `download_url` to retrieve the file content

**Content-Type:** `multipart/form-data`

---

### 3. GET `/api/files/{id}/` - Get File Details

**Purpose:** Returns detailed information about a specific file.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent_name": "Email Assistant",
  "original_filename": "document.pdf",
  "file_size": 1024,
  "mime_type": "application/pdf",
  "uploaded_at": "2024-01-01T00:00:00Z",
  "download_url": "http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/"
}
```

**Error Responses:**

- `401`: Authentication required
- `404`: File not found or not owned by user

---

### 4. DELETE `/api/files/{id}/` - Delete File

**Purpose:** Deletes a file attachment.

**Authentication:** Required

**Request Body:** None

**Response (204 No Content):** Empty response

**Error Responses:**

- `404`: File not found or not owned by user

**Notes:**

- Deletes the file record and binary content from the database
- File content is permanently removed

---

### 5. GET `/api/files/{id}/download/` - Download File Content

**Purpose:** Retrieves the binary file content from the database.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):** Binary file content

**Response Headers:**

- `Content-Type`: MIME type of the file (e.g., `application/pdf`)
- `Content-Disposition`: `attachment; filename="original_filename"`
- `Content-Length`: File size in bytes

**Error Responses:**

- `401`: Authentication required
- `404`: File not found, file content not found, or not owned by user
- `500`: Server error during download

**Notes:**

- Returns the actual binary file content stored in the database
- Content-Type header is set based on the stored MIME type
- File is served as a download with the original filename

**Example:**

```bash
curl -X GET http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/ \
  -H "Cookie: access=<jwt_token>" \
  --output document.pdf
```

---

## File Model

### Fields

- `id`: UUID (primary key)
- `agent`: Foreign key to Agent (required - which agent this file belongs to)
- `agent_id`: UUID (write-only - used when uploading)
- `agent_name`: String (read-only - name of the agent for display)
- `file_content`: BinaryField (binary file content stored in database)
- `original_filename`: String (original filename from upload)
- `file_size`: Integer (file size in bytes)
- `mime_type`: String (MIME type, e.g., `"application/pdf"`)
- `uploaded_at`: DateTime
- `user`: Foreign key to User (automatically set)

### Storage

- **Files are stored in the database as binary data** using Django's `BinaryField`
- Original filenames are preserved in the `original_filename` field
- File content is stored in the `file_content` field as binary data
- No filesystem storage is used
- Benefits:
  - Files are included in database backups
  - No need to manage separate file storage
  - Easier deployment (no file system permissions needed)
  - Better portability across environments

---

## Usage Examples

### Upload File (using curl)

```bash
curl -X POST http://localhost:8000/api/files/ \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "agent_id=3fa85f64-5717-4562-b3fc-2c963f66afa6"
```

### Upload File (using JavaScript/FormData)

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("agent_id", "3fa85f64-5717-4562-b3fc-2c963f66afa6");

fetch("/api/files/", {
  method: "POST",
  body: formData,
  credentials: "include", // Include cookies
});
```

### List Files for Specific Agent

```bash
GET /api/files/?agent_id=3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### List Files

```bash
GET /api/files/
```

### Get File Details

```bash
GET /api/files/{id}/
```

### Download File Content

```bash
# Using curl
curl -X GET http://localhost:8000/api/files/{id}/download/ \
  -H "Cookie: access=<jwt_token>" \
  --output filename.pdf

# Using JavaScript
fetch('/api/files/550e8400-e29b-41d4-a716-446655440000/download/', {
  method: 'GET',
  credentials: 'include', // Include cookies
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'filename.pdf';
  a.click();
});
```

### Delete File

```bash
DELETE /api/files/{id}/
```

---

## Integration with Agents

Files can be attached to agent chat messages:

1. Upload file using `POST /api/files/`
2. Get file ID from response
3. Use file ID in `POST /api/agents/{id}/chat/` request:
   ```json
   {
     "message": "Analyze this document",
     "file_ids": ["uuid-1", "uuid-2"]
   }
   ```

The agent will have access to the file's download URL and metadata. The file content can be retrieved using the download endpoint when needed.

---

## Supported File Types

All file types are supported. The MIME type is automatically detected from the file content.

Common types:

- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, GIF, SVG
- Spreadsheets: XLS, XLSX, CSV
- Archives: ZIP, RAR, TAR

---

## Security Notes

- Users can only see/manage their own files
- File content is stored securely in the database
- File size limits may be configured at server level (default: 10MB)
- All file operations require authentication
- File content is not exposed in API responses (only metadata and download URLs)

---

## Error Handling

- **No file provided:** Returns 400 with error message
- **Upload failure:** Returns 500 with error details
- **File not found:** Returns 404
- **Permission denied:** Returns 404 (user can't see other users' files)
