import { getSupabaseServer } from '~/server/utils/supabaseServer'

let cachedDatasetId: string | null = null

export async function ensureDatasetId(): Promise<string> {
  if (cachedDatasetId) return cachedDatasetId

  const config = useRuntimeConfig()
  const datasetName = config.datasetName || 'Hausarztpraxis Thun – Demo'

  const supa = getSupabaseServer()
  const { data, error } = await supa
    .from('datasets')
    .select('id')
    .eq('name', datasetName)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  if (!data?.id) {
    throw createError({ statusCode: 404, statusMessage: `Dataset not found: ${datasetName}` })
  }

  cachedDatasetId = data.id
  return cachedDatasetId
}


