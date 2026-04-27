// Pure helper that maps a Template Studio requirement to the section
// where the student would actually do the work, then formats the deep
// link Tasks and Home should hand back.
//
// Why we need this: every Tasks/Home "↳ open deliverable" link routes
// to the chapter overview, forcing the student to scan the section
// cards on the chapter hub for the right one. Tasks created from the
// Required checks panel already carry a requirementId, so we can
// resolve the section the student should land in without changing
// the Firestore schema.
//
// Why a heuristic: the studio data model intentionally keeps sections
// and requirements as parallel lists (sections are the writing
// surfaces; requirements are the approval checks). They're not 1:1
// today and may never be — some chapters have requirements that span
// multiple sections, and some sections have no specific requirement.
// We match by token overlap on the requirement id + label against the
// section's id + title. If no good match exists, the helper returns
// null and the caller falls back to the chapter overview, preserving
// the prior behavior.
//
// Posture (do not relax in V1):
//   - no Firestore reads
//   - no Vue / runtime imports — pure function over plain data
//   - no schema change; every input field already exists
//   - never returns a path the caller couldn't already reach

import { getTemplateStudio } from '~/data/templateStudios'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'

// Tokens that show up across many requirement / section ids and
// don't help narrow a match. Department / chapter prefixes are the
// big offenders — a Ch 8 finance studio has many sections that all
// "match" `finance-` if we don't drop it.
const STOP_TOKENS = new Set<string>([
  'a',
  'an',
  'and',
  'or',
  'of',
  'the',
  'to',
  'is',
  'are',
  'for',
  // department / chapter prefixes that recur as requirement labels
  'finance',
  'ops',
  'operations',
  'brand',
  'marketing',
  'strategy',
  'growth',
  'product',
  'phoenix',
  'renni',
  'house'
])

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[-_/\s]+/g)
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t))
}

function scoreSection(
  reqTokens: Set<string>,
  section: TemplateStudioSection
): number {
  const sectionIdTokens = new Set(tokenize(section.id))
  const sectionTitleTokens = new Set(tokenize(section.title))
  let score = 0
  for (const t of reqTokens) {
    if (STOP_TOKENS.has(t)) continue
    if (sectionIdTokens.has(t)) score += 2
    if (sectionTitleTokens.has(t)) score += 1
  }
  return score
}

// Minimum score to accept a match. 2 == one direct id-token overlap
// after stop-token filtering. Below this we fall back so we never
// route the student to a confidently-wrong section.
const MIN_MATCH_SCORE = 2

export function resolveSectionIdForRequirement(
  studio: TemplateStudio | null,
  requirementId: string | null | undefined,
  // Optional supplementary text (the requirement label). Improves
  // matches when ids are short / opaque but labels are descriptive.
  requirementLabel?: string | null
): string | null {
  if (!studio || !requirementId) return null
  const tokens = new Set<string>([
    ...tokenize(requirementId),
    ...(requirementLabel ? tokenize(requirementLabel) : [])
  ])
  if (!tokens.size) return null
  // Prefer the requirement entry's matching section when the
  // studio happens to define it (future-proofing — today no studio
  // does, but we honor it if/when one does).
  const explicit = studio.requirements.find((r) => r.id === requirementId)
  if (explicit && (explicit as { sectionId?: string }).sectionId) {
    const sid = (explicit as { sectionId?: string }).sectionId!
    if (studio.sections.some((s) => s.id === sid)) return sid
  }
  let best: { section: TemplateStudioSection; score: number } | null = null
  for (const section of studio.sections) {
    const s = scoreSection(tokens, section)
    if (s < MIN_MATCH_SCORE) continue
    if (!best || s > best.score) best = { section, score: s }
  }
  return best ? best.section.id : null
}

export interface TaskLikeForDeepLink {
  deliverableId?: string | null
  requirementId?: string | null
}

// Returns the best deep link for the task. Order:
//   1. /deliverables/{id}/sections/{sectionId} when we can resolve the
//      requirement to a section (requirementId present, studio loaded,
//      score >= MIN_MATCH_SCORE).
//   2. /deliverables/{id} otherwise.
//   3. null if the task has no linked deliverable at all (callers
//      should treat this as "no deep link available").
export function deepLinkForTask(task: TaskLikeForDeepLink): string | null {
  if (!task.deliverableId) return null
  if (task.requirementId) {
    const studio = getTemplateStudio(task.deliverableId)
    if (studio) {
      const explicit = studio.requirements.find(
        (r) => r.id === task.requirementId
      )
      const sectionId = resolveSectionIdForRequirement(
        studio,
        task.requirementId,
        explicit?.label
      )
      if (sectionId) {
        return `/deliverables/${task.deliverableId}/sections/${sectionId}`
      }
    }
  }
  return `/deliverables/${task.deliverableId}`
}
