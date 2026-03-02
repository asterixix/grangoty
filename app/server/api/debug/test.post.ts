import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { scraperLogger } from '~/server/utils/logger'
import type { ScraperTestResult } from '~/types'

/**
 * Test scraper API - safely test individual scrapers without affecting production data
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return {
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    }
  }

  const body = await readBody(event)
  const { source, dryRun = true } = body || {}

  if (!source) {
    setResponseStatus(event, 400)
    return {
      message: 'Source parameter is required',
      code: 'MISSING_SOURCE'
    }
  }

  const scraper = scrapers.find(s => s.source === source)
  if (!scraper) {
    setResponseStatus(event, 404)
    return {
      message: `Scraper not found: ${source}`,
      code: 'SCRAPER_NOT_FOUND'
    }
  }

  if (!scraper.enabled) {
    setResponseStatus(event, 400)
    return {
      message: `Scraper is disabled: ${source}`,
      code: 'SCRAPER_DISABLED'
    }
  }

  const result: ScraperTestResult = {
    source,
    timestamp: new Date().toISOString(),
    dryRun,
    success: false,
    grants: [],
    errors: [],
    metadata: {
      duration: 0,
      requestCount: 0,
      bytesProcessed: 0
    }
  }

  const startTime = performance.now()

  try {
    scraperLogger.info({
      source,
      dryRun,
      testMode: true
    }, 'Starting scraper test')

    // Test the scraper
    const rawGrants = await scraper.scrape()

    const duration = Math.round(performance.now() - startTime)

    result.success = true
    result.grants = rawGrants.map(grant => ({
      id: grant.id || 'test-id',
      title: grant.title || 'Untitled',
      description: grant.description || '',
      source: grant.source,
      scrapedAt: grant.scrapedAt || new Date().toISOString()
    }))

    result.metadata = {
      duration,
      requestCount: 1, // Simplified for test
      bytesProcessed: JSON.stringify(rawGrants).length
    }

    scraperLogger.info({
      source,
      grantCount: rawGrants.length,
      duration,
      success: true
    }, 'Scraper test completed successfully')

  } catch (error) {
    const duration = Math.round(performance.now() - startTime)

    result.metadata.duration = duration
    result.errors?.push({
      type: 'SCRAPER_ERROR',
      message: error instanceof Error ? error.message : String(error),
      recoverable: false,
      timestamp: new Date().toISOString()
    })

    scraperLogger.error({
      source,
      error: error instanceof Error ? error.message : String(error),
      duration,
      success: false
    }, 'Scraper test failed')

    setResponseStatus(event, 500)
  }

  return result
})