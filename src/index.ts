import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

// Types for monitoring
interface RequestMetrics {
  timestamp: string
  method: string
  path: string
  status: number
  duration: number
  userAgent?: string
  ip?: string
  country?: string
  error?: string
}

// Environment bindings type
type Bindings = {
  ANALYTICS?: AnalyticsEngineDataset
  DEBUG_SECRET?: string
  API_KEY?: string
  SWAGGER_USERNAME?: string
  SWAGGER_PASSWORD?: string
}

// Context variables type
type Variables = {
  capturedLogs?: Array<{ level: string; message: string; timestamp: string }>
  shouldIncludeLogs?: boolean
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Decorator middleware to include captured logs in response when X-Debug-Secret is provided
const withDebugLogs = async (c: any, next: any) => {
  // Check if debug mode is enabled before executing handler
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldIncludeLogs = debugSecret && providedSecret === debugSecret
  
  // Store flag in context so handler knows to include logs
  c.set('shouldIncludeLogs', shouldIncludeLogs)
  
  await next()
}

// Log capture middleware - intercepts console logs when debug is enabled
app.use('*', async (c, next) => {
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldCaptureLogs = debugSecret && providedSecret === debugSecret
  
  if (shouldCaptureLogs) {
    const logs: Array<{ level: string; message: string; timestamp: string }> = []
    
    // Store original console methods
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info
    const originalDebug = console.debug
    
    // Override console methods to capture logs
    console.log = (...args: any[]) => {
      logs.push({ level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalLog.apply(console, args)
    }
    console.error = (...args: any[]) => {
      logs.push({ level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalError.apply(console, args)
    }
    console.warn = (...args: any[]) => {
      logs.push({ level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalWarn.apply(console, args)
    }
    console.info = (...args: any[]) => {
      logs.push({ level: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalInfo.apply(console, args)
    }
    console.debug = (...args: any[]) => {
      logs.push({ level: 'debug', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalDebug.apply(console, args)
    }
    
    // Store logs in context for later retrieval
    c.set('capturedLogs', logs)
    
    try {
      await next()
    } finally {
      // Restore original console methods
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      console.info = originalInfo
      console.debug = originalDebug
    }
  } else {
    await next()
  }
})

// API Key authentication middleware (skip for /health, /docs, /openapi.json)
app.use('*', async (c, next) => {
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
})

// Monitoring middleware
app.use('*', async (c, next) => {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  // Get request info
  const method = c.req.method
  const path = c.req.path
  const userAgent = c.req.header('User-Agent')
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')
  const country = c.req.header('CF-IPCountry')
  
  let status = 200
  let error: string | undefined
  
  try {
    await next()
    status = c.res.status
  } catch (err) {
    status = 500
    error = err instanceof Error ? err.message : 'Unknown error'
    throw err
  } finally {
    const duration = Date.now() - startTime
    
    // Create metrics object
    const requestMetrics: RequestMetrics = {
      timestamp,
      method,
      path,
      status,
      duration,
      userAgent,
      ip,
      country,
      error
    }
    
    // Log metrics (this will appear in Cloudflare Workers logs)
    console.log('REQUEST_METRICS:', JSON.stringify(requestMetrics))
    
    // Store in Analytics Engine if available (optional)
    if (c.env?.ANALYTICS) {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [method, path, userAgent || '', country || ''],
        doubles: [duration, status],
        indexes: [timestamp]
      })
    }
  }
})

// Global error handler with conditional detailed logging
app.onError((err, c) => {
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldLogDetails = debugSecret && providedSecret === debugSecret
  
  const errorInfo = {
    timestamp: new Date().toISOString(),
    path: c.req.path,
    method: c.req.method,
    error: err instanceof Error ? err.message : 'Unknown error',
    stack: shouldLogDetails && err instanceof Error ? err.stack : undefined,
    headers: shouldLogDetails ? Object.fromEntries(c.req.raw.headers.entries()) : undefined,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('CF-Connecting-IP'),
    country: c.req.header('CF-IPCountry')
  }
  
  // Always log basic error info
  console.error('API_ERROR:', JSON.stringify(errorInfo))
  
  // Return detailed error response if debug headers are set
  if (shouldLogDetails) {
    const capturedLogs = c.get('capturedLogs') as Array<{ level: string; message: string; timestamp: string }> | undefined
    
    return c.json({
      error: 'Internal Server Error',
      message: errorInfo.error,
      timestamp: errorInfo.timestamp,
      path: errorInfo.path,
      method: errorInfo.method,
      debug: {
        stack: errorInfo.stack,
        headers: errorInfo.headers,
        userAgent: errorInfo.userAgent,
        ip: errorInfo.ip,
        country: errorInfo.country,
        logs: capturedLogs || []
      }
    }, 500)
  }
  
  // Return basic error response
  return c.json({
    error: 'Internal Server Error',
    timestamp: errorInfo.timestamp,
    path: errorInfo.path
  }, 500)
})

// OpenAPI specification
const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hono Cloudflare Workers API',
    version: '1.0.0',
    description: 'A simple API built with Hono and deployed on Cloudflare Workers.\n\nOptional secret header: include `X-Debug-Secret` with the configured token to receive detailed error responses.',
  },
  components: {
    securitySchemes: {
      ApiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key required for all endpoints except /health'
      },
      DebugSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Debug-Secret',
        description: 'Optional secret token that enables detailed error logging in responses. Leave unset for standard responses.'
      }
    }
  },
  security: [{ ApiKey: [] }, { DebugSecret: [] }],
  servers: [
    {
      url: '/',
      description: 'Current deployment (relative URL)',
    },
    {
      url: 'https://hono-cloudflare-backend.mrashidikhah32.workers.dev',
      description: 'Production server',
    },
    {
      url: 'http://127.0.0.1:8787',
      description: 'Local development server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Returns the health status of the service',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    service: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/test/error': {
      get: {
        summary: 'Test error endpoint',
        description: 'Triggers a test error for monitoring and logging purposes. Provide the optional X-Debug-Secret header to receive detailed error information.',
        responses: {
          '500': {
            description: 'Test error response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    path: { type: 'string' }
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/healthchecker': {
      get: {
        summary: 'Health checker cycle',
        description: 'Runs a 45-second health check cycle. Checks /health endpoint every 15 seconds (at 15s, 30s, 45s). Checks every 5 seconds if a 15-second boundary has been crossed.',
        responses: {
          '200': {
            description: 'Health checker cycle completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    duration: { type: 'string' },
                    totalChecks: { type: 'integer' },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          time: { type: 'integer', description: 'Elapsed time in milliseconds' },
                          status: { type: 'string', enum: ['success', 'error'] },
                          response: { type: 'object' },
                          error: { type: 'string' }
                        }
                      }
                    }
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

// Serve OpenAPI spec as JSON
app.get('/openapi.json', (c) => {
  return c.json(openAPISpec)
})

// Swagger UI with favicon and basic auth
app.get('/docs', (c) => {
  const swaggerUsername = c.env?.SWAGGER_USERNAME
  const swaggerPassword = c.env?.SWAGGER_PASSWORD
  
  // Check basic auth
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return c.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="Swagger Documentation"'
    })
  }
  
  const base64Credentials = authHeader.substring(6)
  const credentials = atob(base64Credentials)
  const [username, password] = credentials.split(':')
  
  if (username !== swaggerUsername || password !== swaggerPassword) {
    return c.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="Swagger Documentation"'
    })
  }
  
  return c.html(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="SwaggerUI" />
        <title>SwaggerUI</title>
        <link rel="icon" type="image/png" sizes="32x32" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/favicon-32x32.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js" crossorigin="anonymous"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              dom_id: '#swagger-ui',
              url: '/openapi.json',
            })
          }
        </script>
      </body>
    </html>`)
})

// Basic route
app.get('/', (c) => {
  return c.json({ 
    message: 'Hello from Hono on Cloudflare Workers!',
    timestamp: new Date().toISOString(),
    docs: '/docs'
  })
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    service: 'hono-cloudflare-worker'
  })
})

// Test endpoint to trigger an error (for testing error logging)
app.get('/api/test/error', withDebugLogs, (c) => {
  console.log('Starting error test endpoint')
  console.debug('Debug: Processing request for', c.req.path)
  console.info('Info: User agent is', c.req.header('User-Agent'))
  console.warn('Warning: About to throw test error')
  throw new Error('This is a test error for monitoring purposes')
})

// Health checker endpoint - runs the 45s health check cycle
app.get('/api/healthchecker', withDebugLogs, async (c) => {
  console.log('Starting health checker cycle')
  const results: Array<{ time: number; status: string; response?: any; error?: string }> = []
  const startTime = Date.now()
  
  // Helper function to check health internally
  const checkHealth = async () => {
    try {
      console.log('Preparing to call /health endpoint')
      const requestStart = Date.now()
      // Create a new request to /health endpoint
      const healthRequest = new Request('http://internal/health', {
        method: 'GET'
      })
      
      // Call the app internally without going through network
      const response = await app.fetch(healthRequest, c.env)
      console.log('Received response from /health with status:', response.status)
      const data = await response.json()
      console.log('Parsed /health response body:', JSON.stringify(data))
      console.log('Total /health call duration (ms):', Date.now() - requestStart)
      
      return {
        status: 'success' as const,
        response: data
      }
    } catch (error) {
      console.error(`Health check exception:`, error)
      return {
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Track elapsed time and last check time
  let lastCheckAt = 0
  let elapsed = 0
  
  while (elapsed < 45000) {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
    elapsed = Date.now() - startTime
    
    // Check if we've crossed a 15-second boundary
    const currentInterval = Math.floor(elapsed / 15000)
    const lastInterval = Math.floor(lastCheckAt / 15000)
    
    if (currentInterval > lastInterval && elapsed < 45000) {
      console.log(`Health check at ${elapsed}ms (crossed ${currentInterval * 15}s boundary)`)
      const result = await checkHealth()
      console.log(`Health check result:`, JSON.stringify(result))
      results.push({ time: elapsed, ...result })
      lastCheckAt = elapsed
    }
  }
  
  // Final check after 45 seconds
  console.log('Final health check at 45s')
  const finalResult = await checkHealth()
  console.log(`Final health check result:`, JSON.stringify(finalResult))
  results.push({ time: 45000, ...finalResult })
  
  // Build response
  const response: any = {
    message: 'Health checker cycle completed',
    duration: '45 seconds',
    totalChecks: results.length,
    results: results
  }
  
  // Include logs if debug mode is enabled
  const shouldIncludeLogs = c.get('shouldIncludeLogs')
  if (shouldIncludeLogs) {
    const capturedLogs = c.get('capturedLogs')
    if (capturedLogs && capturedLogs.length > 0) {
      response.debug = {
        logs: capturedLogs
      }
    }
  }
  
  return c.json(response)
})

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    path: c.req.path 
  }, 404)
})

// Scheduled handler for cron jobs
const scheduled = async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
  console.log('Cron job triggered at:', new Date(event.scheduledTime).toISOString())
  
  try {
    console.log('Starting health checker cycle from cron')
    
    // Create internal request to health checker endpoint
    const healthCheckerRequest = new Request('http://internal/api/healthchecker', {
      method: 'GET',
      headers: {
        'X-API-Key': env.API_KEY || ''
      }
    })
    
    // Call the health checker internally
    const response = await app.fetch(healthCheckerRequest, env)
    const result = await response.json() as any
    
    console.log('Health checker cycle completed')
    console.log('Total checks:', result.totalChecks)
    console.log('Results summary:', JSON.stringify(result.results))
  } catch (error) {
    console.error('Cron job error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

export default {
  fetch: app.fetch,
  scheduled
}