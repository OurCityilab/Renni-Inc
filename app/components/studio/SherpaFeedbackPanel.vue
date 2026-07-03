<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import type { BrandCoachResponse, PortfolioArtifactType, WordFlagCategory } from '~/types/studio/models'

const categoryLabels: Record<WordFlagCategory, string> = {
  too_vague: 'Too general',
  too_inflated: 'Bigger than your evidence',
  too_casual: 'Casual / risky for this audience'
}

const props = defineProps<{
  result: BrandCoachResponse
  wasMock: boolean
  outputLabel: string
  artifactType: PortfolioArtifactType
  defaultTitle: string
  studentUid: string
}>()

const artifactApi = usePortfolioArtifact()

// Editable final draft — students revise the Sherpa's polished
// version here before copying, saving, or printing it.
const finalDraft = ref(props.result.polishedVersion)

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
    finalDraft.value = props.result.polishedVersion
    saved.value = false
    saveError.value = null
    copied.value = false
    copyError.value = null
    saveTitle.value = props.defaultTitle
  }
)

const draftRows = computed(() => {
  const lines = finalDraft.value.split('\n').length
  return Math.min(28, Math.max(6, lines + 1))
})

async function copyFinalDraft() {
  copied.value = false
  copyError.value = null
  try {
    await navigator.clipboard.writeText(finalDraft.value)
    copied.value = true
  } catch {
    copyError.value = "Couldn't copy automatically. Select the final draft text and copy it manually."
  }
}

function printFinalDraft() {
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
      finalDraft.value
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
        class="mt-2 space-y-1 rounded-md bg-amber-50 p-3 text-sm text-neutral-800"
      >
        <p class="flex flex-wrap items-center gap-2 font-medium">
          "{{ flag.word }}"
          <span class="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
            {{ categoryLabels[flag.category] }}
          </span>
        </p>
        <p><span class="font-medium">What it usually means:</span> {{ flag.definition }}</p>
        <p><span class="font-medium">How it may read:</span> {{ flag.howItMayLand }}</p>
        <p><span class="font-medium">Does it fit your evidence?</span> {{ flag.evidenceFit }}</p>
        <div>
          <p class="font-medium">Better options:</p>
          <ul class="list-inside list-disc">
            <li v-for="(alt, j) in flag.alternatives" :key="j">{{ alt }}</li>
          </ul>
        </div>
        <p><span class="font-medium">Best fit for your story:</span> {{ flag.bestFit }}</p>
        <p class="text-neutral-600"><span class="font-medium text-neutral-800">In your voice:</span> {{ flag.inYourVoice }}</p>
      </div>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-neutral-500">How your audience may hear it</h2>
      <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.audienceRead }}</p>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-neutral-500">
        Final Draft / Preview — {{ outputLabel }}
      </h2>
      <textarea
        v-model="finalDraft"
        :rows="draftRows"
        class="mt-1 w-full rounded-md bg-studio-50 border border-neutral-300 p-3 text-sm font-medium text-neutral-900"
      />
      <p class="mt-1 text-xs text-neutral-500">
        This is yours to edit. Anything in [brackets] is yours to fill in — the Sherpa never
        makes up a number or result for you. Your edits here are what gets copied, saved, and
        printed.
      </p>
    </div>

    <div v-if="result.followUpQuestions.length">
      <h2 class="text-sm font-semibold text-neutral-500">Make it stronger</h2>
      <ul class="mt-1 list-inside list-disc text-sm text-neutral-700">
        <li v-for="(q, i) in result.followUpQuestions" :key="i">{{ q }}</li>
      </ul>
      <p class="mt-1 text-xs text-neutral-500">
        Answer these in the worksheet above, then ask the Sherpa again for a stronger version.
      </p>
    </div>

    <div class="space-y-2 border-t border-neutral-200 pt-3">
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="copyFinalDraft">
          {{ copied ? 'Copied.' : 'Copy full final draft' }}
        </button>
        <button class="btn-secondary" @click="printFinalDraft">
          Print / Save full preview as PDF
        </button>
      </div>
      <p v-if="copyError" class="text-sm text-rose-700">{{ copyError }}</p>

      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Save the final draft to My Portfolio as</span>
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
        {{ saved ? 'Saved to Portfolio ✓' : (saving ? 'Saving…' : 'Save final draft to Portfolio') }}
      </button>
      <p v-if="saveError" class="text-sm text-rose-700">{{ saveError }}</p>
      <p v-if="saved" class="text-sm">
        <NuxtLink to="/studio/portfolio" class="font-medium text-studio-700">
          View it in My Portfolio →
        </NuxtLink>
      </p>
    </div>

    <!-- Print-only preview: textareas print poorly (clipped to their
         visible box), so the printable page renders the full edited
         final draft with preserved line breaks. -->
    <div id="sherpa-print-area" aria-hidden="true">
      <h1>{{ saveTitle || outputLabel }}</h1>
      <div class="sherpa-print-draft">{{ finalDraft }}</div>
    </div>
  </div>
</template>

<style>
/* Screen: the print block stays hidden. Print / Save as PDF: show
   ONLY the final draft preview, full width, with line breaks kept. */
#sherpa-print-area {
  display: none;
}
@media print {
  body * {
    visibility: hidden;
  }
  #sherpa-print-area,
  #sherpa-print-area * {
    visibility: visible;
  }
  #sherpa-print-area {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 1rem;
  }
  #sherpa-print-area h1 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  #sherpa-print-area .sherpa-print-draft {
    white-space: pre-wrap;
    font-size: 0.9rem;
    line-height: 1.4;
  }
}
</style>
