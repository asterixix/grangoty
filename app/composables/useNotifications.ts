import { ref, readonly } from 'vue'
import type { Notification, NotificationInput, NotificationLevel } from '~/types/notifications'

/**
 * Default auto-dismiss durations by notification level
 * Errors NEVER auto-dismiss to ensure users acknowledge them
 */
const DEFAULT_DURATIONS: Record<NotificationLevel, number> = {
  success: 3500,
  info: 5000,
  warning: 7000,
  error: 0, // errors NEVER auto-dismiss
}

/** Maximum number of visible notifications */
const MAX_VISIBLE = 4

/** Global notification queue - shared across all components */
const queue = ref<Notification[]>([])

/**
 * Generate a unique ID for notifications
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Core notification management composable
 * @see docs: https://blog.openreplay.com/vue-toast-notifications/
 */
export function useNotifications() {
  /**
   * Push a new notification to the queue
   * @returns The notification ID for later dismissal
   */
  function push(input: NotificationInput): string {
    const id = generateId()
    
    const notification: Notification = {
      ...input,
      id,
      persistent: input.persistent ?? input.level === 'error',
      dismissAfterMs: input.dismissAfterMs ?? DEFAULT_DURATIONS[input.level],
    }

    // Deduplicate identical messages
    const isDuplicate = queue.value.some(
      q => q.titleKey === input.titleKey && q.level === input.level
    )
    if (isDuplicate) {
      return id
    }

    // Cap queue at MAX_VISIBLE, drop oldest non-error notification
    if (queue.value.length >= MAX_VISIBLE) {
      const oldestNonErrorIndex = queue.value.findIndex(q => q.level !== 'error')
      if (oldestNonErrorIndex !== -1) {
        queue.value.splice(oldestNonErrorIndex, 1)
      }
    }

    queue.value.push(notification)

    // Set up auto-dismiss for non-persistent notifications
    if (!notification.persistent && notification.dismissAfterMs! > 0) {
      setTimeout(() => dismiss(id), notification.dismissAfterMs)
    }

    return id
  }

  /**
   * Show a success notification (auto-dismisses after 3.5s)
   */
  function success(
    titleKey: string,
    params?: Record<string, string | number>
  ): string {
    return push({
      level: 'success',
      context: 'system',
      titleKey,
      params,
      persistent: false,
    })
  }

  /**
   * Show an error notification (persists until dismissed)
   */
  function error(
    titleKey: string,
    messageKey?: string,
    action?: Notification['action']
  ): string {
    return push({
      level: 'error',
      context: 'system',
      titleKey,
      messageKey,
      persistent: true,
      action,
    })
  }

  /**
   * Show a warning notification (auto-dismisses after 7s)
   */
  function warn(
    titleKey: string,
    messageKey?: string
  ): string {
    return push({
      level: 'warning',
      context: 'system',
      titleKey,
      messageKey,
      persistent: false,
    })
  }

  /**
   * Show an info notification (auto-dismisses after 5s)
   */
  function info(
    titleKey: string,
    params?: Record<string, string | number>
  ): string {
    return push({
      level: 'info',
      context: 'system',
      titleKey,
      params,
      persistent: false,
    })
  }

  /**
   * Dismiss a specific notification by ID
   */
  function dismiss(id: string): void {
    queue.value = queue.value.filter(n => n.id !== id)
  }

  /**
   * Dismiss all notifications
   */
  function dismissAll(): void {
    queue.value = []
  }

  /**
   * Update an existing notification (useful for progress updates)
   */
  function update(id: string, updates: Partial<Notification>): boolean {
    const index = queue.value.findIndex(n => n.id === id)
    if (index !== -1) {
      queue.value[index] = { ...queue.value[index], ...updates }
      return true
    }
    return false
  }

  return {
    queue: readonly(queue),
    push,
    success,
    error,
    warn,
    info,
    dismiss,
    dismissAll,
    update,
  }
}
