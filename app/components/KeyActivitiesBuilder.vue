<!--
  Key Activities Builder (V1 pilot, BMC Ch. 4 only).

  PURPOSE
  -------
  Helps students name the 5–7 activities Renni Inc. must do well to
  operate as a student-run retail company — NOT a list of pop-up day
  tasks. The Business Model Canvas describes the BUSINESS; TechTown
  is one sales channel, Phoenix Nest is another possible channel, and
  the activities here should be the work that repeats cohort to cohort.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + clipboard. Local component state only. No Firestore
      writes, no AI calls, no /api/* requests, no automatic Working
      Draft writes.
    - Copy-only draft starter: students explicitly press a button to
      copy the generated text; the page never auto-saves into the
      section.
    - Mounts only when `section.keyActivities?.enabled` is true. V1
      ships this flag enabled only on Ch. 4 BMC's `key-activities`
      section.
    - Save / submit / approval / status / Customer Profile Builder /
      Teacher Debug behavior is unchanged — this builder lives next
      to the existing builders, not on top of them.
-->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

// ---- Activity catalog (curriculum-authored) ----------------------
//
// Five categories matching the brief. Each activity has a stable id
// and a short student-facing label. Curriculum lead can edit copy
// without touching component logic.

interface ActivityOption {
  id: string
  label: string
}

interface ActivityCategory {
  id: string
  label: string
  helperText: string
  activities: ActivityOption[]
}

const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: 'product',
    label: 'Product',
    helperText: 'The work that turns ideas into things you can sell.',
    activities: [
      { id: 'design-products', label: 'Design products' },
      { id: 'source-materials', label: 'Source apparel or materials' },
      { id: 'bake-prepare-goods', label: 'Bake or prepare goods' },
      { id: 'package-products', label: 'Package products' },
      { id: 'check-quality', label: 'Check product quality' }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    helperText: 'How the company runs day to day.',
    activities: [
      { id: 'track-inventory', label: 'Track inventory' },
      { id: 'prepare-sizes', label: 'Prepare sizes and quantities' },
      { id: 'set-up-displays', label: 'Set up displays' },
      { id: 'assign-team-roles', label: 'Assign team roles' },
      {
        id: 'document-handoff',
        label: 'Document handoff steps for next cohort'
      }
    ]
  },
  {
    id: 'sales-channels',
    label: 'Sales channels',
    helperText:
      'Where the company sells. TechTown is one channel; Phoenix Nest is another possible channel; future events are others still.',
    activities: [
      { id: 'sell-techtown', label: 'Sell at TechTown' },
      { id: 'pitch-phoenix-nest', label: 'Pitch Phoenix Nest' },
      {
        id: 'sell-school-events',
        label: 'Sell through school or community events'
      },
      {
        id: 'track-channel-interest',
        label: 'Track customer interest by channel'
      }
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    helperText: 'How customers learn about Renni Inc. and what it sells.',
    activities: [
      { id: 'create-signage', label: 'Create signage' },
      { id: 'post-content', label: 'Post content' },
      { id: 'explain-brand-story', label: 'Explain the brand story' },
      { id: 'promote-launch', label: 'Promote launch products' }
    ]
  },
  {
    id: 'learning',
    label: 'Learning and improvement',
    helperText:
      'How the company gets better between cycles so the next cohort starts ahead.',
    activities: [
      { id: 'collect-feedback', label: 'Collect customer feedback' },
      { id: 'track-sales-results', label: 'Track sales results' },
      { id: 'review-pricing', label: 'Review pricing' },
      { id: 'decide-improvements', label: 'Decide what to improve next' }
    ]
  }
]

// ---- Local state -------------------------------------------------

interface SelectedActivity {
  id: string
  label: string
  reason: string
}

const selectedById = reactive<Record<string, SelectedActivity>>({})
const customLabel = ref<string>('')
const customReason = ref<string>('')
const copyButtonLabel = ref<string>('Copy draft starter')

const MIN_PICKS = 5
const MAX_PICKS = 7

const selectedCount = computed<number>(
  () => Object.keys(selectedById).length
)

const selectedActivities = computed<SelectedActivity[]>(() =>
  Object.values(selectedById)
)

const canCopy = computed<boolean>(() => {
  if (selectedCount.value < MIN_PICKS) return false
  if (selectedCount.value > MAX_PICKS) return false
  return true
})

const hint = computed<string>(() => {
  if (selectedCount.value < MIN_PICKS) {
    return `Pick ${MIN_PICKS - selectedCount.value} more — aim for ${MIN_PICKS}–${MAX_PICKS} repeatable business activities.`
  }
  if (selectedCount.value > MAX_PICKS) {
    return `That is more than ${MAX_PICKS}. Drop ${selectedCount.value - MAX_PICKS} so the list stays focused.`
  }
  return `${selectedCount.value} picked — within the ${MIN_PICKS}–${MAX_PICKS} target.`
})

function isSelected(activityId: string): boolean {
  return Boolean(selectedById[activityId])
}

function toggleActivity(opt: ActivityOption): void {
  if (selectedById[opt.id]) {
    delete selectedById[opt.id]
    return
  }
  if (selectedCount.value >= MAX_PICKS) {
    // Soft-cap. The chip stays unselected; the hint message tells the
    // student to drop one if they want to add another.
    return
  }
  selectedById[opt.id] = {
    id: opt.id,
    label: opt.label,
    reason: ''
  }
}

function addCustomActivity(): void {
  const label = customLabel.value.trim()
  if (!label) return
  if (selectedCount.value >= MAX_PICKS) return
  // Use a stable but custom-prefixed id so it never collides with a
  // catalog activity if curriculum adds one with the same name later.
  const id = `custom:${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  selectedById[id] = {
    id,
    label,
    reason: customReason.value.trim()
  }
  customLabel.value = ''
  customReason.value = ''
}

function removeActivity(id: string): void {
  delete selectedById[id]
}

// ---- Draft starter -----------------------------------------------

const draftStarter = computed<string>(() => {
  const picks = selectedActivities.value
  if (picks.length === 0) {
    return 'Renni Inc.\'s key activities are ____. These activities matter because ____. TechTown is one sales channel, while Phoenix Nest is another possible retail channel, so the company needs repeatable activities that work beyond one event.'
  }
  const list = picks
    .map((p) => p.label.toLowerCase())
    .join(picks.length === 2 ? ' and ' : ', ')
  const reasons = picks
    .filter((p) => p.reason.trim().length > 0)
    .map((p) => `${p.label.toLowerCase()} matters because ${p.reason.trim()}`)
    .join('; ')
  const reasonsClause = reasons
    ? `These activities matter because ${reasons}.`
    : 'These activities matter because ____ (add one short reason for each).'
  return [
    `Renni Inc.'s key activities are ${list}.`,
    reasonsClause,
    'TechTown is one sales channel, while Phoenix Nest is another possible retail channel, so the company needs repeatable activities that work beyond one event.'
  ].join(' ')
})

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
</script>

<template>
  <section
    class="rounded-lg border border-amber-300 bg-amber-50/30 p-4 text-sm shadow-sm flex flex-col gap-4 min-w-0"
    aria-labelledby="kab-heading"
  >
    <header class="space-y-1">
      <p class="text-[11px] uppercase tracking-wide text-amber-800">
        Builder
      </p>
      <h3 id="kab-heading" class="text-base font-semibold text-amber-900">
        Key Activities Builder
        <span
          class="ml-2 inline-flex items-center rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900"
        >
          Pilot
        </span>
      </h3>
      <p class="text-xs text-amber-900">
        Pick 5–7 activities Renni Inc. must do well to operate as a
        student-run retail company. TechTown is one sales channel.
        Phoenix Nest is another possible retail channel. Your answer
        should describe the business, not just one event.
      </p>
    </header>

    <!-- ===== Categorized activity chip selector ===== -->
    <div class="space-y-3">
      <fieldset
        v-for="cat in ACTIVITY_CATEGORIES"
        :key="cat.id"
        class="rounded border border-stone-200 bg-white p-3"
      >
        <legend class="px-1 text-xs font-semibold text-stone-900">
          {{ cat.label }}
        </legend>
        <p class="mb-2 text-[11px] text-stone-600 break-words">
          {{ cat.helperText }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in cat.activities"
            :key="opt.id"
            type="button"
            class="rounded border px-2 py-1 text-xs font-medium transition-colors break-words"
            :class="
              isSelected(opt.id)
                ? 'border-amber-500 bg-amber-100 text-amber-900'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50 disabled:opacity-50'
            "
            :disabled="!isSelected(opt.id) && selectedCount >= MAX_PICKS"
            @click="toggleActivity(opt)"
          >
            {{ isSelected(opt.id) ? '✓ ' : '+ ' }}{{ opt.label }}
          </button>
        </div>
      </fieldset>

      <!-- Custom write-in -->
      <fieldset class="rounded border border-stone-200 bg-white p-3">
        <legend class="px-1 text-xs font-semibold text-stone-900">
          Add your own (optional)
        </legend>
        <p class="mb-2 text-[11px] text-stone-600">
          One custom activity at a time. Make it specific to a Renni
          Inc. activity — not a single pop-up task.
        </p>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            v-model="customLabel"
            type="text"
            placeholder="e.g., Manage seasonal product drops"
            class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
            :disabled="selectedCount >= MAX_PICKS"
          />
          <input
            v-model="customReason"
            type="text"
            placeholder="Short reason it matters (optional)"
            class="w-full rounded border border-stone-300 bg-white p-1 text-xs"
            :disabled="selectedCount >= MAX_PICKS"
          />
          <button
            type="button"
            class="shrink-0 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            :disabled="!customLabel.trim() || selectedCount >= MAX_PICKS"
            @click="addCustomActivity"
          >
            Add
          </button>
        </div>
      </fieldset>
    </div>

    <!-- ===== Selected list (with reasons) ===== -->
    <div
      v-if="selectedActivities.length > 0"
      class="rounded border border-stone-200 bg-white p-3"
    >
      <p class="text-[11px] font-semibold uppercase tracking-wide text-stone-700">
        Your picks ({{ selectedCount }} of {{ MAX_PICKS }})
      </p>
      <ul class="mt-2 space-y-2">
        <li
          v-for="pick in selectedActivities"
          :key="pick.id"
          class="rounded border border-stone-200 bg-stone-50/40 p-2"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="text-xs font-semibold text-stone-900 break-words">
              {{ pick.label }}
            </p>
            <button
              type="button"
              class="text-[11px] text-stone-500 hover:text-rose-700"
              @click="removeActivity(pick.id)"
            >
              Remove
            </button>
          </div>
          <label class="mt-1 block text-[11px] text-stone-600">
            Why this matters for Renni Inc. (one short line)
            <input
              v-model="pick.reason"
              type="text"
              placeholder="e.g., Lets the next cohort run a launch without re-learning sourcing"
              class="mt-1 w-full rounded border border-stone-300 bg-white p-1 text-xs"
            />
          </label>
        </li>
      </ul>
    </div>

    <p
      class="text-[11px] italic"
      :class="canCopy ? 'text-emerald-800' : 'text-amber-800'"
    >
      {{ hint }}
    </p>

    <!-- ===== Draft starter + copy ===== -->
    <div class="rounded border border-stone-200 bg-stone-50 p-3">
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700">
        Draft starter
      </p>
      <p class="whitespace-pre-line text-xs text-stone-800 break-words">
        {{ draftStarter }}
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
          :disabled="!canCopy"
          @click="copyDraftStarter"
        >
          {{ copyButtonLabel }}
        </button>
        <span class="text-[11px] text-stone-500">
          Copies to clipboard. Paste into Working Draft and edit it in
          your own words. The builder does not write into the section
          for you.
        </span>
      </div>
    </div>
  </section>
</template>
