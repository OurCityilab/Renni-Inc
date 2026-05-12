<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAiReviewData } from '~/composables/useAiReviewData'
import { buildCompanyReviewPayload } from '~/utils/aiReviewPayload'
import { AI_REVIEW_COACHING_SAFETY_REMINDER } from '~/types/aiReviewReports'

definePageMeta({ middleware: ['c-suite'] })

const auth = useAuthStore()
const canSeeCompany = computed(
  () => auth.isAdmin || auth.isCoCEO || auth.profile?.role === 'coo'
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

const generated = computed(() =>
  new Date(payload.value.generatedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
)
const riskyDeliverables = computed(() =>
  payload.value.deliverables.filter(
    (d) =>
      d.isOverdue ||
      d.status === 'needs_revision' ||
      d.sectionsMissing > 0 ||
      d.evidenceLinkCount + d.structuredEvidenceCount === 0
  )
)
</script>

<template>
  <main class="mx-auto max-w-5xl bg-white p-8 text-neutral-950 print:p-0">
    <p v-if="!canSeeCompany" class="rounded border border-rose-200 p-4 text-sm text-rose-800">
      Company Review print view is limited to Instructor/Admin, Co-CEOs, and COO.
    </p>
    <p v-else-if="loading" class="text-sm text-neutral-500">
      Loading review payload…
    </p>
    <template v-else>
      <header class="border-b border-neutral-300 pb-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          Renni Inc.
        </p>
        <h1 class="mt-2 text-3xl font-semibold">Company Review Report</h1>
        <p class="mt-2 text-sm text-neutral-700">
          Generated {{ generated }}. Deterministic report is the source of truth.
        </p>
      </header>

      <section class="mt-6 grid gap-3 sm:grid-cols-4">
        <div class="rounded border border-neutral-300 p-3">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Readiness</p>
          <p class="text-2xl font-semibold">
            {{ payload.deterministicReadiness.deterministicScore }} / 100
          </p>
          <p class="text-sm capitalize">{{ payload.deterministicReadiness.label }}</p>
        </div>
        <div class="rounded border border-neutral-300 p-3">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Deliverables</p>
          <p class="text-2xl font-semibold">{{ payload.deterministicSummary.totalDeliverables }}</p>
          <p class="text-sm">{{ payload.deterministicSummary.approvedDeliverables }} approved</p>
        </div>
        <div class="rounded border border-neutral-300 p-3">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Sections</p>
          <p class="text-2xl font-semibold">{{ payload.deterministicSummary.totalSections }}</p>
          <p class="text-sm">{{ payload.deterministicSummary.sectionsMissing }} missing</p>
        </div>
        <div class="rounded border border-neutral-300 p-3">
          <p class="text-xs uppercase tracking-wide text-neutral-500">Evidence</p>
          <p class="text-2xl font-semibold">
            {{
              payload.deterministicSummary.evidenceLinkCount +
              payload.deterministicSummary.structuredEvidenceCount
            }}
          </p>
          <p class="text-sm">links + structured entries</p>
        </div>
      </section>

      <section class="mt-8 break-inside-avoid">
        <h2 class="text-lg font-semibold">Work-State Summary</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            {{ payload.deterministicSummary.inReviewDeliverables }} submitted for review,
            {{ payload.deterministicSummary.needsRevisionDeliverables }} need revision,
            {{ payload.deterministicSummary.draftDeliverables }} in draft.
          </li>
          <li>
            {{ payload.deterministicSummary.sectionsWithFinalText }} sections have final text;
            {{ payload.deterministicSummary.sectionsWithDraftFallback + payload.deterministicSummary.sectionsWithSourceNotesFallback }}
            use draft/source-note fallback.
          </li>
          <li>
            {{ payload.deterministicSummary.overdueDeliverables }} overdue deliverables and
            {{ payload.deterministicSummary.overdueTasks }} overdue tasks.
          </li>
        </ul>
      </section>

      <section class="mt-8 break-before-page">
        <h2 class="text-lg font-semibold">Department and Chapter Cards</h2>
        <div class="mt-3 grid gap-3">
          <article
            v-for="d in payload.deliverables"
            :key="d.id"
            class="break-inside-avoid rounded border border-neutral-300 p-3"
          >
            <header class="flex items-baseline justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-wide text-neutral-500">
                  Ch. {{ d.chapter }} · {{ d.department }}
                </p>
                <h3 class="font-semibold">{{ d.title }}</h3>
              </div>
              <p class="text-sm">{{ d.statusLabel }}</p>
            </header>
            <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-700">
              <li>Final text {{ d.sectionsWithFinalText }} / {{ d.totalSections }}</li>
              <li v-if="d.sectionsMissing">Missing {{ d.sectionsMissing }}</li>
              <li>Evidence {{ d.evidenceLinkCount + d.structuredEvidenceCount }}</li>
              <li v-if="d.isOverdue">Overdue</li>
            </ul>
          </article>
        </div>
      </section>

      <section v-if="riskyDeliverables.length" class="mt-8 break-before-page">
        <h2 class="text-lg font-semibold">Next Actions</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li v-for="d in riskyDeliverables.slice(0, 12)" :key="`risk-${d.id}`">
            Ch. {{ d.chapter }} {{ d.title }}:
            <span v-if="d.status === 'needs_revision'">needs revision</span>
            <span v-else-if="d.isOverdue">overdue</span>
            <span v-else-if="d.sectionsMissing">missing content</span>
            <span v-else>needs evidence</span>.
          </li>
        </ul>
      </section>

      <section class="mt-8 break-inside-avoid">
        <h2 class="text-lg font-semibold">Limitations</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li
            v-for="l in [...payload.limitations, ...payload.deterministicReadiness.limitations]"
            :key="`${l.code}-${l.message}`"
          >
            {{ l.message }}
          </li>
        </ul>
      </section>

      <footer class="mt-10 border-t border-neutral-300 pt-3 text-xs text-neutral-600">
        {{ AI_REVIEW_COACHING_SAFETY_REMINDER }}
      </footer>
    </template>
  </main>
</template>

<style scoped>
@media print {
  :global(nav),
  :global(aside),
  :global(button),
  :global(.no-print) {
    display: none !important;
  }

  @page {
    margin: 0.65in;
  }

  main {
    max-width: none;
  }
}
</style>
