import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { Bindings, Variables } from '../src/types'
import { apiKeyAuth } from '../src/middleware/auth.middleware'
import { logCapture } from '../src/middleware/debug.middleware'
import { monitoring } from '../src/middleware/monitoring.middleware'
import { errorHandler } from '../src/handlers/error.handler'
import { registerRoutes } from '../src/routes'

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

export default handle(app)
