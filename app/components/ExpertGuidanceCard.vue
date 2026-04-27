<script setup lang="ts">
// ExpertGuidanceCard — display-only field-expert coaching for a
// single section. Mounted next to SectionGuidanceSummary in the
// section workspace; shows nothing when section.expertGuidance is
// missing so legacy / non-priority sections render as before.
//
// Posture (do not relax):
//   - read-only / display-only
//   - no Firestore writes, no autosave
//   - no AI calls — the optional aiCoachPrompt is copy-only
//   - never gates submit, never affects Playbook readiness
//   - student-facing tone is direct, not generic; the studio
//     authors curriculum-level copy, this component just renders it

import { computed, ref } from 'vue'
import type {
  ExpertGuidance,
  TemplateStudioSection
} from '~/types/templateStudio'

const props = defineProps<{
  section: TemplateStudioSection
  // 1-based index, optional — surfaced as a small "Section N"
  // breadcrumb at the top, mirroring SectionGuidanceSummary so
  // both cards read consistently.
  sectionIndex?: number
}>()

const eg = computed<ExpertGuidance | null>(() => props.section.expertGuidance ?? null)

// Auto-build a copy-only AI coach prompt from the other fields when
// the studio didn't author one. Renni Command Center never sends
// this anywhere; the student pastes it into Claude / ChatGPT
// externally.
function buildPromptFromGuidance(g: ExpertGuidance, sectionTitle: string): string {
  const lines: string[] = []
  lines.push(`# Coach me through this section — copy-only prompt`)
  lines.push('')
  lines.push(
    'Copy this prompt into Claude / ChatGPT or another LLM. Renni Command Center does not send this anywhere — copy-only.'
  )
  lines.push('')
  lines.push(`## Section: ${sectionTitle}`)
  if (g.expertRole) {
    lines.push('')
    lines.push(`Act as a ${g.expertRole}. Review what I have written for this section.`)
  }
  if (g.whyThisMatters) {
    lines.push('')
    lines.push(`## Why this section matters`)
    lines.push('')
    lines.push(g.whyThisMatters)
  }
  if (g.whatToGather?.length) {
    lines.push('')
    lines.push(`## What I should be gathering`)
    lines.push('')
    for (const w of g.whatToGather) lines.push(`- ${w}`)
  }
  if (g.weakAnswerLooksLike) {
    lines.push('')
    lines.push(`## What a weak answer would miss`)
    lines.push('')
    lines.push(g.weakAnswerLooksLike)
  }
  if (g.strongAnswerLooksLike) {
    lines.push('')
    lines.push(`## What a strong answer should prove`)
    lines.push('')
    lines.push(g.strongAnswerLooksLike)
  }
  if (g.expertPushback?.length) {
    lines.push('')
    lines.push(`## Questions an expert would ask`)
    lines.push('')
    for (const q of g.expertPushback) lines.push(`- ${q}`)
  }
  lines.push('')
  lines.push('## Coaching rules (do not break these)')
  lines.push('')
  lines.push('- Do not write final text for me. Ask me what evidence I have.')
  lines.push('- Push back on weak assumptions; suggest questions, not final answers.')
  lines.push('- Do not invent facts, prices, comps, segment data, or evidence.')
  lines.push('- You may not approve, submit, or change calculations.')
  lines.push('- The system of record is student-authored work in Renni Command Center.')
  return lines.join('\n')
}

const aiCoachPrompt = computed<string | null>(() => {
  if (!eg.value) return null
  if (eg.value.aiCoachPrompt?.trim()) return eg.value.aiCoachPrompt.trim()
  // Build only when at least one field is set so we don't generate
  // a useless skeleton prompt for sections with no guidance.
  const g = eg.value
  const hasContent =
    Boolean(g.expertRole) ||
    Boolean(g.whyThisMatters) ||
    Boolean(g.whatToGather?.length) ||
    Boolean(g.weakAnswerLooksLike) ||
    Boolean(g.strongAnswerLooksLike) ||
    Boolean(g.expertPushback?.length)
  if (!hasContent) return null
  return buildPromptFromGuidance(g, props.section.title)
})

const copiedPrompt = ref(false)
async function copyPrompt() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  if (!aiCoachPrompt.value) return
  try {
    await navigator.clipboard.writeText(aiCoachPrompt.value)
    copiedPrompt.value = true
    setTimeout(() => {
      copiedPrompt.value = false
    }, 1500)
  } catch {
    // Best-effort. The textarea is selectable manually too.
  }
}
</script>

<template>
  <section
    v-if="eg"
    class="space-y-2 rounded-md border border-violet-200 bg-violet-50/40 p-3 text-sm text-neutral-800"
    aria-label="Expert guidance"
  >
    <header class="space-y-0.5">
      <p class="text-xs uppercase tracking-wide text-violet-700">
        Expert guidance
        <span v-if="sectionIndex"> · Section {{ sectionIndex }}</span>
        <span v-if="eg.expertRole"> · {{ eg.expertRole }}</span>
      </p>
      <h4 class="text-sm font-semibold text-neutral-900">
        Coaching from a {{ eg.expertRole || 'field expert' }} for "{{ section.title }}"
      </h4>
      <p
        v-if="eg.whyThisMatters"
        class="text-xs text-neutral-700"
      >{{ eg.whyThisMatters }}</p>
    </header>

    <!-- Top row: chips for owner hint + decision supported. Visual
         glance at "who drives this" + "what decision it serves." -->
    <ul
      v-if="eg.ownerHint || eg.decisionSupported"
      class="flex flex-wrap gap-1.5 text-[11px]"
    >
      <li
        v-if="eg.ownerHint"
        class="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 uppercase tracking-wide text-violet-800"
      >Owner · {{ eg.ownerHint }}</li>
      <li
        v-if="eg.decisionSupported"
        class="rounded-full border border-neutral-300 bg-white px-2 py-0.5 uppercase tracking-wide text-neutral-700"
      >Decision · {{ eg.decisionSupported }}</li>
    </ul>

    <!-- What to gather + where to find it. Always-visible because
         the brief calls these the most important fields. -->
    <div
      v-if="eg.whatToGather?.length || eg.whereToFindIt?.length"
      class="rounded-md border border-violet-200 bg-white p-2 text-xs"
    >
      <div v-if="eg.whatToGather?.length">
        <p class="font-medium text-neutral-700">What to gather</p>
        <ul class="ml-4 list-disc space-y-0.5 text-neutral-800">
          <li v-for="(w, i) in eg.whatToGather" :key="`eg-w-${i}`">{{ w }}</li>
        </ul>
      </div>
      <div v-if="eg.whereToFindIt?.length" class="mt-1">
        <p class="font-medium text-neutral-700">Where to find it</p>
        <ul class="ml-4 list-disc space-y-0.5 text-neutral-700">
          <li v-for="(w, i) in eg.whereToFindIt" :key="`eg-find-${i}`">{{ w }}</li>
        </ul>
      </div>
    </div>

    <!-- Weak vs strong + pushback. Collapsed by default to keep
         the chapter hub light when this card is reused there. -->
    <details class="rounded-md border border-violet-200 bg-white p-2 text-xs">
      <summary class="cursor-pointer text-xs font-medium text-violet-900">
        What does strong vs. weak work look like?
      </summary>
      <div class="mt-1 space-y-1">
        <p
          v-if="eg.weakAnswerLooksLike"
          class="text-neutral-800"
        >
          <span class="font-medium text-rose-700">Weak:</span>
          {{ eg.weakAnswerLooksLike }}
        </p>
        <p
          v-if="eg.strongAnswerLooksLike"
          class="text-neutral-800"
        >
          <span class="font-medium text-emerald-700">Strong:</span>
          {{ eg.strongAnswerLooksLike }}
        </p>
        <div
          v-if="eg.expertPushback?.length"
          class="rounded bg-amber-50 p-2 text-neutral-800"
        >
          <p class="font-medium text-amber-900">Questions an expert would ask</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li v-for="(q, i) in eg.expertPushback" :key="`eg-q-${i}`">{{ q }}</li>
          </ul>
        </div>
        <div
          v-if="eg.commonMistakes?.length"
          class="rounded bg-neutral-50 p-2 text-neutral-700"
        >
          <p class="font-medium text-neutral-700">Common mistakes</p>
          <ul class="ml-4 list-disc space-y-0.5">
            <li v-for="(m, i) in eg.commonMistakes" :key="`eg-m-${i}`">{{ m }}</li>
          </ul>
        </div>
      </div>
    </details>

    <!-- Connections + done. Single collapsible to keep the surface
         area small when nothing is set. -->
    <details
      v-if="eg.connectsTo?.length || eg.doneLooksLike"
      class="rounded-md border border-neutral-200 bg-white p-2 text-xs"
    >
      <summary class="cursor-pointer text-xs font-medium text-neutral-700">
        Where this section connects + what done looks like
      </summary>
      <div class="mt-1 space-y-1">
        <div v-if="eg.connectsTo?.length">
          <p class="font-medium text-neutral-700">Connects to</p>
          <ul class="ml-4 list-disc space-y-0.5 text-neutral-700">
            <li v-for="(c, i) in eg.connectsTo" :key="`eg-c-${i}`">{{ c }}</li>
          </ul>
        </div>
        <p v-if="eg.doneLooksLike" class="text-neutral-700">
          <span class="font-medium text-neutral-600">Done looks like:</span>
          {{ eg.doneLooksLike }}
        </p>
      </div>
    </details>

    <!-- Copy-only AI coach prompt. No API call from here. -->
    <details
      v-if="aiCoachPrompt"
      class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
    >
      <summary class="cursor-pointer font-semibold">
        Prompt for AI coach (copy-only)
      </summary>
      <p class="my-1 italic">
        Paste into Claude / ChatGPT externally. Renni Command Center never
        sends this anywhere.
      </p>
      <textarea
        readonly
        rows="6"
        class="w-full rounded border border-amber-200 bg-white p-1.5 font-mono text-[10px] leading-snug"
        :value="aiCoachPrompt"
      />
      <button
        type="button"
        class="mt-1 rounded border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
        @click="copyPrompt"
      >{{ copiedPrompt ? 'Copied ✓' : 'Copy prompt' }}</button>
    </details>

    <p class="text-[11px] italic text-neutral-500">
      Curriculum-level coaching. AI cannot approve, submit, or invent missing
      evidence. Chiefs and instructor still decide.
    </p>
  </section>
</template>
