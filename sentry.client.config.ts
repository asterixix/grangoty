/**
 * Sentry Client Configuration
 * @see docs: https://docs.sentry.io/platforms/javascript/guides/nuxt/
 */
import * as Sentry from '@sentry/nuxt'

// Only initialize on client
if (process.client) {
  const config = useRuntimeConfig()

  Sentry.init({
    dsn: config.public.sentryDsn as string,
    environment: config.public.siteUrl?.includes('vercel.app') ? 'production' : 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Performance: sample 10% of transactions in prod
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Full replay on every error
    replaysOnErrorSampleRate: 1.0,

    // 5% of all sessions for replay
    replaysSessionSampleRate: 0.05,

    // Privacy: scrub PII before sending
    beforeSend(event) {
      // Remove any Polish PESEL, NIP, email from error context
      if (event.request?.data) {
        event.request.data = scrubPII(event.request.data as string)
      }
      if (event.contexts?.user) {
        delete event.contexts.user.email
        delete event.contexts.user.username
      }
      return event
    },

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false, // Show text for debugging
        blockAllMedia: false,
        maskAllInputs: true, // ALWAYS mask inputs (GDPR)
      }),
      Sentry.browserTracingIntegration(),
      Sentry.extraErrorDataIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Ignore common non-critical errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Random errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // User cancelled
      'cancelled',
      'canceled',
      // Navigation
      'Navigation cancelled',
      'NavigationDuplicated',
    ],
  })
}

/**
 * Scrub Polish PII from strings
 * - PESEL: 11 digits
 * - NIP: 10 digits
 * - REGON: 9 or 14 digits
 * - Email addresses
 */
function scrubPII(text: string): string {
  if (typeof text !== 'string') return text

  return text
    // PESEL: 11 consecutive digits (birth date + random + checksum)
    .replace(/\b\d{11}\b/g, '[PESEL_REDACTED]')
    // NIP: 10 consecutive digits
    .replace(/\b\d{10}\b/g, '[NIP_REDACTED]')
    // REGON: 9 or 14 consecutive digits
    .replace(/\b\d{9}\b/g, '[REGON_REDACTED]')
    .replace(/\b\d{14}\b/g, '[REGON_REDACTED]')
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    // Phone numbers (Polish format)
    .replace(/(?:\+48|0048)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}/g, '[PHONE_REDACTED]')
}

// Export for use in composables
export { Sentry }
