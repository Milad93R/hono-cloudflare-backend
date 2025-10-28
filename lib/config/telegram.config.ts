// Telegram configuration
export const TELEGRAM_CONFIG = {
  groupId: '-1003291431716',
  defaultThread: 2,
  threads: {
    default: 2,
    other: 5
  }
} as const

// Thread IDs for easy access
export const TELEGRAM_THREADS = {
  DEFAULT: 2,
  OTHER: 5
} as const
