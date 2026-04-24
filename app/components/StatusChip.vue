<script setup lang="ts">
import type { DeliverableStatus } from '~/types/models'

const props = defineProps<{ status: DeliverableStatus }>()

const LABELS: Record<DeliverableStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  needs_revision: 'Needs revision',
  approved: 'Approved'
}

const classes: Record<DeliverableStatus, string> = {
  draft: 'chip-draft',
  in_review: 'chip-review',
  needs_revision: 'chip-revision',
  approved: 'chip-approved'
}
</script>

<template>
  <span :class="classes[props.status]">{{ LABELS[props.status] }}</span>
</template>
