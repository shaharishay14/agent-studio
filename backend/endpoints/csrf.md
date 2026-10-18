# CSRF Endpoint (`/api/csrf/`)

Complete documentation for CSRF token endpoint.

## Overview

The CSRF endpoint provides CSRF (Cross-Site Request Forgery) tokens for form submissions and state-changing operations. This is essential for SPAs (Single Page Applications) using cookie-based authentication.

**Base Path:** `/api/csrf/`

**Authentication:** Not required

---

## Endpoint

### GET `/api/csrf/` - Get CSRF Token

**Purpose:** Sets a CSRF token cookie for the client and returns success.

**Authentication:** Not required

**Request Body:** None

**Response (200 OK):**

```json
{
  "detail": "CSRF cookie set successfully"
}
```

**Cookies Set:**

- `csrftoken`: CSRF token (HttpOnly, secure in production)

**Notes:**

- This endpoint is used by SPAs to obtain a CSRF token
- The CSRF token is automatically included in subsequent requests via the cookie
- Frontend should call this endpoint on app initialization
- Token is automatically validated on state-changing requests (POST, PUT, PATCH, DELETE)

---

## Usage

### Frontend Integration

**On App Initialization:**

```javascript
// Call this when your app loads
fetch("/api/csrf/", {
  method: "GET",
  credentials: "include", // Important: include cookies
});
```

**Automatic Inclusion:**
The CSRF token is automatically included in requests via:

- Cookie: `csrftoken` (set by this endpoint)
- Header: `X-CSRFToken` (set by axios interceptor or manually)

### Axios Configuration

If using axios, configure it to include CSRF token:

```javascript
// Get CSRF token from cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Add CSRF header to mutating requests
axios.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      config.headers["X-CSRFToken"] = csrf;
    }
  }
  return config;
});
```

---

## Security Notes

- CSRF tokens prevent cross-site request forgery attacks
- Token is stored in HttpOnly cookie (not accessible via JavaScript)
- Token is validated on all state-changing operations
- Token rotates on each request (Django default behavior)
- In production, cookie is marked as `Secure` (HTTPS only)

---

## Error Handling

- **No errors:** Endpoint always succeeds
- **Token validation:** If token is missing or invalid on protected requests, returns 403 Forbidden

---

## When to Call

1. **App Initialization:** Call when SPA loads
2. **After Login:** Call after successful authentication
3. **Before Forms:** Not necessary if using axios interceptor
4. **Manual Forms:** Include token in form if submitting manually

---

## Example Flow

1. **User visits app** → Frontend calls `GET /api/csrf/`
2. **CSRF cookie set** → Browser stores `csrftoken` cookie
3. **User submits form** → Frontend includes `X-CSRFToken` header
4. **Backend validates** → Checks token matches cookie
5. **Request processed** → If valid, request proceeds

---

## Related Endpoints

- All POST/PUT/PATCH/DELETE endpoints require CSRF token
- GET endpoints do not require CSRF token
- Authentication endpoints handle CSRF automatically
