import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { Grant, FilterState, PaginatedResponse } from '~/app/types'

export const useGrantsStore = defineStore('grants', () => {
  const grants = ref<Grant[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = reactive<FilterState>({
    category: null,
    region: null,
    deadline: { from: undefined, to: undefined },
    amount: { min: undefined, max: undefined },
    search: '',
    status: null
  })
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })
  const selectedGrant = ref<Grant | null>(null)

  // Derived state
  const filteredGrants = computed(() => {
    return grants.value.filter(grant => {
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
        const matchesTags = grant.tags.some(tag => tag.toLowerCase().includes(searchLower))
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
  })

  const paginatedGrants = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filteredGrants.value.slice(start, start + pagination.pageSize)
  })

  const totalPages = computed(() => Math.ceil(filteredGrants.value.length / pagination.pageSize))

  const categories = computed(() => {
    const cats = new Set<string>()
    grants.value.forEach(g => {
      if (g.category) cats.add(g.category)
    })
    return Array.from(cats).sort()
  })

  const regions = computed(() => {
    const regs = new Set<string>()
    grants.value.forEach(g => {
      if (g.region) regs.add(g.region)
    })
    return Array.from(regs).sort()
  })

  const statusCounts = computed(() => {
    const counts: Record<string, number> = { open: 0, closing_soon: 0, closed: 0, archived: 0 }
    grants.value.forEach(g => {
      if (counts.hasOwnProperty(g.status)) {
        counts[g.status]++
      }
    })
    return counts
  })

  // Actions
  async function fetchGrants(page = 1): Promise<void> {
    isLoading.value = true
    error.value = null
    pagination.page = page

    try {
      const response = await $fetch<PaginatedResponse<Grant>>('/api/grants', {
        method: 'GET',
        query: {
          page,
          pageSize: pagination.pageSize,
          ...filters
        }
      })

      grants.value = response.data
      pagination.total = response.meta.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch grants'
      console.error('Error fetching grants:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGrantById(id: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const grant = await $fetch<Grant>(`/api/grants/${id}`)
      selectedGrant.value = grant
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch grant details'
      console.error('Error fetching grant:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setFilter(key: keyof FilterState, value: any): void {
    filters[key] = value
    pagination.page = 1 // Reset to page 1 on filter change
  }

  function clearFilters(): void {
    filters.category = null
    filters.region = null
    filters.deadline = { from: undefined, to: undefined }
    filters.amount = { min: undefined, max: undefined }
    filters.search = ''
    filters.status = null
  }

  function selectGrant(grant: Grant): void {
    selectedGrant.value = grant
  }

  function clearSelection(): void {
    selectedGrant.value = null
  }

  // Hydration for SSR
  function hydrate(data: Grant[]): void {
    grants.value = data
  }

  return {
    // State
    grants,
    isLoading,
    error,
    filters,
    pagination,
    selectedGrant,

    // Derived
    filteredGrants,
    paginatedGrants,
    totalPages,
    categories,
    regions,
    statusCounts,

    // Actions
    fetchGrants,
    fetchGrantById,
    setFilter,
    clearFilters,
    selectGrant,
    clearSelection,
    hydrate
  }
})