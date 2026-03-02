import { PlaywrightCrawler, createPlaywrightRouter } from 'crawlee'
import * as cheerio from 'cheerio'
import type { RawGrant } from '~/types'
import { WitkacApiScraper } from './sources/witkac-api'
import { GovPlPozytekScraper } from './sources/gov-pl-pozytek'
import { NiwGeneratorScraper } from './sources/niw-generator'
import { EuFundingTendersScraper } from './sources/eu-funding-tenders'
import { ActiveCitizensFundScraper } from './sources/active-citizens-fund'
import { GrantowoPlScraper } from './sources/grantowo'
import { WarsawNgoScraper } from './sources/warsaw'
import { WroclawNgoScraper } from './sources/wroclaw'
import { LodzNgoScraper } from './sources/lodz'
import { PoznanNgoScraper } from './sources/poznan'
import { PodkarpackieNgoScraper } from './sources/podkarpackie'
import { GdanskNgoScraper } from './sources/gdansk'
import { LesznoNgoScraper } from './sources/leszno'
import { AktywniPlusScraper } from './sources/aktywni-plus'
import {
  ScraperError,
  ScraperErrorType,
  withRetry,
  CircuitBreaker,
  RateLimiter,
  safeExtract,
  validateScrapedData
} from '../utils/scraper-helpers'
import { scraperLogger } from '../utils/logger'

/**
 * Base configuration for scrapers
 */
export interface ScraperConfig {
  name: string
  baseUrl: string
  enabled: boolean
  maxRequestsPerCrawl?: number
  requestHandlerTimeoutSecs?: number
}

/**
 * Real scraper implementation using Crawlee + Playwright
 */
export class RealScraper {
  protected _config: ScraperConfig
  protected grants: RawGrant[] = []

  constructor(config: ScraperConfig) {
    this._config = config
  }

  /**
   * Get scraper configuration
   */
  get config(): ScraperConfig {
    return this._config
  }

  /**
   * Get the source name
   */
  get source(): string {
    return this._config.name
  }

  /**
   * Check if scraper is enabled
   */
  get enabled(): boolean {
    return this._config.enabled
  }

  /**
   * Main scrape method - to be overridden by subclasses
   */
  async scrape(): Promise<RawGrant[]> {
    return this.grants
  }

  /**
   * Normalize grant data
   */
  protected normalize(raw: Partial<RawGrant>): RawGrant {
    return {
      id: raw.id || crypto.randomUUID(),
      source: this._config.name,
      title: this.cleanText(raw.title),
      description: this.cleanText(raw.description),
      amount: raw.amount,
      deadline: raw.deadline,
      category: raw.category || 'general',
      region: raw.region || 'Poland',
      eligibility: raw.eligibility || [],
      website: raw.website,
      contact: raw.contact,
      tags: raw.tags || [],
      status: raw.status || 'open',
      scrapedAt: new Date().toISOString(),
    }
  }

  /**
   * Clean text content
   */
  protected cleanText(text?: string): string {
    if (!text) return ''
    return text.replace(/\s+/g, ' ').trim()
  }

  /**
   * Parse amount from text
   */
  protected parseAmount(text?: string): RawGrant['amount'] {
    if (!text) return undefined

    const clean = text.replace(/\s+/g, '').toLowerCase()
    const currency = this.detectCurrency(clean)
    const numbers = clean.match(/[\d.]+/g)

    if (!numbers || numbers.length === 0) {
      return currency ? { currency } : undefined
    }

    if (numbers.length === 1) {
      const amount = parseFloat(numbers[0])
      return { min: amount, max: amount, currency }
    }

    const min = parseFloat(numbers[0])
    const max = parseFloat(numbers[1])
    return { min, max, currency }
  }

  /**
   * Detect currency from text
   */
  protected detectCurrency(text: string): string {
    if (text.includes('pln') || text.includes('zł') || text.includes('zloty')) return 'PLN'
    if (text.includes('eur') || text.includes('€')) return 'EUR'
    if (text.includes('usd') || text.includes('$')) return 'USD'
    if (text.includes('gbp') || text.includes('£')) return 'GBP'
    return 'PLN'
  }

  /**
   * Parse date from various formats
   */
  protected parseDate(text?: string): string | undefined {
    if (!text) return undefined

    const clean = this.cleanText(text)
    
    // Try ISO format first
    const isoMatch = clean.match(/\d{4}-\d{2}-\d{2}/)
    if (isoMatch) {
      return isoMatch[0]
    }

    // Try DD.MM.YYYY
    const euMatch = clean.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
    if (euMatch) {
      const [, day, month, year] = euMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    // Try DD/MM/YYYY
    const ukMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (ukMatch) {
      const [, day, month, year] = ukMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    return undefined
  }
}

/**
 * Fundusze.ngo.pl Scraper - Dynamic JS site with enhanced error handling
 */
export class FunduszeNgoScraper extends RealScraper {
  private circuitBreaker = new CircuitBreaker(3, 300000)
  private rateLimiter = new RateLimiter(2, 1) // 2 requests per second

  constructor() {
    super({
      name: 'fundusze-ngo',
      baseUrl: 'https://fundusze.ngo.pl',
      enabled: true,
      maxRequestsPerCrawl: 50,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    return await this.circuitBreaker.execute(async () => {
      return await withRetry(
        () => this.performScrape(),
        { source: this._config.name, operation: 'scrape' },
        { maxRetries: 2, baseDelay: 3000 }
      )
    })
  }

  private async performScrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    const router = createPlaywrightRouter()

    // Handle grant listing pages
    router.addHandler('grantList', async ({ page, enqueueLinks }) => {
      try {
        await this.rateLimiter.acquire()

        // Extract grant links with safe extraction
        const grantLinks = await safeExtract(
          () => page.$eval('a[href*="/grant"], a[href*="/fundusz"], a[href*="/dotacja"]',
            (links: any[]) => links.map((link: any) => link.getAttribute('href')).filter(Boolean)
          ),
          [],
          { source: this._config.name, field: 'grantLinks' }
        )

        // Enqueue grant detail pages with validation
        for (const href of grantLinks.slice(0, 20)) {
          if (href && typeof href === 'string') {
            try {
              await enqueueLinks({
                urls: [href.startsWith('http') ? href : `${this._config.baseUrl}${href}`],
                label: 'grantDetail',
              })
            } catch (enqueueError) {
              scraperLogger.warn({
                source: this._config.name,
                url: href,
                error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError)
              }, 'Failed to enqueue grant URL')
            }
          }
        }
      } catch (error) {
        scraperLogger.error({
          source: this._config.name,
          error: error instanceof Error ? error.message : String(error)
        }, 'Failed to handle grant list page')
        throw new ScraperError(
          `Grant list extraction failed: ${error instanceof Error ? error.message : String(error)}`,
          ScraperErrorType.ParseError,
          false,
          error instanceof Error ? error : undefined
        )
      }
    })

    // Handle grant detail pages
    router.addHandler('grantDetail', async ({ page, request }) => {
      try {
        await this.rateLimiter.acquire()

        await safeExtract(
          () => page.waitForSelector('h1, .title, .grant-title', { timeout: 5000 }),
          undefined,
          { source: this._config.name, field: 'waitForSelector' }
        )

        const grant: Partial<RawGrant> = {
          source: this._config.name,
          website: request.url,
        }

        // Extract title with safe extraction
        grant.title = await safeExtract(
          () => page.$eval('h1, .grant-title, .title', el => el.textContent?.trim() || ''),
          '',
          { source: this._config.name, field: 'title' }
        )

        // Extract description
        grant.description = await safeExtract(
          () => page.$eval('.description, .content, .grant-description, article',
            el => el.textContent?.trim() || ''
          ),
          '',
          { source: this._config.name, field: 'description' }
        )

        // Extract amount with validation
        const amountText = await safeExtract(
          () => page.$eval('.amount, .kwota, [class*="amount"]',
            el => el.textContent?.trim() || ''
          ),
          '',
          { source: this._config.name, field: 'amount' }
        )
        if (amountText) {
          grant.amount = this.parseAmount(amountText)
        }

        // Extract deadline
        const deadlineText = await safeExtract(
          () => page.$eval('.deadline, [class*="termin"], [class*="date"]',
            el => el.textContent?.trim() || ''
          ),
          '',
          { source: this._config.name, field: 'deadline' }
        )
        if (deadlineText) {
          grant.deadline = this.parseDate(deadlineText)
        }

        // Extract category
        grant.category = await safeExtract(
          () => page.$eval('.category, [class*="kategoria"]',
            el => el.textContent?.trim() || 'general'
          ),
          'general',
          { source: this._config.name, field: 'category' }
        )

        // Validate extracted data
        const validation = validateScrapedData(grant, ['title'])
        if (!validation.valid) {
          scraperLogger.warn({
            source: this._config.name,
            url: request.url,
            missingFields: validation.missingFields
          }, 'Grant data validation failed, skipping')
          return
        }

        if (grant.title && grant.title.length > 0) {
          grants.push(this.normalize(grant))
        }
      } catch (error) {
        scraperLogger.error({
          source: this._config.name,
          url: request.url,
          error: error instanceof Error ? error.message : String(error)
        }, 'Failed to scrape grant detail page')
        // Don't throw here - continue with other grants
      }
    })

    try {
      const crawler = new PlaywrightCrawler({
        requestHandler: router,
        maxRequestsPerCrawl: this._config.maxRequestsPerCrawl,
        requestHandlerTimeoutSecs: this._config.requestHandlerTimeoutSecs || 30,
        headless: true,
        // Add error handling for crawler failures
        failedRequestHandler: ({ request, error }) => {
          scraperLogger.error({
            source: this._config.name,
            url: request.url,
            error: error.message
          }, 'Crawler request failed')
        }
      })

      await crawler.run([
        { url: `${this._config.baseUrl}/`, label: 'grantList' },
        { url: `${this._config.baseUrl}/dotacje`, label: 'grantList' },
        { url: `${this._config.baseUrl}/fundusze`, label: 'grantList' },
      ])
    } catch (error) {
      scraperLogger.error({
        source: this._config.name,
        error: error instanceof Error ? error.message : String(error)
      }, 'Crawler execution failed')

      throw new ScraperError(
        `Crawler failed: ${error instanceof Error ? error.message : String(error)}`,
        ScraperErrorType.NetworkError,
        true,
        error instanceof Error ? error : undefined
      )
    }

    scraperLogger.info({
      source: this._config.name,
      grantsFound: grants.length
    }, 'FunduszeNgoScraper completed')

    return grants
  }
}

/**
 * NIW.gov.pl Scraper - Static HTML site with enhanced error handling
 */
export class NiwGovPlScraper extends RealScraper {
  private circuitBreaker = new CircuitBreaker(5, 600000)
  private rateLimiter = new RateLimiter(1, 2) // 1 request per 2 seconds

  constructor() {
    super({
      name: 'niw',
      baseUrl: 'https://niw.gov.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    return await this.circuitBreaker.execute(async () => {
      return await withRetry(
        () => this.performScrape(),
        { source: this._config.name, operation: 'scrape' }
      )
    })
  }

  private async performScrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      await this.rateLimiter.acquire()

      // Fetch main grants page with timeout and error handling
      const response = await withRetry(
        () => fetch(`${this._config.baseUrl}/o-niw/programy-i-fundusze`, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NGO Grants Aggregator)'
          }
        }),
        { source: this._config.name, operation: 'fetch' },
        { maxRetries: 2, baseDelay: 2000 }
      )

      if (!response.ok) {
        throw new ScraperError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500 ? ScraperErrorType.ServerError : ScraperErrorType.NotFoundError,
          response.status >= 500
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Find grant items with safe selectors
      const grantSelectors = [
        '.grant-item',
        '.program-item',
        '.fundusz-item',
        'article',
        '.content-item'
      ]

      let itemsFound = 0
      for (const selector of grantSelectors) {
        $(selector).each((_, el) => {
          try {
            const $el = $(el)

            const grant: Partial<RawGrant> = {
              source: this._config.name,
              title: safeExtract(
                () => $el.find('h2, h3, .title').text().trim(),
                '',
                { source: this._config.name, field: 'title' }
              ),
              description: safeExtract(
                () => $el.find('.description, .content, p').text().trim(),
                '',
                { source: this._config.name, field: 'description' }
              ),
              website: safeExtract(
                () => {
                  const href = $el.find('a').attr('href')
                  return href ? (href.startsWith('http') ? href : `${this._config.baseUrl}${href}`) : this._config.baseUrl
                },
                this._config.baseUrl,
                { source: this._config.name, field: 'website' }
              ),
              category: 'government',
              region: 'Poland',
            }

            // Try to extract amount from text content
            const textContent = $el.text()
            if (textContent.includes('zł') || textContent.includes('PLN')) {
              grant.amount = this.parseAmount(textContent)
            }

            // Try to extract deadline
            const deadlineMatch = textContent.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
            if (deadlineMatch) {
              grant.deadline = this.parseDate(deadlineMatch[1])
            }

            // Validate and add grant
            const validation = validateScrapedData(grant, ['title'])
            if (validation.valid && grant.title && grant.title.length > 0) {
              grants.push(this.normalize(grant))
              itemsFound++
            }
          } catch (elementError) {
            scraperLogger.warn({
              source: this._config.name,
              selector,
              error: elementError instanceof Error ? elementError.message : String(elementError)
            }, 'Failed to process grant element')
          }
        })

        // If we found items with this selector, stop trying others
        if (itemsFound > 0) break
      }

      scraperLogger.info({
        source: this._config.name,
        grantsFound: grants.length,
        selectorsTried: grantSelectors.length
      }, 'NIW.gov.pl scraping completed')

    } catch (error) {
      const classified = error instanceof ScraperError ? error :
        new ScraperError(
          `NIW scraping failed: ${error instanceof Error ? error.message : String(error)}`,
          ScraperErrorType.NetworkError,
          true,
          error instanceof Error ? error : undefined
        )

      scraperLogger.error({
        source: this._config.name,
        errorType: classified.type,
        error: classified.message
      }, 'NIW.gov.pl scraper failed')

      throw classified
    }

    return grants
  }
}

/**
 * Malopolska.pl Scraper - Static HTML site with enhanced error handling
 */
export class MalopolskaPlScraper extends RealScraper {
  private circuitBreaker = new CircuitBreaker(3, 300000)
  private rateLimiter = new RateLimiter(1, 1) // 1 request per second

  constructor() {
    super({
      name: 'malopolska',
      baseUrl: 'https://malopolska.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    return await this.circuitBreaker.execute(async () => {
      return await withRetry(
        () => this.performScrape(),
        { source: this._config.name, operation: 'scrape' },
        { maxRetries: 2, baseDelay: 3000 }
      )
    })
  }

  private async performScrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      await this.rateLimiter.acquire()

      const response = await withRetry(
        () => fetch(`${this._config.baseUrl}/dotacje-dla-ngo`, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NGO Grants Aggregator)'
          }
        }),
        { source: this._config.name, operation: 'fetch' },
        { maxRetries: 2, baseDelay: 2000 }
      )

      if (!response.ok) {
        throw new ScraperError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500 ? ScraperErrorType.ServerError : ScraperErrorType.NotFoundError,
          response.status >= 500
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const grantSelectors = [
        '.grant',
        '.dotacja',
        '.funding',
        'article',
        '.news-item',
        '.list-item'
      ]

      let itemsFound = 0
      for (const selector of grantSelectors) {
        $(selector).each((_, el) => {
          try {
            const $el = $(el)

            const grant: Partial<RawGrant> = {
              source: this._config.name,
              title: safeExtract(
                () => $el.find('h2, h3, h4, .title, a').first().text().trim(),
                '',
                { source: this._config.name, field: 'title' }
              ),
              description: safeExtract(
                () => $el.find('.description, .content, p').text().trim(),
                '',
                { source: this._config.name, field: 'description' }
              ),
              website: safeExtract(
                () => {
                  const href = $el.find('a').attr('href')
                  return href ? (href.startsWith('http') ? href : `${this._config.baseUrl}${href}`) : this._config.baseUrl
                },
                this._config.baseUrl,
                { source: this._config.name, field: 'website' }
              ),
              category: 'regional',
              region: 'Lesser Poland',
            }

            const textContent = $el.text()
            if (textContent.includes('zł') || textContent.includes('PLN')) {
              grant.amount = this.parseAmount(textContent)
            }

            const deadlineMatch = textContent.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
            if (deadlineMatch) {
              grant.deadline = this.parseDate(deadlineMatch[1])
            }

            const validation = validateScrapedData(grant, ['title'])
            if (validation.valid && grant.title && grant.title.length > 0) {
              grants.push(this.normalize(grant))
              itemsFound++
            }
          } catch (elementError) {
            scraperLogger.warn({
              source: this._config.name,
              selector,
              error: elementError instanceof Error ? elementError.message : String(elementError)
            }, 'Failed to process grant element')
          }
        })

        if (itemsFound > 0) break
      }

      scraperLogger.info({
        source: this._config.name,
        grantsFound: grants.length,
        selectorsTried: grantSelectors.length
      }, 'Malopolska.pl scraping completed')

    } catch (error) {
      const classified = error instanceof ScraperError ? error :
        new ScraperError(
          `Malopolska scraping failed: ${error instanceof Error ? error.message : String(error)}`,
          ScraperErrorType.NetworkError,
          true,
          error instanceof Error ? error : undefined
        )

      scraperLogger.error({
        source: this._config.name,
        errorType: classified.type,
        error: classified.message
      }, 'Malopolska.pl scraper failed')

      throw classified
    }

    return grants
  }
}

/**
 * NGO.Krakow.pl Scraper - Static HTML site with enhanced error handling
 */
export class KrakowNgoPlScraper extends RealScraper {
  private circuitBreaker = new CircuitBreaker(3, 300000)
  private rateLimiter = new RateLimiter(1, 1) // 1 request per second

  constructor() {
    super({
      name: 'krakow-ngo',
      baseUrl: 'https://ngo.krakow.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    return await this.circuitBreaker.execute(async () => {
      return await withRetry(
        () => this.performScrape(),
        { source: this._config.name, operation: 'scrape' },
        { maxRetries: 2, baseDelay: 3000 }
      )
    })
  }

  private async performScrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      await this.rateLimiter.acquire()

      const response = await withRetry(
        () => fetch(`${this._config.baseUrl}/`, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NGO Grants Aggregator)'
          }
        }),
        { source: this._config.name, operation: 'fetch' },
        { maxRetries: 2, baseDelay: 2000 }
      )

      if (!response.ok) {
        throw new ScraperError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500 ? ScraperErrorType.ServerError : ScraperErrorType.NotFoundError,
          response.status >= 500
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const grantSelectors = [
        '.grant',
        '.dotacja',
        'article',
        '.news-item',
        '.post',
        '.entry'
      ]

      let itemsFound = 0
      for (const selector of grantSelectors) {
        $(selector).each((_, el) => {
          try {
            const $el = $(el)

            const grant: Partial<RawGrant> = {
              source: this._config.name,
              title: safeExtract(
                () => $el.find('h2, h3, .title, .entry-title').text().trim(),
                '',
                { source: this._config.name, field: 'title' }
              ),
              description: safeExtract(
                () => $el.find('.content, .entry-content, p').text().trim(),
                '',
                { source: this._config.name, field: 'description' }
              ),
              website: safeExtract(
                () => {
                  const href = $el.find('a').attr('href')
                  return href ? (href.startsWith('http') ? href : `${this._config.baseUrl}${href}`) : this._config.baseUrl
                },
                this._config.baseUrl,
                { source: this._config.name, field: 'website' }
              ),
              category: 'local',
              region: 'Kraków',
            }

            const textContent = $el.text()
            if (textContent.includes('zł') || textContent.includes('PLN')) {
              grant.amount = this.parseAmount(textContent)
            }

            const deadlineMatch = textContent.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
            if (deadlineMatch) {
              grant.deadline = this.parseDate(deadlineMatch[1])
            }

            const validation = validateScrapedData(grant, ['title'])
            if (validation.valid && grant.title && grant.title.length > 0) {
              grants.push(this.normalize(grant))
              itemsFound++
            }
          } catch (elementError) {
            scraperLogger.warn({
              source: this._config.name,
              selector,
              error: elementError instanceof Error ? elementError.message : String(elementError)
            }, 'Failed to process grant element')
          }
        })

        if (itemsFound > 0) break
      }

      scraperLogger.info({
        source: this._config.name,
        grantsFound: grants.length,
        selectorsTried: grantSelectors.length
      }, 'NGO.Krakow.pl scraping completed')

    } catch (error) {
      const classified = error instanceof ScraperError ? error :
        new ScraperError(
          `Krakow NGO scraping failed: ${error instanceof Error ? error.message : String(error)}`,
          ScraperErrorType.NetworkError,
          true,
          error instanceof Error ? error : undefined
        )

      scraperLogger.error({
        source: this._config.name,
        errorType: classified.type,
        error: classified.message
      }, 'NGO.Krakow.pl scraper failed')

      throw classified
    }

    return grants
  }
}

/**
 * Eurodesk.pl Scraper - Static HTML site with enhanced error handling
 */
export class EurodeskPlScraper extends RealScraper {
  private circuitBreaker = new CircuitBreaker(3, 300000)
  private rateLimiter = new RateLimiter(1, 1) // 1 request per second

  constructor() {
    super({
      name: 'eurodesk',
      baseUrl: 'https://eurodesk.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    return await this.circuitBreaker.execute(async () => {
      return await withRetry(
        () => this.performScrape(),
        { source: this._config.name, operation: 'scrape' },
        { maxRetries: 2, baseDelay: 3000 }
      )
    })
  }

  private async performScrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      await this.rateLimiter.acquire()

      const response = await withRetry(
        () => fetch(`${this._config.baseUrl}/opportunities`, {
          signal: AbortSignal.timeout(10000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NGO Grants Aggregator)'
          }
        }),
        { source: this._config.name, operation: 'fetch' },
        { maxRetries: 2, baseDelay: 2000 }
      )

      if (!response.ok) {
        throw new ScraperError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500 ? ScraperErrorType.ServerError : ScraperErrorType.NotFoundError,
          response.status >= 500
        )
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const grantSelectors = [
        '.opportunity',
        '.grant',
        '.eu-funding',
        'article',
        '.item'
      ]

      let itemsFound = 0
      for (const selector of grantSelectors) {
        $(selector).each((_, el) => {
          try {
            const $el = $(el)

            const grant: Partial<RawGrant> = {
              source: this._config.name,
              title: safeExtract(
                () => $el.find('h2, h3, .title, a').text().trim(),
                '',
                { source: this._config.name, field: 'title' }
              ),
              description: safeExtract(
                () => $el.find('.description, .content, p').text().trim(),
                '',
                { source: this._config.name, field: 'description' }
              ),
              website: safeExtract(
                () => {
                  const href = $el.find('a').attr('href')
                  return href ? (href.startsWith('http') ? href : `${this._config.baseUrl}${href}`) : this._config.baseUrl
                },
                this._config.baseUrl,
                { source: this._config.name, field: 'website' }
              ),
              category: 'european',
              region: 'Europe',
            }

            const textContent = $el.text()
            if (textContent.includes('€') || textContent.includes('EUR')) {
              grant.amount = this.parseAmount(textContent)
            }

            const deadlineMatch = textContent.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
            if (deadlineMatch) {
              grant.deadline = this.parseDate(deadlineMatch[1])
            }

            const validation = validateScrapedData(grant, ['title'])
            if (validation.valid && grant.title && grant.title.length > 0) {
              grants.push(this.normalize(grant))
              itemsFound++
            }
          } catch (elementError) {
            scraperLogger.warn({
              source: this._config.name,
              selector,
              error: elementError instanceof Error ? elementError.message : String(elementError)
            }, 'Failed to process grant element')
          }
        })

        if (itemsFound > 0) break
      }

      scraperLogger.info({
        source: this._config.name,
        grantsFound: grants.length,
        selectorsTried: grantSelectors.length
      }, 'Eurodesk.pl scraping completed')

    } catch (error) {
      const classified = error instanceof ScraperError ? error :
        new ScraperError(
          `Eurodesk scraping failed: ${error instanceof Error ? error.message : String(error)}`,
          ScraperErrorType.NetworkError,
          true,
          error instanceof Error ? error : undefined
        )

      scraperLogger.error({
        source: this._config.name,
        errorType: classified.type,
        error: classified.message
      }, 'Eurodesk.pl scraper failed')

      throw classified
    }

    return grants
  }
}

// Export all scrapers
export const scrapers = [
  new FunduszeNgoScraper(),
  new NiwGovPlScraper(),
  new MalopolskaPlScraper(),
  new KrakowNgoPlScraper(),
  new EurodeskPlScraper(),
  // New scrapers from sources directory
  new WitkacApiScraper(),
  new GovPlPozytekScraper(),
  new NiwGeneratorScraper(),
  new EuFundingTendersScraper(),
  new ActiveCitizensFundScraper(),
  new GrantowoPlScraper(),
  new WarsawNgoScraper(),
  new WroclawNgoScraper(),
  new LodzNgoScraper(),
  new PoznanNgoScraper(),
  new PodkarpackieNgoScraper(),
  new GdanskNgoScraper(),
  new LesznoNgoScraper(),
  new AktywniPlusScraper(),
]