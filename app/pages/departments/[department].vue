<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDeliverables } from '~/composables/useDeliverables'
import { useGoals } from '~/composables/useGoals'
import { DEPARTMENTS } from '~/types/models'
import type { Deliverable, Department, Goal } from '~/types/models'

const route = useRoute()
const deliverables = useDeliverables()
const goals = useGoals()

const dept = computed(() => String(route.params.department) as Department)
const valid = computed(() => DEPARTMENTS.includes(dept.value))

const list = ref<Deliverable[]>([])
const deptGoals = ref<Goal[]>([])
const loading = ref(true)

async function load() {
  if (!valid.value) {
    loading.value = false
    return
  }
  const [d, g] = await Promise.all([
    deliverables.list({ department: dept.value }),
    goals.listByDepartment(dept.value)
  ])
  list.value = d
  deptGoals.value = g
  loading.value = false
}

onMounted(load)

const counts = computed(() => ({
  total: list.value.length,
  approved: list.value.filter((x) => x.status === 'approved').length,
  inReview: list.value.filter((x) => x.status === 'in_review').length,
  needsRevision: list.value.filter((x) => x.status === 'needs_revision').length,
  draft: list.value.filter((x) => x.status === 'draft').length
}))
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Department</p>
      <h1 class="text-2xl font-semibold capitalize">{{ dept.replace('-', ' & ') }}</h1>
    </header>

    <div v-if="!valid" class="card text-sm text-rose-700">
      Unknown department “{{ dept }}”. Try one of: {{ DEPARTMENTS.join(', ') }}.
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total" :value="counts.total" />
        <KpiCard label="Approved" :value="counts.approved" tone="good" />
        <KpiCard label="In review" :value="counts.inReview" />
        <KpiCard
          label="Needs revision"
          :value="counts.needsRevision"
          :tone="counts.needsRevision > 0 ? 'warn' : 'default'"
        />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">Deliverables</h2>
          <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
          <p v-else-if="!list.length" class="text-sm text-neutral-500">
            No deliverables seeded for this department yet.
          </p>
          <div v-else class="space-y-2">
            <DeliverableRow
              v-for="d in list"
              :key="d.id"
              :deliverable="d"
              show-owner
            />
          </div>
        </div>

        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">Goals</h2>
          <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
          <p v-else-if="!deptGoals.length" class="text-sm text-neutral-500">
            No goals seeded for this department.
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="g in deptGoals"
              :key="g.id"
              class="rounded-md border border-neutral-200 bg-white p-3"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">{{ g.metricName }}</p>
                <span class="text-xs text-neutral-500">{{ g.status }}</span>
              </div>
              <p class="mt-1 text-xs text-neutral-600">
                {{ g.current }} / {{ g.target }}
              </p>
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
        </div>
      </div>
    </template>
  </section>
</template>
