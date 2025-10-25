# Debug Secret Configuration

## Overview
The API uses a secret token to protect detailed error logging. Only requests with the correct secret will receive full error details including stack traces.

## Secret Token
```
2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9
```

## Usage

### Without Secret (Public)
Returns basic error information:
```bash
curl https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/test/error
```

Response:
```json
{
  "error": "Internal Server Error",
  "timestamp": "2025-10-25T11:48:37.345Z",
  "path": "/api/test/error"
}
```

### With Secret (Authorized)
Returns detailed error information with stack trace:
```bash
curl https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/test/error \
  -H "X-Debug-Secret: 2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9"
```

Response:
```json
{
  "error": "Internal Server Error",
  "message": "This is a test error for monitoring purposes",
  "timestamp": "2025-10-25T11:48:45.671Z",
  "path": "/api/test/error",
  "method": "GET",
  "debug": {
    "stack": "Error: This is a test error...",
    "headers": { ... },
    "userAgent": "curl/8.4.0",
    "ip": "87.106.63.105",
    "country": "GB"
  }
}
```

## Configuration

### Cloudflare Workers Secret
The secret is stored as a Cloudflare Workers secret named `DEBUG_SECRET`.

To update the secret:
```bash
echo "your-new-secret" | wrangler secret put DEBUG_SECRET --name hono-cloudflare-backend
```

### Local Development
For local development, add to `.dev.vars` file:
```
DEBUG_SECRET=2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9
```

## Security Notes
- **Keep this secret private** - Do not commit it to public repositories
- **Rotate regularly** - Change the secret periodically for security
- **Use HTTPS only** - Always use HTTPS to prevent secret interception
- **Applies to all endpoints** - Any error in any endpoint can be debugged with this secret

## Rotating the Secret

1. Generate a new secret:
```bash
openssl rand -hex 32
```

2. Update Cloudflare Workers:
```bash
echo "new-secret-here" | wrangler secret put DEBUG_SECRET --name hono-cloudflare-backend
```

3. Update this documentation
4. Notify team members of the new secret
