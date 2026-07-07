<script setup lang="ts">
import { reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'

definePageMeta({ layout: 'studio' })

// Costs that can quietly eat into what a job actually pays.
const workCostOptions = ['None', 'A little', 'A lot']
const workCostItems = [
  { key: 'costTransportation', label: 'Transportation to work' },
  { key: 'costFood', label: 'Food while working' },
  { key: 'costClothing', label: 'Clothing / uniform' },
  { key: 'costTools', label: 'Tools / supplies' },
  { key: 'costSchedule', label: 'Schedule conflicts (school, family)' }
] as const

// Benefits students should learn to weigh, not just hourly pay.
const benefitOptions = ['Very important', 'Somewhat', 'Not now']
const benefitItems = [
  { key: 'benefitHealth', label: 'Health benefits' },
  { key: 'benefitRetirement', label: 'Retirement savings' },
  { key: 'benefitPto', label: 'Paid time off' },
  { key: 'benefitTraining', label: 'Training / advancement' },
  { key: 'benefitSchedule', label: 'Schedule stability' }
] as const

const answers = reactive<Record<string, string>>({
  // Activity 1 — job offer comparison
  jobChoice: '',
  jobReason: '',
  // Activity 2 — work cost check
  ...Object.fromEntries(workCostItems.map((i) => [i.key, ''])),
  // Activity 3 — W-2 vs 1099 reflection
  steadyVsHustle: '',
  taxSetAside: '',
  // Activity 4 — benefits awareness
  ...Object.fromEntries(benefitItems.map((i) => [i.key, ''])),
  // Activity 5 — side hustle reality check
  hustleIdea: '',
  hustleRevenue: '',
  hustleCosts: '',
  hustleTimeRisk: '',
  // Activity 6 — career ladder
  skillCredential: '',
  skillCost: '',
  skillUnlocks: '',
  // Activity 7 — work & income strategy
  incomeStrategy: ''
})

const draft = useFinancialLiteracyDraft('work-career-money', answers)
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Work, Taxes, Benefits &amp; Career Money</h1>
      <p class="text-sm text-neutral-600">
        The pay rate is only part of the story. What a job really gives you depends on its costs,
        its benefits, its taxes, and where it can lead. This module connects your money to your
        work choices — so you can compare offers like someone who sees the whole picture.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-2 border-studio-300">
      <p class="text-xs font-medium uppercase tracking-wide text-studio-700">Big question</p>
      <p class="text-sm font-semibold text-neutral-800">
        How do jobs, benefits, taxes, and career choices affect my money?
      </p>
      <div class="border-t border-neutral-200 pt-2">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Why this matters</p>
        <p class="mt-1 text-sm text-neutral-600">
          A job that pays $2 more an hour but costs you an extra hour of travel and a car full of
          gas might leave you with less. Benefits, taxes, and skills change the real value of
          work. Learning to see that now means better choices — and more money kept — later.
        </p>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 1 — Job offer comparison</p>
      <p class="text-xs text-neutral-600">
        <strong>Job A:</strong> higher hourly pay, but longer travel and less predictable hours.<br>
        <strong>Job B:</strong> lower hourly pay, but a stable schedule and it's close to home.
      </p>
      <StudioWorksheetField
        v-model="answers.jobChoice"
        label="Which job would you take — A or B?"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.jobReason"
        label="Why? What made the difference for you?"
        :rows="3"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 2 — Work cost check</p>
      <p class="text-xs text-neutral-600">How much does each of these cost you to hold a job?</p>
      <div class="space-y-2">
        <label
          v-for="item in workCostItems"
          :key="item.key"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-neutral-800">{{ item.label }}</span>
          <select
            v-model="answers[item.key]"
            class="w-32 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Choose…</option>
            <option v-for="opt in workCostOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 3 — Steady paycheck vs. self-employed</p>
      <p class="text-xs text-neutral-600">
        A W-2 job takes taxes out for you. With 1099 / side-hustle income, taxes are your job to
        set aside.
      </p>
      <StudioWorksheetField
        v-model="answers.steadyVsHustle"
        label="Would you rather have a steady paycheck or run your own income? Why?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.taxSetAside"
        label="If you earned $100 from a side hustle, about how much would you set aside for taxes?"
        :rows="1"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 4 — Benefits awareness</p>
      <p class="text-xs text-neutral-600">How much does each of these matter to you right now?</p>
      <div class="space-y-2">
        <label
          v-for="item in benefitItems"
          :key="item.key"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-neutral-800">{{ item.label }}</span>
          <select
            v-model="answers[item.key]"
            class="w-40 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Choose…</option>
            <option v-for="opt in benefitOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 5 — Side hustle reality check</p>
      <StudioWorksheetField
        v-model="answers.hustleIdea"
        label="A side hustle I could realistically try is…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.hustleRevenue"
        label="What could it bring in?"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.hustleCosts"
        label="What would it cost to run?"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.hustleTimeRisk"
        label="How much time and risk does it take — and is the profit worth it?"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 6 — Career ladder</p>
      <StudioWorksheetField
        v-model="answers.skillCredential"
        label="One skill or credential that could raise my income is…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.skillCost"
        label="What would it cost (money, time) to get it?"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.skillUnlocks"
        label="What could it unlock for me?"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 7 — My work &amp; income strategy</p>
      <StudioWorksheetField
        v-model="answers.incomeStrategy"
        label="In one or two sentences, my strategy for earning and keeping more money is…"
        :rows="3"
      />
      <div class="space-y-2 border-t border-neutral-200 pt-3">
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-secondary" :disabled="draft.saving.value" @click="draft.save">
            {{ draft.saving.value ? 'Saving…' : 'Save my answers' }}
          </button>
          <span v-if="draft.savedAt.value" class="text-xs text-neutral-500">
            Saved at {{ draft.savedAt.value }}
          </span>
        </div>
        <p v-if="draft.error.value" class="text-sm text-rose-700">{{ draft.error.value }}</p>
      </div>
    </div>

    <NuxtLink to="/studio/lab/financial-literacy/money-plan" class="btn-primary inline-block">
      Next: My Money Plan (capstone) →
    </NuxtLink>
  </div>
</template>
