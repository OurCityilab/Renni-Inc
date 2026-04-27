<script setup lang="ts">
// Pure display component layered over a single Output Workspace
// section card. Does four things, all read-only:
//   1. Surfaces a compact "Suggested workflow" sequence cue, adapted
//      to the builders that are actually enabled on this section.
//   2. Names the likely owner role for the section (chapter-driven)
//      so students know who to push to next without mutating any
//      ownership data.
//   3. Renders a curated set of sentence starters / Playbook
//      language scaffolds for the section's chapter category.
//   4. Renders a 6-line "Before finalizing, check" reminder list
//      that students can read off the screen but nothing stores.
//
// Posture (do not relax):
//   - no Firestore calls
//   - no save / autosave
//   - no AI calls
//   - no status mutations
//   - no submit-gate or readiness logic
//   - no data model changes — chapter category is derived from
//     props.deliverableId, owner role from a static map.
import { computed, ref } from 'vue'
import type { TemplateStudioSection } from '~/types/templateStudio'
import {
  getLikelyOwner,
  getPrimaryHelpRole
} from '~/data/chapterOwners'

const props = defineProps<{
  // Owning deliverable id — used to drive chapter-specific starters,
  // the likely-owner cue, and the Ping-chief help message. The id
  // maps directly to the studio registry key (e.g.
  // 'ch-07-current-product-line-and-pricing').
  deliverableId: string
  section: TemplateStudioSection
}>()

// --- Workflow cue --------------------------------------------------
// "Suggested workflow" line, adapted to the builders the section
// actually opted into so the cue mentions the tool the student will
// see below.
const workflowSteps = computed<string[]>(() => {
  const steps = ['Add source notes.']
  const builderHints: string[] = []
  if (props.section.marketBuilder?.enabled) {
    builderHints.push('Market Builder')
  }
  if (props.section.marketFit?.enabled) {
    builderHints.push('Market Fit')
  }
  if (props.section.brandFit?.enabled) {
    builderHints.push('Brand Fit')
  }
  if (builderHints.length) {
    steps.push(`Use ${builderHints.join(' / ')} before final text.`)
  } else {
    steps.push('Skip the builder section if this chapter has none.')
  }
  steps.push('Draft your answer.')
  steps.push('Turn the draft into final Playbook text.')
  // The AI critique panel is gated to specific chapters; surface the
  // cue only when the section is eligible.
  const aiChapters = new Set([
    'ch-07-current-product-line-and-pricing',
    'ch-08-finance-and-revenue-model',
    'ch-11-phoenix-nest-retail-carry-pitch'
  ])
  if (
    aiChapters.has(props.deliverableId) &&
    props.section.marketBuilder?.enabled
  ) {
    steps.push(
      'Run market evidence critique after notes, evidence, or builder inputs exist.'
    )
  }
  steps.push('Save.')
  return steps
})

const likelyOwner = computed<string>(() =>
  getLikelyOwner(props.deliverableId)
)
// First role in the owner string — the chief most likely to push the
// work next. Used by the Ping-chief affordance below to name one
// person to ask, not the whole support cast.
const primaryHelpRole = computed<string>(() =>
  getPrimaryHelpRole(props.deliverableId)
)

// --- Ping-chief help message ----------------------------------------
// Read-only clipboard handoff. We do NOT introduce email, Slack, or
// any new messaging path; we just hand the student a prewritten
// sentence they can paste wherever their team already talks. The
// student fills in the bracketed reason before sending.
const helpMessage = computed<string>(() => {
  const sectionTitle = props.section.title || 'this section'
  return (
    `I'm working on ${sectionTitle} (deliverable ${props.deliverableId}). ` +
    `I'm stuck on [say what's hard in 1-2 sentences]. ` +
    `Can you help me figure out the next step?`
  )
})

const helpCopied = ref(false)
async function copyHelpMessage(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(helpMessage.value)
    helpCopied.value = true
    setTimeout(() => {
      helpCopied.value = false
    }, 1500)
  } catch {
    // Best-effort. The student can still select the prewritten text.
  }
}

// --- Sentence starter palette --------------------------------------
// Categories combine "general" with whichever of brand / market /
// finance / phoenixNest the section opts into.
const GENERAL_STARTERS: string[] = [
  'Our current recommendation is…',
  'The strongest evidence is…',
  'The biggest assumption is…',
  'The main risk is…',
  'Before launch, we still need to validate…',
  'This matters for the pop-up because…',
  'This matters for Phoenix Nest because…',
  'This should be handed off to the next cohort because…'
]
const MARKET_STARTERS: string[] = [
  'Our likely buyer is…',
  'This product is priced for…',
  'This segment is reachable because…',
  'The weakest demand assumption is…',
  'The next validation step is…'
]
const BRAND_STARTERS: string[] = [
  'This brand should feel…',
  'The visual identity signals…',
  'The voice should sound…',
  'The biggest brand mismatch risk is…',
  'We should test whether customers perceive…'
]
const FINANCE_STARTERS: string[] = [
  'The base scenario assumes…',
  'The break-even risk is…',
  'Demand estimates are separate from pricing and margin because…'
]
const PHOENIX_NEST_STARTERS: string[] = [
  'The retail carry recommendation is…',
  'Phoenix Nest should consider this product because…',
  'The carry risk is…',
  'A safer test would be…'
]

interface StarterSection {
  label: string
  starters: string[]
}

const sentenceStarterSections = computed<StarterSection[]>(() => {
  const out: StarterSection[] = []
  // Always offer general — covers any chapter.
  out.push({ label: 'General', starters: GENERAL_STARTERS })

  const id = props.deliverableId
  const sec = props.section
  // Market / product / customer thinking.
  if (
    sec.marketBuilder?.enabled ||
    sec.marketFit?.enabled ||
    id === 'ch-04-business-model-canvas' ||
    id === 'ch-07-current-product-line-and-pricing' ||
    id === 'ch-10-marketing-and-campaign-playbook'
  ) {
    out.push({ label: 'Market / product', starters: MARKET_STARTERS })
  }
  // Brand identity / voice / campaign.
  if (
    sec.brandFit?.enabled ||
    id === 'ch-05-house-phoenix-brand-book' ||
    id === 'ch-06-supporting-brand-sheets' ||
    id === 'ch-10-marketing-and-campaign-playbook'
  ) {
    out.push({ label: 'Brand', starters: BRAND_STARTERS })
  }
  // Finance / revenue.
  if (id === 'ch-08-finance-and-revenue-model') {
    out.push({ label: 'Finance / revenue', starters: FINANCE_STARTERS })
  }
  // Phoenix Nest carry pitch.
  if (id === 'ch-11-phoenix-nest-retail-carry-pitch') {
    out.push({ label: 'Phoenix Nest', starters: PHOENIX_NEST_STARTERS })
  }
  return out
})

// --- Final Playbook text checklist ---------------------------------
// Display-only. No checkbox state. No save path. No reactivity beyond
// the static list.
const FINAL_TEXT_CHECKLIST: string[] = [
  'The claim is specific.',
  'Evidence or source is named.',
  'Assumptions are labeled.',
  'Risk or unknown is acknowledged.',
  'Next validation step is clear.',
  'The wording sounds usable by the next cohort.'
]
</script>

<template>
  <section
    class="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-neutral-800"
    aria-label="Playbook writing scaffold"
  >
    <header class="space-y-0.5">
      <p class="text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Playbook writing scaffold
      </p>
      <p class="text-neutral-700">
        Use these prompts to turn your source notes and builder thinking into
        final Playbook text. Read-only — nothing here is saved.
      </p>
    </header>

    <!-- Workflow cue + likely owner. Compact. -->
    <div class="rounded bg-white/70 p-2">
      <p class="font-medium text-neutral-700">Suggested workflow:</p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-5 text-neutral-800">
        <li v-for="(step, i) in workflowSteps" :key="`step-${i}`">{{ step }}</li>
      </ol>
      <p class="mt-1 text-neutral-700">
        <span class="font-medium">Likely owner to push this next:</span>
        {{ likelyOwner }}.
      </p>
    </div>

    <!-- Ping-chief / "Need help?" affordance. Display-only:
         no Firestore writes, no email or Slack integration, no
         server call. The button copies a prewritten sentence to
         the clipboard so the student can paste it into whichever
         channel their team already uses. They fill in the
         bracketed reason before sending. -->
    <div class="rounded bg-white/70 p-2">
      <p class="font-medium text-neutral-700">
        Need help? Ask: {{ primaryHelpRole }}.
      </p>
      <p class="mt-1 text-neutral-700">
        Copy this prewritten message and paste it wherever your team
        already talks. Replace the bracketed reason with what is hard
        for you right now.
      </p>
      <p class="mt-1 italic text-neutral-700">"{{ helpMessage }}"</p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded border border-emerald-300 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50"
          @click="copyHelpMessage"
        >{{ helpCopied ? 'Copied ✓' : 'Copy help message' }}</button>
        <span class="text-[11px] text-neutral-500">
          If you are blocked, you can also open the task and mark it
          stuck with a short note.
        </span>
      </div>
    </div>

    <!-- Sentence starters by category -->
    <div class="rounded bg-white/70 p-2">
      <p class="font-medium text-neutral-700">Sentence starters:</p>
      <div
        v-for="(group, gi) in sentenceStarterSections"
        :key="`starter-group-${gi}`"
        class="mt-1.5"
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {{ group.label }}
        </p>
        <ul class="mt-0.5 list-disc space-y-0.5 pl-5 text-neutral-800">
          <li
            v-for="(s, si) in group.starters"
            :key="`starter-${gi}-${si}`"
          >{{ s }}</li>
        </ul>
      </div>
    </div>

    <!-- Final Playbook checklist (display-only, no checkbox state). -->
    <div class="rounded bg-white/70 p-2">
      <p class="font-medium text-neutral-700">Before finalizing, check:</p>
      <ul class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-800">
        <li
          v-for="(item, i) in FINAL_TEXT_CHECKLIST"
          :key="`check-${i}`"
        >{{ item }}</li>
      </ul>
      <p class="mt-1 text-neutral-500">
        Display-only — checking these does not affect submit, readiness, or save.
      </p>
    </div>
  </section>
</template>
