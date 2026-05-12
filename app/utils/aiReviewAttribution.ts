// Conservative attribution helper for the leadership review payload.
//
// Posture (do not relax):
//   - The Firestore model tracks "assigned owner", "last editor",
//     "evidence contributor", and "approver". It does NOT track
//     authorship or completion-actor. Helpers below must never
//     translate "task done" or "section saved" into "completed by"
//     or "written by" unless the actor field is present on that
//     exact record.
//   - When the data is missing, helpers default to `'unknown'` and
//     emit a limitation describing why. The future AI layer reads
//     these so it can avoid overclaiming.

import type {
  Deliverable,
  DeliverableOutputSection,
  DeliverableEvidenceLink,
  StructuredEvidenceEntry,
  Task
} from '~/types/models'
import type {
  AiReviewAttribution,
  AiReviewAttributionConfidence,
  AiReviewLimitation
} from '~/types/aiReviewReports'

function pickEmail(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = String(value).trim()
  return trimmed.length > 0 ? trimmed : null
}

function dedupe(list: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of list) {
    const e = pickEmail(v)
    if (!e) continue
    if (seen.has(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

function highestConfidence(
  assigned: string | null,
  lastSavedBy: string | null,
  evidence: string[],
  approver: string | null
): AiReviewAttributionConfidence {
  if (assigned) return 'assigned'
  if (lastSavedBy) return 'last-saved-by'
  if (evidence.length > 0) return 'evidence-contributor'
  if (approver) return 'approver'
  return 'unknown'
}

function buildSafeStatement(
  assigned: string | null,
  lastSavedBy: string | null,
  evidence: string[],
  approver: string | null
): string {
  if (!assigned && !lastSavedBy && evidence.length === 0 && !approver) {
    return 'Authorship cannot be confirmed from current data.'
  }
  const parts: string[] = []
  if (assigned) parts.push(`Assigned to ${assigned}`)
  if (lastSavedBy) parts.push(`Last saved by ${lastSavedBy}`)
  if (evidence.length === 1) {
    parts.push(`Evidence added by ${evidence[0]}`)
  } else if (evidence.length > 1) {
    parts.push(`Evidence added by ${evidence.length} contributors`)
  }
  if (approver) parts.push(`Approver ${approver}`)
  return parts.join(' · ')
}

/** Build an attribution summary for a deliverable. Uses ownerEmail and
 *  approverEmail (when present). The deliverable model does not
 *  expose a `lastSavedBy` on the parent doc, so that field stays
 *  null unless the caller passes a section-level summary. */
export function getDeliverableAttribution(
  deliverable: Pick<Deliverable, 'ownerEmail' | 'approverEmail'>
): AiReviewAttribution {
  const assigned = pickEmail(deliverable.ownerEmail)
  const approver = pickEmail(deliverable.approverEmail)
  const best = highestConfidence(assigned, null, [], approver)
  const stmt = buildSafeStatement(assigned, null, [], approver)
  return {
    assignedOwnerEmail: assigned,
    approverEmail: approver,
    lastSavedByEmail: null,
    evidenceContributorEmails: [],
    bestConfidence: best,
    summaryStatement: stmt
  }
}

/** Build an attribution summary for a deliverable section. Uses
 *  - the deliverable's owner/approver (inherited assignment)
 *  - the section's `updatedByEmail` (last editor) when present
 *  - email addresses on evidence link / structured evidence entries
 *    that have an `addedByEmail` field */
export function getSectionAttribution(
  deliverable: Pick<Deliverable, 'ownerEmail' | 'approverEmail'>,
  section: DeliverableOutputSection | null
): AiReviewAttribution {
  const assigned = pickEmail(deliverable.ownerEmail)
  const approver = pickEmail(deliverable.approverEmail)
  const lastSavedBy = pickEmail(
    section?.sectionEditedByEmail ?? section?.updatedByEmail ?? null
  )
  const evidence: string[] = []
  if (section?.evidenceLinks?.length) {
    for (const l of section.evidenceLinks as DeliverableEvidenceLink[]) {
      const e = pickEmail(l.addedByEmail ?? null)
      if (e) evidence.push(e)
    }
  }
  if (section?.structuredEvidence?.length) {
    for (const e of section.structuredEvidence as StructuredEvidenceEntry[]) {
      const v = pickEmail(e.addedByEmail ?? null)
      if (v) evidence.push(v)
    }
  }
  const evidenceUnique = dedupe(evidence)
  const best = highestConfidence(assigned, lastSavedBy, evidenceUnique, approver)
  const stmt = buildSafeStatement(assigned, lastSavedBy, evidenceUnique, approver)
  return {
    assignedOwnerEmail: assigned,
    approverEmail: approver,
    lastSavedByEmail: lastSavedBy,
    evidenceContributorEmails: evidenceUnique,
    bestConfidence: best,
    summaryStatement: stmt
  }
}

/** Build the contribution-limitations footnotes that accompany an
 *  attribution. Surfacing these inline keeps the future AI layer from
 *  over-attributing. */
export function getContributionLimitations(
  attribution: AiReviewAttribution
): AiReviewLimitation[] {
  const out: AiReviewLimitation[] = []
  if (attribution.bestConfidence === 'unknown') {
    out.push({
      code: 'attribution-unavailable',
      message:
        'Authorship cannot be confirmed from current data. Avoid claiming a specific contributor wrote or completed this work.'
    })
    return out
  }
  if (!attribution.lastSavedByEmail) {
    out.push({
      code: 'last-editor-missing',
      message:
        'Last-editor metadata is not available for this section; do not claim a specific person wrote it.'
    })
  }
  if (attribution.bestConfidence === 'assigned' && !attribution.lastSavedByEmail) {
    out.push({
      code: 'assigned-not-completed',
      message:
        'Assignment is known but completion actor is not. Use "Assigned to ___" rather than "Completed by ___".'
    })
  }
  return out
}

/** Safe completion-language helper. Translates a task into a
 *  contributor-respecting phrase. NEVER claims "completed by X" unless
 *  the task carries a real completion actor (the current model does
 *  not record this — so the helper returns the safe fallback for the
 *  done case). */
export function getSafeCompletionLanguage(
  task: Pick<
    Task,
    'status' | 'ownerEmail' | 'blockedBy' | 'completedByEmail' | 'completedAt'
  >
): string {
  const owner = pickEmail(task.ownerEmail)
  const completedBy = pickEmail(task.completedByEmail)
  switch (task.status) {
    case 'done':
      if (completedBy) {
        return `Completed by ${completedBy}${task.completedAt ? ` on ${task.completedAt}` : ''}.`
      }
      return owner
        ? `Task marked complete; completion actor unavailable. Assigned to ${owner}.`
        : 'Task marked complete; completion actor unavailable.'
    case 'in_progress':
      return owner ? `In progress · Assigned to ${owner}` : 'In progress'
    case 'blocked':
      return owner
        ? `Blocked${task.blockedBy ? ` (${task.blockedBy})` : ''} · Assigned to ${owner}`
        : `Blocked${task.blockedBy ? ` (${task.blockedBy})` : ''}`
    case 'not_started':
    default:
      return owner ? `Not started · Assigned to ${owner}` : 'Not started'
  }
}

/** Compact attribution display used by the (future) report renderer.
 *  Pure formatter — useful in tests so we don't re-derive the same
 *  string in component code. */
export function getAttributionSummary(
  attribution: AiReviewAttribution
): string {
  return attribution.summaryStatement
}
