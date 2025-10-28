import { Hono } from 'hono'
import { Bindings, Variables } from './types'
import { apiKeyAuth } from './middleware/auth.middleware'
import { logCapture } from './middleware/debug.middleware'
import { monitoring } from './middleware/monitoring.middleware'
import { errorHandler } from './handlers/error.handler'
import { createScheduledHandler } from './handlers/scheduled.handler'
import { registerRoutes } from './routes'
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
