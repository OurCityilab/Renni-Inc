<script setup lang="ts">
// Compact deterministic readiness badge.
// Read-only display of AiReviewDeterministicReadiness. The expandable
// breakdown surfaces the per-signal points so leadership can see what
// drives the score — never an AI judgment, never a personal-character
// score.
import { ref } from 'vue'
import type {
  AiReviewDeterministicReadiness,
  AiReviewReadinessLabel
} from '~/types/aiReviewReports'

const props = withDefaults(
  defineProps<{
    readiness: AiReviewDeterministicReadiness
    compact?: boolean
  }>(),
  { compact: false }
)

const open = ref(false)

const LABEL_COPY: Record<AiReviewReadinessLabel, string> = {
  'high-risk': 'High risk',
  'needs-work': 'Needs work',
  'near-ready': 'Near ready',
  ready: 'Ready'
}

const TONE: Record<AiReviewReadinessLabel, string> = {
  'high-risk': 'border-rose-300 bg-rose-50 text-rose-800',
  'needs-work': 'border-amber-300 bg-amber-50 text-amber-800',
  'near-ready': 'border-sky-300 bg-sky-50 text-sky-800',
  ready: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}

const EXPLAIN: Record<AiReviewReadinessLabel, string> = {
  'high-risk':
    'Significant gaps remain: missing final text, missing required tasks, or overdue work. Coaching and escalation recommended.',
  'needs-work':
    'Real gaps remain. Coach owners on the lowest-scoring signals below before the next review checkpoint.',
  'near-ready':
    'Most signals are healthy. Confirm coverage, address any returned-revision items, and decide whether this is ready for human review.',
  ready:
    'Objective signals are strong. Ready for human review — approval still requires a real reviewer.'
}
</script>

<template>
  <section
    class="rounded-md border p-3 text-sm"
    :class="TONE[readiness.label]"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide">
          Deterministic readiness
        </p>
        <p class="text-2xl font-semibold">
          {{ readiness.deterministicScore }} / 100 · {{ LABEL_COPY[readiness.label] }}
        </p>
      </div>
      <button
        v-if="!compact"
        type="button"
        class="rounded border border-current px-2 py-0.5 text-xs"
        @click="open = !open"
      >
        {{ open ? 'Hide breakdown' : 'Show breakdown' }}
      </button>
    </header>

    <p class="mt-1 text-xs">{{ EXPLAIN[readiness.label] }}</p>

    <p class="mt-1 text-[11px] italic opacity-80">
      Deterministic score from objective signals only. No AI approval,
      no AI grade.
    </p>

    <div
      v-if="open && readiness.scoringBreakdown.length"
      class="mt-3 space-y-1.5 text-xs"
    >
      <p class="font-semibold uppercase tracking-wide">Scoring breakdown</p>
      <ul class="space-y-1">
        <li
          v-for="row in readiness.scoringBreakdown"
          :key="row.signal"
          class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded border border-current/30 bg-white/60 p-1.5"
        >
          <span class="font-medium">{{ row.signal }}</span>
          <span class="text-[11px] opacity-90">
            {{ row.pointsContributed.toFixed(1) }} / {{ row.weight }} pts
          </span>
          <span class="basis-full text-[11px] opacity-80">{{ row.detail }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
