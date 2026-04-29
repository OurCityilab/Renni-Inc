<!--
  StudentNextActionCard — one card in the "My next actions" block on
  the home dashboard. Pure presentational; receives a prebuilt model
  from `app/utils/studentNextActions.ts` and renders it.

  POSTURE
  -------
    - No Firestore writes. No mutation buttons. The single CTA is a
      `<NuxtLink>` to the work page.
    - No AI / network calls.
    - Short. Plain language. Tap-friendly.
-->
<script setup lang="ts">
import type { NextActionCardModel } from '~/utils/studentNextActions'

defineProps<{
  card: NextActionCardModel
}>()

function chipLabel(kind: NextActionCardModel['kind']): string {
  switch (kind) {
    case 'blocked':
      return 'Ask for help'
    case 'overdue':
      return 'Overdue'
    case 'due-soon':
      return 'Due soon'
    case 'in-progress':
      return 'In progress'
    case 'not-started':
      return 'Start this'
    case 'department-fallback':
      return 'Department work'
  }
}

function chipClass(kind: NextActionCardModel['kind']): string {
  switch (kind) {
    case 'blocked':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'overdue':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'due-soon':
      return 'border-amber-200 bg-amber-50/70 text-amber-900'
    case 'in-progress':
      return 'border-sky-300 bg-sky-50 text-sky-900'
    case 'not-started':
      return 'border-phoenix-300 bg-phoenix-50 text-phoenix-900'
    case 'department-fallback':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
</script>

<template>
  <article
    class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
      <span
        class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
        :class="chipClass(card.kind)"
      >
        {{ chipLabel(card.kind) }}
      </span>
      <span v-if="card.dueDate" class="text-[11px] text-neutral-500">
        Due {{ card.dueDate }}
      </span>
    </header>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Task
      </p>
      <p class="mt-0.5 text-sm font-semibold text-neutral-900 break-words">
        {{ card.taskTitle }}
      </p>
    </div>

    <div v-if="card.outputFormat">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Output format
      </p>
      <p class="mt-0.5 text-sm font-semibold text-phoenix-900 break-words">
        {{ card.outputFormat }}
      </p>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Do this
      </p>
      <p class="mt-0.5 text-sm text-neutral-800 break-words">
        {{ card.doThis }}
      </p>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        How to do it
      </p>
      <ol class="mt-1 ml-5 list-decimal space-y-0.5 text-sm text-neutral-800">
        <li
          v-for="(step, i) in card.howToDoIt"
          :key="i"
          class="break-words"
        >
          {{ step }}
        </li>
      </ol>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Done when
      </p>
      <p class="mt-0.5 text-sm text-neutral-800 break-words">
        {{ card.doneWhen }}
      </p>
    </div>

    <p class="text-xs text-neutral-600 break-words">
      {{ card.reviewedBy }}
    </p>

    <p
      v-if="card.askForHelp"
      class="rounded border border-rose-200 bg-rose-50/60 p-2 text-xs text-rose-900"
    >
      This task is marked blocked. Ask your chief or department lead what
      is in the way before you keep working on it.
    </p>

    <NuxtLink
      :to="card.buttonHref"
      class="btn-primary text-sm w-full sm:w-auto sm:self-start"
    >
      {{ card.buttonLabel }}
    </NuxtLink>
  </article>
</template>
