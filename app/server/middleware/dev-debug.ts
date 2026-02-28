import { defineEventHandler, getRequestURL, getHeaders } from 'h3'
import { apiLogger } from '../utils/logger'

/**
 * Development debugging middleware
 * Adds detailed logging and debugging headers in development mode
 */
export default defineEventHandler((event) => {
  const isDev = process.env.NODE_ENV !== 'production'
  const url = getRequestURL(event)
  
  if (!isDev) return
  
  const start = Date.now()
  const headers = getHeaders(event)
  
  apiLogger.debug({
    method: event.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: {
      'user-agent': headers['user-agent'],
      'accept-language': headers['accept-language'],
      referer: headers.referer
    }
  }, 'Request started')
  
  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    
    apiLogger.debug({
      method: event.method,
      path: url.pathname,
      statusCode: event.node.res.statusCode,
      durationMs: duration
    }, 'Request completed')
  })
  
  event.node.res.setHeader('X-Debug-Mode', 'enabled')
  event.node.res.setHeader('X-Request-ID', crypto.randomUUID())
})
