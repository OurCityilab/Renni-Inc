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

const runtimeConfig = useRuntimeConfig()
const customerProfileBuilderEnabled = computed<boolean>(
  () => runtimeConfig.public?.customerProfileBuilderEnabled === true
)

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

// Decide the right "next action" CTA: open a builder if the section
// opts into one, otherwise drop the student into the writing surface.
// Anchors below match wrapper ids inside DeliverableOutputWorkspace.
interface NextStepCta {
  label: string
  anchorId: string
}

const nextStepCta = computed<NextStepCta>(() => {
  const s = props.section
  // Launch-critical engines first. Mirrors pickAnchorIdForSection so
  // the leader-facing strip and the student-facing recipe panel both
  // deeplink to the same anchor.
  if (s.financeTable?.enabled) {
    return { label: financeTableLabel(s.financeTable.kind), anchorId: `ftb-${s.id}` }
  }
  if (s.operationsChecklist?.enabled) {
    return { label: operationsChecklistLabel(s.operationsChecklist.kind), anchorId: `ocb-${s.id}` }
  }
  // Key Activities Builder is checked next when its per-section flag
  // is on, mirroring the priority used by `pickAnchorIdForSection` in
  // app/utils/studentNextActions.ts so the leader-facing strip and
  // the student-facing recipe panel both deeplink to the same anchor.
  if (s.keyActivities?.enabled) {
    return { label: 'Open Key Activities Builder', anchorId: `kab-${s.id}` }
  }
  if (customerProfileBuilderEnabled.value && s.id === 'customer-segments') {
    return { label: 'Open Customer Builder', anchorId: `cpb-${s.id}` }
  }
  if (s.chipPickQuickStart?.enabled) {
    return { label: 'Open QuickStart', anchorId: `cqs-${s.id}` }
  }
  if (s.marketFit?.enabled) {
    return { label: 'Open Market Fit Builder', anchorId: `mfb-${s.id}` }
  }
  if (s.brandFit?.enabled) {
    return { label: 'Open Brand Builder', anchorId: `bfb-${s.id}` }
  }
  if (s.pricingStrategy?.enabled) {
    return { label: 'Open Pricing Builder', anchorId: `psb-${s.id}` }
  }
  return { label: 'Start writing', anchorId: `dft-${s.id}` }
})

function financeTableLabel(kind: string): string {
  switch (kind) {
    case 'unit-cost':
      return 'Open Unit Cost Table'
    case 'break-even':
      return 'Open Break-Even Table'
    case 'revenue-scenarios':
      return 'Open Revenue Scenarios Table'
    case 'donation-scenarios':
      return 'Open Donation Scenarios Table'
    case 'kpi':
      return 'Open KPI Table'
    default:
      return 'Open Finance Table'
  }
}

function operationsChecklistLabel(kind: string): string {
  switch (kind) {
    case 'inventory':
      return 'Open Inventory Checklist'
    case 'day-of-sop':
      return 'Open Day-of SOP'
    case 'baked-goods-sop':
      return 'Open Baked Goods SOP'
    case 'continuity':
      return 'Open Continuity Checklist'
    default:
      return 'Open Operations Checklist'
  }
}

// Click handler. Walks up from the target node, opening any
// `<details>` ancestors so the target is actually visible after the
// scroll (anchor scroll alone leaves a closed `<details>` closed).
// Fails gracefully — no errors thrown if the target is missing.
function jumpToNextStep(): void {
  if (typeof document === 'undefined') return
  const id = nextStepCta.value.anchorId
  const target = document.getElementById(id)
  if (!target) return
  let cur: HTMLElement | null = target
  while (cur) {
    if (cur.tagName === 'DETAILS') {
      ;(cur as HTMLDetailsElement).open = true
    }
    cur = cur.parentElement
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Mild focus ring so the student's eye lands on the right area.
  target.setAttribute('tabindex', '-1')
  ;(target as HTMLElement).focus({ preventScroll: true })
}
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

    <!-- Your next action: the one plain-language thing to do first +
         a direct-jump button to the right work area. -->
    <div
      class="flex flex-col gap-2 rounded-md border border-phoenix-300 bg-phoenix-50 p-2 text-sm text-phoenix-900 sm:flex-row sm:items-start sm:justify-between"
    >
      <p class="flex-1">
        <span
          class="mr-1 inline-block rounded bg-phoenix-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-phoenix-900"
        >
          Your next action
        </span>
        {{ nextAction }}
      </p>
      <button
        type="button"
        class="shrink-0 rounded border border-phoenix-500 bg-phoenix-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-phoenix-700"
        @click="jumpToNextStep"
      >
        {{ nextStepCta.label }} →
      </button>
    </div>

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
