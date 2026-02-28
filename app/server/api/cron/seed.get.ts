import { defineEventHandler } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { getSampleGrants } from '../grants/seed'
import type { ScrapeResult } from '~/app/types'

export default defineEventHandler(async (event): Promise<ScrapeResult> => {
  const requestStart = performance.now()
  
  const result: ScrapeResult = {
    source: 'cron-seed',
    count: 0,
    newGrants: 0,
    updatedGrants: 0,
    failed: 0,
    errors: [],
    timestamp: new Date().toISOString()
  }

  console.log('[Cron] Seed job started')

  try {
    const existingGrants = await grantStorage.getAllGrants()
    
    if (existingGrants.length === 0) {
      console.log('[Cron] No grants in database, seeding sample data')
      
      const sampleGrants = getSampleGrants()
      
      for (const grant of sampleGrants) {
        try {
          await grantStorage.saveGrant(grant)
          result.newGrants++
          result.count++
        } catch (error) {
          console.error('[Cron] Failed to save grant:', grant.title, error)
          result.failed++
        }
      }
      
      console.log(`[Cron] Seeded ${result.newGrants} sample grants`)
    } else {
      console.log(`[Cron] Database already has ${existingGrants.length} grants, skipping seed`)
    }

    const totalDuration = Math.round(performance.now() - requestStart)
    console.log(`[Cron] Seed job completed in ${totalDuration}ms`)

    return result
  } catch (error) {
    console.error('[Cron] Seed job failed:', error)
    result.failed = 1
    result.errors?.push({
      source: 'cron-seed',
      type: 'system',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return result
  }
})
