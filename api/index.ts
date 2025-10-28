import { Hono } from 'hono'
import { Bindings, Variables } from '../lib/types'
import { apiKeyAuth } from '../lib/middleware/auth.middleware'
import { logCapture } from '../lib/middleware/debug.middleware'
import { monitoring } from '../lib/middleware/monitoring.middleware'
import { errorHandler } from '../lib/handlers/error.handler'
import { createScheduledHandler } from '../lib/handlers/scheduled.handler'
import { registerRoutes } from '../lib/routes'
import { cors } from 'hono/cors'
import { handle } from 'hono/vercel'

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Global middleware
app.use('*', logCapture)
app.use('*', monitoring)
app.use('*', cors())
app.use('/api/*', apiKeyAuth)

// Register all routes
registerRoutes(app)

// Global error handler
app.onError(errorHandler)

// Export app for Vercel API route
export { app }

// Export Vercel handler as default
export default handle(app)
