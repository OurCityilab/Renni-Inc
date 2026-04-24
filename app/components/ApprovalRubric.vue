<script setup lang="ts">
import { APPROVAL_RUBRIC } from '~/types/models'

const props = defineProps<{
  rubric?: readonly string[] | string[]
}>()

const items = computed<readonly string[]>(() =>
  props.rubric && props.rubric.length ? props.rubric : APPROVAL_RUBRIC
)
</script>

<template>
  <section class="card">
    <header class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Approval rubric</h2>
      <span class="text-xs text-neutral-500">Visible on every deliverable</span>
    </header>
    <p class="mt-2 text-xs text-neutral-600">
      A deliverable can move to <span class="font-semibold">Approved</span> only if it is:
    </p>
    <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-neutral-800">
      <li v-for="item in items" :key="item" class="capitalize">{{ item }}</li>
    </ol>
    <p class="mt-3 text-xs text-neutral-500">
      Source of truth for approvals lives in Firestore, not in the linked doc.
    </p>
  </section>
</template>
