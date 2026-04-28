// Section articulation feedback endpoint — Customer Profile Builder
// Foundation Pass 1.
//
// PURPOSE
// -------
// Shell for Layer 3 of the section-engine pattern (see
// app/types/sectionEngines.ts):
//
//   Layer 1 — students compose an artifact from PRIMITIVES.
//   Layer 2 — a deterministic CLASSIFIER explains what they built.
//   Layer 3 — AI gives DIRECTIONAL feedback on the articulation.
//
// This endpoint will eventually carry Layer 3 for engine variants
// like `customer-profile-builder`. Pass 1 ships the SHELL ONLY:
// auth gate, request validation, feature-flag gate, and a
// deterministic safe-shape response when AI is disabled. No UI
// calls this endpoint. No Firestore writes. No approval, submit,
// or status mutation. No provider call is wired in V1.
//
// REQUEST SHAPE (V1)
//   {
//     mode: 'customer-profile-articulation-feedback',
//     variantId: 'customer-profile-builder',
//     sectionId: string,
//     primitiveSelections: Record<string, unknown>,
//     classifierOutput?: {
//       status: 'not_available' | 'stub' | 'ready'
//       primaryArchetypeId?: string
//       overlapArchetypeIds?: string[]
//       explanation?: string
//       confidence?: 'low' | 'medium' | 'high'
//     },
//     studentDraft: string
//   }
//
// RESPONSE SHAPE (V1, when feature flag is on)
//   {
//     mode: 'customer-profile-articulation-feedback',
//     variantId: 'customer-profile-builder',
//     feedbackVersion: string,
//     strengths: string[],
//     questionsToAnswer: string[],
//     missingEvidence: string[],
//     clarityIssues: string[],
//     nextValidationSteps: string[],
//     reminder: string
//   }
//
// V1 BEHAVIOR
//   - Feature flag default OFF (NUXT_SECTION_ENGINE_FEEDBACK_ENABLED).
//   - Flag OFF → return `ai_disabled` 503 BEFORE validating the body
//     so the endpoint is cheap to misfire.
//   - Flag ON → verify Firebase ID token, validate request shape,
//     and return a DETERMINISTIC safe-shape response that explicitly
//     reports the AI integration is not yet wired. No provider call
//     happens in Pass 1; provider integration is a later pass.
//   - When `classifierOutput.status` is not `'ready'`, the safe
//     response says classification feedback is not available yet.
//
// POSTURE (do not relax in V1)
//   - Read-only. Never writes Firestore. Never mutates approval,
//     submission, status, or Playbook readiness.
//   - Never invents demographic facts, spending data, or customer
//     quotes. The deterministic safe response only says what was
//     observable from the request body itself.
//   - The endpoint never judges the student's character, effort,
//     intelligence, motivation, or commitment. The safe `reminder`
//     line repeats this contract back to the caller.

import { defineEventHandler, getHeader, readBody, createError } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { adminAuth } from '~~/server/utils/admin'
import {
  isSectionEngineVariantId,
  resolveSectionEngineVariant
} from '~~/app/config/sectionEngineVariants'
import type {
  SectionClassifierOutput,
  SectionEngineVariantId
} from '~~/app/types/sectionEngines'

// ----- Constants ----------------------------------------------------

const SUPPORTED_MODE = 'customer-profile-articulation-feedback'
const FEEDBACK_VERSION = 'section-articulation-feedback@v0.1-shell'

// Per-field caps. Defense-in-depth so a runaway client cannot push
// the future provider call past the per-template input budget when
// AI integration eventually lands.
const MAX_SECTION_ID_CHARS = 200
const MAX_STUDENT_DRAFT_CHARS = 8_000
const MAX_PRIMITIVE_SELECTIONS = 25
const MAX_OVERLAP_ARCHETYPES = 10
const MAX_EXPLANATION_CHARS = 2_000

// ----- Error envelope -----------------------------------------------

type ErrorCode =
  | 'ai_unauthorized'
  | 'ai_disabled'
  | 'ai_invalid_request'
  | 'ai_payload_too_large'

interface ErrorEnvelope {
  code: ErrorCode
  message: string
}

function fail(code: ErrorCode, message: string, statusCode: number): never {
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

function disabled(message: string): never {
  fail('ai_disabled', message, 503)
}

function invalidRequest(message: string): never {
  fail('ai_invalid_request', message, 400)
}

function payloadTooLarge(message: string): never {
  fail('ai_payload_too_large', message, 413)
}

// ----- Request validation -------------------------------------------

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    invalidRequest(`${field} must be a string.`)
  }
  return value
}

function asObject(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidRequest(`${field} must be an object.`)
  }
  return value as Record<string, unknown>
}

function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) unauthorized('Sign in again to use section feedback.')
  const token = match[1].trim()
  if (!token) unauthorized('Sign in again to use section feedback.')
  return token
}

interface ValidatedRequest {
  mode: typeof SUPPORTED_MODE
  variantId: SectionEngineVariantId
  sectionId: string
  primitiveSelections: Record<string, unknown>
  classifierOutput: SectionClassifierOutput
  studentDraft: string
}

function validateClassifierOutput(raw: unknown): SectionClassifierOutput {
  if (raw === undefined || raw === null) {
    return { status: 'not_available' }
  }
  const obj = asObject(raw, 'classifierOutput')

  const status = obj.status
  if (status !== 'not_available' && status !== 'stub' && status !== 'ready') {
    invalidRequest(
      'classifierOutput.status must be one of "not_available" | "stub" | "ready".'
    )
  }

  const result: SectionClassifierOutput = { status }

  if (obj.primaryArchetypeId !== undefined) {
    result.primaryArchetypeId = asString(
      obj.primaryArchetypeId,
      'classifierOutput.primaryArchetypeId'
    ).trim()
  }

  if (obj.overlapArchetypeIds !== undefined) {
    if (!Array.isArray(obj.overlapArchetypeIds)) {
      invalidRequest('classifierOutput.overlapArchetypeIds must be an array.')
    }
    if (obj.overlapArchetypeIds.length > MAX_OVERLAP_ARCHETYPES) {
      payloadTooLarge(
        `classifierOutput.overlapArchetypeIds exceeds the cap of ${MAX_OVERLAP_ARCHETYPES}.`
      )
    }
    result.overlapArchetypeIds = obj.overlapArchetypeIds.map((id, i) =>
      asString(id, `classifierOutput.overlapArchetypeIds[${i}]`).trim()
    )
  }

  if (obj.explanation !== undefined) {
    const explanation = asString(obj.explanation, 'classifierOutput.explanation')
    if (explanation.length > MAX_EXPLANATION_CHARS) {
      payloadTooLarge(
        `classifierOutput.explanation exceeds the cap of ${MAX_EXPLANATION_CHARS} chars.`
      )
    }
    result.explanation = explanation
  }

  if (obj.confidence !== undefined) {
    const c = obj.confidence
    if (c !== 'low' && c !== 'medium' && c !== 'high') {
      invalidRequest(
        'classifierOutput.confidence must be one of "low" | "medium" | "high".'
      )
    }
    result.confidence = c
  }

  return result
}

function validateRequest(raw: unknown): ValidatedRequest {
  const body = asObject(raw, 'request body')

  const mode = asString(body.mode, 'mode').trim()
  if (mode !== SUPPORTED_MODE) {
    invalidRequest(
      `Unsupported mode "${mode}". Supported: ${SUPPORTED_MODE}.`
    )
  }

  const variantIdRaw = asString(body.variantId, 'variantId').trim()
  if (!isSectionEngineVariantId(variantIdRaw)) {
    invalidRequest(
      `Unsupported variantId "${variantIdRaw}". Supported engine variant ids are declared in app/types/sectionEngines.ts.`
    )
  }
  const variantId = variantIdRaw

  // V1 only routes customer-profile-builder. Other engine variants
  // are reserved type-side but have no shell handler yet.
  if (variantId !== 'customer-profile-builder') {
    invalidRequest(
      `Variant "${variantId}" is reserved but not yet handled by this endpoint.`
    )
  }

  const variantConfig = resolveSectionEngineVariant(variantId)
  if (!variantConfig) {
    invalidRequest(
      `Variant "${variantId}" has no config registered in sectionEngineVariants.ts.`
    )
  }

  const sectionId = asString(body.sectionId, 'sectionId').trim()
  if (!sectionId) {
    invalidRequest('sectionId is required.')
  }
  if (sectionId.length > MAX_SECTION_ID_CHARS) {
    payloadTooLarge(
      `sectionId exceeds the cap of ${MAX_SECTION_ID_CHARS} chars.`
    )
  }

  const primitiveSelections = asObject(
    body.primitiveSelections,
    'primitiveSelections'
  )
  const primitiveKeyCount = Object.keys(primitiveSelections).length
  if (primitiveKeyCount > MAX_PRIMITIVE_SELECTIONS) {
    payloadTooLarge(
      `primitiveSelections exceeds the cap of ${MAX_PRIMITIVE_SELECTIONS} keys.`
    )
  }

  const studentDraft = asString(body.studentDraft, 'studentDraft')
  const trimmedDraft = studentDraft.trim()
  if (!trimmedDraft) {
    invalidRequest('studentDraft is required and must be non-empty.')
  }
  if (studentDraft.length > MAX_STUDENT_DRAFT_CHARS) {
    payloadTooLarge(
      `studentDraft exceeds the cap of ${MAX_STUDENT_DRAFT_CHARS} chars. Trim and resubmit.`
    )
  }

  const classifierOutput = validateClassifierOutput(body.classifierOutput)

  return {
    mode: SUPPORTED_MODE,
    variantId,
    sectionId,
    primitiveSelections,
    classifierOutput,
    studentDraft
  }
}

// ----- Safe deterministic response (no provider call in V1) ---------

interface SectionArticulationFeedbackResponse {
  mode: typeof SUPPORTED_MODE
  variantId: SectionEngineVariantId
  feedbackVersion: string
  strengths: string[]
  questionsToAnswer: string[]
  missingEvidence: string[]
  clarityIssues: string[]
  nextValidationSteps: string[]
  reminder: string
}

const SAFE_REMINDER =
  'AI here is a coach. It does not approve, submit, or change status. It will never invent demographic facts, spending data, or customer quotes, and it will never judge the student.'

/**
 * Pass 1 returns a deterministic shell response when the feature
 * flag is on. The response shape is the same shape a future
 * provider-backed call will return, so future client code can
 * develop against it safely. Strings are intentionally honest about
 * the layer not being wired yet — they do NOT pretend to be model
 * output.
 */
function buildShellResponse(
  validated: ValidatedRequest
): SectionArticulationFeedbackResponse {
  const classifierReady = validated.classifierOutput.status === 'ready'

  return {
    mode: validated.mode,
    variantId: validated.variantId,
    feedbackVersion: FEEDBACK_VERSION,
    strengths: [
      'Draft was submitted, which is the first step — feedback can only respond to a real attempt.'
    ],
    questionsToAnswer: classifierReady
      ? [
          'AI articulation feedback is not yet wired in this pass. The classifier reports a result, but the AI feedback layer cannot critique it yet.'
        ]
      : [
          'Classification feedback is not available yet — the deterministic classifier for this engine variant has not been built.',
          'AI articulation feedback is not yet wired in this pass.'
        ],
    missingEvidence: [
      'No evidence checks are available in this pass. When AI feedback ships, it will ask for claim → evidence → source → assumption → confidence → risk → next-validation-step.'
    ],
    clarityIssues: [
      'No clarity checks are available in this pass.'
    ],
    nextValidationSteps: [
      'Talk to a real customer or run a small survey — the curriculum’s evidence standard rewards live signal.',
      'Re-open this section once the Customer Profile Builder UI ships to compose the artifact from primitives.'
    ],
    reminder: SAFE_REMINDER
  }
}

// ----- Endpoint -----------------------------------------------------

export default defineEventHandler(async (event) => {
  // 1. Feature-flag gate. Default OFF. Skip body parse + auth when
  //    disabled so the endpoint is cheap to misfire and never reads
  //    a token unnecessarily.
  const config = useRuntimeConfig()
  const flagEnabled =
    (config.sectionEngineFeedbackEnabled as boolean | undefined) === true
  if (!flagEnabled) {
    disabled(
      'Section engine feedback is not enabled on this server. Set NUXT_SECTION_ENGINE_FEEDBACK_ENABLED=true to enable the shell endpoint.'
    )
  }

  // 2. Auth gate. Even though the V1 shell does not call a provider,
  //    we verify the Firebase ID token so the endpoint shape matches
  //    the eventual provider-backed contract. An unauthenticated
  //    caller is never trusted to drive engine flows.
  const idToken = readBearerToken(event)
  try {
    await adminAuth().verifyIdToken(idToken)
  } catch {
    unauthorized('Sign in again to use section feedback.')
  }

  // 3. Validate request shape. Future provider integration plugs in
  //    AFTER this validator so the validator stays the contract.
  const raw = await readBody(event)
  const validated = validateRequest(raw)

  // 4. Pass 1: no provider call. Return the deterministic safe-shape
  //    response. When AI provider integration ships, the call site
  //    is right here — feed `validated` into a PromptTemplate, call
  //    the provider, validate the response with the template's
  //    `responseSchema`, and return that instead of the shell.
  return buildShellResponse(validated)
})
