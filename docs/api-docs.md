# API Documentation

## Overview

The RFP Contract Management System provides a RESTful API built with FastAPI. The API supports the complete RFP lifecycle from creation to contract award, including user authentication, document management, and search functionality.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Access tokens are returned in the response body, while refresh tokens are stored in HTTP-only cookies.

### Authentication Flow

1. **Register/Login**: Get access token and refresh token
2. **API Requests**: Include access token in Authorization header
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate refresh token

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "buyer"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "buyer"
  }
}
```

#### Login User

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "buyer"
  }
}
```

#### Refresh Token

```http
POST /auth/refresh
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Logout

```http
POST /auth/logout
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

#### Get Current User

```http
GET /auth/me
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "buyer"
}
```

### RFP Management Endpoints

#### List RFPs

```http
GET /rfps?page=1&limit=10&status=PUBLISHED
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by RFP status

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Software Development RFP",
      "description": "We need a web application...",
      "status": "PUBLISHED",
      "deadline": "2023-12-31T23:59:59Z",
      "created_at": "2023-01-01T00:00:00Z",
      "owner_id": 1
    }
  ],
  "total": 25,
  "page": 1,
  "total_pages": 3
}
```

#### Create RFP

```http
POST /rfps
```

**Request Body:**
```json
{
  "title": "Software Development RFP",
  "description": "We need a web application for our business",
  "requirements": "React, Node.js, PostgreSQL"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Software Development RFP",
  "description": "We need a web application for our business",
  "requirements": "React, Node.js, PostgreSQL",
  "status": "DRAFT",
  "deadline": null,
  "created_at": "2023-01-01T00:00:00Z",
  "owner_id": 1
}
```

#### Get RFP Details

```http
GET /rfps/{id}
```

**Response:**
```json
{
  "id": 1,
  "title": "Software Development RFP",
  "description": "We need a web application for our business",
  "requirements": "React, Node.js, PostgreSQL",
  "status": "PUBLISHED",
  "deadline": "2023-12-31T23:59:59Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "owner_id": 1
}
```

#### Update RFP

```http
PUT /rfps/{id}
```

**Request Body:**
```json
{
  "title": "Updated Software Development RFP",
  "description": "Updated description",
  "status": "PUBLISHED"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Software Development RFP",
  "description": "Updated description",
  "status": "PUBLISHED",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

#### Submit Response

```http
POST /rfps/{id}/respond
```

**Request Body:**
```json
{
  "content": "We can provide the requested software development services..."
}
```

**Response:**
```json
{
  "ok": true
}
```

#### Change RFP Status

```http
PATCH /rfps/{id}/status?new_status=UNDER_REVIEW
```

**Response:**
```json
{
  "id": 1,
  "title": "Software Development RFP",
  "status": "UNDER_REVIEW",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### File Upload Endpoints

#### Get Presigned URL

```http
POST /uploads/presign
```

**Request Body:**
```json
{
  "filename": "document.pdf",
  "content_type": "application/pdf"
}
```

**Response:**
```json
{
  "presigned_url": "https://s3.amazonaws.com/bucket/document.pdf?signature=...",
  "filename": "document.pdf"
}
```

#### Complete Upload

```http
POST /uploads/complete
```

**Request Body:**
```json
{
  "filename": "document.pdf",
  "rfp_id": 1,
  "document_type": "specification"
}
```

**Response:**
```json
{
  "document_id": 1,
  "version_number": 1
}
```

### Document Versioning Endpoints

#### List Document Versions

```http
GET /documents/{document_id}/versions
```

**Response:**
```json
[
  {
    "id": 1,
    "version_number": 1,
    "filename": "document.pdf",
    "uploaded_by": 1,
    "notes": null,
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "version_number": 2,
    "filename": "document_v2.pdf",
    "uploaded_by": 1,
    "notes": "Updated with new requirements",
    "created_at": "2023-01-02T00:00:00Z"
  }
]
```

#### Upload New Version

```http
POST /documents/{document_id}/versions
```

**Request Body:**
```json
{
  "filename": "document_v2.pdf",
  "notes": "Updated with new requirements"
}
```

**Response:**
```json
{
  "id": 2,
  "version_number": 2,
  "filename": "document_v2.pdf",
  "notes": "Updated with new requirements",
  "created_at": "2023-01-02T00:00:00Z"
}
```

#### Revert to Version

```http
POST /documents/{document_id}/versions/{version_number}/revert
```

**Response:**
```json
{
  "id": 3,
  "version_number": 3,
  "filename": "document.pdf",
  "notes": "Reverted to version 1",
  "created_at": "2023-01-03T00:00:00Z"
}
```

#### Get Version Preview

```http
GET /documents/{document_id}/versions/{version_number}/preview
```

**Response:**
```json
{
  "preview_url": "https://s3.amazonaws.com/bucket/document.pdf?signature=..."
}
```

### Search Endpoints

#### Search RFPs

```http
GET /rfps/search?q=software&status=PUBLISHED&page=1&limit=10
```

**Query Parameters:**
- `q`: Search query
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Software Development RFP",
      "description": "We need a web application...",
      "status": "PUBLISHED",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "total_pages": 1
}
```

### Health Check

#### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Validation Errors

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

## Pagination

Most list endpoints support pagination:

- `page`: Page number (1-based)
- `limit`: Items per page (max 100)
- Response includes `total`, `page`, and `total_pages`

## Filtering and Sorting

### RFP Endpoints

- `status`: Filter by RFP status
- `owner_id`: Filter by RFP owner
- `created_at`: Sort by creation date
- `deadline`: Filter by deadline

### Search Endpoints

- `q`: Full-text search query
- `status`: Filter by status
- `date_range`: Filter by date range

## WebSocket Support

The API supports WebSocket connections for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

## API Versioning

The API uses URL versioning:

- Current version: `/api/v1/`
- Future versions: `/api/v2/`, etc.

## OpenAPI Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## SDKs and Client Libraries

### JavaScript/TypeScript

```typescript
import { RFPClient } from '@rfp/client';

const client = new RFPClient({
  baseURL: 'http://localhost:8000',
  apiKey: 'your-api-key'
});

const rfps = await client.rfps.list();
```

### Python

```python
from rfp_client import RFPClient

client = RFPClient(
    base_url='http://localhost:8000',
    api_key='your-api-key'
)

rfps = client.rfps.list()
```

## Testing

### Test Environment

- **Base URL**: `http://localhost:8000`
- **Test Database**: Separate test database
- **Mock Services**: S3 and email services mocked

### Test Data

The API provides test data endpoints for development:

```http
POST /test/seed-data
```

This creates sample users, RFPs, and responses for testing.

## Monitoring and Logging

### Health Checks

- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Database Health**: `GET /health/database`

### Metrics

- **Request Count**: Total API requests
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests
- **Active Users**: Currently active users

### Logging

All API requests are logged with:

- Request method and URL
- Response status code
- Response time
- User ID (if authenticated)
- IP address
- User agent

## Security

### Authentication

- JWT tokens with configurable expiration
- Refresh tokens stored in HTTP-only cookies
- Password hashing with bcrypt

### Authorization

- Role-based access control (RBAC)
- Resource-level permissions
- API key authentication for service-to-service

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

### Rate Limiting

- IP-based rate limiting
- User-based rate limiting
- Endpoint-specific limits

## Performance

### Caching

- Redis caching for frequently accessed data
- HTTP caching headers
- Database query caching

### Optimization

- Async/await for non-blocking operations
- Database connection pooling
- Query optimization
- Response compression

### Scaling

- Horizontal scaling support
- Load balancer ready
- Database read replicas
- CDN integration