<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useStudioMission } from '~/composables/useStudioMission'
import type { MissionProgressStatus, StudentMissionProgress, StudioModule } from '~/types/studio/models'
import {
  missionStatusChipClass,
  missionStatusLabels,
  portfolioArtifactTypeLabels,
  studioModuleLabels
} from '~/utils/studioLabels'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
// studio.global.ts only renders this page once studioAuth.status is
// 'ready', so profile is guaranteed populated here.
const studentUid = studioAuth.profile?.uid ?? ''

const missionApi = useStudioMission()
const missions = missionApi.watchActiveMissions()
const progress = missionApi.watchProgress(studentUid)
const submitting = ref(false)
const actionError = ref<string | null>(null)

const progressByMissionId = computed(() => {
  const map = new Map<string, StudentMissionProgress>()
  for (const p of progress.data.value) map.set(p.missionId, p)
  return map
})

// The "current" mission is the first active mission (in seeded order)
// that this student hasn't completed yet — Today only ever surfaces
// one thing to do next.
const currentMission = computed(() => {
  for (const m of missions.data.value) {
    const p = progressByMissionId.value.get(m.id)
    if (!p || p.status !== 'complete') return m
  }
  return null
})

const currentProgress = computed(() =>
  currentMission.value ? (progressByMissionId.value.get(currentMission.value.id) ?? null) : null
)

const currentStatus = computed<MissionProgressStatus>(
  () => currentProgress.value?.status ?? 'not_started'
)

// Missions whose module has a live Lab tool deep-link straight into
// it — "Start" should drop the student inside the tool, not just
// flip a status chip.
const labToolRoutes: Partial<Record<StudioModule, string>> = {
  'brand-builder': '/studio/lab/brand-builder'
}
const currentToolRoute = computed(() =>
  currentMission.value ? (labToolRoutes[currentMission.value.module] ?? null) : null
)

const allCaughtUp = computed(
  () => !missions.loading.value && !progress.loading.value && missions.data.value.length > 0 && !currentMission.value
)

async function startMission() {
  if (!currentMission.value || submitting.value) return
  submitting.value = true
  actionError.value = null
  const toolRoute = currentToolRoute.value
  try {
    await missionApi.setMissionStatus(
      currentProgress.value,
      studentUid,
      currentMission.value.id,
      'in_progress'
    )
  } catch {
    actionError.value = "Couldn't start the mission. Check your connection and try again."
    return
  } finally {
    submitting.value = false
  }
  if (toolRoute) await navigateTo(toolRoute)
}

async function completeMission() {
  if (!currentMission.value || submitting.value) return
  submitting.value = true
  actionError.value = null
  try {
    await missionApi.setMissionStatus(
      currentProgress.value,
      studentUid,
      currentMission.value.id,
      'complete'
    )
  } catch {
    actionError.value = "Couldn't mark the mission complete. Check your connection and try again."
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">Today</h1>

    <div v-if="missions.loading.value || progress.loading.value" class="card text-sm text-neutral-500">
      Loading today's mission…
    </div>

    <div v-else-if="!missions.data.value.length" class="card text-sm text-neutral-600">
      No missions are available yet. Check back soon.
    </div>

    <div v-else-if="allCaughtUp" class="card text-center">
      <p class="text-sm font-medium text-neutral-800">You're all caught up 🎉</p>
      <p class="mt-1 text-sm text-neutral-600">
        You've completed every mission available right now. Check back soon for more.
      </p>
    </div>

    <div v-else-if="currentMission" class="card space-y-3">
      <div class="flex items-start justify-between gap-3">
        <span class="chip bg-studio-100 text-studio-800">{{ studioModuleLabels[currentMission.module] }}</span>
        <span :class="missionStatusChipClass[currentStatus]">{{ missionStatusLabels[currentStatus] }}</span>
      </div>

      <div>
        <h2 class="text-base font-semibold">{{ currentMission.title }}</h2>
        <p class="mt-1 text-sm text-neutral-700">{{ currentMission.description }}</p>
      </div>

      <dl class="grid grid-cols-2 gap-3 text-xs text-neutral-600">
        <div>
          <dt class="font-medium text-neutral-500">Time</dt>
          <dd>~{{ currentMission.estimatedMinutes }} min</dd>
        </div>
        <div>
          <dt class="font-medium text-neutral-500">You'll produce</dt>
          <dd>{{ portfolioArtifactTypeLabels[currentMission.requiredOutputType] }}</dd>
        </div>
        <div v-if="currentMission.dueDate">
          <dt class="font-medium text-neutral-500">Due</dt>
          <dd>{{ currentMission.dueDate }}</dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-2 pt-1">
        <button
          v-if="currentStatus === 'not_started'"
          class="btn-primary"
          :disabled="submitting"
          @click="startMission"
        >
          {{ currentToolRoute ? `Start: ${studioModuleLabels[currentMission.module]}` : 'Start mission' }}
        </button>
        <template v-else-if="currentStatus === 'in_progress' || currentStatus === 'needs_revision'">
          <NuxtLink v-if="currentToolRoute" :to="currentToolRoute" class="btn-primary">
            Open {{ studioModuleLabels[currentMission.module] }}
          </NuxtLink>
          <button
            :class="currentToolRoute ? 'btn-secondary' : 'btn-primary'"
            :disabled="submitting"
            @click="completeMission"
          >
            Mark complete
          </button>
        </template>
      </div>
      <p v-if="actionError" class="text-sm text-rose-700">{{ actionError }}</p>
    </div>
  </div>
</template>
