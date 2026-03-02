import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState } from '~/types'

export const useFiltersStore = defineStore('filters', () => {
  const filters = ref<FilterState>({
    category: null,
    region: null,
    deadline: { from: undefined, to: undefined },
    amount: { min: undefined, max: undefined },
    search: '',
    status: null
  })

  const activeFiltersCount = computed(() => {
    let count = 0
    if (filters.value.category) count++
    if (filters.value.region) count++
    if (filters.value.deadline.from || filters.value.deadline.to) count++
    if (filters.value.amount.min || filters.value.amount.max) count++
    if (filters.value.search) count++
    if (filters.value.status) count++
    return count
  })

  const hasActiveFilters = computed(() => activeFiltersCount.value > 0)

  function setFilter(key: keyof FilterState, value: any): void {
    filters.value[key] = value
  }

  function updateCategory(category: string | null): void {
    filters.value.category = category
  }

  function updateRegion(region: string | null): void {
    filters.value.region = region
  }

  function updateDeadline(deadline: FilterState['deadline']): void {
    filters.value.deadline = { ...filters.value.deadline, ...deadline }
  }

  function updateAmount(amount: FilterState['amount']): void {
    filters.value.amount = { ...filters.value.amount, ...amount }
  }

  function updateSearch(search: string): void {
    filters.value.search = search
  }

  function updateStatus(status: string | null): void {
    filters.value.status = status
  }

  function clearAll(): void {
    filters.value = {
      category: null,
      region: null,
      deadline: { from: undefined, to: undefined },
      amount: { min: undefined, max: undefined },
      search: '',
      status: null
    }
  }

  function loadFromUrl(urlParams: URLSearchParams): void {
    const category = urlParams.get('category')
    const region = urlParams.get('region')
    const search = urlParams.get('search')
    const status = urlParams.get('status')
    const deadlineFrom = urlParams.get('deadlineFrom')
    const deadlineTo = urlParams.get('deadlineTo')
    const amountMin = urlParams.get('amountMin')
    const amountMax = urlParams.get('amountMax')

    if (category) filters.value.category = category
    if (region) filters.value.region = region
    if (search) filters.value.search = search
    if (status) filters.value.status = status
    if (deadlineFrom) filters.value.deadline.from = deadlineFrom
    if (deadlineTo) filters.value.deadline.to = deadlineTo
    if (amountMin) filters.value.amount.min = parseFloat(amountMin)
    if (amountMax) filters.value.amount.max = parseFloat(amountMax)
  }

  function toUrlParams(): URLSearchParams {
    const params = new URLSearchParams()

    if (filters.value.category) params.set('category', filters.value.category)
    if (filters.value.region) params.set('region', filters.value.region)
    if (filters.value.search) params.set('search', filters.value.search)
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.deadline.from) params.set('deadlineFrom', filters.value.deadline.from)
    if (filters.value.deadline.to) params.set('deadlineTo', filters.value.deadline.to)
    if (filters.value.amount.min) params.set('amountMin', filters.value.amount.min.toString())
    if (filters.value.amount.max) params.set('amountMax', filters.value.amount.max.toString())

    return params
  }

  return {
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
  }
})