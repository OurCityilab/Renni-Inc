// AI Leadership Review Coaching endpoint — Phase 3.
//
// Consumes the deterministic AiReviewReportPayload that the in-app
// review panels already build (commits 40cf4ce / d067583) and returns
// leadership coaching language. The deterministic report remains the
// source of truth; this endpoint never approves, grades, mutates
// student work, or changes status / readiness / submit gates.
//
// Reuses the existing AI infrastructure:
//   - server/utils/aiProvider.ts (Anthropic Messages call + JSON parse)
//   - server/utils/aiRateLimit.ts (25/day per user)
//   - server/utils/executiveAdvisor/aiSafetyScan.ts (personal-judgment
//     scan run AFTER schema validation; failure costs no budget)
//   - server/utils/aiReviewCoachingPrompt.ts (this pass)
//   - server/utils/aiReviewCoachingValidator.ts (this pass)
//
// Posture (do not relax in V1):
//   - Read-only coach. Never mutates Firestore.
//   - Feature-flag gated (NUXT_AI_REVIEW_COACHING_ENABLED). Default OFF.
//   - Bearer-token auth + server-side role lookup. Permissions mirror
//     the in-app review panels: admin / Co-CEO / COO see any scope;
//     matching-department chiefs see their department + chapter
//     scopes; assigned owners see their own chapter scope.
//   - Hard payload cap to keep prompts bounded.
//   - Banned-phrase scan after JSON validation. Hits → 422 with a
//     generic ai_safety_check_failed and SKIP the budget increment
//     so the user can retry.

import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import {
  AI_DAILY_LIMIT,
  recordSuccessfulCall,
  withinDailyLimit
} from '~~/server/utils/aiRateLimit'
import {
  callAnthropicMessages,
  parseModelJson,
  ProviderError,
  MalformedResponseError
} from '~~/server/utils/aiProvider'
import { scanForPersonalJudgment } from '~~/server/utils/executiveAdvisor/aiSafetyScan'
import {
  buildAiReviewCoachingSystemPrompt,
  buildAiReviewCoachingUserMessage
} from '~~/server/utils/aiReviewCoachingPrompt'
import {
  buildSafeFallback,
  validateCoachingOutput,
  CoachingValidationError
} from '~~/server/utils/aiReviewCoachingValidator'
import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload,
  AiReviewReportType
} from '~~/app/types/aiReviewReports'
import type { AppUser, Department, Role } from '~~/app/types/models'

// ---- Error envelope mirrors the other AI endpoints ----

type ErrorCode =
  | 'ai_unauthorized'
  | 'ai_forbidden'
  | 'ai_disabled'
  | 'ai_invalid_request'
  | 'ai_payload_too_large'
  | 'ai_rate_limited'
  | 'ai_provider_error'
  | 'ai_invalid_response'
  | 'ai_safety_check_failed'

interface ErrorEnvelope {
  code: ErrorCode
  message: string
}

function fail(code: ErrorCode, message: string, statusCode = 400): never {
  const envelope: ErrorEnvelope = { code, message }
  throw createError({
    statusCode,
    statusMessage: message,
    data: envelope
  })
}
function unauthorized(m: string): never { fail('ai_unauthorized', m, 401) }
function forbidden(m: string): never { fail('ai_forbidden', m, 403) }
function disabled(m: string): never { fail('ai_disabled', m, 503) }
function invalidRequest(m: string): never { fail('ai_invalid_request', m, 400) }
function payloadTooLarge(m: string): never { fail('ai_payload_too_large', m, 413) }
function rateLimited(m: string): never { fail('ai_rate_limited', m, 429) }
function providerErrorFn(m: string): never { fail('ai_provider_error', m, 502) }
function invalidResponse(m: string): never { fail('ai_invalid_response', m, 502) }
function safetyCheckFailed(m: string): never { fail('ai_safety_check_failed', m, 422) }

// ---- Auth + role lookup ----

function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) unauthorized('Sign in again to use review coaching.')
  const captured = match[1] ?? ''
  const token = captured.trim()
  if (!token) unauthorized('Sign in again to use review coaching.')
  return token
}

interface ResolvedUser {
  uid: string
  email: string
  role: Role
  department: AppUser['department']
}

async function resolveUser(uid: string): Promise<ResolvedUser> {
  const snap = await adminDb().collection('users').doc(uid).get()
  if (!snap.exists) forbidden('Your account is not provisioned.')
  const data = (snap.data() as Partial<AppUser> | undefined) ?? null
  if (!data || !data.role) {
    forbidden('Your account is not provisioned.')
  }
  // Local non-null alias so subsequent reads narrow cleanly.
  const profile = data as Partial<AppUser> & { role: Role }
  return {
    uid,
    email: typeof profile.email === 'string' ? profile.email : '',
    role: profile.role,
    department: profile.department ?? 'admin'
  }
}

const DEPARTMENT_CHIEF_ROLES = new Set<Role>(['coo', 'cfo', 'cmo', 'csgo'])

function isAuthorizedForScope(
  user: ResolvedUser,
  payload: AiReviewReportPayload
): boolean {
  const { reportType, department, deliverableId } = payload.scope
  if (user.role === 'admin' || user.role === 'coceo' || user.role === 'coo') {
    return true
  }
  if (reportType === 'company') return false
  // Department chiefs may see their own department + chapter scopes.
  if (DEPARTMENT_CHIEF_ROLES.has(user.role)) {
    if (reportType === 'department') {
      return department != null && department === user.department
    }
    if (reportType === 'chapter') {
      const d = payload.deliverables.find((d) => d.id === deliverableId)
      if (!d) return false
      return d.department === user.department
    }
  }
  // Assigned owner may see their own chapter only (single deliverable
  // in scope; ownerEmail matches the requester).
  if (reportType === 'chapter') {
    const d = payload.deliverables.find((d) => d.id === deliverableId)
    if (d && d.ownerEmail && d.ownerEmail === user.email) return true
  }
  return false
}

// ---- Request body parsing + size cap ----

const MAX_PAYLOAD_BYTES = 200_000 // ~200 KB JSON; well under provider input budgets

function asObject(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidRequest(message)
  }
  return value as Record<string, unknown>
}

function asReportType(value: unknown): AiReviewReportType {
  if (value === 'company' || value === 'department' || value === 'chapter') {
    return value
  }
  invalidRequest('payload.reportType must be company | department | chapter.')
  // Unreachable — invalidRequest throws. The explicit return keeps
  // TS happy about the function's declared return type.
  return 'company'
}

function clampExcerpts(payload: AiReviewReportPayload): AiReviewReportPayload {
  // Defense-in-depth: the in-app builder already caps section
  // excerpts at 800 chars. Re-cap here so a misuse cannot push the
  // prompt past the size budget.
  const MAX_EXCERPT = 800
  const next = JSON.parse(JSON.stringify(payload)) as AiReviewReportPayload
  for (const d of next.deliverables) {
    for (const s of d.sections) {
      if (s.contentExcerpt && s.contentExcerpt.length > MAX_EXCERPT) {
        s.contentExcerpt = `${s.contentExcerpt.slice(0, MAX_EXCERPT - 1)}…`
        s.excerptCapped = true
      }
    }
  }
  return next
}

function parsePayload(raw: unknown): AiReviewReportPayload {
  const body = asObject(raw, 'Request body must be a JSON object.')
  const payloadRaw = body.payload
  if (!payloadRaw) invalidRequest('Request body must contain `payload`.')
  // Cheap byte cap before we touch the schema.
  let serialized = ''
  try {
    serialized = JSON.stringify(payloadRaw)
  } catch {
    invalidRequest('payload could not be serialized.')
  }
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    payloadTooLarge(
      `Payload exceeds ${MAX_PAYLOAD_BYTES} bytes; trim deliverables or sections.`
    )
  }
  const p = asObject(payloadRaw, 'payload must be an object.')
  // Spot-check the required top-level keys.
  asReportType((p.scope as { reportType?: unknown })?.reportType)
  if (!Array.isArray(p.deliverables)) {
    invalidRequest('payload.deliverables must be an array.')
  }
  if (!p.deterministicSummary || typeof p.deterministicSummary !== 'object') {
    invalidRequest('payload.deterministicSummary is required.')
  }
  if (!p.deterministicReadiness || typeof p.deterministicReadiness !== 'object') {
    invalidRequest('payload.deterministicReadiness is required.')
  }
  if (!p.constraints || typeof p.constraints !== 'object') {
    invalidRequest('payload.constraints is required.')
  }
  return clampExcerpts(payloadRaw as AiReviewReportPayload)
}

// ---- Endpoint ----

export default defineEventHandler(async (event) => {
  // 1. Auth gate.
  const idToken = readBearerToken(event)
  let uid = ''
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    unauthorized('Sign in again to use review coaching.')
  }
  if (!uid) unauthorized('Sign in again to use review coaching.')

  // 2. Feature flag + provider key.
  const config = useRuntimeConfig()
  const enabled = config.aiReviewCoachingEnabled === true
  const apiKey = (config.aiCritiqueApiKey as string | undefined) || ''
  if (!enabled || !apiKey) disabled('AI review coaching is unavailable.')
  const baseUrl =
    (config.aiCritiqueBaseUrl as string | undefined) ||
    'https://api.anthropic.com'
  const model =
    (config.aiCritiqueModel as string | undefined) ||
    'claude-haiku-4-5-20251001'

  // 3. Server-side role lookup. Members are rejected before any
  //    provider call.
  const user = await resolveUser(uid)
  if (user.role === 'member') {
    forbidden('Review coaching is available to leadership roles only.')
  }

  // 4. Per-user daily limit. Pre-flight rejection here does not
  //    consume the budget; only successful provider calls do.
  if (!withinDailyLimit(uid)) {
    rateLimited(
      `Daily AI call limit reached (${AI_DAILY_LIMIT}/day). Try again tomorrow.`
    )
  }

  // 5. Body parsing + payload cap.
  const raw = await readBody(event)
  const payload = parsePayload(raw)

  // 6. Scope-level permission check based on the payload contents.
  if (!isAuthorizedForScope(user, payload)) {
    forbidden('Your role cannot request coaching for this scope.')
  }

  // 7. Build prompts. The deterministic payload is the entire context.
  const reportType: AiReviewReportType = payload.scope.reportType
  const systemPrompt = buildAiReviewCoachingSystemPrompt(reportType)
  const userMessage = buildAiReviewCoachingUserMessage(payload)

  // 8. Provider call.
  let providerText = ''
  try {
    providerText = await callAnthropicMessages({
      apiKey,
      baseUrl,
      model,
      systemPrompt,
      userPrompt: userMessage,
      maxOutputTokens: 1800
    })
  } catch (e) {
    if (e instanceof ProviderError) providerErrorFn(e.message)
    providerErrorFn('Provider call failed.')
  }

  // 9. JSON parse.
  let raw2: unknown
  try {
    raw2 = parseModelJson(providerText)
  } catch (e) {
    if (e instanceof MalformedResponseError) invalidResponse(e.message)
    invalidResponse('AI response was not valid JSON.')
  }

  // 10. Shape validation. Fall back gracefully on failure rather than
  //     surfacing raw model text to the client.
  let validated: AiReviewCoachingOutput
  try {
    validated = validateCoachingOutput(raw2)
  } catch (e) {
    if (e instanceof CoachingValidationError) {
      if (e.reason === 'safety') {
        safetyCheckFailed('AI response failed safety validation.')
      }
      // Shape failures fall back to a safe canned response rather than
      // erroring. The deterministic report on the page is unaffected.
      return buildSafeFallback('AI response shape was invalid.')
    }
    return buildSafeFallback('AI response could not be validated.')
  }

  // 11. Personal-judgment scan (executive advisor's shared list).
  //     Hits → 422 + skip budget increment.
  const personalScan = scanForPersonalJudgment(validated)
  if (!personalScan.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      'ai_review_coaching: personal-judgment scan hit',
      personalScan.hits.map((h) => h.phrase)
    )
    safetyCheckFailed('AI response failed safety validation.')
  }

  // 12. Successful call → consume daily budget.
  recordSuccessfulCall(uid)

  return validated
})
