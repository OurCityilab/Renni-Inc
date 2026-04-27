<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useDeliverables } from '~/composables/useDeliverables'
import { useTasks } from '~/composables/useTasks'
import type { Deliverable, Department, Task } from '~/types/models'
import { templateStudios, getTemplateStudio } from '~/data/templateStudios'
import { taskStatusLabel } from '~/utils/taskStatus'
import { computeHomeSignals, type HomeAudience } from '~/utils/homeSignals'
import { deepLinkForTask } from '~/utils/requirementToSection'
import {
  buildMemberNextBestAction,
  pickMemberNextBest
} from '~/utils/memberNextBestAction'

const auth = useAuthStore()
const deliverables = useDeliverables()
const tasks = useTasks()

// Audience for Home signal scoping. Mirrors the Workbench scope tree.
const audience = computed<HomeAudience>(() => {
  if (auth.isAdmin) return 'admin'
  if (auth.isCoCEO) return 'coceo'
  if (auth.profile?.role === 'coo') return 'coceo'
  if (auth.isChief) return 'chief'
  return 'member'
})

const cardTone: Record<'default' | 'warn' | 'good', string> = {
  default: 'border-neutral-200 bg-white',
  warn: 'border-amber-300 bg-amber-50',
  good: 'border-emerald-300 bg-emerald-50'
}

const owned = ref<Deliverable[]>([])
const needsMyApproval = ref<Deliverable[]>([])
const loading = ref(true)

// Member-focused subscription — surfaces "Your tasks" + the member
// signal cards. Always loaded; used by every audience for member-style
// detail (a chief still has their own assigned tasks).
const myUid = computed(() => auth.user?.uid || '')
const { data: myTasks, loading: myTasksLoading } = tasks.watchByOwner(myUid.value)
const myOpenTasks = computed(() =>
  [...myTasks.value]
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1)
)
const myDept = computed<Department | null>(() => auth.profile?.department ?? null)

// Chief / Co-CEO / admin signals need company-wide tasks and deliverables.
// We always start the watchers (cheap given current volume) so the
// `audience` computed can flip without re-mounting; they're harmless for
// a member because the cards they back are not rendered for that audience.
const { data: allTasks, loading: allTasksLoading } = tasks.watchAll()
const { data: allDeliverables, loading: allDeliverablesLoading } =
  deliverables.watchList()

// Loading state the dynamic banner trusts. Member only needs their own
// tasks; chief / Co-CEO / admin need company-wide data.
const signalsLoading = computed(() => {
  if (audience.value === 'member') return myTasksLoading.value
  return myTasksLoading.value || allTasksLoading.value || allDeliverablesLoading.value
})

const homeSignals = computed(() =>
  computeHomeSignals({
    audience: audience.value,
    myUid: auth.user?.uid ?? null,
    myDept: myDept.value,
    myTasks: myTasks.value,
    allTasks: allTasks.value,
    allDeliverables: allDeliverables.value,
    studios: templateStudios
  })
)

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

// --- Sprint 1A: member-clarity additions -----------------------------
// All of the surface below is read-only and never persists. It only
// reshapes which cards a regular member sees first; chief / Co-CEO /
// COO / admin keep the existing executive layout.

// Department deep link for "Open my department" CTA. Falls back to
// the index page when the user has no department or the admin
// pseudo-department.
const myDeptHref = computed<string>(() => {
  const dept = myDept.value
  if (!dept || dept === 'admin') return '/departments'
  return `/departments/${dept}`
})

// Resolve a task to the right deep link. When the task carries a
// requirementId we can map to a section, the link lands the student
// directly in the section workspace; otherwise it falls back to the
// chapter overview, matching prior behavior.
function taskHref(t: Task): string {
  return deepLinkForTask(t) ?? '/tasks'
}

// Per-task narrative line. We use the studio's connectedOutcome to
// connect "the section you're about to open" to one of the three real
// final outputs in the project (TechTown / Playbook / Phoenix Nest)
// so the student feels the work is going somewhere real. Returns null
// when the task has no studio-backed deliverable, in which case the
// card omits the why-it-matters line.
function taskWhyItMatters(t: Task | null): string | null {
  if (!t || !t.deliverableId) return null
  const studio = getTemplateStudio(t.deliverableId)
  if (!studio) return null
  switch (studio.connectedOutcome) {
    case 'TechTown pop-up':
      return 'This helps House Phoenix get ready for TechTown.'
    case 'Phoenix Nest pitch':
      return 'This helps the Phoenix Nest carry pitch.'
    case 'Playbook':
    default:
      return 'This helps your team finish the Playbook section.'
  }
}

// Member-only "Do this next" card. The picker is purely task-shape
// based; the page layers in the deep link and the connectedOutcome
// narrative the helper deliberately doesn't know about.
const memberPick = computed(() => pickMemberNextBest(myTasks.value))
const memberCard = computed(() =>
  buildMemberNextBestAction({
    pick: memberPick.value,
    taskHref: memberPick.value.task ? taskHref(memberPick.value.task) : null,
    myDepartmentHref: myDeptHref.value,
    whyItMatters: taskWhyItMatters(memberPick.value.task)
  })
)

// Severity → tone class map. Matches the audit's unified vocabulary
// (stuck / action-today / look-at-soon / all-good) so the card reads
// the same as the C-Suite Advisor + Intelligence Sync chips will once
// the rest of the vocabulary collapse lands in Sprint 2.
const memberCardTone: Record<
  ReturnType<typeof buildMemberNextBestAction>['severity'],
  string
> = {
  'stuck': 'border-rose-300 bg-rose-50',
  'action-today': 'border-amber-300 bg-amber-50',
  'look-at-soon': 'border-sky-300 bg-sky-50',
  'all-good': 'border-emerald-300 bg-emerald-50'
}
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

    <!-- Do this next — member-only, single primary action.
         Sprint 1A: replaces the chief-flavored advisor cockpit as the
         first surface a regular student sees. Pure task-first picker
         (utils/memberNextBestAction.ts) so the card never invents a
         task and never claims success when there's nothing to do. -->
    <section
      v-if="audience === 'member' && !myTasksLoading"
      class="card space-y-2"
      :class="memberCardTone[memberCard.severity]"
    >
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-700">
          Do this next
        </p>
        <h2 class="text-base font-semibold text-neutral-900">
          {{ memberCard.headline }}
        </h2>
      </header>
      <p class="text-sm text-neutral-800">{{ memberCard.body }}</p>
      <p
        v-if="memberCard.whyItMatters"
        class="text-xs italic text-neutral-700"
      >{{ memberCard.whyItMatters }}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        <NuxtLink
          :to="memberCard.primaryAction.to"
          class="btn-primary text-sm"
        >{{ memberCard.primaryAction.label }}</NuxtLink>
        <!-- Secondary affordances for the empty-state path. The picker
             returns reason 'no-tasks' when the student has nothing
             open; we still want them to feel useful, so we offer a
             second link to Tasks alongside the My Department primary. -->
        <NuxtLink
          v-if="memberCard.reason === 'no-tasks'"
          to="/tasks"
          class="btn-secondary text-sm"
        >Open Tasks</NuxtLink>
      </div>
    </section>

    <!-- Start Your Day — onboarding orientation. Tells a new student
         the daily path in one panel so they don't have to figure out
         which surface to open first. Read-only; no Firestore writes.
         Sprint 1A: the ladder is now role-aware so a regular member is
         never routed to a chief-only surface. The chief / Co-CEO /
         COO / admin path keeps the existing executive ladder. -->
    <section class="card space-y-2 border-phoenix-200 bg-phoenix-50/30">
      <header class="space-y-0.5">
        <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-700">
          Start Your Day
        </p>
        <p class="text-sm text-neutral-800">
          A simple daily flow. Use it Monday through Friday before May 12.
        </p>
      </header>

      <!-- Member ladder. Every linked step routes only to surfaces
           regular members can actually open. Steps 3–6 are intentionally
           descriptive (no link) because they describe what the student
           does after they pick a task, not a place to navigate to. -->
      <template v-if="audience === 'member'">
        <ol class="ml-5 list-decimal space-y-0.5 text-sm text-neutral-800">
          <li>Open <NuxtLink to="/tasks" class="text-phoenix-700 hover:underline">Tasks</NuxtLink> to see what is assigned to you.</li>
          <li>If nothing is assigned yet, open <NuxtLink :to="myDeptHref" class="text-phoenix-700 hover:underline">your department</NuxtLink> and ask your chief which section to help with.</li>
          <li>Pick one task and click it — that lands you in the section where you write.</li>
          <li>Type your team's thinking in source notes, then a draft, then the final Playbook text. Add evidence if you have it.</li>
          <li>Save the section. Refresh once to confirm it stuck.</li>
          <li>Mark the task done — or mark it stuck with a short note so your team can help.</li>
        </ol>
        <p class="text-xs italic text-neutral-700">
          Do not try to do everything at once. One section at a time is fine.
        </p>
        <div class="flex flex-wrap gap-2 text-xs">
          <NuxtLink
            to="/tasks"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Tasks</NuxtLink>
          <NuxtLink
            :to="myDeptHref"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >My Department</NuxtLink>
          <NuxtLink
            to="/deliverables"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Deliverables</NuxtLink>
        </div>
      </template>

      <!-- Chief / Co-CEO / COO / admin ladder. Unchanged from prior
           release so leadership keeps the executive cockpit they
           already use. -->
      <template v-else>
        <ol class="ml-5 list-decimal space-y-0.5 text-sm text-neutral-800">
          <li>Check <NuxtLink to="/presentation-readiness" class="text-phoenix-700 hover:underline">Presentation Readiness</NuxtLink> — what's at risk for May 12 / 15.</li>
          <li>Open <NuxtLink to="/c-suite-advisor" class="text-phoenix-700 hover:underline">C-Suite Advisor</NuxtLink> — read Today's Moves.</li>
          <li>Pick one at-risk chapter from the cockpit and open it.</li>
          <li>Work one section in the section workspace.</li>
          <li>Save source notes, evidence, draft, and final text.</li>
          <li>End the day at <NuxtLink to="/export-center" class="text-phoenix-700 hover:underline">Export Center</NuxtLink> — confirm exports still match the team's work.</li>
        </ol>
        <p class="text-xs italic text-neutral-700">
          Do not try to complete everything at once. Pick the top issue, gather the
          missing evidence, and finish one section at a time.
        </p>
        <div class="flex flex-wrap gap-2 text-xs">
          <NuxtLink
            to="/presentation-readiness"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Presentation Readiness</NuxtLink>
          <NuxtLink
            to="/c-suite-advisor"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >C-Suite Advisor</NuxtLink>
          <NuxtLink
            to="/timeline"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Timeline</NuxtLink>
          <NuxtLink
            to="/export-center"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Export Center</NuxtLink>
          <NuxtLink
            to="/deliverables"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
          >Deliverables</NuxtLink>
        </div>
      </template>
    </section>

    <!-- Dynamic role-aware banner. While snapshots are still loading we
         show neutral copy so we don't briefly claim "all clear" before
         risk lands. CTA stays role-appropriate either way. -->
    <section class="rounded-md border border-phoenix-200 bg-phoenix-50 p-4">
      <template v-if="signalsLoading">
        <p class="text-sm font-semibold text-phoenix-900">
          Checking your current work…
        </p>
        <p class="mt-1 text-sm text-phoenix-900/90">
          We're loading your tasks and deliverables to surface what needs attention.
        </p>
      </template>
      <template v-else>
        <p class="text-sm font-semibold text-phoenix-900">
          {{ homeSignals.primary.headline }}
        </p>
        <p class="mt-1 text-sm text-phoenix-900/90">{{ homeSignals.primary.body }}</p>
      </template>
      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          :to="homeSignals.primaryAction.to"
          class="btn-primary text-sm"
        >{{ homeSignals.primaryAction.label }}</NuxtLink>
        <NuxtLink
          v-if="homeSignals.secondaryAction"
          :to="homeSignals.secondaryAction.to"
          class="btn-secondary text-sm"
        >{{ homeSignals.secondaryAction.label }}</NuxtLink>
      </div>
    </section>

    <!-- Today's signals: compact cards, role-scoped. Loading-aware so
         no card claims zero risk before data arrives. -->
    <section class="space-y-2">
      <header class="flex items-baseline justify-between">
        <h2 class="text-sm font-semibold text-neutral-700">Today's signals</h2>
        <span v-if="signalsLoading" class="text-xs text-neutral-500">
          Loading…
        </span>
      </header>
      <p v-if="signalsLoading" class="text-sm text-neutral-500">
        Checking your current work…
      </p>
      <div
        v-else
        class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        <NuxtLink
          v-for="card in homeSignals.cards"
          :key="card.id"
          :to="card.to"
          class="block rounded-md border p-3 hover:border-phoenix-300 transition"
          :class="cardTone[card.tone]"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {{ card.label }}
          </p>
          <p
            class="mt-1 text-2xl font-semibold"
            :class="card.tone === 'warn'
              ? 'text-amber-900'
              : card.tone === 'good'
                ? 'text-emerald-900'
                : 'text-neutral-900'"
          >{{ card.value }}</p>
          <p class="mt-1 text-xs text-neutral-600">{{ card.blurb }}</p>
        </NuxtLink>
      </div>
    </section>

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
      <p v-if="myTasksLoading" class="text-sm text-neutral-500">Loading…</p>
      <p v-else-if="!myOpenTasks.length" class="text-sm text-neutral-500">
        No open tasks assigned to you right now.
        <NuxtLink :to="myDeptHref" class="text-phoenix-700 hover:underline">
          See what your department is working on
        </NuxtLink>
        and ask your chief which section you can help with.
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
                :to="taskHref(t)"
                class="text-xs text-phoenix-700 hover:underline"
              >↳ {{ t.requirementId ? 'start writing' : 'open chapter' }}</NuxtLink>
            </div>
            <span
              class="shrink-0 rounded-full border px-2 py-0.5 text-xs"
              :class="{
                'border-neutral-300 text-neutral-600': t.status === 'not_started',
                'border-amber-300 bg-amber-50 text-amber-800': t.status === 'in_progress',
                'border-rose-300 bg-rose-50 text-rose-800': t.status === 'blocked'
              }"
            >{{ taskStatusLabel(t.status) }}</span>
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
      <!-- Workbench is a planner / chief operator surface; the page
           itself self-redirects regular members to /tasks for status
           updates. Hide the card for members so nav and Home agree
           on which surfaces a member should see. -->
      <NuxtLink
        v-if="audience !== 'member'"
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
