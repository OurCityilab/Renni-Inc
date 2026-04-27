<script setup lang="ts">
// HelpMeUnderstand — deterministic, display-only Q&A panel that
// answers the five questions a student working at home is most likely
// to ask before they start writing:
//   1. What am I doing?
//   2. What should I write first?
//   3. What counts as good?
//   4. What proof might I need?
//   5. What should I do if I'm stuck?
//
// Every answer is derived from existing curriculum metadata
// (section.lesson, section.studentPrompts, section.completionCriteria,
// section.evidencePrompt, section.sourceGuidance, section.expertGuidance,
// chapterOwners.getPrimaryHelpRole). No AI calls, no Firestore writes,
// no autosave — students who can read can use this without instructor
// support.
//
// Posture (do not relax):
//   - read-only / display-only
//   - no Firestore reads or writes
//   - no AI calls
//   - never gates submit, status, or save
//   - reuses existing studio metadata only — does not invent copy
import { computed, ref } from 'vue'
import type {
  ExpertGuidance,
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import { getPrimaryHelpRole } from '~/data/chapterOwners'

const props = defineProps<{
  // Owning studio. We use studio.whyItMatters at the top of the panel
  // so the chapter-level connection (TechTown / Playbook / Phoenix Nest)
  // is visible before the section-level guidance below.
  studio: TemplateStudio
  // The active section the student is about to write.
  section: TemplateStudioSection
  // Chapter / deliverable id used to look up the primary help-role
  // (e.g. "CFO" on Ch 8). Display-only.
  deliverableId: string
}>()

const expanded = ref<boolean>(false)

const eg = computed<ExpertGuidance | null>(
  () => props.section.expertGuidance ?? null
)

const helpRole = computed<string>(() =>
  getPrimaryHelpRole(props.deliverableId)
)

// 1. What am I doing? — section.lesson, with chapter why-this-matters
//    as a one-line frame. Both fields already populated across the
//    studio set; if either is missing we fall back to a generic line.
const whatAmIDoing = computed<string>(() => {
  const lesson = props.section.lesson?.trim() || ''
  if (lesson) return lesson
  return (
    'Read the section guidance above, then write your team\'s thinking in your own words.'
  )
})

// 2. What should I write first? — student prompts, trimmed to 3 to
//    keep the panel scannable.
const writeFirstPrompts = computed<string[]>(() => {
  const arr = props.section.studentPrompts ?? []
  return arr.slice(0, 3)
})

// 3. What counts as good? — completionCriteria + strongAnswerLooksLike.
const countsAsGood = computed<string[]>(() => {
  const out: string[] = []
  for (const c of props.section.completionCriteria ?? []) out.push(c)
  if (eg.value?.strongAnswerLooksLike) {
    out.push(eg.value.strongAnswerLooksLike)
  }
  return out
})

// 4. What proof might I need? — evidencePrompt (single sentence) +
//    sourceGuidance (bullets) + expertGuidance.whatToGather.
const proofPrompt = computed<string | null>(() => {
  const v = props.section.evidencePrompt?.trim()
  return v && v.length ? v : null
})
const proofBullets = computed<string[]>(() => {
  const out: string[] = []
  for (const g of props.section.sourceGuidance ?? []) out.push(g)
  for (const w of eg.value?.whatToGather ?? []) out.push(w)
  return out
})

// 5. What should I do if I'm stuck? — deterministic copy that names
//    the primary help role + points to the existing stuck path. We
//    don't invent a new help channel; we reuse what's already on the
//    section workspace (Mark task stuck note + Need help? Ask… copy).
const stuckGuidance = computed<string[]>(() => [
  `Ask: ${helpRole.value}. Use the "Copy help message" button further down in the section to paste a prefilled note into your team chat.`,
  'If you are blocked on someone else\'s work, open the linked task and mark it stuck with a short reason — your team will see it.',
  'It is fine to save partial work. Saving Think only is real progress.'
])
</script>

<template>
  <section
    class="space-y-2 rounded-md border border-phoenix-200 bg-phoenix-50/40 p-3 text-sm text-neutral-800"
    aria-label="Help me understand this section"
  >
    <header class="space-y-0.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
        Help me understand this
      </p>
      <p
        v-if="studio.whyItMatters"
        class="text-xs text-neutral-700"
      >
        <span class="font-medium text-neutral-800">Why this chapter matters:</span>
        {{ studio.whyItMatters }}
      </p>
      <button
        type="button"
        class="text-xs text-phoenix-700 hover:underline"
        @click="expanded = !expanded"
      >{{ expanded ? 'Hide help' : 'Show help' }}</button>
    </header>

    <div v-if="expanded" class="space-y-2 text-xs">
      <!-- 1. What am I doing? -->
      <div class="rounded bg-white/80 p-2">
        <p class="font-medium text-neutral-700">What am I doing?</p>
        <p class="mt-0.5 text-neutral-800">{{ whatAmIDoing }}</p>
      </div>

      <!-- 2. What should I write first? -->
      <div
        v-if="writeFirstPrompts.length"
        class="rounded bg-white/80 p-2"
      >
        <p class="font-medium text-neutral-700">What should I write first?</p>
        <ul class="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-800">
          <li v-for="(p, i) in writeFirstPrompts" :key="`hmu-first-${i}`">{{ p }}</li>
        </ul>
        <p class="mt-1 italic text-neutral-500">
          Type rough notes in "Your team's thinking" first. It does not need to be polished.
        </p>
      </div>

      <!-- 3. What counts as good? -->
      <div
        v-if="countsAsGood.length"
        class="rounded bg-white/80 p-2"
      >
        <p class="font-medium text-neutral-700">What counts as good?</p>
        <ul class="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-800">
          <li v-for="(c, i) in countsAsGood" :key="`hmu-good-${i}`">{{ c }}</li>
        </ul>
      </div>

      <!-- 4. What proof might I need? -->
      <div
        v-if="proofPrompt || proofBullets.length"
        class="rounded bg-white/80 p-2"
      >
        <p class="font-medium text-neutral-700">What proof might I need?</p>
        <p
          v-if="proofPrompt"
          class="mt-0.5 text-neutral-800"
        >{{ proofPrompt }}</p>
        <ul
          v-if="proofBullets.length"
          class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"
        >
          <li v-for="(b, i) in proofBullets" :key="`hmu-proof-${i}`">{{ b }}</li>
        </ul>
        <p class="mt-1 italic text-neutral-500">
          Add proof in the Defend step below, after Draft. Final Playbook text without
          any source is OK for low-stakes sections; high-rigor chapters need at least one.
        </p>
      </div>

      <!-- 5. What should I do if I'm stuck? -->
      <div class="rounded bg-white/80 p-2">
        <p class="font-medium text-neutral-700">What should I do if I'm stuck?</p>
        <ul class="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-800">
          <li v-for="(s, i) in stuckGuidance" :key="`hmu-stuck-${i}`">{{ s }}</li>
        </ul>
      </div>

      <p class="text-[11px] italic text-neutral-500">
        This panel just rephrases the curriculum guidance for this section.
        Nothing is sent anywhere; no AI is used here.
      </p>
    </div>
  </section>
</template>
