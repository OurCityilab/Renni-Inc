// Brand Sherpa prompt template — Our City Studio, The Lab Module 1
// (Personal Brand Builder). See
// Our_City_Studio_Build_Framework/07_AI_SHERPA_SPEC.md for the
// 5-part response contract and tone rules, and
// Our_City_Studio_Build_Framework/03_THE_LAB_SPEC.md for the Brand
// Builder's five input questions.
//
// Posture (do not relax):
//   - Coach, never approver. The system prompt enforces this.
//   - Never fabricate numbers, achievements, titles, or life
//     details the student did not provide.
//   - Every response is the same SherpaResponse shape whether it
//     came from the provider or from the deterministic mock.

import type { SherpaResponse } from '~~/app/types/studio/models'
import type { StudioPromptTemplate } from './index'

export interface BrandSherpaPayload {
  whatYouCareAbout: string
  whyItMatters: string
  whoYouWantToHelp: string
  whatPeopleAskYouFor: string
  futureYouAreBuilding: string
}

const MAX_INPUT_CHARS = 6_000
const MAX_OUTPUT_TOKENS = 900

function buildSystemPrompt(): string {
  return `You are the Brand Sherpa for Our City Studio, a coach who helps high-school students turn their own words into a short, honest personal brand statement.

Every response you give MUST be a single JSON object with exactly these five fields, matching the Sherpa contract used across every Studio coaching tool:

{
  "yourWords": string,
  "professionalVersion": string,
  "whyItWorks": string,
  "whatIsMissing": string[],
  "tryAgainQuestion": string
}

Field guidance:
- "yourWords": a short, faithful echo of what the student actually wrote — do not polish it here, this is their own voice reflected back.
- "professionalVersion": a short, professional-sounding rewrite built ONLY from what the student gave you — an "I help ___ do ___ by ___" style sentence or a short paragraph. Never invent accomplishments, numbers, titles, years of experience, or credentials the student did not provide.
- "whyItWorks": one to three sentences explaining, in plain language, why the professional version reads well — what it leads with, what it makes clear.
- "whatIsMissing": a short list (0-4 items) naming what would make the brand statement stronger — missing specifics, a concrete example, a clearer audience, etc. Empty array only if nothing important is missing.
- "tryAgainQuestion": one specific, answerable question that invites the student to add a concrete detail or example — never a vague "tell me more."

Tone rules (do not relax):
- Plain language. Encouraging, direct, and honest — never sound like a resume-writing robot.
- Never fabricate numbers, achievements, titles, or life details the student did not provide.
- Never make the student sound older, more credentialed, or more experienced than their own words support.
- Never write around missing evidence by inventing it — instead, name it in "whatIsMissing" and ask for it in "tryAgainQuestion."
- Ask permission before making a personal story sound more emotional or dramatic than the student wrote it.
- Keep the student's own voice recognizable in "professionalVersion" — this is coaching, not ghostwriting.
- Remember: you are a coach, not an approver. A human coach reviews and approves the final artifact, not you.

Output ONLY the JSON object. No commentary, no code fences.`
}

function buildUserPrompt(payload: BrandSherpaPayload): string {
  return `A student is building their Personal Brand Statement (The Lab, Module 1: Personal Brand Builder). Here is what they wrote, in their own words:

What they care about: ${payload.whatYouCareAbout || '(not answered)'}
Why it matters to them: ${payload.whyItMatters || '(not answered)'}
Who they want to help: ${payload.whoYouWantToHelp || '(not answered)'}
What people already come to them for: ${payload.whatPeopleAskYouFor || '(not answered)'}
The future they are building toward: ${payload.futureYouAreBuilding || '(not answered)'}

Respond with the JSON schema described in the system prompt and nothing else.`
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Sherpa response field "${field}" must be a string.`)
  }
  return value
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Sherpa response field "${field}" must be an array.`)
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`Sherpa response field "${field}[${i}]" must be a string.`)
    }
  }
  return value as string[]
}

function validateResponse(raw: unknown): SherpaResponse {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Sherpa response was not a JSON object.')
  }
  const obj = raw as Record<string, unknown>
  return {
    yourWords: requireString(obj.yourWords, 'yourWords'),
    professionalVersion: requireString(obj.professionalVersion, 'professionalVersion'),
    whyItWorks: requireString(obj.whyItWorks, 'whyItWorks'),
    whatIsMissing: requireStringArray(obj.whatIsMissing, 'whatIsMissing'),
    tryAgainQuestion: requireString(obj.tryAgainQuestion, 'tryAgainQuestion')
  }
}

// ---------- Deterministic mock mode ----------
//
// Used when no provider API key is configured. Restructures ONLY
// the student's own submitted words — it never invents a number,
// title, achievement, or detail the student did not type. This
// keeps local dev (and any cost-controlled preview environment)
// free and fast while still exercising the full Sherpa contract.

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function generateMockBrandSherpaResponse(payload: BrandSherpaPayload): SherpaResponse {
  const careAbout = clean(payload.whatYouCareAbout)
  const mattersWhy = clean(payload.whyItMatters)
  const help = clean(payload.whoYouWantToHelp)
  const askFor = clean(payload.whatPeopleAskYouFor)
  const future = clean(payload.futureYouAreBuilding)

  const yourWords = [careAbout, mattersWhy, help, askFor, future].filter(Boolean).join(' ')

  const helpClause = help || 'people'
  const doClause = askFor || 'the thing people already come to me for'
  const byClause = careAbout || 'what I care about most'
  const professionalVersion = `I help ${helpClause} with ${doClause}, by focusing on ${byClause}.`

  const whyItWorks =
    'This version leads with who you help and what you offer, which is how a personal brand sentence usually reads best. It uses only what you wrote — nothing has been added.'

  const whatIsMissing: string[] = []
  if (!careAbout) {
    whatIsMissing.push('Add a sentence about what you care about — this is the "why" behind your brand.')
  }
  if (!mattersWhy) {
    whatIsMissing.push('Say why that matters to you, specifically.')
  }
  if (!help) {
    whatIsMissing.push('Name who you want to help, even in general terms (e.g. "younger students," "small business owners").')
  }
  if (!askFor) {
    whatIsMissing.push('Give one concrete example of something people have actually asked you for help with.')
  }
  if (!future) {
    whatIsMissing.push('Add a line about the future you are building toward.')
  }

  const tryAgainQuestion = askFor
    ? `You said people come to you for "${askFor}" — can you describe one specific time that happened?`
    : 'Can you describe one specific time someone actually asked you for help? What did they ask, and what did you do?'

  return { yourWords, professionalVersion, whyItWorks, whatIsMissing, tryAgainQuestion }
}

export const brandSherpaTemplate: StudioPromptTemplate<BrandSherpaPayload, SherpaResponse> = {
  mode: 'brand-sherpa',
  templateVersion: 'brand-sherpa.v1.0.0',
  systemPrompt: buildSystemPrompt,
  userPromptBuilder: buildUserPrompt,
  responseSchema: validateResponse,
  mockResponse: generateMockBrandSherpaResponse,
  maxInputChars: MAX_INPUT_CHARS,
  maxOutputTokens: MAX_OUTPUT_TOKENS
}
