<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import type { BrandCoachResponse, PortfolioArtifactType } from '~/types/studio/models'

const props = defineProps<{
  result: BrandCoachResponse
  wasMock: boolean
  outputLabel: string
  artifactType: PortfolioArtifactType
  defaultTitle: string
  studentUid: string
}>()

const artifactApi = usePortfolioArtifact()

const saveTitle = ref(props.defaultTitle)
const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)
const copied = ref(false)
const copyError = ref<string | null>(null)

// Each new Sherpa version is saveable on its own — without this
// reset, a student who iterates can never save the improved version.
watch(
  () => props.result,
  () => {
    saved.value = false
    saveError.value = null
    copied.value = false
    copyError.value = null
    saveTitle.value = props.defaultTitle
  }
)

async function copyPolished() {
  copied.value = false
  copyError.value = null
  try {
    await navigator.clipboard.writeText(props.result.polishedVersion)
    copied.value = true
  } catch {
    copyError.value = "Couldn't copy automatically. Select the polished text and copy it manually."
  }
}

function printResult() {
  window.print()
}

async function saveToPortfolio() {
  if (saving.value) return
  saving.value = true
  saveError.value = null
  try {
    await artifactApi.create(
      props.studentUid,
      props.artifactType,
      saveTitle.value,
      props.result.polishedVersion
    )
    saved.value = true
  } catch {
    saveError.value = "Couldn't save to your Portfolio. Check your connection and try again."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="card space-y-4">
    <div id="sherpa-print-area" class="space-y-4">
      <span v-if="wasMock" class="chip-draft">Practice mode — no AI call was made</span>

      <div>
        <h2 class="text-sm font-semibold text-neutral-500">What's strong</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.strengths }}</p>
      </div>

      <div v-if="result.wordChoiceFlags.length">
        <h2 class="text-sm font-semibold text-neutral-500">Word choice check</h2>
        <div
          v-for="(flag, i) in result.wordChoiceFlags"
          :key="i"
          class="mt-2 rounded-md bg-amber-50 p-3 text-sm text-neutral-800"
        >
          <p class="font-medium">"{{ flag.word }}"</p>
          <p class="mt-1">{{ flag.howItMayLand }}</p>
          <p class="mt-1">
            <span class="font-medium">Try instead:</span> {{ flag.alternatives.join(', ') }}
          </p>
          <p class="mt-1 text-neutral-600">{{ flag.why }}</p>
        </div>
      </div>

      <div>
        <h2 class="text-sm font-semibold text-neutral-500">How your audience may hear it</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.audienceRead }}</p>
      </div>

      <div>
        <h2 class="text-sm font-semibold text-neutral-500">
          Polished version — {{ outputLabel }}
        </h2>
        <p class="mt-1 whitespace-pre-wrap rounded-md bg-studio-50 p-3 text-sm font-medium text-neutral-900">
          {{ result.polishedVersion }}
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          Anything in [brackets] is yours to fill in — the Sherpa never makes up a number or
          result for you.
        </p>
      </div>

      <div v-if="result.followUpQuestions.length">
        <h2 class="text-sm font-semibold text-neutral-500">Make it stronger</h2>
        <ul class="mt-1 list-inside list-disc text-sm text-neutral-700">
          <li v-for="(q, i) in result.followUpQuestions" :key="i">{{ q }}</li>
        </ul>
        <p class="mt-1 text-xs text-neutral-500">
          Answer these in the worksheet above, then tap "Ask Sherpa" again.
        </p>
      </div>
    </div>

    <div class="space-y-2 border-t border-neutral-200 pt-3">
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="copyPolished">
          {{ copied ? 'Copied.' : 'Copy polished version' }}
        </button>
        <button class="btn-secondary" @click="printResult">Print / Save as PDF</button>
      </div>
      <p v-if="copyError" class="text-sm text-rose-700">{{ copyError }}</p>

      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Save the polished version to My Portfolio as</span>
        <input
          v-model="saveTitle"
          type="text"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
      </label>
      <button
        class="btn-primary w-full"
        :disabled="saving || saved || !saveTitle.trim()"
        @click="saveToPortfolio"
      >
        {{ saved ? 'Saved to Portfolio ✓' : (saving ? 'Saving…' : 'Save to My Portfolio') }}
      </button>
      <p v-if="saveError" class="text-sm text-rose-700">{{ saveError }}</p>
      <p v-if="saved" class="text-sm">
        <NuxtLink to="/studio/portfolio" class="font-medium text-studio-700">
          View it in My Portfolio →
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<style>
/* Print / Save as PDF: show only the Sherpa result. */
@media print {
  body * {
    visibility: hidden;
  }
  #sherpa-print-area,
  #sherpa-print-area * {
    visibility: visible;
  }
  #sherpa-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 1rem;
  }
}
</style>
