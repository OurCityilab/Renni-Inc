// Server-only prompt builder for the Market Evidence AI Critique V1.
// The system prompt fixes the coaching posture; the user prompt carries
// the section-scoped payload as a JSON block plus a clear instruction
// to respond with the schema we render.
//
// The model is shown only the active section plus the cross-chapter
// context the student already sees on screen. Nothing about other
// deliverables, other students, or auth state is leaked here. The
// caller (the endpoint) is responsible for assembling that scoped
// payload before this builder runs.

import type {
  AiCritiqueChapter8Context,
  AiCritiqueEvidenceLinkInput,
  AiCritiqueRequirementInput,
  AiCritiqueStructuredEvidenceInput,
  AiCritiqueUpstreamMarketEntry,
  MarketEvidenceCritiqueRequest
} from '~~/app/types/aiCritique'
import type { MarketBuilderEntry } from '~~/app/types/models'

export interface MarketEvidenceCritiquePrompt {
  system: string
  user: string
}

const SYSTEM_PROMPT = `You are a market evidence coach for Renaissance High School students working on the Renni Inc. Brand and Operations Playbook.

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
- Do not use "JRLA", "CDO", or "Renni Enterprises".
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

export function buildMarketEvidenceCritiquePrompt(
  req: MarketEvidenceCritiqueRequest
): MarketEvidenceCritiquePrompt {
  const ctx = pickSectionContext(req)

  // We hand the model a single JSON block as the user message. JSON is
  // less ambiguous than free text for structured input, and it makes
  // size limits and field naming easy to enforce.
  const payload = {
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

  const user = `Critique the following Renni Inc. Playbook section. Respond with the JSON schema described in the system prompt and nothing else.

INPUT:
${JSON.stringify(payload, null, 2)}`

  return { system: SYSTEM_PROMPT, user }
}
