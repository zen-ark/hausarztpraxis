import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let clientSingleton: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (clientSingleton) return clientSingleton

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.supabaseServiceRoleKey

  if (!url || !key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase server configuration missing. Check runtimeConfig.'
    })
  }

  clientSingleton = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'clinic_demo' }
  })

  return clientSingleton
}


