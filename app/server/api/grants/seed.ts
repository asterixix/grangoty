import type { Grant } from '~/app/types'

/**
 * Get sample grants for development and testing
 * NOTE: This should only be used for development/testing purposes
 * In production, all data should come from real scrapers
 */
export function getSampleGrants(): Grant[] {
  // Return empty array in production - no sample data allowed
  if (process.env.NODE_ENV === 'production') {
    return []
  }

  // In development, return minimal test data for UI development
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
