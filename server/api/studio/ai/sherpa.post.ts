// Our City Studio — AI Sherpa endpoint.
//
// Mirrors the auth + rate-limit + prompt-template + provider-call
// pattern of server/api/ai/market-evidence-critique.post.ts, scoped
// to Studio:
//   - Studio-scoped prompt templates (server/utils/studioPromptTemplates)
//     — no BrandContext/ProgramContext. Studio never sees Renni
//     brand or program language.
//   - Studio-scoped rate limiter (server/utils/studioAiRateLimit) —
//     an independent counter and a separately configurable
//     STUDIO_AI_DAILY_LIMIT, so a busy Studio day and a busy Renni
//     day never interact.
//   - Requires a studentProfiles/{uid} doc (Studio enrollment) in
//     addition to a verified Firebase ID token. Admin SDK calls
//     bypass Firestore security rules, so this endpoint is the
//     enforcement point for "must be Studio-enrolled to call Studio
//     AI."
//   - Falls back to a deterministic MOCK response when no provider
//     API key is configured (local dev, or a cost-controlled
//     preview environment) instead of failing closed. The mock
//     never fabricates facts or numbers — see
//     studioPromptTemplates/brandSherpa.ts.
//   - Writes an aiSessions audit doc via the Admin SDK after every
//     call (real or mock) — aiSessions has no client write path
//     (see firestore/rules.txt).
//
// Posture (do not relax):
//   - Every response conforms to the 5-part Sherpa contract
//     (yourWords / professionalVersion / whyItWorks / whatIsMissing
//     / tryAgainQuestion). See 07_AI_SHERPA_SPEC.md.
//   - Coach, never approver — same posture as the Renni AI
//     endpoints.
//   - Counter increments only AFTER a successful call (real or
//     mock); pre-flight rejection does not consume the budget.

import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import { resolveStudioPromptTemplate } from '~~/server/utils/studioPromptTemplates'
import type { BrandSherpaPayload } from '~~/server/utils/studioPromptTemplates/brandSherpa'
import {
  BRAND_COACH_AUDIENCES,
  BRAND_COACH_OUTPUT_TYPES,
  type BrandCoachPayload
} from '~~/server/utils/studioPromptTemplates/brandCoach'
import {
  resolveStudioAiDailyLimit,
  recordSuccessfulStudioCall,
  withinStudioDailyLimit
} from '~~/server/utils/studioAiRateLimit'
import { resolveStudioSessionModule } from '~~/server/utils/studioAiSessionModule'
import type {
  BrandCoachResponse,
  SherpaAudience,
  SherpaOutputType,
  SherpaResponse
} from '~~/app/types/studio/models'

const DEFAULT_MODE = 'brand-sherpa'
const MAX_FIELD_CHARS = 1_500

function badRequest(code: string, message: string): never {
  throw createError({ statusCode: 400, statusMessage: message, data: { code, message } })
}

function rateLimited(message: string): never {
  throw createError({
    statusCode: 429,
    statusMessage: message,
    data: { code: 'sherpa_rate_limited', message }
  })
}

function unauthorized(message: string): never {
  throw createError({
    statusCode: 401,
    statusMessage: message,
    data: { code: 'sherpa_unauthorized', message }
  })
}

function forbidden(message: string): never {
  throw createError({
    statusCode: 403,
    statusMessage: message,
    data: { code: 'sherpa_not_enrolled', message }
  })
}

function providerError(message: string): never {
  throw createError({
    statusCode: 502,
    statusMessage: message,
    data: { code: 'sherpa_provider_error', message }
  })
}

function malformedResponse(message: string): never {
  throw createError({
    statusCode: 502,
    statusMessage: message,
    data: { code: 'sherpa_invalid_response', message }
  })
}

// Pull `Authorization: Bearer <token>` from the request. We accept
// only Bearer; anything else is rejected so a misuse case doesn't
// fall through to the provider call.
function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) {
    unauthorized('Sign in again to use the Sherpa.')
  }
  const token = match[1].trim()
  if (!token) {
    unauthorized('Sign in again to use the Sherpa.')
  }
  return token
}

function asField(value: unknown, field: string, maxChars: number = MAX_FIELD_CHARS): string {
  if (typeof value !== 'string') {
    badRequest('sherpa_invalid_request', `${field} must be a string`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxChars) {
    badRequest(
      'sherpa_payload_too_large',
      `${field} is too long. Keep each answer under ${maxChars} characters.`
    )
  }
  return trimmed
}

// V1 supports exactly one mode. Future Sherpa tools (STAR/TMAY,
// resume, LinkedIn) add their own validator function here and the
// dispatcher below routes to it by mode, mirroring the Renni AI
// critique endpoint's per-mode handler pattern.
function validateBrandSherpaRequest(raw: unknown): BrandSherpaPayload {
  if (!raw || typeof raw !== 'object') {
    badRequest('sherpa_invalid_request', 'Request body must be a JSON object.')
  }
  const body = raw as Record<string, unknown>
  const payload: BrandSherpaPayload = {
    whatYouCareAbout: asField(body.whatYouCareAbout, 'whatYouCareAbout'),
    whyItMatters: asField(body.whyItMatters, 'whyItMatters'),
    whoYouWantToHelp: asField(body.whoYouWantToHelp, 'whoYouWantToHelp'),
    whatPeopleAskYouFor: asField(body.whatPeopleAskYouFor, 'whatPeopleAskYouFor'),
    futureYouAreBuilding: asField(body.futureYouAreBuilding, 'futureYouAreBuilding')
  }
  const hasAnyAnswer = Object.values(payload).some((v) => v.length > 0)
  if (!hasAnyAnswer) {
    badRequest('sherpa_invalid_request', 'Answer at least one question before asking the Sherpa.')
  }
  return payload
}

// Worksheet-driven Brand Coach mode: pasted worksheet material plus
// an audience and desired output type.
// Room for the Resume Builder's full composed form (contact,
// education, repeated experience/project/volunteer/leadership
// entries) — still well under the template's 16k input cap.
const MAX_WORKSHEET_CHARS = 12_000
const MAX_STAR_CHARS = 4_000

function validateBrandCoachRequest(raw: unknown): BrandCoachPayload {
  if (!raw || typeof raw !== 'object') {
    badRequest('sherpa_invalid_request', 'Request body must be a JSON object.')
  }
  const body = raw as Record<string, unknown>

  const audience = body.audience
  if (
    typeof audience !== 'string' ||
    !BRAND_COACH_AUDIENCES.includes(audience as SherpaAudience)
  ) {
    badRequest(
      'sherpa_invalid_request',
      `audience must be one of: ${BRAND_COACH_AUDIENCES.join(', ')}.`
    )
  }
  const outputType = body.outputType
  if (
    typeof outputType !== 'string' ||
    !BRAND_COACH_OUTPUT_TYPES.includes(outputType as SherpaOutputType)
  ) {
    badRequest(
      'sherpa_invalid_request',
      `outputType must be one of: ${BRAND_COACH_OUTPUT_TYPES.join(', ')}.`
    )
  }

  const payload: BrandCoachPayload = {
    worksheet: asField(body.worksheet, 'worksheet', MAX_WORKSHEET_CHARS),
    selfWords: asField(body.selfWords, 'selfWords'),
    starExample: asField(body.starExample, 'starExample', MAX_STAR_CHARS),
    audience: audience as SherpaAudience,
    outputType: outputType as SherpaOutputType,
    focus: asField(body.focus ?? '', 'focus', 600)
  }
  if (!payload.worksheet && !payload.selfWords && !payload.starExample) {
    badRequest(
      'sherpa_invalid_request',
      'Paste in some worksheet work before asking for Sherpa feedback.'
    )
  }
  return payload
}

interface AnthropicMessagesResponse {
  content?: Array<{ type: string; text?: string }>
  stop_reason?: string
}

async function callProvider(opts: {
  apiKey: string
  baseUrl: string
  model: string
  systemPrompt: string
  userPrompt: string
  maxOutputTokens: number
}): Promise<string> {
  const url = `${opts.baseUrl.replace(/\/+$/, '')}/v1/messages`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxOutputTokens,
        system: opts.systemPrompt,
        messages: [{ role: 'user', content: opts.userPrompt }]
      })
    })
  } catch (e) {
    providerError(
      `Failed to reach the AI provider: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    providerError(
      `AI provider returned ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`
    )
  }

  let json: AnthropicMessagesResponse
  try {
    json = (await res.json()) as AnthropicMessagesResponse
  } catch {
    providerError('AI provider returned a non-JSON response.')
  }

  const text =
    json.content
      ?.filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text!)
      .join('')
      .trim() ?? ''
  if (!text) {
    providerError('AI provider returned no text content.')
  }
  return text
}

function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    malformedResponse('AI response was not valid JSON.')
  }
}

export default defineEventHandler(async (event) => {
  // 1. Auth gate — verified Firebase ID token required before any
  //    Studio enrollment lookup, rate-limit check, or model call.
  const idToken = readBearerToken(event)
  let uid: string
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    unauthorized('Sign in again to use the Sherpa.')
  }

  const db = adminDb()

  // 2. Studio enrollment gate. Admin SDK bypasses Firestore rules,
  //    so this endpoint is the enforcement point.
  const profileSnap = await db.collection('studentProfiles').doc(uid).get()
  if (!profileSnap.exists) {
    forbidden('This account is not enrolled in Our City Studio.')
  }

  // 3. Per-user daily call limit. Pre-flight rejection does not
  //    consume the budget; only successful calls (real or mock) do.
  const config = useRuntimeConfig()
  const dailyLimit = resolveStudioAiDailyLimit(config.studioAiDailyLimit)
  if (!withinStudioDailyLimit(uid, dailyLimit)) {
    rateLimited(`Daily AI Sherpa limit reached (${dailyLimit}/day). Try again tomorrow.`)
  }

  const raw = await readBody(event)

  let mode = DEFAULT_MODE
  let sourceModule = resolveStudioSessionModule(undefined)
  if (raw && typeof raw === 'object') {
    const candidate = (raw as Record<string, unknown>).mode
    if (typeof candidate === 'string' && candidate.length > 0) {
      mode = candidate
    }
    sourceModule = resolveStudioSessionModule((raw as Record<string, unknown>).source)
  }

  const template = resolveStudioPromptTemplate(mode)
  if (!template || (mode !== 'brand-sherpa' && mode !== 'brand-coach')) {
    badRequest(
      'sherpa_invalid_request',
      `Unsupported Sherpa mode "${mode}". Supported modes: brand-sherpa, brand-coach.`
    )
  }

  const validated: BrandSherpaPayload | BrandCoachPayload =
    mode === 'brand-coach' ? validateBrandCoachRequest(raw) : validateBrandSherpaRequest(raw)

  const apiKey = (config.aiCritiqueApiKey as string | undefined) || ''
  const baseUrl =
    (config.aiCritiqueBaseUrl as string | undefined) || 'https://api.anthropic.com'
  const model =
    (config.aiCritiqueModel as string | undefined) || 'claude-haiku-4-5-20251001'

  let sherpa: SherpaResponse | BrandCoachResponse
  let mock: boolean

  if (!apiKey) {
    // Deterministic mock mode — no provider configured. Never
    // invents facts or numbers; see brandSherpa.ts / brandCoach.ts.
    sherpa = template.mockResponse(validated)
    mock = true
  } else {
    const systemPrompt = template.systemPrompt()
    const userPrompt = template.userPromptBuilder(validated)
    const total = systemPrompt.length + userPrompt.length
    if (total > template.maxInputChars) {
      badRequest(
        'sherpa_payload_too_large',
        'Your answers are too long for the Sherpa right now. Try shortening one section.'
      )
    }
    const text = await callProvider({
      apiKey,
      baseUrl,
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens: template.maxOutputTokens
    })
    const parsed = parseModelJson(text)
    try {
      sherpa = template.responseSchema(parsed) as SherpaResponse | BrandCoachResponse
    } catch (e) {
      malformedResponse(e instanceof Error ? e.message : 'Sherpa response failed validation.')
    }
    mock = false
  }

  // 4. Increment per-user daily counter on success (real or mock).
  recordSuccessfulStudioCall(uid)

  // 5. Audit log — Admin-SDK-only write, no client write path.
  const inputText = (
    'worksheet' in validated
      ? [
          `audience: ${validated.audience}`,
          `outputType: ${validated.outputType}`,
          validated.worksheet,
          validated.selfWords,
          validated.starExample
        ]
      : [
          validated.whatYouCareAbout,
          validated.whyItMatters,
          validated.whoYouWantToHelp,
          validated.whatPeopleAskYouFor,
          validated.futureYouAreBuilding
        ]
  )
    .filter(Boolean)
    .join('\n')
  await db.collection('aiSessions').add({
    studentUid: uid,
    module: sourceModule,
    inputText,
    aiResponse: sherpa,
    promptVersion: template.templateVersion || mode,
    createdAt: new Date().toISOString()
  })

  return { sherpa, mock }
})
