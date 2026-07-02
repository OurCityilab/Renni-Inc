<script setup lang="ts">
definePageMeta({ layout: 'studio' })
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">The Lab</h1>
    <p class="text-sm text-neutral-600">
      Professional development tools that turn your own words into portfolio-ready pieces.
    </p>

    <NuxtLink to="/studio/lab/personal-brand" class="card block space-y-2 hover:border-studio-300">
      <p class="text-sm font-semibold text-neutral-800">Personal Brand & Pitch Lab</p>
      <p class="text-sm text-neutral-600">
        Complete your worksheets, get Sherpa coaching, and turn your words into pitches,
        stories, resume language, and LinkedIn language.
      </p>
      <span class="btn-primary inline-block">Open Lab</span>
    </NuxtLink>

    <NuxtLink to="/studio/lab/brand-builder" class="card block space-y-1 hover:border-studio-300">
      <p class="text-sm font-medium text-neutral-800">Personal Brand Builder (all-in-one)</p>
      <p class="text-xs text-neutral-600">
        The single-page version: answer ten steps in one sitting and get Sherpa feedback at the
        end.
      </p>
      <span class="text-sm text-studio-700">Start →</span>
    </NuxtLink>

    <NuxtLink to="/studio/lab/resume-builder" class="card block space-y-1 hover:border-studio-300">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-neutral-800">Resume Wizard</p>
        <span class="chip-draft">Coming soon</span>
      </div>
      <p class="text-xs text-neutral-600">
        A guided, section-by-section resume builder with Sherpa coaching on every bullet.
      </p>
    </NuxtLink>

    <NuxtLink
      to="/studio/lab/personal-brand/resume-linkedin"
      class="card block space-y-1 hover:border-studio-300"
    >
      <p class="text-sm font-medium text-neutral-800">LinkedIn Wizard</p>
      <p class="text-xs text-neutral-600">
        For now, Worksheet 7 gets you a LinkedIn headline and resume summary in your own words.
      </p>
      <span class="text-sm text-studio-700">Open Worksheet 7 →</span>
    </NuxtLink>
  </div>
</template>
