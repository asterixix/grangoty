import { defineEventHandler } from 'h3'
import { getRedisClient } from '../utils/redis'
import { scrapers } from '../scrapers/real-scrapers'
import { apiLogger } from '../utils/logger'

export default defineEventHandler(async () => {
  const checks = {
    redis: false,
    scrapers: 0,
    timestamp: new Date().toISOString()
  }
  
  try {
    const redis = getRedisClient()
    const pingResult = await redis.ping()
    checks.redis = pingResult === 'PONG'
  } catch (error) {
    apiLogger.warn({ error: 'Redis connection failed' }, 'Health check warning')
  }
  
  checks.scrapers = scrapers.filter(s => s.enabled).length
  
  const healthy = checks.redis
  
  return {
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown'
  }
})
