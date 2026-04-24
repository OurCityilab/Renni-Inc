<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useRoster } from '~/composables/useRoster'
import { useTasks, type NewTaskInput } from '~/composables/useTasks'
import { DEPARTMENTS, type Department, type Task, type TaskPriority } from '~/types/models'

const props = withDefaults(
  defineProps<{
    presetDepartment?: Department | null
    presetDeliverableId?: string | null
    presetPlaybookChapter?: number | null
    lockDepartment?: boolean
    lockDeliverable?: boolean
    title?: string
  }>(),
  {
    presetDepartment: null,
    presetDeliverableId: null,
    presetPlaybookChapter: null,
    lockDepartment: false,
    lockDeliverable: false,
    title: 'Assign a task'
  }
)

const emit = defineEmits<{
  (e: 'created', id: string): void
  (e: 'cancel'): void
}>()

const auth = useAuthStore()
const tasks = useTasks()
const deliverables = useDeliverables()
const roster = useRoster()

// Rule posture: admin / Co-CEO / any chief may create tasks. COO is a
// chief per role-map. Members see a read-only note and no form.
const canPlan = computed(
  () => auth.isAdmin || auth.isCoCEO || auth.isChief
)

const { data: allTasks } = tasks.watchAll()
const { data: allDeliverables } = deliverables.watchList()
const { data: rosterEntries } = roster.watchAll()

// One-shot email → uid map. Tasks require a provisioned ownerUid so the
// student's /tasks Mine tab and owner-driven status updates both work.
// Same pattern as /timeline and /team.
const emailToUid = ref<Map<string, string>>(new Map())
onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    const m = new Map<string, string>()
    snap.forEach((d) => {
      const data = d.data() as { email?: string }
      if (data.email) m.set(data.email.toLowerCase(), d.id)
    })
    emailToUid.value = m
  } catch {
    // Non-fatal — submit will surface a clear "unprovisioned" error if the
    // map is empty and the owner email can't be resolved.
  }
})

interface FormState {
  title: string
  ownerEmail: string
  department: Department | ''
  deliverableId: string
  startDate: string
  dueDate: string
  dependsOn: string[]
  definitionOfDone: string
  priority: TaskPriority | ''
  notes: string
}

function initialForm(): FormState {
  return {
    title: '',
    ownerEmail: '',
    department: (props.presetDepartment ?? auth.profile?.department ?? '') as Department | '',
    deliverableId: props.presetDeliverableId ?? '',
    startDate: '',
    dueDate: '',
    dependsOn: [],
    definitionOfDone: '',
    priority: '',
    notes: ''
  }
}

const form = ref<FormState>(initialForm())
const submitting = ref(false)
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

const deliverableOptions = computed(() =>
  [...allDeliverables.value].sort((a, b) => a.chapter - b.chapter)
)
const rosterEmails = computed(() =>
  [...rosterEntries.value].map((r) => r.email).filter(Boolean).sort()
)
const dependencyCandidates = computed<Task[]>(() =>
  [...allTasks.value].sort((a, b) => a.title.localeCompare(b.title))
)

async function submit() {
  if (!canPlan.value) {
    formError.value = 'Only admins, Co-CEOs, and chiefs can assign tasks.'
    return
  }
  formError.value = null
  formSuccess.value = null
  if (!form.value.title.trim()) {
    formError.value = 'What needs to be done? (title required)'
    return
  }
  if (!form.value.ownerEmail.trim()) {
    formError.value = 'Who owns this? (owner email required)'
    return
  }
  if (
    form.value.startDate &&
    form.value.dueDate &&
    form.value.startDate > form.value.dueDate
  ) {
    formError.value = 'Start date must be on or before the due date.'
    return
  }
  const ownerEmail = form.value.ownerEmail.trim().toLowerCase()
  const ownerUid = emailToUid.value.get(ownerEmail)
  if (!ownerUid) {
    formError.value =
      'This student needs to sign in once before tasks can be assigned to them.'
    return
  }
  submitting.value = true
  try {
    const d = form.value.deliverableId
      ? deliverableOptions.value.find((x) => x.id === form.value.deliverableId)
      : null
    const payload: NewTaskInput = {
      title: form.value.title.trim(),
      ownerEmail,
      ownerUid,
      department:
        form.value.department || d?.department || props.presetDepartment || null,
      deliverableId: form.value.deliverableId || null,
      playbookChapter: d?.chapter ?? props.presetPlaybookChapter ?? null,
      startDate: form.value.startDate || null,
      dueDate: form.value.dueDate || null,
      dependsOn: form.value.dependsOn,
      definitionOfDone: form.value.definitionOfDone.trim() || null,
      priority: form.value.priority || null,
      notes: form.value.notes.trim() || null,
      assignedByEmail: auth.profile?.email || auth.user?.email || null
    }
    const id = await tasks.create(payload)
    formSuccess.value = 'Task created.'
    emit('created', id)
    // Reset editable fields but preserve preset anchors (deliverable /
    // department) so the planner can assign several tasks in a row.
    form.value = {
      ...initialForm(),
      department: form.value.department,
      deliverableId: form.value.deliverableId
    }
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card space-y-3">
    <header class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
    </header>

    <p v-if="!canPlan" class="text-xs text-neutral-500">
      Only admins, Co-CEOs, and chiefs can assign tasks.
    </p>

    <template v-else>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          What needs to be done?
          <input
            v-model="form.title" type="text"
            placeholder="e.g. Finalize beanie signage"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Who owns this?
          <input
            v-model="form.ownerEmail" type="text" list="taskcreate-owner-options"
            placeholder="owner@example.com"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
          <datalist id="taskcreate-owner-options">
            <option v-for="e in rosterEmails" :key="e" :value="e" />
          </datalist>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Department
          <select
            v-model="form.department"
            :disabled="lockDepartment"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
          >
            <option value="">— Unassigned —</option>
            <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          Which deliverable does it support?
          <select
            v-model="form.deliverableId"
            :disabled="lockDeliverable"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
          >
            <option value="">— None —</option>
            <option
              v-for="d in deliverableOptions"
              :key="d.id"
              :value="d.id"
            >Ch {{ d.chapter }} · {{ d.title }}</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800">
          When should it start?
          <input
            v-model="form.startDate" type="date"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          When is it due?
          <input
            v-model="form.dueDate" type="date"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800">
          Priority
          <select
            v-model="form.priority"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="">— Unset —</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          What has to happen first? (dependencies)
          <select
            v-model="form.dependsOn"
            multiple size="4"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option
              v-for="t in dependencyCandidates"
              :key="t.id"
              :value="t.id"
            >{{ t.title }}</option>
          </select>
          <span class="mt-1 block text-xs text-neutral-500">
            Hold ⌘/Ctrl to select more than one. Leave empty if nothing blocks the start.
          </span>
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          How will we know it is done?
          <textarea
            v-model="form.definitionOfDone" rows="2"
            placeholder="Short definition of done."
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
        <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
          Notes (optional)
          <input
            v-model="form.notes" type="text"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          />
        </label>
      </div>
      <div class="flex items-center justify-between gap-2">
        <p v-if="formError" class="text-sm text-rose-600">{{ formError }}</p>
        <p v-else-if="formSuccess" class="text-sm text-emerald-700">{{ formSuccess }}</p>
        <p v-else class="text-xs text-neutral-500">
          Creates a task visible on Tasks, Timeline, the deliverable, and the department page.
        </p>
        <div class="flex gap-2">
          <button class="btn-secondary" @click="emit('cancel')">Close</button>
          <button
            class="btn-primary"
            :disabled="submitting"
            @click="submit"
          >{{ submitting ? 'Saving…' : 'Save task' }}</button>
        </div>
      </div>
    </template>
  </section>
</template>
