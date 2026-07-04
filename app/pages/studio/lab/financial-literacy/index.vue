<script setup lang="ts">
import { financialLiteracyModules } from '~/data/studio/financialLiteracyLab'

definePageMeta({ layout: 'studio' })
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab" class="text-xs text-studio-700">← The Lab</NuxtLink>
      <h1 class="text-lg font-semibold">Financial Literacy Lab</h1>
      <p class="text-sm text-neutral-600">
        Real numbers, your choices. Work through five short modules — paychecks, budgets,
        credit, housing — and finish with a money plan that's yours.
      </p>
    </div>

    <NuxtLink
      v-for="mod in financialLiteracyModules"
      :key="mod.slug"
      :to="mod.route"
      class="card block space-y-1 hover:border-studio-300"
    >
      <p class="text-sm font-semibold text-neutral-800">{{ mod.number }}. {{ mod.title }}</p>
      <p class="text-sm text-neutral-600">{{ mod.tagline }}</p>
      <p class="text-xs text-neutral-500">About {{ mod.estimatedMinutes }} minutes</p>
      <span class="text-sm text-studio-700">Open module →</span>
    </NuxtLink>

    <p class="text-xs text-neutral-500">
      The calculators in these modules are learning tools that use rounded estimates — they are
      not financial advice. Your answers save as drafts that belong to you.
    </p>
  </div>
</template>
