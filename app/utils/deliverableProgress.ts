// Pure helper: turns a Deliverable + (optional) DeliverableOutput + the
// linked tasks + the studio's requirement coverage into a student-
// friendly progress summary used on the Deliverables index page.
//
// Posture (do not relax):
//   - never reads Firestore, never writes anywhere
//   - never changes approval semantics
//   - never advances parent deliverable.status; it only describes it
//   - submit gate logic stays in computeRequirementCoverage; this helper
//     consumes the coverage summary and the parent status to decide what
//     plain-language next action to surface
//
// Returned bucket maps to the student-friendly filters on the index page:
//   needs_work       — parent draft/needs_revision, sections not ready
//   ready_to_submit  — parent draft/needs_revision AND no required coverage gaps
//   needs_review     — parent in_review
//   needs_revision   — parent needs_revision (mutually exclusive with the
//                       two above; surfaces the revision callout)
//   approved         — parent approved

import type { Deliverable, DeliverableOutput, Task } from '~/types/models'
import type { RequirementCoverageSummary } from '~/utils/requirementCoverage'

export type DeliverableProgressBucket =
  | 'needs_work'
  | 'ready_to_submit'
  | 'needs_review'
  | 'needs_revision'
  | 'approved'

export interface DeliverableProgressSummary {
  bucket: DeliverableProgressBucket
  // Plain-language status line shown on the card under the title.
  statusLabel: string
  // One-line section progress line.
  sectionProgressLabel: string | null
  // Next-step microcopy for the card body.
  nextActionLabel: string
  // Section count breakdown (null when there is no studio / output yet).
  totalSections: number | null
  readySections: number | null
  sectionsWithWork: number | null
  // Independent of the parent status bucket. Used by the index page to
  // surface "Work started" and "Sections marked ready" filters even
  // while the parent deliverable.status is still draft — that is the
  // whole point of the section-readiness signal.
  hasAnySectionWork: boolean
  hasReadySections: boolean
  // Submit gate state. canSubmit means: parent is draft/needs_revision
  // AND requirement coverage has no required gaps. blockReason describes
  // the gap when canSubmit is false but submitEligible is true.
  submitEligible: boolean
  canSubmit: boolean
  submitBlockReason: string | null
  missingRequiredLabels: string[]
}

export interface DeliverableProgressInput {
  deliverable: Pick<Deliverable, 'status'>
  output: DeliverableOutput | null | undefined
  // Optional; only used to count tasks-in-progress when no studio exists.
  tasks?: Task[]
  // Optional. Pass when a Template Studio exists for the deliverable so
  // the submit-gate state mirrors ApprovalActions exactly.
  coverage?: RequirementCoverageSummary | null
  // Optional: pass false to disable submit (e.g. coverage still loading).
  coverageReady?: boolean
}

function countReadySections(output: DeliverableOutput | null | undefined): {
  total: number
  ready: number
  withWork: number
} {
  if (!output) return { total: 0, ready: 0, withWork: 0 }
  const sections = output.sections ?? {}
  let total = 0
  let ready = 0
  let withWork = 0
  for (const sid of Object.keys(sections)) {
    const sec = sections[sid]
    if (!sec) continue
    total += 1
    if (sec.status === 'ready') ready += 1
    const hasText =
      (sec.sourceNotes ?? '').trim().length > 0 ||
      (sec.draftText ?? '').trim().length > 0 ||
      (sec.finalText ?? '').trim().length > 0
    if (hasText || sec.status === 'in_progress' || sec.status === 'ready') {
      withWork += 1
    }
  }
  return { total, ready, withWork }
}

export function computeDeliverableProgress(
  input: DeliverableProgressInput
): DeliverableProgressSummary {
  const { deliverable, output, coverage } = input
  const coverageReady = input.coverageReady ?? true
  const { total, ready, withWork } = countReadySections(output)

  const missingRequiredLabels = (
    coverage?.requiredRequirementsWithoutTasks ?? []
  ).map((r) => r.label)

  const submitEligible =
    deliverable.status === 'draft' || deliverable.status === 'needs_revision'

  // canSubmit mirrors the deliverable detail page's submit-blocked check:
  // coverage must be available (no studio = always ok), no required gaps,
  // and the coverage view itself must be ready (so we don't claim "ready"
  // while still loading tasks).
  const canSubmit =
    submitEligible &&
    coverageReady &&
    (!coverage || missingRequiredLabels.length === 0)

  const sectionProgressLabel =
    total > 0 ? `${ready} of ${total} sections marked ready` : null

  const hasAnySectionWork = withWork > 0
  const hasReadySections = ready > 0

  if (deliverable.status === 'approved') {
    return {
      bucket: 'approved',
      statusLabel: 'Approved for the Playbook',
      sectionProgressLabel,
      nextActionLabel: 'Approved. No action needed.',
      totalSections: total || null,
      readySections: ready,
      sectionsWithWork: withWork,
      hasAnySectionWork,
      hasReadySections,
      submitEligible: false,
      canSubmit: false,
      submitBlockReason: null,
      missingRequiredLabels: []
    }
  }

  if (deliverable.status === 'in_review') {
    return {
      bucket: 'needs_review',
      statusLabel: 'Submitted for review',
      sectionProgressLabel,
      nextActionLabel:
        'Waiting on the approver. Reviewers can open this deliverable to approve or request revision.',
      totalSections: total || null,
      readySections: ready,
      sectionsWithWork: withWork,
      hasAnySectionWork,
      hasReadySections,
      submitEligible: false,
      canSubmit: false,
      submitBlockReason: null,
      missingRequiredLabels: []
    }
  }

  if (deliverable.status === 'needs_revision') {
    return {
      bucket: 'needs_revision',
      statusLabel: 'Needs revision',
      sectionProgressLabel,
      nextActionLabel: canSubmit
        ? 'Revisions addressed. Re-submit the deliverable when ready.'
        : 'Address the reviewer notes, then re-submit the deliverable.',
      totalSections: total || null,
      readySections: ready,
      sectionsWithWork: withWork,
      hasAnySectionWork,
      hasReadySections,
      submitEligible,
      canSubmit,
      submitBlockReason: !coverageReady
        ? 'Checking what is still needed before this is ready for review…'
        : missingRequiredLabels.length > 0
          ? 'The chief reviewer is waiting on at least one task for required checks.'
          : null,
      missingRequiredLabels
    }
  }

  // draft
  if (canSubmit) {
    return {
      bucket: 'ready_to_submit',
      statusLabel:
        total > 0 && ready === total
          ? 'Ready to submit'
          : 'Ready to submit for review',
      sectionProgressLabel,
      nextActionLabel:
        'Required checks are covered. Submit the full deliverable for review when ready.',
      totalSections: total || null,
      readySections: ready,
      sectionsWithWork: withWork,
      hasAnySectionWork,
      hasReadySections,
      submitEligible,
      canSubmit,
      submitBlockReason: null,
      missingRequiredLabels: []
    }
  }

  return {
    bucket: 'needs_work',
    statusLabel: hasAnySectionWork ? 'In progress' : 'Not started',
    sectionProgressLabel,
    nextActionLabel:
      total > 0
        ? ready === total
          ? 'All sections marked ready. Finish required checks to submit.'
          : 'Keep building the sections, then submit the full deliverable for review.'
        : hasAnySectionWork
          ? 'Keep building the sections, then submit the full deliverable for review.'
          : 'Open this deliverable to start the sections.',
    totalSections: total || null,
    readySections: ready,
    sectionsWithWork: withWork,
    hasAnySectionWork,
    hasReadySections,
    submitEligible,
    canSubmit: false,
    submitBlockReason: !coverageReady
      ? 'Checking what is still needed before this is ready for review…'
      : missingRequiredLabels.length > 0
        ? 'The chief reviewer is waiting on at least one task for required checks.'
        : null,
    missingRequiredLabels
  }
}
