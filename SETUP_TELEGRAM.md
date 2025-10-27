# Telegram Setup Guide

## Step 1: Set the Bot Token Secret

You need to add the Telegram bot token as a Cloudflare Worker secret.

### Using Wrangler CLI

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

When prompted, enter:
```
7654235762:AAHzRXegiy-VngSOFuHb5hxpuDSEJ7cwm_I
```

### Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select **Workers & Pages**
3. Click on your worker: `hono-cloudflare-backend`
4. Go to **Settings** → **Variables**
5. Under **Environment Variables**, click **Add variable**
6. Set:
   - **Variable name**: `TELEGRAM_BOT_TOKEN`
   - **Value**: `7654235762:AAHzRXegiy-VngSOFuHb5hxpuDSEJ7cwm_I`
   - **Type**: Select **Secret** (encrypted)
7. Click **Save**

## Step 2: Test the Integration

### Test with curl

```bash
# Send a simple message (default thread only)
curl -X POST https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/telegram/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"message": "Test message from Worker!"}'

# Send to default + thread 5
curl -X POST https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/telegram/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"message": "Test to multiple threads", "threads": [5]}'

# Send a formatted log
curl -X POST https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/telegram/log \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"level": "INFO", "message": "Worker deployed successfully"}'
```

### Expected Response

```json
{
  "message": "Message sent",
  "results": [
    { "thread": 2, "success": true },
    { "thread": 5, "success": true }
  ],
  "timestamp": "2025-10-27T06:53:00.000Z"
}
```

## Step 3: Verify in Telegram

1. Open your Telegram group
2. Check thread 2 (default) - should see the message
3. If you specified thread 5, check that thread too

## Configuration Details

Current configuration in `src/config/telegram.config.ts`:

```typescript
export const TELEGRAM_CONFIG = {
  groupId: '-1003291431716',
  defaultThread: 2,
  threads: {
    default: 2,
    other: 5
  }
}
```

## Usage in Code

### Simple Message

```typescript
import { TelegramService } from './services/telegram.service'

const telegramService = new TelegramService(env)
await telegramService.logtel('Hello from Worker!')
```

### Message to Multiple Threads

```typescript
await telegramService.logtel('Important alert', [5])
// Sends to thread 2 (default) and thread 5
```

### Formatted Log

```typescript
await telegramService.logtelFormatted('ERROR', 'Database connection failed', [5])
```

## Troubleshooting

### "Bot token not configured" error
- Make sure you set the secret: `wrangler secret put TELEGRAM_BOT_TOKEN`
- Redeploy after setting the secret

### Messages not appearing
- Verify the bot is added to the group
- Check the group ID is correct: `-1003291431716`
- Ensure thread IDs are correct (2 and 5)
- Check Cloudflare logs: `wrangler tail`

### "Chat not found" error
- The bot might not be in the group
- Add the bot to the group and give it permission to send messages

## Next Steps

See `TELEGRAM.md` for:
- Complete API documentation
- Integration examples
- Error handling
- Security best practices
