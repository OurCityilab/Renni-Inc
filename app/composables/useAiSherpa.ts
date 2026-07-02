// Client composable for Our City Studio's AI Sherpa endpoint
// (server/api/studio/ai/sherpa.post.ts). Mirrors the auth-token
// pattern used by MarketEvidenceCritiquePanel.vue: acquire a fresh
// Firebase ID token, send it as a bearer header, never send it (or
// any Firebase config) anywhere but our own Nuxt endpoint.
import { useAuthStore } from '~/stores/auth'
import type {
  BrandCoachResponse,
  SherpaAudience,
  SherpaOutputType,
  SherpaResponse
} from '~/types/studio/models'

export interface BrandSherpaInput {
  whatYouCareAbout: string
  whyItMatters: string
  whoYouWantToHelp: string
  whatPeopleAskYouFor: string
  futureYouAreBuilding: string
}

export interface SherpaApiResponse {
  sherpa: SherpaResponse
  mock: boolean
}

export interface BrandCoachInput {
  worksheet: string
  selfWords: string
  starExample: string
  audience: SherpaAudience
  outputType: SherpaOutputType
}

export interface BrandCoachApiResponse {
  sherpa: BrandCoachResponse
  mock: boolean
}

export function useAiSherpa() {
  const authStore = useAuthStore()

  async function idToken(): Promise<string> {
    const user = authStore.user
    if (!user) {
      throw new Error('Sign in again to use the Sherpa.')
    }
    return await user.getIdToken()
  }

  async function askBrandSherpa(input: BrandSherpaInput): Promise<SherpaApiResponse> {
    return await $fetch<SherpaApiResponse>('/api/studio/ai/sherpa', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await idToken()}` },
      body: { mode: 'brand-sherpa', ...input }
    })
  }

  async function askBrandCoach(input: BrandCoachInput): Promise<BrandCoachApiResponse> {
    return await $fetch<BrandCoachApiResponse>('/api/studio/ai/sherpa', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await idToken()}` },
      body: { mode: 'brand-coach', ...input }
    })
  }

  return { askBrandSherpa, askBrandCoach }
}
