# MongoDB Data API Setup Guide

MongoDB's native driver doesn't work in Cloudflare Workers due to network limitations. Instead, we use MongoDB's HTTP-based Data API which works perfectly with Workers.

## Step 1: Enable Data API in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster: **Cluster0**
3. Click **Data API** in the left sidebar (under "Services")
4. Click **Enable the Data API**
5. Create an API Key:
   - Click **Create API Key**
   - Give it a name (e.g., "Cloudflare Worker")
   - Copy the API Key (you won't see it again!)
6. Note the **Data API URL** (looks like: `https://data.mongodb-api.com/app/<app-id>/endpoint/data/v1`)

## Step 2: Set Cloudflare Worker Secrets

You need to set 3 secrets:

### Using Cloudflare Dashboard (Recommended)

1. Go to https://dash.cloudflare.com/
2. **Workers & Pages** → `hono-cloudflare-backend`
3. **Settings** → **Variables**
4. Add these 3 secrets:

**Secret 1: MONGODB_DATA_API_KEY**
- Name: `MONGODB_DATA_API_KEY`
- Value: `<your-api-key-from-step-1>`
- Type: **Secret**

**Secret 2: MONGODB_DATA_API_URL**
- Name: `MONGODB_DATA_API_URL`
- Value: `https://data.mongodb-api.com/app/<your-app-id>/endpoint/data/v1`
- Type: **Secret**

**Secret 3: MONGODB_DATABASE**
- Name: `MONGODB_DATABASE`
- Value: `test` (or your database name)
- Type: **Secret**

### Using Wrangler CLI

```bash
npx wrangler secret put MONGODB_DATA_API_KEY
# Paste your API key

npx wrangler secret put MONGODB_DATA_API_URL
# Paste: https://data.mongodb-api.com/app/<your-app-id>/endpoint/data/v1

npx wrangler secret put MONGODB_DATABASE
# Enter: test
```

## Step 3: Test the Integration

### Create a Test Document

```bash
curl -X POST "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'
```

**Expected Response:**
```json
{
  "message": "Document created",
  "collection": "users",
  "insertedId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-10-27T09:00:00.000Z"
}
```

### Get All Documents

```bash
curl -X GET "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Get Document by ID

```bash
curl -X GET "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users/507f1f77bcf86cd799439011" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Update Document

```bash
curl -X PUT "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"email": "john.doe@example.com", "age": 31}'
```

### Delete Document

```bash
curl -X DELETE "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users/507f1f77bcf86cd799439011" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Query Documents

```bash
curl -X POST "https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/users/query" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"query": {"age": {"$gte": 25}}, "limit": 10}'
```

## Important Notes

### List Collections Not Supported

The `/api/mongodb/collections` endpoint will return an error because MongoDB Data API doesn't support listing collections. Use MongoDB Atlas UI to view collections instead.

### ObjectId Format

When querying by `_id`, use the `$oid` operator:
```json
{
  "_id": { "$oid": "507f1f77bcf86cd799439011" }
}
```

### Data Source Name

The Data API uses "Cluster0" as the data source name by default. If your cluster has a different name, you'll need to update it in `src/services/mongodb-dataapi.service.ts`.

## Troubleshooting

### "MongoDB Data API not configured"

**Solution:** Set all 3 secrets (MONGODB_DATA_API_KEY, MONGODB_DATA_API_URL, MONGODB_DATABASE)

### "MongoDB Data API error: Unauthorized"

**Possible causes:**
1. Invalid API key
2. API key not enabled
3. Wrong Data API URL

**Solution:**
1. Go to MongoDB Atlas → Data API
2. Verify API key is active
3. Copy the correct Data API URL
4. Update secrets in Cloudflare

### "MongoDB Data API error: Not found"

**Possible causes:**
1. Wrong database name
2. Collection doesn't exist
3. Document doesn't exist

**Solution:**
1. Verify MONGODB_DATABASE secret matches your database name
2. Create the collection in MongoDB Atlas first
3. Check document ID is correct

## Why Data API Instead of Native Driver?

Cloudflare Workers have limitations:
- ❌ No TCP sockets
- ❌ Limited Node.js APIs
- ❌ Connection pooling doesn't work well
- ❌ "Too many subrequests" errors

MongoDB Data API:
- ✅ HTTP-based (uses fetch API)
- ✅ Works perfectly in Workers
- ✅ No connection management needed
- ✅ Simple and reliable
- ✅ Officially supported by MongoDB

## MongoDB Data API Documentation

- [MongoDB Data API Docs](https://www.mongodb.com/docs/atlas/api/data-api/)
- [Data API Endpoints](https://www.mongodb.com/docs/atlas/api/data-api-resources/)
- [Enable Data API](https://www.mongodb.com/docs/atlas/api/data-api/#enable-the-data-api)

## Next Steps

- Create indexes in MongoDB Atlas for better performance
- Set up IP access list (Data API works from anywhere)
- Monitor API usage in MongoDB Atlas
- Consider rate limiting for production
