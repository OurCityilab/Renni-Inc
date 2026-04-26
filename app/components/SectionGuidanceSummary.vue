<script setup lang="ts">
// Compact, display-only guidance summary that lives inside an Output
// Workspace section card. Renders the same TemplateStudio guidance the
// student would otherwise have to scroll up to read — section title,
// lesson, example, prompts, required inputs, completion criteria,
// source guidance, and per-builder coaching guidance — but tight
// enough to read alongside the actual source notes / draft / final
// text inputs below it.
//
// Posture (do not relax):
//   - no Firestore calls
//   - no save / autosave behavior
//   - no local persistence
//   - no AI calls
//   - no status mutations
//   - no submit-gate or readiness logic
// The component is a pure pass-through of curriculum data the parent
// already has in `props.studio.sections[i]`.
import type { TemplateStudioSection } from '~/types/templateStudio'

defineProps<{
  // The active section the surrounding Output Workspace card is for.
  section: TemplateStudioSection
  // 1-based index, optional — surfaced as a small "Section N"
  // breadcrumb at the top so students can map back to the studio
  // index when the page is long.
  sectionIndex?: number
}>()
</script>

<template>
  <section
    class="space-y-2 rounded-md border border-sky-200 bg-sky-50/50 p-3 text-sm text-neutral-800"
    aria-label="Section guidance"
  >
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-sky-700">
        Section guidance
        <span v-if="sectionIndex">· Section {{ sectionIndex }}</span>
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        {{ section.title }}
      </h4>
      <p
        v-if="section.lesson"
        class="text-xs text-neutral-700"
      >{{ section.lesson }}</p>
    </header>

    <p
      v-if="section.example"
      class="rounded bg-white/70 p-2 text-xs text-neutral-700"
    >
      <span class="font-medium text-neutral-600">Example:</span>
      {{ section.example }}
    </p>

    <div
      v-if="section.studentPrompts && section.studentPrompts.length"
      class="text-xs"
    >
      <p class="font-medium text-neutral-600">Think through:</p>
      <ul class="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-700">
        <li v-for="(p, i) in section.studentPrompts" :key="`prompt-${i}`">{{ p }}</li>
      </ul>
    </div>

    <p
      v-if="section.requiredInputs && section.requiredInputs.length"
      class="text-xs text-neutral-700"
    >
      <span class="font-medium text-neutral-600">You'll need:</span>
      {{ section.requiredInputs.join(', ') }}
    </p>

    <div
      v-if="section.completionCriteria && section.completionCriteria.length"
      class="rounded bg-emerald-50 p-2 text-xs text-emerald-900"
    >
      <p class="font-medium">Done when:</p>
      <ul class="mt-0.5 list-disc space-y-0.5 pl-5">
        <li
          v-for="(c, i) in section.completionCriteria"
          :key="`criterion-${i}`"
        >{{ c }}</li>
      </ul>
    </div>

    <!-- Source / evidence guidance, when authored on the section. -->
    <div
      v-if="
        (section.sourceGuidance && section.sourceGuidance.length) ||
        section.evidencePrompt ||
        section.analysisPrompt
      "
      class="rounded bg-white/70 p-2 text-xs"
    >
      <p class="font-medium text-neutral-600">Evidence / source guidance:</p>
      <p
        v-if="section.evidencePrompt"
        class="mt-1 text-neutral-700"
      >{{ section.evidencePrompt }}</p>
      <p
        v-if="section.analysisPrompt"
        class="mt-1 text-neutral-700"
      >{{ section.analysisPrompt }}</p>
      <ul
        v-if="section.sourceGuidance && section.sourceGuidance.length"
        class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"
      >
        <li
          v-for="(g, i) in section.sourceGuidance"
          :key="`src-${i}`"
        >{{ g }}</li>
      </ul>
    </div>

    <!-- Builder hints — only render when authored on the section.
         Each line says "use this builder for this kind of question"
         so the student knows which tool below to engage. -->
    <div
      v-if="section.marketBuilder?.enabled || section.marketFit?.enabled || section.brandFit?.enabled"
      class="rounded bg-white/70 p-2 text-xs"
    >
      <p class="font-medium text-neutral-600">Use these builder tools here:</p>
      <ul class="mt-1 space-y-0.5 text-neutral-700">
        <li v-if="section.marketBuilder?.enabled">
          <span class="font-medium">Market Builder:</span>
          {{
            section.marketBuilder.guidance ||
            'Quantify the demand assumption — audience, interest, conversion, price.'
          }}
        </li>
        <li v-if="section.marketFit?.enabled">
          <span class="font-medium">Market Fit Builder:</span>
          {{
            section.marketFit.guidance ||
            'Compare segments, profiles, comparables, and source needs before naming a primary market.'
          }}
        </li>
        <li v-if="section.brandFit?.enabled">
          <span class="font-medium">Brand Fit Builder:</span>
          {{
            section.brandFit.guidance ||
            'Argue that visual identity, voice, and references send the same signal as the price point and target customer.'
          }}
        </li>
      </ul>
    </div>
  </section>
</template>
