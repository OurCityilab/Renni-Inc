// Shared types for the Market Evidence AI Critique V1.
//
// V1 is a server-backed, transient, section-level coach. The request
// payload carries only what the model needs to critique one section;
// the response is a fixed structured shape the panel renders directly.
// Nothing here is persisted to Firestore.

import type {
  EvidenceConfidence,
  MarketBuilderEntry
} from './models'

export type AiCritiqueRiskLevel = 'low' | 'medium' | 'high'

// Compact source-of-truth view of a single evidence link sent to the
// model. Keeps the URL and the human label so the model can quote the
// label, but never invents a source.
export interface AiCritiqueEvidenceLinkInput {
  label: string
  url: string
  type: string
  requirementId?: string | null
}

// Compact view of a single structured-evidence entry. We send the
// student's literal text — claim, evidence, source, etc. — without any
// reformatting so the model is critiquing what the student wrote.
export interface AiCritiqueStructuredEvidenceInput {
  claim: string
  evidence: string
  source: string
  assumption?: string | null
  calculation?: string | null
  confidence?: EvidenceConfidence | null
  risk?: string | null
  nextValidation?: string | null
}

// Compact upstream context used when critiquing Chapter 8 or Chapter
// 11 — mirrors the cross-chapter reference panels so the model sees
// the same Chapter 7 demand entries the student does. Reuses
// MarketBuilderEntry so we don't duplicate the schema.
export interface AiCritiqueUpstreamMarketEntry {
  sectionId: string
  sectionTitle: string
  entry: MarketBuilderEntry
}

export interface AiCritiqueChapter8Context {
  // Section ids whose finalText is non-empty. Lets the model say
  // "Chapter 8 has finalized revenue scenarios but not pricing yet"
  // without us shipping the full text of every section.
  finalSectionIds: string[]
  // Length-capped excerpt of the revenue-scenarios finalText, only
  // present when the student has authored revenue scenarios. Plain
  // text — no formatting beyond what the student typed.
  revenueScenariosExcerpt?: string | null
}

// Section-level requirement view. The model sees only requirements
// that belong to this deliverable's studio so the critique stays
// scoped — no other chapter's requirements leak in.
export interface AiCritiqueRequirementInput {
  id: string
  label: string
  description: string
  requiredForApproval: boolean
}

export interface MarketEvidenceCritiqueRequest {
  // Identity of the deliverable + section the critique is about.
  // Used in the prompt to remind the model what chapter it's coaching.
  deliverableId: string
  deliverableTitle: string
  chapterTitle: string
  sectionId: string
  sectionTitle: string
  sectionLesson?: string

  // Studio requirements relevant to the section. Keep the list short —
  // a section's own requirements plus any explicitly linked to its
  // entries are enough.
  requirements: AiCritiqueRequirementInput[]

  // The student's literal authored text for this section. Source of
  // truth — the model is critiquing this text, not its own
  // interpretation.
  sourceNotes: string
  draftText: string
  finalText: string

  // Already-attached evidence + structured evidence + market builder
  // entries for the section.
  evidenceLinks: AiCritiqueEvidenceLinkInput[]
  structuredEvidence: AiCritiqueStructuredEvidenceInput[]
  marketBuilderEntries: MarketBuilderEntry[]

  // Cross-chapter context. Both default to undefined so the model
  // never sees Chapter 7 / Chapter 8 data unless the active chapter
  // actually depends on it.
  upstreamCh7MarketEntries?: AiCritiqueUpstreamMarketEntry[]
  upstreamCh8Context?: AiCritiqueChapter8Context
}

export interface MarketEvidenceCritiqueResponse {
  strengths: string[]
  missingEvidence: string[]
  weakAssumptions: string[]
  consistencyChecks: string[]
  questionsToAnswer: string[]
  // Suggested rewrite — explicitly not final text. The UI labels it as
  // a suggestion and never copies it into draft/final automatically.
  suggestedRevision: string
  nextValidationSteps: string[]
  riskLevel: AiCritiqueRiskLevel
}

// Error shape the endpoint returns when the provider is missing,
// misconfigured, or the input is invalid. The panel reads `code` to
// pick a user-facing message.
export type MarketEvidenceCritiqueErrorCode =
  | 'ai_disabled'
  | 'ai_invalid_request'
  | 'ai_payload_too_large'
  | 'ai_provider_error'
  | 'ai_invalid_response'

export interface MarketEvidenceCritiqueError {
  code: MarketEvidenceCritiqueErrorCode
  message: string
}
