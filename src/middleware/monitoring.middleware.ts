import { Context, Next } from 'hono'
import { Bindings, RequestMetrics } from '../types'

// Monitoring middleware
export const monitoring = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const startTime = Date.now()
  
  await next()
  
  const duration = Date.now() - startTime
  const metrics: RequestMetrics = {
    timestamp: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    userAgent: c.req.header('User-Agent'),
    ip: c.req.header('CF-Connecting-IP'),
    country: c.req.header('CF-IPCountry')
  }
  
  console.log('REQUEST_METRICS:', JSON.stringify(metrics))
  
  // Optional: Send to Analytics Engine if available
  if (c.env?.ANALYTICS) {
    try {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [metrics.method, metrics.path, metrics.userAgent || ''],
        doubles: [metrics.duration, metrics.status],
        indexes: [metrics.ip || '']
      })
    } catch (error) {
      console.error('Failed to write to Analytics Engine:', error)
    }
  }
}
