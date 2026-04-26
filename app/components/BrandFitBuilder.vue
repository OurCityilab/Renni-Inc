<script setup lang="ts">
// Brand Fit Builder V1 — section-level identity-vs-market-signal
// decision tool. Helps students argue that fonts, colors, logos,
// voice, references, and production methods *agree* with the price
// point and target customer the team is claiming.
//
// Posture (do not relax in V1):
//   - additive layer on the existing deliverableOutputs document
//   - never gates submit / never affects Playbook readiness
//   - read-only when the deliverable is in_review / approved
//   - explicit Save button writes the whole BrandFitBuilder object via
//     the composable; sibling fields (sourceNotes, draftText,
//     finalText, evidenceLinks, structuredEvidence,
//     marketBuilderEntries, marketFit) are untouched
//   - recommendation summary is deterministic — no AI
//
// Mirrors the MarketFitBuilder pattern: cloneFromInitial → reactive
// form → dirty guard → snapshot watcher → Save → composable.
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import type {
  BrandFitAlignment,
  BrandFitAudiencePerception,
  BrandFitBuilder,
  BrandFitFeedbackMethod,
  BrandFitIntent,
  BrandFitProductionCheck,
  BrandFitProductionUseCase,
  BrandFitQualityLevel,
  BrandFitRecommendation,
  BrandFitReferenceBrand,
  BrandFitRiskLevel,
  BrandFitRole,
  BrandFitValidationPlan,
  BrandFitVisualIdentity,
  BrandFitVoice,
  MarketFitBuilder
} from '~/types/models'
import {
  BRAND_LANGUAGE_TRANSLATIONS,
  BRAND_SIGNAL_CHIPS,
  buildBrandFitNextBestMove,
  buildBrandSignalSummary,
  buildReferenceBrandFeedback,
  buildSignalTradeoffNotes
} from '~/utils/brandFitNarrative'

const props = defineProps<{
  deliverableId: string
  sectionId: string
  sectionTitle: string
  // Pre-existing student-saved brand fit data, if any. Cloned into a
  // local reactive form so editing doesn't mutate the snapshot.
  initial: BrandFitBuilder | null
  editingEnabled: boolean
  // Optional studio-provided guidance string shown above the editor.
  guidance?: string | null
  // Optional Market Fit context from the same section. Used only as a
  // read-only callout — Brand Fit Builder works without it.
  marketFitContext?: MarketFitBuilder | null
}>()

const auth = useAuthStore()
const outputs = useDeliverableOutputs()

const QUALITY_LEVELS: Array<{ value: BrandFitQualityLevel; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'budget', label: 'Budget' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' }
]

const ROLE_OPTIONS: Array<{ value: BrandFitRole; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'parent', label: 'Parent (Renni Inc.)' },
  { value: 'apparel_goods', label: 'Apparel / goods (House Phoenix)' },
  { value: 'candles', label: 'Candles (Lumen)' },
  { value: 'jewelry', label: 'Jewelry (Notice)' },
  { value: 'baked_goods', label: 'Baked goods (Humble Oven)' },
  { value: 'other', label: 'Other / supporting' }
]

const ALIGNMENT_OPTIONS: Array<{ value: BrandFitAlignment; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'strong', label: 'Strong' },
  { value: 'partial', label: 'Partial' },
  { value: 'weak', label: 'Weak' },
  { value: 'unsure', label: 'Not sure' }
]

const RISK_LEVEL_OPTIONS: Array<{ value: BrandFitRiskLevel; label: string }> = [
  { value: '', label: '— Not set —' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

const PRODUCTION_USE_CASE_OPTIONS: Array<{
  value: BrandFitProductionUseCase
  label: string
}> = [
  { value: 'embroidery', label: 'Embroidery' },
  { value: 'screen_print', label: 'Screen print' },
  { value: 'patch', label: 'Patch' },
  { value: 'hang_tag', label: 'Hang tag' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'signage', label: 'Signage' },
  { value: 'social', label: 'Social' },
  { value: 'pitch_deck', label: 'Pitch deck' },
  { value: 'other', label: 'Other' }
]

const FEEDBACK_METHOD_OPTIONS: Array<{
  value: BrandFitFeedbackMethod
  label: string
}> = [
  { value: '', label: '— Not set —' },
  { value: 'survey', label: 'Survey' },
  { value: 'interview', label: 'Interview' },
  { value: 'side_by_side_test', label: 'Side-by-side test (e.g. 3 logo variants)' },
  { value: 'social_poll', label: 'Social poll' },
  { value: 'retail_observation', label: 'Retail observation' },
  { value: 'custom', label: 'Custom' }
]

// --- helpers --------------------------------------------------------
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bfb-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

function blankBrandIntent(): BrandFitIntent {
  return {
    brandName: '',
    brandRole: '',
    targetCustomer: '',
    targetProfileName: '',
    pricePoint: '',
    qualityLevel: '',
    targetFeeling: '',
    brandPromise: '',
    primaryChannel: '',
    notes: ''
  }
}

function blankVisualIdentity(): BrandFitVisualIdentity {
  return {
    colorPalette: '',
    colorSignal: '',
    fontDirection: '',
    fontSignal: '',
    logoStyle: '',
    logoSignal: '',
    iconSymbolDirection: '',
    photographyMood: '',
    packagingDisplayDirection: '',
    designAdjectives: '',
    stylesToAvoid: ''
  }
}

function blankVoice(): BrandFitVoice {
  return {
    toneWords: '',
    vocabulary: '',
    phrasesToUse: '',
    phrasesToAvoid: '',
    whatBrandNeverSays: '',
    storyAlignmentNotes: ''
  }
}

function blankReferenceBrand(): BrandFitReferenceBrand {
  return {
    id: genId(),
    brandOrExample: '',
    whatWeLike: '',
    likelyCustomer: '',
    priceQualitySignal: '',
    visualSignal: '',
    voiceSignal: '',
    whatNotToCopy: '',
    lessonForRenni: '',
    source: '',
    alignment: ''
  }
}

function blankAudiencePerception(): BrandFitAudiencePerception {
  return {
    whoItAttracts: '',
    whoItMayTurnAway: '',
    perceivedPrice: '',
    perceivedQuality: '',
    perceivedAgeRange: '',
    perceivedIncomeContext: '',
    urbanSuburbanSignal: '',
    schoolMerchVsPremiumSignal: '',
    targetMatch: '',
    mismatchRisk: ''
  }
}

function blankProductionCheck(
  useCase: BrandFitProductionUseCase = 'embroidery'
): BrandFitProductionCheck {
  return {
    id: genId(),
    useCase,
    concern: '',
    riskLevel: '',
    adjustment: ''
  }
}

function blankValidationPlan(): BrandFitValidationPlan {
  return {
    testAudience: '',
    questionToAnswer: '',
    feedbackMethod: '',
    sampleSizeGoal: null,
    whatToRecord: '',
    successSignal: '',
    nextStep: ''
  }
}

function blankRecommendation(): BrandFitRecommendation {
  return {
    brandSignalSummary: '',
    strongestAlignment: '',
    weakestMismatch: '',
    recommendedAdjustment: '',
    validationStep: ''
  }
}

interface Form {
  brandIntent: BrandFitIntent
  visualIdentity: BrandFitVisualIdentity
  voice: BrandFitVoice
  referenceBrands: BrandFitReferenceBrand[]
  audiencePerception: BrandFitAudiencePerception
  productionChecks: BrandFitProductionCheck[]
  validationPlan: BrandFitValidationPlan
  recommendation: BrandFitRecommendation
  // Signal chips render at the top of the editor and feed the
  // deterministic summary. Saved as a string array so future authors
  // can ship additional chips without breaking old data.
  brandSignals: string[]
}

function cloneFromInitial(src: BrandFitBuilder | null): Form {
  return {
    brandIntent: { ...blankBrandIntent(), ...(src?.brandIntent ?? {}) },
    visualIdentity: { ...blankVisualIdentity(), ...(src?.visualIdentity ?? {}) },
    voice: { ...blankVoice(), ...(src?.voice ?? {}) },
    referenceBrands: (src?.referenceBrands ?? []).map((r) => ({
      ...blankReferenceBrand(),
      ...r
    })),
    audiencePerception: {
      ...blankAudiencePerception(),
      ...(src?.audiencePerception ?? {})
    },
    productionChecks: (src?.productionChecks ?? []).map((c) => ({
      ...blankProductionCheck(),
      ...c
    })),
    validationPlan: {
      ...blankValidationPlan(),
      ...(src?.validationPlan ?? {})
    },
    recommendation: {
      ...blankRecommendation(),
      ...(src?.recommendation ?? {})
    },
    // Defensive copy + filter so any stray non-strings don't reach
    // the editor.
    brandSignals: Array.isArray(src?.brandSignals)
      ? src!.brandSignals.filter((s): s is string => typeof s === 'string')
      : []
  }
}

const form = reactive<Form>(cloneFromInitial(props.initial))
const dirty = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)

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

// --- list management ------------------------------------------------
function addReferenceBrand() {
  if (!props.editingEnabled) return
  form.referenceBrands.push(blankReferenceBrand())
  markDirty()
}
function removeReferenceBrand(id: string) {
  if (!props.editingEnabled) return
  form.referenceBrands = form.referenceBrands.filter((r) => r.id !== id)
  markDirty()
}
function addProductionCheck(useCase: BrandFitProductionUseCase = 'embroidery') {
  if (!props.editingEnabled) return
  form.productionChecks.push(blankProductionCheck(useCase))
  markDirty()
}
function removeProductionCheck(id: string) {
  if (!props.editingEnabled) return
  form.productionChecks = form.productionChecks.filter((c) => c.id !== id)
  markDirty()
}

// Cast the editable form into a BrandFitBuilder shape for the
// shared narrative helper.
function asFitForUtil(): BrandFitBuilder {
  return {
    brandIntent: form.brandIntent,
    visualIdentity: form.visualIdentity,
    voice: form.voice,
    referenceBrands: form.referenceBrands,
    audiencePerception: form.audiencePerception,
    productionChecks: form.productionChecks,
    validationPlan: form.validationPlan,
    recommendation: form.recommendation,
    brandSignals: form.brandSignals
  }
}

const generatedSummary = computed<string>(() =>
  buildBrandSignalSummary(asFitForUtil())
)
const generatedNextBestMove = computed<string>(() =>
  buildBrandFitNextBestMove(asFitForUtil())
)
const selectedSignalNotes = computed(() =>
  buildSignalTradeoffNotes(form.brandSignals)
)

// --- signal chip toggles -------------------------------------------
function isSignalSelected(signal: string): boolean {
  const lc = signal.toLowerCase()
  return form.brandSignals.some((s) => s.toLowerCase() === lc)
}
function toggleSignal(signal: string) {
  if (!props.editingEnabled) return
  const idx = form.brandSignals.findIndex(
    (s) => s.toLowerCase() === signal.toLowerCase()
  )
  if (idx >= 0) {
    form.brandSignals.splice(idx, 1)
  } else {
    form.brandSignals.push(signal)
  }
  markDirty()
}

// --- per-section progress cues -------------------------------------
type SectionStatus = 'not_started' | 'started' | 'needs_evidence' | 'ready_to_test' | 'ready_for_playbook'
const STATUS_LABELS: Record<SectionStatus, string> = {
  not_started: 'Not started',
  started: 'Started',
  needs_evidence: 'Needs evidence',
  ready_to_test: 'Ready to test',
  ready_for_playbook: 'Ready for Playbook draft'
}
const STATUS_TONE: Record<SectionStatus, string> = {
  not_started: 'border-neutral-300 bg-neutral-50 text-neutral-600',
  started: 'border-sky-300 bg-sky-50 text-sky-800',
  needs_evidence: 'border-amber-300 bg-amber-50 text-amber-800',
  ready_to_test: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  ready_for_playbook: 'border-emerald-400 bg-emerald-100 text-emerald-900'
}
function statusBadgeClass(status: SectionStatus): string {
  return `rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_TONE[status]}`
}
function hasText(...vals: Array<string | undefined | null>): boolean {
  return vals.some((v) => typeof v === 'string' && v.trim() !== '')
}

const sectionStatus = computed<Record<string, SectionStatus>>(() => {
  const intent = form.brandIntent
  const visual = form.visualIdentity
  const voice = form.voice
  const refs = form.referenceBrands
  const perception = form.audiencePerception
  const checks = form.productionChecks
  const validation = form.validationPlan
  const signals = form.brandSignals

  const intentStarted =
    hasText(intent.brandName, intent.targetCustomer, intent.targetFeeling, intent.brandPromise) ||
    Boolean(intent.qualityLevel) ||
    Boolean(intent.brandRole)
  const visualStarted =
    hasText(
      visual.colorPalette,
      visual.fontDirection,
      visual.logoStyle,
      visual.designAdjectives,
      visual.colorSignal,
      visual.fontSignal,
      visual.logoSignal,
      visual.iconSymbolDirection,
      visual.photographyMood,
      visual.packagingDisplayDirection,
      visual.stylesToAvoid
    ) || signals.length > 0
  const voiceStarted = hasText(
    voice.toneWords,
    voice.vocabulary,
    voice.phrasesToUse,
    voice.phrasesToAvoid,
    voice.whatBrandNeverSays,
    voice.storyAlignmentNotes
  )
  const referencesStarted = refs.length > 0
  const perceptionStarted =
    hasText(perception.whoItAttracts, perception.whoItMayTurnAway, perception.perceivedPrice, perception.perceivedQuality, perception.mismatchRisk) ||
    Boolean(perception.targetMatch)
  const productionStarted = checks.length > 0
  const validationStarted = hasText(
    validation.testAudience,
    validation.questionToAnswer,
    validation.whatToRecord,
    validation.successSignal,
    validation.nextStep
  )
  const validationReadyToTest =
    hasText(validation.testAudience) &&
    (hasText(validation.questionToAnswer) || hasText(validation.nextStep))

  return {
    intent: intentStarted ? 'started' : 'not_started',
    visual: visualStarted ? 'started' : 'not_started',
    voice: voiceStarted ? 'started' : 'not_started',
    references: referencesStarted ? 'started' : 'not_started',
    perception: perceptionStarted ? 'started' : 'not_started',
    production: productionStarted ? 'started' : 'not_started',
    validation: validationReadyToTest
      ? 'ready_to_test'
      : validationStarted
        ? 'started'
        : 'not_started'
  }
})

// Market Fit context surfaced as a small read-only callout. Pulls the
// selected segment's profile name when present so Brand Fit can be
// validated against the Market Fit target.
const marketFitTargetProfile = computed<string | null>(() => {
  const fit = props.marketFitContext
  if (!fit) return null
  const selectedId = fit.scenarioAssumptions?.selectedSegmentId
  if (!selectedId) return null
  const seg = (fit.segments ?? []).find((s) => s.id === selectedId)
  if (!seg) return null
  return seg.profile?.profileName?.trim() || seg.name?.trim() || null
})
const marketFitTargetCustomer = computed<string | null>(() => {
  const fit = props.marketFitContext
  return fit?.recommendation?.likelyPrimaryMarket?.trim() || null
})

// --- numeric validation --------------------------------------------
function validateBeforeSave(): string | null {
  const goal = form.validationPlan.sampleSizeGoal
  if (goal != null) {
    if (!Number.isFinite(goal)) {
      return 'Validation sample size goal must be a valid number.'
    }
    if (goal < 0) return 'Validation sample size goal cannot be negative.'
  }
  return null
}

// --- save ----------------------------------------------------------
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
    const payload: BrandFitBuilder = {
      brandIntent: { ...form.brandIntent },
      visualIdentity: { ...form.visualIdentity },
      voice: { ...form.voice },
      referenceBrands: form.referenceBrands.map((r) => ({ ...r })),
      audiencePerception: { ...form.audiencePerception },
      productionChecks: form.productionChecks.map((c) => ({ ...c })),
      validationPlan: { ...form.validationPlan },
      recommendation: { ...form.recommendation },
      brandSignals: [...form.brandSignals]
    }
    await outputs.saveBrandFitBuilder(
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
  <section class="space-y-3 rounded-md border border-rose-200 bg-rose-50/40 p-3">
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Brand Fit Builder
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        Check whether identity choices send the right market signals
      </h4>
      <p class="text-xs text-neutral-600">
        {{
          guidance ||
          'Brand identity is not decoration. Colors, fonts, logos, packaging, voice, and production methods all signal who the brand is for and what the price should feel like. This panel helps argue that your identity matches the customer and the price you say you are targeting.'
        }}
      </p>
    </header>

    <!-- Start Here card. Compact set of orienting prompts so the
         builder doesn't read as a long form on first open. -->
    <section class="rounded-md border border-rose-300 bg-white p-3 text-xs text-neutral-800">
      <p class="text-xs font-semibold uppercase tracking-wide text-rose-700">
        Start here
      </p>
      <p class="mt-1">
        Brand Fit helps you check whether the brand looks, sounds, and feels right for the customer and price point you are claiming. Answer these as you go — the rest of the panel just helps you argue your case in detail.
      </p>
      <ol class="mt-2 list-decimal space-y-0.5 pl-5">
        <li>What are we selling or presenting?</li>
        <li>Who should this brand attract?</li>
        <li>What should it feel like?</li>
        <li>What price or quality level does it need to support?</li>
        <li>What needs to be tested before finalizing?</li>
      </ol>
    </section>

    <!-- Optional Market Fit cross-link. Read-only callout when the
         section already has a Market Fit selected segment / profile. -->
    <p
      v-if="marketFitTargetProfile || marketFitTargetCustomer"
      class="rounded-md border border-violet-200 bg-violet-50/60 p-2 text-xs text-neutral-800"
    >
      <span class="font-medium text-neutral-600">Market Fit context:</span>
      <span v-if="marketFitTargetProfile">
        target profile is <strong>{{ marketFitTargetProfile }}</strong>.
      </span>
      <span v-if="marketFitTargetCustomer">
        Likely primary market: {{ marketFitTargetCustomer }}.
      </span>
      Use this to check whether the brand identity signals the same customer.
    </p>

    <!-- Signal chips. Quick-add palette + tradeoff notes for each
         selected signal so students learn what each chip implies. -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Brand signals
        <span :class="statusBadgeClass(form.brandSignals.length ? 'started' : 'not_started')">
          {{ STATUS_LABELS[form.brandSignals.length ? 'started' : 'not_started'] }}
        </span>
      </legend>
      <p class="text-xs text-neutral-600">
        Pick the signals this brand should send. Each signal has a tradeoff — selecting one will surface a short coach note explaining what it supports and what it costs.
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="chip in BRAND_SIGNAL_CHIPS"
          :key="chip"
          type="button"
          :disabled="!editingEnabled"
          :class="[
            'rounded-full border px-2 py-0.5 text-xs',
            isSignalSelected(chip)
              ? 'border-rose-400 bg-rose-100 text-rose-900'
              : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100',
            !editingEnabled ? 'opacity-50' : ''
          ]"
          @click="toggleSignal(chip)"
        >{{ chip }}</button>
      </div>
      <ul
        v-if="selectedSignalNotes.length"
        class="mt-1 space-y-1"
      >
        <li
          v-for="(n, i) in selectedSignalNotes"
          :key="`signal-note-${i}`"
          class="rounded-md border border-rose-200 bg-rose-50/60 p-2 text-xs text-neutral-800"
        >
          <span class="font-medium text-rose-800">{{ n.signal }}:</span>
          {{ n.note }}
        </li>
      </ul>
    </fieldset>

    <!-- Brand intent -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Brand intent
        <span :class="statusBadgeClass(sectionStatus.intent)">
          {{ STATUS_LABELS[sectionStatus.intent] }}
        </span>
      </legend>
      <p class="text-xs text-neutral-600">
        Brand choices send signals. A premium price, local-made story, or mature customer profile should be supported by fonts, colors, logo style, voice, and production choices that feel credible to that buyer.
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Brand name
          <input
            v-model="form.brandIntent.brandName"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="House Phoenix, Lumen, Notice, Humble Oven, Renni Inc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Brand role
          <select
            v-model="form.brandIntent.brandRole"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Target customer
          <input
            v-model="form.brandIntent.targetCustomer"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Detroit-supporting adult, Renaissance student, alumni gift buyer…"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Target profile name
          <input
            v-model="form.brandIntent.targetProfileName"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Civic Premium Buyer, Proud Parent Supporter, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Price point
          <input
            v-model="form.brandIntent.pricePoint"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="$25, $100, $40 wholesale, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Quality level
          <select
            v-model="form.brandIntent.qualityLevel"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="q in QUALITY_LEVELS" :key="q.value" :value="q.value">{{ q.label }}</option>
          </select>
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Target feeling
          <input
            v-model="form.brandIntent.targetFeeling"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What should the customer feel? (proud, civic, premium, school-spirited…)"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Brand promise
          <textarea
            v-model="form.brandIntent.brandPromise"
            rows="2"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What is the brand promising? Be specific."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Primary channel
          <input
            v-model="form.brandIntent.primaryChannel"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="TechTown pop-up, Phoenix Nest carry, online drop, gift event"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Notes
          <input
            v-model="form.brandIntent.notes"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Visual identity -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Visual identity
        <span :class="statusBadgeClass(sectionStatus.visual)">
          {{ STATUS_LABELS[sectionStatus.visual] }}
        </span>
      </legend>
      <ul class="list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
        <li>Bright school colors can improve school recognition but may limit broader premium appeal.</li>
        <li>Muted neutrals can feel premium and wearable but may reduce school-spirit visibility.</li>
        <li>A complex logo can tell more story but may fail on embroidery, patches, or small labels.</li>
        <li>A simple icon scales better but needs stronger supporting story.</li>
        <li>A gothic or varsity font may signal heritage and school energy but can feel generic or too niche.</li>
        <li>A refined serif or minimal sans serif may signal premium quality but may feel too quiet for some student audiences.</li>
      </ul>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Color palette
          <input
            v-model="form.visualIdentity.colorPalette"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="e.g. cream, terracotta, slate"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          What the colors signal
          <input
            v-model="form.visualIdentity.colorSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Premium / civic / school-spirit / gift-ready"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Font direction
          <input
            v-model="form.visualIdentity.fontDirection"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Refined serif, modern sans, varsity, gothic, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          What the font signals
          <input
            v-model="form.visualIdentity.fontSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Heritage, tradition, energy, modern retail polish, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Logo style
          <input
            v-model="form.visualIdentity.logoStyle"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Wordmark, monogram, illustrative phoenix, geometric, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          What the logo signals
          <input
            v-model="form.visualIdentity.logoSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Bold / refined / playful / civic / handmade"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Icon / symbol direction
          <input
            v-model="form.visualIdentity.iconSymbolDirection"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What secondary mark or symbol supports the logo?"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Photography / mood
          <input
            v-model="form.visualIdentity.photographyMood"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Editorial daylight, on-figure, street, studio, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Packaging / display direction
          <input
            v-model="form.visualIdentity.packagingDisplayDirection"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Hang tag, sticker pack, kraft paper, retail box, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Design adjectives
          <input
            v-model="form.visualIdentity.designAdjectives"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Three to five adjectives that describe the visual feel"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Styles to avoid
          <input
            v-model="form.visualIdentity.stylesToAvoid"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What kinds of fonts, colors, or design moves are off-brand?"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Voice -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Voice
        <span :class="statusBadgeClass(sectionStatus.voice)">
          {{ STATUS_LABELS[sectionStatus.voice] }}
        </span>
      </legend>
      <p class="text-xs text-neutral-600">
        Voice should match the customer and the price point. Premium brands usually need restraint, clarity, and confidence. Student-facing campaigns may need more energy, immediacy, or cultural relevance.
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Tone words
          <input
            v-model="form.voice.toneWords"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Three to five words: confident, warm, civic…"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Vocabulary
          <input
            v-model="form.voice.vocabulary"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Words and references the brand uses"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Phrases to use
          <textarea
            v-model="form.voice.phrasesToUse"
            rows="2"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Tag lines, headers, captions in this brand's voice"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Phrases to avoid
          <textarea
            v-model="form.voice.phrasesToAvoid"
            rows="2"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Wording that breaks the voice"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          What the brand never says
          <input
            v-model="form.voice.whatBrandNeverSays"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Hard rules about voice"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Story alignment notes
          <input
            v-model="form.voice.storyAlignmentNotes"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="How does the voice align with the House Phoenix / Renni Inc. story?"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Reference brands -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Reference brand board
        <span :class="statusBadgeClass(sectionStatus.references)">
          {{ STATUS_LABELS[sectionStatus.references] }}
        </span>
      </legend>
      <p class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-neutral-800">
        Use references to learn signals, not to copy. Name what you are learning and what you will avoid copying.
      </p>
      <button
        v-if="editingEnabled"
        type="button"
        class="text-xs text-rose-700 hover:underline"
        @click="addReferenceBrand"
      >+ Add reference</button>
      <p
        v-if="form.referenceBrands.length === 0"
        class="text-xs italic text-neutral-500"
      >No references yet. Add at least two so the team can compare brand signals.</p>
      <ul class="space-y-2">
        <li
          v-for="ref in form.referenceBrands"
          :key="ref.id"
          class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-sm"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <input
              v-model="ref.brandOrExample"
              type="text"
              :disabled="!editingEnabled"
              class="rounded border border-neutral-300 p-1 text-sm font-medium disabled:bg-neutral-100"
              placeholder="Brand or example"
              @input="markDirty"
            />
            <button
              v-if="editingEnabled"
              type="button"
              class="text-xs text-rose-700 hover:underline"
              @click="removeReferenceBrand(ref.id)"
            >Remove</button>
          </div>
          <div class="mt-1 grid gap-2 sm:grid-cols-2">
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              What we like
              <input
                v-model="ref.whatWeLike"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Likely customer
              <input
                v-model="ref.likelyCustomer"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Price / quality signal
              <input
                v-model="ref.priceQualitySignal"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Visual signal
              <input
                v-model="ref.visualSignal"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Voice signal
              <input
                v-model="ref.voiceSignal"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              What not to copy
              <input
                v-model="ref.whatNotToCopy"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
              Lesson for Renni
              <input
                v-model="ref.lessonForRenni"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Source
              <input
                v-model="ref.source"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @input="markDirty"
              />
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Alignment
              <select
                v-model="ref.alignment"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in ALIGNMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </label>
          </div>
          <p
            v-if="buildReferenceBrandFeedback(ref)"
            class="mt-1 rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-800"
          >
            <span class="font-medium text-neutral-600">Coach feedback:</span>
            {{ buildReferenceBrandFeedback(ref)?.message }}
          </p>
        </li>
      </ul>
    </fieldset>

    <!-- Audience perception -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Audience perception check
        <span :class="statusBadgeClass(sectionStatus.perception)">
          {{ STATUS_LABELS[sectionStatus.perception] }}
        </span>
      </legend>
      <p class="text-xs text-neutral-600">
        Ask: What does this brand look like it costs? Who does it look like it is for? Does that match who we say we are targeting?
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Who it attracts
          <input
            v-model="form.audiencePerception.whoItAttracts"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Who it may turn away
          <input
            v-model="form.audiencePerception.whoItMayTurnAway"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Perceived price
          <input
            v-model="form.audiencePerception.perceivedPrice"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Low, mid, high; or a $ range"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Perceived quality
          <input
            v-model="form.audiencePerception.perceivedQuality"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Perceived age range
          <input
            v-model="form.audiencePerception.perceivedAgeRange"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Perceived income context
          <input
            v-model="form.audiencePerception.perceivedIncomeContext"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Urban / suburban signal
          <input
            v-model="form.audiencePerception.urbanSuburbanSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          School merch vs premium signal
          <input
            v-model="form.audiencePerception.schoolMerchVsPremiumSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Reads as school merch, premium local apparel, gift product, etc."
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Target match
          <select
            v-model="form.audiencePerception.targetMatch"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="o in ALIGNMENT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Mismatch risk
          <input
            v-model="form.audiencePerception.mismatchRisk"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What about the brand might pull the wrong audience?"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Production checks -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Production and accessibility checks
        <span :class="statusBadgeClass(sectionStatus.production)">
          {{ STATUS_LABELS[sectionStatus.production] }}
        </span>
      </legend>
      <p class="text-xs text-neutral-600">
        A logo that works on screen may fail on fabric, packaging, or signage. Thin lines, tiny text, low contrast, and too many colors can weaken production quality.
      </p>
      <div v-if="editingEnabled" class="flex flex-wrap gap-1.5">
        <button
          v-for="o in PRODUCTION_USE_CASE_OPTIONS"
          :key="o.value"
          type="button"
          class="rounded border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-100"
          @click="addProductionCheck(o.value)"
        >+ {{ o.label }}</button>
      </div>
      <p
        v-if="form.productionChecks.length === 0"
        class="text-xs italic text-neutral-500"
      >No production checks yet. Add the surfaces this identity actually has to live on.</p>
      <ul class="space-y-2">
        <li
          v-for="check in form.productionChecks"
          :key="check.id"
          class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-sm"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <select
              v-model="check.useCase"
              :disabled="!editingEnabled"
              class="rounded border border-neutral-300 p-1 text-sm disabled:bg-neutral-100"
              @change="markDirty"
            >
              <option v-for="o in PRODUCTION_USE_CASE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <button
              v-if="editingEnabled"
              type="button"
              class="text-xs text-rose-700 hover:underline"
              @click="removeProductionCheck(check.id)"
            >Remove</button>
          </div>
          <label class="mt-1 block text-xs font-medium text-neutral-800">
            Concern
            <input
              v-model="check.concern"
              type="text"
              :disabled="!editingEnabled"
              class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
              placeholder="What might break or look weak?"
              @input="markDirty"
            />
          </label>
          <div class="mt-1 grid gap-2 sm:grid-cols-2">
            <label class="block text-xs font-medium text-neutral-800">
              Risk level
              <select
                v-model="check.riskLevel"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                @change="markDirty"
              >
                <option v-for="o in RISK_LEVEL_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </label>
            <label class="block text-xs font-medium text-neutral-800">
              Adjustment
              <input
                v-model="check.adjustment"
                type="text"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-100"
                placeholder="What change would reduce the risk?"
                @input="markDirty"
              />
            </label>
          </div>
        </li>
      </ul>
    </fieldset>

    <!-- Validation plan -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Validation plan
        <span :class="statusBadgeClass(sectionStatus.validation)">
          {{ STATUS_LABELS[sectionStatus.validation] }}
        </span>
      </legend>
      <ul class="list-disc space-y-0.5 pl-5 text-xs text-neutral-700">
        <li>Show 3 logo options to 15 students and 5 adults.</li>
        <li>Ask which feels most premium.</li>
        <li>Ask which they would wear or buy.</li>
        <li>Ask what price they think it should cost.</li>
        <li>Ask what kind of person they think the brand is for.</li>
        <li>Compare responses to the intended target customer.</li>
      </ul>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Test audience
          <input
            v-model="form.validationPlan.testAudience"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Question to answer
          <input
            v-model="form.validationPlan.questionToAnswer"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Which logo / palette / voice feels most credible to the target?"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Feedback method
          <select
            v-model="form.validationPlan.feedbackMethod"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @change="markDirty"
          >
            <option v-for="o in FEEDBACK_METHOD_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Sample size goal
          <input
            :value="form.validationPlan.sampleSizeGoal ?? ''"
            type="number"
            min="0"
            step="1"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="20"
            @input="(event) => { setNumber(form.validationPlan, 'sampleSizeGoal', (event.target as HTMLInputElement).value); markDirty() }"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          What to record
          <input
            v-model="form.validationPlan.whatToRecord"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Success signal
          <input
            v-model="form.validationPlan.successSignal"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What result counts as confirmation?"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Next step
          <input
            v-model="form.validationPlan.nextStep"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            @input="markDirty"
          />
        </label>
      </div>
    </fieldset>

    <!-- Student-to-professional language translator. Read-only
         reference table — students can scan the column and copy the
         professional phrasing into the recommendation fields. The
         table is intentionally simple so it does not become a save
         path. -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Language translator (student → Playbook)
      </legend>
      <p class="text-xs text-neutral-600">
        Use this when an instinctive phrase needs to become Playbook-ready language. Copy the right column into the recommendation or final Playbook text — no need to fight for words.
      </p>
      <table class="min-w-full text-xs">
        <thead>
          <tr class="text-left text-neutral-500">
            <th class="py-1 pr-2 font-medium">Student phrase</th>
            <th class="py-1 pr-2 font-medium">Professional / Playbook</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(t, i) in BRAND_LANGUAGE_TRANSLATIONS"
            :key="`lang-${i}`"
            class="align-top"
          >
            <td class="py-0.5 pr-2 italic text-neutral-700">"{{ t.studentPhrase }}"</td>
            <td class="py-0.5 pr-2 text-neutral-800">{{ t.professional }}</td>
          </tr>
        </tbody>
      </table>
    </fieldset>

    <!-- Good / better / best brand statement example. Static block —
         shows students the kind of language the recommendation block
         can produce when the inputs are filled in. -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Good / better / best brand statement
      </legend>
      <div class="space-y-1.5 text-xs text-neutral-800">
        <p>
          <span class="rounded-full border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
            Good
          </span>
          <span class="ml-1">House Phoenix feels premium.</span>
        </p>
        <p>
          <span class="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-800">
            Better
          </span>
          <span class="ml-1">House Phoenix feels premium because the logo, colors, and voice are restrained and mature.</span>
        </p>
        <p>
          <span class="rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-800">
            Best
          </span>
          <span class="ml-1">House Phoenix is positioned as premium civic apparel. The restrained palette, architectural phoenix, and Detroit-made story support a higher price point and may appeal to adults, alumni, staff, and Detroit supporters, while students may be better treated as an awareness and validation market until willingness-to-pay is proven.</span>
        </p>
      </div>
    </fieldset>

    <!-- Recommendation summary -->
    <fieldset class="space-y-2 rounded-md border border-neutral-200 bg-white p-2">
      <legend class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Recommendation
      </legend>
      <p class="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-neutral-800">
        <span class="font-medium">Auto-summary (deterministic, no AI):</span>
        {{ generatedSummary }}
      </p>
      <p class="rounded-md border border-emerald-300 bg-emerald-50 p-2 text-xs text-neutral-800">
        <span class="font-medium text-emerald-800">Next best move:</span>
        {{ generatedNextBestMove }}
      </p>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block text-xs font-medium text-neutral-800">
          Brand signal summary
          <input
            v-model="form.recommendation.brandSignalSummary"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="One sentence: what does this brand look like it stands for?"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Strongest alignment
          <input
            v-model="form.recommendation.strongestAlignment"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Where the identity matches the customer best"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800">
          Weakest mismatch
          <input
            v-model="form.recommendation.weakestMismatch"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="Where the identity does not match yet"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Recommended adjustment
          <textarea
            v-model="form.recommendation.recommendedAdjustment"
            rows="2"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="What specific change moves the brand closer to fit?"
            @input="markDirty"
          />
        </label>
        <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
          Validation step
          <input
            v-model="form.recommendation.validationStep"
            type="text"
            :disabled="!editingEnabled"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
            placeholder="How does the team test this before finalizing?"
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
        {{ saving ? 'Saving…' : 'Save Brand Fit Builder' }}
      </button>
    </div>
  </section>
</template>
