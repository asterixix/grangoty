import { useGrantsStore } from '~/app/stores/grants'
import type { Grant, PaginatedResponse } from '~/app/types'

/**
 * Composable for managing grants data and operations
 */
export function useGrants() {
  const store = useGrantsStore()

  const { fetchGrants, fetchGrantById, setFilter, clearFilters, selectGrant, clearSelection } = store

  return {
    // State
    grants: store.grants,
    isLoading: store.isLoading,
    error: store.error,
    filters: store.filters,
    pagination: store.pagination,
    selectedGrant: store.selectedGrant,

    // Derived
    filteredGrants: store.filteredGrants,
    paginatedGrants: store.paginatedGrants,
    totalPages: store.totalPages,
    categories: store.categories,
    regions: store.regions,
    statusCounts: store.statusCounts,

    // Actions
    fetchGrants,
    fetchGrantById,
    setFilter,
    clearFilters,
    selectGrant,
    clearSelection
  }
}

/**
 * Composable for fetching grants from API
 */
export async function fetchGrantsFromApi(page = 1, pageSize = 20): Promise<Grant[]> {
  try {
    const response = await $fetch<PaginatedResponse<Grant>>('/api/grants', {
      query: { page, pageSize }
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch grants from API:', error)
    return []
  }
}

/**
 * Composable for checking deadline status
 */
export function useDeadlineStatus(deadline?: string) {
  if (!deadline) return { status: 'unknown', daysRemaining: null }

  const deadlineDate = new Date(deadline)
  const now = new Date()
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let status: 'open' | 'closing_soon' | 'expired' = 'open'
  if (diffDays < 0) {
    status = 'expired'
  } else if (diffDays <= 7) {
    status = 'closing_soon'
  }

  return { status, daysRemaining: diffDays }
}

/**
 * Composable for formatting grant amounts
 */
export function formatAmount(amount?: { min?: number; max?: number; currency: string }) {
  if (!amount) return 'N/A'

  const { min, max, currency } = amount
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  })

  if (min === max && min !== undefined) {
    return formatter.format(min)
  }

  if (min !== undefined && max !== undefined) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }

  if (min !== undefined) {
    return `${formatter.format(min)}+`
  }

  if (max !== undefined) {
    return `Up to ${formatter.format(max)}`
  }

  return 'N/A'
}

/**
 * Composable for date formatting
 */
export function formatDate(dateString?: string, options?: Intl.DateTimeFormatOptions) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }

  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date)
}

/**
 * Composable for truncating text
 */
export function truncate(text: string, maxLength: number, suffix = '...') {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + suffix
}