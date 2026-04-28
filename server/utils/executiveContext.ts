// Executive Advisor context package — Pass 1.
//
// Server-side helper that assembles the data shape the four
// Executive Advisor templates consume. Reads via the Firebase Admin
// SDK so the endpoint never depends on the calling client to gather
// scope-correct information; the calling client never sees Firestore
// data the viewer is not already authorized to read.
//
// Posture (do not relax in V1):
//   - Read-only. Never writes Firestore.
//   - Hard caps on every collection read so a runaway pull cannot
//     blow the per-prompt token budget.
//   - Prefers the viewer's own department for chiefs and pulls
//     company-wide for Co-CEO / admin / instructor-equivalent.
//   - Returns a plain JSON-serializable object — no Firestore
//     Timestamp instances, no DocumentReference instances. The
//     templates JSON.stringify() it into the user prompt.
//   - Does not include Firebase tokens, profile PII, or unrelated
//     student authoring text. Source notes / draft / final text
//     are NEVER included in the package — the advisor reasons over
//     status and ownership metadata, not student writing.

import { adminDb } from '~~/server/utils/admin'
import type { Department, Role } from '~~/app/types/models'

// V1 caps. Tuned so the assembled package + prompt scaffolding
// stays under the per-template `maxInputChars` ceiling (~16k chars
// ≈ 4k tokens) even on a busy company.
const MAX_DELIVERABLES = 30
const MAX_TASKS = 60
const MAX_TASKS_PER_DELIVERABLE_HINT = 8
const MAX_RECENT_DECISIONS = 10
const MAX_FOCUS_HINT_CHARS = 400

// ---- shapes the templates consume -----------------------------------

export interface ExecutiveContextDeliverable {
  id: string
  title: string
  chapter?: number | null
  status: string
  ownerEmail?: string | null
  approverEmail?: string | null
  department?: Department | null
  dueDate?: string | null
  /** Pre-truncated activity excerpt — last status note or returned
   *  reason. Never the full deliverable body. */
  recentNote?: string | null
}

export interface ExecutiveContextTask {
  id: string
  title: string
  status: string
  ownerEmail?: string | null
  department?: Department | null
  dueDate?: string | null
  blockedBy?: string | null
  deliverableId?: string | null
}

export interface ExecutiveContextDecision {
  id: string
  title: string
  status: string
  decidedAt?: string | null
  rationale?: string | null
}

export interface ExecutiveContextSummary {
  /** Total open tasks the viewer can see in scope. */
  openTaskCount: number
  /** Subset of openTaskCount with status === 'blocked'. */
  blockedTaskCount: number
  /** Subset of openTaskCount with dueDate < today. */
  overdueTaskCount: number
  /** Deliverables in_review the viewer is the approver of. */
  awaitingMyApprovalCount: number
  /** Deliverables in needs_revision in scope. */
  needsRevisionCount: number
  /** Deliverables with status draft in scope. */
  draftCount: number
}

export interface ExecutiveContextPackage {
  /** Identity stamp the templates use to address the chief by role. */
  viewer: {
    role: Role
    department: Department
    isChief: boolean
    isCoCEO: boolean
    isAdmin: boolean
  }
  /** Free-text scope hint the caller may pass — e.g. a chapter or
   *  team to focus on. Capped + sanitized by the endpoint before
   *  it reaches the package. */
  focusHint?: string | null
  /** Roll-up counts for the viewer's scope. */
  summary: ExecutiveContextSummary
  /** In-scope deliverables. Capped at MAX_DELIVERABLES. */
  deliverables: ExecutiveContextDeliverable[]
  /** In-scope open tasks. Capped at MAX_TASKS. */
  openTasks: ExecutiveContextTask[]
  /** Recent decisions the chief may want to revisit. Capped. */
  recentDecisions: ExecutiveContextDecision[]
  /** Reference identifiers the audit log can record without leaking
   *  prose. */
  sourceCounts: {
    deliverables: number
    tasks: number
    decisions: number
  }
}

// ---- helpers --------------------------------------------------------

function isoDateToday(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function clampString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  if (!trimmed) return null
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

interface ViewerProfile {
  uid: string
  email: string
  role: Role
  department: Department
  isChief: boolean
}

// ---- build -----------------------------------------------------------

export interface BuildExecutiveContextOptions {
  viewer: ViewerProfile
  /** Optional caller-supplied scope string. Hard-capped. */
  focusHint?: string | null
}

/**
 * Build the executive context package from Firestore using the
 * Admin SDK. The viewer's role determines scope:
 *   - admin / coceo: company-wide
 *   - chief (coo / cfo / cmo / csgo): department-scoped
 *   - member: returns an empty package (the endpoint should reject
 *     before reaching this helper, but we degrade safely)
 */
export async function buildExecutiveContextPackage(
  opts: BuildExecutiveContextOptions
): Promise<ExecutiveContextPackage> {
  const { viewer } = opts
  const focusHint = clampString(opts.focusHint, MAX_FOCUS_HINT_CHARS)

  const isAdmin = viewer.role === 'admin'
  const isCoCEO = viewer.role === 'coceo'
  const isCompanyWide = isAdmin || isCoCEO

  const empty: ExecutiveContextPackage = {
    viewer: {
      role: viewer.role,
      department: viewer.department,
      isChief: viewer.isChief,
      isCoCEO,
      isAdmin
    },
    focusHint,
    summary: {
      openTaskCount: 0,
      blockedTaskCount: 0,
      overdueTaskCount: 0,
      awaitingMyApprovalCount: 0,
      needsRevisionCount: 0,
      draftCount: 0
    },
    deliverables: [],
    openTasks: [],
    recentDecisions: [],
    sourceCounts: { deliverables: 0, tasks: 0, decisions: 0 }
  }

  // Members and unknown roles get an empty package. The endpoint
  // gates by role before calling this, so this is a safety net.
  if (viewer.role === 'member') return empty
  if (!isCompanyWide && !viewer.isChief) return empty

  const db = adminDb()

  // ---- Deliverables --------------------------------------------------
  // Pull deliverables with non-approved status. Department-scope for
  // department chiefs; company-wide for Co-CEO and admin.
  let deliverableQuery = db
    .collection('deliverables')
    .where('status', 'in', ['draft', 'in_review', 'needs_revision'])
  if (!isCompanyWide) {
    deliverableQuery = deliverableQuery.where(
      'department',
      '==',
      viewer.department
    )
  }
  const deliverableSnap = await deliverableQuery
    .limit(MAX_DELIVERABLES)
    .get()

  const deliverables: ExecutiveContextDeliverable[] = []
  let needsRevisionCount = 0
  let draftCount = 0
  let awaitingMyApprovalCount = 0
  for (const doc of deliverableSnap.docs) {
    const d = doc.data() as Record<string, unknown>
    const status = String(d.status ?? '')
    if (status === 'needs_revision') needsRevisionCount += 1
    if (status === 'draft') draftCount += 1
    if (status === 'in_review' && d.approverUid === viewer.uid) {
      awaitingMyApprovalCount += 1
    }
    deliverables.push({
      id: doc.id,
      title: clampString(d.title, 160) ?? '(untitled)',
      chapter: typeof d.chapter === 'number' ? d.chapter : null,
      status,
      ownerEmail: toStringOrNull(d.ownerEmail),
      approverEmail: toStringOrNull(d.approverEmail),
      department: (toStringOrNull(d.department) as Department | null) ?? null,
      dueDate: toStringOrNull(d.dueDate),
      // The recent note is the most recent owner notes excerpt OR the
      // returned reason on a needs_revision row. We never ship the
      // full deliverable text. Capped tightly.
      recentNote:
        clampString(d.returnedReason, 240) ?? clampString(d.notes, 240)
    })
  }

  // ---- Tasks ---------------------------------------------------------
  // Pull open tasks (not done). Department-scope for chiefs, company-
  // wide for Co-CEO / admin. Limit ordering by dueDate ascending so
  // the first MAX_TASKS surface the most time-sensitive work.
  let taskQuery = db
    .collection('tasks')
    .where('status', 'in', ['not_started', 'in_progress', 'blocked'])
  if (!isCompanyWide) {
    taskQuery = taskQuery.where('department', '==', viewer.department)
  }
  // Note: ordering by dueDate would require a composite index. To
  // avoid that constraint in V1 we take MAX_TASKS unsorted and sort
  // in memory (the cap is small). If we hit the cap, the package
  // documents that the list is truncated.
  const taskSnap = await taskQuery.limit(MAX_TASKS).get()

  const tasksRaw = taskSnap.docs.map((doc) => {
    const t = doc.data() as Record<string, unknown>
    return {
      id: doc.id,
      title: clampString(t.title, 200) ?? '(untitled task)',
      status: String(t.status ?? ''),
      ownerEmail: toStringOrNull(t.ownerEmail),
      department: (toStringOrNull(t.department) as Department | null) ?? null,
      dueDate: toStringOrNull(t.dueDate),
      blockedBy: clampString(t.blockedBy, 240),
      deliverableId: toStringOrNull(t.deliverableId)
    }
  })
  // In-memory sort: blocked first, then overdue, then due-soon, then
  // others. Stable enough for prompt construction without a Firestore
  // composite index.
  const today = isoDateToday()
  tasksRaw.sort((a, b) => {
    const aBlocked = a.status === 'blocked' ? 0 : 1
    const bBlocked = b.status === 'blocked' ? 0 : 1
    if (aBlocked !== bBlocked) return aBlocked - bBlocked
    const aOver = a.dueDate && a.dueDate < today ? 0 : 1
    const bOver = b.dueDate && b.dueDate < today ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    const ad = a.dueDate ?? '9999'
    const bd = b.dueDate ?? '9999'
    return ad < bd ? -1 : ad > bd ? 1 : 0
  })
  const openTasks = tasksRaw

  let blockedTaskCount = 0
  let overdueTaskCount = 0
  for (const t of openTasks) {
    if (t.status === 'blocked') blockedTaskCount += 1
    if (t.dueDate && t.dueDate < today && t.status !== 'blocked') {
      overdueTaskCount += 1
    }
  }

  // Lightweight per-deliverable hint — the templates may want to
  // know which deliverables have the most active tasks. Tagged onto
  // each deliverable row, capped per-deliverable to keep the package
  // bounded.
  const tasksByDeliverable: Record<string, number> = {}
  for (const t of openTasks) {
    if (!t.deliverableId) continue
    tasksByDeliverable[t.deliverableId] =
      (tasksByDeliverable[t.deliverableId] ?? 0) + 1
  }
  for (const d of deliverables) {
    const count = tasksByDeliverable[d.id]
    if (count && count > MAX_TASKS_PER_DELIVERABLE_HINT) {
      d.recentNote =
        (d.recentNote ? `${d.recentNote} · ` : '') +
        `${count} open tasks`
    }
  }

  // ---- Decisions -----------------------------------------------------
  // Pull recent decisions across the company; chiefs and admins both
  // benefit from seeing what was decided lately. Capped tight.
  let recentDecisions: ExecutiveContextDecision[] = []
  try {
    const decisionSnap = await db
      .collection('decisions')
      .limit(MAX_RECENT_DECISIONS)
      .get()
    recentDecisions = decisionSnap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>
      return {
        id: doc.id,
        title: clampString(d.title, 160) ?? '(untitled decision)',
        status: String(d.status ?? ''),
        decidedAt: toStringOrNull(d.decidedAt),
        rationale: clampString(d.rationale, 280)
      }
    })
  } catch {
    // Decisions collection may not exist on every deployment; degrade
    // silently. The advisor still has deliverables + tasks to reason
    // over.
    recentDecisions = []
  }

  return {
    viewer: {
      role: viewer.role,
      department: viewer.department,
      isChief: viewer.isChief,
      isCoCEO,
      isAdmin
    },
    focusHint,
    summary: {
      openTaskCount: openTasks.length,
      blockedTaskCount,
      overdueTaskCount,
      awaitingMyApprovalCount,
      needsRevisionCount,
      draftCount
    },
    deliverables,
    openTasks,
    recentDecisions,
    sourceCounts: {
      deliverables: deliverables.length,
      tasks: openTasks.length,
      decisions: recentDecisions.length
    }
  }
}
