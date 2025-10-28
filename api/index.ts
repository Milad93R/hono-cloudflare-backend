import { handle } from 'hono/vercel'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings, Variables } from '../src/types'
import { HealthController } from '../src/controllers/health.controller'
import { TestController } from '../src/controllers/test.controller'
import { DocsController } from '../src/controllers/docs.controller'
import { TelegramController } from '../src/controllers/telegram.controller'
import { MongoDBController } from '../src/controllers/mongodb.controller'
import { HealthService } from '../src/services/health.service'
import { apiKeyAuth } from '../src/middleware/auth.middleware'
import { swaggerAuth } from '../src/middleware/auth.middleware'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware
app.use('*', cors())
app.use('/api/*', apiKeyAuth)

// Initialize services and controllers
const healthService = new HealthService(app)
const healthController = new HealthController(healthService)
const testController = new TestController()
const docsController = new DocsController()
const telegramController = new TelegramController()
const mongodbController = new MongoDBController()

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Hello from Hono on Vercel!',
    timestamp: new Date().toISOString(),
    docs: '/docs'
  })
})

// Health endpoints
app.get('/health', (c) => healthController.getHealth(c))
app.get('/api/healthchecker', (c) => healthController.runHealthChecker(c))

// Test endpoints
app.get('/api/test/error', (c) => testController.triggerError(c))

// Telegram endpoints
app.post('/api/telegram/send', (c) => telegramController.sendMessage(c))
app.post('/api/telegram/log', (c) => telegramController.sendLog(c))
app.get('/api/telegram/threads', (c) => telegramController.getThreads(c))

// MongoDB endpoints
app.get('/api/mongodb/collections', (c) => mongodbController.listCollections(c))
app.get('/api/mongodb/:collection', (c) => mongodbController.getDocuments(c))
app.get('/api/mongodb/:collection/:id', (c) => mongodbController.getDocumentById(c))
app.post('/api/mongodb/:collection', (c) => mongodbController.createDocument(c))
app.put('/api/mongodb/:collection/:id', (c) => mongodbController.updateDocument(c))
app.delete('/api/mongodb/:collection/:id', (c) => mongodbController.deleteDocument(c))
app.post('/api/mongodb/:collection/query', (c) => mongodbController.queryDocuments(c))

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

export default handle(app)
