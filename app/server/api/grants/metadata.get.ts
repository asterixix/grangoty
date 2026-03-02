import { defineEventHandler, createError } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { getSampleGrants } from './seed'

export default defineEventHandler(async (event) => {
  try {
    let grants = await grantStorage.getAllGrants()

    if (grants.length === 0 && process.env.NODE_ENV !== 'production') {
      grants = getSampleGrants()
    }

    const categories = new Set<string>()
    const regions = new Set<string>()

    for (const grant of grants) {
      if (grant.category) categories.add(grant.category)
      if (grant.region) regions.add(grant.region)
    }

    return {
      categories: Array.from(categories).sort(),
      regions: Array.from(regions).sort(),
      totalCount: grants.length
    }
  } catch (error) {
    console.error('Error fetching grant metadata:', error)
    if (process.env.NODE_ENV === 'production') {
      throw createError({ statusCode: 500, statusMessage: 'Database error' })
    }
    
    // Dev fallback
    const sample = getSampleGrants()
    return {
      categories: Array.from(new Set(sample.map(g => g.category).filter(Boolean))).sort(),
      regions: Array.from(new Set(sample.map(g => g.region).filter(Boolean))).sort(),
      totalCount: sample.length
    }
  }
})
