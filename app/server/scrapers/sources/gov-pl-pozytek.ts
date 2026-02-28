/**
 * Gov.pl Pozytek Scraper
 * 
 * Official state-level competition board for NGOs.
 * Website: https://www.gov.pl/web/pozytek/aktualne-konkursy-i-nabory
 * 
 * This scraper handles official government grants and competitions.
 */

import type { RawGrant } from '~/app/types'

export class GovPlPozytekScraper {
  source = 'gov-pl-pozytek'
  url = 'https://www.gov.pl/web/pozytek/aktualne-konkursy-i-nabory'
  enabled = true
  name = 'Gov.pl Pozytek Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Fetch the main page
      const response = await fetch(this.url)
      
      if (!response.ok) {
        console.error(`Gov.pl Pozytek error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const html = await response.text()
      
      // Parse HTML with Cheerio
      const $ = require('cheerio').load(html)
      
      // Find all grant items
      $('.grant-item, .competition-item, .news-item, article').each((_: any, el: any) => {
        const $el = $(el)
        
        const title = $el.find('h2, h3, .title, a').first().text().trim()
        const description = $el.find('.description, .content, p').text().trim()
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
          id: `gov-pl-pozytek-${this.slugify(title)}`,
          source: this.source,
          title: title,
          description: description,
          amount: amount,
          deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
          category: 'government',
          region: 'Poland',
          website: link ? this.normalizeUrl(link) : undefined,
          tags: ['official', 'government'],
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      })
      
      console.log(`Gov.pl Pozytek: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('Gov.pl Pozytek scraper error:', error)
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
    else if (clean.includes('usd') || clean.includes('$')) currency = 'USD'
    
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
    
    // Try ISO format
    const isoMatch = dateString.match(/\d{4}-\d{2}-\d{2}/)
    if (isoMatch) return isoMatch[0]
    
    // Try DD.MM.YYYY
    const euMatch = dateString.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/)
    if (euMatch) {
      const [, day, month, year] = euMatch
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Try DD/MM/YYYY
    const ukMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (ukMatch) {
      const [, day, month, year] = ukMatch
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
    return `https://www.gov.pl${url}`
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}