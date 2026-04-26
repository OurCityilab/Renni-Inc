// Pure deterministic helpers for the Brand Fit Builder. Lives outside
// the component so the editor's auto-summary, the Playbook-ready
// preview rollup, and any future cross-chapter reference panel share
// one source of truth for the wording. No Vue / Firestore / AI deps.
//
// Posture: never invent identity choices the team has not entered;
// describe what the inputs already say. The summary is a read-back of
// the team's own decisions plus a single tradeoff/risk line, not a
// recommendation engine.

import type {
  BrandFitAlignment,
  BrandFitAudiencePerception,
  BrandFitBuilder,
  BrandFitProductionCheck,
  BrandFitProductionUseCase,
  BrandFitReferenceBrand,
  BrandFitRiskLevel
} from '~/types/models'

const ALIGNMENT_LABEL: Record<BrandFitAlignment, string> = {
  '': 'not set',
  strong: 'strong',
  partial: 'partial',
  weak: 'weak',
  unsure: 'not sure'
}

const RISK_LEVEL_SCORE: Record<BrandFitRiskLevel, number> = {
  '': 0,
  low: 1,
  medium: 2,
  high: 3
}

// --- reference brand feedback --------------------------------------
// Single-line student-facing message describing what a reference is
// useful for and what it is not. Pure helper — first-match-wins.
export interface ReferenceBrandFeedback {
  message: string
}

export function buildReferenceBrandFeedback(
  ref: BrandFitReferenceBrand
): ReferenceBrandFeedback | null {
  const align = ref.alignment ?? ''
  const hasPriceQuality = Boolean(ref.priceQualitySignal?.trim())
  const hasVisual = Boolean(ref.visualSignal?.trim())
  const hasCustomer = Boolean(ref.likelyCustomer?.trim())
  const hasVoice = Boolean(ref.voiceSignal?.trim())
  const hasLesson = Boolean(ref.lessonForRenni?.trim())

  if (!align && !hasPriceQuality && !hasVisual && !hasCustomer && !hasVoice && !hasLesson) {
    return null
  }

  if (align === 'strong' && hasPriceQuality) {
    return {
      message:
        'Useful premium reference: helps with quality and price signal, but confirm the target customer is not different from your intended buyer.'
    }
  }
  if (align === 'strong' && hasVisual && !hasCustomer) {
    return {
      message:
        'Useful style reference: helps visual direction but does not prove demand. Pair with a customer reference before relying on it for buyer logic.'
    }
  }
  if (hasCustomer && (align === 'strong' || align === 'partial')) {
    return {
      message:
        'Useful customer reference: helps describe who the brand may attract. Confirm the brand actually targets that buyer rather than just being worn by them.'
    }
  }
  if (ref.brandOrExample?.trim()?.toLowerCase().includes('channel') || align === 'partial') {
    return {
      message:
        'Useful channel reference: helps retail or display thinking but does not prove brand fit. Find a closer example for price + customer.'
    }
  }
  if (align === 'weak' || align === 'unsure') {
    return {
      message:
        'Weak reference: explain what specific lesson applies or find a closer example. Use references to learn signals, not to copy.'
    }
  }
  return {
    message:
      'Mark alignment and a specific lesson so this reference can be used as evidence — students should learn signals from a reference, not copy it.'
  }
}

// --- mismatch detection --------------------------------------------
// Audience perception "mismatch" = the team's intended target is
// adults / premium / civic, but the perception fields point at
// students / school merch (or the inverse). Returns a short risk
// statement when a contradiction is detectable, null otherwise.
export function detectBrandMismatchRisk(
  fit: BrandFitBuilder | null | undefined
): string | null {
  if (!fit) return null
  const perception = fit.audiencePerception
  const intent = fit.brandIntent
  if (!perception && !intent) return null

  const targetMatch = perception?.targetMatch ?? ''
  if (targetMatch === 'weak' || targetMatch === 'unsure') {
    const explicit = perception?.mismatchRisk?.trim()
    if (explicit) return explicit
    return 'Audience perception is not aligned with the intended target customer — surface what specifically does not match before relying on this brand direction.'
  }

  // Soft heuristic: premium intent + school-merch perception (or vice
  // versa) is the most common mismatch the framework flags.
  const intentQuality = intent?.qualityLevel ?? ''
  const intentPrice = (intent?.pricePoint ?? '').toLowerCase()
  const perceptionPrice = (perception?.perceivedPrice ?? '').toLowerCase()
  const perceptionMerchVsPremium = (perception?.schoolMerchVsPremiumSignal ?? '').toLowerCase()

  const intentLooksPremium =
    intentQuality === 'premium' ||
    intentQuality === 'luxury' ||
    /\$\s?\d{2,}/.test(intentPrice) // any $XX price reads as premium-leaning vs basic merch
  const perceptionLooksLikeMerch =
    perceptionMerchVsPremium.includes('school merch') ||
    perceptionMerchVsPremium.includes('basic') ||
    perceptionPrice.includes('low') ||
    perceptionPrice.includes('cheap')
  if (intentLooksPremium && perceptionLooksLikeMerch) {
    return 'Intent is premium / higher-priced, but perception reads like basic school merch — visual identity, voice, or production may need to signal more quality before the price feels believable.'
  }
  const intentLooksMerch = intentQuality === 'budget' || intentQuality === 'standard'
  const perceptionLooksPremium =
    perceptionMerchVsPremium.includes('premium') || perceptionPrice.includes('high')
  if (intentLooksMerch && perceptionLooksPremium) {
    return 'Intent is approachable / mid-priced, but perception reads more premium — risk of pricing students out of a product the team meant for them.'
  }
  return null
}

// --- production risk -----------------------------------------------
// Production checks each carry a risk level. Returns the highest-risk
// check (and a short message) so the summary can name the single
// strongest production concern. Ties broken by the order checks were
// authored in.
export interface ProductionRiskResult {
  check: BrandFitProductionCheck
  level: BrandFitRiskLevel
  description: string
}

const PRODUCTION_USE_CASE_LABEL: Record<BrandFitProductionUseCase, string> = {
  embroidery: 'Embroidery',
  screen_print: 'Screen print',
  patch: 'Patch',
  hang_tag: 'Hang tag',
  packaging: 'Packaging',
  signage: 'Signage',
  social: 'Social',
  pitch_deck: 'Pitch deck',
  other: 'Other'
}

export function detectProductionRisk(
  fit: BrandFitBuilder | null | undefined
): ProductionRiskResult | null {
  const list = fit?.productionChecks ?? []
  if (list.length === 0) return null
  let top: ProductionRiskResult | null = null
  for (const c of list) {
    const level = c.riskLevel ?? ''
    const score = RISK_LEVEL_SCORE[level]
    if (!top || score > RISK_LEVEL_SCORE[top.level]) {
      top = {
        check: c,
        level,
        description: c.concern?.trim()
          ? `${PRODUCTION_USE_CASE_LABEL[c.useCase]}: ${c.concern.trim()}`
          : `${PRODUCTION_USE_CASE_LABEL[c.useCase]} flagged at ${level || 'unspecified'} risk.`
      }
    }
  }
  return top && RISK_LEVEL_SCORE[top.level] > 0 ? top : null
}

// --- strongest reference + brand signal summary --------------------
// Ranks reference brands by alignment so the summary can name the one
// the team has the strongest argument for. Ties broken by the order
// references were authored in.
const ALIGNMENT_SCORE: Record<BrandFitAlignment, number> = {
  '': 0,
  unsure: 1,
  weak: 1,
  partial: 2,
  strong: 3
}

export function strongestReferenceBrand(
  fit: BrandFitBuilder | null | undefined
): BrandFitReferenceBrand | null {
  const list = fit?.referenceBrands ?? []
  if (list.length === 0) return null
  let top: BrandFitReferenceBrand | null = null
  for (const r of list) {
    const align = r.alignment ?? ''
    if (!top) {
      top = r
      continue
    }
    if (ALIGNMENT_SCORE[align] > ALIGNMENT_SCORE[top.alignment ?? '']) {
      top = r
    }
  }
  return top
}

// Builds the deterministic recommendation paragraph. Reads the team's
// own intent, perception, references, and production checks and
// returns one paragraph the editor renders inline. Empty inputs
// collapse gracefully — the helper says so rather than inventing.
export function buildBrandSignalSummary(
  fit: BrandFitBuilder | null | undefined
): string {
  if (!fit) {
    return 'No Brand Fit Builder data has been saved for this section yet.'
  }
  const intent = fit.brandIntent ?? {}
  const visual = fit.visualIdentity ?? {}
  const perception = fit.audiencePerception ?? {}
  const recommendation = fit.recommendation ?? {}

  const brandName = intent.brandName?.trim() || 'this brand direction'
  const quality = intent.qualityLevel || ''
  const adjectives =
    visual.designAdjectives?.trim() ||
    visual.fontSignal?.trim() ||
    visual.colorSignal?.trim() ||
    ''
  const targetCustomer =
    intent.targetCustomer?.trim() ||
    intent.targetProfileName?.trim() ||
    perception.whoItAttracts?.trim() ||
    'the intended customer'

  const lead = adjectives
    ? `${brandName} reads as ${adjectives}.`
    : quality
      ? `${brandName} reads at the ${quality} quality level.`
      : `${brandName} does not yet have enough visual / voice signal to summarize.`

  const matchLine = perception.targetMatch
    ? ` Target match: ${ALIGNMENT_LABEL[perception.targetMatch]} for ${targetCustomer}.`
    : ''

  const priceQuality =
    perception.perceivedPrice?.trim() || perception.perceivedQuality?.trim()
      ? ` Perceived ${[
          perception.perceivedPrice?.trim() ? `price: ${perception.perceivedPrice.trim()}` : '',
          perception.perceivedQuality?.trim() ? `quality: ${perception.perceivedQuality.trim()}` : ''
        ]
          .filter(Boolean)
          .join(' · ')}.`
      : ''

  const top = strongestReferenceBrand(fit)
  const strongestRefLine = top?.brandOrExample?.trim()
    ? ` Strongest reference: ${top.brandOrExample.trim()}${
        top.alignment ? ` (${ALIGNMENT_LABEL[top.alignment]} alignment)` : ''
      }.`
    : ''

  const mismatch = detectBrandMismatchRisk(fit)
  const mismatchLine = mismatch ? ` Mismatch risk: ${mismatch}` : ''

  const production = detectProductionRisk(fit)
  const productionLine = production
    ? ` Production risk: ${production.description}`
    : ''

  const adjustment =
    recommendation.recommendedAdjustment?.trim() ||
    recommendation.brandSignalSummary?.trim() ||
    ''
  const adjustmentLine = adjustment ? ` Recommended adjustment: ${adjustment}.` : ''

  const validation =
    recommendation.validationStep?.trim() ||
    fit.validationPlan?.questionToAnswer?.trim() ||
    ''
  const validationLine = validation
    ? ` Validate before finalizing — next step: ${validation}.`
    : ' Validate brand direction with real people before finalizing it.'

  return [
    lead,
    matchLine,
    priceQuality,
    strongestRefLine,
    mismatchLine,
    productionLine,
    adjustmentLine,
    validationLine
  ]
    .filter(Boolean)
    .join('')
}

// --- compact preview snapshot --------------------------------------
// Drives the Playbook-ready preview rollup. Only renders fields the
// student has actually populated, so empty sections stay quiet.
export interface BrandFitSnapshot {
  brandSignal: string | null
  targetCustomerMatch: string | null
  perceivedPriceQuality: string | null
  strongestReference: string | null
  productionRisk: string | null
  recommendedAdjustment: string | null
  validationStep: string | null
}

export function buildBrandFitSnapshot(
  fit: BrandFitBuilder | null | undefined
): BrandFitSnapshot | null {
  if (!fit) return null
  const intent = fit.brandIntent ?? {}
  const visual = fit.visualIdentity ?? {}
  const perception = fit.audiencePerception ?? {}
  const recommendation = fit.recommendation ?? {}

  const adjectives =
    visual.designAdjectives?.trim() ||
    visual.colorSignal?.trim() ||
    visual.fontSignal?.trim() ||
    intent.qualityLevel ||
    null
  const brandSignal = adjectives ? `${adjectives}` : null

  const targetCustomerMatch = perception.targetMatch
    ? `${ALIGNMENT_LABEL[perception.targetMatch]} match for ${
        intent.targetCustomer?.trim() ||
        intent.targetProfileName?.trim() ||
        'intended customer'
      }`
    : null

  const perceivedPriceQuality = [
    perception.perceivedPrice?.trim() ? `price ${perception.perceivedPrice.trim()}` : '',
    perception.perceivedQuality?.trim() ? `quality ${perception.perceivedQuality.trim()}` : ''
  ]
    .filter(Boolean)
    .join(' · ') || null

  const top = strongestReferenceBrand(fit)
  const strongestReference = top?.brandOrExample?.trim()
    ? `${top.brandOrExample.trim()}${
        top.alignment ? ` (${ALIGNMENT_LABEL[top.alignment]})` : ''
      }`
    : null

  const productionRisk = detectProductionRisk(fit)
  const productionRiskLine = productionRisk ? productionRisk.description : null

  const recommendedAdjustment =
    recommendation.recommendedAdjustment?.trim() ||
    recommendation.brandSignalSummary?.trim() ||
    null
  const validationStep =
    recommendation.validationStep?.trim() ||
    fit.validationPlan?.questionToAnswer?.trim() ||
    null

  // If literally nothing is populated, skip the rollup entirely so the
  // preview stays compact.
  const anyContent =
    brandSignal ||
    targetCustomerMatch ||
    perceivedPriceQuality ||
    strongestReference ||
    productionRiskLine ||
    recommendedAdjustment ||
    validationStep
  if (!anyContent) return null

  return {
    brandSignal,
    targetCustomerMatch,
    perceivedPriceQuality,
    strongestReference,
    productionRisk: productionRiskLine,
    recommendedAdjustment,
    validationStep
  }
}
