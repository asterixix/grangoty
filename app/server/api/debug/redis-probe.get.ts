import { defineEventHandler } from 'h3'
import { getRedisClient, REDIS_KEYS } from '~/server/utils/redis'

export default defineEventHandler(async () => {
  const redis = getRedisClient()

  const hasEnvVars = !!(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  )

  const grantIds = await redis.smembers(REDIS_KEYS.GRANTS_LIST) as string[]
  const count = grantIds.length

  let firstGrant: unknown = null
  if (grantIds.length > 0) {
    firstGrant = await redis.get(REDIS_KEYS.GRANT_BY_ID(grantIds[0]))
  }

  return {
    hasEnvVars,
    grantsIndexCount: count,
    firstGrantId: grantIds[0] ?? null,
    firstGrantPreview: firstGrant
      ? (typeof firstGrant === 'string' ? JSON.parse(firstGrant) : firstGrant)
      : null,
  }
})
