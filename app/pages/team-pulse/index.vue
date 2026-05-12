<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTeamPulse } from '~/composables/useTeamPulse'
import {
  TEAM_PULSE_CALIBRATION_COPY,
  TEAM_PULSE_SAFETY_COPY
} from '~/utils/teamPulseRubric'

const auth = useAuthStore()
const teamPulse = useTeamPulse()
const { data: cycles, loading } = teamPulse.watchCycles()

const openCycles = computed(() => cycles.value.filter((c) => c.status === 'open'))
const closedCycles = computed(() =>
  cycles.value.filter((c) => c.status === 'closed' || c.status === 'summarized')
)
</script>

<template>
  <section class="space-y-5">
    <header class="space-y-2">
      <p class="text-sm text-neutral-500">Team Pulse</p>
      <h1 class="text-2xl font-semibold">Calibration Check-In</h1>
      <p class="max-w-3xl text-sm leading-relaxed text-neutral-700">
        {{ TEAM_PULSE_CALIBRATION_COPY }}
      </p>
      <p class="max-w-3xl rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        {{ TEAM_PULSE_SAFETY_COPY }}
      </p>
    </header>

    <div v-if="auth.isAdmin" class="card flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold">Instructor/Admin tools</p>
        <p class="text-xs text-neutral-600">
          Create cycles, close cycles, generate summaries, and review raw responses.
        </p>
      </div>
      <NuxtLink to="/team-pulse/admin" class="btn-primary">Open admin</NuxtLink>
    </div>

    <p v-if="loading" class="text-sm text-neutral-500">Loading Team Pulse cycles...</p>

    <template v-else>
      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-900">Open cycles</h2>
        <p v-if="openCycles.length === 0" class="card text-sm text-neutral-600">
          No Team Pulse cycle is open right now.
        </p>
        <article
          v-for="cycle in openCycles"
          :key="cycle.id"
          class="card space-y-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-neutral-900">{{ cycle.title }}</p>
              <p class="text-sm text-neutral-700">{{ cycle.description }}</p>
              <p class="mt-1 text-xs text-neutral-500">
                Departments: {{ cycle.departmentsIncluded.join(', ') || 'all' }}
              </p>
            </div>
            <span class="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
              Open
            </span>
          </div>
          <NuxtLink :to="`/team-pulse/${cycle.id}/take`" class="btn-primary">
            Take pulse
          </NuxtLink>
        </article>
      </section>

      <section class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-900">Closed cycles</h2>
        <p v-if="closedCycles.length === 0" class="card text-sm text-neutral-600">
          Closed Team Pulse summaries will appear here after the instructor closes a cycle.
        </p>
        <article
          v-for="cycle in closedCycles"
          :key="cycle.id"
          class="card flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p class="font-semibold text-neutral-900">{{ cycle.title }}</p>
            <p class="text-xs text-neutral-500">
              Status: {{ cycle.status }} · closes {{ cycle.closesAt || 'not set' }}
            </p>
          </div>
          <NuxtLink :to="`/team-pulse/${cycle.id}/summary`" class="btn-secondary">
            View summary
          </NuxtLink>
        </article>
      </section>
    </template>
  </section>
</template>
