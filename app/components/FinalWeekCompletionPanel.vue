<!--
  FinalWeekCompletionPanel — declarative P0 / P1 / P2 lane map for
  the launch-week home dashboard. Helps a checked-out senior find
  what to finish in under 10 seconds.

  POSTURE
  -------
    - Pure presentational. Reads FINAL_WEEK_LANES from
      app/utils/finalWeekCompletion.ts and renders a lane / section
      grid with optional task-template detail under each section.
    - No Firestore writes, no AI calls, no task creation, no status
      mutation, no auto-Working-Draft writes.
    - Section CTAs deeplink to the existing
      /deliverables/<id>/sections/<sectionId> route. Working Draft
      is reached via the existing recipe panel inside the section
      page, never from this panel.
    - Visible to every audience. Members use it as a deterministic
      floor; chiefs and Co-CEOs use it to direct teams.
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  FINAL_WEEK_LANES,
  PRIORITY_RANK,
  sectionLink,
  validateFinalWeekMap,
  type FinalWeekLane,
  type FinalWeekSectionEntry
} from '~/utils/finalWeekCompletion'
import { getTaskTemplateForEntry } from '~/utils/finalWeekTaskTemplates'

// Cheap drift check on mount. Flagged in the console only — never
// blocks render. Catches the case where a studio renames a section
// id but the lane map still references the old one.
onMounted(() => {
  const issues = validateFinalWeekMap()
  if (issues.length > 0 && typeof console !== 'undefined') {
    console.warn(
      '[FinalWeekCompletionPanel] lane map drift detected:',
      issues
    )
  }
})

// Active lane filter chip. `null` = show every lane.
const activeLaneId = ref<string | null>(null)

const visibleLanes = computed<FinalWeekLane[]>(() => {
  if (!activeLaneId.value) return [...FINAL_WEEK_LANES]
  return FINAL_WEEK_LANES.filter((l) => l.id === activeLaneId.value)
})

function priorityChipClass(
  priority: FinalWeekSectionEntry['priority']
): string {
  switch (priority) {
    case 'P0':
      return 'border-rose-300 bg-rose-50 text-rose-900'
    case 'P1':
      return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'P2':
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}

function sortByPriority(
  sections: readonly FinalWeekSectionEntry[]
): FinalWeekSectionEntry[] {
  return [...sections].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  )
}
</script>

<template>
  <section class="space-y-3 min-w-0" aria-label="Final Week Completion Mode">
    <header class="space-y-1">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-rose-800">
        Final Week: Finish the work that matters first
      </h2>
      <p class="text-xs text-neutral-700">
        Start with your lane. Finish the required sections first. Use
        the builder, table, checklist, or prompt. Copy the strongest
        parts into Working Draft, add evidence for major claims, then
        save.
      </p>
    </header>

    <!-- Minimum viable answer rule. Visible above the lane filter
         so a stuck student sees it before they start scrolling. -->
    <aside
      class="rounded border border-rose-200 bg-rose-50/60 p-3 text-xs"
      aria-label="Minimum viable answer rule"
    >
      <p class="font-semibold text-rose-900">
        Stuck? Write the minimum viable answer.
      </p>
      <p class="mt-1 text-neutral-800">
        3 clear sentences · 1 source or assumption · 1 risk · 1 next
        step. That clears the bar. You can polish later.
      </p>
    </aside>

    <!-- Lane filter chips. "All lanes" + one chip per lane. The
         chip set is small enough to fit on phone width. -->
    <div class="flex flex-wrap items-center gap-1.5 text-xs">
      <button
        type="button"
        class="rounded border px-2 py-1 transition-colors"
        :class="
          activeLaneId === null
            ? 'border-rose-500 bg-rose-50 text-rose-900'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
        "
        @click="activeLaneId = null"
      >
        All lanes
      </button>
      <button
        v-for="lane in FINAL_WEEK_LANES"
        :key="lane.id"
        type="button"
        class="rounded border px-2 py-1 transition-colors"
        :class="
          activeLaneId === lane.id
            ? 'border-rose-500 bg-rose-50 text-rose-900'
            : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
        "
        @click="activeLaneId = lane.id"
      >
        {{ lane.title }}
      </button>
    </div>

    <!-- Lane sections -->
    <article
      v-for="lane in visibleLanes"
      :key="lane.id"
      class="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 min-w-0"
    >
      <header class="space-y-0.5">
        <h3 class="text-sm font-semibold text-neutral-900">
          {{ lane.title }}
        </h3>
        <p class="text-xs text-neutral-600">{{ lane.ownerSummary }}</p>
      </header>

      <ul class="grid gap-2 md:grid-cols-2 min-w-0">
        <li
          v-for="entry in sortByPriority(lane.sections)"
          :key="entry.id"
          class="rounded border border-neutral-200 bg-neutral-50/40 p-3 min-w-0"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
            <p class="text-sm font-semibold text-neutral-900 break-words">
              {{ entry.title }}
            </p>
            <span
              class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="priorityChipClass(entry.priority)"
            >
              {{ entry.priority }}
            </span>
          </header>

          <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">What you are making:</dt>
              {{ ' ' + entry.artifact }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Start here:</dt>
              {{ ' ' + entry.firstAction }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Done when:</dt>
              {{ ' ' + entry.doneWhen }}
            </div>
            <div class="break-words">
              <dt class="inline font-semibold text-neutral-800">Owner:</dt>
              {{ ' ' + entry.owner }}
              <span class="text-neutral-500"> · </span>
              <dt class="inline font-semibold text-neutral-800">Reviewer:</dt>
              {{ ' ' + entry.reviewer }}
            </div>
            <div v-if="entry.dependency" class="break-words text-[11px] italic text-neutral-600">
              <dt class="inline">Depends on:</dt>
              {{ ' ' + entry.dependency }}
            </div>
            <div class="text-[11px] italic text-neutral-500">
              {{ entry.dueLabel }}
            </div>
          </dl>

          <!-- Display-only task template hint, when one exists. -->
          <details
            v-if="getTaskTemplateForEntry(entry.id)"
            class="mt-2 rounded border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700"
          >
            <summary class="cursor-pointer font-semibold text-neutral-800">
              Recommended task title
            </summary>
            <p class="mt-1 break-words">
              {{ getTaskTemplateForEntry(entry.id)?.title }}
            </p>
            <p class="mt-1 italic text-neutral-500">
              Display-only suggestion. The platform never auto-creates
              tasks. A chief can paste this into the existing Tasks
              form when they want to.
            </p>
          </details>

          <NuxtLink
            :to="sectionLink(entry)"
            class="mt-2 inline-flex rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-900 hover:bg-rose-100 break-words"
          >
            Open the section →
          </NuxtLink>
        </li>
      </ul>
    </article>

    <p class="text-[11px] italic text-neutral-500">
      This panel never creates tasks, changes status, submits, or
      approves anything. The student opens the section, writes the
      work, and saves with the existing Save button.
    </p>
  </section>
</template>
