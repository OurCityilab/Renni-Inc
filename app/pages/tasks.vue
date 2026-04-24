<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTasks } from '~/composables/useTasks'
import type { Task, TaskStatus } from '~/types/models'

const auth = useAuthStore()
const tasks = useTasks()

type Tab = 'mine' | 'all'
const tab = ref<Tab>('mine')
const statusFilter = ref<TaskStatus | ''>('')

// Chiefs and admin get the "All" tab — everyone else sees their own queue only.
const canSeeAll = computed(() => auth.isChief || auth.isAdmin)

// Two parallel reactive queries so switching tabs is instant. Both clean up
// via onScopeDispose when the page unmounts.
const myUid = computed(() => auth.user?.uid || '')
const { data: myTasks, loading: myLoading } = tasks.watchByOwner(myUid.value)
const { data: allTasks, loading: allLoading } = canSeeAll.value
  ? tasks.watchAll()
  : { data: ref<Task[]>([]), loading: ref(false) }

// The full set for the current tab, ignoring the status filter. Counts
// and the list derive from this so the summary always matches what the
// tab scope means (Mine = my tasks, All = every task the viewer can see).
const currentSet = computed<Task[]>(() =>
  tab.value === 'mine' ? myTasks.value : allTasks.value
)

const visible = computed<Task[]>(() => {
  if (!statusFilter.value) return currentSet.value
  return currentSet.value.filter((t) => t.status === statusFilter.value)
})

const loading = computed(() =>
  tab.value === 'mine' ? myLoading.value : allLoading.value
)

// Summary counts reflect the current tab's unfiltered set so toggling the
// status filter doesn't zero out the rest of the KPIs.
const blockedCount = computed(
  () => currentSet.value.filter((t) => t.status === 'blocked').length
)
const inProgressCount = computed(
  () => currentSet.value.filter((t) => t.status === 'in_progress').length
)
const notStartedCount = computed(
  () => currentSet.value.filter((t) => t.status === 'not_started').length
)
const doneCount = computed(
  () => currentSet.value.filter((t) => t.status === 'done').length
)

// --- per-row state for inline block dialog ---
const blockingId = ref<string | null>(null)
const blockReason = ref('')
const mutating = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function canMutate(t: Task) {
  return (
    auth.isAdmin ||
    auth.isCoCEO ||
    (auth.user && t.ownerUid === auth.user.uid)
  )
}

async function run(t: Task, fn: () => Promise<void>) {
  mutating.value = t.id
  rowError.value[t.id] = ''
  try {
    await fn()
  } catch (e) {
    rowError.value[t.id] = e instanceof Error ? e.message : String(e)
  } finally {
    mutating.value = null
  }
}

async function advance(t: Task) {
  // Narrowed so setStatus' NonBlockedStatus argument is type-safe — none of
  // these map to 'blocked'. Reaching blocked requires setBlocked + reason.
  const next: Record<TaskStatus, Exclude<TaskStatus, 'blocked'>> = {
    not_started: 'in_progress',
    in_progress: 'done',
    done: 'done',
    blocked: 'in_progress'
  }
  await run(t, () => tasks.setStatus(t.id, next[t.status]))
}

async function markBlocked(t: Task) {
  const reason = blockReason.value.trim()
  if (!reason) {
    rowError.value[t.id] = 'Add a short reason so your team sees the blocker.'
    return
  }
  await run(t, () => tasks.setBlocked(t.id, reason))
  blockingId.value = null
  blockReason.value = ''
}

async function unblock(t: Task) {
  await run(t, () => tasks.clearBlocked(t.id))
}

async function reopen(t: Task) {
  await run(t, () => tasks.setStatus(t.id, 'in_progress'))
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Working list</p>
      <h1 class="text-2xl font-semibold">Tasks</h1>
      <p class="text-sm text-neutral-600">
        Tasks roll up to deliverables. Mark blocked with a reason so the team can unblock you.
      </p>
    </header>

    <div class="grid gap-3 sm:grid-cols-4">
      <KpiCard label="Blocked" :value="blockedCount" :tone="blockedCount > 0 ? 'warn' : 'default'" />
      <KpiCard label="In progress" :value="inProgressCount" />
      <KpiCard label="Not started" :value="notStartedCount" />
      <KpiCard label="Done" :value="doneCount" tone="good" />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex gap-1 rounded-md border border-neutral-200 bg-white p-1 text-sm">
        <button
          class="rounded px-3 py-1"
          :class="tab === 'mine' ? 'bg-neutral-100 font-medium' : 'text-neutral-600'"
          @click="tab = 'mine'"
        >Mine</button>
        <button
          v-if="canSeeAll"
          class="rounded px-3 py-1"
          :class="tab === 'all' ? 'bg-neutral-100 font-medium' : 'text-neutral-600'"
          @click="tab = 'all'"
        >All</button>
      </div>
      <select
        v-model="statusFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="not_started">not_started</option>
        <option value="in_progress">in_progress</option>
        <option value="blocked">blocked</option>
        <option value="done">done</option>
      </select>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
    <p v-else-if="!visible.length" class="text-sm text-neutral-500">
      {{ tab === 'mine' ? 'No tasks assigned to you.' : 'No tasks match the current filter.' }}
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="t in visible"
        :key="t.id"
        class="card space-y-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-neutral-900">{{ t.title }}</p>
            <p class="text-xs text-neutral-500">
              {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
            </p>
            <NuxtLink
              v-if="t.deliverableId"
              :to="`/deliverables/${t.deliverableId}`"
              class="text-xs text-phoenix-700 hover:underline"
            >
              ↳ {{ t.deliverableId }}
            </NuxtLink>
          </div>
          <span
            class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
            :class="{
              'border-neutral-300 text-neutral-600': t.status === 'not_started',
              'border-amber-300 bg-amber-50 text-amber-800': t.status === 'in_progress',
              'border-rose-300 bg-rose-50 text-rose-800': t.status === 'blocked',
              'border-emerald-300 bg-emerald-50 text-emerald-800': t.status === 'done'
            }"
          >{{ t.status }}</span>
        </div>

        <p
          v-if="t.status === 'blocked' && t.blockedBy"
          class="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800"
        >
          Blocked: {{ t.blockedBy }}
        </p>

        <p v-if="t.notes" class="text-xs text-neutral-600">{{ t.notes }}</p>

        <div v-if="canMutate(t)" class="flex flex-wrap gap-2 pt-1">
          <button
            v-if="t.status === 'not_started'"
            class="btn-primary"
            :disabled="mutating === t.id"
            @click="advance(t)"
          >Start</button>
          <button
            v-if="t.status === 'in_progress'"
            class="btn-primary"
            :disabled="mutating === t.id"
            @click="advance(t)"
          >Mark done</button>
          <button
            v-if="t.status === 'done'"
            class="btn-secondary"
            :disabled="mutating === t.id"
            @click="reopen(t)"
          >Reopen</button>
          <button
            v-if="t.status === 'blocked'"
            class="btn-secondary"
            :disabled="mutating === t.id"
            @click="unblock(t)"
          >Unblock</button>
          <button
            v-if="t.status !== 'blocked' && t.status !== 'done'"
            class="btn-secondary"
            :disabled="mutating === t.id"
            @click="blockingId = blockingId === t.id ? null : t.id; blockReason = ''"
          >
            {{ blockingId === t.id ? 'Cancel' : 'Mark blocked' }}
          </button>
        </div>

        <div
          v-if="blockingId === t.id"
          class="rounded-md border border-rose-200 bg-rose-50 p-2"
        >
          <label class="block text-xs font-medium text-rose-900">
            What's blocking this task?
          </label>
          <textarea
            v-model="blockReason"
            rows="2"
            class="mt-1 w-full rounded border border-rose-300 bg-white p-2 text-sm"
            placeholder="e.g. waiting on inventory counts from ops"
          />
          <div class="mt-2 flex justify-end">
            <button
              class="btn-primary"
              :disabled="mutating === t.id"
              @click="markBlocked(t)"
            >Save blocker</button>
          </div>
        </div>

        <p v-if="rowError[t.id]" class="text-xs text-rose-600">{{ rowError[t.id] }}</p>
      </li>
    </ul>
  </section>
</template>
