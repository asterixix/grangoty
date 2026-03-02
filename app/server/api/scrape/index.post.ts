import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { deduplicateGrants, filterValidGrants } from '~/server/utils/deduplicator'
import { scraperLogger } from '~/server/utils/logger'
import { withRetry, classifyScraperError } from '~/server/utils/scraper-helpers'
import type { ApiError, ScrapeResult, Grant } from '~/types'

export default defineEventHandler(async (event): Promise<ScrapeResult | ApiError> => {
  const requestStart = performance.now()
  
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return {
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }
  }

  const body = await readBody(event)
  const { source, dryRun = false } = body || {}

  const result: ScrapeResult = {
    source: source || 'all',
    count: 0,
    newGrants: 0,
    updatedGrants: 0,
    failed: 0,
    errors: [],
    timestamp: new Date().toISOString()
  }

  scraperLogger.info({
    requestedSource: source || 'all',
    dryRun,
    availableScrapers: scrapers.length
  }, 'Scrape job started')

  try {
    let sourcesToScrape = scrapers

    if (source) {
      sourcesToScrape = scrapers.filter(s => s.source === source)
      if (sourcesToScrape.length === 0) {
        scraperLogger.warn({ requestedSource: source }, 'Unknown scraper source requested')
        return {
          message: `Unknown source: ${source}`,
          code: 'UNKNOWN_SOURCE'
        }
      }
    }

    for (const scraper of sourcesToScrape) {
      if (!scraper.enabled) {
        scraperLogger.info({ source: scraper.source }, 'Scraper disabled, skipping')
        result.failed++
        continue
      }

      const scrapeStart = performance.now()
      
      try {
        scraperLogger.info({ source: scraper.source }, 'Starting scraper')
        
        const rawGrants = await withRetry(
          () => scraper.scrape(),
          { source: scraper.source, operation: 'scrape' },
          { maxRetries: 2, baseDelay: 2000 }
        )
        
        const scrapeDuration = Math.round(performance.now() - scrapeStart)
        
        const validGrants = filterValidGrants(rawGrants)
        const deduplicated = deduplicateGrants(validGrants)

        scraperLogger.info({
          source: scraper.source,
          rawCount: rawGrants.length,
          validCount: validGrants.length,
          dedupedCount: deduplicated.length,
          durationMs: scrapeDuration
        }, 'Scraper completed')

        if (!dryRun) {
          for (const rawGrant of deduplicated) {
            try {
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

              const existingGrants = await grantStorage.getAllGrants()
              const existing = existingGrants.find(g => 
                g.title === grant.title && g.source === grant.source
              )

              if (existing) {
                grant.id = existing.id
                result.updatedGrants++
              } else {
                result.newGrants++
              }

              await grantStorage.saveGrant(grant)
            } catch (saveError) {
              scraperLogger.error({
                source: scraper.source,
                grantTitle: rawGrant.title,
                error: saveError instanceof Error ? saveError.message : 'Unknown error'
              }, 'Failed to save grant')
            }
          }
        }

        result.count += deduplicated.length

        await grantStorage.saveScraperStatus(scraper.source, {
          lastRun: new Date().toISOString(),
          count: deduplicated.length,
        })

      } catch (error) {
        const classified = classifyScraperError(error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        scraperLogger.error({
          source: scraper.source,
          errorType: classified.type,
          recoverable: classified.recoverable,
          error: errorMessage,
          durationMs: Math.round(performance.now() - scrapeStart)
        }, 'Scraper failed')

        result.failed++
        result.errors?.push({
          source: scraper.source,
          type: classified.type,
          message: errorMessage
        })

        await grantStorage.saveScraperStatus(scraper.source, {
          lastRun: new Date().toISOString(),
          count: 0,
          error: errorMessage,
        })
      }
    }

    const totalDuration = Math.round(performance.now() - requestStart)
    
    scraperLogger.info({
      totalCount: result.count,
      newGrants: result.newGrants,
      updatedGrants: result.updatedGrants,
      failed: result.failed,
      durationMs: totalDuration
    }, 'Scrape job completed')

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Scraping failed'
    
    scraperLogger.error({
      error: errorMessage,
      durationMs: Math.round(performance.now() - requestStart)
    }, 'Scrape job failed')
    
    return {
      message: errorMessage,
      code: 'SCRAPER_ERROR'
    }
  }
})
