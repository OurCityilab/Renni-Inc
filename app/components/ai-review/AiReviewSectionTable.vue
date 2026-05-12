<script setup lang="ts">
// Per-section deterministic table. Read-only: one row per section,
// labelled with the same content-source semantics the in-app preview
// and the Markdown / CSV exports already use.
import type {
  AiReviewSectionSummary
} from '~/types/aiReviewReports'

defineProps<{
  sections: readonly AiReviewSectionSummary[]
  /** Hide the capped excerpt when the surrounding context already
   *  shows the full preview (e.g. chapter detail page). Default true
   *  on the company / department pages where the preview is not
   *  inline. */
  showExcerpt?: boolean
}>()

const SOURCE_TONE: Record<AiReviewSectionSummary['contentSource'], string> = {
  finalText: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  draftText: 'border-amber-300 bg-amber-50 text-amber-800',
  sourceNotes: 'border-amber-300 bg-amber-50 text-amber-800',
  missing: 'border-rose-300 bg-rose-50 text-rose-800'
}

const SOURCE_COMPACT_LABEL: Record<
  AiReviewSectionSummary['contentSource'],
  string
> = {
  finalText: 'Final text present',
  draftText: 'Draft only',
  sourceNotes: 'Source notes only',
  missing: 'Missing'
}
</script>

<template>
  <section v-if="sections.length" class="space-y-2">
    <ul class="space-y-2">
      <li
        v-for="section in sections"
        :key="`sect-${section.sectionId}`"
        class="rounded-md border border-neutral-200 bg-white p-3 text-sm"
      >
        <header class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-medium text-neutral-900">{{ section.title }}</p>
          <span
            class="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
            :class="SOURCE_TONE[section.contentSource]"
          >{{ SOURCE_COMPACT_LABEL[section.contentSource] }}</span>
        </header>

        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700">
          <li>Evidence: {{ section.evidenceLinkCount }}</li>
          <li>Structured evidence: {{ section.structuredEvidenceCount }}</li>
          <li v-if="section.wordCount > 0">Words: {{ section.wordCount }}</li>
          <li v-if="section.sectionStatus">Section status: {{ section.sectionStatus }}</li>
        </ul>

        <p
          v-if="(showExcerpt ?? true) && section.contentExcerpt"
          class="mt-2 whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-800"
        >{{ section.contentExcerpt }}<span v-if="section.excerptCapped" class="italic text-neutral-500"> · excerpt capped</span></p>

        <p
          v-if="section.isMissing"
          class="mt-2 text-xs italic text-rose-700"
        >
          No saved section text yet.
        </p>

        <p class="mt-2 text-[11px] italic text-neutral-600">
          {{ section.attribution.summaryStatement }}
        </p>
      </li>
    </ul>
  </section>
</template>
