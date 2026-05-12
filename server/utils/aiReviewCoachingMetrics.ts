// Pure aggregation helpers for AI review coaching invocation metadata.
// The endpoint reads server-only audit docs, then exposes aggregate
// counts only. No payloads, outputs, raw prompts, or user activity feed.

import type {
  AiReviewCoachingOutcome,
  AiReviewCoachingValidationFailureCategory
} from '~~/server/utils/aiReviewCoachingInvocations'
import type { AiReviewReportType } from '~~/app/types/aiReviewReports'

export interface AiReviewCoachingMetricDoc {
  createdAt?: string | null
  reportType?: AiReviewReportType | null
  outcome?: AiReviewCoachingOutcome | null
  durationMs?: number | null
  payloadStats?: {
    payloadBytes?: number | null
  } | null
  validationDiagnostics?: {
    category?: AiReviewCoachingValidationFailureCategory | null
    simplifiedFallbackUsed?: boolean | null
  } | null
}

export interface AiReviewCoachingMetrics {
  totalToday: number
  byReportType: Record<AiReviewReportType, number>
  outcomeCounts: Record<string, number>
  successCount: number
  disabledCount: number
  forbiddenCount: number
  validationFailureCount: number
  validationFailureCategories: Record<AiReviewCoachingValidationFailureCategory, number>
  simplifiedFallbackCount: number
  safetyFailureCount: number
  latestInvocationAt: string | null
  averagePayloadBytes: number | null
  averageDurationMs: number | null
}

export function aggregateAiReviewCoachingMetrics(
  docs: readonly AiReviewCoachingMetricDoc[]
): AiReviewCoachingMetrics {
  const byReportType: Record<AiReviewReportType, number> = {
    company: 0,
    department: 0,
    chapter: 0
  }
  const outcomeCounts: Record<string, number> = {}
  const validationFailureCategories: Record<AiReviewCoachingValidationFailureCategory, number> = {
    failed_parse: 0,
    failed_shape: 0,
    failed_safety: 0,
    failed_personal_judgment: 0
  }
  let simplifiedFallbackCount = 0
  let latestInvocationAt: string | null = null
  let payloadByteTotal = 0
  let payloadByteCount = 0
  let durationTotal = 0
  let durationCount = 0

  for (const doc of docs) {
    if (doc.reportType === 'company' || doc.reportType === 'department' || doc.reportType === 'chapter') {
      byReportType[doc.reportType] += 1
    }
    const outcome = doc.outcome ?? 'unknown'
    outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1
    const category = doc.validationDiagnostics?.category
    if (
      category === 'failed_parse' ||
      category === 'failed_shape' ||
      category === 'failed_safety' ||
      category === 'failed_personal_judgment'
    ) {
      validationFailureCategories[category] += 1
    }
    if (doc.validationDiagnostics?.simplifiedFallbackUsed === true) {
      simplifiedFallbackCount += 1
    }
    if (doc.createdAt && (!latestInvocationAt || doc.createdAt > latestInvocationAt)) {
      latestInvocationAt = doc.createdAt
    }
    const bytes = doc.payloadStats?.payloadBytes
    if (typeof bytes === 'number' && Number.isFinite(bytes)) {
      payloadByteTotal += bytes
      payloadByteCount += 1
    }
    if (typeof doc.durationMs === 'number' && Number.isFinite(doc.durationMs)) {
      durationTotal += doc.durationMs
      durationCount += 1
    }
  }

  return {
    totalToday: docs.length,
    byReportType,
    outcomeCounts,
    successCount: outcomeCounts.success ?? 0,
    disabledCount: outcomeCounts.ai_disabled ?? 0,
    forbiddenCount: outcomeCounts.ai_forbidden ?? 0,
    validationFailureCount: outcomeCounts.ai_validation_failed ?? 0,
    validationFailureCategories,
    simplifiedFallbackCount,
    safetyFailureCount: outcomeCounts.ai_safety_check_failed ?? 0,
    latestInvocationAt,
    averagePayloadBytes:
      payloadByteCount > 0 ? Math.round(payloadByteTotal / payloadByteCount) : null,
    averageDurationMs:
      durationCount > 0 ? Math.round(durationTotal / durationCount) : null
  }
}
