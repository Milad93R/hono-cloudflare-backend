import { Bindings } from '../types'
import { TELEGRAM_CONFIG } from '../config/telegram.config'

export class TelegramService {
  private botToken: string
  private groupId: string
  private defaultThread: number

  constructor(env: Bindings) {
    this.botToken = env.TELEGRAM_BOT_TOKEN || ''
    this.groupId = TELEGRAM_CONFIG.groupId
    this.defaultThread = TELEGRAM_CONFIG.defaultThread
  }

  /**
   * Send a message to Telegram group threads
   * @param message - The message to send
   * @param threads - Optional array of thread IDs to send to (in addition to default)
   * @returns Promise with results for each thread
   */
  async logtel(message: string, threads?: number[]): Promise<Array<{ thread: number; success: boolean; error?: string }>> {
    if (!this.botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not configured')
      return [{ thread: this.defaultThread, success: false, error: 'Bot token not configured' }]
    }

    // Always include default thread
    const threadsToSend = new Set<number>([this.defaultThread])
    
    // Add additional threads if provided
    if (threads && threads.length > 0) {
      threads.forEach(thread => threadsToSend.add(thread))
    }

    const results: Array<{ thread: number; success: boolean; error?: string }> = []

    // Send to each thread
    for (const threadId of threadsToSend) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`
        
        const payload = {
          chat_id: this.groupId,
          message_thread_id: threadId,
          text: message,
          parse_mode: 'HTML'
        }

        console.log(`Sending message to Telegram thread ${threadId}`)
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json() as any

        if (response.ok && data.ok) {
          console.log(`Successfully sent message to thread ${threadId}`)
          results.push({ thread: threadId, success: true })
        } else {
          console.error(`Failed to send message to thread ${threadId}:`, data)
          results.push({ 
            thread: threadId, 
            success: false, 
            error: data.description || 'Unknown error' 
          })
        }
      } catch (error) {
        console.error(`Exception sending message to thread ${threadId}:`, error)
        results.push({ 
          thread: threadId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return results
  }

  /**
   * Send a formatted log message with timestamp
   * @param level - Log level (INFO, WARN, ERROR, etc.)
   * @param message - The message to send
   * @param threads - Optional array of thread IDs
   */
  async logtelFormatted(level: string, message: string, threads?: number[]): Promise<Array<{ thread: number; success: boolean; error?: string }>> {
    const timestamp = new Date().toISOString()
    const formattedMessage = `<b>[${level}]</b> ${timestamp}\n${message}`
    return this.logtel(formattedMessage, threads)
  }
}
