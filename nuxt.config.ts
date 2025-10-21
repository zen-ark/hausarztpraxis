// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    // Server-only
    supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE,
    openaiApiKey: process.env.OPENAI_API_KEY,
    datasetName: process.env.NUXT_DATASET_NAME || 'Hausarztpraxis Thun – Demo',
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
    }
  }
})
