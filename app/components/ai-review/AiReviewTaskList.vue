<script setup lang="ts">
// Scoped task list for the review payload. Uses
// getSafeCompletionLanguage so the rendered language never claims
// "Completed by ___" when the model only knows the assigned owner.
import type { AiReviewTaskSummary } from '~/types/aiReviewReports'
import { getSafeCompletionLanguage } from '~/utils/aiReviewAttribution'

defineProps<{
  tasks: readonly AiReviewTaskSummary[]
}>()

const STATUS_TONE: Record<AiReviewTaskSummary['status'], string> = {
  not_started: 'border-neutral-300 text-neutral-700',
  in_progress: 'border-sky-300 bg-sky-50 text-sky-800',
  blocked: 'border-rose-300 bg-rose-50 text-rose-800',
  done: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}
</script>

<template>
  <section v-if="tasks.length" class="space-y-2">
    <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
      Tasks in scope ({{ tasks.length }})
    </p>
    <ul class="space-y-1.5">
      <li
        v-for="task in tasks"
        :key="`task-${task.id}`"
        class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="min-w-0 truncate font-medium text-neutral-900">
            {{ task.title }}
          </p>
          <div class="flex shrink-0 items-center gap-1 text-xs">
            <span
              class="rounded-full border px-2 py-0.5"
              :class="STATUS_TONE[task.status]"
            >{{ task.statusLabel }}</span>
            <span
              v-if="task.isOverdue"
              class="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 uppercase text-rose-800"
            >Overdue</span>
            <span
              v-if="task.priority === 'high'"
              class="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 uppercase text-amber-800"
            >Priority high</span>
          </div>
        </div>
        <p class="text-[11px] text-neutral-600">
          {{ getSafeCompletionLanguage({
            status: task.status,
            ownerEmail: task.ownerEmail ?? '',
            blockedBy: task.blockedReason
          }) }}
          <span v-if="task.dueDate"> · Due {{ task.dueDate }}</span>
          <span v-if="task.deliverableTitle"> · {{ task.deliverableTitle }}</span>
        </p>
      </li>
    </ul>
  </section>
</template>
