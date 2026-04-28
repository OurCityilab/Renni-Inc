// Executive Advisor — shared ActionCard schema + validator.
//
// Used by all four Track 4A modes (Daily Command Brief, What's Next,
// Run the Meeting, Assign the Work). The endpoint passes the AI
// response's "action card" payloads through `validateActionCard` so
// the client always receives a well-formed card and so unsafe / loose
// AI output is normalized before it leaves the server.
//
// Posture (do not relax in V1):
//   - Pure data + pure validator. No Firestore, no auth, no I/O.
//   - The validator IS the safety contract: an action card without
//     grounded sourceIds is forced to confidence='low' regardless of
//     what the AI returned. Any dueDateSuggestion later than the
//     linked deliverable's due date is clamped to that date with a
//     note appended to whyThisMatters.
//   - humanReviewRequired is hardcoded `true` here. The AI cannot
//     opt out of human review.
//   - actionId is preserved if the AI supplied a usable string;
//     otherwise the validator generates a stable id of its own so
//     audit-log correlation works either way.

import { randomUUID } from 'node:crypto'

export const ACTION_CARD_OWNER_ROLES = [
  'co_ceo',
  'coo',
  'cfo',
  'cmo',
  'chief_strategy_growth',
  'member',
  'admin'
] as const
export type ActionCardOwnerRole = (typeof ACTION_CARD_OWNER_ROLES)[number]

export const ACTION_CARD_SOURCE_TYPES = [
  'observation',
  'risk',
  'gap',
  'opportunity'
] as const
export type ActionCardSourceType = (typeof ACTION_CARD_SOURCE_TYPES)[number]

export const ACTION_CARD_CONFIDENCE = ['low', 'medium', 'high'] as const
export type ActionCardConfidence = (typeof ACTION_CARD_CONFIDENCE)[number]

export interface SourceIds {
  taskIds?: string[]
  deliverableIds?: string[]
  sectionIds?: string[]
  requirementIds?: string[]
  advisorSignalIds?: string[]
}

export interface ActionCard {
  actionId: string
  title: string
  ownerRole: ActionCardOwnerRole
  suggestedAssigneeName?: string
  suggestedAssigneeUid?: string
  dueDateSuggestion?: string
  dependency: string
  definitionOfDone: string
  playbookChapter?: string
  whyThisMatters: string
  sourceType: ActionCardSourceType
  sourceIds: SourceIds
  confidence: ActionCardConfidence
  // Always true. The AI cannot suggest auto-creation. Included
  // explicitly so consumer code can rely on the presence of the
  // field rather than re-deriving it.
  humanReviewRequired: true
}

// Context the validator needs to apply the due-date guardrail.
// `deliverableDueDates` is a map of deliverableId -> ISO date string.
// When a card's `sourceIds.deliverableIds` contains an id present in
// this map and the AI's suggested date is later than that date, the
// validator clamps the suggestion and notes it.
export interface ActionCardValidationContext {
  deliverableDueDates: Record<string, string>
}

const ALLOWED_OWNER_ROLES = new Set<string>(ACTION_CARD_OWNER_ROLES)
const ALLOWED_SOURCE_TYPES = new Set<string>(ACTION_CARD_SOURCE_TYPES)
const ALLOWED_CONFIDENCE = new Set<string>(ACTION_CARD_CONFIDENCE)

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`actionCard.${field} must be a string`)
  }
  return value
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') {
    throw new Error(`actionCard.${field} must be a string when present`)
  }
  return value
}

function asStringArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new Error(`actionCard.${field} must be an array of strings`)
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`actionCard.${field}[${i}] must be a string`)
    }
  }
  return value as string[]
}

function validateSourceIds(raw: unknown): SourceIds {
  if (raw === undefined || raw === null) return {}
  if (typeof raw !== 'object') {
    throw new Error('actionCard.sourceIds must be an object when present')
  }
  const obj = raw as Record<string, unknown>
  const out: SourceIds = {}
  if (obj.taskIds !== undefined) out.taskIds = asStringArray(obj.taskIds, 'sourceIds.taskIds')
  if (obj.deliverableIds !== undefined) {
    out.deliverableIds = asStringArray(obj.deliverableIds, 'sourceIds.deliverableIds')
  }
  if (obj.sectionIds !== undefined) {
    out.sectionIds = asStringArray(obj.sectionIds, 'sourceIds.sectionIds')
  }
  if (obj.requirementIds !== undefined) {
    out.requirementIds = asStringArray(obj.requirementIds, 'sourceIds.requirementIds')
  }
  if (obj.advisorSignalIds !== undefined) {
    out.advisorSignalIds = asStringArray(obj.advisorSignalIds, 'sourceIds.advisorSignalIds')
  }
  return out
}

function sourceIdsAreEmpty(s: SourceIds): boolean {
  return (
    !(s.taskIds && s.taskIds.length) &&
    !(s.deliverableIds && s.deliverableIds.length) &&
    !(s.sectionIds && s.sectionIds.length) &&
    !(s.requirementIds && s.requirementIds.length) &&
    !(s.advisorSignalIds && s.advisorSignalIds.length)
  )
}

// yyyy-mm-dd lexicographic comparison is correct for ISO-8601 dates
// without time components. We don't try to parse to Date — anything
// the AI returns that isn't a yyyy-mm-dd string stays as-is so
// downstream UI surfaces the original suggestion or the empty state.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isoDateOrNull(value: string | undefined): string | null {
  if (!value) return null
  return ISO_DATE_RE.test(value) ? value : null
}

/**
 * Validates and normalizes one action card from the model output.
 * Throws on shape errors so the endpoint surfaces ai_invalid_response.
 *
 * Coercion rules (applied AFTER shape validation):
 *   1. If sourceIds is empty, confidence is forced to 'low'. The
 *      validator does not throw — coercion is the safety mechanism.
 *   2. If sourceIds.deliverableIds contains an id present in
 *      ctx.deliverableDueDates and the dueDateSuggestion is later
 *      than that date, the suggestion is clamped to the deliverable
 *      due date and a one-sentence note is appended to whyThisMatters.
 *   3. actionId is preserved if it's a non-empty string; otherwise
 *      randomUUID() generates one. The audit log relies on this id.
 *   4. humanReviewRequired is always emitted as `true`. The model
 *      cannot opt out.
 */
export function validateActionCard(
  raw: unknown,
  ctx: ActionCardValidationContext
): ActionCard {
  if (!raw || typeof raw !== 'object') {
    throw new Error('actionCard must be a JSON object')
  }
  const obj = raw as Record<string, unknown>

  const title = asString(obj.title, 'title').trim()
  if (!title) throw new Error('actionCard.title must be a non-empty string')

  const ownerRoleRaw = asString(obj.ownerRole, 'ownerRole')
  if (!ALLOWED_OWNER_ROLES.has(ownerRoleRaw)) {
    throw new Error(
      `actionCard.ownerRole must be one of ${Array.from(ALLOWED_OWNER_ROLES).join(' / ')}`
    )
  }
  const ownerRole = ownerRoleRaw as ActionCardOwnerRole

  const suggestedAssigneeName = asOptionalString(
    obj.suggestedAssigneeName,
    'suggestedAssigneeName'
  )
  const suggestedAssigneeUid = asOptionalString(
    obj.suggestedAssigneeUid,
    'suggestedAssigneeUid'
  )
  const dueDateSuggestionRaw = asOptionalString(
    obj.dueDateSuggestion,
    'dueDateSuggestion'
  )

  const dependency = asString(obj.dependency, 'dependency')
  const definitionOfDone = asString(obj.definitionOfDone, 'definitionOfDone')
  const playbookChapter = asOptionalString(obj.playbookChapter, 'playbookChapter')

  let whyThisMatters = asString(obj.whyThisMatters, 'whyThisMatters')

  const sourceTypeRaw = asString(obj.sourceType, 'sourceType')
  if (!ALLOWED_SOURCE_TYPES.has(sourceTypeRaw)) {
    throw new Error(
      `actionCard.sourceType must be one of ${Array.from(ALLOWED_SOURCE_TYPES).join(' / ')}`
    )
  }
  const sourceType = sourceTypeRaw as ActionCardSourceType

  const sourceIds = validateSourceIds(obj.sourceIds)

  const confidenceRaw = asString(obj.confidence, 'confidence')
  if (!ALLOWED_CONFIDENCE.has(confidenceRaw)) {
    throw new Error(
      `actionCard.confidence must be one of ${Array.from(ALLOWED_CONFIDENCE).join(' / ')}`
    )
  }
  let confidence = confidenceRaw as ActionCardConfidence

  // --- coercions -----------------------------------------------------

  // Rule 1: ungrounded card → confidence='low'.
  if (sourceIdsAreEmpty(sourceIds)) {
    confidence = 'low'
  }

  // Rule 2: clamp dueDateSuggestion to linked deliverable's due date
  // when later. We only consider the FIRST deliverable id in the
  // sourceIds — multiple deliverable ids on a single action card is
  // unusual and we'd rather not guess which deliverable's date the
  // suggestion was modeled against.
  let dueDateSuggestion = dueDateSuggestionRaw
  const candidate = isoDateOrNull(dueDateSuggestion)
  const linkedId = sourceIds.deliverableIds?.[0]
  if (candidate && linkedId) {
    const deliverableDue = isoDateOrNull(ctx.deliverableDueDates[linkedId])
    if (deliverableDue && candidate > deliverableDue) {
      dueDateSuggestion = deliverableDue
      whyThisMatters = `${whyThisMatters} Due date adjusted to align with linked deliverable.`.trim()
    }
  }

  // Rule 3: stable actionId.
  const candidateId = asOptionalString(obj.actionId, 'actionId')
  const actionId = candidateId && candidateId.trim() ? candidateId : randomUUID()

  return {
    actionId,
    title,
    ownerRole,
    suggestedAssigneeName,
    suggestedAssigneeUid,
    dueDateSuggestion,
    dependency,
    definitionOfDone,
    playbookChapter,
    whyThisMatters,
    sourceType,
    sourceIds,
    confidence,
    humanReviewRequired: true
  }
}

export function validateActionCardArray(
  raw: unknown,
  field: string,
  ctx: ActionCardValidationContext
): ActionCard[] {
  if (!Array.isArray(raw)) {
    throw new Error(`${field} must be an array of action cards`)
  }
  return raw.map((c, i) => {
    try {
      return validateActionCard(c, ctx)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new Error(`${field}[${i}] failed validation: ${msg}`)
    }
  })
}

/**
 * Builds the deliverable due-date map the validator needs for the
 * due-date guardrail. Accepts any object exposing a `deliverables`
 * array with `id` + nullable `dueDate` — works for both the
 * Track 3 ExecutiveContextPackage shape (server/utils/executiveContext.ts)
 * and any future shape that conforms.
 */
export function buildDueDateMapFromDeliverables(
  deliverables: ReadonlyArray<{ id: string; dueDate?: string | null }>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of deliverables) {
    if (typeof d.dueDate === 'string' && d.dueDate.length > 0) {
      out[d.id] = d.dueDate
    }
  }
  return out
}
