// Our City Studio worksheet content — mirrors the printable templates
// in public/studio/templates/ so pages can render or link them.

export interface StudioTemplateDownload {
  label: string
  href: string
  description: string
}

export const studioTemplateDownloads: StudioTemplateDownload[] = [
  {
    label: 'Personal Brand Worksheet',
    href: '/studio/templates/personal-brand-worksheet.md',
    description: 'Prompts to draft what you care about, your words, and your evidence.'
  },
  {
    label: 'STAR Story Worksheet',
    href: '/studio/templates/star-story-worksheet.md',
    description: 'Build one interview-ready story: Situation, Task, Action, Result.'
  },
  {
    label: 'Resume Template (standard student format)',
    href: '/studio/templates/resume-template.md',
    description: 'A clean early-career layout — not an official school or company template.'
  },
  {
    label: 'Pitch Builder Guide',
    href: '/studio/templates/pitch-builder-guide.md',
    description: 'How to build your 3-second, 30-second, and 1-minute / TMAY pitches.'
  }
]

export const personalBrandPrompts: string[] = [
  'What problems, people, or ideas do you keep coming back to?',
  'What experience made this important to you? Be specific.',
  'Who benefits when you do your best work?',
  'When friends, family, teachers, or teammates need something, what do they come to YOU for?',
  'Where do you want your work and reputation to take you in the next few years?',
  "List 4–8 words or short phrases you'd use to describe yourself.",
  'Tell one real story that backs up your words: what was going on, what were you responsible for, what did YOU do, and what changed?'
]

export const starReminders: Array<{ letter: string; name: string; prompt: string }> = [
  { letter: 'S', name: 'Situation', prompt: 'What was going on? Set the scene in 1–2 sentences.' },
  { letter: 'T', name: 'Task', prompt: 'What were YOU responsible for?' },
  { letter: 'A', name: 'Action', prompt: 'What did you actually do? Use "I" statements, not "we."' },
  {
    letter: 'R',
    name: 'Result',
    prompt:
      "What changed because of what you did? Numbers are best; if you don't have one, name what you learned or improved."
  }
]

export const pitchOutputTypes: Array<{ value: string; label: string; useWhen: string }> = [
  { value: 'pitch_3s', label: '3-second pitch', useWhen: 'Introducing yourself in a group or a quick hello.' },
  { value: 'pitch_30s', label: '30-second pitch', useWhen: 'Meeting a recruiter or a networking event.' },
  {
    value: 'pitch_1min_tmay',
    label: '1-minute / TMAY pitch',
    useWhen: 'The "Tell me about yourself" opener in interviews and admissions.'
  }
]
