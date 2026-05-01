// Deterministic task coverage map.
//
// Pure utility that joins the static FINAL_WEEK_LANES + FINAL_WEEK_TASK_TEMPLATES
// against the live task / deliverable lists to produce a per-section
// coverage view chiefs can read without asking the Advisor for help.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure functions. No Firestore reads, no Firestore writes, no
//     AI calls, no /api/* requests. Inputs are passed in by the
//     caller (the Project Navigator already watches deliverables +
//     tasks, so the caller has them in scope).
//   - Display-only. The map and its summary helpers describe FACTS
//     about which sections have task coverage. They do not create
//     tasks, change statuses, submit, approve, or mutate anything.
//   - Conservative matching. The matcher prefers structured fields
//     (deliverableId + requirementId, deliverableId-based heuristic)
//     and falls back to normalized title substring only when nothing
//     structured matches. Every fallback is documented inline.

import type { Task, TaskStatus } from '~/types/models'
import {
  FINAL_WEEK_LANES,
  type FinalWeekLane,
  type FinalWeekSectionEntry
} from '~/utils/finalWeekCompletion'
import {
  FINAL_WEEK_TASK_TEMPLATES,
  type FinalWeekTaskTemplate
} from '~/utils/finalWeekTaskTemplates'
import { getTemplateStudio } from '~/data/templateStudios'
import { resolveSectionIdForRequirement } from '~/utils/requirementToSection'

export type TaskCoveragePriority = 'P0' | 'P1' | 'P2'

export interface TaskCoverageStatusSummary {
  blocked: number
  overdue: number
  inProgress: number
  readyForReview: number
  done: number
}

// ---- Match confidence model -------------------------------------
//
// Coverage match confidence describes HOW the matcher matched a
// real task to a section, not WHETHER the work is done. Chiefs and
// students should treat coverage as a planning signal: a "high
// confidence" match means the task is clearly seeded against the
// right requirement; a "low confidence" match means the matcher
// guessed by title token and may be wrong; "none" means no task
// could be matched at all.
//
// Coverage confidence NEVER affects submit gates, approval, status,
// or task creation. It is a display-only annotation on top of the
// existing matcher.

export type CoverageMatchConfidence = 'high' | 'medium' | 'low' | 'none'

export interface CoverageMatchOutcome {
  matchedTaskIds: string[]
  matchConfidence: CoverageMatchConfidence
  matchReason: string
  matchedTaskId: string | null
  matchedTaskTitle: string | null
  coverageNote: string
}

export interface TaskCoverageNode {
  /** Stable composite id (`<deliverableId>:<sectionId>`). */
  id: string
  chapterId: string
  sectionId: string
  sectionTitle: string
  /** Lane id from FINAL_WEEK_LANES (executive / bmc / brand /
   *  product-pricing / finance / operations / marketing /
   *  phoenix-nest / strategy / handoff). */
  lane: string
  /** Plain-language lane title for display. */
  laneTitle: string
  /** Owner role label from the lane map. */
  owner: string
  /** Reviewer role label from the lane map. */
  reviewer: string
  priority: TaskCoveragePriority
  /** Recommended task title from FINAL_WEEK_TASK_TEMPLATES (when a
   *  template exists for this section). When no template exists,
   *  uses the section's `firstAction` field as a fallback so the
   *  chief sees what the recommended task should look like. */
  requiredTaskTitle: string
  /** True when at least one real task in scope was matched to this
   *  section by the matcher below. */
  hasTask: boolean
  /** IDs of real tasks the matcher matched to this section. May be
   *  empty when `hasTask` is false. */
  matchedTaskIds: string[]
  /** Task status counts across `matchedTaskIds`. Counts are zero
   *  when `hasTask` is false. `blocked` and `overdue` overlap a
   *  task with status `blocked` AND a past due date is counted in
   *  both. The UI presents both counts; pick whichever frames the
   *  chief move you want to recommend. */
  statusSummary: TaskCoverageStatusSummary
  /** Plain-language upstream dependency from the lane map. Empty
   *  string when none. */
  dependency: string
  /** Plain-language definition-of-done from the lane map. */
  definitionOfDone: string
  /** Section deeplink the UI should target. */
  route: string
  // ---- Match confidence (additive; existing consumers may
  //      ignore these fields). Always present on every node so
  //      consumers don't have to null-check. ----
  /** How confident the matcher is in its task → section match. */
  matchConfidence: CoverageMatchConfidence
  /** Student-friendly explanation of the match (or non-match). */
  matchReason: string
  /** First matched task id, if any. Mirrors matchedTaskIds[0] for
   *  consumers that only need the strongest single match. */
  matchedTaskId: string | null
  /** First matched task title, if any. */
  matchedTaskTitle: string | null
  /** Optional plain-language note explaining WHY a section is
   *  missing or why a low-confidence match looks suspicious.
   *  Empty string when there is no note to add. */
  coverageNote: string
}

export interface TaskCoverageSummary {
  /** All required sections from the lane map. */
  totalRequiredSections: number
  /** Subset where `hasTask === true`. */
  withTaskCoverage: number
  /** Subset where `hasTask === false` — i.e. the chief has not
   *  seeded a task that the matcher can find. */
  missingTaskCoverage: number
  /** Counts across every node's statusSummary, summed. Use these
   *  as a roll-up rather than per-node. */
  totals: TaskCoverageStatusSummary
  /** Per-priority counts (P0 / P1 / P2). */
  byPriority: Record<TaskCoveragePriority, {
    total: number
    withTask: number
    missing: number
  }>
  /** Per-lane counts. */
  byLane: Array<{
    lane: string
    laneTitle: string
    total: number
    withTask: number
    missing: number
    blocked: number
    overdue: number
    inProgress: number
    readyForReview: number
    done: number
    /** First node in the lane that needs chief attention. Empty
     *  string when the lane is clean. */
    topNextSectionId: string
  }>
}

export interface DeriveTaskCoverageInput {
  tasks: readonly Task[]
  todayIso: string
}

// ---- Public derivation ------------------------------------------

export function deriveTaskCoverageNodes(
  input: DeriveTaskCoverageInput
): TaskCoverageNode[] {
  const out: TaskCoverageNode[] = []
  for (const lane of FINAL_WEEK_LANES) {
    for (const entry of lane.sections) {
      out.push(buildNodeForEntry(entry, lane, input))
    }
  }
  return out
}

function buildNodeForEntry(
  entry: FinalWeekSectionEntry,
  lane: FinalWeekLane,
  input: DeriveTaskCoverageInput
): TaskCoverageNode {
  const template = findTemplateForEntry(entry)
  const outcome = matchTasksForEntry(entry, template, input.tasks)
  const statusSummary = summarizeMatchedStatuses(
    input.tasks,
    outcome.matchedTaskIds,
    input.todayIso
  )
  const requiredTaskTitle = template?.title ?? entry.firstAction
  return {
    id: entry.id,
    chapterId: entry.deliverableId,
    sectionId: entry.sectionId,
    sectionTitle: entry.title,
    lane: lane.id,
    laneTitle: lane.title,
    owner: entry.owner,
    reviewer: entry.reviewer,
    priority: entry.priority,
    requiredTaskTitle,
    hasTask: outcome.matchedTaskIds.length > 0,
    matchedTaskIds: outcome.matchedTaskIds,
    statusSummary,
    dependency: entry.dependency ?? '',
    definitionOfDone: entry.doneWhen,
    route: `/deliverables/${entry.deliverableId}/sections/${entry.sectionId}`,
    matchConfidence: outcome.matchConfidence,
    matchReason: outcome.matchReason,
    matchedTaskId: outcome.matchedTaskId,
    matchedTaskTitle: outcome.matchedTaskTitle,
    coverageNote: outcome.coverageNote
  }
}

// ---- Matching ----------------------------------------------------

function findTemplateForEntry(
  entry: FinalWeekSectionEntry
): FinalWeekTaskTemplate | null {
  return (
    FINAL_WEEK_TASK_TEMPLATES.find(
      (t) => t.id === entry.id || t.sectionId === entry.sectionId
    ) ?? null
  )
}

/** Match real tasks to a section entry. Layers, in priority order:
 *
 *  1. Exact match on `task.deliverableId` AND a 5+ char title token
 *     overlap with the recommended task title or the section title.
 *     This is the strongest signal — a chief seeded the task on the
 *     right deliverable AND used recognizable language.
 *  2. Exact match on `task.deliverableId` only, when the deliverable
 *     has only one section in the lane map (the task can only
 *     belong to that section in this case).
 *  3. Title substring fallback on tasks with no `deliverableId`. The
 *     matcher walks the recommended title's 5+ char tokens and the
 *     section's id (kebab-cased) and accepts any one substring hit.
 *
 *  The matcher is conservative: false negatives (missing a real
 *  task) are preferred to false positives (claiming coverage that
 *  isn't there). False negatives produce "needs a task" prompts
 *  which the chief can resolve quickly; false positives would
 *  produce phantom green checkmarks.
 *
 *  Returns a structured outcome including which pass produced the
 *  match (mapped to a confidence level) and a student-friendly
 *  reason string. The match confidence is for display only; it
 *  never changes statuses or submit behavior. */
function matchTasksForEntry(
  entry: FinalWeekSectionEntry,
  template: FinalWeekTaskTemplate | null,
  tasks: readonly Task[]
): CoverageMatchOutcome {
  const matched = new Set<string>()
  const recommendedLower = (template?.title ?? '').toLowerCase()
  const titleLower = entry.title.toLowerCase()
  const sectionTokens = entry.sectionId
    .toLowerCase()
    .split('-')
    .filter((s) => s.length >= 5)
  const titleTokens = [
    ...recommendedLower.split(/\s+/).filter((s) => s.length >= 5),
    ...titleLower.split(/\s+/).filter((s) => s.length >= 5),
    ...sectionTokens
  ]

  // Pass 0: deterministic structured match via task.requirementId.
  // When a task is linked to a requirement on the same deliverable
  // AND that requirement resolves to this entry's sectionId (either
  // via explicit `sectionId` pin on the requirement or the
  // requirement→section heuristic), the match is unambiguous and
  // wins over every weaker pass below — chiefs intentionally linked
  // the task to a requirement, so the matcher should trust that.
  const studio = getTemplateStudio(entry.deliverableId)
  let pass0Hits = 0
  if (studio) {
    for (const t of tasks) {
      if (!t.requirementId) continue
      if (t.deliverableId && t.deliverableId !== entry.deliverableId) continue
      const requirement = studio.requirements.find(
        (r) => r.id === t.requirementId
      )
      if (!requirement) continue
      const resolvedSectionId = resolveSectionIdForRequirement(
        studio,
        t.requirementId,
        requirement.label
      )
      if (resolvedSectionId === entry.sectionId) {
        matched.add(t.id)
        pass0Hits++
      }
    }
  }

  // Pass 1: deliverableId match + token overlap. STRONGEST.
  let pass1Hits = 0
  for (const t of tasks) {
    if (t.deliverableId !== entry.deliverableId) continue
    const haystack = (t.title ?? '').toLowerCase()
    if (!haystack) continue
    const overlap = titleTokens.some((tok) => tok && haystack.includes(tok))
    if (overlap) {
      matched.add(t.id)
      pass1Hits++
    }
  }

  // Pass 2: deliverableId match alone, only when this is the only
  // section in its lane on the same deliverable. Avoids stealing a
  // task that could legitimately belong to a sibling section.
  let pass2Hits = 0
  if (matched.size === 0) {
    const sameDeliverableSiblings = countSiblingsOnSameDeliverable(entry)
    if (sameDeliverableSiblings === 1) {
      for (const t of tasks) {
        if (t.deliverableId === entry.deliverableId) {
          matched.add(t.id)
          pass2Hits++
        }
      }
    }
  }

  // Pass 3: title-substring fallback for tasks with null
  // deliverableId. WEAKEST.
  let pass3Hits = 0
  for (const t of tasks) {
    if (matched.has(t.id)) continue
    if (t.deliverableId) continue
    const haystack = (t.title ?? '').toLowerCase()
    if (!haystack) continue
    const overlap = titleTokens.some((tok) => tok && haystack.includes(tok))
    if (overlap) {
      matched.add(t.id)
      pass3Hits++
    }
  }

  const matchedTaskIds = Array.from(matched)
  const firstId = matchedTaskIds[0] ?? null
  const firstTitle = firstId
    ? (tasks.find((t) => t.id === firstId)?.title ?? null)
    : null

  // Pick the strongest pass that contributed. Pass 0 (requirementId
  // link) wins, then 1, then 2, then 3.
  let confidence: CoverageMatchConfidence
  let reason: string
  let note = ''
  if (pass0Hits > 0) {
    confidence = 'high'
    reason = 'High confidence: task is linked to this requirement.'
  } else if (pass1Hits > 0) {
    confidence = 'high'
    reason = 'High confidence: matched a task on this deliverable that names this section.'
  } else if (pass2Hits > 0) {
    confidence = 'medium'
    reason = 'Medium confidence: matched by deliverable. This section is the only candidate on the deliverable, so the task is assumed to belong here.'
    note = 'The matched task does not name this section by title — confirm before treating coverage as solid.'
  } else if (pass3Hits > 0) {
    confidence = 'low'
    reason = 'Low confidence: matched only by task title. The task has no deliverable link, so the matcher guessed by language.'
    note = 'The matched task has no deliverable link. A chief should re-link the task to the right deliverable to upgrade this match.'
  } else {
    confidence = 'none'
    reason = 'Missing: no matching task found for this section.'
    note = explainMissingMatch(entry, tasks, titleTokens)
  }

  return {
    matchedTaskIds,
    matchConfidence: confidence,
    matchReason: reason,
    matchedTaskId: firstId,
    matchedTaskTitle: firstTitle,
    coverageNote: note
  }
}

/** When a section has no matching task, name the most likely cause
 *  so chiefs and students can act. Returns a one-sentence
 *  student-friendly note. */
function explainMissingMatch(
  entry: FinalWeekSectionEntry,
  tasks: readonly Task[],
  titleTokens: readonly string[]
): string {
  const tasksOnDeliverable = tasks.filter(
    (t) => t.deliverableId === entry.deliverableId
  )
  if (tasksOnDeliverable.length === 0) {
    return 'No task on this deliverable yet — the chief has not seeded one.'
  }
  // A task exists on this deliverable but its title does not contain
  // any of the recognized section/recommended-task tokens.
  const distinctTokens = titleTokens.filter((t) => t).length
  if (distinctTokens <= 1) {
    return 'A task exists on this deliverable, but the section\'s suggested-task title is too short to match by language. Consider clarifying the suggested task title.'
  }
  return 'A task exists on this deliverable, but its title does not name this section. Either rename the task to include the section name, or seed a section-specific task.'
}

function countSiblingsOnSameDeliverable(
  entry: FinalWeekSectionEntry
): number {
  let count = 0
  for (const lane of FINAL_WEEK_LANES) {
    for (const e of lane.sections) {
      if (e.deliverableId === entry.deliverableId) count++
    }
  }
  return count
}

// ---- Status normalization ---------------------------------------

/** Map the platform's TaskStatus into the five buckets the UI shows.
 *
 *  ASSUMPTIONS
 *  -----------
 *    - `blocked` and `done` map directly.
 *    - `in_progress` maps to inProgress.
 *    - `not_started` maps to inProgress (so the chief sees the task
 *      as live work to push on; this is conservative — chiefs will
 *      tell us if they want a separate not-started bucket).
 *    - "ready for review" is not a TaskStatus today; it lives on
 *      Deliverable. We surface it as zero on every node and rely on
 *      the dependency-signal panel above for review-ready signals.
 *    - "overdue" is a derived flag, not a status. A task is
 *      overdue when status !== 'done' AND dueDate is set AND
 *      dueDate < today. A blocked task can also be overdue —
 *      counted in BOTH buckets. */
function summarizeMatchedStatuses(
  tasks: readonly Task[],
  matchedIds: readonly string[],
  todayIso: string
): TaskCoverageStatusSummary {
  const summary: TaskCoverageStatusSummary = {
    blocked: 0,
    overdue: 0,
    inProgress: 0,
    readyForReview: 0,
    done: 0
  }
  if (matchedIds.length === 0) return summary
  const matchSet = new Set(matchedIds)
  for (const t of tasks) {
    if (!matchSet.has(t.id)) continue
    const isDone = t.status === ('done' as TaskStatus)
    const isBlocked = t.status === ('blocked' as TaskStatus)
    if (isDone) summary.done++
    if (isBlocked) summary.blocked++
    if (t.status === ('in_progress' as TaskStatus) || t.status === ('not_started' as TaskStatus)) {
      summary.inProgress++
    }
    if (
      !isDone &&
      Boolean(t.dueDate) &&
      (t.dueDate as string) < todayIso
    ) {
      summary.overdue++
    }
  }
  return summary
}

// ---- Roll-ups ---------------------------------------------------

export function summarizeTaskCoverage(
  nodes: readonly TaskCoverageNode[]
): TaskCoverageSummary {
  const totals: TaskCoverageStatusSummary = {
    blocked: 0,
    overdue: 0,
    inProgress: 0,
    readyForReview: 0,
    done: 0
  }
  const byPriority: TaskCoverageSummary['byPriority'] = {
    P0: { total: 0, withTask: 0, missing: 0 },
    P1: { total: 0, withTask: 0, missing: 0 },
    P2: { total: 0, withTask: 0, missing: 0 }
  }
  const laneAccumulator = new Map<
    string,
    {
      laneTitle: string
      total: number
      withTask: number
      missing: number
      blocked: number
      overdue: number
      inProgress: number
      readyForReview: number
      done: number
      topNextSectionId: string
    }
  >()
  let withTaskCoverage = 0
  let missingTaskCoverage = 0
  for (const node of nodes) {
    if (node.hasTask) withTaskCoverage++
    else missingTaskCoverage++
    totals.blocked += node.statusSummary.blocked
    totals.overdue += node.statusSummary.overdue
    totals.inProgress += node.statusSummary.inProgress
    totals.readyForReview += node.statusSummary.readyForReview
    totals.done += node.statusSummary.done

    const p = byPriority[node.priority]
    p.total++
    if (node.hasTask) p.withTask++
    else p.missing++

    let lane = laneAccumulator.get(node.lane)
    if (!lane) {
      lane = {
        laneTitle: node.laneTitle,
        total: 0,
        withTask: 0,
        missing: 0,
        blocked: 0,
        overdue: 0,
        inProgress: 0,
        readyForReview: 0,
        done: 0,
        topNextSectionId: ''
      }
      laneAccumulator.set(node.lane, lane)
    }
    lane.total++
    if (node.hasTask) lane.withTask++
    else lane.missing++
    lane.blocked += node.statusSummary.blocked
    lane.overdue += node.statusSummary.overdue
    lane.inProgress += node.statusSummary.inProgress
    lane.readyForReview += node.statusSummary.readyForReview
    lane.done += node.statusSummary.done
    if (!lane.topNextSectionId && nodeNeedsAttention(node)) {
      lane.topNextSectionId = node.id
    }
  }
  const byLane = Array.from(laneAccumulator.entries()).map(
    ([lane, agg]) => ({
      lane,
      laneTitle: agg.laneTitle,
      total: agg.total,
      withTask: agg.withTask,
      missing: agg.missing,
      blocked: agg.blocked,
      overdue: agg.overdue,
      inProgress: agg.inProgress,
      readyForReview: agg.readyForReview,
      done: agg.done,
      topNextSectionId: agg.topNextSectionId
    })
  )
  return {
    totalRequiredSections: nodes.length,
    withTaskCoverage,
    missingTaskCoverage,
    totals,
    byPriority,
    byLane
  }
}

function nodeNeedsAttention(node: TaskCoverageNode): boolean {
  if (!node.hasTask) return true
  if (node.statusSummary.blocked > 0) return true
  if (node.statusSummary.overdue > 0) return true
  return false
}

// ---- Top-N helpers ----------------------------------------------

const PRIORITY_RANK: Record<TaskCoveragePriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2
}

export function topMissingCoverage(
  nodes: readonly TaskCoverageNode[],
  cap = 8
): TaskCoverageNode[] {
  return nodes
    .filter((n) => !n.hasTask)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, cap)
}

export function topBlockedCoverage(
  nodes: readonly TaskCoverageNode[],
  cap = 8
): TaskCoverageNode[] {
  return nodes
    .filter((n) => n.statusSummary.blocked > 0 || n.statusSummary.overdue > 0)
    .sort((a, b) => {
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      if (pr !== 0) return pr
      const blockDiff = b.statusSummary.blocked - a.statusSummary.blocked
      if (blockDiff !== 0) return blockDiff
      return b.statusSummary.overdue - a.statusSummary.overdue
    })
    .slice(0, cap)
}

export interface ChiefFocusItem {
  node: TaskCoverageNode
  /** Plain-language reason this node is on the focus list. */
  reason: string
  /** One-sentence chief move suggestion. */
  suggestedChiefMove: string
}

export function topChiefFocusItems(
  nodes: readonly TaskCoverageNode[],
  cap = 5
): ChiefFocusItem[] {
  const items: ChiefFocusItem[] = []
  // 1. P0 missing task coverage
  for (const n of nodes) {
    if (items.length >= cap) break
    if (n.priority !== 'P0') continue
    if (n.hasTask) continue
    items.push({
      node: n,
      reason: 'P0 section has no matching task — coverage is missing.',
      suggestedChiefMove: `Open the section, decide if a task is needed, and seed it manually as: "${n.requiredTaskTitle}" (owner: ${n.owner}).`
    })
  }
  // 2. P0 blocked work
  for (const n of nodes) {
    if (items.length >= cap) break
    if (n.priority !== 'P0') continue
    if (n.statusSummary.blocked === 0) continue
    if (items.find((i) => i.node.id === n.id)) continue
    items.push({
      node: n,
      reason: `P0 section has ${n.statusSummary.blocked} blocked task${n.statusSummary.blocked === 1 ? '' : 's'}.`,
      suggestedChiefMove: `Ask the owner (${n.owner}) what is in the way before the next class.`
    })
  }
  // 3. P0 overdue work
  for (const n of nodes) {
    if (items.length >= cap) break
    if (n.priority !== 'P0') continue
    if (n.statusSummary.overdue === 0) continue
    if (items.find((i) => i.node.id === n.id)) continue
    items.push({
      node: n,
      reason: `P0 section has ${n.statusSummary.overdue} overdue task${n.statusSummary.overdue === 1 ? '' : 's'}.`,
      suggestedChiefMove: `Push back today: confirm scope with the owner (${n.owner}) and either close or reschedule.`
    })
  }
  // 4. P0 ready-for-review work (uses readyForReview = 0 today, so
  //    this branch is reserved for the future — kept here so the
  //    priority order matches the brief).
  for (const n of nodes) {
    if (items.length >= cap) break
    if (n.priority !== 'P0') continue
    if (n.statusSummary.readyForReview === 0) continue
    if (items.find((i) => i.node.id === n.id)) continue
    items.push({
      node: n,
      reason: `P0 section has ${n.statusSummary.readyForReview} ready-for-review task${n.statusSummary.readyForReview === 1 ? '' : 's'}.`,
      suggestedChiefMove: `Open the section, run the existing approval checklist, and decide approve / return / ask instructor.`
    })
  }
  // 5. P0 sections with coverage but no matched task at all
  //    (defensive — shouldn't trigger because !hasTask catches it
  //    above; included to keep priority ordering explicit).
  // 6. P1 only when P0 is fully clean
  if (items.length < cap) {
    for (const n of nodes) {
      if (items.length >= cap) break
      if (n.priority !== 'P1') continue
      if (n.hasTask && n.statusSummary.blocked === 0 && n.statusSummary.overdue === 0) continue
      if (items.find((i) => i.node.id === n.id)) continue
      const reason = !n.hasTask
        ? 'P1 section has no matching task (P0 work appears clean).'
        : `P1 section has ${n.statusSummary.blocked} blocked / ${n.statusSummary.overdue} overdue task${n.statusSummary.blocked + n.statusSummary.overdue === 1 ? '' : 's'}.`
      items.push({
        node: n,
        reason,
        suggestedChiefMove: !n.hasTask
          ? `Open the section and decide whether ${n.owner} should seed a task this week.`
          : `Quick check-in with ${n.owner}: confirm we still want this in scope this week.`
      })
    }
  }
  // 7. Filler — covered P0 sections with low / medium confidence.
  //    Chiefs can quickly re-link or rename the matched task to
  //    upgrade the match. Never blocks anything; just adds clarity.
  if (items.length < cap) {
    for (const n of nodes) {
      if (items.length >= cap) break
      if (n.priority !== 'P0') continue
      if (!n.hasTask) continue
      if (n.matchConfidence !== 'low' && n.matchConfidence !== 'medium') continue
      if (items.find((i) => i.node.id === n.id)) continue
      items.push({
        node: n,
        reason: `P0 section is covered, but the match is ${n.matchConfidence} confidence — the link could be clearer.`,
        suggestedChiefMove:
          n.coverageNote ||
          `Open the section and confirm the matched task ("${n.matchedTaskTitle ?? '—'}") really belongs here. Rename or re-link if not.`
      })
    }
  }
  return items
}
