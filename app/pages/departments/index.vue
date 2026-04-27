<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useRoster } from '~/composables/useRoster'
import { useTasks } from '~/composables/useTasks'
import { DEPARTMENTS, type Department, type RosterEntry, type Task } from '~/types/models'

const auth = useAuthStore()
const roster = useRoster()
const tasks = useTasks()
const deliverables = useDeliverables()

const { data: rosterEntries, loading: rosterLoading } = roster.watchAll()
const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
const { data: allDeliverables, loading: delLoading } = deliverables.watchList()

// Instructor / program-lead column is administrative plumbing, not a
// team to show on the student-facing directory.
const visibleDepartments: Department[] = DEPARTMENTS.filter(
  (d) => d !== 'admin'
) as Department[]

function chiefOf(dept: Department): RosterEntry | null {
  return (
    rosterEntries.value.find(
      (r) => r.department === dept && r.isChief && r.role !== 'admin'
    ) ?? null
  )
}
function membersOf(dept: Department): RosterEntry[] {
  return rosterEntries.value
    .filter((r) => r.department === dept && r.role !== 'admin')
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''))
}
function tasksOf(dept: Department): Task[] {
  return allTasks.value.filter((t) => t.department === dept)
}
function deliverablesOf(dept: Department): number {
  return allDeliverables.value.filter((d) => d.department === dept).length
}
function nextDueIn(dept: Department): string | null {
  const upcoming = allTasks.value
    .filter((t) => t.department === dept && t.status !== 'done' && t.dueDate)
    .map((t) => t.dueDate as string)
    .sort()
  return upcoming[0] ?? null
}

const rows = computed(() =>
  visibleDepartments.map((d) => {
    const dTasks = tasksOf(d)
    return {
      key: d,
      label: d === 'strategy-growth' ? 'Strategy and Growth' : d,
      chief: chiefOf(d),
      members: membersOf(d),
      active: dTasks.filter((t) => t.status !== 'done').length,
      blocked: dTasks.filter((t) => t.status === 'blocked').length,
      deliverables: deliverablesOf(d),
      nextDue: nextDueIn(d)
    }
  })
)

const loading = computed(() => rosterLoading.value || tasksLoading.value || delLoading.value)
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Company structure</p>
      <h1 class="text-2xl font-semibold">Departments</h1>
      <p class="text-sm text-neutral-600">
        Departments show team ownership: who is on each team, what they own, and
        what needs attention. Tap a department to see its people, deliverables, tasks,
        blockers, and what's due next.
      </p>
      <p v-if="auth.isAdmin" class="mt-1 text-xs text-neutral-500">
        You're looking at the student-visible view. Use
        <NuxtLink to="/team" class="text-phoenix-700 hover:underline">/team</NuxtLink>
        for role management.
      </p>
    </header>

    <p v-if="loading" class="text-sm text-neutral-500">Loading departments…</p>

    <ul v-else class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="row in rows"
        :key="row.key"
        class="card space-y-2"
      >
        <header class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-wide text-neutral-500">Department</p>
            <h2 class="text-lg font-medium text-neutral-900">{{ row.label }}</h2>
          </div>
          <NuxtLink
            :to="`/departments/${row.key}`"
            class="text-xs text-phoenix-700 hover:underline"
          >Open →</NuxtLink>
        </header>

        <div>
          <p class="text-xs text-neutral-500">Chief</p>
          <p v-if="row.chief" class="text-sm text-neutral-900">
            {{ row.chief.displayName }}
            <span class="text-xs text-neutral-500">· {{ row.chief.title }}</span>
          </p>
          <p v-else class="text-sm text-neutral-500">No chief seeded.</p>
        </div>

        <div>
          <p class="text-xs text-neutral-500">Members ({{ row.members.length }})</p>
          <p v-if="!row.members.length" class="text-sm text-neutral-500">—</p>
          <ul v-else class="flex flex-wrap gap-1 text-xs">
            <li
              v-for="m in row.members"
              :key="m.email"
              class="rounded-full border border-neutral-200 px-2 py-0.5 text-neutral-700"
            >{{ m.displayName }}</li>
          </ul>
        </div>

        <dl class="grid grid-cols-4 gap-2 text-xs">
          <div class="rounded-md border border-neutral-200 p-2">
            <dt class="text-neutral-500">Active tasks</dt>
            <dd class="mt-0.5 text-sm font-medium text-neutral-900">{{ row.active }}</dd>
          </div>
          <div class="rounded-md border border-neutral-200 p-2">
            <dt class="text-neutral-500">Stuck</dt>
            <dd
              class="mt-0.5 text-sm font-medium"
              :class="row.blocked > 0 ? 'text-rose-700' : 'text-neutral-900'"
            >{{ row.blocked }}</dd>
          </div>
          <div class="rounded-md border border-neutral-200 p-2">
            <dt class="text-neutral-500">Deliverables</dt>
            <dd class="mt-0.5 text-sm font-medium text-neutral-900">{{ row.deliverables }}</dd>
          </div>
          <div class="rounded-md border border-neutral-200 p-2">
            <dt class="text-neutral-500">Next due</dt>
            <dd class="mt-0.5 text-sm font-medium text-neutral-900">
              {{ row.nextDue || '—' }}
            </dd>
          </div>
        </dl>
      </li>
    </ul>
  </section>
</template>
