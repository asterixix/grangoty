/**
 * Podkarpackie NGO Scraper
 * 
 * Podkarpackie Voivodeship grants portal
 * Website: https://podkarpackie.pl/ngo/dotacje
 */

import type { RawGrant } from '~/types'

export class PodkarpackieNgoScraper {
  source = 'podkarpackie'
  url = 'https://podkarpackie.pl'
  enabled = false
  name = 'Podkarpackie NGO Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Fetch grants page
      const response = await fetch(`${this.url}/ngo/dotacje`)
      
      if (!response.ok) {
        console.error(`Podkarpackie NGO error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const html = await response.text()
      
      // Parse HTML with Cheerio
      const $ = require('cheerio').load(html)
      
      // Find all grant items
      $('.grant-item, .dotacja-item, .news-item, article').each((_: any, el: any) => {
        const $el = $(el)
        
        const title = $el.find('h2, h3, .title, a').first().text().trim()
        const description = $el.find('.description, .content').text().trim()
        const link = $el.find('a').first().attr('href')
        
        if (!title) return
        
        // Extract deadline
        const deadlineText = $el.text()
        const deadlineMatch = deadlineText.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
        
        // Extract amount
        const amountText = $el.text()
        let amount: RawGrant['amount'] = undefined
        if (amountText.includes('zł') || amountText.includes('PLN')) {
          amount = this.parseAmount(amountText)
        }
        
        const grant: RawGrant = {
          id: `podkarpackie-${this.slugify(title)}`,
          source: this.source,
          title: title,
          description: description,
          amount: amount,
          deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
          category: 'regional',
          region: 'Podkarpackie',
          website: link ? this.normalizeUrl(link) : undefined,
          tags: ['regional', 'podkarpackie'],
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      })
      
      console.log(`Podkarpackie NGO: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('Podkarpackie NGO scraper error:', error)
    }
    
    return grants
  }

  /**
   * Parse amount from text
   */
  private parseAmount(text: string): RawGrant['amount'] {
    const clean = text.replace(/\s+/g, '').toLowerCase()
    
    let currency = 'PLN'
    if (clean.includes('eur') || clean.includes('€')) currency = 'EUR'
    
    const numbers = clean.match(/[\d.]+/g)
    if (!numbers) return { currency }
    
    if (numbers.length === 1) {
      const amount = parseFloat(numbers[0])
      return { min: amount, max: amount, currency }
    }
    
    const min = parseFloat(numbers[0])
    const max = parseFloat(numbers[1])
    
    return { min, max, currency }
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateString: string): string | undefined {
    if (!dateString) return undefined
    
    const isoMatch = dateString.match(/\d{4}-\d{2}-\d{2}/)
    if (isoMatch) return isoMatch[0]
    
    const euMatch = dateString.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
    if (euMatch) {
      const [, day, month, year] = euMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return undefined
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url?: string): string | undefined {
    if (!url) return undefined
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `https://podkarpackie.pl${url}`
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}