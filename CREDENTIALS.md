# API Credentials

## API Key (X-API-Key)

**Required for all endpoints except `/health`**

```
615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642
```

### Usage:
```bash
curl https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/test/error \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Endpoints requiring API key:
- ✅ `/api/test/error`
- ✅ Any future API endpoints
- ❌ `/health` (public, no auth required)
- ❌ `/docs` (uses basic auth instead)
- ❌ `/openapi.json` (public for Swagger UI)

---

## Debug Secret (X-Debug-Secret)

**Optional - Enables detailed error logging with stack traces and captured console logs**

```
2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9
```

### Usage:
```bash
curl https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/test/error \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -H "X-Debug-Secret: 2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9"
```

---

## Swagger UI Credentials

**Required to access `/docs` endpoint**

- **Username:** `admin`
- **Password:** `0569965c6b523698082e27c52d1c0c34`

### Access:
1. Navigate to: https://hono-cloudflare-backend.mrashidikhah32.workers.dev/docs
2. Browser will prompt for credentials
3. Enter username: `admin`
4. Enter password: `0569965c6b523698082e27c52d1c0c34`

### Using curl:
```bash
curl -u admin:0569965c6b523698082e27c52d1c0c34 \
  https://hono-cloudflare-backend.mrashidikhah32.workers.dev/docs
```

---

## Security Notes

⚠️ **KEEP THESE CREDENTIALS PRIVATE**

- Do not commit this file to public repositories
- Share credentials only with authorized team members
- Rotate credentials regularly
- Use environment variables in CI/CD pipelines

## Updating Credentials

### Update API Key:
```bash
echo "new-api-key" | wrangler secret put API_KEY --name hono-cloudflare-backend
```

### Update Debug Secret:
```bash
echo "new-debug-secret" | wrangler secret put DEBUG_SECRET --name hono-cloudflare-backend
```

### Update Swagger Username:
```bash
echo "new-username" | wrangler secret put SWAGGER_USERNAME --name hono-cloudflare-backend
```

### Update Swagger Password:
```bash
echo "new-password" | wrangler secret put SWAGGER_PASSWORD --name hono-cloudflare-backend
```

---

## Quick Reference

| Credential | Type | Required For | Value |
|------------|------|--------------|-------|
| API Key | Header: `X-API-Key` | All API endpoints (except `/health`) | `615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642` |
| Debug Secret | Header: `X-Debug-Secret` | Optional debug mode | `2728810e1c212fff21b353de2cdb5b272fdd489cbd4824b330148c9808ad3af9` |
| Swagger Username | Basic Auth | `/docs` access | `admin` |
| Swagger Password | Basic Auth | `/docs` access | `0569965c6b523698082e27c52d1c0c34` |
