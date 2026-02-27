/**
 * Server-side structured logging with Pino
 * @see docs: https://www.dash0.com/guides/logging-in-node-js-with-pino
 */
import pino from 'pino'

interface LoggerConfig {
  level?: string
  service?: string
}

/**
 * Create a base logger instance
 */
function createLogger(config: LoggerConfig = {}) {
  const isDev = process.env.NODE_ENV !== 'production'

  return pino({
    level: config.level ?? process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),

    // Output level as string for Vercel log parsing
    formatters: {
      level: (label) => ({ level: label }),
    },

    // Redact sensitive fields before logging (GDPR compliance)
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.email',
        'body.password',
        'body.nip',
        'body.pesel',
        '*.apiKey',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTTED]',
    },

    // Base context for all logs
    base: {
      service: config.service ?? 'granthub-pl',
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    },

    // Pretty print in development
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  })
}

// Base logger instance
const baseLogger = createLogger()

/**
 * Main application logger
 */
export const logger = baseLogger

/**
 * Scraper domain logger
 * Includes context about scraping operations
 */
export const scraperLogger = baseLogger.child({ domain: 'scraper' })

/**
 * API domain logger
 * Includes context about API operations
 */
export const apiLogger = baseLogger.child({ domain: 'api' })

/**
 * Cron job logger
 * Includes context about scheduled tasks
 */
export const cronLogger = baseLogger.child({ domain: 'cron' })

/**
 * Auth domain logger
 * Includes context about authentication operations
 */
export const authLogger = baseLogger.child({ domain: 'auth' })

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>) {
  return baseLogger.child(context)
}

/**
 * Log scraper operation with timing
 */
export async function logScraperOperation<T>(
  source: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const log = scraperLogger.child({ source, operation })
  const start = performance.now()

  log.info({ url: operation }, 'Scrape started')

  try {
    const result = await fn()
    const duration = Math.round(performance.now() - start)

    log.info({ durationMs: duration }, 'Scrape completed')
    return result
  } catch (error) {
    const duration = Math.round(performance.now() - start)

    log.error({ error, durationMs: duration }, 'Scrape failed')
    throw error
  }
}

/**
 * Log API request with timing
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  metadata?: Record<string, unknown>
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

  apiLogger[level](
    {
      method,
      path,
      statusCode,
      durationMs,
      ...metadata,
    },
    `API ${method} ${path} - ${statusCode}`
  )
}

/**
 * Type-safe log levels
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Utility to check if a log level is enabled
 */
export function isLogLevelEnabled(level: LogLevel): boolean {
  const levels: Record<LogLevel, number> = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
  }

  const currentLevel = levels[(process.env.LOG_LEVEL as LogLevel) ?? 'info']
  return levels[level] >= currentLevel
}
