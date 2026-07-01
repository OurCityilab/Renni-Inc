import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore'
import { onMounted, onScopeDispose, ref } from 'vue'
import type { Mission, MissionProgressStatus, StudentMissionProgress } from '~/types/studio/models'

function byOrder(a: Mission, b: Mission) {
  return a.order - b.order
}

export function progressDocId(studentUid: string, missionId: string): string {
  return `${studentUid}__${missionId}`
}

export function useStudioMission() {
  function db() {
    return useNuxtApp().$firebase.db
  }

  // Missions are seeded content (small, single cohort-wide set for
  // Phase 1) and rules only allow filtering with a single equality
  // clause, so we filter server-side on `active` and sort by `order`
  // client-side rather than adding a composite index — same pattern
  // as useTasks.ts's byDueThenTitle.
  function watchActiveMissions() {
    const data = ref<Mission[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      const q = query(collection(db(), 'missions'), where('active', '==', true))
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs.map((d) => d.data() as Mission).sort(byOrder)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchProgress(studentUid: string) {
    const data = ref<StudentMissionProgress[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      const q = query(
        collection(db(), 'studentMissionProgress'),
        where('studentUid', '==', studentUid)
      )
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs.map((d) => d.data() as StudentMissionProgress)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // `existing` must be the caller's already-subscribed progress doc (or
  // null) for this mission. The security rules lock updates to a
  // status/startedAt/submittedAt/updatedAt allowlist, so we only send
  // createdAt on first write and only touch startedAt/submittedAt when
  // the transition actually needs them — sending unchanged values would
  // still pass (unchanged fields don't show up in Firestore's
  // diff().affectedKeys()), but this keeps intent explicit.
  async function setMissionStatus(
    existing: StudentMissionProgress | null,
    studentUid: string,
    missionId: string,
    status: MissionProgressStatus
  ) {
    const now = new Date().toISOString()
    const ref = doc(db(), 'studentMissionProgress', progressDocId(studentUid, missionId))
    const patch: Record<string, unknown> = {
      studentUid,
      missionId,
      status,
      updatedAt: now
    }
    if (!existing) patch.createdAt = now
    if (status === 'in_progress' && !existing?.startedAt) patch.startedAt = now
    if (status === 'complete') patch.submittedAt = now
    await setDoc(ref, patch, { merge: true })
  }

  return { watchActiveMissions, watchProgress, setMissionStatus }
}
