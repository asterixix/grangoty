/**
 * Gdańsk BIP Scraper
 *
 * Gdańsk Municipal Government open competitions (BIP portal).
 * Website: https://bip.gdansk.pl/urzad-miejski/konkursy/Konkursy,a,808
 *
 * Competition links on the BIP portal use absolute URLs
 * (https://bip.gdansk.pl/urzad-miejski/konkursy/...) and have a <span>
 * child containing the full competition title.
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const LISTING_URL = 'https://bip.gdansk.pl/urzad-miejski/konkursy/Konkursy,a,808'
const MAIN_PAGE_SUFFIX = ',a,808'
const EXCLUDED_TITLES = /^(Rozstrzygnięcia konkursów|Archiwum konkursów|Konkursy i wyniki)/i
const RESULTS_KEYWORDS = /^(Rozstrzygnięcie|Wyniki|Ostateczne wyniki|Wyniki oceny|Prezydent.*ogłasza wyniki|Zmiana dotacji|Uniewaz|Powołanie Zespołu|19a\s)/i
const MAX_GRANTS = 50

export class GdanskNgoScraper {
  source = 'gdansk'
  url = LISTING_URL
  enabled = true
  name = 'Gdańsk BIP Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(this.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NGOGrantsBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        console.error(`Gdańsk BIP: HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrants(html)

      console.log(`[gdansk] Scraped ${grants.length} grants`)
      return grants
    } catch (error) {
      console.error('[gdansk] Scraper error:', error)
      return []
    }
  }

  private parseGrants(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const grants: RawGrant[] = []
    const seen = new Set<string>()

    // Competition links on BIP Gdańsk use absolute URLs
    $('a[href*="bip.gdansk.pl/urzad-miejski/konkursy/"]').each((_, el) => {
      if (grants.length >= MAX_GRANTS) return

      const href = $(el).attr('href') || ''

      if (href.endsWith(MAIN_PAGE_SUFFIX)) return

      const title = ($(el).find('span').text() || $(el).text()).trim()

      if (!title) return
      if (EXCLUDED_TITLES.test(title)) return
      if (RESULTS_KEYWORDS.test(title)) return
      if (seen.has(href)) return

      seen.add(href)

      const idMatch = href.match(/,a,(\d+)/)
      const id = idMatch
        ? `gdansk-${idMatch[1]}`
        : `gdansk-${title.slice(0, 40).replace(/\s+/g, '-')}`

      grants.push({
        id,
        source: this.source,
        title,
        description: '',
        category: 'local',
        region: 'Gdańsk',
        website: href.startsWith('http') ? href : `https://bip.gdansk.pl${href}`,
        tags: ['local', 'gdansk', 'bip'],
        status: 'open',
        scrapedAt: new Date().toISOString(),
      })
    })

    return grants
  }
}
