import type { DurableObjectNamespace, DurableObjectState } from '@cloudflare/workers-types'

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

export interface ResponseTimePercentiles {
  p50: number
  p90: number
  p95: number
  p99: number
}

export interface StoredMetrics {
  totalRequests: number
  errorCount: number
  totalResponseTime: number
  requestsByPath: Record<string, number>
  errorsByPath: Record<string, number>
  statusCodes: Record<string, number>
  countries: Record<string, number>
  responseTimes: number[]
  createdAt: string
  updatedAt: string
}

export interface MonitoringData {
  periodStart: string
  lastUpdated: string
  totalRequests: number
  errorCount: number
  errorRate: string
  averageResponseTime: number
  requestsByPath: Record<string, number>
  errorsByPath: Record<string, number>
  statusCodes: Record<string, number>
  topCountries: Record<string, number>
  responseTimePercentiles: ResponseTimePercentiles
}

const STORAGE_KEY = 'metrics'
const MAX_SAMPLES = 500

function createEmptyMetrics(): StoredMetrics {
  const now = new Date().toISOString()
  return {
    totalRequests: 0,
    errorCount: 0,
    totalResponseTime: 0,
    requestsByPath: {},
    errorsByPath: {},
    statusCodes: {},
    countries: {},
    responseTimes: [],
    createdAt: now,
    updatedAt: now,
  }
}

function updateCounter(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1
}

function calculatePercentiles(samples: number[]): ResponseTimePercentiles {
  if (samples.length === 0) {
    return { p50: 0, p90: 0, p95: 0, p99: 0 }
  }

  const sorted = [...samples].sort((a, b) => a - b)

  const percentile = (p: number) => {
    const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
    return sorted[index]
  }

  return {
    p50: percentile(50),
    p90: percentile(90),
    p95: percentile(95),
    p99: percentile(99),
  }
}

function summarizeMetrics(data: StoredMetrics): MonitoringData {
  const { totalRequests, errorCount, totalResponseTime } = data
  const averageResponseTime = totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0
  const errorRate = totalRequests > 0 ? `${((errorCount / totalRequests) * 100).toFixed(2)}%` : '0%'

  const topCountriesEntries = Object.entries(data.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const topCountries = Object.fromEntries(topCountriesEntries)

  return {
    periodStart: data.createdAt,
    lastUpdated: data.updatedAt,
    totalRequests,
    errorCount,
    errorRate,
    averageResponseTime,
    requestsByPath: data.requestsByPath,
    errorsByPath: data.errorsByPath,
    statusCodes: data.statusCodes,
    topCountries,
    responseTimePercentiles: calculatePercentiles(data.responseTimes),
  }
}

export class MetricsCollector {
  private initialized: Promise<void>

  constructor(private state: DurableObjectState, private env: { METRICS_COLLECTOR: DurableObjectNamespace }) {
    this.initialized = this.state.blockConcurrencyWhile(async () => {
      const existing = await this.state.storage.get<StoredMetrics>(STORAGE_KEY)
      if (!existing) {
        await this.state.storage.put(STORAGE_KEY, createEmptyMetrics())
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    await this.initialized

    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/record') {
      const metrics = (await request.json()) as RequestMetrics
      await this.record(metrics)
      return new Response(null, { status: 204 })
    }

    if (request.method === 'GET' && url.pathname === '/stats') {
      const data = await this.state.storage.get<StoredMetrics>(STORAGE_KEY)
      const summary = summarizeMetrics(data ?? createEmptyMetrics())
      return Response.json({ message: 'Worker monitoring statistics', data: summary })
    }

    if (request.method === 'POST' && url.pathname === '/reset') {
      await this.state.storage.put(STORAGE_KEY, createEmptyMetrics())
      return new Response(null, { status: 204 })
    }

    return new Response('Not found', { status: 404 })
  }

  private async record(metrics: RequestMetrics) {
    await this.state.storage.transaction(async (txn) => {
      const stored = (await txn.get<StoredMetrics>(STORAGE_KEY)) ?? createEmptyMetrics()

      stored.totalRequests += 1
      stored.totalResponseTime += metrics.duration
      updateCounter(stored.requestsByPath, metrics.path)
      updateCounter(stored.statusCodes, String(metrics.status))

      if (metrics.status >= 400) {
        stored.errorCount += 1
        updateCounter(stored.errorsByPath, metrics.path)
      }

      if (metrics.country) {
        updateCounter(stored.countries, metrics.country)
      }

      stored.responseTimes.push(metrics.duration)
      if (stored.responseTimes.length > MAX_SAMPLES) {
        stored.responseTimes.splice(0, stored.responseTimes.length - MAX_SAMPLES)
      }

      stored.updatedAt = new Date().toISOString()

      await txn.put(STORAGE_KEY, stored)
    })
  }
}
