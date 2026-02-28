/**
 * Global Error Handler Plugin
 * Captures Vue runtime errors, Nuxt lifecycle errors, and unhandled promise rejections
 * @see docs: https://nuxt.com/docs/getting-started/error-handling
 */
import { defineNuxtPlugin } from 'nuxt/app'
import { useNotifications } from '../composables/useNotifications'

export default defineNuxtPlugin((nuxtApp: any) => {
  const notifications = useNotifications()

  // Vue runtime errors (component crashes)
  nuxtApp.vueApp.config.errorHandler = (error: unknown, instance: any, info: string) => {
    // Log to console in development
    if (process.dev) {
      console.error('[Vue Error]', info, error)
    }

    // Send to Sentry if available
    const $sentry = nuxtApp.$sentry
    $sentry?.captureException(error, {
      extra: {
        componentInfo: info,
        componentName: instance?.$options?.name,
      },
    })

    // Show user-friendly error notification
    notifications.error(
      'notifications.system.unexpectedError',
      'notifications.system.unexpectedErrorHint',
      {
        labelKey: 'common.retry',
        handler: () => window.location.reload(),
      }
    )
  }

  // Nuxt lifecycle hooks (SSR hydration, navigation errors)
  nuxtApp.hook('vue:error', (error: unknown, instance: any, info: string) => {
    const $sentry = nuxtApp.$sentry
    $sentry?.captureException(error, {
      extra: {
        lifecycleInfo: info,
        componentName: instance?.$options?.name,
      },
    })
  })

  // Unhandled promise rejections (client-side only)
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason

      // Log to console in development
      if (process.dev) {
        console.error('[Unhandled Rejection]', error)
      }

      // Send to Sentry if available
      const $sentry = nuxtApp.$sentry
      $sentry?.captureException(error)

      // Check if it's a network-related error
      if (isNetworkError(error)) {
        notifications.warn(
          'notifications.network.offline',
          'notifications.network.offlineHint'
        )
      } else {
        notifications.error(
          'notifications.system.unexpectedError',
          'notifications.system.unexpectedErrorHint'
        )
      }

      // Prevent the default browser error handling
      event.preventDefault()
    })

    // Global error handler for synchronous errors
    window.addEventListener('error', (event) => {
      const $sentry = nuxtApp.$sentry
      $sentry?.captureException(event.error)
    })
  }
})

/**
 * Check if an error is network-related
 */
function isNetworkError(error: unknown): boolean {
  if (!error) return false

  const errorObj = error as Error
  const message = errorObj.message?.toLowerCase() || ''
  const name = errorObj.name?.toLowerCase() || ''

  return (
    name === 'typeerror' ||
    name === 'aborterror' ||
    name === 'timeouterror' ||
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('timeout') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('econnreset')
  )
}