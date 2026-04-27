<script setup lang="ts">
// C-Suite Advisor V1.1 — leadership cockpit.
//
// Aggregates AdvisorSignals across studio-backed deliverables into a
// visual operating dashboard. Pure read-only — every section is a
// derived view over data the app already loads (deliverables, tasks,
// deliverableOutputs, requirementCoverage). No persistence, no AI,
// no autosave, no task creation, no Firestore rule change, no
// deadline editing.
//
// Posture (do not relax):
//   - never persists hub state or signals
//   - never creates a task, never edits a due date, never approves
//   - chiefs/instructor still decide; the hub just frames the
//     "what should we push" question
//   - safe on missing output docs, non-studio deliverables,
//     overdue/ownerless tasks, deliverables without due dates,
//     and the empty-signal case

import { computed, ref } from 'vue'
import type {
  Deliverable,
  DeliverableOutput,
  Task
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'
import {
  aggregateAdvisorSignals,
  filterAggregatedByRoles,
  generateAdvisorSignals,
  SEVERITY_RANK,
  SOURCE_LABEL,
  type AggregatedAdvisorSignal
} from '~/utils/cSuiteAdvisor'
import {
  DISPLAY_LABEL_CHIP_CLASS,
  getAdvisorDisplayLabel
} from '~/utils/advisorDisplay'
import type {
  AdvisorRole,
  AdvisorSignalSeverity
} from '~/types/advisor'
import { getTemplateStudio } from '~/data/templateStudios'
import { PROJECT_MILESTONES } from '~/data/projectMilestones'
import {
  buildMilestoneBackplan,
  chapterNumberFromDeliverableId,
  daysUntil,
  evaluateMilestoneStatus,
  getNextMilestones,
  todayIso as backplanTodayIso,
  type BackplanMilestone,
  type MilestoneStatus
} from '~/utils/milestoneBackplan'

const props = defineProps<{
  deliverables: Deliverable[]
  tasks: Task[]
  outputs: Record<string, DeliverableOutput | null>
  loading?: boolean
}>()

// ---- per-deliverable signal generation ----
// V1.2 — uses the shared aggregator so the dashboard role cards
// produce identical signals. Cross-chapter context (Ch. 7 → Ch. 8
// price-segment fit) is wired automatically by the aggregator.
type AggregatedSignal = AggregatedAdvisorSignal

const allAggregated = computed<AggregatedSignal[]>(() =>
  aggregateAdvisorSignals({
    deliverables: props.deliverables,
    tasks: props.tasks,
    outputs: props.outputs,
    studioResolver: (d) => getTemplateStudio(d.id)
  })
)
// Suppress unused-warning on computeRequirementCoverage (kept
// imported because the matrix recomputes coverage display below).
void computeRequirementCoverage

// ---- role filter (local state only) ----
// Filters by signal.owner OR (signal.supportingRoles ?? []).includes(role).
// Stays in component state — never persists.
const ROLE_FILTERS: Array<AdvisorRole | 'All'> = [
  'All',
  'Co-CEOs',
  'CFO',
  'COO',
  'CMO',
  'Chief Strategy and Growth Officer',
  'Instructor/Admin'
]
const roleFilter = ref<AdvisorRole | 'All'>('All')

const filteredAggregated = computed<AggregatedSignal[]>(() => {
  if (roleFilter.value === 'All') return allAggregated.value
  return filterAggregatedByRoles(allAggregated.value, [roleFilter.value])
})

// ---- B. Summary counts ----
interface SeverityCounts {
  blocker: number
  risk: number
  watch: number
  info: number
}
const severityCounts = computed<SeverityCounts>(() => {
  const c: SeverityCounts = { blocker: 0, risk: 0, watch: 0, info: 0 }
  for (const a of filteredAggregated.value) c[a.signal.severity] += 1
  return c
})

// Status counts across the deliverable set (display-only).
const statusCounts = computed(() => {
  const acc = { draft: 0, in_review: 0, needs_revision: 0, approved: 0 }
  for (const d of props.deliverables) acc[d.status] += 1
  return acc
})

// ---- C. Today's Moves ----
// Re-rank the flat list so blockers across all chapters surface
// above risks within any single chapter. Uses the shared
// SEVERITY_RANK so the cockpit and dashboard cards order signals
// the same way.
// Up to 5 highest-priority moves (brief V1.2 — "3 to 5"). The list
// auto-shrinks when fewer signals exist; the empty state covers
// zero.
const topMoves = computed<AggregatedSignal[]>(() => {
  return [...filteredAggregated.value]
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.signal.severity] - SEVERITY_RANK[b.signal.severity]
    )
    .slice(0, 5)
})

// ---- C2. Milestone Backplan ----
// Read-only view over the configured project milestones. Suggested
// dates only — never creates a task, never edits a due date, never
// writes anywhere. Past-due milestones are flagged "Needs Action"
// only when their related chapters still carry open advisor signals
// (blocker / risk / watch). The role filter is intentionally NOT
// applied here — milestones span the whole program.
const backplanTodayStr = backplanTodayIso()

// Build set of chapter numbers that currently have at least one open
// (non-info) advisor signal across the unfiltered aggregated list.
const chaptersWithOpenIssues = computed<Set<number>>(() => {
  const out = new Set<number>()
  for (const a of allAggregated.value) {
    if (a.signal.severity === 'info') continue
    const n = chapterNumberFromDeliverableId(a.deliverable.id)
    if (n !== null) out.add(n)
  }
  return out
})
function hasOpenChapterIssues(chapter: number): boolean {
  return chaptersWithOpenIssues.value.has(chapter)
}

const fullBackplan = computed<BackplanMilestone[]>(() =>
  buildMilestoneBackplan(PROJECT_MILESTONES)
)
const nextMilestones = computed<BackplanMilestone[]>(() =>
  getNextMilestones(fullBackplan.value, backplanTodayStr, 3)
)
function statusFor(m: BackplanMilestone): MilestoneStatus {
  return evaluateMilestoneStatus(m, backplanTodayStr, hasOpenChapterIssues)
}
function backplanStatusLabel(m: BackplanMilestone): string {
  const s = statusFor(m)
  if (s === 'today') return 'Today'
  if (s === 'past-needs-action') return 'Action today — past due'
  if (s === 'past-clean') return 'Past · related chapters clean'
  const d = daysUntil(m.suggestedDate, backplanTodayStr)
  return `In ${d}d`
}
function backplanStatusChipClass(m: BackplanMilestone): string {
  switch (statusFor(m)) {
    case 'today':
      return 'border-rose-300 bg-rose-50 text-rose-800'
    case 'past-needs-action':
      return 'border-amber-300 bg-amber-50 text-amber-800'
    case 'past-clean':
      return 'border-neutral-300 bg-neutral-50 text-neutral-600'
    default:
      return 'border-sky-300 bg-sky-50 text-sky-800'
  }
}

// ---- D. Owner lanes ----
const OWNER_LANES: AdvisorRole[] = [
  'Co-CEOs',
  'CFO',
  'COO',
  'CMO',
  'Chief Strategy and Growth Officer',
  'Instructor/Admin'
]
interface OwnerLane {
  role: AdvisorRole
  count: number
  topSignals: AggregatedSignal[]
}
const ownerLanes = computed<OwnerLane[]>(() => {
  return OWNER_LANES.map((role) => {
    const own = filteredAggregated.value.filter(
      (a) =>
        a.signal.owner === role ||
        (a.signal.supportingRoles ?? []).includes(role)
    )
    own.sort(
      (a, b) =>
        SEVERITY_RANK[a.signal.severity] - SEVERITY_RANK[b.signal.severity]
    )
    return { role, count: own.length, topSignals: own.slice(0, 3) }
  })
})

// ---- E. At-risk chapters ----
interface AtRiskChapter {
  deliverable: Deliverable
  studio: TemplateStudio
  highestSeverity: AdvisorSignalSeverity
  topOwner: AdvisorRole
  topNextAction: string
  topSignalRef: AggregatedSignal['signal']
  signalCount: number
}
const atRiskChapters = computed<AtRiskChapter[]>(() => {
  const byChapter: Record<string, AggregatedSignal[]> = {}
  for (const a of filteredAggregated.value) {
    if (a.signal.severity === 'info') continue // info is monitoring-only
    const id = a.deliverable.id
    if (!byChapter[id]) byChapter[id] = []
    byChapter[id].push(a)
  }
  const out: AtRiskChapter[] = []
  for (const id of Object.keys(byChapter)) {
    const list = byChapter[id]
    list.sort(
      (a, b) =>
        SEVERITY_RANK[a.signal.severity] - SEVERITY_RANK[b.signal.severity]
    )
    const top = list[0]
    out.push({
      deliverable: top.deliverable,
      studio: top.studio,
      highestSeverity: top.signal.severity,
      topOwner: top.signal.owner,
      topNextAction: top.signal.nextAction,
      topSignalRef: top.signal,
      signalCount: list.length
    })
  }
  out.sort(
    (a, b) =>
      SEVERITY_RANK[a.highestSeverity] - SEVERITY_RANK[b.highestSeverity]
  )
  return out
})

// ---- F. Task coverage matrix ----
// One row per studio-backed deliverable. Counts come from existing
// data, not from new collection reads.
interface TaskCoverageRow {
  deliverable: Deliverable
  studio: TemplateStudio
  missingRequiredTaskCount: number
  blockedTaskCount: number
  overdueTaskCount: number
  ownerlessTaskCount: number
}
function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const taskCoverageMatrix = computed<TaskCoverageRow[]>(() => {
  const today = todayIso()
  const out: TaskCoverageRow[] = []
  for (const d of props.deliverables) {
    const studio = getTemplateStudio(d.id)
    if (!studio) continue
    const tasksForD = props.tasks.filter((t) => t.deliverableId === d.id)
    const reqCoverage = computeRequirementCoverage(
      studio.requirements,
      tasksForD
    )
    const blocked = tasksForD.filter((t) => t.status === 'blocked').length
    const overdue = tasksForD.filter(
      (t) =>
        (t.status === 'not_started' || t.status === 'in_progress') &&
        t.dueDate &&
        t.dueDate < today
    ).length
    const ownerless = tasksForD.filter(
      (t) => !t.ownerEmail || !t.ownerEmail.trim()
    ).length
    out.push({
      deliverable: d,
      studio,
      missingRequiredTaskCount:
        reqCoverage.requiredRequirementsWithoutTasks.length,
      blockedTaskCount: blocked,
      overdueTaskCount: overdue,
      ownerlessTaskCount: ownerless
    })
  }
  return out
})

// ---- G. Process-order checklist (display-only) ----
const PROCESS_STEPS: string[] = [
  'Product / specs',
  'Segment / evidence',
  'Comps / pricing',
  'Campaign / message',
  'Operations readiness',
  'Phoenix Nest carry',
  'Final Playbook text',
  'Submit / review'
]

// ---- H. Due date / backplan ----
function safeIsoDate(s: string | null | undefined): string | null {
  if (!s) return null
  // Acceptable: yyyy-mm-dd. We don't try to parse free-form.
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null
}
interface DueDateView {
  nearestActiveDue: string | null
  latestActiveDue: string | null
  overdueCount: number
  upcoming: Array<{ deliverable: Deliverable; due: string }>
  backplan: string[]
}
const dueDateView = computed<DueDateView>(() => {
  const today = todayIso()
  const active = props.deliverables.filter(
    (d) => d.status !== 'approved' && safeIsoDate(d.dueDate)
  )
  const dues = active
    .map((d) => ({ deliverable: d, due: safeIsoDate(d.dueDate)! }))
    .sort((a, b) => a.due.localeCompare(b.due))
  const overdueCount = dues.filter((x) => x.due < today).length
  const upcoming = dues.filter((x) => x.due >= today).slice(0, 5)
  const nearestActiveDue = dues[0]?.due ?? null
  const latestActiveDue = dues[dues.length - 1]?.due ?? null

  // Backplan copy follows the process-order ladder. It does NOT pin
  // a specific calendar to each step — that's a chief decision.
  // Just reminds the team which step blocks which next step.
  const backplan = [
    'Lock product / specs first; without these, pricing and campaigns drift.',
    'Compose segments + evidence before defending any premium price.',
    'Add comps + pricing analysis before naming a target sale price.',
    'Lock campaign / messaging only after the segment is named.',
    'Operations readiness (inventory, staffing, SOPs) before the pop-up plan locks.',
    'Phoenix Nest carry pitch only after price + margin + segment evidence is on file.',
    'Final Playbook text only after source notes / evidence are complete.',
    'Submit / review only after required-task coverage is green.'
  ]

  return {
    nearestActiveDue,
    latestActiveDue,
    overdueCount,
    upcoming,
    backplan
  }
})

// ---- shared helpers ----
function chapterTitle(d: Deliverable, studio: TemplateStudio | null): string {
  return studio?.title || d.title
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
}
</script>

<template>
  <section class="space-y-4">
    <!-- A. Header -->
    <header class="card space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">C-Suite Advisor</p>
      <h1 class="text-2xl font-semibold text-neutral-900">Leadership cockpit</h1>
      <p class="text-sm text-neutral-700">
        Leadership cockpit for gaps, owners, process order, and task coverage.
      </p>
      <p class="text-xs italic text-neutral-500">
        Advisor signals are read-only. Chiefs and instructor still decide.
      </p>
    </header>

    <p v-if="loading" class="text-sm italic text-neutral-500">
      Loading advisor signals…
    </p>

    <!-- I. Role filter -->
    <section class="card space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Filter by role
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="r in ROLE_FILTERS"
          :key="`role-${r}`"
          type="button"
          :class="[
            'rounded-full border px-2.5 py-1 text-xs',
            roleFilter === r
              ? 'border-phoenix-500 bg-phoenix-50 font-semibold text-phoenix-900'
              : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
          ]"
          @click="roleFilter = r"
        >{{ r }}</button>
      </div>
      <p class="text-[11px] italic text-neutral-500">
        Filter is local UI state. It does not persist or change ownership.
      </p>
    </section>

    <!-- B. Summary cards. Sprint 1B: chip vocabulary collapsed to the
         four-tier student set (Stuck / Action today / Look at soon /
         All good) so the card headers, advisor signals, and the
         Intelligence Sync panel all read in the same words. -->
    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article class="card border-rose-200 bg-rose-50/40">
        <p class="text-xs uppercase tracking-wide text-rose-700">Stuck</p>
        <p class="text-2xl font-semibold text-rose-900">{{ severityCounts.blocker }}</p>
        <p class="text-[11px] text-rose-700">
          Items that stop submit or show a task is blocked.
        </p>
      </article>
      <article class="card border-amber-200 bg-amber-50/40">
        <p class="text-xs uppercase tracking-wide text-amber-700">Action today</p>
        <p class="text-2xl font-semibold text-amber-900">{{ severityCounts.risk }}</p>
        <p class="text-[11px] text-amber-700">
          Work can continue, but this could weaken the chapter or pitch.
        </p>
      </article>
      <article class="card border-sky-200 bg-sky-50/40">
        <p class="text-xs uppercase tracking-wide text-sky-700">Look at soon</p>
        <p class="text-2xl font-semibold text-sky-900">{{ severityCounts.watch }}</p>
        <p class="text-[11px] text-sky-700">
          Not urgent yet, but do not ignore it.
        </p>
      </article>
      <article class="card border-emerald-200 bg-emerald-50/40">
        <p class="text-xs uppercase tracking-wide text-emerald-700">All good · Monitoring</p>
        <p class="text-2xl font-semibold text-emerald-900">{{ severityCounts.info }}</p>
        <p class="text-[11px] text-emerald-700">
          {{ statusCounts.in_review }} in review · {{ statusCounts.approved }} approved
        </p>
      </article>
    </section>

    <!-- C. Today's Moves (was Top 3 — V1.2) -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Today's Moves
        </p>
        <p class="text-xs text-neutral-500">
          Highest-priority actions for student chiefs. Up to 5 across studio-backed deliverables.
        </p>
      </header>
      <p
        v-if="topMoves.length === 0"
        class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
      >
        No Stuck, Action today, or Look at soon items under this filter. Continue
        reviewing final text and approval rubric.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="a in topMoves"
          :key="`top-${a.signal.id}`"
          class="space-y-1 rounded-md border border-neutral-200 bg-white p-2 text-xs"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
              :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(a.signal).label]"
            >{{ getAdvisorDisplayLabel(a.signal).label }}</span>
            <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
              Owner · {{ a.signal.owner }}
            </span>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ chapterTitle(a.deliverable, a.studio) }}
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
              What this means / why it matters / how to fix
            </summary>
            <div class="mt-1 space-y-0.5 text-[11px]">
              <p>
                <span class="font-medium text-neutral-600">What this means:</span>
                {{ getAdvisorDisplayLabel(a.signal).explanation }}
              </p>
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
              <p v-if="a.signal.dependency" class="text-neutral-700">
                <span class="font-medium text-neutral-600">Happens first:</span>
                {{ a.signal.dependency }}
              </p>
              <p
                v-if="a.signal.suggestedTask?.definitionOfDone"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Done looks like:</span>
                {{ a.signal.suggestedTask.definitionOfDone }}
              </p>
            </div>
          </details>
        </li>
      </ul>
    </section>

    <!-- C2. Milestone Backplan — next 3 suggested dates back-planned
         from the configured final-presentation target. Suggestions
         only; never creates a task, never edits a due date. -->
    <section v-if="nextMilestones.length" class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Milestone backplan
        </p>
        <p class="text-xs text-neutral-500">
          Next 3 suggested milestones based on the configured final target. These
          are suggestions only — they do not change task or deliverable due dates.
          The full plan lives on
          <NuxtLink to="/timeline" class="text-phoenix-700 hover:underline">/timeline</NuxtLink>.
        </p>
      </header>
      <ul class="space-y-1.5 text-xs">
        <li
          v-for="m in nextMilestones"
          :key="`backplan-${m.id}`"
          class="rounded border border-neutral-200 bg-white px-2 py-1.5"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <p class="font-semibold text-neutral-900">{{ m.title }}</p>
            <span
              class="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide"
              :class="backplanStatusChipClass(m)"
            >{{ backplanStatusLabel(m) }}</span>
          </div>
          <p class="mt-0.5 text-[11px] text-neutral-700 tabular-nums">
            <span class="font-mono">{{ m.suggestedDate }}</span>
            · <span class="font-medium">Owner:</span> {{ m.owner }}
            <span v-if="m.relatedChapters.length">
              · <span class="font-medium">Ch.</span>
              {{ m.relatedChapters.join(', ') }}
            </span>
          </p>
          <p class="mt-0.5 text-[11px] text-neutral-700">
            <span class="font-medium">Done looks like:</span>
            {{ m.definitionOfDone }}
          </p>
        </li>
      </ul>
    </section>

    <!-- D. Owner lanes -->
    <section class="space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Owner lanes
        </p>
        <p class="text-xs text-neutral-500">
          Top 3 active signals per chief. Counts honor the role filter.
        </p>
      </header>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="lane in ownerLanes"
          :key="`lane-${lane.role}`"
          class="card space-y-2"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900">{{ lane.role }}</h3>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ lane.count }} signal{{ lane.count === 1 ? '' : 's' }}
            </span>
          </header>
          <p
            v-if="lane.count === 0"
            class="text-xs italic text-neutral-500"
          >No active signals owned or supported by this role.</p>
          <ul v-else class="space-y-1 text-xs">
            <li
              v-for="a in lane.topSignals"
              :key="`lane-${lane.role}-${a.signal.id}`"
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
                >{{ chapterTitle(a.deliverable, a.studio) }} →</NuxtLink>
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

    <!-- E. At-risk chapters -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          At-risk chapters
        </p>
        <p class="text-xs text-neutral-500">
          Chapters with at least one Stuck / Action today / Look at soon item. Sorted by severity.
        </p>
      </header>
      <p
        v-if="atRiskChapters.length === 0"
        class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
      >
        No chapters at risk under this filter.
      </p>
      <ul v-else class="space-y-1 text-xs">
        <li
          v-for="row in atRiskChapters"
          :key="`risk-${row.deliverable.id}`"
          class="rounded-md border border-neutral-200 bg-white p-2"
        >
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
              :class="DISPLAY_LABEL_CHIP_CLASS[getAdvisorDisplayLabel(row.topSignalRef).label]"
            >{{ getAdvisorDisplayLabel(row.topSignalRef).label }}</span>
            <span class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-violet-800">
              {{ row.topOwner }}
            </span>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-700">
              {{ row.signalCount }} flag{{ row.signalCount === 1 ? '' : 's' }}
            </span>
            <NuxtLink
              :to="`/deliverables/${row.deliverable.id}`"
              class="ml-auto text-[10px] text-phoenix-700 hover:underline"
            >Open chapter →</NuxtLink>
          </div>
          <p class="mt-1 text-neutral-900">
            <span class="font-medium">{{ chapterTitle(row.deliverable, row.studio) }}.</span>
            {{ row.topNextAction }}
          </p>
        </li>
      </ul>
    </section>

    <!-- F. Task coverage matrix -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Task coverage matrix
        </p>
        <p class="text-xs text-neutral-500">
          Counts derived from existing tasks + requirement coverage. Read-only.
        </p>
      </header>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="text-left text-[11px] uppercase tracking-wide text-neutral-500">
            <tr>
              <th class="pb-1 pr-2">Chapter</th>
              <th class="pb-1 pr-2 text-right">Missing required</th>
              <th class="pb-1 pr-2 text-right">Stuck</th>
              <th class="pb-1 pr-2 text-right">Overdue</th>
              <th class="pb-1 pr-2 text-right">Ownerless</th>
              <th class="pb-1 pr-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-for="row in taskCoverageMatrix" :key="`tc-${row.deliverable.id}`">
              <td class="py-1 pr-2 text-neutral-900">{{ chapterTitle(row.deliverable, row.studio) }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.missingRequiredTaskCount > 0 ? 'text-rose-700 font-medium' : 'text-neutral-700'"
              >{{ row.missingRequiredTaskCount }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.blockedTaskCount > 0 ? 'text-rose-700 font-medium' : 'text-neutral-700'"
              >{{ row.blockedTaskCount }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.overdueTaskCount > 0 ? 'text-amber-800 font-medium' : 'text-neutral-700'"
              >{{ row.overdueTaskCount }}</td>
              <td
                class="py-1 pr-2 text-right"
                :class="row.ownerlessTaskCount > 0 ? 'text-amber-800 font-medium' : 'text-neutral-700'"
              >{{ row.ownerlessTaskCount }}</td>
              <td class="py-1 pr-2">
                <NuxtLink
                  :to="`/deliverables/${row.deliverable.id}`"
                  class="text-[10px] text-phoenix-700 hover:underline"
                >Open →</NuxtLink>
              </td>
            </tr>
            <tr v-if="taskCoverageMatrix.length === 0">
              <td colspan="6" class="py-2 italic text-neutral-500">
                No studio-backed deliverables to score yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- G. Process-order checklist -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Process order
        </p>
        <p class="text-xs text-neutral-500">
          Display-only sequence — chiefs and instructor still decide.
        </p>
      </header>
      <ol class="ml-4 list-decimal space-y-0.5 text-xs text-neutral-800">
        <li v-for="(step, i) in PROCESS_STEPS" :key="`proc-${i}`">{{ step }}</li>
      </ol>
    </section>

    <!-- H. Due-date / backplan panel -->
    <section class="card space-y-2">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Due dates &amp; backplan
        </p>
        <p class="text-xs text-neutral-500">
          Read-only view of existing deliverable due dates. The hub does not
          edit due dates and does not introduce a final-deadline model.
        </p>
      </header>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt class="text-neutral-500">Nearest active due</dt>
          <dd class="font-medium text-neutral-900">{{ fmtDate(dueDateView.nearestActiveDue) }}</dd>
        </div>
        <div>
          <dt class="text-neutral-500">Latest active due</dt>
          <dd class="font-medium text-neutral-900">{{ fmtDate(dueDateView.latestActiveDue) }}</dd>
        </div>
        <div>
          <dt class="text-neutral-500">Overdue (active)</dt>
          <dd
            class="font-medium"
            :class="dueDateView.overdueCount > 0 ? 'text-rose-700' : 'text-neutral-900'"
          >{{ dueDateView.overdueCount }}</dd>
        </div>
        <div>
          <dt class="text-neutral-500">Upcoming</dt>
          <dd class="font-medium text-neutral-900">{{ dueDateView.upcoming.length }}</dd>
        </div>
      </dl>
      <ul
        v-if="dueDateView.upcoming.length > 0"
        class="space-y-0.5 text-xs"
      >
        <li
          v-for="row in dueDateView.upcoming"
          :key="`up-${row.deliverable.id}`"
          class="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-neutral-200 bg-white p-1.5"
        >
          <span class="text-neutral-900">{{ row.deliverable.title }}</span>
          <span class="text-neutral-500">due {{ fmtDate(row.due) }}</span>
          <NuxtLink
            :to="`/deliverables/${row.deliverable.id}`"
            class="text-[10px] text-phoenix-700 hover:underline"
          >Open →</NuxtLink>
        </li>
      </ul>
      <details class="rounded-md border border-neutral-200 bg-white p-2">
        <summary class="cursor-pointer text-xs font-medium text-neutral-700">
          Backplan reminders (process-order)
        </summary>
        <ul class="ml-4 mt-1 list-disc space-y-0.5 text-xs text-neutral-800">
          <li v-for="(line, i) in dueDateView.backplan" :key="`bp-${i}`">{{ line }}</li>
        </ul>
      </details>
    </section>

    <p class="text-[11px] italic text-neutral-500">
      C-Suite Advisor V1.1 — read-only cockpit. No tasks created, no due dates
      edited, no approvals issued.
    </p>
  </section>
</template>
