// Shared draft persistence for the Financial Literacy Lab modules —
// wraps useWorksheetResponse with the module's worksheetType key and
// hydrates the page's reactive answers on mount. Same manual-save
// posture as the Personal Brand worksheets.
import { onMounted, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useWorksheetResponse } from '~/composables/useWorksheetResponse'
import { FINANCIAL_LITERACY_DRAFT_PREFIX } from '~/data/studio/financialLiteracyLab'

export function useFinancialLiteracyDraft(slug: string, answers: Record<string, string>) {
  const studioAuth = useStudioAuthStore()
  const studentUid = studioAuth.profile?.uid ?? ''
  const responseApi = useWorksheetResponse()
  const draftType = `${FINANCIAL_LITERACY_DRAFT_PREFIX}${slug}`

  const draftId = ref<string | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const savedAt = ref<string | null>(null)
  const error = ref<string | null>(null)

  onMounted(async () => {
    if (!studentUid) return
    loading.value = true
    try {
      const existing = await responseApi.loadLatest(studentUid, draftType)
      if (existing) {
        draftId.value = existing.id
        for (const key of Object.keys(answers)) {
          const value = existing.rawInputs[key]
          if (typeof value === 'string') answers[key] = value
        }
      }
    } catch {
      error.value =
        "Couldn't load your saved answers. You can still work — just save again when you're done."
    } finally {
      loading.value = false
    }
  })

  async function save() {
    if (saving.value) return
    saving.value = true
    error.value = null
    try {
      draftId.value = await responseApi.saveDraft(studentUid, draftType, { ...answers }, draftId.value)
      savedAt.value = new Date().toLocaleTimeString()
    } catch {
      error.value = "Couldn't save your answers. Check your connection and try again."
    } finally {
      saving.value = false
    }
  }

  return { studentUid, loading, saving, savedAt, error, save }
}
