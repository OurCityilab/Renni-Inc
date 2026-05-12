// Lightweight runtime validator + sanitizer for the AI coaching
// response. Used by /api/ai/review-coaching.post.ts.
//
// Posture (do not relax):
//   - PURE: no Firestore, no fetch.
//   - REJECT > SANITIZE. Missing required fields fail with a tagged
//     error so the endpoint can return a generic safe-fallback to
//     the client without ferrying raw model output anywhere.
//   - Banned phrases ("AI approved", "AI grade", "Written by",
//     "Completed by ___", "lazy", "poor performer", "weak student",
//     etc.) trigger a hard rejection — they should never leave the
//     server. The existing aiSafetyScan helper covers the personal-
//     judgment list; this validator adds the AI-claim list.

import type { AiReviewCoachingOutput } from '~~/app/types/aiReviewReports'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '~~/app/types/aiReviewReports'

export class CoachingValidationError extends Error {
  constructor(
    message: string,
    readonly reason: 'shape' | 'safety',
    readonly detail?: string
  ) {
    super(message)
    this.name = 'CoachingValidationError'
  }
}

const URGENCY = new Set(['low', 'medium', 'high'])

const BANNED_PHRASES: readonly string[] = [
  'ai approved',
  'ai approval',
  'ai grade',
  'ai-graded',
  'ai graded',
  'written by',
  'completed by ',
  'lazy',
  'poor performer',
  'low performer',
  'weak student',
  'bad student',
  'failing student',
  'incapable'
] as const

export const AI_REVIEW_COACHING_TOP_LEVEL_FIELDS: readonly string[] = [
  'executiveSummary',
  'coachingPriorities',
  'strongestAreas',
  'weakestAreas',
  'missingEvidence',
  'escalationItems',
  'suggestedTalkingPoints',
  'recommendedNextActions',
  'limitations',
  'safetyReminder'
] as const

function isStr(v: unknown): v is string {
  return typeof v === 'string'
}
function isArrayOf<T>(
  v: unknown,
  guard: (x: unknown) => x is T
): v is T[] {
  return Array.isArray(v) && v.every(guard)
}
function isStrArray(v: unknown): v is string[] {
  return isArrayOf<string>(v, isStr)
}
function isUrgency(v: unknown): v is AiReviewCoachingOutput['coachingPriorities'][number]['urgency'] {
  return typeof v === 'string' && URGENCY.has(v)
}

function requireField(obj: Record<string, unknown>, key: string): unknown {
  if (!(key in obj)) {
    throw new CoachingValidationError(
      `Missing field "${key}"`,
      'shape',
      key
    )
  }
  return obj[key]
}

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CoachingValidationError(
      `Expected object at "${path}"`,
      'shape',
      path
    )
  }
  return value as Record<string, unknown>
}

function asString(value: unknown, path: string): string {
  if (!isStr(value)) {
    throw new CoachingValidationError(
      `Expected string at "${path}"`,
      'shape',
      path
    )
  }
  return value
}

function asUrgency(value: unknown, path: string): 'low' | 'medium' | 'high' {
  if (!isUrgency(value)) {
    throw new CoachingValidationError(
      `Expected urgency low|medium|high at "${path}"`,
      'shape',
      path
    )
  }
  return value
}

function asStringArray(value: unknown, path: string): string[] {
  if (!isStrArray(value)) {
    throw new CoachingValidationError(
      `Expected string[] at "${path}"`,
      'shape',
      path
    )
  }
  return value
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new CoachingValidationError(
      `Expected array at "${path}"`,
      'shape',
      path
    )
  }
  return value
}

/** Walk every string-valued leaf and reject any banned phrase. */
export function scanBannedPhrases(value: unknown, basePath = ''): {
  ok: boolean
  phrase?: string
  path?: string
} {
  if (value === null || value === undefined) return { ok: true }
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) {
        // Allow explicit negations like "no ai approval" / "ai
        // coaching only. human leaders approve work." — they include
        // the phrase as a refutation, not a claim. The check below
        // permits negated and safety-reminder usages.
        if (isNegationOrSafetyReminder(lower, phrase)) continue
        return { ok: false, phrase, path: basePath || '(root)' }
      }
    }
    return { ok: true }
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const child = scanBannedPhrases(value[i], `${basePath}[${i}]`)
      if (!child.ok) return child
    }
    return { ok: true }
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = basePath ? `${basePath}.${key}` : key
      const r = scanBannedPhrases(child, next)
      if (!r.ok) return r
    }
  }
  return { ok: true }
}

const NEGATION_TOKENS: readonly string[] = [
  'no',
  'not',
  'never',
  "isn't",
  'is not',
  'cannot',
  "can't",
  'do not',
  "don't",
  'without'
] as const

function isNegationOrSafetyReminder(
  lower: string,
  phrase: string
): boolean {
  // "ai coaching only. human leaders approve work." literal is fine.
  if (lower === AI_REVIEW_COACHING_SAFETY_REMINDER.toLowerCase()) return true
  // Word-boundary negation check: a negation token must appear as a
  // whole word immediately before the banned phrase (allowing
  // intervening whitespace). Substring matches inside other words
  // ("note" ⊃ "no") must not satisfy this check.
  const idx = lower.indexOf(phrase)
  if (idx === -1) return false
  for (const token of NEGATION_TOKENS) {
    // Build a per-token regex: optional non-word boundary +
    // negation token + whitespace + the banned phrase. The
    // negation token itself must be word-bounded so "note" never
    // matches "no".
    const safePhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?:^|\\W)${token.replace(/'/g, "['’]")}\\s+${safePhrase}`, 'i')
    if (re.test(lower)) return true
  }
  return false
}

interface CoachingPriorityRaw {
  issue: string
  evidenceFromPayload: string
  whyItMatters: string
  coachingMove: string
  owner: string
  urgency: 'low' | 'medium' | 'high'
  definitionOfDone: string
}

function validatePriority(raw: unknown, path: string): CoachingPriorityRaw {
  const o = asObject(raw, path)
  return {
    issue: asString(requireField(o, 'issue'), `${path}.issue`),
    evidenceFromPayload: asString(
      requireField(o, 'evidenceFromPayload'),
      `${path}.evidenceFromPayload`
    ),
    whyItMatters: asString(
      requireField(o, 'whyItMatters'),
      `${path}.whyItMatters`
    ),
    coachingMove: asString(
      requireField(o, 'coachingMove'),
      `${path}.coachingMove`
    ),
    owner: asString(requireField(o, 'owner'), `${path}.owner`),
    urgency: asUrgency(requireField(o, 'urgency'), `${path}.urgency`),
    definitionOfDone: asString(
      requireField(o, 'definitionOfDone'),
      `${path}.definitionOfDone`
    )
  }
}

function validateStrongArea(raw: unknown, path: string) {
  const o = asObject(raw, path)
  return {
    area: asString(requireField(o, 'area'), `${path}.area`),
    evidenceFromPayload: asString(
      requireField(o, 'evidenceFromPayload'),
      `${path}.evidenceFromPayload`
    ),
    whyItMatters: asString(
      requireField(o, 'whyItMatters'),
      `${path}.whyItMatters`
    )
  }
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return isStr(value) ? value : null
}

function validateWeakArea(raw: unknown, path: string) {
  const o = asObject(raw, path)
  return {
    area: asString(requireField(o, 'area'), `${path}.area`),
    issue: asString(requireField(o, 'issue'), `${path}.issue`),
    recommendedFix: asString(
      requireField(o, 'recommendedFix'),
      `${path}.recommendedFix`
    ),
    owner: optionalString(o.owner)
  }
}

function validateMissingEvidence(raw: unknown, path: string) {
  const o = asObject(raw, path)
  return {
    sectionOrDeliverable: asString(
      requireField(o, 'sectionOrDeliverable'),
      `${path}.sectionOrDeliverable`
    ),
    issue: asString(requireField(o, 'issue'), `${path}.issue`),
    neededEvidence: asString(
      requireField(o, 'neededEvidence'),
      `${path}.neededEvidence`
    ),
    owner: optionalString(o.owner)
  }
}

function validateEscalation(raw: unknown, path: string) {
  const o = asObject(raw, path)
  return {
    issue: asString(requireField(o, 'issue'), `${path}.issue`),
    escalateTo: asString(
      requireField(o, 'escalateTo'),
      `${path}.escalateTo`
    ),
    reason: asString(requireField(o, 'reason'), `${path}.reason`),
    urgency: asUrgency(requireField(o, 'urgency'), `${path}.urgency`)
  }
}

function validateNextAction(raw: unknown, path: string) {
  const o = asObject(raw, path)
  return {
    action: asString(requireField(o, 'action'), `${path}.action`),
    owner: asString(requireField(o, 'owner'), `${path}.owner`),
    urgency: asUrgency(requireField(o, 'urgency'), `${path}.urgency`),
    definitionOfDone: asString(
      requireField(o, 'definitionOfDone'),
      `${path}.definitionOfDone`
    )
  }
}

export function missingTopLevelCoachingFields(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [...AI_REVIEW_COACHING_TOP_LEVEL_FIELDS]
  }
  const obj = raw as Record<string, unknown>
  return AI_REVIEW_COACHING_TOP_LEVEL_FIELDS.filter((key) => !(key in obj))
}

export interface SimplifiedAiReviewCoachingOutput {
  executiveSummary: string
  coachingPriorities: string[]
  missingEvidence: string[]
  recommendedNextActions: string[]
  suggestedTalkingPoints: string[]
  limitations: string[]
  safetyReminder: typeof AI_REVIEW_COACHING_SAFETY_REMINDER
}

function requireSimplifiedField(
  obj: Record<string, unknown>,
  key: keyof SimplifiedAiReviewCoachingOutput
): unknown {
  if (!(key in obj)) {
    throw new CoachingValidationError(
      `Missing simplified field "${key}"`,
      'shape',
      key
    )
  }
  return obj[key]
}

export function validateSimplifiedCoachingOutput(
  raw: unknown
): SimplifiedAiReviewCoachingOutput {
  const root = asObject(raw, '(root)')
  const out: SimplifiedAiReviewCoachingOutput = {
    executiveSummary: asString(
      requireSimplifiedField(root, 'executiveSummary'),
      'executiveSummary'
    ),
    coachingPriorities: asStringArray(
      requireSimplifiedField(root, 'coachingPriorities'),
      'coachingPriorities'
    ),
    missingEvidence: asStringArray(
      requireSimplifiedField(root, 'missingEvidence'),
      'missingEvidence'
    ),
    recommendedNextActions: asStringArray(
      requireSimplifiedField(root, 'recommendedNextActions'),
      'recommendedNextActions'
    ),
    suggestedTalkingPoints: asStringArray(
      requireSimplifiedField(root, 'suggestedTalkingPoints'),
      'suggestedTalkingPoints'
    ),
    limitations: asStringArray(
      requireSimplifiedField(root, 'limitations'),
      'limitations'
    ),
    safetyReminder: asString(
      requireSimplifiedField(root, 'safetyReminder'),
      'safetyReminder'
    ) as typeof AI_REVIEW_COACHING_SAFETY_REMINDER
  }
  if (out.safetyReminder !== AI_REVIEW_COACHING_SAFETY_REMINDER) {
    throw new CoachingValidationError(
      'safetyReminder does not match the required literal',
      'shape',
      'safetyReminder'
    )
  }
  return out
}

const SIMPLIFIED_EVIDENCE_FALLBACK =
  'See deterministic report counts and limitations.'

export function convertSimplifiedCoachingToFull(
  simplified: SimplifiedAiReviewCoachingOutput
): AiReviewCoachingOutput {
  return {
    executiveSummary: simplified.executiveSummary,
    coachingPriorities: simplified.coachingPriorities.map((issue) => ({
      issue,
      evidenceFromPayload: SIMPLIFIED_EVIDENCE_FALLBACK,
      whyItMatters:
        'This item affects leadership readiness and should be checked against the deterministic report.',
      coachingMove:
        'Use the deterministic report to confirm the gap, then coach the owner on the next concrete revision.',
      owner: 'Unknown owner',
      urgency: 'medium',
      definitionOfDone:
        'A human leader verifies the item is addressed in the underlying work and deterministic report.'
    })),
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: simplified.missingEvidence.map((issue) => ({
      sectionOrDeliverable: 'Evidence gap',
      issue,
      neededEvidence:
        'Add a source, link, assumption note, or structured evidence entry that supports the section claim.',
      owner: 'Unknown owner'
    })),
    escalationItems: [],
    suggestedTalkingPoints: simplified.suggestedTalkingPoints,
    recommendedNextActions: simplified.recommendedNextActions.map((action) => ({
      action,
      owner: 'Unknown owner',
      urgency: 'medium',
      definitionOfDone:
        'A human leader confirms the action is complete using the deterministic report and current work state.'
    })),
    limitations: simplified.limitations,
    safetyReminder: simplified.safetyReminder
  }
}

/** Validate a parsed JSON object against the AiReviewCoachingOutput
 *  shape. Throws CoachingValidationError on first failure. */
export function validateCoachingOutput(
  raw: unknown
): AiReviewCoachingOutput {
  const root = asObject(raw, '(root)')
  const out: AiReviewCoachingOutput = {
    executiveSummary: asString(
      requireField(root, 'executiveSummary'),
      'executiveSummary'
    ),
    coachingPriorities: asArray(
      requireField(root, 'coachingPriorities'),
      'coachingPriorities'
    ).map((row, i) =>
      validatePriority(row, `coachingPriorities[${i}]`)
    ),
    strongestAreas: asArray(
      requireField(root, 'strongestAreas'),
      'strongestAreas'
    ).map((row, i) =>
      validateStrongArea(row, `strongestAreas[${i}]`)
    ),
    weakestAreas: asArray(
      requireField(root, 'weakestAreas'),
      'weakestAreas'
    ).map((row, i) =>
      validateWeakArea(row, `weakestAreas[${i}]`)
    ),
    missingEvidence: asArray(
      requireField(root, 'missingEvidence'),
      'missingEvidence'
    ).map((row, i) =>
      validateMissingEvidence(row, `missingEvidence[${i}]`)
    ),
    escalationItems: asArray(
      requireField(root, 'escalationItems'),
      'escalationItems'
    ).map((row, i) =>
      validateEscalation(row, `escalationItems[${i}]`)
    ),
    suggestedTalkingPoints: asStringArray(
      requireField(root, 'suggestedTalkingPoints'),
      'suggestedTalkingPoints'
    ),
    recommendedNextActions: asArray(
      requireField(root, 'recommendedNextActions'),
      'recommendedNextActions'
    ).map((row, i) =>
      validateNextAction(row, `recommendedNextActions[${i}]`)
    ),
    limitations: asStringArray(
      requireField(root, 'limitations'),
      'limitations'
    ),
    safetyReminder: asString(
      requireField(root, 'safetyReminder'),
      'safetyReminder'
    ) as AiReviewCoachingOutput['safetyReminder']
  }

  if (out.safetyReminder !== AI_REVIEW_COACHING_SAFETY_REMINDER) {
    throw new CoachingValidationError(
      'safetyReminder does not match the required literal',
      'shape',
      'safetyReminder'
    )
  }

  // Safety scan after shape validation so the path indicates the
  // exact field that tripped.
  const scan = scanBannedPhrases(out)
  if (!scan.ok) {
    throw new CoachingValidationError(
      'Banned phrase detected in coaching output',
      'safety',
      `${scan.path} contains "${scan.phrase}"`
    )
  }

  return out
}

/** Generic safe-fallback the endpoint returns when validation fails.
 *  Mirrors the shape but communicates that AI coaching is unavailable
 *  right now. The deterministic report on the page is unaffected. */
export function buildSafeFallback(
  detail = ''
): AiReviewCoachingOutput {
  return {
    executiveSummary:
      'The AI provider responded, but the response did not match the required coaching format. The deterministic report above is still valid.',
    coachingPriorities: [],
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: [],
    escalationItems: [],
    suggestedTalkingPoints: [],
    recommendedNextActions: [],
    limitations: [
      'Try again, or use the deterministic work-state report for today\'s coaching conversation.',
      detail || 'The deterministic report remains the source of truth.'
    ],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  }
}
