<script setup lang="ts">
// Thin wrapper for the new chapter-hub + section-route UX. Renders
// the existing DeliverableOutputWorkspace in section-filter mode so
// the section route reuses every save path, every builder mount,
// every cross-chapter reference panel, and every read-only gate
// without code duplication.
//
// The wrapper exists for two reasons:
//   1. Naming — the section route mounts <DeliverableSectionWorkspace>
//      to express intent ("this is the dedicated section editor"),
//      not <DeliverableOutputWorkspace :section-filter-id=...>.
//   2. Rollback shape — the chapter hub never imports the workspace
//      directly; it only imports preview + cards. If we ever decide
//      to extract section editor logic out of the legacy workspace,
//      this wrapper keeps the section-route call site stable.
//
// No save behavior, gates, or builder mounting changes here. The
// underlying workspace's `sectionFilterId` prop hides chapter-wide
// affordances (orientation, readiness, navigation, Playbook-ready
// preview) while keeping the per-section editor + cross-chapter
// reference panels live.
//
// Independent Student Mode: forwards the workspace's `anyDirty`
// computed via defineExpose so the section route page can install
// its own onBeforeRouteLeave guard for in-app navigation. Browser-
// level beforeunload is still installed inside the workspace.
import { computed, ref } from 'vue'
import type { Deliverable } from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import DeliverableOutputWorkspace from '~/components/DeliverableOutputWorkspace.vue'

defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  sectionId: string
  // Page-level permission check. Mirrors the legacy workspace prop —
  // section-mode editing still respects the same admin / Co-CEO /
  // COO / owner / dept-chief surface, plus the deliverable-status
  // read-only gate handled inside the workspace.
  canEdit: boolean
}>()

// Forward anyDirty up to the page so onBeforeRouteLeave can prompt.
const innerRef = ref<InstanceType<typeof DeliverableOutputWorkspace> | null>(null)
const anyDirty = computed<boolean>(() => {
  const inner = innerRef.value
  if (!inner) return false
  // The workspace exposes a Vue ref. Reading it here gives us the
  // boolean snapshot the route guard needs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (inner as any).anyDirty
  return typeof v === 'boolean' ? v : Boolean(v?.value)
})
defineExpose({ anyDirty })
</script>

<template>
  <DeliverableOutputWorkspace
    ref="innerRef"
    :deliverable="deliverable"
    :studio="studio"
    :can-edit="canEdit"
    :section-filter-id="sectionId"
  />
</template>
