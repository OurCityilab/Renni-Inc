<!--
  Customer Profile Builder (Beta) — guided multi-profile UI.

  PURPOSE
  -------
  Lets a student compose UP TO THREE customer profiles (Primary,
  Secondary, Tertiary) using the V1 primitive model and the
  deterministic classifier. Designed for a high school student to
  complete one decision at a time.

  WIRING
  ------
  Mounted by DeliverableOutputWorkspace.vue ONLY when:
    1. runtimeConfig.public.customerProfileBuilderEnabled === true
    2. The active section id is `customer-segments`

  POSTURE (do not relax)
  ----------------------
    - Pure UI + classifier call. No Firestore, no AI, no network.
    - Local component state per slot. No persistence in V1.
    - Never overwrites Working Draft. Copy buttons write to clipboard
      only. No "Add to Working Draft" path in this pass.
    - Numeric scores are NEVER shown to students. Teacher Debug is
      gated by `canViewTeacherDebug` (chief OR admin/instructor) and
      is collapsed by default.
    - Stereotype guardrail and PRIZM-inspired disclaimer remain
      visible above the form.

  STRUCTURE
  ---------
    - Three slot tabs at top (Primary / Secondary / Tertiary) with
      completion badges. Default active slot is Primary.
    - Active slot's form is grouped into 6 numbered accordion steps:
        1. Who are they? (life-stage, household-composition,
           education-occupation)
        2. Where do they live? (urbanicity, housing-context)
        3. How much flexibility do they have? (spending-capacity,
           conditional tight-budget-detail)
        4. How do they shop? (shopping-media-behavior, 1–3 picks)
        5. Why would they buy? (purchase-motivation primary +
           optional secondary)
        6. How strong is our evidence? (evidence-confidence)
    - Per-slot Analyze button → per-slot result panel.
    - Combined-copy button surfaces once at least one slot is
      analyzed.
    - Teacher Debug (chief/admin only) shows which slot is being
      debugged plus the v0.1 debug payload.
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
        Customer Profile Builder
        <span
          class="ml-2 inline-flex items-center rounded bg-amber-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900"
        >
          Beta
        </span>
      </h3>
      <p class="text-xs text-amber-800">
        Build the customer profile one decision at a time. Your current
        QuickStart still works.
      </p>
    </header>

    <!-- Required PRIZM/ESRI disclaimer -->
    <p
      class="mb-2 rounded border border-amber-200 bg-white/60 p-2 text-xs text-amber-900"
    >
      This is a PRIZM-inspired / ESRI-inspired learning tool. It helps
      you reason about customer patterns, but it is not actual PRIZM or
      ESRI segmentation.
    </p>

    <!-- Required stereotype guardrail -->
    <p
      class="mb-2 rounded border border-amber-200 bg-white/60 p-2 text-xs text-amber-900"
    >
      <strong>Stereotype guardrail:</strong> Store choices are clues,
      not proof. Do not assume someone's income, values, race, politics,
      or identity from one store or one behavior.
    </p>

    <!-- Builder framing: students need to know this is a thinking tool,
         not a publishing tool. Keeps the same posture as the rest of
         the file (no auto-save, no submit, no approval). -->
    <p
      class="mb-4 rounded border border-stone-200 bg-white/70 p-2 text-xs text-stone-800"
    >
      <strong>How to use this:</strong> the builder helps you
      <em>think</em> through who the customer is. Your final answer
      still needs your judgment and any evidence you have. The builder
      does not submit or approve anything.
    </p>

    <!-- Optional starting point: Customer Archetype Picker.
         Local-state, copy-only. Never overwrites existing builder
         selections; classifier output below remains the authoritative
         deterministic profile. Students who want to skip the picker
         can scroll past it. -->
    <details class="mb-4 rounded border border-sky-200 bg-sky-50/40 p-2">
      <summary class="cursor-pointer text-xs font-semibold text-sky-900">
        Optional starting point — pick a customer archetype
      </summary>
      <p class="mt-1 text-[11px] italic text-sky-900">
        Helps you start from a card deck instead of a blank page.
        Selections do not overwrite anything below.
      </p>
      <div class="mt-2">
        <CustomerArchetypePicker
          :section-id="'customer-segments'"
          :compact="true"
        />
      </div>
    </details>

    <!-- ===== Slot tabs (Primary / Secondary / Tertiary) ===== -->
    <div
      class="mb-3 flex flex-wrap gap-2"
      role="tablist"
      aria-label="Customer profile slots"
    >
      <button
        v-for="slot in slotIds"
        :key="slot"
        type="button"
        role="tab"
        :aria-selected="activeSlot === slot"
        class="flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          activeSlot === slot
            ? 'border-amber-500 bg-amber-100 text-amber-900'
            : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
        "
        @click="activeSlot = slot"
      >
        <span class="font-semibold">{{ slotLabels[slot] }}</span>
        <span
          class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
          :class="slotBadgeClass(slot)"
        >
          {{ slotBadgeText(slot) }}
        </span>
        <span v-if="slot !== 'primary'" class="text-[10px] text-stone-500"
          >(optional)</span
        >
      </button>
    </div>

    <!-- ===== Active slot: 6 grouped step accordions ===== -->
    <div class="space-y-3">
      <details
        v-for="step in steps"
        :key="step.id"
        :open="openSteps[step.id]"
        class="rounded border border-stone-200 bg-white"
        @toggle="(e) => syncOpenState(step.id, e)"
      >
        <summary
          class="flex cursor-pointer items-center justify-between gap-2 rounded-t bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
        >
          <span class="flex items-center gap-2">
            <span
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
              :class="
                isStepComplete(step)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-stone-200 text-stone-700'
              "
            >
              {{ isStepComplete(step) ? '✓' : step.number }}
            </span>
            <span>{{ step.title }}</span>
          </span>
          <span class="text-[10px] uppercase text-stone-500">
            {{ isStepComplete(step) ? 'complete' : 'open me' }}
          </span>
        </summary>

        <div class="space-y-4 p-3">
          <fieldset
            v-for="axisId in step.axisIds"
            :key="axisId"
            class="rounded border border-stone-200 bg-stone-50/40 p-3"
          >
            <legend class="px-1 text-xs font-semibold text-stone-900">
              {{ axisById(axisId)?.label }}
              <span
                v-if="!axisById(axisId)?.required"
                class="text-[10px] font-normal text-stone-500"
                >(optional)</span
              >
            </legend>
            <p class="mb-2 text-xs text-stone-700">
              {{ axisById(axisId)?.studentPrompt }}
            </p>

            <!-- Conditional axis (tight-budget-detail) hidden when
                 gating value is not met. -->
            <p
              v-if="
                axisById(axisId)?.conditionalOn &&
                !isConditionalGateMet(axisById(axisId)!)
              "
              class="text-[11px] italic text-stone-500"
            >
              This question only appears when the previous answer is
              "{{ conditionalGateLabel(axisById(axisId)!) }}".
            </p>

            <!-- Single-select (radios) for non-motivation axes -->
            <div
              v-else-if="
                axisById(axisId)?.inputType === 'single-select' &&
                axisId !== 'purchase-motivation'
              "
              class="space-y-1"
            >
              <label
                v-for="opt in axisById(axisId)?.options ?? []"
                :key="opt.id"
                class="flex items-start gap-2 rounded px-1 py-1 hover:bg-white"
              >
                <input
                  type="radio"
                  :name="`cpb-${activeSlot}-${axisId}`"
                  :value="opt.id"
                  :checked="singleSelectValue(axisId) === opt.id"
                  class="mt-1"
                  @change="setSingleSelect(axisId, opt.id)"
                />
                <span class="text-xs">
                  <span class="font-medium text-stone-800">{{
                    opt.label
                  }}</span>
                  <span
                    v-if="opt.helperText"
                    class="block text-stone-500"
                    >{{ opt.helperText }}</span
                  >
                </span>
              </label>
            </div>

            <!-- Multi-select (checkboxes) for shopping-media -->
            <div
              v-else-if="axisById(axisId)?.inputType === 'multi-select'"
              class="space-y-1"
            >
              <p
                v-if="
                  axisById(axisId)?.minSelections ||
                  axisById(axisId)?.maxSelections
                "
                class="mb-1 text-[11px] text-stone-500"
              >
                Pick {{ axisById(axisId)?.minSelections ?? 1 }}–{{
                  axisById(axisId)?.maxSelections ?? '∞'
                }}.
              </p>
              <label
                v-for="opt in axisById(axisId)?.options ?? []"
                :key="opt.id"
                class="flex items-start gap-2 rounded px-1 py-1 hover:bg-white"
              >
                <input
                  type="checkbox"
                  :value="opt.id"
                  :checked="activeSlotShoppingPicks.includes(opt.id)"
                  :disabled="
                    !activeSlotShoppingPicks.includes(opt.id) &&
                    activeSlotShoppingPicks.length >=
                      (axisById(axisId)?.maxSelections ?? 99)
                  "
                  class="mt-1"
                  @change="toggleShoppingPick(opt.id)"
                />
                <span class="text-xs">
                  <span class="font-medium text-stone-800">{{
                    opt.label
                  }}</span>
                  <span
                    v-if="opt.helperText"
                    class="block text-stone-500"
                    >{{ opt.helperText }}</span
                  >
                </span>
              </label>
            </div>

            <!-- Purchase motivation (primary + optional secondary) -->
            <div
              v-else-if="axisId === 'purchase-motivation'"
              class="space-y-3"
            >
              <div>
                <label
                  class="mb-1 block text-[11px] font-semibold text-stone-700"
                  >Primary motivation (required)</label
                >
                <select
                  :value="activeSlotMotivationPrimary"
                  class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
                  @change="
                    setMotivationPrimary(
                      ($event.target as HTMLSelectElement).value
                    )
                  "
                >
                  <option value="">Select one…</option>
                  <option
                    v-for="opt in axisById(axisId)?.options ?? []"
                    :key="opt.id"
                    :value="opt.id"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-semibold text-stone-700"
                  >Secondary motivation (optional)</label
                >
                <select
                  :value="activeSlotMotivationSecondary"
                  class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
                  @change="
                    setMotivationSecondary(
                      ($event.target as HTMLSelectElement).value
                    )
                  "
                >
                  <option value="">No secondary motivation</option>
                  <option
                    v-for="opt in (axisById(axisId)?.options ?? []).filter(
                      (o) => o.id !== activeSlotMotivationPrimary
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

          <div class="flex items-center justify-between">
            <button
              v-if="step.number < totalSteps"
              type="button"
              class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
              @click="advanceFromStep(step)"
            >
              Continue to step {{ step.number + 1 }}
            </button>
            <span v-else class="text-xs italic text-stone-500">
              All decisions made. Use the Analyze button below.
            </span>
            <span
              v-if="!isStepComplete(step)"
              class="text-[11px] text-amber-700"
              >Some decisions still needed.</span
            >
          </div>
        </div>
      </details>

      <button
        type="button"
        class="w-full rounded bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-stone-400"
        :disabled="!canAnalyzeActive"
        @click="analyze"
      >
        Analyze {{ slotLabels[activeSlot] }}
      </button>
      <p v-if="!canAnalyzeActive" class="text-[11px] text-stone-500">
        {{ analyzeHint }}
      </p>
    </div>

    <!-- ===== Per-slot result ===== -->
    <div
      v-if="activeSlotResult"
      class="mt-5 rounded border border-amber-300 bg-white p-4"
      aria-live="polite"
    >
      <h4 class="mb-2 text-sm font-semibold text-stone-900">
        Result for {{ slotLabels[activeSlot] }}
      </h4>

      <div
        v-if="activeSlotResult.status === 'ready'"
        class="space-y-3 text-xs"
      >
        <div>
          <span class="font-semibold text-stone-700">Primary archetype:</span>
          <span class="ml-1 text-stone-900">
            {{ archetypeName(activeSlotResult.primaryArchetypeId) }}
          </span>
          <span
            class="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            :class="confidenceChipClass(activeSlotResult.confidence)"
          >
            Confidence: {{ activeSlotResult.confidence }}
          </span>
        </div>
        <p class="text-stone-700">
          {{ archetypeSummary(activeSlotResult.primaryArchetypeId) }}
        </p>

        <div v-if="activeSlotResult.secondaryArchetypeId">
          <span class="font-semibold text-stone-700">
            {{
              activeSlotResult.secondaryIsOverlay
                ? 'Overlay:'
                : 'Close runner-up:'
            }}
          </span>
          <span class="ml-1 text-stone-900">
            {{ archetypeName(activeSlotResult.secondaryArchetypeId) }}
          </span>
          <p
            v-if="activeSlotResult.secondaryIsOverlay"
            class="mt-1 italic text-stone-600"
          >
            The customer's engagement is also driven by the cause behind
            the work, not just the product itself.
          </p>
        </div>

        <div v-if="(activeSlotResult.topContributingSignals ?? []).length">
          <p class="font-semibold text-stone-700">What pointed us here:</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li
              v-for="(s, i) in activeSlotResult.topContributingSignals ?? []"
              :key="`top-${i}`"
            >
              {{ s }}
            </li>
          </ul>
        </div>

        <div v-if="(activeSlotResult.contradictingSignals ?? []).length">
          <p class="font-semibold text-stone-700">What pulled away:</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li
              v-for="(s, i) in activeSlotResult.contradictingSignals ?? []"
              :key="`con-${i}`"
            >
              {{ s }}
            </li>
          </ul>
        </div>

        <p
          v-if="activeSlotResult.confidenceWhyItIsThisLevel"
          class="text-stone-700"
        >
          <span class="font-semibold">Why this confidence:</span>
          {{ activeSlotResult.confidenceWhyItIsThisLevel }}
        </p>

        <p v-if="activeSlotResult.whatToTestNext" class="text-stone-700">
          <span class="font-semibold">What to test next:</span>
          {{ activeSlotResult.whatToTestNext }}
        </p>

        <!-- Per-slot draft starter -->
        <div class="mt-4 rounded border border-stone-200 bg-stone-50 p-3">
          <p class="mb-1 text-[11px] font-semibold uppercase text-stone-600">
            Draft starter for {{ slotLabels[activeSlot] }}
          </p>
          <p class="whitespace-pre-line text-stone-800">
            {{ slotDraftStarter(activeSlot) }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100"
              @click="copySingleDraft(activeSlot)"
            >
              {{ copyButtonLabels[activeSlot] }}
            </button>
            <span class="text-[11px] text-stone-600">
              Copies to clipboard. <strong>Paste into your Working
              Draft for Customer Segments</strong>, then edit it in
              your own words and add any evidence you have. The
              builder does not write into the section for you.
            </span>
          </div>
        </div>
      </div>

      <div
        v-else-if="activeSlotResult.status === 'not_available'"
        class="space-y-2 text-xs"
      >
        <p class="font-semibold text-stone-900">
          We could not confidently match this profile to a V1 archetype.
        </p>
        <div v-if="(activeSlotResult.closestArchetypeIds ?? []).length">
          <p class="text-stone-700">Closest archetypes:</p>
          <ol class="ml-4 list-decimal space-y-0.5">
            <li
              v-for="id in activeSlotResult.closestArchetypeIds ?? []"
              :key="id"
            >
              {{ archetypeName(id) }}
            </li>
          </ol>
        </div>
        <p class="text-stone-700">
          Gather more evidence on the customer or flag this combination
          to your team as a possible gap.
        </p>
      </div>
    </div>

    <!-- ===== Combined copy across analyzed slots ===== -->
    <div
      v-if="analyzedSlotIds.length > 0"
      class="mt-4 rounded border border-amber-300 bg-amber-50 p-3"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase text-amber-900">
        Combined draft — {{ analyzedSlotIds.length }} of 3 profile{{
          analyzedSlotIds.length === 1 ? '' : 's'
        }}
        analyzed
      </p>
      <p class="mb-2 whitespace-pre-line text-xs text-stone-800">
        {{ combinedDraft }}
      </p>
      <button
        type="button"
        class="rounded border border-amber-400 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
        @click="copyCombinedDraft"
      >
        {{ combinedCopyLabel }}
      </button>
      <span class="ml-2 text-[11px] text-stone-600">
        Includes only the profiles you have analyzed.
        <strong>Paste into your Working Draft for Customer Segments</strong>
        and edit in your own words.
      </span>
    </div>

    <!-- ===== Teacher Debug (chiefs / admins only) ===== -->
    <details
      v-if="activeSlotResult && canViewTeacherDebug"
      class="mt-4 rounded border border-stone-300 bg-stone-50 p-2 text-xs"
    >
      <summary class="cursor-pointer font-semibold text-stone-700">
        Teacher debug — {{ slotLabels[activeSlot] }}
      </summary>
      <div class="mt-2 space-y-2 text-stone-800">
        <p class="text-[11px] italic text-stone-500">
          Visible to chiefs and admins only. Not shown to students.
          Switch slot tabs to debug other profiles.
        </p>
        <div>
          <p class="font-semibold">
            Ranked archetypes (normalized scores):
          </p>
          <ol class="ml-4 list-decimal">
            <li
              v-for="entry in rankedDebugEntries"
              :key="entry.id"
              :class="
                entry.id === activeSlotResult?.primaryArchetypeId
                  ? 'font-semibold'
                  : ''
              "
            >
              {{ archetypeName(entry.id) }} — {{ entry.score }}
            </li>
          </ol>
        </div>
        <p>
          <span class="font-semibold">Final confidence:</span>
          {{ activeSlotResult?.confidence }}
          (archetype-derived
          {{ activeSlotResult?.teacherDebug?.archetypeDerivedConfidence }} ·
          evidence-derived
          {{ activeSlotResult?.teacherDebug?.evidenceDerivedConfidence }} ·
          floored by
          {{ activeSlotResult?.teacherDebug?.flooredBy }})
        </p>
        <p v-if="activeSlotResult?.teacherDebug?.appliedFloor">
          <span class="font-semibold">Applied floor:</span>
          {{ activeSlotResult?.teacherDebug?.appliedFloor }}
        </p>
        <p v-if="(activeSlotResult?.teacherDebug?.writeInCount ?? 0) > 0">
          <span class="font-semibold">Write-in count:</span>
          {{ activeSlotResult?.teacherDebug?.writeInCount }}
        </p>
        <p>
          <span class="font-semibold">Cause-First overlay:</span>
          <span :class="cfsReasonClass">{{ cfsReasonLabel }}</span>
          —
          {{ cfsReasonExplanation }}
        </p>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { isExecutiveRole } from '~/utils/permissions'
import { CUSTOMER_PROFILE_BUILDER_VARIANT } from '~/config/sectionEngineVariants'
import { CUSTOMER_PROFILE_ARCHETYPE_BY_ID } from '~/data/customerProfileArchetypes'
import CustomerArchetypePicker from '~/components/CustomerArchetypePicker.vue'
import { classifyCustomerProfile } from '~/utils/customerProfileClassifier'
import type {
  CustomerProfileArchetypeId,
  CustomerProfileClassifierOutput,
  CustomerProfilePrimitiveSelections,
  PrimitiveAxisConfig
} from '~/types/sectionEngines'

const authStore = useAuthStore()
// Teacher Debug visibility: chief OR admin/instructor (=
// `isExecutiveRole(profile)` from permissions.ts). Using the
// explicit OR helper rather than auth store `isChief` alone is
// defensive against role-data drift on production admin profiles —
// the helper resolves to true on any chief or admin role string,
// even if `CHIEF_ROLES` set composition shifts in a future change.
// Regular `member` users never satisfy this gate.
const canViewTeacherDebug = computed(() => isExecutiveRole(authStore.profile))

// ---- Slot model (Primary / Secondary / Tertiary) ----------------

type SlotId = 'primary' | 'secondary' | 'tertiary'
const slotIds: readonly SlotId[] = ['primary', 'secondary', 'tertiary']
const slotLabels: Record<SlotId, string> = {
  primary: 'Primary customer',
  secondary: 'Secondary customer',
  tertiary: 'Tertiary customer'
}

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

interface SlotState {
  form: FormState
  shoppingPicks: string[]
  motivationPrimary: string
  motivationSecondary: string
  result: CustomerProfileClassifierOutput | null
}

function blankForm(): FormState {
  return {
    'life-stage': '',
    'household-composition': '',
    urbanicity: '',
    'spending-capacity': '',
    'tight-budget-detail': '',
    'housing-context': '',
    'education-occupation': '',
    'evidence-confidence': ''
  }
}

function blankSlot(): SlotState {
  return {
    form: blankForm(),
    shoppingPicks: [],
    motivationPrimary: '',
    motivationSecondary: '',
    result: null
  }
}

const slots = reactive<Record<SlotId, SlotState>>({
  primary: blankSlot(),
  secondary: blankSlot(),
  tertiary: blankSlot()
})

const activeSlot = ref<SlotId>('primary')

const copyButtonLabels = reactive<Record<SlotId, string>>({
  primary: 'Copy draft starter',
  secondary: 'Copy draft starter',
  tertiary: 'Copy draft starter'
})
const combinedCopyLabel = ref<string>('Copy all completed profiles')

// ---- Step model (6 grouped sections) ----------------------------

interface StepConfig {
  id: string
  number: number
  title: string
  axisIds: string[]
}

const steps: StepConfig[] = [
  {
    id: 'who',
    number: 1,
    title: 'Step 1 — Who are they?',
    axisIds: ['life-stage', 'household-composition', 'education-occupation']
  },
  {
    id: 'where',
    number: 2,
    title: 'Step 2 — Where do they live?',
    axisIds: ['urbanicity', 'housing-context']
  },
  {
    id: 'flexibility',
    number: 3,
    title: 'Step 3 — How much flexibility do they have?',
    axisIds: ['spending-capacity', 'tight-budget-detail']
  },
  {
    id: 'shopping',
    number: 4,
    title: 'Step 4 — How do they shop?',
    axisIds: ['shopping-media-behavior']
  },
  {
    id: 'why',
    number: 5,
    title: 'Step 5 — Why would they buy?',
    axisIds: ['purchase-motivation']
  },
  {
    id: 'evidence',
    number: 6,
    title: 'Step 6 — How strong is our evidence?',
    axisIds: ['evidence-confidence']
  }
]
const totalSteps = steps.length

// Step-open state is shared across slots. Step 1 open by default;
// Continue button advances to the next step.
const openSteps = reactive<Record<string, boolean>>({
  who: true,
  where: false,
  flexibility: false,
  shopping: false,
  why: false,
  evidence: false
})

function syncOpenState(stepId: string, event: Event): void {
  const target = event.target as HTMLDetailsElement | null
  if (!target) return
  openSteps[stepId] = target.open
}

function advanceFromStep(step: StepConfig): void {
  openSteps[step.id] = false
  const next = steps.find((s) => s.number === step.number + 1)
  if (next) openSteps[next.id] = true
}

// ---- Active-slot derived helpers --------------------------------

const allAxes = CUSTOMER_PROFILE_BUILDER_VARIANT.axes
const axisIndex: Record<string, PrimitiveAxisConfig> = Object.fromEntries(
  allAxes.map((a) => [a.id, a])
)

function axisById(id: string): PrimitiveAxisConfig | undefined {
  return axisIndex[id]
}

function isConditionalGateMet(axis: PrimitiveAxisConfig): boolean {
  if (!axis.conditionalOn) return true
  const slot = slots[activeSlot.value]
  const gateValue = (slot.form as unknown as Record<string, string>)[axis.conditionalOn.axisId]
  return gateValue === axis.conditionalOn.valueId
}

function conditionalGateLabel(axis: PrimitiveAxisConfig): string {
  if (!axis.conditionalOn) return ''
  const gateAxis = axisById(axis.conditionalOn.axisId)
  const opt = (gateAxis?.options ?? []).find(
    (o) => o.id === axis.conditionalOn?.valueId
  )
  return opt?.label ?? axis.conditionalOn.valueId
}

function singleSelectValue(axisId: string): string {
  const slot = slots[activeSlot.value]
  return (slot.form as unknown as Record<string, string>)[axisId] ?? ''
}

function setSingleSelect(axisId: string, optionId: string): void {
  const slot = slots[activeSlot.value]
  ;(slot.form as unknown as Record<string, string>)[axisId] = optionId
  // When spending-capacity moves OFF tight, clear tight-budget-detail.
  if (axisId === 'spending-capacity' && optionId !== 'tight') {
    slot.form['tight-budget-detail'] = ''
  }
}

const activeSlotShoppingPicks = computed<string[]>(
  () => slots[activeSlot.value].shoppingPicks
)

function toggleShoppingPick(optionId: string): void {
  const slot = slots[activeSlot.value]
  const idx = slot.shoppingPicks.indexOf(optionId)
  if (idx === -1) slot.shoppingPicks.push(optionId)
  else slot.shoppingPicks.splice(idx, 1)
}

const activeSlotMotivationPrimary = computed<string>(
  () => slots[activeSlot.value].motivationPrimary
)
const activeSlotMotivationSecondary = computed<string>(
  () => slots[activeSlot.value].motivationSecondary
)

function setMotivationPrimary(value: string): void {
  const slot = slots[activeSlot.value]
  slot.motivationPrimary = value
  // If the new primary equals the secondary, clear the secondary so
  // students don't end up with the same motivation in both slots.
  if (slot.motivationSecondary === value) {
    slot.motivationSecondary = ''
  }
}

function setMotivationSecondary(value: string): void {
  slots[activeSlot.value].motivationSecondary = value
}

// ---- Step completion --------------------------------------------

function isAxisComplete(slot: SlotState, axisId: string): boolean {
  const axis = axisById(axisId)
  if (!axis) return true
  if (axis.conditionalOn) {
    const gateValue = (slot.form as unknown as Record<string, string>)[
      axis.conditionalOn.axisId
    ]
    if (gateValue !== axis.conditionalOn.valueId) {
      // Gate not met — axis is not required for this profile.
      return true
    }
  }
  if (axisId === 'shopping-media-behavior') {
    return slot.shoppingPicks.length >= (axis.minSelections ?? 1)
  }
  if (axisId === 'purchase-motivation') {
    return Boolean(slot.motivationPrimary)
  }
  if (!axis.required) {
    // Optional non-conditional axes count as complete regardless.
    return true
  }
  const value = (slot.form as unknown as Record<string, string>)[axisId]
  return Boolean(value)
}

function isStepComplete(step: StepConfig): boolean {
  const slot = slots[activeSlot.value]
  return step.axisIds.every((id) => isAxisComplete(slot, id))
}

// ---- Validation --------------------------------------------------

const requiredSingleSelects: (keyof FormState)[] = [
  'life-stage',
  'household-composition',
  'urbanicity',
  'spending-capacity',
  'housing-context',
  'education-occupation',
  'evidence-confidence'
]

function isSlotReady(slotId: SlotId): boolean {
  const slot = slots[slotId]
  for (const axis of requiredSingleSelects) {
    if (!slot.form[axis]) return false
  }
  if (slot.form['spending-capacity'] === 'tight' && !slot.form['tight-budget-detail']) {
    return false
  }
  if (slot.shoppingPicks.length < 1 || slot.shoppingPicks.length > 3) {
    return false
  }
  if (!slot.motivationPrimary) return false
  return true
}

const canAnalyzeActive = computed(() => isSlotReady(activeSlot.value))

const analyzeHint = computed(() => {
  if (canAnalyzeActive.value) return ''
  const slot = slots[activeSlot.value]
  const missing: string[] = []
  if (!slot.form['life-stage']) missing.push('life stage')
  if (!slot.form['household-composition']) missing.push('household composition')
  if (!slot.form.urbanicity) missing.push('urbanicity')
  if (!slot.form['spending-capacity']) missing.push('spending capacity')
  if (
    slot.form['spending-capacity'] === 'tight' &&
    !slot.form['tight-budget-detail']
  ) {
    missing.push('tight-budget detail')
  }
  if (!slot.form['housing-context']) missing.push('housing context')
  if (!slot.form['education-occupation']) missing.push('education / occupation')
  if (slot.shoppingPicks.length < 1)
    missing.push('1–3 shopping behaviors')
  if (!slot.motivationPrimary) missing.push('primary motivation')
  if (!slot.form['evidence-confidence']) missing.push('evidence confidence')
  return `Still needed: ${missing.join(', ')}.`
})

// ---- Slot-status badge ------------------------------------------

function slotBadgeText(slotId: SlotId): string {
  if (slots[slotId].result) return 'analyzed'
  if (isSlotReady(slotId)) return 'ready'
  // Any field touched at all?
  const slot = slots[slotId]
  const touched =
    Object.values(slot.form).some((v) => v !== '') ||
    slot.shoppingPicks.length > 0 ||
    slot.motivationPrimary !== ''
  return touched ? 'in progress' : 'not started'
}

function slotBadgeClass(slotId: SlotId): string {
  if (slots[slotId].result) return 'bg-green-100 text-green-800'
  if (isSlotReady(slotId)) return 'bg-amber-100 text-amber-800'
  return 'bg-stone-200 text-stone-700'
}

// ---- Classifier call --------------------------------------------

function buildSelections(
  slotId: SlotId
): CustomerProfilePrimitiveSelections | null {
  if (!isSlotReady(slotId)) return null
  const slot = slots[slotId]
  return {
    'life-stage': slot.form['life-stage'],
    'household-composition': slot.form['household-composition'],
    urbanicity: slot.form.urbanicity,
    'spending-capacity': slot.form['spending-capacity'],
    ...(slot.form['spending-capacity'] === 'tight'
      ? { 'tight-budget-detail': slot.form['tight-budget-detail'] }
      : {}),
    'housing-context': slot.form['housing-context'],
    'education-occupation': slot.form['education-occupation'],
    'shopping-media-behavior': [...slot.shoppingPicks],
    'purchase-motivation': {
      primary: slot.motivationPrimary,
      ...(slot.motivationSecondary
        ? { secondary: slot.motivationSecondary }
        : {})
    },
    'evidence-confidence': slot.form[
      'evidence-confidence'
    ] as CustomerProfilePrimitiveSelections['evidence-confidence']
  }
}

function analyze(): void {
  const selections = buildSelections(activeSlot.value)
  if (!selections) return
  // V1: no documentedEvidenceFlags surfaced in UI yet.
  slots[activeSlot.value].result = classifyCustomerProfile(selections, {})
  copyButtonLabels[activeSlot.value] = 'Copy draft starter'
}

// ---- Result helpers ---------------------------------------------

const activeSlotResult = computed<CustomerProfileClassifierOutput | null>(
  () => slots[activeSlot.value].result
)

function archetypeName(id?: string): string {
  if (!id) return ''
  const record =
    CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id as CustomerProfileArchetypeId]
  return record?.workingDisplayName ?? id
}

function archetypeSummary(id?: string): string {
  if (!id) return ''
  const record =
    CUSTOMER_PROFILE_ARCHETYPE_BY_ID[id as CustomerProfileArchetypeId]
  return record?.oneSentenceSummary ?? ''
}

function confidenceChipClass(band?: string): string {
  switch (band) {
    case 'high':
      return 'bg-green-100 text-green-800'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'low':
    default:
      return 'bg-stone-200 text-stone-700'
  }
}

// ---- Draft scaffold ---------------------------------------------

function motivationLabelById(id: string): string {
  if (!id) return ''
  const axis = axisById('purchase-motivation')
  const opt = (axis?.options ?? []).find((o) => o.id === id)
  return opt ? opt.label.toLowerCase() : id
}

function evidenceLabelById(id: string): string {
  if (!id) return ''
  const axis = axisById('evidence-confidence')
  const opt = (axis?.options ?? []).find((o) => o.id === id)
  return opt ? opt.label.toLowerCase() : id
}

function slotLabelOrder(slotId: SlotId): string {
  switch (slotId) {
    case 'primary':
      return 'primary'
    case 'secondary':
      return 'secondary'
    case 'tertiary':
      return 'tertiary'
  }
}

function slotDraftStarter(slotId: SlotId): string {
  const slot = slots[slotId]
  if (!slot.result || slot.result.status !== 'ready') return ''
  const primaryName = archetypeName(slot.result.primaryArchetypeId)
  const motivationLabel =
    motivationLabelById(slot.motivationPrimary) || '___'
  const evidenceLabel =
    evidenceLabelById(slot.form['evidence-confidence']) || '___'
  const top = (slot.result.topContributingSignals ?? []).slice(0, 3).map((s) =>
    s.toLowerCase()
  )
  const reasons =
    top.length === 0
      ? '___, ___, and ___'
      : top.length === 1
        ? top[0]!
        : top.length === 2
          ? `${top[0]} and ${top[1]}`
          : `${top[0]}, ${top[1]}, and ${top[2]}`
  const next = slot.result.whatToTestNext || '___'
  return [
    `Our ${slotLabelOrder(slotId)} customer may fit the ${primaryName} profile.`,
    `We think this because ${reasons}.`,
    `This customer may value ${motivationLabel}.`,
    `The strongest evidence we have is ${evidenceLabel}.`,
    `The biggest assumption we still need to test is ${next}`
  ].join(' ')
}

// ---- Combined draft (across all analyzed slots) -----------------

const analyzedSlotIds = computed<SlotId[]>(() =>
  slotIds.filter((id) => slots[id].result?.status === 'ready')
)

const combinedDraft = computed<string>(() => {
  const ids = analyzedSlotIds.value
  if (ids.length === 0) return ''

  // Per the brief format: per-slot "may fit" sentence, plus shared
  // strongest-evidence + biggest-assumption tail. The shared tail
  // uses the FIRST analyzed slot's evidence/assumption — that's the
  // simplest deterministic choice; teacher / curriculum lead can
  // refine later.
  const first = slots[ids[0]!]
  const evidenceLabel =
    evidenceLabelById(first.form['evidence-confidence']) || '___'
  const next = first.result?.whatToTestNext || '___'

  const sentences: string[] = []
  for (const id of ids) {
    const slot = slots[id]
    if (!slot.result || slot.result.status !== 'ready') continue
    const reasonsList = (slot.result.topContributingSignals ?? []).slice(0, 3)
    const reasons =
      reasonsList.length === 0
        ? '___'
        : reasonsList.map((s) => s.toLowerCase()).join('; ')
    sentences.push(
      `Our ${slotLabelOrder(id)} customer may fit the ${archetypeName(
        slot.result.primaryArchetypeId
      )} profile because ${reasons}.`
    )
  }

  return [
    ...sentences,
    `The strongest evidence we have is ${evidenceLabel}.`,
    `The biggest assumption we still need to test is ${next}.`
  ].join(' ')
})

async function copySingleDraft(slotId: SlotId): Promise<void> {
  const text = slotDraftStarter(slotId)
  if (!text) return
  await writeToClipboard(text, (label) => {
    copyButtonLabels[slotId] = label
  })
}

async function copyCombinedDraft(): Promise<void> {
  const text = combinedDraft.value
  if (!text) return
  await writeToClipboard(text, (label) => {
    combinedCopyLabel.value = label
  })
}

async function writeToClipboard(
  text: string,
  setLabel: (label: string) => void
): Promise<void> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text)
      setLabel('Copied ✓')
      window.setTimeout(() => {
        setLabel('Copy draft starter')
      }, 2000)
    } else {
      setLabel('Copy unavailable — select and copy manually')
    }
  } catch {
    setLabel('Copy failed — try again')
  }
}

// ---- Teacher-debug helpers --------------------------------------

const rankedDebugEntries = computed<{ id: string; score: number }[]>(() => {
  const scores = activeSlotResult.value?.teacherDebug?.scores
  if (!scores) return []
  return Object.entries(scores)
    .map(([id, score]) => ({ id, score: Math.round(Number(score)) }))
    .filter((e) => Number.isFinite(e.score))
    .sort((a, b) => b.score - a.score)
})

type CfsReason =
  | 'not-eligible'
  | 'selected-not-corroborated'
  | 'overlay-applied'
  | 'primary-applied'
  | 'eligible-not-selected'

const cfsReason = computed<CfsReason>(() => {
  const result = activeSlotResult.value
  const debug = result?.teacherDebug
  if (!debug) return 'not-eligible'
  if (!debug.causeMotivationSelected) return 'not-eligible'
  if (!debug.causeCorroborated) return 'selected-not-corroborated'
  if (result?.secondaryArchetypeId === 'cause-first-supporters') {
    return 'overlay-applied'
  }
  if (result?.primaryArchetypeId === 'cause-first-supporters') {
    return 'primary-applied'
  }
  return 'eligible-not-selected'
})

const cfsReasonLabel = computed<string>(() => {
  switch (cfsReason.value) {
    case 'not-eligible':
      return 'NOT ELIGIBLE'
    case 'selected-not-corroborated':
      return 'SELECTED BUT NOT CORROBORATED'
    case 'overlay-applied':
      return 'OVERLAY APPLIED'
    case 'primary-applied':
      return 'PRIMARY APPLIED'
    case 'eligible-not-selected':
      return 'ELIGIBLE BUT NOT CHOSEN'
  }
})

const cfsReasonClass = computed<string>(() => {
  switch (cfsReason.value) {
    case 'overlay-applied':
    case 'primary-applied':
      return 'inline-flex rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-800'
    case 'selected-not-corroborated':
      return 'inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900'
    default:
      return 'inline-flex rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-stone-700'
  }
})

const cfsReasonExplanation = computed<string>(() => {
  switch (cfsReason.value) {
    case 'not-eligible':
      return 'supporting-a-cause was not selected as primary or secondary motivation.'
    case 'selected-not-corroborated':
      return 'supporting-a-cause was selected but neither cause-driven shopping nor evidenceAboutCauseMotivation flag is present.'
    case 'overlay-applied':
      return 'CFS overlay attached as secondary (motivation + corroboration both present).'
    case 'primary-applied':
      return 'CFS as primary (rare path — no other archetype cleared the fit threshold).'
    case 'eligible-not-selected':
      return 'CFS was eligible but another archetype took both primary and secondary slots.'
  }
})
</script>
