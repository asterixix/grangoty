/**
 * Error simulation composable for testing error handling in development
 * Only available in dev mode
 */

export function useErrorSimulator() {
  const notifications = useNotifications()

  /**
   * Simulate network offline event
   */
  function networkOffline(): void {
    if (process.client) {
      window.dispatchEvent(new Event('offline'))
    }
  }

  /**
   * Simulate network online event
   */
  function networkOnline(): void {
    if (process.client) {
      window.dispatchEvent(new Event('online'))
    }
  }

  /**
   * Simulate a scraper source being down
   */
  function scraperDown(source: string): void {
    notifications.warn('notifications.grants.scraperDown', undefined, { source } as any)
  }

  /**
   * Show all toast types for visual testing
   */
  function allToastTypes(): void {
    notifications.success('notifications.grants.loadSuccess', { count: 47 })
    setTimeout(() => {
      notifications.info('notifications.system.updateAvailable')
    }, 100)
    setTimeout(() => {
      notifications.warn('notifications.network.slowConnection')
    }, 200)
    setTimeout(() => {
      notifications.error(
        'notifications.grants.loadError',
        'notifications.grants.loadErrorHint'
      )
    }, 300)
  }

  /**
   * Test notification queue cap (should max at 4, dropping oldest non-error)
   */
  function quota(): void {
    for (let i = 0; i < 6; i++) {
      notifications.info('notifications.grants.loadSuccess', { count: i })
    }
  }

  /**
   * Simulate an API timeout error
   */
  function apiTimeout(): void {
    notifications.error(
      'notifications.network.timeout',
      undefined,
      {
        labelKey: 'common.retry',
        handler: () => {
          notifications.success('notifications.grants.loadSuccess', { count: 10 })
        },
      }
    )
  }

  /**
   * Simulate session expired
   */
  function sessionExpired(): void {
    notifications.push({
      level: 'warning',
      context: 'auth',
      titleKey: 'notifications.auth.sessionExpired',
      persistent: true,
      action: {
        labelKey: 'common.login',
        handler: () => {
          // In real app, redirect to login
          notifications.success('notifications.system.copySuccess')
        },
      },
    })
  }

  /**
   * Simulate no results filter
   */
  function noResults(): void {
    notifications.info('notifications.grants.noResults', undefined, {
      action: {
        labelKey: 'common.clearFilters',
        handler: () => {
          notifications.success('notifications.grants.loadSuccess', { count: 25 })
        },
      },
    } as any)
  }

  /**
   * Simulate new grants available notification
   */
  function newGrantsAvailable(): void {
    notifications.info('notifications.grants.newAvailable', { count: 5 })
  }

  /**
   * Simulate copy to clipboard success
   */
  function copySuccess(): void {
    notifications.success('notifications.system.copySuccess')
  }

  /**
   * Simulate RSS ready
   */
  function rssReady(): void {
    notifications.info('notifications.system.rssReady')
  }

  return {
    networkOffline,
    networkOnline,
    scraperDown,
    allToastTypes,
    quota,
    apiTimeout,
    sessionExpired,
    noResults,
    newGrantsAvailable,
    copySuccess,
    rssReady,
  }
}
