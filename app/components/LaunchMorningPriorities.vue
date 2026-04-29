<!--
  LaunchMorningPriorities — five role-grouped cards on the home
  dashboard that route students directly to the launch-critical
  section the platform expects them to work on tomorrow morning.

  POSTURE
  -------
    - Pure presentational. No props, no emits.
    - No Firestore writes, no AI calls, no clipboard, no auto-nav.
    - Static cards: each card is a small panel with a title, output
      summary, two-or-three deeplink buttons, and a one-sentence
      instruction.
    - Visible to every audience. Members use it as a fallback when
      their personal "My Next Actions" hasn't been seeded yet;
      chiefs and admins use it to point teams at the right surface.

  WHY THIS EXISTS
  ---------------
    Tomorrow morning we cannot rely on every task being assigned
    perfectly. This component is a deterministic floor: a student
    who opens the home page can find their group, click into the
    section, and start producing the launch output their role owns.
    It does not replace My Next Actions; it sits below it and never
    creates tasks, never changes status, and never writes anything.
-->
<script setup lang="ts">
interface PriorityCard {
  title: string
  priority: number
  output: string
  instruction: string
  buttons: Array<{
    label: string
    href: string
  }>
}

// Routes are hand-coded against the existing deliverable / section
// ids in app/data/templateStudios. If a section id changes, update
// this list — keeping it deterministic and inline beats threading
// metadata through a router lookup for what is essentially a
// one-night classroom orientation card.
const cards: PriorityCard[] = [
  {
    title: 'CFO / Finance',
    priority: 1,
    output: 'Cost, margin, break-even, and revenue table',
    instruction:
      'Use the tables first. Copy the output into Working Draft, edit it, and save.',
    buttons: [
      {
        label: 'Unit Cost Table',
        href: '/deliverables/ch-08-finance-and-revenue-model/sections/unit-cost'
      },
      {
        label: 'Break-Even Table',
        href: '/deliverables/ch-08-finance-and-revenue-model/sections/break-even'
      },
      {
        label: 'Revenue Scenarios Table',
        href: '/deliverables/ch-08-finance-and-revenue-model/sections/revenue-scenarios'
      }
    ]
  },
  {
    title: 'COO / Operations',
    priority: 2,
    output: 'Inventory checklist and SOPs',
    instruction:
      'Build the checklist or SOP so another student could follow it without you explaining it.',
    buttons: [
      {
        label: 'Inventory Checklist',
        href: '/deliverables/ch-09-operations-and-continuity-systems/sections/inventory'
      },
      {
        label: 'Day-of SOP',
        href: '/deliverables/ch-09-operations-and-continuity-systems/sections/day-of-sop'
      },
      {
        label: 'Baked Goods SOP',
        href: '/deliverables/ch-09-operations-and-continuity-systems/sections/baked-goods-sop'
      }
    ]
  },
  {
    title: 'Strategy and Growth / Marketing',
    priority: 3,
    output: 'Customer profiles and repeatable activities',
    instruction:
      'Build customer profiles and repeatable business activities for Renni Inc., not just one pop-up.',
    buttons: [
      {
        label: 'Customer Segments',
        href: '/deliverables/ch-04-business-model-canvas/sections/customer-segments'
      },
      {
        label: 'Key Activities',
        href: '/deliverables/ch-04-business-model-canvas/sections/key-activities'
      }
    ]
  },
  {
    title: 'CMO / Brand',
    priority: 4,
    output: 'Brand rules and draft language',
    instruction:
      'Make concrete brand choices. Write rules another student could use for captions, signs, and product copy.',
    buttons: [
      {
        label: 'Brand Voice',
        href: '/deliverables/ch-05-house-phoenix-brand-book/sections/voice'
      },
      {
        label: 'Brand Identity',
        href: '/deliverables/ch-05-house-phoenix-brand-book/sections/identity'
      }
    ]
  },
  {
    title: 'Co-CEOs / Chiefs',
    priority: 5,
    output: 'Review blocked, overdue, and ready work',
    instruction:
      'Review what is blocked, overdue, or ready. Decide what your team should finish first.',
    buttons: [
      { label: 'C-suite Dashboard', href: '/c-suite' },
      { label: 'Project Navigator', href: '/c-suite/project-navigator' }
    ]
  }
]
</script>

<template>
  <section
    class="space-y-3 min-w-0"
    aria-label="Launch Morning Priorities"
  >
    <header>
      <h2
        class="text-sm font-semibold uppercase tracking-wide text-neutral-700"
      >
        Launch Morning Priorities
      </h2>
      <p class="text-xs text-neutral-600">
        Start with your group. Open the section, use the builder /
        table / checklist, copy into Working Draft, edit, and save.
      </p>
    </header>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3 min-w-0">
      <article
        v-for="card in cards"
        :key="card.priority"
        class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm flex flex-col gap-3 min-w-0"
      >
        <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <p class="text-sm font-semibold text-neutral-900 break-words">
            {{ card.title }}
          </p>
          <span
            class="inline-flex items-center rounded border border-phoenix-300 bg-phoenix-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-phoenix-900"
          >
            Priority {{ card.priority }}
          </span>
        </header>

        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Output
          </p>
          <p class="mt-0.5 text-sm text-neutral-800 break-words">
            {{ card.output }}
          </p>
        </div>

        <p class="text-xs text-neutral-700 break-words">
          {{ card.instruction }}
        </p>

        <div class="flex flex-col gap-1.5">
          <NuxtLink
            v-for="btn in card.buttons"
            :key="btn.href"
            :to="btn.href"
            class="rounded border border-phoenix-300 bg-phoenix-50 px-2 py-1 text-xs font-medium text-phoenix-900 hover:bg-phoenix-100 break-words"
          >
            Open {{ btn.label }} →
          </NuxtLink>
        </div>
      </article>
    </div>
  </section>
</template>
