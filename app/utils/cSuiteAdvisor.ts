// C-Suite Advisor V1 — pure deterministic signal generator.
//
// Inputs in, signals out. No Firestore reads, no Firestore writes,
// no AI calls, no side effects. The caller (chapter hub) renders
// the signals; the chief decides what to push.
//
// What this module does NOT do (do not relax in V1):
//   - never persists output (signals live in component state)
//   - never creates tasks
//   - never approves or submits a deliverable
//   - never duplicates submit-eligibility logic — it imports
//     RequirementCoverageSummary from requirementCoverage.ts and
//     uses what's already there
//   - never reads cross-collection state the caller doesn't already
//     pass in (no new fetches)
//
// The rule blocks below are intentionally chunky and explicit.
// Renaissance students should be able to read this file and trace
// "this signal exists because of this condition" without LLM help.

import type { Deliverable, DeliverableOutput, Task } from '~/types/models'
import type { TemplateStudio, TemplateStudioRequirement } from '~/types/templateStudio'
import type {
  RequirementCoverageEntry,
  RequirementCoverageSummary
} from '~/utils/requirementCoverage'
import type {
  AdvisorRole,
  AdvisorSignal,
  AdvisorSignalSeverity,
  AdvisorSource,
  AdvisorSuggestedTask
} from '~/types/advisor'
import {
  analyzeComps,
  computeDerived,
  interpretMargin
} from '~/utils/pricingStrategyMath'
import { summarizeChapterProgress } from '~/utils/deliverableOutputProgress'

// ---------- input shape ----------

export interface AdvisorInputs {
  deliverable: Deliverable
  studio: TemplateStudio | null
  tasks: Task[]
  output: DeliverableOutput | null
  // Optional — when omitted (e.g., non-studio deliverable), advisor
  // skips requirement signals.
  requirementCoverage?: RequirementCoverageSummary | null
}

// ---------- owner mapping ----------

// Department → AdvisorRole. The Department literal includes
// 'executive' (Co-CEOs) and 'admin' (Instructor/Admin) plus the
// chief departments. Studio requirements often carry a department,
// so this is the first-line map; falls back to keyword scan below.
function ownerFromDepartment(
  dept: TemplateStudioRequirement['department'] | null | undefined
): AdvisorRole | null {
  switch (dept) {
    case 'finance':
      return 'CFO'
    case 'operations':
      return 'COO'
    case 'marketing':
      return 'CMO'
    case 'strategy-growth':
      return 'Chief Strategy and Growth Officer'
    case 'executive':
      return 'Co-CEOs'
    case 'admin':
      return 'Instructor/Admin'
    default:
      return null
  }
}

// Keyword fallback — matches against the requirement label /
// description / suggestedTaskTitle. Order matters: more specific
// matches first.
function ownerFromKeywords(text: string): AdvisorRole {
  const t = text.toLowerCase()
  if (
    t.includes('price') ||
    t.includes('pricing') ||
    t.includes('margin') ||
    t.includes('break-even') ||
    t.includes('break even') ||
    t.includes('revenue') ||
    t.includes('donation') ||
    t.includes('kpi') ||
    t.includes('finance')
  ) {
    return 'CFO'
  }
  if (
    t.includes('inventory') ||
    t.includes('production') ||
    t.includes('staffing') ||
    t.includes('sop') ||
    t.includes('handoff') ||
    t.includes('baked goods handling') ||
    t.includes('operations')
  ) {
    return 'COO'
  }
  if (
    t.includes('brand voice') ||
    t.includes('campaign') ||
    t.includes('signage') ||
    t.includes('content') ||
    t.includes('messaging') ||
    t.includes('pitch language') ||
    t.includes('marketing')
  ) {
    return 'CMO'
  }
  if (
    t.includes('segment') ||
    t.includes('interview') ||
    t.includes('survey') ||
    t.includes('customer evidence') ||
    t.includes('validation') ||
    t.includes('strategy') ||
    t.includes('growth')
  ) {
    return 'Chief Strategy and Growth Officer'
  }
  if (
    t.includes('approval') ||
    t.includes('coherence') ||
    t.includes('final review') ||
    t.includes('co-ceo')
  ) {
    return 'Co-CEOs'
  }
  if (
    t.includes('instructor') ||
    t.includes('grading') ||
    t.includes('override') ||
    t.includes('admin')
  ) {
    return 'Instructor/Admin'
  }
  // Sensible default for cross-functional asks.
  return 'Co-CEOs'
}

function ownerForRequirement(req: TemplateStudioRequirement): AdvisorRole {
  return (
    ownerFromDepartment(req.department) ??
    ownerFromKeywords(`${req.label} ${req.description} ${req.suggestedTaskTitle ?? ''}`)
  )
}

// ---------- severity ranking ----------

const SEVERITY_RANK: Record<AdvisorSignalSeverity, number> = {
  blocker: 0,
  risk: 1,
  watch: 2,
  info: 3
}

export function sortSignalsBySeverity(signals: AdvisorSignal[]): AdvisorSignal[] {
  return [...signals].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}

// ---------- helpers ----------

function makeId(prefix: string, parts: Array<string | number | undefined | null>): string {
  return [prefix, ...parts.filter((p) => p != null && p !== '')].join(':')
}

function isStudioBacked(studio: TemplateStudio | null): studio is TemplateStudio {
  return Boolean(studio)
}

// Today, in YYYY-MM-DD form, for overdue comparison. We keep it
// timezone-agnostic by using the local date — close enough for an
// advisory chip; the chief is the source of truth.
function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---------- rule builders ----------

// Rule G first — status gate. If the deliverable is approved or in
// review, we emit at most one info signal and stop. Mutates the
// signal stream in the caller.
function statusInfoSignal(deliverable: Deliverable): AdvisorSignal | null {
  if (deliverable.status === 'approved') {
    return {
      id: makeId('status', [deliverable.id, 'approved']),
      scope: 'chapter',
      severity: 'info',
      title: 'Approved — monitoring only',
      summary:
        'Approved; use advisor signals only for future handoff or revision.',
      owner: 'Co-CEOs',
      nextAction:
        'Continue capturing post-event learnings and Playbook polish; do not edit approved final text without re-opening review.',
      chapterId: deliverable.id,
      source: 'approval'
    }
  }
  if (deliverable.status === 'in_review') {
    return {
      id: makeId('status', [deliverable.id, 'in_review']),
      scope: 'chapter',
      severity: 'info',
      title: 'In review — use these as review questions',
      summary:
        'In review; use these as review questions. Authors should not be making edits while review is open.',
      owner: 'Co-CEOs',
      supportingRoles: ['Instructor/Admin'],
      nextAction:
        'Review against the rubric and either approve or return for revision; advisor signals are read-only here.',
      chapterId: deliverable.id,
      source: 'approval'
    }
  }
  return null
}

// ---- Rule A: required requirement → no linked task = blocker ----
function requirementCoverageSignals(
  inputs: AdvisorInputs
): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, studio, requirementCoverage } = inputs
  if (!isStudioBacked(studio) || !requirementCoverage) return out

  for (const entry of requirementCoverage.requiredRequirementsWithoutTasks) {
    const req = studio.requirements.find((r) => r.id === entry.requirementId)
    if (!req) continue
    const owner = ownerForRequirement(req)
    out.push({
      id: makeId('req-missing-task', [deliverable.id, req.id]),
      scope: 'chapter',
      severity: 'blocker',
      title: `Required requirement has no linked task: ${req.label}`,
      summary:
        'A required Template Studio requirement does not yet have a linked task. Submit-for-review will not unlock until at least one task is linked.',
      gap: `No task linked to "${req.label}".`,
      owner,
      dependency:
        'Required task coverage before submit-for-review; human approval after review.',
      taskCoverage: {
        status: 'missing',
        relatedRequirementId: req.id
      },
      nextAction: `Create or link a task for "${req.label}" so the requirement is covered before submit.`,
      suggestedTask: buildSuggestedTaskForRequirement(req, owner),
      chapterId: deliverable.id,
      source: 'requirements'
    })
  }
  return out
}

function buildSuggestedTaskForRequirement(
  req: TemplateStudioRequirement,
  owner: AdvisorRole
): AdvisorSuggestedTask {
  return {
    title: req.suggestedTaskTitle ?? `Cover requirement: ${req.label}`,
    owner,
    dueDate: 'Next',
    dependency: 'Required for submit-for-review eligibility.',
    definitionOfDone:
      req.definitionOfDone ??
      `Linked task exists for "${req.label}" with a clear owner and definition of done.`,
    playbookChapter:
      typeof req.playbookChapter === 'number'
        ? `Chapter ${req.playbookChapter}`
        : undefined
  }
}

// ---- Rule B: blocked / overdue / ownerless tasks ----
function taskHealthSignals(
  inputs: AdvisorInputs,
  coverageByReq: Record<string, RequirementCoverageEntry> | null
): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, tasks } = inputs
  const today = todayIso()
  for (const t of tasks) {
    // Blocked = blocker
    if (t.status === 'blocked') {
      out.push({
        id: makeId('task-blocked', [deliverable.id, t.id]),
        scope: 'chapter',
        severity: 'blocker',
        title: `Task blocked: ${t.title}`,
        summary:
          'A linked task is currently blocked. Required task coverage is at risk until the dependency clears.',
        gap: t.blockedBy ? `Blocked by: ${t.blockedBy}` : 'Blocked — reason not stated.',
        owner: ownerFromKeywords(t.title) ?? 'Co-CEOs',
        dependency: t.blockedBy ?? 'Dependency unstated; clarify with the task owner.',
        taskCoverage: {
          status: 'blocked',
          relatedTaskId: t.id,
          relatedRequirementId: t.requirementId ?? undefined
        },
        nextAction:
          'Unblock the task or reassign if the dependency cannot be cleared; do not let this drag submit readiness.',
        chapterId: deliverable.id,
        source: 'tasks'
      })
      continue
    }
    // Overdue (not started / in_progress) = risk
    if (
      (t.status === 'not_started' || t.status === 'in_progress') &&
      t.dueDate &&
      t.dueDate < today
    ) {
      out.push({
        id: makeId('task-overdue', [deliverable.id, t.id]),
        scope: 'chapter',
        severity: 'risk',
        title: `Overdue task: ${t.title}`,
        summary: `Task was due ${t.dueDate} and is still ${t.status === 'in_progress' ? 'in progress' : 'not started'}.`,
        gap: `Due date ${t.dueDate} has passed; status is ${t.status}.`,
        owner: ownerFromKeywords(t.title),
        taskCoverage: {
          status: 'overdue',
          relatedTaskId: t.id,
          relatedRequirementId: t.requirementId ?? undefined
        },
        nextAction:
          'Confirm the new due date with the task owner today, or reassign if the original owner is the bottleneck.',
        chapterId: deliverable.id,
        source: 'dueDate'
      })
      continue
    }
    // Missing owner = risk
    if (!t.ownerEmail || !t.ownerEmail.trim()) {
      out.push({
        id: makeId('task-no-owner', [deliverable.id, t.id]),
        scope: 'chapter',
        severity: 'risk',
        title: `Task has no owner: ${t.title}`,
        summary:
          'A linked task is unowned. Without an owner the work will not move and submit coverage stays soft.',
        gap: 'Owner email is empty.',
        owner: 'Co-CEOs',
        taskCoverage: {
          status: 'needs-owner',
          relatedTaskId: t.id,
          relatedRequirementId: t.requirementId ?? undefined
        },
        nextAction:
          'Assign an explicit owner today and confirm acceptance of the dependency / definition of done.',
        chapterId: deliverable.id,
        source: 'tasks'
      })
    }
  }
  // Suppress unused-warning on coverageByReq — kept in signature
  // for future cross-reference rules without changing the public
  // function shape.
  void coverageByReq
  return out
}

// ---- Rule C: missing source notes / evidence / final text ----
function outputContentSignals(inputs: AdvisorInputs): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, studio, output } = inputs
  if (!isStudioBacked(studio)) return out
  const progress = summarizeChapterProgress(studio, output)

  for (const sp of progress.perSection) {
    const persisted = output?.sections?.[sp.sectionId] ?? null

    // Missing source notes on a section that already has draft / final
    // work = watch. (The student got ahead of themselves; the chief
    // should remind them to write down what backed the draft.)
    if (!sp.hasSourceNotes && (sp.hasDraft || sp.hasFinal)) {
      out.push({
        id: makeId('output-no-notes', [deliverable.id, sp.sectionId]),
        scope: 'section',
        severity: 'watch',
        title: `Source notes missing on "${sp.sectionTitle}"`,
        summary:
          'Draft or final text exists, but the source notes that should back it are blank.',
        gap: 'No source notes on a section that already has student-authored text.',
        owner: 'Chief Strategy and Growth Officer',
        nextAction:
          'Add the source notes that back this section so future cohorts can trace the reasoning.',
        chapterId: deliverable.id,
        sectionId: sp.sectionId,
        source: 'outputs'
      })
    }

    // Missing evidence on evidence-heavy sections = risk. Heuristic:
    // any section that opted into Market Builder / Market Fit /
    // Brand Fit / Pricing Strategy is evidence-heavy.
    const evidenceHeavy =
      sp.marketBuilderEnabled ||
      sp.marketFitEnabled ||
      sp.brandFitEnabled ||
      sp.pricingStrategyEnabled
    const evidenceCount = sp.evidenceCount + sp.structuredEvidenceCount
    if (evidenceHeavy && evidenceCount === 0 && (sp.hasDraft || sp.hasFinal)) {
      out.push({
        id: makeId('output-no-evidence', [deliverable.id, sp.sectionId]),
        scope: 'section',
        severity: 'risk',
        title: `Evidence missing on "${sp.sectionTitle}"`,
        summary:
          'This section is evidence-heavy (Market Builder / Market Fit / Brand Fit / Pricing) but no evidence links or structured evidence are on file.',
        gap: 'Section has draft or final text without supporting evidence.',
        owner: 'Chief Strategy and Growth Officer',
        supportingRoles: ['CFO'],
        nextAction:
          'Attach evidence links or add structured evidence entries that back the claims in this section.',
        chapterId: deliverable.id,
        sectionId: sp.sectionId,
        source: 'outputs'
      })
    }

    // Missing final text = watch. Never a blocker (Playbook
    // readiness is finalText-only and stays advisory).
    if (
      !sp.hasFinal &&
      (sp.hasDraft || sp.hasSourceNotes || evidenceCount > 0)
    ) {
      out.push({
        id: makeId('output-no-final', [deliverable.id, sp.sectionId]),
        scope: 'section',
        severity: 'watch',
        title: `Final Playbook text not yet written for "${sp.sectionTitle}"`,
        summary:
          'Source notes / draft / evidence exist; the final Playbook text is still missing.',
        gap: 'finalText is blank on a section that already has supporting work.',
        owner: 'Co-CEOs',
        dependency:
          'Source notes / evidence before final text; final text before Playbook readiness.',
        nextAction:
          'Turn the source notes and builder work into a clean final Playbook paragraph.',
        chapterId: deliverable.id,
        sectionId: sp.sectionId,
        source: 'outputs'
      })
    }
    void persisted
  }
  return out
}

// ---- Rule D: Market Fit + segment signals ----
function marketFitSignals(inputs: AdvisorInputs): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, studio, output } = inputs
  if (!isStudioBacked(studio)) return out

  for (const section of studio.sections) {
    if (!section.marketFit?.enabled) continue
    const persisted = output?.sections?.[section.id]?.marketFit ?? null
    const segments = persisted?.segments ?? []

    // Market Fit enabled but no segments = risk
    if (segments.length === 0) {
      out.push({
        id: makeId('mfit-no-segments', [deliverable.id, section.id]),
        scope: 'section',
        severity: 'risk',
        title: `No segments on "${section.title}"`,
        summary:
          'Market Fit is enabled on this section but no segments are entered. Pricing and campaign downstream depends on a real segment.',
        gap: 'segments[] is empty on this Market Fit section.',
        owner: 'Chief Strategy and Growth Officer',
        supportingRoles: ['CMO'],
        dependency:
          'Segment before campaign messaging; segment before defending premium price.',
        processOrder: [
          'Choose or compose a segment (PRIZM-inspired template).',
          'Add evidence sources and pick an evidence confidence band.',
          'Name the validation step before locking the segment in.'
        ],
        nextAction:
          'Compose at least one structured segment in the Segment Composer with evidence and a validation step.',
        chapterId: deliverable.id,
        sectionId: section.id,
        source: 'segments'
      })
      continue
    }

    // Per-segment quality: evidence confidence + validation step.
    for (const seg of segments) {
      const profile = seg.profile ?? null
      const ec = profile?.evidenceConfidence ?? ''
      const vs = (profile?.validationStep ?? '').trim()
      if (!ec || ec === 'low') {
        out.push({
          id: makeId('mfit-low-evidence', [deliverable.id, section.id, seg.id]),
          scope: 'section',
          severity: ec === 'low' ? 'risk' : 'watch',
          title: `Segment evidence is ${ec === 'low' ? 'low' : 'unset'}: ${seg.name || 'unnamed segment'}`,
          summary:
            'Segment fit rests on assumption rather than direct customer evidence.',
          gap:
            ec === 'low'
              ? 'evidenceConfidence = low.'
              : 'evidenceConfidence is not set.',
          owner: 'Chief Strategy and Growth Officer',
          supportingRoles: ['CFO'],
          nextAction:
            'Validate the segment with interviews, survey responses, or a small preorder round before the team treats it as proven.',
          suggestedTask: {
            title: `Validate segment: ${seg.name || 'unnamed'}`,
            owner: 'Chief Strategy and Growth Officer',
            dueDate: 'Next',
            dependency: 'Segment composition complete.',
            definitionOfDone:
              'Direct customer evidence (interviews, survey responses, or preorder data) on file with source links.',
            playbookChapter: 'Chapter 7'
          },
          chapterId: deliverable.id,
          sectionId: section.id,
          source: 'marketFit'
        })
      }
      if (!vs) {
        out.push({
          id: makeId('mfit-no-validation', [deliverable.id, section.id, seg.id]),
          scope: 'section',
          severity: 'watch',
          title: `Validation step missing on segment: ${seg.name || 'unnamed segment'}`,
          summary:
            'Segment is on file but no validation step is named — without it, "what would prove or break this segment" is undefined.',
          gap: 'profile.validationStep is empty.',
          owner: 'Chief Strategy and Growth Officer',
          nextAction:
            'Name the validation step (interview / survey / preorder) that would confirm or break this segment.',
          chapterId: deliverable.id,
          sectionId: section.id,
          source: 'marketFit'
        })
      }
    }
  }
  return out
}

// ---- Rule E: Pricing Strategy signals ----
function pricingSignals(inputs: AdvisorInputs): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, studio, output } = inputs
  if (!isStudioBacked(studio)) return out

  for (const section of studio.sections) {
    if (!section.pricingStrategy?.enabled) continue
    const ps = output?.sections?.[section.id]?.pricingStrategy ?? null
    if (!ps) continue
    const derived = computeDerived(ps)
    const margin = interpretMargin(derived)
    const comps = analyzeComps(ps)
    const proposedPrice = ps.proposedPrice ?? null

    // Below cost = blocker-language signal (advisory only).
    if (derived.belowCost) {
      out.push({
        id: makeId('pricing-below-cost', [deliverable.id, section.id]),
        scope: 'section',
        severity: 'blocker',
        title: `Proposed price is below cost on "${section.title}"`,
        summary:
          'At this price, every unit sold loses money before fixed costs are recovered. This is advisory only — submit gate is unaffected.',
        gap: `Unit margin is ${derived.unitMargin != null ? '$' + derived.unitMargin.toFixed(2) : '—'} at the current cost stack.`,
        owner: 'CFO',
        supportingRoles: ['Chief Strategy and Growth Officer'],
        dependency: 'Comps before defending premium price.',
        nextAction:
          'Either raise the price or lower unit cost before defending this number to anyone outside the team.',
        chapterId: deliverable.id,
        sectionId: section.id,
        source: 'pricing'
      })
      continue
    }

    // Weak margin = risk.
    if (margin.band === 'weak') {
      out.push({
        id: makeId('pricing-weak-margin', [deliverable.id, section.id]),
        scope: 'section',
        severity: 'risk',
        title: `Weak margin on "${section.title}"`,
        summary:
          'Margin is under 30%. A small surprise (extra packaging, transaction fee, returns) can wipe contribution.',
        gap: 'grossMarginPct < 30% with the current cost stack and proposed price.',
        owner: 'CFO',
        supportingRoles: ['Chief Strategy and Growth Officer', 'CMO'],
        dependency: 'Comps before defending premium price.',
        nextAction:
          'Tighten cost or raise price; if the price is fixed, log a strong volume plan and confirm fixed costs can clear.',
        chapterId: deliverable.id,
        sectionId: section.id,
        source: 'pricing'
      })
    }

    // Proposed price set but fewer than 2 valid comps = risk.
    if (
      proposedPrice != null &&
      proposedPrice > 0 &&
      comps.evidence.validCompCount < 2
    ) {
      out.push({
        id: makeId('pricing-no-comps', [deliverable.id, section.id]),
        scope: 'section',
        severity: 'risk',
        title: `Comp evidence is thin on "${section.title}"`,
        summary:
          'Proposed price is set but fewer than two valid comparable products are on file. The price cannot be defended against the market on this evidence.',
        gap: `validCompCount = ${comps.evidence.validCompCount} (need ≥ 2).`,
        owner: 'CFO',
        supportingRoles: ['Chief Strategy and Growth Officer'],
        dependency: 'Comps before defending premium price.',
        nextAction:
          'Add at least two comparable products with name, price, and source. Use the pasted-text Comp Source Assistant if helpful.',
        chapterId: deliverable.id,
        sectionId: section.id,
        source: 'pricing'
      })
    }

    // Confidence low / missing = watch.
    const confidence = ps.confidence ?? ''
    if (proposedPrice != null && (!confidence || confidence === 'low')) {
      out.push({
        id: makeId('pricing-low-confidence', [deliverable.id, section.id]),
        scope: 'section',
        severity: confidence === 'low' ? 'risk' : 'watch',
        title: `Pricing confidence is ${confidence === 'low' ? 'low' : 'unset'} on "${section.title}"`,
        summary:
          'The team has a price but no preorder / direct-customer evidence yet.',
        gap:
          confidence === 'low'
            ? 'pricingStrategy.confidence = low.'
            : 'pricingStrategy.confidence is not set.',
        owner: 'CFO',
        supportingRoles: ['Chief Strategy and Growth Officer'],
        nextAction:
          'Run a small preorder or side-by-side test at this price before locking it in.',
        chapterId: deliverable.id,
        sectionId: section.id,
        source: 'pricing'
      })
    }
  }
  return out
}

// ---- Rule F: cross-chapter cues based on what THIS deliverable is ----
function crossChapterSignals(inputs: AdvisorInputs): AdvisorSignal[] {
  const out: AdvisorSignal[] = []
  const { deliverable, studio, output } = inputs
  if (!isStudioBacked(studio)) return out
  const id = deliverable.id

  // Ch. 8: pricing present but the same deliverable's structured
  // segment context (priceSensitivity / spendingPower) is weak —
  // we can't read Ch. 7 from here without a fetch, so we stay
  // within this chapter's data and check whether *any* section's
  // own pricingStrategy.targetSegment is set, plus whether the team
  // even has a segment to lean on inside Ch. 8 itself.
  if (id === 'ch-08-finance-and-revenue-model') {
    for (const section of studio.sections) {
      if (!section.pricingStrategy?.enabled) continue
      const ps = output?.sections?.[section.id]?.pricingStrategy ?? null
      if (!ps?.proposedPrice) continue
      const targetSeg = (ps.targetSegment ?? '').trim()
      if (!targetSeg) {
        out.push({
          id: makeId('xchap-pricing-no-segment', [id, section.id]),
          scope: 'section',
          severity: 'risk',
          title: 'Pricing without a target segment',
          summary:
            'A price is on file, but the target segment is blank. Without naming who the price is for, premium positioning has no anchor.',
          gap: 'pricingStrategy.targetSegment is empty.',
          owner: 'CFO',
          supportingRoles: ['Chief Strategy and Growth Officer'],
          dependency:
            'Segment before defending premium price; comps + segment before campaign messaging.',
          nextAction:
            'Name the target segment in the Pricing Strategy Builder, or compose a structured segment in Chapter 7 first.',
          chapterId: id,
          sectionId: section.id,
          source: 'pricing'
        })
      }
    }
  }

  // Ch. 10 — campaign readiness without a clear segment connection.
  if (id === 'ch-10-marketing-and-campaign-playbook') {
    let hasAnyMarketFit = false
    for (const section of studio.sections) {
      if (!section.marketFit?.enabled) continue
      const fit = output?.sections?.[section.id]?.marketFit
      if ((fit?.segments?.length ?? 0) > 0) {
        hasAnyMarketFit = true
        break
      }
    }
    if (!hasAnyMarketFit) {
      out.push({
        id: makeId('xchap-campaign-no-segment', [id]),
        scope: 'chapter',
        severity: 'watch',
        title: 'Campaign without a clear segment / motivation link',
        summary:
          'No structured Market Fit segments on this chapter yet. Campaign messaging without a named buyer drifts toward "everyone, no one."',
        gap: 'No populated Market Fit segments inside this chapter.',
        owner: 'CMO',
        supportingRoles: ['Chief Strategy and Growth Officer'],
        dependency: 'Segment before campaign messaging.',
        nextAction:
          'Name the segment the campaign is for, or pull a structured segment from Chapter 7 before locking copy.',
        chapterId: id,
        source: 'segments'
      })
    }
  }

  // Ch. 11 — carry pitch missing pricing / segment / margin context.
  if (id === 'ch-11-phoenix-nest-retail-carry-pitch') {
    let pricingPresent = false
    let segmentPresent = false
    for (const section of studio.sections) {
      const sectionData = output?.sections?.[section.id]
      if (sectionData?.pricingStrategy?.proposedPrice != null) pricingPresent = true
      if ((sectionData?.marketFit?.segments?.length ?? 0) > 0) segmentPresent = true
    }
    if (!pricingPresent || !segmentPresent) {
      out.push({
        id: makeId('xchap-carry-thin', [id]),
        scope: 'chapter',
        severity: 'risk',
        title: 'Carry pitch missing pricing or segment evidence',
        summary:
          'A Phoenix Nest retail carry pitch leans on pricing, segment, and margin evidence. One or more is missing inside this chapter.',
        gap: `pricingPresent=${pricingPresent}, segmentPresent=${segmentPresent}`,
        owner: 'Co-CEOs',
        supportingRoles: ['CFO', 'COO', 'CMO', 'Chief Strategy and Growth Officer'],
        dependency:
          'Price/margin before carry recommendation; segment before campaign messaging.',
        processOrder: [
          'Confirm price + margin defensible (CFO).',
          'Confirm segment + evidence on file (CSGO).',
          'Confirm production / inventory readiness (COO).',
          'Lead with the buyer + story (CMO).'
        ],
        nextAction:
          'Pull pricing and segment evidence from Chapters 7 and 8 into the carry argument before pitching anything.',
        chapterId: id,
        source: 'outputs'
      })
    }
  }

  return out
}

// ---------- entry point ----------

export function generateAdvisorSignals(inputs: AdvisorInputs): AdvisorSignal[] {
  // Status gate first. If approved or in_review, surface only the
  // monitoring-only / review-questions info signal — the other
  // rules would push edit language we explicitly want to suppress.
  const statusSignal = statusInfoSignal(inputs.deliverable)
  if (statusSignal) return [statusSignal]

  const signals: AdvisorSignal[] = []
  const coverageByReq = inputs.requirementCoverage?.byRequirementId ?? null
  signals.push(...requirementCoverageSignals(inputs))
  signals.push(...taskHealthSignals(inputs, coverageByReq))
  signals.push(...outputContentSignals(inputs))
  signals.push(...marketFitSignals(inputs))
  signals.push(...pricingSignals(inputs))
  signals.push(...crossChapterSignals(inputs))
  return sortSignalsBySeverity(signals)
}

// ---------- display helpers ----------

export const SEVERITY_LABEL: Record<AdvisorSignalSeverity, string> = {
  blocker: 'Blocker',
  risk: 'Risk',
  watch: 'Watch',
  info: 'Info'
}

export const SEVERITY_CHIP_CLASS: Record<AdvisorSignalSeverity, string> = {
  blocker: 'border-rose-300 bg-rose-50 text-rose-800',
  risk: 'border-amber-300 bg-amber-50 text-amber-800',
  watch: 'border-sky-300 bg-sky-50 text-sky-800',
  info: 'border-neutral-300 bg-neutral-50 text-neutral-700'
}

export const SOURCE_LABEL: Record<AdvisorSource, string> = {
  requirements: 'Requirement coverage',
  tasks: 'Task health',
  outputs: 'Output content',
  pricing: 'Pricing strategy',
  marketFit: 'Market fit',
  segments: 'Segments',
  approval: 'Approval',
  dueDate: 'Due date'
}
