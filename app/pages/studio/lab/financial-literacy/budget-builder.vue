<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import {
  composeBudgetPlan,
  hasAnyBudgetPlanAnswer,
  type BudgetPlanInputs
} from '~/data/studio/financialLiteracyLab'
import { computeBudgetSplit } from '~/utils/studio/calculators'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  monthlyTakeHome: '',
  needsPercent: '',
  wantsPercent: '',
  savingsPercent: '',
  givingPercent: '',
  needsList: '',
  wantsList: ''
})

const draft = useFinancialLiteracyDraft('budget-builder', answers)

const num = (s: string) => {
  const n = Number.parseFloat(s.replace(/[$,%\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const split = computed(() => {
  const takeHome = num(answers.monthlyTakeHome)
  if (!takeHome) return null
  return computeBudgetSplit({
    monthlyTakeHome: takeHome,
    needsPercent: num(answers.needsPercent),
    wantsPercent: num(answers.wantsPercent),
    savingsPercent: num(answers.savingsPercent),
    givingPercent: num(answers.givingPercent)
  })
})

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// ---- Save "My Budget Plan" to Portfolio ----
const artifactApi = usePortfolioArtifact()
const planSaving = ref(false)
const planSaved = ref(false)
const planError = ref<string | null>(null)

const planInputs = computed<BudgetPlanInputs>(() => ({
  monthlyTakeHome: answers.monthlyTakeHome,
  needsPercent: answers.needsPercent,
  wantsPercent: answers.wantsPercent,
  savingsPercent: answers.savingsPercent,
  givingPercent: answers.givingPercent,
  needsList: answers.needsList,
  wantsList: answers.wantsList
}))
const canSavePlan = computed(() => hasAnyBudgetPlanAnswer(planInputs.value))

async function saveBudgetPlan() {
  if (planSaving.value || !draft.studentUid || !canSavePlan.value) return
  planSaving.value = true
  planError.value = null
  try {
    // Updates the existing "My Budget Plan" draft when one exists,
    // so re-saving never stacks duplicates in the Portfolio.
    await artifactApi.createOrUpdateDraft(
      draft.studentUid,
      'budget',
      'My Budget Plan',
      composeBudgetPlan(planInputs.value)
    )
    planSaved.value = true
  } catch {
    planError.value = "Couldn't save to your Portfolio. Check your connection and try again."
  } finally {
    planSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Module 2: Budget Builder</h1>
      <p class="text-sm text-neutral-600">
        A budget isn't a punishment — it's you deciding where your money goes before the month
        decides for you. There's no one right split. A common starting point is 50% needs, 30%
        wants, 15% savings, 5% giving — change it until it fits your real life.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Your split</p>
      <label class="block text-sm">
        <span class="block font-medium text-neutral-800">Estimated monthly take-home ($)</span>
        <span class="mt-0.5 block text-xs text-neutral-600">
          Use your number from Module 1: Take-Home Pay.
        </span>
        <input
          v-model="answers.monthlyTakeHome"
          type="text"
          inputmode="decimal"
          placeholder="e.g. 1200"
          class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
      </label>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Needs %</span>
          <input
            v-model="answers.needsPercent"
            type="text"
            inputmode="decimal"
            placeholder="50"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Wants %</span>
          <input
            v-model="answers.wantsPercent"
            type="text"
            inputmode="decimal"
            placeholder="30"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Savings %</span>
          <input
            v-model="answers.savingsPercent"
            type="text"
            inputmode="decimal"
            placeholder="15"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Giving %</span>
          <input
            v-model="answers.givingPercent"
            type="text"
            inputmode="decimal"
            placeholder="5"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
      </div>

      <div v-if="split" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <p><span class="font-medium">Needs:</span> {{ money(split.needs) }} / month</p>
        <p><span class="font-medium">Wants:</span> {{ money(split.wants) }} / month</p>
        <p><span class="font-medium">Savings:</span> {{ money(split.savings) }} / month</p>
        <p><span class="font-medium">Giving:</span> {{ money(split.giving) }} / month</p>
        <p v-if="split.isBalanced" class="mt-2 text-xs font-medium text-emerald-700">
          Your percentages add up to 100% — every dollar has a job.
        </p>
        <p v-else-if="split.totalPercent < 100" class="mt-2 text-xs text-neutral-600">
          Your percentages add up to {{ split.totalPercent }}% — {{ split.leftoverPercent }}% of
          your money doesn't have a plan yet. That's fine while you're deciding; just decide on
          purpose.
        </p>
        <p v-else class="mt-2 text-xs text-amber-700">
          Your percentages add up to {{ split.totalPercent }}% — that's more than you bring in.
          Lower one category until it fits.
        </p>
      </div>
      <p v-else class="text-sm text-neutral-500">
        Enter your monthly take-home and percentages to see the dollar amounts.
      </p>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Needs vs. wants — your list</p>
      <p class="text-xs text-neutral-600">
        A need keeps you safe, housed, fed, or working. A want makes life better. Neither is
        shameful — the skill is knowing which is which.
      </p>
      <StudioWorksheetField
        v-model="answers.needsList"
        label="My real needs (phone bill? bus pass? helping at home?)"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.wantsList"
        label="My real wants (be honest — wants belong in the budget too)"
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

    <div class="card space-y-2">
      <p class="text-sm font-semibold text-neutral-800">Save your plan</p>
      <p class="text-xs text-neutral-600">
        Saves "My Budget Plan" to your Portfolio as a draft you own — you can edit or delete it
        anytime. Saving again updates the same draft.
      </p>
      <button class="btn-primary w-full" :disabled="planSaving || !canSavePlan" @click="saveBudgetPlan">
        {{ planSaving ? 'Saving…' : (planSaved ? 'Update My Budget Plan in Portfolio' : 'Save My Budget Plan to Portfolio') }}
      </button>
      <p v-if="!canSavePlan" class="text-xs text-neutral-500">
        Add at least one budget number or reflection before saving.
      </p>
      <p v-if="planError" class="text-sm text-rose-700">{{ planError }}</p>
      <p v-if="planSaved && !planError" class="text-xs text-emerald-700">Saved to Portfolio ✓</p>
      <p v-if="planSaved" class="text-sm">
        <NuxtLink to="/studio/portfolio" class="font-medium text-studio-700">
          View it in My Portfolio →
        </NuxtLink>
      </p>
    </div>

    <NuxtLink to="/studio/lab/financial-literacy/credit-debt" class="btn-primary inline-block">
      Next: Credit & Debt →
    </NuxtLink>
  </div>
</template>
