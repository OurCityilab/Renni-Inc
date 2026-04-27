// Pure helper that turns a member's open tasks into the single
// "Do this next" pick the Home card surfaces. V1 is task-first so
// the picker stays simple and predictable; advisor-signal-aware
// reasoning can layer on later without changing the shape.
//
// Posture (do not relax in V1):
//   - no Firestore reads
//   - no Vue / runtime imports — pure function over plain data
//   - never invents a task; every output references real input
//   - never claims success when there's nothing to surface
//   - severity vocabulary matches the audit's unified set
//     (stuck / action-today / look-at-soon / all-good)

import type { Task } from '~/types/models'

export type MemberSeverity = 'stuck' | 'action-today' | 'look-at-soon' | 'all-good'

export type MemberNextBestReason =
  | 'blocked'
  | 'overdue'
  | 'due-soon'
  | 'in-progress'
  | 'not-started'
  | 'no-tasks'

export interface MemberNextBestPick {
  task: Task | null
  severity: MemberSeverity
  reason: MemberNextBestReason
}

// Caller-facing card model. Shape matches the audit's recommendation.
// `whyItMatters` is optional so the page can hydrate it from studio
// metadata it has access to (connectedOutcome, chapter title) without
// pushing that knowledge into this pure helper.
export interface MemberNextBestAction {
  headline: string
  body: string
  whyItMatters?: string
  primaryAction: { label: string; to: string }
  severity: MemberSeverity
  reason: MemberNextBestReason
}

const DAY_MS = 86_400_000

function midnightToday(): number {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function dueDateMs(iso?: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).getTime()
}

function byDueAscending(a: Task, b: Task): number {
  const aMs = dueDateMs(a.dueDate ?? null) ?? Number.POSITIVE_INFINITY
  const bMs = dueDateMs(b.dueDate ?? null) ?? Number.POSITIVE_INFINITY
  return aMs - bMs
}

// Pure picker. Precedence:
//   1. blocked  → 'stuck'         (one of mine is currently blocked)
//   2. overdue  → 'action-today'  (past due, not done, not blocked)
//   3. due-soon → 'action-today'  (within 7 days)
//   4. in-progress → 'look-at-soon'
//   5. not-started → 'look-at-soon'
//   6. no open tasks → 'all-good' (empty state)
//
// Within each bucket we sort by due date ascending so the most-urgent
// of each kind wins.
export function pickMemberNextBest(myTasks: Task[]): MemberNextBestPick {
  const open = myTasks.filter((t) => t.status !== 'done')
  if (!open.length) {
    return { task: null, severity: 'all-good', reason: 'no-tasks' }
  }
  const today = midnightToday()
  const isPastDue = (t: Task): boolean => {
    const ms = dueDateMs(t.dueDate ?? null)
    return ms !== null && ms < today
  }
  const isDueSoon = (t: Task): boolean => {
    const ms = dueDateMs(t.dueDate ?? null)
    return ms !== null && ms >= today && ms <= today + 7 * DAY_MS
  }

  const blocked = open.filter((t) => t.status === 'blocked').sort(byDueAscending)
  if (blocked.length) {
    return { task: blocked[0]!, severity: 'stuck', reason: 'blocked' }
  }
  const overdue = open
    .filter((t) => t.status !== 'blocked' && isPastDue(t))
    .sort(byDueAscending)
  if (overdue.length) {
    return { task: overdue[0]!, severity: 'action-today', reason: 'overdue' }
  }
  const dueSoon = open
    .filter((t) => t.status !== 'blocked' && !isPastDue(t) && isDueSoon(t))
    .sort(byDueAscending)
  if (dueSoon.length) {
    return { task: dueSoon[0]!, severity: 'action-today', reason: 'due-soon' }
  }
  const inProgress = open
    .filter((t) => t.status === 'in_progress')
    .sort(byDueAscending)
  if (inProgress.length) {
    return {
      task: inProgress[0]!,
      severity: 'look-at-soon',
      reason: 'in-progress'
    }
  }
  const notStarted = open
    .filter((t) => t.status === 'not_started')
    .sort(byDueAscending)
  if (notStarted.length) {
    return {
      task: notStarted[0]!,
      severity: 'look-at-soon',
      reason: 'not-started'
    }
  }
  // Fallback path: at least one open task exists but doesn't fit the
  // buckets above. Treat as not-started so the student still gets a CTA.
  return {
    task: open[0]!,
    severity: 'look-at-soon',
    reason: 'not-started'
  }
}

// Convenience headline + body builder. The page can override fields
// (e.g. attach a `whyItMatters` line from studio metadata) but the
// defaults below are good enough that the card is never empty.
export interface BuildMemberCardInput {
  pick: MemberNextBestPick
  // Resolved deep link to the task's writing surface. Caller owns the
  // resolution because the studio registry lives in app/data and we
  // keep this helper pure.
  taskHref?: string | null
  // Department-page link for the empty-state path.
  myDepartmentHref?: string | null
  // Optional why-this-matters string the page derives from the
  // studio's connectedOutcome (TechTown / Playbook / Phoenix Nest).
  whyItMatters?: string | null
}

const STATUS_PHRASE: Record<MemberNextBestReason, { headline: string; body: (t: Task) => string }> = {
  blocked: {
    headline: "You're stuck here",
    body: (t) =>
      `Open this task and update what's holding you up so your team can unblock you. (${t.title})`
  },
  overdue: {
    headline: 'Do this next',
    body: (t) =>
      `${t.title} was due ${t.dueDate ?? 'earlier'}. Open it and either finish it today or add a short note about what's blocking it.`
  },
  'due-soon': {
    headline: 'Due soon',
    body: (t) =>
      `${t.title} is due ${t.dueDate ?? 'soon'}. Open the section, finish the writing, save, and mark the task done.`
  },
  'in-progress': {
    headline: 'Keep going',
    body: (t) =>
      `Pick ${t.title} back up. Open the section, save your progress, and mark it done when the writing is ready.`
  },
  'not-started': {
    headline: 'Start here',
    body: (t) =>
      `Open ${t.title}, start typing your team's thinking in source notes, and save as you go.`
  },
  'no-tasks': {
    headline: 'You do not have a task assigned yet.',
    body: () =>
      'Open your department page to see what your team owns, then ask your chief which section you can help with.'
  }
}

export function buildMemberNextBestAction(
  input: BuildMemberCardInput
): MemberNextBestAction {
  const { pick, taskHref, myDepartmentHref, whyItMatters } = input
  const phrase = STATUS_PHRASE[pick.reason]
  if (!pick.task) {
    return {
      headline: phrase.headline,
      body: phrase.body(null as unknown as Task),
      primaryAction: {
        label: 'Open my department',
        to: myDepartmentHref || '/departments'
      },
      severity: pick.severity,
      reason: pick.reason
    }
  }
  const fallbackHref = pick.task.deliverableId
    ? `/deliverables/${pick.task.deliverableId}`
    : '/tasks'
  return {
    headline: phrase.headline,
    body: phrase.body(pick.task),
    whyItMatters: whyItMatters || undefined,
    primaryAction: {
      label: pick.reason === 'blocked' ? 'Open and update this task' : 'Open this task',
      to: taskHref || fallbackHref
    },
    severity: pick.severity,
    reason: pick.reason
  }
}
