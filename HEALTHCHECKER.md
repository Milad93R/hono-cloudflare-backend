# Health Checker Cron Job

## Overview
Automated health monitoring system that runs every minute via Cloudflare Workers cron trigger.

## How It Works

### Cron Schedule
- **Frequency:** Every minute (`* * * * *`)
- **Configured in:** `wrangler.toml`
- **Handler:** `scheduled` function in `src/index.ts`

### Health Check Cycle (45 seconds)

The health checker follows this timing logic:

1. **Every 5 seconds:** Check if we've crossed a 15-second boundary
2. **At 15s, 30s:** Call `/health` endpoint (when crossing 15s boundaries)
3. **At 45s:** Final health check and return results

#### Timing Breakdown:
```
0s   → Start cycle
5s   → Check (no action - haven't crossed 15s yet)
10s  → Check (no action - haven't crossed 15s yet)
15s  → Check (CALL /health - crossed first 15s boundary)
20s  → Check (no action - already checked at 15s)
25s  → Check (no action - already checked at 15s)
30s  → Check (CALL /health - crossed second 15s boundary)
35s  → Check (no action - already checked at 30s)
40s  → Check (no action - already checked at 30s)
45s  → CALL /health (final check) + return results
```

## API Endpoint

### `/api/healthchecker`

**Method:** GET  
**Authentication:** Requires `X-API-Key` header  
**Duration:** ~45 seconds

#### Request:
```bash
curl "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/healthchecker" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

#### Response:
```json
{
  "message": "Health checker cycle completed",
  "duration": "45 seconds",
  "totalChecks": 4,
  "results": [
    {
      "time": 15000,
      "status": "success",
      "response": {
        "status": "healthy",
        "service": "hono-cloudflare-worker"
      }
    },
    {
      "time": 30000,
      "status": "success",
      "response": {
        "status": "healthy",
        "service": "hono-cloudflare-worker"
      }
    },
    {
      "time": 45000,
      "status": "success",
      "response": {
        "status": "healthy",
        "service": "hono-cloudflare-worker"
      }
    }
  ]
}
```

## Cron Job Behavior

### Automatic Execution
- Runs **every minute** automatically
- No manual intervention required
- Logs visible in Cloudflare Workers dashboard

### What the Cron Does:
1. Triggers at the start of each minute
2. Calls `/api/healthchecker` endpoint with API key
3. Waits for the 45-second cycle to complete
4. Logs the results to console

### Viewing Cron Logs

**Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com
2. Navigate to: Workers & Pages → hono-cloudflare-backend
3. Click: Logs (Real-time Logs or Logpush)
4. Look for: `Cron job triggered at:` messages

**Using Wrangler CLI:**
```bash
wrangler tail --name hono-cloudflare-backend
```

## Testing

### Manual Test (Endpoint)
```bash
# Test the health checker endpoint directly
curl "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/healthchecker" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Trigger Cron Manually (Development)
```bash
# Using wrangler dev with cron simulation
wrangler dev --test-scheduled
```

## Configuration

### Modify Cron Schedule

Edit `wrangler.toml`:
```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

**Common Cron Patterns:**
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 */6 * * *` - Every 6 hours

### Modify Health Check Timing

Edit `src/index.ts` in the `/api/healthchecker` endpoint:

```typescript
// Change check interval (currently 5 seconds)
await new Promise(resolve => setTimeout(resolve, 5000))

// Change boundary interval (currently 15 seconds)
const currentInterval = Math.floor(elapsed / 15000)

// Change total duration (currently 45 seconds)
while (elapsed < 45000) {
```

## Monitoring

### Expected Behavior
- ✅ Cron triggers every minute
- ✅ Health checks run at 15s, 30s, 45s
- ✅ All checks should return `"status": "healthy"`
- ✅ Total checks: 3-4 per cycle

### Alert Conditions
- ❌ Health check returns error
- ❌ Health check times out
- ❌ Cron job fails to trigger
- ❌ Unexpected number of checks

## Troubleshooting

### Cron Not Triggering
1. Check `wrangler.toml` has correct syntax
2. Verify deployment succeeded
3. Check Cloudflare Workers dashboard for errors
4. Ensure cron triggers are enabled in Cloudflare

### Health Checks Failing
1. Verify `/health` endpoint is accessible
2. Check API key is correct
3. Review worker logs for errors
4. Test `/health` endpoint manually

### Timing Issues
1. Cloudflare Workers have CPU time limits
2. Long-running requests may be terminated
3. Consider adjusting timing intervals if needed

## Disabling Cron

To disable the cron job:

1. **Option 1:** Remove from `wrangler.toml`
```toml
# Comment out or remove:
# [triggers]
# crons = ["* * * * *"]
```

2. **Option 2:** Disable in Cloudflare Dashboard
   - Go to Worker settings
   - Disable cron triggers

3. **Redeploy:**
```bash
wrangler deploy
```

## Cost Considerations

- Each cron execution counts as a worker request
- 60 executions per hour (every minute)
- 1,440 executions per day
- Each execution makes 3-4 health check requests
- Total: ~4,320-5,760 requests per day from cron alone

**Cloudflare Workers Free Tier:** 100,000 requests/day  
This cron job uses ~4-6% of free tier daily quota.
