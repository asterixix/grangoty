/**
 * EU Funding Tenders Scraper
 * 
 * Official EU Funding & Tenders Portal - RSS feed for Poland
 * Website: https://ec.europa.eu/info/funding-tenders/opportunities
 * 
 * This scraper fetches EU funding opportunities available to Polish NGOs.
 */

import type { RawGrant } from '~/types'

export class EuFundingTendersScraper {
  source = 'eu-funding-tenders'
  url = 'https://ec.europa.eu/info/funding-tenders/opportunities/data/api/search/opportunities.json'
  enabled = false
  name = 'EU Funding Tenders Scraper'

  async scrape(): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      // Build API URL with Poland filter
      const apiUrl = `${this.url}?programmePeriod=2021-2027&startDateFilter=&endDateFilter=&keywords=&sortBy=startDate&orderBy=DESC&countryCode=PL`
      
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        console.error(`EU Funding Tenders error: ${response.status} ${response.statusText}`)
        return []
      }
      
      const data = await response.json()
      
      // Process each opportunity
      const opportunities = data.opportunities || data.results || []
      
      for (const opportunity of opportunities) {
        const grant: RawGrant = {
          id: `eu-${opportunity.id || this.slugify(opportunity.title)}`,
          source: this.source,
          title: opportunity.title || opportunity.name,
          description: opportunity.abstract || opportunity.description || '',
          amount: this.parseAmount(opportunity.budget),
          deadline: this.parseDate(opportunity.deadline),
          category: this.extractCategory(opportunity),
          region: 'Europe',
          website: opportunity.url || opportunity.link,
          contact: {
            email: opportunity.contactEmail,
            phone: opportunity.contactPhone,
          },
          tags: [
            opportunity.programme,
            opportunity.call,
            opportunity.fundingType,
            opportunity.theme,
          ].filter(Boolean),
          status: 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      }
      
      console.log(`EU Funding Tenders: Scraped ${grants.length} grants`)
      
    } catch (error) {
      console.error('EU Funding Tenders scraper error:', error)
    }
    
    return grants
  }

  /**
   * Parse amount from budget information
   */
  private parseAmount(budget: any): RawGrant['amount'] {
    if (!budget) return undefined
    
    // Handle different budget formats
    if (typeof budget === 'string') {
      return this.parseAmountFromString(budget)
    }
    
    if (typeof budget === 'object') {
      const min = budget.min || budget.minAmount
      const max = budget.max || budget.maxAmount
      
      if (min !== undefined && max !== undefined) {
        return {
          min: typeof min === 'string' ? parseFloat(min) : min,
          max: typeof max === 'string' ? parseFloat(max) : max,
          currency: 'EUR',
        }
      }
      
      if (min !== undefined) {
        return {
          min: typeof min === 'string' ? parseFloat(min) : min,
          max: typeof min === 'string' ? parseFloat(min) : min,
          currency: 'EUR',
        }
      }
    }
    
    return undefined
  }

  /**
   * Parse amount from string
   */
  private parseAmountFromString(text: string): RawGrant['amount'] {
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
   * Extract category from opportunity
   */
  private extractCategory(opportunity: any): string {
    const programme = (opportunity.programme || '').toLowerCase()
    const theme = (opportunity.theme || '').toLowerCase()
    const call = (opportunity.call || '').toLowerCase()
    void call
    
    if (programme.includes('erasmus')) return 'erasmus'
    if (programme.includes('horizon')) return 'research'
    if (programme.includes('creative') || theme.includes('culture')) return 'culture'
    if (programme.includes('youth') || theme.includes('youth')) return 'youth'
    if (programme.includes('social') || theme.includes('social')) return 'social'
    if (programme.includes('health') || theme.includes('health')) return 'healthcare'
    if (programme.includes('environment') || theme.includes('environment')) return 'environment'
    if (programme.includes('education') || theme.includes('education')) return 'education'
    if (programme.includes('research') || theme.includes('research')) return 'research'
    
    return 'european'
  }

  /**
   * Create slug from title
   */
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }
}