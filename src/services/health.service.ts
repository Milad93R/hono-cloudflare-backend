import { Hono } from 'hono'
import { Bindings, HealthCheckResult, HealthCheckerConfig } from '../types'

export class HealthService {
  private app: Hono<{ Bindings: Bindings }>

  constructor(app: Hono<{ Bindings: Bindings }>) {
    this.app = app
  }

  /**
   * Performs a single health check by calling the /health endpoint internally
   */
  async checkHealth(env: Bindings): Promise<HealthCheckResult> {
    try {
      console.log('Preparing to call /health endpoint')
      const requestStart = Date.now()
      
      // Create a new request to /health endpoint
      const healthRequest = new Request('http://internal/health', {
        method: 'GET'
      })
      
      // Call the app internally without going through network
      const response = await this.app.fetch(healthRequest, env)
      console.log('Received response from /health with status:', response.status)
      
      const data = await response.json()
      console.log('Parsed /health response body:', JSON.stringify(data))
      console.log('Total /health call duration (ms):', Date.now() - requestStart)
      
      return {
        time: 0, // Will be set by caller
        status: 'success',
        response: data
      }
    } catch (error) {
      console.error(`Health check exception:`, error)
      return {
        time: 0, // Will be set by caller
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Runs a complete health check cycle with configurable timing
   */
  async runHealthCheckCycle(env: Bindings, config: HealthCheckerConfig): Promise<HealthCheckResult[]> {
    console.log('Starting health checker cycle')
    const results: HealthCheckResult[] = []
    const startTime = Date.now()
    const boundaryIntervalSeconds = config.boundaryIntervalMs / 1000
    
    // Track elapsed time and last check time
    let lastCheckAt = 0
    let elapsed = 0
    
    while (elapsed < config.totalDurationMs) {
      await new Promise(resolve => setTimeout(resolve, config.loopIntervalMs))
      elapsed = Date.now() - startTime
      
      if (elapsed >= config.totalDurationMs) {
        break
      }
      
      // Check if we've crossed a boundary interval
      const currentInterval = Math.floor(elapsed / config.boundaryIntervalMs)
      const lastInterval = Math.floor(lastCheckAt / config.boundaryIntervalMs)
      
      if (currentInterval > lastInterval && elapsed < config.totalDurationMs) {
        console.log(`Health check at ${elapsed}ms (crossed ${currentInterval * boundaryIntervalSeconds}s boundary)`)
        const result = await this.checkHealth(env)
        result.time = elapsed
        console.log(`Health check result:`, JSON.stringify(result))
        results.push(result)
        lastCheckAt = elapsed
      }
    }
    
    // Final check after total duration
    console.log(`Final health check at ${config.totalDurationMs}ms`)
    const finalResult = await this.checkHealth(env)
    finalResult.time = config.totalDurationMs
    console.log(`Final health check result:`, JSON.stringify(finalResult))
    results.push(finalResult)
    
    return results
  }
}
