<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { DELIVERABLE_STATUSES, DEPARTMENTS } from '~/types/models'
import type { Deliverable, DeliverableStatus, Department } from '~/types/models'

const deliverables = useDeliverables()

const all = ref<Deliverable[]>([])
const loading = ref(true)
const statusFilter = ref<DeliverableStatus | ''>('')
const deptFilter = ref<Department | ''>('')
const query = ref('')

onMounted(async () => {
  all.value = await deliverables.list()
  loading.value = false
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return all.value.filter((d) => {
    if (statusFilter.value && d.status !== statusFilter.value) return false
    if (deptFilter.value && d.department !== deptFilter.value) return false
    if (q && !(d.title.toLowerCase().includes(q) || String(d.chapter) === q)) return false
    return true
  })
})
</script>

<template>
  <section class="space-y-4">
    <header>
      <p class="text-sm text-neutral-500">Playbook chapters</p>
      <h1 class="text-2xl font-semibold">Deliverables</h1>
      <p class="text-sm text-neutral-600">
        Every chapter, who owns it, and where it stands.
      </p>
    </header>

    <div class="grid gap-2 sm:grid-cols-3">
      <input
        v-model="query"
        type="search"
        placeholder="Search by title or chapter"
        class="rounded border border-neutral-300 p-2 text-sm"
      />
      <select
        v-model="statusFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All statuses</option>
        <option v-for="s in DELIVERABLE_STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select
        v-model="deptFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
      >
        <option value="">All departments</option>
        <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading deliverables…</p>
    <p v-else-if="!filtered.length" class="text-sm text-neutral-500">
      No deliverables match the current filters.
    </p>
    <div v-else class="space-y-2">
      <DeliverableRow
        v-for="d in filtered"
        :key="d.id"
        :deliverable="d"
        show-department
        show-owner
      />
    </div>
  </section>
</template>
