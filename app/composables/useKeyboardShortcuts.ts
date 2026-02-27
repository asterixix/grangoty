import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Composable for keyboard shortcuts (HN-inspired)
 * j/k: navigate up/down
 * s: save/bookmark
 * o: open URL
 * /: focus search
 * ?: toggle help modal
 */
export function useKeyboardShortcuts(
  grants: Ref<any[]>,
  currentIndex: Ref<number>,
  emit: (event: string, ...args: any[]) => void
) {
  const showHelp = ref(false)

  function handleKeydown(event: KeyboardEvent): void {
    // Ignore if typing in input or textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (event.key) {
      case 'j':
        event.preventDefault()
        navigateDown()
        break
      case 'k':
        event.preventDefault()
        navigateUp()
        break
      case 's':
        event.preventDefault()
        saveCurrent()
        break
      case 'o':
      case 'Enter':
        event.preventDefault()
        openCurrent()
        break
      case '/':
        event.preventDefault()
        focusSearch()
        break
      case '?':
        event.preventDefault()
        toggleHelp()
        break
    }
  }

  function navigateDown(): void {
    if (currentIndex.value < grants.value.length - 1) {
      currentIndex.value++
    }
  }

  function navigateUp(): void {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function saveCurrent(): void {
    if (currentIndex.value >= 0 && currentIndex.value < grants.value.length) {
      emit('save', currentIndex.value)
    }
  }

  function openCurrent(): void {
    if (currentIndex.value >= 0 && currentIndex.value < grants.value.length) {
      const grant = grants.value[currentIndex.value]
      if (grant.website) {
        window.open(grant.website, '_blank', 'noopener,noreferrer')
      }
    }
  }

  function focusSearch(): void {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null
    if (searchInput) {
      searchInput.focus()
    }
  }

  function toggleHelp(): void {
    showHelp.value = !showHelp.value
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    showHelp,
    toggleHelp
  }
}