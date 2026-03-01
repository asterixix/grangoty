/**
 * Grantowo.pl Scraper — verified HTML structure (2026-03):
 *   <div data-elementor-type="loop-item" class="... e-loop-item e-loop-item-XXXX ...">
 *     <h1 class="elementor-heading-title">
 *       <a href="https://grantowo.pl/slug/">Title</a>
 *     </h1>
 *   </div>
 */

import * as cheerio from 'cheerio'
import type { RawGrant } from '~/app/types'

const BASE_URL = 'https://grantowo.pl'

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
}

export class GrantowoPlScraper {
  source = 'grantowo'
  url = BASE_URL
  enabled = true
  name = 'Grantowo.pl Scraper'

  async scrape(): Promise<RawGrant[]> {
    try {
      const response = await fetch(BASE_URL, {
        headers: REQUEST_HEADERS,
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        console.error(`[grantowo] HTTP ${response.status} from ${BASE_URL}`)
        return []
      }

      const html = await response.text()
      const grants = this.parseGrantList(html)
      console.log(`[grantowo] Scraped ${grants.length} grants`)
      return grants

    } catch (error) {
      console.error('[grantowo] Scraper error:', error)
      return []
    }
  }

  private parseGrantList(html: string): RawGrant[] {
    const $ = cheerio.load(html)
    const grants: RawGrant[] = []

    $('[data-elementor-type="loop-item"]').each((_, el) => {
      const $el = $(el)
      const $link = $el.find('.elementor-heading-title a, h1 a, h2 a').first()
      const title = $link.text().trim()
      const website = $link.attr('href')

      if (!title || !website) return

      const postClasses = ($(el).attr('class') || '').split(' ')
      const postIdClass = postClasses.find(c => /^post-\d+$/.test(c))
      const postId = postIdClass ? postIdClass.replace('post-', '') : String(Date.now())

      const category = this.extractCategoryFromClasses(postClasses, title)

      grants.push({
        id: `grantowo-${postId}`,
        source: this.source,
        title,
        description: '',
        category,
        region: 'Polska',
        website: this.resolveUrl(website),
        tags: [category],
        status: 'open',
        scrapedAt: new Date().toISOString(),
      })
    })

    return grants
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) return url
    return `${BASE_URL}${url}`
  }

  private extractCategoryFromClasses(classes: string[], titleText: string): string {
    const classStr = classes.join(' ').toLowerCase()
    if (classStr.includes('kultura')) return 'culture'
    if (classStr.includes('edukacja')) return 'education'
    if (classStr.includes('mlodzie') || classStr.includes('mlodziez')) return 'youth'
    if (classStr.includes('sport')) return 'sport'
    if (classStr.includes('srodowisko') || classStr.includes('ekolog')) return 'environment'
    if (classStr.includes('zdrowie')) return 'healthcare'

    const lower = titleText.toLowerCase()
    if (lower.includes('kultura')) return 'culture'
    if (lower.includes('edukacja') || lower.includes('szkoł')) return 'education'
    if (lower.includes('sport')) return 'sport'
    if (lower.includes('środowisko') || lower.includes('ekolog')) return 'environment'
    if (lower.includes('zdrowie')) return 'healthcare'
    if (lower.includes('dzieci') || lower.includes('młodzież')) return 'youth'
    if (lower.includes('humanitar')) return 'humanitarian'

    return 'general'
  }
}
