import type { Grant } from '~/types'

/**
 * Get sample grants for development and testing
 * NOTE: This is only used as a fallback when real scrapers return no data
 */
export function getSampleGrants(): Grant[] {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(now.getDate() + 30)

  return [
    {
      id: 'dev-test-1',
      source: 'development',
      title: 'Development Test Grant',
      description: 'This is a test grant for development purposes only.',
      amount: { min: 1000, max: 5000, currency: 'PLN' },
      deadline: futureDate.toISOString().split('T')[0],
      category: 'development',
      region: 'Test Region',
      eligibility: ['Test eligibility'],
      website: 'https://example.com',
      tags: ['test', 'development'],
      status: 'open',
      scrapedAt: now.toISOString(),
      lastVerifiedAt: now.toISOString(),
    }
  ]
}
