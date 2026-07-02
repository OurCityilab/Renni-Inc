<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useAiSherpa } from '~/composables/useAiSherpa'
import { useWorksheetResponse } from '~/composables/useWorksheetResponse'
import {
  composeLinkedinWorksheet,
  emptyLinkedinBuilderForm,
  hasAnyLinkedinAnswer,
  type LinkedinBuilderForm
} from '~/utils/studioLinkedinBuilder'
import type { BrandCoachResponse, SherpaAudience } from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const sherpaApi = useAiSherpa()
const responseApi = useWorksheetResponse()

const form = reactive<LinkedinBuilderForm>(emptyLinkedinBuilderForm())

const fields: Array<{ key: keyof LinkedinBuilderForm; label: string; prompt?: string; rows?: number }> = [
  { key: 'name', label: 'Full name', rows: 1 },
  { key: 'school', label: 'Current school/program', rows: 1 },
  { key: 'roleIdentity', label: 'Current role/identity', prompt: 'Examples: student entrepreneur, student leader, varsity athlete, youth organizer.', rows: 1 },
  { key: 'careerInterests', label: 'Career interests', prompt: 'The role or field you are aspiring toward.', rows: 1 },
  { key: 'topics', label: 'Three topics/fields you are interested in', prompt: 'Separate with commas — e.g., Marketing, Fashion, Community Development.', rows: 1 },
  { key: 'brandSentence', label: 'Your brand sentence' },
  { key: 'intro3s', label: 'Your 3-second intro' },
  { key: 'starStory', label: 'Your strongest STAR story', rows: 3 },
  { key: 'skills', label: 'Skills', rows: 1 },
  { key: 'projectsExperience', label: 'Projects/experience', rows: 2 },
  { key: 'remember', label: 'What do you want people to remember about you?' }
]

const audienceOptions: Array<{ value: SherpaAudience; label: string }> = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employer', label: 'Employer' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'scholarship', label: 'Scholarship committee' },
  { value: 'customer', label: 'Customer' },
  { value: 'general', label: 'General' }
]
const audience = ref<SherpaAudience>('general')

// ---- Draft persistence ----
const DRAFT_TYPE = 'linkedin-builder'
const draftId = ref<string | null>(null)
const draftLoading = ref(false)
const draftSaving = ref(false)
const draftSavedAt = ref<string | null>(null)
const draftError = ref<string | null>(null)

onMounted(async () => {
  if (!studentUid) return
  draftLoading.value = true
  try {
    const existing = await responseApi.loadLatest(studentUid, DRAFT_TYPE)
    if (existing) {
      draftId.value = existing.id
      for (const key of Object.keys(form) as Array<keyof LinkedinBuilderForm>) {
        const value = existing.rawInputs[key]
        if (typeof value === 'string') form[key] = value
      }
    }
  } catch {
    draftError.value =
      "Couldn't load your saved draft. You can still work — just save again when you're done."
  } finally {
    draftLoading.value = false
  }
})

async function saveDraft() {
  if (draftSaving.value) return
  draftSaving.value = true
  draftError.value = null
  try {
    draftId.value = await responseApi.saveDraft(studentUid, DRAFT_TYPE, { ...form }, draftId.value)
    draftSavedAt.value = new Date().toLocaleTimeString()
  } catch {
    draftError.value = "Couldn't save your draft. Check your connection and try again."
  } finally {
    draftSaving.value = false
  }
}

// ---- Build LinkedIn language ----
const LINKEDIN_FOCUS =
  "Turn this student's brand language into a credible LinkedIn presence: a headline using the Student | Aspiring [role/field] | Interested in [topic], [topic], and [topic] formula, a short About section, an experience description, skills, and a connection intro. Age-appropriate, never inflated."

const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<BrandCoachResponse | null>(null)
const wasMock = ref(false)

async function buildLinkedin() {
  if (asking.value || !hasAnyLinkedinAnswer(form)) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandCoach({
      worksheet: composeLinkedinWorksheet(form),
      selfWords: '',
      starExample: '',
      focus: LINKEDIN_FOCUS,
      audience: audience.value,
      outputType: 'linkedin_profile'
    })
    result.value = res.sherpa
    wasMock.value = res.mock
    copiedPart.value = null
    copyPartError.value = null
  } catch (e: unknown) {
    askError.value =
      e instanceof Error ? e.message : 'Something went wrong building your LinkedIn language. Try again.'
  } finally {
    asking.value = false
  }
}

// The polished version comes back in labeled blocks ("Headline: …",
// "About: …") — pull one block out for targeted copy buttons.
function extractBlock(label: 'Headline' | 'About'): string {
  const polished = result.value?.polishedVersion ?? ''
  const block = polished
    .split(/\n{2,}/)
    .find((b) => b.trim().toLowerCase().startsWith(`${label.toLowerCase()}:`))
  return block ? block.slice(block.indexOf(':') + 1).trim() : ''
}

const copiedPart = ref<string | null>(null)
const copyPartError = ref<string | null>(null)

async function copyPart(label: 'Headline' | 'About') {
  copiedPart.value = null
  copyPartError.value = null
  const text = extractBlock(label)
  if (!text) {
    copyPartError.value = `Couldn't find a ${label} section in the Sherpa's response — use "Copy polished version" instead.`
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    copiedPart.value = label
  } catch {
    copyPartError.value = "Couldn't copy automatically. Select the text and copy it manually."
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab" class="text-xs text-studio-700">← Back to the Lab</NuxtLink>
      <h1 class="text-lg font-semibold">LinkedIn Builder</h1>
      <p class="text-sm text-neutral-600">
        Turn your brand work into a LinkedIn headline, About section, and connection intro. If you
        finished Worksheet 7 in the Personal Brand & Pitch Lab, paste your language here.
      </p>
    </div>

    <p v-if="draftLoading" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <StudioWorksheetField
        v-for="f in fields"
        :key="f.key"
        v-model="form[f.key]"
        :label="f.label"
        :prompt="f.prompt"
        :rows="f.rows"
      />

      <div class="space-y-2 border-t border-neutral-200 pt-3">
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn-secondary" :disabled="draftSaving" @click="saveDraft">
            {{ draftSaving ? 'Saving…' : 'Save my answers' }}
          </button>
          <span v-if="draftSavedAt" class="text-xs text-neutral-500">Saved at {{ draftSavedAt }}</span>
        </div>
        <p v-if="draftError" class="text-sm text-rose-700">{{ draftError }}</p>

        <label class="block text-sm">
          <span class="block font-semibold text-neutral-800">Audience</span>
          <select
            v-model="audience"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in audienceOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>

        <p v-if="askError" class="text-sm text-rose-700">{{ askError }}</p>

        <button
          class="btn-primary w-full"
          :disabled="asking || !hasAnyLinkedinAnswer(form)"
          @click="buildLinkedin"
        >
          {{ asking ? 'The Sherpa is building your LinkedIn language…' : 'Build LinkedIn Language' }}
        </button>
      </div>
    </div>

    <div v-if="result" class="space-y-2">
      <div class="flex flex-wrap gap-2">
        <button class="btn-secondary" @click="copyPart('Headline')">
          {{ copiedPart === 'Headline' ? 'Copied.' : 'Copy LinkedIn headline' }}
        </button>
        <button class="btn-secondary" @click="copyPart('About')">
          {{ copiedPart === 'About' ? 'Copied.' : 'Copy About section' }}
        </button>
      </div>
      <p v-if="copyPartError" class="text-sm text-rose-700">{{ copyPartError }}</p>
    </div>

    <StudioSherpaFeedbackPanel
      v-if="result"
      :result="result"
      :was-mock="wasMock"
      output-label="LinkedIn profile"
      artifact-type="linkedin_section"
      default-title="My LinkedIn Profile"
      :student-uid="studentUid"
    />
  </div>
</template>
