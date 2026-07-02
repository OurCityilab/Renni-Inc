// Resume bullet rules and examples for Our City Studio. These mirror the
// coaching rules enforced in server/utils/studioPromptTemplates/brandCoach.ts.

export const resumeBulletRules: string[] = [
  'Start with a strong action verb (organized, built, tracked, presented, assisted, coordinated).',
  'Name the specific action you took — not just the group outcome.',
  'Name the skill or business function involved (operations, marketing, product development, customer service).',
  'Include the audience, customer, team, or context so a reader can picture it.',
  'End with a result, metric, or lesson — or a bracketed prompt if you don\'t have the number yet.',
  'Never invent facts, titles, numbers, awards, or outcomes.',
  'Use bracketed prompts for missing details: [add number], [add timeframe], [add result], [add audience], [add tool/system].',
  'Keep it age-appropriate and credible for a high school student.',
  'Translate informal work into professional language without exaggerating it.'
]

export interface ResumeBulletExample {
  raw: string
  polished: string
  note: string
}

export const resumeBulletExamples: ResumeBulletExample[] = [
  {
    raw: 'I helped at the pop-up shop',
    polished:
      'Supported student-led pop-up retail operations, helping sell [add number] sweatshirts and track customer interest to inform future product decisions.',
    note: 'Names the context (a school-based entrepreneurship event), the function (retail operations), and leaves a bracketed prompt instead of inventing a sales number.'
  },
  {
    raw: 'I made products with Body Krave',
    polished:
      'Assisted with product development and small-batch production by preparing materials, following quality standards, and documenting customer feedback for a student-led brand project.',
    note: 'Translates informal work into professional language — product development, quality standards, customer feedback — without exaggerating the role.'
  }
]
