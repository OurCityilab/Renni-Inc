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

// --- brand signal chip palette + tradeoff notes --------------------
// Curated set of signals the editor surfaces as quick-add chips. The
// list is shipped here (not in Firestore) so curriculum updates stay
// in source control. Free-form so students can author additional
// signals — only entries in this map get a deterministic tradeoff
// note shown in the editor.
export const BRAND_SIGNAL_CHIPS: string[] = [
  'Premium',
  'Student-facing',
  'School-spirit',
  'Detroit-made',
  'Civic',
  'Giftable',
  'Streetwear',
  'Minimal',
  'Bold',
  'Warm',
  'Handmade',
  'Retail-ready',
  'Heritage',
  'Playful',
  'Accessible',
  'Limited-run'
]

// Per-signal tradeoff coach notes. Keyed by lowercase signal text so
// case mismatches still resolve. Each note is a single sentence the
// editor renders below the chip strip when the chip is selected.
const SIGNAL_TRADEOFFS: Record<string, string> = {
  premium:
    'Premium supports a higher price and adult/gift buyers, but may feel less accessible to students unless the story and quality are clear.',
  'student-facing':
    'Student-facing reaches the easiest audience to mobilize, but may limit perceived price and dilute adult-buyer credibility.',
  'school-spirit':
    'School-spirit improves recognition inside Renaissance, but can feel generic if the design relies only on standard school colors or varsity styling.',
  'detroit-made':
    'Detroit-made signals authenticity and place — strong with civic and gift buyers, weaker if production evidence is thin or quality reads inconsistent.',
  civic:
    'Civic signals maturity and place-based pride, which support adults, alumni, and supporters — but ask whether students still feel invited.',
  giftable:
    'Giftable opens parent / alumni / supporter buyers, but the product needs presentation (packaging, hang tag, story) that earns the gift price.',
  streetwear:
    'Streetwear can pull cultural energy and student appeal, but risks feeling generic without a distinctive Detroit hook or limited-run discipline.',
  minimal:
    'Minimal reads premium and disciplined, but needs strong type, photography, or story to avoid feeling plain on the shelf.',
  bold:
    'Bold catches attention and signals confidence, but risks feeling loud or aggressive for premium / gift buyers.',
  warm:
    'Warm reads inviting and grounded, but may underplay premium signals if cost is high.',
  handmade:
    'Handmade signals authenticity and student-led work, but can weaken the premium claim if quality is not visibly strong.',
  'retail-ready':
    'Retail-ready supports Phoenix Nest carry and gift buyers, but the cohort needs production discipline (packaging, hang tags, signage) to deliver on the signal.',
  heritage:
    'Heritage reads timeless and credible, but risks feeling stuck or institutional if not paired with a contemporary cultural hook.',
  playful:
    'Playful pulls student and gift-buyer interest, but may erode price defensibility if used without restraint.',
  accessible:
    'Accessible reaches first-time buyers, but limits perceived price and may compete with basic school merch.',
  'limited-run':
    'Limited-run supports premium pricing and urgency, but only if the team can defend why supply is short — story, capacity, or cohort cycle.'
}

export interface BrandSignalTradeoffNote {
  signal: string
  note: string
}

export function buildSignalTradeoffNotes(
  signals: string[] | null | undefined
): BrandSignalTradeoffNote[] {
  if (!signals || signals.length === 0) return []
  const seen = new Set<string>()
  const out: BrandSignalTradeoffNote[] = []
  for (const raw of signals) {
    const s = raw?.trim()
    if (!s) continue
    const key = s.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const note = SIGNAL_TRADEOFFS[key]
    if (note) {
      out.push({ signal: s, note })
    }
  }
  return out
}

// --- student → professional language translator --------------------
// Read-only reference table the editor renders. The brief lists this
// as either a static helper or a click-to-append. We export the
// data so the component renders the table without inventing entries.
export interface BrandLanguageTranslation {
  studentPhrase: string
  professional: string
}

export const BRAND_LANGUAGE_TRANSLATIONS: BrandLanguageTranslation[] = [
  { studentPhrase: 'clean', professional: 'minimal, restrained, uncluttered' },
  { studentPhrase: 'expensive', professional: 'premium, elevated, high perceived value' },
  { studentPhrase: 'grown', professional: 'mature, refined, adult-facing' },
  { studentPhrase: 'gives Detroit', professional: 'place-based, civic, locally rooted' },
  { studentPhrase: 'people would wear it', professional: 'wearable, versatile, lifestyle-oriented' },
  { studentPhrase: 'not too much', professional: 'disciplined, balanced, restrained' },
  { studentPhrase: 'official', professional: 'credible, polished, retail-ready' },
  { studentPhrase: 'school but not corny', professional: 'school-linked without feeling generic' },
  { studentPhrase: 'stands out', professional: 'distinctive, memorable, high-recognition' },
  { studentPhrase: 'calm', professional: 'warm, simple, grounded, low-noise' }
]

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
// Concatenate brand signals + design adjectives into one human-
// readable signal phrase. Prefers selected chips when present, falls
// back to designAdjectives, then to fontSignal / colorSignal.
function describeBrandSignal(fit: BrandFitBuilder): string {
  const signals = (fit.brandSignals ?? [])
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
  if (signals.length > 0) {
    const lower = signals.map((s) => s.toLowerCase())
    return lower.length === 1
      ? lower[0]
      : `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`
  }
  const visual = fit.visualIdentity ?? {}
  return (
    visual.designAdjectives?.trim() ||
    visual.fontSignal?.trim() ||
    visual.colorSignal?.trim() ||
    ''
  )
}

export function buildBrandSignalSummary(
  fit: BrandFitBuilder | null | undefined
): string {
  if (!fit) {
    return 'No Brand Fit Builder data has been saved for this section yet.'
  }
  const intent = fit.brandIntent ?? {}
  const perception = fit.audiencePerception ?? {}
  const recommendation = fit.recommendation ?? {}

  const brandName = intent.brandName?.trim() || 'this brand direction'
  const signalPhrase = describeBrandSignal(fit)
  const quality = intent.qualityLevel || ''
  const targetCustomer =
    intent.targetCustomer?.trim() ||
    intent.targetProfileName?.trim() ||
    perception.whoItAttracts?.trim() ||
    'the intended customer'

  // Lead sentence: lead with positioning when we have signals + a
  // target customer; otherwise gracefully degrade to a less-specific
  // read-out so the summary always says something useful.
  const positioning = signalPhrase
    ? quality
      ? `${brandName} is currently positioned as a ${quality} ${signalPhrase} brand.`
      : `${brandName} is currently positioned as a ${signalPhrase} brand.`
    : quality
      ? `${brandName} reads at the ${quality} quality level.`
      : `${brandName} does not yet have enough visual / voice signal to summarize — add design adjectives, signal chips, or a font/color signal.`

  // What is supporting the position: prefer audience perception fields
  // first (those describe what the brand actually reads as), then
  // recommendation.strongestAlignment, then visual signals.
  const supportingSignals: string[] = []
  if (perception.perceivedPrice?.trim()) {
    supportingSignals.push(`reads ${perception.perceivedPrice.trim()} on price`)
  }
  if (perception.perceivedQuality?.trim()) {
    supportingSignals.push(`reads ${perception.perceivedQuality.trim()} on quality`)
  }
  if (perception.schoolMerchVsPremiumSignal?.trim()) {
    supportingSignals.push(perception.schoolMerchVsPremiumSignal.trim())
  }
  if (recommendation.strongestAlignment?.trim()) {
    supportingSignals.push(recommendation.strongestAlignment.trim())
  }
  const supportingLine = supportingSignals.length
    ? ` The strongest signals are ${supportingSignals.join('; ')}.`
    : ''

  // Match + likely audience — use targetMatch when set, else infer
  // from intent.targetCustomer / profile.
  const matchLine = perception.targetMatch
    ? ` Target match: ${ALIGNMENT_LABEL[perception.targetMatch]} for ${targetCustomer}.`
    : intent.targetCustomer?.trim() || intent.targetProfileName?.trim()
      ? ` This may appeal to ${targetCustomer}.`
      : ''

  // Reference + tradeoff lines.
  const top = strongestReferenceBrand(fit)
  const strongestRefLine = top?.brandOrExample?.trim()
    ? ` Strongest reference: ${top.brandOrExample.trim()}${
        top.alignment ? ` (${ALIGNMENT_LABEL[top.alignment]} alignment)` : ''
      }.`
    : ''

  const mismatch = detectBrandMismatchRisk(fit)
  const mismatchLine = mismatch
    ? ` Main tradeoff: ${mismatch}`
    : ''

  const production = detectProductionRisk(fit)
  const productionLine = production
    ? ` Production risk: ${production.description}`
    : ''

  const adjustment =
    recommendation.recommendedAdjustment?.trim() ||
    recommendation.brandSignalSummary?.trim() ||
    ''
  const adjustmentLine = adjustment ? ` Recommended adjustment: ${adjustment}.` : ''

  // Always close with a single, deterministic next-best-move line —
  // students get a clear next action whether or not the team has
  // populated the recommendation block.
  const nextBestMove = buildBrandFitNextBestMove(fit)
  const nextLine = ` Next best move: ${nextBestMove}`

  return [
    positioning,
    supportingLine,
    matchLine,
    strongestRefLine,
    mismatchLine,
    productionLine,
    adjustmentLine,
    nextLine
  ]
    .filter(Boolean)
    .join('')
}

// --- next best move ------------------------------------------------
// Single deterministic action line. Priority order is the brief's
// rules: validation plan missing → audience test; production risk
// high → simplify; target mismatch / weak match → perception test;
// references thin/weak → add a stronger reference; otherwise a
// general "describe it back to you" perception test.
export function buildBrandFitNextBestMove(
  fit: BrandFitBuilder | null | undefined
): string {
  if (!fit) {
    return 'Add brand intent and at least one visual or voice signal to start a Brand Fit pass.'
  }
  const validation = fit.validationPlan ?? {}
  const recommendation = fit.recommendation ?? {}

  // Highest-priority: production risk high.
  const production = detectProductionRisk(fit)
  if (production && production.level === 'high') {
    const useCase = production.check.useCase
    const adjustment = production.check.adjustment?.trim()
    if (adjustment) {
      return `Address the high production risk on ${useCase.replace(/_/g, ' ')} — ${adjustment}.`
    }
    return `Simplify the mark or layout for ${useCase.replace(/_/g, ' ')} before committing to production runs.`
  }

  // Mismatch risk wins next: explicit perception test.
  const mismatch = detectBrandMismatchRisk(fit)
  if (mismatch) {
    return 'Test perception with 10 students and 5 adults — ask who they think the brand is for, what it costs, and whether they would buy it. Compare answers to the intended target.'
  }

  // No validation plan yet — the brief says suggest audience testing.
  const noValidationPlan =
    !validation.testAudience?.trim() &&
    !validation.questionToAnswer?.trim() &&
    !validation.nextStep?.trim() &&
    !recommendation.validationStep?.trim()
  if (noValidationPlan) {
    return 'Show this direction to 10 students and 5 adults and ask who they think it is for, what it costs, and whether they would buy it.'
  }

  // References missing or too weak.
  const refs = fit.referenceBrands ?? []
  const strongRefs = refs.filter((r) => r.alignment === 'strong')
  if (refs.length === 0) {
    return 'Add at least two reference brands — one student-facing and one adult / gift-buyer reference — so you can test which direction this brand reads as.'
  }
  if (strongRefs.length === 0) {
    return 'Add one stronger reference brand on price or story to defend the positioning before relying on the existing references.'
  }

  // Recommendation already names a validation step — surface it.
  if (recommendation.validationStep?.trim()) {
    return recommendation.validationStep.trim()
  }

  // Validation plan exists but missing a question to answer.
  if (
    validation.testAudience?.trim() &&
    !validation.questionToAnswer?.trim()
  ) {
    return 'Name the question your validation should answer — e.g. "do students and adults describe this brand the same way the team intends?" — before running the test.'
  }

  return 'Test whether students and adults describe this brand the same way the team intends.'
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
  // Single deterministic next-action line — same logic the editor's
  // summary closes with. Surfaced in the Playbook-ready preview so a
  // student reading the rollup can see what to do next.
  nextBestMove: string | null
}

export function buildBrandFitSnapshot(
  fit: BrandFitBuilder | null | undefined
): BrandFitSnapshot | null {
  if (!fit) return null
  const intent = fit.brandIntent ?? {}
  const visual = fit.visualIdentity ?? {}
  const perception = fit.audiencePerception ?? {}
  const recommendation = fit.recommendation ?? {}

  // Prefer brand signal chips when present so the rollup reads in
  // student-facing language; otherwise fall back to design
  // adjectives / signals / quality level.
  const signalsList = (fit.brandSignals ?? [])
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s))
  const adjectives = signalsList.length
    ? signalsList.map((s) => s.toLowerCase()).join(', ')
    : visual.designAdjectives?.trim() ||
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

  // Always compute the next-best-move alongside the rollup. When any
  // other field is populated, surface it in the preview; if literally
  // nothing else is filled in we still skip the snapshot entirely so
  // the preview stays compact.
  const nextBestMove = buildBrandFitNextBestMove(fit)

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
    validationStep,
    nextBestMove
  }
}
