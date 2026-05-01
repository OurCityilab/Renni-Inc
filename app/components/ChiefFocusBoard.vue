<!--
  ChiefFocusBoard — display-only deterministic top-5 focus items
  derived from task coverage. Shows P0 missing-task / blocked /
  overdue / ready-for-review sections first, then P1 if P0 is clean.

  POSTURE
  -------
    - Pure presentational. No Firestore writes, no AI calls, no
      mutation. The "suggested chief move" is copy the chief reads
      and acts on through the existing Tasks / Deliverables flow.
    - Display-only. No "Create task" button — the platform never
      creates tasks automatically.
-->
<script setup lang="ts">
import type {
  ChiefFocusItem,
  CoverageMatchConfidence
} from '~/utils/taskCoverageMap'

defineProps<{
  items: readonly ChiefFocusItem[]
}>()

function priorityChipClass(p: 'P0' | 'P1' | 'P2'): string {
  switch (p) {
    case 'P0':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'P1':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'P2':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

function confidenceChipClass(c: CoverageMatchConfidence): string {
  switch (c) {
    case 'high':
      return 'border-emerald-300 bg-emerald-50 text-emerald-900'
    case 'medium':
      return 'border-sky-300 bg-sky-50 text-sky-900'
    case 'low':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'none':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

function confidenceChipLabel(c: CoverageMatchConfidence): string {
  switch (c) {
    case 'high':
      return 'High confidence'
    case 'medium':
      return 'Medium confidence'
    case 'low':
      return 'Low confidence'
    case 'none':
      return 'No match'
  }
}

const COVERAGE_HELP_TEXT =
  'Coverage means a task appears connected to this section. It does not mean the work is complete or approved.'
</script>

<template>
  <section class="space-y-2 min-w-0" aria-label="Chief Focus Board">
    <header>
      <h2 class="text-sm font-semibold text-neutral-700">
        Chief Focus — push on these now
      </h2>
      <p class="text-xs text-neutral-500">
        Display-only. Top deterministic actions ranked by priority +
        coverage gap + blockers. The platform never creates tasks
        automatically — chiefs decide and seed manually.
      </p>
    </header>

    <p
      v-if="items.length === 0"
      class="rounded border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900"
    >
      P0 task coverage looks clean right now. Re-check after the next
      class block — coverage drifts as tasks land and dueDates shift.
    </p>

    <ul v-else class="grid gap-2 sm:grid-cols-2 min-w-0">
      <li
        v-for="item in items"
        :key="item.node.id"
        class="rounded border border-neutral-200 bg-white p-3 min-w-0"
      >
        <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <p class="text-sm font-semibold text-neutral-900 break-words">
            {{ item.node.sectionTitle }}
          </p>
          <div class="flex flex-wrap items-baseline gap-1">
            <span
              class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="priorityChipClass(item.node.priority)"
            >
              {{ item.node.priority }}
            </span>
            <span
              class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="confidenceChipClass(item.node.matchConfidence)"
              :title="item.node.matchReason"
            >
              {{ confidenceChipLabel(item.node.matchConfidence) }}
            </span>
          </div>
        </header>

        <p class="mt-1 text-xs text-neutral-700 break-words">
          {{ item.reason }}
        </p>
        <p
          class="mt-0.5 text-[11px] italic text-neutral-600 break-words"
          :title="COVERAGE_HELP_TEXT"
        >
          {{ item.node.matchReason }}
        </p>

        <dl class="mt-1 space-y-0.5 text-[11px] text-neutral-700">
          <div class="break-words">
            <dt class="inline font-semibold text-neutral-800">Why it matters:</dt>
            {{ ' ' + item.node.definitionOfDone }}
          </div>
          <div class="break-words">
            <dt class="inline font-semibold text-neutral-800">Owner:</dt>
            {{ ' ' + item.node.owner }}
            <span class="text-neutral-500"> · </span>
            <dt class="inline font-semibold text-neutral-800">Reviewer:</dt>
            {{ ' ' + item.node.reviewer }}
          </div>
          <div v-if="item.node.dependency" class="break-words italic text-neutral-600">
            <dt class="inline">Depends on:</dt>
            {{ ' ' + item.node.dependency }}
          </div>
          <div class="break-words text-rose-800">
            <dt class="inline font-semibold">Suggested chief move:</dt>
            {{ ' ' + item.suggestedChiefMove }}
          </div>
        </dl>

        <NuxtLink
          :to="item.node.route"
          class="mt-2 inline-flex rounded border border-phoenix-300 bg-phoenix-50 px-2 py-1 text-xs font-medium text-phoenix-900 hover:bg-phoenix-100"
        >
          Open the section →
        </NuxtLink>
      </li>
    </ul>

    <p
      class="text-[11px] italic text-neutral-500"
      :title="COVERAGE_HELP_TEXT"
    >
      Advisor prepares · Chiefs decide. {{ COVERAGE_HELP_TEXT }}
    </p>
  </section>
</template>
