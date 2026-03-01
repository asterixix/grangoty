/**
 * Gov.pl Pozytek Scraper
 *
 * Official state-level competition board for NGOs.
 * Website: https://www.gov.pl/web/pozytek/aktualne-konkursy-i-nabory
 *
 * Scrapes article links from the main Pozytke page, filtering for
 * competition/grant-related articles by keyword.
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const GRANT_KEYWORDS = /nabor|nabór|konkurs|dotacj|ofert|grant/i
const MAX_GRANTS = 60

export class GovPlPozytekScraper {
  source = 'gov-pl-pozytek'
  url = 'https://www.gov.pl/web/pozytek/aktualne-konkursy-i-nabory'
  enabled = true
  name = 'Gov.pl Pozytek Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(this.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NGOGrantsBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        console.error(`Gov.pl Pozytek: HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrants(html)

      console.log(`Gov.pl Pozytek: scraped ${grants.length} grants`)
      return grants
    } catch (error) {
      console.error('Gov.pl Pozytek scraper error:', error)
      return []
    }
  }

  private parseGrants(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const seen = new Set<string>()
    const grants: RawGrant[] = []

    $('a[href^="/web/pozytek/"]').each((_, el) => {
      if (grants.length >= MAX_GRANTS) return

      const href = $(el).attr('href') || ''
      const title = $(el).text().trim()

      if (!title || !GRANT_KEYWORDS.test(title)) return
      if (seen.has(href)) return

      seen.add(href)

      const slug = href.split('/').pop() || ''
      const deadlineMatch = title.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)

      grants.push({
        id: `gov-pl-pozytek-${slug}`,
        source: this.source,
        title,
        description: '',
        deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
        category: 'government',
        region: 'Poland',
        website: `https://www.gov.pl${href}`,
        tags: ['official', 'government', 'poland'],
        status: 'open',
        scrapedAt: new Date().toISOString(),
      })
    })

    return grants
  }

  private parseDate(dateString: string): string | undefined {
    const match = dateString.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
    if (!match) return undefined
    const [, day, month, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
}
