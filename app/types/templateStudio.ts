// Template Studio metadata — curriculum content shipped with the app,
// not stored in Firestore. A studio turns a deliverable's template into
// an interactive workspace that teaches the concept, guides decisions,
// captures required evidence, and links requirements to tasks.
//
// Intentionally separate from Firestore storage so instructors can
// iterate on pedagogy in source control while student output (notes,
// tasks, approvals) stays in Firestore as the source of truth.

import type { Department } from './models'

export type ConnectedOutcome =
  | 'TechTown pop-up'
  | 'Playbook'
  | 'Phoenix Nest pitch'

export interface TemplateStudioSection {
  // Stable, unique-per-studio identifier used as the persistence key for
  // student-authored output (notes / draft / final / evidence). Section
  // titles change as curriculum is refined; ids must not.
  id: string
  title: string
  lesson: string
  example?: string
  studentPrompts: string[]
  requiredInputs?: string[]
  completionCriteria?: string[]
  // Structured Evidence Standard V1 — optional per-section guidance shown
  // next to the structured-evidence editor in the Output Workspace.
  // Authors can leave them blank; the editor falls back to generic copy.
  evidencePrompt?: string
  analysisPrompt?: string
  sourceGuidance?: string[]
}

export interface TemplateStudioRequirement {
  id: string
  label: string
  description: string
  requiredForApproval: boolean
  department?: Department | null
  playbookChapter?: number | null
  evidenceType?: string
  suggestedTaskTitle?: string
  definitionOfDone?: string
}

export interface TemplateStudioTask {
  title: string
  department?: Department | null
  ownerRole?: string
  requirementId?: string
  dependency?: string
  definitionOfDone?: string
  dueOffsetDays?: number
}

export interface TemplateStudioEvidence {
  id: string
  label: string
  description: string
  required: boolean
}

export interface TemplateStudioAiGuidance {
  allowedHelp: string[]
  disallowedHelp: string[]
  studentMustProvideSourceNotes: boolean
  approvalGuardrail: string
}

export interface TemplateStudio {
  title: string
  purpose: string
  learningObjective: string
  whyItMatters: string
  finalOutput: string
  connectedOutcome: ConnectedOutcome
  sections: TemplateStudioSection[]
  requirements: TemplateStudioRequirement[]
  suggestedTasks: TemplateStudioTask[]
  requiredEvidence: TemplateStudioEvidence[]
  aiGuidance?: TemplateStudioAiGuidance
  version?: string
}
