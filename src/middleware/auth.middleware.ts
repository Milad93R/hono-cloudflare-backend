import { Context, Next } from 'hono'
import { Bindings } from '../types'

// API Key authentication middleware (skip for /health, /docs, /openapi.json)
export const apiKeyAuth = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const path = c.req.path
  
  // Skip auth for health check, swagger UI, and openapi spec
  if (path === '/health' || path === '/docs' || path === '/openapi.json') {
    return next()
  }
  
  const apiKey = c.env?.API_KEY
  const providedKey = c.req.header('X-API-Key')
  
  if (!apiKey || providedKey !== apiKey) {
    return c.json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      timestamp: new Date().toISOString()
    }, 401)
  }
  
  await next()
}

// Swagger basic authentication middleware
export const swaggerAuth = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const auth = c.req.header('Authorization')
  
  if (!auth || !auth.startsWith('Basic ')) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Swagger UI"'
      }
    })
  }
  
  const credentials = atob(auth.slice(6))
  const [username, password] = credentials.split(':')
  
  const validUsername = c.env?.SWAGGER_USERNAME
  const validPassword = c.env?.SWAGGER_PASSWORD
  
  if (!validUsername || !validPassword || username !== validUsername || password !== validPassword) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Swagger UI"'
      }
    })
  }
  
  await next()
}
