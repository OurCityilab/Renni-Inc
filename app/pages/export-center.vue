<script setup lang="ts">
// /export-center — Final Presentation Readiness Sprint 1 V1 Export
// Center. Markdown / CSV / JSON snapshots of presentation-relevant
// data. Pure read-only.
//
// Posture (do not relax):
//   - never persists exports anywhere (no Firestore, no log)
//   - never fetches anything (no Drive, no OAuth, no scrape)
//   - clipboard / Blob download only
//   - the live app remains the source of truth — exports are
//     snapshots
//   - no DOCX/PPTX in V1; markdown + CSV
//
// Each export card has the same shape: title, short description,
// preview area, copy button, download button, snapshot disclaimer.

import { computed, ref } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { getTemplateStudio } from '~/data/templateStudios'
import {
  aggregateAdvisorSignals
} from '~/utils/cSuiteAdvisor'
import {
  buildAdvisorActionPlanMd,
  buildDesignBriefMd,
  buildPhoenixNestBriefMd,
  buildPlaybookChapterMd,
  buildPresentationOutlineMd,
  buildPricingSummaryCsv,
  type DesignOutputType
} from '~/utils/exportCenter'

const deliverables = useDeliverables()
const tasks = useTasks()
const outputs = useDeliverableOutputs()

const { data: deliverableList, loading: deliverablesLoading } =
  deliverables.watchList()
const { data: taskList, loading: tasksLoading } = tasks.watchAll()
const studioBackedIds = computed<string[]>(() =>
  deliverableList.value
    .filter((d) => Boolean(getTemplateStudio(d.id)))
    .map((d) => d.id)
)
const { data: outputsByDeliverableId, loading: outputsLoading } =
  outputs.watchManyOutputs(studioBackedIds)

const loading = computed(
  () =>
    deliverablesLoading.value ||
    tasksLoading.value ||
    outputsLoading.value
)

const inputs = computed(() => ({
  deliverables: deliverableList.value,
  tasks: taskList.value,
  outputs: outputsByDeliverableId.value,
  studioResolver: (d: { id: string }) => getTemplateStudio(d.id)
}))

const presentationOutline = computed(() =>
  buildPresentationOutlineMd(inputs.value)
)
const phoenixNestBrief = computed(() =>
  buildPhoenixNestBriefMd(inputs.value)
)
const pricingCsv = computed(() => buildPricingSummaryCsv(inputs.value))

const advisorSignals = computed(() =>
  aggregateAdvisorSignals(inputs.value)
)
const advisorActionPlan = computed(() =>
  buildAdvisorActionPlanMd(advisorSignals.value)
)

// Per-chapter Playbook export selector. Defaults to the first
// studio-backed deliverable.
const studioBackedDeliverables = computed(() =>
  deliverableList.value.filter((d) => Boolean(getTemplateStudio(d.id)))
)
const selectedDeliverableId = ref<string>('')
const selectedDeliverable = computed(() => {
  const list = studioBackedDeliverables.value
  if (!list.length) return null
  if (!selectedDeliverableId.value) {
    selectedDeliverableId.value = list[0].id
    return list[0]
  }
  return list.find((d) => d.id === selectedDeliverableId.value) ?? list[0]
})
const playbookChapterMd = computed(() => {
  const d = selectedDeliverable.value
  if (!d) return ''
  return buildPlaybookChapterMd(
    d,
    getTemplateStudio(d.id),
    outputsByDeliverableId.value[d.id] ?? null
  )
})

// Design brief output selector.
const DESIGN_OPTIONS: DesignOutputType[] = [
  'one-pager',
  'slide',
  'signage',
  'pitch deck',
  'product sheet'
]
const selectedDesignOutput = ref<DesignOutputType>('one-pager')
const designBriefMd = computed(() =>
  buildDesignBriefMd(inputs.value, selectedDesignOutput.value)
)

// ---- copy + download helpers ----
const copiedKey = ref<string | null>(null)
async function copy(key: string, content: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(content)
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 1500)
  } catch {
    // Best-effort — students can select the textarea content too.
  }
}
function download(filename: string, content: string, mime: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-4 px-3 py-4">
    <NuxtLink to="/" class="text-sm text-phoenix-700 hover:underline">
      ← Home
    </NuxtLink>

    <header class="card space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">Export Center</p>
      <h1 class="text-2xl font-semibold text-neutral-900">
        Snapshots for the May 12 / 15 final presentation
      </h1>
      <p class="text-sm text-neutral-700">
        Copy or download presentation-ready snapshots in plain text. Markdown for
        narrative, CSV for tabular pricing.
      </p>
      <p class="text-xs italic text-neutral-500">
        Exports are snapshots. Renni Command Center remains the source of truth.
        No Google Drive integration. No URL fetching. No AI.
      </p>
    </header>

    <p v-if="loading" class="text-sm italic text-neutral-500">
      Loading export data…
    </p>

    <!-- 1. Final presentation outline (Markdown) -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            1. Final presentation outline
          </p>
          <p class="text-xs text-neutral-500">
            Chapter-by-chapter Playbook outline with status, readiness band, and
            current finalText where present.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('outline', presentationOutline)"
          >{{ copiedKey === 'outline' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-final-presentation-outline.md', presentationOutline, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="presentationOutline"
      />
    </section>

    <!-- 2. Phoenix Nest carry pitch brief -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            2. Phoenix Nest carry pitch brief
          </p>
          <p class="text-xs text-neutral-500">
            Compact carry-pitch reminder built from current pricing strategy and
            target segment.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('phoenix', phoenixNestBrief)"
          >{{ copiedKey === 'phoenix' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-phoenix-nest-brief.md', phoenixNestBrief, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="phoenixNestBrief"
      />
    </section>

    <!-- 3. Pricing summary CSV -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            3. Pricing summary (CSV)
          </p>
          <p class="text-xs text-neutral-500">
            One row per studio section that has any pricing strategy data. Opens
            cleanly in Sheets / Excel.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('pricing-csv', pricingCsv)"
          >{{ copiedKey === 'pricing-csv' ? 'Copied ✓' : 'Copy CSV' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-pricing-summary.csv', pricingCsv, 'text/csv')"
          >Download .csv</button>
        </div>
      </header>
      <textarea
        readonly
        rows="6"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="pricingCsv"
      />
    </section>

    <!-- 4. Advisor action plan -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            4. C-Suite Advisor action plan
          </p>
          <p class="text-xs text-neutral-500">
            Snapshot of advisor signals grouped by Stops Submit / Blocked Task /
            Major Issue / Needs Action / Check Soon / FYI.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('advisor', advisorActionPlan)"
          >{{ copiedKey === 'advisor' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-advisor-action-plan.md', advisorActionPlan, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="advisorActionPlan"
      />
    </section>

    <!-- 5. Playbook chapter export -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          5. Playbook chapter export
        </p>
        <p class="text-xs text-neutral-500">
          Export one studio chapter at a time — finalText with evidence links and
          structured evidence inline.
        </p>
      </header>
      <div class="flex flex-wrap items-end gap-2">
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Chapter</span>
          <select
            v-model="selectedDeliverableId"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm sm:w-80"
          >
            <option v-for="d in studioBackedDeliverables" :key="d.id" :value="d.id">
              {{ getTemplateStudio(d.id)?.title || d.title }}
            </option>
          </select>
        </label>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            :disabled="!selectedDeliverable"
            @click="copy('playbook', playbookChapterMd)"
          >{{ copiedKey === 'playbook' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            :disabled="!selectedDeliverable"
            @click="download(`renni-${selectedDeliverable?.id || 'chapter'}.md`, playbookChapterMd, 'text/markdown')"
          >Download .md</button>
        </div>
      </div>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="playbookChapterMd"
      />
    </section>

    <!-- 6. Claude design brief -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          6. Claude design brief
        </p>
        <p class="text-xs text-neutral-500">
          A copy-only brief for Claude (or a human designer). Pulls product,
          segment, price/margin, and visual notes from the current state.
        </p>
      </header>
      <div class="flex flex-wrap items-end gap-2">
        <label class="text-xs">
          <span class="font-medium text-neutral-700">Desired output</span>
          <select
            v-model="selectedDesignOutput"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm sm:w-60"
          >
            <option v-for="opt in DESIGN_OPTIONS" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </label>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('design', designBriefMd)"
          >{{ copiedKey === 'design' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download(`renni-design-brief-${selectedDesignOutput.replace(/\s+/g, '-')}.md`, designBriefMd, 'text/markdown')"
          >Download .md</button>
        </div>
      </div>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="designBriefMd"
      />
    </section>

    <p class="text-[11px] italic text-neutral-500">
      Read-only exports. No Firestore writes. The Command Center remains the
      source of truth.
    </p>
  </main>
</template>
