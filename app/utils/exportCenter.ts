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
    `- Stops / Blocked: ${summary.blockerCount}`,
    `- Needs Action: ${summary.riskCount}`,
    `- Check Soon: ${summary.watchCount}`,
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
    if (row.blockerCount > 0) meta.push(`- Stops / Blocked signals: ${row.blockerCount}`)
    if (row.riskCount > 0) meta.push(`- Needs Action signals: ${row.riskCount}`)
    lines.push('')
    lines.push(mdSection(header, [meta.join('\n'), '', sectionLines.join('\n')].join('\n')))
  }
  return lines.join('\n')
}

// ---------- 2. Phoenix Nest carry pitch brief (Markdown) ----------

export function buildPhoenixNestBriefMd(inputs: ExportInputs): string {
  const lines: string[] = []
  lines.push('# Phoenix Nest carry pitch brief')
  lines.push('')
  lines.push(
    'Snapshot for retail carry conversations. Read the live Renni Command Center for the latest version.'
  )

  // Pull the strongest pricing strategy and segment context across
  // any chapter that has them populated. Ch. 8 typically owns
  // pricing; Ch. 7 typically owns segments.
  let bestPricing: { row: ChapterReadinessRow; ps: PricingStrategyBuilder } | null = null
  let bestSegment: { row: ChapterReadinessRow; fit: MarketFitBuilder; seg: MarketFitSegment } | null = null
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

  lines.push('')
  lines.push(mdSection('Carry-pitch reminders', mdBullets([
    'Lead with the buyer + the local-made story.',
    'Show the comp range you researched, not just the price you picked.',
    'Name validation evidence (interviews / preorders / observation).',
    'This brief is a starting point — chiefs and instructor still decide.'
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
  const ORDER = ['Stops Submit', 'Blocked Task', 'Major Issue', 'Needs Action', 'Check Soon', 'FYI']
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
