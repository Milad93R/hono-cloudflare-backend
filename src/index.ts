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
  CLOUDFLARE_API_TOKEN?: string
  CLOUDFLARE_ACCOUNT_ID?: string
}

const app = new Hono<{ Bindings: Bindings }>()

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

// Error logging middleware with conditional detailed logging
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    const shouldLogDetails = c.req.header('X-Debug-Errors') === 'true' || 
                           c.req.header('X-Log-Errors') === 'true'
    
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
    
    // Return error response
    return c.json({
      error: 'Internal Server Error',
      timestamp: errorInfo.timestamp,
      path: errorInfo.path
    }, 500)
  }
})

// OpenAPI specification
const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hono Cloudflare Workers API',
    version: '1.0.0',
    description: 'A simple API built with Hono and deployed on Cloudflare Workers',
  },
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
    '/': {
      get: {
        summary: 'Welcome endpoint',
        description: 'Returns a welcome message with timestamp',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    docs: { type: 'string' }
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Returns the health status of the service',
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
    '/api/hello/{name}': {
      get: {
        summary: 'Personalized greeting',
        description: 'Returns a personalized greeting message',
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Name to greet',
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    path: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/echo': {
      post: {
        summary: 'Echo endpoint',
        description: 'Echoes back the request body',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    echo: { type: 'object' },
                    method: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/monitoring/stats': {
      get: {
        summary: 'Worker monitoring statistics',
        description: 'Returns comprehensive monitoring data including request counts, error rates, and performance metrics',
        responses: {
          '200': {
            description: 'Monitoring statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        periodStart: { type: 'string', format: 'date-time' },
                        lastUpdated: { type: 'string', format: 'date-time' },
                        totalRequests: { type: 'integer' },
                        errorCount: { type: 'integer' },
                        errorRate: { type: 'string' },
                        averageResponseTime: { type: 'integer' },
                        requestsByPath: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        errorsByPath: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        statusCodes: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        topCountries: {
                          type: 'object',
                          additionalProperties: { type: 'integer' }
                        },
                        responseTimePercentiles: {
                          type: 'object',
                          properties: {
                            p50: { type: 'integer' },
                            p90: { type: 'integer' },
                            p95: { type: 'integer' },
                            p99: { type: 'integer' }
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
    '/api/test/error': {
      get: {
        summary: 'Test error endpoint',
        description: 'Triggers a test error for monitoring and logging purposes. Use X-Debug-Errors header for detailed error logs.',
        parameters: [
          {
            name: 'X-Debug-Errors',
            in: 'header',
            required: false,
            schema: { type: 'string', enum: ['true'] },
            description: 'Set to "true" to enable detailed error logging',
          },
          {
            name: 'X-Log-Errors',
            in: 'header',
            required: false,
            schema: { type: 'string', enum: ['true'] },
            description: 'Set to "true" to enable detailed error logging',
          },
        ],
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
  },
}

// Serve OpenAPI spec as JSON
app.get('/openapi.json', (c) => {
  return c.json(openAPISpec)
})

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

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

// Fetch analytics from Cloudflare GraphQL API
app.get('/api/monitoring/stats', async (c) => {
  const accountId = c.env?.CLOUDFLARE_ACCOUNT_ID || 'fcd079bec6f835db7cba62fe47adc34c'
  const apiToken = c.env?.CLOUDFLARE_API_TOKEN

  if (!apiToken) {
    return c.json({
      error: 'CLOUDFLARE_API_TOKEN not configured',
      message: 'To fetch real-time analytics, add CLOUDFLARE_API_TOKEN as a secret',
      dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`,
      note: 'Visit the dashboard URL above to view comprehensive analytics'
    }, 503)
  }

  try {
    // Use simpler REST API to get worker scripts list (faster than GraphQL)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/hono-cloudflare-backend`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cloudflare API Error:', response.status, errorText)
      return c.json({
        error: 'Failed to fetch worker info from Cloudflare',
        status: response.status,
        details: errorText,
        dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`,
        note: 'API token might need Workers Scripts:Read permission'
      }, 502)
    }

    const workerData = await response.json() as any
    
    if (!workerData.success) {
      return c.json({
        error: 'API request failed',
        details: workerData.errors || 'Unknown error',
        dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`
      }, 500)
    }

    // Return worker info and link to dashboard for full analytics
    return c.json({
      message: 'Worker information retrieved from Cloudflare',
      source: 'Cloudflare Workers API',
      worker: {
        id: workerData.result?.id || 'hono-cloudflare-backend',
        created_on: workerData.result?.created_on || 'N/A',
        modified_on: workerData.result?.modified_on || 'N/A',
        etag: workerData.result?.etag || 'N/A'
      },
      analytics: {
        note: 'Real-time request metrics are available in the Cloudflare Dashboard',
        dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`,
        available_metrics: [
          'Total requests (last 24h, 7d, 30d)',
          'Request duration percentiles (p50, p90, p99)',
          'Error rate and status codes',
          'CPU time usage',
          'Requests by country',
          'Real-time logs'
        ]
      },
      note: 'GraphQL Analytics API queries can be slow. Visit the dashboard for instant, comprehensive analytics.'
    })
  } catch (error) {
    console.error('Worker API fetch error:', error)
    
    // Check if it's a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return c.json({
        error: 'Request timeout',
        message: 'The API request took too long.',
        dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`,
        suggestion: 'Visit the dashboard for instant analytics'
      }, 504)
    }
    
    return c.json({
      error: 'Failed to fetch worker information',
      message: error instanceof Error ? error.message : 'Unknown error',
      dashboardUrl: `https://dash.cloudflare.com/${accountId}/workers/services/view/hono-cloudflare-backend/production/metrics`,
      suggestion: 'Check that your API token has Workers Scripts:Read permission'
    }, 500)
  }
})

// Test endpoint to trigger an error (for testing error logging)
app.get('/api/test/error', (c) => {
  throw new Error('This is a test error for monitoring purposes')
})

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    path: c.req.path 
  }, 404)
})

export default app