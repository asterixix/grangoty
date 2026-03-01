import { defineEventHandler } from 'h3'
import { getRedisClient, REDIS_KEYS } from '~/server/utils/redis'
import { runAllScrapers } from '~/server/scrapers/sources'
import { deduplicateGrants, validateGrant } from '~/server/scrapers/base-scraper'
import type { Grant } from '~/app/types'

async function runScrapeAndStore(): Promise<{ saved: number; failed: number; scraped: number }> {
  const t0 = Date.now()
  console.log('[Cron] Scrape job started')

  const rawGrants = await runAllScrapers()
  const t1 = Date.now()
  console.log(`[Cron] Scraped ${rawGrants.length} raw grants in ${t1 - t0}ms`)

  const validGrants = deduplicateGrants(rawGrants).filter(validateGrant)
  console.log(`[Cron] ${validGrants.length} valid unique grants after deduplication`)

  if (validGrants.length === 0) {
    console.warn('[Cron] No valid grants to save — aborting')
    return { saved: 0, failed: 0, scraped: 0 }
  }

  const grantsToSave: Grant[] = validGrants.map(raw => ({
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
  }))

  // Single mega-pipeline: all grants' Redis writes in one HTTP request to Upstash
  const redis = getRedisClient()
  const pipeline = redis.pipeline()

  for (const grant of grantsToSave) {
    pipeline.set(REDIS_KEYS.GRANT_BY_ID(grant.id), JSON.stringify(grant))
    pipeline.sadd(REDIS_KEYS.GRANTS_LIST, grant.id)
    pipeline.sadd(REDIS_KEYS.GRANTS_BY_SOURCE(grant.source), grant.id)
    if (grant.category) pipeline.sadd(REDIS_KEYS.GRANTS_BY_CATEGORY(grant.category), grant.id)
    if (grant.region) pipeline.sadd(REDIS_KEYS.GRANTS_BY_REGION(grant.region), grant.id)
  }

  let saved = 0
  let failed = 0

  try {
    await pipeline.exec()
    saved = grantsToSave.length
  } catch (err) {
    console.error('[Cron] Pipeline exec failed:', err)
    failed = grantsToSave.length
  }

  const t2 = Date.now()
  console.log(`[Cron] Redis pipeline done in ${t2 - t1}ms`)
  console.log(`[Cron] Done: saved=${saved}, failed=${failed}, total_ms=${t2 - t0}`)
  return { saved, failed, scraped: rawGrants.length }
}

export default defineEventHandler(async (_event) => {
  const stats = await runScrapeAndStore()
  return { status: 'ok', ...stats }
})
