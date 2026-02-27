import { parseStringPromise } from 'xml2js'
import type { RawGrant } from '~/app/types'

/**
 * Parse RSS/Atom feed and convert to Grant objects
 */
export async function parseRssFeed(xmlContent: string): Promise<RawGrant[]> {
  try {
    const result = await parseStringPromise(xmlContent)
    const grants: RawGrant[] = []

    // Handle RSS 2.0
    if (result.rss?.channel?.[0]?.item) {
      for (const item of result.rss.channel[0].item) {
        const grant: RawGrant = {
          source: 'rss',
          title: item.title?.[0],
          description: item.description?.[0],
          deadline: item['dc:date']?.[0] || item.pubDate?.[0],
          category: item.category?.[0] || 'general',
          website: item.link?.[0],
          tags: item.category?.filter((c: any) => c !== undefined) || [],
          status: 'open'
        }
        grants.push(grant)
      }
    }

    // Handle Atom feed
    if (result.feed?.entry) {
      for (const entry of result.feed.entry) {
        const grant: RawGrant = {
          source: 'rss',
          title: entry.title?.[0],
          description: entry.summary?.[0],
          deadline: entry.published?.[0] || entry.updated?.[0],
          category: entry.category?.[0]?.['$']?.term || 'general',
          website: entry.link?.[0]?.['$']?.href,
          tags: entry.category?.map((c: any) => c?.['$']?.term).filter(Boolean) || [],
          status: 'open'
        }
        grants.push(grant)
      }
    }

    return grants
  } catch (error) {
    console.error('Failed to parse RSS feed:', error)
    return []
  }
}

/**
 * Generate RSS 2.0 XML from grants
 */
export function generateRssXml(grants: RawGrant[]): string {
  const items = grants.map(grant => `
    <item>
      <title>${escapeXml(grant.title || 'Untitled')}</title>
      <description>${escapeXml(grant.description || '')}</description>
      <link>${escapeXml(grant.website || '#')}</link>
      <guid>${escapeXml(grant.id || '')}</guid>
      <pubDate>${formatDate(grant.scrapedAt || new Date().toISOString())}</pubDate>
      <category>${escapeXml(grant.category || 'general')}</category>
    </item>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NGO Grants Aggregator</title>
    <link>https://ngo-grants.example.com</link>
    <description>Aggregating grants for NGOs across Europe</description>
    <language>en-us</language>
    <lastBuildDate>${formatDate(new Date().toISOString())}</lastBuildDate>
    <atom:link href="https://ngo-grants.example.com/api/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`
}

/**
 * Generate Atom feed XML
 */
export function generateAtomXml(grants: RawGrant[]): string {
  const items = grants.map(grant => `
    <entry>
      <title>${escapeXml(grant.title || 'Untitled')}</title>
      <link href="${escapeXml(grant.website || '#')}"/>
      <id>${escapeXml(grant.id || '')}</id>
      <updated>${formatDate(grant.scrapedAt || new Date().toISOString())}</updated>
      <summary>${escapeXml(grant.description || '')}</summary>
      <category term="${escapeXml(grant.category || 'general')}"/>
    </entry>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>NGO Grants Aggregator</title>
  <link href="https://ngo-grants.example.com"/>
  <subtitle>Aggregating grants for NGOs across Europe</subtitle>
  <updated>${formatDate(new Date().toISOString())}</updated>
  <author>
    <name>NGO Grants Aggregator Team</name>
  </author>
  <id>urn:uuid:60a76c80-d399-11d9-b91C-0003939e0af6</id>
  ${items}
</feed>`
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;')
}

/**
 * Format date for RSS/Atom
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toUTCString()
}