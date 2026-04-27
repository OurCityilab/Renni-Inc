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
  // Market Builder visibility metadata. Market Builder defaults to OFF
  // for any section that doesn't opt in — the editor block was rendering
  // unconditionally before this flag landed, which made it appear in
  // every chapter regardless of whether market sizing was relevant.
  // Sections explicitly enable it and may attach a short coaching line
  // shown above the editor.
  marketBuilder?: {
    enabled: boolean
    guidance?: string
  }
  // Market Fit Builder visibility metadata. Same opt-in pattern as
  // marketBuilder: sections that don't set it default to off so the
  // tool only appears in market/product-fit-relevant sections (Ch 7,
  // 8, 10, 11). Independent of marketBuilder so a section can have
  // one without the other.
  marketFit?: {
    enabled: boolean
    guidance?: string
  }
  // Brand Fit Builder visibility metadata. Same opt-in pattern again:
  // sections default to off so the tool only appears in identity-
  // relevant sections (House Phoenix Brand Story, Supporting Brand
  // Sheets, Pop-up Campaign audience/messaging). Independent of
  // marketFit and marketBuilder.
  brandFit?: {
    enabled: boolean
    guidance?: string
  }
  // Pricing Strategy Builder visibility metadata. Opt-in: sections
  // default to off so the tool only appears in pricing-relevant
  // sections. V1 enables this only on Ch. 8 Section 2 (sale-price).
  // Independent of every other builder.
  pricingStrategy?: {
    enabled: boolean
    guidance?: string
  }
  // Expert Chapter Guidance (Sprint — Expert Guidance). Optional
  // additive metadata that lifts a section from "static template"
  // to "guided by a field expert." Curriculum content only — no
  // Firestore impact, no submit gate, no Playbook readiness change.
  // Renders via ExpertGuidanceCard inside the section workspace
  // alongside the existing SectionGuidanceSummary.
  expertGuidance?: ExpertGuidance
}

export interface ExpertGuidance {
  // Who would normally critique this section in a real company.
  // Pure copy ("retail operator", "CFO", "brand strategist"); no
  // role enum so studios stay flexible.
  expertRole?: string
  // Plain-English why-this-matters paragraph from the expert's
  // perspective. Different from section.lesson — that explains
  // what to do; this explains why a real company would care.
  whyThisMatters?: string
  // Concrete inputs / facts a student should collect before they
  // can write a strong answer.
  whatToGather?: string[]
  // Where to look for those inputs (existing app surfaces, vendor
  // docs, real-world sources). Avoids "go research" hand-waving.
  whereToFindIt?: string[]
  // What a generic / shallow answer would look like.
  weakAnswerLooksLike?: string
  // What a defensible / strong answer would prove.
  strongAnswerLooksLike?: string
  // 1–4 questions an expert would ask if the team handed this
  // section to them today.
  expertPushback?: string[]
  // Mistakes the curriculum has seen across cohorts.
  commonMistakes?: string[]
  // The downstream decision this section actually supports.
  decisionSupported?: string
  // Other chapters / surfaces this section feeds.
  connectsTo?: string[]
  // Free-form hint about which chief should drive the work.
  // Display-only; never overrides ownership semantics elsewhere.
  ownerHint?: string
  // What the section reads like when it is genuinely complete —
  // not just submit-eligible.
  doneLooksLike?: string
  // Optional copy-only LLM prompt students can paste into Claude /
  // ChatGPT. Renni Command Center never sends this anywhere.
  // When omitted the card auto-builds one from the other fields.
  aiCoachPrompt?: string
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
  // Optional explicit pointer to the section a task created from this
  // requirement should deep-link to. When unset, the deep-link helper
  // (utils/requirementToSection.ts) falls back to a tokenized
  // overlap heuristic across the studio's sections. Setting this is
  // a low-risk override for cases where the heuristic chooses a
  // related-but-not-quite-right section.
  sectionId?: string
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
