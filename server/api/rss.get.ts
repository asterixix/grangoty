import { defineEventHandler, setHeader, getQuery } from 'h3'
import { generateRssXml, generateAtomXml } from '~/server/utils/rss-parser'
import type { RawGrant } from '~/app/types'

export default defineEventHandler(async (event) => {
  // Set proper content type
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')

  // Get format preference
  const query = getQuery(event)
  const format = query.format as string || 'rss'

  // In production, fetch from database
  // For now, use mock data
  const mockGrants: RawGrant[] = [
    {
      id: '1',
      source: 'niw',
      title: 'Grant for Environmental Projects 2024',
      description: 'Funding available for environmental initiatives across Poland.',
      category: 'environment',
      region: 'Poland',
      status: 'open',
      scrapedAt: new Date().toISOString()
    },
    {
      id: '2',
      source: 'eurodesk',
      title: 'EU Youth Program 2024',
      description: 'Opportunities for young people to participate in EU programs.',
      category: 'youth',
      region: 'Europe',
      status: 'open',
      scrapedAt: new Date().toISOString()
    }
  ]

  // Generate appropriate feed
  let xml: string
  if (format === 'atom') {
    xml = generateAtomXml(mockGrants)
    setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
  } else {
    xml = generateRssXml(mockGrants)
  }

  return xml
})