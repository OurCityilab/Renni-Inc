// Shared data-loading helper for the deterministic leadership review
// payload. Mirrors the pattern /playbook/print and /export-center
// already use:
//
//   - watch deliverables + tasks + goals
//   - resolve studio per deliverable (the registry helper is pure)
//   - watch outputs for studio-backed deliverable ids only
//
// The payload builders themselves stay pure; this composable simply
// surfaces the reactive inputs they need.
//
// Posture (do not relax):
//   - read-only watchers; never writes to Firestore
//   - never calls AI
//   - never mutates the input objects exposed to consumers

import { computed } from 'vue'
import { useDeliverables } from '~/composables/useDeliverables'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { useTasks } from '~/composables/useTasks'
import { useGoals } from '~/composables/useGoals'
import { getTemplateStudioForDeliverable } from '~/data/templateStudios'

export function useAiReviewData() {
  const deliverables = useDeliverables()
  const outputs = useDeliverableOutputs()
  const tasks = useTasks()
  const goals = useGoals()

  const { data: allDeliverables, loading: deliverablesLoading } =
    deliverables.watchList()
  const { data: allTasks, loading: tasksLoading } = tasks.watchAll()
  const { data: allGoals, loading: goalsLoading } = goals.watchList()

  const studioBackedIds = computed<string[]>(() =>
    allDeliverables.value
      .filter((d) => Boolean(getTemplateStudioForDeliverable(d)))
      .map((d) => d.id)
  )
  const { data: outputsByDeliverableId, loading: outputsLoading } =
    outputs.watchManyOutputs(studioBackedIds)

  const loading = computed(
    () =>
      deliverablesLoading.value ||
      tasksLoading.value ||
      goalsLoading.value ||
      outputsLoading.value
  )

  return {
    allDeliverables,
    allTasks,
    allGoals,
    outputsByDeliverableId,
    studioResolver: getTemplateStudioForDeliverable,
    loading
  }
}
