// Executive Advisor V2 — shared coach-mode template scaffolding.
//
// All eight V2 modes share:
//   - the same coach system prompt (extends the V1 shared system
//     prompt with the management-coach posture from the brief)
//   - the same response shape (mode + headline + cards + extra
//     + unknowns + templateVersion)
//   - the same response validator (forces humanReviewRequired=true
//     on every card, normalizes priority, normalizes sourceIds,
//     enforces card field presence)
//
// Mode-specific differences live entirely in:
//   - the user-prompt instructions (what question the chief is
//     asking + what cards / extra structure to return)
//   - the optional `extra` field (modes that need additional
//     structured output beyond a flat card list)
//
// POSTURE (do not relax)
// ----------------------
//   - The Advisor prepares; chiefs decide. The system prompt
//     forbids approval / submit / status-mutation language and
//     forces every card to ship with humanReviewRequired: true.
//   - No invented facts. The system prompt requires the model to
//     mark unknowns explicitly when context is missing.
//   - The validator coerces missing fields to safe defaults
//     rather than throwing — a partial response is more useful
//     than no response when the chief is mid-class.

import type { BrandContext } from '~~/app/config/brandContext'
import type { ProgramContext } from '~~/app/config/programContext'
import type {
  AdvisorMode,
  AdvisorActionCard,
  AdvisorModeResult
} from '~~/app/types/executiveAdvisor'
import type { ExecutiveAdvisorContextV2 } from '~~/server/utils/executiveAdvisorContext'
import { summarizeAdvisorContextV2 } from '~~/server/utils/executiveAdvisorContext'
import { compactContextForMode } from '~~/server/utils/executiveAdvisorContextBudget'
import {
  buildExecutiveAdvisorSystemPrompt,
  EXECUTIVE_ADVISOR_TEMPLATE_VERSION
} from './executiveAdvisorShared'
import type { PromptTemplate } from './index'

export const COACH_MODE_TEMPLATE_VERSION =
  'executive-advisor-coach-v2' as const

export interface CoachModePayload {
  context: ExecutiveAdvisorContextV2
  /** Optional free-text focus the chief supplied — e.g. a section
   *  id to rescue, or a deliverable id to evaluate for approval. */
  focus?: string | null
}

const COACH_POSTURE = [
  'You are a management coach for student chiefs running Renni Inc.',
  'Your job is to help chiefs manage execution. You do not do the student deliverables.',
  'Be direct, concrete, and operational. Prefer 15-minute unblock plans over vague advice.',
  'Use only the provided context. If you cannot ground a claim in context, mark its sourceIds as [] and call it out in `unknowns`.',
  'Never approve, submit, change status, create hidden tasks, or claim student work is done.',
  'Always include owner, due-date label, dependency, definition of done, and Playbook chapter when recommending work.',
  'Distinguish P0 must-finish work from P1 / P2 polish.',
  'Use the builderCoverage field in the context to recommend the exact surface a chief should open ("open the Universal Table on Ch. 4 channels", "use the Retail Pitch Builder on Ch. 11 ask"). When a section is recipe-only, recommend the Working Draft path explicitly.',
  'Use the taskCoverage field as factual ground for management advice — it names which P0 / P1 sections have a matching task and which do not. When coverage is missing, recommend the chief seed a task manually through the existing Tasks form ("paste this title into Tasks: …"). NEVER claim a task was created and NEVER imply the platform creates tasks automatically.',
  'Give chiefs exact language they can use with teammates — never characterize a teammate\'s effort, character, motivation, or commitment.',
  'humanReviewRequired must be true on every action card. Include it explicitly in the JSON output.'
].join('\n')

export function buildCoachSystemPrompt(
  brand: BrandContext,
  program: ProgramContext
): string {
  const base = buildExecutiveAdvisorSystemPrompt(brand, program)
  return `${base}

V2 MANAGEMENT COACH POSTURE:
${COACH_POSTURE}`
}

/** Mode-specific instructions baked into the user prompt. Each
 *  entry is a short paragraph describing what cards / extra to
 *  return for the given mode. */
const MODE_INSTRUCTIONS: Readonly<Record<AdvisorMode, string>> = {
  'daily-chief-brief': `Mode: daily-chief-brief.
The chief is asking "What should I push on today?". Return 3-5 AdvisorActionCard entries ranked highest priority first. Use P0 / P1 / P2 from the Final Week lane map and the loaded dependency signals. Each card must include exactNextAction, whatChiefShouldSay, doneSignal, and riskIfIgnored. Do not pad the list — if only two real priorities exist, return two.`,

  'run-the-room': `Mode: run-the-room.
The chief has 45 minutes of class. Return a flat AdvisorActionCard list (use cards as the schedule items, one card per time block) AND an "extra" object: {
  "schedule": [
    { "block": "first 5 minutes", "action": string, "owner": string },
    { "block": "next 15 minutes", "action": string, "owner": string },
    { "block": "next 20 minutes", "action": string, "owner": string },
    { "block": "final 5 minutes", "action": string, "owner": string }
  ],
  "laneOwners": [{ "lane": string, "chief": string, "checkpoint": string }],
  "preLeaveDeliverables": string[]   // what students must produce before leaving
}.
Each card and each schedule entry must reference real loaded sections / deliverables.`,

  'section-rescue': `Mode: section-rescue.
A draft is weak. Return AdvisorActionCard entries describing what to do; AND an "extra" object: {
  "missing": string[],
  "minimumViableAnswer": string,                  // 1 paragraph
  "strongerAnswerStructure": string[],
  "questionsToAskStudent": string[],
  "evidenceNeeded": string[],
  "exactTeammateInstruction": string,             // one-line script
  "approveIf": string,
  "pushBackIf": string
}.
The cards focus on the chief's next 15 minutes; the extra block is the substance the chief takes back to the team.`,

  'task-coverage-doctor': `Mode: task-coverage-doctor.
Use context.taskCoverageGaps. For each gap.missing === true, emit an AdvisorActionCard suggesting the matching task title. Each card:
- title: the recommended task title
- exactNextAction: "Open Tasks and seed: <title>" with owner + due label
- whatChiefShouldSay: an explicit ask script for the owner
- doneSignal: the section's done-when from the lane map
- priority: mirror the section's priority (P0 / P1 / P2)
DO NOT recommend creating tasks programmatically — the platform never auto-creates tasks; only chiefs do.
Return an empty cards array (with an "unknowns" entry) when context.taskCoverageGaps has no missing entries.`,

  'approval-coach': `Mode: approval-coach.
The chief is about to approve a deliverable. The focus may name a section or deliverable id (read context.focus). Return AdvisorActionCard entries that name the checks the chief should run; AND an "extra" object: {
  "checks": [
    { "label": "Complete?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Accurate?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Reviewed by chief?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Correct format?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Usable by next cohort?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Missing evidence?", "ok": "yes" | "no" | "unknown", "evidence": string },
    { "label": "Weak assumptions?", "ok": "yes" | "no" | "unknown", "evidence": string }
  ],
  "recommendation": "approve" | "return-for-revision" | "ask-instructor",
  "rationale": string
}.
The chief decides; the recommendation is advisory only. Mark every "ok" you cannot ground as "unknown" with the evidence string explaining why.`,

  'dependency-explainer': `Mode: dependency-explainer.
Work is blocked. Use context.dependencySignals + context.sectionDependencyHints. Return AdvisorActionCard entries; AND an "extra" object: {
  "upstreamMissing": string[],     // sections / chapters not yet landed
  "downstreamImpact": string[],    // what is weaker because of the gap
  "exactSectionToOpen": string,    // single best deeplink path
  "exactTeammateToAsk": string,    // role + sample script
  "fifteenMinuteUnblockPlan": string[]  // 3-5 ordered steps
}.`,

  'phoenix-nest-pitch-coach': `Mode: phoenix-nest-pitch-coach.
Evaluate readiness for the Phoenix Nest carry pitch. Use Ch. 11 sections (identity / evidence / offer / ask) plus Ch. 5 brand book + Ch. 7 / 8 finance. Return AdvisorActionCard entries; AND an "extra" object: {
  "missingBuyerProof": string[],
  "missingSkuOffer": string[],
  "missingPriceMarginLogic": string[],
  "missingInventoryProof": string[],
  "missingAsk": string[],
  "next3Fixes": string[]   // ordered
}.`,

  'final-week-triage': `Mode: final-week-triage.
The chief asks what is realistic to finish this week. Use context.finalWeekLanes. Return AdvisorActionCard entries (one per realistic P0 finish); AND an "extra" object: {
  "p0MustFinish": string[],         // section entry ids the team MUST finish
  "p1IfTime": string[],             // section entry ids that fit if time
  "ignoreForNow": string[],         // section entry ids to defer this week
  "ownerByLane": [{ "lane": string, "owner": string, "ownsP0Sections": string[] }],
  "dailySchedule": [{ "day": string, "focus": string }],
  "doneSignal": string              // one sentence: how the team knows the week succeeded
}.`
}

/** Builds the user prompt that the model receives. Embeds the
 *  mode-specific instructions plus the serialized context. */
export function buildCoachUserPrompt(
  mode: AdvisorMode,
  payload: CoachModePayload
): string {
  const focus = (payload.focus ?? '').trim()
  const focusLine = focus
    ? `Caller focus hint (verbatim from chief): "${focus}"`
    : 'Caller focus hint: (none — return for the full visible scope)'
  const contextSummary = summarizeAdvisorContextV2(payload.context)
  // Compact, mode-aware context — filtered to what each mode
  // actually uses, capped, and prioritized by `focus`. Replaces
  // the original full-context dump that was overflowing the
  // 28k-char input budget. The full context summary is still
  // embedded above so the model sees the headline state; the
  // compact view carries the per-record detail it needs.
  const compactContext = compactContextForMode(
    payload.context,
    mode,
    payload.focus ?? null,
    null
  )
  return `${MODE_INSTRUCTIONS[mode]}

${focusLine}

CONTEXT SUMMARY:
${contextSummary}

EXECUTIVE ADVISOR CONTEXT V2 — COMPACT FOR MODE "${mode}" (JSON):
${JSON.stringify(compactContext)}

OUTPUT JSON SHAPE:
{
  "mode": "${mode}",
  "templateVersion": "${COACH_MODE_TEMPLATE_VERSION}",
  "headline": string,           // one sentence
  "cards": AdvisorActionCard[], // 0..8 items; humanReviewRequired must be true on each
  "extra"?: object,             // mode-specific structured supplement (see mode instructions above)
  "unknowns"?: string[]         // list every ungrounded claim or missing context input
}

AdvisorActionCard schema:
{
  "title": string,
  "priority": "P0" | "P1" | "P2",
  "whyItMatters": string,
  "owner": string,                  // role label, e.g. "CFO" or "Co-CEOs"
  "dueDate": string,                // coarse label, e.g. "today", "this week", "before approval"
  "dependency": string,             // upstream work the action waits on, or "none"
  "playbookChapter": string,        // e.g. "Ch. 8 finance"
  "sectionLink"?: string,           // /deliverables/<id>/sections/<sectionId> when known
  "exactNextAction": string,        // the 15-minute next move
  "whatChiefShouldSay": string,     // one-line script the chief can deliver verbatim
  "doneSignal": string,             // what done looks like
  "riskIfIgnored": string,
  "sourceIds": string[],            // grounded references; empty array = ungrounded
  "humanReviewRequired": true       // ALWAYS true; required by validator
}

Rules:
- Return one JSON object only. No code fences. No prose outside the JSON.
- humanReviewRequired must be true on every card.
- Distinguish P0 must-finish work from P1 / P2.
- Mark unknowns explicitly under "unknowns" — never invent facts.
- If a card's sourceIds would be empty, include the card AT confidence implied by setting sourceIds to [], and add a corresponding "unknowns" entry naming what the chief should verify.`
}

// ---- Validator ---------------------------------------------------

const VALID_PRIORITIES = new Set<AdvisorActionCard['priority']>([
  'P0',
  'P1',
  'P2'
])

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function normalizeCard(raw: unknown): AdvisorActionCard | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const title = asString(r.title).trim()
  if (!title) return null
  const rawPriority = asString(r.priority).toUpperCase()
  const priority: AdvisorActionCard['priority'] = (
    VALID_PRIORITIES.has(rawPriority as AdvisorActionCard['priority'])
      ? rawPriority
      : 'P1'
  ) as AdvisorActionCard['priority']
  const card: AdvisorActionCard = {
    title,
    priority,
    whyItMatters: asString(r.whyItMatters),
    owner: asString(r.owner),
    dueDate: asString(r.dueDate),
    dependency: asString(r.dependency),
    playbookChapter: asString(r.playbookChapter),
    exactNextAction: asString(r.exactNextAction),
    whatChiefShouldSay: asString(r.whatChiefShouldSay),
    doneSignal: asString(r.doneSignal),
    riskIfIgnored: asString(r.riskIfIgnored),
    sourceIds: asStringArray(r.sourceIds),
    humanReviewRequired: true
  }
  const sectionLink = asString(r.sectionLink).trim()
  if (sectionLink) card.sectionLink = sectionLink
  return card
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

export function validateCoachResponse(
  mode: AdvisorMode,
  raw: unknown
): AdvisorModeResult {
  if (!isPlainObject(raw)) {
    throw new Error('Advisor response was not a JSON object.')
  }
  const cards: AdvisorActionCard[] = Array.isArray(raw.cards)
    ? (raw.cards as unknown[])
        .map((c) => normalizeCard(c))
        .filter((c): c is AdvisorActionCard => c !== null)
    : []
  const result: AdvisorModeResult = {
    mode,
    templateVersion: COACH_MODE_TEMPLATE_VERSION,
    headline: asString(raw.headline) || `Coach mode result: ${mode}`,
    cards
  }
  if (isPlainObject(raw.extra)) {
    result.extra = raw.extra
  }
  const unknowns = asStringArray(raw.unknowns)
  if (unknowns.length > 0) {
    result.unknowns = unknowns
  }
  return result
}

/** Build a request-bound coach mode template. The endpoint constructs
 *  a fresh template per request so the validator can close over the
 *  active mode (each mode normalizes the response identically but
 *  carries its own mode string). */
export function buildCoachModeTemplate(
  mode: AdvisorMode,
  payload: CoachModePayload
): PromptTemplate<CoachModePayload, AdvisorModeResult> {
  return {
    mode,
    templateVersion: COACH_MODE_TEMPLATE_VERSION,
    systemPrompt: buildCoachSystemPrompt,
    userPromptBuilder: (p: CoachModePayload) => buildCoachUserPrompt(mode, p),
    responseSchema: (raw: unknown) => validateCoachResponse(mode, raw),
    maxInputChars: 28_000,
    maxOutputTokens: 2400
  }
}

/** Stub registry entry per coach mode. Mirrors the V1 pattern where
 *  the registry holds a static template that throws on
 *  `responseSchema()` — the endpoint must construct the request-
 *  bound template before validating a response. */
export function buildCoachModeRegistryStub(
  mode: AdvisorMode
): PromptTemplate<CoachModePayload, AdvisorModeResult> {
  return {
    mode,
    templateVersion: COACH_MODE_TEMPLATE_VERSION,
    systemPrompt: buildCoachSystemPrompt,
    userPromptBuilder: (p: CoachModePayload) => buildCoachUserPrompt(mode, p),
    responseSchema: () => {
      throw new Error(
        `Coach mode "${mode}" registry stub responseSchema cannot be called. ` +
          'Construct a request-bound template via buildCoachModeTemplate.'
      )
    },
    maxInputChars: 28_000,
    maxOutputTokens: 2400
  }
}

// Re-export the V1 shared template version so audit log entries can
// distinguish V1 vs V2 templates.
export { EXECUTIVE_ADVISOR_TEMPLATE_VERSION }
