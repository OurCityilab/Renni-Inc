<!--
  CrossChapterReferencePanel — small read-only callout that points
  students to a sibling chapter's authored work. V1 use:
  Ch. 10 audience / touchpoints and Ch. 11 offer point back to the
  Ch. 4 local archetype application table.

  POSTURE (do not relax)
  ----------------------
    - Pure presentational. No Firestore reads, no Firestore writes,
      no AI calls, no auto-import.
    - The panel never imports or mirrors the student-authored rows
      into the current section. It is a navigation hint + a list of
      "what to pull forward" so students remember to consult the
      authoritative source.
    - Never gates submit, status, approval, or readiness.
-->
<script setup lang="ts">
defineProps<{
  /** Heading shown at the top of the panel. */
  title: string
  /** One-sentence framing under the heading. */
  description: string
  /** Section deeplink the chip routes to. */
  to: string
  /** Label for the deeplink chip. */
  linkText: string
  /** Bulleted list of fields the student should pull forward. Each
   *  bullet is a short string. */
  pullForward: readonly string[]
}>()
</script>

<template>
  <aside
    class="rounded border border-sky-200 bg-sky-50/60 p-3 text-sm min-w-0"
    aria-label="Cross-chapter reference"
  >
    <p class="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
      Pull from another chapter
    </p>
    <p class="mt-0.5 text-sm font-semibold text-neutral-900 break-words">
      {{ title }}
    </p>
    <p class="mt-0.5 text-xs text-neutral-700 break-words">
      {{ description }}
    </p>
    <ul
      v-if="pullForward.length"
      class="mt-1 ml-4 list-disc space-y-0.5 text-xs text-neutral-800"
    >
      <li v-for="(field, i) in pullForward" :key="i" class="break-words">
        {{ field }}
      </li>
    </ul>
    <NuxtLink
      :to="to"
      class="mt-2 inline-flex rounded border border-sky-300 bg-white px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
    >
      {{ linkText }} →
    </NuxtLink>
    <p class="mt-1 text-[11px] italic text-neutral-600">
      Read-only reference. The platform does not auto-import rows or
      overwrite anything you have written here.
    </p>
  </aside>
</template>
