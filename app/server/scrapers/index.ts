import { StaticHtmlScraper } from './base-scraper'
import type { RawGrant } from '~/types'

/**
 * Scraper for fundusze.ngo.pl
 * Uses Playwright for dynamic content
 */
export class FunduszeNgoScraper extends StaticHtmlScraper {
  override source = 'fundusze-ngo'
  override url = 'https://fundusze.ngo.pl'
  override enabled = true

  override async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    // Note: This site uses JavaScript heavily
    // In production, we would use Crawlee with Playwright
    // For now, we'll return an empty array and log the approach

    console.log('FunduszeNgoScraper: Dynamic scraping required - implement with Crawlee Playwright')

    return grants
  }
}

/**
 * Scraper for niw.gov.pl
 * Static HTML site
 */
export class NiwGovPlScraper extends StaticHtmlScraper {
  override source = 'niw'
  override url = 'https://niw.gov.pl'
  override enabled = true

  override async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    await this.load(this.url)

    // Example selector patterns - adjust based on actual site structure
    const grantItems = this.extractAllText(this.getHtml(), '.grant-item, .grant-card, .grant-list-item')

    for (const item of grantItems) {
      const raw: RawGrant = {
        source: this.source,
        title: item,
        description: item,
        category: 'general',
        region: 'Poland',
        status: 'open'
      }
      grants.push(this.normalize(raw))
    }

    return grants
  }
}

/**
 * Scraper for malopolska.pl
 * Static HTML site
 */
export class MalopolskaPlScraper extends StaticHtmlScraper {
  override source = 'malopolska'
  override url = 'https://malopolska.pl'
  override enabled = true

  override async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    await this.load(this.url)

    // Example selector patterns
    const grantItems = this.extractAllText(this.getHtml(), '.grant, .funding, .opportunity')

    for (const item of grantItems) {
      const raw: RawGrant = {
        source: this.source,
        title: item,
        description: item,
        category: 'regional',
        region: 'Lesser Poland',
        status: 'open'
      }
      grants.push(this.normalize(raw))
    }

    return grants
  }
}

/**
 * Scraper for ngo.krakow.pl
 * Static HTML site
 */
export class KrakowNgoPlScraper extends StaticHtmlScraper {
  override source = 'krakow-ngo'
  override url = 'https://ngo.krakow.pl'
  override enabled = true

  override async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    await this.load(this.url)

    // Example selector patterns
    const grantItems = this.extractAllText(this.getHtml(), '.grant, .opportunity, .funding')

    for (const item of grantItems) {
      const raw: RawGrant = {
        source: this.source,
        title: item,
        description: item,
        category: 'local',
        region: 'Kraków',
        status: 'open'
      }
      grants.push(this.normalize(raw))
    }

    return grants
  }
}

/**
 * Scraper for eurodesk.pl
 * Static HTML site
 */
export class EurodeskPlScraper extends StaticHtmlScraper {
  override source = 'eurodesk'
  override url = 'https://eurodesk.pl'
  override enabled = true

  override async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []

    await this.load(this.url)

    // Example selector patterns
    const grantItems = this.extractAllText(this.getHtml(), '.grant, .opportunity, .eu-funding')

    for (const item of grantItems) {
      const raw: RawGrant = {
        source: this.source,
        title: item,
        description: item,
        category: 'european',
        region: 'Europe',
        status: 'open'
      }
      grants.push(this.normalize(raw))
    }

    return grants
  }
}

// Export all scrapers
export const scrapers = [
  FunduszeNgoScraper,
  NiwGovPlScraper,
  MalopolskaPlScraper,
  KrakowNgoPlScraper,
  EurodeskPlScraper
]