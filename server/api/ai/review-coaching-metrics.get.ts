// Aggregate AI Leadership Coaching usage metrics for leadership.
//
// Reads the server-only aiReviewCoachingInvocations collection with
// Admin SDK and returns aggregate counts only. No raw logs, payloads,
// provider output, prompts, tokens, or per-user activity feed.

import { createError, defineEventHandler, getHeader } from 'h3'
import { adminAuth, adminDb } from '~~/server/utils/admin'
import {
  aggregateAiReviewCoachingMetrics,
  type AiReviewCoachingMetricDoc
} from '~~/server/utils/aiReviewCoachingMetrics'
import type { AppUser, Role } from '~~/app/types/models'

function fail(message: string, statusCode: number): never {
  throw createError({ statusCode, statusMessage: message })
}

function readBearerToken(event: Parameters<typeof getHeader>[0]): string {
  const header = getHeader(event, 'authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) fail('Sign in again to view review coaching metrics.', 401)
  const token = (match[1] ?? '').trim()
  if (!token) fail('Sign in again to view review coaching metrics.', 401)
  return token
}

async function resolveRole(uid: string): Promise<Role> {
  const snap = await adminDb().collection('users').doc(uid).get()
  if (!snap.exists) fail('Your account is not provisioned.', 403)
  const data = (snap.data() as Partial<AppUser> | undefined) ?? {}
  if (!data.role) fail('Your account is not provisioned.', 403)
  return data.role
}

function startOfLocalDayIso(): string {
  const d = new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return start.toISOString()
}

export default defineEventHandler(async (event) => {
  const token = readBearerToken(event)
  let uid = ''
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid
  } catch {
    fail('Sign in again to view review coaching metrics.', 401)
  }
  const role = await resolveRole(uid)
  if (!(role === 'admin' || role === 'coceo' || role === 'coo')) {
    fail('Your role cannot view review coaching metrics.', 403)
  }

  const snap = await adminDb()
    .collection('aiReviewCoachingInvocations')
    .where('createdAt', '>=', startOfLocalDayIso())
    .limit(1000)
    .get()
  const docs = snap.docs.map((d) => d.data() as AiReviewCoachingMetricDoc)
  return aggregateAiReviewCoachingMetrics(docs)
})
