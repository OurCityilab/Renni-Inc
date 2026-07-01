<script setup lang="ts">
import { useStudioAuthStore } from '~/stores/studioAuth'

const studioAuth = useStudioAuthStore()

type TabItem = { to: string; label: string; icon: string }

const tabs: TabItem[] = [
  { to: '/studio/today', label: 'Today', icon: '☀️' },
  { to: '/studio/lab', label: 'The Lab', icon: '🧪' },
  { to: '/studio/markets', label: 'The Markets', icon: '📈' },
  { to: '/studio/portfolio', label: 'Portfolio', icon: '📁' }
]
</script>

<template>
  <!--
    Mobile-first shell for Our City Studio. Deliberately not a copy of
    Renni's app/layouts/default.vue: no top nav row, no Command Center
    branding, no chief/admin nav groups. Primary navigation is a bottom
    tab bar (thumb reach on phones); the top bar only carries identity
    and sign-out.
  -->
  <div class="flex min-h-full w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-neutral-50">
    <header class="border-b border-neutral-200 bg-white">
      <div class="mx-auto flex h-14 w-full max-w-2xl min-w-0 items-center justify-between gap-3 px-4">
        <NuxtLink to="/studio/today" class="flex min-w-0 items-center gap-2">
          <span
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-studio-600 text-sm font-bold text-white"
          >OC</span>
          <span class="truncate font-semibold">Our City Studio</span>
        </NuxtLink>
        <button v-if="studioAuth.profile" class="btn-secondary" @click="studioAuth.signOut()">
          Sign out
        </button>
      </div>
    </header>

    <main class="min-w-0 w-full max-w-full flex-1 overflow-x-hidden pb-20">
      <div class="mx-auto w-full min-w-0 max-w-2xl px-4 py-6 break-words">
        <slot />
      </div>
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div class="mx-auto grid w-full max-w-2xl grid-cols-4">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex flex-col items-center gap-0.5 py-2 text-xs text-neutral-500"
          active-class="text-studio-700 font-medium"
        >
          <span class="text-lg leading-none">{{ tab.icon }}</span>
          {{ tab.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
