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
    // Executive Advisor V1 feature flag. The advisor endpoint is
    // server-only in Pass 1 (no UI wiring). Default OFF — the endpoint
    // returns a generic unavailable error when the flag is missing or
    // false. Provider config is shared with the market-evidence
    // critique endpoint above (same API key, base URL, model).
    executiveAdvisorEnabled:
      process.env.NUXT_EXECUTIVE_ADVISOR_ENABLED === 'true',
    // Section Engine Feedback V1 feature flag. Layer 3 of the
    // section-engine pattern (see app/types/sectionEngines.ts) is
    // exposed via /api/ai/section-articulation-feedback. Default OFF
    // — the endpoint returns ai_disabled when the flag is missing or
    // false. Pass 1 ships the SHELL only: even with the flag on,
    // the endpoint returns a deterministic safe-shape response and
    // does not call a provider.
    sectionEngineFeedbackEnabled:
      process.env.NUXT_SECTION_ENGINE_FEEDBACK_ENABLED === 'true',
    // AI Leadership Review Coaching V1 feature flag. The endpoint at
    // /api/ai/review-coaching is read-only and never approves or
    // mutates work — it consumes the deterministic
    // AiReviewReportPayload the in-app review panels already build
    // and returns coaching language for company / department /
    // chapter scopes. Default OFF — the endpoint returns ai_disabled
    // when the flag is missing, false, or the provider API key is
    // unset. Provider config is shared with the existing AI
    // endpoints (same API key, base URL, model).
    aiReviewCoachingEnabled:
      process.env.NUXT_AI_REVIEW_COACHING_ENABLED === 'true',
    // Our City Studio AI Sherpa V1 — server-only. Reuses the same
    // Anthropic provider config as the Renni AI endpoints above
    // (aiCritiqueApiKey/BaseUrl/Model); Studio gets its own daily
    // call limit so a busy Studio cohort day never eats into Renni's
    // budget or vice versa. Parsed (with a safe default) by
    // server/utils/studioAiRateLimit.ts's resolveStudioAiDailyLimit —
    // kept as a raw string here so the parsing itself stays testable
    // without booting Nuxt.
    studioAiDailyLimit: process.env.NUXT_STUDIO_AI_DAILY_LIMIT || '',
    public: {
      // Safe to ship to the browser. Firebase web config is not a secret.
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID
      },
      // Customer Profile Builder beta feature flag. Default OFF.
      // When OFF, no Customer Profile Builder UI renders and the
      // existing chip-pick Customer Segments QuickStart remains the
      // active student-facing path. When ON (set
      // NUXT_CUSTOMER_PROFILE_BUILDER_ENABLED=true), the builder
      // appears below the chip-pick QuickStart on the BMC
      // customer-segments section as an opt-in beta panel. Lives on
      // `runtimeConfig.public` so the client can read it.
      customerProfileBuilderEnabled:
        process.env.NUXT_CUSTOMER_PROFILE_BUILDER_ENABLED === 'true'
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
