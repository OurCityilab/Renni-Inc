<script setup lang="ts">
definePageMeta({ layout: 'studio' })
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab" class="text-xs text-studio-700">← Back to the Lab</NuxtLink>
      <h1 class="text-lg font-semibold">Resume Wizard</h1>
      <span class="chip-draft">Coming soon</span>
    </div>

    <div class="card space-y-3 text-sm text-neutral-700">
      <p>
        The Resume Wizard will walk you through building a full resume section by section —
        contact info, summary, experience, activities, skills, and education — and the Sherpa
        will coach every bullet as you write it.
      </p>
      <div>
        <h2 class="text-sm font-semibold text-neutral-800">How Sherpa will coach your bullets</h2>
        <ul class="mt-1 list-inside list-disc space-y-1">
          <li>Start with a strong action verb — never "helped with" or "was responsible for."</li>
          <li>Say what YOU did, not what the group did.</li>
          <li>Show a result: what changed, improved, or got done.</li>
          <li>Use a number when you have one — and a [bracketed prompt] when you don't.</li>
          <li>Never invent a number, title, or result you didn't give it.</li>
          <li>Keep each bullet to one line, no first-person "I."</li>
          <li>Name the tools, systems, or skills you actually used.</li>
          <li>Match the wording to the job, school, or scholarship you're aiming at.</li>
          <li>Sound like you on your best day — credible, not inflated.</li>
        </ul>
      </div>
    </div>

    <div class="card space-y-2 text-sm">
      <h2 class="font-semibold text-neutral-800">Need resume language today?</h2>
      <p class="text-neutral-600">
        Worksheet 7 turns your brand into resume and LinkedIn language you can paste into any
        template right now.
      </p>
      <NuxtLink to="/studio/lab/personal-brand/resume-linkedin" class="btn-primary inline-block">
        Open Worksheet 7: LinkedIn / Resume Translation
      </NuxtLink>
    </div>
  </div>
</template>
