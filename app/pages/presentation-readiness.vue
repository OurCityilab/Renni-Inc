<script setup lang="ts">
// /presentation-readiness — Sprint 1 KPI tracker for the May 12/15
// final presentation.
//
// Read-only. Reuses every existing helper (no Firestore writes,
// no AI, no autosave, no submit-gate change, no Playbook readiness
// change, no rule change). Aggregates:
//   - chapter readiness band (ready / almost / at_risk / not_started)
//   - chief metrics (top signals per role)
//   - cross-cutting task health
// All derived deterministically from existing collections.

import { computed } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { getTemplateStudio } from '~/data/templateStudios'
import { buildPresentationReadiness } from '~/utils/presentationReadiness'
import {
  DISPLAY_LABEL_CHIP_CLASS,
  getAdvisorDisplayLabel
} from '~/utils/advisorDisplay'
import type { ChapterReadinessRow } from '~/utils/presentationReadiness'
import IntelligenceSyncPanel from '~/components/IntelligenceSyncPanel.vue'

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

const loading = computed<boolean>(
  () =>
    deliverablesLoading.value ||
    tasksLoading.value ||
    outputsLoading.value
)

const readiness = computed(() =>
  buildPresentationReadiness({
    deliverables: deliverableList.value,
    tasks: taskList.value,
    outputs: outputsByDeliverableId.value,
    studioResolver: (d) => getTemplateStudio(d.id)
  })
)

const sortedRows = computed<ChapterReadinessRow[]>(() => {
  const bandRank = { at_risk: 0, almost: 1, not_started: 2, ready: 3 }
  return [...readiness.value.rows].sort(
    (a, b) =>
      bandRank[a.band] - bandRank[b.band] ||
      a.deliverable.chapter - b.deliverable.chapter
  )
})

function bandLabel(band: ChapterReadinessRow['band']): string {
  switch (band) {
    case 'ready': return 'Ready'
    case 'almost': return 'Almost ready'
    case 'at_risk': return 'At risk'
    case 'not_started': return 'Not started'
  }
}
function bandChipClass(band: ChapterReadinessRow['band']): string {
  switch (band) {
    case 'ready': return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'almost': return 'border-sky-300 bg-sky-50 text-sky-800'
    case 'at_risk': return 'border-rose-300 bg-rose-50 text-rose-800'
    case 'not_started': return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

function fmtDays(d: number | null): string {
  if (d == null) return 'no due date'
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 0) return 'due today'
  return `${d}d to due`
}

function chapterTitle(row: ChapterReadinessRow): string {
  return row.studio?.title || row.deliverable.title
}
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-4 px-3 py-4">
    <NuxtLink to="/" class="text-sm text-phoenix-700 hover:underline">
      ← Home
    </NuxtLink>

    <header class="card space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Final Presentation Readiness
      </p>
      <h1 class="text-2xl font-semibold text-neutral-900">
        How ready are we for the May 12 / 15 final presentation?
      </h1>
      <p class="text-sm text-neutral-700">
        Read-only chapter-by-chapter view. Reuses your existing deliverables,
        tasks, outputs, and advisor signals.
      </p>
      <p class="text-xs italic text-neutral-500">
        Read-only — chiefs and instructor still decide. Submit gate, Playbook
        readiness, and approval logic are unchanged.
      </p>
    </header>

    <p v-if="loading" class="text-sm italic text-neutral-500">
      Loading readiness signals…
    </p>

    <!-- Top-line readiness summary -->
    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article class="card border-emerald-200 bg-emerald-50/40">
        <p class="text-xs uppercase tracking-wide text-emerald-700">Ready</p>
        <p class="text-2xl font-semibold text-emerald-900">{{ readiness.summary.bandCounts.ready }}</p>
        <p class="text-[11px] text-emerald-700">Approved or fully on track.</p>
      </article>
      <article class="card border-sky-200 bg-sky-50/40">
        <p class="text-xs uppercase tracking-wide text-sky-700">Almost ready</p>
        <p class="text-2xl font-semibold text-sky-900">{{ readiness.summary.bandCounts.almost }}</p>
        <p class="text-[11px] text-sky-700">Final text done; tighten weak spots.</p>
      </article>
      <article class="card border-rose-200 bg-rose-50/40">
        <p class="text-xs uppercase tracking-wide text-rose-700">At risk</p>
        <p class="text-2xl font-semibold text-rose-900">{{ readiness.summary.bandCounts.at_risk }}</p>
        <p class="text-[11px] text-rose-700">Stuck or open Action today.</p>
      </article>
      <article class="card border-neutral-200 bg-neutral-50">
        <p class="text-xs uppercase tracking-wide text-neutral-600">Not started</p>
        <p class="text-2xl font-semibold text-neutral-900">{{ readiness.summary.bandCounts.not_started }}</p>
        <p class="text-[11px] text-neutral-500">No final text yet on this chapter.</p>
      </article>
    </section>

    <!-- Cross-cutting signal + task counts -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Cross-cutting signals
        </p>
        <p class="text-xs text-neutral-500">
          Mirrors the C-Suite Advisor cockpit. Read-only.
        </p>
      </header>
      <ul class="flex flex-wrap gap-1.5 text-[11px]">
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.blockerCount > 0 ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Stuck · {{ readiness.summary.blockerCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.riskCount > 0 ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Action today · {{ readiness.summary.riskCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.watchCount > 0 ? 'border-sky-300 bg-sky-50 text-sky-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Look at soon · {{ readiness.summary.watchCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.dueSoonTaskCount > 0 ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Due Soon · {{ readiness.summary.dueSoonTaskCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.overdueTaskCount > 0 ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Overdue tasks · {{ readiness.summary.overdueTaskCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.blockedTaskCount > 0 ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Blocked tasks · {{ readiness.summary.blockedTaskCount }}
        </li>
        <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', readiness.summary.ownerlessTaskCount > 0 ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
          Ownerless · {{ readiness.summary.ownerlessTaskCount }}
        </li>
      </ul>
    </section>

    <!-- Intelligence Sync — what to gather next -->
    <IntelligenceSyncPanel
      :deliverables="deliverableList"
      :tasks="taskList"
      :outputs="outputsByDeliverableId"
      :advisor-signals="readiness.signals"
      :loading="loading"
    />

    <!-- Chapter readiness table -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Chapter-by-chapter readiness
        </p>
        <p class="text-xs text-neutral-500">
          Sorted by readiness band so the chapters that need help today rise to the top.
        </p>
      </header>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th class="pb-1 pr-2">Chapter</th>
              <th class="pb-1 pr-2">Status</th>
              <th class="pb-1 pr-2">Final text</th>
              <th class="pb-1 pr-2">Evidence</th>
              <th class="pb-1 pr-2">Pricing</th>
              <th class="pb-1 pr-2">Segment</th>
              <th class="pb-1 pr-2 text-right">Stuck</th>
              <th class="pb-1 pr-2 text-right">Action today</th>
              <th class="pb-1 pr-2 text-right">Due</th>
              <th class="pb-1 pr-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-for="row in sortedRows" :key="`pr-${row.deliverable.id}`">
              <td class="py-1 pr-2">
                <span class="font-medium text-neutral-900">{{ chapterTitle(row) }}</span>
                <span v-if="!row.studio" class="ml-1 text-[10px] text-neutral-500">(no studio)</span>
              </td>
              <td class="py-1 pr-2">
                <span
                  class="inline-block rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  :class="bandChipClass(row.band)"
                >{{ bandLabel(row.band) }}</span>
                <span class="ml-1 text-[10px] text-neutral-500">{{ row.status }}</span>
              </td>
              <td class="py-1 pr-2 text-neutral-700">
                {{ row.finalTextDone }}/{{ row.finalTextTotal || '—' }}
              </td>
              <td class="py-1 pr-2 text-neutral-700">{{ row.evidenceCovered }}</td>
              <td
                class="py-1 pr-2"
                :class="row.hasPricing ? 'text-emerald-700' : 'text-neutral-500'"
              >{{ row.hasPricing ? '✓' : '—' }}</td>
              <td
                class="py-1 pr-2"
                :class="row.hasMarketFitSegment ? 'text-emerald-700' : 'text-neutral-500'"
              >{{ row.hasMarketFitSegment ? '✓' : '—' }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.blockerCount > 0 ? 'text-rose-700 font-medium' : 'text-neutral-700'"
              >{{ row.blockerCount }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.riskCount > 0 ? 'text-amber-800 font-medium' : 'text-neutral-700'"
              >{{ row.riskCount }}</td>
              <td
                class="py-1 pr-2 text-right text-[11px]"
                :class="(row.daysToDue ?? 0) < 0 ? 'text-rose-700 font-medium' : 'text-neutral-700'"
              >{{ fmtDays(row.daysToDue) }}</td>
              <td class="py-1 pr-2">
                <NuxtLink
                  :to="`/deliverables/${row.deliverable.id}`"
                  class="text-[10px] text-phoenix-700 hover:underline"
                >Open →</NuxtLink>
              </td>
            </tr>
            <tr v-if="sortedRows.length === 0 && !loading">
              <td colspan="10" class="py-2 italic text-neutral-500">
                No deliverables to score yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Chief metrics — daily moves per role -->
    <section class="space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Chief metrics
        </p>
        <p class="text-xs text-neutral-500">
          Top signals per chief. Same engine as the C-Suite Advisor cockpit.
        </p>
      </header>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="row in readiness.chiefMetrics"
          :key="`chief-${row.role}`"
          class="card space-y-2"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900">{{ row.role }}</h3>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ row.openChapters }} chapter{{ row.openChapters === 1 ? '' : 's' }}
            </span>
          </header>
          <ul class="flex flex-wrap gap-1.5 text-[11px]">
            <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', row.blockerCount > 0 ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
              Stuck · {{ row.blockerCount }}
            </li>
            <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', row.riskCount > 0 ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
              Action today · {{ row.riskCount }}
            </li>
            <li :class="['rounded-full border px-2 py-0.5 uppercase tracking-wide', row.watchCount > 0 ? 'border-sky-300 bg-sky-50 text-sky-800 font-semibold' : 'border-neutral-300 bg-neutral-50 text-neutral-700']">
              Look at soon · {{ row.watchCount }}
            </li>
          </ul>
          <p
            v-if="row.topSignals.length === 0"
            class="text-xs italic text-neutral-500"
          >No active signals owned or supported by this role.</p>
          <ul v-else class="space-y-1 text-xs">
            <li
              v-for="a in row.topSignals"
              :key="`chief-${row.role}-${a.signal.id}`"
              class="space-y-0.5 rounded-md border border-neutral-200 bg-white p-2"
            >
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                  :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(a.signal).label]"
                >{{ getAdvisorDisplayLabel(a.signal).label }}</span>
                <NuxtLink
                  :to="`/deliverables/${a.deliverable.id}`"
                  class="text-[10px] text-phoenix-700 hover:underline"
                >{{ a.studio?.title || a.deliverable.title }} →</NuxtLink>
              </div>
              <p class="text-neutral-900">
                <span class="font-medium">{{ a.signal.title }}.</span>
                {{ a.signal.nextAction }}
              </p>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <p class="text-[11px] italic text-neutral-500">
      Read-only readiness. No tasks created, no due dates edited, no submit
      gate or Playbook readiness changed. The /pricing page remains the
      operational source of truth.
    </p>

    <div class="flex flex-wrap gap-2 text-xs">
      <NuxtLink
        to="/timeline"
        class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
      >Open Timeline →</NuxtLink>
      <NuxtLink
        to="/c-suite-advisor"
        class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
      >Open C-Suite Advisor →</NuxtLink>
      <NuxtLink
        to="/export-center"
        class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
      >Open Export Center →</NuxtLink>
    </div>
  </main>
</template>
