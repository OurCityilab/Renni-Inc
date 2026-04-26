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
import { computed } from 'vue'
import type { TemplateStudioSection } from '~/types/templateStudio'

const props = defineProps<{
  // Owning deliverable id — used to drive chapter-specific starters
  // and the likely-owner cue. The id maps directly to the studio
  // registry key (e.g. 'ch-07-current-product-line-and-pricing').
  deliverableId: string
  section: TemplateStudioSection
}>()

// --- Likely-owner map ----------------------------------------------
// Curriculum-shipped — keeps Renaissance students learning who pushes
// the work without us mutating any owner field.
const LIKELY_OWNER_BY_CHAPTER: Record<string, string> = {
  'ch-01-executive-summary': 'Co-CEOs',
  'ch-02-renni-overview-and-brand-architecture': 'Co-CEOs · CMO support',
  'ch-03-company-structure-and-continuity': 'Co-CEOs · COO support',
  'ch-04-business-model-canvas':
    'Chief Strategy and Growth Officer · Co-CEO sign-off',
  'ch-05-house-phoenix-brand-book': 'CMO',
  'ch-06-supporting-brand-sheets': 'CMO · Co-CEO support',
  'ch-07-current-product-line-and-pricing':
    'CFO · COO support',
  'ch-08-finance-and-revenue-model':
    'CFO · Chief Strategy and Growth Officer support',
  'ch-09-operations-and-continuity-systems': 'COO',
  'ch-10-marketing-and-campaign-playbook':
    'CMO · Chief Strategy and Growth Officer support',
  'ch-11-phoenix-nest-retail-carry-pitch':
    'Co-CEOs · CFO / CMO / COO / CSGO support',
  'ch-12-strategy-and-next-semester-recommendations':
    'Chief Strategy and Growth Officer · Co-CEO sign-off',
  'ch-13-decision-log-and-appendices':
    'Co-CEOs · cross-functional support'
}

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

const likelyOwner = computed<string>(() => {
  return (
    LIKELY_OWNER_BY_CHAPTER[props.deliverableId] || 'Co-CEOs · cross-functional'
  )
})

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
