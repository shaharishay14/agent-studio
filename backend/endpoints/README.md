# API Endpoints Documentation

This directory contains comprehensive documentation for all API endpoints in the Agent Studio platform.

## Documentation Files

- **[auth.md](./auth.md)** - Authentication endpoints (`/api/auth/`)
- **[agents.md](./agents.md)** - AI Agent management endpoints (`/api/agents/`)
- **[connections.md](./connections.md)** - Tool integration endpoints (`/api/connections/`)
- **[files.md](./files.md)** - File upload and management endpoints (`/api/files/`)
- **[triggers.md](./triggers.md)** - Trigger automation endpoints (`/api/triggers/`)
- **[workflows.md](./workflows.md)** - Workflow management endpoints (`/api/workflows/`)
- **[csrf.md](./csrf.md)** - CSRF token endpoint (`/api/csrf/`)

## Base URL

All endpoints are prefixed with `/api/`:

- **Development:** `http://localhost:8000/api/`
- **Production:** `https://your-domain.com/api/`

## Authentication

Most endpoints require authentication via JWT tokens stored in HttpOnly cookies. The authentication flow:

1. Register or login to receive JWT tokens in cookies
2. Tokens are automatically included in subsequent requests
3. Access token expires after 15 minutes
4. Refresh token expires after 7 days

See [auth.md](./auth.md) for detailed authentication endpoints.

## Interactive Documentation

For interactive API testing and exploration:

- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/docs/redoc/`
- **OpenAPI Schema:** `http://localhost:8000/api/schema/`

## Quick Reference

| Endpoint Group | Base Path           | Auth Required | Description                                                  |
| -------------- | ------------------- | ------------- | ------------------------------------------------------------ |
| Auth           | `/api/auth/`        | Mixed         | User registration, login, password reset, email verification |
| Agents         | `/api/agents/`      | Yes           | Create, manage, and chat with AI agents                      |
| Connections    | `/api/connections/` | Yes           | Connect and manage third-party tool integrations             |
| Files          | `/api/files/`       | Yes           | Upload and manage file attachments                           |
| Triggers       | `/api/triggers/`    | Yes           | Create and manage automation triggers                        |
| Workflows      | `/api/workflows/`   | Yes           | Build and execute visual workflows                           |
| CSRF           | `/api/csrf/`        | No            | Get CSRF token for form submissions                          |
