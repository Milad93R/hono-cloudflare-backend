import { Hono } from 'hono'

const app = new Hono()

// Basic route
app.get('/', (c) => {
  return c.json({ 
    message: 'Hello from Hono on Cloudflare Workers!',
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    service: 'hono-cloudflare-worker'
  })
})

// API route with parameter
app.get('/api/hello/:name', (c) => {
  const name = c.req.param('name')
  return c.json({ 
    message: `Hello, ${name}!`,
    path: c.req.path
  })
})

// POST endpoint example
app.post('/api/echo', async (c) => {
  const body = await c.req.json()
  return c.json({
    echo: body,
    method: c.req.method,
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    path: c.req.path 
  }, 404)
})

export default app