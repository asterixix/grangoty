import { defineEventHandler, getQuery, createError } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import { scrapers } from '~/server/scrapers/real-scrapers'
import { scraperLogger } from '~/server/utils/logger'

/**
 * Performance monitoring and alerting API
 * Monitors scraper performance and sends alerts for failures
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const action = query.action as string || 'monitor'

  try {
    switch (action) {
      case 'monitor':
        return await getPerformanceMonitor()
      case 'alerts':
        return await getAlerts()
      case 'trends':
        return await getPerformanceTrends()
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
    }, 'Performance monitoring API error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

/**
 * Get comprehensive performance monitoring dashboard
 */
async function getPerformanceMonitor(): Promise<any> {
  const monitor: any = {
    timestamp: new Date().toISOString(),
    system: {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeScrapers: 0,
      failingScrapers: 0
    },
    scrapers: [],
    alerts: [],
    recommendations: []
  }

  for (const scraper of scrapers) {
    if (!scraper.enabled) continue

    const status = await grantStorage.getScraperStatus(scraper.source)
    const metrics = await getScraperMetrics(scraper.source)

    const scraperMonitor = {
      source: scraper.source,
      status: status?.error ? 'failing' : 'healthy',
      lastRun: status?.lastRun,
      lastSuccess: status?.lastRun && !status?.error,
      grantsCount: status?.count || 0,
      errorCount: status?.error ? 1 : 0,
      performance: metrics,
      alerts: [] as any[]
    }

    if (metrics.avgResponseTime > 30000) { // 30 seconds
      scraperMonitor.alerts.push({
        level: 'warning',
        type: 'slow_response',
        message: `Slow response time: ${metrics.avgResponseTime}ms`,
        threshold: 30000
      })
    }

    if (metrics.failureRate > 0.5) { // 50% failure rate
      scraperMonitor.alerts.push({
        level: 'critical',
        type: 'high_failure_rate',
        message: `High failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`,
        threshold: 50
      })
    }

    if (metrics.lastRunDays > 7) { // No run in 7 days
      scraperMonitor.alerts.push({
        level: 'warning',
        type: 'stale_data',
        message: `No successful run in ${metrics.lastRunDays} days`,
        threshold: 7
      })
    }

    monitor.scrapers.push(scraperMonitor)

    if (scraperMonitor.status === 'failing') {
      monitor.system.failingScrapers++
    } else {
      monitor.system.activeScrapers++
    }

    monitor.alerts.push(...scraperMonitor.alerts)
  }

  if (monitor.system.failingScrapers > monitor.system.activeScrapers / 2) {
    monitor.system.status = 'critical'
  } else if (monitor.system.failingScrapers > 0 || monitor.alerts.some((a: any) => a.level === 'critical')) {
    monitor.system.status = 'warning'
  }

  if (monitor.system.failingScrapers > 0) {
    monitor.recommendations.push({
      priority: 'high',
      type: 'investigate_failures',
      message: `${monitor.system.failingScrapers} scrapers are failing. Check error logs and fix issues.`,
      action: 'Review scraper logs and update selectors if websites changed'
    })
  }

  if (monitor.alerts.some((a: any) => a.type === 'slow_response')) {
    monitor.recommendations.push({
      priority: 'medium',
      type: 'optimize_performance',
      message: 'Some scrapers have slow response times.',
      action: 'Implement caching, reduce request frequency, or optimize selectors'
    })
  }

  return monitor
}

/**
 * Get active alerts requiring attention
 */
async function getAlerts(): Promise<any> {
  const alerts: any = {
    timestamp: new Date().toISOString(),
    critical: [],
    warning: [],
    info: [],
    summary: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0
    }
  }

  for (const scraper of scrapers) {
    if (!scraper.enabled) continue

    const status = await grantStorage.getScraperStatus(scraper.source)
    const metrics = await getScraperMetrics(scraper.source)

    if (metrics.failureRate > 0.8) {
      alerts.critical.push({
        source: scraper.source,
        type: 'scraper_down',
        message: `${scraper.source} has ${(metrics.failureRate * 100).toFixed(1)}% failure rate`,
        timestamp: new Date().toISOString(),
        priority: 'immediate'
      })
    }

    if (metrics.lastRunDays > 14) {
      alerts.critical.push({
        source: scraper.source,
        type: 'data_stale',
        message: `${scraper.source} has not run successfully in ${metrics.lastRunDays} days`,
        timestamp: new Date().toISOString(),
        priority: 'high'
      })
    }

    if (metrics.avgResponseTime > 60000) { // 1 minute
      alerts.warning.push({
        source: scraper.source,
        type: 'performance_degraded',
        message: `${scraper.source} response time is ${metrics.avgResponseTime}ms`,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      })
    }

    if (metrics.grantsCount === 0 && metrics.lastRunDays < 7) {
      alerts.warning.push({
        source: scraper.source,
        type: 'no_data',
        message: `${scraper.source} returned no grants in last successful run`,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      })
    }

    if (status?.error && metrics.lastRunDays < 1) {
      alerts.info.push({
        source: scraper.source,
        type: 'transient_error',
        message: `${scraper.source} had a recent error but may recover`,
        timestamp: new Date().toISOString(),
        priority: 'low'
      })
    }
  }

  alerts.summary.critical = alerts.critical.length
  alerts.summary.warning = alerts.warning.length
  alerts.summary.info = alerts.info.length
  alerts.summary.total = alerts.summary.critical + alerts.summary.warning + alerts.summary.info

  return alerts
}

/**
 * Get performance trends over time
 */
async function getPerformanceTrends(): Promise<any> {
  const trends: any = {
    timestamp: new Date().toISOString(),
    period: '7days',
    scrapers: {}
  }

  for (const scraper of scrapers) {
    if (!scraper.enabled) continue

    const metrics = await getScraperMetrics(scraper.source)
    const status = await grantStorage.getScraperStatus(scraper.source)

    trends.scrapers[scraper.source] = {
      current: {
        grantsCount: metrics.grantsCount,
        successRate: ((1 - metrics.failureRate) * 100).toFixed(1) + '%',
        avgResponseTime: metrics.avgResponseTime,
        lastRun: status?.lastRun
      },
      trend: {
        direction: 'stable',
        change: 0,
        period: '7days'
      },
      health: metrics.lastRunDays > 7 ? 'stale' :
               metrics.failureRate > 0.5 ? 'unhealthy' : 'healthy'
    }
  }

  return trends
}

/**
 * Get metrics for a specific scraper
 * In a real implementation, these would be calculated from historical data
 * For now, we'll provide basic metrics based on current status
 */
async function getScraperMetrics(source: string): Promise<any> {
  const status = await grantStorage.getScraperStatus(source)

  const lastRunDays = status?.lastRun ?
    Math.floor((Date.now() - new Date(status.lastRun).getTime()) / (1000 * 60 * 60 * 24)) : 999

  return {
    grantsCount: status?.count || 0,
    lastRunDays,
    avgResponseTime: 5000, // Mock value - would be calculated from logs
    failureRate: status?.error ? 1 : 0, // Mock value - would be calculated from history
    totalRuns: 1, // Mock value
    successRuns: status?.error ? 0 : 1 // Mock value
  }
}