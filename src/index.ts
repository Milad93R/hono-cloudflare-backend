import { Hono } from 'hono'
import { Bindings, Variables } from './types'
import { apiKeyAuth } from './middleware/auth.middleware'
import { logCapture } from './middleware/debug.middleware'
import { monitoring } from './middleware/monitoring.middleware'
import { errorHandler } from './handlers/error.handler'
import { createScheduledHandler } from './handlers/scheduled.handler'
import { registerRoutes } from './routes'

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Global middleware
app.use('*', logCapture)
app.use('*', monitoring)
app.use('*', apiKeyAuth)

// Register all routes
registerRoutes(app)

// Global error handler
app.onError(errorHandler)

// Export handlers
export default {
  fetch: app.fetch,
  scheduled: createScheduledHandler(app)
}
