# Hono Cloudflare Workers Backend

A simple Hono backend with TypeScript configured for Cloudflare Workers with automatic deployment via GitHub Actions.

## Features

- 🚀 **Hono Framework** - Fast, lightweight web framework
- 📘 **TypeScript** - Full type safety
- ☁️ **Cloudflare Workers** - Edge computing platform
- 🔄 **Auto Deployment** - GitHub Actions CI/CD
- 🧪 **API Endpoints** - RESTful API with JSON responses

## API Endpoints

- `GET /` - Welcome message with timestamp
- `GET /health` - Health check endpoint
- `GET /api/hello/:name` - Parameterized greeting
- `POST /api/echo` - Echo service for testing

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (installed as dev dependency)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. The server will be available at `http://127.0.0.1:8787`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript project
- `npm run deploy` - Deploy to Cloudflare Workers

## Deployment

### Automatic Deployment (Recommended)

This project is configured for automatic deployment via GitHub Actions when code is pushed to the `main` branch.

#### Setup GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following repository secrets:

**Required Secrets:**

- `CLOUDFLARE_API_TOKEN`
  - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  - Create a new API token with "Custom token" template
  - Permissions needed:
    - Account: `Cloudflare Workers:Edit`
    - Zone: `Zone:Read` (if using custom domains)
  - Copy the token and add it as a secret

- `CLOUDFLARE_ACCOUNT_ID`
  - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
  - Copy your Account ID from the right sidebar
  - Add it as a secret

#### How it works

- **Push to main**: Automatically deploys to production
- **Pull requests**: Runs build and tests (no deployment)
- **Build process**: Installs dependencies, builds TypeScript, and deploys

### Manual Deployment

If you prefer manual deployment:

1. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── src/
│   └── index.ts               # Main application file
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── wrangler.toml              # Cloudflare Workers configuration
└── README.md                  # This file
```

## Configuration

### Environment Variables

You can add environment variables in `wrangler.toml`:

```toml
[vars]
MY_VARIABLE = "production_value"
```

### KV Storage, R2, Durable Objects

Uncomment and configure the relevant sections in `wrangler.toml` as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push to your fork
5. Create a pull request

The GitHub Actions workflow will automatically test your changes on pull requests.

## License

ISC