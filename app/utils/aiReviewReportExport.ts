// Markdown export helpers for leadership review reports.
//
// Posture (do not relax):
//   - PURE except downloadReviewMarkdown, which is browser-only DOM IO.
//   - The deterministic report remains the source of truth.
//   - Never include raw payload JSON, full student text, raw provider
//     output, tokens, keys, or attribution claims the payload cannot prove.

import type {
  AiReviewCoachingOutput,
  AiReviewDeliverableSummary,
  AiReviewReportPayload,
  AiReviewReportType
} from '~/types/aiReviewReports'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '~/types/aiReviewReports'
import { safeCsvFilename } from '~/utils/csvExport'

const TITLE_BY_TYPE: Record<AiReviewReportType, string> = {
  company: 'Renni Inc. Company Review Report',
  department: 'Renni Inc. Department Review Report',
  chapter: 'Renni Inc. Chapter Review Report'
}

function scopeLine(payload: AiReviewReportPayload): string {
  if (payload.scope.reportType === 'company') return 'Company-wide'
  if (payload.scope.reportType === 'department') {
    return `Department: ${payload.scope.department ?? 'Unknown'}`
  }
  const d = payload.deliverables[0]
  return d
    ? `Chapter ${d.chapter}: ${d.title}`
    : `Chapter: ${payload.scope.chapter ?? payload.scope.deliverableId ?? 'Unknown'}`
}

function pushSection(lines: string[], heading: string, body: string[]) {
  const clean = body.filter((line) => String(line ?? '').trim().length > 0)
  if (!clean.length) return
  lines.push('')
  lines.push(`## ${heading}`)
  lines.push(...clean)
}

function bullet(value: string): string {
  return `- ${value}`
}

function topDeliverables(
  deliverables: readonly AiReviewDeliverableSummary[],
  predicate: (d: AiReviewDeliverableSummary) => boolean,
  formatter: (d: AiReviewDeliverableSummary) => string,
  max = 8
): string[] {
  const rows = deliverables.filter(predicate).slice(0, max).map((d) => bullet(formatter(d)))
  return rows.length ? rows : [bullet('None in current scope.')]
}

function statusSummary(payload: AiReviewReportPayload): string[] {
  const s = payload.deterministicSummary
  return [
    bullet(`${s.totalDeliverables} deliverable(s): ${s.approvedDeliverables} approved, ${s.inReviewDeliverables} in review, ${s.needsRevisionDeliverables} need revision, ${s.draftDeliverables} in draft.`),
    bullet(`${s.totalSections} section(s): ${s.sectionsWithFinalText} final text, ${s.sectionsWithDraftFallback} draft fallback, ${s.sectionsWithSourceNotesFallback} source-note fallback, ${s.sectionsMissing} missing.`),
    bullet(`${s.evidenceLinkCount} evidence link(s), ${s.structuredEvidenceCount} structured evidence entr${s.structuredEvidenceCount === 1 ? 'y' : 'ies'}.`),
    bullet(`${s.totalTasks} task(s): ${s.completedTasks} complete, ${s.blockedTasks} blocked, ${s.overdueTasks} overdue.`)
  ]
}

function coachingLines(coaching: AiReviewCoachingOutput): string[] {
  const lines: string[] = []
  lines.push(coaching.executiveSummary)
  if (coaching.coachingPriorities.length) {
    lines.push('')
    lines.push('### Coaching priorities')
    for (const item of coaching.coachingPriorities.slice(0, 5)) {
      lines.push(bullet(`${item.issue} (${item.urgency}) — ${item.coachingMove} Owner: ${item.owner}. Done when: ${item.definitionOfDone}`))
    }
  }
  if (coaching.recommendedNextActions.length) {
    lines.push('')
    lines.push('### Recommended next actions')
    for (const item of coaching.recommendedNextActions.slice(0, 5)) {
      lines.push(bullet(`${item.action} Owner: ${item.owner}. Done when: ${item.definitionOfDone}`))
    }
  }
  if (coaching.limitations.length) {
    lines.push('')
    lines.push('### AI coaching limitations')
    for (const item of coaching.limitations.slice(0, 8)) lines.push(bullet(item))
  }
  return lines
}

export function buildReviewMarkdown(
  payload: AiReviewReportPayload,
  coaching: AiReviewCoachingOutput | null = null,
  options: { generatedAt?: string } = {}
): string {
  const generatedAt = options.generatedAt ?? new Date().toISOString()
  const r = payload.deterministicReadiness
  const lines: string[] = []
  lines.push(`# ${TITLE_BY_TYPE[payload.scope.reportType]}`)
  lines.push('')
  lines.push(`Scope: ${scopeLine(payload)}`)
  lines.push(`Generated: ${generatedAt}`)
  lines.push('')
  lines.push('Deterministic report is the source of truth. AI coaching, when present, is optional leadership support.')
  lines.push('')
  lines.push(`Readiness: ${r.deterministicScore} / 100 (${r.label})`)

  pushSection(lines, 'Work-State Summary', statusSummary(payload))
  pushSection(
    lines,
    'Top Missing Items',
    topDeliverables(
      payload.deliverables,
      (d) => d.sectionsMissing > 0 || d.missingRequiredRequirementLabels.length > 0,
      (d) =>
        `Ch. ${d.chapter} ${d.title}: ${d.sectionsMissing} missing section(s), ${d.missingRequiredRequirementLabels.length} required task coverage gap(s).`
    )
  )
  pushSection(
    lines,
    'Overdue Items',
    topDeliverables(
      payload.deliverables,
      (d) => d.isOverdue,
      (d) => `Ch. ${d.chapter} ${d.title} (${d.statusLabel}) due ${d.dueDate ?? 'unknown'}.`
    )
  )
  pushSection(
    lines,
    'Needs Revision',
    topDeliverables(
      payload.deliverables,
      (d) => d.status === 'needs_revision',
      (d) => `Ch. ${d.chapter} ${d.title}${d.returnedReason ? `: ${d.returnedReason}` : ''}.`
    )
  )
  pushSection(
    lines,
    'Evidence Gaps',
    topDeliverables(
      payload.deliverables,
      (d) => d.evidenceLinkCount + d.structuredEvidenceCount === 0,
      (d) => `Ch. ${d.chapter} ${d.title}: no evidence items logged.`
    )
  )
  const limitations = [
    ...payload.limitations.map((l) => `${l.code}: ${l.message}`),
    ...payload.deterministicReadiness.limitations.map((l) => `${l.code}: ${l.message}`)
  ]
  pushSection(
    lines,
    'Limitations',
    limitations.length ? limitations.map(bullet) : [bullet('No deterministic limitations surfaced for this scope.')]
  )

  if (coaching) {
    pushSection(lines, 'AI Coaching', coachingLines(coaching))
  }

  lines.push('')
  lines.push(`_${AI_REVIEW_COACHING_SAFETY_REMINDER}_`)
  lines.push('_Human leaders approve work._')
  return `${lines.join('\n')}\n`
}

export function buildCompanyReviewMarkdown(
  payload: AiReviewReportPayload,
  coaching: AiReviewCoachingOutput | null = null
): string {
  return buildReviewMarkdown(payload, coaching)
}

export function buildDepartmentReviewMarkdown(
  payload: AiReviewReportPayload,
  coaching: AiReviewCoachingOutput | null = null
): string {
  return buildReviewMarkdown(payload, coaching)
}

export function buildChapterReviewMarkdown(
  payload: AiReviewReportPayload,
  coaching: AiReviewCoachingOutput | null = null
): string {
  return buildReviewMarkdown(payload, coaching)
}

export function reviewMarkdownFilename(payload: AiReviewReportPayload): string {
  return `${safeCsvFilename(`renni-${payload.scope.reportType}-review-${scopeLine(payload)}`)}.md`
}

export function downloadReviewMarkdown(
  filename: string,
  markdown: string
): void {
  if (typeof window === 'undefined') return
  const safe = filename.endsWith('.md') ? filename : `${filename}.md`
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safe
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
