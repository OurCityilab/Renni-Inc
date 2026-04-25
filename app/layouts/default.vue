<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

// Grouped nav reduces cognitive load: students see the daily Work cluster
// first, then Support tools, then any role-specific Admin links. The
// dedicated "My Department" link was removed because Workbench surfaces
// the user's team for non-admins and /departments lists every team.
type NavItem = { to: string; label: string }
type NavGroup = { label: string; items: NavItem[] }

const navGroups = computed<NavGroup[]>(() => {
  const groups: NavGroup[] = [
    {
      label: 'Work',
      items: [
        { to: '/', label: 'Home' },
        { to: '/tasks', label: 'Tasks' },
        { to: '/workbench', label: 'Workbench' },
        { to: '/deliverables', label: 'Deliverables' },
        { to: '/departments', label: 'Departments' },
        { to: '/playbook', label: 'Playbook' }
      ]
    },
    {
      label: 'Support',
      items: [
        { to: '/canvas', label: 'Canvas' },
        { to: '/timeline', label: 'Timeline' },
        { to: '/goals', label: 'Goals' },
        { to: '/pricing', label: 'Pricing' },
        { to: '/revenue', label: 'Revenue' }
      ]
    }
  ]
  const adminItems: NavItem[] = []
  if (auth.isChief || auth.isAdmin) adminItems.push({ to: '/c-suite', label: 'C-Suite' })
  if (auth.isAdmin) adminItems.push({ to: '/team', label: 'Team' })
  if (adminItems.length) groups.push({ label: 'Admin', items: adminItems })
  return groups
})
</script>

<template>
  <div class="min-h-full flex flex-col">
    <header class="border-b border-neutral-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span
            class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-phoenix-600 text-sm font-bold text-white"
          >R</span>
          <span class="font-semibold">Renni Command Center</span>
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-1">
          <template v-for="(group, gi) in navGroups" :key="group.label">
            <span
              v-if="gi > 0"
              aria-hidden="true"
              class="mx-1 h-5 w-px bg-neutral-200"
            />
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :title="`${group.label} · ${item.label}`"
              class="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              active-class="bg-neutral-100 text-phoenix-700"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
        </nav>
        <div class="flex items-center gap-2">
          <span v-if="auth.profile" class="hidden sm:inline text-xs text-neutral-600">
            {{ auth.profile.title }}
          </span>
          <button v-if="auth.user" class="btn-secondary" @click="auth.signOut()">
            Sign out
          </button>
        </div>
      </div>
      <nav class="md:hidden flex gap-1 overflow-x-auto border-t border-neutral-100 px-2 py-2">
        <template v-for="(group, gi) in navGroups" :key="group.label">
          <span
            v-if="gi > 0"
            aria-hidden="true"
            class="my-1 mx-1 w-px shrink-0 bg-neutral-200"
          />
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-1.5 text-sm text-neutral-700 whitespace-nowrap hover:bg-neutral-100"
            active-class="bg-neutral-100 text-phoenix-700"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>
    </header>
    <main class="flex-1">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <slot />
      </div>
    </main>
    <footer class="border-t border-neutral-200 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-3 text-xs text-neutral-500">
        Renaissance × Renni Inc. — Command Center
      </div>
    </footer>
  </div>
</template>
