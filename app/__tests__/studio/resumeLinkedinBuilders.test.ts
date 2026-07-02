// Guards the Resume Builder and LinkedIn Builder modules: compose
// utilities emit the labeled lines the Practice Mode mock parses, the
// mock produces a usable resume draft (bracketed prompts, no invented
// numbers) and LinkedIn language (Student | Aspiring … | Interested in
// headline formula), the Lab index links both routes with no "Coming
// soon", and the Olin Way DOCX template exists at the exact path.
//
// Runner: `tsx app/__tests__/studio/resumeLinkedinBuilders.test.ts`
// (or `npm run test:studio-builders`).

import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateMockBrandCoachResponse } from '../../../server/utils/studioPromptTemplates/brandCoach'
import {
  OLIN_RESUME_TEMPLATE_HREF,
  composeResumeWorksheet,
  emptyResumeBuilderForm,
  hasAnyResumeAnswer
} from '../../utils/studioResumeBuilder'
import {
  composeLinkedinWorksheet,
  emptyLinkedinBuilderForm,
  hasAnyLinkedinAnswer
} from '../../utils/studioLinkedinBuilder'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const ROOT = process.cwd()

/* -------------------------------------------------------------------
 * Olin Way template
 * ------------------------------------------------------------------ */

test('Olin Way DOCX template exists at the exact href path', () => {
  assert.equal(
    OLIN_RESUME_TEMPLATE_HREF,
    '/studio/templates/resume/Olin_Way_Resume_Template_OlinConnect.docx'
  )
  const diskPath = join(ROOT, 'public', OLIN_RESUME_TEMPLATE_HREF)
  assert.ok(existsSync(diskPath), `missing template: ${diskPath}`)
})

/* -------------------------------------------------------------------
 * Lab index + module pages
 * ------------------------------------------------------------------ */

test('lab index links all three modules plus the all-in-one fallback, no Coming soon', () => {
  const labIndex = readFileSync(join(ROOT, 'app/pages/studio/lab/index.vue'), 'utf8')
  assert.ok(labIndex.includes('/studio/lab/personal-brand'))
  assert.ok(labIndex.includes('/studio/lab/resume-builder'))
  assert.ok(labIndex.includes('/studio/lab/linkedin-builder'))
  assert.ok(labIndex.includes('/studio/lab/brand-builder'))
  assert.ok(!labIndex.toLowerCase().includes('coming soon'))
})

test('resume builder page is a real form wired to resume_draft', () => {
  const page = readFileSync(join(ROOT, 'app/pages/studio/lab/resume-builder.vue'), 'utf8')
  assert.ok(page.includes('Build Resume Draft'))
  assert.ok(page.includes("'resume_draft'"))
  assert.ok(page.includes('composeResumeWorksheet'))
  assert.ok(page.includes('OLIN_RESUME_TEMPLATE_HREF'))
  // The required student-facing copy may be line-wrapped in the template.
  const flattened = page.replace(/\s+/g, ' ')
  assert.ok(
    flattened.includes(
      'Use this as a clean resume structure. Your final resume can be pasted into your school, internship, scholarship, or job template.'
    )
  )
})

test('linkedin builder page is a real form wired to linkedin_profile', () => {
  const page = readFileSync(join(ROOT, 'app/pages/studio/lab/linkedin-builder.vue'), 'utf8')
  assert.ok(page.includes("'linkedin_profile'"))
  assert.ok(page.includes('composeLinkedinWorksheet'))
  assert.ok(page.includes('Build LinkedIn Language'))
})

/* -------------------------------------------------------------------
 * Resume compose + Practice Mode mock
 * ------------------------------------------------------------------ */

test('empty resume form composes to empty string and hasAnyResumeAnswer is false', () => {
  const form = emptyResumeBuilderForm()
  assert.equal(composeResumeWorksheet(form), '')
  assert.equal(hasAnyResumeAnswer(form), false)
})

test('resume compose emits labeled lines the mock parses', () => {
  const form = emptyResumeBuilderForm()
  form.fullName = 'Jordan Smith'
  form.school = 'Renaissance High School'
  form.experiences[0]!.organization = 'House Phoenix Pop-Up'
  form.experiences[0]!.whatYouDid = 'Ran the register and tracked inventory for the pop-up shop'
  const text = composeResumeWorksheet(form)
  assert.ok(text.startsWith('Resume Builder'))
  assert.ok(text.includes('Contact — Full name: Jordan Smith'))
  assert.ok(text.includes('Education — School: Renaissance High School'))
  assert.ok(text.includes('Experience 1 — Organization: House Phoenix Pop-Up'))
  assert.ok(
    text.includes('Experience 1 — What you did: Ran the register and tracked inventory for the pop-up shop')
  )
  assert.ok(hasAnyResumeAnswer(form))
})

test('mock resume draft has sections, bracketed prompts, and no invented digits', () => {
  const form = emptyResumeBuilderForm()
  form.school = 'Renaissance High School'
  form.experiences[0]!.whatYouDid = 'Organized the school supply drive for local families'
  form.projects[0]!.whatYouDid = 'Designed flyers for the pop-up shop'
  form.technicalSkills = 'Canva, spreadsheets'
  form.worksheetLanguage = 'I am a student leader who shows up for my community.'

  const res = generateMockBrandCoachResponse({
    worksheet: composeResumeWorksheet(form),
    selfWords: '',
    starExample: '',
    audience: 'recruiter',
    outputType: 'resume_draft'
  })

  const draft = res.polishedVersion
  assert.ok(draft.includes('PROFILE'))
  assert.ok(draft.includes('EDUCATION'))
  assert.ok(draft.includes('EXPERIENCE'))
  assert.ok(draft.includes('SKILLS'))
  assert.ok(draft.includes('Organized the school supply drive for local families'))
  assert.ok(draft.includes('[add number]'), 'digitless input must get an [add number] prompt')

  // No fabrication: with digitless input, every digit in the draft
  // must live inside a bracketed coaching prompt.
  const outsideBrackets = draft.replace(/\[[^\]]*\]/g, '')
  assert.ok(!/\d/.test(outsideBrackets), `invented digits in draft: ${outsideBrackets}`)
})

/* -------------------------------------------------------------------
 * LinkedIn compose + Practice Mode mock
 * ------------------------------------------------------------------ */

test('empty linkedin form composes to empty string', () => {
  const form = emptyLinkedinBuilderForm()
  assert.equal(composeLinkedinWorksheet(form), '')
  assert.equal(hasAnyLinkedinAnswer(form), false)
})

test('linkedin compose emits labeled lines the mock parses', () => {
  const form = emptyLinkedinBuilderForm()
  form.name = 'Jordan Smith'
  form.careerInterests = 'Marketing'
  form.topics = 'Marketing, Fashion, Community Development'
  const text = composeLinkedinWorksheet(form)
  assert.ok(text.startsWith('LinkedIn Builder'))
  assert.ok(text.includes('Name: Jordan Smith'))
  assert.ok(text.includes('Career interests: Marketing'))
  assert.ok(text.includes('Topics: Marketing, Fashion, Community Development'))
})

test('mock linkedin headline follows the Student | Aspiring | Interested in formula', () => {
  const form = emptyLinkedinBuilderForm()
  form.name = 'Jordan Smith'
  form.school = 'Renaissance High School'
  form.careerInterests = 'Marketing'
  form.topics = 'Marketing, Fashion, Community Development'
  form.brandSentence = 'I turn ideas into products people actually want.'

  const res = generateMockBrandCoachResponse({
    worksheet: composeLinkedinWorksheet(form),
    selfWords: '',
    starExample: '',
    audience: 'recruiter',
    outputType: 'linkedin_profile'
  })

  const out = res.polishedVersion
  assert.ok(
    out.includes(
      'Headline: Student | Aspiring Marketing | Interested in Marketing, Fashion, and Community Development'
    ),
    `headline formula broken:\n${out}`
  )
  assert.ok(out.includes('About:'))
  assert.ok(out.includes('Skills:'))
  assert.ok(out.includes('Connection intro:'))
})

/* -------------------------------------------------------------------
 * Word-flag regression
 * ------------------------------------------------------------------ */

test('philanthropist still gets flagged through the new output types', () => {
  const form = emptyLinkedinBuilderForm()
  form.brandSentence = 'I am a philanthropist who gives back.'
  const res = generateMockBrandCoachResponse({
    worksheet: composeLinkedinWorksheet(form),
    selfWords: '',
    starExample: '',
    audience: 'general',
    outputType: 'linkedin_profile'
  })
  assert.ok(res.wordChoiceFlags.some((f) => f.word.toLowerCase().includes('philanthropist')))
})

/* -------------------------------------------------------------------
 * Runner
 * ------------------------------------------------------------------ */

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    // eslint-disable-next-line no-console
    console.log(`ok  - ${t.name}`)
  } catch (err) {
    failed++
    // eslint-disable-next-line no-console
    console.error(`FAIL - ${t.name}`)
    console.error(err)
  }
}

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failed} test(s) failed`)
  process.exit(1)
}
// eslint-disable-next-line no-console
console.log(`\n${tests.length} passed`)
