import { useFiltersStore } from '~/app/stores/filters'
import type { FilterState } from '~/app/types'

/**
 * Composable for managing filter state
 */
export function useFilters() {
  const store = useFiltersStore()

  const {
    filters,
    activeFiltersCount,
    hasActiveFilters,
    setFilter,
    updateCategory,
    updateRegion,
    updateDeadline,
    updateAmount,
    updateSearch,
    updateStatus,
    clearAll,
    loadFromUrl,
    toUrlParams
  } = store

  // Helper functions
  function toggleCategory(category: string | null): void {
    updateCategory(filters.category === category ? null : category)
  }

  function toggleRegion(region: string | null): void {
    updateRegion(filters.region === region ? null : region)
  }

  function toggleStatus(status: string | null): void {
    updateStatus(filters.status === status ? null : status)
  }

  function removeCategory(): void {
    updateCategory(null)
  }

  function removeRegion(): void {
    updateRegion(null)
  }

  function removeDeadline(): void {
    updateDeadline({ from: undefined, to: undefined })
  }

  function removeAmount(): void {
    updateAmount({ min: undefined, max: undefined })
  }

  function removeSearch(): void {
    updateSearch('')
  }

  function removeStatus(): void {
    updateStatus(null)
  }

  return {
    // State
    filters,
    activeFiltersCount,
    hasActiveFilters,

    // Actions
    setFilter,
    updateCategory,
    updateRegion,
    updateDeadline,
    updateAmount,
    updateSearch,
    updateStatus,
    clearAll,
    loadFromUrl,
    toUrlParams,

    // Toggles
    toggleCategory,
    toggleRegion,
    toggleStatus,

    // Removals
    removeCategory,
    removeRegion,
    removeDeadline,
    removeAmount,
    removeSearch,
    removeStatus
  }
}

/**
 * Composable for filtering grants in-memory
 */
export function filterGrants(grants: any[], filters: FilterState) {
  return grants.filter(grant => {
    // Category filter
    if (filters.category && grant.category !== filters.category) {
      return false
    }

    // Region filter
    if (filters.region && grant.region !== filters.region) {
      return false
    }

    // Deadline filter
    if (filters.deadline.from && grant.deadline) {
      if (new Date(grant.deadline) < new Date(filters.deadline.from)) {
        return false
      }
    }
    if (filters.deadline.to && grant.deadline) {
      if (new Date(grant.deadline) > new Date(filters.deadline.to)) {
        return false
      }
    }

    // Amount filter
    if (filters.amount.min && grant.amount?.min) {
      if (grant.amount.min < filters.amount.min) {
        return false
      }
    }
    if (filters.amount.max && grant.amount?.max) {
      if (grant.amount.max > filters.amount.max) {
        return false
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesTitle = grant.title?.toLowerCase().includes(searchLower)
      const matchesDesc = grant.description?.toLowerCase().includes(searchLower)
      const matchesTags = grant.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      if (!matchesTitle && !matchesDesc && !matchesTags) {
        return false
      }
    }

    // Status filter
    if (filters.status && grant.status !== filters.status) {
      return false
    }

    return true
  })
}