<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import { useTemplatePreview } from '~/composables/useTemplatePreview'
import type { DeliverableEvent } from '~/types/models'

const route = useRoute()
const auth = useAuthStore()
const deliverables = useDeliverables()
const tasks = useTasks()

const id = computed(() => String(route.params.id))
// Pass the computed ref (not id.value) so the helpers rebind when the
// route param changes without remounting this component.
const { data: deliverable, loading } = deliverables.watchOne(id)
const { data: relatedTasks } = tasks.watchByDeliverable(id)

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
          <ApprovalActions :deliverable="deliverable" />

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

          <!-- Template preview: inline markdown fetched from public/templates. -->
          <section v-if="deliverable.templateUrl" class="card">
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

          <!-- Related tasks -->
          <section class="card">
            <header class="flex items-center justify-between">
              <h2 class="text-sm font-semibold">Related tasks</h2>
              <NuxtLink to="/tasks" class="text-xs text-phoenix-700 hover:underline">
                View all tasks →
              </NuxtLink>
            </header>
            <p v-if="!relatedTasks.length" class="mt-2 text-sm text-neutral-500">
              No tasks linked to this deliverable.
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
                  >{{ t.status }}</span>
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
