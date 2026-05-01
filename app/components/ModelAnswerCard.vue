<!--
  ModelAnswerCard — student-facing "what good looks like" pattern
  card. Drives off the optional `section.modelAnswerCard` metadata
  (see app/types/templateStudio.ts).

  POSTURE (do not relax)
  ----------------------
    - Pure presentational. No Firestore reads, no Firestore writes,
      no AI calls.
    - The card shows a minimum-viable-answer description, a strong
      answer skeleton (with bracketed placeholders), an evidence
      reminder, and a list of pitfalls. It NEVER fills in the
      student's draft, never auto-pastes, never gates submit.
    - Default-open via <details open> so students see the patterns
      without an extra click; collapsible so the page does not feel
      crowded after the student internalizes them.
-->
<script setup lang="ts">
import type { ModelAnswerCard } from '~/types/templateStudio'

defineProps<{ card: ModelAnswerCard }>()
</script>

<template>
  <details
    class="rounded border border-emerald-200 bg-emerald-50/50 p-3 text-sm min-w-0"
    open
  >
    <summary class="cursor-pointer select-none">
      <span class="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        {{ card.title ?? 'What good looks like' }}
      </span>
      <span class="ml-2 text-xs text-emerald-900/80">
        Patterns to follow — not final answers to copy.
      </span>
    </summary>
    <div class="mt-2 space-y-2">
      <div class="break-words">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
          Minimum viable answer
        </p>
        <p class="text-sm text-neutral-900">{{ card.minimumViableAnswer }}</p>
      </div>
      <div class="break-words">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
          Strong answer pattern
        </p>
        <p class="text-sm text-neutral-900 whitespace-pre-line">
          {{ card.strongAnswerPattern }}
        </p>
      </div>
      <div v-if="card.evidenceExpectation" class="break-words">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
          Evidence to cite
        </p>
        <p class="text-sm text-neutral-900">{{ card.evidenceExpectation }}</p>
      </div>
      <div v-if="card.avoid && card.avoid.length" class="break-words">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
          Avoid
        </p>
        <ul class="ml-4 list-disc space-y-0.5 text-sm text-neutral-900">
          <li v-for="(item, i) in card.avoid" :key="i" class="break-words">
            {{ item }}
          </li>
        </ul>
      </div>
      <p class="text-[11px] italic text-emerald-900/80">
        These patterns are guidance only. They never auto-fill your
        draft and never gate submit.
      </p>
    </div>
  </details>
</template>
