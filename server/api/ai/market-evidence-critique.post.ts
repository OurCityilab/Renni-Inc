// AI critique endpoint — Architectural Scaffolding sprint refactor.
//
// V1 endpoint that previously handled exactly one mode (market-
// evidence critique) is now a thin router that:
//   1. Verifies the Firebase ID token (existing safety posture).
//   2. Reads optional `mode` from the request body, defaulting to
//      `market-evidence-critique` so the existing
//      MarketEvidenceCritiquePanel.vue client continues to work
//      without modification.
//   3. Resolves the prompt template from the registry.
//   4. Enforces per-user daily call limit (25/day, in-memory).
//   5. Validates the request body for the resolved mode.
//   6. Loads BrandContext + ProgramContext from app/config.
//   7. Builds the prompt via the template (system + user prompts
//      both parameterized over brand and program).
//   8. Enforces the template's per-request input-token budget
//      (~4000 tokens, expressed as 16_000 chars).
//   9. Calls the provider, validates the response via the
//      template's responseSchema, and returns it verbatim.
//
// The endpoint filename remains `market-evidence-critique.post.ts`
// so the existing client URL `/api/ai/market-evidence-critique` is
// unchanged and no client modification is required. The brief
// said the filename rename was cosmetic; we kept the URL stable
// because changing it would have required a client diff that the
// brief explicitly said to avoid.
//
// Posture (do not relax in V1):
//   - read-only coach, never an approver
//   - no Firestore writes, no auth-token forwarding, no streaming
//   - provider call lives entirely on the server; the API key
//     never leaves runtimeConfig
//   - input is validated and size-capped before we burn a model
//     call
//   - output is JSON-only, schema-checked, returned verbatim
//   - the caller MUST present a verified Firebase ID token; an
//     unauthenticated request never reaches the provider
//   - per-user daily call counter (25/day, UTC) gates a runaway
//     client; pre-flight rejection does not consume the budget
//
// The endpoint targets Anthropic's Messages API. The base URL and
// model are configurable via runtimeConfig. The request shape and
// response parsing assume Anthropic's `/v1/messages` schema.

// Explicit imports (Soft Section Locking sprint typecheck cleanup).
import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { adminAuth } from '~~/server/utils/admin'
import { resolvePromptTemplate } from '~~/server/utils/promptTemplates'
import type {
  MarketEvidenceCritiquePayload,
  MarketEvidenceCritiqueResult
} from '~~/server/utils/promptTemplates/marketEvidenceCritique'
import {
  AI_DAILY_LIMIT,
  recordSuccessfulCall,
  withinDailyLimit
} from '~~/server/utils/aiRateLimit'
import { HOUSE_PHOENIX_BRAND_CONTEXT } from '~~/app/config/brandContext'
import { RENAISSANCE_PROGRAM_CONTEXT } from '~~/app/config/programContext'
import type {
  AiCritiqueEvidenceLinkInput,
  AiCritiqueRequirementInput,
  AiCritiqueStructuredEvidenceInput,
  AiCritiqueUpstreamMarketEntry,
  MarketEvidenceCritiqueError,
  MarketEvidenceCritiqueErrorCode,
  MarketEvidenceCritiqueRequest
} from '~~/app/types/aiCritique'

// V1 mode the legacy URL defaults to when `mode` is omitted from
// the body. Existing MarketEvidenceCritiquePanel.vue does NOT send
// `mode`, so backwards compatibility relies on this default.
const DEFAULT_MODE = 'market-evidence-critique'

// Per-field char caps. Tighter than the per-prompt budget so a
// single bloated field can't push the prompt past
// `template.maxInputChars`.
const MAX_TEXT_FIELD_CHARS = 4_000
const MAX_EVIDENCE_LINKS = 25
const MAX_STRUCTURED_EVIDENCE = 25
const MAX_MARKET_BUILDER_ENTRIES = 25
const MAX_UPSTREAM_MARKET_ENTRIES = 25
const MAX_REQUIREMENTS = 30

function badRequest(
  code: MarketEvidenceCritiqueErrorCode,
  message: string
): never {
  const error: MarketEvidenceCritiqueError = { code, message }
  throw createError({
    statusCode: code === 'ai_disabled' ? 503 : 400,
    statusMessage: message,
    data: error
  })
}

function rateLimited(message: string): never {
  const error: MarketEvidenceCritiqueError = {
    code: 'ai_payload_too_large',
    message
  }
  throw createError({
    statusCode: 429,
    statusMessage: message,
    data: error
  })
}

function unauthorized(message: string): never {
  // Single safe message for any auth failure — present, malformed,
  // or expired token, all surface the same prompt to the user. We
  // never include token contents in the response so a misconfigured
  // client can't echo a stale token back through logs.
  const error: MarketEvidenceCritiqueError = {
    code: 'ai_unauthorized',
    message
  }
  throw createError({
    statusCode: 401,
    statusMessage: message,
    data: error
  })
}

function providerError(message: string): never {
  const error: MarketEvidenceCritiqueError = {
    code: 'ai_provider_error',
    message
  }
  throw createError({
    statusCode: 502,
    statusMessage: message,
    data: error
  })
}

function malformedResponse(message: string): never {
  const error: MarketEvidenceCritiqueError = {
    code: 'ai_invalid_response',
    message
  }
  throw createError({
    statusCode: 502,
    statusMessage: message,
    data: error
  })
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    badRequest('ai_invalid_request', `${field} must be a string`)
  }
  return value
}

function asOptionalString(value: unknown, field: string): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') {
    badRequest('ai_invalid_request', `${field} must be a string`)
  }
  return value
}

function asArray(value: unknown, field: string): unknown[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    badRequest('ai_invalid_request', `${field} must be an array`)
  }
  return value
}

function ensureMaxLen(text: string, field: string): string {
  if (text.length > MAX_TEXT_FIELD_CHARS) {
    badRequest(
      'ai_payload_too_large',
      `${field} exceeds the size limit. Shorten the section or critique part of it at a time.`
    )
  }
  return text
}

// Mode-specific request validators. Future modes register their own
// validator function here and the dispatcher calls the right one
// based on the resolved mode. For V1, only `market-evidence-critique`
// is supported.
function validateMarketEvidenceRequest(
  raw: unknown
): MarketEvidenceCritiquePayload {
  if (!raw || typeof raw !== 'object') {
    badRequest('ai_invalid_request', 'Request body must be a JSON object.')
  }
  const body = raw as Record<string, unknown>

  const deliverableId = asString(body.deliverableId, 'deliverableId').trim()
  const deliverableTitle = asString(body.deliverableTitle, 'deliverableTitle').trim()
  const chapterTitle = asString(body.chapterTitle, 'chapterTitle').trim()
  const sectionId = asString(body.sectionId, 'sectionId').trim()
  const sectionTitle = asString(body.sectionTitle, 'sectionTitle').trim()
  if (!deliverableId || !sectionId) {
    badRequest('ai_invalid_request', 'deliverableId and sectionId are required.')
  }

  const sourceNotes = ensureMaxLen(
    asOptionalString(body.sourceNotes, 'sourceNotes'),
    'sourceNotes'
  )
  const draftText = ensureMaxLen(
    asOptionalString(body.draftText, 'draftText'),
    'draftText'
  )
  const finalText = ensureMaxLen(
    asOptionalString(body.finalText, 'finalText'),
    'finalText'
  )
  const sectionLesson = ensureMaxLen(
    asOptionalString(body.sectionLesson, 'sectionLesson'),
    'sectionLesson'
  )

  const requirements = asArray(body.requirements, 'requirements')
  if (requirements.length > MAX_REQUIREMENTS) {
    badRequest(
      'ai_payload_too_large',
      `Too many requirements (${requirements.length}). Limit is ${MAX_REQUIREMENTS}.`
    )
  }
  const validatedRequirements: AiCritiqueRequirementInput[] = requirements.map(
    (r, i) => {
      if (!r || typeof r !== 'object') {
        badRequest('ai_invalid_request', `requirements[${i}] must be an object`)
      }
      const row = r as Record<string, unknown>
      return {
        id: asString(row.id, `requirements[${i}].id`),
        label: asString(row.label, `requirements[${i}].label`),
        description: asOptionalString(
          row.description,
          `requirements[${i}].description`
        ),
        requiredForApproval: row.requiredForApproval === true
      }
    }
  )

  const evidenceLinks = asArray(body.evidenceLinks, 'evidenceLinks')
  if (evidenceLinks.length > MAX_EVIDENCE_LINKS) {
    badRequest(
      'ai_payload_too_large',
      `Too many evidence links (${evidenceLinks.length}). Limit is ${MAX_EVIDENCE_LINKS}.`
    )
  }
  const validatedEvidenceLinks: AiCritiqueEvidenceLinkInput[] = evidenceLinks.map(
    (l, i) => {
      if (!l || typeof l !== 'object') {
        badRequest('ai_invalid_request', `evidenceLinks[${i}] must be an object`)
      }
      const row = l as Record<string, unknown>
      return {
        label: asString(row.label, `evidenceLinks[${i}].label`),
        url: asString(row.url, `evidenceLinks[${i}].url`),
        type: asString(row.type, `evidenceLinks[${i}].type`),
        requirementId:
          typeof row.requirementId === 'string' ? row.requirementId : null
      }
    }
  )

  const structuredEvidence = asArray(body.structuredEvidence, 'structuredEvidence')
  if (structuredEvidence.length > MAX_STRUCTURED_EVIDENCE) {
    badRequest(
      'ai_payload_too_large',
      `Too many structured evidence entries (${structuredEvidence.length}). Limit is ${MAX_STRUCTURED_EVIDENCE}.`
    )
  }
  const validatedStructuredEvidence: AiCritiqueStructuredEvidenceInput[] =
    structuredEvidence.map((e, i) => {
      if (!e || typeof e !== 'object') {
        badRequest(
          'ai_invalid_request',
          `structuredEvidence[${i}] must be an object`
        )
      }
      const row = e as Record<string, unknown>
      const confidence =
        row.confidence === 'low' ||
        row.confidence === 'medium' ||
        row.confidence === 'high'
          ? row.confidence
          : null
      return {
        claim: asString(row.claim, `structuredEvidence[${i}].claim`),
        evidence: asString(row.evidence, `structuredEvidence[${i}].evidence`),
        source: asString(row.source, `structuredEvidence[${i}].source`),
        assumption:
          typeof row.assumption === 'string' ? row.assumption : null,
        calculation:
          typeof row.calculation === 'string' ? row.calculation : null,
        confidence,
        risk: typeof row.risk === 'string' ? row.risk : null,
        nextValidation:
          typeof row.nextValidation === 'string' ? row.nextValidation : null
      }
    })

  // MarketBuilderEntry and the upstream Ch 7 entries are passed
  // through verbatim — they're already-validated student data on
  // disk. The cap bounds the payload size so a malicious / runaway
  // request can't fan out, but we don't second-guess their internal
  // shape.
  const marketBuilderEntries = asArray(
    body.marketBuilderEntries,
    'marketBuilderEntries'
  )
  if (marketBuilderEntries.length > MAX_MARKET_BUILDER_ENTRIES) {
    badRequest(
      'ai_payload_too_large',
      `Too many market builder entries (${marketBuilderEntries.length}). Limit is ${MAX_MARKET_BUILDER_ENTRIES}.`
    )
  }

  const upstreamCh7MarketEntries = asArray(
    body.upstreamCh7MarketEntries,
    'upstreamCh7MarketEntries'
  )
  if (upstreamCh7MarketEntries.length > MAX_UPSTREAM_MARKET_ENTRIES) {
    badRequest(
      'ai_payload_too_large',
      `Too many upstream Ch7 entries (${upstreamCh7MarketEntries.length}). Limit is ${MAX_UPSTREAM_MARKET_ENTRIES}.`
    )
  }

  let upstreamCh8Context: MarketEvidenceCritiqueRequest['upstreamCh8Context']
  if (body.upstreamCh8Context !== undefined && body.upstreamCh8Context !== null) {
    if (typeof body.upstreamCh8Context !== 'object') {
      badRequest('ai_invalid_request', 'upstreamCh8Context must be an object')
    }
    const ctx = body.upstreamCh8Context as Record<string, unknown>
    const finalSectionIds = asArray(
      ctx.finalSectionIds,
      'upstreamCh8Context.finalSectionIds'
    ).map((id, i) =>
      asString(id, `upstreamCh8Context.finalSectionIds[${i}]`)
    )
    const excerpt =
      typeof ctx.revenueScenariosExcerpt === 'string'
        ? ensureMaxLen(
            ctx.revenueScenariosExcerpt,
            'upstreamCh8Context.revenueScenariosExcerpt'
          )
        : null
    upstreamCh8Context = {
      finalSectionIds,
      revenueScenariosExcerpt: excerpt
    }
  }

  const validated: MarketEvidenceCritiquePayload = {
    deliverableId,
    deliverableTitle,
    chapterTitle,
    sectionId,
    sectionTitle,
    sectionLesson,
    requirements: validatedRequirements,
    sourceNotes,
    draftText,
    finalText,
    evidenceLinks: validatedEvidenceLinks,
    structuredEvidence: validatedStructuredEvidence,
    marketBuilderEntries:
      marketBuilderEntries as MarketEvidenceCritiqueRequest['marketBuilderEntries'],
    upstreamCh7MarketEntries:
      upstreamCh7MarketEntries as AiCritiqueUpstreamMarketEntry[],
    upstreamCh8Context
  }
  return validated
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

  // Anthropic returns content as a list of blocks; the JSON we want
  // arrives in a `text` block. Concatenate all text blocks so a model
  // that splits its output across blocks still parses.
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
  // Some models occasionally wrap JSON in ``` despite instructions;
  // be forgiving and strip a leading code fence.
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

// Pull `Authorization: Bearer <token>` from the request. We accept
// only Bearer; anything else is rejected so a misuse case doesn't
// fall through to the provider call.
function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) {
    unauthorized('Sign in again to use AI critique.')
  }
  const token = match[1].trim()
  if (!token) {
    unauthorized('Sign in again to use AI critique.')
  }
  return token
}

// ----- Mode handlers -----------------------------------------------
//
// Each mode's handler:
//   1. Validates the request body (mode-specific shape)
//   2. Builds prompts via the resolved template + brand/program
//      contexts
//   3. Calls the provider
//   4. Validates the response via template.responseSchema
//
// Future modes register a handler here. The endpoint dispatcher
// stays thin.
async function handleMarketEvidenceCritique(
  raw: unknown,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<MarketEvidenceCritiqueResult> {
  const template = resolvePromptTemplate('market-evidence-critique')
  if (!template) {
    // Should never happen — registry hardcodes this mode in V1.
    badRequest('ai_invalid_request', 'AI mode is not configured.')
  }
  const validated = validateMarketEvidenceRequest(raw)

  const systemPrompt = template.systemPrompt(
    HOUSE_PHOENIX_BRAND_CONTEXT,
    RENAISSANCE_PROGRAM_CONTEXT
  )
  const userPrompt = template.userPromptBuilder(
    validated,
    HOUSE_PHOENIX_BRAND_CONTEXT,
    RENAISSANCE_PROGRAM_CONTEXT
  )

  const total = systemPrompt.length + userPrompt.length
  if (total > template.maxInputChars) {
    badRequest(
      'ai_payload_too_large',
      'Section input is too large for the coach. Shorten source notes or critique one part at a time.'
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
    return template.responseSchema(parsed) as MarketEvidenceCritiqueResult
  } catch (e) {
    malformedResponse(e instanceof Error ? e.message : 'AI response failed validation.')
  }
}

// ----- Endpoint -----------------------------------------------------
export default defineEventHandler(async (event) => {
  // 1. Auth gate. Codex review verdict was RED on the unauthenticated
  //    endpoint, so we verify a Firebase ID token before reading the
  //    provider key, parsing the body, or building any prompt. An
  //    unauthenticated caller never reaches a model invocation.
  const idToken = readBearerToken(event)
  let uid: string
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    unauthorized('Sign in again to use AI critique.')
  }

  // 2. Per-user daily call limit. Pre-flight rejection here does not
  //    consume the budget; only successful provider calls do.
  if (!withinDailyLimit(uid)) {
    rateLimited(
      `Daily AI call limit reached (${AI_DAILY_LIMIT}/day). Try again tomorrow.`
    )
  }

  const config = useRuntimeConfig()
  const apiKey = (config.aiCritiqueApiKey as string | undefined) || ''
  // Anthropic-compatible only. The endpoint speaks the Anthropic
  // Messages API request/response shape; pointing baseUrl at any
  // non-Anthropic provider will fail at parse time.
  const baseUrl =
    (config.aiCritiqueBaseUrl as string | undefined) || 'https://api.anthropic.com'
  // Default to a fast, cost-efficient model for high-frequency
  // student-facing critique. Override via NUXT_AI_CRITIQUE_MODEL.
  const model =
    (config.aiCritiqueModel as string | undefined) || 'claude-haiku-4-5-20251001'

  if (!apiKey) {
    badRequest(
      'ai_disabled',
      'AI critique is not configured on this server. Set NUXT_AI_CRITIQUE_API_KEY to enable.'
    )
  }

  const raw = await readBody(event)

  // 3. Mode dispatch. The optional `mode` field on the request body
  //    selects which prompt template handles the request. The legacy
  //    market-evidence client does not send `mode`; we default to
  //    `market-evidence-critique` so backwards compatibility holds.
  let mode = DEFAULT_MODE
  if (raw && typeof raw === 'object') {
    const candidate = (raw as Record<string, unknown>).mode
    if (typeof candidate === 'string' && candidate.length > 0) {
      mode = candidate
    }
  }

  const template = resolvePromptTemplate(mode)
  if (!template) {
    badRequest(
      'ai_invalid_request',
      `Unsupported AI mode "${mode}". Supported modes: market-evidence-critique.`
    )
  }

  // 4. Mode-specific dispatch. V1 only routes `market-evidence-critique`;
  //    future modes register their own handler here without growing
  //    the dispatcher complexity.
  let response: MarketEvidenceCritiqueResult
  if (mode === 'market-evidence-critique') {
    response = await handleMarketEvidenceCritique(raw, apiKey, baseUrl, model)
  } else {
    badRequest(
      'ai_invalid_request',
      `Mode "${mode}" is registered but no handler is wired. This is a server bug.`
    )
  }

  // 5. Increment per-user daily counter on success.
  recordSuccessfulCall(uid)

  return response
})
