<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import type { Deliverable, Role } from '~/types/models'

const props = defineProps<{ deliverable: Deliverable }>()

const auth = useAuthStore()
const deliverables = useDeliverables()

const canEdit = computed(
  () =>
    (auth.isAdmin || auth.isCoCEO) &&
    props.deliverable.instructorCanEditDueDate !== false
)

// Resolve "last edited by" to a human-readable email by reading the most
// recent due_date_edited event from statusHistory. Avoids a schema change
// (lastDueDateEditedBy is a uid; the activity feed already carries the
// email). statusHistory is appended via arrayUnion, which is a set op and
// does not guarantee array order — so we filter to due_date_edited events
// and pick the newest by parseable createdAt rather than by array position.
const lastDueDateEditor = computed<string | null>(() => {
  const history = props.deliverable.statusHistory ?? []
  const events = history.filter(
    (ev) => ev && ev.action === 'due_date_edited'
  )
  if (!events.length) return null
  let best = events[0]!
  let bestMs = Date.parse(best.createdAt ?? '')
  for (let i = 1; i < events.length; i++) {
    const ev = events[i]!
    const ms = Date.parse(ev.createdAt ?? '')
    if (Number.isNaN(ms)) continue
    if (Number.isNaN(bestMs) || ms > bestMs) {
      best = ev
      bestMs = ms
    }
  }
  return best.actorEmail ?? null
})

function formatWhen(iso?: string | null): string {
  if (!iso) return ''
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

const open = ref(false)
const newDate = ref(props.deliverable.dueDate || '')
const reason = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

// Reset local edit state when the deliverable changes (route-param nav
// reuses this component instance). Without this, an open edit buffer from
// one deliverable would persist to the next and Save would target the
// new deliverable with the previous one's date/reason.
watch(
  () => props.deliverable.id,
  () => {
    open.value = false
    newDate.value = props.deliverable.dueDate || ''
    reason.value = ''
    error.value = null
    submitting.value = false
  }
)

async function save() {
  if (!auth.user) return
  if (!newDate.value) {
    error.value = 'Pick a date.'
    return
  }
  if (!reason.value.trim()) {
    error.value = 'Add a short reason — this is the audit trail.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    const actor = {
      uid: auth.user.uid,
      email: auth.profile?.email || auth.user.email || '',
      role: auth.profile?.role as Role | undefined
    }
    await deliverables.editDueDate(
      props.deliverable.id,
      actor,
      props.deliverable.status,
      newDate.value,
      reason.value.trim()
    )
    open.value = false
    reason.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card space-y-2">
    <header class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Due date</h2>
      <button
        v-if="canEdit"
        class="text-xs text-phoenix-700 hover:underline"
        @click="open = !open"
      >
        {{ open ? 'Cancel' : 'Adjust' }}
      </button>
    </header>
    <dl class="text-sm text-neutral-700">
      <div class="flex justify-between">
        <dt>Current</dt>
        <dd class="font-medium text-neutral-900">{{ deliverable.dueDate }}</dd>
      </div>
      <div class="flex justify-between text-xs text-neutral-500">
        <dt>Originally suggested</dt>
        <dd>{{ deliverable.suggestedDueDate }}</dd>
      </div>
    </dl>

    <div
      v-if="deliverable.lastDueDateEditedAt"
      class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700"
    >
      <p class="font-medium text-neutral-800">Last adjusted</p>
      <p class="mt-0.5">
        {{ formatWhen(deliverable.lastDueDateEditedAt) }}
        <span v-if="lastDueDateEditor"> by {{ lastDueDateEditor }}</span>
      </p>
      <p v-if="deliverable.dueDateOverrideReason" class="mt-1 italic">
        “{{ deliverable.dueDateOverrideReason }}”
      </p>
    </div>

    <div v-if="open" class="space-y-2 border-t border-neutral-200 pt-2">
      <label class="block text-xs font-medium text-neutral-800">New due date</label>
      <input
        v-model="newDate"
        type="date"
        class="w-full rounded border border-neutral-300 p-2 text-sm"
      />
      <label class="block text-xs font-medium text-neutral-800">Reason</label>
      <textarea
        v-model="reason"
        rows="2"
        class="w-full rounded border border-neutral-300 p-2 text-sm"
        placeholder="e.g. Pushed one week to align with TechTown date shift"
      />
      <div class="flex justify-end gap-2">
        <button class="btn-secondary" @click="open = false">Cancel</button>
        <button class="btn-primary" :disabled="submitting" @click="save">
          Save new date
        </button>
      </div>
      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
    </div>
  </section>
</template>
