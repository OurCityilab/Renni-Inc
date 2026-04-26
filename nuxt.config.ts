import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  srcDir: 'app/',
  // Keep Nitro's server dir at the repo root (server/), not <srcDir>/server.
  // Without this, /api/auth/provision (at server/api/auth/provision.post.ts)
  // does not register and all /api/* requests 404.
  serverDir: 'server',
  // Same story for static assets: with srcDir set, Nuxt 4 compat resolves
  // dir.public relative to srcDir, which would look at app/public (does not
  // exist). Pin to the repo-root public/ so /templates/*.md is served.
  dir: {
    public: fileURLToPath(new URL('./public', import.meta.url))
  },
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    shim: false
  },
  app: {
    head: {
      title: 'Renni Command Center',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Renni Command Center — production environment for Renaissance students working on the Renni Inc. Brand and Operations Playbook.'
        },
        { name: 'theme-color', content: '#ea580c' }
      ]
    }
  },
  runtimeConfig: {
    // Server-only secrets. Nuxt does NOT send top-level runtimeConfig keys to the
    // browser — only keys under `public` are exposed. Never move these two into
    // `public`, and never import them from code under app/.
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    // AI Critique V1 — server-only provider config. Anthropic Messages
    // API by default; baseUrl/model are configurable so a compatible
    // host can be plugged in without code changes. The API key MUST
    // stay top-level. Nuxt only ships `runtimeConfig.public` to the
    // browser; these three never reach client code.
    aiCritiqueApiKey: process.env.NUXT_AI_CRITIQUE_API_KEY,
    aiCritiqueBaseUrl:
      process.env.NUXT_AI_CRITIQUE_BASE_URL || 'https://api.anthropic.com',
    aiCritiqueModel:
      process.env.NUXT_AI_CRITIQUE_MODEL || 'claude-haiku-4-5-20251001',
    public: {
      // Safe to ship to the browser. Firebase web config is not a secret.
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
      }
    }
  },
  nitro: {
    // `node-server` produces a generic Node.js build at .output/server/index.mjs,
    // which is what Firebase App Hosting (and Cloud Run) expects. Local `nuxt dev`
    // is preset-independent so this doesn't affect the dev loop. Override with
    // NITRO_PRESET=vercel at build time if we ever need a Vercel build again.
    preset: process.env.NITRO_PRESET || 'node-server'
  }
})
