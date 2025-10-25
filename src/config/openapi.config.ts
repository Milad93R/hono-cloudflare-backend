export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hono Cloudflare Worker API',
    version: '1.0.0',
    description: 'A production-ready API built with Hono on Cloudflare Workers with monitoring, error handling, and Swagger documentation.',
  },
  servers: [
    {
      url: 'https://hono-cloudflare-backend.mrashidikhah32.workers.dev',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for authentication. Required for all endpoints except /health.',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Root endpoint',
        description: 'Returns a welcome message and API information',
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
        summary: 'Health check endpoint',
        description: 'Returns the health status of the worker. This endpoint does not require authentication.',
        security: [],
        responses: {
          '200': {
            description: 'Healthy response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    service: { type: 'string' }
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
        description: 'Runs a configurable health check cycle. Checks /health endpoint at specified intervals.',
        parameters: [
          {
            name: 'totalDurationMs',
            in: 'query',
            schema: { type: 'integer', default: 45000 },
            description: 'Total duration of the health check cycle in milliseconds'
          },
          {
            name: 'loopIntervalMs',
            in: 'query',
            schema: { type: 'integer', default: 5000 },
            description: 'Interval between checks in milliseconds'
          },
          {
            name: 'boundaryIntervalMs',
            in: 'query',
            schema: { type: 'integer', default: 15000 },
            description: 'Boundary interval for health checks in milliseconds'
          }
        ],
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
                    config: {
                      type: 'object',
                      properties: {
                        totalDurationMs: { type: 'integer' },
                        loopIntervalMs: { type: 'integer' },
                        boundaryIntervalMs: { type: 'integer' }
                      }
                    },
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
