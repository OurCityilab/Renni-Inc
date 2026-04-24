import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
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
import type { Department, Task, TaskPriority, TaskStatus } from '~/types/models'

// `blocked` must only be reachable via setBlocked (which requires a
// non-empty blockedBy reason). Callers that use setStatus or clearBlocked
// are statically prevented from using 'blocked' as a target.
type NonBlockedStatus = Exclude<TaskStatus, 'blocked'>

// Input shape for the Timeline Planner's task builder.
// Required: title, ownerEmail, deliverableId. Every task must belong to a
// deliverable so Tasks → Timeline → Deliverables → Playbook roll up
// consistently. Other fields are optional; the composable normalizes
// empties to null before writing.
export interface NewTaskInput {
  title: string
  ownerEmail: string
  deliverableId: string
  ownerUid?: string | null
  department?: Department | null
  playbookChapter?: number | null
  startDate?: string | null
  dueDate?: string | null
  dependsOn?: string[]
  definitionOfDone?: string | null
  priority?: TaskPriority | null
  notes?: string | null
  assignedByEmail?: string | null
  status?: TaskStatus
}

function byDueThenTitle(a: Task, b: Task) {
  const ad = a.dueDate || '9999-12-31'
  const bd = b.dueDate || '9999-12-31'
  if (ad !== bd) return ad < bd ? -1 : 1
  return a.title.localeCompare(b.title)
}

export function useTasks() {
  // Resolve $firebase lazily — it's provided by a client-only plugin.
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'tasks')
  }

  async function listByOwner(ownerUid: string): Promise<Task[]> {
    const q = query(col(), where('ownerUid', '==', ownerUid))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Task).sort(byDueThenTitle)
  }

  async function listByDeliverable(deliverableId: string): Promise<Task[]> {
    const q = query(col(), where('deliverableId', '==', deliverableId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Task).sort(byDueThenTitle)
  }

  // Reactive — primary driver for the Tasks page. Subscription starts in
  // onMounted so $firebase isn't touched on SSR (client-only plugin).
  function watchByOwner(ownerUid: string) {
    const data = ref<Task[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      const q = query(col(), where('ownerUid', '==', ownerUid))
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs.map((d) => d.data() as Task).sort(byDueThenTitle)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Reactive-id variant so the deliverable detail page can rebind when the
  // route param changes without remounting. Subscription starts in onMounted
  // (SSR-safe) and rebinds on id change.
  function watchByDeliverable(idSource: MaybeRefOrGetter<string>) {
    const data = ref<Task[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      watch(
        () => toValue(idSource),
        (id) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = []
          loading.value = true
          if (!id) {
            loading.value = false
            return
          }
          const q = query(col(), where('deliverableId', '==', id))
          unsub = onSnapshot(q, (snap) => {
            data.value = snap.docs.map((d) => d.data() as Task).sort(byDueThenTitle)
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

  // Chief/admin view. Reads the whole collection and lets the caller filter —
  // fine at current volume. Subscription starts in onMounted (SSR-safe).
  function watchAll() {
    const data = ref<Task[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      unsub = onSnapshot(col(), (snap) => {
        data.value = snap.docs.map((d) => d.data() as Task).sort(byDueThenTitle)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // --- mutations ---

  // General status move. Cannot set 'blocked' — callers must go through
  // setBlocked (which requires a reason). Always clears a stale `blockedBy`
  // when moving out of the blocked state.
  async function setStatus(id: string, status: NonBlockedStatus) {
    const ref = doc(db(), 'tasks', id)
    const now = new Date().toISOString()
    await updateDoc(ref, { status, blockedBy: null, updatedAt: now })
  }

  // Dedicated blocked transition — `blockedBy` is required so the reason is
  // visible to the team.
  async function setBlocked(id: string, blockedBy: string) {
    const ref = doc(db(), 'tasks', id)
    const now = new Date().toISOString()
    await updateDoc(ref, {
      status: 'blocked' as TaskStatus,
      blockedBy,
      updatedAt: now
    })
  }

  async function clearBlocked(
    id: string,
    nextStatus: NonBlockedStatus = 'in_progress'
  ) {
    const ref = doc(db(), 'tasks', id)
    const now = new Date().toISOString()
    await updateDoc(ref, {
      status: nextStatus,
      blockedBy: null,
      updatedAt: now
    })
  }

  // --- Timeline Planner helpers ---
  // Rules allow create / full-field updates for admin / Co-CEO / any chief.
  // UI gates the buttons on the same check.

  async function create(input: NewTaskInput) {
    const now = new Date().toISOString()
    const title = input.title.trim()
    if (!title) throw new Error('title is required')
    const ownerEmail = input.ownerEmail.trim().toLowerCase()
    if (!ownerEmail) throw new Error('ownerEmail is required')
    // Every task must belong to a deliverable. This keeps the operating
    // flow intact: Deliverable → Tasks → Timeline → Departments → Playbook.
    const deliverableId = (input.deliverableId || '').trim()
    if (!deliverableId) throw new Error('deliverableId is required')
    const payload = {
      title,
      ownerEmail,
      ownerUid: input.ownerUid ?? null,
      department: input.department ?? null,
      deliverableId,
      playbookChapter: input.playbookChapter ?? null,
      startDate: input.startDate || null,
      dueDate: input.dueDate || null,
      dependsOn: input.dependsOn ?? [],
      definitionOfDone: input.definitionOfDone?.trim() || null,
      priority: input.priority ?? null,
      notes: input.notes?.trim() || null,
      assignedByEmail: input.assignedByEmail?.trim().toLowerCase() || null,
      status: input.status ?? ('not_started' as TaskStatus),
      progress: 0,
      blockedBy: null,
      createdAt: now,
      updatedAt: now
    }
    const created = await addDoc(col(), payload)
    return created.id
  }

  // Planning-field updates — intended for chiefs/admin through the Timeline
  // Planner. Doesn't touch status; use setStatus/setBlocked/clearBlocked.
  async function updatePlanning(id: string, patch: Partial<NewTaskInput>) {
    const ref = doc(db(), 'tasks', id)
    const now = new Date().toISOString()
    const write: Record<string, unknown> = { updatedAt: now }
    const copyables: Array<keyof NewTaskInput> = [
      'title',
      'ownerEmail',
      'ownerUid',
      'department',
      'deliverableId',
      'playbookChapter',
      'startDate',
      'dueDate',
      'dependsOn',
      'definitionOfDone',
      'priority',
      'notes',
      'assignedByEmail'
    ]
    for (const k of copyables) {
      if (k in patch) write[k] = (patch as Record<string, unknown>)[k] ?? null
    }
    await updateDoc(ref, write)
  }

  return {
    listByOwner,
    listByDeliverable,
    watchByOwner,
    watchByDeliverable,
    watchAll,
    setStatus,
    setBlocked,
    clearBlocked,
    create,
    updatePlanning
  }
}
