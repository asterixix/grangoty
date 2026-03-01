/**
 * Enhanced scraper error handling system with error types, recovery strategies, and circuit breakers
 * Based on production-grade patterns from docs-mcp-server and israeli-bank-scrapers
 */
import { scraperLogger } from './logger'

/**
 * Scraper error types for classification and recovery
 */
export enum ScraperErrorType {
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT_ERROR',
  RateLimitError = 'RATE_LIMIT_ERROR',
  ParseError = 'PARSE_ERROR',
  NotFoundError = 'NOT_FOUND_ERROR',
  ServerError = 'SERVER_ERROR',
  AuthError = 'AUTH_ERROR',
  BlockingError = 'BLOCKING_ERROR',
  UnknownError = 'UNKNOWN_ERROR'
}

/**
 * Base scraper error with retry capability and classification
 */
export class ScraperError extends Error {
  public readonly type: ScraperErrorType
  public readonly recoverable: boolean
  public readonly cause?: Error
  public readonly metadata?: Record<string, unknown>

  constructor(
    message: string,
    type: ScraperErrorType = ScraperErrorType.UnknownError,
    recoverable: boolean = false,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ScraperError'
    this.type = type
    this.recoverable = recoverable
    this.cause = cause
    this.metadata = metadata

    // Preserve stack trace
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`
    }
  }
}

/**
 * Classify errors based on message and context
 */
export function classifyScraperError(error: unknown): ScraperError {
  const err = error instanceof Error ? error : new Error(String(error))
  const message = err.message.toLowerCase()

  // Network errors
  if (message.includes('fetch') || message.includes('network') ||
      message.includes('econnrefused') || message.includes('enotfound') ||
      message.includes('net::')) {
    return new ScraperError(
      `Network error: ${err.message}`,
      ScraperErrorType.NetworkError,
      true,
      err
    )
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('etimedout')) {
    return new ScraperError(
      `Timeout error: ${err.message}`,
      ScraperErrorType.TimeoutError,
      true,
      err
    )
  }

  // Rate limit errors
  if (message.includes('rate') || message.includes('429') ||
      message.includes('too many requests') || message.includes('retry-after')) {
    return new ScraperError(
      `Rate limit error: ${err.message}`,
      ScraperErrorType.RateLimitError,
      true,
      err
    )
  }

  // Parse/selector errors
  if (message.includes('parse') || message.includes('cheerio') ||
      message.includes('selector') || message.includes('element not found')) {
    return new ScraperError(
      `Parse error: ${err.message}`,
      ScraperErrorType.ParseError,
      false,
      err
    )
  }

  // Not found errors
  if (message.includes('404') || message.includes('not found')) {
    return new ScraperError(
      `Not found error: ${err.message}`,
      ScraperErrorType.NotFoundError,
      false,
      err
    )
  }

  // Server errors
  if (message.includes('500') || message.includes('502') ||
      message.includes('503') || message.includes('504')) {
    return new ScraperError(
      `Server error: ${err.message}`,
      ScraperErrorType.ServerError,
      true,
      err
    )
  }

  // Auth errors
  if (message.includes('401') || message.includes('403') ||
      message.includes('unauthorized') || message.includes('forbidden')) {
    return new ScraperError(
      `Auth error: ${err.message}`,
      ScraperErrorType.AuthError,
      false,
      err
    )
  }

  // Blocking/Captcha errors
  if (message.includes('blocked') || message.includes('captcha') ||
      message.includes('cloudflare') || message.includes('access denied')) {
    return new ScraperError(
      `Blocking error: ${err.message}`,
      ScraperErrorType.BlockingError,
      false,
      err
    )
  }

  // Unknown errors
  return new ScraperError(
    `Unknown error: ${err.message}`,
    ScraperErrorType.UnknownError,
    false,
    err
  )
}

/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true
}

/**
 * Calculate exponential backoff delay with optional jitter
 */
export function calculateBackoff(
  retryCount: number,
  config: Partial<RetryConfig> = {}
): number {
  const { baseDelay, maxDelay, backoffMultiplier, jitter } = { ...DEFAULT_RETRY_CONFIG, ...config }

  // Exponential backoff: baseDelay * (backoffMultiplier ^ retryCount)
  const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, retryCount), maxDelay)

  // Add jitter to prevent thundering herd
  if (jitter) {
    const jitterAmount = delay * 0.1 * Math.random() // 10% jitter
    return Math.floor(delay + jitterAmount)
  }

  return Math.floor(delay)
}

/**
 * Execute scraper operation with comprehensive retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: { source: string; operation: string },
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
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

      const logData = {
        source: context.source,
        operation: context.operation,
        attempt,
        maxRetries: retryConfig.maxRetries,
        errorType: classified.type,
        recoverable: classified.recoverable,
        error: lastError.message
      }

      if (!classified.recoverable || attempt > retryConfig.maxRetries) {
        scraperLogger.error(logData, 'Scraper operation failed permanently')
        throw classified
      }

      // Calculate delay based on error type
      let delay: number
      if (classified.type === ScraperErrorType.RateLimitError) {
        // For rate limits, use a longer delay
        delay = calculateBackoff(attempt - 1, { ...retryConfig, baseDelay: 5000 })
      } else {
        delay = calculateBackoff(attempt - 1, retryConfig)
      }

      scraperLogger.warn({
        ...logData,
        delayMs: delay
      }, 'Scraper operation failed, retrying')

      await sleep(delay)
    }
  }

  throw lastError || new ScraperError('Scraper operation failed after retries')
}

/**
 * Circuit breaker for failing scrapers
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
        scraperLogger.info({ state: this.state }, 'Circuit breaker transitioning to half-open')
      } else {
        throw new ScraperError(
          'Circuit breaker is OPEN',
          ScraperErrorType.ServerError,
          false
        )
      }
    }

    try {
      const result = await operation()

      if (this.state === 'HALF_OPEN') {
        this.failures = 0
        this.state = 'CLOSED'
        scraperLogger.info({ state: this.state }, 'Circuit breaker closed after successful operation')
      }

      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN'
        scraperLogger.warn({
          state: this.state,
          failures: this.failures,
          threshold: this.failureThreshold
        }, 'Circuit breaker opened due to repeated failures')
      }

      throw error
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }
}

/**
 * Rate limiter with token bucket algorithm
 */
export class RateLimiter {
  private tokens: number
  private lastRefill: number

  constructor(
    private readonly capacity: number = 10, // Max tokens
    private readonly refillRate: number = 1 // Tokens per second
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    this.refill()

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate * 1000
      scraperLogger.warn({
        waitTimeMs: Math.ceil(waitTime),
        currentTokens: this.tokens
      }, 'Rate limit exceeded, waiting')
      await sleep(Math.ceil(waitTime))
      this.refill()
    }

    this.tokens -= 1
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    const tokensToAdd = elapsed * this.refillRate

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

/**
 * Wrap scraper with circuit breaker and rate limiting
 */
export function createResilientScraper<T extends (...args: any[]) => Promise<any>>(
  source: string,
  scraperFn: T,
  options: {
    circuitBreaker?: CircuitBreaker
    rateLimiter?: RateLimiter
  } = {}
): T {
  const { circuitBreaker, rateLimiter } = options

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const operation = async () => {
      if (rateLimiter) {
        await rateLimiter.acquire()
      }

      return await withRetry(
        () => scraperFn(...args),
        { source, operation: 'scrape' }
      )
    }

    if (circuitBreaker) {
      return await circuitBreaker.execute(operation)
    }

    return await operation()
  }) as T
}

/**
 * Safe extraction with fallbacks and error handling
 */
export function safeExtract<T>(
  extractFn: () => T,
  fallback: T,
  context?: { source: string; field: string }
): T {
  try {
    return extractFn()
  } catch (error) {
    if (context) {
      scraperLogger.warn({
        source: context.source,
        field: context.field,
        error: error instanceof Error ? error.message : String(error)
      }, 'Safe extraction failed, using fallback')
    }
    return fallback
  }
}

/**
 * Validate scraped data structure
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
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
