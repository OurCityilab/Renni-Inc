<!--
  LaneCoverageBoard — per-lane roll-up of task coverage. Shows total
  required sections, missing coverage, blocked / overdue /
  in-progress / ready / done counts, and a "top next section" link
  per lane.

  POSTURE
  -------
    - Pure presentational. No Firestore writes, no AI calls, no
      mutation. Drives off TaskCoverageSummary.byLane.
-->
<script setup lang="ts">
import type { TaskCoverageSummary, TaskCoverageNode } from '~/utils/taskCoverageMap'

const props = defineProps<{
  summary: TaskCoverageSummary
  nodes: readonly TaskCoverageNode[]
}>()

const nodeById = new Map(props.nodes.map((n) => [n.id, n]))
function topNextSectionRoute(sectionId: string): string | null {
  const n = nodeById.get(sectionId)
  return n ? n.route : null
}
function topNextSectionTitle(sectionId: string): string | null {
  const n = nodeById.get(sectionId)
  return n ? n.sectionTitle : null
}
</script>

<template>
  <section class="space-y-2 min-w-0" aria-label="Lane Coverage Board">
    <header>
      <h2 class="text-sm font-semibold text-neutral-700">
        Lane Coverage — by team
      </h2>
      <p class="text-xs text-neutral-500">
        Display-only. Per-lane roll-up of task coverage and live
        status counts. Sourced from the Final Week lane map.
      </p>
    </header>

    <ul class="grid gap-2 md:grid-cols-2 min-w-0">
      <li
        v-for="lane in summary.byLane"
        :key="lane.lane"
        class="rounded border border-neutral-200 bg-white p-3 min-w-0"
      >
        <header class="flex flex-wrap items-baseline justify-between gap-2 min-w-0">
          <p class="text-sm font-semibold text-neutral-900 break-words">
            {{ lane.laneTitle }}
          </p>
          <span class="text-[10px] uppercase tracking-wide text-neutral-500">
            {{ lane.withTask }} / {{ lane.total }} covered
          </span>
        </header>

        <dl class="mt-1 space-y-0.5 text-[11px] text-neutral-700">
          <div>
            <dt class="inline font-semibold text-neutral-800">Missing coverage:</dt>
            {{ ' ' + lane.missing }}
          </div>
          <div>
            <dt class="inline font-semibold text-neutral-800">Blocked:</dt>
            {{ ' ' + lane.blocked }}
            <span class="text-neutral-500"> · </span>
            <dt class="inline font-semibold text-neutral-800">Overdue:</dt>
            {{ ' ' + lane.overdue }}
          </div>
          <div>
            <dt class="inline font-semibold text-neutral-800">In progress:</dt>
            {{ ' ' + lane.inProgress }}
            <span class="text-neutral-500"> · </span>
            <dt class="inline font-semibold text-neutral-800">Done:</dt>
            {{ ' ' + lane.done }}
          </div>
        </dl>

        <NuxtLink
          v-if="lane.topNextSectionId && topNextSectionRoute(lane.topNextSectionId)"
          :to="topNextSectionRoute(lane.topNextSectionId)!"
          class="mt-2 inline-flex rounded border border-sky-300 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100 break-words"
        >
          Open next: {{ topNextSectionTitle(lane.topNextSectionId) }} →
        </NuxtLink>
        <p
          v-else
          class="mt-2 text-[11px] italic text-emerald-800"
        >
          No P0 / blocked / overdue items in this lane right now.
        </p>
      </li>
    </ul>
  </section>
</template>
