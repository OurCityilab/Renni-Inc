<!--
  GlossaryChips — compact "Key terms" card. Drives off the optional
  `section.glossaryChips` metadata (see app/types/templateStudio.ts).

  POSTURE (do not relax)
  ----------------------
    - Pure presentational. No Firestore reads/writes, no AI calls,
      no external dictionary lookups.
    - Definitions are short student-friendly sentences. They are
      teaching supports, not legal / tax / securities / accounting
      / investment advice — Ch. 3 entries should always carry a
      `safetyNote` so the disclaimer travels with the term.
    - Each chip is a `<details>` so a student can read the
      definition without leaving the section. The chip's `<summary>`
      doubles as the chip label and is always visible.
    - Default-collapsed: the card lists all terms inline; the
      definitions reveal on click. Keeps the page calm.
-->
<script setup lang="ts">
import type { GlossaryChip } from '~/types/templateStudio'

withDefaults(
  defineProps<{
    chips: readonly GlossaryChip[]
    /** Heading shown on the card. Defaults to "Key terms". */
    title?: string
  }>(),
  { title: 'Key terms' }
)
</script>

<template>
  <aside
    v-if="chips.length"
    class="rounded border border-sky-200 bg-sky-50/40 p-3 text-sm min-w-0"
    aria-label="Glossary chips"
  >
    <p class="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
      {{ title }}
    </p>
    <p class="mt-0.5 text-xs text-neutral-700">
      Plain-language definitions you can read without leaving this
      section. Click a term to expand.
    </p>
    <ul class="mt-2 flex flex-wrap gap-1.5">
      <li v-for="(chip, i) in chips" :key="i">
        <details class="group rounded border border-sky-300 bg-white">
          <summary
            class="cursor-pointer select-none px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-50"
            :title="chip.definition"
          >
            {{ chip.term }}
          </summary>
          <div class="border-t border-sky-100 p-2 text-xs text-neutral-800 max-w-xs">
            <p class="break-words">{{ chip.definition }}</p>
            <p
              v-if="chip.safetyNote"
              class="mt-1 rounded border border-amber-200 bg-amber-50 p-1.5 text-[11px] italic text-amber-900 break-words"
            >
              {{ chip.safetyNote }}
            </p>
          </div>
        </details>
      </li>
    </ul>
  </aside>
</template>
