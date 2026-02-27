import { defineEventHandler, getQuery } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import type { PaginatedResponse, Grant } from '~/app/types'

export default defineEventHandler(async (event): Promise<PaginatedResponse<Grant>> => {
  // Handle CORS preflight
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }
  }

  // Get query parameters
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const searchQuery = query.q as string || query.search as string || ''
  const category = query.category as string
  const region = query.region as string
  const status = query.status as string

  try {
    // Get grants from Redis storage
    let grants = await grantStorage.getAllGrants()

    // Apply search filter
    if (searchQuery) {
      grants = await grantStorage.searchGrants(searchQuery)
    }

    // Apply category filter
    if (category) {
      grants = grants.filter(g => g.category === category)
    }

    // Apply region filter
    if (region) {
      grants = grants.filter(g => g.region === region)
    }

    // Apply status filter
    if (status) {
      grants = grants.filter(g => g.status === status)
    }

    // Sort by deadline (closing soonest first, nulls last)
    grants.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

    // Calculate pagination
    const total = grants.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedGrants = grants.slice(startIndex, endIndex)

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
