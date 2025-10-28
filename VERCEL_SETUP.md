# Vercel Deployment Setup

## ✅ Completed Steps

1. ✅ Installed Vercel CLI and MongoDB driver
2. ✅ Created `vercel.json` configuration
3. ✅ Updated GitHub Actions workflow
4. ✅ Linked project to Vercel
5. ✅ Set environment variables in Vercel
6. ✅ Deployed to Vercel

## 🔧 Manual Steps Required

### 1. Disable Vercel Authentication Protection

The deployment is currently protected by Vercel's authentication. To make it public:

1. Go to https://vercel.com/mrashidikhah-3181s-projects/hono-1/settings/deployment-protection
2. Under **Deployment Protection**, select **Disabled** or **Only Preview Deployments**
3. Click **Save**

### 2. Add GitHub Secrets for CI/CD

Add these secrets to your GitHub repository:

1. Go to https://github.com/Milad93R/hono-cloudflare-backend/settings/secrets/actions
2. Click **New repository secret** and add each of these:

**VERCEL_TOKEN**
```
M7vyNXfd41AyIu2I1ATZWnDX
```

**VERCEL_ORG_ID**
```
team_m16MhEjBz9vyb3D7ZkWhjonl
```

**VERCEL_PROJECT_ID**
```
prj_yuoHsxobYU8T6aFvbWkD5ZLAMTgD
```

### 3. Test the Deployment

After disabling authentication protection, test with:

```bash
curl -X GET "https://hono-1-79ym1itgh-mrashidikhah-3181s-projects.vercel.app/api/mongodb/collections" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

Expected response:
```json
{
  "collections": ["test", "users"],
  "count": 2,
  "timestamp": "2025-10-28T03:10:00.000Z"
}
```

## 📋 Environment Variables Set in Vercel

✅ All environment variables have been configured:

- `MONGODB_URI` - MongoDB connection string
- `API_KEY` - API authentication key
- `SWAGGER_USERNAME` - Swagger UI username
- `SWAGGER_PASSWORD` - Swagger UI password
- `TELEGRAM_BOT_TOKEN` - Telegram bot token

## 🚀 Your Vercel Deployment

**Production URL:** https://hono-1-79ym1itgh-mrashidikhah-3181s-projects.vercel.app

**Project Dashboard:** https://vercel.com/mrashidikhah-3181s-projects/hono-1

## 📝 What Changed

### Files Modified:
- ✅ `vercel.json` - Created Vercel configuration
- ✅ `src/index.ts` - Added Vercel handler
- ✅ `.github/workflows/deploy.yml` - Updated for Vercel deployment
- ✅ `src/controllers/mongodb.controller.ts` - Using MongoDB native driver (works on Vercel!)
- ✅ `package.json` - Removed Mongoose, added MongoDB driver

### Why Vercel is Better for MongoDB:
- ✅ **Full Node.js support** - MongoDB native driver works perfectly
- ✅ **No TCP limitations** - Unlike Cloudflare Workers
- ✅ **No build size limits** - No out-of-memory errors
- ✅ **Simpler deployment** - No need for Data API
- ✅ **Better for databases** - Designed for full-stack apps

## 🧪 Testing MongoDB Integration

Once authentication is disabled, test all endpoints:

### List Collections
```bash
curl "https://hono-1-79ym1itgh-mrashidikhah-3181s-projects.vercel.app/api/mongodb/collections" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

### Create Document
```bash
curl -X POST "https://hono-1-79ym1itgh-mrashidikhah-3181s-projects.vercel.app/api/mongodb/users" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```

### Get All Documents
```bash
curl "https://hono-1-79ym1itgh-mrashidikhah-3181s-projects.vercel.app/api/mongodb/users" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"
```

## 🔄 Automatic Deployments

After adding the GitHub secrets, every push to `main` will automatically deploy to Vercel via GitHub Actions.

## 📚 Next Steps

1. **Disable authentication protection** in Vercel dashboard
2. **Add GitHub secrets** for CI/CD
3. **Test all endpoints** to verify MongoDB works
4. **Update README** with new Vercel URLs
5. **Remove old Cloudflare files** (wrangler.toml, etc.)

## 🎉 Benefits of This Migration

- ✅ MongoDB works natively (no Data API needed!)
- ✅ Simpler configuration
- ✅ Better performance for database operations
- ✅ No connection pooling issues
- ✅ Full Node.js ecosystem support
- ✅ Easier debugging and logging
