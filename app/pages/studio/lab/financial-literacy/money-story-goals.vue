<script setup lang="ts">
import { reactive } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'

definePageMeta({ layout: 'studio' })

// Sortable spending areas — students classify each as a need, want, goal,
// or obligation. Simple <select> per row (no drag-and-drop, per V1 rules).
const sortItems = [
  { key: 'sortTransportation', label: 'Transportation (bus, gas, car)' },
  { key: 'sortFood', label: 'Food' },
  { key: 'sortPhone', label: 'Phone' },
  { key: 'sortFamilyContribution', label: 'Family / home contribution' },
  { key: 'sortClothes', label: 'Clothes' },
  { key: 'sortEntertainment', label: 'Entertainment' },
  { key: 'sortSavings', label: 'Savings' },
  { key: 'sortEmergencyFund', label: 'Emergency fund' },
  { key: 'sortSchoolWorkSupplies', label: 'School / work supplies' },
  { key: 'sortGifts', label: 'Gifts' }
] as const

const sortOptions = ['Need', 'Want', 'Goal', 'Obligation']

const answers = reactive<Record<string, string>>({
  // Activity 1 — money snapshot
  whenIGetMoney: '',
  decisionGoodAbout: '',
  // Activity 2 — needs / wants / goals / obligations sort
  ...Object.fromEntries(sortItems.map((i) => [i.key, ''])),
  // Activity 3 — money pressure
  moneyPressure: '',
  stopDoing: '',
  startDoing: '',
  // Activity 4 & 5 — goals
  goal30: '',
  goal12: '',
  // Activity 6 — mistake to avoid + note to future self
  mistakeToAvoid: '',
  futureSelf: ''
})

const draft = useFinancialLiteracyDraft('money-story-goals', answers)
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/financial-literacy" class="text-xs text-studio-700">
        ← Financial Literacy Lab
      </NuxtLink>
      <h1 class="text-lg font-semibold">Start Here: Money Story &amp; Goals</h1>
      <p class="text-sm text-neutral-600">
        Before you run a single paycheck or budget, take stock of how you already handle money —
        the habits, the pressures, and what you actually want to change. There are no wrong
        answers here. This is your starting point.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-2 border-studio-300">
      <p class="text-xs font-medium uppercase tracking-wide text-studio-700">Big question</p>
      <p class="text-sm font-semibold text-neutral-800">
        What do I believe about money, and what am I trying to change?
      </p>
      <div class="border-t border-neutral-200 pt-2">
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">Why this matters</p>
        <p class="mt-1 text-sm text-neutral-600">
          Money decisions are rarely just math — they're shaped by habits, family, and pressure.
          Naming yours now means the plan you build later fits your real life, not a template.
          Everything you save here can feed into your final Money Plan.
        </p>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 1 — Money snapshot</p>
      <StudioWorksheetField
        v-model="answers.whenIGetMoney"
        label="When I get money, I usually…"
        prompt="Be honest — spend it, save it, help at home, a little of each?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.decisionGoodAbout"
        label="One money decision I feel good about is…"
        :rows="3"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 2 — Needs, wants, goals &amp; obligations</p>
      <p class="text-xs text-neutral-600">
        For each area below, pick what it is <em>for you</em>. A <strong>need</strong> keeps your
        life running, a <strong>want</strong> is nice to have, a <strong>goal</strong> is something
        you're saving toward, and an <strong>obligation</strong> is money you've committed to
        others. The same thing can be different for different people — that's the point.
      </p>
      <div class="space-y-2">
        <label
          v-for="item in sortItems"
          :key="item.key"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-neutral-800">{{ item.label }}</span>
          <select
            v-model="answers[item.key]"
            class="w-40 shrink-0 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">Choose…</option>
            <option v-for="opt in sortOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 3 — Money pressure</p>
      <StudioWorksheetField
        v-model="answers.moneyPressure"
        label="One money pressure I deal with is…"
        prompt="What makes money feel tight or stressful right now?"
        :rows="3"
      />
      <StudioWorksheetField
        v-model="answers.stopDoing"
        label="Something I want to stop doing with money is…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.startDoing"
        label="Something I want to start doing with money is…"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 4 — My 30-day goal</p>
      <StudioWorksheetField
        v-model="answers.goal30"
        label="My 30-day money goal is…"
        prompt="Something small and real you could actually do in the next month."
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 5 — My 12-month goal</p>
      <StudioWorksheetField
        v-model="answers.goal12"
        label="My 12-month money goal is…"
        prompt="Where do you want your money to be a year from now?"
        :rows="2"
      />
    </div>

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Activity 6 — A mistake to avoid</p>
      <StudioWorksheetField
        v-model="answers.mistakeToAvoid"
        label="One money mistake I want to avoid is…"
        :rows="2"
      />
      <StudioWorksheetField
        v-model="answers.futureSelf"
        label="One thing I want my future self to remember is…"
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

    <NuxtLink to="/studio/lab/financial-literacy/take-home-pay" class="btn-primary inline-block">
      Next: Take-Home Pay →
    </NuxtLink>
  </div>
</template>
