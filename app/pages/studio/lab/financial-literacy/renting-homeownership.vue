<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'
import {
  DEFAULT_COHORT_SETTINGS,
  computeLandlordQualification,
  computeRentAffordability
} from '~/utils/studio/calculators'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  monthlyTakeHome: '',
  monthlyGrossIncome: '',
  rent: '',
  creditScore: '',
  savings: '',
  deposit: '',
  reflectionHousingGoal: '',
  reflectionOwnership: ''
})

const draft = useFinancialLiteracyDraft('renting-homeownership', answers)

const num = (s: string) => {
  const n = Number.parseFloat(s.replace(/[$,%\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const affordability = computed(() => {
  const takeHome = num(answers.monthlyTakeHome)
  return takeHome ? computeRentAffordability(takeHome) : null
})

// Educational scenario threshold — many landlords screen around
// 600–650; surfaced in the copy as an assumption, not a rule of law.
const SCENARIO_MIN_CREDIT = 620

const qualification = computed(() => {
  const income = num(answers.monthlyGrossIncome)
  const rent = num(answers.rent)
  if (!income || !rent) return null
  return computeLandlordQualification({
    monthlyGrossIncome: income,
    rent,
    creditScore: num(answers.creditScore),
    savings: num(answers.savings),
    deposit: num(answers.deposit),
    landlordMinCredit: SCENARIO_MIN_CREDIT
  })
})

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const safePercent = Math.round(DEFAULT_COHORT_SETTINGS.safeRentPercentOfTakeHome * 100)
const stretchPercent = Math.round(DEFAULT_COHORT_SETTINGS.stretchRentPercentOfTakeHome * 100)
const multiplier = DEFAULT_COHORT_SETTINGS.landlordIncomeMultiplier
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Module 4: Renting & Ownership</h1>
      <p class="text-sm text-neutral-600">
        Your first apartment has a gatekeeper: the landlord. They check your income, your
        credit, and your savings before you get keys. Knowing their math ahead of time means
        you walk in prepared, not surprised.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">What rent fits your pay?</p>
      <label class="block text-sm">
        <span class="block font-medium text-neutral-800">Estimated monthly take-home ($)</span>
        <input
          v-model="answers.monthlyTakeHome"
          type="text"
          inputmode="decimal"
          placeholder="e.g. 2400"
          class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
      </label>
      <div v-if="affordability" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <p>
          <span class="font-medium">Comfortable rent (about {{ safePercent }}% of take-home):</span>
          up to {{ money(affordability.maxSafeRent) }}
        </p>
        <p>
          <span class="font-medium">Stretch rent (about {{ stretchPercent }}%):</span>
          up to {{ money(affordability.maxStretchRent) }}
        </p>
        <p class="mt-1 text-xs text-neutral-600">
          Rules of thumb for learning, not hard limits — real life includes roommates, family,
          and trade-offs.
        </p>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Would a landlord say yes?</p>
      <p class="text-xs text-neutral-600">
        Scenario assumptions, shown so you can check the math: income at least
        {{ multiplier }}× the rent, credit score {{ SCENARIO_MIN_CREDIT }}+ (many landlords
        screen around 600–650), and savings that cover the deposit.
      </p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Monthly gross income ($)</span>
          <input
            v-model="answers.monthlyGrossIncome"
            type="text"
            inputmode="decimal"
            placeholder="3000"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Monthly rent ($)</span>
          <input
            v-model="answers.rent"
            type="text"
            inputmode="decimal"
            placeholder="950"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Credit score</span>
          <input
            v-model="answers.creditScore"
            type="text"
            inputmode="numeric"
            placeholder="650"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Savings ($)</span>
          <input
            v-model="answers.savings"
            type="text"
            inputmode="decimal"
            placeholder="1500"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Required deposit ($)</span>
          <input
            v-model="answers.deposit"
            type="text"
            inputmode="decimal"
            placeholder="950"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
      </div>
      <div v-if="qualification" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <p class="font-semibold">
          {{ qualification.qualifies ? 'This application would likely qualify.' : "Not yet — here's what a landlord would flag:" }}
        </p>
        <ul class="mt-1 space-y-0.5 text-xs">
          <li>
            {{ qualification.meetsIncomeRule ? '✓' : '✗' }} Income is at least
            {{ multiplier }}× the rent
          </li>
          <li>
            {{ qualification.meetsCreditRule ? '✓' : '✗' }} Credit score at
            {{ SCENARIO_MIN_CREDIT }} or above
          </li>
          <li>{{ qualification.meetsSavingsRule ? '✓' : '✗' }} Savings cover the deposit</li>
        </ul>
        <p v-if="!qualification.qualifies" class="mt-1 text-xs text-neutral-600">
          A "not yet" is information, not a verdict — each ✗ is a specific thing to work on or
          negotiate (co-signer, bigger deposit, pay history letter).
        </p>
      </div>
    </div>

    <div class="card space-y-2 text-sm text-neutral-700">
      <p class="text-sm font-semibold text-neutral-800">Renting vs. owning, honestly</p>
      <p>
        Rent buys you a place to live. A mortgage payment does that too — and part of it buys
        you a growing share of something you can keep, borrow against, or pass down. That share
        is called equity, and it's one way families build wealth across generations.
      </p>
      <p>
        Honesty matters here: owning isn't automatic wealth. It comes with repairs, taxes,
        and risk, and it takes years. In many Black communities, unfair lending and appraisal
        practices made ownership harder for generations — which is exactly why knowing this
        math, early, is power. The goal isn't "buy a house tomorrow." It's: know the path
        exists, and know what the first steps cost.
      </p>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Your read on it</p>
      <StudioWorksheetField
        v-model="answers.reflectionHousingGoal"
        label="What's your housing goal for the next five years — and what's the first checkpoint?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.reflectionOwnership"
        label="What would you want to own someday — a home, a business, something else? Why that?"
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
      Next: My Money Plan →
    </NuxtLink>
  </div>
</template>
