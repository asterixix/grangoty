// Global types for the NGO Grants Aggregator

export interface Grant {
  id: string
  source: string
  title: string
  description: string
  amount?: {
    min?: number
    max?: number
    currency: string
  }
  deadline?: string
  category: string
  region: string
  eligibility: string[]
  website?: string
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  tags: string[]
  status: 'open' | 'closing_soon' | 'closed' | 'archived'
  scrapedAt: string
  lastVerifiedAt?: string
}

export interface RawGrant {
  id?: string
  source: string
  url?: string
  title?: string
  description?: string
  amount?: string | { min?: number; max?: number; currency: string }
  deadline?: string
  category?: string
  region?: string
  eligibility?: string[]
  website?: string
  contact?: {
    email?: string
    phone?: string
    address?: string
  }
  tags?: string[]
  status?: 'open' | 'closing_soon' | 'closed' | 'archived'
  scrapedAt?: string
  lastVerifiedAt?: string
}
export interface FilterState {
  category: string | null
  region: string | null
  deadline: {
    from?: string
    to?: string
  }
  amount: {
    min?: number
    max?: number
  }
  search: string
  status: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, unknown>
}

export type LocaleCode = 'pl' | 'en' | 'uk' | 'be' | 'de'

export interface Translations {
  [key: string]: string | Translations
}

// Scraper types
export interface ScraperConfig {
  name: string
  url: string
  enabled: boolean
  interval: string // cron expression
}

export interface ScrapeResult {
  source: string
  count: number
  newGrants: number
  updatedGrants: number
  failed: number
  timestamp: string
  error?: string
  errors?: Array<{
    source: string
    type: string
    message: string
  }>
}

// Debug and monitoring types
export interface ScraperHealth {
  source: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastRun: string
  count: number
  errorCount: number
  error?: string
  responseTime?: number
}

export interface ScraperMetrics {
  totalGrants: number
  activeScrapers: number
  failedScrapers: number
  lastUpdate: string
  averageResponseTime: number
  errorRate: number
}

export interface ScraperLogs {
  timestamp: string
  source: string
  level: string
  limit: number
  entries: Array<{
    timestamp: string
    level: string
    source: string
    message: string
    metadata?: Record<string, any>
  }>
}

export interface ScraperTestResult {
  source: string
  timestamp: string
  dryRun: boolean
  success: boolean
  grants: Array<{
    id: string
    title: string
    description: string
    source: string
    scrapedAt: string
  }>
  errors?: Array<{
    type: string
    message: string
    recoverable: boolean
    timestamp: string
  }>
  metadata: {
    duration: number
    requestCount: number
    bytesProcessed: number
  }
}

export interface DebugInfo {
  version: string
  uptime: number
  environment: string
  scrapers: ScraperHealth[]
  metrics: ScraperMetrics
  logs: Array<{
    timestamp: string
    level: string
    source: string
    message: string
    error?: string
  }>
}

// Notification types
export * from './notifications'