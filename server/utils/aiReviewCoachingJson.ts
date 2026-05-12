// Robust JSON extraction for AI Leadership Coaching responses.
//
// Posture (do not relax):
//   - PURE: no Firestore, no fetch, no logging.
//   - Never returns arrays as top-level coaching output.
//   - Never accepts an empty object.
//   - Does not expose or persist raw provider text.

export class AiReviewCoachingJsonParseError extends Error {
  constructor(message = 'AI response was not valid JSON.') {
    super(message)
    this.name = 'AiReviewCoachingJsonParseError'
  }
}

function assertNonEmptyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AiReviewCoachingJsonParseError('AI response JSON must be an object.')
  }
  const obj = value as Record<string, unknown>
  if (Object.keys(obj).length === 0) {
    throw new AiReviewCoachingJsonParseError('AI response JSON object was empty.')
  }
  return obj
}

function parseObject(candidate: string): Record<string, unknown> {
  try {
    return assertNonEmptyObject(JSON.parse(candidate))
  } catch (err) {
    if (err instanceof AiReviewCoachingJsonParseError) throw err
    throw new AiReviewCoachingJsonParseError()
  }
}

function fencedCandidates(text: string): string[] {
  const out: string[] = []
  const re = /```(?:json)?\s*([\s\S]*?)\s*```/gi
  let match: RegExpExecArray | null = null
  while ((match = re.exec(text)) !== null) {
    const body = match[1]?.trim()
    if (body) out.push(body)
  }
  return out
}

function firstBalancedJsonObject(text: string): string | null {
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (start === -1) {
      if (ch === '{') {
        start = i
        depth = 1
      }
      continue
    }

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === '{') {
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

export function extractAiReviewCoachingJson(
  text: string
): Record<string, unknown> {
  const trimmed = String(text ?? '').trim()
  if (!trimmed) throw new AiReviewCoachingJsonParseError()
  if (trimmed.startsWith('[')) {
    throw new AiReviewCoachingJsonParseError('AI response JSON must be an object.')
  }

  // Fast path: the provider followed instructions.
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObject(trimmed)
  }

  // Common model drift: fenced JSON with or without the json language tag.
  for (const candidate of fencedCandidates(trimmed)) {
    try {
      return parseObject(candidate)
    } catch {
      // Try the next fenced block or the balanced-object scan below.
    }
  }

  // Last structured recovery: first balanced object inside surrounding prose.
  const balanced = firstBalancedJsonObject(trimmed)
  if (!balanced) throw new AiReviewCoachingJsonParseError()
  return parseObject(balanced)
}
