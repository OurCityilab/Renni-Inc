// Metadata-only saved snapshots for leadership review reports.
//
// Posture (do not relax):
//   - Pure helpers only. No Firestore, no fetch, no AI calls.
//   - Snapshot docs store report metadata and compact counts only.
//   - Never store the deterministic payload, section excerpts, full
//     student text, full AI output, raw provider response, tokens, or keys.

import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload,
  AiReviewReportScope,
  AiReviewReportType
} from '~/types/aiReviewReports'
import type { Department, Role } from '~/types/models'

const EXCERPT_LIMIT = 1200

export interface AiReviewSnapshotActor {
  uid: string
  email: string | null
  role: Role
  department: Department | 'admin' | null
}

export interface AiReviewSnapshotInput {
  payload: AiReviewReportPayload
  actor: AiReviewSnapshotActor
  coaching?: AiReviewCoachingOutput | null
  copyBlock?: string | null
  sourceCommit?: string | null
}

export interface AiReviewSnapshotPayloadStats {
  deliverableCount: number
  sectionCount: number
  taskCount: number
  goalCount: number
}

export interface AiReviewSnapshotDoc {
  createdAt: string
  createdByUid: string
  createdByEmail: string | null
  createdByRole: Role
  reportType: AiReviewReportType
  scope: AiReviewReportScope
  department: Department | null
  deliverableId: string | null
  chapter: number | null
  readinessScore: number
  readinessLabel: string
  deterministicSummary: AiReviewReportPayload['deterministicSummary']
  statusCounts: {
    approved: number
    inReview: number
    needsRevision: number
    draft: number
  }
  limitationCodes: string[]
  coachingIncluded: boolean
  coachingSummaryExcerpt: string | null
  copyBlockExcerpt: string | null
  payloadStats: AiReviewSnapshotPayloadStats
  sourceCommit: string | null
}

const CHIEF_ROLES = new Set<Role>(['coo', 'cfo', 'cmo', 'csgo'])

function cap(value: string | null | undefined): string | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  return text.length > EXCERPT_LIMIT
    ? `${text.slice(0, EXCERPT_LIMIT - 1).trimEnd()}…`
    : text
}

export function buildAiReviewSnapshotDoc(
  input: AiReviewSnapshotInput,
  createdAt: string = new Date().toISOString()
): AiReviewSnapshotDoc {
  const { payload, actor, coaching } = input
  const sectionCount = payload.deliverables.reduce(
    (sum, d) => sum + d.sections.length,
    0
  )
  return {
    createdAt,
    createdByUid: actor.uid,
    createdByEmail: actor.email,
    createdByRole: actor.role,
    reportType: payload.scope.reportType,
    scope: {
      reportType: payload.scope.reportType,
      department: payload.scope.department ?? null,
      deliverableId: payload.scope.deliverableId ?? null,
      chapter: payload.scope.chapter ?? null
    },
    department: payload.scope.department ?? payload.deliverables[0]?.department ?? null,
    deliverableId: payload.scope.deliverableId ?? payload.deliverables[0]?.id ?? null,
    chapter: payload.scope.chapter ?? payload.deliverables[0]?.chapter ?? null,
    readinessScore: payload.deterministicReadiness.deterministicScore,
    readinessLabel: payload.deterministicReadiness.label,
    deterministicSummary: { ...payload.deterministicSummary },
    statusCounts: {
      approved: payload.deterministicSummary.approvedDeliverables,
      inReview: payload.deterministicSummary.inReviewDeliverables,
      needsRevision: payload.deterministicSummary.needsRevisionDeliverables,
      draft: payload.deterministicSummary.draftDeliverables
    },
    limitationCodes: [
      ...new Set([
        ...payload.limitations.map((l) => l.code),
        ...payload.deterministicReadiness.limitations.map((l) => l.code)
      ])
    ],
    coachingIncluded: Boolean(coaching),
    coachingSummaryExcerpt: cap(coaching?.executiveSummary ?? null),
    copyBlockExcerpt: cap(input.copyBlock ?? null),
    payloadStats: {
      deliverableCount: payload.deliverables.length,
      sectionCount,
      taskCount: payload.tasks.length,
      goalCount: payload.goals.length
    },
    sourceCommit: cap(input.sourceCommit ?? null)
  }
}

export function canSaveAiReviewSnapshot(
  actor: AiReviewSnapshotActor,
  payload: AiReviewReportPayload
): boolean {
  if (actor.role === 'admin' || actor.role === 'coceo' || actor.role === 'coo') {
    return true
  }
  if (payload.scope.reportType === 'company') return false
  if (CHIEF_ROLES.has(actor.role)) {
    if (payload.scope.reportType === 'department') {
      return payload.scope.department != null && payload.scope.department === actor.department
    }
    if (payload.scope.reportType === 'chapter') {
      const d = payload.deliverables.find(
        (item) => item.id === payload.scope.deliverableId
      ) ?? payload.deliverables[0]
      return Boolean(d && d.department === actor.department)
    }
  }
  if (payload.scope.reportType === 'chapter') {
    const d = payload.deliverables.find(
      (item) => item.id === payload.scope.deliverableId
    ) ?? payload.deliverables[0]
    return Boolean(
      d &&
        actor.email &&
        d.ownerEmail &&
        d.ownerEmail.toLowerCase() === actor.email.toLowerCase()
    )
  }
  return false
}
