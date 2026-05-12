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

import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload
} from '~~/app/types/aiReviewReports'
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

export const AI_REVIEW_COACHING_COMPACT_FIELDS: readonly string[] = [
  'executiveSummary',
  'coachingPriorities',
  'strongestAreas',
  'weakestAreas',
  'missingEvidence',
  'escalationItems',
  'recommendedNextActions',
  'suggestedTalkingPoints',
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

export function missingCompactCoachingFields(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [...AI_REVIEW_COACHING_COMPACT_FIELDS]
  }
  const obj = raw as Record<string, unknown>
  return AI_REVIEW_COACHING_COMPACT_FIELDS.filter((key) => !(key in obj))
}

export interface SimplifiedAiReviewCoachingOutput {
  executiveSummary: string
  coachingPriorities: string[]
  strongestAreas: string[]
  weakestAreas: string[]
  missingEvidence: string[]
  escalationItems: string[]
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
    strongestAreas: asStringArray(
      requireSimplifiedField(root, 'strongestAreas'),
      'strongestAreas'
    ),
    weakestAreas: asStringArray(
      requireSimplifiedField(root, 'weakestAreas'),
      'weakestAreas'
    ),
    missingEvidence: asStringArray(
      requireSimplifiedField(root, 'missingEvidence'),
      'missingEvidence'
    ),
    escalationItems: asStringArray(
      requireSimplifiedField(root, 'escalationItems'),
      'escalationItems'
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
        'This affects leadership readiness and team coaching.',
      coachingMove: issue,
      owner: 'Unknown owner',
      urgency: 'medium',
      definitionOfDone:
        'The assigned team updates the section, adds evidence where needed, and prepares it for human review.'
    })),
    strongestAreas: simplified.strongestAreas.map((area) => ({
      area,
      evidenceFromPayload:
        'See deterministic report counts and available work.',
      whyItMatters:
        'This gives leaders a usable starting point.'
    })),
    weakestAreas: simplified.weakestAreas.map((issue) => ({
      area: issue,
      issue,
      recommendedFix: issue,
      owner: 'Unknown owner'
    })),
    missingEvidence: simplified.missingEvidence.map((issue) => ({
      sectionOrDeliverable: issue,
      issue,
      neededEvidence:
        'Add a source, assumption, calculation, or structured evidence entry.',
      owner: 'Unknown owner'
    })),
    escalationItems: simplified.escalationItems.map((issue) => ({
      issue,
      escalateTo: 'Co-CEOs / COO',
      reason: 'This may affect final readiness.',
      urgency: 'medium'
    })),
    suggestedTalkingPoints: simplified.suggestedTalkingPoints,
    recommendedNextActions: simplified.recommendedNextActions.map((action) => ({
      action,
      owner: 'Unknown owner',
      urgency: 'medium',
      definitionOfDone:
        'The action is completed and reflected in the deterministic report.'
    })),
    limitations: simplified.limitations,
    safetyReminder: simplified.safetyReminder
  }
}

function fallbackPriority(issue: string): AiReviewCoachingOutput['coachingPriorities'][number] {
  return {
    issue,
    evidenceFromPayload: SIMPLIFIED_EVIDENCE_FALLBACK,
    whyItMatters: 'This affects leadership readiness and team coaching.',
    coachingMove: issue,
    owner: 'Unknown owner',
    urgency: 'medium',
    definitionOfDone:
      'The assigned team updates the section, adds evidence where needed, and prepares it for human review.'
  }
}

function fallbackAction(action: string): AiReviewCoachingOutput['recommendedNextActions'][number] {
  return {
    action,
    owner: 'Unknown owner',
    urgency: 'medium',
    definitionOfDone:
      'The action is completed and reflected in the deterministic report.'
  }
}

export function buildDeterministicCoachingFallback(
  payload: AiReviewReportPayload,
  detail = ''
): AiReviewCoachingOutput {
  const summary = payload.deterministicSummary
  const priorities: AiReviewCoachingOutput['coachingPriorities'] = []
  if (summary.sectionsMissing > 0) {
    priorities.push(fallbackPriority(
      `${summary.sectionsMissing} section${summary.sectionsMissing === 1 ? '' : 's'} need final content before the work is ready for human review.`
    ))
  }
  if (summary.overdueDeliverables > 0) {
    priorities.push(fallbackPriority(
      `${summary.overdueDeliverables} deliverable${summary.overdueDeliverables === 1 ? ' is' : 's are'} overdue and should be resolved or re-scoped.`
    ))
  }
  if (summary.needsRevisionDeliverables > 0) {
    priorities.push(fallbackPriority(
      `${summary.needsRevisionDeliverables} deliverable${summary.needsRevisionDeliverables === 1 ? ' needs' : 's need'} revision before approval can happen.`
    ))
  }
  if (summary.evidenceLinkCount === 0) {
    priorities.push(fallbackPriority(
      'No evidence links are recorded in this report scope.'
    ))
  }
  if (summary.structuredEvidenceCount === 0) {
    priorities.push(fallbackPriority(
      'No structured evidence entries are recorded in this report scope.'
    ))
  }
  if (summary.sectionsWithDraftFallback + summary.sectionsWithSourceNotesFallback > 0) {
    priorities.push(fallbackPriority(
      `${summary.sectionsWithDraftFallback + summary.sectionsWithSourceNotesFallback} section${summary.sectionsWithDraftFallback + summary.sectionsWithSourceNotesFallback === 1 ? ' is' : 's are'} relying on draft or source-note fallback instead of final text.`
    ))
  }
  if (!priorities.length) {
    priorities.push(fallbackPriority(
      'Use the deterministic report to confirm final text, evidence, and review readiness before the next leadership meeting.'
    ))
  }

  const nextActions = [
    'Finish missing final text in the highest-priority chapters.',
    'Add evidence to chapters with weak or missing support.',
    'Resolve overdue deliverables or reset ownership and due dates.',
    'Move ready items into human review.',
    'Use chapter review panels to coach owners on the next concrete revision.'
  ].map(fallbackAction)

  const validated = validateCoachingOutput({
    source: 'deterministic_fallback',
    executiveSummary:
      'Deterministic fallback coaching. AI coaching could not be generated, so this fallback uses deterministic work-state data only.',
    coachingPriorities: priorities,
    strongestAreas: [],
    weakestAreas: [],
    missingEvidence: summary.evidenceLinkCount + summary.structuredEvidenceCount === 0
      ? [{
          sectionOrDeliverable: 'Current report scope',
          issue: 'Evidence coverage is limited or missing.',
          neededEvidence:
            'Add a source, assumption, calculation, or structured evidence entry.',
          owner: 'Unknown owner'
        }]
      : [],
    escalationItems: summary.overdueDeliverables > 0 || summary.needsRevisionDeliverables > 0
      ? [{
          issue: 'Objective work-state gaps may affect final readiness.',
          escalateTo: 'Co-CEOs / COO',
          reason: 'This may affect final readiness.',
          urgency: 'medium'
        }]
      : [],
    suggestedTalkingPoints: [
      `Deterministic readiness is ${payload.deterministicReadiness.label}.`,
      `${summary.sectionsMissing} section(s) are missing content.`,
      `${summary.overdueDeliverables} deliverable(s) are overdue.`
    ],
    recommendedNextActions: nextActions,
    limitations: [
      'AI coaching failed.',
      detail || 'The AI provider did not return a usable coaching format.',
      'Deterministic report remains source of truth.',
      'No student authorship inferred.'
    ],
    safetyReminder: AI_REVIEW_COACHING_SAFETY_REMINDER
  })
  return { ...validated, source: 'deterministic_fallback' }
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
