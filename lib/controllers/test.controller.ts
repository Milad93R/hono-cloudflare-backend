import { Context } from 'hono'
import { Bindings, Variables } from '../types'

export class TestController {
  /**
   * GET /api/test/error
   * Test endpoint to trigger an error for monitoring purposes
   */
  async triggerError(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    console.log('Starting error test endpoint')
    console.debug('Debug: Processing request for', c.req.path)
    console.info('Info: User agent is', c.req.header('User-Agent'))
    console.warn('Warning: About to throw test error')
    throw new Error('This is a test error for monitoring purposes')
  }
}
