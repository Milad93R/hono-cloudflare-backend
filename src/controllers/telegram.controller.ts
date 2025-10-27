import { Context } from 'hono'
import { Bindings, Variables } from '../types'
import { TelegramService } from '../services/telegram.service'
import { TELEGRAM_THREADS } from '../config/telegram.config'

export class TelegramController {
  /**
   * POST /api/telegram/send
   * Send a message to Telegram threads
   */
  async sendMessage(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const body = await c.req.json() as { message: string; threads?: number[] }
      
      if (!body.message) {
        return c.json({
          error: 'Message is required',
          timestamp: new Date().toISOString()
        }, 400)
      }

      const telegramService = new TelegramService(c.env)
      const results = await telegramService.logtel(body.message, body.threads)

      return c.json({
        message: 'Message sent',
        results: results,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending Telegram message:', error)
      return c.json({
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * POST /api/telegram/log
   * Send a formatted log message to Telegram threads
   */
  async sendLog(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    try {
      const body = await c.req.json() as { level: string; message: string; threads?: number[] }
      
      if (!body.message) {
        return c.json({
          error: 'Message is required',
          timestamp: new Date().toISOString()
        }, 400)
      }

      const level = body.level || 'INFO'
      const telegramService = new TelegramService(c.env)
      const results = await telegramService.logtelFormatted(level, body.message, body.threads)

      return c.json({
        message: 'Log sent',
        level: level,
        results: results,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending Telegram log:', error)
      return c.json({
        error: 'Failed to send log',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500)
    }
  }

  /**
   * GET /api/telegram/threads
   * Get available thread IDs
   */
  async getThreads(c: Context<{ Bindings: Bindings; Variables: Variables }>) {
    return c.json({
      threads: TELEGRAM_THREADS,
      description: {
        DEFAULT: 'Default thread - always included',
        OTHER: 'Additional thread'
      }
    })
  }
}
