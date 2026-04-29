<!--
  SectionRecipePanel — compact recipe panel mounted at the top of the
  section route page. Mirrors the My Next Actions card on the home
  dashboard so a student who clicked a card lands on a section page
  that feels like a continuation of that card.

  POSTURE
  -------
    - Pure UI. Pure deterministic recipe (reuses
      app/utils/studentNextActions.ts: `buildSectionRecipe`,
      `pickRecipe`, `buildDoneWhen`, `buildReviewerLabel`).
    - No AI calls, no Firestore writes, no /api/* requests.
    - Single CTA scrolls to the right work surface inside
      DeliverableOutputWorkspace via the existing wrapper anchors
      (cpb / cqs / mfb / bfb / psb / dft).
    - Visible to all viewers (the recipe is useful as a quick-scan
      summary for chiefs too). The section route gates the heavier
      legacy strip + cards behind a leader check so students see
      ONE clear panel instead of three.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { Deliverable, Task } from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import {
  buildSectionRecipe,
  type SectionRecipeModel
} from '~/utils/studentNextActions'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  section: TemplateStudioSection
  /** Optional task threaded in from the route's `?taskId=` query.
   *  When present, `buildSectionRecipe` uses the task's
   *  `definitionOfDone` (when set) for the "Done when" line — closing
   *  the dashboard → section continuity loop so the panel matches
   *  the exact card the student clicked. */
  task?: Task | null
}>()

const runtimeConfig = useRuntimeConfig()
const customerProfileBuilderEnabled = computed<boolean>(
  () => runtimeConfig.public?.customerProfileBuilderEnabled === true
)

const recipe = computed<SectionRecipeModel>(() =>
  buildSectionRecipe({
    deliverable: props.deliverable,
    section: props.section,
    studio: props.studio,
    task: props.task ?? null,
    customerProfileBuilderEnabled: customerProfileBuilderEnabled.value
  })
)

// Smooth-scroll + open any <details> ancestor so the target work
// surface is actually visible after the jump. Mirrors the click
// handler used by SectionGuidanceStrip.
function jumpToWorkSurface(): void {
  if (typeof document === 'undefined') return
  const target = document.getElementById(recipe.value.anchorId)
  if (!target) return
  let cur: HTMLElement | null = target
  while (cur) {
    if (cur.tagName === 'DETAILS') {
      ;(cur as HTMLDetailsElement).open = true
    }
    cur = cur.parentElement
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  target.setAttribute('tabindex', '-1')
  ;(target as HTMLElement).focus({ preventScroll: true })
}
</script>

<template>
  <section
    class="rounded-lg border border-phoenix-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0"
    aria-label="Section recipe panel"
  >
    <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
      <div class="min-w-0">
        <p class="text-[11px] uppercase tracking-wide text-phoenix-700">
          Section recipe
        </p>
        <h1 class="text-lg font-semibold text-neutral-900 break-words">
          {{ section.title }}
        </h1>
      </div>
      <span
        class="shrink-0 rounded border border-phoenix-300 bg-phoenix-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-phoenix-900"
      >
        Action-first
      </span>
    </header>

    <div v-if="recipe.outputFormat">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Output format
      </p>
      <p class="mt-0.5 text-sm font-semibold text-phoenix-900 break-words">
        {{ recipe.outputFormat }}
      </p>
      <p
        v-if="recipe.outputExample"
        class="mt-1 rounded border border-stone-200 bg-stone-50 p-2 font-mono text-[11px] text-stone-700 break-words"
      >
        {{ recipe.outputExample }}
      </p>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Do this
      </p>
      <p class="mt-0.5 text-sm text-neutral-800 break-words">
        {{ recipe.doThis }}
      </p>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        How to do it
      </p>
      <ol class="mt-1 ml-5 list-decimal space-y-0.5 text-sm text-neutral-800">
        <li
          v-for="(step, i) in recipe.howToDoIt"
          :key="i"
          class="break-words"
        >
          {{ step }}
        </li>
      </ol>
    </div>

    <div>
      <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Done when
      </p>
      <p class="mt-0.5 text-sm text-neutral-800 break-words">
        {{ recipe.doneWhen }}
      </p>
    </div>

    <p class="text-xs text-neutral-700 break-words">
      {{ recipe.reviewedBy }}
    </p>

    <button
      type="button"
      class="btn-primary text-sm w-full sm:w-auto sm:self-start"
      @click="jumpToWorkSurface"
    >
      {{ recipe.buttonLabel }}
    </button>
  </section>
</template>
