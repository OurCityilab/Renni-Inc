// Executive Advisor — Mode 3: Run the Meeting.
//
// Prepares a 10-minute leadership stand-up agenda from the executive
// context package. Output names speakers, decisions, and follow-up
// action cards. The action cards are SUGGESTIONS only — Track 4A
// produces no writes; chiefs review and decide whether to act.
//
// Posture (do not relax in V1):
//   - No writes. Action cards are reviewable. Task creation flow
//     (Mode 4 / Pass 2) is still gated on explicit chief confirmation.
//   - System prompt forbids personal characterization. Speaker
//     rationales describe operational context only.

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
const MAX_OUTPUT_TOKENS = 2200

export interface RunTheMeetingAgendaItem {
  /** Minute mark inside the 10-minute meeting. Typical values: 0, 2, 5, 7, 9. */
  minute: number
  topic: string
  /** Free text — typically a role label or "Role + Name". */
  speaker: string
  decisionsNeeded: string[]
}

export interface RunTheMeetingSpeakingOrderEntry {
  role: string
  name?: string
  rationale: string
}

export interface RunTheMeetingResult {
  agendaItems: RunTheMeetingAgendaItem[]
  speakingOrder: RunTheMeetingSpeakingOrderEntry[]
  followUpActions: ActionCard[]
  templateVersion: typeof TEMPLATE_VERSION
}

export interface RunTheMeetingPayload {
  context: ExecutiveContextPackage
}

function buildSystem(brand: BrandContext, program: ProgramContext): string {
  return buildExecutiveAdvisorSystemPrompt(brand, program)
}

function buildUser(
  payload: RunTheMeetingPayload,
  _brand: BrandContext,
  _program: ProgramContext
): string {
  return `Mode: run-the-meeting.

You are preparing a 10-minute leadership stand-up agenda from the executive context package. Return:

{
  "agendaItems": [                  // 3-5 items covering the 10 minutes
    {
      "minute": number,             // 0, 2, 5, 7, 9 are typical
      "topic": string,              // <= 80 chars
      "speaker": string,            // role label, optionally followed by name
      "decisionsNeeded": string[]   // 0-3 short questions the chief wants resolved
    }
  ],
  "speakingOrder": [                // 3-6 entries; explains who speaks first and why
    {
      "role": string,
      "name"?: string,
      "rationale": string           // operational context, NEVER character judgment
    }
  ],
  "followUpActions": ActionCard[],  // 0-5 cards proposed from the meeting; review-only
  "templateVersion": "${TEMPLATE_VERSION}"
}

ActionCard schema (same as Daily Command Brief / What's Next):
{
  "actionId": string,
  "title": string,
  "ownerRole": "co_ceo" | "coo" | "cfo" | "cmo" | "chief_strategy_growth" | "member" | "admin",
  "suggestedAssigneeName"?: string,
  "suggestedAssigneeUid"?: string,
  "dueDateSuggestion"?: string,
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
- This mode produces NO writes. followUpActions are review-only suggestions; nothing is created until a chief explicitly chooses to act on them via the Assign the Work flow.
- Speaking order rationales must describe WORK STATE, not character. ACCEPTABLE: "CFO speaks first because Ch. 8 pricing has no comp evidence yet and the team is waiting on that decision." UNACCEPTABLE: "CFO is most prepared."
- Anchor every followUpAction card in source IDs. Cards without grounding are coerced to confidence='low' by the validator.
- humanReviewRequired must be true on every action card.

EXECUTIVE CONTEXT PACKAGE:
${serializeContextForPrompt(payload.context)}`
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`response.${field} must be a string`)
  }
  return value
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') {
    throw new Error(`response.${field} must be a string when present`)
  }
  return value
}

function asStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new Error(`response.${field} must be an array of strings`)
  }
  for (const v of value as unknown[]) {
    if (typeof v !== 'string') {
      throw new Error(`response.${field} must contain only strings`)
    }
  }
  return value as string[]
}

function buildValidator(
  ctx: ActionCardValidationContext
): (raw: unknown) => RunTheMeetingResult {
  return (raw: unknown): RunTheMeetingResult => {
    if (!raw || typeof raw !== 'object') {
      throw new Error('AI response was not a JSON object.')
    }
    const obj = raw as Record<string, unknown>

    if (!Array.isArray(obj.agendaItems)) {
      throw new Error('agendaItems must be an array')
    }
    const agendaItems: RunTheMeetingAgendaItem[] = (obj.agendaItems as unknown[]).map(
      (rawItem, i) => {
        if (!rawItem || typeof rawItem !== 'object') {
          throw new Error(`agendaItems[${i}] must be an object`)
        }
        const item = rawItem as Record<string, unknown>
        if (typeof item.minute !== 'number' || !Number.isFinite(item.minute)) {
          throw new Error(`agendaItems[${i}].minute must be a number`)
        }
        return {
          minute: item.minute,
          topic: asString(item.topic, `agendaItems[${i}].topic`),
          speaker: asString(item.speaker, `agendaItems[${i}].speaker`),
          decisionsNeeded: asStringArray(
            item.decisionsNeeded,
            `agendaItems[${i}].decisionsNeeded`
          )
        }
      }
    )

    if (!Array.isArray(obj.speakingOrder)) {
      throw new Error('speakingOrder must be an array')
    }
    const speakingOrder: RunTheMeetingSpeakingOrderEntry[] = (
      obj.speakingOrder as unknown[]
    ).map((rawEntry, i) => {
      if (!rawEntry || typeof rawEntry !== 'object') {
        throw new Error(`speakingOrder[${i}] must be an object`)
      }
      const entry = rawEntry as Record<string, unknown>
      return {
        role: asString(entry.role, `speakingOrder[${i}].role`),
        name: asOptionalString(entry.name, `speakingOrder[${i}].name`),
        rationale: asString(entry.rationale, `speakingOrder[${i}].rationale`)
      }
    })

    const followUpActions = validateActionCardArray(
      obj.followUpActions,
      'followUpActions',
      ctx
    )

    return {
      agendaItems,
      speakingOrder,
      followUpActions,
      templateVersion: TEMPLATE_VERSION
    }
  }
}

export function buildRunTheMeetingTemplate(
  payload: RunTheMeetingPayload
): PromptTemplate<RunTheMeetingPayload, RunTheMeetingResult> {
  const validationCtx: ActionCardValidationContext = {
    deliverableDueDates: buildDueDateMapFromDeliverables(payload.context.deliverables)
  }
  return {
    mode: 'run-the-meeting',
    templateVersion: TEMPLATE_VERSION,
    systemPrompt: buildSystem,
    userPromptBuilder: buildUser,
    responseSchema: buildValidator(validationCtx),
    maxInputChars: MAX_INPUT_CHARS,
    maxOutputTokens: MAX_OUTPUT_TOKENS
  }
}

export const runTheMeetingTemplate: PromptTemplate<
  RunTheMeetingPayload,
  RunTheMeetingResult
> = {
  mode: 'run-the-meeting',
  templateVersion: TEMPLATE_VERSION,
  systemPrompt: buildSystem,
  userPromptBuilder: buildUser,
  responseSchema: () => {
    throw new Error(
      'runTheMeetingTemplate.responseSchema cannot be called on the static instance. ' +
        'Construct a request-bound template via buildRunTheMeetingTemplate.'
    )
  },
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
