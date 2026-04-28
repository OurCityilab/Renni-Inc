// Customer Profile Builder V1 — deterministic classifier (Layer 2).
//
// PURPOSE
// -------
// Pure deterministic function that reads a `CustomerProfilePrimitiveSelections`
// input and returns a `CustomerProfileClassifierOutput`. Same input
// always produces the same output. No AI, no Firestore, no network,
// no Vue runtime.
//
// PIPELINE
// --------
//   1. Validate input (required axes present, conditional axis check).
//   2. Apply CFS hard prerequisite (drop if not met).
//   3. Score each eligible archetype across the 8 scoring axes.
//   4. Apply per-axis caps (single-select +3, shopping-media +6,
//      purchase-motivation +5; CFS supporting-a-cause +5 override
//      bypasses the motivation cap).
//   5. Apply negative-signal subtractions (already encoded as -2
//      values in the signal map; nothing extra to do per archetype).
//   6. Normalize to 0–100.
//   7. Determine primary (highest above minimumFitThreshold).
//   8. Determine secondary (close-runner-up OR CFS overlay if eligible).
//   9. Compute archetype-derived + evidence-derived confidence;
//      finalConfidence = MIN of the two.
//  10. Apply per-archetype confidence floors (RFI / MUH / CFS).
//  11. Lower confidence one band per `other` write-in selection.
//  12. Build student-facing explanation fields. NO numeric scores
//      appear in any student-facing field.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure function. No randomness, no I/O.
//   - Stateless. Does not read Firestore, files, or env vars.
//   - Honest about uncertainty. When inputs do not support a confident
//     classification, returns `status: 'not_available'` with the top
//     three closest archetypes and a plain-language explanation.
//   - Never gates submit, approval, or status. The student is the
//     author of record.

// Relative imports (not `~/`) so this file is loadable by `tsx` for
// the test runner — the audit-script convention.
import {
  CUSTOMER_PROFILE_ARCHETYPE_BY_ID,
  CUSTOMER_PROFILE_ARCHETYPE_IDS
} from '../data/customerProfileArchetypes'
import {
  CALIBRATION,
  SIGNAL_MAP,
  SUPPORTING_A_CAUSE_OVERRIDE_SCORE,
  type ArchetypeSignalMap
} from '../data/customerProfileSignalMap'
import {
  CONFIDENCE_PHRASES,
  EXPLANATION_TEMPLATES,
  NO_FIT_REASONS,
  resolveSignalLabel
} from '../data/customerProfileExplanationTemplates'
import type {
  ClassifierTeacherDebug,
  CustomerProfileArchetypeId,
  CustomerProfileClassifierOutput,
  CustomerProfilePrimitiveSelections,
  DocumentedEvidenceFlags
} from '../types/sectionEngines'

/* -------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------ */

type ConfidenceBand = 'low' | 'medium' | 'high'

const CONFIDENCE_RANK: Record<ConfidenceBand, number> = {
  low: 0,
  medium: 1,
  high: 2
}

const BAND_BY_RANK: ConfidenceBand[] = ['low', 'medium', 'high']

const SCORING_AXIS_IDS: readonly (keyof ArchetypeSignalMap)[] = [
  'life-stage',
  'household-composition',
  'urbanicity',
  'spending-capacity',
  'tight-budget-detail',
  'housing-context',
  'education-occupation',
  'shopping-media-behavior',
  'purchase-motivation'
] as const

/* -------------------------------------------------------------------
 * Public API
 * ------------------------------------------------------------------ */

/**
 * Classify a customer profile from primitive selections.
 *
 * @param selections - The student-authored primitive picks.
 * @param flags - Optional teacher / curriculum-managed evidence
 *   flags. Affect confidence floors only.
 * @returns A `CustomerProfileClassifierOutput` shape compatible with
 *   the existing `SectionClassifierOutput` consumed by the
 *   section-articulation-feedback endpoint.
 */
export function classifyCustomerProfile(
  selections: CustomerProfilePrimitiveSelections,
  flags: DocumentedEvidenceFlags = {}
): CustomerProfileClassifierOutput {
  // ---- 1. Validate ------------------------------------------------
  const validationError = validateSelections(selections)
  if (validationError) {
    return buildInvalidOutput(validationError)
  }

  // ---- 2. CFS hard prerequisite ----------------------------------
  const causeFirstEligible = isCauseFirstEligible(selections)

  // ---- 3–6. Score, cap, negative, normalize -----------------------
  const scoresRaw: Record<CustomerProfileArchetypeId, number> = {} as Record<
    CustomerProfileArchetypeId,
    number
  >
  for (const archetypeId of CUSTOMER_PROFILE_ARCHETYPE_IDS) {
    if (archetypeId === 'cause-first-supporters' && !causeFirstEligible) {
      // Hard-prereq drop. CFS does not appear in the score table.
      scoresRaw[archetypeId] = -Infinity
      continue
    }
    scoresRaw[archetypeId] = scoreArchetype(archetypeId, selections)
  }
  const scoresNormalized = normalizeScores(scoresRaw)

  // ---- 7. Determine primary --------------------------------------
  const ranked = rankArchetypes(scoresNormalized)
  const writeInCount = countWriteIns(selections)

  // No-confident-fit path
  if (
    ranked.length === 0 ||
    ranked[0]!.score < CALIBRATION.minimumFitThreshold
  ) {
    return buildNoConfidentFitOutput(ranked, writeInCount)
  }

  const primary = ranked[0]!
  const runnerUp = ranked[1]
  const margin = runnerUp ? primary.score - runnerUp.score : primary.score

  // ---- 8. Determine secondary ------------------------------------
  const secondary = chooseSecondary({
    primaryId: primary.id,
    runnerUp,
    margin,
    causeFirstEligible,
    scoresNormalized
  })

  // ---- 9. Confidence (archetype-derived, evidence-derived, MIN) --
  const archetypeDerived = computeArchetypeDerivedConfidence(
    primary.score,
    margin
  )
  const evidenceDerived = computeEvidenceDerivedConfidence(
    selections['evidence-confidence']
  )
  let finalConfidence = minBand(archetypeDerived, evidenceDerived)
  const flooredBy: ClassifierTeacherDebug['flooredBy'] =
    CONFIDENCE_RANK[archetypeDerived] < CONFIDENCE_RANK[evidenceDerived]
      ? 'archetype'
      : CONFIDENCE_RANK[archetypeDerived] > CONFIDENCE_RANK[evidenceDerived]
        ? 'evidence'
        : 'tie'

  // ---- 10. Per-archetype confidence floors -----------------------
  // Each floor caps confidence at 'medium' unless the corresponding
  // documented-evidence flag is set. `appliedFloor` records ONLY
  // when the cap actually constrains the result — so the debug field
  // honestly reflects whether the floor changed anything for this
  // particular call.
  let appliedFloor: ClassifierTeacherDebug['appliedFloor'] | undefined
  if (
    primary.id === 'rural-fixed-income-households' &&
    !flags.evidenceFromRuralRespondents
  ) {
    const capped = capBand(finalConfidence, 'medium')
    if (capped !== finalConfidence) appliedFloor = 'rural-fixed-income'
    finalConfidence = capped
  } else if (
    primary.id === 'multigenerational-urban-households' &&
    !flags.evidenceFromMultigenerationalHousehold
  ) {
    const capped = capBand(finalConfidence, 'medium')
    if (capped !== finalConfidence) appliedFloor = 'multigenerational-urban'
    finalConfidence = capped
  } else if (
    (primary.id === 'cause-first-supporters' ||
      secondary?.id === 'cause-first-supporters') &&
    !flags.evidenceAboutCauseMotivation
  ) {
    const capped = capBand(finalConfidence, 'medium')
    if (capped !== finalConfidence) appliedFloor = 'cause-first'
    finalConfidence = capped
  }

  // ---- 11. Write-in lowering -------------------------------------
  if (writeInCount > 0) {
    finalConfidence = lowerBand(finalConfidence, writeInCount)
  }

  // ---- 12. Build explanation -------------------------------------
  const explanationFields = buildExplanationFields({
    primaryId: primary.id,
    secondary,
    selections,
    archetypeDerived,
    evidenceDerived,
    flooredBy,
    appliedFloor,
    writeInCount,
    finalConfidence
  })

  // ---- Teacher debug payload -------------------------------------
  const teacherDebug: ClassifierTeacherDebug = {
    scores: scoresNormalized,
    marginsToRunnerUp: computeAllMarginsToRunnerUp(ranked),
    archetypeDerivedConfidence: archetypeDerived,
    evidenceDerivedConfidence: evidenceDerived,
    flooredBy,
    appliedFloor,
    causeFirstPrerequisiteFailed: !causeFirstEligible,
    writeInCount
  }

  return {
    status: 'ready',
    primaryArchetypeId: primary.id,
    secondaryArchetypeId: secondary?.id,
    secondaryIsOverlay: secondary?.isOverlay ?? false,
    overlapArchetypeIds: secondary ? [secondary.id] : undefined,
    confidence: finalConfidence,
    confidenceWhyItIsThisLevel: explanationFields.confidenceWhy,
    topContributingSignals: explanationFields.topContributingSignals,
    contradictingSignals: explanationFields.contradictingSignals,
    whatToTestNext: explanationFields.whatToTestNext,
    explanation: explanationFields.explanation,
    teacherDebug
  }
}

/* -------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------ */

function validateSelections(
  selections: CustomerProfilePrimitiveSelections
): string | null {
  if (!selections || typeof selections !== 'object') {
    return 'Primitive selections must be an object.'
  }
  const requiredAxes: (keyof CustomerProfilePrimitiveSelections)[] = [
    'life-stage',
    'household-composition',
    'urbanicity',
    'spending-capacity',
    'housing-context',
    'education-occupation',
    'shopping-media-behavior',
    'purchase-motivation',
    'evidence-confidence'
  ]
  for (const axis of requiredAxes) {
    if (selections[axis] === undefined || selections[axis] === null) {
      return `Required primitive "${axis}" is missing.`
    }
  }
  // Conditional: tight-budget-detail is required when spending-capacity = tight
  if (
    selections['spending-capacity'] === 'tight' &&
    !selections['tight-budget-detail']
  ) {
    return 'When spending-capacity is "tight", tight-budget-detail is required.'
  }
  // shopping-media-behavior multi-select rules
  const shopping = selections['shopping-media-behavior']
  if (!Array.isArray(shopping) || shopping.length < 1 || shopping.length > 3) {
    return 'shopping-media-behavior must be an array of 1–3 option ids.'
  }
  // purchase-motivation primary required
  const motivation = selections['purchase-motivation']
  if (
    !motivation ||
    typeof motivation !== 'object' ||
    typeof motivation.primary !== 'string' ||
    motivation.primary.length === 0
  ) {
    return 'purchase-motivation.primary is required.'
  }
  return null
}

function buildInvalidOutput(message: string): CustomerProfileClassifierOutput {
  return {
    status: 'not_available',
    explanation: `Input invalid: ${message}`,
    topContributingSignals: [],
    contradictingSignals: [],
    closestArchetypeIds: []
  }
}

/* -------------------------------------------------------------------
 * Cause-First eligibility (hard prerequisite)
 * ------------------------------------------------------------------ */

function isCauseFirstEligible(
  selections: CustomerProfilePrimitiveSelections
): boolean {
  const m = selections['purchase-motivation']
  return (
    m.primary === 'supporting-a-cause' || m.secondary === 'supporting-a-cause'
  )
}

/* -------------------------------------------------------------------
 * Scoring
 * ------------------------------------------------------------------ */

function scoreArchetype(
  archetypeId: CustomerProfileArchetypeId,
  selections: CustomerProfilePrimitiveSelections
): number {
  const archetypeMap = SIGNAL_MAP[archetypeId]
  let total = 0

  for (const axisId of SCORING_AXIS_IDS) {
    const axisMap = archetypeMap[axisId]
    if (!axisMap) continue

    if (axisId === 'shopping-media-behavior') {
      const picks = selections['shopping-media-behavior']
      let axisSum = 0
      for (const pick of picks) {
        axisSum += axisMap[pick] ?? 0
      }
      // Cap at +6 (positives only — negatives are not capped, they fully
      // subtract).
      if (axisSum > CALIBRATION.shoppingMediaCap) {
        axisSum = CALIBRATION.shoppingMediaCap
      }
      total += axisSum
      continue
    }

    if (axisId === 'purchase-motivation') {
      const m = selections['purchase-motivation']
      const primaryRaw = axisMap[m.primary] ?? 0
      const secondaryRaw =
        m.secondary !== undefined ? (axisMap[m.secondary] ?? 0) : 0

      // The +5 supporting-a-cause CFS override bypasses the per-axis
      // motivation cap by curriculum decision. Detect it and apply
      // it BEFORE capping.
      const isCfsOverride =
        archetypeId === 'cause-first-supporters' &&
        (m.primary === 'supporting-a-cause' ||
          m.secondary === 'supporting-a-cause')

      if (isCfsOverride) {
        // Add the override directly. The other motivation contribution
        // (whichever is not the cause selection) is added on top, and
        // the whole thing remains uncapped per CFS posture.
        let cfsTotal = 0
        if (m.primary === 'supporting-a-cause') {
          cfsTotal += SUPPORTING_A_CAUSE_OVERRIDE_SCORE
          cfsTotal += secondaryRaw
        } else {
          cfsTotal += primaryRaw
          cfsTotal += SUPPORTING_A_CAUSE_OVERRIDE_SCORE
        }
        total += cfsTotal
        continue
      }

      // Normal cap: primary +3, secondary +2 implicit through the
      // signal-map values, total cap +5 across both. Apply the cap
      // only to the positive sum; negatives still subtract fully.
      const positiveSum = Math.max(0, primaryRaw) + Math.max(0, secondaryRaw)
      const negativeSum = Math.min(0, primaryRaw) + Math.min(0, secondaryRaw)
      const cappedPositive = Math.min(
        positiveSum,
        CALIBRATION.purchaseMotivationCap
      )
      total += cappedPositive + negativeSum
      continue
    }

    // Single-select axes: read the selected option id from
    // `selections[axisId]`. tight-budget-detail is conditional and may
    // be undefined; in that case it contributes 0.
    const selectedId = (selections as unknown as Record<string, unknown>)[axisId]
    if (typeof selectedId !== 'string') continue
    const score = axisMap[selectedId] ?? 0
    // Defensive cap on positive single-select contributions (the +5
    // CFS override is only on the motivation axis and is handled above).
    const capped =
      score > CALIBRATION.singleSelectCap ? CALIBRATION.singleSelectCap : score
    total += capped
  }

  return total
}

function normalizeScores(
  raw: Record<CustomerProfileArchetypeId, number>
): Record<CustomerProfileArchetypeId, number> {
  const out: Record<CustomerProfileArchetypeId, number> = {} as Record<
    CustomerProfileArchetypeId,
    number
  >
  const max = CALIBRATION.theoreticalMaxScore
  for (const id of CUSTOMER_PROFILE_ARCHETYPE_IDS) {
    const v = raw[id]
    if (v === -Infinity) {
      // CFS dropped by hard-prereq. Keep at -Infinity so it never
      // ranks; reported as 0 in the debug payload would be misleading.
      out[id] = -Infinity
      continue
    }
    if (v <= 0) {
      out[id] = 0
      continue
    }
    const normalized = Math.round((v / max) * 100)
    out[id] = normalized > 100 ? 100 : normalized
  }
  return out
}

/* -------------------------------------------------------------------
 * Ranking + secondary selection
 * ------------------------------------------------------------------ */

interface RankedArchetype {
  id: CustomerProfileArchetypeId
  score: number
  isOverlay: boolean
}

function rankArchetypes(
  scores: Record<CustomerProfileArchetypeId, number>
): RankedArchetype[] {
  return CUSTOMER_PROFILE_ARCHETYPE_IDS.filter((id) => scores[id] > 0)
    .map((id) => ({
      id,
      score: scores[id],
      isOverlay: CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id].isOverlay
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      // Tiebreaker 1: higher curriculum priority wins (more
      // SPECIALIZED archetypes beat more GENERAL archetypes — see
      // `tiebreakerPriority` doc on CustomerProfileArchetypeRecord).
      const pa = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[a.id].tiebreakerPriority
      const pb = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[b.id].tiebreakerPriority
      if (pa !== pb) return pb - pa
      // Tiebreaker 2: alphabetical id for determinism.
      return a.id.localeCompare(b.id)
    })
}

interface SecondarySelection {
  id: CustomerProfileArchetypeId
  isOverlay: boolean
}

function chooseSecondary(input: {
  primaryId: CustomerProfileArchetypeId
  runnerUp: RankedArchetype | undefined
  margin: number
  causeFirstEligible: boolean
  scoresNormalized: Record<CustomerProfileArchetypeId, number>
}): SecondarySelection | null {
  const { primaryId, runnerUp, margin, causeFirstEligible } = input

  // CFS overlay path: if the hard prereq is met AND CFS is not
  // already primary, report CFS as the overlay secondary. This
  // expresses the V1 contract that CFS is usually an overlay (data
  // pack §4.3). CFS does NOT need to clear the minimum-fit threshold
  // — it is motivation-defined and only scores on two axes, so its
  // raw score is naturally lower than geo / demo archetypes. The
  // hard prerequisite IS the qualification.
  if (causeFirstEligible && primaryId !== 'cause-first-supporters') {
    return { id: 'cause-first-supporters', isOverlay: true }
  }

  // Close-runner-up path
  if (runnerUp && margin <= CALIBRATION.closeRunnerUpThreshold) {
    return { id: runnerUp.id, isOverlay: runnerUp.isOverlay }
  }

  return null
}

/* -------------------------------------------------------------------
 * Confidence
 * ------------------------------------------------------------------ */

function computeArchetypeDerivedConfidence(
  primaryScore: number,
  marginToRunnerUp: number
): ConfidenceBand {
  if (
    marginToRunnerUp >= CALIBRATION.highConfidenceMargin &&
    primaryScore >= CALIBRATION.highConfidenceMinimumScore
  ) {
    return 'high'
  }
  if (
    marginToRunnerUp >= CALIBRATION.mediumConfidenceMargin &&
    primaryScore >= CALIBRATION.mediumConfidenceMinimumScore
  ) {
    return 'medium'
  }
  return 'low'
}

function computeEvidenceDerivedConfidence(
  selection: CustomerProfilePrimitiveSelections['evidence-confidence']
): ConfidenceBand {
  switch (selection) {
    case 'high-strong-evidence':
      return 'high'
    case 'medium-some-evidence':
      return 'medium'
    case 'low-assumption':
    default:
      return 'low'
  }
}

function minBand(a: ConfidenceBand, b: ConfidenceBand): ConfidenceBand {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b
}

function capBand(current: ConfidenceBand, ceiling: ConfidenceBand): ConfidenceBand {
  return CONFIDENCE_RANK[current] <= CONFIDENCE_RANK[ceiling]
    ? current
    : ceiling
}

function lowerBand(current: ConfidenceBand, steps: number): ConfidenceBand {
  const newRank = Math.max(0, CONFIDENCE_RANK[current] - steps)
  return BAND_BY_RANK[newRank]!
}

/* -------------------------------------------------------------------
 * Write-in counting
 * ------------------------------------------------------------------ */

function countWriteIns(
  selections: CustomerProfilePrimitiveSelections
): number {
  let count = 0
  const singleSelectAxes: (keyof CustomerProfilePrimitiveSelections)[] = [
    'life-stage',
    'household-composition',
    'urbanicity',
    'spending-capacity',
    'housing-context',
    'education-occupation'
  ]
  for (const axis of singleSelectAxes) {
    if (selections[axis] === 'other') count++
  }
  return count
}

/* -------------------------------------------------------------------
 * No-confident-fit path
 * ------------------------------------------------------------------ */

function buildNoConfidentFitOutput(
  ranked: RankedArchetype[],
  writeInCount: number
): CustomerProfileClassifierOutput {
  const closest = ranked.slice(0, 3).map((r) => r.id)

  // Choose a reason phrase. Prioritize multiple write-ins, then
  // multiple-close ambiguity, then the default "no archetype above
  // threshold."
  let reason: string = NO_FIT_REASONS.noArchetypeAboveThreshold
  if (writeInCount >= 2) {
    reason = NO_FIT_REASONS.multipleWriteIns
  } else if (
    ranked.length >= 3 &&
    ranked[0]!.score - ranked[2]!.score <= CALIBRATION.closeRunnerUpThreshold
  ) {
    reason = NO_FIT_REASONS.multipleClose
  }

  // Build the closest-archetypes list as a markdown ordered list of
  // working display names.
  const closestList = closest
    .map((id, i) => {
      const record = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id]
      return `${i + 1}. ${record.workingDisplayName}`
    })
    .join('\n')

  const explanation = EXPLANATION_TEMPLATES['no-confident-fit'].template
    .replace('{{closestArchetypesList}}', closestList || '(no candidate archetypes scored above 0)')
    .replace('{{noFitReason}}', `${reason} ${NO_FIT_REASONS.knownGap}`.trim())

  return {
    status: 'not_available',
    closestArchetypeIds: closest,
    topContributingSignals: [],
    contradictingSignals: [],
    explanation
  }
}

/* -------------------------------------------------------------------
 * Margins debug helper
 * ------------------------------------------------------------------ */

function computeAllMarginsToRunnerUp(
  ranked: RankedArchetype[]
): Record<string, number> {
  const out: Record<string, number> = {}
  for (let i = 0; i < ranked.length; i++) {
    const next = ranked[i + 1]
    out[ranked[i]!.id] = next ? ranked[i]!.score - next.score : ranked[i]!.score
  }
  return out
}

/* -------------------------------------------------------------------
 * Explanation field assembly
 * ------------------------------------------------------------------ */

interface ExplanationBuildInput {
  primaryId: CustomerProfileArchetypeId
  secondary: SecondarySelection | null
  selections: CustomerProfilePrimitiveSelections
  archetypeDerived: ConfidenceBand
  evidenceDerived: ConfidenceBand
  flooredBy: ClassifierTeacherDebug['flooredBy']
  appliedFloor: ClassifierTeacherDebug['appliedFloor'] | undefined
  writeInCount: number
  finalConfidence: ConfidenceBand
}

interface ExplanationFields {
  topContributingSignals: string[]
  contradictingSignals: string[]
  confidenceWhy: string
  whatToTestNext: string
  explanation: string
}

function buildExplanationFields(
  input: ExplanationBuildInput
): ExplanationFields {
  const { primaryId, secondary, selections } = input
  const primaryRecord = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[primaryId]

  const top = collectTopContributingSignals(primaryId, selections)
  const contra = collectContradictingSignals(primaryId, selections)

  const confidenceWhy = composeConfidenceWhy(input)
  const whatToTestNext = composeWhatToTestNext(input)

  const templateId = chooseTemplate(input)
  const template = EXPLANATION_TEMPLATES[templateId].template

  const explanation = renderTemplate(template, {
    primaryName: primaryRecord.workingDisplayName,
    primaryShortName: primaryRecord.shortStudentFacingName,
    primaryOneLineSummary: primaryRecord.oneSentenceSummary,
    secondaryName: secondary
      ? CUSTOMER_PROFILE_ARCHETYPE_BY_ID[secondary.id].workingDisplayName
      : '',
    secondaryOneLineSummary: secondary
      ? CUSTOMER_PROFILE_ARCHETYPE_BY_ID[secondary.id].oneSentenceSummary
      : '',
    topContributingSignalsList: bulletList(top),
    contradictingSignalsList: bulletList(contra),
    confidenceBand: input.finalConfidence,
    confidenceWhy,
    whatToTestNext
  })

  return {
    topContributingSignals: top,
    contradictingSignals: contra,
    confidenceWhy,
    whatToTestNext,
    explanation
  }
}

function chooseTemplate(
  input: ExplanationBuildInput
): keyof typeof EXPLANATION_TEMPLATES {
  if (input.secondary?.isOverlay) return 'cause-first-overlay'
  if (
    input.finalConfidence === 'low' &&
    input.evidenceDerived === 'low' &&
    input.flooredBy === 'evidence'
  ) {
    return 'low-evidence-overlay'
  }
  if (
    collectContradictingSignalsCount(input.primaryId, input.selections) > 0 &&
    !input.secondary
  ) {
    return 'contradictory-signals'
  }
  if (input.secondary) return 'primary-with-secondary'
  return 'clean-primary'
}

function collectTopContributingSignals(
  primaryId: CustomerProfileArchetypeId,
  selections: CustomerProfilePrimitiveSelections
): string[] {
  const map = SIGNAL_MAP[primaryId]
  const candidates: { label: string; weight: number }[] = []

  for (const axisId of SCORING_AXIS_IDS) {
    const axisMap = map[axisId]
    if (!axisMap) continue

    if (axisId === 'shopping-media-behavior') {
      for (const pick of selections['shopping-media-behavior']) {
        const w = axisMap[pick] ?? 0
        if (w > 0) {
          candidates.push({ label: resolveSignalLabel(axisId, pick), weight: w })
        }
      }
      continue
    }

    if (axisId === 'purchase-motivation') {
      const m = selections['purchase-motivation']
      const wPrimary = axisMap[m.primary] ?? 0
      if (wPrimary > 0) {
        candidates.push({
          label: resolveSignalLabel(axisId, m.primary),
          weight: wPrimary
        })
      }
      if (m.secondary !== undefined) {
        const wSecondary = axisMap[m.secondary] ?? 0
        if (wSecondary > 0) {
          candidates.push({
            label: resolveSignalLabel(axisId, m.secondary),
            weight: wSecondary
          })
        }
      }
      continue
    }

    const selectedId = (selections as unknown as Record<string, unknown>)[axisId]
    if (typeof selectedId !== 'string') continue
    const w = axisMap[selectedId] ?? 0
    if (w > 0) {
      candidates.push({ label: resolveSignalLabel(axisId, selectedId), weight: w })
    }
  }

  candidates.sort((a, b) => b.weight - a.weight)
  return candidates.slice(0, 3).map((c) => c.label)
}

function collectContradictingSignals(
  primaryId: CustomerProfileArchetypeId,
  selections: CustomerProfilePrimitiveSelections
): string[] {
  const map = SIGNAL_MAP[primaryId]
  const candidates: { label: string; weight: number }[] = []

  for (const axisId of SCORING_AXIS_IDS) {
    const axisMap = map[axisId]
    if (!axisMap) continue

    if (axisId === 'shopping-media-behavior') {
      for (const pick of selections['shopping-media-behavior']) {
        const w = axisMap[pick] ?? 0
        if (w < 0) {
          candidates.push({ label: resolveSignalLabel(axisId, pick), weight: w })
        }
      }
      continue
    }

    if (axisId === 'purchase-motivation') {
      const m = selections['purchase-motivation']
      const wPrimary = axisMap[m.primary] ?? 0
      if (wPrimary < 0) {
        candidates.push({
          label: resolveSignalLabel(axisId, m.primary),
          weight: wPrimary
        })
      }
      if (m.secondary !== undefined) {
        const wSecondary = axisMap[m.secondary] ?? 0
        if (wSecondary < 0) {
          candidates.push({
            label: resolveSignalLabel(axisId, m.secondary),
            weight: wSecondary
          })
        }
      }
      continue
    }

    const selectedId = (selections as unknown as Record<string, unknown>)[axisId]
    if (typeof selectedId !== 'string') continue
    const w = axisMap[selectedId] ?? 0
    if (w < 0) {
      candidates.push({ label: resolveSignalLabel(axisId, selectedId), weight: w })
    }
  }

  // Most-negative first.
  candidates.sort((a, b) => a.weight - b.weight)
  return candidates.slice(0, 2).map((c) => c.label)
}

function collectContradictingSignalsCount(
  primaryId: CustomerProfileArchetypeId,
  selections: CustomerProfilePrimitiveSelections
): number {
  return collectContradictingSignals(primaryId, selections).length
}

function composeConfidenceWhy(input: ExplanationBuildInput): string {
  const phrases: string[] = []
  if (input.appliedFloor === 'rural-fixed-income') {
    phrases.push(CONFIDENCE_PHRASES.appliedFloorRural)
  } else if (input.appliedFloor === 'multigenerational-urban') {
    phrases.push(CONFIDENCE_PHRASES.appliedFloorMultigen)
  } else if (input.appliedFloor === 'cause-first') {
    phrases.push(CONFIDENCE_PHRASES.appliedFloorCauseFirst)
  } else {
    if (input.finalConfidence === 'high') {
      phrases.push(CONFIDENCE_PHRASES.high)
    } else if (input.finalConfidence === 'medium') {
      if (input.flooredBy === 'evidence') {
        phrases.push(CONFIDENCE_PHRASES.mediumEvidenceFloor)
      } else {
        phrases.push(CONFIDENCE_PHRASES.mediumArchetypeFloor)
      }
    } else {
      if (input.flooredBy === 'evidence') {
        phrases.push(CONFIDENCE_PHRASES.lowEvidenceFloor)
      } else {
        phrases.push(CONFIDENCE_PHRASES.lowArchetypeFloor)
      }
    }
  }
  if (input.writeInCount > 0) {
    phrases.push(CONFIDENCE_PHRASES.writeInLowering)
  }
  return phrases.join(' ')
}

function composeWhatToTestNext(input: ExplanationBuildInput): string {
  const primaryRecord = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[input.primaryId]
  if (input.appliedFloor === 'rural-fixed-income') {
    return 'Interview at least one resident of a rural area or very small town and log the conversation as evidence.'
  }
  if (input.appliedFloor === 'multigenerational-urban') {
    return 'Interview at least one confirmed multigenerational household and log the conversation as evidence.'
  }
  if (input.appliedFloor === 'cause-first') {
    return 'Interview a supporter and document WHY they show up — not just THAT they show up.'
  }
  if (input.evidenceDerived === 'low') {
    return `Talk to 2–3 more people who fit the ${primaryRecord.shortStudentFacingName} profile and capture what they actually say.`
  }
  if (input.secondary && !input.secondary.isOverlay) {
    const secondaryRecord = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[input.secondary.id]
    return `Gather evidence that distinguishes ${primaryRecord.shortStudentFacingName} from ${secondaryRecord.shortStudentFacingName} — interviews about the dominant motivation are usually the cleanest split.`
  }
  return `Confirm the assumptions behind ${primaryRecord.shortStudentFacingName} with 2–3 more interviews or comparable-product checks.`
}

function bulletList(items: string[]): string {
  if (items.length === 0) return '- (none)'
  return items.map((i) => `- ${i}`).join('\n')
}

function renderTemplate(
  template: string,
  values: Record<string, string>
): string {
  let out = template
  for (const [key, value] of Object.entries(values)) {
    out = out.split(`{{${key}}}`).join(value)
  }
  return out
}
