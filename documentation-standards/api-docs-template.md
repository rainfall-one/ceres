# API Documentation Template

## Overview

Brief description of what this API does and its purpose within the Rainfall platform.

## Base URL

```
https://api.rainfall.one/v1
```

## Authentication

All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.rainfall.one/v1/endpoint
```

## Endpoints

### GET /resource

Retrieves a list of resources.

**Parameters:**
- `limit` (integer, optional): Number of items to return (default: 20, max: 100)
- `offset` (integer, optional): Number of items to skip (default: 0)
- `filter` (string, optional): Filter criteria

**Response:**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "created_at": "2025-08-04T12:00:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.rainfall.one/v1/resource?limit=10&filter=active"
```

### POST /resource

Creates a new resource.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "config": {
    "setting1": "value1",
    "setting2": true
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "resource-123",
    "name": "string",
    "description": "string",
    "config": {
      "setting1": "value1",
      "setting2": true
    },
    "created_at": "2025-08-04T12:00:00Z",
    "updated_at": "2025-08-04T12:00:00Z"
  }
}
```

## Error Handling

All errors follow RFC 7807 (Problem Details for HTTP APIs):

```json
{
  "type": "https://rainfall.one/docs/errors#validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "The request body contains invalid data",
  "instance": "/v1/resource",
  "errors": {
    "name": ["Name is required"],
    "config.setting1": ["Must be a valid email address"]
  }
}
```

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per API key
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp when window resets

## SDKs and Libraries

- **Node.js**: `@rainfall/api-client`
- **Python**: `rainfall-client`
- **Go**: `github.com/rainfall-one/rainfall-go`

## Support

- **Documentation**: https://docs.rainfall.one
- **Issues**: https://github.com/rainfall-one/api-docs/issues
- **Email**: api-support@rainfall.one
