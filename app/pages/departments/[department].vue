<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useGoals } from '~/composables/useGoals'
import { useRoster } from '~/composables/useRoster'
import { useTasks } from '~/composables/useTasks'
import { DEPARTMENTS } from '~/types/models'
import type { Deliverable, Department, RosterEntry, Task } from '~/types/models'
import { taskStatusLabel } from '~/utils/taskStatus'

// Local goal-status label map. Goals are simpler (4 values, single
// surface) so an inline map is preferred over another shared util.
const GOAL_STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  on_track: 'On track',
  at_risk: 'At risk',
  complete: 'Complete'
}
function goalStatusLabel(s?: string | null): string {
  if (!s) return ''
  return GOAL_STATUS_LABEL[s] ?? s
}

const route = useRoute()
const auth = useAuthStore()
const deliverables = useDeliverables()
const goals = useGoals()
const roster = useRoster()
const tasks = useTasks()

const dept = computed(() => String(route.params.department) as Department)
const valid = computed(() => DEPARTMENTS.includes(dept.value))
const label = computed(() =>
  dept.value === 'strategy-growth' ? 'Strategy and Growth' : dept.value
)

const { data: rosterEntries } = roster.watchAll()
const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
const { data: allDeliverables, loading: delLoading } = deliverables.watchList()
const { data: allGoals, loading: goalsLoading } = goals.watchList()

// Department chief excludes admin so the card matches the student-facing org chart.
const chief = computed<RosterEntry | null>(
  () =>
    rosterEntries.value.find(
      (r) => r.department === dept.value && r.isChief && r.role !== 'admin'
    ) ?? null
)
const members = computed<RosterEntry[]>(() =>
  [...rosterEntries.value]
    .filter((r) => r.department === dept.value && r.role !== 'admin')
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
)

const deptDeliverables = computed<Deliverable[]>(() =>
  [...allDeliverables.value]
    .filter((d) => d.department === dept.value)
    .sort((a, b) => a.chapter - b.chapter)
)

const deptTasks = computed<Task[]>(() =>
  [...allTasks.value]
    .filter((t) => t.department === dept.value)
    .sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1)
)
const blockedTasks = computed<Task[]>(() =>
  deptTasks.value.filter((t) => t.status === 'blocked')
)
// Due-soon: within the next 7 days and not done.
function inDaysFromToday(iso?: string | null, days = 7): boolean {
  if (!iso) return false
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return false
  const due = new Date(y, m - 1, d).getTime()
  const today = new Date()
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const horizon = midnight + days * 86_400_000
  return due >= midnight && due <= horizon
}
const dueSoonTasks = computed<Task[]>(() =>
  deptTasks.value.filter(
    (t) => t.status !== 'done' && inDaysFromToday(t.dueDate, 7)
  )
)
const openTasks = computed<Task[]>(() =>
  deptTasks.value.filter((t) => t.status !== 'done')
)

const deptGoals = computed(() =>
  allGoals.value.filter((g) => g.department === dept.value)
)

// Provisioned check — useful for chiefs to see which members haven't signed
// in yet. One-shot like /team.
const provisionedEmails = ref<Set<string>>(new Set())
onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    const s = new Set<string>()
    snap.forEach((d) => {
      const data = d.data() as { email?: string }
      if (data.email) s.add(data.email.toLowerCase())
    })
    provisionedEmails.value = s
  } catch {
    // Non-fatal; the signed-in indicator just won't render.
  }
})
function isProvisioned(m: RosterEntry): boolean {
  return provisionedEmails.value.has(m.email.toLowerCase())
}

const counts = computed(() => ({
  total: deptDeliverables.value.length,
  approved: deptDeliverables.value.filter((x) => x.status === 'approved').length,
  inReview: deptDeliverables.value.filter((x) => x.status === 'in_review').length,
  needsRevision: deptDeliverables.value.filter((x) => x.status === 'needs_revision').length
}))

const canAssign = computed(() => {
  if (auth.isAdmin || auth.isCoCEO) return true
  // COO and department chief for this dept may assign work here.
  if (!auth.isChief) return false
  return auth.profile?.role === 'coo' || auth.profile?.department === dept.value
})

const planning = ref(false)

const statusColor: Record<string, string> = {
  not_started: 'border-neutral-300 text-neutral-600',
  in_progress: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-rose-300 bg-rose-50 text-rose-800',
  done: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}


const deliverableLabelById = computed(() => {
  const m = new Map<string, string>()
  for (const d of allDeliverables.value) {
    m.set(d.id, `Ch ${d.chapter} · ${d.title}`)
  }
  return m
})

function deliverableLinkLabel(t: Task) {
  if (t.deliverableId && deliverableLabelById.value.has(t.deliverableId)) {
    return deliverableLabelById.value.get(t.deliverableId)!
  }
  if (t.playbookChapter != null) return `Ch ${t.playbookChapter} · open deliverable`
  return 'Open deliverable'
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Department</p>
      <h1 class="text-2xl font-semibold capitalize">{{ label }}</h1>
      <p class="text-sm text-neutral-600">
        Team directory, owned deliverables, and the work the department is driving.
      </p>
    </header>

    <div v-if="!valid" class="card text-sm text-rose-700">
      Unknown department "{{ dept }}". Try one of: {{ DEPARTMENTS.filter(d => d !== 'admin').join(', ') }}.
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Deliverables" :value="counts.total" />
        <KpiCard label="Approved" :value="counts.approved" tone="good" />
        <KpiCard
          label="Needs revision"
          :value="counts.needsRevision"
          :tone="counts.needsRevision > 0 ? 'warn' : 'default'"
        />
        <KpiCard
          label="Blocked tasks"
          :value="blockedTasks.length"
          :tone="blockedTasks.length > 0 ? 'warn' : 'default'"
        />
      </div>

      <!-- Who is on this team? -->
      <section class="card space-y-2">
        <h2 class="text-sm font-semibold">Who is on this team?</h2>
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <p class="text-xs text-neutral-500">Chief</p>
            <p v-if="chief" class="text-sm text-neutral-900">
              {{ chief.displayName }}
              <span class="text-xs text-neutral-500">· {{ chief.title }} · {{ chief.email }}</span>
            </p>
            <p v-else class="text-sm text-neutral-500">No chief seeded.</p>
          </div>
          <div>
            <p class="text-xs text-neutral-500">Members ({{ members.length }})</p>
            <ul v-if="members.length" class="mt-1 space-y-1 text-sm">
              <li
                v-for="m in members"
                :key="m.email"
                class="flex items-center justify-between gap-2"
              >
                <span class="truncate">
                  {{ m.displayName }}
                  <span class="text-xs text-neutral-500">· {{ m.email }}</span>
                </span>
                <span
                  class="shrink-0 rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
                  :class="isProvisioned(m)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-300 text-neutral-500'"
                >{{ isProvisioned(m) ? 'Signed in' : 'Pending' }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-neutral-500">—</p>
          </div>
        </div>
      </section>

      <!-- What does this team own? -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">What does this team own?</h2>
        <p v-if="delLoading" class="text-sm text-neutral-500">Loading…</p>
        <p v-else-if="!deptDeliverables.length" class="text-sm text-neutral-500">
          No deliverables assigned to this department.
        </p>
        <div v-else class="space-y-2">
          <DeliverableRow
            v-for="d in deptDeliverables"
            :key="d.id"
            :deliverable="d"
            show-owner
          />
        </div>
      </section>

      <!-- What needs to happen next? -->
      <section class="space-y-2">
        <header class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-neutral-700">What needs to happen next?</h2>
          <button
            v-if="canAssign"
            class="btn-primary text-xs"
            @click="planning = !planning"
          >{{ planning ? 'Close' : '+ Assign a task' }}</button>
        </header>

        <TaskCreateForm
          v-if="planning && canAssign"
          :preset-department="dept"
          :lock-department="true"
          title="Assign work to this department"
          @created="planning = false"
          @cancel="planning = false"
        />

        <p v-if="tasksLoading" class="text-sm text-neutral-500">Loading…</p>
        <p v-else-if="!openTasks.length" class="text-sm text-neutral-500">
          No open tasks for this department.
        </p>
        <ul v-else class="space-y-1">
          <li
            v-for="t in openTasks"
            :key="t.id"
            class="rounded-md border border-neutral-200 p-2 text-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-medium text-neutral-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-neutral-500">
                  {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
                </p>
                <NuxtLink
                  v-if="t.deliverableId"
                  :to="`/deliverables/${t.deliverableId}`"
                  class="text-xs text-phoenix-700 hover:underline"
                >↳ {{ deliverableLinkLabel(t) }}</NuxtLink>
              </div>
              <span
                class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
                :class="statusColor[t.status]"
              >{{ taskStatusLabel(t.status) }}</span>
            </div>
            <p
              v-if="t.status === 'blocked' && t.blockedBy"
              class="mt-1 rounded bg-rose-50 px-1 py-0.5 text-xs text-rose-700"
            >Blocked: {{ t.blockedBy }}</p>
          </li>
        </ul>
      </section>

      <!-- Blocked + Due soon -->
      <div class="grid gap-4 md:grid-cols-2">
        <section class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">What is blocked?</h2>
          <p v-if="!blockedTasks.length" class="text-sm text-neutral-500">
            No blockers on record. Good sign.
          </p>
          <ul v-else class="space-y-1">
            <li
              v-for="t in blockedTasks"
              :key="t.id"
              class="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm"
            >
              <p class="font-medium text-neutral-900">{{ t.title }}</p>
              <p class="text-xs text-neutral-600">
                {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
              </p>
              <p v-if="t.blockedBy" class="mt-1 text-xs text-rose-800">{{ t.blockedBy }}</p>
            </li>
          </ul>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">What is due soon?</h2>
          <p v-if="!dueSoonTasks.length" class="text-sm text-neutral-500">
            Nothing due in the next 7 days.
          </p>
          <ul v-else class="space-y-1">
            <li
              v-for="t in dueSoonTasks"
              :key="t.id"
              class="rounded-md border border-amber-200 bg-amber-50 p-2 text-sm"
            >
              <p class="font-medium text-neutral-900">{{ t.title }}</p>
              <p class="text-xs text-neutral-600">
                {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
              </p>
            </li>
          </ul>
        </section>
      </div>

      <!-- Goals -->
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Goals</h2>
        <p v-if="goalsLoading" class="text-sm text-neutral-500">Loading…</p>
        <p v-else-if="!deptGoals.length" class="text-sm text-neutral-500">
          No goals for this department.
        </p>
        <ul v-else class="grid gap-2 md:grid-cols-2">
          <li
            v-for="g in deptGoals"
            :key="g.id"
            class="rounded-md border border-neutral-200 bg-white p-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium">{{ g.metricName }}</p>
              <span class="text-xs text-neutral-500">{{ goalStatusLabel(g.status) }}</span>
            </div>
            <p class="mt-1 text-xs text-neutral-600">{{ g.current }} / {{ g.target }}</p>
            <div class="mt-2 h-1.5 rounded-full bg-neutral-100">
              <div
                class="h-1.5 rounded-full bg-phoenix-500"
                :style="{
                  width:
                    (g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0) +
                    '%'
                }"
              />
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
