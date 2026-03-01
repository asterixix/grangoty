/**
 * Łódź NGO Scraper
 *
 * Łódź Municipal Government open competitions.
 * Website: https://uml.lodz.pl/decydujemy/wspieramy/ngo/konkursy/
 *
 * Articles are inside `.article-item` wrappers. Each article has two
 * anchor links — one with the full title and one labelled "więcej"
 * (read more). We keep only the title link by filtering out "więcej".
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const BASE_URL = 'https://uml.lodz.pl'

export class LodzNgoScraper {
  source = 'lodz'
  url = `${BASE_URL}/decydujemy/wspieramy/ngo/konkursy/`
  enabled = true
  name = 'Łódź NGO Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(this.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NGOGrantsBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        console.error(`Łódź NGO: HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrants(html)

      console.log(`Łódź NGO: scraped ${grants.length} grants`)
      return grants
    } catch (error) {
      console.error('Łódź NGO scraper error:', error)
      return []
    }
  }

  private parseGrants(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const grants: RawGrant[] = []

    $('a[href*="/aktualnosci/artykul/"]').each((_, el) => {
      const title = $(el).text().trim()
      const href = $(el).attr('href') || ''

      if (!title || title.toLowerCase() === 'więcej') return

      const idMatch = href.match(/id(\d+)/)
      const id = idMatch ? `lodz-${idMatch[1]}` : `lodz-${title.slice(0, 40).replace(/\s+/g, '-')}`

      const deadlineMatch = title.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)

      grants.push({
        id,
        source: this.source,
        title,
        description: '',
        deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
        category: 'local',
        region: 'Łódź',
        website: `${BASE_URL}${href}`,
        tags: ['local', 'lodz'],
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
