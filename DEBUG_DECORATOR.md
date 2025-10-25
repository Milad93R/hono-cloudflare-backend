# Debug Logs Decorator

## Overview
A reusable middleware decorator that automatically includes captured console logs in API responses when the `X-Debug-Secret` header is provided.

## How It Works

### The `withDebugLogs` Decorator

The decorator is a middleware function that:
1. Executes the route handler
2. Checks if `X-Debug-Secret` header matches the configured secret
3. If matched, retrieves captured logs from context
4. Enhances the JSON response by adding a `debug.logs` field

## Usage

### Basic Usage

Simply add `withDebugLogs` as a middleware parameter before your route handler:

```typescript
app.get('/api/your-endpoint', withDebugLogs, async (c) => {
  console.log('This will be captured')
  console.debug('Debug info')
  console.info('Info message')
  
  return c.json({
    message: 'Success',
    data: { ... }
  })
})
```

### Without Decorator (No Debug Logs)

```typescript
app.get('/api/simple', async (c) => {
  console.log('This will NOT be in response')
  
  return c.json({
    message: 'Success'
  })
})
```

## Request Example

### Without Debug Secret
```bash
curl https://your-worker.dev/api/healthchecker \
  -H "X-API-Key: your-api-key"
```

**Response:**
```json
{
  "message": "Health checker cycle completed",
  "duration": "45 seconds",
  "totalChecks": 3,
  "results": [...]
}
```

### With Debug Secret
```bash
curl https://your-worker.dev/api/healthchecker \
  -H "X-API-Key: your-api-key" \
  -H "X-Debug-Secret: 2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9"
```

**Response:**
```json
{
  "message": "Health checker cycle completed",
  "duration": "45 seconds",
  "totalChecks": 3,
  "results": [...],
  "debug": {
    "logs": [
      {
        "level": "log",
        "message": "Starting health checker cycle",
        "timestamp": "2025-10-25T16:30:00.000Z"
      },
      {
        "level": "log",
        "message": "Preparing to call /health endpoint",
        "timestamp": "2025-10-25T16:30:15.000Z"
      },
      {
        "level": "log",
        "message": "Received response from /health with status: 200",
        "timestamp": "2025-10-25T16:30:15.005Z"
      },
      {
        "level": "debug",
        "message": "Debug: Processing request for /api/test",
        "timestamp": "2025-10-25T16:30:15.010Z"
      }
    ]
  }
}
```

## Captured Log Levels

The decorator captures all console methods:
- ✅ `console.log()`
- ✅ `console.debug()`
- ✅ `console.info()`
- ✅ `console.warn()`
- ✅ `console.error()`

## Current Endpoints Using Decorator

### `/api/test/error`
```typescript
app.get('/api/test/error', withDebugLogs, (c) => {
  console.log('Starting error test endpoint')
  console.debug('Debug: Processing request for', c.req.path)
  console.info('Info: User agent is', c.req.header('User-Agent'))
  console.warn('Warning: About to throw test error')
  throw new Error('This is a test error for monitoring purposes')
})
```

### `/api/healthchecker`
```typescript
app.get('/api/healthchecker', withDebugLogs, async (c) => {
  console.log('Starting health checker cycle')
  // ... 45 second health check cycle
  return c.json({ ... })
})
```

## Adding to New Endpoints

To add debug logging to any endpoint, simply include `withDebugLogs` in the route definition:

```typescript
// Before (no debug logs)
app.get('/api/my-endpoint', async (c) => {
  return c.json({ data: 'value' })
})

// After (with debug logs when X-Debug-Secret is provided)
app.get('/api/my-endpoint', withDebugLogs, async (c) => {
  console.log('Processing request')
  return c.json({ data: 'value' })
})
```

## How It Works Internally

1. **Global Log Capture Middleware** (runs first)
   - Checks for `X-Debug-Secret` header
   - If present, wraps all console methods
   - Stores logs in context: `c.set('capturedLogs', logs)`

2. **Route Handler** (runs second)
   - Your endpoint code executes
   - All console calls are captured

3. **`withDebugLogs` Decorator** (runs last)
   - Checks if `X-Debug-Secret` matches
   - Retrieves `capturedLogs` from context
   - Enhances response JSON with `debug.logs`

## Benefits

✅ **Reusable** - Add to any endpoint with one parameter  
✅ **Automatic** - No manual log collection needed  
✅ **Secure** - Only works with valid secret  
✅ **Non-invasive** - Doesn't affect normal responses  
✅ **Flexible** - Works with success and error responses  

## Security Notes

- Logs are only included when the correct `X-Debug-Secret` is provided
- Never expose the debug secret in public repositories
- Logs may contain sensitive information - use with caution
- Consider rotating the debug secret regularly

## Performance Considerations

- Log capture only activates when `X-Debug-Secret` is provided
- No performance impact on normal requests
- Minimal overhead for debug requests
- Logs are stored in memory during request lifecycle only

## Troubleshooting

### Logs Not Appearing
1. Verify `X-Debug-Secret` header is correct
2. Ensure `withDebugLogs` is added to the route
3. Check that endpoint returns JSON response
4. Confirm `DEBUG_SECRET` is set in Cloudflare Workers secrets

### Logs Missing Some Messages
1. Ensure console calls happen after middleware runs
2. Check that console methods aren't overridden elsewhere
3. Verify logs are called before response is sent

### Response Format Issues
1. Decorator only works with JSON responses
2. Non-JSON responses are returned unchanged
3. Check `content-type` header is `application/json`
