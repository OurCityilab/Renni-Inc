<script setup lang="ts">
import { studioModuleLabels } from '~/utils/studioLabels'

definePageMeta({ layout: 'studio' })

// V1 ships one live Lab tool: the Brand Builder. Everything else is
// a visible-but-disabled placeholder so students can see what's
// coming without hitting a dead link.
const modules = [
  { key: 'brand-builder', to: '/studio/lab/brand-builder', enabled: true },
  { key: 'story-bank', to: null, enabled: false },
  { key: 'star-tmay', to: null, enabled: false },
  { key: 'resume', to: null, enabled: false },
  { key: 'linkedin', to: null, enabled: false },
  { key: 'pitch-builder', to: null, enabled: false }
] as const
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">The Lab</h1>
    <p class="text-sm text-neutral-600">
      Professional development tools that turn your own words into portfolio-ready pieces.
    </p>

    <div class="space-y-2">
      <NuxtLink
        v-for="mod in modules"
        :key="mod.key"
        :to="mod.enabled ? mod.to! : undefined"
        class="card flex items-center justify-between"
        :class="mod.enabled ? 'hover:border-studio-300' : 'opacity-60'"
      >
        <span class="text-sm font-medium">{{ studioModuleLabels[mod.key] }}</span>
        <span v-if="!mod.enabled" class="chip-draft">Coming soon</span>
        <span v-else class="text-studio-700 text-sm">Start →</span>
      </NuxtLink>
    </div>
  </div>
</template>
