import { Hono } from 'hono'
import { Bindings, Variables } from '../types'
import { HealthController } from '../controllers/health.controller'
import { TestController } from '../controllers/test.controller'
import { DocsController } from '../controllers/docs.controller'
import { TelegramController } from '../controllers/telegram.controller'
import { HealthService } from '../services/health.service'
import { withDebugLogs } from '../middleware/debug.middleware'
import { swaggerAuth } from '../middleware/auth.middleware'

export function registerRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>) {
  // Initialize services
  const healthService = new HealthService(app)
  
  // Initialize controllers
  const healthController = new HealthController(healthService)
  const testController = new TestController()
  const docsController = new DocsController()
  const telegramController = new TelegramController()

  // Root endpoint
  app.get('/', (c) => {
    return c.json({ 
      message: 'Hello from Hono on Cloudflare Workers!',
      timestamp: new Date().toISOString(),
      docs: '/docs'
    })
  })

  // Health endpoints
  app.get('/health', (c) => healthController.getHealth(c))
  app.get('/api/healthchecker', withDebugLogs, (c) => healthController.runHealthChecker(c))

  // Test endpoints
  app.get('/api/test/error', withDebugLogs, (c) => testController.triggerError(c))

  // Telegram endpoints
  app.post('/api/telegram/send', (c) => telegramController.sendMessage(c))
  app.post('/api/telegram/log', (c) => telegramController.sendLog(c))
  app.get('/api/telegram/threads', (c) => telegramController.getThreads(c))

  // Documentation endpoints
  app.get('/openapi.json', (c) => docsController.getOpenAPISpec(c))
  app.get('/docs', swaggerAuth, (c) => docsController.getSwaggerUI(c))

  // 404 handler
  app.notFound((c) => {
    return c.json({ 
      error: 'Not Found',
      path: c.req.path 
    }, 404)
  })
}
