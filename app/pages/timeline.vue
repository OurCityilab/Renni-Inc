<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useRoster } from '~/composables/useRoster'
import { useTasks, type NewTaskInput } from '~/composables/useTasks'
import {
  DEPARTMENTS,
  type Department,
  type Deliverable,
  type Task,
  type TaskPriority,
  type TaskStatus
} from '~/types/models'
import { taskStatusLabel } from '~/utils/taskStatus'

const auth = useAuthStore()
const tasks = useTasks()
const deliverables = useDeliverables()
const roster = useRoster()

const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
const { data: allDeliverables } = deliverables.watchList()
const { data: rosterEntries } = roster.watchAll()

// Mirrors Firestore: admin, Co-CEO, or any chief may create/edit planning.
const canPlan = computed(
  () => auth.isAdmin || auth.isCoCEO || auth.isChief
)

// ---- filters ----
type DeptFilter = 'all' | 'mine' | Department
const deptFilter = ref<DeptFilter>('all')
const statusFilter = ref<TaskStatus | ''>('')
const ownerFilter = ref<string>('')
const deliverableFilter = ref<string>('')

const myDept = computed<Department | null>(
  () => auth.profile?.department ?? null
)

const filtered = computed<Task[]>(() => {
  return allTasks.value.filter((t) => {
    if (deptFilter.value === 'mine') {
      if (!myDept.value || t.department !== myDept.value) return false
    } else if (deptFilter.value !== 'all') {
      if (t.department !== deptFilter.value) return false
    }
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (ownerFilter.value && t.ownerEmail !== ownerFilter.value) return false
    if (deliverableFilter.value && t.deliverableId !== deliverableFilter.value) {
      return false
    }
    return true
  })
})

const ownerOptions = computed(() => {
  const s = new Set<string>()
  for (const t of allTasks.value) if (t.ownerEmail) s.add(t.ownerEmail)
  return Array.from(s).sort()
})

const deliverableOptions = computed<Deliverable[]>(() =>
  [...allDeliverables.value].sort((a, b) => a.chapter - b.chapter)
)

const rosterEmails = computed(() =>
  [...rosterEntries.value]
    .map((r) => r.email)
    .filter(Boolean)
    .sort()
)

// One-shot lookup of email -> users/{uid} so new tasks can carry a real
// ownerUid. Tasks need ownerUid both for /tasks "Mine" queries and for
// owner-driven rule updates (status / blocked). Roster alone isn't
// sufficient — the user must have signed in at least once so the auth
// provisioning endpoint created their users/{uid} doc. Same pattern as
// /team's provisioned-email indicator.
const emailToUid = ref<Map<string, string>>(new Map())
onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    const m = new Map<string, string>()
    snap.forEach((d) => {
      const data = d.data() as { email?: string }
      if (data.email) m.set(data.email.toLowerCase(), d.id)
    })
    emailToUid.value = m
  } catch {
    // Non-fatal; submit will surface a clear "unprovisioned" error if the
    // map is empty and the owner email can't be resolved.
  }
})

// ---- dependency lookup for plain-language rendering ----
const titleById = computed(() => {
  const m = new Map<string, string>()
  for (const t of allTasks.value) m.set(t.id, t.title)
  return m
})
function dependencyNames(t: Task): string {
  const ids = t.dependsOn ?? []
  if (!ids.length) return ''
  return ids.map((id) => titleById.value.get(id) || id).join(', ')
}

// ---- timeline math ----
// Collapse every task's startDate/dueDate into a min-max range so we can
// position bars by percentage. Tasks missing a startDate get an inferred
// 2-day start; tasks missing both dates are rendered in a separate
// "Unscheduled" group rather than fabricated on the chart.

function parseDate(s?: string | null): number | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  const ms = new Date(y, m - 1, d).getTime()
  return Number.isFinite(ms) ? ms : null
}

function inferredStart(t: Task): number | null {
  const s = parseDate(t.startDate)
  if (s !== null) return s
  const d = parseDate(t.dueDate)
  if (d === null) return null
  // 2-day narrow bar so the task is visible but clearly not fully scheduled.
  return d - 2 * 86_400_000
}
function effectiveEnd(t: Task): number | null {
  const d = parseDate(t.dueDate)
  if (d !== null) return d
  return parseDate(t.startDate)
}

const scheduled = computed<Task[]>(() =>
  filtered.value.filter((t) => inferredStart(t) !== null && effectiveEnd(t) !== null)
)
const unscheduled = computed<Task[]>(() =>
  filtered.value.filter((t) => !(inferredStart(t) !== null && effectiveEnd(t) !== null))
)

const rangeMs = computed(() => {
  if (!scheduled.value.length) return { min: 0, max: 1 }
  let min = Infinity
  let max = -Infinity
  for (const t of scheduled.value) {
    const s = inferredStart(t)!
    const e = effectiveEnd(t)!
    if (s < min) min = s
    if (e > max) max = e
  }
  // Pad the range slightly so bars don't sit flush against the edges.
  const pad = Math.max((max - min) * 0.04, 86_400_000)
  return { min: min - pad, max: max + pad }
})

function barStyle(t: Task) {
  const s = inferredStart(t)!
  const e = effectiveEnd(t)!
  const { min, max } = rangeMs.value
  const span = Math.max(max - min, 1)
  const left = ((s - min) / span) * 100
  const width = Math.max(((e - s) / span) * 100, 1.5)
  return { left: `${left}%`, width: `${width}%` }
}

// ---- grouping: by department on the chart ----
const groupedByDept = computed(() => {
  const buckets = new Map<string, Task[]>()
  for (const t of scheduled.value) {
    const key = t.department || 'unassigned'
    const arr = buckets.get(key) ?? []
    arr.push(t)
    buckets.set(key, arr)
  }
  // Stable order: DEPARTMENTS first, then 'unassigned' last.
  const order: string[] = [...DEPARTMENTS, 'unassigned']
  const out: Array<{ label: string; items: Task[] }> = []
  for (const key of order) {
    const items = buckets.get(key)
    if (!items || !items.length) continue
    items.sort((a, b) => (inferredStart(a) ?? 0) - (inferredStart(b) ?? 0))
    out.push({ label: key, items })
  }
  return out
})

const statusBarClass: Record<TaskStatus, string> = {
  not_started: 'bg-neutral-400',
  in_progress: 'bg-amber-500',
  blocked: 'bg-rose-500',
  done: 'bg-emerald-500'
}
const priorityChip: Record<TaskPriority, string> = {
  low: 'border-neutral-300 text-neutral-600',
  medium: 'border-sky-300 bg-sky-50 text-sky-800',
  high: 'border-rose-300 bg-rose-50 text-rose-800'
}

function fmtDate(ms: number | null): string {
  if (ms === null) return '—'
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

// ---- task builder form ----
const builderOpen = ref(false)
const form = ref<{
  title: string
  ownerEmail: string
  department: Department | ''
  deliverableId: string
  startDate: string
  dueDate: string
  dependsOn: string[]
  definitionOfDone: string
  priority: TaskPriority | ''
  notes: string
}>({
  title: '',
  ownerEmail: '',
  department: myDept.value ?? '',
  deliverableId: '',
  startDate: '',
  dueDate: '',
  dependsOn: [],
  definitionOfDone: '',
  priority: '',
  notes: ''
})
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)
const submitting = ref(false)

function resetForm() {
  form.value = {
    title: '',
    ownerEmail: '',
    department: myDept.value ?? '',
    deliverableId: '',
    startDate: '',
    dueDate: '',
    dependsOn: [],
    definitionOfDone: '',
    priority: '',
    notes: ''
  }
  formError.value = null
}

async function submitNewTask() {
  if (!canPlan.value) return
  formError.value = null
  formSuccess.value = null
  if (!form.value.title.trim()) {
    formError.value = 'Task title is required.'
    return
  }
  if (!form.value.ownerEmail.trim()) {
    formError.value = 'Who owns this? (enter an email)'
    return
  }
  if (!form.value.deliverableId) {
    formError.value =
      'Pick a deliverable this task supports. Every task must belong to a Playbook chapter.'
    return
  }
  if (
    form.value.startDate &&
    form.value.dueDate &&
    form.value.startDate > form.value.dueDate
  ) {
    formError.value = 'Start date must be on or before the due date.'
    return
  }
  // Resolve the owner's provisioned uid. Without it, the task appears for
  // chiefs but not in the student's /tasks "Mine" tab and they can't
  // update status via the owner rule branch.
  const ownerEmail = form.value.ownerEmail.trim().toLowerCase()
  const ownerUid = emailToUid.value.get(ownerEmail)
  if (!ownerUid) {
    formError.value =
      `No provisioned user found for "${ownerEmail}". Ask them to sign in to the app once, then try again.`
    return
  }
  submitting.value = true
  try {
    // Resolve linked deliverable's chapter so the Playbook view can group
    // this task under its chapter automatically.
    const d = deliverableOptions.value.find(
      (x) => x.id === form.value.deliverableId
    )
    const payload: NewTaskInput = {
      title: form.value.title.trim(),
      ownerEmail,
      ownerUid,
      department: form.value.department || null,
      deliverableId: form.value.deliverableId,
      playbookChapter: d?.chapter ?? null,
      startDate: form.value.startDate || null,
      dueDate: form.value.dueDate || null,
      dependsOn: form.value.dependsOn,
      definitionOfDone: form.value.definitionOfDone.trim() || null,
      priority: form.value.priority || null,
      notes: form.value.notes.trim() || null,
      assignedByEmail: auth.profile?.email || auth.user?.email || null
    }
    const id = await tasks.create(payload)
    formSuccess.value = `Task created (${id.slice(0, 6)}…).`
    resetForm()
    builderOpen.value = false
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

// Existing-task list for dependency multi-select. Showing everyone's tasks
// keeps cross-dept dependencies possible without extra UI.
const dependencyCandidates = computed<Task[]>(() =>
  [...allTasks.value].sort((a, b) => a.title.localeCompare(b.title))
)
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm text-neutral-500">Planning</p>
        <h1 class="text-2xl font-semibold">Timeline Planner</h1>
        <p class="text-sm text-neutral-600">
          Timeline is the schedule view generated from tasks. Use it to see when work is
          due and what depends on what — update your own work from
          <NuxtLink to="/tasks" class="text-phoenix-700 hover:underline">Tasks</NuxtLink>.
        </p>
      </div>
      <button
        v-if="canPlan"
        class="btn-primary"
        @click="builderOpen = !builderOpen"
      >{{ builderOpen ? 'Close builder' : '+ Plan a task' }}</button>
    </header>

    <!-- Task builder -->
    <section
      v-if="builderOpen && canPlan"
      class="card space-y-3"
    >
      <h2 class="text-sm font-semibold">Plan a new task</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs font-medium text-neutral-800">
          What needs to be done?
          <input
            v-model="form.title" type="text"
            placeholder="e.g. Design House Phoenix beanie signage"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Who owns this?
          <input
            v-model="form.ownerEmail" type="text" list="timeline-owner-options"
            placeholder="owner@example.com"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
          <datalist id="timeline-owner-options">
            <option v-for="e in rosterEmails" :key="e" :value="e" />
          </datalist>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Department
          <select
            v-model="form.department"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">— Unassigned —</option>
            <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Linked deliverable (Playbook chapter) <span class="text-rose-600">*</span>
          <select
            v-model="form.deliverableId"
            required
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">— Pick a Playbook chapter —</option>
            <option
              v-for="d in deliverableOptions"
              :key="d.id"
              :value="d.id"
            >Ch {{ d.chapter }} · {{ d.title }}</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          When should it start?
          <input
            v-model="form.startDate" type="date"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          When is it due?
          <input
            v-model="form.dueDate" type="date"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Priority
          <select
            v-model="form.priority"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">— Unset —</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          What has to happen first? (dependencies)
          <select
            v-model="form.dependsOn"
            multiple
            size="4"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option
              v-for="t in dependencyCandidates"
              :key="t.id"
              :value="t.id"
            >{{ t.title }}</option>
          </select>
          <span class="mt-1 block text-xs text-neutral-500">
            Hold ⌘/Ctrl to select more than one. Leave empty if nothing blocks the start.
          </span>
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          How will we know it is done?
          <textarea
            v-model="form.definitionOfDone" rows="2"
            placeholder="Short definition of done — signage approved, inventory counted, etc."
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          Notes (optional)
          <input
            v-model="form.notes" type="text"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
      </div>
      <div class="flex items-center justify-between gap-2">
        <p v-if="formError" class="text-sm text-rose-600">{{ formError }}</p>
        <p v-else-if="formSuccess" class="text-sm text-emerald-700">{{ formSuccess }}</p>
        <p v-else class="text-xs text-neutral-500">Creates a task you and the owner can see immediately.</p>
        <div class="flex gap-2">
          <button class="btn-secondary" @click="builderOpen = false">Cancel</button>
          <button
            class="btn-primary"
            :disabled="submitting"
            @click="submitNewTask"
          >{{ submitting ? 'Saving…' : 'Save task' }}</button>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="flex flex-wrap gap-2 text-sm">
      <select
        v-model="deptFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="all">All departments</option>
        <option value="mine" :disabled="!myDept">My department</option>
        <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="not_started">Not started</option>
        <option value="in_progress">In progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>
      <select
        v-model="ownerFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All owners</option>
        <option v-for="e in ownerOptions" :key="e" :value="e">{{ e }}</option>
      </select>
      <select
        v-model="deliverableFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All chapters</option>
        <option v-for="d in deliverableOptions" :key="d.id" :value="d.id">
          Ch {{ d.chapter }} · {{ d.title }}
        </option>
      </select>
    </section>

    <!-- Timeline dashboard -->
    <p v-if="tasksLoading" class="text-sm text-neutral-500">Loading tasks…</p>
    <p v-else-if="!filtered.length" class="text-sm text-neutral-500">
      No tasks match the current filters.
    </p>
    <template v-else>
      <div class="mb-1 flex justify-between text-xs text-neutral-500">
        <span>{{ fmtDate(rangeMs.min) }}</span>
        <span>{{ fmtDate(rangeMs.max) }}</span>
      </div>
      <ul class="space-y-4">
        <li
          v-for="group in groupedByDept"
          :key="group.label"
          class="space-y-2"
        >
          <h2 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {{ group.label === 'strategy-growth' ? 'strategy and growth' : group.label }}
          </h2>
          <ul class="space-y-1">
            <li
              v-for="t in group.items"
              :key="t.id"
              class="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-2 md:grid-cols-[18rem_1fr]"
            >
              <div class="min-w-0">
                <p class="font-medium text-neutral-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-neutral-500 truncate">
                  {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
                </p>
                <p
                  v-if="dependencyNames(t)"
                  class="mt-1 text-xs text-neutral-600"
                >
                  ↳ after: {{ dependencyNames(t) }}
                </p>
                <p
                  v-if="t.status === 'blocked' && t.blockedBy"
                  class="mt-1 rounded bg-rose-50 px-1 py-0.5 text-xs text-rose-700"
                >Blocked: {{ t.blockedBy }}</p>
                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    class="rounded-full border px-2 py-0.5 text-xs"
                    :class="{
                      'border-neutral-300 text-neutral-600': t.status === 'not_started',
                      'border-amber-300 bg-amber-50 text-amber-800': t.status === 'in_progress',
                      'border-rose-300 bg-rose-50 text-rose-800': t.status === 'blocked',
                      'border-emerald-300 bg-emerald-50 text-emerald-800': t.status === 'done'
                    }"
                  >{{ taskStatusLabel(t.status) }}</span>
                  <span
                    v-if="t.priority"
                    class="rounded-full border px-2 py-0.5 text-xs"
                    :class="priorityChip[t.priority]"
                  >{{ t.priority }}</span>
                  <NuxtLink
                    v-if="t.deliverableId"
                    :to="`/deliverables/${t.deliverableId}`"
                    class="rounded-full border border-phoenix-300 bg-phoenix-50 px-2 py-0.5 text-xs text-phoenix-800 hover:underline"
                  >ch {{ t.playbookChapter ?? '?' }}</NuxtLink>
                </div>
              </div>
              <!-- Bar -->
              <div class="relative h-6 w-full rounded bg-neutral-50 border border-neutral-100">
                <div
                  class="absolute top-1 h-4 rounded"
                  :class="statusBarClass[t.status]"
                  :style="barStyle(t)"
                  :title="`${t.startDate || 'inferred'} → ${t.dueDate || '—'}`"
                />
              </div>
            </li>
          </ul>
        </li>
      </ul>

      <section v-if="unscheduled.length" class="mt-4 space-y-2">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Unscheduled (missing start and due date)
        </h2>
        <ul class="space-y-1">
          <li
            v-for="t in unscheduled"
            :key="t.id"
            class="rounded-md border border-dashed border-neutral-300 p-2 text-sm"
          >
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-500">
              {{ t.ownerEmail }}<span v-if="t.department"> · {{ t.department }}</span>
            </p>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
