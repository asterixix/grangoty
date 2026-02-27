import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for accessibility features
 */
export function useA11y() {
  const focusTrapActive = ref(false)
  const lastActiveElement = ref<HTMLElement | null>(null)

  // Focus trap for modals
  function enableFocusTrap(container: HTMLElement): void {
    focusTrapActive.value = true
    lastActiveElement.value = document.activeElement as HTMLElement

    container.setAttribute('aria-modal', 'true')
    container.setAttribute('role', 'dialog')
    container.setAttribute('tabindex', '-1')

    // Trap focus within container
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Tab') return

      const focusableElements = container.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
  }

  function disableFocusTrap(): void {
    focusTrapActive.value = false
    lastActiveElement.value?.focus()
  }

  // Keyboard navigation helpers
  function navigateWithArrows(
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    callback: (index: number) => void
  ): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      callback((currentIndex + 1) % totalItems)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      callback((currentIndex - 1 + totalItems) % totalItems)
    } else if (event.key === 'Home') {
      event.preventDefault()
      callback(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      callback(totalItems - 1)
    }
  }

  // Screen reader announcements
  function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.getElementById('a11y-announcer')
    if (announcer) {
      announcer.textContent = message
      announcer.setAttribute('aria-live', priority)
    }
  }

  // Focus management
  function focusFirstFocusable(container: HTMLElement): void {
    const focusable = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length > 0) {
      ;(focusable[0] as HTMLElement).focus()
    }
  }

  function focusById(id: string): void {
    const element = document.getElementById(id)
    if (element) {
      element.focus()
    }
  }

  return {
    focusTrapActive,
    enableFocusTrap,
    disableFocusTrap,
    navigateWithArrows,
    announce,
    focusFirstFocusable,
    focusById
  }
}

/**
 * Composable for responsive breakpoints
 */
export function useBreakpoints() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)

  function updateBreakpoints(): void {
    const width = window.innerWidth
    isMobile.value = width < 768
    isTablet.value = width >= 768 && width < 1024
    isDesktop.value = width >= 1024
  }

  onMounted(() => {
    updateBreakpoints()
    window.addEventListener('resize', updateBreakpoints)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoints)
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    updateBreakpoints
  }
}

/**
 * Composable for scroll position tracking
 */
export function useScrollPosition() {
  const scrollPosition = ref(0)
  const isScrolled = ref(false)

  function updateScroll(): void {
    scrollPosition.value = window.scrollY
    isScrolled.value = window.scrollY > 50
  }

  onMounted(() => {
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', updateScroll)
  })

  return {
    scrollPosition,
    isScrolled,
    scrollToTop: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToBottom: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }
}