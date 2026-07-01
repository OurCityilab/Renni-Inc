// Client composable for Our City Studio's AI Sherpa endpoint
// (server/api/studio/ai/sherpa.post.ts). Mirrors the auth-token
// pattern used by MarketEvidenceCritiquePanel.vue: acquire a fresh
// Firebase ID token, send it as a bearer header, never send it (or
// any Firebase config) anywhere but our own Nuxt endpoint.
import { useAuthStore } from '~/stores/auth'
import type { SherpaResponse } from '~/types/studio/models'

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

export function useAiSherpa() {
  const authStore = useAuthStore()

  async function askBrandSherpa(input: BrandSherpaInput): Promise<SherpaApiResponse> {
    const user = authStore.user
    if (!user) {
      throw new Error('Sign in again to use the Sherpa.')
    }
    const idToken = await user.getIdToken()
    return await $fetch<SherpaApiResponse>('/api/studio/ai/sherpa', {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
      body: { mode: 'brand-sherpa', ...input }
    })
  }

  return { askBrandSherpa }
}
