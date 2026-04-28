// Executive Advisor — Mode 4: Assign the Work.
//
// The chief asks "what work needs to be assigned, and to whom?" The
// model returns a small set of action cards (typically 3-7) with
// owner roles, suggested assignees from the roster, due-date
// suggestions, and grounding source IDs. Cards are SUGGESTIONS —
// Track 4A produces no writes. Pass 2 will wire a "Create task"
// flow from these cards behind explicit chief confirmation.
//
// Posture (do not relax in V1):
//   - No writes. ActionCards are reviewable suggestions only.
//   - The validator forces confidence='low' on any card without
//     grounded sourceIds.
//   - Due-date suggestions are clamped to the linked deliverable's
//     due date when later (Track 4A Task 9 guardrail).
//   - humanReviewRequired is always true.

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
  validateActionCardArray,
  type ActionCard,
  type ActionCardValidationContext
} from '~~/server/utils/executiveAdvisor/actionCard'

const TEMPLATE_VERSION = EXECUTIVE_ADVISOR_TEMPLATE_VERSION
const MAX_INPUT_CHARS = 18_000
const MAX_OUTPUT_TOKENS = 2400
const MAX_FOCUS_LEN = 240

export interface AssignTheWorkResult {
  suggestedActions: ActionCard[]
  templateVersion: typeof TEMPLATE_VERSION
}

export interface AssignTheWorkPayload {
  context: ExecutiveContextPackage
  /** Optional focus scope — a chapter, role, or specific
   *  deliverable to narrow the suggestions to. Free text; the
   *  endpoint length-caps + safety-scans before this lands here. */
  focus?: string
}

function buildSystem(brand: BrandContext, program: ProgramContext): string {
  return buildExecutiveAdvisorSystemPrompt(brand, program)
}

function buildUser(
  payload: AssignTheWorkPayload,
  _brand: BrandContext,
  _program: ProgramContext
): string {
  const focusText = (() => {
    if (!payload.focus) return '(no focus specified — scan the whole package)'
    const trimmed = payload.focus.trim()
    if (!trimmed) return '(no focus specified — scan the whole package)'
    return trimmed.length > MAX_FOCUS_LEN
      ? `${trimmed.slice(0, MAX_FOCUS_LEN - 1)}…`
      : trimmed
  })()

  return `Mode: assign-the-work.

You are answering a chief who asks "what work do I need to assign right now, and to whom?"

FOCUS: ${focusText}

Return:

{
  "suggestedActions": ActionCard[],   // 3-7 cards. Empty array allowed only if the package is empty.
  "templateVersion": "${TEMPLATE_VERSION}"
}

ActionCard schema (same as the other modes):
{
  "actionId": string,
  "title": string,
  "ownerRole": "co_ceo" | "coo" | "cfo" | "cmo" | "chief_strategy_growth" | "member" | "admin",
  "suggestedAssigneeName"?: string,
  "suggestedAssigneeUid"?: string,
  "dueDateSuggestion"?: string,       // yyyy-mm-dd; never later than the linked deliverable's due date when present
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
- Each suggested action MUST be grounded in source IDs from the package. If you cannot anchor a card, set confidence='low' and include the card anyway — the chief sees ungrounded cards explicitly.
- ownerRole must be one of the listed values. When you suggest a specific assignee, populate suggestedAssigneeName and (when present in the package's tasks/deliverables) suggestedAssigneeUid.
- Due dates must not exceed the linked deliverable's due date if that deliverable id is in sourceIds.deliverableIds. If you cannot tell, omit dueDateSuggestion.
- The package's "viewer" describes the requesting chief. When a FOCUS is specified, scope your suggestions to that focus; otherwise scan the whole package and prioritize the highest-leverage moves.
- Do NOT generate cards that change deliverable due dates, mutate statuses, or send messages. Action cards represent task creation suggestions only.
- humanReviewRequired must be true on every action card.

EXECUTIVE CONTEXT PACKAGE:
${serializeContextForPrompt(payload.context)}`
}

function buildValidator(
  ctx: ActionCardValidationContext
): (raw: unknown) => AssignTheWorkResult {
  return (raw: unknown): AssignTheWorkResult => {
    if (!raw || typeof raw !== 'object') {
      throw new Error('AI response was not a JSON object.')
    }
    const obj = raw as Record<string, unknown>
    const suggestedActions = validateActionCardArray(
      obj.suggestedActions,
      'suggestedActions',
      ctx
    )
    return {
      suggestedActions,
      templateVersion: TEMPLATE_VERSION
    }
  }
}

export function buildAssignTheWorkTemplate(
  payload: AssignTheWorkPayload
): PromptTemplate<AssignTheWorkPayload, AssignTheWorkResult> {
  const validationCtx: ActionCardValidationContext = {
    deliverableDueDates: buildDueDateMapFromDeliverables(payload.context.deliverables)
  }
  return {
    mode: 'assign-the-work',
    templateVersion: TEMPLATE_VERSION,
    systemPrompt: buildSystem,
    userPromptBuilder: buildUser,
    responseSchema: buildValidator(validationCtx),
    maxInputChars: MAX_INPUT_CHARS,
    maxOutputTokens: MAX_OUTPUT_TOKENS
  }
}

export const assignTheWorkTemplate: PromptTemplate<
  AssignTheWorkPayload,
  AssignTheWorkResult
> = {
  mode: 'assign-the-work',
  templateVersion: TEMPLATE_VERSION,
  systemPrompt: buildSystem,
  userPromptBuilder: buildUser,
  responseSchema: () => {
    throw new Error(
      'assignTheWorkTemplate.responseSchema cannot be called on the static instance. ' +
        'Construct a request-bound template via buildAssignTheWorkTemplate.'
    )
  },
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
