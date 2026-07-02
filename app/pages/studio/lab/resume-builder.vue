<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useStudioAuthStore } from '~/stores/studioAuth'
import { useAiSherpa } from '~/composables/useAiSherpa'
import { useWorksheetResponse } from '~/composables/useWorksheetResponse'
import {
  OLIN_RESUME_TEMPLATE_HREF,
  composeResumeWorksheet,
  emptyExperienceEntry,
  emptyLeadershipEntry,
  emptyProjectEntry,
  emptyResumeBuilderForm,
  emptyVolunteerEntry,
  hasAnyResumeAnswer,
  type ResumeBuilderForm,
  type ResumeExperienceEntry,
  type ResumeLeadershipEntry,
  type ResumeProjectEntry,
  type ResumeVolunteerEntry
} from '~/utils/studioResumeBuilder'
import type { BrandCoachResponse, SherpaAudience } from '~/types/studio/models'

definePageMeta({ layout: 'studio' })

const studioAuth = useStudioAuthStore()
const studentUid = studioAuth.profile?.uid ?? ''

const sherpaApi = useAiSherpa()
const responseApi = useWorksheetResponse()

const form = reactive<ResumeBuilderForm>(emptyResumeBuilderForm())

const audienceOptions: Array<{ value: SherpaAudience; label: string }> = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'employer', label: 'Employer' },
  { value: 'admissions', label: 'Admissions' },
  { value: 'scholarship', label: 'Scholarship committee' },
  { value: 'customer', label: 'Customer' },
  { value: 'general', label: 'General' }
]
const audience = ref<SherpaAudience>('recruiter')

interface FieldDef<T> {
  key: keyof T & string
  label: string
  rows?: number
}

const contactFields: FieldDef<ResumeBuilderForm>[] = [
  { key: 'fullName', label: 'Full name', rows: 1 },
  { key: 'email', label: 'Email', rows: 1 },
  { key: 'phone', label: 'Phone', rows: 1 },
  { key: 'cityState', label: 'City/state', rows: 1 },
  { key: 'linkedinUrl', label: 'LinkedIn URL (if you have one)', rows: 1 }
]

const educationFields: FieldDef<ResumeBuilderForm>[] = [
  { key: 'school', label: 'School', rows: 1 },
  { key: 'gradYear', label: 'Expected graduation year', rows: 1 },
  { key: 'gpa', label: 'GPA (only if you want to include it)', rows: 1 },
  { key: 'coursework', label: 'Relevant coursework/programs' },
  { key: 'honors', label: 'Honors/awards' }
]

const experienceFields: FieldDef<ResumeExperienceEntry>[] = [
  { key: 'organization', label: 'Organization / employer / project', rows: 1 },
  { key: 'role', label: 'Role/title', rows: 1 },
  { key: 'location', label: 'Location', rows: 1 },
  { key: 'dates', label: 'Dates', rows: 1 },
  { key: 'whatYouDid', label: 'What did you do?' },
  { key: 'whoYouServed', label: 'Who did you serve/help/work with?', rows: 1 },
  { key: 'skillsUsed', label: 'What skills did you use?', rows: 1 },
  { key: 'whatChanged', label: 'What changed because of your work?', rows: 1 },
  { key: 'numbers', label: 'Numbers or results (if available)', rows: 1 }
]

const projectFields: FieldDef<ResumeProjectEntry>[] = [
  { key: 'name', label: 'Project name', rows: 1 },
  { key: 'goal', label: 'What was the goal?', rows: 1 },
  { key: 'whatYouDid', label: 'What did you personally do?' },
  { key: 'tools', label: 'Tools/materials used', rows: 1 },
  { key: 'outcome', label: 'Result/outcome', rows: 1 }
]

const volunteerFields: FieldDef<ResumeVolunteerEntry>[] = [
  { key: 'organization', label: 'Organization or activity', rows: 1 },
  { key: 'role', label: 'Role', rows: 1 },
  { key: 'whatYouDid', label: 'What you did' },
  { key: 'whoBenefited', label: 'Who benefited', rows: 1 },
  { key: 'result', label: 'Result/lesson', rows: 1 }
]

const leadershipFields: FieldDef<ResumeLeadershipEntry>[] = [
  { key: 'activity', label: 'Activity/team/club', rows: 1 },
  { key: 'role', label: 'Role', rows: 1 },
  { key: 'responsibilities', label: 'Responsibilities' },
  { key: 'achievement', label: 'Achievement or lesson', rows: 1 }
]

const skillsFields: FieldDef<ResumeBuilderForm>[] = [
  { key: 'technicalSkills', label: 'Technical skills', rows: 1 },
  { key: 'communicationSkills', label: 'Communication/teamwork skills', rows: 1 },
  { key: 'creativeBusinessSkills', label: 'Creative/business skills', rows: 1 },
  { key: 'toolsSoftware', label: 'Tools/software', rows: 1 }
]

const interestFields: FieldDef<ResumeBuilderForm>[] = [
  { key: 'interestFields', label: 'Fields/roles you are interested in', rows: 1 },
  { key: 'opportunityType', label: 'Type of opportunity you want next', rows: 1 }
]

// ---- Draft persistence ----
const DRAFT_TYPE = 'resume-builder'
const draftId = ref<string | null>(null)
const draftLoading = ref(false)
const draftSaving = ref(false)
const draftSavedAt = ref<string | null>(null)
const draftError = ref<string | null>(null)

function restoreEntries<T extends Record<string, string>>(
  raw: unknown,
  makeEmpty: () => T
): T[] {
  if (!Array.isArray(raw) || !raw.length) return [makeEmpty()]
  return raw.map((item) => {
    const entry = makeEmpty()
    if (item && typeof item === 'object') {
      for (const key of Object.keys(entry) as Array<keyof T>) {
        const value = (item as Record<string, unknown>)[key as string]
        if (typeof value === 'string') entry[key] = value as T[keyof T]
      }
    }
    return entry
  })
}

onMounted(async () => {
  if (!studentUid) return
  draftLoading.value = true
  try {
    const existing = await responseApi.loadLatest(studentUid, DRAFT_TYPE)
    if (existing) {
      draftId.value = existing.id
      for (const key of Object.keys(form) as Array<keyof ResumeBuilderForm>) {
        const value = existing.rawInputs[key]
        if (typeof form[key] === 'string' && typeof value === 'string') {
          ;(form[key] as string) = value
        }
      }
      form.experiences = restoreEntries(existing.rawInputs.experiences, emptyExperienceEntry)
      form.projects = restoreEntries(existing.rawInputs.projects, emptyProjectEntry)
      form.volunteer = restoreEntries(existing.rawInputs.volunteer, emptyVolunteerEntry)
      form.leadership = restoreEntries(existing.rawInputs.leadership, emptyLeadershipEntry)
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
    const plain = JSON.parse(JSON.stringify(form)) as Record<string, string>
    draftId.value = await responseApi.saveDraft(studentUid, DRAFT_TYPE, plain, draftId.value)
    draftSavedAt.value = new Date().toLocaleTimeString()
  } catch {
    draftError.value = "Couldn't save your draft. Check your connection and try again."
  } finally {
    draftSaving.value = false
  }
}

// ---- Build Resume Draft ----
const RESUME_FOCUS =
  "Turn this student's structured resume form into a full resume draft with strong, credible bullets. Follow every resume-bullet rule; use bracketed prompts for missing details; never invent facts."

const asking = ref(false)
const askError = ref<string | null>(null)
const result = ref<BrandCoachResponse | null>(null)
const wasMock = ref(false)

async function buildResumeDraft() {
  if (asking.value || !hasAnyResumeAnswer(form)) return
  asking.value = true
  askError.value = null
  try {
    const res = await sherpaApi.askBrandCoach({
      worksheet: composeResumeWorksheet(form),
      selfWords: '',
      starExample: '',
      focus: RESUME_FOCUS,
      audience: audience.value,
      outputType: 'resume_draft'
    })
    result.value = res.sherpa
    wasMock.value = res.mock
  } catch (e: unknown) {
    askError.value =
      e instanceof Error ? e.message : 'Something went wrong building your resume draft. Try again.'
  } finally {
    asking.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <NuxtLink to="/studio/lab" class="text-xs text-studio-700">← Back to the Lab</NuxtLink>
      <h1 class="text-lg font-semibold">Resume Builder</h1>
      <p class="text-sm text-neutral-600">
        Fill in what you have — rough answers are fine, and every section is optional. The Sherpa
        turns your real experience into a resume draft with strong bullets, and asks for anything
        that would make it stronger.
      </p>
    </div>

    <p v-if="draftLoading" class="text-sm text-neutral-500">Loading your saved answers…</p>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Contact</h2>
      <StudioWorksheetField
        v-for="f in contactFields"
        :key="f.key"
        v-model="(form[f.key] as string)"
        :label="f.label"
        :rows="f.rows"
      />
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Education</h2>
      <StudioWorksheetField
        v-for="f in educationFields"
        :key="f.key"
        v-model="(form[f.key] as string)"
        :label="f.label"
        :rows="f.rows"
      />
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Work experience</h2>
      <div
        v-for="(entry, i) in form.experiences"
        :key="i"
        class="space-y-3 rounded-md border border-neutral-200 p-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-neutral-500">Experience {{ i + 1 }}</p>
          <button
            v-if="form.experiences.length > 1"
            class="text-xs text-rose-700 underline"
            @click="form.experiences.splice(i, 1)"
          >
            Remove
          </button>
        </div>
        <StudioWorksheetField
          v-for="f in experienceFields"
          :key="f.key"
          v-model="entry[f.key]"
          :label="f.label"
          :rows="f.rows"
        />
      </div>
      <button class="btn-secondary" @click="form.experiences.push(emptyExperienceEntry())">
        + Add another experience
      </button>
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Projects</h2>
      <div
        v-for="(entry, i) in form.projects"
        :key="i"
        class="space-y-3 rounded-md border border-neutral-200 p-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-neutral-500">Project {{ i + 1 }}</p>
          <button
            v-if="form.projects.length > 1"
            class="text-xs text-rose-700 underline"
            @click="form.projects.splice(i, 1)"
          >
            Remove
          </button>
        </div>
        <StudioWorksheetField
          v-for="f in projectFields"
          :key="f.key"
          v-model="entry[f.key]"
          :label="f.label"
          :rows="f.rows"
        />
      </div>
      <button class="btn-secondary" @click="form.projects.push(emptyProjectEntry())">
        + Add another project
      </button>
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Volunteer / community experience</h2>
      <div
        v-for="(entry, i) in form.volunteer"
        :key="i"
        class="space-y-3 rounded-md border border-neutral-200 p-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-neutral-500">Volunteer {{ i + 1 }}</p>
          <button
            v-if="form.volunteer.length > 1"
            class="text-xs text-rose-700 underline"
            @click="form.volunteer.splice(i, 1)"
          >
            Remove
          </button>
        </div>
        <StudioWorksheetField
          v-for="f in volunteerFields"
          :key="f.key"
          v-model="entry[f.key]"
          :label="f.label"
          :rows="f.rows"
        />
      </div>
      <button class="btn-secondary" @click="form.volunteer.push(emptyVolunteerEntry())">
        + Add another volunteer entry
      </button>
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Leadership / activities / sports</h2>
      <div
        v-for="(entry, i) in form.leadership"
        :key="i"
        class="space-y-3 rounded-md border border-neutral-200 p-3"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold text-neutral-500">Activity {{ i + 1 }}</p>
          <button
            v-if="form.leadership.length > 1"
            class="text-xs text-rose-700 underline"
            @click="form.leadership.splice(i, 1)"
          >
            Remove
          </button>
        </div>
        <StudioWorksheetField
          v-for="f in leadershipFields"
          :key="f.key"
          v-model="entry[f.key]"
          :label="f.label"
          :rows="f.rows"
        />
      </div>
      <button class="btn-secondary" @click="form.leadership.push(emptyLeadershipEntry())">
        + Add another activity
      </button>
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Skills</h2>
      <StudioWorksheetField
        v-for="f in skillsFields"
        :key="f.key"
        v-model="(form[f.key] as string)"
        :label="f.label"
        :rows="f.rows"
      />
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Career interests</h2>
      <StudioWorksheetField
        v-for="f in interestFields"
        :key="f.key"
        v-model="(form[f.key] as string)"
        :label="f.label"
        :rows="f.rows"
      />
    </div>

    <div class="card space-y-3">
      <h2 class="text-sm font-semibold text-neutral-800">Your Personal Brand language</h2>
      <StudioWorksheetField
        v-model="form.worksheetLanguage"
        label="Paste strong language from your Personal Brand worksheets."
        prompt="Brand sentence, 3-second intro, 30-second pitch, STAR story, or your resume summary draft from Worksheet 7."
        :rows="4"
      />
    </div>

    <div class="card space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn-secondary" :disabled="draftSaving" @click="saveDraft">
          {{ draftSaving ? 'Saving…' : 'Save my answers' }}
        </button>
        <span v-if="draftSavedAt" class="text-xs text-neutral-500">Saved at {{ draftSavedAt }}</span>
      </div>
      <p v-if="draftError" class="text-sm text-rose-700">{{ draftError }}</p>

      <label class="block text-sm">
        <span class="block font-semibold text-neutral-800">Audience</span>
        <span class="mt-0.5 block text-xs text-neutral-600">Who is this resume for?</span>
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
        :disabled="asking || !hasAnyResumeAnswer(form)"
        @click="buildResumeDraft"
      >
        {{ asking ? 'The Sherpa is building your draft…' : 'Build Resume Draft' }}
      </button>
    </div>

    <StudioSherpaFeedbackPanel
      v-if="result"
      :result="result"
      :was-mock="wasMock"
      output-label="Resume draft"
      artifact-type="resume_bullet"
      default-title="My Resume Draft"
      :student-uid="studentUid"
    />

    <div class="card space-y-2 text-sm">
      <h2 class="font-semibold text-neutral-800">Olin Way resume template (reference)</h2>
      <p class="text-neutral-600">
        Use this as a clean resume structure. Your final resume can be pasted into your school,
        internship, scholarship, or job template.
      </p>
      <a :href="OLIN_RESUME_TEMPLATE_HREF" class="btn-secondary inline-block" download>
        Download the Olin Way template (DOCX)
      </a>
    </div>
  </div>
</template>
