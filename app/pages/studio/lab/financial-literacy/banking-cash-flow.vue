<script setup lang="ts">
import { reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'

definePageMeta({ layout: 'studio' })

// Where students might keep and move their money. Single-choice per row.
const bankingOptions = ['Yes', 'No', 'Not sure']
const bankingChoices = [
  { key: 'setupChecking', label: 'A checking account (for spending and bills)' },
  { key: 'setupSavings', label: 'A savings account (separate from spending)' },
  { key: 'setupDirectDeposit', label: 'Direct deposit from a job' },
  { key: 'setupPrepaid', label: 'A prepaid card' },
  { key: 'setupCheckCashing', label: 'Cash / a check-cashing place' },
  { key: 'setupPaymentApp', label: 'A payment app (Cash App, Venmo, Zelle)' }
] as const

// Fees students may already be paying. Classify how often each hits them.
const feeOptions = ['Never', 'Sometimes', 'Often']
const feeItems = [
  { key: 'feeAtm', label: 'ATM fees' },
  { key: 'feeOverdraft', label: 'Overdraft fees' },
  { key: 'feeCheckCashing', label: 'Check-cashing fees' },
  { key: 'feeSubscription', label: 'Surprise subscription charges' },
  { key: 'feeInstantTransfer', label: 'Instant-transfer fees' },
  { key: 'feeLatePayment', label: 'Late-payment fees' }
] as const

const answers = reactive<Record<string, string>>({
  // Activity 1 — payday flow map
  firstGoesTo: '',
  firstThreeToCover: '',
  // Activity 2 — banking setup choice
  ...Object.fromEntries(bankingChoices.map((c) => [c.key, ''])),
  // Activity 3 — fee risk check
  ...Object.fromEntries(feeItems.map((f) => [f.key, ''])),
  // Activity 4 — scam / payment safety
  riskySign: '',
  ruleBeforeSending: '',
  // Activity 5 — subscription audit
  subscriptionsIUse: '',
  subscriptionsToCancel: '',
  // Activity 6 — cash flow plan
  paidFirst: '',
  getsSaved: '',
  canWait: '',
  // Activity 7 — future-self note
  futureSelf: ''
})

const draft = useFinancialLiteracyDraft('banking-cash-flow', answers)
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Banking, Cash Flow &amp; Money Safety</h1>
      <p class="text-sm text-neutral-600">
        Getting paid is only step one. Where your money lands, how it moves, and what quietly
        eats away at it decide how much you actually keep. This module is about setting your
        money up so it works for you — and spotting the fees and scams that don't.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-2 border-studio-300">
      <p class="text-xs font-medium uppercase tracking-wide text-studio-700">Big question</p>
      <p class="text-sm font-semibold text-neutral-800">Where should my money go when I get paid?</p>
      <div class="border-t border-neutral-200 pt-2">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Why this matters</p>
        <p class="mt-1 text-sm text-neutral-600">
          Two people can earn the same paycheck and end the month in very different places. The
          difference is often cash flow — the order money moves and the fees it loses along the
          way. A dollar lost to an overdraft or a forgotten subscription is a dollar you worked
          for and never used.
        </p>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 1 — Payday flow map</p>
      <StudioWorksheetField
        v-model="answers.firstGoesTo"
        label="When I get paid, my money should first go to…"
        prompt="Before anything fun — what has to be handled first?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.firstThreeToCover"
        label="The first three things I need to cover are…"
        :rows="3"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 2 — My banking setup</p>
      <p class="text-xs text-neutral-600">
        Which of these do you have or want? There's no single right setup — the goal is knowing
        where your money lives and moves.
      </p>
      <div class="space-y-2">
        <label
          v-for="choice in bankingChoices"
          :key="choice.key"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-neutral-800">{{ choice.label }}</span>
          <select
            v-model="answers[choice.key]"
            class="w-32 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Choose…</option>
            <option v-for="opt in bankingOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 3 — Fee risk check</p>
      <p class="text-xs text-neutral-600">
        How often does each of these cost you money? Naming them is the first step to stopping them.
      </p>
      <div class="space-y-2">
        <label
          v-for="fee in feeItems"
          :key="fee.key"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-neutral-800">{{ fee.label }}</span>
          <select
            v-model="answers[fee.key]"
            class="w-32 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Choose…</option>
            <option v-for="opt in feeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 4 — Payment safety</p>
      <StudioWorksheetField
        v-model="answers.riskySign"
        label="One sign a payment request might be risky is…"
        prompt="What would make you pause before sending money?"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.ruleBeforeSending"
        label="One rule I'll follow before I send money is…"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 5 — Subscription audit</p>
      <StudioWorksheetField
        v-model="answers.subscriptionsIUse"
        label="Subscriptions I actually use are…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.subscriptionsToCancel"
        label="Subscriptions I might need to cancel are…"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 6 — My cash flow plan</p>
      <StudioWorksheetField
        v-model="answers.paidFirst"
        label="What gets paid first…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.getsSaved"
        label="What gets saved…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.canWait"
        label="What can wait…"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 7 — A note to my future self</p>
      <StudioWorksheetField
        v-model="answers.futureSelf"
        label="One thing I want to remember about keeping my money safe is…"
        :rows="2"
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
