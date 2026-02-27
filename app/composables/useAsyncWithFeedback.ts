import { ref, readonly, type Ref } from 'vue'
import type { NotificationAction } from '~/app/types/notifications'

// Import useNotifications explicitly for TypeScript
import { useNotifications } from './useNotifications'

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Error classification helper
 */
function classifyError(e: Error): string {
  if (e.name === 'AbortError') return 'notifications.network.timeout'
  if (e.message?.toLowerCase().includes('fetch')) return 'notifications.network.offlineHint'
  if (e.message?.includes('404')) return 'notifications.grants.notFound'
  if (e.message?.includes('403')) return 'notifications.auth.forbidden'
  if (e.message?.includes('401')) return 'notifications.auth.sessionExpired'
  if (e.message?.includes('503')) return 'errors.serviceUnavailable'
  return 'notifications.system.unexpectedErrorHint'
}

/**
 * Check if error is retryable (network/timeout errors)
 */
function isRetryableError(e: Error): boolean {
  const retryableNames = ['AbortError', 'TimeoutError', 'NetworkError']
  const retryableMessages = ['fetch', 'network', 'timeout', 'econnrefused', 'econnreset']

  const name = e.name?.toLowerCase() || ''
  const message = e.message?.toLowerCase() || ''

  return (
    retryableNames.some(n => name.includes(n.toLowerCase())) ||
    retryableMessages.some(m => message.includes(m))
  )
}

export interface AsyncOptions<T> {
  /** Callback on successful execution */
  onSuccess?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** i18n key for success notification */
  successKey?: string
  /** i18n key for error notification */
  errorKey?: string
  /** Number of retry attempts (default: 3) */
  retries?: number
  /** Base delay between retries in ms (default: 1000, exponential backoff) */
  retryDelayMs?: number
  /** Whether to show success toast (default: false) */
  showSuccessToast?: boolean
  /** Action button for error notification */
  errorAction?: NotificationAction
}

export interface AsyncWithFeedbackReturn<T> {
  /** Execute the async function */
  execute: () => Promise<T | null>
  /** Whether the function is currently executing */
  isLoading: Readonly<Ref<boolean>>
  /** The last error that occurred */
  error: Readonly<Ref<Error | null>>
  /** The data returned from the function */
  data: Readonly<Ref<T | null>>
  /** Current retry attempt number */
  attempt: Readonly<Ref<number>>
  /** Reset state */
  reset: () => void
}

/**
 * Universal async wrapper with loading states, retries, and user feedback
 * @see docs: https://www.reddit.com/r/vuejs/comments/1jjatqe/question_on_error_handling_in_vue/
 */
export function useAsyncWithFeedback<T>(
  fn: () => Promise<T>,
  options: AsyncOptions<T> = {}
): AsyncWithFeedbackReturn<T> {
  const notifications = useNotifications()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const data = ref<T | null>(null)
  const attempt = ref(0)

  const {
    retries = 3,
    retryDelayMs = 1000,
    showSuccessToast = false,
  } = options

  async function execute(): Promise<T | null> {
    isLoading.value = true
    error.value = null
    attempt.value = 0

    while (attempt.value <= retries) {
      try {
        const result = await fn()
        data.value = result

        // Show success notification if requested
        if (showSuccessToast && options.successKey) {
          notifications.success(options.successKey)
        }

        // Call success callback
        options.onSuccess?.(result)
        isLoading.value = false
        return result
      } catch (e) {
        attempt.value++
        const err = e as Error

        // Check if we should retry
        if (attempt.value <= retries && isRetryableError(err)) {
          // Notify user of retry with exponential backoff
          notifications.info('notifications.network.retrying', {
            attempt: attempt.value,
          })

          // Exponential backoff: 1s, 2s, 4s, etc.
          await sleep(retryDelayMs * Math.pow(2, attempt.value - 1))
          continue
        }

        // All retries exhausted or non-retryable error
        error.value = err
        isLoading.value = false

        // Show error notification
        notifications.error(
          options.errorKey ?? 'notifications.system.unexpectedError',
          classifyError(err),
          options.errorAction
        )

        // Call error callback
        options.onError?.(err)
        return null
      }
    }

    isLoading.value = false
    return null
  }

  function reset(): void {
    isLoading.value = false
    error.value = null
    data.value = null
    attempt.value = 0
  }

  return {
    execute,
    isLoading: readonly(isLoading),
    error: readonly(error),
    data: readonly(data),
    attempt: readonly(attempt),
    reset,
  }
}

/**
 * Simpler version for one-off async operations without retries
 */
export function useAsyncSimple<T>(
  fn: () => Promise<T>,
  options: Omit<AsyncOptions<T>, 'retries' | 'retryDelayMs'> = {}
): AsyncWithFeedbackReturn<T> {
  return useAsyncWithFeedback(fn, { ...options, retries: 0 })
}
