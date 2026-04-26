<script setup lang="ts">
// Market Fit Builder V1 — section-level demand-side decision tool.
//
// Helps students compare possible markets (students vs parents vs
// alumni vs Detroit supporters etc.) given the section's product
// facts, brand identity, price, and quality. Renaissance students are
// not the primary market by default; the builder asks the team to
// argue *which* segment fits best and surfaces tradeoffs (reach vs
// willingness to pay, story fit vs price fit, etc.).
//
// Posture (do not relax in V1):
//   - additive layer on the existing deliverableOutputs document
//   - never gates submit / never gates Playbook readiness
//   - read-only when the deliverable is in_review / approved
//   - Save button writes the whole MarketFitBuilder object back via
//     the composable; sibling fields (sourceNotes, draftText,
//     finalText, evidenceLinks, structuredEvidence,
//     marketBuilderEntries) are untouched
//   - recommendation summary is deterministic — no AI — built from the
//     student's own inputs
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import type {
  MarketFitBuilder,
  MarketFitComparable,
  MarketFitCompAlignment,
  MarketFitCompTypeFlags,
  MarketFitCustomerProfile,
  MarketFitEvidenceRequest,
  MarketFitEvidenceSourceType,
  MarketFitEvidenceStatus,
  MarketFitProductFacts,
  MarketFitQualityLevel,
  MarketFitRecommendation,
  MarketFitScenarioAssumptions,
  MarketFitSegment,
  MarketFitSegmentRole,
  MarketFitSegmentType,
  MarketFitSignal
} from '~/types/models'
import {
  fmtCurrency,
  fmtNumber
} from '~/utils/marketBuilderMath'
import {
  buildCompFeedback,
  detectSourceGap,
  findStrongestCompType,
  hasAffordabilityVsDemandRisk
} from '~/utils/marketFitNarrative'

const props = defineProps<{
  deliverableId: string
  sectionId: string
  sectionTitle: string
  // Pre-existing student-saved fit data, if any. Cloned into a local
  // reactive form so editing doesn't mutate the snapshot.
  initial: MarketFitBuilder | null
  editingEnabled: boolean
  // Optional studio-provided guidance string shown above the editor.
  guidance?: string | null
}>()

const auth = useAuthStore()
const outputs = useDeliverableOutputs()

const SEGMENT_TYPE_LABELS: Record<MarketFitSegmentType, string> = {
  students: 'Renaissance students',
  parents: 'Parents / families',
  alumni: 'Alumni',
  staff: 'Staff',
  detroit_supporters: 'Detroit supporters',
  techtown_shoppers: 'TechTown shoppers',
  gift_buyers: 'Gift buyers',
  premium_apparel_buyers: 'Premium apparel buyers',
  custom: 'Custom segment'
}

const SEGMENT_ROLE_LABELS: Record<MarketFitSegmentRole, string> = {
  primary_market: 'Primary market',
  secondary_market: 'Secondary market',
  launch_market: 'Launch market',
  awareness_market: 'Awareness market',
  validation_market: 'Validation market',
  '': 'Not yet decided'
}

const QUALITY_LEVELS: Array<{ value: MarketFitQualityLevel; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'budget', label: 'Budget' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' }
]

const SIGNAL_OPTIONS: MarketFitSignal[] = ['', 'low', 'medium', 'high']

const SOURCE_TYPE_LABELS: Record<MarketFitEvidenceSourceType, string> = {
  survey: 'Survey (legacy)',
  student_survey: 'Student survey',
  interview: 'Interview (legacy)',
  parent_adult_interview: 'Parent / adult interview',
  alumni_staff_interview: 'Alumni / staff interview',
  census_acs: 'Census / ACS',
  school_data: 'School data (legacy)',
  school_enrollment_data: 'School-provided enrollment data',
  comparable_products: 'Comparable product research',
  retail_observation: 'Retail observation',
  stakeholder_feedback: 'Stakeholder feedback (legacy)',
  phoenix_nest_stakeholder: 'Phoenix Nest stakeholder feedback',
  techtown_popup_feedback: 'TechTown pop-up feedback',
  preorder_test: 'Preorder / expression-of-interest test',
  custom: 'Custom'
}

// Comp-type checkboxes drive the deterministic feedback line. Order
// matches the helper's preference order so the checkboxes read like a
// reasoning ladder.
const COMP_TYPE_FIELDS: Array<{
  key: keyof MarketFitCompTypeFlags
  label: string
}> = [
  { key: 'product', label: 'Product / category' },
  { key: 'price', label: 'Price' },
  { key: 'quality', label: 'Quality' },
  { key: 'story', label: 'Story / production' },
  { key: 'customer', label: 'Target customer' },
  { key: 'channel', label: 'Channel' },
  { key: 'style', label: 'Style / design' },
  { key: 'localMade', label: 'Local-made' }
]

const COMP_ALIGNMENT_OPTIONS: Array<{
  value: MarketFitCompAlignment
  label: string
}> = [
  { value: '', label: '— Not set —' },
  { value: 'strong', label: 'Strong alignment' },
  { value: 'partial', label: 'Partial alignment' },
  { value: 'weak', label: 'Weak alignment' },
  { value: 'unsure', label: 'Not sure' }
]

// Example profile names — surfaced via a <datalist> so students can
// pick or type. The team is never forced into a profile; the field
// stays free-text.
const PROFILE_NAME_EXAMPLES = [
  'School Spirit Buyer',
  'Proud Parent Supporter',
  'Alumni Legacy Buyer',
  'Civic Premium Buyer',
  'Local Craft Buyer',
  'Gift Buyer',
  'Premium Casualwear Buyer',
  'Impulse Campus Buyer',
  'Mission Supporter / Donor'
]

const EVIDENCE_STATUS_LABELS: Record<MarketFitEvidenceStatus, string> = {
  needed: 'Needed',
  in_progress: 'In progress',
  found: 'Found',
  not_available: 'Not available'
}

// --- form state -----------------------------------------------------
// Cloned from `initial` on mount and rebound when the snapshot
// changes (in_review/approved render but don't re-bind, since the
// state is already final).
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mfb-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function blankProductFacts(): MarketFitProductFacts {
  return {
    productName: '',
    productCategory: '',
    price: null,
    qualityLevel: '',
    madeInStory: '',
    brandStory: '',
    styleDirection: '',
    channel: '',
    productionLimit: null,
    notes: ''
  }
}

function blankCustomerProfile(): MarketFitCustomerProfile {
  return {
    profileName: '',
    ageRange: '',
    incomeRange: '',
    geographyContext: '',
    urbanSuburbanContext: '',
    lifestyleContext: '',
    motivation: '',
    priceSensitivity: '',
    values: '',
    likelyChannel: '',
    evidenceNeeded: '',
    risk: '',
    validationStep: ''
  }
}

function blankSegment(seedType: MarketFitSegmentType = 'custom'): MarketFitSegment {
  return {
    id: genId(),
    name:
      seedType === 'custom'
        ? ''
        : SEGMENT_TYPE_LABELS[seedType],
    segmentType: seedType,
    whyItMightFit: '',
    priceFit: '',
    storyFit: '',
    reachability: '',
    willingnessToPay: '',
    evidenceStrength: '',
    reachableAudience: null,
    interestRatePct: null,
    conversionRatePct: null,
    evidenceSource: '',
    risk: '',
    nextValidationStep: '',
    roleInStrategy: '',
    profile: blankCustomerProfile()
  }
}

function blankCompTypeFlags(): MarketFitCompTypeFlags {
  return {
    product: false,
    price: false,
    quality: false,
    story: false,
    customer: false,
    channel: false,
    style: false,
    localMade: false
  }
}

function blankComparable(): MarketFitComparable {
  return {
    id: genId(),
    brandOrProduct: '',
    price: null,
    qualityNotes: '',
    styleNotes: '',
    targetCustomer: '',
    salesChannel: '',
    similarity: '',
    difference: '',
    lessonForRenni: '',
    source: '',
    compTypes: blankCompTypeFlags(),
    compAlignment: ''
  }
}

function blankEvidenceRequest(): MarketFitEvidenceRequest {
  return {
    id: genId(),
    question: '',
    whyItMatters: '',
    suggestedSourceType: 'custom',
    assignedToRole: '',
    status: 'needed',
    notes: '',
    questionAnswered: '',
    whenToUse: '',
    whatToRecord: '',
    claimConnection: ''
  }
}

function blankScenarioAssumptions(): MarketFitScenarioAssumptions {
  return {
    selectedSegmentId: null,
    conservativeInterestRatePct: null,
    conservativeConversionRatePct: null,
    baseInterestRatePct: null,
    baseConversionRatePct: null,
    ambitiousInterestRatePct: null,
    ambitiousConversionRatePct: null
  }
}

function blankRecommendation(): MarketFitRecommendation {
  return {
    likelyPrimaryMarket: '',
    likelySecondaryMarket: '',
    launchOrValidationMarket: '',
    positioningSummary: '',
    strongestEvidence: '',
    weakestAssumption: '',
    recommendedNextValidation: ''
  }
}

interface Form {
  productFacts: MarketFitProductFacts
  segments: MarketFitSegment[]
  comparables: MarketFitComparable[]
  evidenceRequests: MarketFitEvidenceRequest[]
  scenarioAssumptions: MarketFitScenarioAssumptions
  recommendation: MarketFitRecommendation
}

function cloneFromInitial(src: MarketFitBuilder | null): Form {
  // Deep-merge the new nested objects (profile on segments, compTypes
  // on comparables) so a saved doc that predates the positioning pass
  // still picks up every editor field. The shallow spread that worked
  // before this pass would strip blank defaults.
  return {
    productFacts: { ...blankProductFacts(), ...(src?.productFacts ?? {}) },
    segments: (src?.segments ?? []).map((s) => ({
      ...blankSegment(),
      ...s,
      profile: { ...blankCustomerProfile(), ...(s.profile ?? {}) }
    })),
    comparables: (src?.comparables ?? []).map((c) => ({
      ...blankComparable(),
      ...c,
      compTypes: { ...blankCompTypeFlags(), ...(c.compTypes ?? {}) }
    })),
    evidenceRequests: (src?.evidenceRequests ?? []).map((e) => ({
      ...blankEvidenceRequest(),
      ...e
    })),
    scenarioAssumptions: {
      ...blankScenarioAssumptions(),
      ...(src?.scenarioAssumptions ?? {})
    },
    recommendation: {
      ...blankRecommendation(),
      ...(src?.recommendation ?? {})
    }
  }
}

const form = reactive<Form>(cloneFromInitial(props.initial))
const dirty = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

// Snapshot watcher: only re-bind from the persisted document when the
// editor doesn't have unsaved changes. Same dirty-guard pattern the
// section text fields use so a collaborator's save doesn't clobber an
// in-progress edit.
watch(
  () => props.initial,
  (next) => {
    if (dirty.value) return
    Object.assign(form, cloneFromInitial(next))
  },
  { deep: true }
)

function markDirty() {
  dirty.value = true
}

// --- numeric coercion ----------------------------------------------
// Numeric inputs come back as strings ('' or '12.5'). Coerce explicitly
// so an empty field stays null instead of NaN, and so non-finite
// values never reach Firestore.
function setNumber<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
  raw: string
) {
  if (raw === '' || raw == null) {
    ;(obj as Record<string, unknown>)[key as string] = null
    return
  }
  const n = Number(raw)
  ;(obj as Record<string, unknown>)[key as string] = Number.isFinite(n) ? n : null
}

// --- segment management --------------------------------------------
function addSeededSegment(type: MarketFitSegmentType) {
  if (!props.editingEnabled) return
  // Don't double-seed: if a segment with that seed type already
  // exists, skip — students can still add a custom segment with the
  // same conceptual audience if they want two.
  if (form.segments.some((s) => s.segmentType === type && type !== 'custom')) {
    return
  }
  form.segments.push(blankSegment(type))
  markDirty()
}

function removeSegment(id: string) {
  if (!props.editingEnabled) return
  form.segments = form.segments.filter((s) => s.id !== id)
  if (form.scenarioAssumptions.selectedSegmentId === id) {
    form.scenarioAssumptions.selectedSegmentId = null
  }
  markDirty()
}

function addComparable() {
  if (!props.editingEnabled) return
  form.comparables.push(blankComparable())
  markDirty()
}

function removeComparable(id: string) {
  if (!props.editingEnabled) return
  form.comparables = form.comparables.filter((c) => c.id !== id)
  markDirty()
}

// Seeded evidence requests, paired with the Source Coach prompt
// prefills so a one-click add doesn't drop students at a blank form.
// The prefills come straight from docs/builder-engines/07 — the
// content is curriculum-shipped, not generated.
const SEEDED_EVIDENCE_SUGGESTIONS: Array<{
  question: string
  whyItMatters: string
  suggestedSourceType: MarketFitEvidenceSourceType
  questionAnswered: string
  whenToUse: string
  whatToRecord: string
  claimConnection: string
}> = [
  {
    question: 'Survey students on willingness to pay at the proposed price.',
    whyItMatters:
      'Tells you whether the school market is a buying market or only a reachable market.',
    suggestedSourceType: 'student_survey',
    questionAnswered:
      'What students like, would wear, might buy, or would recommend.',
    whenToUse:
      'When students may be buyers, awareness audience, or validators.',
    whatToRecord:
      'Sample size, question wording, answer counts, date, and key comments.',
    claimConnection:
      'Supports student interest, design preference, price tolerance, awareness potential.'
  },
  {
    question: 'Interview parents or adult buyers about premium school-linked apparel.',
    whyItMatters:
      'Captures whether adults will pay more for the brand story than students will.',
    suggestedSourceType: 'parent_adult_interview',
    questionAnswered:
      'Whether adults would buy, gift, donate, or support the product.',
    whenToUse:
      'When the price is higher than normal student spending or the product is giftable.',
    whatToRecord:
      'Interviewee type, age range, price reaction, motivation, objections, quote notes.',
    claimConnection:
      'Supports adult willingness to pay, gift logic, supporter logic, and price fit.'
  },
  {
    question: 'Interview alumni or staff about school connection, legacy, and willingness to support.',
    whyItMatters:
      'Tests whether school-pride or institutional support extends to a buying decision.',
    suggestedSourceType: 'alumni_staff_interview',
    questionAnswered:
      'Whether school connection, legacy, or mission increases willingness to buy.',
    whenToUse:
      'When the product depends on school pride, nostalgia, or institutional support.',
    whatToRecord:
      'Relationship to school, reaction to story, price reaction, channel preference, objections.',
    claimConnection:
      'Supports alumni/staff fit and school-identity positioning.'
  },
  {
    question:
      'Find Census/ACS income, age, and geography data for the targeted profile.',
    whyItMatters:
      'Sets affordability context outside Renaissance. Income data does not prove demand on its own.',
    suggestedSourceType: 'census_acs',
    questionAnswered:
      'Affordability context for a geography and age group.',
    whenToUse:
      'When the team needs spending-power context for adult buyers or local supporters.',
    whatToRecord:
      'Geography, year, income bracket, age group, source link/name, and what the number proves.',
    claimConnection:
      'Supports affordability context, NOT demand. Pair with surveys, interviews, or preorder tests.'
  },
  {
    question:
      'Pull school-provided enrollment data (counts, grade bands).',
    whyItMatters:
      'Sets the size of the reachable school audience.',
    suggestedSourceType: 'school_enrollment_data',
    questionAnswered:
      'Size of the reachable school audience.',
    whenToUse:
      'When the team is modeling school awareness, school launch, or student buyer potential.',
    whatToRecord:
      'Enrollment count, grade bands, source name, date, and any limits.',
    claimConnection:
      'Supports reachable audience inside the school.'
  },
  {
    question:
      'Find three comparable products at similar quality, price, or production story.',
    whyItMatters:
      'Defends price and positioning against real shelves a buyer would compare against.',
    suggestedSourceType: 'comparable_products',
    questionAnswered:
      'Price, quality, positioning, channel, and category expectations.',
    whenToUse:
      'When the team needs outside context before defending price or positioning.',
    whatToRecord:
      'Brand/product, price, product specs, channel, target customer, source link/name, and why it is similar or different.',
    claimConnection:
      'Supports price defensibility, category behavior, and positioning.'
  },
  {
    question:
      'Observe similar products in real retail settings.',
    whyItMatters:
      'Tests packaging, display, and price expectations against the buyer’s actual environment.',
    suggestedSourceType: 'retail_observation',
    questionAnswered:
      'What similar products look like in real retail settings.',
    whenToUse:
      'When preparing for Phoenix Nest, TechTown, or display decisions.',
    whatToRecord:
      'Store or booth, product type, price, packaging, display, customer behavior, and date.',
    claimConnection:
      'Supports retail readiness, packaging, display, and price expectations.'
  },
  {
    question:
      'Ask Phoenix Nest stakeholders about margin, shelf space, turnover, and required changes.',
    whyItMatters:
      'Tells you whether retail carry is realistic at the proposed price and story.',
    suggestedSourceType: 'phoenix_nest_stakeholder',
    questionAnswered:
      'Whether the product and story fit retail carry.',
    whenToUse:
      'When writing the Phoenix Nest carry pitch.',
    whatToRecord:
      'Stakeholder name/role, feedback, objections, required changes, and next step.',
    claimConnection:
      'Supports retail-carry fit and pitch readiness.'
  },
  {
    question:
      'Collect TechTown pop-up feedback from real shoppers on demand and message clarity.',
    whyItMatters:
      'Validates launch-day demand assumptions and customer language.',
    suggestedSourceType: 'techtown_popup_feedback',
    questionAnswered:
      'What real shoppers notice, ask, buy, or reject.',
    whenToUse:
      'When testing launch demand and customer language.',
    whatToRecord:
      'Shopper comments, questions, conversion, objections, and product interest.',
    claimConnection:
      'Supports pop-up demand, message clarity, and buyer profile.'
  },
  {
    question:
      'Run a preorder or expression-of-interest test at the proposed price.',
    whyItMatters:
      'Replaces opinion with action — whether people will commit before full production.',
    suggestedSourceType: 'preorder_test',
    questionAnswered:
      'Whether people will take an action before full production.',
    whenToUse:
      'When inventory risk is high or price is uncertain.',
    whatToRecord:
      'Number of signups, price shown, audience, channel, date range, and follow-through.',
    claimConnection:
      'Supports demand confidence and inventory planning.'
  }
]

function addEvidenceRequest() {
  if (!props.editingEnabled) return
  form.evidenceRequests.push(blankEvidenceRequest())
  markDirty()
}

function addSeededEvidenceRequest(idx: number) {
  if (!props.editingEnabled) return
  const seed = SEEDED_EVIDENCE_SUGGESTIONS[idx]
  if (!seed) return
  form.evidenceRequests.push({
    ...blankEvidenceRequest(),
    question: seed.question,
    whyItMatters: seed.whyItMatters,
    suggestedSourceType: seed.suggestedSourceType,
    questionAnswered: seed.questionAnswered,
    whenToUse: seed.whenToUse,
    whatToRecord: seed.whatToRecord,
    claimConnection: seed.claimConnection
  })
  markDirty()
}

function removeEvidenceRequest(id: string) {
  if (!props.editingEnabled) return
  form.evidenceRequests = form.evidenceRequests.filter((e) => e.id !== id)
  markDirty()
}

// --- scenario calculation ------------------------------------------
// Percent inputs treated as 0–100. Estimated interested = audience ×
// (interest / 100). Estimated buyers = interested × (conversion /
// 100). Revenue = buyers × price. Anything missing reads as null and
// the cell shows "—".
function deriveInterested(audience: number | null, interestPct: number | null): number | null {
  if (audience == null || interestPct == null) return null
  if (!Number.isFinite(audience) || !Number.isFinite(interestPct)) return null
  const raw = audience * (interestPct / 100)
  if (!Number.isFinite(raw)) return null
  return Math.max(0, Math.round(raw))
}

function deriveBuyers(
  audience: number | null,
  interestPct: number | null,
  conversionPct: number | null
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

function deriveRevenue(buyers: number | null, price: number | null): number | null {
  if (buyers == null || price == null) return null
  if (!Number.isFinite(price)) return null
  const raw = buyers * price
  if (!Number.isFinite(raw)) return null
  return Math.round(raw)
}

const selectedSegment = computed<MarketFitSegment | null>(() => {
  const id = form.scenarioAssumptions.selectedSegmentId
  if (!id) return null
  return form.segments.find((s) => s.id === id) ?? null
})

interface ScenarioRow {
  label: 'Conservative' | 'Base' | 'Ambitious'
  audience: number | null
  interestPct: number | null
  conversionPct: number | null
  price: number | null
  buyers: number | null
  revenue: number | null
}

const scenarioRows = computed<ScenarioRow[]>(() => {
  const seg = selectedSegment.value
  const a = form.scenarioAssumptions
  const audience = seg?.reachableAudience ?? null
  const price = form.productFacts.price ?? null
  const rows: Array<Omit<ScenarioRow, 'buyers' | 'revenue'>> = [
    {
      label: 'Conservative',
      audience,
      interestPct: a.conservativeInterestRatePct ?? null,
      conversionPct: a.conservativeConversionRatePct ?? null,
      price
    },
    {
      label: 'Base',
      audience,
      interestPct: a.baseInterestRatePct ?? null,
      conversionPct: a.baseConversionRatePct ?? null,
      price
    },
    {
      label: 'Ambitious',
      audience,
      interestPct: a.ambitiousInterestRatePct ?? null,
      conversionPct: a.ambitiousConversionRatePct ?? null,
      price
    }
  ]
  return rows.map((r) => {
    const buyers = deriveBuyers(r.audience, r.interestPct, r.conversionPct)
    const revenue = deriveRevenue(buyers, r.price)
    return { ...r, buyers, revenue }
  })
})

// --- deterministic recommendation summary ---------------------------
// Score each segment by combining its five fit signals (price, story,
// reachability, willingness, evidence). Surface the highest-scoring
// segment plus the most useful tradeoff line — e.g., a high-reach
// low-price-fit segment is flagged as awareness-only. Pure helper —
// no AI, no model call.
const SIGNAL_SCORE: Record<MarketFitSignal, number> = {
  '': 0,
  low: 1,
  medium: 2,
  high: 3
}

interface SegmentScore {
  segment: MarketFitSegment
  score: number
  priceFit: number
  storyFit: number
  reachability: number
  willingness: number
  evidence: number
}

const segmentScores = computed<SegmentScore[]>(() => {
  return form.segments.map((s) => {
    const priceFit = SIGNAL_SCORE[(s.priceFit ?? '') as MarketFitSignal] ?? 0
    const storyFit = SIGNAL_SCORE[(s.storyFit ?? '') as MarketFitSignal] ?? 0
    const reachability = SIGNAL_SCORE[(s.reachability ?? '') as MarketFitSignal] ?? 0
    const willingness = SIGNAL_SCORE[(s.willingnessToPay ?? '') as MarketFitSignal] ?? 0
    const evidence = SIGNAL_SCORE[(s.evidenceStrength ?? '') as MarketFitSignal] ?? 0
    return {
      segment: s,
      score: priceFit + storyFit + reachability + willingness + evidence,
      priceFit,
      storyFit,
      reachability,
      willingness,
      evidence
    }
  })
})

const topSegment = computed<SegmentScore | null>(() => {
  const sorted = [...segmentScores.value].sort((a, b) => b.score - a.score)
  return sorted[0] ?? null
})

const tradeoffLines = computed<string[]>(() => {
  const lines: string[] = []
  for (const s of segmentScores.value) {
    if (s.reachability >= 2 && s.priceFit <= 1 && s.priceFit > 0) {
      lines.push(
        `${s.segment.name || 'A segment'} is highly reachable but price fit is weak — consider this an awareness or validation market, not a primary buying market.`
      )
    }
    if (s.priceFit >= 2 && s.reachability <= 1 && s.reachability > 0) {
      lines.push(
        `${s.segment.name || 'A segment'} has strong price fit but is hard to reach — your channel plan needs to solve that before this becomes a primary market.`
      )
    }
    if (s.storyFit >= 2 && s.priceFit <= 1 && s.priceFit > 0) {
      lines.push(
        `${s.segment.name || 'A segment'} loves the story but the price is a stretch — defend the price with quality / sourcing evidence or pick a more affordable item for them.`
      )
    }
    if (s.willingness >= 2 && s.evidence <= 1) {
      lines.push(
        `${s.segment.name || 'A segment'} is assumed willing to pay, but evidence is thin — survey or preorder before committing inventory at this price.`
      )
    }
  }
  return Array.from(new Set(lines)).slice(0, 4)
})

// Cast the editable form into a MarketFitBuilder shape for the
// shared narrative helpers. The form is already a superset; this just
// strips the type fence so the helpers can read segments /
// comparables / evidenceRequests directly.
function asFitForUtil(): MarketFitBuilder {
  return {
    productFacts: form.productFacts,
    segments: form.segments,
    comparables: form.comparables,
    evidenceRequests: form.evidenceRequests,
    scenarioAssumptions: form.scenarioAssumptions,
    recommendation: form.recommendation
  }
}

const generatedSummary = computed<string>(() => {
  const top = topSegment.value
  if (!top || top.score === 0) {
    return 'Add segments and rate price fit, story fit, reachability, willingness to pay, and evidence strength to generate a tradeoff summary.'
  }
  const productName =
    form.productFacts.productName?.trim() || 'this product'
  const price = form.productFacts.price
  const priceText = price != null && Number.isFinite(price) ? ` at $${price}` : ''
  const lead = `Strongest combined fit for ${productName}${priceText}: ${
    top.segment.name || 'an unnamed segment'
  } (price fit ${top.priceFit}/3, story fit ${top.storyFit}/3, reach ${top.reachability}/3, willingness ${top.willingness}/3, evidence ${top.evidence}/3).`

  // Profile, comp type, source gap, and affordability mentions —
  // surfaces the Product Positioning Intelligence layer in one
  // sentence each so the summary reads as a positioning argument and
  // not just a fit-score.
  const profileName = top.segment.profile?.profileName?.trim()
  const profileText = profileName ? ` Strongest profile: ${profileName}.` : ''

  const compSummary = findStrongestCompType(form.comparables)
  const compText = compSummary
    ? ` Strongest comp type: ${compSummary.label.toLowerCase()} (${compSummary.strongCount} strong of ${compSummary.totalCount}).`
    : ''

  const gap = detectSourceGap(form.evidenceRequests)
  const gapText = gap.noRequestsAtAll
    ? ' Source gap: no evidence requests logged yet — add at least one before treating this as proof.'
    : gap.hasGap
      ? ` Source gap: ${gap.openRequests.length} evidence request${gap.openRequests.length === 1 ? '' : 's'} still open.`
      : ''

  const affordability = hasAffordabilityVsDemandRisk(asFitForUtil())
    ? ' Income data can support affordability, but the team still needs interviews, surveys, or preorders before making inventory decisions.'
    : ''

  return [
    lead,
    profileText,
    compText,
    gapText,
    affordability,
    ...tradeoffLines.value.map((l) => ` ${l}`)
  ]
    .filter(Boolean)
    .join('')
})

function invalidNumberLabel(
  label: string,
  value: number | null | undefined,
  opts: { min?: number; max?: number } = {}
): string | null {
  if (value == null) return null
  if (!Number.isFinite(value)) return `${label} must be a valid number.`
  if (opts.min != null && value < opts.min) return `${label} cannot be negative.`
  if (opts.max != null && value > opts.max) {
    return `${label} must be ${opts.max} or lower.`
  }
  return null
}

function validateBeforeSave(): string | null {
  const checks: Array<[string, number | null | undefined, { min?: number; max?: number }]> = [
    ['Product price', form.productFacts.price, { min: 0 }],
    ['Production limit', form.productFacts.productionLimit, { min: 0 }]
  ]

  for (const seg of form.segments) {
    const name = seg.name?.trim() || 'Unnamed segment'
    checks.push(
      [`${name} reachable audience`, seg.reachableAudience, { min: 0 }],
      [`${name} interest rate`, seg.interestRatePct, { min: 0, max: 100 }],
      [`${name} conversion rate`, seg.conversionRatePct, { min: 0, max: 100 }]
    )
  }

  for (const comp of form.comparables) {
    const name = comp.brandOrProduct?.trim() || 'Unnamed comparable'
    checks.push([`${name} price`, comp.price, { min: 0 }])
  }

  checks.push(
    ['Conservative interest rate', form.scenarioAssumptions.conservativeInterestRatePct, { min: 0, max: 100 }],
    ['Base interest rate', form.scenarioAssumptions.baseInterestRatePct, { min: 0, max: 100 }],
    ['Ambitious interest rate', form.scenarioAssumptions.ambitiousInterestRatePct, { min: 0, max: 100 }],
    ['Conservative conversion rate', form.scenarioAssumptions.conservativeConversionRatePct, { min: 0, max: 100 }],
    ['Base conversion rate', form.scenarioAssumptions.baseConversionRatePct, { min: 0, max: 100 }],
    ['Ambitious conversion rate', form.scenarioAssumptions.ambitiousConversionRatePct, { min: 0, max: 100 }]
  )

  for (const [label, value, opts] of checks) {
    const error = invalidNumberLabel(label, value, opts)
    if (error) return error
  }
  return null
}

// --- save -----------------------------------------------------------
async function save() {
  if (!props.editingEnabled || saving.value) return
  if (!auth.user || !auth.profile) return
  const validationError = validateBeforeSave()
  if (validationError) {
    saveError.value = validationError
    return
  }
  saving.value = true
  saveError.value = null
  try {
    const payload: MarketFitBuilder = {
      productFacts: { ...form.productFacts },
      segments: form.segments.map((s) => ({ ...s })),
      comparables: form.comparables.map((c) => ({ ...c })),
      evidenceRequests: form.evidenceRequests.map((e) => ({ ...e })),
      scenarioAssumptions: { ...form.scenarioAssumptions },
      recommendation: { ...form.recommendation }
    }
    await outputs.saveMarketFitBuilder(
      props.deliverableId,
      props.sectionId,
      props.sectionTitle,
      payload,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
    dirty.value = false
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-3 rounded-md border border-violet-200 bg-violet-50/40 p-3">
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Market Fit Builder
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        Decide which market this section should target
      </h4>
      <p class="text-xs text-neutral-600">
        {{
          guidance ||
          'Compare possible segments before naming a primary market. Renaissance students may be the right buyer for a $20 t-shirt, but a $100 Detroit-made sweatshirt may fit parents, alumni, or Detroit supporters better. The school can also be a launch market or awareness market without being the primary buyer.'
        }}
      </p>
    </header>

    <ul class="list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
      <li>A higher price usually requires stronger evidence of quality, story, or willingness to pay.</li>
      <li>A reachable audience is not always the best buying audience.</li>
      <li>Students may be easiest to reach, but adults may have stronger purchasing power.</li>
      <li>A Detroit-made product may appeal beyond the school if the story and design are strong.</li>
      <li>If a segment has high story fit but low reachability, the marketing plan needs a channel strategy.</li>
      <li>If a segment has high reachability but low price fit, it may be better as an awareness or validation market.</li>
    </ul>

    <!-- Product facts -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Product facts
      </legend>
      <p class="text-xs text-neutral-600">
        Your product facts shape your market. A higher price, premium quality, or
        local-made story may point toward a different buyer than basic school merch.
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Product name
          <input
            v-model="form.productFacts.productName"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="House Phoenix Detroit-made sweatshirt"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Product category
          <input
            v-model="form.productFacts.productCategory"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Apparel · sweatshirt"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Price
          <input
            :value="form.productFacts.price ?? ''"
            type="number"
            min="0"
            step="0.01"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="100"
            @input="(event) => { setNumber(form.productFacts, 'price', (event.target as HTMLInputElement).value); markDirty() }"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Quality level
          <select
            v-model="form.productFacts.qualityLevel"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="q in QUALITY_LEVELS" :key="q.value" :value="q.value">
              {{ q.label }}
            </option>
          </select>
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Made-in / sourcing story
          <input
            v-model="form.productFacts.madeInStory"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Cut, sewn, and printed in Detroit"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Brand story
          <input
            v-model="form.productFacts.brandStory"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="House Phoenix represents the rebirth of Detroit student-led design"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Style direction
          <input
            v-model="form.productFacts.styleDirection"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Minimal type, oversized fit, Detroit colorway"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Channel
          <input
            v-model="form.productFacts.channel"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="TechTown pop-up, Phoenix Nest carry, online drop"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Production limit
          <input
            :value="form.productFacts.productionLimit ?? ''"
            type="number"
            min="0"
            step="1"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="50"
            @input="(event) => { setNumber(form.productFacts, 'productionLimit', (event.target as HTMLInputElement).value); markDirty() }"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Notes
          <textarea
            v-model="form.productFacts.notes"
            rows="2"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What's worth knowing that didn't fit above?"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Segment comparison -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Segment comparison
      </legend>
      <p class="text-xs text-neutral-600">
        Add the segments worth comparing. No segment is primary by default — argue the case in the rating cells.
      </p>
      <!-- Profile coaching copy. Renaissance students often default to
           "students are the customer" because it's the easiest audience
           to picture; the helpers push back. -->
      <p class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-neutral-800">
        Do not confuse who likes or wears a product with who the brand is built to target. A student may wear a premium brand, but the brand may still be targeting adults with higher income, different shopping habits, or a different lifestyle.
      </p>
      <p class="text-xs text-neutral-600">
        Profiles help you describe the buyer clearly enough to research them. Name the likely age, income context, geography, motivation, channel, and evidence needed.
      </p>
      <datalist id="market-fit-profile-name-options">
        <option v-for="opt in PROFILE_NAME_EXAMPLES" :key="opt" :value="opt" />
      </datalist>
      <div v-if="editingEnabled" class="flex flex-wrap gap-1.5">
        <button
          v-for="(label, type) in SEGMENT_TYPE_LABELS"
          :key="type"
          type="button"
          class="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
          :disabled="type !== 'custom' && form.segments.some((s) => s.segmentType === type)"
          @click="addSeededSegment(type as MarketFitSegmentType)"
        >+ {{ label }}</button>
      </div>
      <p
        v-if="form.segments.length === 0"
        class="text-xs italic text-neutral-500"
      >No segments yet. Add at least two so the team can compare tradeoffs.</p>
      <ul class="space-y-2">
        <li
          v-for="seg in form.segments"
          :key="seg.id"
          class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-sm"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <input
              v-model="seg.name"
              type="text"
              :disabled="!editingEnabled"
              class="rounded border border-neutral-300 p-1 text-sm font-medium disabled:bg-neutral-100"
              placeholder="Segment name"
              @input="markDirty"
            />
            <button
              v-if="editingEnabled"
              type="button"
              class="text-xs text-rose-700 hover:underline"
              @click="removeSegment(seg.id)"
            >Remove</button>
          </div>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Why it might fit
            <textarea
              v-model="seg.whyItMightFit"
              rows="2"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              placeholder="What makes this segment a candidate? Be specific."
              @input="markDirty"
            />
          </label>
          <div class="mt-1 grid gap-2 sm:grid-cols-2">
            <label class="block text-xs font-medium text-neutral-800">
              Price fit
              <select
                v-model="seg.priceFit"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                  {{ o === '' ? '— Not set —' : o }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Story fit
              <select
                v-model="seg.storyFit"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                  {{ o === '' ? '— Not set —' : o }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Reachability
              <select
                v-model="seg.reachability"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                  {{ o === '' ? '— Not set —' : o }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Willingness to pay
              <select
                v-model="seg.willingnessToPay"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                  {{ o === '' ? '— Not set —' : o }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Evidence strength
              <select
                v-model="seg.evidenceStrength"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                  {{ o === '' ? '— Not set —' : o }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Role in strategy
              <select
                v-model="seg.roleInStrategy"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="(label, value) in SEGMENT_ROLE_LABELS" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Reachable audience
              <input
                :value="seg.reachableAudience ?? ''"
                type="number"
                min="0"
                step="1"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="(event) => { setNumber(seg, 'reachableAudience', (event.target as HTMLInputElement).value); markDirty() }"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Interest rate %
              <input
                :value="seg.interestRatePct ?? ''"
                type="number"
                min="0"
                max="100"
                step="0.1"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="(event) => { setNumber(seg, 'interestRatePct', (event.target as HTMLInputElement).value); markDirty() }"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Conversion rate %
              <input
                :value="seg.conversionRatePct ?? ''"
                type="number"
                min="0"
                max="100"
                step="0.1"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="(event) => { setNumber(seg, 'conversionRatePct', (event.target as HTMLInputElement).value); markDirty() }"
              />
            </label>
          </div>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Evidence / source
            <input
              v-model="seg.evidenceSource"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              placeholder="Survey, interview, comparable brand, or labeled assumption"
              @input="markDirty"
            />
          </label>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Risk
            <input
              v-model="seg.risk"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              placeholder="What could make this segment the wrong call?"
              @input="markDirty"
            />
          </label>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Next validation step
            <input
              v-model="seg.nextValidationStep"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              placeholder="What test or interview would tighten this?"
              @input="markDirty"
            />
          </label>

          <!-- Customer profile sub-block. Optional layer that lets the
               team describe the segment well enough to research them
               (age, income, geography, motivation, etc.). Inline,
               not collapsed, so the full positioning argument reads
               in one scroll. -->
          <fieldset class="mt-2 space-y-1 rounded-md border border-violet-200 bg-violet-50/40 p-2">
            <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Customer profile
            </legend>
            <p class="text-xs text-neutral-600">
              Profile names are examples — students can pick from the list or type a custom one. Do not auto-assign a profile as a fact.
            </p>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="block text-xs font-medium text-neutral-800">
                Profile name
                <input
                  v-model="seg.profile!.profileName"
                  type="text"
                  list="market-fit-profile-name-options"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="Civic Premium Buyer, Proud Parent Supporter, Gift Buyer…"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Age range
                <input
                  v-model="seg.profile!.ageRange"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="e.g. 35–60"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Income range / context
                <input
                  v-model="seg.profile!.incomeRange"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="ACS bracket or qualitative note"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Geography
                <input
                  v-model="seg.profile!.geographyContext"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="Detroit metro, Renaissance neighborhood, etc."
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Urban / suburban context
                <input
                  v-model="seg.profile!.urbanSuburbanContext"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="Urban professional, suburban family, etc."
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Lifestyle context
                <input
                  v-model="seg.profile!.lifestyleContext"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="What kind of life does this buyer live?"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
                Motivation
                <textarea
                  v-model="seg.profile!.motivation"
                  rows="2"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="Why would they buy this product?"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Price sensitivity
                <select
                  v-model="seg.profile!.priceSensitivity"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  @change="markDirty"
                >
                  <option v-for="o in SIGNAL_OPTIONS" :key="o" :value="o">
                    {{ o === '' ? '— Not set —' : o }}
                  </option>
                </select>
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Likely channel
                <input
                  v-model="seg.profile!.likelyChannel"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="Phoenix Nest, online drop, pop-up, gift event"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
                Values
                <input
                  v-model="seg.profile!.values"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="What does this buyer care about? (Detroit pride, school connection, gifting, premium goods…)"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
                Evidence needed
                <input
                  v-model="seg.profile!.evidenceNeeded"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="What sources would prove this profile fits?"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Profile risk
                <input
                  v-model="seg.profile!.risk"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="What could make this profile wrong?"
                  @input="markDirty"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Profile validation step
                <input
                  v-model="seg.profile!.validationStep"
                  type="text"
                  :disabled="!editingEnabled"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                  placeholder="What test would confirm or break the profile?"
                  @input="markDirty"
                />
              </label>
            </div>
          </fieldset>
        </li>
      </ul>
    </fieldset>

    <!-- Comparables -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Comparable products
      </legend>
      <p class="text-xs text-neutral-600">
        Comparable products help you defend price, quality, style, and target customer. Compare against products that are similar in price, quality, story, or buyer — not just products with the same category name.
      </p>
      <p class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-neutral-800">
        A sweatshirt is not automatically a good comp just because it is a sweatshirt. A strong comp may match price, quality, story, customer, channel, or style.
      </p>
      <button
        v-if="editingEnabled"
        type="button"
        class="text-xs text-violet-700 hover:underline"
        @click="addComparable"
      >+ Add comparable</button>
      <p
        v-if="form.comparables.length === 0"
        class="text-xs italic text-neutral-500"
      >No comparables yet. Add at least two so the price and customer claim hold up.</p>
      <ul class="space-y-2">
        <li
          v-for="c in form.comparables"
          :key="c.id"
          class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-sm"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <input
              v-model="c.brandOrProduct"
              type="text"
              :disabled="!editingEnabled"
              class="rounded border border-neutral-300 p-1 text-sm font-medium disabled:bg-neutral-100"
              placeholder="Brand / product"
              @input="markDirty"
            />
            <button
              v-if="editingEnabled"
              type="button"
              class="text-xs text-rose-700 hover:underline"
              @click="removeComparable(c.id)"
            >Remove</button>
          </div>
          <div class="mt-1 grid gap-2 sm:grid-cols-2">
            <label class="block text-xs font-medium text-neutral-800">
              Price
              <input
                :value="c.price ?? ''"
                type="number"
                min="0"
                step="0.01"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="(event) => { setNumber(c, 'price', (event.target as HTMLInputElement).value); markDirty() }"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Target customer
              <input
                v-model="c.targetCustomer"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Quality notes
              <input
                v-model="c.qualityNotes"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Style notes
              <input
                v-model="c.styleNotes"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Sales channel
              <input
                v-model="c.salesChannel"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                placeholder="Retail, online, pop-up, wholesale"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Source
              <input
                v-model="c.source"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                placeholder="Where did you find this comparable?"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              Similarity
              <input
                v-model="c.similarity"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              Difference
              <input
                v-model="c.difference"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              Lesson for Renni
              <input
                v-model="c.lessonForRenni"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                placeholder="What does this comparable tell us about price, quality, story, or buyer?"
                @input="markDirty"
              />
            </label>
          </div>

          <!-- Comp alignment metadata: what dimensions match + how
               strongly. Drives the deterministic feedback line right
               below the checkboxes. -->
          <fieldset class="mt-2 space-y-1 rounded-md border border-violet-200 bg-violet-50/40 p-2">
            <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Comp alignment
            </legend>
            <p class="text-xs text-neutral-600">
              Which dimensions does this comp actually align on?
            </p>
            <div class="grid gap-1 sm:grid-cols-2">
              <label
                v-for="t in COMP_TYPE_FIELDS"
                :key="t.key"
                class="flex items-center gap-1 text-xs text-neutral-700"
              >
                <input
                  type="checkbox"
                  :checked="c.compTypes?.[t.key] === true"
                  :disabled="!editingEnabled"
                  @change="(event) => { if (!c.compTypes) c.compTypes = {}; c.compTypes[t.key] = (event.target as HTMLInputElement).checked; markDirty() }"
                />
                {{ t.label }}
              </label>
            </div>
            <label class="mt-1 block text-xs font-medium text-neutral-800">
              Overall alignment
              <select
                v-model="c.compAlignment"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in COMP_ALIGNMENT_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }}
                </option>
              </select>
            </label>
            <p
              v-if="buildCompFeedback(c)"
              class="rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-800"
            >
              <span class="font-medium text-neutral-600">Coach feedback:</span>
              {{ buildCompFeedback(c)?.message }}
            </p>
          </fieldset>
        </li>
      </ul>
    </fieldset>

    <!-- Evidence requests -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        What evidence do we need next?
      </legend>
      <p class="text-xs text-neutral-600">
        The coach can suggest evidence to look for. The team still has to go find it.
      </p>
      <!-- Quantification guidance — distinguishes total / reachable /
           interested / likely buyers and reminds students that income
           data supports affordability, not demand. -->
      <p class="rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-800">
        <span class="font-medium text-neutral-600">Quantification path:</span>
        Total market is everyone who could theoretically fit the profile. Reachable market is who you can actually reach. Interested market is who may care. Likely buyers are the people who may actually purchase at this price.
      </p>
      <p class="rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-800">
        Income data supports affordability context, not demand. Pair income data with surveys, interviews, preorders, or observed behavior.
      </p>
      <!-- Affordability vs demand red flag — visible whenever the
           builder detects income/profile context without willingness or
           evidence support. Soft warning, not a save block. -->
      <p
        v-if="hasAffordabilityVsDemandRisk(asFitForUtil())"
        class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-neutral-800"
      >
        Someone being able to afford the product does not prove they want it. Someone wearing similar products does not prove they are the target customer. Use sources to test both affordability and willingness to buy.
      </p>
      <div v-if="editingEnabled" class="flex flex-wrap gap-1.5">
        <button
          v-for="(s, i) in SEEDED_EVIDENCE_SUGGESTIONS"
          :key="i"
          type="button"
          class="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-100"
          @click="addSeededEvidenceRequest(i)"
        >+ {{ s.question }}</button>
        <button
          type="button"
          class="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-100"
          @click="addEvidenceRequest"
        >+ Custom</button>
      </div>
      <ul class="space-y-2">
        <li
          v-for="r in form.evidenceRequests"
          :key="r.id"
          class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-sm"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <input
              v-model="r.question"
              type="text"
              :disabled="!editingEnabled"
              class="flex-1 rounded border border-neutral-300 p-1 text-sm disabled:bg-neutral-100"
              placeholder="Evidence question"
              @input="markDirty"
            />
            <button
              v-if="editingEnabled"
              type="button"
              class="text-xs text-rose-700 hover:underline"
              @click="removeEvidenceRequest(r.id)"
            >Remove</button>
          </div>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Why it matters
            <input
              v-model="r.whyItMatters"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              @input="markDirty"
            />
          </label>
          <div class="mt-1 grid gap-2 sm:grid-cols-3">
            <label class="block text-xs font-medium text-neutral-800">
              Suggested source
              <select
                v-model="r.suggestedSourceType"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="(label, value) in SOURCE_TYPE_LABELS" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Assigned to
              <input
                v-model="r.assignedToRole"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                placeholder="CMO, CSGO, Co-CEO, member"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Status
              <select
                v-model="r.status"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="(label, value) in EVIDENCE_STATUS_LABELS" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
          </div>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Notes
            <input
              v-model="r.notes"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              @input="markDirty"
            />
          </label>

          <!-- Source Coach prompts. Auto-seeded when the request is
               added from the suggestion list; always editable so the
               team can sharpen the wording for their actual context. -->
          <fieldset class="mt-2 space-y-1 rounded-md border border-violet-200 bg-violet-50/40 p-2">
            <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Source Coach
            </legend>
            <label class="block text-xs font-medium text-neutral-800">
              What question does this source answer?
              <textarea
                v-model="r.questionAnswered"
                rows="2"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              When to use it
              <textarea
                v-model="r.whenToUse"
                rows="2"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              What students should record
              <textarea
                v-model="r.whatToRecord"
                rows="2"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              How it supports or weakens the claim
              <textarea
                v-model="r.claimConnection"
                rows="2"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
          </fieldset>
        </li>
      </ul>
    </fieldset>

    <!-- Scenario assumptions -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Demand scenario for one segment
      </legend>
      <p class="text-xs text-neutral-600">
        Pick one segment, then split the assumption into conservative / base / ambitious. This is a demand-side estimate — it does not overwrite the CFO pricing or break-even engine.
      </p>
      <label class="block text-xs font-medium text-neutral-800">
        Segment
        <select
          v-model="form.scenarioAssumptions.selectedSegmentId"
          :disabled="!editingEnabled"
          class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
          @change="markDirty"
        >
          <option :value="null">— Pick a segment —</option>
          <option
            v-for="seg in form.segments"
            :key="seg.id"
            :value="seg.id"
          >{{ seg.name || 'Unnamed segment' }}</option>
        </select>
      </label>
      <p class="text-[11px] text-neutral-500">
        Buyers = audience × (interest % ÷ 100) × (conversion % ÷ 100). Revenue = buyers × price.
      </p>
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs">
          <thead>
            <tr class="text-left text-neutral-500">
              <th class="py-1 pr-2 font-medium">Scenario</th>
              <th class="py-1 pr-2 font-medium">Audience</th>
              <th class="py-1 pr-2 font-medium">Interest %</th>
              <th class="py-1 pr-2 font-medium">Conversion %</th>
              <th class="py-1 pr-2 font-medium">Buyers</th>
              <th class="py-1 pr-2 font-medium">Price</th>
              <th class="py-1 pr-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in scenarioRows" :key="row.label" class="align-top">
              <td class="py-1 pr-2 font-medium text-neutral-800">{{ row.label }}</td>
              <td class="py-1 pr-2 text-neutral-700">{{ fmtNumber(row.audience) }}</td>
              <td class="py-1 pr-2">
                <input
                  v-if="row.label === 'Conservative'"
                  :value="form.scenarioAssumptions.conservativeInterestRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'conservativeInterestRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
                <input
                  v-else-if="row.label === 'Base'"
                  :value="form.scenarioAssumptions.baseInterestRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'baseInterestRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
                <input
                  v-else
                  :value="form.scenarioAssumptions.ambitiousInterestRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'ambitiousInterestRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
              </td>
              <td class="py-1 pr-2">
                <input
                  v-if="row.label === 'Conservative'"
                  :value="form.scenarioAssumptions.conservativeConversionRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'conservativeConversionRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
                <input
                  v-else-if="row.label === 'Base'"
                  :value="form.scenarioAssumptions.baseConversionRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'baseConversionRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
                <input
                  v-else
                  :value="form.scenarioAssumptions.ambitiousConversionRatePct ?? ''"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :disabled="!editingEnabled"
                  class="w-20 rounded border border-neutral-300 p-1 text-xs disabled:bg-neutral-100"
                  @input="(event) => { setNumber(form.scenarioAssumptions, 'ambitiousConversionRatePct', (event.target as HTMLInputElement).value); markDirty() }"
                />
              </td>
              <td class="py-1 pr-2 text-neutral-800">{{ fmtNumber(row.buyers) }}</td>
              <td class="py-1 pr-2 text-neutral-700">{{ fmtCurrency(row.price) }}</td>
              <td class="py-1 pr-2 font-medium text-neutral-900">{{ fmtCurrency(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </fieldset>

    <!-- Recommendation summary -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Recommendation
      </legend>
      <p class="rounded-md border border-violet-200 bg-violet-50 p-2 text-xs text-neutral-800">
        <span class="font-medium">Auto-summary (deterministic, no AI):</span>
        {{ generatedSummary }}
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Likely primary market
          <input
            v-model="form.recommendation.likelyPrimaryMarket"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Likely secondary market
          <input
            v-model="form.recommendation.likelySecondaryMarket"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Launch / validation market
          <input
            v-model="form.recommendation.launchOrValidationMarket"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="The school can be a launch or awareness market without being the primary buyer."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Positioning summary
          <textarea
            v-model="form.recommendation.positioningSummary"
            rows="3"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="One paragraph the team would say to a Phoenix Nest buyer."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Strongest evidence
          <input
            v-model="form.recommendation.strongestEvidence"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Weakest assumption
          <input
            v-model="form.recommendation.weakestAssumption"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Recommended next validation
          <input
            v-model="form.recommendation.recommendedNextValidation"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <p v-if="saveError" class="text-xs text-rose-600">{{ saveError }}</p>
    <div v-if="editingEnabled" class="flex justify-end">
      <button
        type="button"
        class="btn-primary text-xs"
        :disabled="saving || !dirty"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save Market Fit Builder' }}
      </button>
    </div>
  </section>
</template>
