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

  const lead = `For ${productName} at ${priceText}, the team has selected ${segLabel} as the modeled segment with a reachable audience of ${audienceText}. The base scenario uses interest ${baseInterestText} and conversion ${baseConversionText}, which estimates ${baseBuyersText} buyers and ${baseRevenueText} revenue.`

  const range =
    consRow?.revenue != null && ambRow?.revenue != null
      ? ` The conservative-to-ambitious revenue range is ${fmtCurrency(consRow.revenue)} to ${fmtCurrency(ambRow.revenue)}.`
      : ''

  const tradeoff = pickTradeoffLine(seg)
  const tradeoffText = tradeoff ? ` Key tradeoff: ${tradeoff}` : ''

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

  return [lead, range, tradeoffText, weakestText, validationText, boundary]
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
  return {
    segmentName: seg.name?.trim() || 'Selected segment',
    baseBuyers: base?.buyers ?? null,
    baseRevenue: base?.revenue ?? null,
    tradeoff,
    validationStep: validation
  }
}
