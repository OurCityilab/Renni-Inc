// Executive Advisor — Mode 1: Daily Command Brief.
//
// The chief opens the advisor in the morning and asks "what is the
// shape of today?" The model returns three top priorities, the
// biggest single risk, who needs help (operational language only),
// what should happen today, and one paragraph of why-it-matters.
//
// Every action card and source reference must ground back to specific
// IDs from the executive context package. Cards without grounding are
// coerced to confidence='low' by the shared action card validator
// in server/utils/executiveAdvisor/actionCard.ts.
//
// Posture (do not relax in V1):
//   - Coach, never approver. The shared system prompt forbids the
//     model from approving deliverables, mutating statuses, or
//     characterizing students.
//   - Output is JSON-only, schema-checked, and ActionCards are
//     normalized so any ungrounded suggestion ships at confidence
//     'low' regardless of what the AI returned.

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
  type ActionCardValidationContext,
  type SourceIds
} from '~~/server/utils/executiveAdvisor/actionCard'

const TEMPLATE_VERSION = EXECUTIVE_ADVISOR_TEMPLATE_VERSION
const MAX_INPUT_CHARS = 18_000
const MAX_OUTPUT_TOKENS = 2000

export interface DailyCommandBriefRiskBlock {
  title: string
  description: string
  sourceIds: SourceIds
}

export interface DailyCommandBriefHelpBlock {
  /** Free text — typically a role label or "Role (Name)" pair. */
  role: string
  /** Describes WORK STATE. Never character / effort / motivation. */
  workStateDescription: string
  sourceIds: SourceIds
}

export interface DailyCommandBriefResult {
  topPriorities: ActionCard[]
  biggestRisk: DailyCommandBriefRiskBlock
  whoNeedsHelp: DailyCommandBriefHelpBlock[]
  whatShouldHappenToday: string
  whyThisMatters: string
  templateVersion: typeof TEMPLATE_VERSION
}

export interface DailyCommandBriefPayload {
  context: ExecutiveContextPackage
}

function buildSystem(brand: BrandContext, program: ProgramContext): string {
  return buildExecutiveAdvisorSystemPrompt(brand, program)
}

function buildUser(
  payload: DailyCommandBriefPayload,
  _brand: BrandContext,
  _program: ProgramContext
): string {
  return `Mode: daily-command-brief.

You are preparing a 30-second morning brief for the executive whose role + scope are described in the executive context package. Read the package, then return a single JSON object with this shape:

{
  "topPriorities": ActionCard[],   // 1-3 cards, ranked highest priority first
  "biggestRisk": {
    "title": string,               // <= 80 chars; the single most consequential risk today
    "description": string,         // 1-2 sentences naming WHAT is at risk and WHY
    "sourceIds": SourceIds         // grounded references; required even if empty
  },
  "whoNeedsHelp": [                // 0-3 entries; empty array allowed when no one needs help
    {
      "role": string,              // e.g. "CFO" or "Chase (CFO)"
      "workStateDescription": string,  // describe WORK STATE, never character or effort
      "sourceIds": SourceIds
    }
  ],
  "whatShouldHappenToday": string, // 1-2 short paragraphs (4-8 sentences total)
  "whyThisMatters": string,        // 1 paragraph (2-4 sentences)
  "templateVersion": "${TEMPLATE_VERSION}"
}

ActionCard schema:
{
  "actionId": string,              // generate a stable id (UUID-like is fine)
  "title": string,
  "ownerRole": "co_ceo" | "coo" | "cfo" | "cmo" | "chief_strategy_growth" | "member" | "admin",
  "suggestedAssigneeName"?: string,
  "suggestedAssigneeUid"?: string,
  "dueDateSuggestion"?: string,    // yyyy-mm-dd; never later than the linked deliverable's due date when present in context
  "dependency": string,
  "definitionOfDone": string,
  "playbookChapter"?: string,
  "whyThisMatters": string,
  "sourceType": "observation" | "risk" | "gap" | "opportunity",
  "sourceIds": SourceIds,
  "confidence": "low" | "medium" | "high",
  "humanReviewRequired": true
}

SourceIds schema (each property optional, populate the ones you used):
{
  "taskIds"?: string[],
  "deliverableIds"?: string[],
  "sectionIds"?: string[],
  "requirementIds"?: string[],
  "advisorSignalIds"?: string[]
}

Requirements:
- Anchor every priority and risk in specific items from the package. If you cannot anchor a priority in at least one source ID, mark its confidence='low'.
- whoNeedsHelp must describe WORK STATE, not character. ACCEPTABLE: "Maya's Ch. 5 brand-story section has no draft text and her CMO assignment is overdue." UNACCEPTABLE: "Maya seems disengaged."
- Do not invent due dates. If a deliverable's due date is not in the package, omit dueDateSuggestion.
- humanReviewRequired must be true on every action card.
- The package may show a small / empty queue when work is mostly approved. Return shorter arrays in that case rather than padding with weak suggestions.

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
): (raw: unknown) => DailyCommandBriefResult {
  return (raw: unknown): DailyCommandBriefResult => {
    if (!raw || typeof raw !== 'object') {
      throw new Error('AI response was not a JSON object.')
    }
    const obj = raw as Record<string, unknown>

    const topPriorities = validateActionCardArray(
      obj.topPriorities,
      'topPriorities',
      ctx
    )
    if (topPriorities.length < 1 || topPriorities.length > 3) {
      throw new Error(
        `topPriorities must contain 1-3 cards (got ${topPriorities.length}).`
      )
    }

    if (!obj.biggestRisk || typeof obj.biggestRisk !== 'object') {
      throw new Error('biggestRisk must be an object')
    }
    const risk = obj.biggestRisk as Record<string, unknown>
    const biggestRisk: DailyCommandBriefRiskBlock = {
      title: asString(risk.title, 'biggestRisk.title'),
      description: asString(risk.description, 'biggestRisk.description'),
      sourceIds: asSourceIds(risk.sourceIds, 'biggestRisk.sourceIds')
    }

    if (!Array.isArray(obj.whoNeedsHelp)) {
      throw new Error('whoNeedsHelp must be an array')
    }
    const whoNeedsHelp: DailyCommandBriefHelpBlock[] = (
      obj.whoNeedsHelp as unknown[]
    ).map((entry, i) => {
      if (!entry || typeof entry !== 'object') {
        throw new Error(`whoNeedsHelp[${i}] must be an object`)
      }
      const e = entry as Record<string, unknown>
      return {
        role: asString(e.role, `whoNeedsHelp[${i}].role`),
        workStateDescription: asString(
          e.workStateDescription,
          `whoNeedsHelp[${i}].workStateDescription`
        ),
        sourceIds: asSourceIds(e.sourceIds, `whoNeedsHelp[${i}].sourceIds`)
      }
    })

    return {
      topPriorities,
      biggestRisk,
      whoNeedsHelp,
      whatShouldHappenToday: asString(obj.whatShouldHappenToday, 'whatShouldHappenToday'),
      whyThisMatters: asString(obj.whyThisMatters, 'whyThisMatters'),
      templateVersion: TEMPLATE_VERSION
    }
  }
}

/**
 * Builds a request-bound dailyCommandBrief template. The action-card
 * validator needs the executive context package to apply the
 * due-date guardrail, so the endpoint constructs a fresh template
 * per request rather than sharing a static instance.
 */
export function buildDailyCommandBriefTemplate(
  payload: DailyCommandBriefPayload
): PromptTemplate<DailyCommandBriefPayload, DailyCommandBriefResult> {
  const validationCtx: ActionCardValidationContext = {
    deliverableDueDates: buildDueDateMapFromDeliverables(payload.context.deliverables)
  }
  return {
    mode: 'daily-command-brief',
    templateVersion: TEMPLATE_VERSION,
    systemPrompt: buildSystem,
    userPromptBuilder: buildUser,
    responseSchema: buildValidator(validationCtx),
    maxInputChars: MAX_INPUT_CHARS,
    maxOutputTokens: MAX_OUTPUT_TOKENS
  }
}

/**
 * Static template shape registered in the registry. The registry
 * dispatches by mode string but the endpoint MUST swap in the
 * request-bound template (via buildDailyCommandBriefTemplate) before
 * calling responseSchema, because the validator needs the
 * deliverable due-date map. See executive-advisor.post.ts.
 *
 * For the static instance, the validator throws — the registry
 * lookup is a sanity check that the mode exists; the endpoint
 * always constructs the request-bound template.
 */
export const dailyCommandBriefTemplate: PromptTemplate<
  DailyCommandBriefPayload,
  DailyCommandBriefResult
> = {
  mode: 'daily-command-brief',
  templateVersion: TEMPLATE_VERSION,
  systemPrompt: buildSystem,
  userPromptBuilder: buildUser,
  responseSchema: () => {
    throw new Error(
      'dailyCommandBriefTemplate.responseSchema cannot be called on the static instance. ' +
        'Construct a request-bound template via buildDailyCommandBriefTemplate.'
    )
  },
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
