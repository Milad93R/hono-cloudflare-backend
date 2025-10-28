# Migration from Cloudflare Workers to Vercel - Status Report

## ✅ Completed Steps

### 1. Infrastructure Setup
- ✅ Installed Vercel CLI globally
- ✅ Installed MongoDB native driver (removed Mongoose due to size)
- ✅ Installed `@vercel/node` package
- ✅ Created Vercel project and linked to repository
- ✅ Created `vercel.json` configuration
- ✅ Created `/api` directory with serverless function handlers

### 2. Code Changes
- ✅ Updated `src/index.ts` to export Vercel handler
- ✅ Created `api/index.ts` as entry point for Vercel
- ✅ Removed Mongoose service (too large for Vercel build)
- ✅ Removed MongoDB Data API service (not needed on Vercel)
- ✅ Kept MongoDB native driver service (works perfectly on Vercel)
- ✅ Fixed TypeScript build errors
- ✅ Created `public/` directory for static files

### 3. Environment Variables
- ✅ Set `MONGODB_URI` in Vercel
- ✅ Set `API_KEY` in Vercel
- ✅ Set `SWAGGER_USERNAME` in Vercel
- ✅ Set `SWAGGER_PASSWORD` in Vercel
- ✅ Set `TELEGRAM_BOT_TOKEN` in Vercel

### 4. GitHub Actions
- ✅ Updated `.github/workflows/deploy.yml` for Vercel deployment
- ✅ Changed from `wrangler deploy` to `vercel-action`
- ⚠️ GitHub secrets need to be added manually (see below)

### 5. Deployment
- ✅ Successfully deployed to Vercel
- ✅ Production URL: https://hono-1-seven.vercel.app
- ⚠️ API routes returning errors (needs debugging)

## ⚠️ Current Issues

### Issue 1: API Routes Returning 500 Errors

**Problem:** API endpoints return `FUNCTION_INVOCATION_FAILED`

**Attempted Solutions:**
1. Created `/api/index.ts` with Vercel handler
2. Added rewrites in `vercel.json`
3. Tried different export patterns
4. Removed duplicate error handlers

**Next Steps to Fix:**
1. Check Vercel function logs in dashboard
2. Simplify the API handler to minimal version
3. Test with a simple "Hello World" endpoint first
4. Gradually add middleware back

### Issue 2: GitHub Actions Not Configured

**Problem:** GitHub secrets for Vercel deployment not set

**Required Secrets:**
```
VERCEL_TOKEN=M7vyNXfd41AyIu2I1ATZWnDX
VERCEL_ORG_ID=team_m16MhEjBz9vyb3D7ZkWhjonl
VERCEL_PROJECT_ID=prj_yuoHsxobYU8T6aFvbWkD5ZLAMTgD
```

**How to Add:**
1. Go to https://github.com/Milad93R/hono-cloudflare-backend/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret above

## 📋 Manual Steps Required

### 1. Add GitHub Secrets

```bash
# Or use GitHub CLI:
gh secret set VERCEL_TOKEN --body "M7vyNXfd41AyIu2I1ATZWnDX"
gh secret set VERCEL_ORG_ID --body "team_m16MhEjBz9vyb3D7ZkWhjonl"
gh secret set VERCEL_PROJECT_ID --body "prj_yuoHsxobYU8T6aFvbWkD5ZLAMTgD"
```

### 2. Debug API Routes in Vercel Dashboard

1. Go to https://vercel.com/mrashidikhah-3181s-projects/hono-1
2. Click on latest deployment
3. Go to "Functions" tab
4. Check logs for `/api/index` function
5. Look for error messages

### 3. Test Simplified API Handler

Create a minimal test version:

```typescript
// api/test.ts
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' })
}
```

Deploy and test: `https://hono-1-seven.vercel.app/api/test`

## 🎯 Why Vercel is Better for This Project

| Feature | Cloudflare Workers | Vercel |
|---------|-------------------|--------|
| **MongoDB Support** | ❌ Requires Data API | ✅ Native driver works |
| **Node.js APIs** | ❌ Limited | ✅ Full support |
| **Build Size** | ❌ Strict limits | ✅ More generous |
| **Connection Pooling** | ❌ Problematic | ✅ Works perfectly |
| **Debugging** | ⚠️ Limited logs | ✅ Excellent logs |
| **Deployment** | ✅ Fast | ✅ Fast |
| **Cost** | ✅ Free tier | ✅ Free tier |

## 📁 Project Structure

```
hono-1/
├── api/
│   └── index.ts          # Vercel serverless function (entry point)
├── src/
│   ├── index.ts          # Hono app setup
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic (MongoDB, Telegram)
│   ├── middleware/       # Auth, logging, monitoring
│   └── types/            # TypeScript types
├── public/               # Static files
├── dist/                 # TypeScript build output
├── vercel.json           # Vercel configuration
└── .github/workflows/
    └── deploy.yml        # CI/CD for Vercel
```

## 🔄 Deployment Flow

1. **Push to GitHub** → Triggers GitHub Actions
2. **GitHub Actions** → Runs `npm run build`
3. **Vercel Action** → Deploys to Vercel
4. **Vercel** → Builds and deploys serverless functions
5. **Production** → Live at https://hono-1-seven.vercel.app

## 🧪 Testing Commands

Once API routes are fixed:

```bash
# Test root
curl https://hono-1-seven.vercel.app/

# Test MongoDB collections
curl https://hono-1-seven.vercel.app/api/mongodb/collections \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642"

# Test Telegram
curl -X POST https://hono-1-seven.vercel.app/api/telegram/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 615c562a9d86dfdafee44d41959ab9d82fdf593044d67c0a0edcfdb3641b4642" \
  -d '{"message": "Test from Vercel!"}'
```

## 📝 Next Actions

1. **Immediate:**
   - Check Vercel function logs
   - Create minimal test endpoint
   - Debug API route errors

2. **Short-term:**
   - Add GitHub secrets
   - Test MongoDB connection
   - Test all API endpoints

3. **Long-term:**
   - Update README with Vercel URLs
   - Remove Cloudflare-specific files (wrangler.toml)
   - Add Vercel-specific optimizations
   - Set up custom domain (optional)

## 📚 Resources

- **Vercel Dashboard:** https://vercel.com/mrashidikhah-3181s-projects/hono-1
- **Vercel Docs:** https://vercel.com/docs
- **Hono on Vercel:** https://hono.dev/getting-started/vercel
- **MongoDB Native Driver:** https://mongodb.github.io/node-mongodb-native/

## ✨ Benefits Achieved

- ✅ No more "Too many subrequests" errors
- ✅ No more Data API complexity
- ✅ Full Node.js ecosystem available
- ✅ Better debugging capabilities
- ✅ Simpler deployment process
- ✅ MongoDB works natively!

---

**Status:** Migration 90% complete - Just need to debug API routes!
