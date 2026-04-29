<!--
  C-suite Project Navigator (deterministic, read-only).

  PURPOSE
  -------
  Helps chiefs and admin/instructor see what to push on next without
  making decisions for them. Reads existing tasks + deliverables +
  chapter-owner labels and renders a small, ranked, plain-language
  view: priority cards, blocked work, overdue work, pending reviews,
  chapter progress, department workload, meeting agenda.

  This is NOT the Executive Advisor. No AI calls. No mutation.

  POSTURE (do not relax)
  ----------------------
    - Pure UI + read of existing watchers. No Firestore writes.
    - No AI calls. No /api/ai/* requests.
    - No mutation buttons. Every CTA is a `<NuxtLink>` to an
      existing surface where the leader can act through the
      existing workflow.
    - Suggested next moves are read-only copy.
    - Role-gated by the existing `c-suite` middleware so regular
      members are redirected to /.

  RELATED
  -------
  Computation lives in `app/utils/projectNavigator.ts` (pure
  functions). The page only handles wiring + rendering.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { templateStudios } from '~/data/templateStudios'
import {
  buildProjectNavigatorView,
  type NavigatorViewerRole,
  type PriorityItem,
  type ProjectNavigatorView
} from '~/utils/projectNavigator'
import { todayIso } from '~/utils/milestoneBackplan'
import type { Department } from '~/types/models'

definePageMeta({ middleware: ['c-suite'] })

const auth = useAuthStore()
const deliverables = useDeliverables()
const tasks = useTasks()

const { data: liveDeliverables, loading: deliverablesLoading } =
  deliverables.watchList()
const { data: liveTasks, loading: tasksLoading } = tasks.watchAll()

const loading = computed(
  () => deliverablesLoading.value || tasksLoading.value
)

// Map auth role to the Navigator's role enum.
const viewerRole = computed<NavigatorViewerRole>(() => {
  const role = auth.profile?.role
  switch (role) {
    case 'admin':
      return 'admin'
    case 'coceo':
      return 'coceo'
    case 'coo':
      return 'coo'
    case 'cfo':
      return 'cfo'
    case 'cmo':
      return 'cmo'
    case 'csgo':
      return 'csgo'
    default:
      return 'unknown'
  }
})

// Co-CEO / admin / unknown can switch view-as. Other chief roles
// default to their own department's slice.
const canSwitchView = computed<boolean>(
  () => viewerRole.value === 'coceo' || viewerRole.value === 'admin'
)

const viewAsDepartment = ref<Department | null>(null)

// Chapter id list + titles passed into the pure view builder so the
// util stays free of Vue runtime imports.
const chapterIds: readonly string[] = Object.keys(templateStudios)
const chapterTitles: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(templateStudios).map(([id, studio]) => [id, studio.title])
)

const view = computed<ProjectNavigatorView>(() =>
  buildProjectNavigatorView({
    deliverables: liveDeliverables.value,
    tasks: liveTasks.value,
    todayIso: todayIso(),
    viewerRole: viewerRole.value,
    viewAsDepartment: viewAsDepartment.value,
    chapterIds,
    chapterTitles
  })
)

// Friendly labels for the view-as toggle.
const departmentOptions: { id: Department | null; label: string }[] = [
  { id: null, label: 'Company-wide' },
  { id: 'operations', label: 'Operations · COO' },
  { id: 'finance', label: 'Finance · CFO' },
  { id: 'marketing', label: 'Marketing · CMO' },
  { id: 'strategy-growth', label: 'Strategy and Growth · CSGO' },
  { id: 'executive', label: 'Executive · Co-CEO' }
]

// Convenience accessors for templates.
const priorityItems = computed<PriorityItem[]>(() => view.value.priorityItems)

function chipClassForKind(kind: PriorityItem['kind']): string {
  switch (kind) {
    case 'blocked-task':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'overdue-deliverable':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'pending-review':
      return 'border-sky-300 bg-sky-50 text-sky-900'
    case 'final-output':
      return 'border-phoenix-300 bg-phoenix-50 text-phoenix-900'
    case 'upcoming-due':
      return 'border-neutral-300 bg-neutral-50 text-neutral-800'
  }
}

function kindLabel(kind: PriorityItem['kind']): string {
  switch (kind) {
    case 'blocked-task':
      return 'Blocked'
    case 'overdue-deliverable':
      return 'Overdue'
    case 'pending-review':
      return 'In review'
    case 'final-output':
      return 'Final output'
    case 'upcoming-due':
      return 'Upcoming'
  }
}

function deliverableLink(deliverableId: string): string {
  return `/deliverables/${deliverableId}`
}
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-phoenix-700">
        C-suite · Project Navigator
      </p>
      <h1 class="text-2xl font-semibold">What to push on next</h1>
      <p class="text-sm text-neutral-700">
        A read-only view of the work state. The Navigator answers what is
        blocked, what is overdue, what is waiting for review, and which
        chapters are behind. It does not change anything for you.
      </p>
      <p class="text-xs italic text-neutral-500">
        Not the Executive Advisor. Deterministic only — no AI, no
        mutation. Use the existing Tasks / Deliverables surfaces to act
        on what you see here.
      </p>
    </header>

    <!-- View-as toggle for Co-CEO / admin -->
    <div
      v-if="canSwitchView"
      class="flex flex-wrap items-center gap-2 rounded border border-neutral-200 bg-white p-2 text-xs"
    >
      <span class="font-semibold text-neutral-700">View:</span>
      <button
        v-for="opt in departmentOptions"
        :key="String(opt.id ?? 'all')"
        type="button"
        class="rounded border px-2 py-1 transition-colors"
        :class="
          viewAsDepartment === opt.id
            ? 'border-phoenix-500 bg-phoenix-50 text-phoenix-800'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
        "
        @click="viewAsDepartment = opt.id"
      >
        {{ opt.label }}
      </button>
    </div>
    <p
      v-else-if="view.filteredByDepartment"
      class="text-xs italic text-neutral-600"
    >
      Showing {{ view.filteredByDepartment }} only — your role's default
      slice.
    </p>

    <p v-if="loading" class="text-sm text-neutral-500">Loading work state…</p>

    <!-- ===== Priority cards ===== -->
    <section v-if="!loading" class="space-y-2">
      <header>
        <h2 class="text-sm font-semibold text-neutral-700">
          What needs attention now
        </h2>
        <p class="text-xs text-neutral-500">
          Up to 8 items, ranked: blocked first, then overdue, then in-review,
          then final-output items, then upcoming due dates.
        </p>
      </header>

      <p
        v-if="priorityItems.length === 0"
        class="rounded border border-neutral-200 bg-white p-4 text-sm text-neutral-700"
      >
        Nothing is currently flagged. Confirm with each chief that work
        is actually in flight — silent progress can hide blockers.
      </p>

      <div
        v-else
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-2"
      >
        <NuxtLink
          v-for="item in priorityItems"
          :key="item.id"
          :to="item.link"
          class="block rounded-lg border bg-white p-3 hover:border-phoenix-300 transition-colors"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span
              class="inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="chipClassForKind(item.kind)"
            >
              {{ kindLabel(item.kind) }}
            </span>
            <span class="text-[11px] uppercase text-neutral-500">
              {{ item.statusLabel }}
            </span>
          </div>
          <p class="mt-2 text-sm font-semibold text-neutral-900 break-words">
            {{ item.title }}
          </p>
          <p class="mt-0.5 text-xs text-neutral-600">
            {{ item.ownerLabel }}<span v-if="item.dueDate"> · due {{ item.dueDate }}</span>
          </p>
          <p
            v-if="item.whyItMatters"
            class="mt-2 text-xs italic text-neutral-700 break-words"
          >
            {{ item.whyItMatters }}
          </p>
          <p class="mt-2 text-xs text-neutral-800 break-words">
            <span class="font-semibold">Suggested next move:</span>
            {{ item.suggestedNextMove }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- ===== Blocked / Pending review ===== -->
    <section v-if="!loading" class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">
          Blocked tasks ({{ view.blockedTasks.length }})
        </h2>
        <p
          v-if="view.blockedTasks.length === 0"
          class="rounded border border-neutral-200 bg-white p-3 text-xs text-neutral-700"
        >
          No blocked tasks found. Add or assign tasks from the normal
          task workflow.
        </p>
        <ul v-else class="space-y-1">
          <li
            v-for="t in view.blockedTasks"
            :key="t.id"
            class="rounded border border-rose-200 bg-rose-50/40 p-2 text-xs"
          >
            <NuxtLink
              :to="t.link"
              class="font-medium text-rose-900 hover:underline break-words"
            >
              {{ t.title }}
            </NuxtLink>
            <p class="mt-0.5 text-neutral-700">{{ t.ownerLabel }}</p>
            <p class="mt-0.5 italic text-neutral-700">{{ t.whyItMatters }}</p>
          </li>
        </ul>
      </div>

      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">
          Pending reviews ({{ view.pendingReviews.length }})
        </h2>
        <p
          v-if="view.pendingReviews.length === 0"
          class="rounded border border-neutral-200 bg-white p-3 text-xs text-neutral-700"
        >
          No in-review deliverables found. Ask each chief what is close to
          ready and what it would take to get there this week.
        </p>
        <ul v-else class="space-y-1">
          <li
            v-for="d in view.pendingReviews"
            :key="d.id"
            class="rounded border border-sky-200 bg-sky-50/40 p-2 text-xs"
          >
            <NuxtLink
              :to="d.link"
              class="font-medium text-sky-900 hover:underline break-words"
            >
              {{ d.title }}
            </NuxtLink>
            <p class="mt-0.5 text-neutral-700">
              {{ d.ownerLabel }}<span v-if="d.dueDate"> · due {{ d.dueDate }}</span>
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- ===== Overdue ===== -->
    <section v-if="!loading" class="space-y-2">
      <h2 class="text-sm font-semibold text-neutral-700">
        Overdue deliverables ({{ view.overdueDeliverables.length }})
      </h2>
      <p
        v-if="view.overdueDeliverables.length === 0"
        class="rounded border border-neutral-200 bg-white p-3 text-xs text-neutral-700"
      >
        No overdue deliverables found.
      </p>
      <ul v-else class="space-y-1">
        <li
          v-for="d in view.overdueDeliverables"
          :key="d.id"
          class="rounded border border-amber-200 bg-amber-50/40 p-2 text-xs"
        >
          <NuxtLink
            :to="d.link"
            class="font-medium text-amber-900 hover:underline break-words"
          >
            {{ d.title }}
          </NuxtLink>
          <p class="mt-0.5 text-neutral-700">
            {{ d.ownerLabel }}<span v-if="d.dueDate"> · due {{ d.dueDate }}</span>
          </p>
          <p class="mt-0.5 italic text-neutral-700">{{ d.whyItMatters }}</p>
        </li>
      </ul>
    </section>

    <!-- ===== Chapter progress ===== -->
    <section v-if="!loading" class="space-y-2">
      <h2 class="text-sm font-semibold text-neutral-700">
        Playbook chapters · progress
      </h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="row in view.chapterProgress"
          :key="row.deliverableId"
          :to="deliverableLink(row.deliverableId)"
          class="block rounded border bg-white p-2 text-xs hover:border-phoenix-300 transition-colors"
          :class="row.isOverdue
            ? 'border-amber-300'
            : row.hasBlockedTasks
              ? 'border-rose-300'
              : row.status === 'approved'
                ? 'border-emerald-300 bg-emerald-50/40'
                : row.status === 'in_review'
                  ? 'border-sky-300 bg-sky-50/40'
                  : 'border-neutral-200'"
        >
          <p class="text-[11px] uppercase text-neutral-500">
            Chapter {{ row.chapter }}
          </p>
          <p class="font-medium text-neutral-900 break-words">{{ row.title }}</p>
          <p class="mt-1 text-neutral-700">{{ row.ownerLabel }}</p>
          <p class="mt-1 flex flex-wrap gap-1">
            <span
              v-if="row.status === 'approved'"
              class="inline-flex items-center rounded border border-emerald-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800"
            >Approved</span>
            <span
              v-else-if="row.status === 'in_review'"
              class="inline-flex items-center rounded border border-sky-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-800"
            >In review</span>
            <span
              v-else-if="row.status === 'needs_revision'"
              class="inline-flex items-center rounded border border-rose-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-800"
            >Needs revision</span>
            <span
              v-else-if="row.status === 'draft'"
              class="inline-flex items-center rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-700"
            >Draft</span>
            <span
              v-else
              class="inline-flex items-center rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-500"
            >Not started</span>
            <span
              v-if="row.isOverdue"
              class="inline-flex items-center rounded border border-amber-400 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900"
            >Overdue</span>
            <span
              v-if="row.hasBlockedTasks"
              class="inline-flex items-center rounded border border-rose-400 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-rose-900"
            >Blocked tasks</span>
          </p>
          <p v-if="row.dueDate" class="mt-1 text-[11px] text-neutral-500">
            due {{ row.dueDate }}
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- ===== Department workload ===== -->
    <section v-if="!loading" class="space-y-2">
      <h2 class="text-sm font-semibold text-neutral-700">
        Department workload
      </h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="row in view.departmentWorkload"
          :key="row.department"
          class="rounded border border-neutral-200 bg-white p-2 text-xs"
        >
          <p class="font-semibold uppercase tracking-wide text-neutral-700">
            {{ row.department }}
          </p>
          <p class="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
            <span class="text-neutral-600">Open tasks</span>
            <span class="font-medium text-neutral-900 text-right">{{ row.openTasks }}</span>
            <span class="text-neutral-600">Blocked</span>
            <span
              class="text-right font-medium"
              :class="row.blockedTasks > 0 ? 'text-rose-700' : 'text-neutral-900'"
            >{{ row.blockedTasks }}</span>
            <span class="text-neutral-600">Overdue</span>
            <span
              class="text-right font-medium"
              :class="row.overdueTasks > 0 ? 'text-amber-700' : 'text-neutral-900'"
            >{{ row.overdueTasks }}</span>
            <span class="text-neutral-600">In review</span>
            <span class="text-right font-medium text-neutral-900">{{ row.inReviewDeliverables }}</span>
          </p>
        </div>
      </div>
    </section>

    <!-- ===== Meeting mode ===== -->
    <section
      v-if="!loading"
      class="rounded-lg border border-phoenix-200 bg-phoenix-50/40 p-4"
    >
      <header class="space-y-1">
        <h2 class="text-base font-semibold text-phoenix-900">
          Run the next leadership check-in
        </h2>
        <p class="text-xs text-phoenix-900/80">
          A 15-minute deterministic agenda built from the work state above.
          Use this in the next C-suite meeting; assign every action item
          through the existing task system.
        </p>
      </header>
      <ol class="mt-3 space-y-2 text-sm text-neutral-900">
        <li
          v-for="item in view.meetingAgenda"
          :key="item.number"
          class="rounded border border-phoenix-200 bg-white p-2"
        >
          <p class="font-semibold text-phoenix-900">
            {{ item.number }}. {{ item.title }}
          </p>
          <p class="mt-1 text-xs text-neutral-700">{{ item.body }}</p>
        </li>
      </ol>
      <p class="mt-3 text-[11px] italic text-neutral-600">
        The Navigator does not call AI, create tasks, change status, or
        approve work. The Executive Advisor (later pass) can read the
        same view to suggest pre-meeting prep without taking decisions.
      </p>
    </section>
  </section>
</template>
