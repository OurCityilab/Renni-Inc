// Draft persistence for Lab worksheet modules, backed by the existing
// worksheetResponses collection. The current Firestore rules already
// allow students to create their own responses and update the
// [rawInputs, aiQuestions, aiOutputs, selectedOutput, version,
// updatedAt] fields — no rule changes needed.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where
} from 'firebase/firestore'

export function useWorksheetResponse() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'worksheetResponses')
  }

  // Equality-only query — needs no composite index.
  async function loadLatest(
    studentUid: string,
    worksheetType: string
  ): Promise<{ id: string; rawInputs: Record<string, unknown> } | null> {
    const snap = await getDocs(
      query(
        col(),
        where('studentUid', '==', studentUid),
        where('worksheetType', '==', worksheetType),
        limit(1)
      )
    )
    const first = snap.docs[0]
    if (!first) return null
    const data = first.data()
    return { id: first.id, rawInputs: (data.rawInputs ?? {}) as Record<string, unknown> }
  }

  async function saveDraft(
    studentUid: string,
    worksheetType: string,
    rawInputs: Record<string, string>,
    existingId: string | null
  ): Promise<string> {
    const now = new Date().toISOString()
    if (existingId) {
      await updateDoc(doc(db(), 'worksheetResponses', existingId), {
        rawInputs,
        updatedAt: now
      })
      return existingId
    }
    const created = await addDoc(col(), {
      studentUid,
      worksheetType,
      missionId: null,
      rawInputs,
      aiQuestions: [],
      aiOutputs: {},
      selectedOutput: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    })
    return created.id
  }

  return { loadLatest, saveDraft }
}
