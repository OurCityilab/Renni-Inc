<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useGoals } from '~/composables/useGoals'
import {
  DEPARTMENTS,
  GOAL_STATUSES,
  type Department,
  type Goal,
  type GoalStatus
} from '~/types/models'

const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: 'Not started',
  on_track: 'On track',
  at_risk: 'At risk',
  complete: 'Complete'
}

const auth = useAuthStore()
const goals = useGoals()
const { data: allGoals, loading } = goals.watchList()

const deptFilter = ref<Department | ''>('')
const ownerFilter = ref<string>('')
const statusFilter = ref<GoalStatus | ''>('')

// Sorted owners dropdown populated from the current goal set so empty
// values don't appear. Intentionally not the full C-Suite roster — a
// chief/member without a goal won't show up here. See /team for roster.
const ownerOptions = computed(() => {
  const set = new Set<string>()
  for (const g of allGoals.value) if (g.ownerEmail) set.add(g.ownerEmail)
  return Array.from(set).sort()
})

const visible = computed<Goal[]>(() => {
  return allGoals.value.filter((g) => {
    if (deptFilter.value && g.department !== deptFilter.value) return false
    if (ownerFilter.value && g.ownerEmail !== ownerFilter.value) return false
    if (statusFilter.value && g.status !== statusFilter.value) return false
    return true
  })
})

// KPI cards reflect the currently filtered goal list so toggling a filter
// updates both the list and the summary consistently.
const totalCount = computed(() => visible.value.length)
const completeCount = computed(
  () => visible.value.filter((g) => g.status === 'complete').length
)
const atRiskCount = computed(
  () => visible.value.filter((g) => g.status === 'at_risk').length
)
const onTrackCount = computed(
  () => visible.value.filter((g) => g.status === 'on_track').length
)

function percent(g: Goal): number | null {
  if (!g.target || g.target <= 0) return null
  return Math.max(0, Math.min(100, Math.round((g.current / g.target) * 100)))
}

// Firestore rules: admin/coceo always allowed; a chief can update only if
// they own the goal. Keep UI in lockstep with the rule so failed writes
// aren't surprising.
function canEdit(g: Goal): boolean {
  if (auth.isAdmin || auth.isCoCEO) return true
  if (!auth.user) return false
  return !!auth.isChief && g.ownerUid === auth.user.uid
}

// --- inline edit state ---
const editingId = ref<string | null>(null)
const draftCurrent = ref<number>(0)
const draftStatus = ref<GoalStatus>('not_started')
const savingId = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})

function startEdit(g: Goal) {
  editingId.value = g.id
  draftCurrent.value = g.current ?? 0
  draftStatus.value = g.status
  rowError.value[g.id] = ''
}

function cancelEdit() {
  editingId.value = null
}

async function save(g: Goal) {
  savingId.value = g.id
  rowError.value[g.id] = ''
  try {
    // Only write fields that changed so we don't fire unnecessary updates.
    const tasks: Promise<void>[] = []
    if (Number(draftCurrent.value) !== Number(g.current)) {
      tasks.push(goals.setCurrent(g.id, Number(draftCurrent.value) || 0))
    }
    if (draftStatus.value !== g.status) {
      tasks.push(goals.setStatus(g.id, draftStatus.value))
    }
    await Promise.all(tasks)
    editingId.value = null
  } catch (e) {
    rowError.value[g.id] = e instanceof Error ? e.message : String(e)
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Team targets</p>
      <h1 class="text-2xl font-semibold">Goals</h1>
      <p class="text-sm text-neutral-600">
        Track progress against each department's targets. Admins, Co-CEOs, and the
        owning chief can update current value and status.
      </p>
    </header>

    <div class="grid gap-3 sm:grid-cols-4">
      <KpiCard label="Total" :value="totalCount" />
      <KpiCard label="Complete" :value="completeCount" tone="good" />
      <KpiCard label="On track" :value="onTrackCount" />
      <KpiCard
        label="At risk"
        :value="atRiskCount"
        :tone="atRiskCount > 0 ? 'warn' : 'default'"
      />
    </div>

    <div class="grid gap-2 sm:grid-cols-3">
      <select
        v-model="deptFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All departments</option>
        <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
      </select>
      <select
        v-model="ownerFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All goal owners</option>
        <option v-for="e in ownerOptions" :key="e" :value="e">{{ e }}</option>
      </select>
      <select
        v-model="statusFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All statuses</option>
        <option v-for="s in GOAL_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading goals…</p>
    <p v-else-if="!visible.length" class="text-sm text-neutral-500">
      No goals match the current filters.
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="g in visible"
        :key="g.id"
        class="card space-y-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-neutral-900">{{ g.metricName }}</p>
            <p class="text-xs text-neutral-500">
              {{ g.department }} · {{ g.ownerEmail || 'unassigned' }}
            </p>
            <p v-if="g.notes" class="mt-1 text-xs text-neutral-600">{{ g.notes }}</p>
          </div>
          <span
            class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
            :class="{
              'border-neutral-300 text-neutral-600': g.status === 'not_started',
              'border-amber-300 bg-amber-50 text-amber-800': g.status === 'on_track',
              'border-rose-300 bg-rose-50 text-rose-800': g.status === 'at_risk',
              'border-emerald-300 bg-emerald-50 text-emerald-800': g.status === 'complete'
            }"
          >{{ GOAL_STATUS_LABEL[g.status] }}</span>
        </div>

        <div>
          <div class="flex items-baseline justify-between text-xs text-neutral-600">
            <span>{{ g.current ?? 0 }} / {{ g.target || '—' }}</span>
            <span v-if="percent(g) !== null">{{ percent(g) }}%</span>
            <span v-else>—</span>
          </div>
          <div
            v-if="percent(g) !== null"
            class="mt-1 h-2 w-full overflow-hidden rounded bg-neutral-100"
          >
            <div
              class="h-full rounded bg-phoenix-600"
              :style="{ width: percent(g) + '%' }"
            />
          </div>
        </div>

        <div v-if="editingId === g.id" class="space-y-2 border-t border-neutral-200 pt-2">
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="text-xs font-medium text-neutral-800">
              Current value
              <input
                v-model.number="draftCurrent"
                type="number"
                min="0"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Status
              <select
                v-model="draftStatus"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              >
                <option v-for="s in GOAL_STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" @click="cancelEdit">Cancel</button>
            <button
              class="btn-primary"
              :disabled="savingId === g.id"
              @click="save(g)"
            >
              {{ savingId === g.id ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
        <div v-else-if="canEdit(g)" class="flex justify-end">
          <button class="btn-secondary" @click="startEdit(g)">Update</button>
        </div>
        <p v-if="rowError[g.id]" class="text-xs text-rose-600">{{ rowError[g.id] }}</p>
      </li>
    </ul>
  </section>
</template>
