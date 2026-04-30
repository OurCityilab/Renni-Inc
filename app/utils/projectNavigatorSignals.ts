// Project Navigator Dependency Signals — display-only derivations
// from existing data (deliverables + tasks + today's date) that
// surface where chiefs should focus and which sections may be weak
// because an upstream dependency hasn't landed yet.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure function. Deterministic given identical inputs.
//   - Never reads Firestore, never writes Firestore, never calls
//     /api/* or any AI provider, never creates tasks, never changes
//     status, never submits or approves anything.
//   - Display-only. Every signal is a label + reason + optional
//     deeplink. The chief decides what to do.
//   - Conservative: chapter-mapped "missing X" signals fire ONLY
//     when the underlying deliverable exists AND its status is
//     `draft` or `needs_revision`. Once a deliverable moves into
//     `in_review` or `approved`, the warning auto-clears.
//   - Student-safe copy: signal reasons are supportive ("may be
//     easier after finance adds unit cost"), never accusatory
//     ("you are blocked"). The page-level c-suite middleware keeps
//     students out, but the language stays safe in case a future
//     pass surfaces a subset on student pages.
//
// SIGNAL DESIGN
// -------------
//   Severity rank (lower = higher priority on the surfaced list):
//     blocked  — task or deliverable cannot move (blocked tasks,
//                overdue deliverables not yet approved)
//     warning  — deliverable status indicates a dependency is not
//                yet landed in a way the next team can rely on
//                (draft / needs_revision on a launch-critical
//                chapter)
//     ready    — work is ready for chief review (in_review)
//     info     — soft hints about what flows where
//
//   Signal ids are stable so a render pass can key on them. The id
//   embeds the kind plus the entity id so two signals about the
//   same deliverable on different facets are distinct.

import type {
  Deliverable,
  DeliverableStatus,
  Department,
  IsoDate,
  Task
} from '~/types/models'

export type ProjectNavigatorSignalSeverity =
  | 'info'
  | 'warning'
  | 'blocked'
  | 'ready'

export interface ProjectNavigatorSignal {
  id: string
  /** Short label shown as the signal headline. */
  label: string
  severity: ProjectNavigatorSignalSeverity
  department?: Department
  chapterId?: string
  deliverableId?: string
  taskId?: string
  /** Plain-language one-liner explaining why this is on the list.
   *  Written in supportive tone — never "you are blocked." */
  reason: string
  /** Optional CTA label. Always frames the action as a choice. */
  nextActionLabel?: string
  /** Optional deeplink target. */
  nextActionTo?: string
  /** Numeric rank (lower = higher priority). The page sorts by this
   *  before rendering. */
  rank: number
}

export interface ProjectNavigatorSignalsInput {
  deliverables: readonly Deliverable[]
  tasks: readonly Task[]
  todayIso: IsoDate
  /** Optional department scope. When set, signals from other
   *  departments are dropped. Co-CEO / admin pass null to see all. */
  filterDepartment?: Department | null
}

// Severity rank: lower number = higher priority on the surfaced list.
const SEVERITY_RANK: Record<ProjectNavigatorSignalSeverity, number> = {
  blocked: 0,
  ready: 1,
  warning: 2,
  info: 3
}

// Chapter → dependency-signal mapping. Each entry describes the
// "missing X" signal that should fire when this chapter's
// deliverable is still in `draft` or `needs_revision`. The label
// names the missing dependency in supportive language and links
// chiefs straight to the section page they should poke into.
//
// NOTE: keep this list lean. The point is to surface launch-critical
// dependencies, not to noise-flag every chapter.
interface ChapterDependencySpec {
  chapterId: string
  /** Plain-English short name of the dependency this chapter owns
   *  (used in the signal label, e.g. "Missing unit cost"). */
  missingLabel: string
  /** One-sentence supportive reason. */
  reason: string
  /** Section to deeplink into. Falls back to the deliverable page. */
  preferSectionId?: string
}

const CHAPTER_DEPENDENCY_SPECS: readonly ChapterDependencySpec[] = [
  {
    chapterId: 'ch-04-business-model-canvas',
    missingLabel: 'Missing customer profile',
    reason:
      'Value Propositions, Channels, and the Campaign audience may be easier after Strategy and Growth lands customer profiles.',
    preferSectionId: 'customer-segments'
  },
  {
    chapterId: 'ch-07-current-product-line-and-pricing',
    missingLabel: 'Missing product list',
    reason:
      'Unit Cost, Revenue Scenarios, and Inventory will all be easier once the team locks the product list.',
    preferSectionId: 'product-list'
  },
  {
    chapterId: 'ch-08-finance-and-revenue-model',
    missingLabel: 'Missing unit cost and break-even',
    reason:
      'Pricing decisions, the Phoenix Nest margin story, and Day-of revenue targets all reference the Ch. 8 finance tables.',
    preferSectionId: 'unit-cost'
  },
  {
    chapterId: 'ch-09-operations-and-continuity-systems',
    missingLabel: 'Missing inventory and SOPs',
    reason:
      'Day-of execution and Phoenix Nest readiness depend on the inventory and SOP work in Ch. 9.',
    preferSectionId: 'inventory'
  },
  {
    chapterId: 'ch-10-marketing-and-campaign-playbook',
    missingLabel: 'Missing market and demand proof',
    reason:
      'The campaign benefits from a customer profile and a real demand signal before the team commits to a message and channel.',
    preferSectionId: 'audience'
  },
  {
    chapterId: 'ch-11-phoenix-nest-retail-carry-pitch',
    missingLabel: 'Missing Phoenix Nest proof',
    reason:
      'The retail carry pitch needs a buyer name, shelf fit, and the margin story from Ch. 7 / 8 finance tables.',
    preferSectionId: 'pitch-evidence'
  }
] as const

// ---- Public entry point ------------------------------------------

export function buildProjectNavigatorSignals(
  input: ProjectNavigatorSignalsInput
): ProjectNavigatorSignal[] {
  const filterDept = input.filterDepartment ?? null
  const visibleDeliverables = input.deliverables.filter((d) =>
    isDeliverableVisible(d, filterDept)
  )
  const visibleTasks = input.tasks.filter((t) =>
    isTaskVisible(t, filterDept)
  )

  const out: ProjectNavigatorSignal[] = []
  out.push(...blockedTaskSignals(visibleTasks))
  out.push(...overdueDeliverableSignals(visibleDeliverables, input.todayIso))
  out.push(...readyForReviewSignals(visibleDeliverables))
  out.push(...needsRevisionSignals(visibleDeliverables))
  out.push(...missingDependencySignals(visibleDeliverables))
  out.push(...missingFinalPlaybookSignals(visibleDeliverables, input.todayIso))

  // Stable sort: severity first, then rank, then label for tie-breaks.
  return out.sort((a, b) => {
    const sevDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    if (sevDiff !== 0) return sevDiff
    if (a.rank !== b.rank) return a.rank - b.rank
    return a.label.localeCompare(b.label)
  })
}

// ---- Visibility filters ------------------------------------------

function isDeliverableVisible(
  d: Deliverable,
  filterDept: Department | null
): boolean {
  if (!filterDept) return true
  if (d.department === filterDept) return true
  // Cross-department deliverables surface to executive views only.
  if (d.department === 'executive') return true
  return false
}

function isTaskVisible(t: Task, filterDept: Department | null): boolean {
  if (!filterDept) return true
  return t.department === filterDept
}

// ---- Signal builders ---------------------------------------------

function blockedTaskSignals(tasks: readonly Task[]): ProjectNavigatorSignal[] {
  return tasks
    .filter((t) => t.status === ('blocked' as const))
    .map<ProjectNavigatorSignal>((t) => ({
      id: `blocked-task:${t.id}`,
      label: 'Blocked task',
      severity: 'blocked',
      department: t.department ?? undefined,
      taskId: t.id,
      deliverableId: t.deliverableId ?? undefined,
      reason: `${t.title} — marked blocked. Ask the owner what is in the way.`,
      nextActionLabel: 'Open the task',
      nextActionTo: t.deliverableId
        ? `/deliverables/${t.deliverableId}`
        : '/tasks',
      rank: 0
    }))
}

function overdueDeliverableSignals(
  deliverables: readonly Deliverable[],
  todayIso: IsoDate
): ProjectNavigatorSignal[] {
  return deliverables
    .filter(
      (d) =>
        d.status !== 'approved' &&
        Boolean(d.dueDate) &&
        (d.dueDate as string) < todayIso
    )
    .map<ProjectNavigatorSignal>((d) => ({
      id: `overdue-deliverable:${d.id}`,
      label: 'Overdue deliverable',
      severity: 'blocked',
      department: d.department ?? undefined,
      chapterId: d.id,
      deliverableId: d.id,
      reason: `${d.title} was due ${d.dueDate}. Decide with the owner whether to push the date or escalate.`,
      nextActionLabel: 'Open the deliverable',
      nextActionTo: `/deliverables/${d.id}`,
      rank: 1
    }))
}

function readyForReviewSignals(
  deliverables: readonly Deliverable[]
): ProjectNavigatorSignal[] {
  return deliverables
    .filter((d) => d.status === 'in_review')
    .map<ProjectNavigatorSignal>((d) => ({
      id: `ready-for-review:${d.id}`,
      label: 'Ready for chief review',
      severity: 'ready',
      department: d.department ?? undefined,
      chapterId: d.id,
      deliverableId: d.id,
      reason: `${d.title} is waiting on a chief review. The team needs a yes / no / revise.`,
      nextActionLabel: 'Open the deliverable',
      nextActionTo: `/deliverables/${d.id}`,
      rank: 0
    }))
}

function needsRevisionSignals(
  deliverables: readonly Deliverable[]
): ProjectNavigatorSignal[] {
  return deliverables
    .filter((d) => d.status === 'needs_revision')
    .map<ProjectNavigatorSignal>((d) => ({
      id: `needs-revision:${d.id}`,
      label: 'Needs revision after review',
      severity: 'warning',
      department: d.department ?? undefined,
      chapterId: d.id,
      deliverableId: d.id,
      reason: `${d.title} came back from review with notes. Confirm the team has picked the work back up.`,
      nextActionLabel: 'Open the deliverable',
      nextActionTo: `/deliverables/${d.id}`,
      rank: 1
    }))
}

function missingDependencySignals(
  deliverables: readonly Deliverable[]
): ProjectNavigatorSignal[] {
  const byId: Map<string, Deliverable> = new Map(
    deliverables.map((d) => [d.id, d])
  )
  const out: ProjectNavigatorSignal[] = []
  for (const spec of CHAPTER_DEPENDENCY_SPECS) {
    const d = byId.get(spec.chapterId)
    if (!d) continue
    if (!isLandingNotYetDone(d.status)) continue
    const sectionPath = spec.preferSectionId
      ? `/deliverables/${d.id}/sections/${spec.preferSectionId}`
      : `/deliverables/${d.id}`
    out.push({
      id: `missing-dependency:${spec.chapterId}`,
      label: spec.missingLabel,
      severity: 'warning',
      department: d.department ?? undefined,
      chapterId: spec.chapterId,
      deliverableId: spec.chapterId,
      reason: spec.reason,
      nextActionLabel: 'Open the section',
      nextActionTo: sectionPath,
      rank: 2
    })
  }
  return out
}

/** A "missing X" signal fires when the deliverable hasn't landed —
 *  i.e. its status is still `draft` or it has come back from review
 *  for revisions. `in_review` is treated as landed-enough (it shows
 *  up under "ready for chief review"); `approved` is fully done. */
function isLandingNotYetDone(status: DeliverableStatus | undefined): boolean {
  return status === 'draft' || status === 'needs_revision'
}

/** Final Playbook readiness — surfaces deliverables that are still
 *  in `draft` and either past their due date or within 3 days of
 *  it. Emitted with `info` severity so it sits below the
 *  blocking / warning signals. Past-due cases also have an
 *  `overdue-deliverable` signal of higher severity; the two carry
 *  different message intent (one is "this is late," the other is
 *  "this still owes a final Playbook output"). */
function missingFinalPlaybookSignals(
  deliverables: readonly Deliverable[],
  todayIso: IsoDate
): ProjectNavigatorSignal[] {
  const horizon = addDays(todayIso, 3)
  return deliverables
    .filter(
      (d) =>
        d.status === 'draft' &&
        Boolean(d.dueDate) &&
        (d.dueDate as string) <= horizon
    )
    .map<ProjectNavigatorSignal>((d) => ({
      id: `missing-final-output:${d.id}`,
      label: 'Missing final Playbook-ready output',
      severity: 'info',
      department: d.department ?? undefined,
      chapterId: d.id,
      deliverableId: d.id,
      reason: `${d.title} is due ${d.dueDate} and still in draft. The Playbook needs final text saved per section.`,
      nextActionLabel: 'Open the deliverable',
      nextActionTo: `/deliverables/${d.id}`,
      rank: 3
    }))
}

// ---- Date helpers (ISO yyyy-mm-dd) -------------------------------

function addDays(iso: IsoDate, days: number): IsoDate {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
