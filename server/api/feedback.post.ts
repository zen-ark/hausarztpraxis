import { getSupabaseServer } from '~/server/utils/supabaseServer'

type FeedbackBody = { message_id: string; helpful: boolean; note?: string }

export default defineEventHandler(async (event) => {
  const body = await readBody<FeedbackBody>(event)
  if (!body?.message_id || typeof body.helpful !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const supa = getSupabaseServer()
  const { error } = await supa
    .from('feedback')
    .insert({ message_id: body.message_id, helpful: body.helpful, note: body.note ?? null })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})


