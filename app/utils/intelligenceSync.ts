// Intelligence Sync — pure deterministic "what to gather next"
// helper. Takes the same inputs the readiness page already loads
// (deliverables, tasks, outputs, advisor signals) and returns a
// flat list of student-friendly gather-next issues.
//
// Posture (do not relax):
//   - never persists any output, never calls AI, never fetches anything
//   - never gates submit / never affects Playbook readiness
//   - the Cy. 7 → Ch. 8 → Ch. 10 → Ch. 11 sync logic uses the same
//     deterministic helpers the rest of the system already uses
//     (computeDerived, interpretCompPosition, pickCh7SegmentProfile-
//     equivalent inline)
//   - student-facing copy mirrors the advisor display label vocabulary
//     so chiefs see the same words across surfaces
//   - the AI coach prompt is built locally; chiefs copy / paste into
//     an LLM externally

import type {
  Deliverable,
  DeliverableOutput,
  MarketFitCustomerProfile,
  Task
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import type {
  IntelligenceSyncIssue,
  IntelligenceSyncSeverity
} from '~/types/intelligence'
import type { AggregatedAdvisorSignal } from '~/utils/cSuiteAdvisor'
import {
  computeDerived,
  interpretCompPosition,
  interpretMargin
} from '~/utils/pricingStrategyMath'

// ---------- chapter id constants (mirrors cSuiteAdvisor) ----------

const CH7 = 'ch-07-current-product-line-and-pricing'
const CH8 = 'ch-08-finance-and-revenue-model'
const CH10 = 'ch-10-marketing-and-campaign-playbook'
const CH11 = 'ch-11-phoenix-nest-retail-carry-pitch'

// ---------- inputs ----------

export interface IntelligenceSyncInputs {
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  studioResolver: (d: Deliverable) => TemplateStudio | null
  // Advisor signals are optional; the sync helper produces signals
  // independent of the cockpit, but reads any pre-aggregated signal
  // list when the caller has it available so we don't double-aggregate.
  advisorSignals?: AggregatedAdvisorSignal[]
}

// ---------- helpers ----------

function findDeliverable(
  deliverables: Deliverable[],
  id: string
): Deliverable | null {
  return deliverables.find((d) => d.id === id) ?? null
}

// Same selection priority used by cSuiteAdvisor.pickCh7SegmentProfile,
// duplicated locally to avoid a circular import. Returns null when
// no Ch. 7 segment carries any structured profile content.
interface PickedSegment {
  segmentName: string
  profile: MarketFitCustomerProfile
}
function pickCh7Segment(ch7: DeliverableOutput | null): PickedSegment | null {
  if (!ch7) return null
  const sections = Object.values(ch7.sections ?? {})
  // 1. Honor scenarioAssumptions.selectedSegmentId.
  for (const section of sections) {
    const fit = section?.marketFit
    if (!fit) continue
    const selectedId = fit.scenarioAssumptions?.selectedSegmentId ?? null
    if (!selectedId) continue
    const seg = (fit.segments ?? []).find((s) => s.id === selectedId)
    if (seg?.profile) {
      return { segmentName: seg.name || 'Selected segment', profile: seg.profile }
    }
  }
  // 2. First populated profile.
  for (const section of sections) {
    for (const seg of section?.marketFit?.segments ?? []) {
      const p = seg.profile
      if (!p) continue
      const populated =
        Boolean(p.relationshipRole?.trim()) ||
        Boolean(p.lifeStage) ||
        Boolean(p.incomeBracket) ||
        Boolean(p.geography) ||
        Boolean(p.spendingPower) ||
        Boolean(p.priceSensitivity) ||
        Boolean(p.buyingBehavior) ||
        Boolean(p.evidenceConfidence) ||
        Boolean(p.profileName?.trim()) ||
        Boolean(p.motivations?.trim()) ||
        Boolean(p.likelyObjections?.trim())
      if (populated) {
        return { segmentName: seg.name || p.profileName || 'Segment', profile: p }
      }
    }
  }
  return null
}

// Pick the strongest pricing strategy on Ch. 8. Mirrors the advisor
// helper but stays local to avoid a circular import.
function pickCh8Pricing(
  ch8: DeliverableOutput | null
): NonNullable<DeliverableOutput['sections'][string]['pricingStrategy']> | null {
  if (!ch8) return null
  for (const section of Object.values(ch8.sections ?? {})) {
    const ps = section?.pricingStrategy
    if (!ps) continue
    if (
      ps.proposedPrice != null ||
      (ps.comparablePrices?.length ?? 0) > 0 ||
      (ps.priceTests?.length ?? 0) > 0
    ) {
      return ps
    }
  }
  return null
}

function validCompCount(
  ps: NonNullable<DeliverableOutput['sections'][string]['pricingStrategy']>
): number {
  let n = 0
  for (const c of ps.comparablePrices ?? []) {
    if (!c.name?.trim()) continue
    const p = c.price
    if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0) continue
    n += 1
  }
  return n
}

// Concatenate every section's authored text on a chapter so the
// Ch. 10 / Ch. 11 sync rules can ask "does the chapter mention X?"
// without choosing one section as canonical.
function chapterTextBlob(output: DeliverableOutput | null): string {
  if (!output) return ''
  const parts: string[] = []
  for (const s of Object.values(output.sections ?? {})) {
    if (s?.sourceNotes) parts.push(s.sourceNotes)
    if (s?.draftText) parts.push(s.draftText)
    if (s?.finalText) parts.push(s.finalText)
  }
  return parts.join(' \n ').toLowerCase()
}

// Lightweight keyword search — case-insensitive substring match
// against the chapter blob. Heuristic only; the panel words it as
// "if these are missing" rather than "the chapter is wrong."
function blobIncludes(blob: string, ...needles: string[]): boolean {
  for (const n of needles) {
    if (n && blob.includes(n.toLowerCase())) return true
  }
  return false
}

// ---------- shared severity ranking ----------

const SEVERITY_RANK: Record<IntelligenceSyncSeverity, number> = {
  'stops-submit': 0,
  'needs-action': 1,
  'check-soon': 2,
  ready: 3
}

// ---------- AI coach prompt builder (copy-only) ----------

function buildCoachPrompt(issue: Omit<IntelligenceSyncIssue, 'aiCoachPrompt'>): string {
  const lines: string[] = []
  lines.push(`# Help me think through this — Intelligence Sync issue`)
  lines.push('')
  lines.push(
    'Copy this prompt into Claude, ChatGPT, or another LLM. ' +
      'Renni Command Center does not send this anywhere — copy-only.'
  )
  lines.push('')
  lines.push(`## Issue: ${issue.title}`)
  lines.push('')
  lines.push(`- Severity: ${issue.severity}`)
  lines.push(`- Source: ${issue.source}`)
  lines.push(`- Owner: ${issue.owner}`)
  if (issue.helpFrom?.length) {
    lines.push(`- Help from: ${issue.helpFrom.join(' · ')}`)
  }
  lines.push(`- Chapter: ${issue.chapterId ?? 'cross-chapter'}`)
  lines.push('')
  lines.push(`## Summary`)
  lines.push('')
  lines.push(issue.summary)
  if (issue.whatToGather.length) {
    lines.push('')
    lines.push(`## What I need to gather`)
    lines.push('')
    for (const w of issue.whatToGather) lines.push(`- ${w}`)
  }
  lines.push('')
  lines.push(`## Why it matters for the final presentation`)
  lines.push('')
  lines.push(issue.whyItMatters)
  lines.push('')
  lines.push(`## My current next action`)
  lines.push('')
  lines.push(issue.nextAction)
  lines.push('')
  lines.push(`## Done looks like`)
  lines.push('')
  lines.push(issue.doneLooksLike)
  lines.push('')
  lines.push('## Coaching rules (do not break these)')
  lines.push('')
  lines.push('- Do not invent missing facts or numbers.')
  lines.push('- Ask me what evidence I already have before suggesting anything.')
  lines.push('- Suggest questions I should ask, not final answers.')
  lines.push('- You may not approve, submit, or change calculations.')
  lines.push('- The system of record is student-authored work in Renni Command Center.')
  return lines.join('\n')
}

function makeIssue(args: Omit<IntelligenceSyncIssue, 'aiCoachPrompt'>): IntelligenceSyncIssue {
  return { ...args, aiCoachPrompt: buildCoachPrompt(args) }
}

// ---------- A. Ch. 7 segment check ----------

function ch7SegmentIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const out: IntelligenceSyncIssue[] = []
  const ch7 = inputs.outputs[CH7] ?? null
  const picked = pickCh7Segment(ch7)
  if (!picked) {
    out.push(makeIssue({
      id: 'sync-ch7-no-segment',
      severity: 'needs-action',
      title: 'No structured customer segment on Chapter 7',
      summary:
        'Chapter 7 has no Market Fit segment with structured profile data on file. Pricing, campaign, and Phoenix Nest carry all key off the segment.',
      whatToGather: [
        'Target segment name (Civic Premium Buyer, Premium Parent Supporter, etc.)',
        'Income or spending power assumption',
        'Geography / urbanicity',
        'Buying motivation',
        'Likely objection',
        'Evidence source (interviews / survey / observation)',
        'Validation step that would confirm or break this segment'
      ],
      whyItMatters:
        'Segment choice drives pricing, campaign, and Phoenix Nest carry logic. Without one, every downstream argument leans on a guess.',
      owner: 'Chief Strategy and Growth Officer',
      helpFrom: ['CMO', 'CFO'],
      nextAction:
        'Open Chapter 7 → Market Fit and apply a PRIZM-inspired segment template, then fill evidence sources.',
      doneLooksLike:
        'Chapter 7 has at least one segment with profile fields populated, evidence sources named, and a validation step on file.',
      chapterId: CH7,
      route: `/deliverables/${CH7}`,
      source: 'segment'
    }))
    return out
  }
  const p = picked.profile
  // Evidence confidence
  const ec = p.evidenceConfidence ?? ''
  if (!ec || ec === 'low') {
    out.push(makeIssue({
      id: 'sync-ch7-low-evidence',
      severity: ec === 'low' ? 'needs-action' : 'check-soon',
      title: `Segment evidence is ${ec === 'low' ? 'low' : 'unset'} on "${picked.segmentName}"`,
      summary:
        'The segment profile is on file, but the evidence behind it is still mostly assumption.',
      whatToGather: [
        'At least 3 direct customer signals (interviews / survey responses / preorder interest)',
        'Why this segment, not the alternative',
        'Evidence source links',
        'A validation step that would confirm or break the fit'
      ],
      whyItMatters:
        'Pricing and campaign downstream rest on this segment. If the evidence is thin, every downstream argument is thin.',
      owner: 'Chief Strategy and Growth Officer',
      helpFrom: ['CFO'],
      nextAction:
        'Capture direct customer evidence (3+ signals) and set evidenceConfidence to medium or high.',
      doneLooksLike:
        'Segment profile carries at least 3 evidence sources and evidenceConfidence is medium or high.',
      chapterId: CH7,
      route: `/deliverables/${CH7}`,
      source: 'segment'
    }))
  }
  // Validation step
  if (!(p.validationStep ?? '').trim()) {
    out.push(makeIssue({
      id: 'sync-ch7-no-validation',
      severity: 'check-soon',
      title: `No validation step on segment "${picked.segmentName}"`,
      summary:
        'The team has not named the test that would confirm or break this segment fit.',
      whatToGather: [
        'A specific validation step (preorder test, side-by-side, structured interview round)',
        'Sample size goal',
        'Success / fail signal'
      ],
      whyItMatters:
        'Without a named validation step, "we will check later" is a phrase, not a plan. Phoenix Nest buyers respect teams that already know how they will check their assumption.',
      owner: 'Chief Strategy and Growth Officer',
      nextAction:
        'Name a concrete validation step on the segment profile (preorder / interview / observation).',
      doneLooksLike:
        'Segment profile.validationStep is non-empty and specific (named method + signal).',
      chapterId: CH7,
      route: `/deliverables/${CH7}`,
      source: 'segment'
    }))
  }
  // Income / spending / geography missing
  const missingProfileFields: string[] = []
  if (!p.incomeBracket) missingProfileFields.push('Income bracket')
  if (!p.spendingPower) missingProfileFields.push('Spending power')
  if (!p.geography) missingProfileFields.push('Geography')
  if (missingProfileFields.length > 0) {
    out.push(makeIssue({
      id: 'sync-ch7-thin-profile',
      severity: 'check-soon',
      title: `Segment profile is missing ${missingProfileFields.length} field${missingProfileFields.length === 1 ? '' : 's'}`,
      summary:
        'The segment profile is partially structured. Filling the missing fields tightens the downstream pricing + campaign argument.',
      whatToGather: missingProfileFields,
      whyItMatters:
        'Income / spending / geography are what an instructor or buyer presses on. "Detroit-focused premium-discretionary parent" is defensible; an unscoped "everyone" is not.',
      owner: 'Chief Strategy and Growth Officer',
      nextAction:
        'Open the Segment Composer and fill the missing fields, or pick a closer PRIZM-inspired template.',
      doneLooksLike:
        'Income, spending power, and geography are set on the strongest segment profile.',
      chapterId: CH7,
      route: `/deliverables/${CH7}`,
      source: 'segment'
    }))
  }
  return out
}

// ---------- B. Ch. 8 pricing check ----------

function ch8PricingIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const out: IntelligenceSyncIssue[] = []
  const ch8 = inputs.outputs[CH8] ?? null
  const ps = pickCh8Pricing(ch8)
  if (!ps) {
    out.push(makeIssue({
      id: 'sync-ch8-no-pricing',
      severity: 'needs-action',
      title: 'No pricing strategy on Chapter 8',
      summary:
        'Chapter 8 has no pricing strategy on file. Phoenix Nest carry, campaign messaging, and the final presentation all reference the price.',
      whatToGather: [
        'Total unit cost (base + decoration + labor + packaging + transaction fee + other)',
        'Proposed price',
        'At least 2–3 comparable products with name, price, and source',
        'Pricing confidence level (low / medium / high)',
        'Willingness-to-pay validation step'
      ],
      whyItMatters:
        'Pricing must connect cost, margin, comps, segment, and validation before students defend it on stage or to a Phoenix Nest buyer.',
      owner: 'CFO',
      helpFrom: ['Chief Strategy and Growth Officer', 'CMO'],
      nextAction:
        'Open Chapter 8 → "What should we charge?" and complete the Pricing Strategy Builder.',
      doneLooksLike:
        'Pricing Strategy Builder has product, cost stack, proposed price, ≥ 2 valid comps, confidence, and validation step.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
    return out
  }
  const derived = computeDerived(ps)
  const margin = interpretMargin(derived)
  const compPos = interpretCompPosition(ps)
  const comps = validCompCount(ps)
  const missingFields: string[] = []
  if (ps.proposedPrice == null) missingFields.push('Proposed price')
  if (derived.totalUnitCost <= 0) missingFields.push('Total unit cost components')
  if (missingFields.length > 0) {
    out.push(makeIssue({
      id: 'sync-ch8-incomplete-cost-or-price',
      severity: 'needs-action',
      title: 'Pricing inputs incomplete on Chapter 8',
      summary:
        `${missingFields.join(' + ')} ${missingFields.length === 1 ? 'is' : 'are'} missing. Margin and break-even cannot be computed without both.`,
      whatToGather: missingFields,
      whyItMatters:
        'A price without a cost stack is a guess. A cost stack without a price is a worksheet.',
      owner: 'CFO',
      helpFrom: ['Chief Strategy and Growth Officer'],
      nextAction:
        'Fill the missing pricing inputs in the Pricing Strategy Builder.',
      doneLooksLike:
        'Both proposed price and total unit cost are set; margin chip resolves to a real number.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  }
  if (comps < 2) {
    out.push(makeIssue({
      id: 'sync-ch8-thin-comps',
      severity: 'needs-action',
      title: `Only ${comps} comparable product${comps === 1 ? '' : 's'} on file`,
      summary:
        'Comp position cannot be argued against the market with fewer than 2 valid comps.',
      whatToGather: [
        'At least 2 comparable products with name + price + source URL',
        'Why each comp matches (price / quality / story / customer)',
        'What each comp does NOT prove'
      ],
      whyItMatters:
        'Retail buyers and instructors compare every price against products they already know. Without 2+ comps, the price reads as "we picked a number."',
      owner: 'CFO',
      helpFrom: ['Chief Strategy and Growth Officer'],
      nextAction:
        'Add comparable products in the Pricing Strategy Builder (the pasted-text Comp Source Assistant helps).',
      doneLooksLike:
        '≥ 2 comparable products with name, price, and source on file; comp position chip resolves.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  }
  if (derived.belowCost) {
    out.push(makeIssue({
      id: 'sync-ch8-below-cost',
      // QA stabilization: below-cost pricing is a serious advisory
      // problem but it does NOT stop submit-for-review (the submit
      // gate is requirement-task coverage only). Use needs-action
      // and call it out as "Major issue" in the title so students
      // see the gravity without a false "Stops Submit" claim.
      severity: 'needs-action',
      title: 'Major issue — proposed price is below total unit cost',
      summary:
        'Each unit sold loses money before fixed costs. Submit-for-review is unaffected (the submit gate is requirement-task coverage), but the team should not pitch this to anyone outside the room.',
      whatToGather: [
        'A revised proposed price OR a tighter cost stack',
        'A short "why we are still pitching this" paragraph if the price stays low'
      ],
      whyItMatters:
        'A retail buyer who notices the math before you do will not carry the product. Stages and instructors notice too.',
      owner: 'CFO',
      helpFrom: ['Co-CEOs'],
      nextAction:
        'Raise the price OR cut the cost stack until unit margin is positive.',
      doneLooksLike:
        'computeDerived(ps).belowCost is false; gross margin chip is at least "tight" (≥ 30%).',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  } else if (margin.band === 'weak') {
    out.push(makeIssue({
      id: 'sync-ch8-weak-margin',
      severity: 'needs-action',
      title: 'Gross margin is under 30%',
      summary:
        'Margin is high-risk for student retail. A small surprise (extra packaging, transaction fee, return) can wipe contribution.',
      whatToGather: [
        'Tightened cost stack OR raised price',
        'A volume plan if the price is fixed'
      ],
      whyItMatters:
        'Retail carry typically expects room for the retailer to mark up. A weak Renni-side margin makes the carry hard to defend.',
      owner: 'CFO',
      nextAction:
        'Cut the cost stack or raise the price; document the reason if the team chooses to keep the weak margin.',
      doneLooksLike:
        'grossMarginPct ≥ 30% OR a written reason for the chosen low margin.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  }
  const confidence = ps.confidence ?? ''
  if (!confidence || confidence === 'low') {
    out.push(makeIssue({
      id: 'sync-ch8-low-confidence',
      severity: confidence === 'low' ? 'needs-action' : 'check-soon',
      title: `Pricing confidence is ${confidence === 'low' ? 'low' : 'unset'}`,
      summary:
        'The team has a price but no preorder / direct-customer evidence yet.',
      whatToGather: [
        'Direct customer evidence (preorder, interview, side-by-side test)',
        'A specific validation step the team will run before May 12'
      ],
      whyItMatters:
        'A retail buyer asks "who actually pays this?" — without preorder or interview evidence, the answer is "we hope so."',
      owner: 'CFO',
      helpFrom: ['Chief Strategy and Growth Officer'],
      nextAction:
        'Run a small preorder or side-by-side test at this price, then update confidence.',
      doneLooksLike:
        'pricingStrategy.confidence is medium or high AND validationStep names a specific test.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  }
  if (compPos.band === 'far_above_range') {
    out.push(makeIssue({
      id: 'sync-ch8-far-above',
      severity: 'check-soon',
      title: 'Proposed price sits well above the comp range',
      summary:
        'Acceptance risk is high unless the production story, brand, or quality is genuinely exceptional.',
      whatToGather: [
        'Story / proof that justifies premium pricing',
        'Direct customer signals at this price (preorder, interview, observation)'
      ],
      whyItMatters:
        'The team needs to walk into a buyer meeting prepared for "why this price?" with evidence, not vibes.',
      owner: 'CFO',
      helpFrom: ['CMO', 'Chief Strategy and Growth Officer'],
      nextAction:
        'Capture story / proof and a direct customer signal to defend premium positioning.',
      doneLooksLike:
        'Production story is on file AND ≥ 1 direct customer signal at this price.',
      chapterId: CH8,
      route: `/deliverables/${CH8}`,
      source: 'pricing'
    }))
  }
  return out
}

// ---------- C. Ch. 10 campaign sync ----------

function ch10CampaignIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const out: IntelligenceSyncIssue[] = []
  const ch10 = inputs.outputs[CH10] ?? null
  const ch7 = inputs.outputs[CH7] ?? null
  const ch8 = inputs.outputs[CH8] ?? null
  const blob = chapterTextBlob(ch10)

  // If Ch. 10 has nothing yet, surface the empty case as a single
  // "Campaign chapter is blank" item rather than 4 separate ones.
  if (blob.trim().length === 0) {
    out.push(makeIssue({
      id: 'sync-ch10-blank',
      severity: 'needs-action',
      title: 'Campaign chapter has no source notes / draft / final text',
      summary:
        'Chapter 10 is blank. The campaign should explain why this buyer should care and why the price makes sense.',
      whatToGather: [
        'Target segment for this campaign',
        'Buyer motivation',
        'Likely objection',
        'Message angle (what the buyer should believe after seeing it)',
        'Channel (Phoenix Nest / TechTown / social / school events)',
        'Proof of quality / value (comp, evidence, story)'
      ],
      whyItMatters:
        'Without a campaign argument, the team cannot tell instructors or a Phoenix Nest buyer why this product reaches its buyer.',
      owner: 'CMO',
      helpFrom: ['Chief Strategy and Growth Officer', 'CFO'],
      nextAction:
        'Open Chapter 10 → start with source notes describing the segment / motivation / channel.',
      doneLooksLike:
        'Chapter 10 carries source notes / draft text covering segment, motivation, channel, and proof.',
      chapterId: CH10,
      route: `/deliverables/${CH10}`,
      source: 'campaign'
    }))
    return out
  }

  // Ch. 7 segment signals — does Ch. 10 mention them?
  const seg = pickCh7Segment(ch7)
  const missingSignals: string[] = []
  if (seg) {
    const motivation = (seg.profile.motivations ?? '').trim().toLowerCase()
    const objection = (seg.profile.likelyObjections ?? '').trim().toLowerCase()
    const channel = (seg.profile.channelFit ?? '').trim().toLowerCase()
    const segName = (seg.segmentName ?? '').trim().toLowerCase()
    if (segName && !blobIncludes(blob, segName)) missingSignals.push('Target segment named')
    if (motivation && !blobIncludes(blob, motivation.split(',')[0]?.trim() ?? motivation))
      missingSignals.push('Buyer motivation echoed in campaign copy')
    if (objection && !blobIncludes(blob, objection.split(',')[0]?.trim() ?? objection))
      missingSignals.push('Likely objection addressed in campaign copy')
    if (channel && !blobIncludes(blob, channel.split(',')[0]?.trim() ?? channel))
      missingSignals.push('Channel fit named in campaign plan')
  } else {
    missingSignals.push('Ch. 7 segment to anchor the campaign')
  }

  // Ch. 8 pricing → premium positioning needs proof in Ch. 10.
  const ps = pickCh8Pricing(ch8)
  if (ps) {
    const derived = computeDerived(ps)
    const isPremium =
      (ps.proposedPrice != null && ps.proposedPrice >= 100) ||
      (derived.grossMarginPct != null && derived.grossMarginPct >= 65)
    if (isPremium) {
      // Premium positioning should reference quality / story / proof.
      const mentionsQuality = blobIncludes(
        blob,
        'quality',
        'premium',
        'detroit-made',
        'detroit made',
        'limited',
        'handmade',
        'made in'
      )
      const mentionsProof = blobIncludes(
        blob,
        'preorder',
        'interview',
        'survey',
        'comp',
        'comparable',
        'evidence',
        'observation'
      )
      if (!mentionsQuality) missingSignals.push('Quality / production story in campaign copy')
      if (!mentionsProof) missingSignals.push('Proof / evidence reference in campaign copy')
    }
  }

  if (missingSignals.length > 0) {
    out.push(makeIssue({
      id: 'sync-ch10-thin-segment-link',
      severity: 'check-soon',
      title: 'Campaign may not yet reference segment / pricing context',
      summary:
        'Chapter 10 has authored text, but the substring check did not find the Ch. 7 segment / Ch. 8 pricing words in the copy. Heuristic — if your team already addressed this using different wording, treat this as a checklist reminder, not a grade.',
      whatToGather: missingSignals,
      whyItMatters:
        'A campaign that does not name the buyer, the motivation, the objection, or the channel reads as "everyone, no one." The buyer behind the price has to live in the message — but synonyms count, so check before you rewrite.',
      owner: 'CMO',
      helpFrom: ['Chief Strategy and Growth Officer', 'CFO'],
      nextAction:
        'If the segment / pricing context is already covered with different wording, ignore this. Otherwise edit Ch. 10 so segment + motivation + channel + proof are explicit.',
      doneLooksLike:
        'Chapter 10 text references the named segment, the motivation, the channel, and (for premium pricing) the quality + proof — in any wording the team chooses.',
      chapterId: CH10,
      route: `/deliverables/${CH10}`,
      source: 'campaign'
    }))
  }

  return out
}

// ---------- D. Ch. 11 Phoenix Nest sync ----------

function ch11PhoenixNestIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const out: IntelligenceSyncIssue[] = []
  const ch11 = inputs.outputs[CH11] ?? null
  const ch7 = inputs.outputs[CH7] ?? null
  const ch8 = inputs.outputs[CH8] ?? null
  const blob = chapterTextBlob(ch11)
  const ps = pickCh8Pricing(ch8)
  const seg = pickCh7Segment(ch7)

  // No pricing context.
  if (!ps) {
    out.push(makeIssue({
      id: 'sync-ch11-no-pricing-context',
      severity: 'needs-action',
      title: 'Phoenix Nest carry needs Ch. 8 pricing context',
      summary:
        'Chapter 8 has no pricing on file. The carry pitch cannot defend a price, margin, or comp position without it.',
      whatToGather: [
        'Recommended price',
        'Total unit cost',
        'Unit margin and gross margin %',
        'Comparable products evidence',
        'Confidence level + validation step'
      ],
      whyItMatters:
        'Retail buyers read margin and comps before story. Without Ch. 8 pricing on file, the carry pitch is asking the buyer to trust an unargued number.',
      owner: 'Co-CEOs',
      helpFrom: ['CFO'],
      nextAction:
        'Complete the Ch. 8 Pricing Strategy Builder before finalizing the Phoenix Nest carry recommendation.',
      doneLooksLike:
        'Ch. 8 pricing strategy is populated (cost stack, proposed price, ≥ 2 comps); the Phoenix Nest brief shows real numbers in Sources.',
      chapterId: CH11,
      route: `/deliverables/${CH11}`,
      source: 'phoenix-nest'
    }))
  }

  if (!seg) {
    out.push(makeIssue({
      id: 'sync-ch11-no-segment-context',
      severity: 'needs-action',
      title: 'Phoenix Nest carry needs a target buyer',
      summary:
        'Neither Chapter 7 nor Chapter 11 carries a structured segment. A retail buyer asks "who buys this?" before "what does it cost?"',
      whatToGather: [
        'Target buyer (segment name)',
        'Buyer reason / motivation',
        'Likely objection a Phoenix Nest buyer would raise'
      ],
      whyItMatters:
        'A carry pitch without a named buyer drifts toward "everyone, no one." Phoenix Nest buyers want to know who walks in for this product.',
      owner: 'Co-CEOs',
      helpFrom: ['Chief Strategy and Growth Officer', 'CMO'],
      nextAction:
        'Compose at least one structured segment in Chapter 7 (PRIZM-inspired template) before exporting the Phoenix Nest brief.',
      doneLooksLike:
        'Ch. 7 carries a populated segment profile; the Phoenix Nest brief shows the segment in Target buyer.',
      chapterId: CH11,
      route: `/deliverables/${CH11}`,
      source: 'phoenix-nest'
    }))
  }

  // Carry text doesn't reference price / margin / comps / validation.
  if (ps && blob.trim().length > 0) {
    const missing: string[] = []
    if (!blobIncludes(blob, 'price', 'cost', 'margin')) missing.push('Price / cost / margin reference')
    if (!blobIncludes(blob, 'comp', 'comparable')) missing.push('Comp evidence reference')
    if (!blobIncludes(blob, 'preorder', 'interview', 'survey', 'observation', 'evidence'))
      missing.push('Validation evidence reference')
    if (!blobIncludes(blob, 'inventory', 'restock', 'production', 'capacity'))
      missing.push('Inventory / production readiness')
    if (!blobIncludes(blob, 'ask', 'recommend', 'carry'))
      missing.push('Clear carry ask / recommendation')
    if (missing.length > 0) {
      out.push(makeIssue({
        id: 'sync-ch11-thin-carry-text',
        severity: 'check-soon',
        title: 'Phoenix Nest text does not yet reference key buyer-facing facts',
        summary:
          'Chapter 11 has authored text but the price / margin / comps / validation / inventory / ask are not visible in the copy. Heuristic — adjust if the team is using synonyms.',
        whatToGather: missing,
        whyItMatters:
          'Phoenix Nest buyers need to read the ask, the price, the margin, the comp evidence, the validation, and the inventory plan in one place.',
        owner: 'Co-CEOs',
        helpFrom: ['CFO', 'COO', 'CMO'],
        nextAction:
          'Edit the carry pitch text so the buyer-facing facts are explicit; export the Phoenix Nest brief from /export-center.',
        doneLooksLike:
          'Carry pitch text references price, margin, comp, validation, inventory, and a clear ask.',
        chapterId: CH11,
        route: `/deliverables/${CH11}`,
        source: 'phoenix-nest'
      }))
    }
  }
  return out
}

// ---------- E. Presentation readiness sync ----------

function presentationIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const out: IntelligenceSyncIssue[] = []
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  // Count chapters with no finalText anywhere.
  let chaptersMissingFinal = 0
  for (const d of inputs.deliverables) {
    const studio = inputs.studioResolver(d)
    if (!studio) continue
    const output = inputs.outputs[d.id] ?? null
    let any = false
    for (const s of Object.values(output?.sections ?? {})) {
      if ((s.finalText ?? '').trim().length > 0) {
        any = true
        break
      }
    }
    if (!any && d.status !== 'approved') chaptersMissingFinal += 1
  }
  if (chaptersMissingFinal > 0) {
    out.push(makeIssue({
      id: 'sync-pres-missing-final-text',
      severity: chaptersMissingFinal >= 3 ? 'needs-action' : 'check-soon',
      title: `${chaptersMissingFinal} chapter${chaptersMissingFinal === 1 ? '' : 's'} have no final Playbook text yet`,
      summary:
        'Final presentation needs final text per chapter, not just source notes. Playbook readiness is finalText-only.',
      whatToGather: [
        'A final paragraph per studio section that summarizes the team\'s decision',
        'Evidence links + structured evidence on each section'
      ],
      whyItMatters:
        'Source notes are workings; final text is the argument. Stage presentations and the Phoenix Nest brief read finalText, not draft.',
      owner: 'Co-CEOs',
      helpFrom: ['CFO', 'COO', 'CMO', 'Chief Strategy and Growth Officer'],
      nextAction:
        'Open each chapter with empty finalText and turn source notes / draft / evidence into a final paragraph per section.',
      doneLooksLike:
        'Every studio-backed chapter that is in scope for presentation has at least one section with finalText set.',
      route: '/presentation-readiness',
      source: 'presentation'
    }))
  }
  // Overdue / blocked tasks.
  let overdue = 0, blocked = 0
  for (const t of inputs.tasks) {
    if (t.status === 'blocked') blocked += 1
    if (
      (t.status === 'not_started' || t.status === 'in_progress') &&
      t.dueDate &&
      t.dueDate < today
    ) overdue += 1
  }
  if (overdue > 0 || blocked > 0) {
    out.push(makeIssue({
      id: 'sync-pres-task-health',
      severity: blocked > 0 ? 'needs-action' : 'check-soon',
      title: `${overdue} overdue + ${blocked} blocked task${blocked + overdue === 1 ? '' : 's'}`,
      summary:
        'Task health affects the presentation. Overdue or blocked tasks usually mean a chapter is incomplete.',
      whatToGather: [
        'Updated due dates for overdue tasks',
        'Cleared dependencies for blocked tasks',
        'Owner reassignments where the original owner is the bottleneck'
      ],
      whyItMatters:
        'Tasks are the smallest unit of "what is moving." If they are stuck, the chapter behind them is stuck.',
      owner: 'Co-CEOs',
      helpFrom: ['Instructor/Admin'],
      nextAction:
        'Open /tasks (or /timeline) and resolve each overdue / blocked entry today.',
      doneLooksLike:
        'No overdue tasks; blocked tasks have a clear unblock owner and date.',
      route: '/timeline',
      source: 'presentation'
    }))
  }
  // Advisor signal counts (when caller passed them in).
  // QA stabilization: only requirement-coverage blockers actually
  // stop submit-for-review. Other advisor blockers (below-cost
  // pricing, blocked tasks) are advisory. Reserve `stops-submit`
  // severity for the real submit-gating case.
  if (inputs.advisorSignals?.length) {
    const submitBlockers = inputs.advisorSignals.filter(
      (a) =>
        a.signal.severity === 'blocker' && a.signal.source === 'requirements'
    ).length
    const advisoryBlockers = inputs.advisorSignals.filter(
      (a) =>
        a.signal.severity === 'blocker' && a.signal.source !== 'requirements'
    ).length
    const risks = inputs.advisorSignals.filter((a) => a.signal.severity === 'risk').length
    if (submitBlockers > 0 || advisoryBlockers > 0 || risks >= 3) {
      const totalSeriousCount = submitBlockers + advisoryBlockers
      out.push(makeIssue({
        id: 'sync-pres-advisor-load',
        severity: submitBlockers > 0 ? 'stops-submit' : 'needs-action',
        title: `${totalSeriousCount} Stuck + ${risks} Action today signal${risks === 1 ? '' : 's'} across the program`,
        summary: submitBlockers > 0
          ? `${submitBlockers} signal${submitBlockers === 1 ? '' : 's'} affect submit-for-review (required-task coverage). The remaining ${advisoryBlockers + risks} are advisory but worth closing for the final presentation.`
          : 'The C-Suite Advisor has open advisory signals across multiple chapters. None of these stop submit-for-review on their own; final presentation readiness still benefits from closing them.',
        whatToGather: [
          submitBlockers > 0
            ? 'Linked tasks for any required check that has none (these are the only signals that actually block submit-for-review)'
            : 'Action on each Action today signal',
          'Owner + due date on each open signal',
          'Updated evidence for any segment / pricing risks'
        ],
        whyItMatters:
          'Advisor signals are the deterministic gaps the team has not addressed yet. Final presentation reads stronger with them closed.',
        owner: 'Co-CEOs',
        helpFrom: ['CFO', 'COO', 'CMO', 'Chief Strategy and Growth Officer'],
        nextAction:
          "Open /c-suite-advisor and walk Today's Moves; close Stuck items first.",
        doneLooksLike:
          submitBlockers > 0
            ? '0 Stuck items affecting submit (required-task coverage clean). Advisory blockers + Action today ≤ 3 across the program.'
            : 'Advisory blockers + Action today ≤ 3 across the program.',
        route: '/c-suite-advisor',
        source: 'presentation'
      }))
    }
  }
  return out
}

// ---------- entry point ----------

export function generateIntelligenceSyncIssues(
  inputs: IntelligenceSyncInputs
): IntelligenceSyncIssue[] {
  const issues: IntelligenceSyncIssue[] = []
  issues.push(...ch7SegmentIssues(inputs))
  issues.push(...ch8PricingIssues(inputs))
  issues.push(...ch10CampaignIssues(inputs))
  issues.push(...ch11PhoenixNestIssues(inputs))
  issues.push(...presentationIssues(inputs))
  return issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}

// ---------- display helpers ----------

// Sprint 1B: chip labels match the four-tier student vocabulary used
// across C-Suite Advisor, Presentation Readiness, and Home so a
// student who learns one surface understands the others. Internal
// IntelligenceSyncSeverity values are unchanged — only the display
// labels move to the student-facing words.
export const SYNC_SEVERITY_LABEL: Record<IntelligenceSyncSeverity, string> = {
  'stops-submit': 'Stuck',
  'needs-action': 'Action today',
  'check-soon': 'Look at soon',
  ready: 'All good'
}

export const SYNC_SEVERITY_CHIP_CLASS: Record<IntelligenceSyncSeverity, string> = {
  'stops-submit': 'border-rose-300 bg-rose-50 text-rose-800',
  'needs-action': 'border-amber-300 bg-amber-50 text-amber-800',
  'check-soon': 'border-sky-300 bg-sky-50 text-sky-800',
  ready: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

export const SYNC_SOURCE_LABEL: Record<IntelligenceSyncIssue['source'], string> = {
  segment: 'Segment',
  pricing: 'Pricing',
  campaign: 'Campaign',
  'phoenix-nest': 'Phoenix Nest',
  presentation: 'Presentation',
  advisor: 'Advisor'
}
