// Executive Advisor endpoint — Pass 1 (server-only, no UI).
//
// Mode-aware AI advisor for chiefs (admin / coceo / coo / cfo /
// cmo / csgo). Pass 1 ships four modes and the supporting
// scaffolding; UI wiring, task creation, and accepted-action
// write-back are explicitly out of scope and arrive in Pass 2.
//
// Request body shape:
//   {
//     "mode": "daily-command-brief" | "whats-next" | "run-the-meeting" | "assign-the-work",
//     // Mode-specific optional field:
//     "focus":     string  (assign-the-work, optional)
//   }
//
// Response shape: the active template's `responseSchema` output.
// Each template includes its own `templateVersion` field on the
// returned object, so the envelope is just the validated result
// returned verbatim.
//
// Error envelope (generic; never leaks provider details):
//   HTTP 4xx/5xx + body { code: string, message: string }
//
// Posture (do not relax in V1):
//   - read-only coach, never an approver
//   - no Firestore writes from THIS endpoint to user content. The
//     ONE write the endpoint performs is an append to
//     aiAdvisorInvocations with minimal metadata (server-side
//     Admin SDK only; client read/write is denied by Firestore
//     rules in firestore/rules.txt).
//   - feature-flag gate: when the runtime config flag
//     `executiveAdvisorEnabled` is missing or false, OR the
//     provider API key is unset, the endpoint returns a generic
//     `ai_disabled` error and never invokes the model.
//   - safety scan runs on the AI OUTPUT after schema validation.
//     Hits cause the endpoint to reject the response, log the
//     failure, and SKIP the daily-quota increment so the chief
//     can retry without losing a slot.
//   - rate limit: shares the 25/day per-user in-memory limit with
//     market-evidence-critique. Per-instance limitation documented
//     in server/utils/aiRateLimit.ts; Firestore-backed rate
//     limiting deferred per Pass 1 scope.
//   - the caller MUST present a verified Firebase ID token AND
//     must be admin / coceo / coo / cfo / cmo / csgo per the
//     Firestore users/{uid}.role lookup. Members are rejected
//     before role-aware reads happen.
//   - action cards always carry humanReviewRequired: true and are
//     normalized by the shared validator (sourceIds-empty cards
//     coerced to confidence='low'; due-date suggestions clamped
//     to linked deliverable's due date when later).

import { randomUUID } from 'node:crypto'
import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import {
  AI_DAILY_LIMIT,
  recordSuccessfulCall,
  withinDailyLimit
} from '~~/server/utils/aiRateLimit'
import {
  resolvePromptTemplate,
  buildDailyCommandBriefTemplate,
  buildWhatsNextTemplate,
  buildRunTheMeetingTemplate,
  buildAssignTheWorkTemplate,
  buildCoachModeTemplate
} from '~~/server/utils/promptTemplates'
import {
  buildExecutiveContextPackage,
  type ExecutiveContextPackage
} from '~~/server/utils/executiveContext'
import { buildExecutiveAdvisorContextV2 } from '~~/server/utils/executiveAdvisorContext'
import {
  ADVISOR_MODES,
  isAdvisorMode,
  type AdvisorMode as CoachAdvisorMode
} from '~~/app/types/executiveAdvisor'
import { scanForPersonalJudgment } from '~~/server/utils/executiveAdvisor/aiSafetyScan'
import {
  countSourceIds,
  recordInvocation,
  type AdvisorInvocationCreateInput
} from '~~/server/utils/executiveAdvisor/aiAdvisorInvocations'
import {
  callAnthropicMessages,
  parseModelJson,
  ProviderError,
  MalformedResponseError
} from '~~/server/utils/aiProvider'
import { HOUSE_PHOENIX_BRAND_CONTEXT } from '~~/app/config/brandContext'
import { RENAISSANCE_PROGRAM_CONTEXT } from '~~/app/config/programContext'
import type { AppUser, Role } from '~~/app/types/models'
import type { PromptTemplate } from '~~/server/utils/promptTemplates'

// ---- Types ---------------------------------------------------------

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

type V1AdvisorMode =
  | 'daily-command-brief'
  | 'whats-next'
  | 'run-the-meeting'
  | 'assign-the-work'

type AdvisorMode = V1AdvisorMode | CoachAdvisorMode

const V1_MODES = new Set<V1AdvisorMode>([
  'daily-command-brief',
  'whats-next',
  'run-the-meeting',
  'assign-the-work'
])

const SUPPORTED_MODES = new Set<string>([
  ...V1_MODES,
  ...ADVISOR_MODES
])

function isV1Mode(mode: AdvisorMode): mode is V1AdvisorMode {
  return V1_MODES.has(mode as V1AdvisorMode)
}

// Caller-supplied free-text caps. Defense-in-depth: each template
// also re-caps internally so a misuse here cannot push the prompt
// past the per-template input budget.
const MAX_FOCUS_HINT_CHARS = 400
const MAX_FOCUS_CHARS = 240

// ---- Error helpers -------------------------------------------------

function fail(
  code: ErrorCode,
  message: string,
  statusCode = 400
): never {
  const envelope: ErrorEnvelope = { code, message }
  throw createError({
    statusCode,
    statusMessage: message,
    data: envelope
  })
}

function unauthorized(message: string): never {
  fail('ai_unauthorized', message, 401)
}
function forbidden(message: string): never {
  fail('ai_forbidden', message, 403)
}
function disabled(message: string): never {
  fail('ai_disabled', message, 503)
}
function invalidRequest(message: string): never {
  fail('ai_invalid_request', message, 400)
}
function payloadTooLarge(message: string): never {
  fail('ai_payload_too_large', message, 413)
}
function rateLimited(message: string): never {
  fail('ai_rate_limited', message, 429)
}
function providerErrorFn(message: string): never {
  fail('ai_provider_error', message, 502)
}
function invalidResponse(message: string): never {
  fail('ai_invalid_response', message, 502)
}
function safetyCheckFailed(message: string): never {
  fail('ai_safety_check_failed', message, 422)
}

// ---- Auth + role lookup --------------------------------------------

function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) unauthorized('Sign in again to use the advisor.')
  const token = match[1].trim()
  if (!token) unauthorized('Sign in again to use the advisor.')
  return token
}

interface ResolvedUser {
  uid: string
  email: string
  displayName: string
  role: Role
  department: AppUser['department']
  isChief: boolean
}

async function resolveUser(uid: string): Promise<ResolvedUser> {
  const snap = await adminDb().collection('users').doc(uid).get()
  if (!snap.exists) {
    forbidden('Your account is not provisioned for the advisor.')
  }
  const data = snap.data() as Partial<AppUser> | undefined
  if (!data) {
    forbidden('Your account is not provisioned for the advisor.')
  }
  const role = data.role
  if (!role) {
    forbidden('Your account is not provisioned for the advisor.')
  }
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    role,
    department: data.department ?? 'admin',
    isChief: data.isChief === true
  }
}

function isAdvisorAuthorized(user: ResolvedUser): boolean {
  if (user.role === 'admin' || user.role === 'coceo') return true
  if (
    user.role === 'coo' ||
    user.role === 'cfo' ||
    user.role === 'cmo' ||
    user.role === 'csgo'
  )
    return true
  return user.isChief && user.role !== 'member'
}

// ---- Body parsing --------------------------------------------------

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function clampString(value: unknown, max: number): string {
  const v = asString(value).trim()
  if (!v) return ''
  return v.length > max ? `${v.slice(0, max - 1)}…` : v
}

interface NormalizedBody {
  mode: AdvisorMode
  focusHint: string
  focus: string
}

function normalizeBody(raw: unknown): NormalizedBody {
  if (!raw || typeof raw !== 'object') {
    invalidRequest('Request body must be a JSON object.')
  }
  const body = raw as Record<string, unknown>

  const modeStr = asString(body.mode).trim()
  if (!modeStr) invalidRequest('mode is required.')
  if (!SUPPORTED_MODES.has(modeStr)) {
    invalidRequest(
      `Unsupported mode "${modeStr}". V1 modes: daily-command-brief, whats-next, run-the-meeting, assign-the-work. V2 coach modes: ${ADVISOR_MODES.join(', ')}.`
    )
  }

  return {
    mode: modeStr as AdvisorMode,
    focusHint: clampString(body.focusHint, MAX_FOCUS_HINT_CHARS),
    focus: clampString(body.focus, MAX_FOCUS_CHARS)
  }
}

// ---- Mode dispatch -------------------------------------------------

interface ModeRun {
  template: PromptTemplate<unknown, unknown>
  payload: Record<string, unknown>
}

function buildV1ModeRun(
  body: NormalizedBody,
  context: ExecutiveContextPackage
): ModeRun {
  // Narrow to V1 modes only — V2 coach modes use the V2 dispatcher.
  const mode = body.mode as V1AdvisorMode
  switch (mode) {
    case 'daily-command-brief': {
      const payload = { context }
      return {
        template: buildDailyCommandBriefTemplate(
          payload
        ) as PromptTemplate<unknown, unknown>,
        payload
      }
    }
    case 'whats-next': {
      const payload = { context }
      return {
        template: buildWhatsNextTemplate(
          payload
        ) as PromptTemplate<unknown, unknown>,
        payload
      }
    }
    case 'run-the-meeting': {
      const payload = { context }
      return {
        template: buildRunTheMeetingTemplate(
          payload
        ) as PromptTemplate<unknown, unknown>,
        payload
      }
    }
    case 'assign-the-work': {
      const payload = body.focus ? { context, focus: body.focus } : { context }
      return {
        template: buildAssignTheWorkTemplate(
          payload
        ) as PromptTemplate<unknown, unknown>,
        payload
      }
    }
  }
}

// ---- Endpoint ------------------------------------------------------

export default defineEventHandler(async (event) => {
  // 1. Auth gate — verify Firebase ID token and resolve uid before
  //    we touch the runtime config or read the body. Unauth callers
  //    cannot invoke the model.
  const idToken = readBearerToken(event)
  let uid: string
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    unauthorized('Sign in again to use the advisor.')
  }

  // 2. Feature flag + provider key gate. Both must be present or
  //    we short-circuit with a generic ai_disabled.
  // The flag is declared as a boolean in nuxt.config.ts (built from
  // `process.env.NUXT_EXECUTIVE_ADVISOR_ENABLED === 'true'`), so the
  // value reaching the runtime config is always boolean. The
  // previous `=== 'true'` fallback was dead code and tripped vue-tsc.
  const config = useRuntimeConfig()
  const enabled = config.executiveAdvisorEnabled === true
  const apiKey = (config.aiCritiqueApiKey as string | undefined) || ''
  if (!enabled || !apiKey) {
    disabled('Executive Advisor is unavailable.')
  }
  const baseUrl =
    (config.aiCritiqueBaseUrl as string | undefined) || 'https://api.anthropic.com'
  const model =
    (config.aiCritiqueModel as string | undefined) || 'claude-haiku-4-5-20251001'

  // 3. Server-side role lookup. Members and unprovisioned accounts
  //    are rejected here, before any context read or model call.
  const user = await resolveUser(uid)
  if (!isAdvisorAuthorized(user)) {
    forbidden('The advisor is available to chiefs and instructors only.')
  }

  // 4. Per-user daily limit. Pre-flight rejection here does not
  //    consume the budget; only successful provider calls do.
  if (!withinDailyLimit(uid)) {
    rateLimited(
      `Daily AI call limit reached (${AI_DAILY_LIMIT}/day). Try again tomorrow.`
    )
  }

  // 5. Body parsing + mode validation.
  const raw = await readBody(event)
  const body = normalizeBody(raw)

  // 6. Cheap registry sanity check. The actual validator comes from
  //    the request-bound template below; this guards against a
  //    registry-vs-dispatcher drift.
  if (!resolvePromptTemplate(body.mode)) {
    invalidRequest(`Unsupported mode "${body.mode}".`)
  }

  // 7. Build the appropriate context package via Admin SDK. V1
  //    modes use the original ExecutiveContextPackage; V2 coach
  //    modes use the augmented ExecutiveAdvisorContextV2 which
  //    layers in the final-week lane map, dependency signals, and
  //    task-coverage gaps. Both share the same Firestore reads —
  //    the V2 builder wraps the V1 builder and adds derivations
  //    from pure utilities (no extra round-trips).
  let run: ModeRun
  try {
    if (isV1Mode(body.mode)) {
      const v1Context = await buildExecutiveContextPackage({
        viewer: {
          uid: user.uid,
          email: user.email,
          role: user.role,
          department: user.department,
          isChief: user.isChief
        },
        focusHint: body.focusHint || null
      })
      run = buildV1ModeRun(body, v1Context)
    } else if (isAdvisorMode(body.mode)) {
      // Pass the workspace's Customer Profile Builder feature flag
      // through to the context builder so builderCoverage matches
      // what students actually see in DeliverableOutputWorkspace.
      // The flag lives on `runtimeConfig.public.customerProfileBuilderEnabled`
      // and is read by the workspace via useRuntimeConfig().
      const cpbEnabled =
        config.public?.customerProfileBuilderEnabled === true
      const v2Context = await buildExecutiveAdvisorContextV2({
        viewer: {
          uid: user.uid,
          email: user.email,
          role: user.role,
          department: user.department,
          isChief: user.isChief
        },
        focusHint: body.focusHint || null,
        customerProfileBuilderEnabled: cpbEnabled
      })
      const payload = {
        context: v2Context,
        focus: body.focus || null
      }
      run = {
        template: buildCoachModeTemplate(
          body.mode,
          payload
        ) as PromptTemplate<unknown, unknown>,
        payload
      }
    } else {
      // Should never happen: normalizeBody already validated mode.
      invalidRequest(`Unsupported mode "${body.mode}".`)
    }
  } catch (e) {
    providerErrorFn(
      `Failed to assemble advisor context: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  // 8. Build the request-bound template + mode payload.
  const template = run!.template

  const systemPrompt = template.systemPrompt(
    HOUSE_PHOENIX_BRAND_CONTEXT,
    RENAISSANCE_PROGRAM_CONTEXT
  )
  const userPrompt = template.userPromptBuilder(
    run!.payload,
    HOUSE_PHOENIX_BRAND_CONTEXT,
    RENAISSANCE_PROGRAM_CONTEXT
  )
  const contextPackageSizeChars = systemPrompt.length + userPrompt.length

  // 9. Per-template input-token budget check.
  if (contextPackageSizeChars > template.maxInputChars) {
    payloadTooLarge(
      'Advisor context is too large. Narrow the focus or reduce the open queue, then try again.'
    )
  }

  // 10. Invocation metadata stub. We populate fields as we go so
  //     a partial failure still records a useful audit row.
  const invocationId = randomUUID()
  const invokedAt = new Date().toISOString()
  const invokedBy = {
    uid: user.uid,
    displayName: user.displayName,
    role: user.role,
    email: user.email
  }
  const templateVersion = template.templateVersion ?? 'unversioned'

  async function logInvocation(extra: {
    responseValidated: boolean
    safetyScanPassed: boolean
    sourceCounts?: AdvisorInvocationCreateInput['sourceCounts']
  }): Promise<void> {
    await recordInvocation({
      invocationId,
      mode: body.mode,
      templateVersion,
      invokedBy,
      invokedAt,
      contextPackageSizeChars,
      responseValidated: extra.responseValidated,
      safetyScanPassed: extra.safetyScanPassed,
      sourceCounts: extra.sourceCounts
    })
  }

  // 11. Provider call.
  let modelText: string
  try {
    modelText = await callAnthropicMessages({
      apiKey,
      baseUrl,
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens: template.maxOutputTokens
    })
  } catch (e) {
    await logInvocation({
      responseValidated: false,
      safetyScanPassed: false
    })
    if (e instanceof ProviderError) providerErrorFn(e.message)
    providerErrorFn(
      `Advisor call failed: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  // 12. JSON parse + schema validation. Schema validation also
  //     normalizes ActionCards (sourceIds-empty → confidence='low';
  //     due-date clamping; humanReviewRequired=true).
  let parsed: unknown
  try {
    parsed = parseModelJson(modelText)
  } catch (e) {
    await logInvocation({
      responseValidated: false,
      safetyScanPassed: false
    })
    if (e instanceof MalformedResponseError) invalidResponse(e.message)
    invalidResponse(`AI response could not be parsed: ${e instanceof Error ? e.message : String(e)}`)
  }

  let result: unknown
  try {
    result = template.responseSchema(parsed)
  } catch (e) {
    await logInvocation({
      responseValidated: false,
      safetyScanPassed: false
    })
    invalidResponse(e instanceof Error ? e.message : 'AI response failed validation.')
  }

  // 13. Personal-judgment scan on the validated output. On hit:
  //     log failure, return a generic ai_safety_check_failed, and
  //     SKIP the daily-quota increment so the chief can retry.
  const scan = scanForPersonalJudgment(result)
  if (!scan.ok) {
    // Server-side log. Hit phrases + paths are useful for incident
    // triage but do NOT travel to the client.
    // eslint-disable-next-line no-console
    console.warn(
      '[executive-advisor] safety scan rejected response',
      JSON.stringify({
        invocationId,
        mode: body.mode,
        hits: scan.hits.map((h) => ({ phrase: h.phrase, path: h.path }))
      })
    )
    await logInvocation({
      responseValidated: true,
      safetyScanPassed: false,
      sourceCounts: countSourceIds(result)
    })
    safetyCheckFailed(
      'The advisor produced a response that did not pass our safety check. Try again.'
    )
  }

  // 14. Success path. Increment per-user daily counter, log
  //     invocation with full success metadata, return the
  //     validated result verbatim.
  recordSuccessfulCall(uid)
  await logInvocation({
    responseValidated: true,
    safetyScanPassed: true,
    sourceCounts: countSourceIds(result)
  })

  return result
})
