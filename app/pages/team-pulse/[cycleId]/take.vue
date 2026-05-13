<script setup lang="ts">
import { collection, getDocs } from 'firebase/firestore'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useTeamPulse } from '~/composables/useTeamPulse'
import type {
  AppUser,
  DirectWorkLevel,
  TeamPulseComments,
  TeamPulseLeadershipRatings,
  TeamPulseRatings,
  TeamPulseRelationship
} from '~/types/models'
import {
  TEAM_PULSE_CALIBRATION_COPY,
  TEAM_PULSE_DIMENSIONS,
  TEAM_PULSE_DIRECT_WORK_HELP,
  TEAM_PULSE_DIRECT_WORK_LABELS,
  TEAM_PULSE_LEADERSHIP_DIMENSIONS,
  TEAM_PULSE_RATING_ANCHORS,
  isRateableDirectWork,
  ratingHasExtremeScore
} from '~/utils/teamPulseRubric'
import {
  isTeamPulseAdminTakeUser,
  resolveTeamPulseTakeTargets
} from '~/utils/teamPulseTargets'

type LocalForm = {
  directWorkLevel: DirectWorkLevel
  ratings: TeamPulseRatings
  leadershipRatings: TeamPulseLeadershipRatings
  comments: TeamPulseComments
}

const route = useRoute()
const cycleId = computed(() => String(route.params.cycleId))
const auth = useAuthStore()
const teamPulse = useTeamPulse()
const { data: cycle, loading: cycleLoading } = teamPulse.watchCycle(cycleId.value)
const { data: myResponses } = teamPulse.watchMyResponses(cycleId.value)

const users = ref<AppUser[]>([])
const usersLoading = ref(true)
const formByUid = reactive<Record<string, LocalForm>>({})
const savingUid = ref<string | null>(null)
const rowError = ref<Record<string, string>>({})
const rowSaved = ref<Record<string, boolean>>({})

onMounted(async () => {
  try {
    const snap = await getDocs(collection(useNuxtApp().$firebase.db, 'users'))
    users.value = snap.docs
      .map((d) => d.data() as AppUser)
      .filter((u) => u.role !== 'admin')
      .sort((a, b) => {
        if (a.department !== b.department) return a.department.localeCompare(b.department)
        return (a.displayName || a.email).localeCompare(b.displayName || b.email)
      })
  } finally {
    usersLoading.value = false
  }
})

function defaultForm(): LocalForm {
  return {
    directWorkLevel: 'some',
    ratings: {
      contribution: 3,
      reliability: 3,
      communication: 3,
      qualityStandard: 3,
      teamSupportLeadership: 3
    },
    leadershipRatings: {
      clearDirection: 3,
      fairDelegation: 3,
      followUpAccountability: 3,
      respectfulCommunication: 3,
      helpWhenStuck: 3
    },
    comments: {
      strength: '',
      improvement: '',
      supportNeeded: '',
      evidenceExample: ''
    }
  }
}

const currentUserProfile = computed<AppUser | null>(() => {
  if (!auth.user || !auth.profile) return null
  return {
    uid: auth.user.uid,
    email: auth.profile.email,
    displayName: auth.profile.displayName,
    role: auth.profile.role,
    title: auth.profile.title,
    department: auth.profile.department,
    isChief: auth.profile.isChief,
    createdAt: auth.profile.createdAt
  }
})

const visibleRatees = computed(() => {
  const profile = currentUserProfile.value
  return resolveTeamPulseTakeTargets({
    cycle: cycle.value,
    currentUser: profile,
    users: users.value
  }).targets
})

const targetDiagnostics = computed(() =>
  resolveTeamPulseTakeTargets({
    cycle: cycle.value,
    currentUser: currentUserProfile.value,
    users: users.value
  })
)

const isAdminTakeUser = computed(() => isTeamPulseAdminTakeUser(currentUserProfile.value))

const cycleDepartmentLabel = computed(() => {
  const departments = cycle.value?.departmentsIncluded ?? []
  return departments.length ? departments.join(', ') : 'All departments'
})

const noLeaderFound = computed(() =>
  Boolean(
    cycle.value?.includeLeaderRatings &&
      currentUserProfile.value &&
      !currentUserProfile.value.isChief &&
      targetDiagnostics.value.currentUserDepartmentIncluded &&
      targetDiagnostics.value.leaderCount === 0
  )
)

watch(
  () => [visibleRatees.value.map((u) => u.uid).join('|'), myResponses.value.length],
  () => {
    for (const u of visibleRatees.value) {
      if (!formByUid[u.uid]) formByUid[u.uid] = defaultForm()
      const existing = myResponses.value.find((r) => r.rateeUid === u.uid)
      if (existing) {
        formByUid[u.uid] = {
          directWorkLevel: existing.directWorkLevel,
          ratings: existing.ratings ?? defaultForm().ratings,
          leadershipRatings: existing.leadershipRatings ?? defaultForm().leadershipRatings,
          comments: existing.comments
        }
      }
    }
  },
  { immediate: true }
)

function relationshipFor(ratee: AppUser): TeamPulseRelationship {
  const profile = currentUserProfile.value
  if (!profile || profile.uid === ratee.uid) return 'self'
  if (ratee.isChief) return 'direct_report'
  if (profile.isChief) return 'leader'
  return 'peer'
}

function usesLeadershipRatings(ratee: AppUser): boolean {
  return relationshipFor(ratee) === 'direct_report'
}

function validateForm(ratee: AppUser, form: LocalForm): string | null {
  const rateable = isRateableDirectWork(form.directWorkLevel)
  if (!rateable) return null
  const ratings = usesLeadershipRatings(ratee) ? form.leadershipRatings : form.ratings
  const values = Object.values(ratings)
  if (values.some((v) => typeof v !== 'number' || v < 1 || v > 5)) {
    return 'Choose a rating from 1 to 5 for every dimension, or choose not enough direct work to rate.'
  }
  if (ratingHasExtremeScore(ratings) && !form.comments.evidenceExample.trim()) {
    return 'A score of 1 or 5 needs a specific evidence/example comment.'
  }
  return null
}

async function saveFor(ratee: AppUser) {
  const profile = currentUserProfile.value
  const form = formByUid[ratee.uid]
  if (!profile || !auth.user || !form) return
  rowError.value[ratee.uid] = ''
  rowSaved.value[ratee.uid] = false
  const validation = validateForm(ratee, form)
  if (validation) {
    rowError.value[ratee.uid] = validation
    return
  }
  savingUid.value = ratee.uid
  try {
    const rateable = isRateableDirectWork(form.directWorkLevel)
    await teamPulse.submitResponse({
      cycleId: cycleId.value,
      raterUid: profile.uid,
      raterEmail: profile.email,
      raterRole: profile.role,
      raterDepartment: profile.department,
      rateeUid: ratee.uid,
      rateeEmail: ratee.email,
      rateeRole: ratee.role,
      rateeDepartment: ratee.department,
      relationship: relationshipFor(ratee),
      directWorkLevel: form.directWorkLevel,
      ...(rateable && !usesLeadershipRatings(ratee) ? { ratings: form.ratings } : {}),
      ...(rateable && usesLeadershipRatings(ratee)
        ? { leadershipRatings: form.leadershipRatings }
        : {}),
      comments: {
        strength: form.comments.strength.trim(),
        improvement: form.comments.improvement.trim(),
        supportNeeded: form.comments.supportNeeded.trim(),
        evidenceExample: form.comments.evidenceExample.trim()
      }
    })
    rowSaved.value[ratee.uid] = true
  } catch (err) {
    rowError.value[ratee.uid] = err instanceof Error ? err.message : String(err)
  } finally {
    savingUid.value = null
  }
}
</script>

<template>
  <section class="space-y-5">
    <header class="space-y-2">
      <NuxtLink to="/team-pulse" class="text-sm text-phoenix-700 hover:underline">
        Back to Team Pulse
      </NuxtLink>
      <p class="text-sm text-neutral-500">Team Pulse</p>
      <h1 class="text-2xl font-semibold">{{ cycle?.title || 'Calibration Check-In' }}</h1>
      <p class="max-w-3xl text-sm leading-relaxed text-neutral-700">
        {{ TEAM_PULSE_CALIBRATION_COPY }}
      </p>
    </header>

    <p v-if="cycleLoading || usersLoading" class="text-sm text-neutral-500">
      Loading Team Pulse form...
    </p>
    <p v-else-if="!cycle" class="card text-sm text-rose-700">
      Team Pulse cycle not found.
    </p>
    <p v-else-if="cycle.status !== 'open'" class="card text-sm text-amber-800">
      This Team Pulse cycle is {{ cycle.status }}. Responses can only be edited while the cycle is open.
    </p>
    <template v-else-if="isAdminTakeUser">
      <section class="card space-y-4">
        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-900">Instructor/admin view</h2>
          <p class="text-sm text-neutral-700">
            You are logged in as an instructor/admin. Use the Team Pulse admin page to monitor responses, generate summaries, and review results. To test the student form, log in as a student account.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/team-pulse" class="btn-secondary">
            Back to Team Pulse
          </NuxtLink>
          <NuxtLink to="/team-pulse/admin" class="btn-primary">
            Open Team Pulse Admin
          </NuxtLink>
        </div>
      </section>
    </template>
    <template v-else>
      <section class="card space-y-2">
        <h2 class="text-sm font-semibold">How to answer</h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>Start with direct-work confidence. If you did not work closely with someone, choose not enough direct work to rate.</li>
          <li>Use examples from behavior and work products. Do not judge personality or intent.</li>
          <li>A score of 1 or 5 requires a specific evidence/example comment.</li>
          <li>V1 uses same-department teammate ratings only.</li>
        </ul>
      </section>

      <p v-if="noLeaderFound" class="card text-sm text-amber-800">
        No department leader was found for your roster department.
      </p>

      <section v-if="visibleRatees.length === 0" class="card space-y-3">
        <div class="space-y-1">
          <h2 class="text-sm font-semibold text-neutral-900">No teammates available</h2>
          <p class="text-sm text-neutral-700">
            No teammates are available to rate yet. This usually means the roster department or Team Pulse cycle departments need to be checked.
          </p>
        </div>
        <dl class="grid gap-2 text-sm sm:grid-cols-2">
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your department</dt>
            <dd class="mt-1 text-neutral-800">{{ currentUserProfile?.department || 'Unknown' }}</dd>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Cycle departments</dt>
            <dd class="mt-1 text-neutral-800">{{ cycleDepartmentLabel }}</dd>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Self-rating enabled</dt>
            <dd class="mt-1 text-neutral-800">{{ cycle.includeSelfRatings ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Peer-rating enabled</dt>
            <dd class="mt-1 text-neutral-800">{{ cycle.includePeerRatings ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Leader-rating enabled</dt>
            <dd class="mt-1 text-neutral-800">{{ cycle.includeLeaderRatings ? 'Yes' : 'No' }}</dd>
          </div>
          <div class="rounded border border-neutral-200 p-2">
            <dt class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your department included</dt>
            <dd class="mt-1 text-neutral-800">{{ targetDiagnostics.currentUserDepartmentIncluded ? 'Yes' : 'No' }}</dd>
          </div>
        </dl>
      </section>

      <article
        v-for="ratee in visibleRatees"
        :key="ratee.uid"
        class="card space-y-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-neutral-900">
              {{ ratee.displayName || ratee.email }}
              <span v-if="ratee.uid === auth.user?.uid" class="text-xs text-neutral-500">(self)</span>
            </h2>
            <p class="text-xs text-neutral-500">
              {{ ratee.title }} · {{ ratee.department }}
            </p>
          </div>
          <span class="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600">
            {{ relationshipFor(ratee).replace('_', ' ') }}
          </span>
        </div>

        <label class="block text-sm font-medium text-neutral-800">
          Direct-work confidence
          <select
            v-model="formByUid[ratee.uid].directWorkLevel"
            class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
          >
            <option value="none">{{ TEAM_PULSE_DIRECT_WORK_LABELS.none }}</option>
            <option value="little">{{ TEAM_PULSE_DIRECT_WORK_LABELS.little }}</option>
            <option value="some">{{ TEAM_PULSE_DIRECT_WORK_LABELS.some }}</option>
            <option value="a_lot">{{ TEAM_PULSE_DIRECT_WORK_LABELS.a_lot }}</option>
          </select>
          <span class="mt-1 block text-xs font-normal text-neutral-500">
            {{ TEAM_PULSE_DIRECT_WORK_HELP[formByUid[ratee.uid].directWorkLevel] }}
          </span>
        </label>

        <div
          v-if="isRateableDirectWork(formByUid[ratee.uid].directWorkLevel) && usesLeadershipRatings(ratee)"
          class="grid gap-3 md:grid-cols-2"
        >
          <label
            v-for="dim in TEAM_PULSE_LEADERSHIP_DIMENSIONS"
            :key="dim.key"
            class="rounded border border-neutral-200 p-3 text-sm"
          >
            <span class="font-medium text-neutral-900">{{ dim.label }}</span>
            <span class="mt-1 block text-xs text-neutral-500">{{ dim.description }}</span>
            <select
              v-model.number="formByUid[ratee.uid].leadershipRatings[dim.key]"
              class="mt-2 w-full rounded border border-neutral-300 p-2 text-sm"
            >
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">
                {{ n }} - {{ TEAM_PULSE_RATING_ANCHORS[n] }}
              </option>
            </select>
          </label>
        </div>

        <div
          v-else-if="isRateableDirectWork(formByUid[ratee.uid].directWorkLevel)"
          class="grid gap-3 md:grid-cols-2"
        >
          <label
            v-for="dim in TEAM_PULSE_DIMENSIONS"
            :key="dim.key"
            class="rounded border border-neutral-200 p-3 text-sm"
          >
            <span class="font-medium text-neutral-900">{{ dim.label }}</span>
            <span class="mt-1 block text-xs text-neutral-500">{{ dim.description }}</span>
            <select
              v-model.number="formByUid[ratee.uid].ratings[dim.key]"
              class="mt-2 w-full rounded border border-neutral-300 p-2 text-sm"
            >
              <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">
                {{ n }} - {{ TEAM_PULSE_RATING_ANCHORS[n] }}
              </option>
            </select>
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="text-sm font-medium text-neutral-800">
            Strength
            <textarea v-model="formByUid[ratee.uid].comments.strength" rows="2" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
          <label class="text-sm font-medium text-neutral-800">
            Growth area
            <textarea v-model="formByUid[ratee.uid].comments.improvement" rows="2" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
          <label class="text-sm font-medium text-neutral-800">
            Support needed
            <textarea v-model="formByUid[ratee.uid].comments.supportNeeded" rows="2" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
          <label class="text-sm font-medium text-neutral-800">
            Evidence/example
            <textarea v-model="formByUid[ratee.uid].comments.evidenceExample" rows="2" class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm" />
          </label>
        </div>

        <p v-if="rowError[ratee.uid]" class="text-sm text-rose-700">
          {{ rowError[ratee.uid] }}
        </p>
        <p v-if="rowSaved[ratee.uid]" class="text-sm text-emerald-700">
          Saved.
        </p>
        <button
          type="button"
          class="btn-primary"
          :disabled="savingUid === ratee.uid"
          @click="saveFor(ratee)"
        >
          {{ savingUid === ratee.uid ? 'Saving...' : 'Save response' }}
        </button>
      </article>
    </template>
  </section>
</template>
