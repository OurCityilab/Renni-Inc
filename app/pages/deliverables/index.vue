<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useDeliverableOutputs } from '~/composables/useDeliverableOutputs'
import { useTasks } from '~/composables/useTasks'
import { DEPARTMENTS } from '~/types/models'
import type {
  Deliverable,
  DeliverableOutput,
  Department,
  Role,
  Task
} from '~/types/models'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'
import {
  computeDeliverableProgress,
  type DeliverableProgressBucket
} from '~/utils/deliverableProgress'
import { canApproveDeliverable } from '~/utils/approvalPermissions'
import { getTemplateStudioForDeliverable } from '~/data/templateStudios'

// Student-friendly filter buckets. The raw enum filters (draft /
// in_review / needs_revision / approved) used to silently hide
// section-level work, so we no longer expose them as primary filters.
// Each bucket maps to a derived progress state from
// `computeDeliverableProgress` (which folds in the existing submit gate
// from `computeRequirementCoverage`) plus the parent deliverable.status.
type ViewFilter =
  | 'all'
  | 'mine'
  | 'needs_work'
  | 'ready_to_submit'
  | 'needs_review'
  | 'needs_revision'
  | 'approved'

const FILTER_LABELS: Record<ViewFilter, string> = {
  all: 'All deliverables',
  mine: 'My work',
  needs_work: 'Needs work',
  ready_to_submit: 'Ready to submit',
  needs_review: 'Needs review',
  needs_revision: 'Needs revision',
  approved: 'Approved'
}

const auth = useAuthStore()
const deliverables = useDeliverables()
const outputs = useDeliverableOutputs()
const tasks = useTasks()

const view = ref<ViewFilter>('all')
const deptFilter = ref<Department | ''>('')
const query = ref('')

// Live subscriptions. All deliverables + all outputs (so section
// readiness reflects in real time) + all tasks (so the existing submit
// gate is computed without per-card fetches).
const { data: allDeliverables, loading } = deliverables.watchList()
const { data: allTasks, loading: tasksLoading } = tasks.watchAll()

const studioIds = computed<string[]>(() =>
  allDeliverables.value
    .filter((d) => !!getTemplateStudioForDeliverable(d))
    .map((d) => d.id)
)
const { data: outputsById, loading: outputsLoading } =
  outputs.watchManyOutputs(studioIds)

function outputFor(d: Deliverable): DeliverableOutput | null {
  return outputsById.value[d.id] ?? null
}

function tasksFor(d: Deliverable): Task[] {
  return allTasks.value.filter((t) => t.deliverableId === d.id)
}

interface ViewerProfile {
  uid: string
  role: Role
  department: Department
}
const viewerProfile = computed<ViewerProfile | null>(() => {
  const p = auth.profile
  if (!p) return null
  return { uid: p.uid, role: p.role, department: p.department }
})

interface DeliverableRow {
  deliverable: Deliverable
  bucket: DeliverableProgressBucket
  statusLabel: string
  sectionProgressLabel: string | null
  nextActionLabel: string
  submitEligible: boolean
  canSubmit: boolean
  submitBlockReason: string | null
  missingRequiredLabels: string[]
  isOwner: boolean
  canApprove: boolean
}

// Single derived row per deliverable so the reviewer queue and the main
// list share the same computed state without re-deriving.
const rows = computed<DeliverableRow[]>(() => {
  return allDeliverables.value.map((d): DeliverableRow => {
    const studio = getTemplateStudioForDeliverable(d)
    const relatedTasks = tasksFor(d)
    const coverage = studio
      ? computeRequirementCoverage(studio.requirements, relatedTasks)
      : null
    const coverageReady = !studio || !tasksLoading.value
    const progress = computeDeliverableProgress({
      deliverable: d,
      output: outputFor(d),
      tasks: relatedTasks,
      coverage,
      coverageReady
    })
    const isOwner = auth.user?.uid === d.ownerUid
    const canApprove = canApproveDeliverable(viewerProfile.value, d)
    return {
      deliverable: d,
      bucket: progress.bucket,
      statusLabel: progress.statusLabel,
      sectionProgressLabel: progress.sectionProgressLabel,
      nextActionLabel: progress.nextActionLabel,
      submitEligible: progress.submitEligible,
      canSubmit: progress.canSubmit,
      submitBlockReason: progress.submitBlockReason,
      missingRequiredLabels: progress.missingRequiredLabels,
      isOwner,
      canApprove
    }
  })
})

const filteredRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const d = row.deliverable
    if (deptFilter.value && d.department !== deptFilter.value) return false
    if (q && !(d.title.toLowerCase().includes(q) || String(d.chapter) === q)) {
      return false
    }
    switch (view.value) {
      case 'all':
        return true
      case 'mine':
        return (
          (!!auth.user?.uid &&
            (d.ownerUid === auth.user.uid || d.approverUid === auth.user.uid)) ||
          row.canApprove
        )
      case 'needs_work':
        return row.bucket === 'needs_work'
      case 'ready_to_submit':
        return row.bucket === 'ready_to_submit'
      case 'needs_review':
        return row.bucket === 'needs_review'
      case 'needs_revision':
        return row.bucket === 'needs_revision'
      case 'approved':
        return row.bucket === 'approved'
      default:
        return true
    }
  })
})

// Reviewer queue. Reuses the same row derivation; we just pick the
// in_review rows the viewer can act on. Filters above still apply so a
// dept chief who narrows to their own department doesn't see other
// departments here either.
const reviewQueue = computed<DeliverableRow[]>(() =>
  rows.value.filter(
    (r) => r.bucket === 'needs_review' && r.canApprove
  )
)

const filtersHideWork = computed(
  () => !filteredRows.value.length && rows.value.length > 0
)

// --- submit deliverable for review (inline action) ---
const submittingId = ref<string | null>(null)
const submitError = ref<string | null>(null)

async function submitForReview(row: DeliverableRow) {
  if (!row.canSubmit) return
  if (!auth.user) return
  const from = row.deliverable.status
  if (from !== 'draft' && from !== 'needs_revision') return
  submitError.value = null
  submittingId.value = row.deliverable.id
  try {
    const actor = {
      email: auth.profile?.email || auth.user.email || '',
      role: auth.profile?.role
    }
    await deliverables.submitForReview(row.deliverable.id, actor, from)
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submittingId.value = null
  }
}

function fmtDate(iso: string | undefined | null) {
  if (!iso) return '—'
  const [y, m, d] = (iso || '').split('-').map(Number)
  if (!y || !m || !d) return iso ?? '—'
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

function overdue(d: Deliverable): boolean {
  if (d.status === 'approved') return false
  const [y, mo, da] = (d.dueDate || '').split('-').map(Number)
  if (!y || !mo || !da) return false
  const today = new Date()
  return (
    new Date(y, mo - 1, da).getTime() <
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  )
}

function bucketBadge(b: DeliverableProgressBucket): string {
  switch (b) {
    case 'ready_to_submit':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800'
    case 'needs_review':
      return 'border-sky-300 bg-sky-50 text-sky-800'
    case 'needs_revision':
      return 'border-rose-300 bg-rose-50 text-rose-800'
    case 'approved':
      return 'border-emerald-400 bg-emerald-50 text-emerald-900'
    case 'needs_work':
    default:
      return 'border-neutral-300 bg-neutral-50 text-neutral-700'
  }
}
</script>

<template>
  <section class="space-y-4">
    <header>
      <p class="text-sm text-neutral-500">Playbook chapters</p>
      <h1 class="text-2xl font-semibold">Deliverables</h1>
      <p class="text-sm text-neutral-600">
        Each deliverable is the parent of its sections. Open one to build
        the sections, then submit the full deliverable for review when
        required checks are covered. Approval happens at the deliverable
        level — not on individual sections.
      </p>
    </header>

    <!-- Reviewer queue: deliverables in_review that this viewer can act
         on. Hidden when there is nothing to review so it doesn't add
         noise for students. -->
    <section
      v-if="reviewQueue.length"
      class="card border-sky-200 bg-sky-50/60"
    >
      <header class="flex items-baseline justify-between">
        <h2 class="text-sm font-semibold text-sky-900">Needs your review</h2>
        <span class="text-xs text-sky-800">
          {{ reviewQueue.length }} deliverable<span v-if="reviewQueue.length !== 1">s</span>
        </span>
      </header>
      <ul class="mt-3 space-y-2">
        <li
          v-for="row in reviewQueue"
          :key="row.deliverable.id"
          class="rounded-md border border-sky-200 bg-white p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs text-neutral-500">
                Ch. {{ row.deliverable.chapter }} · {{ row.deliverable.department }}
              </p>
              <p class="truncate text-sm font-medium text-neutral-900">
                {{ row.deliverable.title }}
              </p>
              <p class="text-xs text-neutral-600">
                Owner: {{ row.deliverable.ownerEmail }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1 text-xs">
              <span class="text-neutral-600">Due {{ fmtDate(row.deliverable.dueDate) }}</span>
              <NuxtLink
                :to="`/deliverables/${row.deliverable.id}#approval-actions`"
                class="btn-primary !px-3 !py-1 text-xs"
              >Open to approve or request revision</NuxtLink>
            </div>
          </div>
        </li>
      </ul>
      <p class="mt-2 text-xs text-sky-800/90">
        Approval and revision happen on the deliverable detail page so the
        full submission, history, and reviewer notes are visible together.
      </p>
    </section>

    <!-- Filters. Search + plain-language view + optional department
         narrow. Raw enum status filters are intentionally not exposed. -->
    <div class="grid gap-2 sm:grid-cols-3">
      <input
        v-model="query"
        type="search"
        placeholder="Search by title or chapter"
        class="rounded border border-neutral-300 p-2 text-sm"
      />
      <select
        v-model="view"
        class="rounded border border-neutral-300 p-2 text-sm"
        aria-label="View"
      >
        <option v-for="(label, key) in FILTER_LABELS" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
      <select
        v-model="deptFilter"
        class="rounded border border-neutral-300 p-2 text-sm"
        aria-label="Department"
      >
        <option value="">All departments</option>
        <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <p v-if="loading || outputsLoading || tasksLoading" class="text-sm text-neutral-500">
      Loading deliverables…
    </p>
    <p v-else-if="!rows.length" class="text-sm text-neutral-500">
      No deliverables found.
    </p>
    <p v-else-if="filtersHideWork" class="text-sm text-neutral-500">
      No deliverables match the current view. Try
      <button
        type="button"
        class="text-phoenix-700 underline"
        @click="view = 'all'"
      >All deliverables</button>.
    </p>

    <div v-else class="space-y-2">
      <article
        v-for="row in filteredRows"
        :key="row.deliverable.id"
        class="rounded-md border border-neutral-200 bg-white p-3 hover:bg-neutral-50"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs text-neutral-500">
              Ch. {{ row.deliverable.chapter }} · {{ row.deliverable.department }}
            </p>
            <NuxtLink
              :to="`/deliverables/${row.deliverable.id}`"
              class="block truncate text-sm font-medium text-neutral-900 hover:underline"
            >{{ row.deliverable.title }}</NuxtLink>
            <p class="text-xs text-neutral-500">
              Owner: {{ row.deliverable.ownerEmail }}
              <span v-if="row.deliverable.approverEmail"> · Approver: {{ row.deliverable.approverEmail }}</span>
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1 text-xs">
            <span
              class="rounded-full border px-2 py-0.5 font-medium"
              :class="bucketBadge(row.bucket)"
            >{{ row.statusLabel }}</span>
            <span
              :class="overdue(row.deliverable) ? 'text-rose-600 font-semibold' : 'text-neutral-500'"
            >
              Due {{ fmtDate(row.deliverable.dueDate) }}
              <span v-if="overdue(row.deliverable)"> · overdue</span>
            </span>
          </div>
        </div>

        <div class="mt-2 space-y-1 text-xs text-neutral-700">
          <p v-if="row.sectionProgressLabel">{{ row.sectionProgressLabel }}</p>
          <p>{{ row.nextActionLabel }}</p>
        </div>

        <!-- Owner submit-for-review affordance. Mirrors the gate used by
             ApprovalActions on the detail page — never bypasses
             requirement coverage and never creates a new approval
             pathway. -->
        <div
          v-if="row.submitEligible && row.isOwner"
          class="mt-3 flex flex-wrap items-center gap-2"
        >
          <button
            v-if="row.canSubmit"
            type="button"
            class="btn-primary !px-3 !py-1 text-xs"
            :disabled="submittingId === row.deliverable.id"
            @click="submitForReview(row)"
          >
            {{ submittingId === row.deliverable.id ? 'Submitting…' : 'Submit deliverable for review' }}
          </button>
          <NuxtLink
            v-else
            :to="`/deliverables/${row.deliverable.id}`"
            class="btn-secondary !px-3 !py-1 text-xs"
          >Continue work</NuxtLink>

          <span
            v-if="!row.canSubmit && row.submitBlockReason"
            class="text-xs text-amber-800"
          >
            {{ row.submitBlockReason === 'Checking what is still needed before this is ready for review…' ? row.submitBlockReason : 'Not ready to submit' }}
          </span>
        </div>

        <div
          v-else
          class="mt-3 flex flex-wrap items-center gap-2"
        >
          <NuxtLink
            :to="`/deliverables/${row.deliverable.id}`"
            class="btn-secondary !px-3 !py-1 text-xs"
          >
            {{
              row.bucket === 'needs_review' && row.canApprove
                ? 'Open to approve or request revision'
                : row.bucket === 'approved'
                  ? 'View approved deliverable'
                  : 'Open deliverable'
            }}
          </NuxtLink>
        </div>

        <!-- Submit gate explanation when blocked. Pure display; the
             real gate lives in computeRequirementCoverage. -->
        <div
          v-if="row.submitEligible && row.isOwner && !row.canSubmit && row.missingRequiredLabels.length"
          class="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
        >
          <p class="font-medium">Not ready to submit yet. Required checks still need at least one task:</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-5">
            <li v-for="label in row.missingRequiredLabels.slice(0, 4)" :key="label">{{ label }}</li>
            <li v-if="row.missingRequiredLabels.length > 4">
              and {{ row.missingRequiredLabels.length - 4 }} more
            </li>
          </ul>
        </div>
      </article>
    </div>

    <p v-if="submitError" class="text-sm text-rose-600">{{ submitError }}</p>
  </section>
</template>
