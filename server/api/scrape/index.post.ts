import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { deduplicateGrants, filterValidGrants } from '~/server/utils/deduplicator'
import type { ApiError, ScrapeResult } from '~/app/types'

// Import scrapers
import { scrapers } from '~/server/scrapers'

export default defineEventHandler(async (event): Promise<ScrapeResult | ApiError> => {
  // Only allow POST
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return {
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }
  }

  const body = await readBody(event)
  const { source } = body

  const result: ScrapeResult = {
    source: source || 'all',
    count: 0,
    newGrants: 0,
    updatedGrants: 0,
    failed: 0,
    timestamp: new Date().toISOString()
  }

  try {
    let sourcesToScrape = scrapers

    // If specific source requested, filter
    if (source) {
      sourcesToScrape = scrapers.filter(s => s.name === source)
      if (sourcesToScrape.length === 0) {
        return {
          message: `Unknown source: ${source}`,
          code: 'UNKNOWN_SOURCE'
        }
      }
    }

    // Scrape each source
    for (const ScraperClass of sourcesToScrape) {
      const scraper = new ScraperClass()

      if (!scraper.enabled) {
        result.failed++
        continue
      }

      try {
        const grants = await scraper.scrape()
        const validGrants = filterValidGrants(grants)
        const deduplicated = deduplicateGrants(validGrants)

        result.count += grants.length
        result.newGrants += deduplicated.length

        // In production, save to database here
        console.log(`Scraped ${deduplicated.length} grants from ${scraper.source}`)
      } catch (error) {
        console.error(`Error scraping ${scraper.source}:`, error)
        result.failed++
      }
    }

    return result
  } catch (error) {
    console.error('Scrape error:', error)
    return {
      message: 'Scraping failed',
      code: 'SCRAPER_ERROR'
    }
  }
})