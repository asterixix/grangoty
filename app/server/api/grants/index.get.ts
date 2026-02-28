import { defineEventHandler, getQuery } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { getSampleGrants } from './seed'
import type { PaginatedResponse, Grant } from '~/app/types'

export default defineEventHandler(async (event): Promise<PaginatedResponse<Grant>> => {
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }
  }

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const searchQuery = query.q as string || query.search as string || ''
  const category = query.category as string
  const region = query.region as string
  const status = query.status as string

  try {
    let grants = await grantStorage.getAllGrants()

    if (grants.length === 0) {
      console.log('[GRANgoTY] No grants in Redis, using sample data.')
      grants = getSampleGrants()
    }

    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase()
      grants = grants.filter(g => 
        g.title.toLowerCase().includes(queryLower) ||
        g.description?.toLowerCase().includes(queryLower) ||
        g.tags?.some(t => t.toLowerCase().includes(queryLower))
      )
    }

    if (category) {
      grants = grants.filter(g => g.category === category)
    }

    if (region) {
      grants = grants.filter(g => g.region === region)
    }

    if (status) {
      grants = grants.filter(g => g.status === status)
    }

    grants.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

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
    
    const sampleGrants = getSampleGrants()
    return {
      data: sampleGrants.slice(0, pageSize),
      meta: { 
        total: sampleGrants.length, 
        page: 1, 
        pageSize, 
        totalPages: 1 
      }
    }
  }
})
