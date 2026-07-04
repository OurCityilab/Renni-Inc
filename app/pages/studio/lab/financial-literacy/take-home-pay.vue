<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'
import { DEFAULT_COHORT_SETTINGS, computeTakeHomePay } from '~/utils/studio/calculators'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  hourlyWage: '',
  hoursPerWeek: '',
  annualSalary: '',
  reflectionSurprise: '',
  reflectionPlan: ''
})

const draft = useFinancialLiteracyDraft('take-home-pay', answers)

const num = (s: string) => {
  const n = Number.parseFloat(s.replace(/[$,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : 0
}

const annual = computed(() => {
  const salary = num(answers.annualSalary)
  if (salary) return salary
  const wage = num(answers.hourlyWage)
  const hours = num(answers.hoursPerWeek)
  return wage && hours ? wage * hours * 52 : 0
})

const result = computed(() => (annual.value ? computeTakeHomePay(annual.value) : null))

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const takeHomePercentLabel = Math.round(DEFAULT_COHORT_SETTINGS.takeHomePayFactor * 100)
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Module 1: Take-Home Pay</h1>
      <p class="text-sm text-neutral-600">
        A job offer says one number. Your bank account sees a smaller one. The difference is
        taxes and deductions — money that comes out before you ever touch it. Knowing your real
        take-home number is the starting point for every money decision you'll make.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Your pay</p>
      <p class="text-xs text-neutral-600">
        Use your worksite pay if you know it, or try a job you're curious about. Fill in either
        the hourly row or the yearly salary — whichever you have.
      </p>
      <div class="grid grid-cols-2 gap-3">
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Hourly wage ($)</span>
          <input
            v-model="answers.hourlyWage"
            type="text"
            inputmode="decimal"
            placeholder="e.g. 15"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Hours per week</span>
          <input
            v-model="answers.hoursPerWeek"
            type="text"
            inputmode="decimal"
            placeholder="e.g. 20"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
      </div>
      <label class="block text-sm">
        <span class="block font-medium text-neutral-800">Or a yearly salary ($)</span>
        <input
          v-model="answers.annualSalary"
          type="text"
          inputmode="decimal"
          placeholder="e.g. 45000"
          class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
      </label>

      <div v-if="result" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <p><span class="font-medium">Yearly pay (gross):</span> {{ money(annual) }}</p>
        <p><span class="font-medium">Monthly pay (gross):</span> {{ money(result.monthlyGross) }}</p>
        <p class="mt-1 text-base font-semibold">
          Estimated monthly take-home: {{ money(result.estimatedTakeHome) }}
        </p>
        <p class="mt-2 text-xs text-neutral-600">
          Estimate only: this assumes about {{ takeHomePercentLabel }}% of gross pay reaches
          you after taxes and deductions. Your real paycheck depends on your state, your tax
          forms, and your benefits — check a real pay stub when you have one.
        </p>
      </div>
      <p v-else class="text-sm text-neutral-500">
        Enter a wage and hours (or a salary) to see your estimated take-home pay.
      </p>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Your read on it</p>
      <StudioWorksheetField
        v-model="answers.reflectionSurprise"
        label="What surprised you about the gap between gross pay and take-home pay?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.reflectionPlan"
        label="Knowing your real monthly number, what's one thing you'd plan differently?"
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

    <NuxtLink to="/studio/lab/financial-literacy/budget-builder" class="btn-primary inline-block">
      Next: Budget Builder →
    </NuxtLink>
  </div>
</template>
