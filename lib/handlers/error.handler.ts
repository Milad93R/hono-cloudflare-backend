import { Context } from 'hono'
import { Bindings, Variables } from '../types'

export const errorHandler = (err: Error, c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
  console.error('Error occurred:', err)
  
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldIncludeDebug = debugSecret && providedSecret === debugSecret
  
  const errorResponse: any = {
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: c.req.path
  }
  
  if (shouldIncludeDebug) {
    errorResponse.debug = {
      stack: err.stack,
      logs: c.get('capturedLogs') || []
    }
  }
  
  return c.json(errorResponse, 500)
}
