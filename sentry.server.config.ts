/**
 * Sentry Server Configuration
 * @see docs: https://docs.sentry.io/platforms/javascript/guides/nuxt/
 */
import * as Sentry from '@sentry/nuxt'

// Only initialize on server
if (process.server) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Performance: sample 10% of transactions in prod
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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
      Sentry.extraErrorDataIntegration(),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Ignore common server errors
    ignoreErrors: [
      // Network errors
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      // Redis errors
      'Redis connection failed',
    ],
  })
}

/**
 * Scrub Polish PII from strings
 */
function scrubPII(text: string): string {
  if (typeof text !== 'string') return text

  return text
    // PESEL: 11 consecutive digits
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

// Export for use in server code
export { Sentry }
