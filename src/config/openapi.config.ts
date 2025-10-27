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
  tags: [
    { name: 'General', description: 'General informational endpoints' },
    { name: 'Health', description: 'Health check and monitoring endpoints' },
    { name: 'Testing', description: 'Endpoints used for testing and debugging' },
    { name: 'Telegram', description: 'Telegram messaging integration endpoints' },
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
    schemas: {
      TelegramMessageRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            description: 'Message text to send to Telegram threads. HTML formatting supported.'
          },
          threads: {
            type: 'array',
            description: 'Additional thread IDs to send to. Default thread is always included automatically.',
            items: {
              type: 'integer'
            }
          }
        }
      },
      TelegramLogRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          level: {
            type: 'string',
            description: 'Log level label (INFO, WARN, ERROR, etc.). Defaults to INFO.'
          },
          message: {
            type: 'string'
          },
          threads: {
            type: 'array',
            items: {
              type: 'integer'
            }
          }
        }
      },
      TelegramSendResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                thread: {
                  type: 'integer'
                },
                success: {
                  type: 'boolean'
                },
                error: {
                  type: 'string'
                }
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      TelegramThreadsResponse: {
        type: 'object',
        properties: {
          threads: {
            type: 'object',
            additionalProperties: {
              type: 'integer'
            }
          },
          description: {
            type: 'object',
            additionalProperties: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  paths: {
    '/': {
      get: {
        tags: ['General'],
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
        tags: ['Health'],
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
        tags: ['Testing'],
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
        tags: ['Health'],
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
    '/api/telegram/send': {
      post: {
        tags: ['Telegram'],
        summary: 'Send Telegram message',
        description: 'Sends a message to the configured Telegram group threads. Default thread is always included and additional threads can be specified.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TelegramMessageRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Message dispatch results',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TelegramSendResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/telegram/log': {
      post: {
        tags: ['Telegram'],
        summary: 'Send formatted Telegram log',
        description: 'Formats a log message with level and sends it to Telegram threads. Default thread is always included.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TelegramLogRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Log dispatch results',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TelegramSendResponse'
                }
              }
            }
          }
        }
      }
    },
    '/api/telegram/threads': {
      get: {
        tags: ['Telegram'],
        summary: 'List Telegram thread IDs',
        description: 'Returns the configured Telegram thread IDs and descriptions.',
        responses: {
          '200': {
            description: 'Thread information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TelegramThreadsResponse'
                }
              }
            }
          }
        }
      }
    }
  },
}
