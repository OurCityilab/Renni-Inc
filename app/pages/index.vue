<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import type { Deliverable, Department } from '~/types/models'

const auth = useAuthStore()
const deliverables = useDeliverables()
const tasks = useTasks()

const owned = ref<Deliverable[]>([])
const needsMyApproval = ref<Deliverable[]>([])
const loading = ref(true)

// Member-focused: surface the tasks the signed-in student owns so Home
// answers "what should I do next?" without bouncing through the nav.
const myUid = computed(() => auth.user?.uid || '')
const { data: myTasks, loading: tasksLoading } = tasks.watchByOwner(myUid.value)
const myOpenTasks = computed(() =>
  [...myTasks.value]
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1)
)
const myDept = computed<Department | null>(() => auth.profile?.department ?? null)

onMounted(async () => {
  if (!auth.user) return
  try {
    const [mine, toReview] = await Promise.all([
      deliverables.list({ ownerUid: auth.user.uid }),
      deliverables.list({ approverUid: auth.user.uid, status: 'in_review' })
    ])
    owned.value = mine
    needsMyApproval.value = toReview
  } finally {
    loading.value = false
  }
})

const myPending = computed(() =>
  owned.value.filter((d) => d.status === 'draft' || d.status === 'needs_revision')
)
const myInReview = computed(() => owned.value.filter((d) => d.status === 'in_review'))
const myApproved = computed(() => owned.value.filter((d) => d.status === 'approved'))
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-sm text-neutral-500">Welcome back</p>
      <h1 class="text-2xl font-semibold">
        {{ auth.profile?.displayName || auth.user?.email }}
      </h1>
      <p class="text-sm text-neutral-600">
        {{ auth.profile?.title }} · {{ auth.profile?.department }}
      </p>
    </header>

    <div class="grid gap-3 sm:grid-cols-3">
      <KpiCard
        label="In progress"
        :value="myPending.length"
        hint="Drafts or needs revision"
      />
      <KpiCard label="With approver" :value="myInReview.length" />
      <KpiCard
        label="Pending your approval"
        :value="needsMyApproval.length"
        :tone="needsMyApproval.length > 0 ? 'warn' : 'default'"
      />
    </div>

    <!-- Your tasks first: answers "what should I do next?" without requiring
         students to discover /tasks or /workbench via the nav. -->
    <div class="space-y-2">
      <header class="flex items-baseline justify-between">
        <h2 class="text-sm font-semibold text-neutral-700">Your tasks</h2>
        <NuxtLink to="/tasks" class="text-xs text-phoenix-700 hover:underline">
          Open Tasks →
        </NuxtLink>
      </header>
      <p v-if="tasksLoading" class="text-sm text-neutral-500">Loading…</p>
      <p v-else-if="!myOpenTasks.length" class="text-sm text-neutral-500">
        No open tasks assigned to you right now.
        <NuxtLink to="/workbench" class="text-phoenix-700 hover:underline">
          See the Workbench
        </NuxtLink>
        for department work, or ask your chief to assign a task.
      </p>
      <ul v-else class="space-y-1">
        <li
          v-for="t in myOpenTasks.slice(0, 5)"
          :key="t.id"
          class="rounded-md border border-neutral-200 p-2 text-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="font-medium text-neutral-900 truncate">{{ t.title }}</p>
              <p class="text-xs text-neutral-500">
                <span v-if="t.dueDate">Due {{ t.dueDate }}</span>
                <span v-else>No due date</span>
                <span v-if="t.department"> · {{ t.department }}</span>
              </p>
              <NuxtLink
                v-if="t.deliverableId"
                :to="`/deliverables/${t.deliverableId}`"
                class="text-xs text-phoenix-700 hover:underline"
              >↳ open deliverable</NuxtLink>
            </div>
            <span
              class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
              :class="{
                'border-neutral-300 text-neutral-600': t.status === 'not_started',
                'border-amber-300 bg-amber-50 text-amber-800': t.status === 'in_progress',
                'border-rose-300 bg-rose-50 text-rose-800': t.status === 'blocked'
              }"
            >{{ t.status }}</span>
          </div>
        </li>
        <li v-if="myOpenTasks.length > 5" class="text-xs text-neutral-500">
          …and {{ myOpenTasks.length - 5 }} more on
          <NuxtLink to="/tasks" class="text-phoenix-700 hover:underline">Tasks</NuxtLink>.
        </li>
      </ul>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Your deliverables</h2>
        <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
        <div v-else-if="!owned.length" class="text-sm text-neutral-500">
          <p>You don't own any deliverables — most students contribute through tasks, not deliverable ownership.</p>
          <p class="mt-1">
            <NuxtLink
              v-if="myDept"
              :to="`/departments/${myDept}`"
              class="text-phoenix-700 hover:underline"
            >See what your department owns →</NuxtLink>
            <NuxtLink
              v-else
              to="/departments"
              class="text-phoenix-700 hover:underline"
            >Browse departments →</NuxtLink>
          </p>
        </div>
        <div v-else class="space-y-2">
          <DeliverableRow
            v-for="d in owned"
            :key="d.id"
            :deliverable="d"
          />
        </div>
      </div>

      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Waiting for your approval</h2>
        <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
        <p v-else-if="!needsMyApproval.length" class="text-sm text-neutral-500">
          Nothing in your review queue.
        </p>
        <div v-else class="space-y-2">
          <DeliverableRow
            v-for="d in needsMyApproval"
            :key="d.id"
            :deliverable="d"
            show-owner
          />
        </div>
      </div>
    </div>

    <ApprovalRubric />

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        to="/playbook"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Chapter status</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          View Playbook status →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Every chapter's approval progress, rolled up from its deliverables.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/goals"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Targets</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          View Goals →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Department targets: revenue, donations, inventory, brand readiness, and more.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/pricing"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Finance · plan vs. actual</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          View Pricing →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Per-product projections reconciled against live pop-up sales and donations.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/revenue"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Finance · actual</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          Pop-Up Revenue →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Record sales and donations as they happen; track toward the donation goal.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/departments"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Teams</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          Departments →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          See who's on each team, what they own, and what's due next.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/workbench"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">My board</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          Workbench →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Role-aware board: blockers, due dates, and work you can assign.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/canvas"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Strategy</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          Business Model Canvas →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Nine blocks describing how Renni Inc. and House Phoenix deliver value.
        </p>
      </NuxtLink>
      <NuxtLink
        to="/timeline"
        class="card group block hover:border-phoenix-300"
      >
        <p class="text-xs uppercase tracking-wide text-neutral-500">Planning</p>
        <p class="mt-1 text-sm font-medium text-neutral-900">
          Timeline Planner →
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Plain-language task assignment with a generated Gantt-style dashboard.
        </p>
      </NuxtLink>
    </div>

    <p v-if="myApproved.length" class="text-xs text-emerald-700">
      {{ myApproved.length }} of your deliverables already approved.
    </p>
  </section>
</template>
