// Deterministic leadership-review readiness scorer.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI calls.
//   - DOES NOT use AI judgment in the score.
//   - DOES NOT score student character, effort, or intent. The signals
//     are objective (approval state, coverage, evidence, missing
//     sections, returned reasons).
//   - WARNING-ONLY: the label is informational. It never gates submit,
//     approval, print, or any other workflow surface.
//   - DOES NOT create false precision from vague work. When the
//     signals are too thin to score meaningfully, the helper degrades
//     to a `'high-risk'` label and surfaces a limitation row rather
//     than inventing a number.

import type {
  AiReviewDeliverableSummary,
  AiReviewDeterministicReadiness,
  AiReviewLimitation,
  AiReviewReadinessBreakdownRow,
  AiReviewReadinessLabel
} from '~/types/aiReviewReports'

interface SignalDef {
  signal: string
  weight: number
  /** Compute a 0..1 ratio from the deliverable list. The runner
   *  multiplies the ratio by `weight` to produce points. */
  value: (deliverables: AiReviewDeliverableSummary[]) => {
    value: number
    detail: string
  }
}

// Weights sum to 100. The deterministic score is the sum of
// (value * weight) across signals, rounded to the nearest integer.
const SIGNALS: SignalDef[] = [
  {
    signal: 'approval-coverage',
    weight: 25,
    value(ds) {
      const total = ds.length
      if (total === 0) return { value: 0, detail: 'No deliverables in scope.' }
      const approved = ds.filter((d) => d.status === 'approved').length
      const ratio = approved / total
      return {
        value: ratio,
        detail: `${approved} of ${total} deliverables approved.`
      }
    }
  },
  {
    signal: 'final-text-coverage',
    weight: 25,
    value(ds) {
      let total = 0
      let withFinal = 0
      for (const d of ds) {
        total += d.totalSections
        withFinal += d.sectionsWithFinalText
      }
      if (total === 0) {
        return {
          value: 0,
          detail: 'No studio-backed sections in scope.'
        }
      }
      const ratio = withFinal / total
      return {
        value: ratio,
        detail: `${withFinal} of ${total} sections have final Playbook text.`
      }
    }
  },
  {
    signal: 'missing-sections',
    weight: 15,
    value(ds) {
      let total = 0
      let missing = 0
      for (const d of ds) {
        total += d.totalSections
        missing += d.sectionsMissing
      }
      if (total === 0) {
        return { value: 0, detail: 'No sections to evaluate.' }
      }
      // Inverted: fewer missing sections is better.
      const ratio = Math.max(0, 1 - missing / total)
      return {
        value: ratio,
        detail: `${missing} of ${total} sections missing content.`
      }
    }
  },
  {
    signal: 'evidence-coverage',
    weight: 15,
    value(ds) {
      if (ds.length === 0) {
        return { value: 0, detail: 'No deliverables in scope.' }
      }
      // Treat "≥ 1 evidence item per studio-backed deliverable" as
      // the bar. Anything beyond that is full credit; anything below
      // is the proportion. This is intentionally lenient — evidence
      // depth is a coaching signal, not a hard rubric.
      let target = 0
      let evidenceUnits = 0
      for (const d of ds) {
        if (!d.hasStudio) continue
        target += 1
        const has = d.evidenceLinkCount + d.structuredEvidenceCount
        evidenceUnits += Math.min(has, 1)
      }
      if (target === 0) {
        return {
          value: 0,
          detail: 'No studio-backed deliverables to evaluate evidence on.'
        }
      }
      const ratio = evidenceUnits / target
      return {
        value: ratio,
        detail: `${evidenceUnits} of ${target} studio-backed deliverables have at least one evidence item.`
      }
    }
  },
  {
    signal: 'required-task-coverage',
    weight: 10,
    value(ds) {
      const studioBacked = ds.filter((d) => d.hasStudio)
      if (studioBacked.length === 0) {
        return {
          value: 0,
          detail: 'No studio-backed deliverables to evaluate.'
        }
      }
      const covered = studioBacked.filter(
        (d) => d.missingRequiredRequirementLabels.length === 0
      ).length
      const ratio = covered / studioBacked.length
      return {
        value: ratio,
        detail: `${covered} of ${studioBacked.length} deliverables have full required-task coverage.`
      }
    }
  },
  {
    signal: 'on-time-status',
    weight: 5,
    value(ds) {
      const total = ds.length
      if (total === 0) {
        return { value: 0, detail: 'No deliverables in scope.' }
      }
      const onTime = ds.filter((d) => !d.isOverdue).length
      const ratio = onTime / total
      return {
        value: ratio,
        detail: `${total - onTime} deliverables currently overdue.`
      }
    }
  },
  {
    signal: 'returned-revisions-clean',
    weight: 5,
    value(ds) {
      const total = ds.length
      if (total === 0) {
        return { value: 0, detail: 'No deliverables in scope.' }
      }
      // Inverted: fewer needs_revision states is better. Approved /
      // in_review / draft all count as "clean" for this single
      // signal — needs_revision is the only one that penalizes.
      const clean = ds.filter((d) => d.status !== 'needs_revision').length
      const ratio = clean / total
      const returnedCount = total - clean
      return {
        value: ratio,
        detail:
          returnedCount === 0
            ? 'No deliverables currently in needs-revision state.'
            : `${returnedCount} deliverables currently returned for revision.`
      }
    }
  }
]

function labelFor(score: number): AiReviewReadinessLabel {
  if (score >= 80) return 'ready'
  if (score >= 60) return 'near-ready'
  if (score >= 30) return 'needs-work'
  return 'high-risk'
}

/** Deterministically score a slice of the payload. */
export function computeDeterministicReadiness(
  deliverables: AiReviewDeliverableSummary[]
): AiReviewDeterministicReadiness {
  const limitations: AiReviewLimitation[] = []

  if (deliverables.length === 0) {
    limitations.push({
      code: 'no-deliverables-in-scope',
      message:
        'No deliverables fell within the requested scope. Score defaults to high-risk to avoid false precision.'
    })
    return {
      deterministicScore: 0,
      label: 'high-risk',
      scoringBreakdown: [],
      limitations
    }
  }

  const breakdown: AiReviewReadinessBreakdownRow[] = []
  let total = 0
  for (const signal of SIGNALS) {
    const { value, detail } = signal.value(deliverables)
    const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
    const points = Math.round(clamped * signal.weight * 100) / 100
    total += points
    breakdown.push({
      signal: signal.signal,
      detail,
      weight: signal.weight,
      value: clamped,
      pointsContributed: points
    })
  }
  const score = Math.max(0, Math.min(100, Math.round(total)))

  // Surface a limitation when no studio-backed deliverables exist;
  // several signals will read 0 and the score will be artificially low.
  if (!deliverables.some((d) => d.hasStudio)) {
    limitations.push({
      code: 'no-studio-backed-deliverables',
      message:
        'No studio-backed deliverables fell in scope, so several signals default to zero. Treat the score as a floor, not a ceiling.'
    })
  }

  return {
    deterministicScore: score,
    label: labelFor(score),
    scoringBreakdown: breakdown,
    limitations
  }
}
