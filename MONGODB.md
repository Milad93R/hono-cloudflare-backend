# MongoDB Integration

This project includes MongoDB integration for database operations with full CRUD support.

## Configuration

### MongoDB Connection String

The MongoDB connection string is stored as a Cloudflare Worker secret:

```bash
wrangler secret put MONGODB_URI
```

When prompted, enter:
```
mongodb+srv://mrashidikhah_db_user:SlWxKKiMDpsQNAf8@cluster0.kblqcup.mongodb.net/
```

## API Endpoints

### List Collections

**GET** `/api/mongodb/collections`

Returns all collections in the database.

**Response:**
```json
{
  "collections": ["users", "posts", "comments"],
  "count": 3,
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X GET https://your-worker.dev/api/mongodb/collections \
  -H "X-API-Key: your-api-key"
```

---

### Get All Documents

**GET** `/api/mongodb/:collection?limit=100`

Get all documents from a collection.

**Query Parameters:**
- `limit` (optional): Maximum number of documents to return (default: 100)

**Response:**
```json
{
  "collection": "users",
  "documents": [
    { "_id": "...", "name": "John", "email": "john@example.com" }
  ],
  "returned": 1,
  "total": 1,
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X GET https://your-worker.dev/api/mongodb/users?limit=50 \
  -H "X-API-Key: your-api-key"
```

---

### Get Document by ID

**GET** `/api/mongodb/:collection/:id`

Get a specific document by its MongoDB ObjectId.

**Response:**
```json
{
  "collection": "users",
  "document": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John",
    "email": "john@example.com"
  },
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X GET https://your-worker.dev/api/mongodb/users/507f1f77bcf86cd799439011 \
  -H "X-API-Key: your-api-key"
```

---

### Create Document

**POST** `/api/mongodb/:collection`

Insert a new document into a collection.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "age": 28
}
```

**Response:**
```json
{
  "message": "Document created",
  "collection": "users",
  "insertedId": "507f1f77bcf86cd799439011",
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST https://your-worker.dev/api/mongodb/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```

---

### Update Document

**PUT** `/api/mongodb/:collection/:id`

Update a document by its ID.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "age": 29
}
```

**Response:**
```json
{
  "message": "Document updated",
  "collection": "users",
  "id": "507f1f77bcf86cd799439011",
  "modifiedCount": 1,
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X PUT https://your-worker.dev/api/mongodb/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"email": "updated@example.com"}'
```

---

### Delete Document

**DELETE** `/api/mongodb/:collection/:id`

Delete a document by its ID.

**Response:**
```json
{
  "message": "Document deleted",
  "collection": "users",
  "id": "507f1f77bcf86cd799439011",
  "deletedCount": 1,
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X DELETE https://your-worker.dev/api/mongodb/users/507f1f77bcf86cd799439011 \
  -H "X-API-Key: your-api-key"
```

---

### Query Documents

**POST** `/api/mongodb/:collection/query`

Query documents with a custom MongoDB filter.

**Request Body:**
```json
{
  "query": {
    "age": { "$gte": 25 }
  },
  "limit": 50
}
```

**Response:**
```json
{
  "collection": "users",
  "query": { "age": { "$gte": 25 } },
  "documents": [
    { "_id": "...", "name": "John", "age": 30 }
  ],
  "count": 1,
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST https://your-worker.dev/api/mongodb/users/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"query": {"age": {"$gte": 25}}, "limit": 50}'
```

## Usage in Code

### Basic Operations

```typescript
import { MongoDBService } from './services/mongodb.service'

const mongoService = new MongoDBService(env)

// Insert a document
const result = await mongoService.insertOne('users', {
  name: 'John Doe',
  email: 'john@example.com'
})

// Find documents
const users = await mongoService.find('users', { age: { $gte: 25 } })

// Find by ID
const user = await mongoService.findById('users', '507f1f77bcf86cd799439011')

// Update by ID
await mongoService.updateById('users', '507f1f77bcf86cd799439011', {
  email: 'newemail@example.com'
})

// Delete by ID
await mongoService.deleteById('users', '507f1f77bcf86cd799439011')

// Always close connection when done
await mongoService.close()
```

### Advanced Queries

```typescript
// Find with complex query
const activeUsers = await mongoService.find('users', {
  status: 'active',
  age: { $gte: 18, $lte: 65 },
  $or: [
    { role: 'admin' },
    { verified: true }
  ]
}, 100)

// Count documents
const count = await mongoService.count('users', { status: 'active' })

// List all collections
const collections = await mongoService.listCollections()
```

## Connection Management

The MongoDB service automatically:
- Connects on first use
- Reuses existing connections
- Handles connection errors gracefully

**Important:** Always call `mongoService.close()` after operations to prevent connection leaks.

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "Failed to get document",
  "details": "Document not found",
  "timestamp": "2025-10-27T08:30:00.000Z"
}
```

Common errors:
- `MONGODB_URI is not configured` - Secret not set
- `Failed to connect to MongoDB` - Connection string invalid or network issue
- `Document not found` - Invalid ObjectId or document doesn't exist
- `Database not connected` - Connection failed

## Security Best Practices

✅ **Connection string stored as secret** (not in code)  
✅ **API key authentication** on all endpoints  
✅ **Input validation** in controllers  
✅ **Connection pooling** via MongoDB driver  
✅ **Automatic connection cleanup**  

⚠️ **Important:**
- Never expose MongoDB connection string in client code
- Always validate and sanitize user input before queries
- Use proper MongoDB query operators to prevent injection
- Consider rate limiting for production use

## Deployment

1. Set the MongoDB URI secret:
   ```bash
   wrangler secret put MONGODB_URI
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Test the connection:
   ```bash
   curl https://your-worker.dev/api/mongodb/collections \
     -H "X-API-Key: your-api-key"
   ```

## Troubleshooting

### "MONGODB_URI is not configured"
- Run `wrangler secret put MONGODB_URI`
- Verify the secret is set in Cloudflare dashboard

### "Failed to connect to MongoDB"
- Check connection string format
- Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Cloudflare Workers)
- Ensure database user has correct permissions

### "Document not found"
- Verify ObjectId format (24 hex characters)
- Check if document exists in collection
- Ensure collection name is correct

### Connection timeouts
- MongoDB Atlas may have IP restrictions
- Add `0.0.0.0/0` to IP whitelist for Cloudflare Workers
- Check MongoDB Atlas cluster status

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (if not exists)
3. Create a database user
4. **Network Access** → Add IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string from **Connect** → **Connect your application**
6. Use the connection string with `wrangler secret put MONGODB_URI`

## Performance Tips

- Use indexes for frequently queried fields
- Limit query results to prevent large responses
- Close connections after operations
- Consider caching for frequently accessed data
- Use projections to return only needed fields

## Next Steps

- Add indexes to your collections for better performance
- Implement data validation schemas
- Add pagination for large result sets
- Consider adding aggregation pipeline endpoints
- Implement soft deletes instead of hard deletes
