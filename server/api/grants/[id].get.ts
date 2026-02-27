import { defineEventHandler, createError } from 'h3'
import { grantStorage } from '~/server/utils/redis'
import type { Grant } from '~/app/types'

export default defineEventHandler(async (event): Promise<Grant> => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Grant ID is required'
    })
  }

  const grant = await grantStorage.getGrantById(id)

  if (!grant) {
    throw createError({
      statusCode: 404,
      message: 'Grant not found'
    })
  }

  return grant
})
