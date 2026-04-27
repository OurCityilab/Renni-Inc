// Pure helpers for the Guidance Compression Sprint.
//
// Two derivations students see right above the writing surface in the
// compressed section workspace view:
//   - effectiveWhyThisMatters: 1–2 sentence reason this section
//     specifically matters. Prefers section-level metadata; falls
//     back to a derived line from section.lesson; only uses chapter-
//     level whyItMatters as a last resort so the callout doesn't
//     repeat the page-level chapter framing on every section.
//   - effectiveActionSummary: one-sentence "What to do" instruction.
//     Prefers section-level metadata; otherwise builds a deterministic
//     fallback from studentPrompts / completionCriteria / a generic
//     phrase so every section has a usable instruction even when the
//     studio file hasn't been updated.
//
// Posture (do not relax):
//   - no Firestore reads
//   - no Vue / runtime imports — pure functions over plain data
//   - no AI calls — fallbacks are deterministic string composition
//   - never invent claims or numbers; only ever rephrase existing
//     curriculum metadata or use a fixed fallback phrase

import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'

const MAX_WHY_LEN = 220
const MAX_ACTION_LEN = 200

function trim(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  // Hard truncate at last space before max, then append ellipsis.
  const slice = t.slice(0, max)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice) + '…'
}

// Pull the first sentence (rough heuristic) so a long lesson paragraph
// reads as a tight callout rather than a wall of text.
function firstSentence(text: string): string {
  const t = text.trim()
  if (!t) return ''
  const m = t.match(/^[^.!?]+[.!?]/)
  if (m) return m[0]
  return t
}

// 1–2 sentence why-this-matters for this specific section. Section-
// level field wins; otherwise we derive a tight summary from
// section.lesson; only fall back to studio.whyItMatters when neither
// section-level field is meaningful.
export function effectiveWhyThisMatters(
  section: TemplateStudioSection,
  studio: TemplateStudio
): string {
  const explicit = section.whyThisMatters?.trim()
  if (explicit) return trim(explicit, MAX_WHY_LEN)
  const lesson = section.lesson?.trim()
  if (lesson) {
    const sentence = firstSentence(lesson)
    if (sentence) return trim(sentence, MAX_WHY_LEN)
  }
  const studioWhy = studio.whyItMatters?.trim()
  if (studioWhy) return trim(studioWhy, MAX_WHY_LEN)
  return ''
}

// One-sentence "What to do" line shown above the writing surface in
// the compressed view. Each fallback layer is concrete enough to
// orient a student who skipped the longer guide:
//   1. authored section.actionSummary
//   2. first studentPrompt — the most specific guidance we have
//   3. first completionCriteria — what "done" looks like
//   4. generic fallback so the surface is never empty
export function effectiveActionSummary(
  section: TemplateStudioSection
): string {
  const explicit = section.actionSummary?.trim()
  if (explicit) return trim(explicit, MAX_ACTION_LEN)
  const firstPrompt = (section.studentPrompts ?? [])[0]?.trim()
  if (firstPrompt) return trim(firstPrompt, MAX_ACTION_LEN)
  const firstCriterion = (section.completionCriteria ?? [])[0]?.trim()
  if (firstCriterion) return trim(firstCriterion, MAX_ACTION_LEN)
  return 'Answer the prompts for this section, then turn them into Final Playbook text.'
}
