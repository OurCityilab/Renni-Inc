<script setup lang="ts">
// Dedicated section workspace route. Renders ONE section of a
// deliverable's Template Studio in isolation so students can focus
// on a single section without the full chapter view's surface area.
//
// Mounts DeliverableSectionWorkspace, which is a thin wrapper around
// the legacy DeliverableOutputWorkspace running in section-filter
// mode. Save paths, builder mounts, AI critique gates, and read-only
// behavior are all unchanged — the wrapper only hides the chapter-
// wide orientation, readiness, navigation, and Playbook-preview
// surfaces. Cross-chapter reference panels remain visible because
// they provide useful upstream context while editing.
//
// Permission semantics mirror the chapter page:
//   - read access is open to any signed-in user (consistent with the
//     deliverableOutputs Firestore rule)
//   - canEdit folds in admin / Co-CEO / COO / owner / department-
//     chief access, layered with status (draft / needs_revision)
//     inside the workspace itself
import { computed, ref, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { getTemplateStudio } from '~/data/templateStudios'
import DeliverableSectionWorkspace from '~/components/DeliverableSectionWorkspace.vue'
import TaskCreateForm from '~/components/TaskCreateForm.vue'
import { effectiveWhyThisMatters } from '~/utils/sectionGuidance'
import { canAssignSectionTasks } from '~/utils/permissions'

const route = useRoute()
const auth = useAuthStore()
const deliverables = useDeliverables()

const deliverableId = computed(() => String(route.params.id))
const sectionId = computed(() => String(route.params.sectionId))

const { data: deliverable, loading } = deliverables.watchOne(deliverableId)
const studio = computed(() =>
  deliverable.value ? getTemplateStudio(deliverable.value.id) : null
)

const validSection = computed(() => {
  if (!studio.value) return null
  return studio.value.sections.find((s) => s.id === sectionId.value) ?? null
})

// Drafting access — V2. Mirrors the deliverableOutputs Firestore
// rule: any rostered class member can collaboratively draft when the
// deliverable is in an editable state (status check is enforced by
// DeliverableOutputWorkspace + the rule's deliverableOutputEditable
// helper). Approval / due-date / admin rights stay where they were.
const canEdit = computed(() => {
  return Boolean(deliverable.value) && Boolean(auth.profile)
})

const sectionIndex = computed(() => {
  if (!studio.value || !validSection.value) return null
  const idx = studio.value.sections.findIndex(
    (s) => s.id === validSection.value!.id
  )
  return idx >= 0 ? idx + 1 : null
})

// Section Task Assignment sprint: gate the "Assign section as
// task" affordance behind the centralized permission helper. The
// helper derives chief status from the CURRENT role so a former
// chief whose role was just changed cannot reach this control.
// TaskCreateForm performs its own permission check too, so even
// if a stale UI somehow shows the button, the form will refuse.
const canAssignSection = computed<boolean>(() =>
  canAssignSectionTasks(auth.profile)
)

// Toggle for the inline TaskCreateForm panel.
const assigningOpen = ref(false)

// Build a default definition-of-done string from the section's
// completion criteria when authored. Falls back to a generic
// "Complete the section" instruction. The chief is free to edit
// before saving — TaskCreateForm exposes the field as a textarea.
const sectionDefinitionOfDone = computed<string>(() => {
  const sec = validSection.value
  if (!sec) return ''
  const criteria = sec.completionCriteria ?? []
  if (criteria.length === 0) {
    return `Save Final Playbook text for "${sec.title}" with at least the required inputs filled.`
  }
  return criteria.map((c) => `- ${c}`).join('\n')
})

const sectionAssignTitle = computed<string>(() => {
  const sec = validSection.value
  if (!sec) return ''
  return `Complete: ${sec.title}`
})

// Guidance Compression Sprint: section-specific why-this-matters.
// Prefers section.whyThisMatters → derived from section.lesson →
// chapter-level studio.whyItMatters as last resort. Pure helper from
// utils/sectionGuidance.ts; keeps the sticky header tight (1–2
// sentences) instead of repeating the chapter-level paragraph on
// every section.
const whyForSection = computed<string>(() => {
  if (!studio.value || !validSection.value) return ''
  return effectiveWhyThisMatters(validSection.value, studio.value)
})

// Reset scroll on section change so deep-linked navigation lands the
// student at the top of the section workspace, not at the bottom of
// the previous one.
watch(sectionId, () => {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
})

// --- Independent Student Mode: in-app route-leave guard -------------
// The workspace itself sets up `beforeunload` to catch tab close /
// reload. In-app navigation (clicking a NuxtLink, the back button,
// or the section nav) doesn't fire `beforeunload`, so we install a
// router guard here that reads the same `anyDirty` flag forwarded
// up from DeliverableSectionWorkspace via defineExpose. Plain
// `window.confirm` keeps this dependency-free; the message wording
// matches the inline banner the workspace renders.
const workspaceRef = ref<InstanceType<typeof DeliverableSectionWorkspace> | null>(null)
onBeforeRouteLeave(() => {
  const inner = workspaceRef.value
  if (!inner) return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dirty = Boolean((inner as any).anyDirty)
  if (!dirty) return true
  if (typeof window === 'undefined') return true
  return window.confirm(
    'You have unsaved changes. Save before leaving the page?\n\n' +
      'OK = leave anyway · Cancel = stay and save first'
  )
})
</script>

<template>
  <main class="container mx-auto max-w-5xl space-y-4 px-3 py-4">
    <p v-if="loading" class="text-sm text-neutral-500">Loading section…</p>

    <!-- Auth fallback. Most app routes are gated by middleware, but
         a direct deep link should still degrade gracefully if the
         session has expired. -->
    <p v-else-if="!auth.user" class="text-sm text-rose-700">
      Sign in to open this section.
    </p>

    <!-- Deliverable not found / not accessible. -->
    <p v-else-if="!deliverable" class="text-sm text-rose-700">
      This deliverable is not available.
      <NuxtLink
        to="/deliverables"
        class="ml-1 text-phoenix-700 hover:underline"
      >Return to deliverables.</NuxtLink>
    </p>

    <!-- Studio missing — section workspace is studio-backed only. -->
    <p
      v-else-if="!studio"
      class="text-sm text-neutral-700"
    >
      This deliverable does not have a section-by-section studio.
      <NuxtLink
        :to="`/deliverables/${deliverable.id}`"
        class="ml-1 text-phoenix-700 hover:underline"
      >Return to the chapter overview.</NuxtLink>
    </p>

    <!-- Invalid sectionId — show valid sections + back link, do not
         provision an output doc for an invalid id. -->
    <section
      v-else-if="!validSection"
      class="card space-y-3"
    >
      <header class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Section not available
        </p>
        <h1 class="text-lg font-semibold text-neutral-900">
          That section is not part of this chapter
        </h1>
        <p class="text-sm text-neutral-700">
          This section is not available for this chapter. Return to the
          chapter overview and choose a listed section.
        </p>
      </header>
      <div class="space-y-2">
        <p class="text-xs font-medium text-neutral-600">
          Sections in this chapter:
        </p>
        <ol class="list-decimal space-y-0.5 pl-5 text-sm text-neutral-800">
          <li v-for="s in studio.sections" :key="s.id">
            <NuxtLink
              :to="`/deliverables/${deliverable.id}/sections/${s.id}`"
              class="text-phoenix-700 hover:underline"
            >{{ s.title }}</NuxtLink>
          </li>
        </ol>
      </div>
      <NuxtLink
        :to="`/deliverables/${deliverable.id}`"
        class="text-sm text-phoenix-700 hover:underline"
      >← Back to chapter overview</NuxtLink>
    </section>

    <!-- Valid section — render the focused workspace. -->
    <template v-else>
      <!-- Compact sticky header: chapter context + breadcrumb back +
           why-this-matters connection.
           Guidance Compression Sprint: the why-this-matters callout
           is now section-specific. effectiveWhyThisMatters prefers
           section.whyThisMatters → derives from section.lesson →
           falls back to studio.whyItMatters only when neither
           section-level field is meaningful. The "Build this section
           in three steps…" framing was removed because the workspace
           below already labels Think / Draft / Defend on its own
           accordions; repeating it here pushed the writing surface
           below the fold. -->
      <header class="card space-y-1">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          {{ studio.title }}
          <span v-if="sectionIndex"> · Section {{ sectionIndex }} of {{ studio.sections.length }}</span>
        </p>
        <h1 class="text-lg font-semibold text-neutral-900">
          {{ validSection.title }}
        </h1>
        <p
          v-if="whyForSection"
          class="rounded-md border border-phoenix-200 bg-phoenix-50/40 p-2 text-xs text-phoenix-900"
        >
          <span class="font-semibold uppercase tracking-wide text-phoenix-700">Why this matters:</span>
          {{ whyForSection }}
        </p>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <NuxtLink
            :to="`/deliverables/${deliverable.id}`"
            class="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
          >← Chapter overview</NuxtLink>
          <!-- Section Task Assignment sprint: chiefs / Co-CEOs /
               admins can spawn a task tied to this exact section.
               Hidden for regular members so the section workspace
               UX stays clean. The TaskCreateForm itself re-checks
               authorization, so a stale UI cannot mint tasks. -->
          <button
            v-if="canAssignSection"
            type="button"
            class="rounded border border-phoenix-300 bg-phoenix-50 px-2 py-0.5 font-medium text-phoenix-800 hover:bg-phoenix-100"
            @click="assigningOpen = !assigningOpen"
          >{{ assigningOpen ? 'Close assign panel' : '+ Assign section as task' }}</button>
        </div>
      </header>

      <!-- Section Task Assignment sprint: review form. Nothing is
           created until the chief clicks Save inside the form. All
           prefilled fields are editable. The form locks the
           deliverable picker so the task stays bound to this
           chapter. -->
      <section v-if="canAssignSection && assigningOpen" class="space-y-2">
        <TaskCreateForm
          :preset-title="sectionAssignTitle"
          :preset-deliverable-id="deliverable.id"
          :preset-playbook-chapter="deliverable.chapter"
          :preset-department="deliverable.department"
          :preset-definition-of-done="sectionDefinitionOfDone"
          lock-deliverable
          title="Assign this section as a task"
          @created="assigningOpen = false"
          @cancel="assigningOpen = false"
        />
        <p class="text-[11px] italic text-neutral-500">
          Creates a task linked to the deliverable. The new task appears on Tasks,
          Timeline, and the chapter overview. Edit any field above before saving.
        </p>
      </section>

      <DeliverableSectionWorkspace
        ref="workspaceRef"
        :deliverable="deliverable"
        :studio="studio"
        :section-id="validSection.id"
        :can-edit="canEdit"
      />
    </template>
  </main>
</template>
