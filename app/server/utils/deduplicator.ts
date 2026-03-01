import type { RawGrant } from '~/app/types'

/**
 * Deduplicate grants based on multiple factors
 * Priority: title + source > title + description > title only
 */
export function deduplicateGrants(grants: RawGrant[]): RawGrant[] {
  const seen = new Set<string>()
  const deduplicated: RawGrant[] = []

  for (const grant of grants) {
    // Create multiple potential keys for matching
    const key1 = `${grant.source}:${grant.title}` // Strict match
    const key2 = grant.title?.toLowerCase().trim() || '' // Title only (for RSS feeds)

    if (key2 && !seen.has(key1) && !seen.has(key2)) {
      seen.add(key1)
      seen.add(key2)
      deduplicated.push(grant)
    }
  }

  return deduplicated
}

/**
 * Deep deduplication with fuzzy matching
 */
export function fuzzyDeduplicateGrants(grants: RawGrant[], threshold: number = 0.85): RawGrant[] {
  const deduplicated: RawGrant[] = []

  for (const grant of grants) {
    let isDuplicate = false

    for (const existing of deduplicated) {
      if (calculateSimilarity(grant, existing) >= threshold) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      deduplicated.push(grant)
    }
  }

  return deduplicated
}

/**
 * Calculate similarity between two grants
 */
function calculateSimilarity(grant1: RawGrant, grant2: RawGrant): number {
  let score = 0
  let maxScore = 0

  // Title comparison (weighted highest)
  if (grant1.title && grant2.title) {
    score += levenshteinSimilarity(grant1.title, grant2.title) * 0.5
    maxScore += 0.5
  }

  // Description comparison
  if (grant1.description && grant2.description) {
    score += levenshteinSimilarity(grant1.description, grant2.description) * 0.3
    maxScore += 0.3
  }

  // Source comparison
  if (grant1.source && grant2.source) {
    score += (grant1.source === grant2.source ? 1 : 0) * 0.2
    maxScore += 0.2
  }

  return maxScore > 0 ? score / maxScore : 0
}

/**
 * Calculate Levenshtein similarity ratio
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return 1 - distance / maxLength
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

/**
 * Filter out grants with missing critical fields
 */
export function filterValidGrants(grants: RawGrant[]): RawGrant[] {
  return grants.filter(grant => {
    // Must have at least title or description
    if (!grant.title && !grant.description) {
      return false
    }

    // Must have a source
    if (!grant.source) {
      return false
    }

    return true
  })
}

/**
 * Combine multiple deduplication strategies
 */
export function smartDeduplicateGrants(grants: RawGrant[]): RawGrant[] {
  // First pass: strict deduplication
  let deduplicated = deduplicateGrants(grants)

  // Second pass: fuzzy deduplication
  deduplicated = fuzzyDeduplicateGrants(deduplicated, 0.8)

  // Third pass: filter invalid
  deduplicated = filterValidGrants(deduplicated)

  return deduplicated
}