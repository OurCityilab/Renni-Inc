// Pure helpers for Market Builder display + math. Lives outside the
// Output Workspace component so the read-only reference panels (Ch 8
// and Ch 11) and the editor itself share one source of truth for the
// numbers students see. No Vue or Firestore dependencies — safe to
// import from any layer.

import type {
  EvidenceConfidence,
  MarketBuilderScenario,
  MarketScenarioLevel
} from '~/types/models'

// Stable copy used in headers and tables. Keep in sync with the order
// of the scenarios shipped from the editor; the editor uses this map to
// label each row in the input table and the read-only renderers use it
// to label each row in the preview.
export const SCENARIO_LABEL_COPY: Record<MarketScenarioLevel, string> = {
  conservative: 'Conservative',
  base: 'Base',
  ambitious: 'Ambitious'
}

// Conservative arithmetic. Percent is treated as 0–100. Anything missing
// reads as null and the formatter emits "—". Buyers are floored at 0
// because a negative-buyer projection would be misleading regardless of
// the input the student typed.
export function deriveBuyers(s: MarketBuilderScenario): number | null {
  const audience = s.reachableAudience
  const interest = s.interestRatePercent
  const conversion = s.conversionRatePercent
  if (audience == null || interest == null || conversion == null) return null
  if (
    !Number.isFinite(audience) ||
    !Number.isFinite(interest) ||
    !Number.isFinite(conversion)
  ) {
    return null
  }
  const raw = audience * (interest / 100) * (conversion / 100)
  if (!Number.isFinite(raw)) return null
  return Math.max(0, Math.round(raw))
}

export function deriveRevenue(s: MarketBuilderScenario): number | null {
  const buyers = deriveBuyers(s)
  const price = s.price
  if (buyers == null || price == null) return null
  if (!Number.isFinite(price)) return null
  const raw = buyers * price
  if (!Number.isFinite(raw)) return null
  // Whole dollars; cents would oversell the precision of an estimate
  // that depends on student-entered percentages.
  return Math.round(raw)
}

export function fmtNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString()
}

export function fmtCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return `$${n.toLocaleString()}`
}

// Confidence chip palette shared by structured evidence and Market
// Builder so the same confidence label always reads the same color
// across the workspace.
export function confidenceTone(c?: EvidenceConfidence): string {
  if (c === 'high') return 'border-emerald-300 bg-emerald-50 text-emerald-800'
  if (c === 'medium') return 'border-amber-300 bg-amber-50 text-amber-800'
  if (c === 'low') return 'border-rose-300 bg-rose-50 text-rose-800'
  return 'border-neutral-300 bg-neutral-50 text-neutral-700'
}
