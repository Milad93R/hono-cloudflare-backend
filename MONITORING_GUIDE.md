# Cloudflare Workers Monitoring Guide

This guide explains how to monitor your Hono Cloudflare Workers application, view logs, and track performance metrics.

## 1. Request Monitoring & Analytics

### What's Being Tracked
Your worker now automatically tracks:
- **Request count** per endpoint
- **Response times** for each request
- **Error rates** and error details
- **Geographic distribution** of requests
- **Status code distribution**
- **User agents** and IP addresses

### Viewing Analytics
1. **Built-in Monitoring Endpoint**: Visit `/api/monitoring/stats` to see current statistics
2. **Cloudflare Dashboard**: Go to Workers & Pages → Your Worker → Analytics
3. **Real-time Logs**: Use `wrangler tail` command (see section 3)

## 2. Error Logging with Conditional Details

### How It Works
- **Basic Error Logging**: All errors are logged with basic information
- **Detailed Error Logging**: Include specific headers to get full error details

### Triggering Detailed Error Logs
Add one of these headers to your requests:
```
X-Debug-Errors: true
X-Log-Errors: true
```

### What Gets Logged
**Basic Error Info (always logged):**
- Timestamp
- Request path and method
- Error message
- User agent, IP, and country

**Detailed Error Info (with headers):**
- Full error stack trace
- All request headers
- Additional debugging information

### Testing Error Logging
Visit `/api/test/error` with the debug header:
```bash
curl -H "X-Debug-Errors: true" https://your-worker.workers.dev/api/test/error
```

## 3. Viewing Logs in Cloudflare Workers

### Method 1: Wrangler CLI (Real-time)
```bash
# View live logs
wrangler tail

# Filter logs by status
wrangler tail --status error

# Filter logs by method
wrangler tail --method POST

# Filter logs by search term
wrangler tail --search "REQUEST_METRICS"
```

### Method 2: Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click on your worker name
4. Go to **Logs** tab
5. Use filters to find specific log entries

### Method 3: Logpush (Advanced)
For high-volume applications, set up Logpush to send logs to external services:
1. Configure Logpush in Cloudflare Dashboard
2. Send logs to services like:
   - Datadog
   - New Relic
   - Splunk
   - Custom HTTP endpoints

## 4. Log Formats and Searching

### Request Metrics Log Format
```json
{
  "level": "info",
  "message": "REQUEST_METRICS: {\"timestamp\":\"2024-01-15T10:30:00.000Z\",\"method\":\"GET\",\"path\":\"/api/hello/world\",\"status\":200,\"duration\":145,\"userAgent\":\"Mozilla/5.0...\",\"ip\":\"192.168.1.1\",\"country\":\"US\"}"
}
```

### Error Log Format
```json
{
  "level": "error", 
  "message": "API_ERROR: {\"timestamp\":\"2024-01-15T10:30:00.000Z\",\"path\":\"/api/test/error\",\"method\":\"GET\",\"error\":\"This is a test error\",\"stack\":\"Error: This is a test error\\n    at...\",\"userAgent\":\"curl/7.68.0\",\"ip\":\"192.168.1.1\",\"country\":\"US\"}"
}
```

### Searching Logs
Use these search terms in Cloudflare Dashboard or wrangler tail:
- `REQUEST_METRICS` - Find all request metrics
- `API_ERROR` - Find all error logs
- `status:500` - Find server errors
- `method:POST` - Find POST requests
- `path:/api/echo` - Find specific endpoint logs

## 5. Setting Up Analytics Engine (Optional)

For advanced analytics, enable Analytics Engine:

1. **Update wrangler.toml**:
```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "worker_analytics"
```

2. **Create the dataset**:
```bash
wrangler analytics-engine create-dataset worker_analytics
```

3. **Query your data**:
```bash
wrangler analytics-engine query worker_analytics "SELECT * FROM worker_analytics LIMIT 10"
```

## 6. Monitoring Best Practices

### Performance Monitoring
- Monitor response times regularly
- Set up alerts for high error rates
- Track geographic performance differences

### Error Monitoring
- Use detailed error logging sparingly (only for debugging)
- Set up alerts for error spikes
- Monitor specific error patterns

### Log Management
- Use structured logging (JSON format)
- Include correlation IDs for request tracing
- Regularly review and clean up old logs

## 7. Useful Commands

```bash
# Deploy with monitoring
wrangler deploy

# View real-time logs
wrangler tail

# View worker analytics
wrangler analytics-engine query worker_analytics "SELECT COUNT(*) as requests FROM worker_analytics WHERE timestamp > NOW() - INTERVAL '1' DAY"

# Test error logging
curl -H "X-Debug-Errors: true" https://your-worker.workers.dev/api/test/error

# View monitoring stats
curl https://your-worker.workers.dev/api/monitoring/stats
```

## 8. Troubleshooting

### Common Issues
1. **Logs not appearing**: Check if observability is enabled in wrangler.toml
2. **Missing metrics**: Ensure middleware is properly configured
3. **Analytics Engine errors**: Verify dataset exists and binding is correct

### Getting Help
- Check Cloudflare Workers documentation
- Use Cloudflare Community forums
- Review worker logs for specific error messages