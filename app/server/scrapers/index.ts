import { StaticHtmlScraper } from './base-scraper'
import type { RawGrant } from '~/app/types'

/**
 * Scraper for fundusze.ngo.pl
 * Uses Playwright for dynamic content
 */
export class FunduszeNgoScraper extends StaticHtmlScraper {
  source = 'fundusze-ngo'
  url = 'https://fundusze.ngo.pl'
  enabled = true

  async scrape(): Promise<RawGrant[]> {
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
  source = 'niw'
  url = 'https://niw.gov.pl'
  enabled = true

  async scrape(): Promise<RawGrant[]> {
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
  source = 'malopolska'
  url = 'https://malopolska.pl'
  enabled = true

  async scrape(): Promise<RawGrant[]> {
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
  source = 'krakow-ngo'
  url = 'https://ngo.krakow.pl'
  enabled = true

  async scrape(): Promise<RawGrant[]> {
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
  source = 'eurodesk'
  url = 'https://eurodesk.pl'
  enabled = true

  async scrape(): Promise<RawGrant[]> {
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