<script setup lang="ts">
// Pricing Strategy Engine V1 — section-level pricing decision tool.
//
// Helps Renaissance students connect cost, margin, market comps,
// customer segment, brand positioning, and validation into a single
// transparent recommendation for one product. Mounted only on Ch. 8
// Section 2 (sale-price) when the studio metadata enables it. The
// /pricing page remains the operational source of truth — this
// builder NEVER writes to pricingScenarios and never approves a
// price.
//
// Posture (do not relax in V1):
//   - additive layer on the existing deliverableOutputs document
//   - never gates submit / never gates Playbook readiness
//   - read-only when the deliverable is in_review / approved
//   - feedback is deterministic (no AI); refreshes live as inputs change
//   - Save button writes the whole PricingStrategyBuilder object back
//     via the composable; sibling fields are untouched
//   - never invents comp prices, never auto-writes the recommendation
//     scaffold into finalText

import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import type {
  MarketBuilderEntry,
  MarketFitBuilder,
  PricingStrategyBuilder,
  PricingStrategyComparable,
  PricingStrategyConfidence,
  PricingStrategyPriceTest,
  PricingStrategyProductType,
  PricingStrategyQualityLevel
} from '~/types/models'
import {
  analyzeComps,
  buildPricingAnalysis,
  computeDerived,
  formatMoney,
  formatPct,
  formatUnits,
  interpretCompPosition,
  interpretEvidence,
  interpretMargin,
  interpretSegment,
  safeCompUrl,
  summarizePriceTests,
  type CompEvidenceBand,
  type CompPositionBand,
  type EvidenceBand,
  type MarginBand,
  type SegmentBand
} from '~/utils/pricingStrategyMath'
import {
  extractCompSource,
  type ExtractedCompSourceSuggestion,
  type ExtractedPriceCandidate
} from '~/utils/compSourceExtraction'

const props = defineProps<{
  deliverableId: string
  sectionId: string
  sectionTitle: string
  // Pre-existing student-saved pricing data, if any. Cloned into a
  // local reactive form so editing doesn't mutate the snapshot.
  initial: PricingStrategyBuilder | null
  editingEnabled: boolean
  // Optional studio-provided guidance string shown above the editor.
  guidance?: string | null
  // Optional read-only Ch. 7 context. The component renders these as
  // pure references — never overwrites Ch. 7, never copies values
  // into local state. Pass null arrays / null objects when there's
  // no upstream data.
  ch7MarketFit?: MarketFitBuilder | null
  ch7MarketEntries?: MarketBuilderEntry[] | null
}>()

const auth = useAuthStore()
const outputs = useDeliverableOutputs()

const PRODUCT_TYPES: Array<{ value: PricingStrategyProductType; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'sweatshirt', label: 'Sweatshirt' },
  { value: 't-shirt', label: 'T-shirt' },
  { value: 'beanie', label: 'Beanie' },
  { value: 'baked-good', label: 'Baked good' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Other' }
]

const QUALITY_LEVELS: Array<{ value: PricingStrategyQualityLevel; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'limited-run', label: 'Limited run' }
]

const CONFIDENCE_OPTIONS: Array<{ value: PricingStrategyConfidence; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'low', label: 'Low — assumptions only' },
  { value: 'medium', label: 'Medium — some evidence' },
  { value: 'high', label: 'High — preorder / direct customer evidence' }
]

const positioningOptions = [
  '',
  'Value play',
  'Market-aligned',
  'Premium / story-led',
  'Limited run',
  'Civic / mission-led',
  'Loss leader (intentionally below margin)'
]

// --- form state ----------------------------------------------------
// Whole-form reactive object so the deterministic feedback updates
// live as inputs change. Cloned from props.initial on mount and on
// re-mount-with-different-id (section change).
function emptyForm(): PricingStrategyBuilder {
  return {
    linkedPricingScenarioId: null,
    productName: '',
    productType: '',
    qualityLevel: '',
    productionStory: '',
    materialNotes: '',
    packagingNotes: '',
    brandStoryNotes: '',
    targetSegment: '',
    positioningMode: '',
    baseProductCost: null,
    decorationCost: null,
    laborCost: null,
    packagingCost: null,
    transactionFee: null,
    otherUnitCost: null,
    fixedCosts: null,
    expectedUnitsSold: null,
    proposedPrice: null,
    desiredGrossMarginPct: null,
    comparablePrices: [],
    priceTests: [],
    confidence: '',
    validationStep: ''
  }
}

function cloneInitial(initial: PricingStrategyBuilder | null): PricingStrategyBuilder {
  if (!initial) return emptyForm()
  const base = emptyForm()
  return {
    ...base,
    ...initial,
    comparablePrices:
      initial.comparablePrices?.map((c) => ({ ...c })) ?? [],
    priceTests: initial.priceTests?.map((t) => ({ ...t })) ?? []
  }
}

const form = reactive<PricingStrategyBuilder>(cloneInitial(props.initial))
const dirty = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const justSavedAt = ref<string | null>(null)
const activeStep = ref<1 | 2 | 3 | 4>(1)
const showRecommendationScaffold = ref(false)

// Re-clone when a different section's snapshot lands (e.g. parent
// section change). Watching by reference is fine — the parent passes
// a new object via props each time the watcher fires.
watch(
  () => props.initial,
  (next) => {
    Object.assign(form, cloneInitial(next))
    dirty.value = false
    saveError.value = null
  }
)

function markDirty() {
  dirty.value = true
}

// Numeric form helpers — input.type=number returns "" for blank,
// which we coerce to null. NaN/Infinity get coerced to null too so
// the math layer never sees them.
function parseNumberInput(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : null
  }
  return null
}

function setNumber(key: keyof PricingStrategyBuilder, v: unknown) {
  // The numeric fields below are number | null on the type. The cast
  // is safe because we only call setNumber for those keys.
  ;(form as Record<string, unknown>)[key as string] = parseNumberInput(v)
  markDirty()
}

// --- comparables ---------------------------------------------------
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ps-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function addComparable() {
  if (!form.comparablePrices) form.comparablePrices = []
  form.comparablePrices.push({
    id: genId(),
    name: '',
    price: null,
    source: '',
    notes: '',
    alignment: '',
    // V1.1 — added evidence detail fields seeded blank so old comps
    // and new comps share the same shape on save.
    url: '',
    sourceName: '',
    sourceDate: '',
    productType: '',
    qualityTier: '',
    relevance: '',
    proves: '',
    doesNotProve: ''
  })
  markDirty()
}
function removeComparable(id: string) {
  form.comparablePrices = (form.comparablePrices ?? []).filter((c) => c.id !== id)
  markDirty()
}

// --- comp source assistant (V1.2) -----------------------------------
// Pasted-text only. Pure deterministic extraction — never fetches a
// URL, never calls AI, never auto-saves. The student reviews the
// suggestion card and either accepts (creates a comp row), edits
// (creates an editable comp row), or dismisses (clears the
// suggestion). The existing "Save pricing strategy" button remains
// the only Firestore write path.
const compAssistantPaste = ref('')
const compSuggestion = ref<ExtractedCompSourceSuggestion | null>(null)
const selectedPriceIdx = ref<number | -1>(-1)
const compAssistantError = ref<string | null>(null)

function runCompSuggestion() {
  compAssistantError.value = null
  try {
    const result = extractCompSource({ pastedText: compAssistantPaste.value })
    compSuggestion.value = result
    // Default selection: first price candidate, or "no price" when
    // none found / when there are multiple (force the student to
    // pick).
    if (result.priceCandidates.length === 1) {
      selectedPriceIdx.value = 0
    } else {
      selectedPriceIdx.value = -1
    }
  } catch (e) {
    compAssistantError.value = e instanceof Error ? e.message : String(e)
    compSuggestion.value = null
  }
}

function clearPastedText() {
  compAssistantPaste.value = ''
  compSuggestion.value = null
  selectedPriceIdx.value = -1
  compAssistantError.value = null
}

function dismissCompSuggestion() {
  compSuggestion.value = null
  selectedPriceIdx.value = -1
}

// Build a draft comp row from the current suggestion + selected price.
// Internal — used by both "Use suggestion" and "Edit before adding"
// since they create the same shape; "Edit before adding" just keeps
// the suggestion banner cleared so the student can immediately type.
function buildSuggestionRow(): PricingStrategyComparable | null {
  const s = compSuggestion.value
  if (!s) return null
  const idx = selectedPriceIdx.value
  const picked: ExtractedPriceCandidate | null =
    idx >= 0 && idx < s.priceCandidates.length ? s.priceCandidates[idx] : null
  return {
    id: genId(),
    name: s.name ?? '',
    price: picked?.value ?? null,
    source: '',
    notes: '',
    alignment: '',
    url: s.url ?? '',
    sourceName: s.sourceName ?? '',
    sourceDate: s.sourceDate ?? '',
    productType: s.productType ?? '',
    qualityTier: s.qualityTier ?? '',
    relevance: '',
    proves: '',
    doesNotProve: '',
    extractionMethod: 'pasted_text',
    extractionConfidence: s.extractionConfidence,
    reviewedByStudent: false,
    reviewedAt: null
  }
}

function useCompSuggestion() {
  const row = buildSuggestionRow()
  if (!row) return
  // "Use suggestion" implies the student has read the card and is
  // accepting the values. We set reviewedByStudent + reviewedAt so
  // the row reflects student approval. The student can still edit
  // the row inline before clicking the existing Save button.
  row.reviewedByStudent = true
  row.reviewedAt = new Date().toISOString()
  if (!form.comparablePrices) form.comparablePrices = []
  form.comparablePrices.push(row)
  markDirty()
  // Clear the assistant so the next paste starts fresh; keep the
  // pasted text in the textarea so the student can adjust + re-run
  // if they want.
  compSuggestion.value = null
  selectedPriceIdx.value = -1
}

function editSuggestionBeforeAdding() {
  const row = buildSuggestionRow()
  if (!row) return
  // Different from "Use" — review hasn't happened yet, the student
  // is going to look at every field and edit before saving. Leave
  // reviewedByStudent false so the row's chip reads "Suggested from
  // pasted text" without the "Student reviewed" badge until the
  // student touches a field. (We don't track per-field touches in
  // V1.2; the chip simply reflects whichever entry path was used.)
  if (!form.comparablePrices) form.comparablePrices = []
  form.comparablePrices.push(row)
  markDirty()
  compSuggestion.value = null
  selectedPriceIdx.value = -1
}

// --- price tests ---------------------------------------------------
function addPriceTest() {
  if (!form.priceTests) form.priceTests = []
  form.priceTests.push({
    id: genId(),
    price: null,
    expectedUnitsSold: null,
    notes: ''
  })
  markDirty()
}
function removePriceTest(id: string) {
  form.priceTests = (form.priceTests ?? []).filter((t) => t.id !== id)
  markDirty()
}

// --- live deterministic feedback ----------------------------------
const derived = computed(() => computeDerived(form))
const marginInterp = computed(() => interpretMargin(derived.value))
const compPosition = computed(() => interpretCompPosition(form))
const evidenceInterp = computed(() => interpretEvidence(form))
const segmentInterp = computed(() => interpretSegment(form))
const priceTests = computed(() => summarizePriceTests(form))
// V1.1 — comp evidence strength chip + composite "What this means"
// analysis. Both pure derivations from the form; no AI, no API calls.
const compAnalysis = computed(() => analyzeComps(form))
const pricingAnalysis = computed(() => buildPricingAnalysis(form))

// Chip colors for each interpretation band. Tailwind classes only —
// no inline styles. Mirrors the BrandFit/MarketFit chip vocabulary.
function marginChipClass(band: MarginBand): string {
  switch (band) {
    case 'below_cost':
      return 'border-rose-300 bg-rose-50 text-rose-800'
    case 'weak':
      return 'border-amber-300 bg-amber-50 text-amber-800'
    case 'tight':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'healthy':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'strong':
      return 'border-sky-300 bg-sky-50 text-sky-800'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
function compChipClass(band: CompPositionBand): string {
  switch (band) {
    case 'within_range':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'below_range':
      return 'border-amber-300 bg-amber-50 text-amber-800'
    case 'above_range':
      return 'border-sky-300 bg-sky-50 text-sky-800'
    case 'far_above_range':
      return 'border-rose-300 bg-rose-50 text-rose-800'
    case 'needs_evidence':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
function evidenceChipClass(band: EvidenceBand): string {
  switch (band) {
    case 'high':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'low':
      return 'border-amber-300 bg-amber-50 text-amber-800'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
function compEvidenceChipClass(band: CompEvidenceBand): string {
  switch (band) {
    case 'strong':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'usable':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'one':
      return 'border-amber-300 bg-amber-50 text-amber-800'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
function segmentChipClass(band: SegmentBand): string {
  switch (band) {
    case 'civic_premium':
    case 'alumni':
    case 'parent':
      return 'border-violet-300 bg-violet-50 text-violet-800'
    case 'student':
      return 'border-sky-300 bg-sky-50 text-sky-800'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

// --- recommendation scaffold (copyable; never auto-written) -------
// V1.1 wording — emphasises the team's *reasoning* and explicitly notes
// the price is not yet proven. Still student-authored: the scaffold is
// only ever copy-pasted, never written into finalText automatically.
const recommendationScaffold = computed(() => {
  const price =
    form.proposedPrice != null ? `$${formatMoney(form.proposedPrice)}` : '__'
  const segment = (form.targetSegment || '').trim() || '__'
  const cost = `$${formatMoney(derived.value.totalUnitCost)}`
  const marginPctText =
    derived.value.grossMarginPct != null
      ? formatPct(derived.value.grossMarginPct)
      : '__'

  const compLine =
    compAnalysis.value.evidence.band === 'none'
      ? 'we still need comparable evidence on file'
      : compAnalysis.value.evidence.band === 'one'
        ? 'we have one comp on file and need at least one more before placing this price against the market'
        : compPosition.value.band === 'within_range'
          ? `the comparable range we logged ($${formatMoney(compPosition.value.min)}–$${formatMoney(compPosition.value.max)}), this price is within range`
          : compPosition.value.band === 'below_range'
            ? `the comparable range we logged ($${formatMoney(compPosition.value.min)}–$${formatMoney(compPosition.value.max)}), this price is below the range`
            : compPosition.value.band === 'above_range'
              ? `the comparable range we logged ($${formatMoney(compPosition.value.min)}–$${formatMoney(compPosition.value.max)}), this price sits above the range and is premium-positioned`
              : compPosition.value.band === 'far_above_range'
                ? `the comparable range we logged ($${formatMoney(compPosition.value.min)}–$${formatMoney(compPosition.value.max)}), this price is well above the range and acceptance risk is high`
                : `the comparable range we logged ($${formatMoney(compPosition.value.min)}–$${formatMoney(compPosition.value.max)})`

  const segmentReason = segmentInterp.value.detail

  const riskLine =
    derived.value.belowCost
      ? 'the price is below cost — the unit loses money before fixed costs'
      : marginInterp.value.band === 'weak'
        ? 'margin is too thin to absorb surprises'
        : compPosition.value.band === 'far_above_range'
          ? 'price acceptance risk is high relative to comps'
          : compAnalysis.value.evidence.band === 'none' || compAnalysis.value.evidence.band === 'one'
            ? 'comparable evidence is too thin to argue this price is market-aligned'
            : evidenceInterp.value.band === 'low' || evidenceInterp.value.band === 'none'
              ? 'evidence supporting customer acceptance is still thin'
              : '__'

  const validation = (form.validationStep || '').trim() || '__'

  return [
    `Our recommended price is ${price}.`,
    `Our estimated unit cost is ${cost}, which creates a gross margin of ${marginPctText}.`,
    `Compared with ${compLine}.`,
    `We believe the strongest buyer is ${segment} because ${segmentReason}`,
    `The biggest risk is ${riskLine}.`,
    `This does not prove demand yet, so our next validation step is ${validation}.`
  ].join(' ')
})

// --- read-only Ch. 7 context derivations --------------------------
// Pure pass-through summaries — we never copy values into form state
// or invoke any backend. If Ch. 7 has nothing, the panel renders the
// "Add Ch. 7 evidence" advisory line.
const ch7HasContent = computed<boolean>(() => {
  if (props.ch7MarketFit) {
    const f = props.ch7MarketFit
    if (
      Boolean(f.productFacts?.productName?.trim()) ||
      (f.segments?.length ?? 0) > 0 ||
      (f.comparables?.length ?? 0) > 0 ||
      Boolean(f.recommendation?.likelyPrimaryMarket?.trim())
    ) {
      return true
    }
  }
  if ((props.ch7MarketEntries?.length ?? 0) > 0) return true
  return false
})

// --- save -----------------------------------------------------------
async function save() {
  if (!props.editingEnabled || saving.value) return
  if (!auth.user || !auth.profile) return
  saveError.value = null

  // Light validation. Negative cost / negative price / non-finite
  // values are blocked here; the math helper would coerce them to
  // null but we prefer surfacing the error to the student so they
  // know their input wasn't accepted.
  const errs: string[] = []
  function checkNonNeg(label: string, v: number | null | undefined) {
    if (v === null || v === undefined) return
    if (!Number.isFinite(v)) {
      errs.push(`${label} is not a valid number.`)
      return
    }
    if (v < 0) errs.push(`${label} cannot be negative.`)
  }
  checkNonNeg('Base product cost', form.baseProductCost)
  checkNonNeg('Decoration cost', form.decorationCost)
  checkNonNeg('Labor cost', form.laborCost)
  checkNonNeg('Packaging cost', form.packagingCost)
  checkNonNeg('Transaction fee', form.transactionFee)
  checkNonNeg('Other unit cost', form.otherUnitCost)
  checkNonNeg('Fixed costs', form.fixedCosts)
  checkNonNeg('Expected units sold', form.expectedUnitsSold)
  checkNonNeg('Proposed price', form.proposedPrice)
  if (
    form.desiredGrossMarginPct != null &&
    Number.isFinite(form.desiredGrossMarginPct) &&
    (form.desiredGrossMarginPct < 0 || form.desiredGrossMarginPct >= 100)
  ) {
    errs.push('Desired gross margin must be between 0 and 99%.')
  }
  for (const c of form.comparablePrices ?? []) {
    if (c.price != null && Number.isFinite(c.price) && c.price < 0) {
      errs.push(`Comparable "${c.name || 'unnamed'}" price cannot be negative.`)
    }
  }
  for (const t of form.priceTests ?? []) {
    if (t.price != null && Number.isFinite(t.price) && t.price < 0) {
      errs.push(`Price test cannot be negative.`)
    }
    if (
      t.expectedUnitsSold != null &&
      Number.isFinite(t.expectedUnitsSold) &&
      t.expectedUnitsSold < 0
    ) {
      errs.push(`Price test expected units cannot be negative.`)
    }
  }
  if (errs.length) {
    saveError.value = errs[0]
    return
  }

  saving.value = true
  try {
    const payload: PricingStrategyBuilder = {
      linkedPricingScenarioId: form.linkedPricingScenarioId ?? null,
      productName: form.productName,
      productType: form.productType,
      qualityLevel: form.qualityLevel,
      productionStory: form.productionStory,
      materialNotes: form.materialNotes,
      packagingNotes: form.packagingNotes,
      brandStoryNotes: form.brandStoryNotes,
      targetSegment: form.targetSegment,
      positioningMode: form.positioningMode,
      baseProductCost: form.baseProductCost,
      decorationCost: form.decorationCost,
      laborCost: form.laborCost,
      packagingCost: form.packagingCost,
      transactionFee: form.transactionFee,
      otherUnitCost: form.otherUnitCost,
      fixedCosts: form.fixedCosts,
      expectedUnitsSold: form.expectedUnitsSold,
      proposedPrice: form.proposedPrice,
      desiredGrossMarginPct: form.desiredGrossMarginPct,
      comparablePrices: (form.comparablePrices ?? []).map((c) => ({ ...c })),
      priceTests: (form.priceTests ?? []).map((t) => ({ ...t })),
      confidence: form.confidence,
      validationStep: form.validationStep
    }
    await outputs.savePricingStrategyBuilder(
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
    justSavedAt.value = new Date().toISOString()
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function copyScaffold() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(recommendationScaffold.value)
  } catch {
    // Silently ignore — copy is best-effort. Users can still
    // select the text manually.
  }
}
</script>

<template>
  <section class="space-y-3 rounded-md border border-amber-200 bg-amber-50/30 p-3">
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Pricing Strategy Builder
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        Connect cost, margin, comps, and customer fit
      </h4>
      <p class="text-xs text-neutral-600">
        {{
          guidance ||
          'Use this builder to compare cost, margin, market comps, and customer fit before writing your final price recommendation.'
        }}
      </p>
      <p class="text-[11px] italic text-neutral-500">
        This is guidance for your pricing recommendation, not a final approval.
        The /pricing page remains the operational source of truth — this builder
        does not write to it.
      </p>
    </header>

    <!-- Step nav. Wraps on small screens. -->
    <nav class="flex flex-wrap gap-1.5 text-xs" aria-label="Pricing strategy steps">
      <button
        v-for="(label, idx) in [
          'Product & story',
          'Cost & margin',
          'Price tests & comps',
          'Positioning & recommendation'
        ]"
        :key="`ps-step-${idx}`"
        type="button"
        :class="[
          'rounded-full border px-2.5 py-1',
          activeStep === idx + 1
            ? 'border-amber-400 bg-amber-100 font-semibold text-amber-900'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
        ]"
        @click="activeStep = (idx + 1) as 1 | 2 | 3 | 4"
      >
        {{ idx + 1 }}. {{ label }}
      </button>
    </nav>

    <!-- ============================================================
         Step 1 — Product and story
         ============================================================ -->
    <fieldset v-if="activeStep === 1" class="space-y-2 rounded-md border border-neutral-200 bg-white p-3">
      <legend class="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Step 1 — Product &amp; story
      </legend>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Product name</span>
          <input
            v-model="form.productName"
            :disabled="!editingEnabled"
            type="text"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="House Phoenix sweatshirt"
            @input="markDirty"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Product type</span>
          <select
            v-model="form.productType"
            :disabled="!editingEnabled"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="opt in PRODUCT_TYPES" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Quality level</span>
          <select
            v-model="form.qualityLevel"
            :disabled="!editingEnabled"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="opt in QUALITY_LEVELS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Target segment</span>
          <input
            v-model="form.targetSegment"
            :disabled="!editingEnabled"
            type="text"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="Civic Premium Buyer"
            @input="markDirty"
          />
        </label>
        <label class="text-xs sm:col-span-2">
          <span class="font-medium text-neutral-700">Production story</span>
          <textarea
            v-model="form.productionStory"
            :disabled="!editingEnabled"
            rows="2"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="100% made in Detroit; embroidered locally; limited run of 75 units."
            @input="markDirty"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Material notes</span>
          <textarea
            v-model="form.materialNotes"
            :disabled="!editingEnabled"
            rows="2"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="Heavyweight 12oz fleece, locally sourced cotton blend."
            @input="markDirty"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Packaging notes</span>
          <textarea
            v-model="form.packagingNotes"
            :disabled="!editingEnabled"
            rows="2"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="Branded hangtag, recyclable poly bag, House Phoenix sticker."
            @input="markDirty"
          />
        </label>
        <label class="text-xs sm:col-span-2">
          <span class="font-medium text-neutral-700">Brand / story notes</span>
          <textarea
            v-model="form.brandStoryNotes"
            :disabled="!editingEnabled"
            rows="2"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="Anchors House Phoenix's flagship Detroit-made narrative for TechTown."
            @input="markDirty"
          />
        </label>
        <label class="text-xs sm:col-span-2">
          <span class="font-medium text-neutral-700">Positioning mode</span>
          <select
            v-model="form.positioningMode"
            :disabled="!editingEnabled"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="m in positioningOptions" :key="`pos-${m}`" :value="m">
              {{ m || '— Not set —' }}
            </option>
          </select>
        </label>
      </div>
    </fieldset>

    <!-- ============================================================
         Step 2 — Cost and margin
         ============================================================ -->
    <fieldset v-if="activeStep === 2" class="space-y-3 rounded-md border border-neutral-200 bg-white p-3">
      <legend class="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Step 2 — Cost &amp; margin
      </legend>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Base product cost ($)</span>
          <input
            :value="form.baseProductCost ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('baseProductCost', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Decoration / printing / patch cost ($)</span>
          <input
            :value="form.decorationCost ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('decorationCost', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Labor / vendor cost ($)</span>
          <input
            :value="form.laborCost ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('laborCost', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Packaging cost ($)</span>
          <input
            :value="form.packagingCost ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('packagingCost', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Transaction / platform fee ($)</span>
          <input
            :value="form.transactionFee ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('transactionFee', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Other unit cost ($)</span>
          <input
            :value="form.otherUnitCost ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('otherUnitCost', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Fixed costs allocated to this product ($)</span>
          <input
            :value="form.fixedCosts ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('fixedCosts', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Expected units sold</span>
          <input
            :value="form.expectedUnitsSold ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="1"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('expectedUnitsSold', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Proposed price ($)</span>
          <input
            :value="form.proposedPrice ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="0.01"
            min="0"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('proposedPrice', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Desired gross margin %</span>
          <input
            :value="form.desiredGrossMarginPct ?? ''"
            :disabled="!editingEnabled"
            type="number"
            step="1"
            min="0"
            max="99"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @input="setNumber('desiredGrossMarginPct', ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>

      <!-- Live derived numbers -->
      <dl class="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs sm:grid-cols-3">
        <div>
          <dt class="text-neutral-500">Total unit cost</dt>
          <dd class="font-medium text-neutral-900">
            ${{ formatMoney(derived.totalUnitCost) }}
          </dd>
        </div>
        <div>
          <dt class="text-neutral-500">Unit margin</dt>
          <dd
            class="font-medium"
            :class="derived.belowCost ? 'text-rose-700' : 'text-neutral-900'"
          >
            <span v-if="derived.unitMargin != null">${{ formatMoney(derived.unitMargin) }}</span>
            <span v-else>—</span>
          </dd>
        </div>
        <div>
          <dt class="text-neutral-500">Gross margin %</dt>
          <dd class="font-medium text-neutral-900">
            {{ formatPct(derived.grossMarginPct) }}
          </dd>
        </div>
        <div>
          <dt class="text-neutral-500">Break-even units</dt>
          <dd class="font-medium text-neutral-900">
            {{ derived.breakEvenUnits != null ? formatUnits(derived.breakEvenUnits) : '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-neutral-500">Estimated revenue</dt>
          <dd class="font-medium text-neutral-900">
            <span v-if="derived.revenue != null">${{ formatMoney(derived.revenue) }}</span>
            <span v-else>—</span>
          </dd>
        </div>
        <div>
          <dt class="text-neutral-500">Estimated gross profit</dt>
          <dd
            class="font-medium"
            :class="(derived.grossProfit ?? 0) < 0 ? 'text-rose-700' : 'text-neutral-900'"
          >
            <span v-if="derived.grossProfit != null">${{ formatMoney(derived.grossProfit) }}</span>
            <span v-else>—</span>
          </dd>
        </div>
        <div class="sm:col-span-3">
          <dt class="text-neutral-500">Target-margin price (at desired %)</dt>
          <dd class="font-medium text-neutral-900">
            <span v-if="derived.targetMarginPrice != null">${{ formatMoney(derived.targetMarginPrice) }}</span>
            <span v-else>—</span>
          </dd>
        </div>
      </dl>
    </fieldset>

    <!-- ============================================================
         Step 3 — Price tests + comps
         ============================================================ -->
    <fieldset v-if="activeStep === 3" class="space-y-3 rounded-md border border-neutral-200 bg-white p-3">
      <legend class="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Step 3 — Price tests &amp; comps
      </legend>

      <!-- Price tests -->
      <div class="space-y-2">
        <header class="flex items-center justify-between">
          <h5 class="text-xs font-semibold text-neutral-800">Price test rows</h5>
          <button
            v-if="editingEnabled"
            type="button"
            class="text-xs text-phoenix-700 hover:underline"
            @click="addPriceTest"
          >+ Add price test</button>
        </header>
        <p class="text-xs text-neutral-600">
          Try a few candidate prices side-by-side. The estimated revenue and
          margin update from the unit cost in Step 2 — no extra entry needed.
        </p>
        <p
          v-if="(form.priceTests?.length ?? 0) === 0"
          class="text-xs italic text-neutral-500"
        >
          No price tests added yet. Add candidate prices like $75, $90, $100, $120.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="(t, idx) in form.priceTests"
            :key="t.id"
            class="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2"
          >
            <div class="grid gap-2 sm:grid-cols-3">
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Price ($)</span>
                <input
                  :value="t.price ?? ''"
                  :disabled="!editingEnabled"
                  type="number"
                  step="0.01"
                  min="0"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  @input="t.price = parseNumberInput(($event.target as HTMLInputElement).value); markDirty()"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Expected units</span>
                <input
                  :value="t.expectedUnitsSold ?? ''"
                  :disabled="!editingEnabled"
                  type="number"
                  step="1"
                  min="0"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  @input="t.expectedUnitsSold = parseNumberInput(($event.target as HTMLInputElement).value); markDirty()"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Notes</span>
                <input
                  v-model="t.notes"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="e.g. parent-friendly anchor"
                  @input="markDirty"
                />
              </label>
            </div>
            <div
              v-if="priceTests.rows[idx]"
              class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-700"
            >
              <span>
                Margin:
                <span :class="(priceTests.rows[idx].estUnitMargin ?? 0) < 0 ? 'text-rose-700 font-medium' : 'font-medium text-neutral-900'">
                  {{ priceTests.rows[idx].estUnitMargin != null ? '$' + formatMoney(priceTests.rows[idx].estUnitMargin) : '—' }}
                </span>
              </span>
              <span>
                Revenue:
                <span class="font-medium text-neutral-900">
                  {{ priceTests.rows[idx].estRevenue != null ? '$' + formatMoney(priceTests.rows[idx].estRevenue) : '—' }}
                </span>
              </span>
              <span>
                Gross margin:
                <span :class="(priceTests.rows[idx].estGrossMarginPct ?? 0) < 0 ? 'text-rose-700 font-medium' : 'font-medium text-neutral-900'">
                  {{ formatPct(priceTests.rows[idx].estGrossMarginPct) }}
                </span>
              </span>
              <span>
                Gross profit:
                <span :class="(priceTests.rows[idx].estGrossProfit ?? 0) < 0 ? 'text-rose-700 font-medium' : 'font-medium text-neutral-900'">
                  {{ priceTests.rows[idx].estGrossProfit != null ? '$' + formatMoney(priceTests.rows[idx].estGrossProfit) : '—' }}
                </span>
              </span>
            </div>
            <div v-if="editingEnabled" class="flex justify-end">
              <button
                type="button"
                class="text-xs text-rose-700 hover:underline"
                @click="removePriceTest(t.id)"
              >Remove</button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Comp Source Assistant (V1.2) — pasted-text only.
           Student-driven: the assistant suggests, the student
           reviews, only "Use suggestion" or "Edit before adding"
           creates a comparable row. The existing Save Pricing
           Strategy button remains the only Firestore write path.
           Hidden entirely when editingEnabled is false so review
           state can't trigger network-adjacent input. -->
      <details
        v-if="editingEnabled"
        class="space-y-2 rounded-md border border-violet-200 bg-violet-50/40 p-2"
      >
        <summary class="cursor-pointer text-xs font-semibold text-violet-900">
          Suggest from pasted product text
        </summary>
        <div class="mt-2 space-y-2">
          <p class="text-xs text-neutral-700">
            Paste text copied from a product page. The system will suggest
            fields for a comparable product, but you must review before saving.
          </p>
          <ul class="ml-4 list-disc text-[11px] text-neutral-600">
            <li>Suggestions are a starting point. Check the product page before using this as evidence.</li>
            <li>This does not prove demand.</li>
            <li>Do not rely on sale prices or variant prices without checking the page.</li>
            <li>Student must verify before saving.</li>
          </ul>
          <textarea
            v-model="compAssistantPaste"
            rows="5"
            class="w-full rounded border border-neutral-300 p-1.5 text-sm"
            placeholder="Paste product page text here — name, price, store. The assistant never fetches the page; it only reads what you paste."
          />
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn-primary text-xs"
              :disabled="!compAssistantPaste.trim().length"
              @click="runCompSuggestion"
            >Suggest fields</button>
            <button
              type="button"
              class="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              :disabled="!compAssistantPaste.length && !compSuggestion"
              @click="clearPastedText"
            >Clear pasted text</button>
            <span class="text-[11px] italic text-neutral-500">
              No URL fetching. No AI. No auto-save.
            </span>
          </div>
          <p v-if="compAssistantError" class="text-xs text-rose-700">{{ compAssistantError }}</p>

          <!-- Draft suggestion card. -->
          <section
            v-if="compSuggestion"
            class="space-y-2 rounded-md border border-violet-300 bg-white p-2 text-xs"
          >
            <header class="flex flex-wrap items-baseline justify-between gap-2">
              <h6 class="font-semibold text-violet-900">Draft suggestion</h6>
              <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
                Confidence · {{ compSuggestion.extractionConfidence }}
              </span>
            </header>
            <dl class="space-y-1 text-neutral-800">
              <div>
                <dt class="font-medium text-neutral-600">Name</dt>
                <dd>{{ compSuggestion.name || '— not detected —' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-neutral-600">Source / store</dt>
                <dd>{{ compSuggestion.sourceName || '— not detected —' }}</dd>
              </div>
              <div v-if="compSuggestion.url">
                <dt class="font-medium text-neutral-600">Detected URL</dt>
                <dd class="break-all">
                  <a
                    :href="safeCompUrl(compSuggestion.url) ?? undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-phoenix-700 hover:underline"
                  >{{ compSuggestion.url }}</a>
                </dd>
              </div>
              <div v-if="compSuggestion.sourceDate">
                <dt class="font-medium text-neutral-600">Source date</dt>
                <dd>{{ compSuggestion.sourceDate }}</dd>
              </div>
              <div v-if="compSuggestion.productType">
                <dt class="font-medium text-neutral-600">Product type</dt>
                <dd>{{ compSuggestion.productType }}</dd>
              </div>
              <div v-if="compSuggestion.qualityTier">
                <dt class="font-medium text-neutral-600">Quality tier</dt>
                <dd>{{ compSuggestion.qualityTier }}</dd>
              </div>
            </dl>

            <!-- Price candidates — radio when more than one, single
                 chip when exactly one, "no price" notice when none. -->
            <div class="space-y-1">
              <p class="font-medium text-neutral-700">Price candidates</p>
              <p
                v-if="compSuggestion.priceCandidates.length === 0"
                class="italic text-neutral-500"
              >No price detected. Enter the price manually after checking the page.</p>
              <ul v-else class="space-y-1">
                <li
                  v-for="(p, i) in compSuggestion.priceCandidates"
                  :key="`pc-${i}`"
                  class="flex flex-wrap items-baseline gap-2"
                >
                  <label class="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      :name="`comp-price-${sectionId}`"
                      :value="i"
                      :checked="selectedPriceIdx === i"
                      @change="selectedPriceIdx = i"
                    />
                    <span class="font-medium text-neutral-900">{{ p.raw }}</span>
                    <span class="text-neutral-600">→ ${{ formatMoney(p.value) }}</span>
                  </label>
                  <span
                    class="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="p.confidence === 'high'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : p.confidence === 'medium'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-rose-300 bg-rose-50 text-rose-800'"
                  >{{ p.confidence }}</span>
                  <span v-if="p.reason" class="text-[11px] text-neutral-600">{{ p.reason }}</span>
                </li>
                <li class="flex items-center gap-1">
                  <label class="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      :name="`comp-price-${sectionId}`"
                      :value="-1"
                      :checked="selectedPriceIdx === -1"
                      @change="selectedPriceIdx = -1"
                    />
                    <span class="text-neutral-700">No price / I'll enter manually</span>
                  </label>
                </li>
              </ul>
            </div>

            <!-- Warnings — always shown, even when extraction
                 confidence is high. The team should never treat
                 the assistant's output as authoritative. -->
            <ul
              v-if="compSuggestion.warnings.length > 0"
              class="ml-4 list-disc space-y-0.5 text-amber-800"
            >
              <li v-for="(w, i) in compSuggestion.warnings" :key="`w-${i}`">{{ w }}</li>
            </ul>

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn-primary text-xs"
                @click="useCompSuggestion"
              >Use suggestion</button>
              <button
                type="button"
                class="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                @click="editSuggestionBeforeAdding"
              >Edit before adding</button>
              <button
                type="button"
                class="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                @click="dismissCompSuggestion"
              >Dismiss</button>
            </div>
          </section>
        </div>
      </details>

      <!-- Comparables -->
      <div class="space-y-2">
        <header class="flex items-center justify-between">
          <h5 class="text-xs font-semibold text-neutral-800">Comparable prices</h5>
          <button
            v-if="editingEnabled"
            type="button"
            class="text-xs text-phoenix-700 hover:underline"
            @click="addComparable"
          >+ Add comparable</button>
        </header>
        <p class="text-xs text-neutral-600">
          Real comparables from the team's research — name, price, source. Two or
          more are needed before the comp position chip can read the market.
        </p>
        <p
          v-if="(form.comparablePrices?.length ?? 0) === 0"
          class="text-xs italic text-neutral-500"
        >
          No comparable prices added yet. Add at least two so the builder can
          place this price against the market.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="c in form.comparablePrices"
            :key="c.id"
            class="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2"
          >
            <!-- V1.2 — provenance chips for rows created via the
                 Comp Source Assistant. Manual rows render no chip
                 here (the absence of a chip is the manual signal). -->
            <ul
              v-if="c.extractionMethod === 'pasted_text'"
              class="flex flex-wrap gap-1.5 text-[11px]"
            >
              <li class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 uppercase tracking-wide text-violet-800">
                Suggested from pasted text
              </li>
              <li
                v-if="c.extractionConfidence"
                class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 uppercase tracking-wide text-neutral-700"
              >Confidence · {{ c.extractionConfidence }}</li>
              <li
                v-if="c.reviewedByStudent"
                class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 uppercase tracking-wide text-emerald-800"
              >Student reviewed</li>
              <li
                v-else
                class="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 uppercase tracking-wide text-amber-800"
              >Awaiting review</li>
            </ul>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Name</span>
                <input
                  v-model="c.name"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Detroit-made premium sweatshirt"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Price ($)</span>
                <input
                  :value="c.price ?? ''"
                  :disabled="!editingEnabled"
                  type="number"
                  step="0.01"
                  min="0"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  @input="c.price = parseNumberInput(($event.target as HTMLInputElement).value); markDirty()"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Source / store</span>
                <input
                  v-model="c.source"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Pure Detroit retail observation"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Source name</span>
                <input
                  v-model="c.sourceName"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Shinola, Nordstrom, Detroit Pistons store…"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Product URL</span>
                <input
                  v-model="c.url"
                  :disabled="!editingEnabled"
                  type="url"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="https://example.com/product"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Source date</span>
                <input
                  v-model="c.sourceDate"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="2026-04 or April 2026"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Product type</span>
                <input
                  v-model="c.productType"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Sweatshirt, baked good, beanie…"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Quality tier</span>
                <input
                  v-model="c.qualityTier"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Premium streetwear, mass school apparel…"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Relevance</span>
                <select
                  v-model="c.relevance"
                  :disabled="!editingEnabled"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  @change="markDirty"
                >
                  <option value="">— Not set —</option>
                  <option value="low">Low — loose comparison</option>
                  <option value="medium">Medium — partial overlap</option>
                  <option value="high">High — strong comparable</option>
                </select>
              </label>
              <label class="text-xs">
                <span class="font-medium text-neutral-700">Alignment / lesson</span>
                <input
                  v-model="c.alignment"
                  :disabled="!editingEnabled"
                  type="text"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Detroit-made premium feel; older customer"
                  @input="markDirty"
                />
              </label>
              <label class="text-xs sm:col-span-2">
                <span class="font-medium text-neutral-700">What this comp proves</span>
                <textarea
                  v-model="c.proves"
                  :disabled="!editingEnabled"
                  rows="2"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="e.g. Detroit-made premium sweatshirts retail at $145 in regional stores."
                  @input="markDirty"
                />
              </label>
              <label class="text-xs sm:col-span-2">
                <span class="font-medium text-neutral-700">What this comp does <em>not</em> prove</span>
                <textarea
                  v-model="c.doesNotProve"
                  :disabled="!editingEnabled"
                  rows="2"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="e.g. Does not prove students or parents will accept that price for a Renaissance product."
                  @input="markDirty"
                />
              </label>
              <label class="text-xs sm:col-span-2">
                <span class="font-medium text-neutral-700">Notes</span>
                <textarea
                  v-model="c.notes"
                  :disabled="!editingEnabled"
                  rows="2"
                  class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-100"
                  placeholder="Anything else worth recording about this comp."
                  @input="markDirty"
                />
              </label>
              <!-- Safe URL preview. Render-only — never auto-fetched.
                   safeCompUrl drops anything that isn't http/https. -->
              <p
                v-if="safeCompUrl(c.url)"
                class="text-xs sm:col-span-2"
              >
                <a
                  :href="safeCompUrl(c.url) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-phoenix-700 hover:underline"
                >Open source ↗</a>
              </p>
            </div>
            <div v-if="editingEnabled" class="flex justify-end">
              <button
                type="button"
                class="text-xs text-rose-700 hover:underline"
                @click="removeComparable(c.id)"
              >Remove</button>
            </div>
          </li>
        </ul>
      </div>
    </fieldset>

    <!-- ============================================================
         Step 4 — Positioning + recommendation
         ============================================================ -->
    <fieldset v-if="activeStep === 4" class="space-y-3 rounded-md border border-neutral-200 bg-white p-3">
      <legend class="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Step 4 — Positioning &amp; recommendation
      </legend>

      <!-- Deterministic chips -->
      <ul class="flex flex-wrap gap-1.5 text-[11px]">
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="marginChipClass('healthy')"
        >Cost floor: ${{ formatMoney(derived.totalUnitCost) }}</li>
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="marginChipClass(marginInterp.band)"
        >Margin · {{ marginInterp.label }}</li>
        <li
          v-if="derived.grossMarginPct != null"
          class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 uppercase tracking-wide text-neutral-700"
        >Gross margin: {{ formatPct(derived.grossMarginPct) }}</li>
        <li
          v-if="derived.breakEvenUnits != null"
          class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 uppercase tracking-wide text-neutral-700"
        >Break-even: {{ formatUnits(derived.breakEvenUnits) }} units</li>
        <li
          v-if="derived.targetMarginPrice != null"
          class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 uppercase tracking-wide text-neutral-700"
        >Target-margin price: ${{ formatMoney(derived.targetMarginPrice) }}</li>
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="compChipClass(compPosition.band)"
        >Comp · {{ compPosition.label }}</li>
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="compEvidenceChipClass(compAnalysis.evidence.band)"
        >Comp evidence · {{ compAnalysis.evidence.label }}</li>
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="segmentChipClass(segmentInterp.band)"
        >Segment fit · {{ segmentInterp.label }}</li>
        <li
          class="rounded-full border px-2 py-0.5 uppercase tracking-wide"
          :class="evidenceChipClass(evidenceInterp.band)"
        >Evidence · {{ evidenceInterp.label }}</li>
      </ul>

      <!-- Detail lines for each chip -->
      <dl class="space-y-1 text-xs">
        <div>
          <dt class="font-medium text-neutral-700">Margin</dt>
          <dd class="text-neutral-700">{{ marginInterp.detail }}</dd>
        </div>
        <div>
          <dt class="font-medium text-neutral-700">Comp position</dt>
          <dd class="text-neutral-700">{{ compPosition.detail }}</dd>
        </div>
        <div>
          <dt class="font-medium text-neutral-700">Comp evidence</dt>
          <dd class="text-neutral-700">{{ compAnalysis.evidence.detail }}</dd>
        </div>
        <div v-if="compAnalysis.average != null">
          <dt class="font-medium text-neutral-700">Comp average</dt>
          <dd class="text-neutral-700">
            ${{ formatMoney(compAnalysis.average) }}
            <span v-if="compAnalysis.distanceFromAverage != null">
              · proposed price is
              <span :class="(compAnalysis.distanceFromAverage ?? 0) >= 0 ? 'text-sky-700 font-medium' : 'text-amber-700 font-medium'">
                ${{ formatMoney(Math.abs(compAnalysis.distanceFromAverage)) }}
                {{ (compAnalysis.distanceFromAverage ?? 0) >= 0 ? 'above' : 'below' }}
              </span>
              the average
            </span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-neutral-700">Segment fit</dt>
          <dd class="text-neutral-700">{{ segmentInterp.detail }}</dd>
        </div>
        <div>
          <dt class="font-medium text-neutral-700">Evidence</dt>
          <dd class="text-neutral-700">{{ evidenceInterp.detail }}</dd>
        </div>
      </dl>

      <!-- "What this means" composite analysis panel (V1.1).
           Deterministic — never invokes AI, never claims demand is
           proven, never approves the price. -->
      <section class="space-y-1 rounded-md border border-amber-200 bg-amber-50/50 p-2 text-xs">
        <h5 class="text-xs font-semibold text-amber-900">What this means</h5>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Cost:</span>
          {{ pricingAnalysis.costRead }}
        </p>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Margin:</span>
          {{ pricingAnalysis.marginRead }}
        </p>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Comps:</span>
          {{ pricingAnalysis.compRead }}
        </p>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Segment:</span>
          {{ pricingAnalysis.segmentRead }}
        </p>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Risk:</span>
          {{ pricingAnalysis.risk }}
        </p>
        <p class="text-neutral-800">
          <span class="font-medium text-neutral-700">Next validation:</span>
          {{ pricingAnalysis.nextValidation }}
        </p>
        <p class="italic text-amber-900">
          This is guidance for the team's pricing recommendation, not a
          final approval. The /pricing page remains the operational source
          of truth.
        </p>
      </section>

      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Confidence in this price</span>
          <select
            v-model="form.confidence"
            :disabled="!editingEnabled"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="opt in CONFIDENCE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Validation step</span>
          <input
            v-model="form.validationStep"
            :disabled="!editingEnabled"
            type="text"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm disabled:bg-neutral-50"
            placeholder="Run a 10-person preorder test at $100 before locking the price"
            @input="markDirty"
          />
        </label>
      </div>

      <!-- Copyable recommendation scaffold. Never auto-written into
           finalText — students copy it deliberately. -->
      <div class="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h5 class="text-xs font-semibold text-amber-900">
            Recommendation scaffold
          </h5>
          <div class="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              class="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-900 hover:bg-amber-100"
              @click="showRecommendationScaffold = !showRecommendationScaffold"
            >{{ showRecommendationScaffold ? 'Hide' : 'Show' }}</button>
            <button
              v-if="showRecommendationScaffold"
              type="button"
              class="rounded border border-amber-300 bg-white px-2 py-0.5 text-amber-900 hover:bg-amber-100"
              @click="copyScaffold"
            >Copy</button>
          </div>
        </div>
        <p class="text-[11px] italic text-amber-900">
          Copy this scaffold into your draft or final Playbook text when you're
          ready. Never auto-written — your final wording stays yours.
        </p>
        <p
          v-if="showRecommendationScaffold"
          class="whitespace-pre-wrap rounded border border-amber-200 bg-white p-2 text-xs text-neutral-800"
        >{{ recommendationScaffold }}</p>
      </div>
    </fieldset>

    <!-- ============================================================
         Read-only Ch. 7 context (always visible at the bottom)
         ============================================================ -->
    <details class="rounded-md border border-violet-200 bg-violet-50/40 p-2 text-xs">
      <summary class="cursor-pointer font-semibold text-violet-900">
        Read-only Chapter 7 context
      </summary>
      <div v-if="!ch7HasContent" class="mt-2 space-y-1 text-neutral-700">
        <p>No Chapter 7 market or comparable evidence is on file yet.</p>
        <p class="italic text-neutral-500">
          Add Ch. 7 market and comparable evidence to strengthen this pricing
          recommendation.
        </p>
      </div>
      <div v-else class="mt-2 space-y-2 text-neutral-800">
        <!-- Market Fit context -->
        <div v-if="props.ch7MarketFit" class="space-y-1">
          <p class="font-medium text-neutral-700">Chapter 7 — Market Fit</p>
          <p v-if="props.ch7MarketFit.productFacts?.productName">
            <span class="text-neutral-500">Product:</span>
            {{ props.ch7MarketFit.productFacts.productName }}
            <span v-if="props.ch7MarketFit.productFacts.price != null">
              · ${{ formatMoney(props.ch7MarketFit.productFacts.price) }}
            </span>
            <span v-if="props.ch7MarketFit.productFacts.qualityLevel">
              · {{ props.ch7MarketFit.productFacts.qualityLevel }}
            </span>
            <span v-if="props.ch7MarketFit.productFacts.madeInStory">
              · {{ props.ch7MarketFit.productFacts.madeInStory }}
            </span>
            <span v-if="props.ch7MarketFit.productFacts.channel">
              · channel: {{ props.ch7MarketFit.productFacts.channel }}
            </span>
          </p>
          <ul
            v-if="(props.ch7MarketFit.segments?.length ?? 0) > 0"
            class="ml-4 list-disc space-y-0.5"
          >
            <li v-for="seg in props.ch7MarketFit.segments" :key="`ps-ctx-seg-${seg.id}`">
              <span class="font-medium">{{ seg.name }}</span>
              <span v-if="seg.profile?.profileName">
                · {{ seg.profile.profileName }}
              </span>
              <span v-if="seg.priceFit"> · price fit: {{ seg.priceFit }}</span>
              <span v-if="seg.storyFit"> · story fit: {{ seg.storyFit }}</span>
              <span v-if="seg.willingnessToPay">
                · willingness: {{ seg.willingnessToPay }}
              </span>
              <span v-if="seg.evidenceStrength">
                · evidence: {{ seg.evidenceStrength }}
              </span>
              <span v-if="seg.roleInStrategy"> · role: {{ seg.roleInStrategy }}</span>
            </li>
          </ul>
          <ul
            v-if="(props.ch7MarketFit.comparables?.length ?? 0) > 0"
            class="ml-4 list-disc space-y-0.5"
          >
            <li v-for="c in props.ch7MarketFit.comparables" :key="`ps-ctx-cmp-${c.id}`">
              <span class="font-medium">{{ c.brandOrProduct }}</span>
              <span v-if="c.price != null"> · ${{ formatMoney(c.price) }}</span>
              <span v-if="c.compAlignment"> · {{ c.compAlignment }}</span>
              <span v-if="c.lessonForRenni"> · lesson: {{ c.lessonForRenni }}</span>
            </li>
          </ul>
          <p v-if="props.ch7MarketFit.recommendation?.likelyPrimaryMarket">
            <span class="text-neutral-500">Primary market:</span>
            {{ props.ch7MarketFit.recommendation.likelyPrimaryMarket }}
            <span v-if="props.ch7MarketFit.recommendation.likelySecondaryMarket">
              · secondary: {{ props.ch7MarketFit.recommendation.likelySecondaryMarket }}
            </span>
          </p>
          <p v-if="props.ch7MarketFit.recommendation?.positioningSummary">
            <span class="text-neutral-500">Positioning:</span>
            {{ props.ch7MarketFit.recommendation.positioningSummary }}
          </p>
          <p v-if="props.ch7MarketFit.recommendation?.weakestAssumption">
            <span class="text-neutral-500">Weakest assumption:</span>
            {{ props.ch7MarketFit.recommendation.weakestAssumption }}
          </p>
          <p v-if="props.ch7MarketFit.recommendation?.recommendedNextValidation">
            <span class="text-neutral-500">Next validation:</span>
            {{ props.ch7MarketFit.recommendation.recommendedNextValidation }}
          </p>
        </div>
        <!-- Market Builder demand context -->
        <div
          v-if="(props.ch7MarketEntries?.length ?? 0) > 0"
          class="space-y-1"
        >
          <p class="font-medium text-neutral-700">Chapter 7 — Demand entries</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li v-for="e in props.ch7MarketEntries" :key="`ps-ctx-mbe-${e.id}`">
              <span class="font-medium">{{ e.productName }}</span>
              <span v-if="e.primaryMarket"> · {{ e.primaryMarket }}</span>
              <span v-if="e.confidence"> · confidence: {{ e.confidence }}</span>
              <span v-if="e.strongestEvidence"> · {{ e.strongestEvidence }}</span>
            </li>
          </ul>
        </div>
        <p
          v-if="(compPosition.validCompCount ?? 0) < 2"
          class="italic text-neutral-500"
        >
          Add at least two comparable prices in Step 3 — comp position cannot be
          inferred from Chapter 7 alone.
        </p>
      </div>
    </details>

    <!-- ============================================================
         Save row
         ============================================================ -->
    <div class="flex flex-wrap items-center justify-end gap-2 text-xs">
      <p
        v-if="!editingEnabled"
        class="text-neutral-500"
      >Read-only in this status.</p>
      <p
        v-else-if="dirty"
        class="text-neutral-700"
      >Unsaved changes.</p>
      <p
        v-else-if="justSavedAt"
        class="text-neutral-500"
      >Saved.</p>
      <button
        v-if="editingEnabled"
        type="button"
        class="btn-primary text-xs"
        :disabled="!dirty || saving"
        @click="save"
      >{{ saving ? 'Saving…' : 'Save pricing strategy' }}</button>
    </div>
    <p v-if="saveError" class="text-xs text-rose-700">{{ saveError }}</p>
  </section>
</template>
