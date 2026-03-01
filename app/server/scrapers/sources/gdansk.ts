/**
 * Gdańsk BIP Scraper
 *
 * Gdańsk Municipal Government open competitions (BIP portal).
 * Website: https://bip.gdansk.pl/urzad-miejski/konkursy/Konkursy,a,808
 *
 * The side navigation lists all current competitions as anchor links
 * whose href contains "/urzad-miejski/konkursy/". Each link has a
 * <span> child with the full competition title.
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const MAIN_PAGE_SUFFIX = ',a,808'
const EXCLUDED_TITLES = /^(Rozstrzygnięcia konkursów|Archiwum)/i

export class GdanskNgoScraper {
  source = 'gdansk'
  url = 'https://bip.gdansk.pl/urzad-miejski/konkursy/Konkursy,a,808'
  enabled = true
  name = 'Gdańsk BIP Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(this.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NGOGrantsBot/1.0)' },
      })

      if (!response.ok) {
        console.error(`Gdańsk BIP: HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrants(html)

      console.log(`Gdańsk BIP: scraped ${grants.length} grants`)
      return grants
    } catch (error) {
      console.error('Gdańsk BIP scraper error:', error)
      return []
    }
  }

  private parseGrants(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const grants: RawGrant[] = []

    $('a[href*="/urzad-miejski/konkursy/"]').each((_, el) => {
      const href = $(el).attr('href') || ''

      if (href.endsWith(MAIN_PAGE_SUFFIX)) return

      const title = ($(el).find('span').text() || $(el).text()).trim()

      if (!title || EXCLUDED_TITLES.test(title)) return

      const idMatch = href.match(/,a,(\d+)/)
      const id = idMatch ? `gdansk-${idMatch[1]}` : `gdansk-${title.slice(0, 40).replace(/\s+/g, '-')}`

      const website = href.startsWith('http') ? href : `https://bip.gdansk.pl${href}`

      grants.push({
        id,
        source: this.source,
        title,
        description: '',
        category: 'local',
        region: 'Gdańsk',
        website,
        tags: ['local', 'gdansk', 'bip'],
        status: 'open',
        scrapedAt: new Date().toISOString(),
      })
    })

    return grants
  }
}
