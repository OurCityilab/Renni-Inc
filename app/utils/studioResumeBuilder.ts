// Resume Builder form model + composition into the brand-coach
// payload's worksheet field. Compose emits ONE labeled line per
// answer ("Experience 1 — What you did: …") — the server's Practice
// Mode mock parses these labels, so keep them in sync with
// server/utils/studioPromptTemplates/brandCoach.ts (lineValues).

export const OLIN_RESUME_TEMPLATE_HREF =
  '/studio/templates/resume/Olin_Way_Resume_Template_OlinConnect.docx'

// Entry shapes are type aliases (not interfaces) so they satisfy the
// Record<string, string> constraints in pushEntries/restoreEntries —
// interfaces lack implicit index signatures.
export type ResumeExperienceEntry = {
  organization: string
  role: string
  location: string
  dates: string
  whatYouDid: string
  whoYouServed: string
  skillsUsed: string
  whatChanged: string
  numbers: string
}

export type ResumeProjectEntry = {
  name: string
  goal: string
  whatYouDid: string
  tools: string
  outcome: string
}

export type ResumeVolunteerEntry = {
  organization: string
  role: string
  whatYouDid: string
  whoBenefited: string
  result: string
}

export type ResumeLeadershipEntry = {
  activity: string
  role: string
  responsibilities: string
  achievement: string
}

export interface ResumeBuilderForm {
  fullName: string
  email: string
  phone: string
  cityState: string
  linkedinUrl: string
  school: string
  gradYear: string
  gpa: string
  coursework: string
  honors: string
  experiences: ResumeExperienceEntry[]
  projects: ResumeProjectEntry[]
  volunteer: ResumeVolunteerEntry[]
  leadership: ResumeLeadershipEntry[]
  technicalSkills: string
  communicationSkills: string
  creativeBusinessSkills: string
  toolsSoftware: string
  interestFields: string
  opportunityType: string
  worksheetLanguage: string
}

export const emptyExperienceEntry = (): ResumeExperienceEntry => ({
  organization: '',
  role: '',
  location: '',
  dates: '',
  whatYouDid: '',
  whoYouServed: '',
  skillsUsed: '',
  whatChanged: '',
  numbers: ''
})

export const emptyProjectEntry = (): ResumeProjectEntry => ({
  name: '',
  goal: '',
  whatYouDid: '',
  tools: '',
  outcome: ''
})

export const emptyVolunteerEntry = (): ResumeVolunteerEntry => ({
  organization: '',
  role: '',
  whatYouDid: '',
  whoBenefited: '',
  result: ''
})

export const emptyLeadershipEntry = (): ResumeLeadershipEntry => ({
  activity: '',
  role: '',
  responsibilities: '',
  achievement: ''
})

export function emptyResumeBuilderForm(): ResumeBuilderForm {
  return {
    fullName: '',
    email: '',
    phone: '',
    cityState: '',
    linkedinUrl: '',
    school: '',
    gradYear: '',
    gpa: '',
    coursework: '',
    honors: '',
    experiences: [emptyExperienceEntry()],
    projects: [emptyProjectEntry()],
    volunteer: [emptyVolunteerEntry()],
    leadership: [emptyLeadershipEntry()],
    technicalSkills: '',
    communicationSkills: '',
    creativeBusinessSkills: '',
    toolsSoftware: '',
    interestFields: '',
    opportunityType: '',
    worksheetLanguage: ''
  }
}

const oneLine = (value: string) => value.trim().replace(/\s+/g, ' ')

function push(lines: string[], label: string, value: string) {
  const v = oneLine(value)
  if (v) lines.push(`${label}: ${v}`)
}

function pushEntries<T extends Record<string, string>>(
  lines: string[],
  prefix: string,
  entries: T[],
  labels: Array<[keyof T & string, string]>
) {
  let n = 0
  for (const entry of entries) {
    if (!Object.values(entry).some((v) => v.trim())) continue
    n += 1
    for (const [key, label] of labels) {
      push(lines, `${prefix} ${n} — ${label}`, entry[key])
    }
  }
}

export function composeResumeWorksheet(form: ResumeBuilderForm): string {
  const lines: string[] = []

  push(lines, 'Contact — Full name', form.fullName)
  push(lines, 'Contact — Email', form.email)
  push(lines, 'Contact — Phone', form.phone)
  push(lines, 'Contact — City/state', form.cityState)
  push(lines, 'Contact — LinkedIn', form.linkedinUrl)

  push(lines, 'Education — School', form.school)
  push(lines, 'Education — Expected graduation year', form.gradYear)
  push(lines, 'Education — GPA', form.gpa)
  push(lines, 'Education — Relevant coursework/programs', form.coursework)
  push(lines, 'Education — Honors/awards', form.honors)

  pushEntries(lines, 'Experience', form.experiences, [
    ['organization', 'Organization'],
    ['role', 'Role/title'],
    ['location', 'Location'],
    ['dates', 'Dates'],
    ['whatYouDid', 'What you did'],
    ['whoYouServed', 'Who you served'],
    ['skillsUsed', 'Skills used'],
    ['whatChanged', 'What changed'],
    ['numbers', 'Numbers/results']
  ])

  pushEntries(lines, 'Project', form.projects, [
    ['name', 'Project name'],
    ['goal', 'Goal'],
    ['whatYouDid', 'What you personally did'],
    ['tools', 'Tools/materials'],
    ['outcome', 'Result/outcome']
  ])

  pushEntries(lines, 'Volunteer', form.volunteer, [
    ['organization', 'Organization/activity'],
    ['role', 'Role'],
    ['whatYouDid', 'What you did'],
    ['whoBenefited', 'Who benefited'],
    ['result', 'Result/lesson']
  ])

  pushEntries(lines, 'Leadership', form.leadership, [
    ['activity', 'Activity/team/club'],
    ['role', 'Role'],
    ['responsibilities', 'Responsibilities'],
    ['achievement', 'Achievement or lesson']
  ])

  push(lines, 'Skills — Technical', form.technicalSkills)
  push(lines, 'Skills — Communication/teamwork', form.communicationSkills)
  push(lines, 'Skills — Creative/business', form.creativeBusinessSkills)
  push(lines, 'Skills — Tools/software', form.toolsSoftware)

  push(lines, 'Career interests — Fields/roles', form.interestFields)
  push(lines, 'Career interests — Next opportunity', form.opportunityType)

  push(lines, 'Worksheet language', form.worksheetLanguage)

  return lines.length ? `Resume Builder\n\n${lines.join('\n')}` : ''
}

export function hasAnyResumeAnswer(form: ResumeBuilderForm): boolean {
  return composeResumeWorksheet(form).length > 0
}
