// Types for monitoring
export interface RequestMetrics {
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
export type Bindings = {
  ANALYTICS?: AnalyticsEngineDataset
  DEBUG_SECRET?: string
  API_KEY?: string
  SWAGGER_USERNAME?: string
  SWAGGER_PASSWORD?: string
}

// Context variables type
export type Variables = {
  capturedLogs?: Array<{ level: string; message: string; timestamp: string }>
  shouldIncludeLogs?: boolean
}

// Health check result type
export interface HealthCheckResult {
  time: number
  status: 'success' | 'error'
  response?: any
  error?: string
}

// Health checker configuration
export interface HealthCheckerConfig {
  totalDurationMs: number
  loopIntervalMs: number
  boundaryIntervalMs: number
}
