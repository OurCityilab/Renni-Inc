<script setup lang="ts">
import type { Deliverable } from '~/types/models'

const props = defineProps<{
  deliverable: Deliverable
  showDepartment?: boolean
  showOwner?: boolean
}>()

function fmtDate(iso: string | undefined | null) {
  if (!iso) return '—'
  // Seed stores yyyy-mm-dd. Keep timezone-neutral by parsing as plain date.
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

const overdue = computed(() => {
  if (props.deliverable.status === 'approved') return false
  const today = new Date()
  const [y, m, d] = (props.deliverable.dueDate || '').split('-').map(Number)
  if (!y || !m || !d) return false
  const due = new Date(y, m - 1, d)
  return due.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
})
</script>

<template>
  <NuxtLink
    :to="`/deliverables/${deliverable.id}`"
    class="block rounded-md border border-neutral-200 bg-white p-3 hover:bg-neutral-50"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs text-neutral-500">
          Ch. {{ deliverable.chapter }}<span v-if="showDepartment"> · {{ deliverable.department }}</span>
        </p>
        <p class="truncate text-sm font-medium text-neutral-900">
          {{ deliverable.title }}
        </p>
        <p v-if="showOwner" class="text-xs text-neutral-500">
          Owner: {{ deliverable.ownerEmail }}
        </p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1">
        <StatusChip :status="deliverable.status" />
        <span
          class="text-xs"
          :class="overdue ? 'text-rose-600 font-semibold' : 'text-neutral-500'"
        >
          Due {{ fmtDate(deliverable.dueDate) }}
          <span v-if="overdue"> · overdue</span>
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
