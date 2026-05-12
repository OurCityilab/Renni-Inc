// Save a metadata-only leadership review snapshot.
//
// Server-side write only. The client sends the already-rendered
// deterministic payload and optional coaching output; this endpoint
// stores only compact counts/excerpts via buildAiReviewSnapshotDoc.

import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import {
  buildAiReviewSnapshotDoc,
  canSaveAiReviewSnapshot,
  type AiReviewSnapshotActor
} from '~~/app/utils/aiReviewSnapshots'
import type {
  AiReviewCoachingOutput,
  AiReviewReportPayload
} from '~~/app/types/aiReviewReports'
import type { AppUser, Role } from '~~/app/types/models'

type ErrorCode =
  | 'snapshot_unauthorized'
  | 'snapshot_forbidden'
  | 'snapshot_invalid_request'
  | 'snapshot_write_failed'

function fail(code: ErrorCode, message: string, statusCode = 400): never {
  throw createError({
    statusCode,
    statusMessage: message,
    data: { code, message }
  })
}

function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) fail('snapshot_unauthorized', 'Sign in again to save a snapshot.', 401)
  const token = (match[1] ?? '').trim()
  if (!token) fail('snapshot_unauthorized', 'Sign in again to save a snapshot.', 401)
  return token
}

async function resolveActor(uid: string): Promise<AiReviewSnapshotActor> {
  const snap = await adminDb().collection('users').doc(uid).get()
  if (!snap.exists) fail('snapshot_forbidden', 'Your account is not provisioned.', 403)
  const data = (snap.data() as Partial<AppUser> | undefined) ?? {}
  if (!data.role) fail('snapshot_forbidden', 'Your account is not provisioned.', 403)
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : null,
    role: data.role as Role,
    department: data.department ?? null
  }
}

function parseBody(raw: unknown): {
  payload: AiReviewReportPayload
  coaching: AiReviewCoachingOutput | null
  copyBlock: string | null
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail('snapshot_invalid_request', 'Request body must be an object.')
  }
  const body = raw as Record<string, unknown>
  const payload = body.payload
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('snapshot_invalid_request', 'Request body must include payload.')
  }
  const p = payload as Partial<AiReviewReportPayload>
  if (
    !p.scope ||
    !p.deterministicSummary ||
    !p.deterministicReadiness ||
    !Array.isArray(p.deliverables) ||
    !Array.isArray(p.tasks) ||
    !Array.isArray(p.goals)
  ) {
    fail('snapshot_invalid_request', 'Payload is missing required report fields.')
  }
  const coaching =
    body.coaching && typeof body.coaching === 'object' && !Array.isArray(body.coaching)
      ? (body.coaching as AiReviewCoachingOutput)
      : null
  const copyBlock = typeof body.copyBlock === 'string' ? body.copyBlock : null
  return { payload: payload as AiReviewReportPayload, coaching, copyBlock }
}

export default defineEventHandler(async (event) => {
  const idToken = readBearerToken(event)
  let uid = ''
  try {
    const decoded = await adminAuth().verifyIdToken(idToken)
    uid = decoded.uid
  } catch {
    fail('snapshot_unauthorized', 'Sign in again to save a snapshot.', 401)
  }
  const actor = await resolveActor(uid)
  const { payload, coaching, copyBlock } = parseBody(await readBody(event))
  if (!canSaveAiReviewSnapshot(actor, payload)) {
    fail('snapshot_forbidden', 'Your role cannot save this review snapshot.', 403)
  }
  const sourceCommit =
    process.env.K_REVISION ||
    process.env.COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    null
  const doc = buildAiReviewSnapshotDoc({
    payload,
    actor,
    coaching,
    copyBlock,
    sourceCommit
  })
  try {
    const written = await adminDb().collection('aiReviewSnapshots').add(doc)
    return { id: written.id, createdAt: doc.createdAt }
  } catch {
    fail('snapshot_write_failed', 'Could not save the review snapshot.', 500)
  }
})
