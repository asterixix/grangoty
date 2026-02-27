import { ref, readonly, type Ref, type DeepReadonly } from 'vue'

export interface NetworkStatusReturn {
  /** Whether the browser is online */
  isOnline: DeepReadonly<Ref<boolean>>
  /** Whether the browser was offline at some point (for showing "back online" message) */
  wasOffline: DeepReadonly<Ref<boolean>>
  /** Force a check of network status */
  checkStatus: () => boolean
}

/**
 * Network status monitoring composable
 * Listens for online/offline events and shows appropriate notifications
 */
export function useNetworkStatus(): NetworkStatusReturn {
  const notifications = useNotifications()
  const isOnline = ref(true)
  const wasOffline = ref(false)

  // Only run on client
  if (process.client) {
    // Initialize with current status
    isOnline.value = navigator.onLine

    // Listen for offline event
    window.addEventListener('offline', () => {
      isOnline.value = false
      wasOffline.value = true

      // Persistent warning - stays until back online
      notifications.push({
        id: 'network-offline',
        level: 'warning',
        context: 'network',
        titleKey: 'notifications.network.offline',
        messageKey: 'notifications.network.offlineHint',
        persistent: true,
      })
    })

    // Listen for online event
    window.addEventListener('online', () => {
      isOnline.value = true

      // Dismiss the offline notification
      notifications.dismiss('network-offline')

      // Show "back online" message if we were previously offline
      if (wasOffline.value) {
        notifications.success('notifications.network.backOnline')

        // Trigger background re-fetch of grants feed
        try {
          const grantsStore = useGrantsStore()
          grantsStore.fetchGrants()
        } catch {
          // Store may not be initialized yet, ignore
        }
      }
    })
  }

  /**
   * Manually check network status
   */
  function checkStatus(): boolean {
    if (process.client) {
      isOnline.value = navigator.onLine
    }
    return isOnline.value
  }

  return {
    isOnline: readonly(isOnline),
    wasOffline: readonly(wasOffline),
    checkStatus,
  }
}

/**
 * Check if the browser is currently online
 * Useful for conditional logic without reactive overhead
 */
export function isBrowserOnline(): boolean {
  if (process.server) return true
  return navigator.onLine
}
