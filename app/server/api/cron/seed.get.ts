import { defineEventHandler } from 'h3'
import { getRedisClient, REDIS_KEYS } from '~/server/utils/redis'
import { runAllScrapers } from '~/server/scrapers/sources'
import { deduplicateGrants, validateGrant } from '~/server/scrapers/base-scraper'
import type { Grant } from '~/types'

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
  
  const existingGrantIds = await redis.smembers(REDIS_KEYS.GRANTS_LIST) as string[] || []
  if (existingGrantIds.length > 0) {
    const keysToFetch = existingGrantIds.map(id => REDIS_KEYS.GRANT_BY_ID(id))
    const CHUNK_SIZE = 100
    const existingGrants: Grant[] = []
    
    for (let i = 0; i < keysToFetch.length; i += CHUNK_SIZE) {
      const chunk = keysToFetch.slice(i, i + CHUNK_SIZE)
      const values = await redis.mget<Grant[]>(...chunk)
      existingGrants.push(...values.filter(Boolean))
    }

    const now = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

    const idsToDelete = existingGrants.filter(g => {
      if (g.deadline) {
        const deadlineTime = new Date(g.deadline).getTime()
        if (now - deadlineTime > THIRTY_DAYS) return true
      }
      
      const lastVerified = new Date(g.lastVerifiedAt || g.scrapedAt || 0).getTime()
      if (now - lastVerified > NINETY_DAYS) return true

      return false
    }).map(g => g.id)

    if (idsToDelete.length > 0) {
      console.log(`[Cron] Cleaning up ${idsToDelete.length} expired/old grants`)
      const delPipeline = redis.pipeline()
      idsToDelete.forEach(id => {
        delPipeline.del(REDIS_KEYS.GRANT_BY_ID(id))
        delPipeline.srem(REDIS_KEYS.GRANTS_LIST, id)
      })
      try {
        await delPipeline.exec()
      } catch (e) {
        console.error('[Cron] Cleanup pipeline failed:', e)
      }
    }
  }

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
