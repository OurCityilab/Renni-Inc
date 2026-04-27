// Pure helper that turns a Template Studio + a deliverable output doc
// into a soft "Playbook output readiness" summary. Used on the Playbook
// chapter cards to surface whether final section text actually exists
// for a studio-backed deliverable.
//
// Readiness here is *only* a final-text signal. It deliberately ignores
// source notes, draft text, evidence links, section status, task
// completion, and approval state — those are tracked elsewhere. This
// helper never reads Firestore and never writes anywhere; it's pure data
// in / data out so the Playbook page can render it cheaply.

import type { DeliverableOutput } from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'

export interface OutputReadinessSummary {
  totalSections: number
  sectionsWithFinalText: number
  missingFinalTextSections: number
  hasOutput: boolean
  label: string
  detail: string | null
}

export function computeOutputReadiness(
  studio: TemplateStudio,
  output: DeliverableOutput | null
): OutputReadinessSummary {
  const totalSections = studio.sections.length
  if (!output) {
    return {
      totalSections,
      sectionsWithFinalText: 0,
      missingFinalTextSections: totalSections,
      hasOutput: false,
      label: 'Build this section — not started yet.',
      detail: null
    }
  }
  let sectionsWithFinalText = 0
  for (const s of studio.sections) {
    const persisted = output.sections?.[s.id]
    const finalText = (persisted?.finalText ?? '').trim()
    if (finalText.length > 0) sectionsWithFinalText += 1
  }
  const missingFinalTextSections = Math.max(
    totalSections - sectionsWithFinalText,
    0
  )
  const label = `Final text: ${sectionsWithFinalText} of ${totalSections} sections ready`
  let detail: string | null = null
  if (missingFinalTextSections > 0) {
    detail =
      missingFinalTextSections === 1
        ? '1 section still needs final Playbook text.'
        : `${missingFinalTextSections} sections still need final Playbook text.`
  }
  return {
    totalSections,
    sectionsWithFinalText,
    missingFinalTextSections,
    hasOutput: true,
    label,
    detail
  }
}
