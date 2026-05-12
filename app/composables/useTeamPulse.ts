import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore'
import {
  onMounted,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from 'vue'
import { useAuthStore } from '~/stores/auth'
import type {
  Department,
  TeamPulseCycle,
  TeamPulseResponse,
  TeamPulseSummary
} from '~/types/models'

export type NewTeamPulseCycleInput = Pick<
  TeamPulseCycle,
  | 'title'
  | 'description'
  | 'opensAt'
  | 'closesAt'
  | 'departmentsIncluded'
  | 'includeSelfRatings'
  | 'includePeerRatings'
  | 'includeLeaderRatings'
>

export type TeamPulseResponseInput = Omit<
  TeamPulseResponse,
  'id' | 'submittedAt' | 'updatedAt'
>

function byUpdatedAtDesc<T extends { updatedAt?: string; createdAt?: string }>(
  a: T,
  b: T
) {
  return (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '')
}

export function teamPulseResponseId(
  cycleId: string,
  raterUid: string,
  rateeUid: string
): string {
  return `${cycleId}_${raterUid}_${rateeUid}`.replace(/[^\w.-]/g, '_')
}

export function useTeamPulse() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function cyclesCol() {
    return collection(db(), 'teamPulseCycles')
  }
  function responsesCol() {
    return collection(db(), 'teamPulseResponses')
  }
  function summariesCol() {
    return collection(db(), 'teamPulseSummaries')
  }

  function watchCycles() {
    const data = ref<TeamPulseCycle[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      unsub = onSnapshot(cyclesCol(), (snap) => {
        data.value = snap.docs
          .map((d) => d.data() as TeamPulseCycle)
          .sort(byUpdatedAtDesc)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchOpenCycles() {
    const data = ref<TeamPulseCycle[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      const q = query(cyclesCol(), where('status', '==', 'open'))
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs
          .map((d) => d.data() as TeamPulseCycle)
          .sort(byUpdatedAtDesc)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchCycle(cycleIdSource: MaybeRefOrGetter<string>) {
    const data = ref<TeamPulseCycle | null>(null)
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = null
          loading.value = true
          if (!cycleId) {
            loading.value = false
            return
          }
          unsub = onSnapshot(doc(db(), 'teamPulseCycles', cycleId), (snap) => {
            data.value = snap.exists() ? (snap.data() as TeamPulseCycle) : null
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  async function createCycle(input: NewTeamPulseCycleInput) {
    const auth = useAuthStore()
    if (!auth.user || !auth.profile) throw new Error('Sign in to create a cycle.')
    const now = new Date().toISOString()
    const id = `pulse-${Date.now()}`
    const payload: TeamPulseCycle = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      status: 'draft',
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      departmentsIncluded: input.departmentsIncluded,
      calibrationOnly: true,
      includeSelfRatings: input.includeSelfRatings,
      includePeerRatings: input.includePeerRatings,
      includeLeaderRatings: input.includeLeaderRatings,
      createdByUid: auth.user.uid,
      createdByEmail: auth.profile.email,
      createdAt: now,
      updatedAt: now
    }
    await setDoc(doc(db(), 'teamPulseCycles', id), payload)
    return id
  }

  async function openCycle(cycleId: string) {
    await updateDoc(doc(db(), 'teamPulseCycles', cycleId), {
      status: 'open',
      updatedAt: new Date().toISOString()
    })
  }

  async function closeCycle(cycleId: string) {
    await updateDoc(doc(db(), 'teamPulseCycles', cycleId), {
      status: 'closed',
      updatedAt: new Date().toISOString()
    })
  }

  async function markSummarized(cycleId: string) {
    await updateDoc(doc(db(), 'teamPulseCycles', cycleId), {
      status: 'summarized',
      updatedAt: new Date().toISOString()
    })
  }

  async function submitResponse(input: TeamPulseResponseInput) {
    const now = new Date().toISOString()
    const id = teamPulseResponseId(input.cycleId, input.raterUid, input.rateeUid)
    const payload: TeamPulseResponse = {
      id,
      ...input,
      submittedAt: now,
      updatedAt: now
    }
    await setDoc(doc(db(), 'teamPulseResponses', id), payload, { merge: true })
  }

  function watchMyResponses(cycleIdSource: MaybeRefOrGetter<string>) {
    const auth = useAuthStore()
    const data = ref<TeamPulseResponse[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = []
          loading.value = true
          if (!auth.user || !cycleId) {
            loading.value = false
            return
          }
          const q = query(
            responsesCol(),
            where('cycleId', '==', cycleId),
            where('raterUid', '==', auth.user.uid)
          )
          unsub = onSnapshot(q, (snap) => {
            data.value = snap.docs.map((d) => d.data() as TeamPulseResponse)
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchMySummary(cycleIdSource: MaybeRefOrGetter<string>) {
    const auth = useAuthStore()
    const data = ref<TeamPulseSummary | null>(null)
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = null
          loading.value = true
          if (!auth.user || !cycleId) {
            loading.value = false
            return
          }
          const q = query(
            summariesCol(),
            where('cycleId', '==', cycleId),
            where('scope', '==', 'student'),
            where('subjectUid', '==', auth.user.uid)
          )
          unsub = onSnapshot(q, (snap) => {
            data.value = (snap.docs[0]?.data() as TeamPulseSummary | undefined) ?? null
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchDepartmentSummaries(
    cycleIdSource: MaybeRefOrGetter<string>,
    departmentSource: MaybeRefOrGetter<Department>
  ) {
    const data = ref<TeamPulseSummary[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => [toValue(cycleIdSource), toValue(departmentSource)] as const,
        ([cycleId, department]) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = []
          loading.value = true
          if (!cycleId || !department) {
            loading.value = false
            return
          }
          unsub = onSnapshot(
            doc(db(), 'teamPulseSummaries', `${cycleId}_${department}`),
            (snap) => {
              data.value = snap.exists() ? [snap.data() as TeamPulseSummary] : []
              loading.value = false
            }
          )
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchCompanySummary(cycleIdSource: MaybeRefOrGetter<string>) {
    const data = ref<TeamPulseSummary | null>(null)
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = null
          loading.value = true
          if (!cycleId) {
            loading.value = false
            return
          }
          unsub = onSnapshot(
            doc(db(), 'teamPulseSummaries', `${cycleId}_company`),
            (snap) => {
              data.value = snap.exists() ? (snap.data() as TeamPulseSummary) : null
              loading.value = false
            }
          )
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchAdminResponses(cycleIdSource: MaybeRefOrGetter<string>) {
    const data = ref<TeamPulseResponse[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = []
          loading.value = true
          if (!cycleId) {
            loading.value = false
            return
          }
          const q = query(responsesCol(), where('cycleId', '==', cycleId))
          unsub = onSnapshot(q, (snap) => {
            data.value = snap.docs.map((d) => d.data() as TeamPulseResponse)
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  function watchAdminSummaries(cycleIdSource: MaybeRefOrGetter<string>) {
    const data = ref<TeamPulseSummary[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null
    onMounted(() => {
      watch(
        () => toValue(cycleIdSource),
        (cycleId) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = []
          loading.value = true
          if (!cycleId) {
            loading.value = false
            return
          }
          const q = query(summariesCol(), where('cycleId', '==', cycleId))
          unsub = onSnapshot(q, (snap) => {
            data.value = snap.docs
              .map((d) => d.data() as TeamPulseSummary)
              .sort((a, b) => a.scope.localeCompare(b.scope))
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  async function saveSummaries(summaries: TeamPulseSummary[]) {
    const batch = writeBatch(db())
    for (const summary of summaries) {
      batch.set(doc(db(), 'teamPulseSummaries', summary.id), summary)
    }
    await batch.commit()
  }

  return {
    watchCycles,
    watchOpenCycles,
    watchCycle,
    createCycle,
    openCycle,
    closeCycle,
    markSummarized,
    submitResponse,
    watchMyResponses,
    watchMySummary,
    watchDepartmentSummaries,
    watchCompanySummary,
    watchAdminResponses,
    watchAdminSummaries,
    saveSummaries
  }
}
