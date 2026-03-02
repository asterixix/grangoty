import { defineEventHandler, getQuery, createError } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { getSampleGrants } from './seed'
import type { PaginatedResponse, Grant } from '~/types'

export default defineEventHandler(async (event): Promise<PaginatedResponse<Grant>> => {
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    return { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }
  }

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 30
  const searchQuery = query.q as string || query.search as string || ''
  const category = query.category as string
  const region = query.region as string
  const status = query.status as string
  const activeFilter = query.activeFilter as string
  const sortBy = query.sort as string || 'deadline'

  try {
    let grants = await grantStorage.getAllGrants()

    if (grants.length === 0 && process.env.NODE_ENV !== 'production') {
      grants = getSampleGrants()
    }

    if (grants.length === 0 && process.env.NODE_ENV === 'production') {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          pageSize,
          totalPages: 0
        }
      }
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

    if (activeFilter) {
      if (activeFilter === 'terminujace') {
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        grants = grants.filter(g => g.deadline && new Date(g.deadline) <= sevenDaysFromNow)
      } else {
        grants = grants.filter(g => g.region.toLowerCase().includes(activeFilter.toLowerCase()))
      }
    }

    if (sortBy === 'added') {
      grants.sort((a, b) => {
        const dateA = (a as any).scrapedAt ? new Date((a as any).scrapedAt).getTime() : 0
        const dateB = (b as any).scrapedAt ? new Date((b as any).scrapedAt).getTime() : 0
        return dateB - dateA
      })
    } else {
      grants.sort((a, b) => {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }

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

    // In production, don't fallback to sample data on errors
    if (process.env.NODE_ENV === 'production') {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database error'
      })
    }

    // Only in development, return sample data as last resort
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
