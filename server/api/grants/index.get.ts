import { defineEventHandler, getQuery } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import type { PaginatedResponse, Grant } from '~/app/types'

/**
 * Sample grants for demo/fallback when Redis is empty
 */
function getSampleGrants(): Grant[] {
  const in7Days = new Date()
  in7Days.setDate(in7Days.getDate() + 7)
  const in14Days = new Date()
  in14Days.setDate(in14Days.getDate() + 14)
  const in30Days = new Date()
  in30Days.setDate(in30Days.getDate() + 30)
  const in60Days = new Date()
  in60Days.setDate(in60Days.getDate() + 60)
  
  return [
    {
      id: 'sample-1',
      source: 'fundusze-ngo',
      title: 'Grant for Environmental Projects 2026',
      description: 'Funding available for environmental initiatives across Poland. Organizations can apply for up to 100,000 PLN for projects focused on sustainability, climate action, and environmental education.',
      amount: { min: 10000, max: 100000, currency: 'PLN' },
      deadline: in60Days.toISOString().split('T')[0],
      category: 'environment',
      region: 'Poland',
      eligibility: ['Registered NGO', 'Environmental focus', 'Minimum 1 year of operation'],
      website: 'https://fundusze.ngo.pl',
      tags: ['environment', 'climate', 'sustainability'],
      status: 'open',
      scrapedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      source: 'niw',
      title: 'National Institute of Freedom - Civil Society Support',
      description: 'Support program for civil society organizations. Grants available for projects that strengthen democracy, human rights, and civic engagement.',
      amount: { min: 50000, max: 500000, currency: 'PLN' },
      deadline: in30Days.toISOString().split('T')[0],
      category: 'government',
      region: 'Poland',
      eligibility: ['Non-profit organization', 'Civic mission', 'Transparency required'],
      website: 'https://niw.gov.pl',
      tags: ['civil society', 'democracy', 'human rights'],
      status: 'open',
      scrapedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      source: 'eurodesk',
      title: 'Erasmus+ Youth Exchange Program',
      description: 'EU funding for youth exchange projects. Organizations can apply for grants to support international youth exchanges, training, and networking activities.',
      amount: { min: 20000, max: 150000, currency: 'EUR' },
      deadline: in14Days.toISOString().split('T')[0],
      category: 'european',
      region: 'Europe',
      eligibility: ['Youth organization', 'EU member state', 'Age 13-30 focus'],
      website: 'https://eurodesk.pl',
      tags: ['youth', 'european', 'education', 'exchange'],
      status: 'open',
      scrapedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    },
    {
      id: 'sample-4',
      source: 'malopolska',
      title: 'Lesser Poland Regional Development Fund',
      description: 'Regional funding for projects in Lesser Poland (Małopolska). Focus on local development, culture, and social initiatives.',
      amount: { min: 5000, max: 50000, currency: 'PLN' },
      deadline: in7Days.toISOString().split('T')[0],
      category: 'regional',
      region: 'Lesser Poland',
      eligibility: ['Organization based in Lesser Poland', 'Local impact'],
      website: 'https://malopolska.pl',
      tags: ['regional', 'local development', 'culture'],
      status: 'open',
      scrapedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    },
    {
      id: 'sample-5',
      source: 'krakow-ngo',
      title: 'Kraków NGO Support Grant',
      description: 'City of Kraków grants for non-governmental organizations. Supporting local initiatives that benefit the community.',
      amount: { min: 2000, max: 25000, currency: 'PLN' },
      deadline: in30Days.toISOString().split('T')[0],
      category: 'local',
      region: 'Kraków',
      eligibility: ['Registered in Kraków', 'Public benefit activities'],
      website: 'https://ngo.krakow.pl',
      tags: ['local', 'kraków', 'community'],
      status: 'closing_soon',
      scrapedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    },
  ]
}

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

    // If no grants in Redis, use sample data
    if (grants.length === 0) {
      console.log('[GRANgoTY] No grants in Redis, using sample data. Run /api/scrape to fetch real grants.')
      grants = getSampleGrants()
    }

    // Apply search filter
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase()
      grants = grants.filter(g => 
        g.title.toLowerCase().includes(queryLower) ||
        g.description?.toLowerCase().includes(queryLower) ||
        g.tags?.some(t => t.toLowerCase().includes(queryLower))
      )
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
    
    // Return sample data on error
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
