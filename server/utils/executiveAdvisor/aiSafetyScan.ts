// Executive Advisor — personal-judgment safety scan.
//
// After the AI returns a structured response and the response has
// been schema-validated, every string field across the response is
// scanned for forbidden phrases that characterize individual students'
// character, effort, or commitment. The endpoint discards any response
// that trips the scan and does NOT charge the user's daily budget.
//
// This is intentionally crude. The brief is explicit:
//   "Do not implement sentiment analysis. The list is the list. False
//    positives are acceptable; the cost of a chief seeing a personal-
//    judgment statement about a student is higher than the cost of an
//    occasional retry."
//
// Posture (do not relax in V1):
//   - Pure / synchronous / no I/O. The endpoint is the only caller.
//   - Case-insensitive substring match against a fixed phrase list.
//   - Word-boundary aware where it matters (e.g. "lazy" should match
//     "lazy" and "Lazy" but the simple regex is good enough for this
//     budget — false positives are acceptable per the brief).
//   - Returns the matched phrase + the path through the response so
//     the audit log records what triggered the rejection. The matched
//     STRING VALUE is NOT included in the return — we don't want to
//     ferry the offending sentence into the audit collection.

// Forbidden phrase list. Case-insensitive substring match. The list
// is intentionally short and concrete. Adding entries here tightens
// the scan immediately; do not edit the regex generation logic
// unless the brief explicitly asks for it.
//
// Keep duplicates / near-duplicates that students might typo (e.g.
// "doesn't care" and "doesnt care") — the brief lists both shapes.
const FORBIDDEN_PHRASES: readonly string[] = [
  'lazy',
  'unmotivated',
  "doesn't care",
  'doesnt care',
  'does not care',
  'not trying',
  'irresponsible',
  'bad leader',
  'weak student',
  'is struggling',
  'is behind',
  'lacks commitment',
  'needs to step up',
  'is not taking ownership',
  "isn't taking ownership"
] as const

export interface AiSafetyScanHit {
  /** Matched phrase from the forbidden list, lower-cased. */
  phrase: string
  /** Dot-path through the response object where the match was found
   *  (e.g. "topPriorities[0].whyThisMatters"). Used only for audit
   *  logging and server-side telemetry — never returned to the
   *  client. */
  path: string
}

export interface AiSafetyScanResult {
  ok: boolean
  /** Populated only when ok=false. The endpoint logs hits server-
   *  side and returns a generic ai_safety_check_failed error to the
   *  client; nothing about the matched phrase or its location is
   *  surfaced to the chief. */
  hits: AiSafetyScanHit[]
}

/**
 * Returns the publicly-readable list of forbidden phrases. Useful
 * for telemetry / docs / regression tests. The endpoint does not
 * surface this list to clients.
 */
export function listForbiddenPhrases(): readonly string[] {
  return FORBIDDEN_PHRASES
}

/**
 * Walks the response object and tests every string-valued leaf for
 * any forbidden phrase. Returns ok=true when nothing matches.
 *
 * The endpoint should:
 *   1. Call this scan AFTER schema validation and BEFORE
 *      recordSuccessfulCall().
 *   2. On hit: log result.hits server-side (audit), return a generic
 *      ai_safety_check_failed error to the client, and SKIP
 *      recordSuccessfulCall so the user can retry without losing
 *      a daily slot.
 */
export function scanForPersonalJudgment(value: unknown): AiSafetyScanResult {
  const hits: AiSafetyScanHit[] = []
  visit(value, '', hits)
  return { ok: hits.length === 0, hits }
}

function visit(value: unknown, path: string, hits: AiSafetyScanHit[]): void {
  if (value === null || value === undefined) return
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    for (const phrase of FORBIDDEN_PHRASES) {
      if (lower.includes(phrase)) {
        hits.push({ phrase, path: path || '(root)' })
      }
    }
    return
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      visit(value[i], `${path}[${i}]`, hits)
    }
    return
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key
      visit(child, next, hits)
    }
  }
  // numbers / booleans: skip — phrase scan is text-only.
}
