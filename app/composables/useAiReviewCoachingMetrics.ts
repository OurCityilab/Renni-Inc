import { ref } from 'vue'
import type { AiReviewCoachingMetrics } from '~~/server/utils/aiReviewCoachingMetrics'

export function useAiReviewCoachingMetrics() {
  const metrics = ref<AiReviewCoachingMetrics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refreshMetrics() {
    loading.value = true
    error.value = null
    try {
      const { $firebase } = useNuxtApp()
      const user = $firebase.auth.currentUser
      if (!user) {
        error.value = 'Sign in again to view metrics.'
        return
      }
      const idToken = await user.getIdToken()
      metrics.value = await $fetch<AiReviewCoachingMetrics>(
        '/api/ai/review-coaching-metrics',
        { headers: { authorization: `Bearer ${idToken}` } }
      )
    } catch (e: unknown) {
      error.value =
        (e as { data?: { message?: string } }).data?.message ||
        (e instanceof Error ? e.message : 'Could not load metrics.')
    } finally {
      loading.value = false
    }
  }

  return { metrics, loading, error, refreshMetrics }
}
