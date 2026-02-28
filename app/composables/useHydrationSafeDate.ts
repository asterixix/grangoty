import { ref, computed, onMounted } from 'vue'

/**
 * Composable for hydration-safe date formatting
 * Prevents hydration mismatches by only using client-side dates after mount
 */
export function useHydrationSafeDate() {
  const isMounted = ref(false)
  
  onMounted(() => {
    isMounted.value = true
  })
  
  /**
   * Get current date (hydration-safe)
   */
  const now = computed(() => {
    return isMounted.value ? new Date() : new Date('2026-02-28')
  })
  
  /**
   * Format date for display (hydration-safe)
   */
  function formatDate(
    date: Date | string | undefined,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    if (!date) return ''
    
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(d)
  }
  
  /**
   * Calculate days remaining until deadline
   */
  function getDaysRemaining(deadline: Date | string): number | null {
    if (!deadline) return null
    
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
    if (isNaN(deadlineDate.getTime())) return null
    
    const currentDate = now.value
    const diffTime = deadlineDate.getTime() - currentDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }
  
  /**
   * Get relative time string (e.g., "2 days ago", "in 3 days")
   */
  function getRelativeTime(date: Date | string): string {
    if (!date) return ''
    
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    
    const diffTime = now.value.getTime() - d.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays === -1) return 'tomorrow'
    if (diffDays > 1) return `${diffDays} days ago`
    if (diffDays < -1) return `in ${Math.abs(diffDays)} days`
    
    return ''
  }
  
  return {
    isMounted,
    now,
    formatDate,
    getDaysRemaining,
    getRelativeTime
  }
}
