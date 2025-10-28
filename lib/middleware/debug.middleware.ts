import { Context, Next } from 'hono'
import { Bindings, Variables } from '../types'

// Decorator middleware to include captured logs in response when X-Debug-Secret is provided
export const withDebugLogs = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
  // Check if debug mode is enabled before executing handler
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldIncludeLogs = debugSecret && providedSecret === debugSecret
  
  // Store flag in context so handler knows to include logs
  ;(c as any).set('shouldIncludeLogs', shouldIncludeLogs)
  
  await next()
}

// Log capture middleware - intercepts console logs when debug is enabled
export const logCapture = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
  const debugSecret = c.env?.DEBUG_SECRET
  const providedSecret = c.req.header('X-Debug-Secret')
  const shouldCaptureLogs = debugSecret && providedSecret === debugSecret
  
  if (shouldCaptureLogs) {
    const logs: Array<{ level: string; message: string; timestamp: string }> = []
    
    // Store original console methods
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info
    const originalDebug = console.debug
    
    // Override console methods to capture logs
    console.log = (...args: any[]) => {
      logs.push({ level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalLog.apply(console, args)
    }
    console.error = (...args: any[]) => {
      logs.push({ level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalError.apply(console, args)
    }
    console.warn = (...args: any[]) => {
      logs.push({ level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalWarn.apply(console, args)
    }
    console.info = (...args: any[]) => {
      logs.push({ level: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalInfo.apply(console, args)
    }
    console.debug = (...args: any[]) => {
      logs.push({ level: 'debug', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
      originalDebug.apply(console, args)
    }
    
    // Store logs in context for later retrieval
    ;(c as any).set('capturedLogs', logs)
    
    try {
      await next()
    } finally {
      // Restore original console methods
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      console.info = originalInfo
      console.debug = originalDebug
    }
  } else {
    await next()
  }
}
