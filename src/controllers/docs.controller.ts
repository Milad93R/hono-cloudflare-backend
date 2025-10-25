import { Context } from 'hono'
import { Bindings } from '../types'
import { openAPISpec } from '../config/openapi.config'

export class DocsController {
  /**
   * GET /openapi.json
   * Returns OpenAPI specification
   */
  async getOpenAPISpec(c: Context<{ Bindings: Bindings }>) {
    return c.json(openAPISpec)
  }

  /**
   * GET /docs
   * Returns Swagger UI HTML
   */
  async getSwaggerUI(c: Context<{ Bindings: Bindings }>) {
    return c.html(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation</title>
        <link rel="icon" type="image/svg+xml" href="https://hono.dev/favicon.ico">
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
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
  }
}
