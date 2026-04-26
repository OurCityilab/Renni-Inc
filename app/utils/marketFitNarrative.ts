// Pure deterministic helpers for the Market Fit Builder's cross-
// section reference panels. Lives outside the components so the
// Chapter 8 demand-to-revenue narrative and the Chapter 11 carry
// readiness summary can be unit-checked at a glance and shared by any
// future surface that needs the same wording. No Vue / Firestore /
// AI dependencies.
//
// Important boundary: this module never decides for the team. It
// surfaces the math the team typed in and proposes language; the
// student still owns the recommendation, the Co-CEO still owns
// approval, and the CFO pricing/break-even engine still owns
// cost/margin calls. We never produce a different number than what
// the student entered — only round and reformat.

import type {
  MarketFitBuilder,
  MarketFitComparable,
  MarketFitCompTypeFlags,
  MarketFitEvidenceRequest,
  MarketFitScenarioAssumptions,
  MarketFitSegment,
  MarketFitSignal
} from '~/types/models'
import { fmtCurrency, fmtNumber } from '~/utils/marketBuilderMath'

// Same percent-as-0..100 convention the Market Builder uses, so the
// numbers in this rollup match the editor's table. Anything missing
// reads as null and the formatter prints "—".
function deriveBuyers(
  audience: number | null | undefined,
  interestPct: number | null | undefined,
  conversionPct: number | null | undefined
): number | null {
  if (audience == null || interestPct == null || conversionPct == null) return null
  if (
    !Number.isFinite(audience) ||
    !Number.isFinite(interestPct) ||
    !Number.isFinite(conversionPct)
  ) {
    return null
  }
  const raw = audience * (interestPct / 100) * (conversionPct / 100)
  if (!Number.isFinite(raw)) return null
  return Math.max(0, Math.round(raw))
}

function deriveRevenue(buyers: number | null, price: number | null | undefined): number | null {
  if (buyers == null || price == null || !Number.isFinite(price)) return null
  const raw = buyers * price
  if (!Number.isFinite(raw)) return null
  return Math.round(raw)
}

export type MarketFitScenarioLevel = 'conservative' | 'base' | 'ambitious'

export interface MarketFitScenarioRow {
  level: MarketFitScenarioLevel
  audience: number | null
  interestPct: number | null
  conversionPct: number | null
  price: number | null
  buyers: number | null
  revenue: number | null
}

// Walks the MarketFit scenarios for the segment selected in the
// scenario assumptions block. Returns null when no segment is
// selected (the builder shows a "pick a segment" hint there).
export function selectedSegmentRows(
  fit: MarketFitBuilder | null | undefined
): MarketFitScenarioRow[] | null {
  if (!fit) return null
  const sa = fit.scenarioAssumptions
  if (!sa?.selectedSegmentId) return null
  const seg = (fit.segments ?? []).find((s) => s.id === sa.selectedSegmentId)
  if (!seg) return null
  const audience = seg.reachableAudience ?? null
  const price = fit.productFacts?.price ?? null
  const levels: Array<{
    level: MarketFitScenarioLevel
    interestKey: keyof MarketFitScenarioAssumptions
    conversionKey: keyof MarketFitScenarioAssumptions
  }> = [
    {
      level: 'conservative',
      interestKey: 'conservativeInterestRatePct',
      conversionKey: 'conservativeConversionRatePct'
    },
    {
      level: 'base',
      interestKey: 'baseInterestRatePct',
      conversionKey: 'baseConversionRatePct'
    },
    {
      level: 'ambitious',
      interestKey: 'ambitiousInterestRatePct',
      conversionKey: 'ambitiousConversionRatePct'
    }
  ]
  return levels.map(({ level, interestKey, conversionKey }) => {
    const interestPct = (sa[interestKey] as number | null | undefined) ?? null
    const conversionPct = (sa[conversionKey] as number | null | undefined) ?? null
    const buyers = deriveBuyers(audience, interestPct, conversionPct)
    const revenue = deriveRevenue(buyers, price)
    return {
      level,
      audience,
      interestPct,
      conversionPct,
      price,
      buyers,
      revenue
    }
  })
}

export function selectedSegment(
  fit: MarketFitBuilder | null | undefined
): MarketFitSegment | null {
  if (!fit?.scenarioAssumptions?.selectedSegmentId) return null
  return (
    (fit.segments ?? []).find(
      (s) => s.id === fit.scenarioAssumptions!.selectedSegmentId
    ) ?? null
  )
}

// --- Chapter 8 demand-to-revenue narrative -------------------------
// One short paragraph the student can read off the screen and put in
// final Playbook text after editing. We never invent numbers; if the
// inputs are missing the narrative says so. The narrative explicitly
// names the boundary between demand-side estimates and the CFO
// pricing/break-even engine.
export function buildDemandToRevenueNarrative(
  fit: MarketFitBuilder | null | undefined
): string {
  if (!fit) {
    return 'No Market Fit Builder data has been saved for this section yet.'
  }
  const seg = selectedSegment(fit)
  const rows = selectedSegmentRows(fit)
  const productName = fit.productFacts?.productName?.trim() || 'this product'
  const price = fit.productFacts?.price ?? null

  if (!seg || !rows) {
    return `Pick a selected segment in Market Fit Builder for ${productName} so the demand-to-revenue narrative can be generated. Pricing and break-even still come from the CFO engine, not from this estimate.`
  }

  const baseRow = rows.find((r) => r.level === 'base')
  const consRow = rows.find((r) => r.level === 'conservative')
  const ambRow = rows.find((r) => r.level === 'ambitious')

  const segLabel = seg.name?.trim() || 'the selected segment'
  const audienceText = seg.reachableAudience != null ? fmtNumber(seg.reachableAudience) : '—'
  const priceText = price != null ? fmtCurrency(price) : '—'
  const baseInterestText = baseRow?.interestPct != null ? `${baseRow.interestPct}%` : '—'
  const baseConversionText =
    baseRow?.conversionPct != null ? `${baseRow.conversionPct}%` : '—'
  const baseBuyersText = baseRow?.buyers != null ? fmtNumber(baseRow.buyers) : '—'
  const baseRevenueText = baseRow?.revenue != null ? fmtCurrency(baseRow.revenue) : '—'

  // Profile mention: when the selected segment carries a customer
  // profile name, use it to set up the lead so the narrative reads as
  // a positioning statement, not just a segment label.
  const profileName = seg.profile?.profileName?.trim() || null
  const profileLead = profileName
    ? `Target profile: ${profileName} (modeled as ${segLabel}).`
    : ''

  const lead = `For ${productName} at ${priceText}, the team has selected ${segLabel} as the modeled segment with a reachable audience of ${audienceText}. The base scenario uses interest ${baseInterestText} and conversion ${baseConversionText}, which estimates ${baseBuyersText} buyers and ${baseRevenueText} revenue.`

  const range =
    consRow?.revenue != null && ambRow?.revenue != null
      ? ` The conservative-to-ambitious revenue range is ${fmtCurrency(consRow.revenue)} to ${fmtCurrency(ambRow.revenue)}.`
      : ''

  const tradeoff = pickTradeoffLine(seg)
  const tradeoffText = tradeoff ? ` Key tradeoff: ${tradeoff}` : ''

  // Positioning notes: strongest comp type and source-gap signal so
  // the narrative reflects whether the price/profile claim is backed
  // by comps and whether the team still owes evidence work.
  const compSummary = findStrongestCompType(fit.comparables)
  const compText = compSummary
    ? ` Strongest comp type: ${compSummary.label.toLowerCase()} (${compSummary.strongCount} strong of ${compSummary.totalCount}).`
    : ''
  const gap = detectSourceGap(fit.evidenceRequests)
  const gapText = gap.noRequestsAtAll
    ? ' Source gap: no evidence requests have been logged yet — the deterministic summary cannot be cited as proof until the team adds and answers source requests.'
    : gap.hasGap
      ? ` Source gap: ${gap.openRequests.length} evidence request${gap.openRequests.length === 1 ? '' : 's'} still open — keep the estimate labeled as an estimate until they're answered.`
      : ''
  const affordability = hasAffordabilityVsDemandRisk(fit)
    ? ' Affordability vs demand: someone being able to afford the product does not prove they want it. Pair income/profile context with surveys, interviews, preorders, or observed behavior.'
    : ''

  const weakest =
    fit.recommendation?.weakestAssumption?.trim() ||
    seg.risk?.trim() ||
    ''
  const weakestText = weakest ? ` Weakest assumption: ${weakest}.` : ''

  const validation =
    fit.recommendation?.recommendedNextValidation?.trim() ||
    seg.nextValidationStep?.trim() ||
    ''
  const validationText = validation
    ? ` Validate this before making inventory commitments — next step: ${validation}.`
    : ' Validate this before making inventory commitments.'

  const boundary =
    ' Demand scenarios estimate possible buyers and revenue. Pricing/break-even still controls cost, margin, and break-even decisions.'

  return [
    profileLead && `${profileLead} `,
    lead,
    range,
    tradeoffText,
    compText,
    gapText,
    affordability,
    weakestText,
    validationText,
    boundary
  ]
    .filter(Boolean)
    .join('')
}

const SIGNAL_SCORE: Record<MarketFitSignal, number> = {
  '': 0,
  low: 1,
  medium: 2,
  high: 3
}

function score(seg: MarketFitSegment, key: keyof MarketFitSegment): number {
  const value = seg[key]
  if (value === '' || value == null) return 0
  if (typeof value !== 'string') return 0
  return SIGNAL_SCORE[value as MarketFitSignal] ?? 0
}

// Pull the first applicable tradeoff line for a segment. Mirrors the
// editor's tradeoffLines logic so the cross-chapter narrative reads
// the same as what the student saw on the source page.
function pickTradeoffLine(seg: MarketFitSegment): string | null {
  const reach = score(seg, 'reachability')
  const price = score(seg, 'priceFit')
  const story = score(seg, 'storyFit')
  const willingness = score(seg, 'willingnessToPay')
  const evidence = score(seg, 'evidenceStrength')
  const name = seg.name?.trim() || 'the selected segment'

  if (reach >= 2 && price > 0 && price <= 1) {
    return `${name} is highly reachable but price fit is weak — reasonable as an awareness or validation market, not a primary buying market.`
  }
  if (price >= 2 && reach > 0 && reach <= 1) {
    return `${name} has strong price fit but is hard to reach — your channel plan needs to solve that before this becomes a primary market.`
  }
  if (story >= 2 && price > 0 && price <= 1) {
    return `${name} loves the story but the price is a stretch — defend the price with quality / sourcing evidence before relying on this segment.`
  }
  if (willingness >= 2 && evidence <= 1) {
    return `${name} is assumed willing to pay, but evidence is thin — survey or preorder before committing inventory at this price.`
  }
  return null
}

// --- Product Positioning Intelligence helpers ----------------------
// Deterministic, additive layer on top of the existing fit math.
// These helpers describe *why* a comp is useful, *whether* the team
// has the sources it needs, and *which* customer profile (if any) is
// emerging. Students see the same wording in the editor, the cross-
// chapter reference panel, and the Playbook-ready preview.

const COMP_TYPE_LABELS: Record<keyof MarketFitCompTypeFlags, string> = {
  product: 'Product',
  price: 'Price',
  quality: 'Quality',
  story: 'Story',
  customer: 'Customer',
  channel: 'Channel',
  style: 'Style',
  localMade: 'Local-made'
}

export interface CompFeedback {
  // Single-line student-facing message describing what the comp
  // proves and what it does not. Returned as plain text — the
  // editor and panel render it verbatim.
  message: string
  // Subset of comp-types that drove the message. Lets the renderer
  // emphasize the right chips without re-running the heuristics.
  highlightedTypes: Array<keyof MarketFitCompTypeFlags>
}

function compTypeKeys(flags: MarketFitCompTypeFlags | undefined): Array<keyof MarketFitCompTypeFlags> {
  if (!flags) return []
  const out: Array<keyof MarketFitCompTypeFlags> = []
  for (const key of Object.keys(COMP_TYPE_LABELS) as Array<keyof MarketFitCompTypeFlags>) {
    if (flags[key]) out.push(key)
  }
  return out
}

// Heuristic feedback rules from the Product Positioning doc. First
// match wins so contradictory messages can't surface together. The
// rules are conservative — they describe what the comp can defend,
// not whether the comp is "approved."
export function buildCompFeedback(comp: MarketFitComparable): CompFeedback | null {
  const flags = comp.compTypes ?? {}
  const align = comp.compAlignment ?? ''
  const keys = compTypeKeys(flags)
  if (keys.length === 0 && !align) return null

  const has = (k: keyof MarketFitCompTypeFlags) => flags[k] === true

  if (align === 'strong' && (has('price') || has('story'))) {
    const types: Array<keyof MarketFitCompTypeFlags> = []
    if (has('price')) types.push('price')
    if (has('story')) types.push('story')
    return {
      message:
        'Strong price/story comp: useful for defending premium positioning. Cite this comp when defending price.',
      highlightedTypes: types
    }
  }
  if (has('product') && !has('price') && !has('customer')) {
    return {
      message:
        'Category comp only: useful for product comparison, weak for price or target customer. Pair with a price or customer comp before using as proof.',
      highlightedTypes: ['product']
    }
  }
  if (has('style') && !has('customer') && !has('price')) {
    return {
      message:
        'Style comp: useful for visual direction, but does not prove demand. Pair with a customer comp before using to argue who buys.',
      highlightedTypes: ['style']
    }
  }
  if (has('customer')) {
    return {
      message:
        'Customer comp: useful for understanding who the product may attract. Confirm the brand actually targets that buyer — students wearing a brand does not prove students are the target.',
      highlightedTypes: ['customer']
    }
  }
  if (has('localMade')) {
    return {
      message:
        'Local-made comp: useful for production-story credibility. Pair with a price comp to defend the premium ask.',
      highlightedTypes: ['localMade']
    }
  }
  if (align === 'weak' || align === 'unsure') {
    return {
      message:
        'Alignment is weak. Use this comp as a research prompt, not as proof. Find one stronger comp on price, story, or customer before relying on it.',
      highlightedTypes: keys
    }
  }
  if (align === 'partial') {
    return {
      message:
        'Partial alignment: name what this comp proves and what it does not. Add a second comp that covers the missing dimension.',
      highlightedTypes: keys
    }
  }
  return {
    message:
      'Mark which dimensions align (price, story, customer, channel, style, local-made) so the comp can be used as evidence.',
    highlightedTypes: []
  }
}

// Strongest alignment dimension across all comparables — used by the
// summary, the preview, and the AI synthesizer. Counts the
// "strong"-aligned comps per dimension; returns the leader and the
// count so the surface can write "Strongest comp type: price (3 of 5)"
// or fall back to alignment-agnostic counts.
export interface StrongestCompTypeResult {
  type: keyof MarketFitCompTypeFlags
  label: string
  strongCount: number
  totalCount: number
}

export function findStrongestCompType(
  comparables: MarketFitComparable[] | undefined
): StrongestCompTypeResult | null {
  if (!comparables || comparables.length === 0) return null
  const strongTotals: Partial<Record<keyof MarketFitCompTypeFlags, number>> = {}
  const totals: Partial<Record<keyof MarketFitCompTypeFlags, number>> = {}
  for (const comp of comparables) {
    const isStrong = comp.compAlignment === 'strong'
    for (const key of compTypeKeys(comp.compTypes)) {
      totals[key] = (totals[key] ?? 0) + 1
      if (isStrong) strongTotals[key] = (strongTotals[key] ?? 0) + 1
    }
  }
  let bestKey: keyof MarketFitCompTypeFlags | null = null
  let bestScore = -1
  // Prefer strong-aligned dimensions; break ties by total count so a
  // dimension covered by many comps still surfaces when none have been
  // graded as "strong" yet.
  for (const key of Object.keys(COMP_TYPE_LABELS) as Array<keyof MarketFitCompTypeFlags>) {
    const strong = strongTotals[key] ?? 0
    const total = totals[key] ?? 0
    const score = strong * 10 + total
    if (score > bestScore && total > 0) {
      bestScore = score
      bestKey = key
    }
  }
  if (!bestKey) return null
  return {
    type: bestKey,
    label: COMP_TYPE_LABELS[bestKey],
    strongCount: strongTotals[bestKey] ?? 0,
    totalCount: totals[bestKey] ?? 0
  }
}

// --- Source gap detection ------------------------------------------
// "Gap" = the team has at least one evidence request still open, OR no
// evidence requests at all. The summary mentions the gap explicitly so
// students don't sleepwalk into using estimates as facts.
export interface SourceGapResult {
  hasGap: boolean
  // Open requests with status 'needed' or 'in_progress'. Empty when
  // there are no requests at all.
  openRequests: MarketFitEvidenceRequest[]
  // True when no requests exist on the section at all — surfaces
  // differently in copy than "requests exist but unfulfilled".
  noRequestsAtAll: boolean
}

export function detectSourceGap(
  evidenceRequests: MarketFitEvidenceRequest[] | undefined
): SourceGapResult {
  const list = evidenceRequests ?? []
  if (list.length === 0) {
    return { hasGap: true, openRequests: [], noRequestsAtAll: true }
  }
  const open = list.filter(
    (r) => r.status === 'needed' || r.status === 'in_progress' || !r.status
  )
  return {
    hasGap: open.length > 0,
    openRequests: open,
    noRequestsAtAll: false
  }
}

// --- Customer profile helpers --------------------------------------
// Find the strongest profile across all segments. "Strongest" =
// (a) a segment whose role is primary or secondary if set, otherwise
// (b) the segment with the highest combined fit signal. The result
// reports the profileName when present so the summary reads "Civic
// Premium Buyer" not "Detroit supporters".
const SIGNAL_SCORE_PROFILE: Record<MarketFitSignal, number> = {
  '': 0,
  low: 1,
  medium: 2,
  high: 3
}
function fitScore(seg: MarketFitSegment): number {
  return (
    SIGNAL_SCORE_PROFILE[seg.priceFit ?? ''] +
    SIGNAL_SCORE_PROFILE[seg.storyFit ?? ''] +
    SIGNAL_SCORE_PROFILE[seg.reachability ?? ''] +
    SIGNAL_SCORE_PROFILE[seg.willingnessToPay ?? ''] +
    SIGNAL_SCORE_PROFILE[seg.evidenceStrength ?? '']
  )
}

export interface ProfilePick {
  segment: MarketFitSegment
  profileName: string | null
}

export function pickStrongestProfile(
  fit: MarketFitBuilder | null | undefined
): ProfilePick | null {
  const segments = fit?.segments ?? []
  if (segments.length === 0) return null
  const sorted = [...segments].sort((a, b) => fitScore(b) - fitScore(a))
  const top = sorted[0]
  if (!top) return null
  const profileName = top.profile?.profileName?.trim() || null
  return { segment: top, profileName }
}

// Affordability-vs-demand red flag: income/profile context exists,
// but willingness/evidence is weak. Returns true when the team is
// implicitly leaning on "they could afford it" without "they would
// buy it" evidence.
export function hasAffordabilityVsDemandRisk(
  fit: MarketFitBuilder | null | undefined
): boolean {
  const segments = fit?.segments ?? []
  for (const seg of segments) {
    const hasProfileContext =
      Boolean(seg.profile?.profileName?.trim()) ||
      Boolean(seg.profile?.incomeRange?.trim()) ||
      Boolean(seg.profile?.geographyContext?.trim())
    const willingness = SIGNAL_SCORE_PROFILE[seg.willingnessToPay ?? '']
    const evidence = SIGNAL_SCORE_PROFILE[seg.evidenceStrength ?? '']
    if (hasProfileContext && (willingness <= 1 || evidence <= 1)) {
      return true
    }
  }
  return false
}

// --- Chapter 11 Phoenix Nest carry readiness -----------------------
// Returns a short recommendation plus the reasoning bullets so the
// pitch author can read both the call and why. The recommendation is
// always advisory — the brief says "Use student-friendly copy. Do not
// make final decisions for students."
export type CarryReadinessLevel =
  | 'limited_or_preorder'
  | 'awareness_or_test'
  | 'validate_first'
  | 'stronger_pitch'
  | 'no_clear_signal'

export interface PhoenixNestCarrySummary {
  level: CarryReadinessLevel
  headline: string
  reasoning: string[]
}

export function buildPhoenixNestCarrySummary(
  fit: MarketFitBuilder | null | undefined
): PhoenixNestCarrySummary {
  if (!fit || !(fit.segments ?? []).length) {
    return {
      level: 'no_clear_signal',
      headline:
        'Add at least one segment to Market Fit Builder so a carry-readiness summary can be generated.',
      reasoning: []
    }
  }

  const reasoning: string[] = []
  const rows = selectedSegmentRows(fit)
  const seg = selectedSegment(fit)

  // Score the strongest-rated segment regardless of selection so the
  // summary reads against the team's best argument, not just the one
  // they parked in the scenario picker.
  const scored = (fit.segments ?? []).map((s) => ({
    segment: s,
    priceFit: score(s, 'priceFit'),
    storyFit: score(s, 'storyFit'),
    reachability: score(s, 'reachability'),
    evidence: score(s, 'evidenceStrength'),
    willingness: score(s, 'willingnessToPay')
  }))
  const top = [...scored].sort(
    (a, b) =>
      b.priceFit + b.storyFit + b.reachability + b.evidence + b.willingness -
      (a.priceFit + a.storyFit + a.reachability + a.evidence + a.willingness)
  )[0]

  const baseBuyers = rows?.find((r) => r.level === 'base')?.buyers ?? null
  const baseRevenue = rows?.find((r) => r.level === 'base')?.revenue ?? null
  const segName = seg?.name?.trim() || top?.segment.name?.trim() || 'the strongest segment'

  // Heuristics requested in the brief, in order of priority. The
  // first match wins so we never produce contradictory headlines.
  if (top && top.evidence <= 1 && top.priceFit + top.willingness >= 3) {
    reasoning.push(
      `${segName} looks promising on price and willingness to pay, but evidence strength is weak — pitch this as a validation step before asking for shelf space.`
    )
    return {
      level: 'validate_first',
      headline:
        'Validate before committing carry inventory — pitch a short test instead of a full order.',
      reasoning
    }
  }

  if (top && top.priceFit >= 2 && top.storyFit >= 2) {
    reasoning.push(
      `${segName} shows strong price fit and strong story fit — lead the pitch with the brand story and the price evidence.`
    )
    if (baseRevenue != null) {
      reasoning.push(
        `Base demand scenario estimates ${fmtNumber(baseBuyers)} buyers and ${fmtCurrency(baseRevenue)} revenue at the proposed retail.`
      )
    }
    return {
      level: 'stronger_pitch',
      headline:
        'Strong story-and-price fit — lead the Phoenix Nest pitch with story, then price evidence.',
      reasoning
    }
  }

  if (top && top.reachability >= 2 && top.priceFit > 0 && top.priceFit <= 1) {
    reasoning.push(
      `${segName} is highly reachable but price fit is weak — better as an awareness or test market than a primary carry buyer.`
    )
    return {
      level: 'awareness_or_test',
      headline:
        'Treat this segment as awareness or test market — propose a small test order, not a primary carry buy.',
      reasoning
    }
  }

  if (top && top.priceFit >= 2 && (baseBuyers == null || baseBuyers < 25)) {
    reasoning.push(
      `${segName} has strong price fit, but the base demand scenario is thin (${baseBuyers != null ? fmtNumber(baseBuyers) : '—'} buyers).`
    )
    reasoning.push(
      'Pitch a limited carry quantity or preorder model so Phoenix Nest carries less risk on the first run.'
    )
    return {
      level: 'limited_or_preorder',
      headline:
        'Pitch limited carry or preorder — strong price fit, modest projected demand.',
      reasoning
    }
  }

  // Nothing matched — be honest about it.
  return {
    level: 'no_clear_signal',
    headline:
      'No clear carry-readiness signal yet. Add ratings, evidence, and a selected scenario in Market Fit Builder.',
    reasoning
  }
}

// --- Compact preview snapshot --------------------------------------
// Returns null when there's no scenario data. Used by the Playbook-
// ready preview to keep the rollup short: selected segment, base
// buyers/revenue, key tradeoff, validation step.
export interface DemandSnapshot {
  segmentName: string
  baseBuyers: number | null
  baseRevenue: number | null
  tradeoff: string | null
  validationStep: string | null
  // Positioning fields surfaced in the Playbook-ready preview when
  // the data is present. All optional so the preview stays compact
  // for sections that haven't filled positioning out yet.
  targetProfile: string | null
  profileLogic: string | null
  strongestCompType: string | null
  sourceGap: string | null
}

export function buildDemandSnapshot(
  fit: MarketFitBuilder | null | undefined
): DemandSnapshot | null {
  const seg = selectedSegment(fit)
  const rows = selectedSegmentRows(fit)
  if (!seg || !rows) return null
  const base = rows.find((r) => r.level === 'base')
  const tradeoff = pickTradeoffLine(seg)
  const validation =
    fit?.recommendation?.recommendedNextValidation?.trim() ||
    seg.nextValidationStep?.trim() ||
    null
  const targetProfile = seg.profile?.profileName?.trim() || null
  // Profile logic: a one-line argument describing why the profile
  // fits. We prefer the segment's `whyItMightFit` when present, then
  // fall back to the recommendation positioning line.
  const profileLogic =
    seg.whyItMightFit?.trim() ||
    fit?.recommendation?.positioningSummary?.trim() ||
    null
  const compSummary = findStrongestCompType(fit?.comparables)
  const strongestCompType = compSummary
    ? `${compSummary.label} (${compSummary.strongCount} strong of ${compSummary.totalCount})`
    : null
  const gap = detectSourceGap(fit?.evidenceRequests)
  const sourceGap = gap.noRequestsAtAll
    ? 'No evidence requests logged yet'
    : gap.hasGap
      ? `${gap.openRequests.length} evidence request${gap.openRequests.length === 1 ? '' : 's'} open`
      : null
  return {
    segmentName: seg.name?.trim() || 'Selected segment',
    baseBuyers: base?.buyers ?? null,
    baseRevenue: base?.revenue ?? null,
    tradeoff,
    validationStep: validation,
    targetProfile,
    profileLogic,
    strongestCompType,
    sourceGap
  }
}
