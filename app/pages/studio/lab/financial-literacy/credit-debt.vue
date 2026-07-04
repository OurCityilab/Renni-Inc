<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'
import { computeDebtPayoff, computeDti } from '~/utils/studio/calculators'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  monthlyDebtPayments: '',
  monthlyGrossIncome: '',
  debtBalance: '',
  debtApr: '',
  debtPayment: '',
  reflectionTakeaway: '',
  reflectionCreditGoal: ''
})

const draft = useFinancialLiteracyDraft('credit-debt', answers)

const num = (s: string) => {
  const n = Number.parseFloat(s.replace(/[$,%\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const dti = computed(() => {
  const income = num(answers.monthlyGrossIncome)
  if (!income) return null
  return computeDti(num(answers.monthlyDebtPayments), income)
})

const payoff = computed(() => {
  const balance = num(answers.debtBalance)
  const payment = num(answers.debtPayment)
  if (!balance || !payment) return null
  return computeDebtPayoff({
    balance,
    aprPercent: num(answers.debtApr),
    monthlyPayment: payment
  })
})

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const payoffYears = computed(() => {
  if (!payoff.value || !payoff.value.paysOff) return ''
  const months = payoff.value.months
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `${years} yr ${rest} mo` : `${years} year${years === 1 ? '' : 's'}`
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Module 3: Credit & Debt</h1>
      <p class="text-sm text-neutral-600">
        Credit is borrowed money you pay back later — usually with interest. Used with a plan,
        it opens doors: apartments, cars, a business loan. Used without one, it quietly gets
        expensive. This module shows you the math lenders don't put on the poster.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-2 text-sm text-neutral-700">
      <p class="text-sm font-semibold text-neutral-800">The basics, plainly</p>
      <p>
        <span class="font-medium">Debit card:</span> spends money you already have.
        <span class="font-medium">Credit card:</span> borrows money you'll owe — pay the full
        balance monthly and it costs nothing; carry a balance and interest starts stacking.
      </p>
      <p>
        <span class="font-medium">Credit score:</span> a number (usually 300–850) that tells
        lenders and landlords how you've handled borrowed money so far. Paying on time and
        keeping balances low builds it. A low score isn't a judgment of you — it's a record
        that can be rebuilt, step by step.
      </p>
      <p>
        <span class="font-medium">Watch for:</span> lenders who profit when you stay stuck —
        very high interest rates, "easy" approval, and low minimum payments that barely touch
        what you owe. The calculator below shows exactly how that trap works.
      </p>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Debt-to-income check</p>
      <p class="text-xs text-neutral-600">
        Lenders compare what you owe each month to what you earn. For example, mortgage lenders
        often want total monthly debt under about 43% of gross income.
      </p>
      <div class="grid grid-cols-2 gap-3">
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Monthly debt payments ($)</span>
          <input
            v-model="answers.monthlyDebtPayments"
            type="text"
            inputmode="decimal"
            placeholder="e.g. 150"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Monthly gross income ($)</span>
          <input
            v-model="answers.monthlyGrossIncome"
            type="text"
            inputmode="decimal"
            placeholder="e.g. 1600"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
      </div>
      <div v-if="dti !== null" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <p class="font-semibold">Your debt-to-income ratio: {{ Math.round(dti! * 100) }}%</p>
        <p class="mt-1 text-xs text-neutral-600">
          That means about {{ Math.round(dti! * 100) }}¢ of every dollar you earn is already
          promised to debt before the month starts.
        </p>
      </div>
      <p v-else class="text-sm text-neutral-500">
        Enter your income to see the ratio. No debt yet? Try a scenario — that's what this is
        for.
      </p>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">The minimum payment trap</p>
      <p class="text-xs text-neutral-600">
        Try a scenario: a $500 balance at 24% interest with a $15 monthly payment. Then try $50
        and watch what changes. Educational example — real cards calculate slightly differently.
      </p>
      <div class="grid grid-cols-3 gap-3">
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Balance ($)</span>
          <input
            v-model="answers.debtBalance"
            type="text"
            inputmode="decimal"
            placeholder="500"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Interest (APR %)</span>
          <input
            v-model="answers.debtApr"
            type="text"
            inputmode="decimal"
            placeholder="24"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          <span class="block font-medium text-neutral-800">Monthly payment ($)</span>
          <input
            v-model="answers.debtPayment"
            type="text"
            inputmode="decimal"
            placeholder="15"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
      </div>
      <div v-if="payoff" class="rounded-md bg-studio-50 p-3 text-sm text-neutral-800">
        <template v-if="payoff.paysOff">
          <p><span class="font-medium">Time to pay it off:</span> {{ payoffYears }}</p>
          <p><span class="font-medium">Total you'd pay:</span> {{ money(payoff.totalPaid) }}</p>
          <p>
            <span class="font-medium">Of that, interest:</span>
            {{ money(payoff.totalInterest) }} — money for borrowing, not for the thing you
            bought.
          </p>
        </template>
        <template v-else>
          <p class="font-semibold text-amber-800">
            This payment never pays it off.
          </p>
          <p class="mt-1 text-xs text-neutral-700">
            Interest adds about {{ money(payoff.firstMonthInterest) }} in the first month alone
            — more than the payment covers, so the balance grows instead of shrinking. This is
            how some lenders are designed to work. The counter-move: pay more than the minimum,
            every time you can.
          </p>
        </template>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Your read on it</p>
      <StudioWorksheetField
        v-model="answers.reflectionTakeaway"
        label="What's one thing from this module you want to remember when someone offers you credit?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.reflectionCreditGoal"
        label="What's one step you could take in the next year to build (or protect) your credit?"
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

    <NuxtLink
      to="/studio/lab/financial-literacy/renting-homeownership"
      class="btn-primary inline-block"
    >
      Next: Renting & Ownership →
    </NuxtLink>
  </div>
</template>
