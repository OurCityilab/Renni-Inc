import { ref } from 'vue'
import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload
} from '~/types/aiReviewReports'

interface SnapshotResponse {
  id: string
  createdAt: string
}

export function useAiReviewSnapshots() {
  const saving = ref(false)
  const error = ref<string | null>(null)
  const saved = ref<SnapshotResponse | null>(null)

  async function saveSnapshot(args: {
    payload: AiReviewReportPayload
    coaching?: AiReviewCoachingOutput | null
    copyBlock?: string | null
  }) {
    if (saving.value) return
    saving.value = true
    error.value = null
    saved.value = null
    try {
      const { $firebase } = useNuxtApp()
      const user = $firebase.auth.currentUser
      if (!user) {
        error.value = 'Sign in again to save a snapshot.'
        return
      }
      const idToken = await user.getIdToken()
      saved.value = await $fetch<SnapshotResponse>('/api/ai/review-snapshot', {
        method: 'POST',
        headers: { authorization: `Bearer ${idToken}` },
        body: {
          payload: args.payload,
          coaching: args.coaching ?? null,
          copyBlock: args.copyBlock ?? null
        }
      })
    } catch (e: unknown) {
      const data = (e as { data?: { message?: string } }).data
      error.value =
        data?.message ||
        (e instanceof Error ? e.message : 'Could not save snapshot.')
    } finally {
      saving.value = false
    }
  }

  return { saving, error, saved, saveSnapshot }
}
