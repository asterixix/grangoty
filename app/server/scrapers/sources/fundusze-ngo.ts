/**
 * Fundusze.ngo.pl Scraper — verified HTML structure (2026-03):
 *   <li class="w-100 bb b--light-gray pv3">
 *     <h4><a href="https://fundusze.ngo.pl/XXXXXX-slug.html">Title</a></h4>
 *     <div class="lh-title f7 mid-gray">Cała Polska</div>   ← location
 *     <time datetime="YYYY-MM-DD">DD.MM.YYYY</time>          ← deadline
 *     <div>Łączny budżet X mln PLN</div>                    ← budget
 *     <div>Organizator konkursu name</div>                   ← last .lh-title.f7
 *   </li>
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const BASE_URL = 'https://fundusze.ngo.pl'
const LISTING_URL = `${BASE_URL}/aktualne`

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
}

export class FunduszeNgoScraper {
  source = 'fundusze-ngo'
  url = LISTING_URL
  enabled = true
  name = 'Fundusze.ngo.pl Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(LISTING_URL, { headers: REQUEST_HEADERS })

      if (!response.ok) {
        console.error(`[fundusze-ngo] HTTP ${response.status} from ${LISTING_URL}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrantList(html)
      console.log(`[fundusze-ngo] Scraped ${grants.length} grants`)
      return grants

    } catch (error) {
      console.error('[fundusze-ngo] Scraper error:', error)
      return []
    }
  }

  private parseGrantList(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const grants: RawGrant[] = []

    $('li.bb').each((_, el) => {
      const $el = $(el)
      const $link = $el.find('h4 a').first()
      const title = $link.text().trim()
      const website = $link.attr('href')

      if (!title || !website) return

      const deadline = $el.find('time').attr('datetime') || undefined
      const location = $el.find('.lh-title.f7.mid-gray').first().text().trim()
      const allText = $el.text()
      const organizer = $el.find('.lh-title.f7').last().text().trim()

      grants.push({
        id: this.buildId(website),
        source: this.source,
        title,
        description: organizer || '',
        amount: this.parseAmountFromText(allText),
        deadline,
        category: this.extractCategory(allText),
        region: this.parseRegion(location),
        website: this.resolveUrl(website),
        tags: [this.extractCategory(allText)],
        status: 'open',
        scrapedAt: new Date().toISOString(),
      })
    })

    return grants
  }

  private buildId(url: string): string {
    const match = url.match(/\/(\d+)-/)
    return match ? `fundusze-ngo-${match[1]}` : `fundusze-ngo-${Date.now()}`
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) return url
    return `${BASE_URL}${url}`
  }

  private parseRegion(location: string): string {
    if (!location) return 'Polska'
    const lower = location.toLowerCase()
    if (lower.includes('cała polska') || lower.includes('ogólnopolski')) return 'Polska'
    return location
  }

  private parseAmountFromText(text: string): RawGrant['amount'] | undefined {
    const budgetMatch = text.match(/budżet\s+([\d,. ]+)\s*(mln|tys)?/i)
    if (budgetMatch) {
      const raw = parseFloat(budgetMatch[1].replace(/\s/g, '').replace(',', '.'))
      const multiplier = budgetMatch[2]?.toLowerCase() === 'mln' ? 1_000_000
        : budgetMatch[2]?.toLowerCase() === 'tys' ? 1_000
        : 1
      return { max: raw * multiplier, currency: 'PLN' }
    }

    const rangeMatch = text.match(/od\s+([\d ]+)\s*do\s+([\d ]+)\s*tys/i)
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1].replace(/\s/g, '')) * 1_000,
        max: parseInt(rangeMatch[2].replace(/\s/g, '')) * 1_000,
        currency: 'PLN',
      }
    }

    return undefined
  }

  private extractCategory(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('kultura')) return 'culture'
    if (lower.includes('edukacja')) return 'education'
    if (lower.includes('społeczn') || lower.includes('polityka społeczna')) return 'social'
    if (lower.includes('zdrowie')) return 'healthcare'
    if (lower.includes('środowisko') || lower.includes('ekolog')) return 'environment'
    if (lower.includes('dzieci') || lower.includes('młodzież')) return 'youth'
    if (lower.includes('badania') || lower.includes('nauka')) return 'research'
    if (lower.includes('sport')) return 'sport'
    if (lower.includes('humanitar')) return 'humanitarian'
    if (lower.includes('finans') || lower.includes('wzmacnianie')) return 'capacity-building'
    return 'general'
  }
}
