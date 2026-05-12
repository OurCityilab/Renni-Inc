// Paste-ready leadership coaching summary.
//
// Posture (do not relax):
//   - PURE: no Firestore, no fetch, no AI calls.
//   - DOES NOT include raw payload JSON, raw provider output, or
//     full student text.
//   - DOES NOT use AI approval / AI grade language.
//   - Mirrors the rendered AiReviewCoachingPanel structure so the
//     copy block matches the on-screen output.
//   - Always ends with the literal safety reminder so anyone who
//     pastes the block elsewhere sees the boundary.

import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload,
  AiReviewReportType
} from '~/types/aiReviewReports'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '~/types/aiReviewReports'

const REPORT_TYPE_TITLE: Record<AiReviewReportType, string> = {
  company: 'Company AI Leadership Coaching',
  department: 'Department AI Leadership Coaching',
  chapter: 'Chapter AI Leadership Coaching'
}

function describeScope(payload: AiReviewReportPayload): string {
  const { scope, deliverables } = payload
  switch (scope.reportType) {
    case 'company':
      return 'Scope: company-wide.'
    case 'department':
      return `Scope: department · ${scope.department ?? 'unknown'}.`
    case 'chapter': {
      const d = deliverables[0]
      if (d) {
        return `Scope: chapter ${d.chapter} · ${d.title}.`
      }
      return `Scope: chapter ${scope.chapter ?? 'unknown'}.`
    }
  }
}

function bullet(value: string | undefined | null): string | null {
  if (!value) return null
  const t = String(value).trim()
  return t.length > 0 ? `- ${t}` : null
}

function appendBlock(out: string[], heading: string, body: string[]) {
  const filtered = body.filter((line): line is string => Boolean(line))
  if (filtered.length === 0) return
  out.push('')
  out.push(`### ${heading}`)
  for (const line of filtered) out.push(line)
}

/** Build the Markdown copy block. Empty arrays are skipped so the
 *  output never carries trailing whitespace blocks. */
export function buildAiReviewCoachingCopyBlock(
  coaching: AiReviewCoachingOutput,
  payload: AiReviewReportPayload,
  options: { generatedAt?: string } = {}
): string {
  const lines: string[] = []
  lines.push(`# ${REPORT_TYPE_TITLE[payload.scope.reportType]}`)
  lines.push('')
  lines.push(`_${AI_REVIEW_COACHING_SAFETY_REMINDER}_`)
  lines.push('')
  lines.push(describeScope(payload))
  if (options.generatedAt) {
    lines.push(`Generated ${options.generatedAt}.`)
  }

  if (coaching.executiveSummary && coaching.executiveSummary.trim()) {
    lines.push('')
    lines.push('## Executive summary')
    lines.push(coaching.executiveSummary.trim())
  }

  // Coaching priorities (cap at 5 for paste-friendliness).
  if (coaching.coachingPriorities.length) {
    lines.push('')
    lines.push('## Coaching priorities')
    for (const p of coaching.coachingPriorities.slice(0, 5)) {
      lines.push('')
      lines.push(`- **${p.issue}** (${p.urgency})`)
      const bits = [
        bullet(`Evidence: ${p.evidenceFromPayload}`),
        bullet(`Why it matters: ${p.whyItMatters}`),
        bullet(`Coaching move: ${p.coachingMove}`),
        bullet(`Owner: ${p.owner}`),
        bullet(`Definition of done: ${p.definitionOfDone}`)
      ]
      for (const b of bits) if (b) lines.push(`  ${b}`)
    }
  }

  if (coaching.strongestAreas.length) {
    appendBlock(
      lines,
      'Strongest areas',
      coaching.strongestAreas
        .map((s) =>
          bullet(
            `${s.area} — ${s.evidenceFromPayload}. Why it matters: ${s.whyItMatters}`
          )
        )
        .filter((b): b is string => Boolean(b))
    )
  }

  if (coaching.weakestAreas.length) {
    appendBlock(
      lines,
      'Weakest areas',
      coaching.weakestAreas
        .map((w) =>
          bullet(
            `${w.area} — ${w.issue}. Recommended fix: ${w.recommendedFix}${
              w.owner ? ` (owner: ${w.owner})` : ''
            }`
          )
        )
        .filter((b): b is string => Boolean(b))
    )
  }

  if (coaching.missingEvidence.length) {
    appendBlock(
      lines,
      'Missing evidence',
      coaching.missingEvidence.map((m) =>
        bullet(
          `${m.sectionOrDeliverable} — ${m.issue}. Needed: ${m.neededEvidence}${
            m.owner ? ` (owner: ${m.owner})` : ''
          }`
        )
      ) as string[]
    )
  }

  if (coaching.escalationItems.length) {
    appendBlock(
      lines,
      'Escalation items',
      coaching.escalationItems.map((e) =>
        bullet(
          `${e.issue} → escalate to ${e.escalateTo} (${e.urgency}). Reason: ${e.reason}`
        )
      ) as string[]
    )
  }

  if (coaching.recommendedNextActions.length) {
    appendBlock(
      lines,
      'Recommended next actions',
      coaching.recommendedNextActions.map((a) =>
        bullet(
          `${a.action} — owner ${a.owner} (${a.urgency}). Done when: ${a.definitionOfDone}`
        )
      ) as string[]
    )
  }

  if (coaching.suggestedTalkingPoints.length) {
    appendBlock(
      lines,
      'Suggested talking points',
      coaching.suggestedTalkingPoints
        .map((t) => bullet(t))
        .filter((b): b is string => Boolean(b))
    )
  }

  if (coaching.limitations.length) {
    appendBlock(
      lines,
      'Limitations',
      coaching.limitations
        .map((l) => bullet(l))
        .filter((b): b is string => Boolean(b))
    )
  }

  // Safety reminder at the foot so a downstream paste still carries
  // the boundary.
  lines.push('')
  lines.push(`_${coaching.safetyReminder}_`)

  return lines.join('\n').trim() + '\n'
}
