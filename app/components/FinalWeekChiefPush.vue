<!--
  FinalWeekChiefPush — display-only chief-facing reminder panel
  shown on /c-suite/project-navigator. Reinforces the four
  push-back rules a chief should hold during the final week.

  POSTURE
  -------
    - Pure presentational. No props. No Firestore reads, no AI
      calls, no derivation.
    - Display-only. Never claims a section is blocked or missing
      data — that work belongs to the existing Dependency Signals
      panel directly above it.
    - The text mirrors the Final Week Completion Mode posture
      (start with P0 · review blocked / overdue first · push
      back on vague work · approve only when useful to the
      Playbook, pop-up, or Phoenix Nest pitch).
-->
<script setup lang="ts">
// No state. The component is a static reminder card.
</script>

<template>
  <section class="space-y-2 min-w-0" aria-label="Final Week Chief Push">
    <header>
      <h2 class="text-sm font-semibold text-neutral-700">
        Final Week Chief Push
      </h2>
      <p class="text-xs text-neutral-500">
        Display-only. Use the Tasks / Deliverables surfaces to act —
        this panel does not change anything.
      </p>
    </header>

    <ul class="grid gap-2 sm:grid-cols-2 min-w-0">
      <li class="rounded border border-rose-200 bg-rose-50/40 p-3 text-xs text-neutral-800">
        <p class="font-semibold text-rose-900">Start with P0.</p>
        <p class="mt-1">
          The Final Week Completion panel on the home dashboard names
          the P0 sections per lane. If a P0 section is still in draft
          inside the final week, it goes to the front of the line.
        </p>
      </li>
      <li class="rounded border border-amber-200 bg-amber-50/40 p-3 text-xs text-neutral-800">
        <p class="font-semibold text-amber-900">Review blocked / overdue first.</p>
        <p class="mt-1">
          The Dependency Signals panel above ranks blocked and
          overdue work ahead of warnings. Clear the blocked items
          before chasing polish on already-passed sections.
        </p>
      </li>
      <li class="rounded border border-sky-200 bg-sky-50/40 p-3 text-xs text-neutral-800">
        <p class="font-semibold text-sky-900">Push back on vague work.</p>
        <p class="mt-1">
          If a draft says "we make money from sales and donations,"
          ask which products and which numbers. Vague drafts are the
          single biggest source of weak Playbook chapters.
        </p>
      </li>
      <li class="rounded border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-neutral-800">
        <p class="font-semibold text-emerald-900">Approve only when useful.</p>
        <p class="mt-1">
          Approve a section when it is good enough for the Playbook,
          the pop-up, or the Phoenix Nest pitch — not when it is
          merely "done." Send back to revision if it would weaken any
          of the three.
        </p>
      </li>
    </ul>
  </section>
</template>
