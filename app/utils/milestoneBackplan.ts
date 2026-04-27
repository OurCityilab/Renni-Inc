// Milestone Backplanner — V1 deterministic helper.
//
// Given a final-presentation target date, returns a back-planned set of
// suggested milestones. Used by /timeline (Suggested Milestone Plan
// section) and by the C-Suite Advisor (Milestone Backplan card).
//
// Posture (do not relax in V1):
//   - pure / deterministic / no I/O / no AI
//   - never writes to Firestore
//   - never creates a task, never edits a deliverable.dueDate or
//     task.dueDate
//   - returns an empty array when the input target date is missing
//   - status evaluation is read-only — UI consumers chip past-due
//     milestones; nothing mutates anywhere

import type { ProjectMilestones } from '~/data/projectMilestones'

export type MilestoneStatus =
  | 'upcoming'
  | 'today'
  | 'past-needs-action'
  | 'past-clean'

export interface BackplanMilestone {
  id: string
  title: string
  // Computed at runtime by buildMilestoneBackplan from the configured
  // finalPresentationTargetDate. yyyy-mm-dd format.
  suggestedDate: string
  // Days before the final presentation. Negative offset relative to
  // the final date — kept as a positive number here for readability.
  daysBeforeFinal: number
  owner: string
  dependency: string
  definitionOfDone: string
  // Playbook chapters this milestone exercises. Empty array means the
  // milestone is program-wide (e.g. final Playbook complete, rehearsal).
  relatedChapters: number[]
  whyItMatters: string
}

// Template — earliest first. Edit offsets here if the curriculum
// rhythm changes. Designed for a final-presentation date roughly 3
// weeks out; the helper still returns dates correctly for shorter
// runways but those dates may already be in the past.
const TEMPLATE: ReadonlyArray<Omit<BackplanMilestone, 'suggestedDate'>> = [
  {
    id: 'product-specs',
    title: 'Product / specs locked',
    daysBeforeFinal: 16,
    owner: 'COO + Co-CEOs',
    dependency: 'Ch. 6 product-line decisions',
    definitionOfDone:
      'Final product list, vendor / production source, and decoration specs are decided. No more product additions after this date.',
    relatedChapters: [6, 7],
    whyItMatters:
      'Pricing math, comp evidence, design briefs, and campaign messaging all depend on knowing exactly what the team is selling.'
  },
  {
    id: 'segment-evidence',
    title: 'Segment evidence complete',
    daysBeforeFinal: 14,
    owner: 'Chief Strategy and Growth Officer + CMO',
    dependency: 'product-specs',
    definitionOfDone:
      'Each named PRIZM-inspired segment has labeled evidence (interview / observation / survey / labeled assumption). Customer language captured.',
    relatedChapters: [7],
    whyItMatters:
      'Segments drive Ch. 8 pricing positioning, Ch. 10 messaging, and Ch. 11 carry pitch. Thin segments propagate as thin everything.'
  },
  {
    id: 'pricing-comps',
    title: 'Pricing / margin / comps complete',
    daysBeforeFinal: 11,
    owner: 'CFO + Co-CEOs',
    dependency: 'segment-evidence',
    definitionOfDone:
      'Ch. 8 Pricing Strategy Builder filled in for each pop-up product: cost, margin, two named comps with what they prove and do not prove, validation step, confidence level.',
    relatedChapters: [8],
    whyItMatters:
      'Phoenix Nest carry pitch, campaign tone, and operations readiness all need defensible price points with margin math.'
  },
  {
    id: 'campaign-message',
    title: 'Campaign message draft complete',
    daysBeforeFinal: 8,
    owner: 'CMO',
    dependency: 'segment-evidence + pricing-comps',
    definitionOfDone:
      'First-round campaign copy drafted: announcement post, hallway flyer headline, table-sign headline. Each piece of copy traces to a named segment problem or desire and matches Ch. 9 brand voice.',
    relatedChapters: [10],
    whyItMatters:
      'TechTown foot traffic depends on copy in the brand voice that names a real customer reason to walk over.'
  },
  {
    id: 'ops-readiness',
    title: 'Operations readiness draft complete',
    daysBeforeFinal: 6,
    owner: 'COO',
    dependency: 'product-specs',
    definitionOfDone:
      'Ch. 9 Operations Readiness draft covers vendor sourcing, production timeline, inventory plan, booth ops, payment plan, and at-event checklist.',
    relatedChapters: [9],
    whyItMatters:
      'A brilliant brand at TechTown still fails if the booth has no change, no cash card reader plan, or no setup checklist.'
  },
  {
    id: 'phoenix-nest-pitch',
    title: 'Phoenix Nest carry pitch draft complete',
    daysBeforeFinal: 6,
    owner: 'CMO + Co-CEOs',
    dependency: 'pricing-comps + brand-story',
    definitionOfDone:
      'Ch. 11 Phoenix Nest pitch one-pager drafted: who House Phoenix is for, why it fits Phoenix Nest customers, three carry SKUs with margin/price, credibility paragraph, one risk + one mitigation.',
    relatedChapters: [11],
    whyItMatters:
      'A real wholesale buyer needs a one-pager they can decide on without follow-up. This is the first artifact that gets House Phoenix on a Detroit-made shelf.'
  },
  {
    id: 'final-playbook',
    title: 'Final Playbook text complete',
    daysBeforeFinal: 4,
    owner: 'Co-CEOs (with chiefs)',
    dependency: 'all chapter drafts',
    definitionOfDone:
      'Every studio-backed chapter has finalText written for every section that requires one. Approvals follow normal flow — this milestone is about authoring, not approval state.',
    relatedChapters: [],
    whyItMatters:
      'Playbook readiness is finalText-only. Without final text, presentation slides have no source.'
  },
  {
    id: 'export-bundle',
    title: 'Export final presentation bundle',
    daysBeforeFinal: 2,
    owner: 'Co-CEOs',
    dependency: 'final-playbook',
    definitionOfDone:
      'Use /export-center to copy the Final Presentation Bundle, the Final Presentation Coach prompt, and any chapter exports needed for slides / docs / design briefs.',
    relatedChapters: [],
    whyItMatters:
      'Exports are snapshots — re-export after final edits land so slides reflect the source of truth.'
  },
  {
    id: 'rehearsal',
    title: 'Rehearsal',
    daysBeforeFinal: 1,
    owner: 'Co-CEOs + chiefs',
    dependency: 'export-bundle',
    definitionOfDone:
      'Run the presentation end-to-end. Time each section. Check Phoenix Nest carry pitch language. Check the segment / pricing / campaign throughline.',
    relatedChapters: [],
    whyItMatters:
      'The first read-through is always rougher than expected. Rehearsal turns rough into shippable.'
  }
] as const

export function buildMilestoneBackplan(
  milestones: ProjectMilestones
): BackplanMilestone[] {
  const target = milestones.finalPresentationTargetDate
  if (!target) return []
  return TEMPLATE.map((m) => ({
    ...m,
    relatedChapters: [...m.relatedChapters],
    suggestedDate: addDaysIso(target, -m.daysBeforeFinal)
  }))
}

export function evaluateMilestoneStatus(
  milestone: BackplanMilestone,
  todayIso: string,
  hasOpenChapterIssues: (chapter: number) => boolean
): MilestoneStatus {
  if (milestone.suggestedDate > todayIso) return 'upcoming'
  if (milestone.suggestedDate === todayIso) return 'today'
  // Past suggested date. If we can prove the related chapters are
  // clean, suppress the alarm; otherwise mark as needs action.
  if (milestone.relatedChapters.length === 0) return 'past-clean'
  const incomplete = milestone.relatedChapters.some((c) => hasOpenChapterIssues(c))
  return incomplete ? 'past-needs-action' : 'past-clean'
}

// Returns the next N milestones relative to today. Includes any
// past-due milestones so the advisor card can flag what slipped.
// Order is preserved (earliest first within each group).
export function getNextMilestones(
  backplan: BackplanMilestone[],
  todayIso: string,
  count = 3
): BackplanMilestone[] {
  const upcoming = backplan.filter((m) => m.suggestedDate >= todayIso)
  if (upcoming.length >= count) return upcoming.slice(0, count)
  // Pad with the most recent past milestones so the card always shows
  // something useful even when most milestones are already past due.
  const past = backplan.filter((m) => m.suggestedDate < todayIso)
  const pad = past.slice(-(count - upcoming.length))
  return [...pad, ...upcoming]
}

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysUntil(iso: string, todayIsoStr: string): number {
  const a = parseIsoToUtcMs(iso)
  const b = parseIsoToUtcMs(todayIsoStr)
  if (a === null || b === null) return 0
  return Math.round((a - b) / 86_400_000)
}

// Pulls the chapter number out of a deliverable id like
// "ch-7-current-product-line" -> 7. Returns null when the id does not
// match the convention.
export function chapterNumberFromDeliverableId(id: string): number | null {
  const match = /^ch-(\d+)-/.exec(id)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) ? n : null
}

function addDaysIso(iso: string, days: number): string {
  const ms = parseIsoToUtcMs(iso)
  if (ms === null) return iso
  const dt = new Date(ms + days * 86_400_000)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoToUtcMs(iso: string): number | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return Date.UTC(y, m - 1, d)
}
