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
  let mgetResult: unknown = null
  let mgetType: string = 'n/a'

  if (grantIds.length > 0) {
    const firstId = grantIds[0]
    const firstKey = REDIS_KEYS.GRANT_BY_ID(firstId)

    firstGrant = await redis.get(firstKey)

    const mgetRaw = await redis.mget<unknown[]>(firstKey)
    mgetResult = mgetRaw[0]
    mgetType = typeof mgetResult

    if (mgetResult !== null && mgetType === 'object') {
      mgetType = 'object (already parsed by @upstash/redis auto-deserialize)'
    }
  }

  return {
    hasEnvVars,
    grantsIndexCount: count,
    firstGrantId: grantIds[0] ?? null,
    firstKey: grantIds.length > 0 ? REDIS_KEYS.GRANT_BY_ID(grantIds[0]) : null,
    firstGrantViaGet: firstGrant
      ? (typeof firstGrant === 'string' ? JSON.parse(firstGrant as string) : firstGrant)
      : null,
    firstGrantViaMget: mgetResult,
    mgetValueType: mgetType,
  }
})
