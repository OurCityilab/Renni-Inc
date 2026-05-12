// Shared types for the deterministic leadership review reporting
// foundation (Phase 1).
//
// Posture (do not relax):
//   - These types describe a READ-ONLY, deterministic payload. No AI
//     calls, no Firestore writes, no approval/readiness mutation.
//   - Attribution is conservative: every contributor field maps to a
//     concrete model field (assigned owner, last editor, evidence
//     contributor, approver). The payload never claims authorship the
//     data model cannot prove.
//   - Phase 1 only. The future AI-assisted review layer consumes this
//     payload as input; nothing in Phase 1 produces an AI judgment,
//     auto-approval, or score-driven gate.

import type {
  Deliverable,
  DeliverableOutputSectionStatus,
  DeliverableStatus,
  Department,
  GoalStatus,
  IsoDate,
  IsoTimestamp,
  Role,
  TaskPriority,
  TaskStatus
} from '~/types/models'
import type { PreviewContentSource } from '~/utils/playbookPreview'

/** What "shape" of report this payload represents. */
export type AiReviewReportType = 'company' | 'department' | 'chapter'

/** How confidently the system can attribute a contribution. Conservative
 *  by design — `'unknown'` is the default whenever the model field is
 *  missing. */
export type AiReviewAttributionConfidence =
  | 'assigned'
  | 'last-saved-by'
  | 'evidence-contributor'
  | 'approver'
  | 'unknown'

/** Soft readiness band derived from the deterministic score. Warning-
 *  only. Never gates approval, submit, or print. */
export type AiReviewReadinessLabel =
  | 'high-risk'
  | 'needs-work'
  | 'near-ready'
  | 'ready'

/** Scope of the requested report. The narrower scopes (department,
 *  chapter) reuse the same payload shape but filter inputs. */
export interface AiReviewReportScope {
  reportType: AiReviewReportType
  /** Only set on department and (sometimes) chapter scopes. */
  department?: Department | null
  /** Only set on chapter scope. */
  deliverableId?: string | null
  /** Only set on chapter scope. Mirrors the deliverable's chapter
   *  number for callers that prefer chapter-keyed scoping. */
  chapter?: number | null
}

/** Who asked for the report. The payload carries this so the future AI
 *  layer can tailor language for the audience. The role is the
 *  requester's role at the time of the build; permissions are still
 *  enforced upstream — this object is descriptive, not authoritative. */
export interface AiReviewRequester {
  email: string
  role: Role | null
  department: Department | null
}

/** Hard constraints baked into every payload so a future AI consumer
 *  sees them inline rather than relying on a system prompt elsewhere. */
export interface AiReviewConstraints {
  noApproval: true
  noMutation: true
  noPersonalJudgment: true
  attributionPolicy: 'assigned_owner_and_last_editor_only'
}

/** Conservative attribution summary attached to a deliverable or
 *  section. Every field is optional; missing values surface as
 *  `'unknown'` and the `limitations` list describes why. */
export interface AiReviewAttribution {
  assignedOwnerEmail: string | null
  approverEmail: string | null
  lastSavedByEmail: string | null
  evidenceContributorEmails: string[]
  /** The single highest-confidence label this attribution supports.
   *  Used by the readiness card to render a one-line summary. */
  bestConfidence: AiReviewAttributionConfidence
  /** Plain-language statement safe to render — never claims
   *  authorship unless the model proves it. */
  summaryStatement: string
}

/** One section's deterministic summary. Excerpts are capped — the
 *  payload never duplicates full student text more than necessary. */
export interface AiReviewSectionSummary {
  sectionId: string
  title: string
  /** Effective content source per the shared preview normalizer. */
  contentSource: PreviewContentSource
  contentSourceLabel: string
  isMissing: boolean
  /** Capped excerpt of the section's effective content. Empty for
   *  missing sections. Length capped to keep payloads compact and
   *  to avoid duplicating large prose unnecessarily. */
  contentExcerpt: string
  excerptCapped: boolean
  finalTextPresent: boolean
  draftFallback: boolean
  sourceNotesFallback: boolean
  wordCount: number
  sectionStatus: DeliverableOutputSectionStatus | null
  evidenceLinkCount: number
  structuredEvidenceCount: number
  attribution: AiReviewAttribution
}

/** Deterministic deliverable summary — the largest unit a chapter-level
 *  report touches. Composes upstream helpers (requirement coverage,
 *  preview normalizer, readiness). */
export interface AiReviewDeliverableSummary {
  id: string
  title: string
  chapter: number
  chapterTitle: string
  department: Department
  status: DeliverableStatus
  statusLabel: string
  ownerEmail: string | null
  approverEmail: string | null
  dueDate: IsoDate | null
  isOverdue: boolean
  hasStudio: boolean
  totalSections: number
  sectionsWithFinalText: number
  sectionsWithDraftFallback: number
  sectionsWithSourceNotesFallback: number
  sectionsMissing: number
  evidenceLinkCount: number
  structuredEvidenceCount: number
  /** Required-task coverage gaps. Empty array when no studio is bound
   *  or every required requirement has at least one linked task. */
  missingRequiredRequirementLabels: string[]
  /** True when the existing submit gate would currently allow
   *  submission. Mirrors deliverableProgress.canSubmit so the future
   *  AI layer does not invent a parallel gate. */
  canSubmit: boolean
  /** Optional return-for-revision reason from the deliverable. Never
   *  trimmed beyond a hard cap. */
  returnedReason: string | null
  attribution: AiReviewAttribution
  sections: AiReviewSectionSummary[]
}

/** Lightweight task summary scoped to the payload. We do not include
 *  raw uids — only the email-based contributor labels the rest of the
 *  app already exposes. */
export interface AiReviewTaskSummary {
  id: string
  title: string
  deliverableId: string | null
  deliverableTitle: string | null
  department: Department | null
  ownerEmail: string | null
  status: TaskStatus
  statusLabel: string
  priority: TaskPriority | null
  startDate: IsoDate | null
  dueDate: IsoDate | null
  isOverdue: boolean
  blockedReason: string | null
}

/** Lightweight goal/KPI summary. */
export interface AiReviewGoalSummary {
  id: string
  department: Department
  metricName: string
  target: number
  current: number
  status: GoalStatus
  statusLabel: string
  progressPercent: number | null
  ownerEmail: string | null
}

/** Roll-up counts across the in-scope payload. Mirrors
 *  `summarizePlaybookReadiness` but typed for the review report so the
 *  AI layer never has to recompute them. */
export interface AiReviewDeterministicSummary {
  totalChapters: number
  totalDeliverables: number
  approvedDeliverables: number
  draftDeliverables: number
  inReviewDeliverables: number
  needsRevisionDeliverables: number
  overdueDeliverables: number
  totalSections: number
  sectionsWithFinalText: number
  sectionsWithDraftFallback: number
  sectionsWithSourceNotesFallback: number
  sectionsMissing: number
  evidenceLinkCount: number
  structuredEvidenceCount: number
  totalTasks: number
  completedTasks: number
  blockedTasks: number
  overdueTasks: number
}

/** One row of the deterministic readiness scoring breakdown. Each row
 *  is a single signal (e.g. "final text coverage", "required task
 *  coverage", "approval status") with its raw value, its weight, and
 *  the points contributed to the deterministic score. */
export interface AiReviewReadinessBreakdownRow {
  signal: string
  detail: string
  weight: number
  value: number
  /** Points contributed to the 0-100 deterministic score. */
  pointsContributed: number
}

/** Output of the readiness scorer. Pure derivation from objective
 *  signals; no AI judgment, no personal-character scoring. */
export interface AiReviewDeterministicReadiness {
  deterministicScore: number
  label: AiReviewReadinessLabel
  scoringBreakdown: AiReviewReadinessBreakdownRow[]
  limitations: AiReviewLimitation[]
}

/** A reason the payload is incomplete or imprecise. Never blocks the
 *  report — it surfaces as a footnote so the consumer can avoid
 *  overclaiming. */
export interface AiReviewLimitation {
  code: string
  message: string
}

/** Top-level input to `buildReviewPayload`. Callers pre-resolve the
 *  Firestore data so the builder stays pure. */
export interface AiReviewReportInput {
  scope: AiReviewReportScope
  requester: AiReviewRequester
  /** All deliverables visible to the requester. Filtering by scope
   *  happens inside the builder. */
  deliverables: Deliverable[]
  /** Map keyed by deliverable id. Optional rows allowed. */
  outputsByDeliverableId: Record<
    string,
    import('~/types/models').DeliverableOutput | null | undefined
  >
  /** Studio resolver — callers reuse the shared registry. */
  studioResolver?: (
    deliverable: Deliverable
  ) => import('~/types/templateStudio').TemplateStudio | null
  tasks: import('~/types/models').Task[]
  goals: import('~/types/models').Goal[]
  /** Optional generation timestamp; defaults to ISO-now. */
  generatedAt?: IsoTimestamp
}

/** Final payload shape. */
export interface AiReviewReportPayload {
  reportType: AiReviewReportType
  scope: AiReviewReportScope
  requester: AiReviewRequester
  constraints: AiReviewConstraints
  deterministicSummary: AiReviewDeterministicSummary
  deterministicReadiness: AiReviewDeterministicReadiness
  deliverables: AiReviewDeliverableSummary[]
  tasks: AiReviewTaskSummary[]
  goals: AiReviewGoalSummary[]
  limitations: AiReviewLimitation[]
  generatedAt: IsoTimestamp
}

/** Default constraints object every builder includes verbatim. */
export const AI_REVIEW_CONSTRAINTS_DEFAULT: AiReviewConstraints = {
  noApproval: true,
  noMutation: true,
  noPersonalJudgment: true,
  attributionPolicy: 'assigned_owner_and_last_editor_only'
}
