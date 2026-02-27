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
}

// Notification types
export * from './notifications'