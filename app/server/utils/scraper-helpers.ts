import { scraperLogger } from './logger'

/**
 * Retry configuration for scraper operations
 */
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
}

/**
 * Error classification for scraper failures
 */
export type ScraperErrorType = 
  | 'network'
  | 'timeout'
  | 'parse'
  | 'rate_limit'
  | 'not_found'
  | 'server_error'
  | 'unknown'

interface ScraperError {
  type: ScraperErrorType
  message: string
  recoverable: boolean
  originalError?: Error
}

/**
 * Classify an error that occurred during scraping
 */
export function classifyScraperError(error: unknown): ScraperError {
  const err = error instanceof Error ? error : new Error(String(error))
  const message = err.message.toLowerCase()
  
  if (message.includes('timeout') || message.includes('etimedout')) {
    return { type: 'timeout', message: err.message, recoverable: true, originalError: err }
  }
  
  if (message.includes('fetch') || message.includes('network') || message.includes('econnrefused')) {
    return { type: 'network', message: err.message, recoverable: true, originalError: err }
  }
  
  if (message.includes('rate') || message.includes('429') || message.includes('too many requests')) {
    return { type: 'rate_limit', message: err.message, recoverable: true, originalError: err }
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return { type: 'not_found', message: err.message, recoverable: false, originalError: err }
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return { type: 'server_error', message: err.message, recoverable: true, originalError: err }
  }
  
  if (message.includes('parse') || message.includes('cheerio') || message.includes('selector')) {
    return { type: 'parse', message: err.message, recoverable: false, originalError: err }
  }
  
  return { type: 'unknown', message: err.message, recoverable: false, originalError: err }
}

/**
 * Execute a scraper function with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: { source: string; operation: string },
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const start = performance.now()
      const result = await operation()
      const duration = Math.round(performance.now() - start)
      
      scraperLogger.info({
        source: context.source,
        operation: context.operation,
        attempt,
        durationMs: duration,
        success: true
      }, 'Scraper operation succeeded')
      
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const classified = classifyScraperError(error)
      
      scraperLogger.warn({
        source: context.source,
        operation: context.operation,
        attempt,
        maxRetries: retryConfig.maxRetries,
        errorType: classified.type,
        recoverable: classified.recoverable,
        error: lastError.message
      }, 'Scraper operation failed')
      
      if (!classified.recoverable || attempt === retryConfig.maxRetries) {
        break
      }
      
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      )
      
      scraperLogger.info({
        source: context.source,
        operation: context.operation,
        attempt,
        delayMs: delay
      }, 'Retrying scraper operation')
      
      await sleep(delay)
    }
  }
  
  throw lastError || new Error('Scraper operation failed after retries')
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wrap a scraper to add error handling and logging
 */
export function createSafeScraper<T extends (...args: any[]) => Promise<any>>(
  source: string,
  scraperFn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await withRetry(
        () => scraperFn(...args),
        { source, operation: 'scrape' }
      )
    } catch (error) {
      const classified = classifyScraperError(error)
      
      scraperLogger.error({
        source,
        errorType: classified.type,
        error: classified.message
      }, 'Scraper failed permanently')
      
      throw error
    }
  }) as T
}

/**
 * Validate scraped data
 */
export function validateScrapedData<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: (keyof T)[] } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })
  
  return {
    valid: missingFields.length === 0,
    missingFields
  }
}

/**
 * Safely extract text from HTML with fallback
 */
export function safeExtract(
  extractFn: () => string | undefined,
  fallback: string = ''
): string {
  try {
    return extractFn() || fallback
  } catch {
    return fallback
  }
}

/**
 * Rate limiter for scraper requests
 */
export class RateLimiter {
  private lastRequestTime: number = 0
  private minInterval: number
  
  constructor(requestsPerSecond: number = 1) {
    this.minInterval = 1000 / requestsPerSecond
  }
  
  async throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    
    if (elapsed < this.minInterval) {
      await sleep(this.minInterval - elapsed)
    }
    
    this.lastRequestTime = Date.now()
  }
}
