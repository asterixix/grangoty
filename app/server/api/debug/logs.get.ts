import { defineEventHandler, getQuery, createError, getHeader } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { scraperLogger } from '~/server/utils/logger'
import type { ScraperLogs } from '~/app/types'

/**
 * Logs API for scraper debugging and monitoring
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const source = query.source as string
  const limit = parseInt(query.limit as string) || 50
  const level = query.level as 'error' | 'warn' | 'info' | 'debug' | 'all'

  // Basic security - only allow in development or with admin auth
  if (process.env.NODE_ENV === 'production') {
    // In production, require authentication or restrict access
    const auth = getHeader(event, 'authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required for logs in production'
      })
    }
  }

  try {
    const logs = await getScraperLogs(source, limit, level)
    return logs
  } catch (error) {
    scraperLogger.error({
      error: error instanceof Error ? error.message : String(error),
      source,
      limit,
      level
    }, 'Logs API error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve logs'
    })
  }
})

/**
 * Get scraper logs with filtering
 */
async function getScraperLogs(
  sourceFilter?: string,
  limit: number = 50,
  levelFilter?: 'error' | 'warn' | 'info' | 'debug' | 'all'
): Promise<ScraperLogs> {
  const logs: ScraperLogs = {
    timestamp: new Date().toISOString(),
    source: sourceFilter || 'all',
    level: levelFilter || 'all',
    limit,
    entries: []
  }

  // In a real implementation, you would query your logging system
  // For now, we'll simulate recent log entries based on scraper status

  const now = new Date()

  for (const scraper of scrapers) {
    if (sourceFilter && scraper.source !== sourceFilter) continue

    const status = await grantStorage.getScraperStatus(scraper.source)

    // Generate simulated log entries based on scraper status
    if (status) {
      logs.entries.push({
        timestamp: status.lastRun || now.toISOString(),
        level: status.error ? 'error' : 'info',
        source: scraper.source,
        message: status.error ? `Scraper failed: ${status.error}` : `Scraper completed successfully`,
        metadata: {
          grantsCount: status.count || 0,
          duration: 'unknown'
        }
      })

      // Add additional context logs
      if (status.error) {
        logs.entries.push({
          timestamp: new Date(new Date(status.lastRun || now).getTime() - 1000).toISOString(),
          level: 'warn',
          source: scraper.source,
          message: 'Scraper operation started',
          metadata: {}
        })
      }
    } else {
      // No status - scraper hasn't run yet
      logs.entries.push({
        timestamp: now.toISOString(),
        level: 'info',
        source: scraper.source,
        message: 'Scraper initialized but not yet executed',
        metadata: {
          status: 'pending'
        }
      })
    }
  }

  // Sort by timestamp (most recent first) and limit
  logs.entries.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  logs.entries = logs.entries.slice(0, limit)

  return logs
}