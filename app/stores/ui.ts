import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isSidebarOpen = ref(false)
  const isMobileMenuOpen = ref(false)
  const isFilterPanelOpen = ref(false)
  const isToastVisible = ref(false)
  const toastMessage = ref('')
  const toastType = ref<'success' | 'error' | 'info'>('info')

  const mobile = computed(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })

  const desktop = computed(() => !mobile.value)

  function toggleSidebar(): void {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function toggleMobileMenu(): void {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  function toggleFilterPanel(): void {
    isFilterPanelOpen.value = !isFilterPanelOpen.value
  }

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    toastMessage.value = message
    toastType.value = type
    isToastVisible.value = true

    setTimeout(() => {
      isToastVisible.value = false
    }, 3000)
  }

  function hideToast(): void {
    isToastVisible.value = false
  }

  // Scroll lock for modals
  function lockScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden'
    }
  }

  function unlockScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto'
    }
  }

  return {
    isSidebarOpen,
    isMobileMenuOpen,
    isFilterPanelOpen,
    isToastVisible,
    toastMessage,
    toastType,
    mobile,
    desktop,
    toggleSidebar,
    toggleMobileMenu,
    toggleFilterPanel,
    showToast,
    hideToast,
    lockScroll,
    unlockScroll
  }
})