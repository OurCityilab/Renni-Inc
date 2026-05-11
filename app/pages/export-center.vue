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
import { getTemplateStudioForDeliverable } from '~/data/templateStudios'
import type { Deliverable } from '~/types/models'
import {
  aggregateAdvisorSignals
} from '~/utils/cSuiteAdvisor'
import {
  buildAdvisorActionPlanMd,
  buildDesignBriefMd,
  buildFinalPresentationBundleMd,
  buildFinalPresentationCoachPromptMd,
  buildPhoenixNestBriefMd,
  buildPlaybookChapterMd,
  buildPresentationOutlineMd,
  buildPricingSummaryCsv,
  type DesignOutputType
} from '~/utils/exportCenter'
import {
  buildFullPlaybookMarkdown,
  buildPlaybookEvidenceCsv,
  buildPlaybookSectionStatusCsv,
  fullPlaybookFilename,
  chapterFilename,
  deliverableFilename,
  type ChapterExportInput,
  type FullPlaybookExportInput
} from '~/utils/playbookExport'
import {
  buildDeliverablesCsv,
  buildGoalsCsv,
  buildPricingScenariosCsv,
  buildTasksCsv,
  buildTransactionsCsv
} from '~/utils/operationsExport'
import { downloadCsv } from '~/utils/csvExport'
import { useGoals } from '~/composables/useGoals'
import { usePricing } from '~/composables/usePricing'
import { useTransactions } from '~/composables/useTransactions'
import IntelligenceSyncPanel from '~/components/IntelligenceSyncPanel.vue'

const deliverables = useDeliverables()
const tasks = useTasks()
const outputs = useDeliverableOutputs()
const goals = useGoals()
const pricing = usePricing()
const transactions = useTransactions()

const { data: deliverableList, loading: deliverablesLoading } =
  deliverables.watchList()
const { data: taskList, loading: tasksLoading } = tasks.watchAll()
const { data: goalsList, loading: goalsLoading } = goals.watchList()
const { data: pricingList, loading: pricingLoading } = pricing.watchList()
const { data: transactionsList, loading: transactionsLoading } =
  transactions.watchList()
const studioBackedIds = computed<string[]>(() =>
  deliverableList.value
    .filter((d) => Boolean(getTemplateStudioForDeliverable(d)))
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
  studioResolver: (d: Deliverable) => getTemplateStudioForDeliverable(d)
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
  deliverableList.value.filter((d) => Boolean(getTemplateStudioForDeliverable(d)))
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
    getTemplateStudioForDeliverable(d),
    outputsByDeliverableId.value[d.id] ?? null
  )
})

// Full current Playbook export. Groups every studio-backed deliverable
// by chapter and builds one combined Markdown document via the shared
// helper. Mode='export' so the fallback chain (finalText → draftText →
// sourceNotes → missing) is applied uniformly; incomplete chapters
// remain included with explicit fallback labels.
const fullPlaybookExportedAt = ref<string>('')
function captureExportTimestamp(): string {
  const now = new Date()
  fullPlaybookExportedAt.value = now.toISOString()
  return fullPlaybookExportedAt.value
}
const fullPlaybookGroupedChapters = computed(() => {
  const grouped = new Map<
    number,
    { chapter: number; title: string; deliverables: typeof studioBackedDeliverables.value }
  >()
  for (const d of studioBackedDeliverables.value) {
    const chapter = Number(d.chapter)
    if (!chapter) continue
    const studio = getTemplateStudioForDeliverable(d)
    const title = studio?.title || d.title
    const arr = grouped.get(chapter)
    if (arr) {
      arr.deliverables.push(d)
    } else {
      grouped.set(chapter, { chapter, title, deliverables: [d] })
    }
  }
  return Array.from(grouped.values()).sort((a, b) => a.chapter - b.chapter)
})
const fullPlaybookInput = computed<FullPlaybookExportInput>(() => {
  const chapters: ChapterExportInput[] = fullPlaybookGroupedChapters.value.map(
    (ch) => ({
      chapter: ch.chapter,
      title: ch.title,
      deliverables: ch.deliverables.map((d) => ({
        deliverable: d,
        studio: getTemplateStudioForDeliverable(d),
        output: outputsByDeliverableId.value[d.id] ?? null
      }))
    })
  )
  return { chapters }
})
const fullPlaybookMd = computed(() =>
  buildFullPlaybookMarkdown(fullPlaybookInput.value, {
    mode: 'export',
    exportedAt: fullPlaybookExportedAt.value || null
  })
)

// --- CSV builders driven off the same fullPlaybookInput so Markdown
// and CSV stay in lockstep. Pure: never mutates Firestore.
const sectionStatusCsv = computed(() =>
  buildPlaybookSectionStatusCsv(fullPlaybookInput.value, { mode: 'export' })
)
const evidenceCsv = computed(() =>
  buildPlaybookEvidenceCsv(fullPlaybookInput.value, { mode: 'export' })
)
const deliverablesCsv = computed(() =>
  buildDeliverablesCsv(deliverableList.value)
)
const tasksCsv = computed(() =>
  buildTasksCsv({
    tasks: taskList.value,
    deliverables: deliverableList.value.map((d) => ({
      id: d.id,
      title: d.title
    }))
  })
)
const goalsCsv = computed(() => buildGoalsCsv(goalsList.value))
const pricingCsvFile = computed(() => buildPricingScenariosCsv(pricingList.value))
const transactionsCsv = computed(() =>
  buildTransactionsCsv(transactionsList.value)
)

const tablesLoading = computed(
  () =>
    loading.value ||
    goalsLoading.value ||
    pricingLoading.value ||
    transactionsLoading.value
)

// Sprint 2 — Final Presentation Coach prompt + Bundle exports.
// Coach prompt scope: defaults to "whole program"; the student can
// scope to a single chapter using the existing Playbook chapter
// selector.
const coachScope = ref<'all' | 'one'>('all')
const coachPromptMd = computed(() =>
  buildFinalPresentationCoachPromptMd(
    inputs.value,
    advisorSignals.value,
    coachScope.value === 'one' ? selectedDeliverableId.value || null : null
  )
)
const bundleMd = computed(() =>
  buildFinalPresentationBundleMd(
    inputs.value,
    advisorSignals.value,
    selectedDesignOutput.value
  )
)

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
        Exports are snapshots. Re-export after changing source notes, pricing,
        segments, or final text. Renni Command Center remains the source of
        truth. No Google Drive integration. No URL fetching. No in-app AI here.
      </p>
      <p class="text-xs italic text-neutral-500">
        AI coach prompts are copy-only unless you use the in-app critique
        button. AI can coach and ask questions, but it cannot approve, submit,
        or invent missing evidence.
      </p>
    </header>

    <p v-if="loading" class="text-sm italic text-neutral-500">
      Loading export data…
    </p>

    <!-- Intelligence Sync — show what's missing before exporting. -->
    <IntelligenceSyncPanel
      :deliverables="deliverableList"
      :tasks="taskList"
      :outputs="outputsByDeliverableId"
      :advisor-signals="advisorSignals"
      :loading="loading"
    />

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
            Snapshot of advisor signals grouped by Stuck / Action today /
            Look at soon / All good.
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

    <!-- 4a. Print-ready Playbook entry point -->
    <section class="card space-y-2 border-phoenix-200 bg-phoenix-50/30">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
            Print-ready Playbook
          </p>
          <p class="text-xs text-neutral-700">
            Open a polished, browser-printable Final Submission Mode of
            the entire Playbook. Use your browser's print dialog and
            choose Save as PDF for a final-project-ready document.
          </p>
          <p class="text-[11px] italic text-neutral-500">
            Read-only. No Firestore writes, no draft-into-final
            promotion, no approval changes.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <NuxtLink
            to="/playbook/print"
            class="rounded border border-phoenix-400 bg-phoenix-600 px-2 py-1 font-medium text-white hover:bg-phoenix-700"
          >Open print-ready Playbook</NuxtLink>
        </div>
      </header>
    </section>

    <!-- 4b. Full current Playbook export -->
    <section class="card space-y-2 border-phoenix-200 bg-phoenix-50/30">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
            Full current Playbook export
          </p>
          <p class="text-xs text-neutral-700">
            One Markdown document covering every studio-backed chapter,
            including chapters that aren't finished yet.
          </p>
          <p class="text-[11px] italic text-neutral-500">
            This export reflects the current saved state. Draft and source-note
            fallback may appear where final Playbook text is missing.
            Approval and readiness are not changed.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="captureExportTimestamp(); copy('full-playbook', fullPlaybookMd)"
          >{{ copiedKey === 'full-playbook' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download(
              fullPlaybookFilename(captureExportTimestamp(), 'export'),
              fullPlaybookMd,
              'text/markdown'
            )"
          >Download .md</button>
        </div>
      </header>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="fullPlaybookMd"
      />
    </section>

    <!-- 4c. Table exports (CSV) -->
    <section class="card space-y-3">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Table exports
        </p>
        <p class="text-xs text-neutral-700">
          One-row-per-item CSVs for the Playbook tables (section status,
          evidence) and operations tables (deliverables, tasks, goals,
          pricing, transactions). Open cleanly in Sheets / Excel /
          Numbers.
        </p>
        <p class="text-[11px] italic text-neutral-500">
          CSV exports are for review, final project documentation, and
          instructor handoff. They exclude unnecessary internal IDs by
          default and never mutate Firestore.
        </p>
      </header>

      <div class="space-y-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          Playbook tables
        </p>
        <ul class="grid gap-2 md:grid-cols-2">
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Section status CSV</p>
            <p class="text-[11px] text-neutral-600">
              One row per section. Includes incomplete sections and
              fallback content-source labels.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="tablesLoading"
                @click="downloadCsv('renni-playbook-section-status.csv', sectionStatusCsv)"
              >Download .csv</button>
              <span
                v-if="!fullPlaybookInput.chapters.length && !tablesLoading"
                class="text-amber-800"
              >No studio-backed chapters loaded yet — CSV will contain headers only.</span>
            </div>
          </li>
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Evidence CSV</p>
            <p class="text-[11px] text-neutral-600">
              One row per evidence item. Includes linked evidence and
              structured evidence.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="tablesLoading"
                @click="downloadCsv('renni-playbook-evidence.csv', evidenceCsv)"
              >Download .csv</button>
            </div>
          </li>
        </ul>
      </div>

      <div class="space-y-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
          Operations tables
        </p>
        <ul class="grid gap-2 md:grid-cols-2">
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Deliverables CSV</p>
            <p class="text-[11px] text-neutral-600">
              {{ deliverableList.length }} deliverable<span v-if="deliverableList.length !== 1">s</span> loaded.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="deliverablesLoading"
                @click="downloadCsv('renni-deliverables.csv', deliverablesCsv)"
              >Download .csv</button>
              <span
                v-if="!deliverableList.length && !deliverablesLoading"
                class="text-amber-800"
              >No deliverables loaded — CSV will contain headers only.</span>
            </div>
          </li>
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Tasks CSV</p>
            <p class="text-[11px] text-neutral-600">
              {{ taskList.length }} task<span v-if="taskList.length !== 1">s</span> loaded.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="tasksLoading || deliverablesLoading"
                @click="downloadCsv('renni-tasks.csv', tasksCsv)"
              >Download .csv</button>
              <span
                v-if="!taskList.length && !tasksLoading"
                class="text-amber-800"
              >No tasks loaded — CSV will contain headers only.</span>
            </div>
          </li>
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Goals / KPIs CSV</p>
            <p class="text-[11px] text-neutral-600">
              {{ goalsList.length }} goal<span v-if="goalsList.length !== 1">s</span> loaded.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="goalsLoading"
                @click="downloadCsv('renni-goals.csv', goalsCsv)"
              >Download .csv</button>
              <span
                v-if="!goalsList.length && !goalsLoading"
                class="text-amber-800"
              >No goals loaded — CSV will contain headers only.</span>
            </div>
          </li>
          <li class="rounded border border-neutral-200 p-2">
            <p class="text-xs font-medium text-neutral-900">Pricing scenarios CSV</p>
            <p class="text-[11px] text-neutral-600">
              {{ pricingList.length }} scenario<span v-if="pricingList.length !== 1">s</span> loaded. Numbers reflect current saved inputs.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="pricingLoading"
                @click="downloadCsv('renni-pricing-scenarios.csv', pricingCsvFile)"
              >Download .csv</button>
              <span
                v-if="!pricingList.length && !pricingLoading"
                class="text-amber-800"
              >No pricing scenarios loaded — CSV will contain headers only.</span>
            </div>
          </li>
          <li class="rounded border border-neutral-200 p-2 md:col-span-2">
            <p class="text-xs font-medium text-neutral-900">Pop-up transactions CSV</p>
            <p class="text-[11px] text-neutral-600">
              {{ transactionsList.length }} transaction<span v-if="transactionsList.length !== 1">s</span> in the ledger. Operational export only — not a POS / refund / tax record.
            </p>
            <div class="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50 disabled:opacity-50"
                :disabled="transactionsLoading"
                @click="downloadCsv('renni-popup-transactions.csv', transactionsCsv)"
              >Download .csv</button>
              <span
                v-if="!transactionsList.length && !transactionsLoading"
                class="text-amber-800"
              >No transactions yet — CSV will contain headers only.</span>
            </div>
          </li>
        </ul>
      </div>
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
              {{ getTemplateStudioForDeliverable(d)?.title || d.title }}
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
            @click="selectedDeliverable && download(
              chapterFilename({
                chapter: selectedDeliverable.chapter,
                title: getTemplateStudioForDeliverable(selectedDeliverable)?.title || selectedDeliverable.title,
                deliverables: []
              }),
              playbookChapterMd,
              'text/markdown'
            )"
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
      <p class="text-[11px] italic text-neutral-500">
        Paste this into Claude Design or hand to a human designer.
      </p>
    </section>

    <!-- 7. Final Presentation Coach prompt (Sprint 2) -->
    <section class="card space-y-2 border-phoenix-200 bg-phoenix-50/30">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
          7. Final Presentation Coach prompt
        </p>
        <p class="text-xs text-neutral-700">
          Copy this entire prompt into Claude / ChatGPT / another LLM. It will
          critique what is on file in Renni Command Center against the May 12 / 15
          final presentation. Do not paste any LLM response back into the app
          without student review.
        </p>
        <p class="text-[11px] italic text-neutral-500">
          AI is a coach, not an approver. Renni Command Center never sends this
          prompt anywhere — copy / paste only.
        </p>
      </header>
      <div class="flex flex-wrap items-end gap-2">
        <fieldset class="text-xs">
          <legend class="font-medium text-neutral-700">Scope</legend>
          <label class="mr-3 inline-flex items-center gap-1">
            <input type="radio" :value="'all'" v-model="coachScope" />
            <span>Whole program</span>
          </label>
          <label class="inline-flex items-center gap-1">
            <input type="radio" :value="'one'" v-model="coachScope" />
            <span>Selected chapter only</span>
          </label>
        </fieldset>
        <label v-if="coachScope === 'one'" class="text-xs">
          <span class="font-medium text-neutral-700">Chapter</span>
          <select
            v-model="selectedDeliverableId"
            class="mt-0.5 w-full rounded border border-neutral-300 p-1.5 text-sm sm:w-80"
          >
            <option v-for="d in studioBackedDeliverables" :key="d.id" :value="d.id">
              {{ getTemplateStudioForDeliverable(d)?.title || d.title }}
            </option>
          </select>
        </label>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('coach', coachPromptMd)"
          >{{ copiedKey === 'coach' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-final-presentation-coach-prompt.md', coachPromptMd, 'text/markdown')"
          >Download .md</button>
        </div>
      </div>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="coachPromptMd"
      />
    </section>

    <!-- 8. Final presentation bundle (Sprint 2) -->
    <section class="card space-y-2 border-phoenix-200 bg-phoenix-50/30">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
            8. Final presentation bundle
          </p>
          <p class="text-xs text-neutral-700">
            One markdown file combining the outline, Phoenix Nest brief, advisor
            action plan, every chapter with finalText, and the Claude design brief.
          </p>
          <p class="text-[11px] italic text-neutral-500">
            Paste into Google Docs as an outline; the bundle keeps headings and bullets.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('bundle', bundleMd)"
          >{{ copiedKey === 'bundle' ? 'Copied ✓' : 'Copy markdown' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-final-presentation-bundle.md', bundleMd, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <textarea
        readonly
        rows="10"
        class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 font-mono text-[11px] leading-snug"
        :value="bundleMd"
      />
    </section>

    <p class="text-[11px] italic text-neutral-500">
      Read-only exports. No Firestore writes. The Command Center remains the
      source of truth.
    </p>
  </main>
</template>
