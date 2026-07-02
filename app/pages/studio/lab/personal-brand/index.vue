<script setup lang="ts">
import { personalBrandWorksheets } from '~/data/studio/worksheets/personalBrandPitchLab'

definePageMeta({ layout: 'studio' })
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">Personal Brand & Pitch Lab</h1>
    <p class="text-sm text-neutral-600">
      Work through the seven worksheets in order. Fill each one out right here, ask the Sherpa
      for coaching, and turn your words into pitches, stories, resume language, and LinkedIn
      language.
    </p>

    <div class="space-y-2">
      <div v-for="ws in personalBrandWorksheets" :key="ws.id" class="card space-y-2">
        <div>
          <p class="text-sm font-semibold text-neutral-800">
            Worksheet {{ ws.number }}: {{ ws.title }}
          </p>
          <p class="mt-0.5 text-sm text-neutral-600">{{ ws.description }}</p>
        </div>
        <NuxtLink :to="ws.route" class="btn-primary inline-block">Start / Continue</NuxtLink>
        <p class="text-xs text-neutral-500">
          Prefer paper?
          <a :href="ws.pdfHref" target="_blank" rel="noopener" class="underline">
            View the original PDF
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
