import { PlaywrightCrawler, createPlaywrightRouter } from 'crawlee'
import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'
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
 * Fundusze.ngo.pl Scraper - Dynamic JS site
 */
export class FunduszeNgoScraper extends RealScraper {
  constructor() {
    super({
      name: 'fundusze-ngo',
      baseUrl: 'https://fundusze.ngo.pl',
      enabled: true,
      maxRequestsPerCrawl: 50,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    const router = createPlaywrightRouter()

    // Handle grant listing pages
    router.addHandler('grantList', async ({ page, enqueueLinks }) => {

      // Extract grant links
      const grantLinks = await page.$$eval('a[href*="/grant"], a[href*="/fundusz"], a[href*="/dotacja"]', 
        (links) => links.map(link => link.getAttribute('href')).filter(Boolean)
      )

      // Enqueue grant detail pages
      for (const href of grantLinks.slice(0, 20)) {
        if (href) {
          await enqueueLinks({
            urls: [href.startsWith('http') ? href : `${this._config.baseUrl}${href}`],
            label: 'grantDetail',
          })
        }
      }
    })

    // Handle grant detail pages
    router.addHandler('grantDetail', async ({ page, request }) => {
      try {
        await page.waitForSelector('h1, .title, .grant-title', { timeout: 5000 })

        const grant: Partial<RawGrant> = {
          source: this._config.name,
          website: request.url,
        }

        // Extract title
        grant.title = await page.$eval('h1, .grant-title, .title', el => el.textContent?.trim() || '')

        // Extract description
        grant.description = await page.$eval('.description, .content, .grant-description, article', 
          el => el.textContent?.trim() || ''
        )

        // Extract amount
        const amountText = await page.$eval('.amount, .kwota, [class*="amount"]', 
          el => el.textContent?.trim() || ''
        ).catch(() => '')
        grant.amount = this.parseAmount(amountText)

        // Extract deadline
        const deadlineText = await page.$eval('.deadline, [class*="termin"], [class*="date"]', 
          el => el.textContent?.trim() || ''
        ).catch(() => '')
        grant.deadline = this.parseDate(deadlineText)

        // Extract category
        grant.category = await page.$eval('.category, [class*="kategoria"]', 
          el => el.textContent?.trim() || 'general'
        ).catch(() => 'general')

        if (grant.title) {
          grants.push(this.normalize(grant))
        }
      } catch (error) {
        console.error(`Error scraping ${request.url}:`, error)
      }
    })

    try {
      const crawler = new PlaywrightCrawler({
        requestHandler: router,
        maxRequestsPerCrawl: this._config.maxRequestsPerCrawl,
        requestHandlerTimeoutSecs: this._config.requestHandlerTimeoutSecs || 30,
        headless: true,
      })

      await crawler.run([
        { url: `${this._config.baseUrl}/`, label: 'grantList' },
        { url: `${this._config.baseUrl}/dotacje`, label: 'grantList' },
        { url: `${this._config.baseUrl}/fundusze`, label: 'grantList' },
      ])
    } catch (error) {
      console.error('FunduszeNgoScraper error:', error)
    }

    return grants
  }
}

/**
 * NIW.gov.pl Scraper - Static HTML site
 */
export class NiwGovPlScraper extends RealScraper {
  constructor() {
    super({
      name: 'niw',
      baseUrl: 'https://niw.gov.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      // Fetch main grants page
      const response = await fetch(`${this._config.baseUrl}/o-niw/programy-i-fundusze`)
      const html = await response.text()
      const $ = cheerio.load(html)

      // Find grant items
      $('.grant-item, .program-item, .fundusz-item, article, .content-item').each((_, el) => {
        const $el = $(el)
        
        const grant: Partial<RawGrant> = {
          source: this._config.name,
          title: $el.find('h2, h3, .title').text().trim(),
          description: $el.find('.description, .content, p').text().trim(),
          website: $el.find('a').attr('href') || this._config.baseUrl,
          category: 'government',
          region: 'Poland',
        }

        // Try to extract amount
        const amountText = $el.text()
        if (amountText.includes('zł') || amountText.includes('PLN')) {
          grant.amount = this.parseAmount(amountText)
        }

        // Try to extract deadline
        const deadlineMatch = $el.text().match(/termin.*?(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/i)
        if (deadlineMatch) {
          grant.deadline = this.parseDate(deadlineMatch[1])
        }

        if (grant.title) {
          grants.push(this.normalize(grant))
        }
      })
    } catch (error) {
      console.error('NiwGovPlScraper error:', error)
    }

    return grants
  }
}

/**
 * Malopolska.pl Scraper - Static HTML site
 */
export class MalopolskaPlScraper extends RealScraper {
  constructor() {
    super({
      name: 'malopolska',
      baseUrl: 'https://malopolska.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      // Fetch grants/dotacje page
      const response = await fetch(`${this._config.baseUrl}/dotacje-dla-ngo`)
      const html = await response.text()
      const $ = cheerio.load(html)

      // Find grant items
      $('.grant, .dotacja, .funding, article, .news-item, .list-item').each((_, el) => {
        const $el = $(el)
        
        const grant: Partial<RawGrant> = {
          source: this._config.name,
          title: $el.find('h2, h3, h4, .title, a').first().text().trim(),
          description: $el.find('.description, .content, p').text().trim(),
          website: $el.find('a').attr('href') || this._config.baseUrl,
          category: 'regional',
          region: 'Lesser Poland',
        }

        if (grant.title) {
          grants.push(this.normalize(grant))
        }
      })
    } catch (error) {
      console.error('MalopolskaPlScraper error:', error)
    }

    return grants
  }
}

/**
 * NGO.Krakow.pl Scraper - Static HTML site
 */
export class KrakowNgoPlScraper extends RealScraper {
  constructor() {
    super({
      name: 'krakow-ngo',
      baseUrl: 'https://ngo.krakow.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      // Fetch main page
      const response = await fetch(`${this._config.baseUrl}/`)
      const html = await response.text()
      const $ = cheerio.load(html)

      // Find grant/dotacje items
      $('.grant, .dotacja, article, .news-item, .post, .entry').each((_, el) => {
        const $el = $(el)
        
        const grant: Partial<RawGrant> = {
          source: this._config.name,
          title: $el.find('h2, h3, .title, .entry-title').text().trim(),
          description: $el.find('.content, .entry-content, p').text().trim(),
          website: $el.find('a').attr('href') || this._config.baseUrl,
          category: 'local',
          region: 'Kraków',
        }

        if (grant.title) {
          grants.push(this.normalize(grant))
        }
      })
    } catch (error) {
      console.error('KrakowNgoPlScraper error:', error)
    }

    return grants
  }
}

/**
 * Eurodesk.pl Scraper - Static HTML site
 */
export class EurodeskPlScraper extends RealScraper {
  constructor() {
    super({
      name: 'eurodesk',
      baseUrl: 'https://eurodesk.pl',
      enabled: true,
    })
  }

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    try {
      // Fetch opportunities page
      const response = await fetch(`${this._config.baseUrl}/opportunities`)
      const html = await response.text()
      const $ = cheerio.load(html)

      // Find grant/EU funding items
      $('.opportunity, .grant, .eu-funding, article, .item').each((_, el) => {
        const $el = $(el)
        
        const grant: Partial<RawGrant> = {
          source: this._config.name,
          title: $el.find('h2, h3, .title, a').text().trim(),
          description: $el.find('.description, .content, p').text().trim(),
          website: $el.find('a').attr('href') || this._config.baseUrl,
          category: 'european',
          region: 'Europe',
        }

        if (grant.title) {
          grants.push(this.normalize(grant))
        }
      })
    } catch (error) {
      console.error('EurodeskPlScraper error:', error)
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