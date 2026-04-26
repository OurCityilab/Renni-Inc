// Final Presentation Readiness Sprint 1 — pure helper that summarizes
// presentation readiness across studio-backed deliverables.
//
// Pure read-only. No persistence, no AI, no Firestore writes. Uses
// existing helpers:
//   - computeRequirementCoverage  (submit-gate state, untouched)
//   - computeOutputReadiness      (Playbook readiness, untouched)
//   - summarizeChapterProgress    (display-only progress chips)
//   - aggregateAdvisorSignals     (deterministic advisor)
//
// Posture (do not relax):
//   - never gates submit; never gates Playbook readiness
//   - never writes to Firestore
//   - never calls AI
//   - never edits due dates

import type {
  Deliverable,
  DeliverableOutput,
  Task
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import {
  aggregateAdvisorSignals,
  filterAggregatedByRoles,
  SEVERITY_RANK,
  type AggregatedAdvisorSignal
} from '~/utils/cSuiteAdvisor'
import type {
  AdvisorRole,
  AdvisorSignalSeverity
} from '~/types/advisor'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'
import { computeOutputReadiness } from '~/utils/outputReadiness'
import { summarizeChapterProgress } from '~/utils/deliverableOutputProgress'
import { computeDerived as computePricingDerived } from '~/utils/pricingStrategyMath'

// ---------- per-chapter readiness ----------

export interface ChapterReadinessRow {
  deliverable: Deliverable
  studio: TemplateStudio | null
  // Display-only — derived from existing helpers.
  status: Deliverable['status']
  finalTextDone: number // sections with non-empty finalText
  finalTextTotal: number
  evidenceCovered: number // sections with at least one evidence link or structured entry
  hasPricing: boolean
  hasMarketFitSegment: boolean
  hasFinalRecommendation: boolean
  // Submit-gate state (read-only; never modified).
  missingRequiredTaskCount: number
  // Advisor severity counts for THIS chapter.
  blockerCount: number
  riskCount: number
  watchCount: number
  // Days remaining until due date (positive future, negative past).
  // null when due date is missing or unparseable.
  daysToDue: number | null
  // Composite presentation-readiness band.
  band: 'ready' | 'almost' | 'at_risk' | 'not_started'
}

function safeIso(s: string | null | undefined): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysBetween(aIso: string, bIso: string): number {
  const [ay, am, ad] = aIso.split('-').map(Number)
  const [by, bm, bd] = bIso.split('-').map(Number)
  const a = new Date(ay, am - 1, ad).getTime()
  const b = new Date(by, bm - 1, bd).getTime()
  return Math.round((b - a) / 86_400_000)
}

function computeBand(args: {
  status: Deliverable['status']
  finalTextDone: number
  finalTextTotal: number
  blockerCount: number
  riskCount: number
}): ChapterReadinessRow['band'] {
  if (args.status === 'approved') return 'ready'
  if (args.blockerCount > 0) return 'at_risk'
  // Not started = no final text on any section AND no draft work
  // implied by zero advisor risks/blockers — heuristic only.
  if (args.finalTextDone === 0 && args.riskCount === 0 && args.blockerCount === 0)
    return 'not_started'
  if (args.finalTextDone >= args.finalTextTotal && args.riskCount === 0)
    return 'almost'
  return 'at_risk'
}

export interface BuildChapterReadinessInputs {
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  studioResolver: (d: Deliverable) => TemplateStudio | null
}

export function buildChapterReadiness(
  inputs: BuildChapterReadinessInputs,
  signals: AggregatedAdvisorSignal[]
): ChapterReadinessRow[] {
  const today = todayIso()
  const out: ChapterReadinessRow[] = []
  for (const d of inputs.deliverables) {
    const studio = inputs.studioResolver(d)
    const output = inputs.outputs[d.id] ?? null
    const tasksForD = inputs.tasks.filter((t) => t.deliverableId === d.id)
    const requirementCoverage = studio
      ? computeRequirementCoverage(studio.requirements, tasksForD)
      : null
    const readiness = studio ? computeOutputReadiness(studio, output) : null
    const progress = studio ? summarizeChapterProgress(studio, output) : null
    // Pricing detection: any section's pricingStrategy carries a price.
    let hasPricing = false
    let hasMarketFitSegment = false
    if (output) {
      for (const s of Object.values(output.sections ?? {})) {
        const ps = s.pricingStrategy
        if (ps?.proposedPrice != null && Number.isFinite(ps.proposedPrice)) {
          const derived = computePricingDerived(ps)
          if (derived.totalUnitCost > 0 || ps.proposedPrice > 0) hasPricing = true
        }
        if ((s.marketFit?.segments?.length ?? 0) > 0) hasMarketFitSegment = true
      }
    }
    // Final recommendation = any non-empty finalText anywhere in the chapter.
    const hasFinalRecommendation = (readiness?.sectionsWithFinalText ?? 0) > 0

    const chapterSignals = signals.filter((a) => a.deliverable.id === d.id)
    const blockerCount = chapterSignals.filter((a) => a.signal.severity === 'blocker').length
    const riskCount = chapterSignals.filter((a) => a.signal.severity === 'risk').length
    const watchCount = chapterSignals.filter((a) => a.signal.severity === 'watch').length

    const dueIso = safeIso(d.dueDate)
    const daysToDue = dueIso ? daysBetween(today, dueIso) : null

    out.push({
      deliverable: d,
      studio,
      status: d.status,
      finalTextDone: readiness?.sectionsWithFinalText ?? 0,
      finalTextTotal: readiness?.totalSections ?? 0,
      evidenceCovered: progress?.evidenceCovered ?? 0,
      hasPricing,
      hasMarketFitSegment,
      hasFinalRecommendation,
      missingRequiredTaskCount:
        requirementCoverage?.requiredRequirementsWithoutTasks.length ?? 0,
      blockerCount,
      riskCount,
      watchCount,
      daysToDue,
      band: computeBand({
        status: d.status,
        finalTextDone: readiness?.sectionsWithFinalText ?? 0,
        finalTextTotal: readiness?.totalSections ?? 0,
        blockerCount,
        riskCount
      })
    })
  }
  return out
}

// ---------- chief metrics ----------

export interface ChiefMetricsRow {
  role: AdvisorRole
  // Count of advisor signals owned or supported by this role.
  blockerCount: number
  riskCount: number
  watchCount: number
  infoCount: number
  // Count of chapters where this role has an open signal of any
  // severity (blocker / risk / watch).
  openChapters: number
  // Top 3 signals for this role (severity-sorted).
  topSignals: AggregatedAdvisorSignal[]
}

const ALL_ROLES: AdvisorRole[] = [
  'Co-CEOs',
  'CFO',
  'COO',
  'CMO',
  'Chief Strategy and Growth Officer',
  'Instructor/Admin'
]

export function buildChiefMetrics(
  signals: AggregatedAdvisorSignal[]
): ChiefMetricsRow[] {
  return ALL_ROLES.map((role) => {
    const own = filterAggregatedByRoles(signals, [role])
    const top = [...own]
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.signal.severity] - SEVERITY_RANK[b.signal.severity]
      )
      .slice(0, 3)
    const counts: Record<AdvisorSignalSeverity, number> = {
      blocker: 0,
      risk: 0,
      watch: 0,
      info: 0
    }
    const openChapterIds = new Set<string>()
    for (const a of own) {
      counts[a.signal.severity] += 1
      if (a.signal.severity !== 'info') openChapterIds.add(a.deliverable.id)
    }
    return {
      role,
      blockerCount: counts.blocker,
      riskCount: counts.risk,
      watchCount: counts.watch,
      infoCount: counts.info,
      openChapters: openChapterIds.size,
      topSignals: top
    }
  })
}

// ---------- composite top-line readiness ----------

export interface PresentationReadinessSummary {
  totalChapters: number
  approvedChapters: number
  inReviewChapters: number
  draftChapters: number
  needsRevisionChapters: number
  bandCounts: { ready: number; almost: number; at_risk: number; not_started: number }
  // Cross-cutting signal counts (across every studio-backed
  // deliverable). Mirrors cockpit summary cards.
  blockerCount: number
  riskCount: number
  watchCount: number
  // Task health, derived inline so the readiness page doesn't
  // re-implement the cockpit matrix.
  blockedTaskCount: number
  overdueTaskCount: number
  ownerlessTaskCount: number
  dueSoonTaskCount: number
}

export function buildSummary(
  rows: ChapterReadinessRow[],
  signals: AggregatedAdvisorSignal[],
  tasks: Task[]
): PresentationReadinessSummary {
  const today = todayIso()
  const bandCounts = { ready: 0, almost: 0, at_risk: 0, not_started: 0 }
  let approved = 0, inReview = 0, draft = 0, needsRevision = 0
  for (const r of rows) {
    bandCounts[r.band] += 1
    if (r.status === 'approved') approved += 1
    else if (r.status === 'in_review') inReview += 1
    else if (r.status === 'draft') draft += 1
    else if (r.status === 'needs_revision') needsRevision += 1
  }
  const blockerCount = signals.filter((a) => a.signal.severity === 'blocker').length
  const riskCount = signals.filter((a) => a.signal.severity === 'risk').length
  const watchCount = signals.filter((a) => a.signal.severity === 'watch').length

  let blockedTask = 0, overdueTask = 0, ownerlessTask = 0, dueSoon = 0
  for (const t of tasks) {
    if (t.status === 'blocked') blockedTask += 1
    if (
      (t.status === 'not_started' || t.status === 'in_progress') &&
      t.dueDate &&
      t.dueDate < today
    ) overdueTask += 1
    if (!t.ownerEmail || !t.ownerEmail.trim()) ownerlessTask += 1
    // Due soon = within 7 days, not done, not overdue
    if (
      t.status !== 'done' &&
      t.dueDate &&
      t.dueDate >= today
    ) {
      const days = daysBetween(today, t.dueDate)
      if (days >= 0 && days <= 7) dueSoon += 1
    }
  }

  return {
    totalChapters: rows.length,
    approvedChapters: approved,
    inReviewChapters: inReview,
    draftChapters: draft,
    needsRevisionChapters: needsRevision,
    bandCounts,
    blockerCount,
    riskCount,
    watchCount,
    blockedTaskCount: blockedTask,
    overdueTaskCount: overdueTask,
    ownerlessTaskCount: ownerlessTask,
    dueSoonTaskCount: dueSoon
  }
}

// ---------- shared process-order labels ----------

export const PROCESS_ORDER: string[] = [
  'Product / specs',
  'Segment / evidence',
  'Pricing / margin / comps',
  'Campaign / message',
  'Operations readiness',
  'Phoenix Nest carry',
  'Final Playbook text',
  'Submit / review'
]

// ---------- aggregator wiring helper ----------
// One-stop call that produces every readiness view from raw inputs.
// Used by /presentation-readiness, /timeline backplan, and the
// Export Center.
export function buildPresentationReadiness(
  inputs: BuildChapterReadinessInputs
): {
  signals: AggregatedAdvisorSignal[]
  rows: ChapterReadinessRow[]
  summary: PresentationReadinessSummary
  chiefMetrics: ChiefMetricsRow[]
} {
  const signals = aggregateAdvisorSignals({
    deliverables: inputs.deliverables,
    tasks: inputs.tasks,
    outputs: inputs.outputs,
    studioResolver: inputs.studioResolver
  })
  const rows = buildChapterReadiness(inputs, signals)
  const summary = buildSummary(rows, signals, inputs.tasks)
  const chiefMetrics = buildChiefMetrics(signals)
  return { signals, rows, summary, chiefMetrics }
}
