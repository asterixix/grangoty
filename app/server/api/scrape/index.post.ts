import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { deduplicateGrants, filterValidGrants } from '~/server/utils/deduplicator'
import type { ApiError, ScrapeResult, Grant } from '~/app/types'

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
  const { source } = body || {}

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
      sourcesToScrape = scrapers.filter(s => s.source === source)
      if (sourcesToScrape.length === 0) {
        return {
          message: `Unknown source: ${source}`,
          code: 'UNKNOWN_SOURCE'
        }
      }
    }

    // Scrape each source
    for (const scraper of sourcesToScrape) {
      if (!scraper.enabled) {
        result.failed++
        continue
      }

      try {
        console.log(`[GRANgoTY] Starting scrape for: ${scraper.source}`)
        const rawGrants = await scraper.scrape()
        const validGrants = filterValidGrants(rawGrants)
        const deduplicated = deduplicateGrants(validGrants)

        // Save each grant to Redis
        for (const rawGrant of deduplicated) {
          const grant: Grant = {
            id: rawGrant.id || crypto.randomUUID(),
            source: rawGrant.source,
            title: rawGrant.title || 'Untitled Grant',
            description: rawGrant.description || '',
            amount: typeof rawGrant.amount === 'string' ? undefined : rawGrant.amount,
            deadline: rawGrant.deadline,
            category: rawGrant.category || 'general',
            region: rawGrant.region || 'Poland',
            eligibility: rawGrant.eligibility || [],
            website: rawGrant.website,
            contact: rawGrant.contact,
            tags: rawGrant.tags || [],
            status: rawGrant.status || 'open',
            scrapedAt: rawGrant.scrapedAt || new Date().toISOString(),
            lastVerifiedAt: new Date().toISOString(),
          }

          // Check if grant already exists (by title + source)
          const existingGrants = await grantStorage.getAllGrants()
          const existing = existingGrants.find(g => 
            g.title === grant.title && g.source === grant.source
          )

          if (existing) {
            // Update existing grant
            grant.id = existing.id
            result.updatedGrants++
          } else {
            result.newGrants++
          }

          await grantStorage.saveGrant(grant)
        }

        result.count += deduplicated.length

        // Save scraper status
        await grantStorage.saveScraperStatus(scraper.source, {
          lastRun: new Date().toISOString(),
          count: deduplicated.length,
        })

        console.log(`[GRANgoTY] Scraped ${deduplicated.length} grants from ${scraper.source}`)
      } catch (error) {
        console.error(`[GRANgoTY] Error scraping ${scraper.source}:`, error)
        result.failed++

        // Save error status
        await grantStorage.saveScraperStatus(scraper.source, {
          lastRun: new Date().toISOString(),
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return result
  } catch (error) {
    console.error('[GRANgoTY] Scrape error:', error)
    return {
      message: 'Scraping failed',
      code: 'SCRAPER_ERROR'
    }
  }
})
