// Composes the Brand Builder's structured worksheet form into the
// three text fields the brand-coach Sherpa endpoint accepts
// (worksheet / selfWords / starExample), with clearly labeled
// sections so both the real model and the deterministic mock can
// coach each part. Pure functions — also exercised directly by
// app/__tests__/studio/brandCoach.test.ts.

export interface BrandWorksheetForm {
  rawMaterial: string
  whatICareAbout: string
  whyItMatters: string
  whoIWantToHelp: string
  whatPeopleComeToMeFor: string
  selfWords: string
  myEvidence: string
  starSituation: string
  starTask: string
  starAction: string
  starResult: string
}

export interface BrandCoachFields {
  worksheet: string
  selfWords: string
  starExample: string
}

export function emptyBrandWorksheetForm(): BrandWorksheetForm {
  return {
    rawMaterial: '',
    whatICareAbout: '',
    whyItMatters: '',
    whoIWantToHelp: '',
    whatPeopleComeToMeFor: '',
    selfWords: '',
    myEvidence: '',
    starSituation: '',
    starTask: '',
    starAction: '',
    starResult: ''
  }
}

const WORKSHEET_SECTIONS: Array<{ key: keyof BrandWorksheetForm; label: string }> = [
  { key: 'rawMaterial', label: 'Raw material' },
  { key: 'whatICareAbout', label: 'What I care about' },
  { key: 'whyItMatters', label: 'Why it matters' },
  { key: 'whoIWantToHelp', label: 'Who I want to help' },
  { key: 'whatPeopleComeToMeFor', label: 'What people come to me for' },
  { key: 'myEvidence', label: 'My evidence for my words' }
]

const STAR_SECTIONS: Array<{ key: keyof BrandWorksheetForm; label: string }> = [
  { key: 'starSituation', label: 'Situation' },
  { key: 'starTask', label: 'Task' },
  { key: 'starAction', label: 'Action' },
  { key: 'starResult', label: 'Result' }
]

export function composeBrandCoachFields(form: BrandWorksheetForm): BrandCoachFields {
  const worksheet = WORKSHEET_SECTIONS.map(({ key, label }) => {
    const value = form[key].trim()
    return value ? `${label}:\n${value}` : ''
  })
    .filter(Boolean)
    .join('\n\n')

  const starExample = STAR_SECTIONS.map(({ key, label }) => {
    const value = form[key].trim()
    return value ? `${label}: ${value}` : ''
  })
    .filter(Boolean)
    .join('\n')

  return { worksheet, selfWords: form.selfWords.trim(), starExample }
}

export function hasAnyWorksheetAnswer(form: BrandWorksheetForm): boolean {
  return Object.values(form).some((value) => value.trim().length > 0)
}
