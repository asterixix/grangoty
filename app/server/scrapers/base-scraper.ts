import * as cheerio from 'cheerio'
import type { RawGrant } from '~/types'

/**
 * Abstract base class for all scrapers
 * Provides common functionality for scraping, normalization, and error handling
 */
export abstract class BaseScraper {
  abstract source: string
  abstract url: string
  abstract enabled: boolean

  /**
   * Scrape grants from the source
   * Must be implemented by subclasses
   */
  abstract scrape(): Promise<RawGrant[]>

  /**
   * Normalize a raw grant to the standard format
   */
  protected normalize(raw: RawGrant): RawGrant {
    return {
      ...raw,
      source: this.source,
      scrapedAt: new Date().toISOString(),
      // Clean up strings
      title: this.cleanString(raw.title),
      description: this.cleanString(raw.description),
      amount: typeof raw.amount === 'string' ? this.parseAmount(raw.amount) : raw.amount,
      deadline: this.parseDate(raw.deadline),
      category: this.cleanString(raw.category),
      region: this.cleanString(raw.region),
      eligibility: raw.eligibility?.map(e => this.cleanString(e)).filter((e): e is string => e !== undefined) || [],
      website: this.cleanUrl(raw.website),
      contact: raw.contact ? {
        email: raw.contact.email?.toLowerCase().trim(),
        phone: this.cleanString(raw.contact.phone),
        address: this.cleanString(raw.contact.address)
      } : undefined,
      tags: raw.tags?.map(t => this.cleanString(t)?.toLowerCase()).filter((t): t is string => t !== undefined) || [],
      status: raw.status || 'open'
    }
  }

  /**
   * Clean whitespace and trim strings
   */
  protected cleanString(value?: string): string | undefined {
    if (!value) return undefined
    return value.replace(/\s+/g, ' ').trim()
  }

  /**
   * Parse amount string to structured format
   */
  protected parseAmount(value?: string): RawGrant['amount'] {
    if (!value) return undefined

    const clean = value.replace(/\s+/g, '').toLowerCase()
    const currency = this.detectCurrency(clean)

    // Extract numeric values
    const numbers = clean.match(/[\d.]+/g)
    if (!numbers) return { currency }

    if (numbers.length === 1) {
      const amount = this.parseNumber(numbers[0])
      return { min: amount, max: amount, currency }
    }

    const min = this.parseNumber(numbers[0]!)
    const max = this.parseNumber(numbers[1]!)
    return { min, max, currency }
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(value?: string): string | undefined {
    if (!value) return undefined

    const clean = this.cleanString(value)
    if (!clean) return undefined

    // Try various date formats
    const formats = [
      /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
      /\d{2}\.\d{2}\.\d{4}/, // DD.MM.YYYY
      /\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    ]

    for (const format of formats) {
      const match = clean.match(format)
      if (match) {
        const date = new Date(match[0])
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      }
    }

    return undefined
  }

  /**
   * Clean and validate URL
   */
  protected cleanUrl(value?: string): string | undefined {
    if (!value) return undefined
    const clean = this.cleanString(value)
    if (!clean) return undefined

    // Add protocol if missing
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return `https://${clean}`
    }

    return clean
  }

  /**
   * Detect currency from string
   */
  protected detectCurrency(text: string): string {
    if (text.includes('pln') || text.includes('zł')) return 'PLN'
    if (text.includes('eur') || text.includes('€')) return 'EUR'
    if (text.includes('usd') || text.includes('$')) return 'USD'
    if (text.includes('gbp') || text.includes('£')) return 'GBP'
    return 'PLN' // Default
  }

  /**
   * Parse number with locale support
   */
  protected parseNumber(value: string): number | undefined {
    // Replace European decimal separators
    const clean = value.replace(',', '.')
    const num = parseFloat(clean)
    return isNaN(num) ? undefined : num
  }

  /**
   * Extract text from HTML using Cheerio
   */
  protected extractText(html: string, selector: string): string | undefined {
    const $ = cheerio.load(html)
    const element = $(selector).first()
    if (element.length === 0) return undefined
    return element.text().trim()
  }

  /**
   * Extract all text matching selector
   */
  protected extractAllText(html: string, selector: string): string[] {
    const $ = cheerio.load(html)
    const elements = $(selector)
    const result: string[] = []
    elements.each((_, el) => {
      const text = $(el).text().trim()
      if (text) result.push(text)
    })
    return result
  }

  /**
   * Extract attribute value
   */
  protected extractAttribute(html: string, selector: string, attribute: string): string | undefined {
    const $ = cheerio.load(html)
    const element = $(selector).first()
    if (element.length === 0) return undefined
    return element.attr(attribute)?.trim()
  }

  /**
   * Extract all links from HTML
   */
  protected extractLinks(html: string, selector: string): string[] {
    const $ = cheerio.load(html)
    const elements = $(selector)
    const result: string[] = []
    elements.each((_, el) => {
      const href = $(el).attr('href')?.trim()
      if (href) result.push(href)
    })
    return result
  }
}

/**
 * Static HTML scraper using Cheerio
 */
export class StaticHtmlScraper extends BaseScraper {
  source = 'static'
  url = ''
  enabled = true
  protected html: string = ''

  async scrape(): Promise<RawGrant[]> {
    return []
  }

  async load(url: string): Promise<void> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      this.html = await response.text()
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected getHtml(): string {
    if (!this.html) {
      throw new Error('HTML not loaded. Call load() first.')
    }
    return this.html
  }
}

/**
 * Dynamic JS scraper using Playwright
 */
export class DynamicScraper extends BaseScraper {
  source = 'dynamic'
  url = ''
  enabled = true
  protected browser: any = null

  async scrape(): Promise<RawGrant[]> {
    return []
  }

  async initialize(): Promise<void> {
    // Initialize Playwright browser if needed
    // For now, we'll use Crawlee's built-in browser
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

/**
 * Utility function to deduplicate grants
 */
export function deduplicateGrants(grants: RawGrant[]): RawGrant[] {
  const seen = new Set<string>()
  return grants.filter(grant => {
    // Use title + source as unique identifier
    const id = `${grant.source}:${grant.title}`
    if (seen.has(id)) {
      return false
    }
    seen.add(id)
    return true
  })
}

/**
 * Utility function to validate a grant
 */
export function validateGrant(grant: RawGrant): boolean {
  if (!grant.title || !grant.source) {
    return false
  }
  return true
}