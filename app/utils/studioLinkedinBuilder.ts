// LinkedIn Builder form model + composition into the brand-coach
// payload's worksheet field. One labeled line per answer — the
// server's Practice Mode mock parses these labels (keep in sync with
// server/utils/studioPromptTemplates/brandCoach.ts).

export interface LinkedinBuilderForm {
  name: string
  school: string
  roleIdentity: string
  careerInterests: string
  topics: string
  brandSentence: string
  intro3s: string
  starStory: string
  skills: string
  projectsExperience: string
  remember: string
}

export function emptyLinkedinBuilderForm(): LinkedinBuilderForm {
  return {
    name: '',
    school: '',
    roleIdentity: '',
    careerInterests: '',
    topics: '',
    brandSentence: '',
    intro3s: '',
    starStory: '',
    skills: '',
    projectsExperience: '',
    remember: ''
  }
}

const oneLine = (value: string) => value.trim().replace(/\s+/g, ' ')

export function composeLinkedinWorksheet(form: LinkedinBuilderForm): string {
  const lines: string[] = []
  const push = (label: string, value: string) => {
    const v = oneLine(value)
    if (v) lines.push(`${label}: ${v}`)
  }

  push('Name', form.name)
  push('School/program', form.school)
  push('Role/identity', form.roleIdentity)
  push('Career interests', form.careerInterests)
  push('Topics', form.topics)
  push('Brand sentence', form.brandSentence)
  push('3-second intro', form.intro3s)
  push('STAR story', form.starStory)
  push('Skills', form.skills)
  push('Projects/experience', form.projectsExperience)
  push('Remember', form.remember)

  return lines.length ? `LinkedIn Builder\n\n${lines.join('\n')}` : ''
}

export function hasAnyLinkedinAnswer(form: LinkedinBuilderForm): boolean {
  return composeLinkedinWorksheet(form).length > 0
}
