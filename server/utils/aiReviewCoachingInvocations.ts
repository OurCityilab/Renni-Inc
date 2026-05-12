// AI Leadership Coaching — audit log helper.
//
// Writes one document per AI coaching invocation to the
// `aiReviewCoachingInvocations` Firestore collection. Mirrors the
// pattern used by `aiAdvisorInvocations` for the executive advisor.
//
// Posture (do not relax):
//   - Server-only writes via the Admin SDK. Firestore rules block
//     ALL client read/write to this collection.
//   - Stored fields are minimal metadata only. NEVER stored:
//       * the deterministic payload contents
//       * student section excerpts
//       * the AI response body
//       * raw provider responses
//       * API keys / Firebase ID tokens
//       * unrelated profile data
//   - A failed audit write never cancels the user's call — the
//     coaching response (or error) still reaches the client. This
//     mirrors the deliberate tradeoff in
//     server/utils/executiveAdvisor/aiAdvisorInvocations.ts: usage
//     visibility is "best effort"; safety guardrails live in the
//     endpoint and the safety scans.

import type {
  AiReviewReportPayload,
  AiReviewReportScope
} from '~~/app/types/aiReviewReports'
import type { Role } from '~~/app/types/models'

export type AiReviewCoachingOutcome =
  | 'success'
  | 'ai_disabled'
  | 'ai_unauthorized'
  | 'ai_forbidden'
  | 'ai_rate_limited'
  | 'ai_payload_too_large'
  | 'ai_provider_error'
  | 'ai_validation_failed'
  | 'ai_safety_check_failed'

export type AiReviewCoachingValidationOutcome =
  | 'passed'
  | 'failed_parse'
  | 'failed_shape'
  | 'failed_safety'
  | 'not_reached'

export type AiReviewCoachingSafetyScanOutcome =
  | 'passed'
  | 'failed'
  | 'not_reached'

export interface AiReviewCoachingInvocationInput {
  uid: string | null
  email: string | null
  role: Role | null
  reportType: AiReviewReportPayload['reportType'] | null
  scope: AiReviewReportScope | null
  outcome: AiReviewCoachingOutcome
  validationOutcome: AiReviewCoachingValidationOutcome
  safetyScanOutcome: AiReviewCoachingSafetyScanOutcome
  payloadStats: {
    deliverableCount: number
    sectionCount: number
    taskCount: number
    goalCount: number
    payloadBytes: number
  } | null
  provider: { name: string } | null
  durationMs: number | null
  errorCode: AiReviewCoachingOutcome | null
}

/** Coerce any value into a primitive that Firestore accepts. Strings
 *  are trimmed; null preserved. */
function coerceString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

/** Compact payload-stats snapshot used at every outcome branch. Pure;
 *  callers may also pass `null` when the payload was never parsed. */
export function summarizePayloadStats(
  payload: AiReviewReportPayload,
  payloadBytes: number
): AiReviewCoachingInvocationInput['payloadStats'] {
  let sectionCount = 0
  for (const d of payload.deliverables) {
    sectionCount += d.sections.length
  }
  return {
    deliverableCount: payload.deliverables.length,
    sectionCount,
    taskCount: payload.tasks.length,
    goalCount: payload.goals.length,
    payloadBytes
  }
}

/** Build the document the endpoint writes. Pure; useful for tests. */
export function buildInvocationDoc(
  input: AiReviewCoachingInvocationInput,
  createdAt: string = new Date().toISOString()
): Record<string, unknown> {
  return {
    uid: coerceString(input.uid),
    email: coerceString(input.email),
    role: input.role ?? null,
    reportType: input.reportType,
    scope: input.scope
      ? {
          reportType: input.scope.reportType,
          department: input.scope.department ?? null,
          deliverableId: input.scope.deliverableId ?? null,
          chapter: input.scope.chapter ?? null
        }
      : null,
    department: input.scope?.department ?? null,
    deliverableId: input.scope?.deliverableId ?? null,
    chapter: input.scope?.chapter ?? null,
    createdAt,
    outcome: input.outcome,
    validationOutcome: input.validationOutcome,
    safetyScanOutcome: input.safetyScanOutcome,
    payloadStats: input.payloadStats,
    provider: input.provider,
    durationMs: input.durationMs,
    errorCode: input.errorCode ?? null
  }
}

/** Best-effort write. Failures are logged server-side and swallowed;
 *  the endpoint must never fail because the audit log failed. */
export async function recordAiReviewCoachingInvocation(
  input: AiReviewCoachingInvocationInput
): Promise<void> {
  const doc = buildInvocationDoc(input)
  try {
    const { adminDb } = await import('~~/server/utils/admin')
    await adminDb().collection('aiReviewCoachingInvocations').add(doc)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      'ai_review_coaching: audit log write failed',
      err instanceof Error ? err.message : String(err)
    )
  }
}
