// Market Evidence Critique prompt template — Architectural
// Scaffolding sprint.
//
// This file is the V1 instance of the PromptTemplate interface and
// the only registered mode at sprint commit time. It replaces the
// prior server/utils/marketEvidenceCritiquePrompt.ts module (moved
// into this directory). The behavior is identical from a user-
// facing standpoint; the change is internal:
//
//   1. The system prompt is now built from BrandContext +
//      ProgramContext so future brands / programs reuse the same
//      coaching posture without re-authoring the literal string.
//   2. The user prompt builder takes the same payload shape as
//      before; nothing on the request side changed.
//   3. The validator is split out as `responseSchema` so the
//      registry can dispatch validation generically.
//
// Posture (do not relax):
//   - Coach, never approver. The system prompt enforces this.
//   - No invented numbers, prices, margins, sources, quotes, or
//     evidence. Existing rule preserved verbatim.
//   - Strict JSON output, schema-checked.
//   - The forbidden-terms list is read from ProgramContext at
//     request time. Adding a term to programContext.ts updates
//     the AI guardrail without touching this file.
//   - Brand-specific posture (Square as external POS) stays as a
//     literal posture rule in this template. POS posture is a
//     platform-level rule across every supported brand to date,
//     not a brand-identity field; if a future brand needed
//     different POS posture, it would graduate to a config field.

import type {
  AiCritiqueChapter8Context,
  AiCritiqueEvidenceLinkInput,
  AiCritiqueRequirementInput,
  AiCritiqueStructuredEvidenceInput,
  AiCritiqueUpstreamMarketEntry,
  MarketEvidenceCritiqueRequest,
  MarketEvidenceCritiqueResponse
} from '~~/app/types/aiCritique'
import type { MarketBuilderEntry } from '~~/app/types/models'
import type { BrandContext } from '~~/app/config/brandContext'
import type { ProgramContext } from '~~/app/config/programContext'
import type { PromptTemplate } from './index'

// Payload type alias — the V1 market-evidence payload IS the
// existing MarketEvidenceCritiqueRequest. Aliased here so the
// PromptTemplate generic stays clean.
export type MarketEvidenceCritiquePayload = MarketEvidenceCritiqueRequest
export type MarketEvidenceCritiqueResult = MarketEvidenceCritiqueResponse

const ALLOWED_RISK_LEVELS = new Set(['low', 'medium', 'high'])

// Hard ceiling on the assembled prompt size. ~4 chars/token; this
// targets the brief's "4000-token cap per request" budget.
const MAX_INPUT_CHARS = 16_000
const MAX_OUTPUT_TOKENS = 1500

function buildSystemPrompt(
  brand: BrandContext,
  program: ProgramContext
): string {
  const forbiddenList = program.forbiddenTerms
    .map((t) => `"${t}"`)
    .join(', ')
  const supportingBrands = brand.supportingBrands.length
    ? brand.supportingBrands.join(', ')
    : '(none)'
  return `You are a market evidence coach for ${program.name} ${program.programType} students working on the ${brand.parentCompany} Brand and Operations Playbook.

The flagship brand for this cohort is ${brand.name}. ${brand.mission}

Positioning: ${brand.positioning}

Supporting brands within ${brand.parentCompany}: ${supportingBrands}.

Coaching tone: ${program.audienceTone}. Reflect ${brand.voice}.

You are a coach, not an approver.
- Suggestions, not final answers.
- Student source notes are the source of truth.
- Do NOT invent numbers, prices, margins, sources, customer quotes, survey results, or feedback. If evidence is missing, ask for it.
- Do NOT approve, submit, grade, or decide for the team. Approval is a human role.
- Do NOT change pricing or break-even calculations. The student-entered numbers are correct as entered; you may critique whether the assumption behind a number is defensible, but you do not produce a different number.
- Treat estimates as estimates. Conservative / base / ambitious scenarios are how the team is taught to think — preserve that framing.

Project terminology you must follow:
- Use "Playbook", never "Bible".
- Use "Strategy and Growth", never "R&D".
- Do not use any of the deprecated terms: ${forbiddenList}.
- Square is the external POS — Renni Command Center is not a POS, do not coach toward POS features.

Your output MUST be a single JSON object. Do not wrap it in code fences. Do not add commentary outside the JSON. The schema is:

{
  "strengths": string[],
  "missingEvidence": string[],
  "weakAssumptions": string[],
  "consistencyChecks": string[],
  "questionsToAnswer": string[],
  "suggestedRevision": string,
  "nextValidationSteps": string[],
  "riskLevel": "low" | "medium" | "high"
}

Field guidance:
- "strengths": at most 5 short bullets naming what is concrete and well-supported. Empty array if nothing is yet strong.
- "missingEvidence": at most 5 short bullets naming evidence the team should add. Be specific (e.g., "vendor quote for Lumen wax cost", not "more evidence").
- "weakAssumptions": at most 5 short bullets naming assumptions the model output is leaning on. Quote the student's own number when possible.
- "consistencyChecks": short bullets where Chapter 7 demand, Chapter 8 revenue, or Chapter 11 carry pitch contradict each other or this section. Empty array if no upstream context was provided.
- "questionsToAnswer": short bullets framed as actual questions the student should ask before using this claim.
- "suggestedRevision": a short paragraph (3-6 sentences) showing how the section's draftText could read more honestly. Clearly written as a suggestion, not a finished Playbook entry. Do not invent numbers — refer to the student's own numbers verbatim.
- "nextValidationSteps": short, concrete actions: "intercept survey at lunch", "preorder test", "vendor confirmation email", etc.
- "riskLevel": single word — "low" if claims are well-evidenced, "medium" if assumptions are unverified but plausible, "high" if the section makes claims unsupported by any source the student has provided.

If the student has not yet authored any text or evidence for the section, return mostly empty arrays plus a "missingEvidence" entry asking for source notes first, "riskLevel": "high", and a suggestedRevision saying "Add source notes first — the coach cannot critique a blank section."`
}

interface SectionContext {
  deliverableId: string
  deliverableTitle: string
  chapterTitle: string
  sectionId: string
  sectionTitle: string
  sectionLesson: string | null
  requirements: AiCritiqueRequirementInput[]
  sourceNotes: string
  draftText: string
  finalText: string
  evidenceLinks: AiCritiqueEvidenceLinkInput[]
  structuredEvidence: AiCritiqueStructuredEvidenceInput[]
  marketBuilderEntries: MarketBuilderEntry[]
  upstreamCh7MarketEntries: AiCritiqueUpstreamMarketEntry[]
  upstreamCh8Context: AiCritiqueChapter8Context | null
}

function pickSectionContext(req: MarketEvidenceCritiqueRequest): SectionContext {
  return {
    deliverableId: req.deliverableId,
    deliverableTitle: req.deliverableTitle,
    chapterTitle: req.chapterTitle,
    sectionId: req.sectionId,
    sectionTitle: req.sectionTitle,
    sectionLesson: req.sectionLesson?.trim() || null,
    requirements: req.requirements,
    sourceNotes: req.sourceNotes ?? '',
    draftText: req.draftText ?? '',
    finalText: req.finalText ?? '',
    evidenceLinks: req.evidenceLinks ?? [],
    structuredEvidence: req.structuredEvidence ?? [],
    marketBuilderEntries: req.marketBuilderEntries ?? [],
    upstreamCh7MarketEntries: req.upstreamCh7MarketEntries ?? [],
    upstreamCh8Context: req.upstreamCh8Context ?? null
  }
}

function buildUserPrompt(
  payload: MarketEvidenceCritiqueRequest,
  brand: BrandContext,
  _program: ProgramContext
): string {
  // _program is reserved for future program-specific framing if a
  // mode needs it. The current critique builds context off the
  // brand's parentCompany so the user prompt stays consistent with
  // what the system prompt established.
  const ctx = pickSectionContext(payload)

  const productList = brand.productSet.length
    ? brand.productSet.join(', ')
    : '(no canonical product list provided)'

  const data = {
    deliverable: {
      id: ctx.deliverableId,
      title: ctx.deliverableTitle,
      chapter: ctx.chapterTitle
    },
    section: {
      id: ctx.sectionId,
      title: ctx.sectionTitle,
      lesson: ctx.sectionLesson
    },
    brandContext: {
      // Compact form — only the fields the model needs for grounding.
      // The system prompt has the full identity / mission / voice;
      // here we just remind it of the canonical product list so it
      // can flag off-brand evidence drift.
      name: brand.name,
      productSet: productList,
      retailContext: brand.retailContext,
      primaryMarketContext: brand.primaryMarketContext
    },
    requirements: ctx.requirements,
    studentAuthoredText: {
      sourceNotes: ctx.sourceNotes,
      draftText: ctx.draftText,
      finalText: ctx.finalText
    },
    evidenceLinks: ctx.evidenceLinks,
    structuredEvidence: ctx.structuredEvidence,
    marketBuilderEntries: ctx.marketBuilderEntries,
    upstreamCh7MarketEntries: ctx.upstreamCh7MarketEntries,
    upstreamCh8Context: ctx.upstreamCh8Context
  }

  return `Critique the following ${brand.parentCompany} Playbook section. Respond with the JSON schema described in the system prompt and nothing else.

INPUT:
${JSON.stringify(data, null, 2)}`
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`AI response field "${field}" must be an array.`)
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`AI response field "${field}[${i}]" must be a string.`)
    }
  }
  return value as string[]
}

function validateResponse(raw: unknown): MarketEvidenceCritiqueResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response was not a JSON object.')
  }
  const obj = raw as Record<string, unknown>

  const strengths = requireStringArray(obj.strengths, 'strengths')
  const missingEvidence = requireStringArray(
    obj.missingEvidence,
    'missingEvidence'
  )
  const weakAssumptions = requireStringArray(
    obj.weakAssumptions,
    'weakAssumptions'
  )
  const consistencyChecks = requireStringArray(
    obj.consistencyChecks,
    'consistencyChecks'
  )
  const questionsToAnswer = requireStringArray(
    obj.questionsToAnswer,
    'questionsToAnswer'
  )
  const nextValidationSteps = requireStringArray(
    obj.nextValidationSteps,
    'nextValidationSteps'
  )

  if (typeof obj.suggestedRevision !== 'string') {
    throw new Error('AI response field "suggestedRevision" must be a string.')
  }
  const suggestedRevision = obj.suggestedRevision as string

  const riskRaw = typeof obj.riskLevel === 'string' ? obj.riskLevel : ''
  if (!ALLOWED_RISK_LEVELS.has(riskRaw)) {
    throw new Error(
      `AI returned unexpected riskLevel: ${riskRaw || '(missing)'}.`
    )
  }

  return {
    strengths,
    missingEvidence,
    weakAssumptions,
    consistencyChecks,
    questionsToAnswer,
    suggestedRevision,
    nextValidationSteps,
    riskLevel: riskRaw as MarketEvidenceCritiqueResponse['riskLevel']
  }
}

export const marketEvidenceCritiqueTemplate: PromptTemplate<
  MarketEvidenceCritiquePayload,
  MarketEvidenceCritiqueResult
> = {
  mode: 'market-evidence-critique',
  systemPrompt: buildSystemPrompt,
  userPromptBuilder: buildUserPrompt,
  responseSchema: validateResponse,
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
