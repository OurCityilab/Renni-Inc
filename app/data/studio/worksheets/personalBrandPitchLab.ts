// Personal Brand & Pitch Lab — source of truth for the seven
// in-platform worksheet modules.
//
// Students fill these out INSIDE Our City Studio
// (/studio/lab/personal-brand/<slug>) and ask the Sherpa for
// coaching. The uploaded PDFs are reference/backup material only;
// the folder and filenames preserve the program's exact naming
// (Personal_Brand_Individual_Worksheets, Title_Case with
// underscores). Do NOT slugify or rename the files — only the route
// slugs are clean/lowercase.

import type { PortfolioArtifactType, SherpaOutputType } from '~/types/studio/models'

export const PERSONAL_BRAND_WORKSHEETS_DIR =
  '/studio/worksheets/Personal_Brand_Individual_Worksheets'

export interface WorksheetField {
  key: string
  label: string
  rows?: number
}

export interface WorksheetSection {
  title?: string
  description?: string
  fields: WorksheetField[]
}

export interface PersonalBrandWorksheet {
  id: string
  number: number
  title: string
  /** Clean lowercase slug — route is /studio/lab/personal-brand/<slug>. */
  slug: string
  route: string
  /** Exact uploaded filename — must match the PDF on disk byte-for-byte. */
  fileName: string
  pdfHref: string
  /** One-line student-friendly card description. */
  description: string
  /** Coaching focus sent to the Sherpa alongside the answers. */
  sherpaFocus: string
  sections: WorksheetSection[]
  /** Allowed polished-output types; the first is the default. */
  outputOptions: SherpaOutputType[]
  /** Where "Save to Portfolio" files the polished output. */
  artifactType: PortfolioArtifactType
  defaultArtifactTitle: string
  /** Optional mapping of field keys into the Sherpa payload's
   *  dedicated selfWords / STAR slots so the mock can coach them. */
  payloadMap?: {
    selfWordsKey?: string
    star?: { situation?: string; task?: string; action?: string; result?: string }
  }
}

function defineWorksheet(ws: Omit<PersonalBrandWorksheet, 'id' | 'route' | 'pdfHref'>): PersonalBrandWorksheet {
  return {
    ...ws,
    id: ws.slug,
    route: `/studio/lab/personal-brand/${ws.slug}`,
    pdfHref: `${PERSONAL_BRAND_WORKSHEETS_DIR}/${ws.fileName}`
  }
}

export const personalBrandWorksheets: PersonalBrandWorksheet[] = [
  defineWorksheet({
    number: 1,
    title: 'Raw Material Dump',
    slug: 'raw-material',
    fileName: 'Personal_Brand_Worksheet_1_Raw_Material_Dump.pdf',
    description:
      'Dump everything you might build your brand from — interests, skills, wins, responsibilities. Rough is perfect.',
    sherpaFocus:
      'Help the student find patterns, stronger language, and possible themes across their raw material, and point out evidence they can reuse in pitches, resume bullets, and LinkedIn language.',
    outputOptions: ['word_choice'],
    artifactType: 'brand_sentence',
    defaultArtifactTitle: 'My Raw Material Themes',
    sections: [
      {
        fields: [
          { key: 'attention', label: 'What do I naturally pay attention to?' },
          { key: 'talkForever', label: 'I could talk about this for a long time:' },
          { key: 'curiousProblems', label: 'I get curious when I see problems with:' },
          { key: 'askedForHelp', label: 'Things people ask me for help with:' },
          { key: 'betterThanCredit', label: 'Things I do better than I give myself credit for:' },
          { key: 'skillsBuilding', label: 'Skills I am building:' },
          { key: 'challengeHandled', label: 'A challenge I have handled:' },
          { key: 'builtCreatedLed', label: 'Something I have built, created, led, helped with, or improved:' },
          { key: 'proudMoment', label: 'A moment I was proud of myself:' },
          {
            key: 'responsibility',
            label: 'A responsibility I have had at home, school, work, sports, church, or in my community:'
          },
          { key: 'problemToSolve', label: 'A problem I want to help solve one day:' }
        ]
      }
    ]
  }),
  defineWorksheet({
    number: 2,
    title: 'My Brand Ingredients',
    slug: 'brand-ingredients',
    fileName: 'Personal_Brand_Worksheet_2_My_Brand_Ingredients.pdf',
    description:
      'Turn your raw material into purpose, values, strengths, and your three brand words.',
    sherpaFocus:
      'Push the student to make purpose, values, strengths, and brand words specific and evidence-based. Flag vague or inflated language and suggest precise alternatives.',
    outputOptions: ['word_choice'],
    artifactType: 'brand_sentence',
    defaultArtifactTitle: 'My Brand Ingredients',
    payloadMap: { selfWordsKey: 'brandWords' },
    sections: [
      {
        title: 'Purpose',
        fields: [
          { key: 'whyICare', label: 'Why do I care about the work I want to do?' },
          { key: 'problemToSolve', label: 'A problem I want to help solve is:' },
          { key: 'peopleIServe', label: 'People I want to help, serve, build with, or represent:' }
        ]
      },
      {
        title: 'Interests',
        fields: [
          { key: 'enjoy', label: 'I enjoy:' },
          { key: 'loseTrackOfTime', label: 'I lose track of time when:' },
          { key: 'learnMoreAbout', label: 'I want to learn more about:' }
        ]
      },
      {
        title: 'Values',
        fields: [
          { key: 'threeValues', label: 'Three values I want to be known for:' },
          { key: 'notKnownAs', label: 'I do not want to be known as someone who:' }
        ]
      },
      {
        title: 'Strengths',
        fields: [
          { key: 'goodAt', label: 'I am good at:' },
          { key: 'trustedTo', label: 'People trust me to:' }
        ]
      },
      {
        title: 'Perspective',
        fields: [
          { key: 'background', label: 'My background gives me a different perspective because:' },
          { key: 'unexpected', label: 'Something about me that people might not expect:' },
          { key: 'rareCombination', label: 'A combination I bring that is rare:' }
        ]
      },
      {
        title: 'Goals',
        fields: [
          { key: 'thisSummer', label: 'This summer, I want to:' },
          { key: 'nextYear', label: 'In the next year, I want to:' },
          { key: 'longTerm', label: 'Long term, I want to:' }
        ]
      },
      {
        title: 'Brand words',
        fields: [{ key: 'brandWords', label: 'My three brand words:' }]
      }
    ]
  }),
  defineWorksheet({
    number: 3,
    title: 'Brand Sentence Lab',
    slug: 'brand-sentence',
    fileName: 'Personal_Brand_Worksheet_3_Brand_Sentence_Lab.pdf',
    description: 'Build your one-sentence brand: I help [who] do [what] by using [how].',
    sherpaFocus:
      'Help the student create a brand sentence that is specific, true, useful, and short enough to say out loud. Formula: I help [who] do [what] by using [strengths, tools, or approach].',
    outputOptions: ['pitch_3s'],
    artifactType: 'brand_sentence',
    defaultArtifactTitle: 'My Brand Sentence',
    sections: [
      {
        title: 'Draft 1',
        fields: [
          { key: 'draft1Help', label: 'I help:' },
          { key: 'draft1Do', label: 'Do:' },
          { key: 'draft1Using', label: 'By using:' }
        ]
      },
      {
        title: 'Draft 2',
        fields: [
          { key: 'draft2Help', label: 'I help:' },
          { key: 'draft2Do', label: 'Do:' },
          { key: 'draft2Using', label: 'By using:' }
        ]
      },
      {
        title: 'Draft 3',
        fields: [
          { key: 'draft3Help', label: 'I help:' },
          { key: 'draft3Do', label: 'Do:' },
          { key: 'draft3Using', label: 'By using:' }
        ]
      },
      {
        title: 'Final',
        fields: [{ key: 'finalSentence', label: 'My polished brand sentence:', rows: 3 }]
      }
    ]
  }),
  defineWorksheet({
    number: 4,
    title: 'Proof & Story Bank',
    slug: 'proof-story-bank',
    fileName: 'Personal_Brand_Worksheet_4_Proof_and_Story_Bank.pdf',
    description:
      'Back up your claims with real examples and two stories you can tell in any interview.',
    sherpaFocus:
      'Push the student to prove claims with real evidence. If a result is missing, ask what changed, who benefited, how many people were affected, or what improved.',
    outputOptions: ['star_story'],
    artifactType: 'star_answer',
    defaultArtifactTitle: 'My Story Bank',
    payloadMap: {
      star: { situation: 'story1Situation', action: 'story1Action', result: 'story1Result' }
    },
    sections: [
      {
        title: 'Prove your claims',
        description: 'For each claim, give one real example that shows it.',
        fields: [
          { key: 'responsibleExample', label: 'I am responsible — real example:' },
          { key: 'creativeExample', label: 'I am creative — real example:' },
          { key: 'leaderExample', label: 'I am a leader — real example:' },
          { key: 'problemSolverExample', label: 'I solve problems — real example:' },
          { key: 'peopleExample', label: 'I work well with people — real example:' },
          { key: 'learnQuicklyExample', label: 'I learn quickly — real example:' }
        ]
      },
      {
        title: 'Story 1',
        fields: [
          { key: 'story1Situation', label: 'Situation' },
          { key: 'story1Action', label: 'Action' },
          { key: 'story1Result', label: 'Result' },
          { key: 'story1Lesson', label: 'Lesson' }
        ]
      },
      {
        title: 'Story 2',
        fields: [
          { key: 'story2Situation', label: 'Situation' },
          { key: 'story2Action', label: 'Action' },
          { key: 'story2Result', label: 'Result' },
          { key: 'story2Lesson', label: 'Lesson' }
        ]
      }
    ]
  }),
  defineWorksheet({
    number: 5,
    title: 'Pitch Builder',
    slug: 'pitch-builder',
    fileName: 'Personal_Brand_Worksheet_5_Pitch_Builder.pdf',
    description:
      'Draft your 3-second, 30-second, and 3-minute "tell me about yourself" pitches.',
    sherpaFocus:
      'Help the student make each pitch sound natural, concise, credible, and audience-appropriate. Do not make them sound fake or over-polished.',
    outputOptions: ['pitch_3s', 'pitch_30s', 'pitch_1min_tmay'],
    artifactType: 'intro_pitch',
    defaultArtifactTitle: 'My Pitch',
    sections: [
      {
        title: '3-second introduction',
        fields: [{ key: 'intro3s', label: 'My 3-second intro' }]
      },
      {
        title: '30-second pitch',
        fields: [
          { key: 'myNameIs', label: 'Hi, my name is:' },
          { key: 'interestedIn', label: 'I am a student interested in:' },
          { key: 'careAbout', label: 'I care about:' },
          { key: 'thisSummer', label: 'This summer, I am learning/building/working on:' },
          { key: 'longTerm', label: 'Long term, I want to:' },
          { key: 'full30s', label: 'My full 30-second pitch:', rows: 4 }
        ]
      },
      {
        title: '3-minute / TMAY pitch',
        fields: [
          { key: 'openingIdentity', label: 'Opening identity' },
          { key: 'originStory', label: 'Origin story', rows: 3 },
          { key: 'shapingExperience', label: 'Experience that shaped me', rows: 3 },
          { key: 'taughtMe', label: 'That taught me' },
          { key: 'strengthsIBring', label: 'Strengths I bring' },
          { key: 'workingOnNow', label: 'Right now, I am working on' },
          { key: 'futureGoal', label: 'In the future, I want to' },
          { key: 'whyItMatters', label: 'The reason this matters to me is' },
          { key: 'closingSentence', label: 'My closing sentence' }
        ]
      }
    ]
  }),
  defineWorksheet({
    number: 6,
    title: 'Peer Feedback',
    slug: 'peer-feedback',
    fileName: 'Personal_Brand_Worksheet_6_Peer_Feedback.pdf',
    description:
      'Capture feedback from two classmates and decide what to keep, cut, or say with more confidence.',
    sherpaFocus:
      'Help the student interpret the peer feedback they collected and decide what to keep, cut, clarify, or practice in their pitch.',
    outputOptions: ['word_choice'],
    artifactType: 'reflection',
    defaultArtifactTitle: 'My Peer Feedback Takeaways',
    sections: [
      {
        title: 'Speaker 1',
        fields: [
          { key: 's1Name', label: 'Speaker name', rows: 1 },
          { key: 's1Clear', label: 'What was clear?' },
          { key: 's1Strong', label: 'What sounded strong or memorable?' },
          { key: 's1Confidence', label: 'What should they say with more confidence?' },
          { key: 's1Cut', label: 'What should they cut or simplify?' },
          { key: 's1Keep', label: 'One phrase they should keep:' },
          { key: 's1Question', label: 'One question I still have:' }
        ]
      },
      {
        title: 'Speaker 2',
        fields: [
          { key: 's2Name', label: 'Speaker name', rows: 1 },
          { key: 's2Clear', label: 'What was clear?' },
          { key: 's2Strong', label: 'What sounded strong or memorable?' },
          { key: 's2Confidence', label: 'What should they say with more confidence?' },
          { key: 's2Cut', label: 'What should they cut or simplify?' },
          { key: 's2Keep', label: 'One phrase they should keep:' },
          { key: 's2Question', label: 'One question I still have:' }
        ]
      }
    ]
  }),
  defineWorksheet({
    number: 7,
    title: 'LinkedIn / Resume Translation + Exit Ticket',
    slug: 'resume-linkedin',
    fileName: 'Personal_Brand_Worksheet_7_LinkedIn_Resume_Translation_Exit_Ticket.pdf',
    description:
      'Translate your brand into LinkedIn and resume language, then lock in your exit ticket.',
    sherpaFocus:
      "Turn the student's brand language into professional LinkedIn and resume language that is credible, age-appropriate, and ready to paste into a school, internship, scholarship, job, LinkedIn, or portfolio template.",
    outputOptions: ['resume_bullets'],
    artifactType: 'linkedin_section',
    defaultArtifactTitle: 'My LinkedIn & Resume Language',
    sections: [
      {
        title: 'LinkedIn headline',
        fields: [{ key: 'linkedinHeadline', label: 'My LinkedIn headline draft' }]
      },
      {
        title: 'Resume summary',
        fields: [{ key: 'resumeSummary', label: 'My resume summary', rows: 4 }]
      },
      {
        title: 'Exit ticket',
        fields: [
          { key: 'brandSentence', label: 'My personal brand sentence is:' },
          { key: 'intro3s', label: 'My 3-second introduction is:' },
          {
            key: 'toolNext',
            label: 'One tool I will use in my next interview, pitch, or worksite introduction is:'
          },
          { key: 'remember', label: 'One thing I want people to remember about me is:' }
        ]
      }
    ]
  })
]

export function getWorksheetBySlug(slug: string): PersonalBrandWorksheet | null {
  return personalBrandWorksheets.find((w) => w.slug === slug) ?? null
}

// ---------- Sherpa payload composition ----------

export interface ComposedWorksheetPayload {
  worksheet: string
  selfWords: string
  starExample: string
}

// Composes a worksheet's answers into the brand-coach payload's three
// text fields, with each answer under its field label so both the
// real model and the deterministic mock can coach specific answers.
export function composeWorksheetPayload(
  ws: PersonalBrandWorksheet,
  answers: Record<string, string>
): ComposedWorksheetPayload {
  const selfWordsKey = ws.payloadMap?.selfWordsKey
  const star = ws.payloadMap?.star
  const starKeys = new Set(Object.values(star ?? {}))

  const blocks: string[] = []
  for (const section of ws.sections) {
    for (const field of section.fields) {
      if (field.key === selfWordsKey || starKeys.has(field.key)) continue
      const value = (answers[field.key] ?? '').trim()
      if (!value) continue
      const label = section.title ? `${section.title} — ${field.label}` : field.label
      blocks.push(`${label}\n${value}`)
    }
  }
  const worksheet = blocks.length
    ? `Worksheet ${ws.number}: ${ws.title}\n\n${blocks.join('\n\n')}`
    : ''

  const selfWords = selfWordsKey ? (answers[selfWordsKey] ?? '').trim() : ''

  const starParts: Array<{ label: string; key?: string }> = [
    { label: 'Situation', key: star?.situation },
    { label: 'Task', key: star?.task },
    { label: 'Action', key: star?.action },
    { label: 'Result', key: star?.result }
  ]
  const starExample = star
    ? starParts
        .map(({ label, key }) => {
          const value = key ? (answers[key] ?? '').trim() : ''
          return value ? `${label}: ${value}` : ''
        })
        .filter(Boolean)
        .join('\n')
    : ''

  return { worksheet, selfWords, starExample }
}

export function hasAnyWorksheetModuleAnswer(answers: Record<string, string>): boolean {
  return Object.values(answers).some((value) => value.trim().length > 0)
}
