// Audit: requirement-to-section resolution.
//
// Mirrors the heuristic in app/utils/requirementToSection.ts and runs
// it across every Template Studio requirement so the team can see
// (a) which requirements deep-link cleanly to a section workspace,
// (b) which fall back to the chapter overview, and
// (c) which mappings look suspicious enough to revisit.
//
// Read-only: imports curriculum data, prints a report, never touches
// Firestore.
//
// Usage:
//   tsx scripts/audit-requirement-section-resolution.ts
//   tsx scripts/audit-requirement-section-resolution.ts --tsv  # tab-separated
//
// The heuristic is reproduced inline so the audit doesn't depend on
// Nuxt's `~/` import alias resolving outside the dev server.

import { templateStudios } from '../app/data/templateStudios'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '../app/types/templateStudio'

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

const MIN_MATCH_SCORE = 2

interface Resolution {
  deliverableId: string
  studioTitle: string
  requirementId: string
  requirementLabel: string
  requirementRequired: boolean
  resolvedSectionId: string | null
  resolvedSectionTitle: string | null
  matchedScore: number
  fallback: boolean
  fallbackAcceptable: boolean | null
  suspicious: boolean
  note: string
}

function resolveOne(
  studio: TemplateStudio,
  requirement: {
    id: string
    label: string
    requiredForApproval: boolean
    sectionId?: string
  }
): Resolution {
  // Mirror the production helper: an explicit `sectionId` on the
  // requirement wins over the heuristic. Reported as "explicit" so
  // the audit can't accidentally regress to the suspicious tie.
  if (requirement.sectionId) {
    const explicitSection = studio.sections.find(
      (s) => s.id === requirement.sectionId
    )
    if (explicitSection) {
      return {
        deliverableId: '', // populated by caller
        studioTitle: studio.title,
        requirementId: requirement.id,
        requirementLabel: requirement.label,
        requirementRequired: requirement.requiredForApproval,
        resolvedSectionId: explicitSection.id,
        resolvedSectionTitle: explicitSection.title,
        matchedScore: Number.POSITIVE_INFINITY,
        fallback: false,
        fallbackAcceptable: null,
        suspicious: false,
        note: 'explicit sectionId on requirement'
      }
    }
  }

  const tokens = new Set<string>([
    ...tokenize(requirement.id),
    ...tokenize(requirement.label)
  ])
  let best: { section: TemplateStudioSection; score: number } | null = null
  let runnerUp: { section: TemplateStudioSection; score: number } | null = null
  for (const section of studio.sections) {
    const s = scoreSection(tokens, section)
    if (s <= 0) continue
    if (!best || s > best.score) {
      runnerUp = best
      best = { section, score: s }
    } else if (!runnerUp || s > runnerUp.score) {
      runnerUp = { section, score: s }
    }
  }

  const accepted = best && best.score >= MIN_MATCH_SCORE
  const resolvedSectionId = accepted ? best!.section.id : null
  const resolvedSectionTitle = accepted ? best!.section.title : null

  // Heuristics for "suspicious" flagging:
  //   - score is exactly the minimum (2) AND came from a single weak
  //     id-token match. The match could be incidental.
  //   - runner-up tied with best (ambiguity). We picked first-seen.
  //   - fallback hit a *required* requirement (these matter most).
  //   - resolved section title contains no token from the requirement
  //     label (id-only match — the resolution may not be obvious to
  //     a student opening the link).
  let suspicious = false
  let note = ''
  if (accepted) {
    if (runnerUp && runnerUp.score === best!.score) {
      suspicious = true
      note = `tied with section "${runnerUp.section.id}" at score ${best!.score}`
    } else if (best!.score === MIN_MATCH_SCORE) {
      // Min-score matches are still acceptable but worth double-checking.
      const labelTokens = new Set(tokenize(requirement.label))
      const sectionTitleTokens = new Set(tokenize(best!.section.title))
      const titleOverlap = [...labelTokens].some(
        (t) => !STOP_TOKENS.has(t) && sectionTitleTokens.has(t)
      )
      if (!titleOverlap) {
        suspicious = true
        note = 'min-score id-only match; section title shares no token with requirement label'
      }
    }
  }

  return {
    deliverableId: studio.title // overwritten below
      ? Object.keys(templateStudios).find((id) => templateStudios[id] === studio) || ''
      : '',
    studioTitle: studio.title,
    requirementId: requirement.id,
    requirementLabel: requirement.label,
    requirementRequired: requirement.requiredForApproval,
    resolvedSectionId,
    resolvedSectionTitle,
    matchedScore: best?.score ?? 0,
    fallback: !accepted,
    fallbackAcceptable: !accepted ? null : null, // populated by caller heuristic
    suspicious,
    note
  }
}

function main(): void {
  const tsvMode = process.argv.includes('--tsv')
  const rows: Resolution[] = []
  for (const [deliverableId, studio] of Object.entries(templateStudios)) {
    for (const req of studio.requirements) {
      const r = resolveOne(studio, req)
      r.deliverableId = deliverableId
      // Fallback acceptability — a fallback is "acceptable" when:
      //   - the requirement is not requiredForApproval (cosmetic), OR
      //   - the requirement label clearly maps to evidence /
      //     suggested tasks rather than a writing surface (label
      //     contains "evidence", "tracker", "folder", "doc",
      //     "screenshot", "photo", or "template").
      const labelLc = r.requirementLabel.toLowerCase()
      const looksLikeEvidence =
        /evidence|tracker|folder|screenshot|photo|template|sheet|count|labels?\b|file/.test(
          labelLc
        )
      r.fallbackAcceptable = r.fallback
        ? !r.requirementRequired || looksLikeEvidence
        : null
      rows.push(r)
    }
  }

  if (tsvMode) {
    const cols = [
      'deliverableId',
      'studio',
      'requirementId',
      'label',
      'required',
      'resolvedSectionId',
      'resolvedSectionTitle',
      'score',
      'fallback',
      'fallbackAcceptable',
      'suspicious',
      'note'
    ]
    console.log(cols.join('\t'))
    for (const r of rows) {
      console.log(
        [
          r.deliverableId,
          r.studioTitle.replace(/\t/g, ' '),
          r.requirementId,
          r.requirementLabel.replace(/\t/g, ' '),
          r.requirementRequired ? 'yes' : 'no',
          r.resolvedSectionId ?? '—',
          (r.resolvedSectionTitle ?? '—').replace(/\t/g, ' '),
          r.matchedScore.toString(),
          r.fallback ? 'fallback' : 'matched',
          r.fallback
            ? r.fallbackAcceptable
              ? 'ok'
              : 'review'
            : '',
          r.suspicious ? 'yes' : '',
          r.note
        ].join('\t')
      )
    }
    return
  }

  // Markdown summary mode (default)
  const grouped = new Map<string, Resolution[]>()
  for (const r of rows) {
    const arr = grouped.get(r.deliverableId) ?? []
    arr.push(r)
    grouped.set(r.deliverableId, arr)
  }

  const totalRequirements = rows.length
  const totalMatched = rows.filter((r) => !r.fallback).length
  const totalFallback = rows.filter((r) => r.fallback).length
  const totalSuspicious = rows.filter((r) => r.suspicious).length
  const totalFallbackUnacceptable = rows.filter(
    (r) => r.fallback && r.fallbackAcceptable === false
  ).length

  console.log('# Requirement-to-Section Resolution Audit')
  console.log()
  console.log(`Total requirements:           ${totalRequirements}`)
  console.log(
    `Resolved to a section:        ${totalMatched} (${pct(totalMatched, totalRequirements)})`
  )
  console.log(
    `Falls back to chapter view:   ${totalFallback} (${pct(totalFallback, totalRequirements)})`
  )
  console.log(`  · acceptable fallback:      ${totalFallback - totalFallbackUnacceptable}`)
  console.log(`  · review fallback:          ${totalFallbackUnacceptable}`)
  console.log(`Suspicious resolutions:       ${totalSuspicious}`)
  console.log()

  for (const [deliverableId, list] of grouped) {
    const studio = templateStudios[deliverableId]!
    console.log(`## ${deliverableId}`)
    console.log(`*${studio.title}* — ${list.length} requirement${list.length === 1 ? '' : 's'}`)
    console.log()
    console.log(
      '| reqId | required | label | → section | score | flag |'
    )
    console.log('|---|---|---|---|---|---|')
    for (const r of list) {
      const flag = r.fallback
        ? r.fallbackAcceptable
          ? 'fallback (ok)'
          : '⚠ fallback (review)'
        : r.suspicious
          ? `⚠ ${r.note}`
          : ''
      const arrow = r.resolvedSectionId
        ? `${r.resolvedSectionId} — ${r.resolvedSectionTitle}`
        : '— (chapter overview)'
      const scoreCell =
        r.matchedScore === Number.POSITIVE_INFINITY
          ? 'explicit'
          : r.matchedScore.toString()
      console.log(
        `| ${r.requirementId} | ${r.requirementRequired ? 'yes' : 'no'} | ${r.requirementLabel.replace(/\|/g, '\\|')} | ${arrow.replace(/\|/g, '\\|')} | ${scoreCell} | ${flag} |`
      )
    }
    console.log()
  }
}

function pct(n: number, d: number): string {
  if (!d) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

main()
