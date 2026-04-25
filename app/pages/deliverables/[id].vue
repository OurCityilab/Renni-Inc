<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { useTemplatePreview } from '~/composables/useTemplatePreview'
import { getTemplateStudio } from '~/data/templateStudios'
import type { DeliverableEvent } from '~/types/models'
import { taskStatusLabel } from '~/utils/taskStatus'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'

const route = useRoute()
const auth = useAuthStore()
const deliverables = useDeliverables()
const tasks = useTasks()

const id = computed(() => String(route.params.id))
// Pass the computed ref (not id.value) so the helpers rebind when the
// route param changes without remounting this component.
const { data: deliverable, loading } = deliverables.watchOne(id)
const { data: relatedTasks, loading: relatedTasksLoading } = tasks.watchByDeliverable(id)

const notesDraft = ref('')
const savingNotes = ref(false)
const notesError = ref<string | null>(null)

// When the route param changes, discard the previous deliverable's local
// edit buffer so we don't carry stale notes into the next detail page.
watch(id, () => {
  notesDraft.value = ''
  notesError.value = null
  savingNotes.value = false
})

watch(
  deliverable,
  (d) => {
    if (d && notesDraft.value === '') notesDraft.value = d.notes ?? ''
  },
  { immediate: true }
)

const isOwner = computed(
  () => deliverable.value && auth.user?.uid === deliverable.value.ownerUid
)
const canEditNotes = computed(
  () =>
    isOwner.value &&
    deliverable.value &&
    ['draft', 'needs_revision'].includes(deliverable.value.status)
)

// Who can assign tasks to this deliverable from the detail page:
// admin, Co-CEO, COO (cross-department), or a chief of the deliverable's
// own department. Mirrors the chief scoping on /departments/[department].
const canAssignForDeliverable = computed(() => {
  if (!deliverable.value) return false
  if (auth.isAdmin || auth.isCoCEO) return true
  if (!auth.isChief) return false
  return (
    auth.profile?.role === 'coo' ||
    auth.profile?.department === deliverable.value.department
  )
})
const assigningOpen = ref(false)

// Mirrors the deliverableOutputs Firestore rule: admin / Co-CEO / COO,
// the deliverable's owner, or a chief whose department matches.
// Status-based read-only-ness is layered inside the workspace itself.
const canEditOutput = computed(() => {
  if (!deliverable.value) return false
  if (auth.isAdmin || auth.isCoCEO) return true
  if (auth.profile?.role === 'coo') return true
  if (auth.user && auth.user.uid === deliverable.value.ownerUid) return true
  if (
    auth.isChief &&
    auth.profile?.department === deliverable.value.department
  ) return true
  return false
})

// Template Studio lookup. If a curated studio exists for this deliverable,
// the detail page renders the guided workspace in addition to (not instead
// of) the plain markdown preview that's below. Deliverables without a
// studio fall back to just the preview — this is purely additive.
const studio = computed(() =>
  deliverable.value ? getTemplateStudio(deliverable.value.id) : null
)

// Task progress rollup for this deliverable. Approval status stays a
// separate axis (status chip), so this only signals execution progress.
const taskProgress = computed(() => {
  const total = relatedTasks.value.length
  if (!total) return { total: 0, done: 0, percent: 0 }
  const done = relatedTasks.value.filter((t) => t.status === 'done').length
  return { total, done, percent: Math.round((done / total) * 100) }
})

// --- submit-for-review gate (studio-backed deliverables only) ---
// This is a *task-coverage* gate, not a *task-completion* gate. A studio
// deliverable should not be submitted until every required Template
// Studio requirement has at least one linked task. Tasks don't need to
// be done — they just need to exist. Non-studio deliverables submit
// exactly as before.
const requirementCoverage = computed(() =>
  studio.value
    ? computeRequirementCoverage(
        studio.value.requirements,
        relatedTasks.value
      )
    : null
)
const submitEligible = computed(
  () =>
    deliverable.value?.status === 'draft' ||
    deliverable.value?.status === 'needs_revision'
)
const isCheckingRequirementCoverage = computed(
  () => !!studio.value && submitEligible.value && relatedTasksLoading.value
)
const missingRequiredLabels = computed<string[]>(() =>
  (requirementCoverage.value?.requiredRequirementsWithoutTasks ?? []).map(
    (r) => r.label
  )
)
const submitBlocked = computed(() => {
  // Non-studio deliverables: never blocked here.
  if (!studio.value) return false
  // Only relevant on submit-eligible statuses.
  if (!submitEligible.value) return false
  // While tasks are still loading, block submit so an empty list can't
  // produce a false negative (helper would say "missing everything").
  if (isCheckingRequirementCoverage.value) return true
  return missingRequiredLabels.value.length > 0
})
const submitBlockReason = computed(() => {
  if (isCheckingRequirementCoverage.value) {
    return 'Checking required task coverage…'
  }
  if (!submitBlocked.value) return ''
  return 'Before you submit, create at least one task for each required Template Studio requirement.'
})

// Reverse-chronological; most recent at top.
const history = computed<DeliverableEvent[]>(() => {
  const items = deliverable.value?.statusHistory ?? []
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
})

const actionLabel: Record<DeliverableEvent['action'], string> = {
  submitted: 'submitted for review',
  approved: 'approved',
  returned: 'returned for revision',
  due_date_edited: 'edited the due date'
}

function formatWhen(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
}

// Inline template preview. Raw markdown is rendered in a pre-wrap block —
// no markdown parser dependency added this pass. Headings/lists read fine
// as source text.
const {
  content: templateContent,
  loading: templateLoading,
  error: templateError
} = useTemplatePreview(() => deliverable.value?.templateUrl ?? null)
const templateOpen = ref(true)

// --- review-notes derivation ---
// When status is needs_revision, we want the most recent returned reason
// prominent. The returnedReason field carries the latest one, but the
// activity feed also has timestamped return events — pick the most recent
// there for the "when" tag.
const latestReturnAt = computed<string | null>(() => {
  for (const ev of history.value) if (ev.action === 'returned') return ev.createdAt
  return null
})
const latestApprovedAt = computed<string | null>(() => {
  for (const ev of history.value) if (ev.action === 'approved') return ev.createdAt
  return null
})

async function saveNotes() {
  if (!deliverable.value) return
  savingNotes.value = true
  notesError.value = null
  try {
    await deliverables.saveOwnerNotes(deliverable.value.id, notesDraft.value)
  } catch (e) {
    notesError.value = e instanceof Error ? e.message : String(e)
  } finally {
    savingNotes.value = false
  }
}
</script>

<template>
  <section class="space-y-5">
    <NuxtLink to="/deliverables" class="text-sm text-phoenix-700 hover:underline">
      ← All deliverables
    </NuxtLink>

    <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>

    <template v-else-if="deliverable">
      <header class="space-y-1">
        <p class="text-sm text-neutral-500">
          Chapter {{ deliverable.chapter }} · {{ deliverable.department }}
        </p>
        <h1 class="text-2xl font-semibold">{{ deliverable.title }}</h1>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
          <span>Owner: {{ deliverable.ownerEmail }}</span>
          <span class="hidden sm:inline">·</span>
          <span>Approver: {{ deliverable.approverEmail }}</span>
          <span class="hidden sm:inline">·</span>
          <span>Due: {{ deliverable.dueDate }}</span>
        </div>
      </header>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="md:col-span-2 space-y-4">
          <!-- Draft + studio: lead with the teaching/build surface so students
               see the guided workspace before review mechanics. -->
          <TemplateStudio
            v-if="studio && deliverable.status === 'draft'"
            :deliverable="deliverable"
            :studio="studio"
            :related-tasks="relatedTasks"
            :related-tasks-loading="relatedTasksLoading"
            :can-assign="canAssignForDeliverable"
          />
          <!-- Output workspace: where students actually produce the artifact.
               Mounted right after Template Studio guidance on draft so the
               authoring surface follows the teaching surface. -->
          <DeliverableOutputWorkspace
            v-if="studio && deliverable.status === 'draft'"
            :deliverable="deliverable"
            :studio="studio"
            :can-edit="canEditOutput"
          />

          <ApprovalActions
            :deliverable="deliverable"
            :submit-blocked="submitBlocked"
            :submit-block-reason="submitBlockReason"
            :missing-required-labels="missingRequiredLabels"
            :is-checking-submit-requirements="isCheckingRequirementCoverage"
          />

          <!-- Review notes: prominent when the deliverable is in a review state. -->
          <section
            v-if="deliverable.status === 'needs_revision' && deliverable.returnedReason"
            class="card border-rose-200 bg-rose-50"
          >
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-rose-900">Returned for revision</h2>
              <span v-if="latestReturnAt" class="text-xs text-rose-700">
                {{ formatWhen(latestReturnAt) }}
              </span>
            </header>
            <p class="mt-2 whitespace-pre-wrap text-sm text-rose-900">
              {{ deliverable.returnedReason }}
            </p>
            <p class="mt-2 text-xs text-rose-700">
              Address the points above, update your owner notes if helpful, then use
              <strong>Submit for review</strong> above to resubmit.
            </p>
          </section>

          <section
            v-else-if="deliverable.status === 'approved'"
            class="card border-emerald-200 bg-emerald-50"
          >
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-emerald-900">Approved</h2>
              <span class="text-xs text-emerald-800">
                {{ formatWhen(latestApprovedAt || deliverable.approvedAt || '') }}
                <span v-if="deliverable.approvedByRole"> · {{ deliverable.approvedByRole }}</span>
              </span>
            </header>
            <p
              v-if="deliverable.approvalNotes"
              class="mt-2 whitespace-pre-wrap text-sm text-emerald-900"
            >
              {{ deliverable.approvalNotes }}
            </p>
            <p v-else class="mt-2 text-xs text-emerald-700">
              No approval notes were left for the next cohort.
            </p>
          </section>

          <!-- Template Studio: the interactive guided workspace. Only
               renders when curated curriculum exists for this deliverable;
               otherwise the plain template preview below still serves. -->
          <!-- Non-draft path: studio still renders, but after review/approval
               context so the action panel and review notes lead. -->
          <TemplateStudio
            v-if="studio && deliverable.status !== 'draft'"
            :deliverable="deliverable"
            :studio="studio"
            :related-tasks="relatedTasks"
            :related-tasks-loading="relatedTasksLoading"
            :can-assign="canAssignForDeliverable"
          />
          <!-- Output workspace for in_review / needs_revision / approved.
               Workspace renders read-only or editable depending on status
               and the viewer's permission. -->
          <DeliverableOutputWorkspace
            v-if="studio && deliverable.status !== 'draft'"
            :deliverable="deliverable"
            :studio="studio"
            :can-edit="canEditOutput"
          />

          <!-- What this deliverable needs -->
          <section class="card">
            <h2 class="text-sm font-semibold">What this deliverable needs</h2>
            <p class="mt-2 text-sm text-neutral-700">{{ deliverable.definitionOfDone }}</p>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <a
                v-if="deliverable.templateUrl"
                :href="deliverable.templateUrl"
                target="_blank"
                rel="noopener"
                class="text-phoenix-700 hover:underline"
              >Open the template stub ↗</a>
              <a
                v-if="deliverable.linkedDocUrl"
                :href="deliverable.linkedDocUrl"
                target="_blank"
                rel="noopener"
                class="text-phoenix-700 hover:underline"
              >Linked working doc ↗</a>
            </div>
          </section>

          <!-- Template preview: inline markdown fetched from public/templates.
               Suppressed when a Template Studio is active for this deliverable
               — the studio replaces the raw markdown view. The "Open the
               template stub" link in "What this deliverable needs" above still
               provides access to the original document. -->
          <section v-if="deliverable.templateUrl && !studio" class="card">
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold">Template preview</h2>
              <button
                class="text-xs text-phoenix-700 hover:underline"
                @click="templateOpen = !templateOpen"
              >{{ templateOpen ? 'Hide' : 'Show' }}</button>
            </header>
            <div v-if="templateOpen" class="mt-2 space-y-2">
              <p v-if="templateLoading" class="text-sm text-neutral-500">
                Loading template…
              </p>
              <div v-else-if="templateError" class="text-sm">
                <p class="text-rose-700">
                  Couldn't load the template inline ({{ templateError }}).
                </p>
                <p class="mt-1 text-neutral-600">
                  <a
                    :href="deliverable.templateUrl"
                    target="_blank"
                    rel="noopener"
                    class="text-phoenix-700 hover:underline"
                  >Open it in a new tab ↗</a>
                </p>
              </div>
              <pre
                v-else-if="templateContent"
                class="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-800"
              >{{ templateContent }}</pre>
              <p v-else class="text-sm text-neutral-500">
                No template content was returned.
              </p>
            </div>
          </section>

          <!-- Owner notes -->
          <section class="card">
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold">Owner notes</h2>
              <span v-if="!canEditNotes" class="text-xs text-neutral-500">
                Read-only in this status
              </span>
            </header>
            <textarea
              v-model="notesDraft"
              :disabled="!canEditNotes"
              rows="3"
              class="mt-2 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
              placeholder="Working notes — visible to the approver."
            />
            <div v-if="canEditNotes" class="mt-2 flex justify-end">
              <button class="btn-primary" :disabled="savingNotes" @click="saveNotes">
                {{ savingNotes ? 'Saving…' : 'Save notes' }}
              </button>
            </div>
            <p v-if="notesError" class="mt-2 text-sm text-rose-600">{{ notesError }}</p>
          </section>

          <!-- Recent activity -->
          <section class="card">
            <h2 class="text-sm font-semibold">Recent activity</h2>
            <p v-if="!history.length" class="mt-2 text-sm text-neutral-500">
              No lifecycle events yet. Submission, review, and due-date edits will show here.
            </p>
            <ul v-else class="mt-2 space-y-2">
              <li
                v-for="(ev, i) in history"
                :key="`${ev.createdAt}-${i}`"
                class="rounded-md border border-neutral-200 p-2 text-sm"
              >
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <span class="font-medium text-neutral-800">
                    {{ ev.actorEmail || 'unknown' }}
                    <span
                      v-if="ev.actorRole"
                      class="ml-1 text-xs uppercase tracking-wide text-neutral-500"
                    >{{ ev.actorRole }}</span>
                  </span>
                  <span class="text-xs text-neutral-500">{{ formatWhen(ev.createdAt) }}</span>
                </div>
                <div class="mt-1 text-neutral-700">
                  {{ actionLabel[ev.action] || ev.action }}
                  <span
                    v-if="ev.fromStatus && ev.toStatus && ev.fromStatus !== ev.toStatus"
                    class="text-xs text-neutral-500"
                  >
                    · {{ ev.fromStatus }} → {{ ev.toStatus }}
                  </span>
                </div>
                <p v-if="ev.note" class="mt-1 text-xs text-neutral-600">
                  “{{ ev.note }}”
                </p>
              </li>
            </ul>
          </section>

          <!-- Assign work for this deliverable (admin / Co-CEO / COO / dept chief) -->
          <section v-if="canAssignForDeliverable" class="space-y-2">
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold">Assign work for this deliverable</h2>
              <button
                class="text-xs text-phoenix-700 hover:underline"
                @click="assigningOpen = !assigningOpen"
              >{{ assigningOpen ? 'Close' : '+ Assign a task' }}</button>
            </header>
            <TaskCreateForm
              v-if="assigningOpen"
              :preset-department="deliverable.department"
              :preset-deliverable-id="deliverable.id"
              :preset-playbook-chapter="deliverable.chapter"
              lock-deliverable
              title="Assign a task tied to this deliverable"
              @created="assigningOpen = false"
              @cancel="assigningOpen = false"
            />
          </section>

          <!-- Related tasks -->
          <section class="card">
            <header class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-sm font-semibold">Related tasks</h2>
              <NuxtLink to="/tasks" class="text-xs text-phoenix-700 hover:underline">
                View all tasks →
              </NuxtLink>
            </header>
            <!-- Task-execution progress. Separate axis from the approval
                 status chip in the action panel — this shows child work
                 completion, not whether the deliverable itself is approved. -->
            <div v-if="taskProgress.total" class="mt-2 space-y-1">
              <div class="flex items-baseline justify-between text-xs text-neutral-600">
                <span>Task progress</span>
                <span>{{ taskProgress.done }} of {{ taskProgress.total }} complete · {{ taskProgress.percent }}%</span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded bg-neutral-100">
                <div
                  class="h-full rounded bg-phoenix-500"
                  :style="{ width: taskProgress.percent + '%' }"
                />
              </div>
            </div>
            <p v-if="relatedTasksLoading" class="mt-2 text-sm text-neutral-500">
              Loading linked tasks…
            </p>
            <p v-else-if="!relatedTasks.length" class="mt-2 text-sm text-neutral-500">
              No tasks linked to this deliverable yet. Use
              <span v-if="canAssignForDeliverable"><strong>Assign work</strong> above</span>
              <span v-else>Workbench or Timeline</span>
              to plan the work.
            </p>
            <ul v-else class="mt-2 space-y-2">
              <li
                v-for="t in relatedTasks"
                :key="t.id"
                class="rounded-md border border-neutral-200 p-2 text-sm"
              >
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="truncate font-medium text-neutral-800">{{ t.title }}</p>
                    <p class="text-xs text-neutral-500">
                      {{ t.ownerEmail }}<span v-if="t.dueDate"> · due {{ t.dueDate }}</span>
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
                    :class="{
                      'border-neutral-300 text-neutral-600': t.status === 'not_started',
                      'border-amber-300 bg-amber-50 text-amber-800': t.status === 'in_progress',
                      'border-rose-300 bg-rose-50 text-rose-800': t.status === 'blocked',
                      'border-emerald-300 bg-emerald-50 text-emerald-800': t.status === 'done'
                    }"
                  >{{ taskStatusLabel(t.status) }}</span>
                </div>
                <p
                  v-if="t.status === 'blocked' && t.blockedBy"
                  class="mt-1 rounded-md border border-rose-200 bg-rose-50 p-1.5 text-xs text-rose-800"
                >
                  Blocked: {{ t.blockedBy }}
                </p>
              </li>
            </ul>
          </section>
        </div>

        <aside class="space-y-4">
          <ApprovalRubric :rubric="deliverable.rubricChecklist" />
          <InstructorDueDate :deliverable="deliverable" />
        </aside>
      </div>
    </template>

    <p v-else class="text-sm text-neutral-500">
      Deliverable not found. It may have been renamed — check <NuxtLink to="/deliverables" class="underline">the list</NuxtLink>.
    </p>
  </section>
</template>
