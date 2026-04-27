<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

// Grouped nav reduces cognitive load: students see the daily Work cluster
// first, then Support tools, then any role-specific Admin links. The
// dedicated "My Department" link was removed because Workbench surfaces
// the user's team for non-admins and /departments lists every team.
//
// Sprint 1A nav gating: Workbench is a planner / chief operator surface
// (it self-redirects regular members to /tasks for status updates), so
// we hide the nav entry for plain members. Chiefs, Co-CEOs, COO, and
// Admin still see it. The route itself is unchanged — only nav
// visibility — so deep links continue to work for anyone authorized.
type NavItem = { to: string; label: string; hint?: string }
type NavGroup = { label: string; items: NavItem[] }

const canSeeWorkbench = computed<boolean>(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.isChief ||
    auth.profile?.role === 'coo'
)

// Sprint 1B nav gating — keep member nav simple. The student-relevant
// reference tools (Canvas, Timeline, Goals, Pricing, Revenue, Remote
// Marketing) stay visible to everyone; the chief / planner-only
// surfaces (Presentation Readiness, Export Center) are gated to the
// same audience as Workbench so the member nav row is shorter and
// every link a member sees actually opens.
const canSeeAdvancedSupport = computed<boolean>(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.isChief ||
    auth.profile?.role === 'coo'
)

const navGroups = computed<NavGroup[]>(() => {
  const workItems: NavItem[] = [
    { to: '/', label: 'Home', hint: 'Start Your Day path + your tasks + signals' },
    { to: '/tasks', label: 'Tasks', hint: 'Your individual assignments' }
  ]
  if (canSeeWorkbench.value) {
    workItems.push({
      to: '/workbench',
      label: 'Workbench',
      hint: 'Role-aware work board (blockers, due dates)'
    })
  }
  workItems.push(
    { to: '/deliverables', label: 'Deliverables', hint: 'All Playbook chapters and their status' },
    { to: '/departments', label: 'Departments', hint: 'Per-team views with chief advisor cards' },
    { to: '/playbook', label: 'Playbook', hint: 'Chapter-level approval rollup' }
  )

  const supportItems: NavItem[] = [
    { to: '/canvas', label: 'Canvas', hint: 'Business Model Canvas (nine blocks)' },
    { to: '/timeline', label: 'Timeline', hint: 'Due dates, dependencies, May 12 / 15 / 27 backplan' },
    { to: '/goals', label: 'Goals', hint: 'Department goals (revenue, donations, brand)' },
    { to: '/pricing', label: 'Pricing', hint: 'Operational pricing scenarios — source of truth' },
    { to: '/revenue', label: 'Revenue', hint: 'Pop-up sales + donations recap' },
    { to: '/remote-marketing', label: 'Remote Marketing', hint: 'Briefs, assignments, and feedback workflow for the remote marketing class' }
  ]
  if (canSeeAdvancedSupport.value) {
    supportItems.push(
      { to: '/presentation-readiness', label: 'Presentation', hint: 'Final presentation scorecard for May 12 / 15' },
      { to: '/export-center', label: 'Export', hint: 'Snapshot exports for docs / slides / design briefs' }
    )
  }
  const groups: NavGroup[] = [
    {
      label: 'Work',
      items: workItems
    },
    {
      label: 'Support',
      items: supportItems
    }
  ]
  const adminItems: NavItem[] = []
  if (auth.isChief || auth.isAdmin)
    adminItems.push({ to: '/c-suite', label: 'C-Suite', hint: 'Leadership KPI dashboard (approvals, overdue, by department)' })
  if (auth.isChief || auth.isAdmin)
    adminItems.push({ to: '/c-suite-advisor', label: 'C-Suite Advisor', hint: 'Daily operating coach — Today\'s Moves, owner lanes, Intelligence Sync' })
  if (auth.isAdmin) adminItems.push({ to: '/team', label: 'Team', hint: 'Roster + roles' })
  if (auth.isAdmin) adminItems.push({ to: '/admin/users', label: 'Users', hint: 'Access manager — alternate approved emails, signup status' })
  if (adminItems.length) groups.push({ label: 'Admin', items: adminItems })
  return groups
})
</script>

<template>
  <!--
    Shared shell for every signed-in route. Layout fix V2:

    The header is now a two-row block. The top row carries the logo and
    the sign-out button only. The nav lives on its own full-width row
    that scrolls horizontally when there are too many items to fit.

    Why this shape: prior versions put the logo, the inline desktop
    nav, and the sign-out button into a single `flex … justify-between`
    parent. With 14+ nav items, the middle child grew past the parent's
    `max-w-6xl` and (because flex children don't shrink below their
    intrinsic content width) forced the body wider than the viewport
    on most laptop widths. `mx-auto` on the main wrapper then centered
    page content inside that over-wide body, which the user perceived
    as "main content squeezed into a far-right column" with empty
    whitespace on the left. Putting the nav on its own row removes the
    flex contention completely. `overflow-x-auto` + `whitespace-nowrap`
    keeps long nav rows usable on narrow screens.
  -->
  <div class="min-h-full flex flex-col">
    <header class="border-b border-neutral-200 bg-white">
      <div class="mx-auto w-full max-w-6xl px-4">
        <div class="flex h-14 items-center justify-between gap-3">
          <NuxtLink to="/" class="flex min-w-0 items-center gap-2">
            <span
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-phoenix-600 text-sm font-bold text-white"
            >R</span>
            <span class="truncate font-semibold">Renni Command Center</span>
          </NuxtLink>
          <div class="flex shrink-0 items-center gap-2">
            <span v-if="auth.profile" class="hidden sm:inline truncate text-xs text-neutral-600">
              {{ auth.profile.title }}
            </span>
            <button v-if="auth.user" class="btn-secondary" @click="auth.signOut()">
              Sign out
            </button>
          </div>
        </div>
        <nav
          class="-mx-4 flex items-center gap-1 overflow-x-auto border-t border-neutral-100 px-4 py-2"
          aria-label="Primary"
        >
          <template v-for="group in navGroups" :key="group.label">
            <span
              class="select-none whitespace-nowrap pl-2 pr-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400"
              :aria-label="`${group.label} navigation group`"
            >{{ group.label }}</span>
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :title="item.hint ? `${item.label} — ${item.hint}` : `${group.label} · ${item.label}`"
              class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              active-class="bg-neutral-100 text-phoenix-700"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </nav>
      </div>
    </header>
    <main class="min-w-0 flex-1">
      <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
    <footer class="border-t border-neutral-200 bg-white">
      <div class="mx-auto w-full max-w-6xl px-4 py-3 text-xs text-neutral-500 sm:px-6 lg:px-8">
        Renaissance × Renni Inc. — Command Center
      </div>
    </footer>
  </div>
</template>
