<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import type { Deliverable } from '~/types/models'

const auth = useAuthStore()
const deliverables = useDeliverables()

const owned = ref<Deliverable[]>([])
const needsMyApproval = ref<Deliverable[]>([])
const loading = ref(true)

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

    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Your deliverables</h2>
        <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
        <p v-else-if="!owned.length" class="text-sm text-neutral-500">
          Nothing owned yet. Check with your chief if this looks off.
        </p>
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
