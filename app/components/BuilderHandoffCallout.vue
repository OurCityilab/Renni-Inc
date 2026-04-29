<!--
  BuilderHandoffCallout — small "Use this first" panel shown above
  builder-backed sections so students consistently know the same
  6-step workflow: build → copy → paste → edit → save → ask chief.

  POSTURE
  -------
    - Pure presentational. Optional `title` prop only.
    - No Firestore writes. No AI calls. No clipboard. No navigation.
    - Compact by design. Designed to sit above an existing builder,
      not replace the builder's own intro / copy helper text.
    - Kept separate from the builders so the same workflow copy can
      be reused on Customer Profile / Key Activities / Market Fit /
      Brand Fit / Pricing wrappers later without duplicating text.
-->
<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <aside
    class="rounded border border-phoenix-200 bg-phoenix-50/50 p-3 text-sm"
    aria-label="Builder workflow reminder"
  >
    <p class="text-[11px] font-semibold uppercase tracking-wide text-phoenix-800">
      {{ title ?? 'Use this first' }}
    </p>
    <p class="mt-1 text-xs text-neutral-800">
      Fill out the builder below. Then copy the output into Working
      Draft, edit it in your own words, and save.
    </p>
    <ol
      class="mt-1 ml-4 list-decimal space-y-0.5 text-xs text-neutral-800"
    >
      <li>Build it.</li>
      <li>Copy it.</li>
      <li>Paste into Working Draft.</li>
      <li>Edit it in your own words.</li>
      <li>Save.</li>
      <li>Ask your chief to review.</li>
    </ol>
  </aside>
</template>
