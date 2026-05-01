<!--
  TaskCoverageMap — display-only P0 / P1 / P2 coverage by section.
  Shows each section card with its task-coverage state + status
  counts. Grouped by priority for quick scan.

  POSTURE
  -------
    - Pure presentational. No Firestore writes, no AI calls, no
      mutation. Drives off TaskCoverageNode.
    - Display-only. No "Create task" button. The chief acts through
      the existing Tasks / Deliverables flow.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type {
  CoverageMatchConfidence,
  TaskCoverageNode,
  TaskCoveragePriority
} from '~/utils/taskCoverageMap'

const props = defineProps<{
  nodes: readonly TaskCoverageNode[]
}>()

const grouped = computed<Record<TaskCoveragePriority, TaskCoverageNode[]>>(() => {
  const out: Record<TaskCoveragePriority, TaskCoverageNode[]> = {
    P0: [],
    P1: [],
    P2: []
  }
  for (const n of props.nodes) out[n.priority].push(n)
  return out
})

function priorityLabel(p: TaskCoveragePriority): string {
  return p
}

function priorityChipClass(p: TaskCoveragePriority): string {
  switch (p) {
    case 'P0':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'P1':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'P2':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

function coverageChipClass(node: TaskCoverageNode): string {
  if (!node.hasTask) return 'border-rose-300 bg-rose-50 text-rose-900'
  if (node.statusSummary.blocked > 0 || node.statusSummary.overdue > 0) {
    return 'border-amber-300 bg-amber-50 text-amber-900'
  }
  return 'border-emerald-300 bg-emerald-50 text-emerald-900'
}

function coverageChipLabel(node: TaskCoverageNode): string {
  if (!node.hasTask) return 'Missing task'
  if (node.statusSummary.blocked > 0) return 'Blocked'
  if (node.statusSummary.overdue > 0) return 'Overdue'
  if (node.statusSummary.inProgress > 0) return 'In progress'
  if (node.statusSummary.done > 0) return 'Done'
  return 'Has task'
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
  <details class="rounded border border-neutral-200 bg-white">
    <summary class="cursor-pointer p-3">
      <span class="text-sm font-semibold text-neutral-700">
        Task Coverage Map — by section
      </span>
      <span
        class="ml-2 text-xs text-neutral-500"
        :title="COVERAGE_HELP_TEXT"
      >
        Display-only. Does not create tasks or change statuses.
      </span>
    </summary>
    <div class="border-t border-neutral-200 p-3 space-y-3">
      <div
        v-for="priority in (['P0', 'P1', 'P2'] as TaskCoveragePriority[])"
        :key="priority"
        class="space-y-2"
      >
        <header class="flex items-baseline gap-2">
          <span
            class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="priorityChipClass(priority)"
          >
            {{ priorityLabel(priority) }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ grouped[priority].length }} section{{ grouped[priority].length === 1 ? '' : 's' }}
          </span>
        </header>

        <ul class="grid gap-2 md:grid-cols-2 min-w-0">
          <li
            v-for="node in grouped[priority]"
            :key="node.id"
            class="rounded border border-neutral-200 bg-neutral-50/40 p-3 min-w-0"
          >
            <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
              <p class="text-sm font-semibold text-neutral-900 break-words">
                {{ node.sectionTitle }}
              </p>
              <div class="flex flex-wrap items-baseline gap-1">
                <span
                  class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  :class="coverageChipClass(node)"
                >
                  {{ coverageChipLabel(node) }}
                </span>
                <span
                  class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  :class="confidenceChipClass(node.matchConfidence)"
                  :title="node.matchReason"
                >
                  {{ confidenceChipLabel(node.matchConfidence) }}
                </span>
              </div>
            </header>

            <p class="text-[11px] text-neutral-500 break-words">
              {{ node.laneTitle }} · {{ node.chapterId }}
            </p>
            <p
              class="mt-1 text-[11px] italic text-neutral-600 break-words"
              :title="COVERAGE_HELP_TEXT"
            >
              {{ node.matchReason }}
            </p>
            <p
              v-if="node.coverageNote"
              class="text-[11px] text-neutral-600 break-words"
            >
              {{ node.coverageNote }}
            </p>

            <dl class="mt-1 space-y-0.5 text-[11px] text-neutral-700">
              <div class="break-words">
                <dt class="inline font-semibold text-neutral-800">Required task:</dt>
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
              <div v-if="node.hasTask" class="break-words">
                <dt class="inline font-semibold text-neutral-800">Status:</dt>
                blocked {{ node.statusSummary.blocked }} ·
                overdue {{ node.statusSummary.overdue }} ·
                in progress {{ node.statusSummary.inProgress }} ·
                done {{ node.statusSummary.done }}
              </div>
              <div v-else class="break-words text-rose-800">
                No matching task — chief should decide whether to seed
                one manually.
              </div>
            </dl>

            <NuxtLink
              :to="node.route"
              class="mt-2 inline-flex rounded border border-phoenix-300 bg-phoenix-50 px-2 py-1 text-xs font-medium text-phoenix-900 hover:bg-phoenix-100"
            >
              Open the section →
            </NuxtLink>
          </li>
        </ul>
      </div>

      <p class="text-[11px] italic text-neutral-500">
        {{ COVERAGE_HELP_TEXT }} Missing coverage does not mean the
        section is impossible — it means chiefs should assign or
        clarify the work.
      </p>
    </div>
  </details>
</template>
