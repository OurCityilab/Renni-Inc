<script setup lang="ts">
// Three compact cards rendered next to (or just below) the section
// workspace: "What good looks like", "Done when", and "Who reviews /
// What happens next". Designed against the cognitive-load brief —
// short answers, no walls of text, fallbacks deterministic so every
// section has a usable answer even without authored metadata.
//
// Pure presentational. Reads only curriculum metadata + chapter-owner
// strings. No save, no gating, no permission changes, no AI calls.
import { computed } from 'vue'
import type { Deliverable } from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import { getLikelyOwner } from '~/data/chapterOwners'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  section: TemplateStudioSection
}>()

const STRONG_FALLBACK =
  'A strong answer is specific, supported by evidence, and useful for the next team that reads the Playbook.'

const DONE_FALLBACK: string[] = [
  'You answered the prompt.',
  'You added evidence or named your assumption where needed.',
  'Your draft is clear enough for another student to understand.',
  'You saved your work.',
  'Your chief knows it is ready for review.'
]

// "What good looks like" — prefer the expert-authored "strong answer"
// line; otherwise the curated section.example; otherwise a generic
// fallback. One line, never a paragraph.
const strongAnswer = computed<string>(() => {
  const expert = props.section.expertGuidance?.strongAnswerLooksLike?.trim()
  if (expert) return expert
  const example = props.section.example?.trim()
  if (example) return example
  return STRONG_FALLBACK
})

// Done checklist — prefer authored completionCriteria; otherwise the
// generic 5-bullet fallback from the brief.
const doneItems = computed<string[]>(() => {
  const authored = props.section.completionCriteria ?? []
  const trimmed = authored.map((c) => c.trim()).filter(Boolean)
  return trimmed.length > 0 ? trimmed : DONE_FALLBACK
})

// "Who reviews this" — chapter-owner string from the curriculum map.
// Display-only; never overrides any approver / chief permission.
const reviewerLabel = computed<string>(() => getLikelyOwner(props.deliverable.id))

// Status-aware "what happens next" line. Plain language; explicit
// about what the student does, not how the system works internally.
const whatHappensNext = computed<string>(() => {
  switch (props.deliverable.status) {
    case 'draft':
      return 'When your team is ready, your chief moves the chapter into review. A reviewer reads it, approves it, or asks for revisions.'
    case 'in_review':
      return 'A reviewer is reading the chapter. They will approve it or send it back with notes for revision.'
    case 'needs_revision':
      return 'A reviewer left notes. Make the fixes, save, and tell your chief it is ready to go back into review.'
    case 'approved':
      return 'This chapter is approved and Playbook-ready. Future edits go back through review.'
    default:
      return 'When your team is ready, your chief moves the chapter into review.'
  }
})
</script>

<template>
  <section
    class="grid gap-3 md:grid-cols-3"
    aria-label="Section guidance cards"
  >
    <!-- What good looks like -->
    <article
      class="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm"
      aria-label="What good looks like"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        What good looks like
      </p>
      <p class="text-emerald-900">{{ strongAnswer }}</p>
    </article>

    <!-- Done when -->
    <article
      class="rounded-md border border-sky-200 bg-sky-50/60 p-3 text-sm"
      aria-label="Done when"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
        Done when
      </p>
      <ul class="list-disc space-y-0.5 pl-5 text-sky-900">
        <li v-for="(item, i) in doneItems" :key="`done-${i}`">{{ item }}</li>
      </ul>
      <p class="mt-1 text-[11px] italic text-sky-700">
        Guidance only — your chief still owns when it goes to review.
      </p>
    </article>

    <!-- Who reviews / what happens next -->
    <article
      class="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm"
      aria-label="Who reviews this and what happens next"
    >
      <p class="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        Who reviews this
      </p>
      <p class="text-amber-900">{{ reviewerLabel }}</p>
      <p class="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        What happens next
      </p>
      <p class="text-amber-900">{{ whatHappensNext }}</p>
    </article>
  </section>
</template>
