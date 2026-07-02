<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useAiSherpa } from '~/composables/useAiSherpa'
import { useWorksheetResponse } from '~/composables/useWorksheetResponse'
import {
  composeWorksheetPayload,
  getWorksheetBySlug,
  hasAnyWorksheetModuleAnswer
} from '~/data/studio/worksheets/personalBrandPitchLab'
import type { BrandCoachResponse, SherpaAudience, SherpaOutputType } from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const route = useRoute()
const worksheet = getWorksheetBySlug(String(route.params.slug))

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const sherpaApi = useAiSherpa()
const responseApi = useWorksheetResponse()

const audienceOptions: Array<{ value: SherpaAudience; label: string }> = [
  { value: 'admissions', label: 'Admissions' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employer', label: 'Employer' },
  { value: 'scholarship', label: 'Scholarship committee' },
  { value: 'customer', label: 'Customer' },
  { value: 'general', label: 'General' }
]

const outputLabels: Record<SherpaOutputType, string> = {
  word_choice: 'Word choice feedback',
  pitch_3s: '3-second pitch',
  pitch_30s: '30-second pitch',
  pitch_1min_tmay: '1-minute / TMAY pitch',
  star_story: 'STAR story',
  resume_bullets: 'Resume bullets',
  resume_draft: 'Resume draft',
  linkedin_profile: 'LinkedIn profile'
}

const answers = reactive<Record<string, string>>({})
if (worksheet) {
  for (const section of worksheet.sections) {
    for (const field of section.fields) {
      answers[field.key] = ''
    }
  }
}

const audience = ref<SherpaAudience>('general')
const outputType = ref<SherpaOutputType>(worksheet?.outputOptions[0] ?? 'word_choice')

// ---- Draft persistence (worksheetResponses) ----
const draftType = worksheet ? `personal-brand-${worksheet.slug}` : ''
const draftId = ref<string | null>(null)
const draftLoading = ref(false)
const draftSaving = ref(false)
const draftSavedAt = ref<string | null>(null)
const draftError = ref<string | null>(null)

onMounted(async () => {
  if (!worksheet || !studentUid) return
  draftLoading.value = true
  try {
    const existing = await responseApi.loadLatest(studentUid, draftType)
    if (existing) {
      draftId.value = existing.id
      for (const key of Object.keys(answers)) {
        const value = existing.rawInputs[key]
        if (typeof value === 'string') answers[key] = value
      }
    }
  } catch {
    draftError.value = "Couldn't load your saved draft. You can still work — just save again when you're done."
  } finally {
    draftLoading.value = false
  }
})

async function saveDraft() {
  if (!worksheet || draftSaving.value) return
  draftSaving.value = true
  draftError.value = null
  try {
    draftId.value = await responseApi.saveDraft(studentUid, draftType, { ...answers }, draftId.value)
    draftSavedAt.value = new Date().toLocaleTimeString()
  } catch {
    draftError.value = "Couldn't save your draft. Check your connection and try again."
  } finally {
    draftSaving.value = false
  }
}

// ---- Sherpa ----
const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<BrandCoachResponse | null>(null)
const resultOutputType = ref<SherpaOutputType>(outputType.value)
const wasMock = ref(false)

async function askSherpa() {
  if (!worksheet || asking.value || !hasAnyWorksheetModuleAnswer(answers)) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandCoach({
      ...composeWorksheetPayload(worksheet, answers),
      focus: worksheet.sherpaFocus,
      audience: audience.value,
      outputType: outputType.value
    })
    result.value = res.sherpa
    resultOutputType.value = outputType.value
    wasMock.value = res.mock
  } catch (e: unknown) {
    askError.value =
      e instanceof Error ? e.message : 'Something went wrong asking the Sherpa. Try again.'
  } finally {
    asking.value = false
  }
}
</script>

<template>
  <div v-if="!worksheet" class="card space-y-2">
    <h1 class="text-lg font-semibold">Worksheet not found</h1>
    <p class="text-sm text-neutral-600">
      That worksheet doesn't exist. Head back to the Lab to pick one of the seven worksheets.
    </p>
    <NuxtLink to="/studio/lab/personal-brand" class="btn-primary inline-block">
      Back to Personal Brand & Pitch Lab
    </NuxtLink>
  </div>

  <div v-else class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab/personal-brand" class="text-xs text-studio-700">
        ← All worksheets
      </NuxtLink>
      <h1 class="text-lg font-semibold">Worksheet {{ worksheet.number }}: {{ worksheet.title }}</h1>
      <p class="text-sm text-neutral-600">{{ worksheet.description }}</p>
      <p class="mt-1 text-xs text-neutral-500">
        Prefer paper?
        <a :href="worksheet.pdfHref" target="_blank" rel="noopener" class="underline">
          View the original PDF
        </a>
      </p>
    </div>

    <p v-if="draftLoading" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-4">
      <div v-for="(section, si) in worksheet.sections" :key="si" class="space-y-3">
        <div v-if="section.title || section.description">
          <p v-if="section.title" class="text-sm font-semibold text-neutral-800">
            {{ section.title }}
          </p>
          <p v-if="section.description" class="text-xs text-neutral-600">
            {{ section.description }}
          </p>
        </div>
        <StudioWorksheetField
          v-for="field in section.fields"
          :key="field.key"
          v-model="answers[field.key]"
          :label="field.label"
          :rows="field.rows"
        />
      </div>

      <div class="space-y-2 border-t border-neutral-200 pt-3">
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-secondary" :disabled="draftSaving" @click="saveDraft">
            {{ draftSaving ? 'Saving…' : 'Save my answers' }}
          </button>
          <span v-if="draftSavedAt" class="text-xs text-neutral-500">
            Saved at {{ draftSavedAt }}
          </span>
        </div>
        <p v-if="draftError" class="text-sm text-rose-700">{{ draftError }}</p>
      </div>
    </div>

    <div class="card space-y-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="block font-semibold text-neutral-800">Audience</span>
          <span class="mt-0.5 block text-xs text-neutral-600">Who is this for?</span>
          <select
            v-model="audience"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in audienceOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label v-if="worksheet.outputOptions.length > 1" class="block text-sm">
          <span class="block font-semibold text-neutral-800">What do you want to make?</span>
          <span class="mt-0.5 block text-xs text-neutral-600">
            The Sherpa builds this from your answers above.
          </span>
          <select
            v-model="outputType"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in worksheet.outputOptions" :key="opt" :value="opt">
              {{ outputLabels[opt] }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="askError" class="text-sm text-rose-700">{{ askError }}</p>

      <button
        class="btn-primary w-full"
        :disabled="asking || !hasAnyWorksheetModuleAnswer(answers)"
        @click="askSherpa"
      >
        {{ asking ? 'The Sherpa is reading your work…' : 'Ask Sherpa' }}
      </button>
    </div>

    <StudioSherpaFeedbackPanel
      v-if="result"
      :result="result"
      :was-mock="wasMock"
      :output-label="outputLabels[resultOutputType]"
      :artifact-type="worksheet.artifactType"
      :default-title="worksheet.defaultArtifactTitle"
      :student-uid="studentUid"
    />
  </div>
</template>
