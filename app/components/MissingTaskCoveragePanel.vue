<!--
  MissingTaskCoveragePanel — display-only list of P0 / P1 sections
  that have no matching task. Chiefs use this as a manual seed list
  for the existing Tasks form.

  POSTURE
  -------
    - Pure presentational. No "Create task" button. The platform
      never creates tasks automatically. Each card is a copy-paste
      target for the chief to use through the existing flow.
-->
<script setup lang="ts">
import type { TaskCoverageNode } from '~/utils/taskCoverageMap'

defineProps<{
  nodes: readonly TaskCoverageNode[]
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

const COVERAGE_HELP_TEXT =
  'Coverage means a task appears connected to this section. It does not mean the work is complete or approved.'
</script>

<template>
  <section class="space-y-2 min-w-0" aria-label="Missing Task Coverage Panel">
    <header>
      <h2 class="text-sm font-semibold text-neutral-700">
        Missing task coverage
      </h2>
      <p
        class="text-xs text-neutral-500"
        :title="COVERAGE_HELP_TEXT"
      >
        These are manual task suggestions. The platform does not
        create them automatically — paste the recommended title into
        the existing Tasks form when you decide to seed one. {{ COVERAGE_HELP_TEXT }}
      </p>
    </header>

    <p
      v-if="nodes.length === 0"
      class="rounded border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900"
    >
      Every P0 / P1 section currently has a matching task. Coverage
      drifts as deadlines move — re-check after the next class block.
    </p>

    <ul v-else class="grid gap-2 sm:grid-cols-2 min-w-0">
      <li
        v-for="node in nodes"
        :key="node.id"
        class="rounded border border-rose-200 bg-rose-50/30 p-3 min-w-0"
      >
        <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <p class="text-sm font-semibold text-neutral-900 break-words">
            {{ node.sectionTitle }}
          </p>
          <span
            class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="priorityChipClass(node.priority)"
          >
            {{ node.priority }}
          </span>
        </header>

        <p class="text-[11px] text-neutral-500 break-words">
          {{ node.laneTitle }} · {{ node.chapterId }}
        </p>

        <p
          class="mt-1 rounded border border-rose-200 bg-white/70 p-1.5 text-[11px] text-rose-900 break-words"
        >
          <span class="font-semibold">Why missing:</span>
          {{ ' ' + (node.coverageNote || node.matchReason) }}
        </p>

        <dl class="mt-1 space-y-0.5 text-[11px] text-neutral-700">
          <div class="break-words">
            <dt class="inline font-semibold text-neutral-800">Suggested task title:</dt>
            {{ ' ' + node.requiredTaskTitle }}
          </div>
          <div class="break-words">
            <dt class="inline font-semibold text-neutral-800">Owner:</dt>
            {{ ' ' + node.owner }}
            <span class="text-neutral-500"> · </span>
            <dt class="inline font-semibold text-neutral-800">Reviewer:</dt>
            {{ ' ' + node.reviewer }}
          </div>
          <div v-if="node.dependency" class="break-words italic text-neutral-600">
            <dt class="inline">Depends on:</dt>
            {{ ' ' + node.dependency }}
          </div>
          <div class="break-words">
            <dt class="inline font-semibold text-neutral-800">Done when:</dt>
            {{ ' ' + node.definitionOfDone }}
          </div>
        </dl>

        <NuxtLink
          :to="node.route"
          class="mt-2 inline-flex rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-900 hover:bg-rose-100"
        >
          Open the section →
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
