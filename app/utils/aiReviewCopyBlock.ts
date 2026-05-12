// Deterministic copy-ready summary line for the company review page.
// Pure formatter — never an AI narrative.

import type { AiReviewReportPayload } from '~/types/aiReviewReports'

/** Build a single paragraph that a leader can paste into a status
 *  update. Deterministic, derived from the same payload that drives
 *  the on-screen review. */
export function buildDeterministicCopyBlock(
  payload: AiReviewReportPayload
): string {
  const s = payload.deterministicSummary
  const r = payload.deterministicReadiness
  const labelCopy: Record<typeof r.label, string> = {
    'high-risk': 'High Risk',
    'needs-work': 'Needs Work',
    'near-ready': 'Near Ready',
    ready: 'Ready'
  }
  const pieces: string[] = []
  pieces.push(
    `Readiness: ${r.deterministicScore} / 100 — ${labelCopy[r.label]}.`
  )
  if (s.totalDeliverables === 0) {
    pieces.push('No deliverables in scope.')
  } else {
    const drafts = s.draftDeliverables
    const inReview = s.inReviewDeliverables
    const needsRev = s.needsRevisionDeliverables
    const approved = s.approvedDeliverables
    pieces.push(
      `${s.totalDeliverables} deliverables: ${approved} approved, ${inReview} in review, ${needsRev} need revision, ${drafts} in draft.`
    )
    if (s.overdueDeliverables > 0) {
      pieces.push(`${s.overdueDeliverables} overdue.`)
    }
    if (s.sectionsMissing > 0) {
      pieces.push(
        `${s.sectionsMissing} section${s.sectionsMissing === 1 ? '' : 's'} missing content.`
      )
    }
    if (s.sectionsWithDraftFallback + s.sectionsWithSourceNotesFallback > 0) {
      const fallback =
        s.sectionsWithDraftFallback + s.sectionsWithSourceNotesFallback
      pieces.push(
        `${fallback} section${fallback === 1 ? '' : 's'} showing draft / source-note fallback.`
      )
    }
    if (s.evidenceLinkCount + s.structuredEvidenceCount === 0) {
      pieces.push('No evidence items logged yet.')
    }
  }
  pieces.push('Deterministic counts only. No AI approval, no AI grade.')
  return pieces.join(' ')
}
