import { defineEventHandler, getQuery, createError } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { scraperLogger } from '~/server/utils/logger'

/**
 * Debug and monitoring API for scrapers
 * Provides health dashboard, error tracking, and performance metrics
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const action = query.action as string || 'health'

  try {
    switch (action) {
      case 'health':
        return await getScraperHealth()
      case 'metrics':
        return await getScraperMetrics()
      case 'errors':
        return await getErrorTracking()
      case 'debug':
        return await getDebugInfo()
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unknown action: ${action}`
        })
    }
  } catch (error) {
    scraperLogger.error({
      error: error instanceof Error ? error.message : String(error),
      action
    }, 'Debug API error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

/**
 * Get comprehensive scraper health dashboard
 */
async function getScraperHealth(): Promise<any> {
  const health: any = {
    timestamp: new Date().toISOString(),
    overall: {
      status: 'healthy',
      totalScrapers: scrapers.length,
      activeScrapers: 0,
      failingScrapers: 0,
      lastUpdated: new Date().toISOString()
    },
    scrapers: []
  }

  for (const scraper of scrapers) {
    const status = await grantStorage.getScraperStatus(scraper.source)
    const isHealthy = !status?.error
    const lastRun = status?.lastRun ? new Date(status.lastRun) : null
    const isRecent = lastRun && (Date.now() - lastRun.getTime()) < 24 * 60 * 60 * 1000 // 24 hours

    const scraperHealth = {
      source: scraper.source,
      enabled: scraper.enabled,
      status: isHealthy ? 'healthy' : 'failing',
      lastRun: status?.lastRun,
      lastRunSuccess: !status?.error,
      errorCount: status?.error ? 1 : 0,
      grantsCount: status?.count || 0,
      isRecent: !!isRecent,
      lastError: status?.error
    }

    health.scrapers.push(scraperHealth)

    if (scraper.enabled) {
      health.overall.activeScrapers++
      if (!isHealthy) {
        health.overall.failingScrapers++
      }
    }
  }

  // Determine overall status
  if (health.overall.failingScrapers > health.overall.activeScrapers / 2) {
    health.overall.status = 'critical'
  } else if (health.overall.failingScrapers > 0) {
    health.overall.status = 'warning'
  }

  return health
}

/**
 * Get detailed scraper performance metrics
 */
async function getScraperMetrics(): Promise<any> {
  const metrics: any = {
    timestamp: new Date().toISOString(),
    totalGrants: 0,
    grantsBySource: {},
    grantsByCategory: {},
    grantsByRegion: {},
    recentActivity: [],
    performanceStats: {
      averageGrantsPerScraper: 0,
      mostProductiveSource: '',
      leastProductiveSource: '',
      totalSuccessfulRuns: 0,
      totalFailedRuns: 0
    }
  }

  // Get all grants for analysis
  const allGrants = await grantStorage.getAllGrants()
  metrics.totalGrants = allGrants.length

  // Analyze grants by source
  const sourceStats = new Map<string, number>()
  for (const grant of allGrants) {
    sourceStats.set(grant.source, (sourceStats.get(grant.source) || 0) + 1)
  }
  metrics.grantsBySource = Object.fromEntries(sourceStats)

  // Analyze grants by category
  const categoryStats = new Map<string, number>()
  for (const grant of allGrants) {
    if (grant.category) {
      categoryStats.set(grant.category, (categoryStats.get(grant.category) || 0) + 1)
    }
  }
  metrics.grantsByCategory = Object.fromEntries(categoryStats)

  // Analyze grants by region
  const regionStats = new Map<string, number>()
  for (const grant of allGrants) {
    if (grant.region) {
      regionStats.set(grant.region, (regionStats.get(grant.region) || 0) + 1)
    }
  }
  metrics.grantsByRegion = Object.fromEntries(regionStats)

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentGrants = allGrants
    .filter(grant => new Date(grant.scrapedAt) > sevenDaysAgo)
    .sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime())
    .slice(0, 50)

  metrics.recentActivity = recentGrants.map(grant => ({
    id: grant.id,
    source: grant.source,
    title: grant.title,
    scrapedAt: grant.scrapedAt
  }))

  // Performance stats
  const sources = Array.from(sourceStats.entries())
  if (sources.length > 0) {
    metrics.performanceStats.averageGrantsPerScraper = metrics.totalGrants / sources.length

    const [mostProductive] = [...sources].sort(([,a], [,b]) => b - a)
    const [leastProductive] = [...sources].sort(([,a], [,b]) => a - b)

    if (mostProductive) metrics.performanceStats.mostProductiveSource = mostProductive[0]
    if (leastProductive) metrics.performanceStats.leastProductiveSource = leastProductive[0]
  }

  // Count successful/failed runs
  for (const scraper of scrapers) {
    const status = await grantStorage.getScraperStatus(scraper.source)
    if (status) {
      if (status.error) {
        metrics.performanceStats.totalFailedRuns++
      } else {
        metrics.performanceStats.totalSuccessfulRuns++
      }
    }
  }

  return metrics
}

/**
 * Get error tracking and analysis
 */
async function getErrorTracking(): Promise<any> {
  const errorTracking: any = {
    timestamp: new Date().toISOString(),
    errorSummary: {
      totalErrors: 0,
      errorsBySource: {},
      errorsByType: {},
      recentErrors: []
    },
    errorPatterns: [],
    recommendations: []
  }

  // Collect errors from all scrapers
  for (const scraper of scrapers) {
    const status = await grantStorage.getScraperStatus(scraper.source)
    if (status?.error) {
      errorTracking.errorSummary.totalErrors++
      errorTracking.errorSummary.errorsBySource[scraper.source] =
        (errorTracking.errorSummary.errorsBySource[scraper.source] || 0) + 1

      // Classify error types
      const errorType = classifyErrorType(status.error)
      errorTracking.errorSummary.errorsByType[errorType] =
        (errorTracking.errorSummary.errorsByType[errorType] || 0) + 1

      // Recent errors (last 24 hours)
      if (status.lastRun) {
        const lastRun = new Date(status.lastRun)
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        if (lastRun > oneDayAgo) {
          errorTracking.errorSummary.recentErrors.push({
            source: scraper.source,
            error: status.error,
            timestamp: status.lastRun,
            type: errorType
          })
        }
      }
    }
  }

  // Generate recommendations based on error patterns
  const errorsByType = errorTracking.errorSummary.errorsByType
  if (errorsByType['network'] > 3) {
    errorTracking.recommendations.push({
      type: 'network',
      priority: 'high',
      message: 'Multiple network errors detected. Check internet connectivity and target site availability.',
      action: 'Verify network connection and site accessibility'
    })
  }

  if (errorsByType['rate_limit'] > 2) {
    errorTracking.recommendations.push({
      type: 'rate_limit',
      priority: 'high',
      message: 'Rate limiting detected. Implement longer delays between requests.',
      action: 'Increase request intervals and implement exponential backoff'
    })
  }

  if (errorsByType['parse'] > 5) {
    errorTracking.recommendations.push({
      type: 'parse',
      priority: 'medium',
      message: 'Multiple parsing errors. Website structure may have changed.',
      action: 'Update selectors and review scraping logic'
    })
  }

  return errorTracking
}

/**
 * Get comprehensive debug information
 */
async function getDebugInfo(): Promise<any> {
  const debug: any = {
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    },
    scrapers: [],
    database: {
      totalGrants: 0,
      storageType: 'redis',
      connectionStatus: 'unknown'
    },
    logs: {
      recentErrors: [],
      logLevel: process.env.LOG_LEVEL || 'info'
    }
  }

  // Scraper debug info
  for (const scraper of scrapers) {
    const status = await grantStorage.getScraperStatus(scraper.source)
    debug.scrapers.push({
      source: scraper.source,
      enabled: scraper.enabled,
      url: (scraper as any).baseUrl || (scraper as any).url,
      lastRun: status?.lastRun,
      lastError: status?.error,
      grantsCount: status?.count || 0,
      config: {
        maxRetries: 3,
        timeout: 30000
      }
    })
  }

  // Database debug info
  try {
    const totalGrants = await grantStorage.getGrantsCount()
    debug.database.totalGrants = totalGrants
    debug.database.connectionStatus = 'connected'
  } catch (error) {
    debug.database.connectionStatus = 'error'
    debug.database.error = error instanceof Error ? error.message : String(error)
  }

  return debug
}

/**
 * Classify error types for analysis
 */
function classifyErrorType(error: string): string {
  const lowerError = error.toLowerCase()

  if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connection')) {
    return 'network'
  }
  if (lowerError.includes('rate') || lowerError.includes('429') || lowerError.includes('too many')) {
    return 'rate_limit'
  }
  if (lowerError.includes('timeout')) {
    return 'timeout'
  }
  if (lowerError.includes('parse') || lowerError.includes('selector') || lowerError.includes('element')) {
    return 'parse'
  }
  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return 'not_found'
  }
  if (lowerError.includes('500') || lowerError.includes('502') || lowerError.includes('503')) {
    return 'server_error'
  }
  if (lowerError.includes('auth') || lowerError.includes('401') || lowerError.includes('403')) {
    return 'auth'
  }

  return 'unknown'
}