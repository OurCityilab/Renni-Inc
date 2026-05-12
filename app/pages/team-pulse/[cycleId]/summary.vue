<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useTeamPulse } from '~/composables/useTeamPulse'
import type { TeamPulseSummary } from '~/types/models'
import {
  TEAM_PULSE_DIMENSIONS,
  TEAM_PULSE_LEADERSHIP_DIMENSIONS
} from '~/utils/teamPulseRubric'

const route = useRoute()
const cycleId = computed(() => String(route.params.cycleId))
const auth = useAuthStore()
const teamPulse = useTeamPulse()
const { data: cycle } = teamPulse.watchCycle(cycleId)
const summaryCycleId = computed(() =>
  cycle.value?.status === 'closed' || cycle.value?.status === 'summarized'
    ? cycleId.value
    : ''
)
const { data: mySummary } = teamPulse.watchMySummary(summaryCycleId)
const canSeeCompany = computed(() =>
  auth.isAdmin || auth.isCoCEO || auth.profile?.role === 'coo'
)
const canSeeDepartment = computed(() =>
  auth.isAdmin || auth.isCoCEO || auth.profile?.role === 'coo' || auth.isChief
)
const { data: deptSummaries } = teamPulse.watchDepartmentSummaries(
  computed(() => (canSeeDepartment.value ? cycleId.value : '')),
  computed(() => auth.profile?.department ?? 'admin')
)
const { data: companySummary } = teamPulse.watchCompanySummary(
  computed(() => (canSeeCompany.value ? cycleId.value : ''))
)
const { data: adminSummaries } = teamPulse.watchAdminSummaries(
  computed(() => (auth.isAdmin ? cycleId.value : ''))
)

const visibleSummaries = computed<TeamPulseSummary[]>(() => {
  if (auth.isAdmin) return adminSummaries.value
  const rows: TeamPulseSummary[] = []
  if (canSeeCompany.value && companySummary.value) rows.push(companySummary.value)
  if (canSeeDepartment.value) rows.push(...deptSummaries.value)
  if (mySummary.value) rows.push(mySummary.value)
  return rows
})

function averageLabel(value: number | undefined) {
  return typeof value === 'number' ? value.toFixed(1) : 'Not enough data'
}

function titleFor(summary: TeamPulseSummary) {
  if (summary.scope === 'company') return 'Company summary'
  if (summary.scope === 'department') return `${summary.subjectDepartment} department summary`
  return 'Your summary'
}
</script>

<template>
  <section class="space-y-5">
    <header class="space-y-2">
      <NuxtLink to="/team-pulse" class="text-sm text-phoenix-700 hover:underline">
        Back to Team Pulse
      </NuxtLink>
      <p class="text-sm text-neutral-500">Team Pulse</p>
      <h1 class="text-2xl font-semibold">{{ cycle?.title || 'Summary' }}</h1>
      <p class="max-w-3xl text-sm text-neutral-700">
        Privacy-safe calibration summaries. Students see aggregate feedback only.
        Chiefs see department summaries, not a raw named peer rating matrix.
      </p>
    </header>

    <p v-if="visibleSummaries.length === 0" class="card text-sm text-neutral-600">
      No summary is available for your role yet. The instructor may need to close
      the cycle and generate summaries first.
    </p>

    <article
      v-for="summary in visibleSummaries"
      :key="summary.id"
      class="card space-y-4"
    >
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-semibold text-neutral-900">{{ titleFor(summary) }}</h2>
          <p class="text-xs text-neutral-500">
            {{ summary.responseCount }} response{{ summary.responseCount === 1 ? '' : 's' }}
            <span v-if="summary.peerResponseCount != null">
              · {{ summary.peerResponseCount }} rateable peer/direct-work response{{ summary.peerResponseCount === 1 ? '' : 's' }}
            </span>
          </p>
        </div>
        <span class="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600">
          {{ summary.scope }}
        </span>
      </header>

      <p class="rounded border border-phoenix-200 bg-phoenix-50/40 p-3 text-sm text-neutral-800">
        {{ summary.coachingSummary }}
      </p>

      <section
        v-if="summary.scope === 'student'"
        class="grid gap-3 md:grid-cols-2"
      >
        <div class="rounded border border-neutral-200 p-3">
          <h3 class="text-sm font-semibold">Self reflection</h3>
          <p
            v-for="dim in TEAM_PULSE_DIMENSIONS"
            :key="`self-${dim.key}`"
            class="mt-2 text-xs text-neutral-700"
          >
            {{ dim.label }}: {{ averageLabel(summary.selfAverages?.[dim.key]) }}
          </p>
        </div>
        <div class="rounded border border-neutral-200 p-3">
          <h3 class="text-sm font-semibold">Aggregated peer feedback</h3>
          <p v-if="(summary.peerResponseCount ?? 0) < 2" class="mt-2 text-xs text-neutral-600">
            Not enough responses yet. Peer feedback appears after at least 2 rateable responses.
          </p>
          <template v-else>
            <p
              v-for="dim in TEAM_PULSE_DIMENSIONS"
              :key="`peer-${dim.key}`"
              class="mt-2 text-xs text-neutral-700"
            >
              {{ dim.label }}: {{ averageLabel(summary.peerAverages?.[dim.key]) }}
            </p>
          </template>
        </div>
      </section>

      <section v-else class="grid gap-3 md:grid-cols-2">
        <div class="rounded border border-neutral-200 p-3">
          <h3 class="text-sm font-semibold">Teamwork dimensions</h3>
          <p
            v-for="dim in TEAM_PULSE_DIMENSIONS"
            :key="`avg-${summary.id}-${dim.key}`"
            class="mt-2 text-xs text-neutral-700"
          >
            {{ dim.label }}: {{ averageLabel(summary.averages[dim.key]) }}
          </p>
        </div>
        <div class="rounded border border-neutral-200 p-3">
          <h3 class="text-sm font-semibold">Leadership dimensions</h3>
          <p
            v-for="dim in TEAM_PULSE_LEADERSHIP_DIMENSIONS"
            :key="`lead-${summary.id}-${dim.key}`"
            class="mt-2 text-xs text-neutral-700"
          >
            {{ dim.label }}: {{ averageLabel(summary.leaderAverages?.[dim.key]) }}
          </p>
        </div>
      </section>

      <section class="rounded border border-neutral-200 p-3">
        <h3 class="text-sm font-semibold">Direct-work confidence</h3>
        <p class="mt-2 text-xs text-neutral-700">
          None: {{ summary.directWorkBreakdown.none }} · Little:
          {{ summary.directWorkBreakdown.little }} · Some:
          {{ summary.directWorkBreakdown.some }} · A lot:
          {{ summary.directWorkBreakdown.a_lot }}
        </p>
      </section>

      <section v-if="summary.flags.length" class="space-y-2">
        <h3 class="text-sm font-semibold">Calibration flags</h3>
        <p class="text-xs text-neutral-500">
          Flags require human review. They are coaching signals only.
        </p>
        <ul class="space-y-2">
          <li
            v-for="(flag, i) in summary.flags"
            :key="`${summary.id}-flag-${i}`"
            class="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
          >
            {{ flag.reviewCopy }}
          </li>
        </ul>
      </section>
    </article>
  </section>
</template>
