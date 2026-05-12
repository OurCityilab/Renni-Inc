// Client-side wrapper for the /api/ai/review-coaching endpoint.
//
// Posture (do not relax):
//   - No autosend. Only runs when generateCoaching(...) is called.
//   - Output stays in local component state — never persisted, never
//     written to Firestore.
//   - The deterministic payload is the source of truth; this
//     composable never mutates it.

import { ref } from 'vue'
import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload
} from '~/types/aiReviewReports'

interface AiReviewCoachingErrorEnvelope {
  code: string
  message: string
}

export function useAiReviewCoaching() {
  const coaching = ref<AiReviewCoachingOutput | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorCode = ref<string | null>(null)

  async function generateCoaching(payload: AiReviewReportPayload) {
    if (loading.value) return
    loading.value = true
    error.value = null
    errorCode.value = null
    try {
      // Bearer token must match the existing AI endpoints'
      // expectation. The auth store hydrates Firebase auth on the
      // client, so we can pull a fresh id token here.
      const { $firebase } = useNuxtApp()
      const user = $firebase.auth.currentUser
      if (!user) {
        error.value = 'Sign in again to generate review coaching.'
        return
      }
      const idToken = await user.getIdToken()
      const result = await $fetch<AiReviewCoachingOutput>(
        '/api/ai/review-coaching',
        {
          method: 'POST',
          headers: { authorization: `Bearer ${idToken}` },
          body: { payload }
        }
      )
      coaching.value = result
    } catch (e: unknown) {
      // h3 createError() envelopes surface via $fetch.data. Render a
      // friendly message; never include raw model output.
      const data = (e as { data?: AiReviewCoachingErrorEnvelope }).data
      errorCode.value = data?.code ?? null
      error.value =
        data?.message ||
        (e instanceof Error ? e.message : 'Could not generate coaching.')
    } finally {
      loading.value = false
    }
  }

  function clearCoaching() {
    coaching.value = null
    error.value = null
    errorCode.value = null
  }

  return {
    coaching,
    loading,
    error,
    errorCode,
    generateCoaching,
    clearCoaching
  }
}
