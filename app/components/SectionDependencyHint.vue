<!--
  SectionDependencyHint — small non-blocking panel that names what a
  section helps prefill or what it depends on. V1 hints only — no
  hard locks, no soft locks, no status changes, no Firestore writes,
  no auto-navigation, no readiness gating.

  POSTURE
  -------
    - Pure presentational. The caller decides which hint(s) to pass
      via the `hints` prop.
    - No props beyond title + hints. Each hint is a short string the
      student reads and acts on at their own pace.
    - Compact by design. Sits above a builder or recipe panel; never
      replaces them.
-->
<script setup lang="ts">
defineProps<{
  /** Heading shown above the hint list. Defaults to "How this
   *  section connects". */
  title?: string
  /** Short, plain-language hints. Each renders as one bullet. */
  hints: string[]
}>()
</script>

<template>
  <aside
    v-if="hints.length"
    class="rounded border border-sky-200 bg-sky-50/60 p-3 text-sm"
    aria-label="Section dependency hints"
  >
    <p class="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
      {{ title ?? 'How this section connects' }}
    </p>
    <ul class="mt-1 ml-4 list-disc space-y-0.5 text-xs text-neutral-800">
      <li v-for="(hint, i) in hints" :key="i" class="break-words">
        {{ hint }}
      </li>
    </ul>
  </aside>
</template>
