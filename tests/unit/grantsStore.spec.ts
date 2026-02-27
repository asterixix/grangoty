import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGrantsStore } from '~/app/stores/grants'

describe('Grants Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useGrantsStore()
    expect(store.grants).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.filters).toEqual({
      category: null,
      region: null,
      deadline: { from: undefined, to: undefined },
      amount: { min: undefined, max: undefined },
      search: '',
      status: null
    })
    expect(store.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 0
    })
  })

  it('updates filters correctly', () => {
    const store = useGrantsStore()

    store.setFilter('category', 'environment')
    expect(store.filters.category).toBe('environment')
    expect(store.pagination.page).toBe(1) // Should reset page

    store.setFilter('search', 'Test')
    expect(store.filters.search).toBe('Test')
  })

  it('clears filters correctly', () => {
    const store = useGrantsStore()

    store.setFilter('category', 'environment')
    store.setFilter('search', 'Test')

    store.clearFilters()

    expect(store.filters.category).toBeNull()
    expect(store.filters.search).toBe('')
  })

  it('computes filtered grants correctly', () => {
    const store = useGrantsStore()

    // Mock data
    store.hydrate([
      { id: '1', title: 'Test 1', category: 'cat1', region: 'reg1', status: 'open', tags: [], source: 'test', description: '', eligibility: [], scrapedAt: '' },
      { id: '2', title: 'Test 2', category: 'cat2', region: 'reg2', status: 'closed', tags: [], source: 'test', description: '', eligibility: [], scrapedAt: '' },
      { id: '3', title: 'Test 3', category: 'cat1', region: 'reg2', status: 'open', tags: [], source: 'test', description: '', eligibility: [], scrapedAt: '' },
    ])

    // Test category filter
    store.setFilter('category', 'cat1')
    expect(store.filteredGrants.length).toBe(2)

    // Test multiple filters
    store.setFilter('region', 'reg2')
    expect(store.filteredGrants.length).toBe(1)
    expect(store.filteredGrants[0].id).toBe('3')

    // Clear filters
    store.clearFilters()
    expect(store.filteredGrants.length).toBe(3)

    // Test search filter
    store.setFilter('search', 'test 2')
    expect(store.filteredGrants.length).toBe(1)
    expect(store.filteredGrants[0].id).toBe('2')
  })
})