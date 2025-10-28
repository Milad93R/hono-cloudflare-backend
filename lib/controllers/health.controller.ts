import { Context } from 'hono'
import { Bindings, Variables } from '../types'
import { HealthService } from '../services/health.service'
import { HEALTH_CHECK_DEFAULTS } from '../config/constants'
import { parsePositiveInt } from '../utils/helpers'

export class HealthController {
  constructor(private healthService: HealthService) {}

  /**
   * GET /health
   * Returns health status
   */
  async getHealth(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    return c.json({ 
      status: 'healthy',
      service: 'hono-cloudflare-worker'
    })
  }

  /**
   * GET /api/healthchecker
   * Runs health check cycle with configurable parameters
   */
  async runHealthChecker(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    const query = c.req.query()
    const totalDurationMs = parsePositiveInt(query.totalDurationMs, HEALTH_CHECK_DEFAULTS.totalDurationMs)
    const loopIntervalMs = parsePositiveInt(query.loopIntervalMs, HEALTH_CHECK_DEFAULTS.loopIntervalMs)
    const boundaryIntervalMs = parsePositiveInt(query.boundaryIntervalMs, HEALTH_CHECK_DEFAULTS.boundaryIntervalMs)

    const config = {
      totalDurationMs,
      loopIntervalMs,
      boundaryIntervalMs
    }

    const results = await this.healthService.runHealthCheckCycle(c.env, config)

    // Build response
    const response: any = {
      message: 'Health checker cycle completed',
      duration: `${(totalDurationMs / 1000).toFixed(0)} seconds`,
      totalChecks: results.length,
      results: results,
      config: config
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
  }
}
