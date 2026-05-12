<script setup lang="ts">
// Compact deterministic summary card. Renders the roll-up counts that
// the buildReviewPayload helper already computes — no recalculation
// here.
import type { AiReviewDeterministicSummary } from '~/types/aiReviewReports'

defineProps<{
  summary: AiReviewDeterministicSummary
}>()
</script>

<template>
  <section class="space-y-3">
    <header>
      <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
        Work state summary
      </p>
      <p class="text-[11px] italic text-neutral-500">
        Counts only. No personal judgment.
      </p>
    </header>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">Chapters</p>
        <p class="text-xl font-semibold">{{ summary.totalChapters }}</p>
      </div>
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">Deliverables</p>
        <p class="text-xl font-semibold">{{ summary.totalDeliverables }}</p>
      </div>
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">Sections</p>
        <p class="text-xl font-semibold">{{ summary.totalSections }}</p>
      </div>
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] uppercase tracking-wide text-neutral-500">Tasks</p>
        <p class="text-xl font-semibold">{{ summary.totalTasks }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded border border-emerald-200 bg-emerald-50/40 p-2">
        <p class="text-[11px] font-medium text-emerald-800">Approved</p>
        <p class="text-lg font-semibold">{{ summary.approvedDeliverables }}</p>
      </div>
      <div class="rounded border border-sky-200 bg-sky-50/40 p-2">
        <p class="text-[11px] font-medium text-sky-800">In Review</p>
        <p class="text-lg font-semibold">{{ summary.inReviewDeliverables }}</p>
      </div>
      <div class="rounded border border-rose-200 bg-rose-50/40 p-2">
        <p class="text-[11px] font-medium text-rose-800">Needs Revision</p>
        <p class="text-lg font-semibold">{{ summary.needsRevisionDeliverables }}</p>
      </div>
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] font-medium text-neutral-700">Draft</p>
        <p class="text-lg font-semibold">{{ summary.draftDeliverables }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded border border-emerald-200 p-2">
        <p class="text-[11px] font-medium text-emerald-800">Final text sections</p>
        <p class="text-lg font-semibold">{{ summary.sectionsWithFinalText }}</p>
      </div>
      <div class="rounded border border-amber-200 p-2">
        <p class="text-[11px] font-medium text-amber-800">Draft fallback</p>
        <p class="text-lg font-semibold">{{ summary.sectionsWithDraftFallback }}</p>
      </div>
      <div class="rounded border border-amber-200 p-2">
        <p class="text-[11px] font-medium text-amber-800">Source-note fallback</p>
        <p class="text-lg font-semibold">{{ summary.sectionsWithSourceNotesFallback }}</p>
      </div>
      <div class="rounded border border-rose-200 p-2">
        <p class="text-[11px] font-medium text-rose-800">Missing sections</p>
        <p class="text-lg font-semibold">{{ summary.sectionsMissing }}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] font-medium text-neutral-700">Evidence links</p>
        <p class="text-lg font-semibold">{{ summary.evidenceLinkCount }}</p>
      </div>
      <div class="rounded border border-neutral-200 p-2">
        <p class="text-[11px] font-medium text-neutral-700">Structured evidence</p>
        <p class="text-lg font-semibold">{{ summary.structuredEvidenceCount }}</p>
      </div>
      <div class="rounded border border-rose-200 p-2">
        <p class="text-[11px] font-medium text-rose-800">Overdue deliverables</p>
        <p class="text-lg font-semibold">{{ summary.overdueDeliverables }}</p>
      </div>
      <div class="rounded border border-rose-200 p-2">
        <p class="text-[11px] font-medium text-rose-800">Blocked tasks</p>
        <p class="text-lg font-semibold">{{ summary.blockedTasks }}</p>
      </div>
    </div>
  </section>
</template>
