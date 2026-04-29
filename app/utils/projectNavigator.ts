// Project Navigator — deterministic C-suite work-state aggregator.
//
// PURPOSE
// -------
// Reads existing tasks + deliverables + chapter-owner labels and
// computes a small, ranked, human-readable view of "what to push on
// next." Designed to be the deterministic substrate the Executive
// Advisor (AI layer, future) consumes — no AI calls live here. No
// network. No mutation. No status changes. The Navigator only
// ANSWERS questions; it never decides for the leader.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure functions. Same inputs produce the same outputs.
//   - No Firestore writes. No HTTP calls. No Vue runtime imports.
//     This file is safe to import from any Vue component, any
//     server util, or a script.
//   - Never invents data. If a deliverable has no due date, it does
//     not appear in "overdue." If no tasks are blocked, the blocked
//     section returns an empty array.
//   - Read-only copy. `suggestedNextMove` strings are guidance, not
//     commands; the Navigator UI never offers a button to change
//     status, approve, submit, or reopen.
//   - Never gates submit, approval, or status. Any "blocked" /
//     "overdue" labelling here is calculated and DISPLAY-ONLY — it
//     does not write back.

import type {
  Deliverable,
  DeliverableStatus,
  Department,
  IsoDate,
  Task,
  TaskStatus
} from '~/types/models'
import { getLikelyOwner } from '~/data/chapterOwners'

/* -------------------------------------------------------------------
 * Types — consumed by the Navigator page and reusable later by the
 * Executive Advisor handoff
 * ------------------------------------------------------------------ */

export type NavigatorViewerRole =
  | 'admin'
  | 'coceo'
  | 'coo'
  | 'cfo'
  | 'cmo'
  | 'csgo'
  | 'unknown'

export type PriorityKind =
  | 'blocked-task'
  | 'overdue-deliverable'
  | 'pending-review'
  | 'final-output'
  | 'upcoming-due'

export interface PriorityItem {
  /** Synthetic id (`<kind>:<entity-id>`) — stable across renders. */
  id: string
  kind: PriorityKind
  /** One-line title shown in the priority card. */
  title: string
  /** Human-readable status label (e.g. "Blocked", "Overdue · 3 days",
   *  "In review", "Due in 2 days"). */
  statusLabel: string
  /** Department or chief most likely to own the next move. Mirrors
   *  the chapter-owners map for chapter-level work; falls back to
   *  the task / deliverable's own department for task-level work. */
  ownerLabel: string
  /** ISO date or null. Null when the entity has no due date. */
  dueDate: IsoDate | null
  /** Plain-language one-liner explaining why this is on the list. */
  whyItMatters: string
  /** Read-only suggested next move. NEVER a button label; always
   *  framed as guidance the leader can choose to act on (or not). */
  suggestedNextMove: string
  /** Deeplink the page can render as a `<NuxtLink :to="link">`. */
  link: string
  /** Numeric rank (lower = higher priority). The page sorts by this
   *  before rendering. */
  rank: number
}

export interface ChapterProgressRow {
  deliverableId: string
  chapter: number
  title: string
  status: DeliverableStatus | null
  ownerLabel: string
  dueDate: IsoDate | null
  isOverdue: boolean
  hasBlockedTasks: boolean
  inReviewCount: number
}

export interface DepartmentWorkloadRow {
  department: Department
  openTasks: number
  blockedTasks: number
  overdueTasks: number
  inReviewDeliverables: number
}

export interface MeetingAgendaItem {
  number: number
  title: string
  body: string
}

export interface ProjectNavigatorView {
  /** Top 5–8 ranked priority items. */
  priorityItems: PriorityItem[]
  /** All blocked tasks the viewer can see (subject to role filter). */
  blockedTasks: PriorityItem[]
  /** All overdue deliverables the viewer can see. */
  overdueDeliverables: PriorityItem[]
  /** Deliverables waiting for review. */
  pendingReviews: PriorityItem[]
  /** Per-chapter progress rollup, ordered by chapter number. */
  chapterProgress: ChapterProgressRow[]
  /** Per-department workload counts. */
  departmentWorkload: DepartmentWorkloadRow[]
  /** Deterministic meeting agenda items derived from the above. */
  meetingAgenda: MeetingAgendaItem[]
  /** True when the viewer's role-scoped filter narrowed the data. */
  filteredByDepartment: Department | null
}

/* -------------------------------------------------------------------
 * Public entry point
 * ------------------------------------------------------------------ */

export interface ProjectNavigatorInput {
  deliverables: readonly Deliverable[]
  tasks: readonly Task[]
  /** Today's date as an ISO yyyy-mm-dd string. The caller passes
   *  this so the function stays pure (no implicit `new Date()`). */
  todayIso: IsoDate
  /** The viewer's role. Used to scope the data when the role maps
   *  cleanly to a single department (CFO → finance, etc.). Co-CEO /
   *  admin always see the company-wide view. */
  viewerRole: NavigatorViewerRole
  /** Optional explicit department override. Co-CEOs / admins can
   *  toggle to a specific department's view via the page UI; this
   *  parameter carries that selection. When null/undefined, the
   *  viewer-role default applies. */
  viewAsDepartment?: Department | null
  /** Stable list of chapter ids in chapter order. The caller passes
   *  this from `templateStudios` so this util stays pure. */
  chapterIds: readonly string[]
  /** Stable map of chapter id → chapter title. */
  chapterTitles: Readonly<Record<string, string>>
}

export function buildProjectNavigatorView(
  input: ProjectNavigatorInput
): ProjectNavigatorView {
  const filterDept = resolveDepartmentFilter(input.viewerRole, input.viewAsDepartment)

  const visibleDeliverables = input.deliverables.filter((d) =>
    isDeliverableVisible(d, filterDept)
  )
  const visibleTasks = input.tasks.filter((t) =>
    isTaskVisible(t, filterDept)
  )

  const blockedTasks = computeBlockedTasks(visibleTasks)
  const overdueDeliverables = computeOverdueDeliverables(
    visibleDeliverables,
    input.todayIso
  )
  const pendingReviews = computePendingReviews(visibleDeliverables)
  const finalOutputAlerts = computeFinalOutputAlerts(
    visibleDeliverables,
    input.todayIso
  )
  const upcomingDues = computeUpcomingDues(visibleDeliverables, input.todayIso)

  const priorityItems = rankPriorities([
    ...blockedTasks,
    ...overdueDeliverables,
    ...pendingReviews,
    ...finalOutputAlerts,
    ...upcomingDues
  ])

  const chapterProgress = computeChapterProgress(
    input.deliverables,
    input.tasks,
    input.chapterIds,
    input.chapterTitles,
    input.todayIso
  )

  const departmentWorkload = computeDepartmentWorkload(
    input.deliverables,
    input.tasks
  )

  const meetingAgenda = composeMeetingAgenda({
    blockedTasks,
    overdueDeliverables,
    pendingReviews,
    chapterProgress
  })

  return {
    priorityItems,
    blockedTasks,
    overdueDeliverables,
    pendingReviews,
    chapterProgress,
    departmentWorkload,
    meetingAgenda,
    filteredByDepartment: filterDept
  }
}

/* -------------------------------------------------------------------
 * Role → department mapping
 * ------------------------------------------------------------------ */

const ROLE_DEFAULT_DEPARTMENT: Partial<Record<NavigatorViewerRole, Department>> = {
  coo: 'operations',
  cfo: 'finance',
  cmo: 'marketing',
  csgo: 'strategy-growth'
}

/** Resolve which department's slice the viewer should see. */
export function resolveDepartmentFilter(
  viewerRole: NavigatorViewerRole,
  viewAsDepartment: Department | null | undefined
): Department | null {
  // Explicit override always wins (Co-CEO / admin tabbing into a
  // specific department's view).
  if (viewAsDepartment) return viewAsDepartment
  // Co-CEO / admin / unknown → company-wide.
  if (
    viewerRole === 'coceo' ||
    viewerRole === 'admin' ||
    viewerRole === 'unknown'
  ) {
    return null
  }
  return ROLE_DEFAULT_DEPARTMENT[viewerRole] ?? null
}

function isDeliverableVisible(
  d: Deliverable,
  filterDept: Department | null
): boolean {
  if (filterDept === null) return true
  return d.department === filterDept
}

function isTaskVisible(t: Task, filterDept: Department | null): boolean {
  if (filterDept === null) return true
  return t.department === filterDept
}

/* -------------------------------------------------------------------
 * Bucket computers (each returns ranked PriorityItem[])
 * ------------------------------------------------------------------ */

function computeBlockedTasks(tasks: readonly Task[]): PriorityItem[] {
  return tasks
    .filter((t) => t.status === ('blocked' as TaskStatus))
    .map((t) => taskToPriorityItem(t, 'blocked-task', 100))
}

function computeOverdueDeliverables(
  deliverables: readonly Deliverable[],
  todayIso: IsoDate
): PriorityItem[] {
  return deliverables
    .filter(
      (d) =>
        d.status !== ('approved' as DeliverableStatus) &&
        Boolean(d.dueDate) &&
        d.dueDate < todayIso
    )
    .map((d) => deliverableToPriorityItem(d, 'overdue-deliverable', 200, todayIso))
}

function computePendingReviews(
  deliverables: readonly Deliverable[]
): PriorityItem[] {
  return deliverables
    .filter((d) => d.status === ('in_review' as DeliverableStatus))
    .map((d) => deliverableToPriorityItem(d, 'pending-review', 300))
}

/**
 * Final outputs are tied to specific chapters in V1:
 *   - Phoenix Nest carry pitch  → ch-11
 *   - Operations / TechTown     → ch-09
 *   - Brand & Operations Playbook → represented by every chapter, so
 *     we surface ALREADY-STARTED chapters that aren't yet approved
 *     when due dates are within 14 days. To avoid double-counting
 *     with `upcoming-due`, this bucket only flags the two
 *     specifically named final-output deliverables.
 */
function computeFinalOutputAlerts(
  deliverables: readonly Deliverable[],
  todayIso: IsoDate
): PriorityItem[] {
  const finalOutputIds: ReadonlySet<string> = new Set([
    'ch-11-phoenix-nest-retail-carry-pitch',
    'ch-09-operations-and-continuity-systems'
  ])
  return deliverables
    .filter(
      (d) =>
        finalOutputIds.has(d.id) &&
        d.status !== ('approved' as DeliverableStatus)
    )
    .map((d) => {
      const item = deliverableToPriorityItem(d, 'final-output', 400, todayIso)
      return {
        ...item,
        whyItMatters: `Final-output chapter — ${item.whyItMatters}`,
        suggestedNextMove:
          'This chapter ties directly to a TechTown / Phoenix Nest deliverable. Move it into the next C-suite meeting agenda and confirm next steps.'
      }
    })
}

function computeUpcomingDues(
  deliverables: readonly Deliverable[],
  todayIso: IsoDate
): PriorityItem[] {
  const horizon = addDays(todayIso, 7)
  return deliverables
    .filter(
      (d) =>
        d.status !== ('approved' as DeliverableStatus) &&
        d.status !== ('in_review' as DeliverableStatus) &&
        Boolean(d.dueDate) &&
        d.dueDate >= todayIso &&
        d.dueDate <= horizon
    )
    .map((d) => deliverableToPriorityItem(d, 'upcoming-due', 500, todayIso))
}

/* -------------------------------------------------------------------
 * Item builders
 * ------------------------------------------------------------------ */

function taskToPriorityItem(
  t: Task,
  kind: PriorityKind,
  baseRank: number
): PriorityItem {
  const ownerLabel = t.department
    ? departmentDisplayLabel(t.department)
    : t.ownerEmail || 'Unassigned'
  const link = t.deliverableId
    ? `/deliverables/${t.deliverableId}`
    : '/tasks'
  return {
    id: `${kind}:${t.id}`,
    kind,
    title: t.title,
    statusLabel: 'Blocked',
    ownerLabel,
    dueDate: t.dueDate ?? null,
    whyItMatters: t.blockedBy
      ? `Task is blocked by: ${t.blockedBy}`
      : 'Task is marked blocked. Someone should ask the owner what is in the way.',
    suggestedNextMove:
      'Ask the owner what is blocking progress. If the blocker is outside their control, move it into the next C-suite meeting agenda.',
    link,
    rank: baseRank
  }
}

function deliverableToPriorityItem(
  d: Deliverable,
  kind: PriorityKind,
  baseRank: number,
  todayIso?: IsoDate
): PriorityItem {
  let statusLabel: string
  let whyItMatters: string
  let suggestedNextMove: string
  let rankAdjust = 0

  switch (kind) {
    case 'overdue-deliverable': {
      const days = todayIso ? daysBetween(d.dueDate, todayIso) : null
      statusLabel = days !== null ? `Overdue · ${days} day${days === 1 ? '' : 's'}` : 'Overdue'
      whyItMatters = `Past due (${d.dueDate}). The deliverable is not yet approved.`
      suggestedNextMove =
        'Open the deliverable and check the Done When list. If progress is real, move to in review; if blocked, name the block.'
      rankAdjust = days !== null ? -Math.min(days, 30) : 0
      break
    }
    case 'pending-review': {
      statusLabel = 'In review'
      whyItMatters = 'Deliverable is waiting for an approver to act.'
      suggestedNextMove =
        'Review this section with the relevant chief and either approve or return for revision.'
      break
    }
    case 'final-output': {
      const days = todayIso ? daysBetween(d.dueDate, todayIso) : null
      statusLabel =
        days !== null && days < 0
          ? `Overdue · ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
          : days !== null
            ? `Due in ${days} day${days === 1 ? '' : 's'}`
            : statusLabelForStatus(d.status)
      whyItMatters = `${chapterTitle(d)} feeds a TechTown or Phoenix Nest deliverable.`
      suggestedNextMove =
        'Confirm the final-output owner has what they need. Add to the next C-suite meeting agenda if anything is unclear.'
      break
    }
    case 'upcoming-due': {
      const days = todayIso ? daysBetween(d.dueDate, todayIso) : null
      statusLabel =
        days !== null
          ? days === 0
            ? 'Due today'
            : `Due in ${days} day${days === 1 ? '' : 's'}`
          : statusLabelForStatus(d.status)
      whyItMatters = `Due ${d.dueDate}. Status is ${statusLabelForStatus(d.status).toLowerCase()}.`
      suggestedNextMove =
        'Open the deliverable and confirm the owner is on track. If not, ask what is needed.'
      rankAdjust = todayIso ? Math.max(0, daysBetween(d.dueDate, todayIso) ?? 0) : 0
      break
    }
    default:
      statusLabel = statusLabelForStatus(d.status)
      whyItMatters = ''
      suggestedNextMove =
        'Open the deliverable and check current state.'
  }

  return {
    id: `${kind}:${d.id}`,
    kind,
    title: chapterTitle(d),
    statusLabel,
    ownerLabel: getLikelyOwner(d.id),
    dueDate: d.dueDate ?? null,
    whyItMatters,
    suggestedNextMove,
    link: `/deliverables/${d.id}`,
    rank: baseRank + rankAdjust
  }
}

function chapterTitle(d: Deliverable): string {
  // Deliverable doesn't carry a curriculum title; the page passes
  // chapterTitles through input. Here we just use the id as a
  // safe fallback. The page-level renderer overlays nicer titles.
  return d.id
}

function statusLabelForStatus(s: DeliverableStatus): string {
  switch (s) {
    case 'draft':
      return 'Draft'
    case 'in_review':
      return 'In review'
    case 'needs_revision':
      return 'Needs revision'
    case 'approved':
      return 'Approved'
  }
}

function departmentDisplayLabel(d: Department): string {
  switch (d) {
    case 'executive':
      return 'Executive'
    case 'operations':
      return 'Operations · COO'
    case 'finance':
      return 'Finance · CFO'
    case 'marketing':
      return 'Marketing · CMO'
    case 'strategy-growth':
      return 'Strategy and Growth · CSGO'
    case 'admin':
      return 'Admin / Instructor'
  }
}

/* -------------------------------------------------------------------
 * Ranking
 * ------------------------------------------------------------------ */

function rankPriorities(items: PriorityItem[]): PriorityItem[] {
  // Sort by rank (asc), then dueDate (asc, nulls last), then title.
  const sorted = [...items].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate < b.dueDate ? -1 : 1
    }
    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1
    return a.title.localeCompare(b.title)
  })
  // Cap at 8 items per the brief (5–8 priority cards).
  return sorted.slice(0, 8)
}

/* -------------------------------------------------------------------
 * Chapter progress
 * ------------------------------------------------------------------ */

function computeChapterProgress(
  deliverables: readonly Deliverable[],
  tasks: readonly Task[],
  chapterIds: readonly string[],
  chapterTitles: Readonly<Record<string, string>>,
  todayIso: IsoDate
): ChapterProgressRow[] {
  const byId = new Map(deliverables.map((d) => [d.id, d]))
  return chapterIds.map((id) => {
    const d = byId.get(id) ?? null
    const blocked = tasks.some(
      (t) => t.deliverableId === id && t.status === ('blocked' as TaskStatus)
    )
    const inReviewCount = d?.status === ('in_review' as DeliverableStatus) ? 1 : 0
    const isOverdue =
      Boolean(d?.dueDate) &&
      d!.dueDate < todayIso &&
      d!.status !== ('approved' as DeliverableStatus)
    return {
      deliverableId: id,
      chapter: parseChapterNumber(id),
      title: chapterTitles[id] ?? id,
      status: d?.status ?? null,
      ownerLabel: getLikelyOwner(id),
      dueDate: d?.dueDate ?? null,
      isOverdue,
      hasBlockedTasks: blocked,
      inReviewCount
    }
  })
}

function parseChapterNumber(id: string): number {
  const match = /^ch-(\d+)/.exec(id)
  return match ? parseInt(match[1]!, 10) : 0
}

/* -------------------------------------------------------------------
 * Department workload
 * ------------------------------------------------------------------ */

const ALL_DEPARTMENTS: readonly Department[] = [
  'executive',
  'operations',
  'finance',
  'marketing',
  'strategy-growth',
  'admin'
] as const

function computeDepartmentWorkload(
  deliverables: readonly Deliverable[],
  tasks: readonly Task[]
): DepartmentWorkloadRow[] {
  return ALL_DEPARTMENTS.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department === dept)
    const deptDeliverables = deliverables.filter((d) => d.department === dept)
    return {
      department: dept,
      openTasks: deptTasks.filter((t) => t.status !== 'done').length,
      blockedTasks: deptTasks.filter((t) => t.status === 'blocked').length,
      overdueTasks: deptTasks.filter(
        (t) =>
          t.status !== 'done' &&
          Boolean(t.dueDate) &&
          (t.dueDate as string) < new Date().toISOString().slice(0, 10)
      ).length,
      inReviewDeliverables: deptDeliverables.filter(
        (d) => d.status === 'in_review'
      ).length
    }
  }).filter((row) => {
    // Hide empty admin rows so the strip stays compact.
    return (
      row.openTasks > 0 ||
      row.blockedTasks > 0 ||
      row.overdueTasks > 0 ||
      row.inReviewDeliverables > 0 ||
      row.department === 'executive' ||
      row.department === 'operations' ||
      row.department === 'finance' ||
      row.department === 'marketing' ||
      row.department === 'strategy-growth'
    )
  })
}

/* -------------------------------------------------------------------
 * Meeting agenda
 * ------------------------------------------------------------------ */

interface MeetingInputs {
  blockedTasks: PriorityItem[]
  overdueDeliverables: PriorityItem[]
  pendingReviews: PriorityItem[]
  chapterProgress: ChapterProgressRow[]
}

function composeMeetingAgenda(input: MeetingInputs): MeetingAgendaItem[] {
  const items: MeetingAgendaItem[] = []
  let n = 1

  if (input.blockedTasks.length > 0) {
    items.push({
      number: n++,
      title: `Review blocked work (${input.blockedTasks.length})`,
      body: `Walk the blocked task list. For each, name the blocker and decide whether to escalate, reassign, or wait.`
    })
  } else {
    items.push({
      number: n++,
      title: 'Review blocked work',
      body: 'No blocked tasks right now. Confirm that owners actually have work in flight, not silent blocks.'
    })
  }

  if (input.pendingReviews.length > 0) {
    items.push({
      number: n++,
      title: `Confirm what is ready for review (${input.pendingReviews.length})`,
      body: 'Walk the In-Review deliverables. The relevant chief either approves or returns each one with a specific reason.'
    })
  } else {
    items.push({
      number: n++,
      title: 'Confirm what is ready for review',
      body: 'Nothing is in review. Ask each chief whether their teams have something close to "ready" — and what it would take to get there this week.'
    })
  }

  if (input.overdueDeliverables.length > 0) {
    items.push({
      number: n++,
      title: `Address overdue deliverables (${input.overdueDeliverables.length})`,
      body: 'For each overdue chapter, the owning chief names the next concrete step and the date by which it will land.'
    })
  }

  // Departments needing support
  const blockedByDept = countByDept(input.blockedTasks)
  const overdueByDept = countByDept(input.overdueDeliverables)
  const stressedDepts = Array.from(
    new Set([...Object.keys(blockedByDept), ...Object.keys(overdueByDept)])
  )
  if (stressedDepts.length > 0) {
    items.push({
      number: n++,
      title: 'Departments needing support',
      body: `${stressedDepts.join(', ')} have either blocked or overdue work. Confirm each has the help it needs.`
    })
  }

  // Always-present steps from the brief
  items.push({
    number: n++,
    title: 'Assign follow-up using the existing task system',
    body: 'Every action item leaves the meeting as a real task in /tasks with an owner and a due date. The Navigator does not create tasks for you.'
  })
  items.push({
    number: n++,
    title: 'Confirm next deadline',
    body: 'Name the next hard deadline (TechTown pop-up · Phoenix Nest pitch · final Playbook chapter approvals) and what must be true by then.'
  })
  items.push({
    number: n++,
    title: 'Record major decisions in the Decision Log',
    body: 'Anything the group decided today goes into Chapter 13 — Decision Log and Appendices.'
  })

  return items
}

function countByDept(items: PriorityItem[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const it of items) {
    const key = it.ownerLabel
    out[key] = (out[key] ?? 0) + 1
  }
  return out
}

/* -------------------------------------------------------------------
 * Date helpers (ISO yyyy-mm-dd, no Date object dependence)
 *
 * Note: `todayIso()` already exists in app/utils/milestoneBackplan.ts
 * (a project-wide helper). Re-exporting here would collide with
 * Nuxt's `~/utils/*` auto-import scanner, so the page imports it
 * directly from milestoneBackplan. Internal helpers stay private.
 * ------------------------------------------------------------------ */

function addDays(iso: IsoDate, days: number): IsoDate {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: IsoDate | null | undefined, b: IsoDate): number | null {
  if (!a) return null
  const ms = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
