/**
 * Active Citizens Fund Scraper
 * 
 * Active Citizens Fund (ACF) - EEA/Norway Grants for civil society organizations
 * Website: https://activecitizensfund.pl
 * 
 * This scraper handles EEA and Norway Grants funding opportunities.
 */

import type { RawGrant } from '~/app/types'

export class ActiveCitizensFundScraper {
  source = 'active-citizens-fund'
  url = 'https://activecitizensfund.pl'
  enabled = true
  name = 'Active Citizens Fund Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Fetch the main page
      const response = await fetch(this.url)
      
      if (!response.ok) {
        console.error(`Active Citizens Fund error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const html = await response.text()
      
      // Parse HTML with Cheerio
      const $ = require('cheerio').load(html)
      
      // Find all grant/competition items
      $('.grant-item, .opportunity-item, .funding-item, article').each((_: any, el: any) => {
        const $el = $(el)
        
        const title = $el.find('h2, h3, .title, .grant-title, a').first().text().trim()
        const description = $el.find('.description, .content, .grant-description').text().trim()
        const link = $el.find('a').first().attr('href')
        
        if (!title) return
        
        // Extract deadline
        const deadlineText = $el.text()
        const deadlineMatch = deadlineText.match(/(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4})/)
        
        // Extract amount
        const amountText = $el.text()
        let amount: RawGrant['amount'] = undefined
        if (amountText.includes('zł') || amountText.includes('PLN') || amountText.includes('€')) {
          amount = this.parseAmount(amountText)
        }
        
        // Extract category
        const category = this.extractCategory($el.text())
        
        const grant: RawGrant = {
          id: `acf-${this.slugify(title)}`,
          source: this.source,
          title: title,
          description: description,
          amount: amount,
          deadline: deadlineMatch ? this.parseDate(deadlineMatch[1]) : undefined,
          category: category,
          region: 'Europe',
          website: link ? this.normalizeUrl(link) : undefined,
          tags: ['eea', 'norway', 'acf', category],
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      })
      
      console.log(`Active Citizens Fund: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('Active Citizens Fund scraper error:', error)
    }
    
    return grants
  }

  /**
   * Extract category from text
   */
  private extractCategory(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('społeczny') || lower.includes('spoleczny')) return 'social'
    if (lower.includes('kultura')) return 'culture'
    if (lower.includes('edukacja')) return 'education'
    if (lower.includes('zdrowie')) return 'healthcare'
    if (lower.includes('środowisko') || lower.includes('srodowisko')) return 'environment'
    if (lower.includes('dzieci') || lower.includes('młodzież') || lower.includes('mlodziez')) return 'youth'
    if (lower.includes('badania') || lower.includes('nauka')) return 'research'
    
    return 'general'
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
    return `https://activecitizensfund.pl${url}`
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}