import { defineEventHandler } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { runAllScrapers } from '~/server/scrapers/sources'
import { deduplicateGrants, validateGrant } from '~/server/scrapers/base-scraper'
import type { ScrapeResult, Grant } from '~/app/types'

export default defineEventHandler(async (): Promise<ScrapeResult> => {
  const requestStart = performance.now()

  const result: ScrapeResult = {
    source: 'cron-scrape',
    count: 0,
    newGrants: 0,
    updatedGrants: 0,
    failed: 0,
    errors: [],
    timestamp: new Date().toISOString()
  }

  console.log('[Cron] Scrape job started')

  try {
    // Run all enabled scrapers
    const rawGrants = await runAllScrapers()
    console.log(`[Cron] Scraped ${rawGrants.length} raw grants total`)

    // Deduplicate and validate
    const validGrants = deduplicateGrants(rawGrants).filter(validateGrant)
    console.log(`[Cron] ${validGrants.length} valid unique grants after deduplication`)

    // Get existing grant IDs to track new vs updated
    const existingGrants = await grantStorage.getAllGrants()
    const existingIds = new Set(existingGrants.map(g => g.id))

    for (const raw of validGrants) {
      try {
        // Build a full Grant from RawGrant
        const grant: Grant = {
          id: raw.id || `${raw.source}-${Buffer.from(raw.title || '').toString('base64').slice(0, 16)}-${Date.now()}`,
          source: raw.source,
          title: raw.title || 'Untitled',
          description: raw.description || '',
          amount: typeof raw.amount === 'object' ? raw.amount : undefined,
          deadline: raw.deadline,
          category: raw.category || 'other',
          region: raw.region || 'national',
          eligibility: raw.eligibility || [],
          website: raw.website,
          contact: raw.contact,
          tags: raw.tags || [],
          status: raw.status || 'open',
          scrapedAt: raw.scrapedAt || new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString(),
        }

        await grantStorage.saveGrant(grant)

        if (existingIds.has(grant.id)) {
          result.updatedGrants++
        } else {
          result.newGrants++
        }
        result.count++
      } catch (error) {
        console.error('[Cron] Failed to save grant:', raw.title, error)
        result.failed++
        result.errors?.push({
          source: raw.source || 'unknown',
          type: 'system',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const totalDuration = Math.round(performance.now() - requestStart)
    console.log(`[Cron] Scrape job completed: ${result.newGrants} new, ${result.updatedGrants} updated, ${result.failed} failed — ${totalDuration}ms`)

    return result
  } catch (error) {
    console.error('[Cron] Scrape job failed:', error)
    result.failed = 1
    result.errors?.push({
      source: 'cron-scrape',
      type: 'system',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return result
  }
})
