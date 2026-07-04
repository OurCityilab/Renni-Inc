<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useFinancialLiteracyDraft } from '~/composables/useFinancialLiteracyDraft'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import {
  composeMoneyPlan,
  hasAnyMoneyPlanAnswer,
  type MoneyPlanInputs
} from '~/data/studio/financialLiteracyLab'

definePageMeta({ layout: 'studio' })

const answers = reactive<Record<string, string>>({
  incomeEstimate: '',
  budgetPlan: '',
  creditDebtTakeaways: '',
  housingGoal: '',
  moneyHabit: '',
  openQuestion: ''
})

const draft = useFinancialLiteracyDraft('money-plan', answers)

const sections: Array<{ key: keyof MoneyPlanInputs; label: string; prompt: string }> = [
  {
    key: 'incomeEstimate',
    label: 'My income estimate',
    prompt: 'From Module 1 — the job or wage you used, and your estimated monthly take-home.'
  },
  {
    key: 'budgetPlan',
    label: 'My needs / wants / savings plan',
    prompt: 'From Module 2 — your split, in your own words.'
  },
  {
    key: 'creditDebtTakeaways',
    label: 'My credit & debt takeaways',
    prompt: 'From Module 3 — what you want to remember before borrowing.'
  },
  {
    key: 'housingGoal',
    label: 'My housing or ownership goal',
    prompt: 'From Module 4 — where you want to be and the first checkpoint.'
  },
  {
    key: 'moneyHabit',
    label: 'One money habit I will practice this summer',
    prompt: 'Small and real beats big and imaginary.'
  },
  {
    key: 'openQuestion',
    label: 'One question I still need answered',
    prompt: 'Bring this to a coach — good questions are how money knowledge actually spreads.'
  }
]

const canBuild = computed(() => hasAnyMoneyPlanAnswer(answers as unknown as MoneyPlanInputs))

// ---- Preview + Portfolio save ----
const preview = ref('')

function buildPreview() {
  preview.value = composeMoneyPlan(answers as unknown as MoneyPlanInputs)
}

const previewRows = computed(() => {
  const lines = preview.value.split('\n').length
  return Math.min(28, Math.max(8, lines + 1))
})

const artifactApi = usePortfolioArtifact()
const saveTitle = ref('My Money Plan')
const planSaving = ref(false)
const planSaved = ref(false)
const planError = ref<string | null>(null)

async function savePlan() {
  if (planSaving.value || !draft.studentUid || !preview.value.trim()) return
  planSaving.value = true
  planError.value = null
  try {
    // Updates the existing draft with this title when one exists, so
    // editing the preview and saving again never stacks duplicates.
    await artifactApi.createOrUpdateDraft(
      draft.studentUid,
      'money_report',
      saveTitle.value,
      preview.value
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
      <h1 class="text-lg font-semibold">Module 5: My Money Plan</h1>
      <p class="text-sm text-neutral-600">
        This is where the other four modules become one page that's yours: what you earn, how
        you'll split it, what you'll watch out for, and where you're headed. It's a draft you
        own — not a contract, not a report card.
      </p>
    </div>

    <p v-if="draft.loading.value" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <StudioWorksheetField
        v-for="section in sections"
        :key="section.key"
        v-model="answers[section.key]"
        :label="section.label"
        :prompt="section.prompt"
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

    <div class="card space-y-3">
      <p class="text-sm font-semibold text-neutral-800">Build and save your plan</p>
      <button class="btn-secondary" :disabled="!canBuild" @click="buildPreview">
        {{ preview ? 'Rebuild my plan from my answers' : 'Build my Money Plan preview' }}
      </button>
      <p v-if="!canBuild" class="text-xs text-neutral-500">
        Fill in at least one section above to build your plan.
      </p>

      <template v-if="preview">
        <textarea
          v-model="preview"
          :rows="previewRows"
          class="w-full rounded-md bg-studio-50 border border-neutral-300 p-3 text-sm font-medium text-neutral-900"
        />
        <p class="text-xs text-neutral-500">
          This is yours to edit. Anything in [brackets] is a section you can finish later.
        </p>

        <label class="block text-sm">
          <span class="font-medium text-neutral-700">Save to My Portfolio as</span>
          <input
            v-model="saveTitle"
            type="text"
            class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
        </label>
        <button
          class="btn-primary w-full"
          :disabled="planSaving || !saveTitle.trim()"
          @click="savePlan"
        >
          {{ planSaving ? 'Saving…' : (planSaved ? 'Update My Money Plan in Portfolio' : 'Save My Money Plan to Portfolio') }}
        </button>
        <p v-if="planError" class="text-sm text-rose-700">{{ planError }}</p>
        <p v-if="planSaved && !planError" class="text-sm">
          <span class="text-emerald-700">Saved to Portfolio ✓</span> — keep editing and save
          again anytime; it updates the same draft.
          <NuxtLink to="/studio/portfolio" class="font-medium text-studio-700">
            View it in My Portfolio →
          </NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>
