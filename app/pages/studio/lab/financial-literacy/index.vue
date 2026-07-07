<script setup lang="ts">
import { financialLiteracyModules, getFinancialLiteracyModule } from '~/data/studio/financialLiteracyLab'
import {
  SIMULATION_WEEK_NOTE,
  SIMULATION_WEEK_TITLE,
  simulationWeekDays,
  simulationWeekPrintables
} from '~/data/studio/simulationWeekFinancialLiteracy'
import {
  PATHWAY_CAPSTONE_NOTE,
  PATHWAY_CASE_FIRST_NOTE,
  PATHWAY_CORE_PATH,
  PATHWAY_FULL_PATH,
  PATHWAY_INTRO,
  PATHWAY_TITLE,
  financialLiteracyPathway
} from '~/data/studio/financialLiteracyPathway'

definePageMeta({ layout: 'studio' })

const dayModules = (slugs: string[]) =>
  slugs.flatMap((slug) => {
    const mod = getFinancialLiteracyModule(slug)
    return mod ? [mod] : []
  })

// LIVE steps resolve to a real module route; UPCOMING steps stay unlinked.
const pathwayRoute = (slug?: string) => (slug ? getFinancialLiteracyModule(slug)?.route : undefined)
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
      <p class="mt-1 text-xs text-neutral-500">
        Start with Modules 1 and 2. One module per session is enough. Module 5 pulls your work
        together into a Money Plan.
      </p>
    </div>

    <div class="card space-y-3 border-studio-300">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-studio-700">The Pathway</p>
        <p class="text-sm font-semibold text-neutral-800">{{ PATHWAY_TITLE }}</p>
        <p class="mt-1 text-sm text-neutral-600">{{ PATHWAY_INTRO }}</p>
        <p class="mt-1 text-xs text-neutral-500">
          Two ways through: a {{ PATHWAY_CORE_PATH }}, or the full {{ PATHWAY_FULL_PATH }} with cases,
          revision, and a capstone presentation.
        </p>
        <p class="mt-1 text-xs text-neutral-500">{{ PATHWAY_CASE_FIRST_NOTE }}</p>
      </div>

      <ol class="space-y-2">
        <li
          v-for="step in financialLiteracyPathway"
          :key="step.step"
          class="rounded-md border border-neutral-200 p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-neutral-800">{{ step.step }}. {{ step.title }}</p>
            <span
              v-if="step.status === 'live'"
              class="shrink-0 rounded-full bg-studio-100 px-2 py-0.5 text-xs font-medium text-studio-700"
            >Live now</span>
            <span
              v-else
              class="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500"
            >Coming next</span>
          </div>
          <p class="text-sm text-neutral-600">{{ step.bigQuestion }}</p>
          <p class="mt-1 text-xs text-neutral-500">
            Saves: {{ step.artifact }} · About {{ step.estimatedMinutes }} minutes
          </p>
          <NuxtLink
            v-if="pathwayRoute(step.moduleSlug)"
            :to="pathwayRoute(step.moduleSlug)"
            class="text-sm text-studio-700 underline"
          >Open this checkpoint →</NuxtLink>
        </li>
      </ol>

      <p class="text-xs text-neutral-500">{{ PATHWAY_CAPSTONE_NOTE }}</p>

      <p class="text-xs text-neutral-500">
        Case materials:
        <template v-for="(p, i) in simulationWeekPrintables" :key="`pathway-${p.href}`">
          <span v-if="i > 0"> · </span>
          <a :href="p.href" target="_blank" rel="noopener" class="text-studio-700 underline">{{ p.label }}</a>
        </template>
      </p>
    </div>

    <div class="card space-y-3 border-studio-300">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-studio-700">Simulation Week</p>
        <p class="text-sm font-semibold text-neutral-800">{{ SIMULATION_WEEK_TITLE }}</p>
        <p class="mt-1 text-sm text-neutral-600">{{ SIMULATION_WEEK_NOTE }}</p>
      </div>

      <div v-for="simDay in simulationWeekDays" :key="simDay.day" class="rounded-md border border-neutral-200 p-3">
        <p class="text-xs font-medium text-studio-700">{{ simDay.day }} — {{ simDay.title }}</p>
        <p class="text-sm font-semibold text-neutral-800">Case: {{ simDay.caseTitle }}</p>
        <p class="text-sm text-neutral-600">{{ simDay.bigQuestion }}</p>
        <p class="mt-1 text-xs text-neutral-500">
          Do the case with your team first, then complete
          <template v-for="(mod, i) in dayModules(simDay.moduleSlugs)" :key="mod.slug">
            <span v-if="i > 0"> and </span>
            <NuxtLink :to="mod.route" class="text-studio-700 underline">{{ mod.title }}</NuxtLink>
          </template>
          here in Studio.
        </p>
      </div>

      <p class="text-xs text-neutral-500">
        Printables:
        <template v-for="(p, i) in simulationWeekPrintables" :key="p.href">
          <span v-if="i > 0"> · </span>
          <a :href="p.href" target="_blank" rel="noopener" class="text-studio-700 underline">{{ p.label }}</a>
        </template>
      </p>
    </div>

    <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">The five modules (your checkpoints)</p>

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
