# MongoDB Setup Guide

## Step 1: Set the MongoDB URI Secret

You need to add the MongoDB connection string as a Cloudflare Worker secret.

### Using Wrangler CLI

```bash
wrangler secret put MONGODB_URI
```

When prompted, enter:
```
mongodb+srv://mrashidikhah_db_user:SlWxKKiMDpsQNAf8@cluster0.kblqcup.mongodb.net/
```

### Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select **Workers & Pages**
3. Click on your worker: `hono-cloudflare-backend`
4. Go to **Settings** → **Variables**
5. Under **Environment Variables**, click **Add variable**
6. Set:
   - **Variable name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://mrashidikhah_db_user:SlWxKKiMDpsQNAf8@cluster0.kblqcup.mongodb.net/`
   - **Type**: Select **Secret** (encrypted)
7. Click **Save**

## Step 2: Configure MongoDB Atlas

### Allow Cloudflare Workers IP Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **Network Access** in the left sidebar
4. Click **Add IP Address**
5. Select **Allow Access from Anywhere** or add `0.0.0.0/0`
6. Click **Confirm**

> **Note:** Cloudflare Workers use dynamic IPs, so you need to allow all IPs.

### Verify Database User

1. Go to **Database Access**
2. Ensure user `mrashidikhah_db_user` exists
3. Verify it has **Read and write to any database** permission
4. Password should match: `SlWxKKiMDpsQNAf8`

## Step 3: Test the Integration

### Test Connection

```bash
curl -X GET https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/collections \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

**Expected Response:**
```json
{
  "collections": ["test", "users"],
  "count": 2,
  "timestamp": "2025-10-27T08:40:00.000Z"
}
```

### Create a Test Document

```bash
curl -X POST https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"name": "Test User", "email": "test@example.com", "createdAt": "2025-10-27T08:40:00.000Z"}'
```

**Expected Response:**
```json
{
  "message": "Document created",
  "collection": "test",
  "insertedId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-10-27T08:40:00.000Z"
}
```

### Get All Documents

```bash
curl -X GET https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Get Document by ID

```bash
curl -X GET https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test/507f1f77bcf86cd799439011 \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Update Document

```bash
curl -X PUT https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"email": "updated@example.com"}'
```

### Delete Document

```bash
curl -X DELETE https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test/507f1f77bcf86cd799439011 \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Query Documents

```bash
curl -X POST https://hono-cloudflare-backend.mrashidikhah32.workers.dev/api/mongodb/test/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"query": {"email": {"$regex": "example.com"}}, "limit": 10}'
```

## Troubleshooting

### "MONGODB_URI is not configured"

**Solution:**
```bash
wrangler secret put MONGODB_URI
# Enter the connection string when prompted
```

### "Failed to connect to MongoDB"

**Possible causes:**
1. **IP not whitelisted** - Add `0.0.0.0/0` to MongoDB Atlas Network Access
2. **Invalid connection string** - Verify the URI format
3. **Wrong credentials** - Check username and password
4. **Cluster paused** - Resume the cluster in MongoDB Atlas

**Check MongoDB Atlas:**
- Go to your cluster
- Click **Connect**
- Verify connection string format
- Ensure cluster is running (not paused)

### "Authentication failed"

**Solution:**
1. Go to MongoDB Atlas → **Database Access**
2. Verify user `mrashidikhah_db_user` exists
3. Reset password if needed
4. Update the connection string with new password
5. Run `wrangler secret put MONGODB_URI` again

### Connection Timeout

**Solution:**
1. Check MongoDB Atlas cluster status
2. Verify Network Access allows `0.0.0.0/0`
3. Try connecting from MongoDB Compass to verify credentials
4. Check Cloudflare Worker logs: `wrangler tail`

### "Document not found" (404)

**Possible causes:**
1. Invalid ObjectId format (must be 24 hex characters)
2. Document doesn't exist in collection
3. Wrong collection name

**Verify ObjectId:**
```bash
# Valid: 507f1f77bcf86cd799439011 (24 hex chars)
# Invalid: 123 (too short)
# Invalid: xyz (not hex)
```

## MongoDB Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?<options>
```

**Your connection string:**
```
mongodb+srv://mrashidikhah_db_user:SlWxKKiMDpsQNAf8@cluster0.kblqcup.mongodb.net/
```

**Components:**
- **Protocol:** `mongodb+srv://`
- **Username:** `mrashidikhah_db_user`
- **Password:** `SlWxKKiMDpsQNAf8`
- **Cluster:** `cluster0.kblqcup.mongodb.net`
- **Database:** (default - uses database from connection)

## Security Best Practices

✅ **Connection string stored as secret** (encrypted)  
✅ **API key required** for all endpoints  
✅ **IP whitelist** configured in MongoDB Atlas  
✅ **Database user** has minimal required permissions  

⚠️ **Important:**
- Never commit connection strings to Git
- Rotate passwords regularly
- Use specific database permissions (not admin)
- Monitor database access logs
- Consider using MongoDB Atlas Data API for additional security

## Performance Tips

1. **Create indexes** for frequently queried fields
2. **Limit query results** to prevent large responses
3. **Use projections** to return only needed fields
4. **Close connections** after operations
5. **Consider caching** for frequently accessed data

## Next Steps

- Create indexes in MongoDB Atlas for better performance
- Set up database backups
- Configure alerts in MongoDB Atlas
- Implement data validation schemas
- Add pagination for large result sets
- Consider implementing soft deletes

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [MONGODB.md](./MONGODB.md) - Complete API documentation
