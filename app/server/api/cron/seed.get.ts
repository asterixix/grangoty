import { defineEventHandler } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { runAllScrapers } from '~/server/scrapers/sources'
import { deduplicateGrants, validateGrant } from '~/server/scrapers/base-scraper'
import type { Grant } from '~/app/types'

async function runScrapeAndStore(): Promise<{ saved: number; newCount: number; updated: number; failed: number }> {
  console.log('[Cron] Scrape job started')

  const rawGrants = await runAllScrapers()
  console.log(`[Cron] Scraped ${rawGrants.length} raw grants total`)

  const validGrants = deduplicateGrants(rawGrants).filter(validateGrant)
  console.log(`[Cron] ${validGrants.length} valid unique grants after deduplication`)

  const existingGrants = await grantStorage.getAllGrants()
  const existingIds = new Set(existingGrants.map(g => g.id))

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

  const saveResults = await Promise.allSettled(
    grantsToSave.map(grant => grantStorage.saveGrant(grant))
  )

  let saved = 0
  let newCount = 0
  let updated = 0
  let failed = 0

  saveResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      saved++
      if (existingIds.has(grantsToSave[i].id)) {
        updated++
      } else {
        newCount++
      }
    } else {
      console.error('[Cron] Failed to save grant:', grantsToSave[i].title, result.reason)
      failed++
    }
  })

  console.log(`[Cron] Done: saved=${saved}, new=${newCount}, updated=${updated}, failed=${failed}`)
  return { saved, newCount, updated, failed }
}

export default defineEventHandler(async (_event) => {
  const stats = await runScrapeAndStore()
  return { status: 'ok', ...stats }
})
