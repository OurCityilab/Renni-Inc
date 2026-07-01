<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import { useAiSherpa, type BrandSherpaInput } from '~/composables/useAiSherpa'
import type { SherpaResponse } from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const artifactApi = usePortfolioArtifact()
const sherpaApi = useAiSherpa()

const form = reactive<BrandSherpaInput>({
  whatYouCareAbout: '',
  whyItMatters: '',
  whoYouWantToHelp: '',
  whatPeopleAskYouFor: '',
  futureYouAreBuilding: ''
})

const hasAnyAnswer = () => Object.values(form).some((v) => v.trim().length > 0)

const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<SherpaResponse | null>(null)
const wasMock = ref(false)

async function askSherpa() {
  if (asking.value || !hasAnyAnswer()) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandSherpa(form)
    result.value = res.sherpa
    wasMock.value = res.mock
  } catch (e: unknown) {
    askError.value = e instanceof Error ? e.message : 'Something went wrong asking the Sherpa. Try again.'
  } finally {
    asking.value = false
  }
}

const saveTitle = ref('My Personal Brand Statement')
const saving = ref(false)
const saved = ref(false)

async function saveToPortfolio() {
  if (!result.value || saving.value) return
  saving.value = true
  try {
    await artifactApi.create(studentUid, 'brand_sentence', saveTitle.value, result.value.professionalVersion)
    saved.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">Personal Brand Builder</h1>
    <p class="text-sm text-neutral-600">
      Answer in your own words. The Sherpa will turn it into a short, honest professional version — nothing it says will be invented.
    </p>

    <div class="card space-y-3">
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">What do you care about?</span>
        <textarea
          v-model="form.whatYouCareAbout"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Why does it matter to you?</span>
        <textarea
          v-model="form.whyItMatters"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Who do you want to help?</span>
        <textarea
          v-model="form.whoYouWantToHelp"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">What do people already come to you for?</span>
        <textarea
          v-model="form.whatPeopleAskYouFor"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">What future are you building toward?</span>
        <textarea
          v-model="form.futureYouAreBuilding"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <p v-if="askError" class="text-sm text-rose-700">{{ askError }}</p>

      <button
        class="btn-primary w-full"
        :disabled="asking || !hasAnyAnswer()"
        @click="askSherpa"
      >
        {{ asking ? 'Asking the Sherpa…' : 'Ask the Sherpa' }}
      </button>
    </div>

    <div v-if="result" class="card space-y-3">
      <span v-if="wasMock" class="chip-draft">Practice mode — no AI call was made</span>

      <div>
        <h2 class="text-sm font-semibold text-neutral-500">Your words</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.yourWords }}</p>
      </div>
      <div>
        <h2 class="text-sm font-semibold text-neutral-500">Professional version</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm font-medium text-neutral-900">{{ result.professionalVersion }}</p>
      </div>
      <div>
        <h2 class="text-sm font-semibold text-neutral-500">Why it works</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.whyItWorks }}</p>
      </div>
      <div v-if="result.whatIsMissing.length">
        <h2 class="text-sm font-semibold text-neutral-500">What's missing</h2>
        <ul class="mt-1 list-inside list-disc text-sm text-neutral-700">
          <li v-for="(item, i) in result.whatIsMissing" :key="i">{{ item }}</li>
        </ul>
      </div>
      <div>
        <h2 class="text-sm font-semibold text-neutral-500">Try again</h2>
        <p class="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{{ result.tryAgainQuestion }}</p>
      </div>

      <div class="space-y-2 border-t border-neutral-200 pt-3">
        <label class="block text-sm">
          <span class="font-medium text-neutral-700">Save this professional version to My Portfolio as</span>
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
      </div>
    </div>
  </div>
</template>
