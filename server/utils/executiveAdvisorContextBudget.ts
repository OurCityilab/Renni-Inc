// Executive Advisor V2 — mode-aware context budgeter.
//
// The V2 context (`ExecutiveAdvisorContextV2`) carries the full
// Renni Inc. picture: every chapter, every section's builder
// coverage, the full final-week lane map, every dependency signal,
// every product catalog entry, and the V1 base package
// (deliverables + open tasks + recent decisions). Stringified, it
// blows past the 28_000-char per-template input budget.
//
// `compactContextForMode()` produces a slimmer JSON-serializable
// object that:
//   - keeps every field the matching mode actually uses
//   - hard-caps every list with conservative limits
//   - prioritizes records that match the chief's `focus` string
//   - prefers P0 over P1 over P2
//   - prefers blocked / overdue / ready-for-review over normal draft
//   - replaces the full builderCoverage list with a summary plus
//     the focused or P0 records, depending on mode
//
// POSTURE (do not relax)
// ----------------------
//   - Pure function. Read of the existing V2 context only — no
//     Firestore call, no AI call, no mutation.
//   - Behavior-preserving: the model still receives every field
//     the prompt instructions reference; it just receives fewer
//     items per list. The eight modes, the action-card schema,
//     `humanReviewRequired`, the safety scan, and the invocation
//     metadata path are unchanged.
//   - Conservative caps: when in doubt, drop records rather than
//     include them. The chief can always re-run with focus.

import type {
  AdvisorMode
} from '~~/app/types/executiveAdvisor'
import type {
  ExecutiveAdvisorContextV2,
  BuilderCoverageEntry,
  BuilderCoverageSummary,
  CompactTaskCoverageContext,
  TaskCoverageGap,
  ProductCatalogContextEntry
} from '~~/server/utils/executiveAdvisorContext'
import type { ArchetypeLibrarySummaryEntry } from '~~/app/utils/customerArchetypes'
import type {
  FinalWeekLane,
  FinalWeekSectionEntry
} from '~~/app/utils/finalWeekCompletion'
import type {
  ExecutiveContextDeliverable,
  ExecutiveContextTask
} from '~~/server/utils/executiveContext'
import type { ProjectNavigatorSignal } from '~~/app/utils/projectNavigatorSignals'

// ---- Hard caps ---------------------------------------------------

const CAPS = {
  sections: 20,
  tasks: 25,
  deliverables: 15,
  dependencySignals: 15,
  taskCoverageGaps: 20,
  // No structured evidence summaries reach the V2 context today,
  // but reserved here for future use so the cap is centralised.
  evidenceSummaries: 15,
  builderCoverage: 20,
  finalWeekLanes: 10
} as const

// ---- Compact view shape ------------------------------------------
//
// The shape is deliberately a subset of `ExecutiveAdvisorContextV2`:
// every field is either the original (when small) or a trimmed /
// reshaped version. Field names match the original where possible
// so the prompt instructions still reference the right keys.

export interface CompactAdvisorContext {
  /** Identical to the V2 context viewer block. */
  viewer: ExecutiveAdvisorContextV2['base']['viewer']
  /** Identical V1 summary roll-up. */
  summary: ExecutiveAdvisorContextV2['base']['summary']
  /** Today's ISO date. */
  todayIso: string
  /** Optional focus string the chief supplied — surfaces verbatim
   *  so the model can repeat it back. */
  focus?: string | null
  focusHint?: string | null
  /** Bounded deliverable list (capped + filtered by focus when
   *  applicable). */
  deliverables: ExecutiveContextDeliverable[]
  /** Bounded open-task list. */
  openTasks: ExecutiveContextTask[]
  /** Roll-up counts of dependency signals — always emitted. */
  dependencySignalCounts: Record<string, number>
  /** Bounded dependency signals. */
  dependencySignals: ProjectNavigatorSignal[]
  /** Per-section dependency hints — only entries relevant to the
   *  current selection. */
  sectionDependencyHints: Record<string, readonly string[]>
  /** Final-week lane summary — title + ownerSummary + P0 section
   *  ids only. Full sections array is omitted; specific entries
   *  are included via `focusedFinalWeekSections`. */
  finalWeekLanesSummary: Array<{
    id: string
    title: string
    ownerSummary: string
    p0Sections: string[]
    p1Sections: string[]
    p2Sections: string[]
  }>
  /** Focused / P0 section entries from the lane map. Capped. */
  focusedFinalWeekSections: FinalWeekSectionEntry[]
  /** Recommended task titles for P0 sections matching the current
   *  selection. Empty when not relevant to the mode. */
  finalWeekTaskTemplateRefs: Array<{
    id: string
    title: string
    owner: string
    sectionId: string
    playbookChapter: number
  }>
  /** Bounded task coverage gaps — `missing: true` first. */
  taskCoverageGaps: TaskCoverageGap[]
  /** Builder coverage — always include the summary; the per-record
   *  list is mode + focus dependent. */
  builderCoverageSummary: BuilderCoverageSummary
  builderCoverage: BuilderCoverageEntry[]
  /** Bounded product catalog — always small enough to include
   *  whole, but trimmed when not relevant. */
  productCatalog: ProductCatalogContextEntry[]
  /** Deterministic task coverage. Always included — small by
   *  construction (summary + top-N missing + top-N blocked +
   *  top-5 chief focus). The Advisor uses this as factual ground
   *  for management advice. */
  taskCoverage: CompactTaskCoverageContext
  /** Compact customer-archetype library — small enough to include
   *  on every request. The Advisor uses these as STARTING
   *  HYPOTHESES the team must validate with evidence, never as
   *  facts. */
  customerArchetypeLibrary: ArchetypeLibrarySummaryEntry[]
  /** Explicit unknowns from the source context. */
  unknowns: string[]
  /** Mode-aware notes the model can read directly to know what was
   *  trimmed and why. */
  budgetNotes: string[]
}

// ---- Public entry point ------------------------------------------

export function compactContextForMode(
  context: ExecutiveAdvisorContextV2,
  mode: AdvisorMode,
  focus: string | null,
  focusHint: string | null
): CompactAdvisorContext {
  const focusText = (focus ?? '').trim()
  const focusHintText = (focusHint ?? '').trim()
  const focusKeywords = collectFocusKeywords(focusText, focusHintText)
  const budgetNotes: string[] = []

  // Lane summary is small enough to always include.
  const finalWeekLanesSummary = buildLaneSummary(context.finalWeekLanes)

  // Per-mode selection.
  const selection = selectByMode(
    mode,
    context,
    focusKeywords,
    budgetNotes
  )

  return {
    viewer: context.base.viewer,
    summary: context.base.summary,
    todayIso: context.todayIso,
    focus: focusText || null,
    focusHint: focusHintText || null,
    deliverables: selection.deliverables,
    openTasks: selection.openTasks,
    dependencySignalCounts: countSignalsBySeverity(context.dependencySignals),
    dependencySignals: selection.dependencySignals,
    sectionDependencyHints: selection.sectionDependencyHints,
    finalWeekLanesSummary,
    focusedFinalWeekSections: selection.focusedFinalWeekSections,
    finalWeekTaskTemplateRefs: selection.finalWeekTaskTemplateRefs,
    taskCoverageGaps: selection.taskCoverageGaps,
    builderCoverageSummary: context.builderCoverageSummary,
    builderCoverage: selection.builderCoverage,
    productCatalog: selection.productCatalog,
    taskCoverage: context.taskCoverage,
    customerArchetypeLibrary: context.customerArchetypeLibrary,
    unknowns: context.unknowns,
    budgetNotes
  }
}

// ---- Selection per mode ------------------------------------------

interface ModeSelection {
  deliverables: ExecutiveContextDeliverable[]
  openTasks: ExecutiveContextTask[]
  dependencySignals: ProjectNavigatorSignal[]
  sectionDependencyHints: Record<string, readonly string[]>
  focusedFinalWeekSections: FinalWeekSectionEntry[]
  finalWeekTaskTemplateRefs: CompactAdvisorContext['finalWeekTaskTemplateRefs']
  taskCoverageGaps: TaskCoverageGap[]
  builderCoverage: BuilderCoverageEntry[]
  productCatalog: ProductCatalogContextEntry[]
}

function selectByMode(
  mode: AdvisorMode,
  context: ExecutiveAdvisorContextV2,
  focusKeywords: string[],
  budgetNotes: string[]
): ModeSelection {
  switch (mode) {
    case 'daily-chief-brief': {
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        CAPS.sections,
        ['P0', 'P1']
      )
      const deliverables = trimDeliverables(
        context.base.deliverables,
        focusKeywords,
        CAPS.deliverables
      )
      const openTasks = trimTasks(
        context.base.openTasks,
        focusKeywords,
        CAPS.tasks
      )
      const dependencySignals = trimDependencySignals(
        context.dependencySignals,
        focusKeywords,
        CAPS.dependencySignals
      )
      const taskCoverageGaps = trimTaskCoverageGaps(
        context.taskCoverageGaps,
        focusKeywords,
        CAPS.taskCoverageGaps
      )
      // Daily brief gets summary-only builder coverage by default
      // and only the focused records on top.
      const builderCoverage = focusKeywords.length
        ? trimBuilderCoverage(
            context.builderCoverage,
            focusKeywords,
            CAPS.builderCoverage
          )
        : []
      noteIfTrimmed(
        budgetNotes,
        'builderCoverage',
        context.builderCoverage.length,
        builderCoverage.length,
        'See builderCoverageSummary for the full roll-up; pass focus to widen the per-section view.'
      )
      return {
        deliverables,
        openTasks,
        dependencySignals,
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          sectionIdsFromMixedSources(sections, deliverables, openTasks)
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: pickTaskTemplateRefs(
          context.finalWeekTaskTemplates,
          sectionIdSet(sections)
        ),
        taskCoverageGaps,
        builderCoverage,
        productCatalog: []
      }
    }

    case 'run-the-room': {
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        CAPS.sections,
        ['P0']
      )
      const openTasks = trimTasks(
        context.base.openTasks,
        focusKeywords,
        CAPS.tasks
      )
      const dependencySignals = trimDependencySignals(
        context.dependencySignals,
        focusKeywords,
        CAPS.dependencySignals
      )
      return {
        deliverables: trimDeliverables(
          context.base.deliverables,
          focusKeywords,
          CAPS.deliverables
        ),
        openTasks,
        dependencySignals,
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          sectionIdSet(sections)
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: [],
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps,
          focusKeywords,
          10
        ),
        builderCoverage: [],
        productCatalog: []
      }
    }

    case 'section-rescue': {
      // Strongly prefers focus. If no focus, return a tight P0
      // selection and a budget note asking for one.
      if (focusKeywords.length === 0) {
        budgetNotes.push(
          'Section Rescue works best with a focus — try a section id (e.g. unit-cost) or a chapter id (e.g. ch-08).'
        )
      }
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        Math.min(CAPS.sections, focusKeywords.length ? 6 : 10),
        ['P0', 'P1']
      )
      const focusedSectionIds = sectionIdSet(sections)
      const deliverables = trimDeliverables(
        context.base.deliverables,
        focusKeywords,
        Math.min(CAPS.deliverables, 6)
      )
      const openTasks = trimTasks(
        context.base.openTasks,
        focusKeywords,
        Math.min(CAPS.tasks, 12)
      )
      const dependencySignals = trimDependencySignals(
        context.dependencySignals,
        focusKeywords,
        Math.min(CAPS.dependencySignals, 8)
      )
      const builderCoverage = trimBuilderCoverage(
        context.builderCoverage.filter(
          (b) =>
            focusedSectionIds.has(b.sectionId) ||
            matchesFocus(`${b.deliverableId}:${b.sectionId}`, focusKeywords) ||
            matchesFocus(b.sectionTitle, focusKeywords)
        ),
        focusKeywords,
        Math.min(CAPS.builderCoverage, 6)
      )
      return {
        deliverables,
        openTasks,
        dependencySignals,
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          focusedSectionIds
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: pickTaskTemplateRefs(
          context.finalWeekTaskTemplates,
          focusedSectionIds
        ),
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps.filter((g) =>
            focusedSectionIds.has(g.sectionId)
          ),
          focusKeywords,
          Math.min(CAPS.taskCoverageGaps, 6)
        ),
        builderCoverage,
        productCatalog: []
      }
    }

    case 'task-coverage-doctor': {
      const taskCoverageGaps = trimTaskCoverageGaps(
        context.taskCoverageGaps,
        focusKeywords,
        CAPS.taskCoverageGaps
      )
      const focusedSectionIds = new Set(taskCoverageGaps.map((g) => g.sectionId))
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        CAPS.sections,
        ['P0', 'P1']
      )
      return {
        deliverables: [],
        openTasks: trimTasks(
          context.base.openTasks,
          focusKeywords,
          CAPS.tasks
        ),
        dependencySignals: [],
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          focusedSectionIds
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: pickTaskTemplateRefs(
          context.finalWeekTaskTemplates,
          focusedSectionIds.size > 0
            ? focusedSectionIds
            : sectionIdSet(sections)
        ),
        taskCoverageGaps,
        builderCoverage: [],
        productCatalog: []
      }
    }

    case 'approval-coach': {
      if (focusKeywords.length === 0) {
        budgetNotes.push(
          'Approval Coach works best with a focus — name the section id or deliverable id you are about to approve.'
        )
      }
      const deliverables = trimDeliverables(
        context.base.deliverables,
        focusKeywords,
        Math.min(CAPS.deliverables, 6)
      )
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        Math.min(CAPS.sections, 8),
        ['P0', 'P1']
      )
      const focusedSectionIds = sectionIdSet(sections)
      const builderCoverage = trimBuilderCoverage(
        context.builderCoverage.filter(
          (b) =>
            focusedSectionIds.has(b.sectionId) ||
            matchesFocus(`${b.deliverableId}:${b.sectionId}`, focusKeywords)
        ),
        focusKeywords,
        Math.min(CAPS.builderCoverage, 6)
      )
      return {
        deliverables,
        openTasks: trimTasks(
          context.base.openTasks,
          focusKeywords,
          Math.min(CAPS.tasks, 10)
        ),
        dependencySignals: trimDependencySignals(
          context.dependencySignals.filter((s) =>
            focusedSectionIds.has(s.chapterId ?? '') ||
            (s.deliverableId &&
              focusedDeliverableId(focusKeywords).has(s.deliverableId))
          ),
          focusKeywords,
          6
        ),
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          focusedSectionIds
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: pickTaskTemplateRefs(
          context.finalWeekTaskTemplates,
          focusedSectionIds
        ),
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps.filter((g) =>
            focusedSectionIds.has(g.sectionId)
          ),
          focusKeywords,
          Math.min(CAPS.taskCoverageGaps, 6)
        ),
        builderCoverage,
        productCatalog: []
      }
    }

    case 'dependency-explainer': {
      const dependencySignals = trimDependencySignals(
        context.dependencySignals,
        focusKeywords,
        CAPS.dependencySignals
      )
      const affectedSectionIds = new Set(
        dependencySignals
          .map((s) => s.chapterId ?? '')
          .filter((id) => id.length > 0)
      )
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        Math.min(CAPS.sections, 12),
        ['P0', 'P1']
      )
      return {
        deliverables: trimDeliverables(
          context.base.deliverables,
          focusKeywords,
          Math.min(CAPS.deliverables, 8)
        ),
        openTasks: trimTasks(
          context.base.openTasks,
          focusKeywords,
          Math.min(CAPS.tasks, 12)
        ),
        dependencySignals,
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          mergeSets(affectedSectionIds, sectionIdSet(sections))
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: [],
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps,
          focusKeywords,
          Math.min(CAPS.taskCoverageGaps, 8)
        ),
        builderCoverage: trimBuilderCoverage(
          context.builderCoverage,
          focusKeywords,
          Math.min(CAPS.builderCoverage, 6)
        ),
        productCatalog: []
      }
    }

    case 'phoenix-nest-pitch-coach': {
      // Phoenix Nest pitch is Ch. 11. Ch. 5 brand book + Ch. 7 / 8
      // finance feed it. Force the focus keyword set to those
      // chapters so the rest of the slimming logic prioritizes
      // them even when the chief left focus blank.
      const ch11Focus = mergeKeywords(focusKeywords, [
        'ch-11',
        'phoenix nest',
        'phoenix-nest',
        'ch-08',
        'finance',
        'ch-07',
        'ch-05',
        'brand'
      ])
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        ch11Focus,
        CAPS.sections,
        ['P0']
      )
      const focusedSectionIds = sectionIdSet(sections)
      const builderCoverage = trimBuilderCoverage(
        context.builderCoverage.filter(
          (b) =>
            b.deliverableId === 'ch-11-phoenix-nest-retail-carry-pitch' ||
            b.deliverableId === 'ch-08-finance-and-revenue-model' ||
            b.deliverableId === 'ch-07-current-product-line-and-pricing' ||
            b.deliverableId === 'ch-05-house-phoenix-brand-book'
        ),
        focusKeywords,
        CAPS.builderCoverage
      )
      return {
        deliverables: trimDeliverables(
          context.base.deliverables,
          ch11Focus,
          CAPS.deliverables
        ),
        openTasks: trimTasks(
          context.base.openTasks,
          ch11Focus,
          CAPS.tasks
        ),
        dependencySignals: trimDependencySignals(
          context.dependencySignals,
          ch11Focus,
          CAPS.dependencySignals
        ),
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          focusedSectionIds
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: pickTaskTemplateRefs(
          context.finalWeekTaskTemplates,
          focusedSectionIds
        ),
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps,
          ch11Focus,
          CAPS.taskCoverageGaps
        ),
        builderCoverage,
        productCatalog: context.productCatalog
      }
    }

    case 'final-week-triage': {
      // Triage needs the lane map plus the loaded gaps + signals.
      // Builder coverage is the summary roll-up only.
      const sections = pickFocusedFinalWeekSections(
        context.finalWeekLanes,
        focusKeywords,
        CAPS.sections,
        ['P0', 'P1', 'P2']
      )
      return {
        deliverables: trimDeliverables(
          context.base.deliverables,
          focusKeywords,
          CAPS.deliverables
        ),
        openTasks: trimTasks(
          context.base.openTasks,
          focusKeywords,
          CAPS.tasks
        ),
        dependencySignals: trimDependencySignals(
          context.dependencySignals,
          focusKeywords,
          CAPS.dependencySignals
        ),
        sectionDependencyHints: pickRelevantHints(
          context.sectionDependencyHints,
          sectionIdSet(sections)
        ),
        focusedFinalWeekSections: sections,
        finalWeekTaskTemplateRefs: [],
        taskCoverageGaps: trimTaskCoverageGaps(
          context.taskCoverageGaps,
          focusKeywords,
          CAPS.taskCoverageGaps
        ),
        builderCoverage: [],
        productCatalog: []
      }
    }
  }
}

// ---- Filters and trimmers ---------------------------------------

function trimDeliverables(
  list: readonly ExecutiveContextDeliverable[],
  focusKeywords: readonly string[],
  cap: number
): ExecutiveContextDeliverable[] {
  const matched: ExecutiveContextDeliverable[] = []
  const unmatched: ExecutiveContextDeliverable[] = []
  for (const d of list) {
    if (focusKeywords.length && deliverableMatchesFocus(d, focusKeywords)) {
      matched.push(d)
    } else {
      unmatched.push(d)
    }
  }
  // Prefer drafts / needs_revision / in_review over approved within
  // each bucket so blocked work surfaces first.
  matched.sort(byDeliverableUrgency)
  unmatched.sort(byDeliverableUrgency)
  const out = [...matched, ...unmatched]
  return out.slice(0, cap)
}

function deliverableMatchesFocus(
  d: ExecutiveContextDeliverable,
  focusKeywords: readonly string[]
): boolean {
  return (
    matchesFocus(d.id, focusKeywords) ||
    matchesFocus(d.title, focusKeywords) ||
    matchesFocus(d.department ?? '', focusKeywords) ||
    matchesFocus(`ch-${String(d.chapter ?? '').padStart(2, '0')}`, focusKeywords)
  )
}

function byDeliverableUrgency(
  a: ExecutiveContextDeliverable,
  b: ExecutiveContextDeliverable
): number {
  const order: Record<string, number> = {
    needs_revision: 0,
    in_review: 1,
    draft: 2,
    approved: 3
  }
  const ar = order[a.status] ?? 9
  const br = order[b.status] ?? 9
  if (ar !== br) return ar - br
  return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
}

function trimTasks(
  list: readonly ExecutiveContextTask[],
  focusKeywords: readonly string[],
  cap: number
): ExecutiveContextTask[] {
  const matched: ExecutiveContextTask[] = []
  const unmatched: ExecutiveContextTask[] = []
  for (const t of list) {
    if (focusKeywords.length && taskMatchesFocus(t, focusKeywords)) {
      matched.push(t)
    } else {
      unmatched.push(t)
    }
  }
  matched.sort(byTaskUrgency)
  unmatched.sort(byTaskUrgency)
  return [...matched, ...unmatched].slice(0, cap)
}

function taskMatchesFocus(
  t: ExecutiveContextTask,
  focusKeywords: readonly string[]
): boolean {
  return (
    matchesFocus(t.id, focusKeywords) ||
    matchesFocus(t.title, focusKeywords) ||
    matchesFocus(t.department ?? '', focusKeywords) ||
    matchesFocus(t.deliverableId ?? '', focusKeywords)
  )
}

function byTaskUrgency(
  a: ExecutiveContextTask,
  b: ExecutiveContextTask
): number {
  const order: Record<string, number> = {
    blocked: 0,
    in_progress: 1,
    not_started: 2,
    done: 3
  }
  const ar = order[a.status] ?? 9
  const br = order[b.status] ?? 9
  if (ar !== br) return ar - br
  return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
}

function trimDependencySignals(
  list: readonly ProjectNavigatorSignal[],
  focusKeywords: readonly string[],
  cap: number
): ProjectNavigatorSignal[] {
  const matched: ProjectNavigatorSignal[] = []
  const unmatched: ProjectNavigatorSignal[] = []
  for (const s of list) {
    if (focusKeywords.length && signalMatchesFocus(s, focusKeywords)) {
      matched.push(s)
    } else {
      unmatched.push(s)
    }
  }
  // Existing helper already sorts by severity; preserve that
  // ordering within each bucket (matched / unmatched).
  return [...matched, ...unmatched].slice(0, cap)
}

function signalMatchesFocus(
  s: ProjectNavigatorSignal,
  focusKeywords: readonly string[]
): boolean {
  return (
    matchesFocus(s.label, focusKeywords) ||
    matchesFocus(s.reason, focusKeywords) ||
    matchesFocus(s.chapterId ?? '', focusKeywords) ||
    matchesFocus(s.deliverableId ?? '', focusKeywords) ||
    matchesFocus(s.department ?? '', focusKeywords)
  )
}

function trimTaskCoverageGaps(
  list: readonly TaskCoverageGap[],
  focusKeywords: readonly string[],
  cap: number
): TaskCoverageGap[] {
  const missing = list.filter((g) => g.missing)
  const present = list.filter((g) => !g.missing)
  const matchedMissing = missing.filter((g) =>
    focusKeywords.length ? gapMatchesFocus(g, focusKeywords) : false
  )
  const otherMissing = missing.filter((g) => !matchedMissing.includes(g))
  const matchedPresent = present.filter((g) =>
    focusKeywords.length ? gapMatchesFocus(g, focusKeywords) : false
  )
  const otherPresent = present.filter((g) => !matchedPresent.includes(g))
  return [...matchedMissing, ...otherMissing, ...matchedPresent, ...otherPresent].slice(0, cap)
}

function gapMatchesFocus(
  g: TaskCoverageGap,
  focusKeywords: readonly string[]
): boolean {
  return (
    matchesFocus(g.deliverableId, focusKeywords) ||
    matchesFocus(g.sectionId, focusKeywords) ||
    matchesFocus(g.recommendedTaskTitle, focusKeywords) ||
    matchesFocus(g.laneId, focusKeywords)
  )
}

function trimBuilderCoverage(
  list: readonly BuilderCoverageEntry[],
  focusKeywords: readonly string[],
  cap: number
): BuilderCoverageEntry[] {
  const matched: BuilderCoverageEntry[] = []
  const unmatched: BuilderCoverageEntry[] = []
  for (const b of list) {
    if (focusKeywords.length && builderEntryMatchesFocus(b, focusKeywords)) {
      matched.push(b)
    } else {
      unmatched.push(b)
    }
  }
  // Within unmatched, prefer entries that have a builder over recipe-only.
  unmatched.sort((a, b) => {
    if (a.hasBuilder !== b.hasBuilder) return a.hasBuilder ? -1 : 1
    return 0
  })
  return [...matched, ...unmatched].slice(0, cap)
}

function builderEntryMatchesFocus(
  b: BuilderCoverageEntry,
  focusKeywords: readonly string[]
): boolean {
  return (
    matchesFocus(b.deliverableId, focusKeywords) ||
    matchesFocus(b.sectionId, focusKeywords) ||
    matchesFocus(b.sectionTitle, focusKeywords) ||
    matchesFocus(b.primaryFamily, focusKeywords)
  )
}

// ---- Final-week lane helpers ------------------------------------

function buildLaneSummary(
  lanes: readonly FinalWeekLane[]
): CompactAdvisorContext['finalWeekLanesSummary'] {
  return lanes.slice(0, CAPS.finalWeekLanes).map((lane) => ({
    id: lane.id,
    title: lane.title,
    ownerSummary: lane.ownerSummary,
    p0Sections: lane.sections.filter((s) => s.priority === 'P0').map((s) => s.id),
    p1Sections: lane.sections.filter((s) => s.priority === 'P1').map((s) => s.id),
    p2Sections: lane.sections.filter((s) => s.priority === 'P2').map((s) => s.id)
  }))
}

function pickFocusedFinalWeekSections(
  lanes: readonly FinalWeekLane[],
  focusKeywords: readonly string[],
  cap: number,
  priorityWhitelist: ReadonlyArray<'P0' | 'P1' | 'P2'>
): FinalWeekSectionEntry[] {
  const matched: FinalWeekSectionEntry[] = []
  const unmatched: FinalWeekSectionEntry[] = []
  for (const lane of lanes) {
    for (const entry of lane.sections) {
      if (!priorityWhitelist.includes(entry.priority)) continue
      const matchesEntry =
        focusKeywords.length === 0
          ? false
          : matchesFocus(entry.id, focusKeywords) ||
            matchesFocus(entry.title, focusKeywords) ||
            matchesFocus(entry.deliverableId, focusKeywords) ||
            matchesFocus(entry.sectionId, focusKeywords) ||
            matchesFocus(entry.laneId, focusKeywords) ||
            matchesFocus(lane.title, focusKeywords) ||
            matchesFocus(entry.owner, focusKeywords)
      if (matchesEntry) {
        matched.push(entry)
      } else {
        unmatched.push(entry)
      }
    }
  }
  // Sort each bucket by priority rank.
  const rank: Record<'P0' | 'P1' | 'P2', number> = { P0: 0, P1: 1, P2: 2 }
  matched.sort((a, b) => rank[a.priority] - rank[b.priority])
  unmatched.sort((a, b) => rank[a.priority] - rank[b.priority])
  return [...matched, ...unmatched].slice(0, cap)
}

function pickTaskTemplateRefs(
  templates: ExecutiveAdvisorContextV2['finalWeekTaskTemplates'],
  sectionIds: ReadonlySet<string>
): CompactAdvisorContext['finalWeekTaskTemplateRefs'] {
  if (sectionIds.size === 0) return []
  return templates
    .filter((t) => sectionIds.has(t.sectionId))
    .map((t) => ({
      id: t.id,
      title: t.title,
      owner: t.owner,
      sectionId: t.sectionId,
      playbookChapter: t.playbookChapter
    }))
}

function pickRelevantHints(
  hints: Readonly<Record<string, readonly string[]>>,
  sectionIds: ReadonlySet<string>
): Record<string, readonly string[]> {
  if (sectionIds.size === 0) return {}
  const out: Record<string, readonly string[]> = {}
  for (const sid of sectionIds) {
    const list = hints[sid]
    if (list && list.length) out[sid] = list
  }
  return out
}

function sectionIdSet(
  sections: readonly FinalWeekSectionEntry[]
): Set<string> {
  return new Set(sections.map((s) => s.sectionId))
}

function sectionIdsFromMixedSources(
  sections: readonly FinalWeekSectionEntry[],
  deliverables: readonly ExecutiveContextDeliverable[],
  tasks: readonly ExecutiveContextTask[]
): Set<string> {
  const out = sectionIdSet(sections)
  for (const d of deliverables) out.add(d.id)
  for (const t of tasks) {
    if (t.deliverableId) out.add(t.deliverableId)
  }
  return out
}

function focusedDeliverableId(
  focusKeywords: readonly string[]
): Set<string> {
  // Loose match: any keyword starting with `ch-` is treated as a
  // deliverable id prefix candidate.
  const out = new Set<string>()
  for (const k of focusKeywords) {
    if (k.startsWith('ch-')) out.add(k)
  }
  return out
}

function mergeSets<T>(...sets: ReadonlyArray<ReadonlySet<T>>): Set<T> {
  const out = new Set<T>()
  for (const s of sets) for (const v of s) out.add(v)
  return out
}

// ---- Focus / keyword helpers ------------------------------------

function collectFocusKeywords(focus: string, focusHint: string): string[] {
  const raw = `${focus} ${focusHint}`.toLowerCase()
  const tokens = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
  // De-duplicate while preserving insertion order.
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tokens) {
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

function matchesFocus(
  haystack: string,
  focusKeywords: readonly string[]
): boolean {
  if (!haystack) return false
  if (focusKeywords.length === 0) return false
  const hay = haystack.toLowerCase()
  return focusKeywords.some((k) => hay.includes(k))
}

function mergeKeywords(
  base: readonly string[],
  extras: readonly string[]
): string[] {
  const seen = new Set<string>(base.map((s) => s.toLowerCase()))
  const out: string[] = [...base]
  for (const k of extras) {
    const lower = k.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(lower)
  }
  return out
}

// ---- Misc helpers -----------------------------------------------

function countSignalsBySeverity(
  signals: readonly ProjectNavigatorSignal[]
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of signals) {
    counts[s.severity] = (counts[s.severity] ?? 0) + 1
  }
  return counts
}

function noteIfTrimmed(
  notes: string[],
  field: string,
  before: number,
  after: number,
  reason: string
): void {
  if (after < before) {
    notes.push(`${field}: ${after}/${before} entries kept. ${reason}`)
  }
}
