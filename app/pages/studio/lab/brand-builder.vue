<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { usePortfolioArtifact } from '~/composables/usePortfolioArtifact'
import { useAiSherpa, type BrandCoachInput } from '~/composables/useAiSherpa'
import type {
  BrandCoachResponse,
  PortfolioArtifactType,
  SherpaAudience,
  SherpaOutputType
} from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const artifactApi = usePortfolioArtifact()
const sherpaApi = useAiSherpa()

const audienceOptions: Array<{ value: SherpaAudience; label: string }> = [
  { value: 'admissions', label: 'Admissions' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employer', label: 'Employer' },
  { value: 'customer', label: 'Customer' },
  { value: 'general', label: 'General' }
]

const outputOptions: Array<{ value: SherpaOutputType; label: string }> = [
  { value: 'word_choice', label: 'Word choice feedback' },
  { value: 'pitch_3s', label: '3-second pitch' },
  { value: 'pitch_30s', label: '30-second pitch' },
  { value: 'pitch_1min_tmay', label: '1-minute "Tell me about yourself"' },
  { value: 'star_story', label: 'STAR story' },
  { value: 'resume_bullets', label: 'Resume bullets' }
]

// Where each output type lands in the Portfolio.
const artifactTypeByOutput: Record<SherpaOutputType, PortfolioArtifactType> = {
  word_choice: 'brand_sentence',
  pitch_3s: 'intro_pitch',
  pitch_30s: 'intro_pitch',
  pitch_1min_tmay: 'intro_pitch',
  star_story: 'star_answer',
  resume_bullets: 'resume_bullet'
}

const defaultTitleByOutput: Record<SherpaOutputType, string> = {
  word_choice: 'My Brand Words',
  pitch_3s: 'My 3-Second Pitch',
  pitch_30s: 'My 30-Second Pitch',
  pitch_1min_tmay: 'My 1-Minute TMAY',
  star_story: 'My STAR Story',
  resume_bullets: 'My Resume Bullets'
}

const form = reactive<BrandCoachInput>({
  worksheet: '',
  selfWords: '',
  starExample: '',
  audience: 'general',
  outputType: 'word_choice'
})

const hasAnyAnswer = () =>
  [form.worksheet, form.selfWords, form.starExample].some((v) => v.trim().length > 0)

const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<BrandCoachResponse | null>(null)
const resultOutputType = ref<SherpaOutputType>('word_choice')
const wasMock = ref(false)

async function getFeedback() {
  if (asking.value || !hasAnyAnswer()) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandCoach({ ...form })
    result.value = res.sherpa
    resultOutputType.value = form.outputType
    wasMock.value = res.mock
    // Each new Sherpa version is saveable on its own — without this
    // reset, a student who iterates can never save the improved version.
    saved.value = false
    saveError.value = null
    saveTitle.value = defaultTitleByOutput[form.outputType]
  } catch (e: unknown) {
    askError.value =
      e instanceof Error ? e.message : 'Something went wrong asking the Sherpa. Try again.'
  } finally {
    asking.value = false
  }
}

const saveTitle = ref(defaultTitleByOutput.word_choice)
const saving = ref(false)
const saved = ref(false)
const saveError = ref<string | null>(null)

async function saveToPortfolio() {
  if (!result.value || saving.value) return
  saving.value = true
  saveError.value = null
  try {
    await artifactApi.create(
      studentUid,
      artifactTypeByOutput[resultOutputType.value],
      saveTitle.value,
      result.value.polishedVersion
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
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">Personal Brand Builder</h1>
    <p class="text-sm text-neutral-600">
      Paste in your worksheet work from this week. The AI Sherpa coaches like a person, not a
      chatbot — it will tell you what's strong, flag word choices, explain how your audience may
      hear them, and turn your real experience into pitches and resume-ready language. It never
      invents facts or numbers you didn't give it.
    </p>

    <div class="card space-y-3">
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Paste your worksheet work</span>
        <textarea
          v-model="form.worksheet"
          rows="6"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Copy in anything from your personal brand worksheets — sentences, lists, drafts. Rough is fine."
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Words you are using to describe yourself</span>
        <textarea
          v-model="form.selfWords"
          rows="2"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder='e.g. "philanthropist, hard worker, creative, people person"'
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium text-neutral-700">Experience / story / STAR example</span>
        <textarea
          v-model="form.starExample"
          rows="4"
          class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          placeholder="One specific thing you did: what was going on, what were you responsible for, what did YOU do, and what changed?"
        />
      </label>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="font-medium text-neutral-700">Who is this for?</span>
          <select
            v-model="form.audience"
            class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in audienceOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="font-medium text-neutral-700">What do you want to make?</span>
          <select
            v-model="form.outputType"
            class="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in outputOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="askError" class="text-sm text-rose-700">{{ askError }}</p>

      <button
        class="btn-primary w-full"
        :disabled="asking || !hasAnyAnswer()"
        @click="getFeedback"
      >
        {{ asking ? 'The Sherpa is reading your work…' : 'Get Sherpa Feedback' }}
      </button>
    </div>

    <div v-if="result" class="card space-y-4">
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
          Polished version — {{ outputOptions.find((o) => o.value === resultOutputType)?.label }}
        </h2>
        <p class="mt-1 whitespace-pre-wrap rounded-md bg-studio-50 p-3 text-sm font-medium text-neutral-900">
          {{ result.polishedVersion }}
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          Anything in [brackets] is yours to fill in — the Sherpa never makes up a number or result
          for you.
        </p>
      </div>

      <div v-if="result.followUpQuestions.length">
        <h2 class="text-sm font-semibold text-neutral-500">Make it stronger</h2>
        <ul class="mt-1 list-inside list-disc text-sm text-neutral-700">
          <li v-for="(q, i) in result.followUpQuestions" :key="i">{{ q }}</li>
        </ul>
        <p class="mt-1 text-xs text-neutral-500">
          Answer these in the boxes above, then tap "Get Sherpa Feedback" again.
        </p>
      </div>

      <div class="space-y-2 border-t border-neutral-200 pt-3">
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
        <div v-if="saved" class="space-y-1 text-sm">
          <p>
            <NuxtLink to="/studio/portfolio" class="font-medium text-studio-700">
              View it in My Portfolio →
            </NuxtLink>
          </p>
          <p class="text-neutral-600">
            Happy with it? Go back to
            <NuxtLink to="/studio/today" class="font-medium text-studio-700">Today</NuxtLink>
            and tap "Mark complete" to finish this mission.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
