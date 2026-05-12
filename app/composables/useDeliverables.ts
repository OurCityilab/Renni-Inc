import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  type QueryConstraint,
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
import type {
  Deliverable,
  DeliverableEvent,
  DeliverableStatus,
  Department,
  Role
} from '~/types/models'

type DeliverableFilters = {
  department?: Department
  ownerUid?: string
  approverUid?: string
  status?: DeliverableStatus
}

// Who acted. actorEmail is always required; actorRole is best-effort since
// some paths (instructor override on behalf of missing role data) may not have
// it. The event builder below only persists actorRole when it's present.
export type Actor = { email: string; role?: Role; uid?: string | null }

// V1 keeps Firestore queries flat. We filter on a single field and sort
// client-side rather than building composite indexes for every dashboard cut.
function filtersToConstraints(f: DeliverableFilters): QueryConstraint[] {
  const cs: QueryConstraint[] = []
  if (f.department) cs.push(where('department', '==', f.department))
  if (f.ownerUid) cs.push(where('ownerUid', '==', f.ownerUid))
  if (f.approverUid) cs.push(where('approverUid', '==', f.approverUid))
  if (f.status) cs.push(where('status', '==', f.status))
  return cs
}

function byChapter(a: Deliverable, b: Deliverable) {
  return a.chapter - b.chapter
}

function buildEvent(args: {
  action: DeliverableEvent['action']
  fromStatus: DeliverableStatus | null
  toStatus: DeliverableStatus | null
  actor: Actor
  note?: string | null
}): DeliverableEvent {
  const { action, fromStatus, toStatus, actor, note } = args
  const entry: DeliverableEvent = {
    action,
    fromStatus,
    toStatus,
    actorEmail: actor.email,
    note: note?.toString().trim() || null,
    createdAt: new Date().toISOString()
  }
  if (actor.role) entry.actorRole = actor.role
  return entry
}

export function useDeliverables() {
  // $firebase is provided by a client-only plugin, so resolve it lazily on
  // each call. Callers invoke these from onMounted / event handlers (client),
  // by which point the plugin has run.
  function db() {
    return useNuxtApp().$firebase.db
  }
  function col() {
    return collection(db(), 'deliverables')
  }

  async function list(filters: DeliverableFilters = {}) {
    const q = query(col(), ...filtersToConstraints(filters))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Deliverable).sort(byChapter)
  }

  async function get(id: string) {
    const snap = await getDoc(doc(db(), 'deliverables', id))
    return snap.exists() ? (snap.data() as Deliverable) : null
  }

  // Reactive list that updates as Firestore does. The onSnapshot subscription
  // starts in onMounted so we never touch $firebase on SSR (it's provided by
  // a client-only plugin). Refs are returned immediately so templates can
  // bind safely before mount.
  function watchList(filters: DeliverableFilters = {}) {
    const data = ref<Deliverable[]>([])
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      const q = query(col(), ...filtersToConstraints(filters))
      unsub = onSnapshot(q, (snap) => {
        data.value = snap.docs.map((d) => d.data() as Deliverable).sort(byChapter)
        loading.value = false
      })
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Accepts a reactive id source so the detail page can navigate between
  // /deliverables/a and /deliverables/b without remounting — the subscription
  // rebinds whenever the id changes. Subscription starts in onMounted (SSR-safe).
  function watchOne(idSource: MaybeRefOrGetter<string>) {
    const data = ref<Deliverable | null>(null)
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
          data.value = null
          loading.value = true
          if (!id) return
          unsub = onSnapshot(doc(db(), 'deliverables', id), (snap) => {
            data.value = snap.exists() ? (snap.data() as Deliverable) : null
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

  // --- mutations ---
  // Each lifecycle mutation appends to deliverables/{id}.statusHistory so the
  // detail page can render a debuggable activity feed without a subcollection.

  async function submitForReview(
    id: string,
    actor: Actor,
    fromStatus: 'draft' | 'needs_revision',
    notes?: string
  ) {
    const ref = doc(db(), 'deliverables', id)
    const now = new Date().toISOString()
    const event = buildEvent({
      action: 'submitted',
      fromStatus,
      toStatus: 'in_review',
      actor,
      note: notes ?? null
    })
    await updateDoc(ref, {
      status: 'in_review',
      submittedForReviewAt: now,
      submittedAt: now,
      submittedByUid: actor.uid ?? null,
      submittedByEmail: actor.email || null,
      updatedAt: now,
      statusHistory: arrayUnion(event),
      ...(notes ? { notes } : {})
    })
  }

  async function approve(
    id: string,
    actor: Actor & { uid: string },
    approvalNotes?: string
  ) {
    const ref = doc(db(), 'deliverables', id)
    const now = new Date().toISOString()
    const event = buildEvent({
      action: 'approved',
      fromStatus: 'in_review',
      toStatus: 'approved',
      actor,
      note: approvalNotes ?? null
    })
    await updateDoc(ref, {
      status: 'approved',
      approvedAt: now,
      approvedByUid: actor.uid,
      approvedByEmail: actor.email || null,
      approvedByRole: actor.role ?? null,
      reviewedByUid: actor.uid,
      reviewedByEmail: actor.email || null,
      reviewedAt: now,
      approvalNotes: approvalNotes ?? null,
      statusHistory: arrayUnion(event),
      updatedAt: now
    })
  }

  async function returnForRevision(id: string, actor: Actor, reason: string) {
    const ref = doc(db(), 'deliverables', id)
    const now = new Date().toISOString()
    const event = buildEvent({
      action: 'returned',
      fromStatus: 'in_review',
      toStatus: 'needs_revision',
      actor,
      note: reason
    })
    await updateDoc(ref, {
      status: 'needs_revision',
      returnedReason: reason,
      reviewedByUid: actor.uid ?? null,
      reviewedByEmail: actor.email || null,
      reviewedAt: now,
      statusHistory: arrayUnion(event),
      updatedAt: now
    })
  }

  // Owner notes edits are intentionally not appended to statusHistory — the
  // activity feed is for lifecycle decisions. Field-level notes changes
  // already show up in the notes textarea itself.
  async function saveOwnerNotes(id: string, notes: string) {
    const ref = doc(db(), 'deliverables', id)
    const now = new Date().toISOString()
    await updateDoc(ref, { notes, updatedAt: now })
  }

  async function editDueDate(
    id: string,
    actor: Actor & { uid: string },
    currentStatus: DeliverableStatus,
    newDueDate: string,
    reason: string
  ) {
    const ref = doc(db(), 'deliverables', id)
    const now = new Date().toISOString()
    // Due-date overrides don't change status; from == to keeps the renderer
    // uniform without a special case.
    const event = buildEvent({
      action: 'due_date_edited',
      fromStatus: currentStatus,
      toStatus: currentStatus,
      actor,
      note: reason
    })
    await updateDoc(ref, {
      dueDate: newDueDate,
      lastDueDateEditedBy: actor.uid,
      lastDueDateEditedAt: now,
      dueDateOverrideReason: reason,
      statusHistory: arrayUnion(event),
      updatedAt: now
    })
  }

  return {
    list,
    get,
    watchList,
    watchOne,
    submitForReview,
    approve,
    returnForRevision,
    saveOwnerNotes,
    editDueDate
  }
}
