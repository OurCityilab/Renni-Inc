// Brand Coach prompt template — Our City Studio, The Lab
// (Personal Brand Builder, worksheet-driven flow).
//
// Unlike brand-sherpa (five fixed questions → brand sentence), this
// mode takes pasted worksheet material plus an audience and a
// desired output type, and coaches: it names what is strong, flags
// risky word choices with explained alternatives, describes how the
// chosen audience may hear the wording, produces a polished version
// of the selected output, and asks follow-up questions that would
// make the material stronger.
//
// Posture (do not relax):
//   - Coach, never approver. Teach, don't just rewrite.
//   - Never fabricate facts, numbers, titles, or outcomes. Missing
//     metrics become bracketed prompts: [add number], [add
//     timeframe], [add result].
//   - The deterministic mock restructures ONLY the student's own
//     words plus a fixed teaching dictionary of commonly overused
//     words — it never invents a detail about the student.

import type {
  BrandCoachResponse,
  SherpaAudience,
  SherpaOutputType,
  WordChoiceFlag
} from '~~/app/types/studio/models'
import type { StudioPromptTemplate } from './index'

export interface BrandCoachPayload {
  worksheet: string
  selfWords: string
  starExample: string
  audience: SherpaAudience
  outputType: SherpaOutputType
  /** Optional per-worksheet coaching focus from the Lab modules. */
  focus?: string
}

export const BRAND_COACH_AUDIENCES: readonly SherpaAudience[] = Object.freeze([
  'admissions',
  'recruiter',
  'employer',
  'scholarship',
  'customer',
  'general'
])

export const BRAND_COACH_OUTPUT_TYPES: readonly SherpaOutputType[] = Object.freeze([
  'word_choice',
  'pitch_3s',
  'pitch_30s',
  'pitch_1min_tmay',
  'star_story',
  'resume_bullets',
  'resume_draft',
  'linkedin_profile'
])

const MAX_INPUT_CHARS = 16_000
const MAX_OUTPUT_TOKENS = 1_400

const AUDIENCE_DESCRIPTIONS: Record<SherpaAudience, string> = {
  admissions:
    'a college admissions reader looking for growth, reflection, contribution, and readiness',
  recruiter:
    'a recruiter scanning quickly (often through ATS software) for skills, responsibility, teamwork, communication, reliability, and measurable impact',
  employer:
    'a hiring manager or employer who wants to know what this person can reliably do for them',
  scholarship:
    'a scholarship committee looking for character, persistence, service, and potential',
  customer:
    'a customer or client looking for trust, value, clarity, and credibility before they buy',
  general: 'a general professional audience meeting this person for the first time'
}

const OUTPUT_GUIDANCE: Record<SherpaOutputType, string> = {
  word_choice:
    'Word choice feedback: the coaching lives in wordChoiceFlags. polishedVersion should be the student\'s own key phrases with the sharper word choices applied — not a new piece.',
  pitch_3s:
    'A 3-second pitch: ONE sentence, roughly 8–15 words, sayable in one breath. Who they are + what they do or offer.',
  pitch_30s:
    'A 30-second pitch: 3–5 short spoken-voice sentences. Who they are, what they do, one concrete example from their material, and what they are looking for or building toward.',
  pitch_1min_tmay:
    'A 1-minute "Tell me about yourself" (TMAY) answer: present (who they are now), past (one or two concrete experiences from their material as evidence), future (what they are working toward). 6–10 sentences, natural spoken voice, no bullet points.',
  star_story:
    'A STAR story with each part labeled: Situation (is the context clear?), Task (is their responsibility clear?), Action (what did they PERSONALLY do?), Result (an outcome, number, lesson, or change). If the Result is missing or weak, insert [add result] and push for it in followUpQuestions with questions like "What changed because of what you did?", "How many people were affected?", "What was better after your action?", or "What would a teacher, coach, employer, or teammate say you contributed?"',
  resume_bullets:
    'Resume bullets in a standard student / early-career, recruiter-ready format — never claim this is an official university or company template. Produce 2–4 bullets. Rules: (1) start with a strong action verb; (2) make the action specific; (3) name the skill or business function when possible; (4) include the audience, customer, team, or context; (5) include a result, metric, or lesson — or a bracketed prompt if missing; (6) never invent facts, titles, numbers, awards, or outcomes; (7) missing details become bracketed prompts: [add number], [add timeframe], [add result], [add audience], [add tool/system]; (8) keep bullets age-appropriate and credible for a high-school student; (9) translate informal work into professional language without exaggerating. Examples of the expected translation — raw: "I helped with the pop-up shop and sold sweatshirts" becomes "Supported student-led pop-up retail operations by engaging customers, explaining product value, and contributing to sweatshirt sales during a school-based entrepreneurship event," or with missing metrics, "Supported student-led pop-up retail operations, helping sell [add number] sweatshirts and track customer interest to inform future product decisions." Raw: "I made products with Body Krave" becomes "Assisted with product development and small-batch production by preparing materials, following quality standards, and documenting customer feedback for a student-led brand project."',
  resume_draft:
    'A full resume draft for a high-school student, organized into clearly headed sections in this order (skip a section entirely if the student gave nothing for it): PROFILE / SUMMARY (2–3 credible sentences); EDUCATION (school, expected graduation year, GPA only if provided, coursework, honors); EXPERIENCE (2–4 bullets per entry); PROJECTS; VOLUNTEER & COMMUNITY; LEADERSHIP, ACTIVITIES & SPORTS; SKILLS (grouped: technical, communication/teamwork, creative/business, tools/software); AWARDS & CERTIFICATIONS; INTERESTS. Every bullet follows the resume-bullet rules: strong action verb first, specific action, name the skill or business function, include the audience/customer/team/context, include a result or metric — or a bracketed prompt ([add number], [add timeframe], [add result], [add audience], [add tool/system]) when missing. Never invent facts, titles, numbers, awards, or outcomes. Age-appropriate and credible for a high-school student; translate informal work into professional language without exaggerating. This is a clean resume structure the student can paste into any school, internship, scholarship, or job template — never claim it is an official school or company resume.',
  linkedin_profile:
    'A LinkedIn starter kit for a high-school student, in labeled blocks: "Headline:" using the formula Student | Aspiring [role/field] | Interested in [topic], [topic], and [topic] (adapt naturally if their material suggests a variant like "Student Entrepreneur | Interested in Marketing, Fashion, and Community Development" — keep it age-appropriate and credible, never inflated); "About:" 3–5 first-person sentences built from their brand sentence, story, and interests; "Experience:" 1–2 short descriptions of their strongest project or experience; "Skills:" a comma-separated list drawn only from skills they actually named; "Connection intro:" a 2–3 sentence polite message they could send when connecting with a professional. Use bracketed prompts for anything missing. Never invent schools, roles, numbers, or achievements.'
}

function buildSystemPrompt(): string {
  return `You are the Brand Sherpa for Our City Studio, a coach who helps high-school students turn a week of personal-brand worksheet work into sharp professional language. You coach — you do not just rewrite. Every response should teach the student something about how their words land.

Every response you give MUST be a single JSON object with exactly these five fields:

{
  "strengths": string,
  "wordChoiceFlags": [{ "word": string, "howItMayLand": string, "alternatives": string[], "why": string }],
  "audienceRead": string,
  "polishedVersion": string,
  "followUpQuestions": string[]
}

Field guidance:
- "strengths": 1–3 sentences naming what is genuinely strong in the student's raw material — real evidence, a specific story, a distinctive detail. Be honest and specific, never generic praise.
- "wordChoiceFlags": 0–4 flags. Flag words that overclaim, undersell, or land differently than the student intends. For each: "word" is the student's word or phrase, "howItMayLand" explains how this audience may actually hear it, "alternatives" gives 2–6 more precise options, "why" explains which alternative fits depending on the student's actual evidence. Example of the expected depth: if a student calls himself a "philanthropist," respond along the lines of — philanthropist may sound like someone with significant financial resources, a foundation, or a long public giving record; if the evidence is service, mentoring, organizing, volunteering, or helping their community, consider more precise language such as community builder, service-minded leader, youth advocate, volunteer organizer, mutual aid participant, or emerging social entrepreneur — then explain which fits their evidence. Other words that usually deserve a flag when unsupported: helped, hard worker, people person, creative, a lot, responsible, good leader, entrepreneur. Never just call a word wrong — show how to make it specific. Empty array only if nothing needs flagging.
- "audienceRead": 1–3 sentences describing how the selected audience will likely read this student's material as written — what will land well and what may be misread or skimmed past.
- "polishedVersion": the selected output type, built ONLY from what the student gave you, following the output guidance in the user message. Keep the student's real experience and recognizable voice, but make it sound professional.
- "followUpQuestions": 1–2 specific, answerable questions that would make the material stronger — push for the missing number, outcome, or concrete moment. Never a vague "tell me more."

Hard rules (do not relax):
- Never fabricate facts, numbers, titles, achievements, or outcomes the student did not provide. Where a metric is missing but would strengthen the output, insert a bracketed prompt like [add number], [add timeframe], or [add result].
- Never make the student sound older, more credentialed, or more experienced than their own words support. Age-appropriate for a high-school student, always.
- Light, encouraging pushback: name the issue plainly, explain how it may land, offer better options, and let the student choose. Do not lecture.
- For STAR material, check all four parts: Situation clear? Task (their responsibility) clear? Action personal ("I did", not "we did")? Result concrete (outcome, number, lesson, or change)? Push on weak Results in followUpQuestions.
- Plain language. You are a coach, not an approver — a human coach reviews and approves the final artifact, not you.

Output ONLY the JSON object. No commentary, no code fences.`
}

function buildUserPrompt(payload: BrandCoachPayload): string {
  return `A student has been doing personal-brand worksheets all week and pasted their work in. Coach them.

Audience they are writing for: ${AUDIENCE_DESCRIPTIONS[payload.audience]}.
Output they want: ${OUTPUT_GUIDANCE[payload.outputType]}
${payload.focus ? `Coaching focus for this worksheet: ${payload.focus}\n` : ''}
Their worksheet material (their own words):
${payload.worksheet || '(nothing pasted)'}

Words they are using to describe themselves:
${payload.selfWords || '(not provided)'}

Their experience / story / STAR example:
${payload.starExample || '(not provided)'}

Respond with the JSON schema described in the system prompt and nothing else.`
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Brand Coach response field "${field}" must be a string.`)
  }
  return value
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Brand Coach response field "${field}" must be an array.`)
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`Brand Coach response field "${field}[${i}]" must be a string.`)
    }
  }
  return value as string[]
}

function validateFlags(value: unknown): WordChoiceFlag[] {
  if (!Array.isArray(value)) {
    throw new Error('Brand Coach response field "wordChoiceFlags" must be an array.')
  }
  return value.map((entry, i) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Brand Coach response field "wordChoiceFlags[${i}]" must be an object.`)
    }
    const obj = entry as Record<string, unknown>
    return {
      word: requireString(obj.word, `wordChoiceFlags[${i}].word`),
      howItMayLand: requireString(obj.howItMayLand, `wordChoiceFlags[${i}].howItMayLand`),
      alternatives: requireStringArray(obj.alternatives, `wordChoiceFlags[${i}].alternatives`),
      why: requireString(obj.why, `wordChoiceFlags[${i}].why`)
    }
  })
}

function validateResponse(raw: unknown): BrandCoachResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Brand Coach response was not a JSON object.')
  }
  const obj = raw as Record<string, unknown>
  return {
    strengths: requireString(obj.strengths, 'strengths'),
    wordChoiceFlags: validateFlags(obj.wordChoiceFlags),
    audienceRead: requireString(obj.audienceRead, 'audienceRead'),
    polishedVersion: requireString(obj.polishedVersion, 'polishedVersion'),
    followUpQuestions: requireStringArray(obj.followUpQuestions, 'followUpQuestions')
  }
}

// ---------- Deterministic mock mode ----------
//
// A fixed teaching dictionary of commonly overused self-description
// words. Matching is against the student's own text; the advice
// text is static coaching content, not a claim about the student.

interface FlagRule extends WordChoiceFlag {
  pattern: RegExp
}

const WORD_FLAG_RULES: FlagRule[] = [
  {
    pattern: /\bphilanthropists?\b/i,
    word: 'philanthropist',
    howItMayLand:
      'Philanthropist may sound like someone with significant financial resources, a foundation, or a long public giving record.',
    alternatives: [
      'community builder',
      'service-minded leader',
      'youth advocate',
      'volunteer organizer',
      'mutual aid participant',
      'emerging social entrepreneur'
    ],
    why: 'If your evidence is service, mentoring, organizing, volunteering, or helping your community, more precise language keeps you credible. Pick the one your evidence supports: "volunteer organizer" if you organize, "youth advocate" if you speak up for younger people, "community builder" if you bring people together.'
  },
  {
    pattern: /\bpassionate\b/i,
    word: 'passionate',
    howItMayLand: 'Passionate appears so often that many readers skim right past it.',
    alternatives: ['committed to', 'focused on', 'known for', 'drawn to'],
    why: 'Showing the passion with one specific action or example says more than naming it.'
  },
  {
    pattern: /\bhard[- ]?work(?:er|ing)\b/i,
    word: 'hardworking',
    howItMayLand: 'Nearly every application says hardworking, so on its own it does not set you apart.',
    alternatives: ['consistent', 'reliable under deadlines', 'someone who finishes what they start'],
    why: 'One example of following through is stronger evidence than the adjective.'
  },
  {
    pattern: /\bpeople person\b/i,
    word: 'people person',
    howItMayLand: 'People person reads casual — fine out loud, weaker on paper.',
    alternatives: ['strong communicator', 'relationship builder', 'team-oriented'],
    why: 'Choose based on your evidence: "relationship builder" if people come back to you, "strong communicator" if you explain things well.'
  },
  {
    pattern: /\b(expert|guru)\b/i,
    word: 'expert',
    howItMayLand:
      'Expert or guru can overclaim for a student and invite a "prove it" reaction from recruiters and employers.',
    alternatives: ['experienced in', 'skilled at', 'building real skill in'],
    why: 'Precise claims you can back up build more trust than big ones you cannot.'
  },
  {
    pattern: /\bhelped( out| with)?\b/i,
    word: 'helped',
    howItMayLand:
      '"Helped" hides what you personally did — resume readers and recruiters look for the specific action.',
    alternatives: ['supported', 'organized', 'led', 'coordinated', 'built', 'created'],
    why: 'Pick the verb that matches what actually happened: "organized" if you set it up, "led" if others followed your plan, "supported" if you kept it running.'
  },
  {
    pattern: /\b(stuff|things)\b/i,
    word: 'stuff / things',
    howItMayLand: 'Vague words like "stuff" and "things" make real work sound smaller than it was.',
    alternatives: ['name the actual task, product, or event'],
    why: '"Sold sweatshirts at our pop-up shop" beats "sold stuff" every time.'
  },
  {
    pattern: /\ba lot\b/i,
    word: 'a lot',
    howItMayLand: '"A lot" invites the question: how much, exactly?',
    alternatives: ['[add number]', 'a specific count, frequency, or timeframe'],
    why: 'If you know the number, use it. If not, keep a placeholder like [add number] until you can check.'
  },
  {
    pattern: /\bcreatives?\b|\bcreativity\b/i,
    word: 'creative',
    howItMayLand: 'Creative is claimed so often that readers need to see it, not just hear it.',
    alternatives: ['designed', 'built', 'came up with [the specific idea]', 'made [the specific thing]'],
    why: 'Name one thing you made, designed, or figured out — the example proves the adjective.'
  },
  {
    pattern: /\bresponsible\b/i,
    word: 'responsible',
    howItMayLand:
      '"Responsible for" tells the reader a duty existed — not that you delivered on it.',
    alternatives: ['managed', 'ran', 'owned', 'delivered', 'kept [X] running'],
    why: 'Say what you did with the responsibility: "managed the cash box for our pop-up" is stronger than "responsible for money."'
  },
  {
    pattern: /\bgood leader\b|\bleadership skills\b/i,
    word: 'good leader',
    howItMayLand: 'Calling yourself a good leader asks the reader to take your word for it.',
    alternatives: ['led a team of [add number]', 'organized [the event]', 'trained new members', 'captained'],
    why: 'Show the leading: who followed you, and what got done because you led. The result convinces more than the title.'
  },
  {
    pattern: /\bentrepreneurs?\b/i,
    word: 'entrepreneur',
    howItMayLand:
      'Entrepreneur can land as a big claim when the business is early — some readers will ask what you have actually sold or built.',
    alternatives: [
      'founder of a student-run brand',
      'started a small business selling [product]',
      'building a business idea into its first sales'
    ],
    why: 'Anchor it to what exists: real products, real sales, or say honestly that you are building it. Credible beats impressive.'
  }
]

const MOCK_AUDIENCE_READ: Record<SherpaAudience, string> = {
  admissions:
    'An admissions reader is looking for your authentic voice and evidence of growth — specific moments and honest reflection land better than polished-sounding claims.',
  recruiter:
    'A recruiter scans in seconds, often through software that matches action verbs and keywords — lead with strong verbs and concrete nouns, because vague phrasing gets skipped.',
  employer:
    'An employer reads for reliability: what did you actually do, and would you do it again for them? Specific responsibilities and outcomes matter more than adjectives.',
  scholarship:
    'A scholarship committee reads for character, persistence, service, and potential — honest reflection and evidence of follow-through count more than polished-sounding claims.',
  customer:
    'A customer decides on trust: clear plain language about what you offer and proof someone has valued it beats impressive-sounding words.',
  general:
    'A first-time professional audience remembers one clear, specific thing about you — one concrete detail beats five general claims.'
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function firstSentences(text: string, count: number): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter((s) => s.length > 2)
    .slice(0, count)
}

function hasResultSignal(text: string): boolean {
  return /\d/.test(text) || /\b(result|increased|raised|grew|improved|led to|so that|which meant|learned)\b/i.test(text)
}

// The Brand Builder form composes its four STAR fields into a
// labeled block ("Situation: …\nTask: …"). Pull one labeled section
// back out so the mock can coach each part individually; returns ''
// for unlabeled raw pastes.
function starPart(text: string, label: 'Situation' | 'Task' | 'Action' | 'Result'): string {
  const re = new RegExp(
    `\\b${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:Situation|Task|Action|Result)\\s*:|$)`,
    'i'
  )
  const match = re.exec(text)
  return match ? clean(match[1]) : ''
}

// The composed form labels its sections ("Raw material:", "Task:" …).
// Strip the labels before seeding polished output so a label never
// shows up as if it were the student's own sentence.
function stripSectionLabels(text: string): string {
  return text.replace(
    /^(Raw material|What I care about|Why it matters|Who I want to help|What people come to me for|My evidence for my words|Situation|Task|Action|Result)\s*:\s*/gim,
    ''
  )
}

// The Resume/LinkedIn Builders compose their forms into single-line
// labeled entries ("Experience 1 — What you did: …"). Collect the
// values whose label matches, so the mock builds sections from ONLY
// the student's own words.
function lineValues(text: string, labelPattern: RegExp): string[] {
  const out: string[] = []
  for (const line of text.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const label = line.slice(0, idx).trim()
    if (!labelPattern.test(label)) continue
    const value = clean(line.slice(idx + 1))
    if (value) out.push(value)
  }
  return out
}

// Resume-bullet treatment for one student sentence: action-verb
// reminder plus bracketed prompts for whatever is missing — never an
// invented number or outcome.
function mockResumeBullet(s: string): string {
  let b = `• ${s} [start with an action verb: led, organized, built, supported]`
  if (!/\d/.test(s)) b += ' [add number]'
  if (!hasResultSignal(s)) b += ' [add result]'
  return b
}

function mockResumeDraft(worksheet: string): string {
  const values = (re: RegExp) => lineValues(worksheet, re)
  const sections: string[] = []

  const profileSeed =
    values(/^Worksheet language$/i)[0] ||
    values(/^Career interests — Fields\/roles$/i)[0] ||
    ''
  sections.push(
    `PROFILE / SUMMARY\n${
      profileSeed || '[2–3 sentences: who you are, what you are building, and what you want next]'
    }`
  )

  const education = values(/^Education — /i)
  const educationLabels = worksheet
    .split('\n')
    .filter((l) => /^Education — /i.test(l.trim()) && clean(l.slice(l.indexOf(':') + 1)))
    .map((l) => clean(l.trim().replace(/^Education — /i, '')))
  sections.push(
    `EDUCATION\n${
      education.length ? educationLabels.join('\n') : '[add school] — [add expected graduation year]'
    }`
  )

  const experience = values(/^Experience \d+ — What you did$/i).map(mockResumeBullet)
  sections.push(
    `EXPERIENCE\n${
      experience.length
        ? experience.join('\n')
        : '• [Action verb] + [what you did] + [for whom] + [add number] [add result]'
    }`
  )

  const projects = values(/^Project \d+ — What you personally did$/i).map(mockResumeBullet)
  if (projects.length) sections.push(`PROJECTS\n${projects.join('\n')}`)

  const volunteer = values(/^Volunteer \d+ — What you did$/i).map(mockResumeBullet)
  if (volunteer.length) sections.push(`VOLUNTEER & COMMUNITY\n${volunteer.join('\n')}`)

  const leadership = values(/^Leadership \d+ — Responsibilities$/i).map(mockResumeBullet)
  if (leadership.length) sections.push(`LEADERSHIP, ACTIVITIES & SPORTS\n${leadership.join('\n')}`)

  const skills = values(/^Skills — /i)
  sections.push(`SKILLS\n${skills.length ? skills.join('; ') : '[add tool/system]'}`)

  const interests = values(/^Career interests — /i)
  if (interests.length) sections.push(`CAREER INTERESTS\n${interests.join('; ')}`)

  return sections.join('\n\n')
}

function mockLinkedinProfile(worksheet: string): string {
  const first = (re: RegExp) => lineValues(worksheet, re)[0] ?? ''

  const role = clean((first(/^Career interests$/i) || first(/^Role\/identity$/i)).split(/[,\n]/)[0] ?? '')
  const topicsRaw = first(/^Topics$/i)
    .split(/[,;]/)
    .map(clean)
    .filter(Boolean)
    .slice(0, 3)
  const topics =
    topicsRaw.length === 3
      ? `${topicsRaw[0]}, ${topicsRaw[1]}, and ${topicsRaw[2]}`
      : topicsRaw.length
        ? `${topicsRaw.join(', ')}, and [topic]`
        : '[topic], [topic], and [topic]'

  const headline = `Student | Aspiring ${role || '[add role/field]'} | Interested in ${topics}`

  const aboutSeeds = [
    first(/^Brand sentence$/i),
    first(/^3-second intro$/i),
    first(/^Remember$/i)
  ].filter(Boolean)
  const about = aboutSeeds.length
    ? `${aboutSeeds.join(' ')} [add what you are working on right now]`
    : '[3–5 first-person sentences: your brand sentence, what you are working on, and what you want people to remember]'

  const experienceSeed = first(/^Projects\/experience$/i)
  const skills = first(/^Skills$/i)
  const name = first(/^Name$/i)
  const school = first(/^School\/program$/i)

  return [
    `Headline: ${headline}`,
    `About: ${about}`,
    `Experience: ${experienceSeed ? mockResumeBullet(experienceSeed) : '• [your strongest project or experience, described in one line] [add result]'}`,
    `Skills: ${skills || '[add tool/system]'}`,
    `Connection intro: Hi, I'm ${name || '[your name]'} — a student at ${
      school || '[your school/program]'
    } interested in ${topicsRaw[0] || '[topic]'}. I'd love to connect and learn from your work.`
  ].join('\n\n')
}

function mockPolished(payload: BrandCoachPayload, combined: string): string {
  const seed = firstSentences(
    stripSectionLabels(payload.worksheet || payload.selfWords || payload.starExample),
    3
  )
  switch (payload.outputType) {
    case 'word_choice': {
      const hits = WORD_FLAG_RULES.filter((r) => r.pattern.test(combined))
      if (!hits.length) return `${seed.join(' ')}\n\n(No overused words flagged — see the follow-up questions for how to add evidence.)`
      return hits
        .map((h) => `Instead of "${h.word}", try: ${h.alternatives.join(', ')}.`)
        .join('\n')
    }
    case 'pitch_3s':
      return `I'm [your name], and ${seed[0] ? `"${seed[0]}"` : '[one thing you do, in 8–12 words]'} — tighten this until you can say it in one breath.`
    case 'pitch_30s':
      return [
        `Who I am: ${seed[0] ?? '[one sentence about who you are]'}`,
        `What I do: ${seed[1] ?? '[one sentence about what you actually do]'}`,
        'One example: [your most concrete moment — what you did and for whom]',
        'What I\'m looking for: [what you want this audience to do next]'
      ].join('\n')
    case 'pitch_1min_tmay':
      return [
        `Present: ${seed[0] ?? '[who you are right now]'}`,
        `Past: ${payload.starExample ? clean(stripSectionLabels(payload.starExample)) : '[one or two concrete experiences that prove it]'} [add result]`,
        'Future: [what you are working toward next]'
      ].join('\n')
    case 'star_story': {
      const situation = starPart(payload.starExample, 'Situation')
      const task = starPart(payload.starExample, 'Task')
      const result = starPart(payload.starExample, 'Result')
      const action =
        starPart(payload.starExample, 'Action') ||
        (payload.starExample && !situation && !task && !result ? clean(payload.starExample) : '')
      return [
        `Situation: ${situation || '[set the scene — where, when, and what was going on]'}`,
        `Task: ${task || '[what YOU were responsible for]'}`,
        `Action: ${action || '[what you personally did — "I", not "we"]'}`,
        `Result: ${
          result ||
          (hasResultSignal(payload.starExample)
            ? '[pull your outcome into one clear line]'
            : '[add result — what changed, how many people, what was better after?]')
        }`
      ].join('\n')
    }
    case 'resume_bullets':
      return seed.length
        ? seed
            .map((s) => `• ${s} [start with an action verb: led, organized, built, supported] [add number] [add result]`)
            .join('\n')
        : '• [Action verb] + [what you did] + [for whom] + [add number] [add result]'
    case 'resume_draft':
      return mockResumeDraft(payload.worksheet)
    case 'linkedin_profile':
      return mockLinkedinProfile(payload.worksheet)
  }
}

export function generateMockBrandCoachResponse(payload: BrandCoachPayload): BrandCoachResponse {
  const combined = [payload.worksheet, payload.selfWords, payload.starExample]
    .filter(Boolean)
    .join('\n')

  const flags = WORD_FLAG_RULES.filter((r) => r.pattern.test(combined))
    .slice(0, 4)
    .map(({ word, howItMayLand, alternatives, why }) => ({ word, howItMayLand, alternatives, why }))

  const wordCount = clean(combined).split(' ').filter(Boolean).length
  const strengths = `You brought real material to work with — about ${wordCount} words of your own experience${
    /\d/.test(combined) ? ', including at least one specific number, which is exactly what strong pitches and bullets are built from' : ''
  }. Practice mode can only apply fixed coaching rules; the sections below show you where to push.`

  const followUpQuestions: string[] = []
  // For labeled STAR input, judge the Result section itself — the
  // "Result:" label would otherwise satisfy hasResultSignal.
  const labeledResult = starPart(payload.starExample, 'Result')
  const isLabeledStar = /\b(Situation|Task|Action|Result)\s*:/i.test(payload.starExample)
  const resultIsWeak = isLabeledStar
    ? !hasResultSignal(labeledResult)
    : !hasResultSignal(payload.starExample)
  if (payload.starExample && resultIsWeak) {
    followUpQuestions.push('What changed because of what you did — how many people were affected, or what was better after your action?')
  }
  if (!/\d/.test(combined)) {
    followUpQuestions.push('Can you add one real number — how many, how often, or over what timeframe?')
  }
  if (followUpQuestions.length < 2) {
    followUpQuestions.push('What would a teacher, coach, employer, or teammate say you contributed?')
  }

  return {
    strengths,
    wordChoiceFlags: flags,
    audienceRead: MOCK_AUDIENCE_READ[payload.audience],
    polishedVersion: mockPolished(payload, combined),
    followUpQuestions: followUpQuestions.slice(0, 2)
  }
}

export const brandCoachTemplate: StudioPromptTemplate<BrandCoachPayload, BrandCoachResponse> = {
  mode: 'brand-coach',
  templateVersion: 'brand-coach.v1.3.0',
  systemPrompt: buildSystemPrompt,
  userPromptBuilder: buildUserPrompt,
  responseSchema: validateResponse,
  mockResponse: generateMockBrandCoachResponse,
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
