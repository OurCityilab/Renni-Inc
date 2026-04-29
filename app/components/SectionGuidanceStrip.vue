<script setup lang="ts">
// Action-first guidance strip mounted at the top of the section route.
// Answers, in one screen, the four questions the cognitive-load audit
// flagged as the entry barrier:
//   1. What do I do right now?
//   2. Where do I type or build it?
//   3. Who reviews this?
//   4. Where am I in the flow?
//
// Pure presentational. Reads only existing curriculum + Firestore
// metadata. Does not save, gate, or mutate anything. Save / submit /
// approval logic stays exactly where it lives in the workspace.
import { computed } from 'vue'
import type { Deliverable } from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import { effectiveActionSummary } from '~/utils/sectionGuidance'
import { getLikelyOwner } from '~/data/chapterOwners'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  section: TemplateStudioSection
  sectionIndex?: number | null
}>()

const nextAction = computed<string>(() =>
  effectiveActionSummary(props.section)
)

const reviewerLabel = computed<string>(() =>
  getLikelyOwner(props.deliverable.id)
)

// Friendly student-facing label for the deliverable status, used in
// the "where am I" chip. Mirrors the workflow vocabulary in the brief
// — Draft → Review → Revision if needed → Approved → Playbook-ready.
const statusLabel = computed<string>(() => {
  switch (props.deliverable.status) {
    case 'draft':
      return 'Draft'
    case 'in_review':
      return 'In review'
    case 'needs_revision':
      return 'Needs revision'
    case 'approved':
      return 'Approved · Playbook-ready'
    default:
      return 'Draft'
  }
})

const statusTone = computed<string>(() => {
  switch (props.deliverable.status) {
    case 'approved':
      return 'border-emerald-300 bg-emerald-50 text-emerald-900'
    case 'needs_revision':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'in_review':
      return 'border-sky-300 bg-sky-50 text-sky-900'
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-800'
  }
})
</script>

<template>
  <section
    class="card space-y-2 border-phoenix-200"
    aria-label="Section guidance strip"
  >
    <p class="text-[11px] uppercase tracking-wide text-neutral-500">
      You are working on
      <span v-if="sectionIndex">
        · Section {{ sectionIndex }} of {{ studio.sections.length }}
      </span>
    </p>
    <h1 class="text-lg font-semibold text-neutral-900">
      {{ section.title }}
    </h1>

    <!-- Your next action: the one plain-language thing to do first. -->
    <p
      class="rounded-md border border-phoenix-300 bg-phoenix-50 p-2 text-sm text-phoenix-900"
    >
      <span
        class="mr-1 inline-block rounded bg-phoenix-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-phoenix-900"
      >
        Your next action
      </span>
      {{ nextAction }}
    </p>

    <!-- Reviewer + workflow chips. Display-only. Never overrides any
         permission or approval surface. -->
    <div class="flex flex-wrap items-center gap-2 text-[11px]">
      <span
        class="rounded border border-neutral-300 bg-white px-2 py-0.5 text-neutral-700"
      >
        <span class="font-semibold">Reviewer:</span>
        {{ reviewerLabel }}
      </span>
      <span
        class="rounded border px-2 py-0.5 font-semibold"
        :class="statusTone"
      >
        Status: {{ statusLabel }}
      </span>
      <span
        class="rounded border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600"
      >
        Flow: Draft → Review → Approved · Playbook-ready
      </span>
    </div>
  </section>
</template>
