import { defineEventHandler, setHeader, getQuery } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import type { Grant } from '~/app/types'

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Format date for RSS
 */
function formatRssDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toUTCString()
}

/**
 * Generate RSS 2.0 XML from grants
 */
function generateRssXml(grants: Grant[], siteUrl: string): string {
  const items = grants.map(grant => `
    <item>
      <title>${escapeXml(grant.title)}</title>
      <description>${escapeXml(grant.description || '')}</description>
      <link>${escapeXml(grant.website || `${siteUrl}/grant/${grant.id}`)}</link>
      <guid isPermaLink="false">${escapeXml(grant.id)}</guid>
      <pubDate>${formatRssDate(grant.scrapedAt || new Date().toISOString())}</pubDate>
      <category>${escapeXml(grant.category)}</category>
      ${grant.region ? `<dc:region>${escapeXml(grant.region)}</dc:region>` : ''}
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>GRANgoTY - Grant Aggregator for NGOs</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Aggregating grants for NGOs across Poland and Europe. Find funding opportunities for your organization.</description>
    <language>pl</language>
    <lastBuildDate>${formatRssDate(new Date().toISOString())}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/api/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`
}

/**
 * Generate Atom feed XML
 */
function generateAtomXml(grants: Grant[], siteUrl: string): string {
  const items = grants.map(grant => `
    <entry>
      <title>${escapeXml(grant.title)}</title>
      <link href="${escapeXml(grant.website || `${siteUrl}/grant/${grant.id}`)}"/>
      <id>${escapeXml(grant.id)}</id>
      <updated>${formatRssDate(grant.scrapedAt || new Date().toISOString())}</updated>
      <summary>${escapeXml(grant.description || '')}</summary>
      <category term="${escapeXml(grant.category)}"/>
    </entry>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>GRANgoTY - Grant Aggregator for NGOs</title>
  <link href="${escapeXml(siteUrl)}"/>
  <link href="${escapeXml(siteUrl)}/api/rss?format=atom" rel="self"/>
  <subtitle>Aggregating grants for NGOs across Poland and Europe</subtitle>
  <updated>${formatRssDate(new Date().toISOString())}</updated>
  <author>
    <name>GRANgoTY</name>
  </author>
  <id>${escapeXml(siteUrl)}/api/rss</id>
  ${items}
</feed>`
}

export default defineEventHandler(async (event) => {
  const siteUrl = process.env.SITE_URL || 'https://grangoty.vercel.app'
  
  // Get format preference
  const query = getQuery(event)
  const format = (query.format as string) || 'rss'

  try {
    // Fetch grants from Redis
    const grants = await grantStorage.getAllGrants()
    
    // Sort by scrapedAt (newest first)
    grants.sort((a, b) => {
      const dateA = new Date(a.scrapedAt || 0).getTime()
      const dateB = new Date(b.scrapedAt || 0).getTime()
      return dateB - dateA
    })
    
    // Limit to 50 most recent
    const recentGrants = grants.slice(0, 50)

    // Generate appropriate feed
    let xml: string
    if (format === 'atom') {
      xml = generateAtomXml(recentGrants, siteUrl)
      setHeader(event, 'Content-Type', 'application/atom+xml; charset=utf-8')
    } else {
      xml = generateRssXml(recentGrants, siteUrl)
      setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
    }

    return xml
  } catch (error) {
    console.error('Failed to generate RSS feed:', error)
    
    // Return empty feed on error
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>GRANgoTY - Grant Aggregator for NGOs</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Error generating feed</description>
  </channel>
</rss>`
    
    setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
    return emptyFeed
  }
})
