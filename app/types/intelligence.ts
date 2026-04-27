// Intelligence Sync types — pure display-only "what to gather next"
// guidance layered on top of existing data. Pure read; never persists,
// never calls AI, never gates submit, never affects Playbook readiness.
//
// Naming convention: severity / owner strings deliberately match the
// student-friendly advisor display labels so a chief who learns one
// surface understands the other.

import type { AdvisorRole } from './advisor'

export type IntelligenceSyncSeverity =
  | 'ready' // no issue
  | 'check-soon'
  | 'needs-action'
  | 'stops-submit'

export type IntelligenceSyncSource =
  | 'segment'
  | 'pricing'
  | 'campaign'
  | 'phoenix-nest'
  | 'presentation'
  | 'advisor'

export interface IntelligenceSyncIssue {
  id: string
  severity: IntelligenceSyncSeverity
  title: string
  summary: string
  // Concrete list of fields / data the team needs to gather. The
  // panel renders these as a checklist so a chief knows exactly
  // what to enter where.
  whatToGather: string[]
  // One-sentence "why does this matter for the final presentation."
  whyItMatters: string
  owner: AdvisorRole
  helpFrom?: AdvisorRole[]
  // Single concrete next action — one sentence.
  nextAction: string
  // What "done" looks like in plain English.
  doneLooksLike: string
  // Optional pointer back into the app.
  chapterId?: string
  sectionId?: string
  route?: string
  source: IntelligenceSyncSource
  // Copy-only LLM prompt the student can paste into Claude / ChatGPT
  // externally. Renni Command Center never sends this anywhere.
  // Always present so the panel can render the same shape per issue.
  aiCoachPrompt: string
}
