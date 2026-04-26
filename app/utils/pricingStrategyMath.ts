// Pricing Strategy Engine V1 — pure deterministic math helpers.
// Used only by the Ch. 8 Section 2 Pricing Strategy Builder. No AI,
// no API calls, no side effects, no Firestore reads or writes. Inputs
// in, derived numbers and bands out — every value is recomputable
// from the saved builder snapshot, so a stale display can never quietly
// disagree with the underlying inputs.
//
// Posture (do not relax in V1):
//   - never gates submit / never gates Playbook readiness
//   - never writes to pricingScenarios; never reads it either
//   - never invents comp prices, segment data, or demand
//   - returns null where a denominator is invalid; the caller decides
//     how to render "—"
//   - treats NaN / Infinity / negative-where-not-allowed as null
//
// All money is stored in plain numbers; rounding for display is the
// caller's choice — helpers below return raw values so the same number
// powers both math and display without double-rounding.

import type {
  MarketFitCustomerProfile,
  PricingStrategyBuilder,
  PricingStrategyComparable,
  PricingStrategyPriceTest
} from '~/types/models'

// ---------- numeric sanitization ----------

// Treat blank / null / undefined / non-finite (NaN / Infinity) as
// null. The Firestore composable already runs stripUndefinedDeep
// before write, but the math layer guards too — if a future caller
// hands us a NaN, we never let it leak into a derived number.
export function safeNum(n: number | null | undefined): number | null {
  if (n === null || n === undefined) return null
  if (typeof n !== 'number') return null
  if (!Number.isFinite(n)) return null
  return n
}

// Sum of an arbitrary list of cost components. A blank component
// contributes 0 to the total — the team starts a strategy with most
// fields empty, and we don't want a single missing field to wipe the
// running total. Returns 0 if every component is blank, not null,
// because "no costs entered yet" is a stable starting point ($0).
function sumOrZero(parts: Array<number | null | undefined>): number {
  let acc = 0
  for (const p of parts) {
    const v = safeNum(p)
    if (v != null) acc += v
  }
  return acc
}

// ---------- core derived numbers ----------

export interface PricingStrategyDerived {
  totalUnitCost: number
  unitMargin: number | null
  grossMarginPct: number | null // 0..100 (or negative when below cost)
  breakEvenUnits: number | null
  revenue: number | null
  grossProfit: number | null
  targetMarginPrice: number | null
  belowCost: boolean
}

export function computeDerived(
  state: PricingStrategyBuilder | null
): PricingStrategyDerived {
  const totalUnitCost = sumOrZero([
    state?.baseProductCost,
    state?.decorationCost,
    state?.laborCost,
    state?.packagingCost,
    state?.transactionFee,
    state?.otherUnitCost
  ])

  const proposedPrice = safeNum(state?.proposedPrice)
  const fixedCosts = safeNum(state?.fixedCosts)
  const expectedUnits = safeNum(state?.expectedUnitsSold)
  const desiredPct = safeNum(state?.desiredGrossMarginPct)

  // Only compute margin once the team has typed a price. Pre-price,
  // showing "$0 - $0 = $0 margin" is more confusing than helpful.
  const unitMargin = proposedPrice != null ? proposedPrice - totalUnitCost : null

  const grossMarginPct =
    proposedPrice != null && proposedPrice > 0 && unitMargin != null
      ? (unitMargin / proposedPrice) * 100
      : null

  // Break-even is only meaningful when the unit margin is positive AND
  // there are real fixed costs to recover. A non-positive margin or a
  // missing fixed-cost number returns null so the UI can render the
  // recommendation chip as "Needs positive margin" or "No fixed costs
  // entered" instead of a misleading number.
  const breakEvenUnits =
    unitMargin != null && unitMargin > 0 && fixedCosts != null && fixedCosts > 0
      ? Math.ceil(fixedCosts / unitMargin)
      : null

  const revenue =
    proposedPrice != null && expectedUnits != null
      ? proposedPrice * expectedUnits
      : null

  const grossProfit =
    unitMargin != null && expectedUnits != null
      ? unitMargin * expectedUnits
      : null

  // Target-margin price asks "what would I have to charge to land at
  // the team's desired gross margin given today's unit cost?" Defined
  // only for desiredPct in [0, 100); 100% would imply unit cost of $0,
  // which is impossible in retail.
  const targetMarginPrice =
    desiredPct != null &&
    desiredPct >= 0 &&
    desiredPct < 100 &&
    totalUnitCost > 0
      ? totalUnitCost / (1 - desiredPct / 100)
      : null

  return {
    totalUnitCost,
    unitMargin,
    grossMarginPct,
    breakEvenUnits,
    revenue,
    grossProfit,
    targetMarginPrice,
    belowCost: unitMargin != null && unitMargin < 0
  }
}

// ---------- interpretation bands ----------

export type MarginBand =
  | 'no_price'
  | 'below_cost'
  | 'weak'
  | 'tight'
  | 'healthy'
  | 'strong'

export interface MarginInterpretation {
  band: MarginBand
  label: string
  detail: string
}

export function interpretMargin(
  derived: PricingStrategyDerived
): MarginInterpretation {
  if (derived.unitMargin == null || derived.grossMarginPct == null) {
    return {
      band: 'no_price',
      label: 'Enter a proposed price',
      detail:
        'Add a proposed price and at least one cost component to see margin guidance.'
    }
  }
  if (derived.belowCost) {
    return {
      band: 'below_cost',
      label: 'Price is below cost',
      detail:
        'At this price the unit loses money before fixed costs. Either raise price or lower unit cost before defending this number.'
    }
  }
  const pct = derived.grossMarginPct
  if (pct < 30) {
    return {
      band: 'weak',
      label: 'Weak margin (under 30%)',
      detail:
        'Margin is high-risk for student retail — a small surprise (extra packaging, transaction fee, returns) can wipe contribution out. Tighten cost or raise price before locking in.'
    }
  }
  if (pct < 50) {
    return {
      band: 'tight',
      label: 'Workable but tight (30–49%)',
      detail:
        "Workable for many products, but doesn't leave much room for fixed-cost recovery or markdowns. Plan inventory carefully."
    }
  }
  if (pct < 65) {
    return {
      band: 'healthy',
      label: 'Healthy margin (50–64%)',
      detail:
        'Healthy band for many student retail products — covers fixed costs, leaves contribution for the next batch.'
    }
  }
  return {
    band: 'strong',
    label: 'Strong margin (65%+)',
    detail:
      'Strong margin, but price acceptance needs evidence. Confirm with comps, preorders, or interviews before locking it in.'
  }
}

// ---------- comparable price band ----------

// "Valid" comp = name + finite positive price. We don't filter by
// alignment notes — if a student typed $0 or left price blank, the
// comp is incomplete and shouldn't drive the band.
function validComps(
  comps: PricingStrategyComparable[] | undefined | null
): PricingStrategyComparable[] {
  if (!comps?.length) return []
  return comps.filter((c) => {
    const p = safeNum(c.price)
    return p != null && p > 0 && (c.name?.trim()?.length ?? 0) > 0
  })
}

export type CompPositionBand =
  | 'needs_evidence'
  | 'below_range'
  | 'within_range'
  | 'above_range'
  | 'far_above_range'
  | 'no_price'

export interface CompPositionResult {
  band: CompPositionBand
  validCompCount: number
  min: number | null
  max: number | null
  median: number | null
  label: string
  detail: string
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const m = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[m - 1] + sorted[m]) / 2
    : sorted[m]
}

export function interpretCompPosition(
  state: PricingStrategyBuilder | null
): CompPositionResult {
  const comps = validComps(state?.comparablePrices)
  const proposed = safeNum(state?.proposedPrice)

  if (comps.length < 2) {
    return {
      band: 'needs_evidence',
      validCompCount: comps.length,
      min: null,
      max: null,
      median: null,
      label: 'Needs comparable evidence',
      detail:
        'Add at least two comparable prices (name + price) before this builder can position the proposed price against the market.'
    }
  }

  const prices = comps.map((c) => c.price as number)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const med = median(prices)

  if (proposed == null || proposed <= 0) {
    return {
      band: 'no_price',
      validCompCount: comps.length,
      min,
      max,
      median: med,
      label: 'Enter a proposed price',
      detail: `Comp range is $${formatMoney(min)}–$${formatMoney(max)} (median $${formatMoney(med)}). Enter a proposed price to see how it compares.`
    }
  }

  // "Far above" = more than ~25% above the highest comp. The threshold
  // is a soft default — students still see the underlying numbers in
  // the chip detail, so a defensible premium (Detroit-made, limited
  // run, etc.) can still be argued.
  if (proposed > max * 1.25) {
    return {
      band: 'far_above_range',
      validCompCount: comps.length,
      min,
      max,
      median: med,
      label: 'Far above comp range',
      detail:
        'Proposed price is well above every comp on file. Acceptance risk is high unless the production story, brand, or quality is genuinely exceptional. Plan a validation step.'
    }
  }
  if (proposed > max) {
    return {
      band: 'above_range',
      validCompCount: comps.length,
      min,
      max,
      median: med,
      label: 'Premium-positioned (above comp range)',
      detail:
        'Proposed price sits above every comp on file. Defensible if the production story, materials, or limited-run scarcity supports premium positioning. Document the story.'
    }
  }
  if (proposed < min) {
    return {
      band: 'below_range',
      validCompCount: comps.length,
      min,
      max,
      median: med,
      label: 'Below comp range',
      detail:
        'Proposed price sits below every comp on file. Could be a value play, but check whether the price reads as "not real" or compresses margin past what fixed costs allow.'
    }
  }
  return {
    band: 'within_range',
    validCompCount: comps.length,
    min,
    max,
    median: med,
    label: 'Within comp range',
    detail: `Proposed price sits inside the $${formatMoney(min)}–$${formatMoney(max)} comp range (median $${formatMoney(med)}). Market-aligned at face value.`
  }
}

// ---------- evidence band ----------

export type EvidenceBand = 'none' | 'low' | 'medium' | 'high'

export interface EvidenceInterpretation {
  band: EvidenceBand
  label: string
  detail: string
}

export function interpretEvidence(
  state: PricingStrategyBuilder | null
): EvidenceInterpretation {
  const c = state?.confidence
  if (c === 'high') {
    return {
      band: 'high',
      label: 'Strong evidence',
      detail:
        'Preorder data or strong direct customer evidence supports this price. Validation step still worth keeping for the post-event recap.'
    }
  }
  if (c === 'medium') {
    return {
      band: 'medium',
      label: 'Some evidence',
      detail:
        'Some feedback, comps, or interviews support this price. The next validation step matters — name what would tighten confidence to high.'
    }
  }
  if (c === 'low') {
    return {
      band: 'low',
      label: 'Assumptions only',
      detail:
        'Price rests on assumptions. Plan a validation step (preorders, side-by-side test, structured interviews) before locking the number in.'
    }
  }
  return {
    band: 'none',
    label: 'Confidence not set',
    detail:
      'Pick a confidence level so the recommendation reflects how much evidence supports this price.'
  }
}

// ---------- segment fit ----------

// Segment fit is descriptive — a deterministic line that names the
// likely acceptance posture for the segment the team selected. We
// match by lowercased contains so the team can write the segment
// name freely without picking from a fixed dropdown.
export type SegmentBand =
  | 'student'
  | 'parent'
  | 'alumni'
  | 'civic_premium'
  | 'staff'
  | 'detroit_supporter'
  | 'gift_buyer'
  | 'general'

export interface SegmentInterpretation {
  band: SegmentBand
  label: string
  detail: string
}

export function interpretSegment(
  state: PricingStrategyBuilder | null
): SegmentInterpretation {
  const raw = (state?.targetSegment || '').toLowerCase().trim()
  if (!raw) {
    return {
      band: 'general',
      label: 'Segment not set',
      detail:
        'Name the strongest target segment so the recommendation reflects who the price is for.'
    }
  }
  if (raw.includes('civic') || raw.includes('detroit premium')) {
    return {
      band: 'civic_premium',
      label: 'Civic Premium Buyer',
      detail:
        'May accept a premium price if the Detroit-made story, materials, and quality are credible. Brand voice and production proof carry the price.'
    }
  }
  if (raw.includes('parent')) {
    return {
      band: 'parent',
      label: 'Proud Parent Supporter',
      detail:
        'May accept a higher price when school pride and the story are clear. Show what the purchase supports (program, scholarship) and the connection to the student.'
    }
  }
  if (raw.includes('alum')) {
    return {
      band: 'alumni',
      label: 'Alumni Legacy Buyer',
      detail:
        'May accept a premium when legacy and continuity are visible. Limited runs, year markers, and lineage cues help.'
    }
  }
  if (raw.includes('staff') || raw.includes('teacher') || raw.includes('faculty')) {
    return {
      band: 'staff',
      label: 'Staff / faculty',
      detail:
        'Tend to support school products with moderate price tolerance. Practicality and visible school identity help acceptance.'
    }
  }
  if (raw.includes('detroit') || raw.includes('supporter')) {
    return {
      band: 'detroit_supporter',
      label: 'Detroit supporter',
      detail:
        'Civic story and made-in-Detroit credibility drive acceptance. Vendor proof and visible local production cues matter.'
    }
  }
  if (raw.includes('gift')) {
    return {
      band: 'gift_buyer',
      label: 'Gift buyer',
      detail:
        'Price tolerance often higher than self-purchase; presentation, packaging, and giftability matter more than logo.'
    }
  }
  if (raw.includes('student')) {
    return {
      band: 'student',
      label: 'Student buyer',
      detail:
        'Price-sensitive segment. Useful for awareness and validation, but a high price will not clear inventory in this market alone.'
    }
  }
  return {
    band: 'general',
    label: 'General audience',
    detail:
      'Segment is a free-form name. Argue the buyer with comparable purchases, willingness to pay, and a validation plan.'
  }
}

// ---------- structured Ch. 7 segment context (V1 PRIZM-inspired) ----------
//
// Read-only / advisory only — Ch. 8 reads structured Market Fit
// segment profile data and translates it into deterministic risk
// language. Never writes back to Ch. 7. Returns null if no
// structured data is set on the profile so the caller can hide
// the section gracefully.

export interface SegmentProfileAdvisory {
  // Compact one-line tag like "Civic Premium Buyer · premium-discretionary
  // · Detroit"; safe to render as a chip subtitle.
  summary: string
  // Bulleted advisory lines. Deterministic; one per signal we can
  // read. The caller renders each line separately so the analysis
  // panel reads as a list, not a wall of prose.
  lines: string[]
  // True when the structured fields imply the price could be a
  // significant stretch for this segment — used by the analysis
  // panel to color the chip.
  priceStretchRisk: boolean
}

function isProfilePopulated(p: MarketFitCustomerProfile | null | undefined): boolean {
  if (!p) return false
  return Boolean(
    p.relationshipRole?.trim() ||
      p.lifeStage ||
      p.incomeBracket ||
      p.geography ||
      p.urbanicity ||
      p.spendingPower ||
      p.priceSensitivity ||
      p.buyingBehavior ||
      p.motivations?.trim() ||
      p.likelyObjections?.trim() ||
      p.channelFit?.trim() ||
      p.productUseCase?.trim() ||
      p.evidenceSources?.trim() ||
      p.evidenceConfidence ||
      p.profileName?.trim()
  )
}

export function buildSegmentProfileAdvisory(
  profile: MarketFitCustomerProfile | null | undefined
): SegmentProfileAdvisory | null {
  if (!isProfilePopulated(profile)) return null
  const p = profile!

  // ---- summary ----
  const summaryParts: string[] = []
  if (p.profileName?.trim()) summaryParts.push(p.profileName.trim())
  else if (p.relationshipRole?.trim()) summaryParts.push(p.relationshipRole.trim())
  if (p.spendingPower && p.spendingPower !== 'unknown') {
    summaryParts.push(p.spendingPower)
  }
  if (p.geography && p.geography !== 'unknown') {
    summaryParts.push(p.geography)
  }
  const summary = summaryParts.length > 0
    ? summaryParts.join(' · ')
    : (p.relationshipRole?.trim() || 'Segment')

  // ---- advisory lines ----
  const lines: string[] = []
  let priceStretchRisk = false

  if (p.priceSensitivity === 'high') {
    lines.push(
      'At this price, this segment is risky unless the purchase is a gift, limited drop, or mission-support purchase.'
    )
    priceStretchRisk = true
  } else if (p.priceSensitivity === 'medium') {
    lines.push(
      'Moderate price sensitivity — the price has to clear an objection or two before this segment commits.'
    )
  } else if (p.priceSensitivity === 'low') {
    lines.push(
      'Low price sensitivity — this segment will consider the price if quality, scarcity, and story land.'
    )
  }

  if (p.spendingPower === 'premium-discretionary') {
    lines.push(
      'Premium-discretionary spending power — this segment is more likely to consider the price if quality, scarcity, and story are credible.'
    )
  } else if (p.spendingPower === 'comfortable') {
    lines.push(
      'Comfortable spending power — premium pricing is plausible with clear quality and story.'
    )
  } else if (p.spendingPower === 'constrained' || p.incomeBracket === 'under-35k') {
    lines.push(
      'Treat this segment as awareness or validation before assuming conversion at premium price points.'
    )
    priceStretchRisk = true
  }

  if (p.buyingBehavior === 'gift') {
    lines.push(
      'Gift purchase behavior — packaging, story, and occasion matter more for this segment than everyday utility.'
    )
  } else if (p.buyingBehavior === 'collector') {
    lines.push(
      'Collector behavior — limited runs, year markers, and lineage cues raise willingness to pay.'
    )
  } else if (p.buyingBehavior === 'impulse') {
    lines.push(
      'Impulse behavior — display, energy, and a tight pitch carry conversion. Without those, the price is the friction.'
    )
  } else if (p.buyingBehavior === 'value-shopper') {
    lines.push(
      'Value-shopper behavior — this segment compares hard against lower-priced alternatives. Story alone is not enough.'
    )
    priceStretchRisk = true
  } else if (p.buyingBehavior === 'preorder') {
    lines.push(
      'Preorder behavior — strong evidence path: a small preorder round at this price is the cleanest validation step.'
    )
  } else if (p.buyingBehavior === 'supporter') {
    lines.push(
      'Supporter behavior — purchase carries mission weight; price defensibility comes from where the proceeds go.'
    )
  }

  if (p.evidenceConfidence === 'low' || (!p.evidenceConfidence && isProfilePopulated(p))) {
    lines.push(
      'Segment fit is still mostly an assumption. Validate with interviews, survey responses, or preorders.'
    )
  } else if (p.evidenceConfidence === 'medium') {
    lines.push(
      'Some evidence supports this segment fit. Tighten with a small preorder or interview round before locking the price in.'
    )
  } else if (p.evidenceConfidence === 'high') {
    lines.push(
      'Strong evidence supports this segment fit. Document sources and watch for drift as the market changes.'
    )
  }

  if (p.likelyObjections?.trim()) {
    lines.push(`Likely objection to address: ${p.likelyObjections.trim()}`)
  }
  if (p.motivations?.trim() && lines.length < 6) {
    lines.push(`Why they buy: ${p.motivations.trim()}`)
  }

  return { summary, lines, priceStretchRisk }
}

// ---------- comp evidence band (V1.1) ----------

// Comp evidence strength is a function of how many *valid* comps the
// team has logged. Distinct from the comp position band, which only
// asks "is the proposed price below / within / above what's on file?"
// Evidence strength asks "is there enough on file to be making that
// claim at all?"
//
// Bands are deliberately conservative: 2 valid comps is "usable but
// light" rather than "strong". Renaissance students should not feel
// licensed to declare market value from two store URLs.
export type CompEvidenceBand =
  | 'none' // 0 valid comps
  | 'one' // 1 valid comp — needs at least one more
  | 'usable' // 2 valid comps — usable but light
  | 'strong' // 3+ valid comps

export interface CompEvidenceInterpretation {
  band: CompEvidenceBand
  label: string
  detail: string
  validCompCount: number
}

export function interpretCompEvidence(
  state: PricingStrategyBuilder | null
): CompEvidenceInterpretation {
  const comps = validComps(state?.comparablePrices)
  const n = comps.length
  if (n === 0) {
    return {
      band: 'none',
      label: 'No comp evidence yet',
      detail:
        'Add at least one comparable product (name + price) before this builder can describe how the price compares with the market.',
      validCompCount: 0
    }
  }
  if (n === 1) {
    return {
      band: 'one',
      label: 'Needs at least one more comp',
      detail:
        'One comp on file. Comp position only resolves once at least two valid comps exist. Add another comparable product so the price can be argued against a range, not a single point.',
      validCompCount: 1
    }
  }
  if (n === 2) {
    return {
      band: 'usable',
      label: 'Usable but light comp evidence',
      detail:
        'Two comps on file. Usable for an initial read, but a third comp tightens the range and the team’s argument. This does not prove demand.',
      validCompCount: 2
    }
  }
  return {
    band: 'strong',
    label: 'Stronger comp evidence',
    detail: `${n} comps on file — stronger evidence the price is in a defensible range. This still does not prove demand; preorder or interview validation is needed for that.`,
    validCompCount: n
  }
}

// Composite comp analysis — wraps interpretCompPosition with avg /
// distance-from-average / distance-from-median for the analysis panel.
// Caller can still use interpretCompPosition() directly for the
// existing chip; this is the richer breakdown the V1.1 panel needs.
export interface CompAnalysisResult extends CompPositionResult {
  average: number | null
  distanceFromAverage: number | null // proposed - avg, signed
  distanceFromMedian: number | null
  evidence: CompEvidenceInterpretation
}

export function analyzeComps(
  state: PricingStrategyBuilder | null
): CompAnalysisResult {
  const position = interpretCompPosition(state)
  const evidence = interpretCompEvidence(state)
  const comps = validComps(state?.comparablePrices)
  const proposed = safeNum(state?.proposedPrice)

  let average: number | null = null
  if (comps.length > 0) {
    const sum = comps.reduce((acc, c) => acc + (c.price as number), 0)
    average = sum / comps.length
  }

  const distanceFromAverage =
    proposed != null && average != null ? proposed - average : null
  const distanceFromMedian =
    proposed != null && position.median != null ? proposed - position.median : null

  return {
    ...position,
    average,
    distanceFromAverage,
    distanceFromMedian,
    evidence
  }
}

// ---------- safe URL surface (V1.1) ----------

// Render-only URL guard. We do not fetch URLs and never render them
// in any context that auto-loads them. The check keeps obviously
// dangerous schemes (javascript:, data:, vbscript:, file:) out of the
// preview so a saved comp can't smuggle a clickable XSS payload past
// Vue's rendering. Anything that doesn't parse as http/https returns
// null, which the caller renders as plain text.
export function safeCompUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  return u.toString()
}

// ---------- composite "What this means" analysis (V1.1) ----------

// Translates the math + bands into a deterministic student-facing
// paragraph. Strict rules:
//   - never claims demand is proven
//   - never claims market value is X
//   - never approves the price
//   - returns a structured result so the panel can render each line
//     with its own emphasis (cost / margin / comp / segment / risk /
//     validation), not a single string blob the UI then re-parses
export interface PricingAnalysisResult {
  costRead: string
  marginRead: string
  compRead: string
  segmentRead: string
  risk: string
  nextValidation: string
}

export function buildPricingAnalysis(
  state: PricingStrategyBuilder | null
): PricingAnalysisResult {
  const derived = computeDerived(state)
  const margin = interpretMargin(derived)
  const comps = analyzeComps(state)
  const segment = interpretSegment(state)
  const evidence = interpretEvidence(state)

  // ---- cost read ----
  let costRead: string
  if (derived.totalUnitCost <= 0) {
    costRead = 'No cost components are entered yet, so the cost floor is unknown.'
  } else {
    costRead = `Total unit cost is $${formatMoney(derived.totalUnitCost)} based on the components entered. This is the floor; the price has to clear this plus a margin worth the team’s time.`
  }

  // ---- margin read ----
  let marginRead: string
  if (derived.unitMargin == null || derived.grossMarginPct == null) {
    marginRead = 'Add a proposed price and at least one cost component to see margin guidance.'
  } else if (derived.belowCost) {
    marginRead =
      'Warning: the proposed price is below total unit cost. This product would lose money before fixed costs.'
  } else if (margin.band === 'weak') {
    marginRead = `At a ${formatPct(derived.grossMarginPct)} gross margin, this is weak for a pop-up product. The team may need a higher price, lower cost, or a stronger volume plan.`
  } else if (margin.band === 'tight') {
    marginRead = `At a ${formatPct(derived.grossMarginPct)} gross margin, this is workable but tight. The team should watch cost creep and leftover inventory.`
  } else if (margin.band === 'healthy') {
    marginRead = `At a ${formatPct(derived.grossMarginPct)} gross margin, this is healthy for many student retail products, assuming the price is acceptable to the target buyer.`
  } else {
    marginRead = `At a ${formatPct(derived.grossMarginPct)} gross margin, this is a strong margin — but the team needs evidence that customers will accept the price.`
  }

  // ---- comp read ----
  let compRead: string
  if (comps.evidence.band === 'none') {
    compRead =
      'No comparable products on file yet. Add comps so the price can be argued against the market, not in isolation.'
  } else if (comps.evidence.band === 'one') {
    compRead =
      'Only one comp on file. The builder cannot place this price against a range until at least two valid comps exist.'
  } else if (comps.band === 'no_price') {
    compRead = `Based on the comps entered, the comparable range is $${formatMoney(comps.min)}–$${formatMoney(comps.max)} (median $${formatMoney(comps.median)}). Enter a proposed price to see how it compares.`
  } else {
    const proposedTxt =
      derived.unitMargin != null && state?.proposedPrice != null
        ? `$${formatMoney(state.proposedPrice)}`
        : 'the proposed price'
    if (comps.band === 'within_range') {
      compRead = `Based on the comps entered, the range is $${formatMoney(comps.min)}–$${formatMoney(comps.max)} (median $${formatMoney(comps.median)}). At ${proposedTxt}, this price is within the comp range. Market-aligned at face value; this does not prove demand.`
    } else if (comps.band === 'below_range') {
      compRead = `Based on the comps entered, the range is $${formatMoney(comps.min)}–$${formatMoney(comps.max)}. At ${proposedTxt}, this price is below every comp on file. This suggests value positioning, but check whether it reads as "not real" or compresses margin past what fixed costs allow.`
    } else if (comps.band === 'above_range') {
      compRead = `Based on the comps entered, the range is $${formatMoney(comps.min)}–$${formatMoney(comps.max)}. At ${proposedTxt}, this price sits above every comp on file. Defensible if the production story, materials, or limited-run scarcity supports premium positioning.`
    } else if (comps.band === 'far_above_range') {
      compRead = `Based on the comps entered, the range is $${formatMoney(comps.min)}–$${formatMoney(comps.max)}. At ${proposedTxt}, this price is far above every comp on file. Acceptance risk is high unless the product, story, or quality is exceptional.`
    } else {
      compRead = comps.detail
    }
  }

  // ---- segment read ----
  const segmentRead = segment.detail

  // ---- risk read (composite — picks the most pressing) ----
  let risk: string
  if (derived.belowCost) {
    risk =
      'The product loses money on contribution alone. Locking this price in would mean every unit sold deepens the loss.'
  } else if (margin.band === 'weak') {
    risk =
      'Margin is too thin to absorb extra costs (returns, packaging, transaction fees) or a slow-selling final hour.'
  } else if (comps.band === 'far_above_range') {
    risk =
      'Price acceptance is the biggest risk — the proposed price sits well above the comp range without preorder evidence yet.'
  } else if (comps.evidence.band === 'none' || comps.evidence.band === 'one') {
    risk =
      'Comparable evidence is too thin to argue this price is market-aligned. The team should not treat the price as proven on this evidence.'
  } else if (evidence.band === 'low' || evidence.band === 'none') {
    risk =
      'Direct customer evidence (preorders, side-by-side tests, structured interviews) is still thin. Comps can be defensible without proving demand.'
  } else {
    risk =
      'Soft risks remain — keep watching cost creep, leftover inventory, and any change in vendor quotes before TechTown.'
  }

  // ---- next validation ----
  let nextValidation: string
  const studentValidation = (state?.validationStep || '').trim()
  if (studentValidation) {
    nextValidation = studentValidation
  } else if (comps.evidence.band === 'none' || comps.evidence.band === 'one') {
    nextValidation =
      'Add at least two real comparable products with name, price, and source. Then plan a small preorder or interview round to test acceptance at this price.'
  } else if (evidence.band === 'low' || evidence.band === 'none') {
    nextValidation =
      'Run a small preorder or side-by-side test to convert assumptions into direct customer evidence before locking the price in.'
  } else {
    nextValidation =
      'Document the validation plan that justifies high confidence — the post-event recap will compare against it.'
  }

  return { costRead, marginRead, compRead, segmentRead, risk, nextValidation }
}

// ---------- price-test summary ----------

export interface PriceTestRowSummary {
  id: string
  price: number | null
  expectedUnitsSold: number | null
  estRevenue: number | null
  estUnitMargin: number | null
  estGrossMarginPct: number | null
  estGrossProfit: number | null
  notes?: string
}

export interface PriceTestSummary {
  rows: PriceTestRowSummary[]
  totalUnitCost: number
}

export function summarizePriceTests(
  state: PricingStrategyBuilder | null
): PriceTestSummary {
  const totalUnitCost = computeDerived(state).totalUnitCost
  const tests: PricingStrategyPriceTest[] = state?.priceTests ?? []
  const rows: PriceTestRowSummary[] = tests.map((t) => {
    const price = safeNum(t.price)
    const units = safeNum(t.expectedUnitsSold)
    const margin = price != null ? price - totalUnitCost : null
    const grossMarginPct =
      price != null && price > 0 && margin != null
        ? (margin / price) * 100
        : null
    const revenue = price != null && units != null ? price * units : null
    const grossProfit = margin != null && units != null ? margin * units : null
    return {
      id: t.id,
      price,
      expectedUnitsSold: units,
      estRevenue: revenue,
      estUnitMargin: margin,
      estGrossMarginPct: grossMarginPct,
      estGrossProfit: grossProfit,
      notes: t.notes
    }
  })
  return { rows, totalUnitCost }
}

// ---------- formatting helpers ----------
// Display rounding only — math helpers above never round.

export function formatMoney(n: number | null | undefined): string {
  const v = safeNum(n)
  if (v == null) return '—'
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function formatPct(n: number | null | undefined): string {
  const v = safeNum(n)
  if (v == null) return '—'
  return `${v.toFixed(1)}%`
}

export function formatUnits(n: number | null | undefined): string {
  const v = safeNum(n)
  if (v == null) return '—'
  return Math.round(v).toLocaleString()
}
