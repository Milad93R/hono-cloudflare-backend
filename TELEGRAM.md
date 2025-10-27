# Telegram Integration

This project includes Telegram integration for sending log messages and notifications to a Telegram group with thread support.

## Configuration

### Telegram Bot Token

The bot token is stored as a Cloudflare Worker secret:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
# Enter: 7654235762:AAHzRXegiy-VngSOFuHb5hxpuDSEJ7cwm_I
```

### Group and Thread Configuration

Configuration is stored in `src/config/telegram.config.ts`:

- **Group ID**: `-1003291431716`
- **Default Thread**: `2` (always receives messages)
- **Other Thread**: `5` (optional)

## Usage

### Using the TelegramService

```typescript
import { TelegramService } from './services/telegram.service'

// Initialize service
const telegramService = new TelegramService(env)

// Send to default thread only
await telegramService.logtel('Hello from Worker!')

// Send to default + additional threads
await telegramService.logtel('Important message', [5])

// Send formatted log with level
await telegramService.logtelFormatted('ERROR', 'Something went wrong', [5])
```

### API Endpoints

#### POST /api/telegram/send

Send a message to Telegram threads.

**Request:**
```json
{
  "message": "Your message here",
  "threads": [5]  // Optional: additional threads (default thread always included)
}
```

**Response:**
```json
{
  "message": "Message sent",
  "results": [
    { "thread": 2, "success": true },
    { "thread": 5, "success": true }
  ],
  "timestamp": "2025-10-27T06:50:00.000Z"
}
```

**Example:**
```bash
curl -X POST https://your-worker.dev/api/telegram/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"message": "Test message", "threads": [5]}'
```

#### POST /api/telegram/log

Send a formatted log message with level.

**Request:**
```json
{
  "level": "ERROR",
  "message": "Database connection failed",
  "threads": [5]  // Optional
}
```

**Response:**
```json
{
  "message": "Log sent",
  "level": "ERROR",
  "results": [
    { "thread": 2, "success": true },
    { "thread": 5, "success": true }
  ],
  "timestamp": "2025-10-27T06:50:00.000Z"
}
```

**Example:**
```bash
curl -X POST https://your-worker.dev/api/telegram/log \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"level": "WARN", "message": "High memory usage detected"}'
```

#### GET /api/telegram/threads

Get available thread IDs.

**Response:**
```json
{
  "threads": {
    "DEFAULT": 2,
    "OTHER": 5
  },
  "description": {
    "DEFAULT": "Default thread - always included",
    "OTHER": "Additional thread"
  }
}
```

## Thread Behavior

### Default Thread Only
If you don't specify any threads, the message goes to the default thread (ID: 2) only:

```typescript
await telegramService.logtel('Message to default only')
```

### Default + Additional Threads
If you specify threads, the message goes to both the default thread AND the specified threads:

```typescript
await telegramService.logtel('Message to both', [5])
// Sends to thread 2 (default) and thread 5
```

### Duplicate Prevention
The service automatically prevents duplicate sends if you explicitly include the default thread:

```typescript
await telegramService.logtel('Message', [2, 5])
// Still only sends once to thread 2, and once to thread 5
```

## Message Formatting

### Plain Messages
```typescript
await telegramService.logtel('Simple text message')
```

### Formatted Logs
```typescript
await telegramService.logtelFormatted('INFO', 'Server started successfully')
// Sends: [INFO] 2025-10-27T06:50:00.000Z
//        Server started successfully
```

### HTML Formatting
Messages support HTML formatting:

```typescript
await telegramService.logtel('<b>Bold</b> and <i>italic</i> text')
```

## Error Handling

The service returns detailed results for each thread:

```typescript
const results = await telegramService.logtel('Test', [2, 5, 999])
// results = [
//   { thread: 2, success: true },
//   { thread: 5, success: true },
//   { thread: 999, success: false, error: "Thread not found" }
// ]
```

## Integration Examples

### In Error Handler

```typescript
// src/handlers/error.handler.ts
import { TelegramService } from '../services/telegram.service'

export const errorHandler = async (err: Error, c: Context) => {
  const telegramService = new TelegramService(c.env)
  await telegramService.logtelFormatted(
    'ERROR',
    `Error in ${c.req.path}: ${err.message}`,
    [5] // Send to default + thread 5
  )
  
  return c.json({ error: err.message }, 500)
}
```

### In Cron Job

```typescript
// src/handlers/scheduled.handler.ts
import { TelegramService } from '../services/telegram.service'

export const createScheduledHandler = (app: Hono) => {
  return async (event: ScheduledEvent, env: Bindings) => {
    const telegramService = new TelegramService(env)
    
    try {
      // Run health check
      const result = await runHealthCheck()
      
      if (!result.success) {
        await telegramService.logtelFormatted(
          'WARN',
          'Health check failed',
          [5]
        )
      }
    } catch (error) {
      await telegramService.logtelFormatted(
        'ERROR',
        `Cron job error: ${error.message}`
      )
    }
  }
}
```

### In Controller

```typescript
// src/controllers/user.controller.ts
import { TelegramService } from '../services/telegram.service'

export class UserController {
  async createUser(c: Context) {
    try {
      const user = await createUserInDB(data)
      
      const telegramService = new TelegramService(c.env)
      await telegramService.logtel(
        `New user created: ${user.email}`,
        [5]
      )
      
      return c.json({ user })
    } catch (error) {
      // Handle error
    }
  }
}
```

## Testing

Test the integration locally:

```bash
# Start dev server
npm run dev

# Send test message
curl -X POST http://localhost:8787/api/telegram/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"message": "Test from local dev"}'
```

## Deployment

1. Set the secret in Cloudflare:
   ```bash
   wrangler secret put TELEGRAM_BOT_TOKEN
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Verify:
   ```bash
   curl -X POST https://your-worker.dev/api/telegram/send \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{"message": "Deployment successful!"}'
   ```

## Troubleshooting

### Bot Token Not Working
- Verify the token is correct
- Check that the bot is added to the group
- Ensure the bot has permission to send messages

### Thread Not Found
- Verify thread IDs in `src/config/telegram.config.ts`
- Check that threads exist in the Telegram group
- Ensure the bot has access to the threads

### Messages Not Sending
- Check Cloudflare Worker logs: `wrangler tail`
- Verify the group ID is correct
- Ensure the bot is not restricted in the group

## Security Notes

- ✅ Bot token stored as Cloudflare secret (not in code)
- ✅ Endpoints protected by API key authentication
- ✅ Group ID and thread IDs in config (not sensitive)
- ⚠️ Be careful what information you send to Telegram
- ⚠️ Consider rate limiting for production use
