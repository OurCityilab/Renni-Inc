<script setup lang="ts">
// /c-suite-advisor — leadership cockpit for the deterministic
// C-Suite Advisor. Reads existing collections only:
//   - deliverables (via useDeliverables.watchList)
//   - tasks (via useTasks.watchAll)
//   - deliverableOutputs (via useDeliverableOutputs.watchManyOutputs)
// Every signal is derived from generateAdvisorSignals(); no Firestore
// writes, no AI, no autosave, no tasks created here.
//
// Gated to chiefs / Co-CEOs / instructor by the existing c-suite
// middleware (mirrors /c-suite). Plain members shouldn't see the
// cockpit; the chapter card already serves them.

import { computed } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { getTemplateStudio } from '~/data/templateStudios'
import CSuiteAdvisorHub from '~/components/CSuiteAdvisorHub.vue'
import IntelligenceSyncPanel from '~/components/IntelligenceSyncPanel.vue'

definePageMeta({ middleware: ['c-suite'] })

const deliverables = useDeliverables()
const tasks = useTasks()
const outputs = useDeliverableOutputs()

const { data: deliverableList, loading: deliverablesLoading } =
  deliverables.watchList()
const { data: taskList, loading: tasksLoading } = tasks.watchAll()

// Only request output docs for studio-backed deliverables. Non-studio
// deliverables don't yield advisor signals, so their outputs are
// irrelevant to the cockpit and skipping them keeps the listener
// count down.
const studioBackedIds = computed<string[]>(() =>
  deliverableList.value
    .filter((d) => Boolean(getTemplateStudio(d.id)))
    .map((d) => d.id)
)
const { data: outputsByDeliverableId, loading: outputsLoading } =
  outputs.watchManyOutputs(studioBackedIds)

const loading = computed<boolean>(
  () =>
    deliverablesLoading.value ||
    tasksLoading.value ||
    outputsLoading.value
)
</script>

<template>
  <main class="container mx-auto max-w-6xl space-y-4 px-3 py-4">
    <NuxtLink to="/" class="text-sm text-phoenix-700 hover:underline">
      ← Home
    </NuxtLink>

    <IntelligenceSyncPanel
      :deliverables="deliverableList"
      :tasks="taskList"
      :outputs="outputsByDeliverableId"
      :loading="loading"
    />

    <CSuiteAdvisorHub
      :deliverables="deliverableList"
      :tasks="taskList"
      :outputs="outputsByDeliverableId"
      :loading="loading"
    />
  </main>
</template>
