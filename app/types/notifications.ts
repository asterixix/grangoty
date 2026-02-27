/**
 * Notification types for the UX Error Handling System
 * @see docs: https://nuxt.com/docs/getting-started/error-handling
 */

export type NotificationLevel = 'success' | 'info' | 'warning' | 'error'

export type NotificationContext =
  | 'scrape'   // Background data fetch
  | 'save'     // Bookmarking a grant
  | 'filter'   // Filter applied/cleared
  | 'network'  // Connectivity issues
  | 'auth'     // Session/auth issues
  | 'rss'      // RSS export
  | 'system'   // Generic system events

export interface NotificationAction {
  labelKey: string
  handler: () => void
}

export interface Notification {
  id: string
  level: NotificationLevel
  context: NotificationContext
  titleKey: string            // i18n key
  messageKey?: string         // i18n key, optional detail
  params?: Record<string, string | number>  // i18n interpolation
  persistent: boolean         // false = auto-dismiss
  dismissAfterMs?: number     // default by level
  action?: NotificationAction
}

export interface NotificationInput {
  level: NotificationLevel
  context: NotificationContext
  titleKey: string
  messageKey?: string
  params?: Record<string, string | number>
  persistent?: boolean
  dismissAfterMs?: number
  action?: NotificationAction
}

// Error classification types
export type ErrorClassification =
  | 'timeout'
  | 'offline'
  | 'notFound'
  | 'forbidden'
  | 'unauthorized'
  | 'serverError'
  | 'unknown'

export interface ClassifiedError {
  classification: ErrorClassification
  messageKey: string
  hintKey: string
}
