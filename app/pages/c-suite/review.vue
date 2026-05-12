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
import { useAiReviewCoachingMetrics } from '~/composables/useAiReviewCoachingMetrics'
import { useAiReviewSnapshots } from '~/composables/useAiReviewSnapshots'
import { buildCompanyReviewPayload } from '~/utils/aiReviewPayload'
import { buildDeterministicCopyBlock } from '~/utils/aiReviewCopyBlock'
import {
  buildCompanyReviewMarkdown,
  downloadReviewMarkdown,
  reviewMarkdownFilename
} from '~/utils/aiReviewReportExport'
import { DEPARTMENTS } from '~/types/models'
import type { Department } from '~/types/models'
import type { AiReviewCoachingOutput } from '~/types/aiReviewReports'
import AiReviewReadinessBadge from '~/components/ai-review/AiReviewReadinessBadge.vue'
import AiReviewSummaryPanel from '~/components/ai-review/AiReviewSummaryPanel.vue'
import AiReviewLimitationsList from '~/components/ai-review/AiReviewLimitationsList.vue'
import AiReviewDeliverableCard from '~/components/ai-review/AiReviewDeliverableCard.vue'
import AiReviewCoachingPanel from '~/components/ai-review/AiReviewCoachingPanel.vue'

definePageMeta({ middleware: ['c-suite'] })

const auth = useAuthStore()
const snapshots = useAiReviewSnapshots()
const coachingMetrics = useAiReviewCoachingMetrics()

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

const readinessLabelText = computed(() => {
  switch (payload.value.deterministicReadiness.label) {
    case 'high-risk':
      return 'High Risk'
    case 'needs-work':
      return 'Needs Work'
    case 'near-ready':
      return 'Near Ready'
    case 'ready':
      return 'Ready'
  }
})

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

const objectiveGaps = computed(() => {
  const summary = payload.value.deterministicSummary
  const gaps: string[] = []
  if (summary.sectionsMissing > 0) {
    gaps.push(plural(summary.sectionsMissing, 'section with missing content', 'sections with missing content'))
  }
  if (summary.overdueDeliverables > 0) {
    gaps.push(plural(summary.overdueDeliverables, 'overdue deliverable'))
  }
  if (summary.needsRevisionDeliverables > 0) {
    gaps.push(plural(summary.needsRevisionDeliverables, 'deliverable needing revision', 'deliverables needing revision'))
  }
  if (summary.structuredEvidenceCount < Math.max(1, Math.floor(summary.totalSections / 2))) {
    gaps.push('limited structured evidence')
  }
  return gaps
})

const whatThisMeans = computed(() => {
  const gaps = objectiveGaps.value
  const gapText = gaps.length
    ? gaps.join(', ')
    : 'final review, approval, and handoff checks'
  const focusText = gaps.length
    ? 'Focus first on chapters with missing content, overdue work, revision needs, or limited evidence.'
    : 'Focus on confirming the strongest chapters are ready for human review and final handoff.'
  return `Renni Inc. is currently in ${readinessLabelText.value} status. The biggest objective gaps are ${gapText}. ${focusText}`
})

const coachingOutput = ref<AiReviewCoachingOutput | null>(null)
const copyBlock = computed(() => buildDeterministicCopyBlock(payload.value))
const fullReportMarkdown = computed(() =>
  buildCompanyReviewMarkdown(payload.value, coachingOutput.value)
)
const copied = ref(false)
const fullCopied = ref(false)
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
async function copyFullReport() {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(fullReportMarkdown.value)
    fullCopied.value = true
    setTimeout(() => {
      fullCopied.value = false
    }, 2000)
  } catch {
    /* no-op */
  }
}
function downloadFullReport() {
  downloadReviewMarkdown(reviewMarkdownFilename(payload.value), fullReportMarkdown.value)
}
function saveSnapshot() {
  void snapshots.saveSnapshot({
    payload: payload.value,
    coaching: coachingOutput.value,
    copyBlock: fullReportMarkdown.value
  })
}
function refreshMetrics() {
  void coachingMetrics.refreshMetrics()
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

        <section class="card border-phoenix-200 bg-phoenix-50/40">
          <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-900">
            What this means
          </p>
          <p class="mt-1 text-sm leading-relaxed text-neutral-800">
            {{ whatThisMeans }}
          </p>
        </section>

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
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="copyFullReport()"
            >
              {{ fullCopied ? 'Copied full report ✓' : 'Copy full report' }}
            </button>
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="downloadFullReport()"
            >Download Markdown</button>
            <NuxtLink
              to="/c-suite/review/print"
              class="rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-700 hover:bg-neutral-50"
            >Print view</NuxtLink>
            <button
              type="button"
              class="rounded border border-neutral-300 bg-white px-2 py-1 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              :disabled="snapshots.saving.value"
              @click="saveSnapshot()"
            >
              {{ snapshots.saving.value ? 'Saving snapshot…' : 'Save snapshot' }}
            </button>
            <span v-if="snapshots.saved.value" class="text-emerald-700">
              Snapshot saved
            </span>
            <span v-else-if="snapshots.error.value" class="text-rose-700">
              {{ snapshots.error.value }}
            </span>
          </div>
        </section>

        <AiReviewSummaryPanel :summary="payload.deterministicSummary" />

        <AiReviewLimitationsList
          :limitations="[...payload.limitations, ...payload.deterministicReadiness.limitations]"
        />

        <!-- AI Leadership Coaching — optional. Renders BELOW the
             deterministic report. The leader must click Generate;
             nothing autoruns. Hidden output is harmless. -->
        <AiReviewCoachingPanel
          :payload="payload"
          @coaching-updated="coachingOutput = $event"
        />

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

        <details class="card space-y-2 border-neutral-200 bg-neutral-50/50">
          <summary class="cursor-pointer list-none">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  Admin diagnostics
                </p>
                <h2 class="text-sm font-semibold text-neutral-900">
                  AI System Diagnostics
                </h2>
                <p class="text-[11px] italic text-neutral-500">
                  Admin-only technical health check. These numbers describe the AI coaching system, not student performance or company readiness.
                </p>
              </div>
              <button
                type="button"
                class="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                :disabled="coachingMetrics.loading.value"
                @click.prevent="refreshMetrics()"
              >
                {{ coachingMetrics.loading.value ? 'Loading…' : 'Refresh metrics' }}
              </button>
            </div>
          </summary>
          <p v-if="coachingMetrics.error.value" class="pt-2 text-xs text-rose-700">
            {{ coachingMetrics.error.value }}
          </p>
          <dl
            v-if="coachingMetrics.metrics.value"
            class="grid gap-2 pt-2 text-xs sm:grid-cols-3 lg:grid-cols-6"
          >
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">AI requests sent</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.totalToday }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                Total coaching attempts today.
              </p>
            </div>
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">Coaching responses generated</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.successCount }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                Requests that returned usable coaching.
              </p>
            </div>
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">Blocked by config</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.disabledCount }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                AI is turned off or missing required setup.
              </p>
            </div>
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">Blocked by permissions</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.forbiddenCount }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                User role was not allowed.
              </p>
            </div>
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">AI format failures</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.validationFailureCount }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                The AI responded but did not match the required safe format.
              </p>
            </div>
            <div class="rounded border border-neutral-200 bg-white p-2">
              <dt class="text-neutral-500">Safety blocks</dt>
              <dd class="font-semibold">{{ coachingMetrics.metrics.value.safetyFailureCount }}</dd>
              <p class="mt-1 text-[10px] leading-tight text-neutral-500">
                The AI response was blocked by safety rules.
              </p>
            </div>
          </dl>
        </details>

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
