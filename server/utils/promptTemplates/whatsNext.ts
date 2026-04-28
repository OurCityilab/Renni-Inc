// Executive Advisor — Mode 2: What Should I Do Next?
//
// Single-card mode. The chief asks "what's the one thing I should
// do next?" and the model picks the highest-leverage action from
// the executive context package, scoped to the requesting user's
// role. Companion fields explain why and what success looks like.
//
// Posture (do not relax in V1):
//   - Coach, never approver. The shared system prompt in
//     executiveAdvisorShared.ts encodes the behavior contract.
//   - Single ActionCard output. The validator coerces to
//     confidence='low' if sourceIds is empty.
//   - Output is JSON-only, schema-checked.

import type { BrandContext } from '~~/app/config/brandContext'
import type { ProgramContext } from '~~/app/config/programContext'
import type { ExecutiveContextPackage } from '~~/server/utils/executiveContext'
import type { PromptTemplate } from './index'
import {
  EXECUTIVE_ADVISOR_TEMPLATE_VERSION,
  buildExecutiveAdvisorSystemPrompt,
  serializeContextForPrompt
} from './executiveAdvisorShared'
import {
  buildDueDateMapFromDeliverables,
  validateActionCard,
  type ActionCard,
  type ActionCardValidationContext,
  type SourceIds
} from '~~/server/utils/executiveAdvisor/actionCard'

const TEMPLATE_VERSION = EXECUTIVE_ADVISOR_TEMPLATE_VERSION
const MAX_INPUT_CHARS = 18_000
const MAX_OUTPUT_TOKENS = 1500

export interface WhatsNextResult {
  recommendedAction: ActionCard
  whyItMatters: string
  whatSuccessLooksLike: string
  sourceIds: SourceIds
  templateVersion: typeof TEMPLATE_VERSION
}

export interface WhatsNextPayload {
  context: ExecutiveContextPackage
}

function buildSystem(brand: BrandContext, program: ProgramContext): string {
  return buildExecutiveAdvisorSystemPrompt(brand, program)
}

function buildUser(
  payload: WhatsNextPayload,
  _brand: BrandContext,
  _program: ProgramContext
): string {
  return `Mode: whats-next.

You are answering a chief who asks "what is the one thing I should do next?" Use the executive context package below, scoped to this requester's role (see context.viewer). Pick ONE recommended action and return:

{
  "recommendedAction": ActionCard,
  "whyItMatters": string,           // 1-2 sentences
  "whatSuccessLooksLike": string,   // 1-2 sentences naming the observable outcome
  "sourceIds": SourceIds,           // top-level grounding for the recommendation
  "templateVersion": "${TEMPLATE_VERSION}"
}

ActionCard schema (same as Daily Command Brief):
{
  "actionId": string,
  "title": string,
  "ownerRole": "co_ceo" | "coo" | "cfo" | "cmo" | "chief_strategy_growth" | "member" | "admin",
  "suggestedAssigneeName"?: string,
  "suggestedAssigneeUid"?: string,
  "dueDateSuggestion"?: string,     // yyyy-mm-dd; never later than the linked deliverable's due date when present
  "dependency": string,
  "definitionOfDone": string,
  "playbookChapter"?: string,
  "whyThisMatters": string,
  "sourceType": "observation" | "risk" | "gap" | "opportunity",
  "sourceIds": SourceIds,
  "confidence": "low" | "medium" | "high",
  "humanReviewRequired": true
}

Requirements:
- Pick the single highest-leverage action for the requester's role from the package. Prefer items that unblock other people (blocked tasks; needs_revision deliverables awaiting THIS chief; in_review awaiting THIS chief's approval).
- Anchor in source IDs. If you cannot anchor, set confidence='low' but still return a card.
- whyItMatters must speak to project outcomes (final presentation / TechTown pop-up / Phoenix Nest pitch), not generic productivity language.
- whatSuccessLooksLike names a concrete observable outcome (a saved doc, an approved deliverable, a logged decision).
- humanReviewRequired must be true.

EXECUTIVE CONTEXT PACKAGE:
${serializeContextForPrompt(payload.context)}`
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`response.${field} must be a string`)
  }
  return value
}

function asSourceIds(value: unknown, field: string): SourceIds {
  if (!value || typeof value !== 'object') {
    throw new Error(`response.${field} must be an object`)
  }
  const obj = value as Record<string, unknown>
  const out: SourceIds = {}
  const keys: Array<keyof SourceIds> = [
    'taskIds',
    'deliverableIds',
    'sectionIds',
    'requirementIds',
    'advisorSignalIds'
  ]
  for (const k of keys) {
    if (obj[k] === undefined) continue
    if (!Array.isArray(obj[k])) {
      throw new Error(`response.${field}.${k} must be an array of strings`)
    }
    for (const v of obj[k] as unknown[]) {
      if (typeof v !== 'string') {
        throw new Error(`response.${field}.${k} must contain only strings`)
      }
    }
    out[k] = obj[k] as string[]
  }
  return out
}

function buildValidator(
  ctx: ActionCardValidationContext
): (raw: unknown) => WhatsNextResult {
  return (raw: unknown): WhatsNextResult => {
    if (!raw || typeof raw !== 'object') {
      throw new Error('AI response was not a JSON object.')
    }
    const obj = raw as Record<string, unknown>
    const recommendedAction = validateActionCard(obj.recommendedAction, ctx)
    return {
      recommendedAction,
      whyItMatters: asString(obj.whyItMatters, 'whyItMatters'),
      whatSuccessLooksLike: asString(obj.whatSuccessLooksLike, 'whatSuccessLooksLike'),
      sourceIds: asSourceIds(obj.sourceIds, 'sourceIds'),
      templateVersion: TEMPLATE_VERSION
    }
  }
}

export function buildWhatsNextTemplate(
  payload: WhatsNextPayload
): PromptTemplate<WhatsNextPayload, WhatsNextResult> {
  const validationCtx: ActionCardValidationContext = {
    deliverableDueDates: buildDueDateMapFromDeliverables(payload.context.deliverables)
  }
  return {
    mode: 'whats-next',
    templateVersion: TEMPLATE_VERSION,
    systemPrompt: buildSystem,
    userPromptBuilder: buildUser,
    responseSchema: buildValidator(validationCtx),
    maxInputChars: MAX_INPUT_CHARS,
    maxOutputTokens: MAX_OUTPUT_TOKENS
  }
}

export const whatsNextTemplate: PromptTemplate<
  WhatsNextPayload,
  WhatsNextResult
> = {
  mode: 'whats-next',
  templateVersion: TEMPLATE_VERSION,
  systemPrompt: buildSystem,
  userPromptBuilder: buildUser,
  responseSchema: () => {
    throw new Error(
      'whatsNextTemplate.responseSchema cannot be called on the static instance. ' +
        'Construct a request-bound template via buildWhatsNextTemplate.'
    )
  },
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
