<script setup lang="ts">
// /c-suite/review — Company-level deterministic leadership review.
//
// Renders the AiReviewReportPayload produced by
// buildCompanyReviewPayload. Pure read-only display:
//   - no Firestore writes
//   - no AI calls
//   - no approval / readiness / submit-gate mutation
//   - no personal-character language
//
// Visibility: Instructor/Admin, Co-CEOs, COO. The /c-suite middleware
// already gates chief-or-admin; we apply a stricter local check on
// top so a department chief landing here is sent to their own
// department review instead.

import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAiReviewData } from '~/composables/useAiReviewData'
import { buildCompanyReviewPayload } from '~/utils/aiReviewPayload'
import { buildDeterministicCopyBlock } from '~/utils/aiReviewCopyBlock'
import { DEPARTMENTS } from '~/types/models'
import type { Department } from '~/types/models'
import AiReviewReadinessBadge from '~/components/ai-review/AiReviewReadinessBadge.vue'
import AiReviewSummaryPanel from '~/components/ai-review/AiReviewSummaryPanel.vue'
import AiReviewLimitationsList from '~/components/ai-review/AiReviewLimitationsList.vue'
import AiReviewDeliverableCard from '~/components/ai-review/AiReviewDeliverableCard.vue'
import AiReviewCoachingPanel from '~/components/ai-review/AiReviewCoachingPanel.vue'

definePageMeta({ middleware: ['c-suite'] })

const auth = useAuthStore()

// Conservative V1 gate. /c-suite middleware already filters
// chief-or-admin; the company view further narrows to admin / Co-CEO
// / COO. Department chiefs are bounced to their department review.
const canSeeCompany = computed<boolean>(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.profile?.role === 'coo'
)

const {
  allDeliverables,
  allTasks,
  allGoals,
  outputsByDeliverableId,
  studioResolver,
  loading
} = useAiReviewData()

const requester = computed(() => ({
  email: auth.profile?.email ?? '',
  role: auth.profile?.role ?? null,
  department: auth.profile?.department ?? null
}))

const payload = computed(() =>
  buildCompanyReviewPayload({
    requester: requester.value,
    deliverables: allDeliverables.value,
    outputsByDeliverableId: outputsByDeliverableId.value,
    studioResolver,
    tasks: allTasks.value,
    goals: allGoals.value
  })
)

// Department filter view. Always derived from the same payload — we
// never re-build per-department, we just slice the deliverables list.
const deptFilter = ref<Department | ''>('')
const filteredDeliverables = computed(() => {
  if (!deptFilter.value) return payload.value.deliverables
  return payload.value.deliverables.filter((d) => d.department === deptFilter.value)
})
const overdue = computed(() =>
  payload.value.deliverables.filter((d) => d.isOverdue)
)
const needsRevision = computed(() =>
  payload.value.deliverables.filter((d) => d.status === 'needs_revision')
)
const missingContent = computed(() =>
  payload.value.deliverables.filter(
    (d) => d.sectionsMissing > 0 || d.evidenceLinkCount + d.structuredEvidenceCount === 0
  )
)

const copyBlock = computed(() => buildDeterministicCopyBlock(payload.value))
const copied = ref(false)
async function copyToClipboard() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(copyBlock.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* no-op; the textarea below still lets a leader select manually. */
  }
}
</script>

<template>
  <section class="space-y-5">
    <header class="space-y-1">
      <p class="text-sm text-neutral-500">Leadership review</p>
      <h1 class="text-2xl font-semibold">Company Review</h1>
      <p class="text-sm text-neutral-700">
        Deterministic work-state report. No AI approval. No AI grade.
        Counts only, drawn from existing assignment, status, evidence,
        and last-saved metadata.
      </p>
    </header>

    <p v-if="!canSeeCompany" class="card text-sm text-rose-700">
      The Company Review is limited to the Instructor / Admin, the Co-CEOs,
      and the COO. Department chiefs can open their own Department Review
      from <NuxtLink to="/departments" class="underline">/departments</NuxtLink>.
    </p>

    <template v-else>
      <p v-if="loading" class="text-sm text-neutral-500">
        Loading review payload…
      </p>

      <template v-else>
        <AiReviewReadinessBadge :readiness="payload.deterministicReadiness" />

        <section class="card space-y-2">
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Status snapshot (paste-ready)
              </p>
              <p class="text-[11px] italic text-neutral-500">
                Deterministic one-paragraph summary you can paste into a status update.
              </p>
            </div>
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-xs text-phoenix-800 hover:bg-phoenix-50"
              @click="copyToClipboard()"
            >
              {{ copied ? 'Copied ✓' : 'Copy paragraph' }}
            </button>
          </header>
          <textarea
            readonly
            rows="3"
            class="w-full rounded border border-neutral-300 bg-neutral-50 p-2 text-xs leading-snug"
            :value="copyBlock"
          />
        </section>

        <AiReviewSummaryPanel :summary="payload.deterministicSummary" />

        <AiReviewLimitationsList
          :limitations="[...payload.limitations, ...payload.deterministicReadiness.limitations]"
        />

        <!-- AI Leadership Coaching — optional. Renders BELOW the
             deterministic report. The leader must click Generate;
             nothing autoruns. Hidden output is harmless. -->
        <AiReviewCoachingPanel :payload="payload" />

        <!-- Risk lanes — three short lists that surface what leadership
             usually wants to act on first. Click-through goes to the
             deliverable detail page. -->
        <section v-if="overdue.length || needsRevision.length || missingContent.length" class="grid gap-3 md:grid-cols-3">
          <div v-if="overdue.length" class="card border-rose-200 bg-rose-50/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-rose-800">
              Overdue ({{ overdue.length }})
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li v-for="d in overdue.slice(0, 6)" :key="`od-${d.id}`">
                <NuxtLink :to="`/deliverables/${d.id}`" class="text-phoenix-700 hover:underline">
                  Ch. {{ d.chapter }} · {{ d.title }}
                </NuxtLink>
              </li>
              <li v-if="overdue.length > 6" class="italic text-neutral-500">
                and {{ overdue.length - 6 }} more
              </li>
            </ul>
          </div>
          <div v-if="needsRevision.length" class="card border-amber-200 bg-amber-50/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Needs Revision ({{ needsRevision.length }})
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li v-for="d in needsRevision.slice(0, 6)" :key="`nr-${d.id}`">
                <NuxtLink :to="`/deliverables/${d.id}`" class="text-phoenix-700 hover:underline">
                  Ch. {{ d.chapter }} · {{ d.title }}
                </NuxtLink>
              </li>
              <li v-if="needsRevision.length > 6" class="italic text-neutral-500">
                and {{ needsRevision.length - 6 }} more
              </li>
            </ul>
          </div>
          <div v-if="missingContent.length" class="card border-amber-200 bg-amber-50/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Missing content or evidence ({{ missingContent.length }})
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li v-for="d in missingContent.slice(0, 6)" :key="`mc-${d.id}`">
                <NuxtLink :to="`/deliverables/${d.id}`" class="text-phoenix-700 hover:underline">
                  Ch. {{ d.chapter }} · {{ d.title }}
                </NuxtLink>
              </li>
              <li v-if="missingContent.length > 6" class="italic text-neutral-500">
                and {{ missingContent.length - 6 }} more
              </li>
            </ul>
          </div>
        </section>

        <section class="space-y-3">
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-sm font-semibold">Deliverables</h2>
            <select
              v-model="deptFilter"
              class="rounded border border-neutral-300 p-1.5 text-xs"
              aria-label="Filter by department"
            >
              <option value="">All departments</option>
              <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
            </select>
          </header>
          <p
            v-if="!filteredDeliverables.length"
            class="text-sm text-neutral-500"
          >
            No deliverables matched the current filter.
          </p>
          <ul v-else class="grid gap-3 lg:grid-cols-2">
            <li v-for="d in filteredDeliverables" :key="`card-${d.id}`">
              <AiReviewDeliverableCard :deliverable="d" />
            </li>
          </ul>
        </section>
      </template>
    </template>
  </section>
</template>
