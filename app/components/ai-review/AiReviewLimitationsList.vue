<script setup lang="ts">
// Renders the limitation rows attached to a deterministic review
// payload. Surfaces them clearly so a leader reads the caveats before
// reacting to the score — especially the attribution caveats that
// keep us from over-claiming who wrote / completed what.
import type { AiReviewLimitation } from '~/types/aiReviewReports'

defineProps<{
  limitations: readonly AiReviewLimitation[]
  title?: string
}>()
</script>

<template>
  <section
    v-if="limitations.length"
    class="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900"
  >
    <p class="font-semibold uppercase tracking-wide">
      {{ title ?? 'What this report cannot prove' }}
    </p>
    <ul class="mt-2 space-y-1">
      <li
        v-for="l in limitations"
        :key="l.code"
        class="flex items-baseline gap-2"
      >
        <span class="font-mono text-[10px] uppercase opacity-70">{{ l.code }}</span>
        <span>{{ l.message }}</span>
      </li>
    </ul>
    <p class="mt-2 text-[11px] italic opacity-80">
      This report reflects assignment, status, evidence, and last-saved
      metadata. It does not prove authorship.
    </p>
  </section>
</template>
