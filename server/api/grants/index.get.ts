import { defineEventHandler, getQuery } from 'h3'
import { deduplicateGrants, filterValidGrants } from '~/server/utils/deduplicator'
import type { PaginatedResponse, RawGrant } from '~/app/types'

export default defineEventHandler(async (event): Promise<PaginatedResponse<RawGrant>> => {
  // Handle CORS preflight
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }
  }

  // Get query parameters
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  try {
    // Note: In production, this would call actual scraper services
    // For now, return mock data structure
    const mockGrants: RawGrant[] = [
      {
        source: 'mock',
        title: 'Mock Grant 1',
        description: 'This is a mock grant for demonstration purposes.',
        category: 'general',
        region: 'Poland',
        status: 'open'
      },
      {
        source: 'mock',
        title: 'Mock Grant 2',
        description: 'Another mock grant to demonstrate the system.',
        category: 'regional',
        region: 'Lesser Poland',
        status: 'open'
      }
    ]

    // Deduplicate and filter
    const validGrants = filterValidGrants(mockGrants)
    const deduplicated = deduplicateGrants(validGrants)

    // Calculate pagination
    const total = deduplicated.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedGrants = deduplicated.slice(startIndex, endIndex)

    return {
      data: paginatedGrants,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    console.error('Error fetching grants:', error)
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
    }
  }
})