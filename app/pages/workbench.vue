<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useRoster } from '~/composables/useRoster'
import { useTasks } from '~/composables/useTasks'
import type { Deliverable, Department, RosterEntry, Task } from '~/types/models'
import { taskStatusLabel } from '~/utils/taskStatus'

const auth = useAuthStore()
const tasks = useTasks()
const deliverables = useDeliverables()
const roster = useRoster()

const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
const { data: allDeliverables, loading: deliverablesLoading } = deliverables.watchList()
const { data: rosterEntries, loading: rosterLoading } = roster.watchAll()
const loading = computed(
  () => tasksLoading.value || deliverablesLoading.value || rosterLoading.value
)

// --- audience shape ---
// Members see a focused personal board.
// Chiefs see their own department.
// Admin / Co-CEO / COO see all departments.
const isAdminLevel = computed(() => auth.isAdmin || auth.isCoCEO)
const isCoo = computed(() => auth.profile?.role === 'coo')
const isChief = computed(() => !!auth.isChief && !isAdminLevel.value)
const myDept = computed<Department | null>(() => auth.profile?.department ?? null)

// Cross-department scope when instructor/Co-CEO/COO — chiefs see their own.
const scope = computed<'all' | 'mine' | 'member'>(() => {
  if (isAdminLevel.value || isCoo.value) return 'all'
  if (isChief.value && myDept.value) return 'mine'
  return 'member'
})

// --- task lenses ---

function inDaysFromToday(iso?: string | null, days = 7): boolean {
  if (!iso) return false
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return false
  const due = new Date(y, m - 1, d).getTime()
  const today = new Date()
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return due >= midnight && due <= midnight + days * 86_400_000
}

function byDue(a: Task, b: Task) {
  const ad = a.dueDate || '9999'
  const bd = b.dueDate || '9999'
  return ad < bd ? -1 : ad > bd ? 1 : 0
}

// Tasks this viewer should see as "their scope":
//   - admin/coceo/coo: all tasks
//   - chief: tasks whose department matches their dept
//   - member: their own tasks
const scopedTasks = computed<Task[]>(() => {
  if (scope.value === 'all') return [...allTasks.value].sort(byDue)
  if (scope.value === 'mine') {
    return [...allTasks.value]
      .filter((t) => t.department === myDept.value)
      .sort(byDue)
  }
  return [...allTasks.value]
    .filter((t) => auth.user && t.ownerUid === auth.user.uid)
    .sort(byDue)
})

const blockedTasks = computed(() => scopedTasks.value.filter((t) => t.status === 'blocked'))
const dueSoon = computed(() =>
  scopedTasks.value.filter((t) => t.status !== 'done' && inDaysFromToday(t.dueDate, 7))
)
const unassigned = computed(() =>
  scopedTasks.value.filter((t) => !t.ownerUid)
)
// Overdue: past local midnight, still open. Different surface from
// due-soon — these need re-planning, not just follow-through.
function isPastDue(iso?: string | null): boolean {
  if (!iso) return false
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return false
  const today = new Date()
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return new Date(y, m - 1, d).getTime() < midnight
}
const overdueTasks = computed(() =>
  scopedTasks.value.filter((t) => t.status !== 'done' && isPastDue(t.dueDate))
)
const assignedByMe = computed(() =>
  [...allTasks.value]
    .filter((t) => t.assignedByEmail && auth.profile?.email && t.assignedByEmail === auth.profile.email)
    .sort(byDue)
)

// --- deliverables lens ---
const scopedDeliverables = computed<Deliverable[]>(() => {
  if (scope.value === 'all') return [...allDeliverables.value].sort((a, b) => a.chapter - b.chapter)
  if (scope.value === 'mine') {
    return [...allDeliverables.value]
      .filter((d) => d.department === myDept.value)
      .sort((a, b) => a.chapter - b.chapter)
  }
  // Members: deliverables where they're owner or approver.
  return [...allDeliverables.value]
    .filter(
      (d) =>
        auth.user &&
        (d.ownerUid === auth.user.uid || d.approverUid === auth.user.uid)
    )
    .sort((a, b) => a.chapter - b.chapter)
})
const deliverablesNeedingReview = computed(() =>
  scopedDeliverables.value.filter((d) => d.status === 'in_review')
)
const deliverablesNeedingRevision = computed(() =>
  scopedDeliverables.value.filter((d) => d.status === 'needs_revision')
)
// Task-coverage risk: a non-approved deliverable with zero linked tasks.
// This is the signal that a chief hasn't yet broken their chapter into
// work. Approved deliverables are excluded — if it's already approved,
// missing tasks is no longer a planning problem.
const taskCountByDeliverable = computed(() => {
  const m = new Map<string, number>()
  for (const t of allTasks.value) {
    if (!t.deliverableId) continue
    m.set(t.deliverableId, (m.get(t.deliverableId) ?? 0) + 1)
  }
  return m
})
const deliverablesWithoutTasks = computed(() =>
  scopedDeliverables.value.filter(
    (d) => d.status !== 'approved' && !taskCountByDeliverable.value.get(d.id)
  )
)

// --- team directory (chief / member scope) ---
const myChief = computed<RosterEntry | null>(() => {
  if (!myDept.value) return null
  return (
    rosterEntries.value.find(
      (r) => r.department === myDept.value && r.isChief && r.role !== 'admin'
    ) ?? null
  )
})
const myTeammates = computed<RosterEntry[]>(() => {
  if (!myDept.value) return []
  return [...rosterEntries.value]
    .filter((r) => r.department === myDept.value && r.role !== 'admin')
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
})

// --- controls ---
const canPlan = computed(() => isAdminLevel.value || isCoo.value || isChief.value)
const planning = ref(false)

const scopeLabel = computed(() => {
  if (scope.value === 'all') return 'all departments'
  if (scope.value === 'mine') {
    return myDept.value === 'strategy-growth' ? 'Strategy and Growth' : (myDept.value || 'your department')
  }
  return 'your work'
})

const statusColor: Record<string, string> = {
  not_started: 'border-neutral-300 text-neutral-600',
  in_progress: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-rose-300 bg-rose-50 text-rose-800',
  done: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Workbench</p>
      <h1 class="text-2xl font-semibold">
        {{ scope === 'member' ? 'My work' : `Work · ${scopeLabel}` }}
      </h1>
      <p class="text-sm text-neutral-600">
        Plan and monitor work across your scope. Use this to spot blocked, overdue,
        due-soon, and uncovered work — go to
        <NuxtLink to="/tasks" class="text-phoenix-700 hover:underline">Tasks</NuxtLink>
        when you need to update your own status.
      </p>
      <p class="mt-1 text-sm text-neutral-600">
        <template v-if="scope === 'all'">
          Cross-department view — blockers, upcoming deadlines, deliverables in review, unassigned tasks.
        </template>
        <template v-else-if="scope === 'mine'">
          Your department's workbench — people, deliverables, blockers, due dates.
        </template>
        <template v-else>
          Your tasks, your chief, your teammates, and the deliverables you own or approve.
        </template>
      </p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Loading workbench…</p>

    <template v-else>
      <!-- KPIs -->
      <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        <KpiCard label="Stuck" :value="blockedTasks.length" :tone="blockedTasks.length > 0 ? 'warn' : 'default'" />
        <KpiCard
          label="Overdue"
          :value="overdueTasks.length"
          :tone="overdueTasks.length > 0 ? 'warn' : 'default'"
        />
        <KpiCard label="Due this week" :value="dueSoon.length" />
        <KpiCard label="In review" :value="deliverablesNeedingReview.length" />
        <KpiCard
          v-if="scope !== 'member'"
          label="Unassigned"
          :value="unassigned.length"
          :tone="unassigned.length > 0 ? 'warn' : 'default'"
        />
        <KpiCard
          v-else
          label="Open tasks"
          :value="scopedTasks.filter(t => t.status !== 'done').length"
        />
      </div>

      <!-- Planning (chiefs / admin / Co-CEO / COO) -->
      <section v-if="canPlan" class="space-y-2">
        <header class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-neutral-700">Assign work</h2>
          <button
            class="btn-primary text-xs"
            @click="planning = !planning"
          >{{ planning ? 'Close' : '+ Plan a task' }}</button>
        </header>
        <TaskCreateForm
          v-if="planning"
          :preset-department="scope === 'mine' ? myDept : null"
          :lock-department="scope === 'mine' && !isAdminLevel"
          title="Plan a task"
          @created="planning = false"
          @cancel="planning = false"
        />
      </section>

      <!-- Team (member/chief scope) -->
      <section v-if="scope !== 'all' && myDept" class="card space-y-2">
        <h2 class="text-sm font-semibold">My team</h2>
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs text-neutral-500">Chief</p>
            <p v-if="myChief" class="text-sm text-neutral-900">
              {{ myChief.displayName }}
              <span class="text-xs text-neutral-500">· {{ myChief.title }} · {{ myChief.email }}</span>
            </p>
            <p v-else class="text-sm text-neutral-500">No chief seeded.</p>
          </div>
          <div>
            <p class="text-xs text-neutral-500">Teammates ({{ myTeammates.length }})</p>
            <ul v-if="myTeammates.length" class="mt-1 flex flex-wrap gap-1 text-xs">
              <li
                v-for="m in myTeammates"
                :key="m.email"
                class="rounded-full border border-neutral-200 px-2 py-0.5 text-neutral-700"
              >{{ m.displayName }}</li>
            </ul>
            <p v-else class="text-sm text-neutral-500">—</p>
          </div>
        </div>
        <NuxtLink
          :to="`/departments/${myDept}`"
          class="text-xs text-phoenix-700 hover:underline"
        >Open department page →</NuxtLink>
      </section>

      <!-- Stuck — tasks the team has flagged as needing help. -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Stuck — needs help</h2>
        <p v-if="!blockedTasks.length" class="text-sm text-neutral-500">
          No tasks flagged stuck right now.
        </p>
        <ul v-else class="space-y-1">
          <li
            v-for="t in blockedTasks"
            :key="t.id"
            class="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm"
          >
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-600">
              {{ t.ownerEmail }}<span v-if="t.department"> · {{ t.department }}</span>
              <span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
            </p>
            <p v-if="t.blockedBy" class="mt-1 text-xs text-rose-800">{{ t.blockedBy }}</p>
          </li>
        </ul>
      </section>

      <!-- Overdue -->
      <section v-if="overdueTasks.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-rose-700">Overdue — needs rescheduling</h2>
        <ul class="space-y-1">
          <li
            v-for="t in overdueTasks"
            :key="t.id"
            class="rounded-md border border-rose-300 bg-rose-50 p-2 text-sm"
          >
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-600">
              {{ t.ownerEmail }}<span v-if="t.department"> · {{ t.department }}</span>
              <span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
            </p>
            <NuxtLink
              v-if="t.deliverableId"
              :to="`/deliverables/${t.deliverableId}`"
              class="text-xs text-phoenix-700 hover:underline"
            >↳ open deliverable</NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Due this week -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Due this week</h2>
        <p v-if="!dueSoon.length" class="text-sm text-neutral-500">
          Nothing due in the next 7 days.
        </p>
        <ul v-else class="space-y-1">
          <li
            v-for="t in dueSoon"
            :key="t.id"
            class="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm"
          >
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-600">
              {{ t.ownerEmail }}<span v-if="t.department"> · {{ t.department }}</span>
              · due {{ t.dueDate }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Deliverables needing review (admin/coceo/coo/chief) -->
      <section v-if="scope !== 'member' && deliverablesNeedingReview.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Deliverables needing review</h2>
        <div class="space-y-2">
          <DeliverableRow
            v-for="d in deliverablesNeedingReview"
            :key="d.id"
            :deliverable="d"
            show-owner
            show-department
          />
        </div>
      </section>

      <!-- Deliverables returned for revision: owners need to act, planners
           need to see where the bottleneck is. -->
      <section v-if="deliverablesNeedingRevision.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-rose-700">Deliverables needing revision</h2>
        <div class="space-y-2">
          <DeliverableRow
            v-for="d in deliverablesNeedingRevision"
            :key="d.id"
            :deliverable="d"
            show-owner
            show-department
          />
        </div>
      </section>

      <!-- Deliverables with no task coverage yet. Planner-only surface —
           chiefs need to break these into work before the pop-up. -->
      <section v-if="scope !== 'member' && deliverablesWithoutTasks.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-amber-800">
          Deliverables without task coverage
        </h2>
        <p class="text-xs text-neutral-600">
          These haven't been broken into tasks yet. Use
          <strong>Assign work</strong> on each deliverable's detail page.
        </p>
        <div class="space-y-2">
          <DeliverableRow
            v-for="d in deliverablesWithoutTasks"
            :key="d.id"
            :deliverable="d"
            show-owner
            show-department
          />
        </div>
      </section>

      <!-- Unassigned tasks (admin/coceo/coo) -->
      <section v-if="scope === 'all' && unassigned.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Unassigned tasks</h2>
        <ul class="space-y-1">
          <li
            v-for="t in unassigned"
            :key="t.id"
            class="rounded-md border border-neutral-300 p-2 text-sm"
          >
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-600">
              <span v-if="t.department">{{ t.department }}</span>
              <span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
            </p>
          </li>
        </ul>
      </section>

      <!-- Tasks I assigned (planners) -->
      <section v-if="canPlan && assignedByMe.length" class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Tasks I assigned</h2>
        <ul class="space-y-1">
          <li
            v-for="t in assignedByMe"
            :key="t.id"
            class="rounded-md border border-neutral-200 p-2 text-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium text-neutral-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-neutral-500">
                  {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
                </p>
              </div>
              <span
                class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
                :class="statusColor[t.status]"
              >{{ taskStatusLabel(t.status) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Member: direct links to deeper tools -->
      <section v-if="scope === 'member'" class="space-y-2">
        <p class="text-xs text-neutral-600">
          Need to update your work? Go to <strong>Tasks</strong>. Timeline is a
          schedule view — useful to see what's due, but not where you change status.
        </p>
        <div class="flex flex-wrap gap-2 text-xs">
          <NuxtLink
            to="/tasks"
            class="rounded-md border border-phoenix-300 bg-phoenix-50 px-3 py-2 font-medium text-phoenix-800 hover:border-phoenix-400"
          >
            Update tasks →
          </NuxtLink>
          <NuxtLink
            to="/deliverables"
            class="rounded-md border border-neutral-200 bg-white px-3 py-2 hover:border-phoenix-300"
          >
            Deliverables →
          </NuxtLink>
          <NuxtLink
            to="/timeline"
            class="rounded-md border border-neutral-200 bg-white px-3 py-2 hover:border-phoenix-300"
          >
            Timeline (schedule view) →
          </NuxtLink>
        </div>
      </section>
    </template>
  </section>
</template>
