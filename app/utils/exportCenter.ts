// Export Center V1 — pure deterministic markdown / CSV / JSON
// generators for final presentation prep.
//
// Posture (do not relax):
//   - never persists exports (no Firestore writes, no log)
//   - never fetches anything (no Google Drive, no OAuth, no scraping)
//   - no DOCX / PPTX in V1; markdown + CSV only
//   - the existing app remains the source of truth — exports are
//     snapshots
//
// Helpers below build strings only. The page component decides
// whether to copy to clipboard or trigger a Blob download. Keeping
// rendering and IO separate lets us preview the same string we
// download.

import type {
  Deliverable,
  DeliverableOutput,
  MarketFitBuilder,
  MarketFitSegment,
  PricingStrategyBuilder,
  Task
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import {
  computeDerived as computePricingDerived,
  formatMoney as fmtPricingMoney,
  formatPct as fmtPricingPct,
  interpretCompPosition,
  interpretMargin
} from '~/utils/pricingStrategyMath'
import {
  buildPresentationReadiness,
  type PresentationReadinessSummary,
  type ChapterReadinessRow
} from '~/utils/presentationReadiness'
import { getAdvisorDisplayLabel } from '~/utils/advisorDisplay'
import {
  SOURCE_LABEL,
  type AggregatedAdvisorSignal
} from '~/utils/cSuiteAdvisor'
import { getTemplateStudio } from '~/data/templateStudios'

// ---------- low-level CSV helper ----------

// Minimal CSV escape. Quotes wrap any field that contains a comma /
// newline / double-quote; embedded quotes are doubled. We do not
// emit a BOM; downstream spreadsheets handle UTF-8 fine.
export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(',')
}

// ---------- Markdown helpers ----------

function mdSection(title: string, body: string): string {
  return `## ${title}\n\n${body.trim()}\n`
}
function mdBullets(items: Array<string | undefined | null>): string {
  return items.filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => `- ${s.trim()}`)
    .join('\n')
}
function mdQuote(text: string | undefined | null): string {
  if (!text || !text.trim()) return ''
  return text
    .split(/\r?\n/)
    .map((l) => `> ${l}`)
    .join('\n')
}

// ---------- shared studio resolver ----------

export interface ExportInputs {
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  studioResolver: (d: Deliverable) => TemplateStudio | null
}

// ---------- 1. Final presentation outline (Markdown) ----------

export function buildPresentationOutlineMd(inputs: ExportInputs): string {
  const { rows, summary } = buildPresentationReadiness(inputs)
  const lines: string[] = []
  lines.push('# Final Presentation Outline')
  lines.push('')
  lines.push(
    'Snapshot from Renni Command Center. Renni Command Center remains the source of truth.'
  )
  lines.push('')
  lines.push(mdSection('Readiness summary', [
    `- Total chapters: ${summary.totalChapters}`,
    `- Approved: ${summary.approvedChapters}`,
    `- In review: ${summary.inReviewChapters}`,
    `- Draft: ${summary.draftChapters}`,
    `- Needs revision: ${summary.needsRevisionChapters}`,
    `- Stuck: ${summary.blockerCount}`,
    `- Action today: ${summary.riskCount}`,
    `- Look at soon: ${summary.watchCount}`,
    `- Overdue tasks: ${summary.overdueTaskCount}`,
    `- Blocked tasks: ${summary.blockedTaskCount}`
  ].join('\n')))

  for (const row of rows.sort(
    (a, b) => a.deliverable.chapter - b.deliverable.chapter
  )) {
    const sections = row.studio?.sections ?? []
    const output = inputs.outputs[row.deliverable.id] ?? null
    const sectionLines: string[] = []
    for (const s of sections) {
      const persisted = output?.sections?.[s.id]
      const final = persisted?.finalText?.trim()
      sectionLines.push(`### ${s.title}`)
      if (final) {
        sectionLines.push(final)
      } else {
        sectionLines.push('_(final Playbook text not yet written)_')
      }
      sectionLines.push('')
    }
    const header = `Chapter ${row.deliverable.chapter} — ${row.studio?.title || row.deliverable.title}`
    const meta: string[] = []
    meta.push(`- Status: ${row.status}`)
    meta.push(`- Readiness: ${row.band}`)
    if (row.daysToDue != null) {
      meta.push(`- Days to due: ${row.daysToDue}`)
    }
    if (row.blockerCount > 0) meta.push(`- Stuck signals: ${row.blockerCount}`)
    if (row.riskCount > 0) meta.push(`- Action today signals: ${row.riskCount}`)
    lines.push('')
    lines.push(mdSection(header, [meta.join('\n'), '', sectionLines.join('\n')].join('\n')))
  }
  return lines.join('\n')
}

// ---------- 2. Phoenix Nest carry pitch brief (Markdown) ----------

// Sprint 2 — explicit Ch. 8 / Ch. 7 source IDs for the Phoenix Nest
// brief. Resolving from explicit deliverable ids first means a Ch. 8
// section that already carries pricing wins over an accidental
// pricing field on another chapter.
const CH7_DELIVERABLE_ID_EXPORT = 'ch-07-current-product-line-and-pricing'
const CH8_DELIVERABLE_ID_EXPORT = 'ch-08-finance-and-revenue-model'

function findFirstPricingStrategy(
  inputs: ExportInputs,
  deliverableId: string
): { row: ChapterReadinessRow; ps: PricingStrategyBuilder } | null {
  const output = inputs.outputs[deliverableId] ?? null
  if (!output) return null
  const deliverable = inputs.deliverables.find((d) => d.id === deliverableId)
  if (!deliverable) return null
  const studio = inputs.studioResolver(deliverable)
  for (const s of Object.values(output.sections ?? {})) {
    const ps = s.pricingStrategy
    if (ps?.proposedPrice != null && ps.proposedPrice > 0) {
      const row: ChapterReadinessRow = {
        deliverable,
        studio,
        status: deliverable.status,
        finalTextDone: 0,
        finalTextTotal: 0,
        evidenceCovered: 0,
        hasPricing: true,
        hasMarketFitSegment: false,
        hasFinalRecommendation: false,
        missingRequiredTaskCount: 0,
        blockerCount: 0,
        riskCount: 0,
        watchCount: 0,
        daysToDue: null,
        band: 'almost'
      }
      return { row, ps }
    }
  }
  return null
}

function findFirstMarketFitSegment(
  inputs: ExportInputs,
  deliverableId: string
): { row: ChapterReadinessRow; fit: MarketFitBuilder; seg: MarketFitSegment } | null {
  const output = inputs.outputs[deliverableId] ?? null
  if (!output) return null
  const deliverable = inputs.deliverables.find((d) => d.id === deliverableId)
  if (!deliverable) return null
  const studio = inputs.studioResolver(deliverable)
  for (const s of Object.values(output.sections ?? {})) {
    const fit = s.marketFit
    const segs = fit?.segments ?? []
    if (segs.length > 0 && segs[0] && fit) {
      const row: ChapterReadinessRow = {
        deliverable,
        studio,
        status: deliverable.status,
        finalTextDone: 0,
        finalTextTotal: 0,
        evidenceCovered: 0,
        hasPricing: false,
        hasMarketFitSegment: true,
        hasFinalRecommendation: false,
        missingRequiredTaskCount: 0,
        blockerCount: 0,
        riskCount: 0,
        watchCount: 0,
        daysToDue: null,
        band: 'almost'
      }
      return { row, fit, seg: segs[0] }
    }
  }
  return null
}

export function buildPhoenixNestBriefMd(inputs: ExportInputs): string {
  const lines: string[] = []
  lines.push('# Phoenix Nest carry pitch brief')
  lines.push('')
  lines.push(
    'Snapshot for retail carry conversations. Read the live Renni Command Center for the latest version.'
  )

  // Sprint 2 — prefer explicit Ch. 8 pricing context first, fall
  // back to any chapter only if Ch. 8 has nothing on file. Same
  // pattern for segments (Ch. 7 first).
  let bestPricing: { row: ChapterReadinessRow; ps: PricingStrategyBuilder } | null =
    findFirstPricingStrategy(inputs, CH8_DELIVERABLE_ID_EXPORT)
  let bestSegment: { row: ChapterReadinessRow; fit: MarketFitBuilder; seg: MarketFitSegment } | null =
    findFirstMarketFitSegment(inputs, CH7_DELIVERABLE_ID_EXPORT)
  let pricingSourcedFromCh8 = bestPricing !== null
  let segmentSourcedFromCh7 = bestSegment !== null

  // Fallback: scan every chapter only when the explicit source is
  // empty. This keeps the V1 behavior intact for non-studio cohorts.
  if (!bestPricing || !bestSegment) {
    const { rows } = buildPresentationReadiness(inputs)
    for (const row of rows) {
      const output = inputs.outputs[row.deliverable.id] ?? null
      if (!output) continue
      for (const s of Object.values(output.sections ?? {})) {
        const ps = s.pricingStrategy
        if (
          !bestPricing &&
          ps?.proposedPrice != null &&
          ps.proposedPrice > 0
        ) bestPricing = { row, ps }
        const fit = s.marketFit
        const segs = fit?.segments ?? []
        if (!bestSegment && segs.length > 0 && segs[0]) {
          bestSegment = { row, fit: fit!, seg: segs[0] }
        }
      }
    }
  }

  if (bestPricing) {
    const ps = bestPricing.ps
    const derived = computePricingDerived(ps)
    const margin = interpretMargin(derived)
    const compPos = interpretCompPosition(ps)
    lines.push('')
    lines.push(mdSection('Product + price', [
      `- Product: ${ps.productName || '—'}`,
      `- Proposed price: ${ps.proposedPrice != null ? '$' + fmtPricingMoney(ps.proposedPrice) : '—'}`,
      `- Total unit cost: $${fmtPricingMoney(derived.totalUnitCost)}`,
      `- Unit margin: ${derived.unitMargin != null ? '$' + fmtPricingMoney(derived.unitMargin) : '—'}`,
      `- Gross margin: ${fmtPricingPct(derived.grossMarginPct)} (${margin.label})`,
      `- Comp position: ${compPos.label}` +
        (compPos.min != null && compPos.max != null
          ? ` ($${fmtPricingMoney(compPos.min)}–$${fmtPricingMoney(compPos.max)})`
          : ''),
      `- Production story: ${ps.productionStory || '—'}`,
      `- Confidence: ${ps.confidence || 'not set'}`,
      `- Validation step: ${ps.validationStep || '—'}`
    ].join('\n')))
  } else {
    lines.push('')
    lines.push(mdSection('Product + price', '_(no pricing strategy on file yet)_'))
  }

  if (bestSegment) {
    const seg = bestSegment.seg
    const profile = seg.profile
    lines.push('')
    lines.push(mdSection('Target buyer', [
      `- Segment: ${seg.name || profile?.profileName || '—'}`,
      `- Role / relationship: ${profile?.relationshipRole || '—'}`,
      `- Life stage: ${profile?.lifeStage || '—'}`,
      `- Income bracket: ${profile?.incomeBracket || '—'}`,
      `- Geography: ${profile?.geography || '—'}` + (profile?.urbanicity ? ` · ${profile.urbanicity}` : ''),
      `- Spending power: ${profile?.spendingPower || '—'}`,
      `- Price sensitivity: ${profile?.priceSensitivity || '—'}`,
      `- Buying behavior: ${profile?.buyingBehavior || '—'}`,
      `- Motivations: ${profile?.motivations || '—'}`,
      `- Likely objections: ${profile?.likelyObjections || '—'}`,
      `- Evidence confidence: ${profile?.evidenceConfidence || '—'}`,
      `- Validation step: ${profile?.validationStep || '—'}`
    ].join('\n')))
  } else {
    lines.push('')
    lines.push(mdSection('Target buyer', '_(no Market Fit segment on file yet)_'))
  }

  // Carry risk band — deterministic. Below cost / weak margin /
  // thin comps / low confidence each push the band downward.
  if (bestPricing) {
    const ps = bestPricing.ps
    const derived = computePricingDerived(ps)
    const margin = interpretMargin(derived)
    const compPos = interpretCompPosition(ps)
    const compCount = (ps.comparablePrices ?? []).filter(
      (c) =>
        typeof c.price === 'number' &&
        Number.isFinite(c.price) &&
        c.price > 0 &&
        (c.name?.trim()?.length ?? 0) > 0
    ).length
    const carryRisks: string[] = []
    if (derived.belowCost) carryRisks.push('Below-cost price — every unit loses money before fixed costs.')
    else if (margin.band === 'weak') carryRisks.push('Weak margin (<30%) — leaves little room for retail markup.')
    if (compCount < 2) carryRisks.push(`Light comp evidence (${compCount} valid comp${compCount === 1 ? '' : 's'}; need ≥ 2).`)
    if (!ps.confidence || ps.confidence === 'low') carryRisks.push('Pricing confidence low or unset — willingness-to-pay not validated yet.')
    if (!(ps.validationStep ?? '').trim()) carryRisks.push('No named validation step on file.')
    if (compPos.band === 'far_above_range') carryRisks.push('Price sits well above comp range — acceptance risk is high.')
    if (carryRisks.length > 0) {
      lines.push('')
      lines.push(mdSection('Carry risks', mdBullets(carryRisks)))
    }
  }

  // Carry ask — what the team is asking the Phoenix Nest buyer for.
  // Pulled from current Ch. 8 / Ch. 7 context if available so the
  // brief reads as a real ask, not a template.
  const askLines: string[] = []
  if (bestPricing?.ps.productName) {
    askLines.push(`We are asking Phoenix Nest to consider carrying **${bestPricing.ps.productName}**.`)
  } else {
    askLines.push('We are asking Phoenix Nest to consider carrying our flagship product.')
  }
  if (bestPricing?.ps.proposedPrice != null) {
    askLines.push(`Proposed retail price: $${fmtPricingMoney(bestPricing.ps.proposedPrice)}.`)
  }
  if (bestSegment?.seg.profile?.profileName || bestSegment?.seg.name) {
    askLines.push(`Strongest target buyer: ${bestSegment.seg.profile?.profileName || bestSegment.seg.name}.`)
  }
  if (bestPricing?.ps.productionStory) {
    askLines.push(`Story: ${bestPricing.ps.productionStory}`)
  }
  lines.push('')
  lines.push(mdSection('Carry ask', askLines.join(' ')))

  lines.push('')
  lines.push(mdSection('Carry-pitch reminders', mdBullets([
    'Lead with the buyer + the local-made story.',
    'Show the comp range you researched, not just the price you picked.',
    'Name validation evidence (interviews / preorders / observation).',
    'This brief is a starting point — chiefs and instructor still decide.'
  ])))

  // Source attribution. Helps the chief explain to the buyer where
  // each number came from without re-opening the app.
  lines.push('')
  lines.push(mdSection('Sources', mdBullets([
    pricingSourcedFromCh8
      ? 'Pricing: Chapter 8 — Finance and Revenue Model.'
      : bestPricing
        ? 'Pricing: pulled from chapter outputs (no Ch. 8 pricing yet).'
        : 'Pricing: not yet on file.',
    segmentSourcedFromCh7
      ? 'Segment: Chapter 7 — Market Fit Builder.'
      : bestSegment
        ? 'Segment: pulled from chapter outputs (no Ch. 7 segment yet).'
        : 'Segment: not yet on file.',
    'Source of truth: Renni Command Center.'
  ])))

  return lines.join('\n')
}

// ---------- 3. Pricing summary CSV ----------

export function buildPricingSummaryCsv(inputs: ExportInputs): string {
  const headers = [
    'chapter',
    'section',
    'product',
    'targetSegment',
    'proposedPrice',
    'totalUnitCost',
    'unitMargin',
    'grossMarginPct',
    'breakEvenUnits',
    'compPosition',
    'compMin',
    'compMax',
    'compMedian',
    'confidence',
    'validationStep'
  ]
  const rows: string[] = [csvRow(headers)]
  for (const d of inputs.deliverables) {
    const studio = inputs.studioResolver(d)
    if (!studio) continue
    const output = inputs.outputs[d.id] ?? null
    for (const section of studio.sections) {
      const ps = output?.sections?.[section.id]?.pricingStrategy
      if (!ps?.proposedPrice && (ps?.comparablePrices?.length ?? 0) === 0) continue
      const derived = computePricingDerived(ps ?? null)
      const compPos = interpretCompPosition(ps ?? null)
      rows.push(csvRow([
        studio.title,
        section.title,
        ps?.productName ?? '',
        ps?.targetSegment ?? '',
        ps?.proposedPrice ?? '',
        derived.totalUnitCost.toFixed(2),
        derived.unitMargin != null ? derived.unitMargin.toFixed(2) : '',
        derived.grossMarginPct != null ? derived.grossMarginPct.toFixed(1) : '',
        derived.breakEvenUnits != null ? String(derived.breakEvenUnits) : '',
        compPos.band,
        compPos.min ?? '',
        compPos.max ?? '',
        compPos.median ?? '',
        ps?.confidence ?? '',
        ps?.validationStep ?? ''
      ]))
    }
  }
  return rows.join('\n')
}

// ---------- 4. Advisor action plan (Markdown) ----------

export function buildAdvisorActionPlanMd(
  signals: AggregatedAdvisorSignal[]
): string {
  const lines: string[] = []
  lines.push('# C-Suite Advisor — action plan snapshot')
  lines.push('')
  lines.push(
    'Read-only snapshot of advisor signals. Renni Command Center is the live source of truth.'
  )
  if (signals.length === 0) {
    lines.push('')
    lines.push('_(No active advisor signals.)_')
    return lines.join('\n')
  }
  // Group by display label.
  const groups: Record<string, AggregatedAdvisorSignal[]> = {}
  for (const a of signals) {
    const label = getAdvisorDisplayLabel(a.signal).label
    if (!groups[label]) groups[label] = []
    groups[label].push(a)
  }
  // Sprint 1B: ORDER must match the label values returned by
  // getAdvisorDisplayLabel(). The advisor display layer collapsed
  // to a four-tier student vocabulary in this pass, so the keys
  // here changed from the previous six-label set.
  const ORDER = ['Stuck', 'Action today', 'Look at soon', 'All good']
  for (const label of ORDER) {
    const list = groups[label]
    if (!list?.length) continue
    lines.push('')
    lines.push(`## ${label} (${list.length})`)
    for (const a of list) {
      const info = getAdvisorDisplayLabel(a.signal)
      lines.push('')
      lines.push(`### ${a.studio?.title || a.deliverable.title} — ${a.signal.title}`)
      lines.push(`- Owner: ${a.signal.owner}`)
      if ((a.signal.supportingRoles?.length ?? 0) > 0) {
        lines.push(`- Help from: ${a.signal.supportingRoles!.join(' · ')}`)
      }
      lines.push(`- Source: ${SOURCE_LABEL[a.signal.source]}`)
      lines.push(`- Next action: ${a.signal.nextAction}`)
      lines.push(`- Why it matters: ${info.whyItMatters}`)
      lines.push(`- How to fix: ${info.howToFix}`)
      if (a.signal.dependency) lines.push(`- Happens first: ${a.signal.dependency}`)
      if (a.signal.suggestedTask?.definitionOfDone) {
        lines.push(`- Done looks like: ${a.signal.suggestedTask.definitionOfDone}`)
      }
    }
  }
  return lines.join('\n')
}

// ---------- 5. Playbook chapter export (Markdown) ----------

export function buildPlaybookChapterMd(
  deliverable: Deliverable,
  studio: TemplateStudio | null,
  output: DeliverableOutput | null
): string {
  const lines: string[] = []
  lines.push(`# ${studio?.title || deliverable.title}`)
  lines.push('')
  lines.push(
    `Chapter ${deliverable.chapter} · status ${deliverable.status}. Snapshot from Renni Command Center.`
  )
  if (!studio) {
    lines.push('')
    lines.push('_(This deliverable is not studio-backed.)_')
    return lines.join('\n')
  }
  for (const section of studio.sections) {
    const persisted = output?.sections?.[section.id]
    lines.push('')
    lines.push(`## ${section.title}`)
    lines.push('')
    if (persisted?.finalText?.trim()) {
      lines.push(persisted.finalText.trim())
    } else {
      lines.push('_(final Playbook text not yet written for this section)_')
    }
    if (persisted?.evidenceLinks?.length) {
      lines.push('')
      lines.push('### Evidence links')
      lines.push(
        persisted.evidenceLinks
          .map((l) => `- [${l.label}](${l.url}) (${l.type})`)
          .join('\n')
      )
    }
    if (persisted?.structuredEvidence?.length) {
      lines.push('')
      lines.push('### Structured evidence')
      for (const e of persisted.structuredEvidence) {
        lines.push(`- **${e.claim}** — ${e.evidence} (source: ${e.source})`)
      }
    }
  }
  return lines.join('\n')
}

// ---------- 6. Claude Design brief (Markdown) ----------

// `outputType` is the deliverable shape the team wants from Claude
// Design (one-pager / slide / signage / pitch deck / product sheet).
// Free-form so future targets work without a code change.
export type DesignOutputType =
  | 'one-pager'
  | 'slide'
  | 'signage'
  | 'pitch deck'
  | 'product sheet'

export function buildDesignBriefMd(
  inputs: ExportInputs,
  outputType: DesignOutputType
): string {
  const lines: string[] = []
  lines.push(`# Claude Design brief — ${outputType}`)
  lines.push('')
  lines.push('Brand context — Renni Inc., flagship House Phoenix, supporting Lumen / Notice / Humble Oven.')
  lines.push('Renaissance students, TechTown pop-up + Phoenix Nest retail carry pitch.')

  // Pull pricing + segment + comp context using the same logic as
  // the Phoenix Nest brief. Reusing keeps the design brief in sync.
  const { rows } = buildPresentationReadiness(inputs)
  let bestPricing: { row: ChapterReadinessRow; ps: PricingStrategyBuilder } | null = null
  let bestSegment: { row: ChapterReadinessRow; seg: MarketFitSegment } | null = null
  for (const row of rows) {
    const output = inputs.outputs[row.deliverable.id] ?? null
    if (!output) continue
    for (const s of Object.values(output.sections ?? {})) {
      const ps = s.pricingStrategy
      if (!bestPricing && ps?.proposedPrice != null && ps.proposedPrice > 0) {
        bestPricing = { row, ps }
      }
      const segs = s.marketFit?.segments ?? []
      if (!bestSegment && segs.length > 0 && segs[0]) {
        bestSegment = { row, seg: segs[0] }
      }
    }
  }

  lines.push('')
  lines.push(mdSection('Product', mdBullets([
    bestPricing ? `Product: ${bestPricing.ps.productName || '—'}` : 'Product: not set',
    bestPricing
      ? `Proposed price: ${bestPricing.ps.proposedPrice != null ? '$' + fmtPricingMoney(bestPricing.ps.proposedPrice) : '—'}`
      : 'Proposed price: not set',
    bestPricing ? `Production story: ${bestPricing.ps.productionStory || '—'}` : null,
    bestPricing ? `Quality level: ${bestPricing.ps.qualityLevel || '—'}` : null
  ])))

  lines.push('')
  lines.push(mdSection('Target segment', mdBullets([
    bestSegment ? `Segment: ${bestSegment.seg.name || bestSegment.seg.profile?.profileName || '—'}` : 'Segment: not set',
    bestSegment?.seg.profile?.lifeStage ? `Life stage: ${bestSegment.seg.profile.lifeStage}` : null,
    bestSegment?.seg.profile?.incomeBracket ? `Income: ${bestSegment.seg.profile.incomeBracket}` : null,
    bestSegment?.seg.profile?.spendingPower ? `Spending power: ${bestSegment.seg.profile.spendingPower}` : null,
    bestSegment?.seg.profile?.motivations ? `Motivations: ${bestSegment.seg.profile.motivations}` : null,
    bestSegment?.seg.profile?.likelyObjections ? `Likely objections: ${bestSegment.seg.profile.likelyObjections}` : null
  ])))

  if (bestPricing) {
    const derived = computePricingDerived(bestPricing.ps)
    const compPos = interpretCompPosition(bestPricing.ps)
    lines.push('')
    lines.push(mdSection('Price / margin / comps', mdBullets([
      `Total unit cost: $${fmtPricingMoney(derived.totalUnitCost)}`,
      derived.unitMargin != null ? `Unit margin: $${fmtPricingMoney(derived.unitMargin)}` : null,
      derived.grossMarginPct != null ? `Gross margin: ${fmtPricingPct(derived.grossMarginPct)}` : null,
      `Comp position: ${compPos.label}`,
      compPos.min != null && compPos.max != null
        ? `Comp range: $${fmtPricingMoney(compPos.min)}–$${fmtPricingMoney(compPos.max)}`
        : null
    ])))
  }

  lines.push('')
  lines.push(mdSection('Visual / story notes', mdBullets([
    bestPricing?.ps.brandStoryNotes ? `Brand story: ${bestPricing.ps.brandStoryNotes}` : null,
    bestPricing?.ps.materialNotes ? `Materials: ${bestPricing.ps.materialNotes}` : null,
    bestPricing?.ps.packagingNotes ? `Packaging: ${bestPricing.ps.packagingNotes}` : null,
    bestPricing?.ps.positioningMode ? `Positioning mode: ${bestPricing.ps.positioningMode}` : null
  ])))

  lines.push('')
  lines.push(mdSection(`Desired output: ${outputType}`, mdBullets([
    'Read this as a brief, not a final spec — student chiefs still decide.',
    'Lead with the buyer + the local-made story, not the logo.',
    'Use chips, short cards, simple tables — no dense paragraphs.',
    'Cite the comp range and validation step where relevant.'
  ])))

  return lines.join('\n')
}

// ---------- 7. Final Presentation Coach prompt (Sprint 2, copy-only) ----------
//
// Pure deterministic prompt builder. The output is a structured
// markdown prompt the student copies into Claude / ChatGPT / any LLM
// outside the app — Renni Command Center never sends this anywhere.
// No API call, no Firestore write, no AI dependency at the build
// step. Posture: AI may critique, coach, and suggest, but cannot
// approve, submit, invent data, change calculations, or override
// chiefs/instructor.

export function buildFinalPresentationCoachPromptMd(
  inputs: ExportInputs,
  signals: AggregatedAdvisorSignal[],
  selectedDeliverableId?: string | null
): string {
  const lines: string[] = []
  lines.push('# Final Presentation Coach — prompt for an external LLM')
  lines.push('')
  lines.push(
    'Copy this entire prompt into Claude, ChatGPT, or another LLM. ' +
      'It will critique what is on file in Renni Command Center against ' +
      'the May 12 / 15 final presentation. Do not paste any LLM response back ' +
      'into the app without student review.'
  )

  lines.push('')
  lines.push(mdSection('Role', [
    'You are a final-presentation coach for a high-school student company (Renni Inc., flagship House Phoenix). The team will present to instructors, parents, and Phoenix Nest retail buyers on May 12 or May 15. The TechTown pop-up is May 27.',
    '',
    'You **may not** approve the work, submit it, invent prices, comps, segment data, or demand evidence, or change any calculation. You may critique, coach, and suggest. The student chiefs and the instructor decide.'
  ].join('\n')))

  lines.push('')
  lines.push(mdSection('Output format (always)', mdBullets([
    'Strongest part — what is genuinely defensible.',
    'Missing evidence — what they would be asked about.',
    'Weak assumptions — what they are leaning on without proof.',
    'Stakeholder questions — 3–5 questions an instructor / parent / buyer would ask.',
    'Slide / pitch risk — what could land wrong on stage or in a buyer meeting.',
    'Suggested revision — short, copy-friendly rewrite for the weakest part.',
    'Next validation step — what they should do before May 12.',
    'What the chief should fix before presenting — one sentence per chief role.',
    'Distinguish facts (already on file) from suggestions (you are recommending).',
    'Never approve, submit, invent prices/comps/demand, or change a calculation.'
  ])))

  // Filter to the selected chapter when provided — otherwise emit
  // the whole-program coach prompt.
  let scopedRows: ChapterReadinessRow[] = []
  let scopedSignals: AggregatedAdvisorSignal[] = []
  const { rows } = buildPresentationReadiness(inputs)
  if (selectedDeliverableId) {
    scopedRows = rows.filter((r) => r.deliverable.id === selectedDeliverableId)
    scopedSignals = signals.filter(
      (a) => a.deliverable.id === selectedDeliverableId
    )
    lines.push('')
    lines.push(
      mdSection(
        'Scope',
        `Critique focused on the chapter below. Do not extrapolate to chapters not included in this prompt.`
      )
    )
  } else {
    scopedRows = rows
    scopedSignals = signals
    lines.push('')
    lines.push(
      mdSection(
        'Scope',
        `Critique the team's full final-presentation readiness. Use only the data inside this prompt; do not invent anything else.`
      )
    )
  }

  // Presentation readiness summary.
  const summary = buildSummaryFromRows(scopedRows, scopedSignals, inputs.tasks)
  lines.push('')
  lines.push(mdSection('Readiness snapshot', mdBullets([
    `Chapters covered: ${summary.totalChapters}`,
    `Approved: ${summary.approvedChapters} · In review: ${summary.inReviewChapters} · Draft: ${summary.draftChapters} · Needs revision: ${summary.needsRevisionChapters}`,
    `Stuck: ${summary.blockerCount} · Action today: ${summary.riskCount} · Look at soon: ${summary.watchCount}`,
    `Overdue tasks: ${summary.overdueTaskCount} · Blocked tasks: ${summary.blockedTaskCount} · Ownerless: ${summary.ownerlessTaskCount}`
  ])))

  // Per-chapter context — only include studio-backed chapters that
  // have any saved content. Includes the strongest pricing + first
  // populated segment as already done by the Phoenix Nest brief, so
  // the coach can reason about price-segment fit.
  for (const row of scopedRows) {
    const studio = row.studio
    if (!studio) continue
    const output = inputs.outputs[row.deliverable.id] ?? null
    const sectionLines: string[] = []
    let anyContent = false
    for (const s of studio.sections) {
      const persisted = output?.sections?.[s.id]
      const final = persisted?.finalText?.trim()
      if (!final) continue
      anyContent = true
      sectionLines.push(`### ${s.title}`)
      sectionLines.push(final)
      sectionLines.push('')
    }
    if (!anyContent) continue
    const meta: string[] = [
      `- Status: ${row.status}`,
      `- Readiness: ${row.band}`,
      row.daysToDue != null ? `- Days to due: ${row.daysToDue}` : null,
      row.blockerCount > 0 ? `- Stuck signals: ${row.blockerCount}` : null,
      row.riskCount > 0 ? `- Action today signals: ${row.riskCount}` : null
    ].filter((s): s is string => Boolean(s))
    lines.push('')
    lines.push(
      mdSection(
        `Chapter ${row.deliverable.chapter} — ${studio.title}`,
        [meta.join('\n'), '', sectionLines.join('\n')].join('\n')
      )
    )
  }

  // Advisor signals — give the coach the deterministic gaps so it
  // does not invent its own.
  if (scopedSignals.length > 0) {
    lines.push('')
    lines.push(`## Advisor signals (${scopedSignals.length})`)
    for (const a of scopedSignals.slice(0, 12)) {
      const info = getAdvisorDisplayLabel(a.signal)
      lines.push('')
      lines.push(`### ${info.label} — ${a.studio?.title || a.deliverable.title}: ${a.signal.title}`)
      lines.push(`- Owner: ${a.signal.owner}`)
      lines.push(`- Source: ${SOURCE_LABEL[a.signal.source]}`)
      lines.push(`- Next action: ${a.signal.nextAction}`)
      lines.push(`- Why it matters: ${info.whyItMatters}`)
      lines.push(`- How to fix: ${info.howToFix}`)
    }
  }

  lines.push('')
  lines.push(mdSection('Reminders', mdBullets([
    'Reply only with the structured sections above.',
    'Quote student-authored text when you critique it; do not paraphrase as if it were yours.',
    'When you say something is missing, say what would be enough to satisfy it.',
    'You are coaching, not approving.'
  ])))

  return lines.join('\n')
}

// Tiny re-implementation of the readiness summary for the coach
// prompt. We can't import buildSummary directly without a circular
// dependency between presentationReadiness and exportCenter. Mirrors
// the same counting logic.
function buildSummaryFromRows(
  rows: ChapterReadinessRow[],
  signals: AggregatedAdvisorSignal[],
  tasks: ExportInputs['tasks']
): PresentationReadinessSummary {
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  let approved = 0, inReview = 0, draft = 0, needsRevision = 0
  for (const r of rows) {
    if (r.status === 'approved') approved += 1
    else if (r.status === 'in_review') inReview += 1
    else if (r.status === 'draft') draft += 1
    else if (r.status === 'needs_revision') needsRevision += 1
  }
  const blockerCount = signals.filter((a) => a.signal.severity === 'blocker').length
  const riskCount = signals.filter((a) => a.signal.severity === 'risk').length
  const watchCount = signals.filter((a) => a.signal.severity === 'watch').length
  let blockedTask = 0, overdueTask = 0, ownerlessTask = 0, dueSoon = 0
  for (const t of tasks) {
    if (t.status === 'blocked') blockedTask += 1
    if (
      (t.status === 'not_started' || t.status === 'in_progress') &&
      t.dueDate &&
      t.dueDate < today
    ) overdueTask += 1
    if (!t.ownerEmail || !t.ownerEmail.trim()) ownerlessTask += 1
  }
  return {
    totalChapters: rows.length,
    approvedChapters: approved,
    inReviewChapters: inReview,
    draftChapters: draft,
    needsRevisionChapters: needsRevision,
    bandCounts: {
      ready: rows.filter((r) => r.band === 'ready').length,
      almost: rows.filter((r) => r.band === 'almost').length,
      at_risk: rows.filter((r) => r.band === 'at_risk').length,
      not_started: rows.filter((r) => r.band === 'not_started').length
    },
    blockerCount,
    riskCount,
    watchCount,
    blockedTaskCount: blockedTask,
    overdueTaskCount: overdueTask,
    ownerlessTaskCount: ownerlessTask,
    dueSoonTaskCount: dueSoon
  }
}

// ---------- 8. Final presentation bundle (Sprint 2) ----------
//
// One markdown file that stitches the outline + Phoenix Nest brief +
// advisor action plan + per-chapter Playbook export + Claude design
// brief into a single download. Pure read; no zip required.

export function buildFinalPresentationBundleMd(
  inputs: ExportInputs,
  signals: AggregatedAdvisorSignal[],
  designOutput: DesignOutputType
): string {
  const out: string[] = []
  out.push('# Renni Final Presentation Bundle')
  out.push('')
  out.push(
    'Snapshot bundle for the May 12 / 15 final presentation. Renni Command Center remains the source of truth.'
  )
  out.push('')
  out.push('---')
  out.push('')
  out.push(buildPresentationOutlineMd(inputs))
  out.push('')
  out.push('---')
  out.push('')
  out.push(buildPhoenixNestBriefMd(inputs))
  out.push('')
  out.push('---')
  out.push('')
  out.push(buildAdvisorActionPlanMd(signals))
  out.push('')
  out.push('---')
  out.push('')
  // Per-chapter Playbook text — only chapters with any finalText.
  for (const d of inputs.deliverables) {
    const studio = inputs.studioResolver(d) ?? getTemplateStudio(d.id)
    if (!studio) continue
    const output = inputs.outputs[d.id] ?? null
    const hasAnyFinal = Object.values(output?.sections ?? {}).some(
      (s) => (s.finalText ?? '').trim().length > 0
    )
    if (!hasAnyFinal) continue
    out.push(buildPlaybookChapterMd(d, studio, output))
    out.push('')
    out.push('---')
    out.push('')
  }
  out.push(buildDesignBriefMd(inputs, designOutput))
  return out.join('\n')
}
