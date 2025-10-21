// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon-animated.svg' }
      ]
    }
  },
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
  },
  // Add redirect from root to landing page
  nitro: {
    routeRules: {
      '/': { redirect: '/landingpage' }
    }
  }
})
