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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { getTemplateStudio } from '~/data/templateStudios'
import DeliverableSectionWorkspace from '~/components/DeliverableSectionWorkspace.vue'

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

// Reset scroll on section change so deep-linked navigation lands the
// student at the top of the section workspace, not at the bottom of
// the previous one.
watch(sectionId, () => {
  if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
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
      <!-- Compact sticky header: chapter context + breadcrumb back -->
      <header class="card space-y-1">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          {{ studio.title }}
          <span v-if="sectionIndex"> · Section {{ sectionIndex }} of {{ studio.sections.length }}</span>
        </p>
        <h1 class="text-lg font-semibold text-neutral-900">
          {{ validSection.title }}
        </h1>
        <p class="text-sm text-neutral-600">
          Focused section workspace. Save returns you to the chapter overview
          to see how progress and the Playbook preview update.
        </p>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <NuxtLink
            :to="`/deliverables/${deliverable.id}`"
            class="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
          >← Chapter overview</NuxtLink>
        </div>
      </header>

      <DeliverableSectionWorkspace
        :deliverable="deliverable"
        :studio="studio"
        :section-id="validSection.id"
        :can-edit="canEdit"
      />
    </template>
  </main>
</template>
