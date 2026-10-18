# Authentication Endpoints (`/api/auth/`)

Complete documentation for all authentication and user management endpoints.

## Overview

The authentication system uses JWT tokens stored in HttpOnly cookies for security. All authentication endpoints are prefixed with `/api/auth/`.

---

## 1. POST `/api/auth/register/` - User Registration

**Purpose:** Creates a new user account and initiates email verification.

**Authentication:** Not required

**Request Body:**

```json
{
  "username": "string", // Required, unique username
  "email": "string", // Required, valid email format
  "password": "string", // Required, minimum 8 characters
  "password_confirm": "string" // Required, must match password
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "agent_count": 0
  }
}
```

**Cookies Set:**

- `access`: JWT access token (HttpOnly, 15 minutes)
- `refresh`: JWT refresh token (HttpOnly, 7 days)

**Error Responses:**

- `400`: Validation errors (passwords don't match, email invalid, username taken)

**Notes:**

- User is automatically marked as unverified (`is_verified=False`)
- Verification email is sent automatically
- UserProfile and EmailAddress records are created

---

## 2. POST `/api/auth/login/` - User Login

**Purpose:** Authenticates user and sets JWT tokens.

**Authentication:** Not required

**Request Body:**

```json
{
  "username": "string", // Required; can be username OR email
  "password": "string" // Required
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "agent_count": 0
  }
}
```

**Cookies Set:**

- `access`: JWT access token (HttpOnly, 15 minutes)
- `refresh`: JWT refresh token (HttpOnly, 7 days)

**Error Responses:**

- `400`: Missing credentials
- `401`: Invalid credentials
- `403`: Email verification required (verification email sent)

**Notes:**

- Email verification is required before login
- Username field accepts both username and email

---

## 3. POST `/api/auth/logout/` - User Logout

**Purpose:** Logs out the current user and clears JWT cookies.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "message": "Successfully logged out"
}
```

**Cookies Deleted:**

- `access`: Removed
- `refresh`: Removed

---

## 4. GET `/api/auth/me/` - Get Current User

**Purpose:** Returns information about the currently authenticated user.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "agent_count": 0
}
```

**Notes:**

- Uses JWT token from HttpOnly `access` cookie
- This is the single source of truth for current user information

---

## 5. POST `/api/auth/password/forgot/` - Forgot Password

**Purpose:** Initiates password reset flow by sending reset email.

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "string" // Required, email address of account
}
```

**Response (200 OK):**

```json
{
  "detail": "If an account exists for that email, a reset link has been sent."
}
```

**Notes:**

- Always returns success to avoid email enumeration
- Sends reset link via EmailJS or Django send_mail
- Reset link contains uid and token

---

## 6. POST `/api/auth/password/reset/` - Reset Password

**Purpose:** Completes password reset using uid/token from email link.

**Authentication:** Not required

**Request Body:**

```json
{
  "uid": "string", // Required, Base64-encoded user UUID
  "token": "string", // Required, Django password reset token
  "password": "string", // Required, minimum 8 characters
  "password_confirm": "string" // Required, must match password
}
```

**Response (200 OK):**

```json
{
  "detail": "Password has been reset successfully."
}
```

**Error Responses:**

- `400`: Invalid uid/token, mismatched passwords, or weak password

---

## 7. POST `/api/auth/email/verify/resend/` - Resend Verification Email

**Purpose:** Resends email verification link to authenticated user.

**Authentication:** Required

**Request Body:** None (uses authenticated user's email)

**Response (200 OK):**

```json
{
  "detail": "Verification email sent."
}
```

**Notes:**

- Email address is automatically retrieved from `request.user.email`
- No email parameter needed
- Generates new verification token

---

## 8. GET `/api/auth/email/verify/confirm/` - Confirm Email Verification

**Purpose:** Verifies user email using uid/token from verification link.

**Authentication:** Not required

**Query Parameters:**

- `uid`: Base64-encoded user ID (required)
- `token`: Email verification token (required)

**Response:** Redirects to frontend verification page with status:

- Success: `?status=success`
- Error: `?status=error&message=...`

**Notes:**

- Updates both EmailAddress.verified and UserProfile.is_verified
- Redirects to frontend instead of returning JSON

---

## 9. POST `/api/auth/token/refresh-cookie/` - Refresh Access Token

**Purpose:** Refreshes the JWT access token using refresh token from cookie.

**Authentication:** Required (refresh token in cookie)

**Request Body:** None

**Response (200 OK):**

```json
{
  "detail": "Access token refreshed"
}
```

**Cookies Set:**

- `access`: New JWT access token (HttpOnly, 15 minutes)

**Notes:**

- Reads refresh token from HttpOnly `refresh` cookie
- Issues new access token stored in HttpOnly `access` cookie
- Essential for maintaining authenticated sessions

---

## 10. POST `/api/auth/google/` - Google OAuth Login

**Purpose:** Authenticates user via Google OAuth.

**Authentication:** Not required

**Request Body:**

```json
{
  "access_token": "string" // Optional, Google OAuth access token
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "agent_count": 0
  }
}
```

**Cookies Set:**

- `access`: JWT access token (HttpOnly, 15 minutes)
- `refresh`: JWT refresh token (HttpOnly, 7 days)

**Notes:**

- Creates user account if doesn't exist
- Automatically verifies email for OAuth users

---

## 11. POST `/api/auth/github/` - GitHub OAuth Login

**Purpose:** Authenticates user via GitHub OAuth.

**Authentication:** Not required

**Request Body:**

```json
{
  "code": "string" // Required, GitHub OAuth authorization code
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "agent_count": 0
  }
}
```

**Cookies Set:**

- `access`: JWT access token (HttpOnly, 15 minutes)
- `refresh`: JWT refresh token (HttpOnly, 7 days)

**Notes:**

- Creates user account if doesn't exist
- Automatically verifies email for OAuth users

---

## Authentication Flow Summary

1. **Registration/Login** → Receive JWT tokens in cookies
2. **Access Token Expires** (15 min) → Call `/api/auth/token/refresh-cookie/`
3. **Refresh Token Expires** (7 days) → User must login again
4. **Email Verification** → Required before first login (except OAuth)
5. **Password Reset** → Use forgot/reset endpoints

## Security Notes

- All JWT tokens are stored in HttpOnly cookies (not accessible via JavaScript)
- CSRF protection enabled for state-changing operations
- Password reset tokens expire after use
- Email verification tokens expire after set period
