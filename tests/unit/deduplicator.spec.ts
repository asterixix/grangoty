import { describe, it, expect } from 'vitest'
import { deduplicateGrants, fuzzyDeduplicateGrants, filterValidGrants } from '~/server/utils/deduplicator'
import type { RawGrant } from '~/app/types'

describe('Deduplicator Utility', () => {
  it('filters invalid grants', () => {
    const grants: RawGrant[] = [
      { source: 'test', title: 'Valid 1', status: 'open' },
      { source: '', title: 'Invalid Source', status: 'open' },
      { source: 'test', status: 'open' }, // No title or description
      { source: 'test', description: 'Valid 2', status: 'open' }
    ]

    const result = filterValidGrants(grants)
    expect(result.length).toBe(2)
    expect(result[0].title).toBe('Valid 1')
    expect(result[1].description).toBe('Valid 2')
  })

  it('deduplicates exact matches based on source and title', () => {
    const grants: RawGrant[] = [
      { source: 'niw', title: 'Grant A', status: 'open' },
      { source: 'niw', title: 'Grant A', status: 'open' }, // Duplicate
      { source: 'niw', title: 'Grant B', status: 'open' },
      { source: 'other', title: 'Grant A', status: 'open' } // Different source, same title
    ]

    const result = deduplicateGrants(grants)
    expect(result.length).toBe(3) // The duplicate is removed, but 'other' source with same title is kept
  })

  it('performs fuzzy deduplication on similar titles', () => {
    const grants: RawGrant[] = [
      { source: 'niw', title: 'Support for Environmental Protection 2024', status: 'open' },
      { source: 'niw', title: 'Support for Environment Protection 2024', status: 'open' }, // Very similar
      { source: 'niw', title: 'Different Grant entirely', status: 'open' }
    ]

    const result = fuzzyDeduplicateGrants(grants, 0.8) // High similarity threshold
    expect(result.length).toBe(2)
  })
})