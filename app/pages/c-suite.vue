<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import type { Deliverable, Department } from '~/types/models'

definePageMeta({ middleware: ['c-suite'] })

const auth = useAuthStore()
const deliverables = useDeliverables()

const all = ref<Deliverable[]>([])
const loading = ref(true)

const gated = computed(() => auth.isChief || auth.isAdmin)

onMounted(async () => {
  if (!gated.value) {
    loading.value = false
    return
  }
  all.value = await deliverables.list()
  loading.value = false
})

const totalApproved = computed(() => all.value.filter((d) => d.status === 'approved').length)
const inReview = computed(() => all.value.filter((d) => d.status === 'in_review'))
const chaptersNotStarted = computed(() =>
  all.value.filter((d) => d.status === 'draft' && !d.submittedForReviewAt)
)

function isOverdue(d: Deliverable) {
  if (d.status === 'approved') return false
  const [y, m, day] = (d.dueDate || '').split('-').map(Number)
  if (!y || !m || !day) return false
  const due = new Date(y, m - 1, day)
  const today = new Date()
  return (
    due.getTime() <
    new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  )
}

const overdueByDept = computed(() => {
  const buckets: Record<string, Deliverable[]> = {}
  for (const d of all.value) {
    if (!isOverdue(d)) continue
    ;(buckets[d.department] ||= []).push(d)
  }
  return buckets
})

const pendingForMe = computed(() => {
  if (!auth.user) return []
  if (auth.isAdmin || auth.isCoCEO) return inReview.value
  return inReview.value.filter((d) => d.approverUid === auth.user!.uid)
})
</script>

<template>
  <section class="space-y-5">
    <header>
      <p class="text-sm text-neutral-500">Executive view</p>
      <h1 class="text-2xl font-semibold">C-Suite dashboard</h1>
    </header>

    <div v-if="!gated" class="card text-sm text-rose-700">
      This view is limited to chiefs, Co-CEOs, and the instructor.
    </div>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-4">
        <KpiCard
          label="Approved deliverables"
          :value="`${totalApproved} / ${all.length || 0}`"
          tone="good"
        />
        <KpiCard label="In review" :value="inReview.length" />
        <KpiCard
          label="Not started deliverables"
          :value="chaptersNotStarted.length"
          :tone="chaptersNotStarted.length > 0 ? 'warn' : 'default'"
        />
        <KpiCard
          label="Pending your approval"
          :value="pendingForMe.length"
          :tone="pendingForMe.length > 0 ? 'warn' : 'default'"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          to="/playbook"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Chapter rollup</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            View Playbook status →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            Chapter-level status across the whole Playbook.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/goals"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Targets</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            View Goals →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            Department targets and progress.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/pricing"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Finance · plan vs. actual</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            View Pricing →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            Projected revenue and margin reconciled against recorded pop-up sales.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/revenue"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Finance · actual</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            Pop-Up Revenue →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            Live ledger of sales and donations captured during the pop-up.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/canvas"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Strategy</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            Business Model Canvas →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            9-block canvas for Renni Inc. / House Phoenix.
          </p>
        </NuxtLink>
        <NuxtLink
          to="/timeline"
          class="card block hover:border-phoenix-300"
        >
          <p class="text-xs uppercase tracking-wide text-neutral-500">Planning</p>
          <p class="mt-1 text-sm font-medium text-neutral-900">
            Timeline Planner →
          </p>
          <p class="mt-1 text-xs text-neutral-600">
            Assign tasks in plain language; generated Gantt-style view.
          </p>
        </NuxtLink>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">Pending approvals</h2>
          <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
          <p v-else-if="!pendingForMe.length" class="text-sm text-neutral-500">
            Nothing waiting on you.
          </p>
          <div v-else class="space-y-2">
            <DeliverableRow
              v-for="d in pendingForMe"
              :key="d.id"
              :deliverable="d"
              show-department
              show-owner
            />
          </div>
        </div>

        <div class="space-y-2">
          <h2 class="text-sm font-semibold text-neutral-700">Overdue by department</h2>
          <p v-if="loading" class="text-sm text-neutral-500">Loading…</p>
          <p
            v-else-if="!Object.keys(overdueByDept).length"
            class="text-sm text-neutral-500"
          >
            Nothing overdue.
          </p>
          <div v-else class="space-y-3">
            <div
              v-for="(items, dept) in overdueByDept"
              :key="dept as string"
              class="space-y-2"
            >
              <NuxtLink
                :to="`/departments/${dept}`"
                class="text-xs font-medium uppercase tracking-wide text-phoenix-700 hover:underline"
              >
                {{ dept }} ({{ items.length }})
              </NuxtLink>
              <DeliverableRow
                v-for="d in items"
                :key="d.id"
                :deliverable="d"
                show-owner
              />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-neutral-700">Chapters not yet started</h2>
        <p v-if="!chaptersNotStarted.length" class="text-sm text-neutral-500">
          Every chapter has movement.
        </p>
        <div v-else class="grid gap-2 sm:grid-cols-2">
          <DeliverableRow
            v-for="d in chaptersNotStarted"
            :key="d.id"
            :deliverable="d"
            show-department
            show-owner
          />
        </div>
      </div>
    </template>
  </section>
</template>
