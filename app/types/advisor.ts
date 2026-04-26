// C-Suite Advisor V1 — types for deterministic operating signals.
//
// Posture (do not relax in V1):
//   - read-only / advisory only — never persisted, never mutates state
//   - no AI: every signal is produced by a pure deterministic rule
//     against existing deliverable / studio / task / output data
//   - never gates submit, never affects Playbook readiness
//   - never approves, submits, or assigns work; "suggested task" is
//     a copy-only block the chief can act on manually
//
// Naming convention: AdvisorRole strings exactly match how the
// Renaissance leadership structure is named in copy throughout the
// app (Co-CEOs / COO / CFO / CMO / Chief Strategy and Growth
// Officer / Instructor/Admin), so an advisor signal can be rendered
// without needing a label-translation step.

export type AdvisorSignalSeverity = 'info' | 'watch' | 'risk' | 'blocker'

export type AdvisorRole =
  | 'Co-CEOs'
  | 'COO'
  | 'CFO'
  | 'CMO'
  | 'Chief Strategy and Growth Officer'
  | 'Instructor/Admin'

export type AdvisorScope = 'chapter' | 'section' | 'department' | 'dashboard'

export type AdvisorSource =
  | 'requirements'
  | 'tasks'
  | 'outputs'
  | 'pricing'
  | 'marketFit'
  | 'segments'
  | 'approval'
  | 'dueDate'

export type AdvisorTaskCoverageStatus =
  | 'covered'
  | 'missing'
  | 'blocked'
  | 'overdue'
  | 'needs-owner'

export interface AdvisorTaskCoverage {
  status: AdvisorTaskCoverageStatus
  relatedRequirementId?: string
  relatedTaskId?: string
}

// Suggested-task block. Display-only — V1 does not provide a "Create
// task" button. The chief copies the title/owner/dependency/etc. and
// creates the task manually through the existing task-creation flow.
export interface AdvisorSuggestedTask {
  title: string
  owner: AdvisorRole
  // Coarse due-date language. The advisor never picks a specific
  // calendar date — that's the chief's call.
  dueDate: 'Next' | 'Same pass' | 'After smoke test'
  dependency?: string
  definitionOfDone: string
  playbookChapter?: string
}

export interface AdvisorSignal {
  id: string
  scope: AdvisorScope
  severity: AdvisorSignalSeverity
  title: string
  summary: string
  // What's missing in concrete language. Optional because some
  // info-level signals are observations rather than gaps (e.g.
  // "Approved — monitoring only").
  gap?: string
  owner: AdvisorRole
  supportingRoles?: AdvisorRole[]
  // Free-text dependency, e.g. "Comps before defending premium price".
  dependency?: string
  // Optional ordered process steps the advisor wants the chief to
  // see — usually 2–4 items, never the full chapter sequence.
  processOrder?: string[]
  taskCoverage?: AdvisorTaskCoverage
  // The single concrete next action — what the chief should push
  // today. Always present, always one sentence.
  nextAction: string
  suggestedTask?: AdvisorSuggestedTask
  chapterId?: string
  sectionId?: string
  source: AdvisorSource
}
