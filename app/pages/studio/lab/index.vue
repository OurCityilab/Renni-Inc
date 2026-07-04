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

    <NuxtLink
      to="/studio/lab/financial-literacy"
      class="card block space-y-2 hover:border-studio-300"
    >
      <p class="text-sm font-semibold text-neutral-800">Financial Literacy Lab</p>
      <p class="text-sm text-neutral-600">
        Paychecks, budgets, credit, and housing — five short modules with real calculators,
        ending in a money plan you own.
      </p>
      <span class="btn-primary inline-block">Open Financial Literacy Lab</span>
    </NuxtLink>

    <NuxtLink to="/studio/lab/resume-builder" class="card block space-y-2 hover:border-studio-300">
      <p class="text-sm font-semibold text-neutral-800">Resume Builder</p>
      <p class="text-sm text-neutral-600">
        Fill in your experience, projects, and skills, and the Sherpa builds a full resume draft
        in your own words — with prompts for the numbers and results only you can add.
      </p>
      <span class="btn-primary inline-block">Open Resume Builder</span>
    </NuxtLink>

    <NuxtLink to="/studio/lab/linkedin-builder" class="card block space-y-2 hover:border-studio-300">
      <p class="text-sm font-semibold text-neutral-800">LinkedIn Builder</p>
      <p class="text-sm text-neutral-600">
        Turn your brand work into a LinkedIn headline, About section, skills list, and
        connection intro.
      </p>
      <span class="btn-primary inline-block">Open LinkedIn Builder</span>
    </NuxtLink>

    <NuxtLink to="/studio/lab/brand-builder" class="card block space-y-1 hover:border-studio-300">
      <p class="text-sm font-medium text-neutral-800">Brand Builder (all-in-one)</p>
      <p class="text-xs text-neutral-600">
        Fallback: the single-page version of the Personal Brand & Pitch Lab. Answer ten steps in
        one sitting and get Sherpa feedback at the end.
      </p>
      <span class="text-sm text-studio-700">Open All-in-One Brand Builder →</span>
    </NuxtLink>
  </div>
</template>
