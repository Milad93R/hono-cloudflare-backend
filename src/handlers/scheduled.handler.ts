import { Hono } from 'hono'
import { Bindings } from '../types'

export const createScheduledHandler = (app: Hono<{ Bindings: Bindings }>) => {
  return async (event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) => {
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
}
