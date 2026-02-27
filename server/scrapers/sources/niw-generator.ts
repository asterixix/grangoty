/**
 * NIW Generator Scraper
 * 
 * National Institute of Freedom (NIW) - Generator system for all competitions:
 * - NOWEFIO
 * - PROO
 * - Korpus Solidarności
 * - Fundusz Młodzieżowy
 * 
 * Website: https://generator.niw.gov.pl/nabory
 */

import type { RawGrant } from '~/app/types'

export class NiwGeneratorScraper {
  source = 'niw-generator'
  url = 'https://generator.niw.gov.pl/nabory'
  enabled = true
  name = 'NIW Generator Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Fetch the main page
      const response = await fetch(this.url)
      
      if (!response.ok) {
        console.error(`NIW Generator error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const html = await response.text()
      
      // Parse HTML with Cheerio
      const $ = require('cheerio').load(html)
      
      // Find all grant/competition items
      $('.grant-item, .competition-item, .nabór-item, article').each((_, el) => {
        const $el = $(el)
        
        const title = $el.find('h2, h3, .title, .grant-title').first().text().trim()
        const description = $el.find('.description, .content, .grant-description').text().trim()
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
        
        // Extract category from context
        const category = this.extractCategory($el.text())
        
        const grant: RawGrant = {
          id: `niw-generator-${this.slugify(title)}`,
          source: this.source,
          title: title,
          description: description,
          amount: amount,
          deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
          category: category,
          region: 'Poland',
          website: link ? this.normalizeUrl(link) : undefined,
          tags: ['government', 'niw', category],
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      })
      
      console.log(`NIW Generator: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('NIW Generator scraper error:', error)
    }
    
    return grants
  }

  /**
   * Extract category from text
   */
  private extractCategory(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('nowefio')) return 'nowefio'
    if (lower.includes('proo')) return 'proo'
    if (lower.includes('korpus') || lower.includes('solidarności')) return 'solidarnosc'
    if (lower.includes('młodzieżowy') || lower.includes('mlodziezowy')) return 'youth'
    if (lower.includes('kultura')) return 'culture'
    if (lower.includes('edukacja')) return 'education'
    if (lower.includes('społeczny') || lower.includes('spoleczny')) return 'social'
    if (lower.includes('zdrowie')) return 'healthcare'
    if (lower.includes('środowisko') || lower.includes('srodowisko')) return 'environment'
    
    return 'general'
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
    return `https://generator.niw.gov.pl${url}`
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}