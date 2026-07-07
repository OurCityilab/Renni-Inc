<script setup lang="ts">
import { reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  // Activity 1 — choose a savings goal
  shortTermGoal: '',
  twelveMonthGoal: '',
  // Activity 2 — emergency reality check
  possibleEmergency: '',
  emergencyCost: '',
  // Activity 3 — 30/60/90-day plan
  save30: '',
  save60: '',
  save90: '',
  // Activity 4 — save-first decision
  saveFirstAmount: '',
  // Activity 5 — sinking fund
  knownExpense: '',
  sinkingTarget: '',
  sinkingPerPeriod: '',
  // Activity 6 — extra-money decision
  extra100: '',
  // Activity 7 — rule for future self
  futureSelfRule: ''
})

const draft = useFinancialLiteracyDraft('savings-emergencies', answers)
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Saving, Emergencies &amp; Big Goals</h1>
      <p class="text-sm text-neutral-600">
        Some costs you can see coming. Some you can't. Saving isn't about having a lot left over —
        it's about deciding, on purpose, to set some aside before life makes the decision for you.
        This module helps you build a plan for both the surprises and the goals that matter.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-2 border-studio-300">
      <p class="text-xs font-medium uppercase tracking-wide text-studio-700">Big question</p>
      <p class="text-sm font-semibold text-neutral-800">
        How do I prepare for things I know are coming and things I do not?
      </p>
      <div class="border-t border-neutral-200 pt-2">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Why this matters</p>
        <p class="mt-1 text-sm text-neutral-600">
          An emergency with no savings becomes debt. A goal with no plan stays a wish. A small
          amount saved on purpose — even $10 a week — changes what you can handle when something
          breaks, and what you can reach when something matters.
        </p>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 1 — Choose a savings goal</p>
      <StudioWorksheetField
        v-model="answers.shortTermGoal"
        label="One short-term goal I want to save for is…"
        prompt="Something in the next few months."
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.twelveMonthGoal"
        label="One 12-month goal I want to save for is…"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 2 — Emergency reality check</p>
      <StudioWorksheetField
        v-model="answers.possibleEmergency"
        label="An emergency that could realistically happen in the next 3 months is…"
        prompt="A phone breaks, car trouble, a missed shift, a medical cost…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.emergencyCost"
        label="About how much would that cost?"
        :rows="1"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 3 — My 30/60/90-day savings plan</p>
      <p class="text-xs text-neutral-600">Small and steady beats big and never. What could you realistically set aside?</p>
      <StudioWorksheetField
        v-model="answers.save30"
        label="By 30 days, I could have saved…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.save60"
        label="By 60 days, I could have saved…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.save90"
        label="By 90 days, I could have saved…"
        :rows="1"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 4 — Save first, then spend</p>
      <StudioWorksheetField
        v-model="answers.saveFirstAmount"
        label="The amount I could move to savings BEFORE I spend anything is…"
        prompt="Even a small number counts if you do it every time."
        :rows="1"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 5 — A sinking fund</p>
      <p class="text-xs text-neutral-600">
        A sinking fund is money you set aside a little at a time for a cost you know is coming, so
        it doesn't hit all at once.
      </p>
      <StudioWorksheetField
        v-model="answers.knownExpense"
        label="One known future expense I can plan for is…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.sinkingTarget"
        label="The total amount I'll need is about…"
        :rows="1"
      />
      <StudioWorksheetField
        v-model="answers.sinkingPerPeriod"
        label="To get there, I'll set aside this much each week or month…"
        :rows="1"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 6 — The extra-$100 decision</p>
      <StudioWorksheetField
        v-model="answers.extra100"
        label="If I got an extra $100 today, here's what I'd actually do with it and why…"
        :rows="3"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 7 — A rule for my future self</p>
      <StudioWorksheetField
        v-model="answers.futureSelfRule"
        label="One saving rule I want to hold myself to is…"
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

    <NuxtLink to="/studio/lab/financial-literacy/credit-debt" class="btn-primary inline-block">
      Next: Credit &amp; Debt →
    </NuxtLink>
  </div>
</template>
