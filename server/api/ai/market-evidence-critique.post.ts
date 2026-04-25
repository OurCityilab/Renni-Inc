// Server-only AI critique endpoint for the Market Evidence Suite.
//
// Posture (do not relax in V1):
//   - read-only coach, never an approver
//   - no Firestore writes, no auth-token forwarding, no streaming
//   - provider call lives entirely on the server; the API key never
//     leaves runtimeConfig
//   - input is validated and size-capped before we burn a model call
//   - output is JSON-only, schema-checked, and returned verbatim
//
// The endpoint targets Anthropic's Messages API by default (single
// JSON object response) but the base URL and model are configurable so
// a different Anthropic-compatible host can be plugged in via env
// without touching code.

import {
  buildMarketEvidenceCritiquePrompt,
  type MarketEvidenceCritiquePrompt
} from '~~/server/utils/marketEvidenceCritiquePrompt'
import type {
  AiCritiqueEvidenceLinkInput,
  AiCritiqueRequirementInput,
  AiCritiqueStructuredEvidenceInput,
  AiCritiqueUpstreamMarketEntry,
  MarketEvidenceCritiqueError,
  MarketEvidenceCritiqueErrorCode,
  MarketEvidenceCritiqueRequest,
  MarketEvidenceCritiqueResponse
} from '~~/app/types/aiCritique'

// V1 limits. Generous enough that students can paste full source
// notes; tight enough that a runaway request can't fan out into a
// huge model bill. Tune in V2 if real usage demands more headroom.
const MAX_TEXT_FIELD_CHARS = 10_000
const MAX_PAYLOAD_CHARS = 40_000
const MAX_EVIDENCE_LINKS = 25
const MAX_STRUCTURED_EVIDENCE = 25
const MAX_MARKET_BUILDER_ENTRIES = 25
const MAX_UPSTREAM_MARKET_ENTRIES = 25
const MAX_REQUIREMENTS = 30
const MAX_RESPONSE_TOKENS = 1500

const ALLOWED_RISK_LEVELS = new Set(['low', 'medium', 'high'])

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

function validateRequest(raw: unknown): MarketEvidenceCritiqueRequest {
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

  // MarketBuilderEntry and the upstream Ch 7 entries are passed through
  // verbatim — they're already-validated student data on disk. The cap
  // bounds the payload size so a malicious / runaway request can't fan
  // out, but we don't second-guess their internal shape.
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

  const validated: MarketEvidenceCritiqueRequest = {
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
    // Cast through unknown — we've capped the count and the prompt
    // builder JSON-stringifies the data, so any unexpected shape would
    // surface as a model error rather than a server crash.
    marketBuilderEntries:
      marketBuilderEntries as MarketEvidenceCritiqueRequest['marketBuilderEntries'],
    upstreamCh7MarketEntries:
      upstreamCh7MarketEntries as AiCritiqueUpstreamMarketEntry[],
    upstreamCh8Context
  }
  return validated
}

function ensurePromptSize(prompt: MarketEvidenceCritiquePrompt): void {
  const total = prompt.system.length + prompt.user.length
  if (total > MAX_PAYLOAD_CHARS) {
    badRequest(
      'ai_payload_too_large',
      'Section input is too large for the coach. Shorten source notes or critique one part at a time.'
    )
  }
}

interface AnthropicMessagesResponse {
  content?: Array<{ type: string; text?: string }>
  stop_reason?: string
}

async function callProvider(opts: {
  apiKey: string
  baseUrl: string
  model: string
  prompt: MarketEvidenceCritiquePrompt
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
        max_tokens: MAX_RESPONSE_TOKENS,
        system: opts.prompt.system,
        messages: [{ role: 'user', content: opts.prompt.user }]
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function parseModelResponse(text: string): MarketEvidenceCritiqueResponse {
  // Some models occasionally wrap JSON in ``` despite instructions; be
  // forgiving and strip a leading code fence.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    malformedResponse('AI response was not valid JSON.')
  }
  if (!parsed || typeof parsed !== 'object') {
    malformedResponse('AI response was not a JSON object.')
  }

  const obj = parsed as Record<string, unknown>
  const riskRaw = typeof obj.riskLevel === 'string' ? obj.riskLevel : ''
  if (!ALLOWED_RISK_LEVELS.has(riskRaw)) {
    malformedResponse(`AI returned unexpected riskLevel: ${riskRaw || '(missing)'}.`)
  }

  return {
    strengths: asStringArray(obj.strengths),
    missingEvidence: asStringArray(obj.missingEvidence),
    weakAssumptions: asStringArray(obj.weakAssumptions),
    consistencyChecks: asStringArray(obj.consistencyChecks),
    questionsToAnswer: asStringArray(obj.questionsToAnswer),
    suggestedRevision:
      typeof obj.suggestedRevision === 'string' ? obj.suggestedRevision : '',
    nextValidationSteps: asStringArray(obj.nextValidationSteps),
    riskLevel: riskRaw as MarketEvidenceCritiqueResponse['riskLevel']
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = (config.aiCritiqueApiKey as string | undefined) || ''
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
  const validated = validateRequest(raw)
  const prompt = buildMarketEvidenceCritiquePrompt(validated)
  ensurePromptSize(prompt)

  const text = await callProvider({ apiKey, baseUrl, model, prompt })
  const parsed = parseModelResponse(text)
  return parsed
})
