<!--
  LaunchReadinessChecklist — chief-facing read-only checklist that
  names each of the 10 launch-critical builder sections and links
  directly to the section page. The chief clicks through, confirms
  the builder underneath was populated, and moves on.

  POSTURE
  -------
    - Pure presentational. No props. No Firestore reads, no AI
      calls, no derivation.
    - Display-only "needs check" labels. Never claims a section is
      blocked or missing data — the platform has no reliable
      structured signal for builder-row counts (those live in
      local component state). The chief is the source of truth.
    - Mounted on the Project Navigator page only. Never on student
      pages.
-->
<script setup lang="ts">
interface CheckItem {
  group: string
  section: string
  href: string
}

// Hand-coded against existing deliverable / section ids in
// app/data/templateStudios. Same source-of-truth rule as
// LaunchMorningPriorities.vue: when a section id changes, update
// this list.
const checks: CheckItem[] = [
  // Ch. 7 — Product Line and Pricing
  {
    group: 'Finance · Ch. 7',
    section: 'Margin and Break-Even',
    href: '/deliverables/ch-07-current-product-line-and-pricing/sections/margin-and-break-even'
  },
  // Ch. 8 — Finance and Revenue Model
  {
    group: 'Finance · Ch. 8',
    section: 'Unit Cost',
    href: '/deliverables/ch-08-finance-and-revenue-model/sections/unit-cost'
  },
  {
    group: 'Finance · Ch. 8',
    section: 'Break-Even',
    href: '/deliverables/ch-08-finance-and-revenue-model/sections/break-even'
  },
  {
    group: 'Finance · Ch. 8',
    section: 'Revenue Scenarios',
    href: '/deliverables/ch-08-finance-and-revenue-model/sections/revenue-scenarios'
  },
  {
    group: 'Finance · Ch. 8',
    section: 'Donation Scenarios',
    href: '/deliverables/ch-08-finance-and-revenue-model/sections/donation-scenarios'
  },
  {
    group: 'Finance · Ch. 8',
    section: 'Key Financial KPIs',
    href: '/deliverables/ch-08-finance-and-revenue-model/sections/key-financial-kpis'
  },
  // Ch. 9 — Operations and Continuity Systems
  {
    group: 'Operations · Ch. 9',
    section: 'Inventory',
    href: '/deliverables/ch-09-operations-and-continuity-systems/sections/inventory'
  },
  {
    group: 'Operations · Ch. 9',
    section: 'Day-of SOP',
    href: '/deliverables/ch-09-operations-and-continuity-systems/sections/day-of-sop'
  },
  {
    group: 'Operations · Ch. 9',
    section: 'Baked Goods SOP',
    href: '/deliverables/ch-09-operations-and-continuity-systems/sections/baked-goods-sop'
  },
  {
    group: 'Operations · Ch. 9',
    section: 'Continuity',
    href: '/deliverables/ch-09-operations-and-continuity-systems/sections/continuity'
  }
]
</script>

<template>
  <section class="space-y-2 min-w-0" aria-label="Launch readiness checks">
    <header>
      <h2 class="text-sm font-semibold text-neutral-700">
        Launch readiness checks
      </h2>
      <p class="text-xs text-neutral-500">
        Display-only checklist. Click each section and confirm the
        builder / table / checklist underneath has real values, not
        starter assumptions. The platform doesn't track builder rows
        — your eyes are the source of truth.
      </p>
    </header>

    <ul
      class="grid gap-2 sm:grid-cols-2 lg:grid-cols-2 min-w-0"
    >
      <li
        v-for="check in checks"
        :key="check.href"
        class="rounded border border-sky-200 bg-sky-50/40 p-2 min-w-0"
      >
        <NuxtLink
          :to="check.href"
          class="flex flex-col gap-1 text-xs text-neutral-800 hover:text-phoenix-700"
        >
          <span class="text-[10px] font-semibold uppercase tracking-wide text-sky-800">
            {{ check.group }}
          </span>
          <span class="font-semibold break-words">
            Open {{ check.section }} →
          </span>
          <span
            class="inline-flex w-fit items-center rounded border border-sky-300 bg-white px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900"
          >
            Needs check
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
