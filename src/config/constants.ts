// Default timing configuration for health checker (in milliseconds)
export const HEALTH_CHECK_DEFAULTS = {
  totalDurationMs: 45_000,
  loopIntervalMs: 5_000,
  boundaryIntervalMs: 15_000
} as const

// Worker configuration
export const WORKER_CONFIG = {
  workerUrl: 'https://hono-cloudflare-backend.mrashidikhah32.workers.dev'
} as const
