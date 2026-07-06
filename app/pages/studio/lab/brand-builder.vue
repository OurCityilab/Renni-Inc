<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useAiSherpa } from '~/composables/useAiSherpa'
import {
  composeBrandCoachFields,
  emptyBrandWorksheetForm,
  hasAnyWorksheetAnswer,
  type BrandWorksheetForm
} from '~/utils/studioBrandWorksheet'
import { studioTemplateDownloads } from '~/data/studio/templates/worksheetPrompts'
import { personalBrandWorksheets } from '~/data/studio/worksheets/personalBrandPitchLab'
import type {
  BrandCoachResponse,
  PortfolioArtifactType,
  SherpaAudience,
  SherpaOutputType
} from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const sherpaApi = useAiSherpa()

const audienceOptions: Array<{ value: SherpaAudience; label: string }> = [
  { value: 'admissions', label: 'Admissions' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employer', label: 'Employer' },
  { value: 'scholarship', label: 'Scholarship committee' },
  { value: 'customer', label: 'Customer' },
  { value: 'general', label: 'General' }
]

const outputOptions: Array<{ value: SherpaOutputType; label: string }> = [
  { value: 'word_choice', label: 'Word choice feedback' },
  { value: 'pitch_3s', label: '3-second pitch' },
  { value: 'pitch_30s', label: '30-second pitch' },
  { value: 'pitch_1min_tmay', label: '1-minute / TMAY pitch' },
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
  resume_bullets: 'resume_bullet',
  resume_draft: 'resume_bullet',
  linkedin_profile: 'linkedin_section'
}

const defaultTitleByOutput: Record<SherpaOutputType, string> = {
  word_choice: 'My Brand Words',
  pitch_3s: 'My 3-Second Pitch',
  pitch_30s: 'My 30-Second Pitch',
  pitch_1min_tmay: 'My 1-Minute TMAY',
  star_story: 'My STAR Story',
  resume_bullets: 'My Resume Bullets',
  resume_draft: 'My Resume Draft',
  linkedin_profile: 'My LinkedIn Profile'
}

interface WorksheetStep {
  key: keyof BrandWorksheetForm
  step: string
  title: string
  prompt: string
  rows: number
  placeholder?: string
}

const worksheetSteps: WorksheetStep[] = [
  {
    key: 'rawMaterial',
    step: 'Step 1',
    title: 'Raw Material',
    prompt:
      'Paste anything from your worksheet or notes: rough sentences, activities, jobs, sports, volunteer work, family responsibilities, class projects, business ideas, accomplishments, or stories.',
    rows: 6
  },
  {
    key: 'whatICareAbout',
    step: 'Step 2',
    title: 'What I Care About',
    prompt: 'What problems, people, places, or ideas do you keep coming back to?',
    rows: 2
  },
  {
    key: 'whyItMatters',
    step: 'Step 3',
    title: 'Why It Matters',
    prompt:
      'What experience made this important to you? Be specific: a moment, person, place, challenge, or season of your life.',
    rows: 3
  },
  {
    key: 'whoIWantToHelp',
    step: 'Step 4',
    title: 'Who I Want to Help',
    prompt:
      'Who benefits when you do your best work? Examples: classmates, younger students, customers, athletes, family, neighborhood, team, school, community.',
    rows: 2
  },
  {
    key: 'whatPeopleComeToMeFor',
    step: 'Step 5',
    title: 'What People Come to Me For',
    prompt:
      'When friends, family, teachers, coaches, teammates, or customers need something, what do they come to you for?',
    rows: 2
  },
  {
    key: 'selfWords',
    step: 'Step 6',
    title: 'Words I Use to Describe Myself',
    prompt:
      'List the words or phrases you are currently using to describe yourself. Examples: philanthropist, leader, hard worker, creative, problem solver, people person, entrepreneur.',
    rows: 2
  },
  {
    key: 'myEvidence',
    step: 'Step 7',
    title: 'My Evidence',
    prompt:
      'For each word, give proof. What have you actually done that shows this? The Sherpa will help you check if your words match your evidence.',
    rows: 3
  }
]

const starSteps: Array<{ key: keyof BrandWorksheetForm; label: string; prompt: string }> = [
  {
    key: 'starSituation',
    label: 'S — Situation',
    prompt: 'What was going on? Where were you, who was involved, and what was happening?'
  },
  {
    key: 'starTask',
    label: 'T — Task',
    prompt: 'What were you responsible for? What needed to happen, and why was it on you?'
  },
  {
    key: 'starAction',
    label: 'A — Action',
    prompt: 'What did you personally do? Use "I" statements, not just "we."'
  },
  {
    key: 'starResult',
    label: 'R — Result',
    prompt:
      'What changed because of what you did? Numbers are best. If you do not have a number, name what improved, what you learned, who benefited, or what was different afterward.'
  }
]

const form = reactive<BrandWorksheetForm>(emptyBrandWorksheetForm())
const audience = ref<SherpaAudience>('general')
const outputType = ref<SherpaOutputType>('word_choice')

const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<BrandCoachResponse | null>(null)
const resultOutputType = ref<SherpaOutputType>('word_choice')
const wasMock = ref(false)

async function getFeedback() {
  if (asking.value || !hasAnyWorksheetAnswer(form)) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandCoach({
      ...composeBrandCoachFields(form),
      audience: audience.value,
      outputType: outputType.value,
      source: 'brand-builder'
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
  <div class="space-y-4">
    <h1 class="text-lg font-semibold">Personal Brand Builder</h1>
    <p class="text-sm text-neutral-600">
      Use the worksheet below to turn your real experiences into stronger words, pitches, STAR
      stories, and resume-ready bullets. Rough answers are fine. The AI Sherpa will push your
      wording, ask for better evidence, and help you sound clear, credible, and professional
      without inventing facts.
    </p>

    <div class="card space-y-4">
      <label v-for="stepDef in worksheetSteps" :key="stepDef.key" class="block text-sm">
        <span class="block font-semibold text-neutral-800">
          {{ stepDef.step }}: {{ stepDef.title }}
        </span>
        <span class="mt-0.5 block text-xs text-neutral-600">{{ stepDef.prompt }}</span>
        <textarea
          v-model="form[stepDef.key]"
          :rows="stepDef.rows"
          class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <p class="text-sm font-semibold text-neutral-800">Step 8: STAR Story</p>
        <p class="mt-0.5 text-xs text-neutral-600">
          One real experience, told in four parts. This is what interviews and applications are
          built from.
        </p>
        <div class="mt-2 space-y-3">
          <label v-for="star in starSteps" :key="star.key" class="block text-sm">
            <span class="block font-medium text-neutral-700">{{ star.label }}</span>
            <span class="mt-0.5 block text-xs text-neutral-600">{{ star.prompt }}</span>
            <textarea
              v-model="form[star.key]"
              rows="2"
              class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block text-sm">
          <span class="block font-semibold text-neutral-800">Step 9: Audience</span>
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
        <label class="block text-sm">
          <span class="block font-semibold text-neutral-800">Step 10: What do you want to make?</span>
          <span class="mt-0.5 block text-xs text-neutral-600">The Sherpa builds this from your answers above.</span>
          <select
            v-model="outputType"
            class="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option v-for="opt in outputOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <span v-if="outputType === 'resume_bullets'" class="mt-1 block text-xs text-neutral-500">
            These bullets are meant to help you get the wording right. You can paste them into
            your school, scholarship, internship, or job resume template later.
          </span>
        </label>
      </div>

      <p v-if="askError" class="text-sm text-rose-700">{{ askError }}</p>

      <button
        class="btn-primary w-full"
        :disabled="asking || !hasAnyWorksheetAnswer(form)"
        @click="getFeedback"
      >
        {{ asking ? 'The Sherpa is reading your work…' : 'Get Sherpa Feedback' }}
      </button>
    </div>

    <template v-if="result">
      <StudioSherpaFeedbackPanel
        :result="result"
        :was-mock="wasMock"
        :output-label="outputOptions.find((o) => o.value === resultOutputType)?.label ?? ''"
        :artifact-type="artifactTypeByOutput[resultOutputType]"
        :default-title="defaultTitleByOutput[resultOutputType]"
        :student-uid="studentUid"
      />
      <p class="text-sm text-neutral-600">
        Happy with your final draft? Save it to your Portfolio above, then go back to
        <NuxtLink to="/studio/today" class="font-medium text-studio-700">Today</NuxtLink>
        and tap "Mark complete" to finish this mission.
      </p>
    </template>

    <div class="card space-y-1">
      <h2 class="text-xs font-semibold text-neutral-500">Optional backup templates</h2>
      <p class="text-xs text-neutral-500">
        You don't need these to use the Brand Builder — the worksheet above is the whole flow.
        Printable copies if you want to draft on paper first:
      </p>
      <ul class="space-y-1 pt-1">
        <li v-for="ws in personalBrandWorksheets" :key="ws.pdfHref" class="text-xs">
          <a
            :href="ws.pdfHref"
            target="_blank"
            rel="noopener"
            class="text-studio-700 underline"
          >Worksheet {{ ws.number }}: {{ ws.title }} (PDF)</a>
        </li>
        <li v-for="tpl in studioTemplateDownloads" :key="tpl.href" class="text-xs">
          <a
            :href="tpl.href"
            target="_blank"
            rel="noopener"
            class="text-studio-700 underline"
          >{{ tpl.label }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>
