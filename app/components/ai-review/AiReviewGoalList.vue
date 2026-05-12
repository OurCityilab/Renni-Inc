<script setup lang="ts">
import type { AiReviewGoalSummary } from '~/types/aiReviewReports'

defineProps<{
  goals: readonly AiReviewGoalSummary[]
}>()

const TONE: Record<AiReviewGoalSummary['status'], string> = {
  not_started: 'border-neutral-300 text-neutral-700',
  on_track: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  at_risk: 'border-amber-300 bg-amber-50 text-amber-800',
  complete: 'border-emerald-400 bg-emerald-50 text-emerald-900'
}
</script>

<template>
  <section v-if="goals.length" class="space-y-2">
    <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
      Goals / KPIs in scope ({{ goals.length }})
    </p>
    <ul class="space-y-1.5">
      <li
        v-for="goal in goals"
        :key="`goal-${goal.id}`"
        class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-medium text-neutral-900">{{ goal.metricName }}</p>
          <span
            class="rounded-full border px-2 py-0.5 text-xs"
            :class="TONE[goal.status]"
          >{{ goal.statusLabel }}</span>
        </div>
        <p class="text-[11px] text-neutral-600">
          {{ goal.department }} · target {{ goal.target }} · current {{ goal.current }}
          <span v-if="goal.progressPercent != null"> · {{ goal.progressPercent }}%</span>
          <span v-if="goal.ownerEmail"> · Assigned to {{ goal.ownerEmail }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>
