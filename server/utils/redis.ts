import { Redis } from '@upstash/redis'
import type { Grant } from '~/app/types'

/**
 * Redis client singleton for Upstash
 */
let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('Upstash Redis credentials not configured. Using in-memory fallback.')
      // Return a mock client for development
      return createMockRedis()
    }

    redis = new Redis({
      url,
      token,
    })
  }
  return redis
}

/**
 * Mock Redis client for development without Upstash
 */
function createMockRedis(): Redis {
  const store = new Map<string, any>()
  
  return {
    get: async (key: string) => store.get(key) || null,
    set: async (key: string, value: any, _options?: any) => {
      store.set(key, value)
      return 'OK'
    },
    del: async (key: string) => {
      store.delete(key)
      return 1
    },
    keys: async (pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return Array.from(store.keys()).filter(k => regex.test(k))
    },
    lpush: async (key: string, ...values: any[]) => {
      const list = store.get(key) || []
      store.set(key, [...values.reverse(), ...list])
      return list.length + values.length
    },
    lrange: async (key: string, start: number, stop: number) => {
      const list = store.get(key) || []
      return list.slice(start, stop === -1 ? undefined : stop + 1)
    },
    ltrim: async (key: string, start: number, stop: number) => {
      const list = store.get(key) || []
      store.set(key, list.slice(start, stop === -1 ? undefined : stop + 1))
      return 'OK'
    },
    llen: async (key: string) => {
      const list = store.get(key) || []
      return list.length
    },
    sadd: async (key: string, ...members: any[]) => {
      const set = store.get(key) || new Set()
      members.forEach(m => set.add(m))
      store.set(key, set)
      return members.length
    },
    smembers: async (key: string) => {
      const set = store.get(key) || new Set()
      return Array.from(set)
    },
    sismember: async (key: string, member: any) => {
      const set = store.get(key) || new Set()
      return set.has(member) ? 1 : 0
    },
    expire: async (_key: string, _ttl: number) => 1,
    ttl: async (_key: string) => -1,
    incr: async (key: string) => {
      const val = (store.get(key) || 0) + 1
      store.set(key, val)
      return val
    },
    decr: async (key: string) => {
      const val = (store.get(key) || 0) - 1
      store.set(key, val)
      return val
    },
    hset: async (key: string, field: string, value: any) => {
      const hash = store.get(key) || {}
      hash[field] = value
      store.set(key, hash)
      return 1
    },
    hget: async (key: string, field: string) => {
      const hash = store.get(key) || {}
      return hash[field] || null
    },
    hgetall: async (key: string) => {
      return store.get(key) || {}
    },
    hdel: async (key: string, ...fields: string[]) => {
      const hash = store.get(key) || {}
      fields.forEach(f => delete hash[f])
      store.set(key, hash)
      return fields.length
    },
    json: {
      get: async (key: string) => store.get(key) || null,
      set: async (key: string, _path: string, value: any) => {
        store.set(key, value)
        return 'OK'
      },
    },
    scan: async (_cursor: number, _options?: any) => {
      const keys = Array.from(store.keys())
      return [0, keys]
    },
    ping: async () => 'PONG',
  } as unknown as Redis
}

// Grant storage keys
export const REDIS_KEYS = {
  GRANTS_LIST: 'grants:all',
  GRANTS_BY_SOURCE: (source: string) => `grants:source:${source}`,
  GRANTS_BY_CATEGORY: (category: string) => `grants:category:${category}`,
  GRANTS_BY_REGION: (region: string) => `grants:region:${region}`,
  GRANT_BY_ID: (id: string) => `grant:${id}`,
  GRANTS_INDEX: 'grants:index',
  SCRAPER_STATUS: 'scraper:status',
  SCRAPER_LAST_RUN: (source: string) => `scraper:last_run:${source}`,
  TRANSLATIONS_CACHE: (text: string, targetLang: string) => `translation:${targetLang}:${Buffer.from(text).toString('base64').slice(0, 50)}`,
} as const

/**
 * Grant Storage Service using Redis
 */
export class GrantStorage {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  /**
   * Store a grant in Redis
   */
  async saveGrant(grant: Grant): Promise<void> {
    const grantJson = JSON.stringify(grant)
    
    // Store grant by ID
    await this.redis.set(REDIS_KEYS.GRANT_BY_ID(grant.id), grantJson)
    
    // Add to indexes
    await this.redis.sadd(REDIS_KEYS.GRANTS_LIST, grant.id)
    await this.redis.sadd(REDIS_KEYS.GRANTS_BY_SOURCE(grant.source), grant.id)
    
    if (grant.category) {
      await this.redis.sadd(REDIS_KEYS.GRANTS_BY_CATEGORY(grant.category), grant.id)
    }
    
    if (grant.region) {
      await this.redis.sadd(REDIS_KEYS.GRANTS_BY_REGION(grant.region), grant.id)
    }
  }

  /**
   * Get a grant by ID
   */
  async getGrantById(id: string): Promise<Grant | null> {
    const grantJson = await this.redis.get(REDIS_KEYS.GRANT_BY_ID(id))
    if (!grantJson) return null
    
    try {
      return JSON.parse(grantJson as string) as Grant
    } catch {
      return null
    }
  }

  /**
   * Get all grants
   */
  async getAllGrants(): Promise<Grant[]> {
    const grantIds = await this.redis.smembers(REDIS_KEYS.GRANTS_LIST) as string[]
    if (!grantIds || grantIds.length === 0) return []
    
    const grants: Grant[] = []
    for (const id of grantIds) {
      const grant = await this.getGrantById(id)
      if (grant) grants.push(grant)
    }
    
    return grants
  }

  /**
   * Get grants by source
   */
  async getGrantsBySource(source: string): Promise<Grant[]> {
    const grantIds = await this.redis.smembers(REDIS_KEYS.GRANTS_BY_SOURCE(source)) as string[]
    if (!grantIds || grantIds.length === 0) return []
    
    const grants: Grant[] = []
    for (const id of grantIds) {
      const grant = await this.getGrantById(id)
      if (grant) grants.push(grant)
    }
    
    return grants
  }

  /**
   * Delete a grant
   */
  async deleteGrant(id: string): Promise<void> {
    const grant = await this.getGrantById(id)
    if (!grant) return
    
    // Remove from indexes
    await this.redis.del(REDIS_KEYS.GRANT_BY_ID(id))
    await this.redis.srem?.(REDIS_KEYS.GRANTS_LIST, id) || await this.redis.del(`${REDIS_KEYS.GRANTS_LIST}:${id}`)
    
    if (grant.source) {
      await this.redis.srem?.(REDIS_KEYS.GRANTS_BY_SOURCE(grant.source), id) || await this.redis.del(`${REDIS_KEYS.GRANTS_BY_SOURCE(grant.source)}:${id}`)
    }
    
    if (grant.category) {
      await this.redis.srem?.(REDIS_KEYS.GRANTS_BY_CATEGORY(grant.category), id) || await this.redis.del(`${REDIS_KEYS.GRANTS_BY_CATEGORY(grant.category)}:${id}`)
    }
    
    if (grant.region) {
      await this.redis.srem?.(REDIS_KEYS.GRANTS_BY_REGION(grant.region), id) || await this.redis.del(`${REDIS_KEYS.GRANTS_BY_REGION(grant.region)}:${id}`)
    }
  }

  /**
   * Search grants by query
   */
  async searchGrants(query: string): Promise<Grant[]> {
    const allGrants = await this.getAllGrants()
    const queryLower = query.toLowerCase()
    
    return allGrants.filter(grant => 
      grant.title?.toLowerCase().includes(queryLower) ||
      grant.description?.toLowerCase().includes(queryLower) ||
      grant.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    )
  }

  /**
   * Get grants count
   */
  async getGrantsCount(): Promise<number> {
    const grantIds = await this.redis.smembers(REDIS_KEYS.GRANTS_LIST) as string[]
    return grantIds?.length || 0
  }

  /**
   * Save scraper status
   */
  async saveScraperStatus(source: string, status: { lastRun: string; count: number; error?: string }): Promise<void> {
    await this.redis.set(REDIS_KEYS.SCRAPER_LAST_RUN(source), JSON.stringify(status))
  }

  /**
   * Get scraper status
   */
  async getScraperStatus(source: string): Promise<{ lastRun: string; count: number; error?: string } | null> {
    const statusJson = await this.redis.get(REDIS_KEYS.SCRAPER_LAST_RUN(source))
    if (!statusJson) return null
    
    try {
      return JSON.parse(statusJson as string)
    } catch {
      return null
    }
  }

  /**
   * Cache translation
   */
  async cacheTranslation(text: string, targetLang: string, translation: string): Promise<void> {
    const key = REDIS_KEYS.TRANSLATIONS_CACHE(text, targetLang)
    await this.redis.set(key, translation, { ex: 86400 * 7 }) // Cache for 7 days
  }

  /**
   * Get cached translation
   */
  async getCachedTranslation(text: string, targetLang: string): Promise<string | null> {
    const key = REDIS_KEYS.TRANSLATIONS_CACHE(text, targetLang)
    return await this.redis.get(key) as string | null
  }
}

// Export singleton instance
export const grantStorage = new GrantStorage()
