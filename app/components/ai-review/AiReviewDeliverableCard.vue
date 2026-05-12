<script setup lang="ts">
// One deliverable card on the company / department review pages.
// Compact summary + link to the full deliverable detail page.
import type {
  AiReviewDeliverableSummary
} from '~/types/aiReviewReports'

defineProps<{
  deliverable: AiReviewDeliverableSummary
  /** Toggle sections list off for company-level density. */
  showSections?: boolean
}>()

const STATUS_TONE: Record<AiReviewDeliverableSummary['status'], string> = {
  draft: 'border-neutral-300 bg-neutral-50 text-neutral-700',
  in_review: 'border-sky-300 bg-sky-50 text-sky-800',
  needs_revision: 'border-rose-300 bg-rose-50 text-rose-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800'
}
</script>

<template>
  <article
    class="rounded-md border border-neutral-200 bg-white p-3 text-sm"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2">
      <div class="min-w-0">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">
          Ch. {{ deliverable.chapter }} · {{ deliverable.department }}
        </p>
        <NuxtLink
          :to="`/deliverables/${deliverable.id}`"
          class="block truncate font-medium text-neutral-900 hover:underline"
        >{{ deliverable.title }}</NuxtLink>
        <p class="text-[11px] text-neutral-600">
          {{ deliverable.attribution.summaryStatement }}
        </p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-1 text-xs">
        <span
          class="rounded-full border px-2 py-0.5 font-medium"
          :class="STATUS_TONE[deliverable.status]"
        >{{ deliverable.statusLabel }}</span>
        <span
          v-if="deliverable.isOverdue"
          class="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-800"
        >Overdue</span>
        <span
          v-if="deliverable.canSubmit"
          class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800"
        >Ready to submit</span>
      </div>
    </header>

    <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700">
      <li>Sections: {{ deliverable.totalSections }}</li>
      <li>Final text: {{ deliverable.sectionsWithFinalText }}</li>
      <li v-if="deliverable.sectionsWithDraftFallback > 0">
        Draft fallback: {{ deliverable.sectionsWithDraftFallback }}
      </li>
      <li v-if="deliverable.sectionsWithSourceNotesFallback > 0">
        Source-notes fallback: {{ deliverable.sectionsWithSourceNotesFallback }}
      </li>
      <li v-if="deliverable.sectionsMissing > 0" class="text-rose-700">
        Missing: {{ deliverable.sectionsMissing }}
      </li>
      <li>Evidence: {{ deliverable.evidenceLinkCount }}</li>
      <li>Structured evidence: {{ deliverable.structuredEvidenceCount }}</li>
      <li v-if="deliverable.dueDate">Due: {{ deliverable.dueDate }}</li>
    </ul>

    <p
      v-if="deliverable.missingRequiredRequirementLabels.length"
      class="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
    >
      Missing required task coverage:
      <span class="font-medium">
        {{ deliverable.missingRequiredRequirementLabels.slice(0, 3).join(', ') }}
        <span v-if="deliverable.missingRequiredRequirementLabels.length > 3">
          and {{ deliverable.missingRequiredRequirementLabels.length - 3 }} more
        </span>
      </span>
    </p>

    <p
      v-if="deliverable.returnedReason"
      class="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900"
    >
      <span class="font-semibold">Returned for revision:</span>
      {{ deliverable.returnedReason }}
    </p>

    <section
      v-if="showSections && deliverable.sections.length"
      class="mt-3"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
        Sections
      </p>
      <AiReviewSectionTable :sections="deliverable.sections" />
    </section>
  </article>
</template>
