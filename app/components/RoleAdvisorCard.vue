<script setup lang="ts">
// C-Suite Advisor V1.2 — role / department dashboard card.
//
// Compact daily-action card chiefs see on their own dashboard. Same
// engine as the chapter card and the cockpit (generateAdvisorSignals
// via aggregateAdvisorSignals), filtered by AdvisorRole.
//
// Posture (do not relax):
//   - read-only / display-only — no Firestore writes
//   - no AI, no chatbot, no auto-task creation
//   - never approves, submits, or changes status
//   - student-friendly labels via getAdvisorDisplayLabel
//
// Caller passes the deliverable / task / output streams already loaded
// on the page; this card adds NO new Firestore subscriptions.

import { computed } from 'vue'
import type {
  Deliverable,
  DeliverableOutput,
  Task
} from '~/types/models'
import { getTemplateStudio } from '~/data/templateStudios'
import {
  aggregateAdvisorSignals,
  filterAggregatedByRoles,
  SEVERITY_RANK,
  SOURCE_LABEL
} from '~/utils/cSuiteAdvisor'
import {
  DISPLAY_LABEL_CHIP_CLASS,
  getAdvisorDisplayLabel
} from '~/utils/advisorDisplay'
import type { AdvisorRole } from '~/types/advisor'

const props = defineProps<{
  // Roles whose owned + supporting signals appear in this card.
  // Single role is the typical case; an array supports the
  // cross-functional Co-CEOs lane.
  roles: AdvisorRole[]
  // Card heading — usually the chief title (e.g. "CFO" or "Co-CEOs").
  title: string
  // Optional subtitle. Defaults to the standard advisor disclaimer.
  subtitle?: string
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  loading?: boolean
}>()

const aggregated = computed(() =>
  aggregateAdvisorSignals({
    deliverables: props.deliverables,
    tasks: props.tasks,
    outputs: props.outputs,
    studioResolver: (d) => getTemplateStudio(d.id)
  })
)

const filtered = computed(() =>
  filterAggregatedByRoles(aggregated.value, props.roles)
)

const stopsBlockedCount = computed(
  () => filtered.value.filter((a) => a.signal.severity === 'blocker').length
)
const needsActionCount = computed(
  () => filtered.value.filter((a) => a.signal.severity === 'risk').length
)
const checkSoonCount = computed(
  () => filtered.value.filter((a) => a.signal.severity === 'watch').length
)

// Due-soon / overdue counts across the deliverables relevant to
// these roles. We use the same task set the cockpit uses but only
// for tasks whose deliverable is studio-backed and whose linked
// signal would appear in this lane (best-effort: any task whose
// deliverable yields a signal owned/supported by this role).
function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function inDaysFromToday(iso: string | null | undefined, days: number): boolean {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const today = todayIso()
  if (iso < today) return false
  const [yy, mm, dd] = iso.split('-').map(Number)
  const due = new Date(yy, mm - 1, dd).getTime()
  const todayDate = new Date()
  const midnight = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  ).getTime()
  return due <= midnight + days * 86_400_000
}

const dueSoonOrOverdueCount = computed(() => {
  const relevantDeliverableIds = new Set(
    filtered.value.map((a) => a.deliverable.id)
  )
  let count = 0
  const today = todayIso()
  for (const t of props.tasks) {
    if (!t.deliverableId || !relevantDeliverableIds.has(t.deliverableId)) continue
    if (t.status === 'done') continue
    const overdue =
      (t.status === 'not_started' || t.status === 'in_progress') &&
      t.dueDate &&
      t.dueDate < today
    const dueSoon = inDaysFromToday(t.dueDate, 7)
    if (overdue || dueSoon) count += 1
  }
  return count
})

// Top 3 moves for this lane.
const topMoves = computed(() =>
  [...filtered.value]
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.signal.severity] - SEVERITY_RANK[b.signal.severity]
    )
    .slice(0, 3)
)

// Helper used in the chapter title chip.
function chapterTitle(d: Deliverable): string {
  const studio = getTemplateStudio(d.id)
  return studio?.title || d.title
}
</script>

<template>
  <section class="card space-y-2">
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <div class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">C-Suite Advisor</p>
        <h3 class="text-base font-semibold text-neutral-900">{{ title }}</h3>
        <p class="text-xs text-neutral-700">
          {{ subtitle ?? 'Daily moves for this role. Read-only — chiefs and instructor still decide.' }}
        </p>
      </div>
      <NuxtLink
        to="/c-suite-advisor"
        class="text-xs text-phoenix-700 hover:underline"
      >Open advisor cockpit →</NuxtLink>
    </header>

    <p v-if="loading" class="text-xs italic text-neutral-500">
      Loading advisor signals…
    </p>

    <template v-else>
      <!-- Counts row — student-friendly labels. -->
      <ul class="flex flex-wrap gap-1.5 text-[11px]">
        <li
          :class="[
            'rounded-full border px-2 py-0.5 uppercase tracking-wide',
            stopsBlockedCount > 0
              ? 'border-rose-300 bg-rose-50 text-rose-800 font-semibold'
              : 'border-neutral-300 bg-neutral-50 text-neutral-700'
          ]"
        >Stuck · {{ stopsBlockedCount }}</li>
        <li
          :class="[
            'rounded-full border px-2 py-0.5 uppercase tracking-wide',
            needsActionCount > 0
              ? 'border-amber-300 bg-amber-50 text-amber-800 font-semibold'
              : 'border-neutral-300 bg-neutral-50 text-neutral-700'
          ]"
        >Action today · {{ needsActionCount }}</li>
        <li
          :class="[
            'rounded-full border px-2 py-0.5 uppercase tracking-wide',
            checkSoonCount > 0
              ? 'border-sky-300 bg-sky-50 text-sky-800 font-semibold'
              : 'border-neutral-300 bg-neutral-50 text-neutral-700'
          ]"
        >Look at soon · {{ checkSoonCount }}</li>
        <li
          :class="[
            'rounded-full border px-2 py-0.5 uppercase tracking-wide',
            dueSoonOrOverdueCount > 0
              ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
              : 'border-neutral-300 bg-neutral-50 text-neutral-700'
          ]"
        >Due Soon · {{ dueSoonOrOverdueCount }}</li>
      </ul>

      <p
        v-if="topMoves.length === 0"
        class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
      >
        No active advisor moves for this role. Continue reviewing final text and rubric.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="a in topMoves"
          :key="`role-top-${a.signal.id}`"
          class="space-y-1 rounded-md border border-neutral-200 bg-white p-2 text-xs"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
              :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(a.signal).label]"
            >{{ getAdvisorDisplayLabel(a.signal).label }}</span>
            <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
              {{ a.signal.owner }}
            </span>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ chapterTitle(a.deliverable) }}
            </span>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ SOURCE_LABEL[a.signal.source] }}
            </span>
            <NuxtLink
              :to="`/deliverables/${a.deliverable.id}`"
              class="ml-auto text-[10px] text-phoenix-700 hover:underline"
            >Open chapter →</NuxtLink>
          </div>
          <p class="text-neutral-900">
            <span class="font-medium">{{ a.signal.title }}.</span>
            {{ a.signal.nextAction }}
          </p>
          <details class="text-neutral-700">
            <summary class="cursor-pointer text-[11px] text-phoenix-700 hover:underline">
              Why it matters / how to fix
            </summary>
            <div class="mt-1 space-y-0.5 text-[11px]">
              <p>
                <span class="font-medium text-neutral-600">Why it matters:</span>
                {{ getAdvisorDisplayLabel(a.signal).whyItMatters }}
              </p>
              <p>
                <span class="font-medium text-neutral-600">How to fix:</span>
                {{ getAdvisorDisplayLabel(a.signal).howToFix }}
              </p>
              <p
                v-if="(a.signal.supportingRoles?.length ?? 0) > 0"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Help from:</span>
                {{ a.signal.supportingRoles!.join(' · ') }}
              </p>
            </div>
          </details>
        </li>
      </ul>
      <p class="text-[11px] italic text-neutral-500">
        Read-only. No tasks created here.
      </p>
    </template>
  </section>
</template>
