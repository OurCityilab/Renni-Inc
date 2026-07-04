import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { PortfolioArtifact, PortfolioArtifactType } from '~/types/studio/models'

function byNewest(a: PortfolioArtifact, b: PortfolioArtifact) {
  const at = a.updatedAt || a.createdAt
  const bt = b.updatedAt || b.createdAt
  if (at === bt) return 0
  return at > bt ? -1 : 1
}

export function usePortfolioArtifact() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'portfolioArtifacts')
  }

  function watchByStudent(studentUid: string) {
    const data = ref<PortfolioArtifact[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      const q = query(col(), where('studentUid', '==', studentUid))
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs.map((d) => d.data() as PortfolioArtifact).sort(byNewest)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Rules require coachStatus === 'draft' on create — every artifact
  // starts as a draft, whether hand-entered here or (later) saved by
  // a Sherpa tool.
  async function create(
    studentUid: string,
    artifactType: PortfolioArtifactType,
    title: string,
    content: string
  ) {
    const now = new Date().toISOString()
    const payload = {
      studentUid,
      artifactType,
      title: title.trim(),
      content,
      sourceWorksheetId: null,
      coachStatus: 'draft' as const,
      coachFeedback: null,
      exportedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
    const created = await addDoc(col(), payload)
    return created.id
  }

  // Re-saving a Lab plan (Budget Plan, Money Plan) should refresh the
  // student's existing draft instead of stacking duplicates. Matches
  // on type + title among the student's own docs (single-equality
  // query — no composite index needed) and only updates while the
  // artifact is still a student-owned 'draft'; once it's under review
  // or approved, a fresh draft is created so the audit trail stays
  // intact.
  async function createOrUpdateDraft(
    studentUid: string,
    artifactType: PortfolioArtifactType,
    title: string,
    content: string
  ) {
    const snap = await getDocs(query(col(), where('studentUid', '==', studentUid)))
    const existing = snap.docs
      .map((d) => ({ id: d.id, data: d.data() as PortfolioArtifact }))
      .filter(
        (a) =>
          a.data.artifactType === artifactType &&
          a.data.coachStatus === 'draft' &&
          a.data.title.trim() === title.trim()
      )
      .sort((a, b) => byNewest(a.data, b.data))[0]
    if (existing) {
      await updateContent(existing.id, title, content)
      return { id: existing.id, updated: true }
    }
    return { id: await create(studentUid, artifactType, title, content), updated: false }
  }

  // Rules lock title/content edits to coachStatus draft|needs_review —
  // once a coach approves an artifact it's read-only for the student.
  async function updateContent(id: string, title: string, content: string) {
    await updateDoc(doc(db(), 'portfolioArtifacts', id), {
      title: title.trim(),
      content,
      updatedAt: new Date().toISOString()
    })
  }

  async function submitForReview(id: string) {
    await updateDoc(doc(db(), 'portfolioArtifacts', id), {
      coachStatus: 'needs_review',
      updatedAt: new Date().toISOString()
    })
  }

  async function markExported(id: string) {
    await updateDoc(doc(db(), 'portfolioArtifacts', id), {
      exportedAt: new Date().toISOString()
    })
  }

  // Rules only allow deleting drafts — once submitted, the record
  // stays as the audit trail for coach review.
  async function remove(id: string) {
    await deleteDoc(doc(db(), 'portfolioArtifacts', id))
  }

  return {
    watchByStudent,
    create,
    createOrUpdateDraft,
    updateContent,
    submitForReview,
    markExported,
    remove
  }
}
