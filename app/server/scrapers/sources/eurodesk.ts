/**
 * Eurodesk.pl Scraper
 * 
 * Youth-focused EU funding, Erasmus+ related
 * Website: https://eurodesk.pl
 */

import type { RawGrant } from '~/app/types'

export class EurodeskPlScraper {
  source = 'eurodesk'
  url = 'https://eurodesk.pl'
  enabled = false
  name = 'Eurodesk.pl Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Fetch opportunities page
      const response = await fetch(`${this.url}/opportunities`)
      
      if (!response.ok) {
        console.error(`Eurodesk.pl error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const html = await response.text()
      
      // Parse HTML with Cheerio
      const $ = require('cheerio').load(html)
      
      // Find all opportunity items
      $('.opportunity, .grant-item, .eu-funding-item, article').each((_: any, el: any) => {
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
        if (amountText.includes('€') || amountText.includes('EUR')) {
          amount = this.parseAmount(amountText)
        }
        
        const grant: RawGrant = {
          id: `eurodesk-${this.slugify(title)}`,
          source: this.source,
          title: title,
          description: description,
          amount: amount,
          deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
          category: 'youth',
          region: 'Europe',
          website: link ? this.normalizeUrl(link) : undefined,
          tags: ['eu', 'youth', 'erasmus'],
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      })
      
      console.log(`Eurodesk.pl: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('Eurodesk.pl scraper error:', error)
    }
    
    return grants
  }

  /**
   * Parse amount from text
   */
  private parseAmount(text: string): RawGrant['amount'] {
    const clean = text.replace(/\s+/g, '').toLowerCase()
    
    let currency = 'EUR'
    if (clean.includes('pln') || clean.includes('zł')) currency = 'PLN'
    
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
    return `https://eurodesk.pl${url}`
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}