<!--
  Customer Profile Builder (Beta) — V1 UI for Layer 1 + Layer 2.

  PURPOSE
  -------
  Lets a student compose ONE customer profile from the V1 primitive
  model and view the deterministic classifier explanation. No AI, no
  Firestore, no auto-save, no Working-Draft mutation. The Copy Draft
  Starter button is clipboard-only. State is local to the component.

  WIRING
  ------
  Mounted by DeliverableOutputWorkspace.vue ONLY when:
    1. runtimeConfig.public.customerProfileBuilderEnabled === true
    2. The active section id is `customer-segments`
  Both gates are checked at the parent level; this component itself
  assumes the host already validated the conditions.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + classifier call. No Firestore, no AI, no network.
    - Local component state. No persistence in V1.
    - Never overwrites Working Draft. Copy Draft Starter always
      writes to clipboard.
    - Numeric scores are NEVER shown to students. The teacher debug
      panel is gated by `isChief` and is collapsed by default.
    - Stereotype guardrail and PRIZM-inspired disclaimer are visible
      and prominent.
-->
<template>
  <section
    class="rounded-lg border border-amber-300 bg-amber-50/30 p-4 text-sm shadow-sm"
    aria-labelledby="cpb-beta-heading"
  >
    <header class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3
        id="cpb-beta-heading"
        class="text-base font-semibold text-amber-900"
      >
        Try the Customer Profile Builder
        <span
          class="ml-2 inline-flex items-center rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
        >
          Beta
        </span>
      </h3>
      <p class="text-xs text-amber-800">
        Use this to build a more detailed customer profile. Your current
        QuickStart still works.
      </p>
    </header>

    <!-- Required PRIZM/ESRI disclaimer -->
    <p
      class="mb-2 rounded border border-amber-200 bg-white/60 p-2 text-xs text-amber-900"
    >
      This is a PRIZM-inspired / ESRI-inspired learning tool. It helps you
      reason about customer patterns, but it is not actual PRIZM or ESRI
      segmentation.
    </p>

    <!-- Required stereotype guardrail -->
    <p
      class="mb-4 rounded border border-amber-200 bg-white/60 p-2 text-xs text-amber-900"
    >
      <strong>Stereotype guardrail:</strong> Store choices are clues, not
      proof. Do not assume someone's income, values, race, politics, or
      identity from one store or one behavior.
    </p>

    <!-- ===== Primitive form ===== -->
    <div class="space-y-4">
      <fieldset
        v-for="axis in renderableAxes"
        :key="axis.id"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <legend class="px-1 text-sm font-semibold text-stone-900">
          {{ axis.label }}
          <span v-if="!axis.required" class="text-xs font-normal text-stone-500"
            >(optional)</span
          >
        </legend>
        <p class="mb-2 text-xs text-stone-700">{{ axis.studentPrompt }}</p>

        <!-- Single-select (radios) for non-motivation axes -->
        <div
          v-if="
            axis.inputType === 'single-select' &&
            axis.id !== 'purchase-motivation'
          "
          class="space-y-1"
        >
          <label
            v-for="opt in axis.options ?? []"
            :key="opt.id"
            class="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-stone-50"
          >
            <input
              type="radio"
              :name="`cpb-${axis.id}`"
              :value="opt.id"
              :checked="singleSelectValue(axis.id) === opt.id"
              class="mt-1"
              @change="setSingleSelect(axis.id, opt.id)"
            />
            <span class="text-xs">
              <span class="font-medium text-stone-800">{{ opt.label }}</span>
              <span v-if="opt.helperText" class="block text-stone-500">{{
                opt.helperText
              }}</span>
            </span>
          </label>
        </div>

        <!-- Multi-select (checkboxes) for shopping-media -->
        <div
          v-else-if="axis.inputType === 'multi-select'"
          class="space-y-1"
        >
          <p
            v-if="axis.minSelections || axis.maxSelections"
            class="mb-1 text-[11px] text-stone-500"
          >
            Pick {{ axis.minSelections ?? 1 }}–{{
              axis.maxSelections ?? '∞'
            }}.
          </p>
          <label
            v-for="opt in axis.options ?? []"
            :key="opt.id"
            class="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-stone-50"
          >
            <input
              type="checkbox"
              :value="opt.id"
              :checked="shoppingPicks.includes(opt.id)"
              :disabled="
                !shoppingPicks.includes(opt.id) &&
                shoppingPicks.length >= (axis.maxSelections ?? 99)
              "
              class="mt-1"
              @change="toggleMultiSelect(axis.id, opt.id)"
            />
            <span class="text-xs">
              <span class="font-medium text-stone-800">{{ opt.label }}</span>
              <span v-if="opt.helperText" class="block text-stone-500">{{
                opt.helperText
              }}</span>
            </span>
          </label>
        </div>

        <!-- Special case: purchase-motivation has primary + optional secondary -->
        <div
          v-else-if="axis.id === 'purchase-motivation'"
          class="space-y-3"
        >
          <div>
            <label class="mb-1 block text-[11px] font-semibold text-stone-700"
              >Primary motivation (required)</label
            >
            <select
              v-model="motivationPrimary"
              class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
            >
              <option value="">Select one…</option>
              <option
                v-for="opt in axis.options ?? []"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-[11px] font-semibold text-stone-700"
              >Secondary motivation (optional)</label
            >
            <select
              v-model="motivationSecondary"
              class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
            >
              <option value="">No secondary motivation</option>
              <option
                v-for="opt in (axis.options ?? []).filter(
                  (o) => o.id !== motivationPrimary
                )"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
      </fieldset>

      <button
        type="button"
        class="w-full rounded bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
        :disabled="!canAnalyze"
        @click="analyze"
      >
        Analyze profile
      </button>
      <p v-if="!canAnalyze" class="text-[11px] text-stone-500">
        {{ analyzeHint }}
      </p>
    </div>

    <!-- ===== Result ===== -->
    <div
      v-if="result"
      class="mt-5 rounded border border-amber-300 bg-white p-4"
      aria-live="polite"
    >
      <h4 class="mb-2 text-sm font-semibold text-stone-900">Result</h4>

      <!-- Confident classification -->
      <div v-if="result.status === 'ready'" class="space-y-3 text-xs">
        <div>
          <span class="font-semibold text-stone-700">Primary:</span>
          <span class="ml-1 text-stone-900">
            {{ archetypeName(result.primaryArchetypeId) }}
          </span>
          <span
            class="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            :class="confidenceChipClass"
          >
            Confidence: {{ result.confidence }}
          </span>
        </div>
        <p class="text-stone-700">
          {{ archetypeSummary(result.primaryArchetypeId) }}
        </p>

        <div v-if="result.secondaryArchetypeId">
          <span class="font-semibold text-stone-700">
            {{ result.secondaryIsOverlay ? 'Overlay:' : 'Close runner-up:' }}
          </span>
          <span class="ml-1 text-stone-900">
            {{ archetypeName(result.secondaryArchetypeId) }}
          </span>
          <p
            v-if="result.secondaryIsOverlay"
            class="mt-1 italic text-stone-600"
          >
            The customer's engagement is also driven by the cause behind
            the work, not just the product itself.
          </p>
        </div>

        <div v-if="topSignals.length">
          <p class="font-semibold text-stone-700">What pointed us here:</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li v-for="(s, i) in topSignals" :key="`top-${i}`">{{ s }}</li>
          </ul>
        </div>

        <div v-if="contradictingSignals.length">
          <p class="font-semibold text-stone-700">What pulled away:</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li v-for="(s, i) in contradictingSignals" :key="`con-${i}`">
              {{ s }}
            </li>
          </ul>
        </div>

        <p v-if="result.confidenceWhyItIsThisLevel" class="text-stone-700">
          <span class="font-semibold">Why this confidence:</span>
          {{ result.confidenceWhyItIsThisLevel }}
        </p>

        <p v-if="result.whatToTestNext" class="text-stone-700">
          <span class="font-semibold">What to test next:</span>
          {{ result.whatToTestNext }}
        </p>

        <!-- Draft scaffold -->
        <div class="mt-4 rounded border border-stone-200 bg-stone-50 p-3">
          <p class="mb-1 text-[11px] font-semibold uppercase text-stone-600">
            Draft starter
          </p>
          <p class="whitespace-pre-line text-stone-800">{{ draftStarter }}</p>
          <div class="mt-2 flex items-center gap-2">
            <button
              type="button"
              class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
              @click="copyDraftStarter"
            >
              {{ copyButtonLabel }}
            </button>
            <span class="text-[11px] text-stone-500">
              Copies to clipboard. Paste into your Working Draft when ready —
              we will not write into the section for you.
            </span>
          </div>
        </div>
      </div>

      <!-- No confident fit -->
      <div v-else-if="result.status === 'not_available'" class="space-y-2 text-xs">
        <p class="font-semibold text-stone-900">
          We could not confidently match this profile to a V1 archetype.
        </p>
        <div v-if="(result.closestArchetypeIds ?? []).length">
          <p class="text-stone-700">Closest archetypes:</p>
          <ol class="ml-4 list-decimal space-y-0.5">
            <li
              v-for="id in result.closestArchetypeIds ?? []"
              :key="id"
            >
              {{ archetypeName(id) }}
            </li>
          </ol>
        </div>
        <p class="text-stone-700">
          Gather more evidence on the customer or flag this combination to
          your team as a possible gap for a future tranche.
        </p>
      </div>
    </div>

    <!-- ===== Teacher debug (chief / admin only) ===== -->
    <details
      v-if="result && isChief"
      class="mt-4 rounded border border-stone-300 bg-stone-50 p-2 text-xs"
    >
      <summary class="cursor-pointer font-semibold text-stone-700">
        Teacher debug
      </summary>
      <div class="mt-2 space-y-2 text-stone-800">
        <p class="text-[11px] italic text-stone-500">
          Visible to chiefs and admins only. Not shown to students.
        </p>
        <div>
          <p class="font-semibold">Ranked archetypes (normalized scores):</p>
          <ol class="ml-4 list-decimal">
            <li
              v-for="entry in rankedDebugEntries"
              :key="entry.id"
              :class="entry.id === result?.primaryArchetypeId ? 'font-semibold' : ''"
            >
              {{ archetypeName(entry.id) }} — {{ entry.score }}
            </li>
          </ol>
        </div>
        <p>
          <span class="font-semibold">Final confidence:</span>
          {{ result?.confidence }}
          (archetype-derived
          {{ result?.teacherDebug?.archetypeDerivedConfidence }} ·
          evidence-derived
          {{ result?.teacherDebug?.evidenceDerivedConfidence }} · floored by
          {{ result?.teacherDebug?.flooredBy }})
        </p>
        <p v-if="result?.teacherDebug?.appliedFloor">
          <span class="font-semibold">Applied floor:</span>
          {{ result?.teacherDebug?.appliedFloor }}
        </p>
        <p v-if="(result?.teacherDebug?.writeInCount ?? 0) > 0">
          <span class="font-semibold">Write-in count:</span>
          {{ result?.teacherDebug?.writeInCount }}
        </p>
        <p>
          <span class="font-semibold">CFS overlay:</span>
          {{ cfsDebugLine }}
        </p>
        <div v-if="topSignals.length">
          <p class="font-semibold">Top contributing signals:</p>
          <ul class="ml-4 list-disc">
            <li v-for="(s, i) in topSignals" :key="`tdtop-${i}`">{{ s }}</li>
          </ul>
        </div>
        <div v-if="contradictingSignals.length">
          <p class="font-semibold">Contradicting signals:</p>
          <ul class="ml-4 list-disc">
            <li v-for="(s, i) in contradictingSignals" :key="`tdcon-${i}`">
              {{ s }}
            </li>
          </ul>
        </div>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { CUSTOMER_PROFILE_BUILDER_VARIANT } from '~/config/sectionEngineVariants'
import { CUSTOMER_PROFILE_ARCHETYPE_BY_ID } from '~/data/customerProfileArchetypes'
import { classifyCustomerProfile } from '~/utils/customerProfileClassifier'
import type {
  CustomerProfileArchetypeId,
  CustomerProfileClassifierOutput,
  CustomerProfilePrimitiveSelections,
  PrimitiveAxisConfig
} from '~/types/sectionEngines'

const authStore = useAuthStore()
const isChief = computed(() => authStore.isChief)

// ---- Local state -------------------------------------------------
// All state local. No Firestore, no persistence.

interface FormState {
  'life-stage': string
  'household-composition': string
  urbanicity: string
  'spending-capacity': string
  'tight-budget-detail': string
  'housing-context': string
  'education-occupation': string
  'evidence-confidence': string
}

const form = reactive<FormState>({
  'life-stage': '',
  'household-composition': '',
  urbanicity: '',
  'spending-capacity': '',
  'tight-budget-detail': '',
  'housing-context': '',
  'education-occupation': '',
  'evidence-confidence': ''
})
const shoppingPicks = ref<string[]>([])
const motivationPrimary = ref<string>('')
const motivationSecondary = ref<string>('')
const result = ref<CustomerProfileClassifierOutput | null>(null)
const copyButtonLabel = ref<string>('Copy draft starter')

// ---- Axis rendering ---------------------------------------------

const allAxes = CUSTOMER_PROFILE_BUILDER_VARIANT.axes

const renderableAxes = computed<PrimitiveAxisConfig[]>(() => {
  return allAxes.filter((axis) => {
    if (!axis.conditionalOn) return true
    const gateValue = (form as Record<string, string>)[axis.conditionalOn.axisId]
    return gateValue === axis.conditionalOn.valueId
  })
})

function singleSelectValue(axisId: string): string {
  return (form as Record<string, string>)[axisId] ?? ''
}

function setSingleSelect(axisId: string, optionId: string): void {
  ;(form as Record<string, string>)[axisId] = optionId
  // When spending-capacity moves OFF tight, clear tight-budget-detail.
  if (axisId === 'spending-capacity' && optionId !== 'tight') {
    form['tight-budget-detail'] = ''
  }
}

function toggleMultiSelect(axisId: string, optionId: string): void {
  if (axisId !== 'shopping-media-behavior') return
  const idx = shoppingPicks.value.indexOf(optionId)
  if (idx === -1) shoppingPicks.value.push(optionId)
  else shoppingPicks.value.splice(idx, 1)
}

// ---- Validation -------------------------------------------------

const canAnalyze = computed(() => {
  const requiredSingleSelects: (keyof FormState)[] = [
    'life-stage',
    'household-composition',
    'urbanicity',
    'spending-capacity',
    'housing-context',
    'education-occupation',
    'evidence-confidence'
  ]
  for (const axis of requiredSingleSelects) {
    if (!form[axis]) return false
  }
  if (form['spending-capacity'] === 'tight' && !form['tight-budget-detail']) {
    return false
  }
  if (shoppingPicks.value.length < 1 || shoppingPicks.value.length > 3) {
    return false
  }
  if (!motivationPrimary.value) return false
  return true
})

const analyzeHint = computed(() => {
  if (canAnalyze.value) return ''
  const missing: string[] = []
  if (!form['life-stage']) missing.push('life stage')
  if (!form['household-composition']) missing.push('household composition')
  if (!form.urbanicity) missing.push('urbanicity')
  if (!form['spending-capacity']) missing.push('spending capacity')
  if (
    form['spending-capacity'] === 'tight' &&
    !form['tight-budget-detail']
  ) {
    missing.push('tight-budget detail')
  }
  if (!form['housing-context']) missing.push('housing context')
  if (!form['education-occupation']) missing.push('education / occupation')
  if (shoppingPicks.value.length < 1) missing.push('1–3 shopping behaviors')
  if (!motivationPrimary.value) missing.push('primary motivation')
  if (!form['evidence-confidence']) missing.push('evidence confidence')
  return `Still needed: ${missing.join(', ')}.`
})

// ---- Classifier call --------------------------------------------

function analyze(): void {
  if (!canAnalyze.value) return
  const selections: CustomerProfilePrimitiveSelections = {
    'life-stage': form['life-stage'],
    'household-composition': form['household-composition'],
    urbanicity: form.urbanicity,
    'spending-capacity': form['spending-capacity'],
    ...(form['spending-capacity'] === 'tight'
      ? { 'tight-budget-detail': form['tight-budget-detail'] }
      : {}),
    'housing-context': form['housing-context'],
    'education-occupation': form['education-occupation'],
    'shopping-media-behavior': [...shoppingPicks.value],
    'purchase-motivation': {
      primary: motivationPrimary.value,
      ...(motivationSecondary.value
        ? { secondary: motivationSecondary.value }
        : {})
    },
    'evidence-confidence': form[
      'evidence-confidence'
    ] as CustomerProfilePrimitiveSelections['evidence-confidence']
  }
  // V1: no documentedEvidenceFlags surfaced in UI yet (teacher / curriculum-
  // managed input). Pass empty flags object.
  result.value = classifyCustomerProfile(selections, {})
  copyButtonLabel.value = 'Copy draft starter'
}

// ---- Result helpers ---------------------------------------------

function archetypeName(id?: string): string {
  if (!id) return ''
  const record = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id as CustomerProfileArchetypeId]
  return record?.workingDisplayName ?? id
}

function archetypeSummary(id?: string): string {
  if (!id) return ''
  const record = CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id as CustomerProfileArchetypeId]
  return record?.oneSentenceSummary ?? ''
}

const topSignals = computed<string[]>(
  () => result.value?.topContributingSignals ?? []
)
const contradictingSignals = computed<string[]>(
  () => result.value?.contradictingSignals ?? []
)

const confidenceChipClass = computed(() => {
  switch (result.value?.confidence) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'low':
    default:
      return 'bg-stone-200 text-stone-700'
  }
})

// ---- Draft scaffold ---------------------------------------------

const draftStarter = computed(() => {
  if (!result.value || result.value.status !== 'ready') return ''
  const primaryName = archetypeName(result.value.primaryArchetypeId)
  const motivationLabel =
    motivationLabelById(motivationPrimary.value) || '___'
  const evidenceLabel = evidenceLabelById(form['evidence-confidence']) || '___'
  const topThree = (topSignals.value.slice(0, 3) || []).map((s) =>
    s.toLowerCase()
  )
  const reasons =
    topThree.length === 0
      ? '___, ___, and ___'
      : topThree.length === 1
        ? `${topThree[0]}`
        : topThree.length === 2
          ? `${topThree[0]} and ${topThree[1]}`
          : `${topThree[0]}, ${topThree[1]}, and ${topThree[2]}`
  const next = result.value.whatToTestNext || '___'
  return [
    `Our primary customer may fit the ${primaryName} profile.`,
    `We think this because ${reasons}.`,
    `This customer may value ${motivationLabel}.`,
    `The strongest evidence we have is ${evidenceLabel}.`,
    `The biggest assumption we still need to test is ${next}`
  ].join(' ')
})

function motivationLabelById(id: string): string {
  if (!id) return ''
  const axis = allAxes.find((a) => a.id === 'purchase-motivation')
  const opt = (axis?.options ?? []).find((o) => o.id === id)
  return opt ? opt.label.toLowerCase() : id
}

function evidenceLabelById(id: string): string {
  if (!id) return ''
  const axis = allAxes.find((a) => a.id === 'evidence-confidence')
  const opt = (axis?.options ?? []).find((o) => o.id === id)
  return opt ? opt.label.toLowerCase() : id
}

async function copyDraftStarter(): Promise<void> {
  const text = draftStarter.value
  if (!text) return
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text)
      copyButtonLabel.value = 'Copied ✓'
      window.setTimeout(() => {
        copyButtonLabel.value = 'Copy draft starter'
      }, 2000)
    } else {
      copyButtonLabel.value = 'Copy unavailable — select and copy manually'
    }
  } catch {
    copyButtonLabel.value = 'Copy failed — try again'
  }
}

// ---- Teacher-debug helpers --------------------------------------

const rankedDebugEntries = computed<{ id: string; score: number }[]>(() => {
  const scores = result.value?.teacherDebug?.scores
  if (!scores) return []
  return Object.entries(scores)
    .map(([id, score]) => ({ id, score: Math.round(Number(score)) }))
    .filter((e) => Number.isFinite(e.score))
    .sort((a, b) => b.score - a.score)
})

const cfsDebugLine = computed<string>(() => {
  const debug = result.value?.teacherDebug
  if (!debug) return '—'
  if (!debug.causeMotivationSelected) {
    return 'not eligible — supporting-a-cause not selected as a motivation.'
  }
  if (!debug.causeCorroborated) {
    return 'eligible by motivation but suppressed — no cause-driven shopping pick AND no evidenceAboutCauseMotivation flag.'
  }
  if (result.value?.secondaryArchetypeId === 'cause-first-supporters') {
    return 'overlay applied (motivation + corroboration both present).'
  }
  if (result.value?.primaryArchetypeId === 'cause-first-supporters') {
    return 'CFS as primary (rare path).'
  }
  return 'eligible and corroborated, but another archetype took both primary and secondary slots.'
})
</script>
