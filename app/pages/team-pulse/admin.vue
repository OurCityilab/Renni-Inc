<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTeamPulse } from '~/composables/useTeamPulse'
import { DEPARTMENTS, type AppUser, type Department } from '~/types/models'
import {
  buildRaterPatternFlags,
  buildTeamPulseCompanySummary,
  buildTeamPulseDepartmentSummary,
  buildTeamPulseStudentSummary
} from '~/utils/teamPulseSummary'
import { TEAM_PULSE_CALIBRATION_COPY } from '~/utils/teamPulseRubric'

definePageMeta({ middleware: ['admin'] })

const auth = useAuthStore()
const teamPulse = useTeamPulse()
const { data: cycles, loading: cyclesLoading } = teamPulse.watchCycles()

const selectedCycleId = ref('')
const adminCycleId = computed(() => (auth.isAdmin ? selectedCycleId.value : ''))
const { data: responses, loading: responsesLoading } =
  teamPulse.watchAdminResponses(adminCycleId)
const { data: summaries } = teamPulse.watchAdminSummaries(adminCycleId)

const users = ref<AppUser[]>([])
const usersLoading = ref(true)
const saveState = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')
const createState = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')
const error = ref('')

const draftTitle = ref('Team Pulse 1: Calibration Check-In')
const draftDescription = ref(TEAM_PULSE_CALIBRATION_COPY)
const draftClosesAt = ref('')
const selectedDepartments = ref<Department[]>(
  DEPARTMENTS.filter((d) => d !== 'admin') as Department[]
)

onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    users.value = snap.docs
      .map((d) => d.data() as AppUser)
      .filter((u) => u.role !== 'admin')
  } finally {
    usersLoading.value = false
  }
})

watch(
  () => cycles.value.length,
  () => {
    if (!selectedCycleId.value && cycles.value[0]) {
      selectedCycleId.value = cycles.value[0].id
    }
  },
  { immediate: true }
)

const selectedCycle = computed(() =>
  cycles.value.find((c) => c.id === selectedCycleId.value) ?? null
)

const eligibleUsers = computed(() => {
  const cycle = selectedCycle.value
  if (!cycle) return []
  const allowed = new Set(cycle.departmentsIncluded)
  return users.value.filter((u) => allowed.size === 0 || allowed.has(u.department))
})

const completion = computed(() => {
  const uniqueRaters = new Set(responses.value.map((r) => r.raterUid))
  return {
    completed: uniqueRaters.size,
    total: eligibleUsers.value.length,
    percent:
      eligibleUsers.value.length > 0
        ? Math.round((uniqueRaters.size / eligibleUsers.value.length) * 100)
        : 0
  }
})

const raterFlags = computed(() => buildRaterPatternFlags(responses.value))

async function createCycle() {
  error.value = ''
  createState.value = 'saving'
  try {
    const id = await teamPulse.createCycle({
      title: draftTitle.value,
      description: draftDescription.value,
      opensAt: null,
      closesAt: draftClosesAt.value ? new Date(draftClosesAt.value).toISOString() : null,
      departmentsIncluded: selectedDepartments.value,
      includeSelfRatings: true,
      includePeerRatings: true,
      includeLeaderRatings: true
    })
    selectedCycleId.value = id
    createState.value = 'saved'
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    createState.value = 'failed'
  }
}

async function openSelectedCycle() {
  if (!selectedCycleId.value) return
  await teamPulse.openCycle(selectedCycleId.value)
}

async function closeSelectedCycle() {
  if (!selectedCycleId.value) return
  await teamPulse.closeCycle(selectedCycleId.value)
}

async function generateSummaries() {
  const cycle = selectedCycle.value
  if (!cycle) return
  saveState.value = 'saving'
  error.value = ''
  try {
    const now = new Date().toISOString()
    const allowed = new Set(cycle.departmentsIncluded)
    const inCycleUsers = users.value.filter((u) =>
      allowed.size === 0 || allowed.has(u.department)
    )
    const departments = Array.from(
      new Set(inCycleUsers.map((u) => u.department).filter((d) => d !== 'admin'))
    ) as Department[]
    const studentSummaries = inCycleUsers.map((u) =>
      buildTeamPulseStudentSummary({
        cycleId: cycle.id,
        subjectUid: u.uid,
        subjectEmail: u.email,
        department: u.department,
        responses: responses.value,
        now
      })
    )
    const departmentSummaries = departments.map((department) =>
      buildTeamPulseDepartmentSummary({
        cycleId: cycle.id,
        department,
        responses: responses.value,
        now
      })
    )
    const companySummary = buildTeamPulseCompanySummary({
      cycleId: cycle.id,
      responses: responses.value,
      now
    })
    await teamPulse.saveSummaries([
      ...studentSummaries,
      ...departmentSummaries,
      companySummary
    ])
    await teamPulse.markSummarized(cycle.id)
    saveState.value = 'saved'
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    saveState.value = 'failed'
  }
}
</script>

<template>
  <section class="space-y-5">
    <header class="space-y-2">
      <NuxtLink to="/team-pulse" class="text-sm text-phoenix-700 hover:underline">
        Back to Team Pulse
      </NuxtLink>
      <p class="text-sm text-neutral-500">Team Pulse admin</p>
      <h1 class="text-2xl font-semibold">Calibration Check-In Admin</h1>
      <p class="max-w-3xl text-sm text-neutral-700">
        Create cycles, monitor completion, generate privacy-safe summaries, and
        review raw responses for intervention. Flags require human review.
      </p>
    </header>

    <p v-if="!auth.isAdmin" class="card text-sm text-rose-700">
      Instructor/Admin access is required for Team Pulse administration.
    </p>

    <template v-else>
      <p v-if="error" class="card text-sm text-rose-700">{{ error }}</p>

      <section class="card space-y-3">
        <h2 class="text-sm font-semibold">Create cycle</h2>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="text-sm font-medium">
            Title
            <input v-model="draftTitle" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
          <label class="text-sm font-medium">
            Closes at
            <input v-model="draftClosesAt" type="datetime-local" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
        </div>
        <label class="block text-sm font-medium">
          Description
          <textarea v-model="draftDescription" rows="3" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
        </label>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label
            v-for="department in DEPARTMENTS.filter((d) => d !== 'admin')"
            :key="department"
            class="flex items-center gap-2 text-sm"
          >
            <input v-model="selectedDepartments" type="checkbox" :value="department" />
            {{ department }}
          </label>
        </div>
        <button type="button" class="btn-primary" @click="createCycle()">
          {{ createState === 'saving' ? 'Creating...' : 'Create draft cycle' }}
        </button>
      </section>

      <section class="card space-y-3">
        <h2 class="text-sm font-semibold">Cycle control</h2>
        <p v-if="cyclesLoading" class="text-sm text-neutral-500">Loading cycles...</p>
        <template v-else>
          <label class="block text-sm font-medium">
            Cycle
            <select v-model="selectedCycleId" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm">
              <option v-for="cycle in cycles" :key="cycle.id" :value="cycle.id">
                {{ cycle.title }} - {{ cycle.status }}
              </option>
            </select>
          </label>
          <div v-if="selectedCycle" class="flex flex-wrap gap-2 text-sm">
            <button type="button" class="btn-secondary" @click="openSelectedCycle()">
              Open cycle
            </button>
            <button type="button" class="btn-secondary" @click="closeSelectedCycle()">
              Close cycle
            </button>
            <button type="button" class="btn-primary" @click="generateSummaries()">
              {{ saveState === 'saving' ? 'Generating...' : 'Generate summaries' }}
            </button>
            <NuxtLink :to="`/team-pulse/${selectedCycle.id}/summary`" class="btn-secondary">
              View summary
            </NuxtLink>
          </div>
        </template>
      </section>

      <section v-if="selectedCycle" class="grid gap-3 md:grid-cols-3">
        <div class="card">
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Completion</p>
          <p class="mt-1 text-2xl font-semibold">{{ completion.percent }}%</p>
          <p class="text-xs text-neutral-600">{{ completion.completed }} of {{ completion.total }} users submitted at least one response</p>
        </div>
        <div class="card">
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Raw responses</p>
          <p class="mt-1 text-2xl font-semibold">{{ responses.length }}</p>
          <p class="text-xs text-neutral-600">Instructor/Admin only</p>
        </div>
        <div class="card">
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Summaries</p>
          <p class="mt-1 text-2xl font-semibold">{{ summaries.length }}</p>
          <p class="text-xs text-neutral-600">Privacy-safe views for students and leaders</p>
        </div>
      </section>

      <section v-if="raterFlags.length" class="card space-y-2">
        <h2 class="text-sm font-semibold">Calibration flags</h2>
        <p class="text-xs text-neutral-500">
          These are deterministic review prompts, not consequences.
        </p>
        <ul class="space-y-2">
          <li
            v-for="row in raterFlags"
            :key="row.raterUid"
            class="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
          >
            {{ row.raterEmail }}:
            <span v-for="(flag, i) in row.flags" :key="i">
              {{ flag.reviewCopy }}<span v-if="i < row.flags.length - 1"> </span>
            </span>
          </li>
        </ul>
      </section>

      <section class="card space-y-2">
        <h2 class="text-sm font-semibold">Raw responses</h2>
        <p class="text-xs text-neutral-500">
          Admin-only intervention view. Students and chiefs do not see this table.
        </p>
        <p v-if="responsesLoading || usersLoading" class="text-sm text-neutral-500">
          Loading responses...
        </p>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-left text-xs">
            <thead class="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th class="py-2 pr-3">Rater</th>
                <th class="py-2 pr-3">Ratee</th>
                <th class="py-2 pr-3">Relationship</th>
                <th class="py-2 pr-3">Direct work</th>
                <th class="py-2 pr-3">Evidence/example</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="response in responses"
                :key="response.id"
                class="border-b border-neutral-100"
              >
                <td class="py-2 pr-3">{{ response.raterEmail }}</td>
                <td class="py-2 pr-3">{{ response.rateeEmail }}</td>
                <td class="py-2 pr-3">{{ response.relationship }}</td>
                <td class="py-2 pr-3">{{ response.directWorkLevel }}</td>
                <td class="max-w-sm py-2 pr-3">{{ response.comments.evidenceExample || 'None' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>
