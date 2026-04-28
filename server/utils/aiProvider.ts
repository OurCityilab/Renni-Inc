// Shared AI provider helper — Executive Advisor Pass 1.
//
// Two AI endpoints (market-evidence-critique and executive-advisor)
// both speak the Anthropic Messages API and need identical
// fetch-call + JSON-fence-stripping behavior. Sharing the helpers
// here keeps both endpoints small and ensures we don't drift on
// timeout / header / response-extraction semantics.
//
// Posture (do not relax in V1):
//   - Stateless. No Firestore. No auth. The endpoint does auth +
//     rate limiting before calling these.
//   - Errors throw a tagged Error subclass; the calling endpoint
//     converts to its own generic-envelope shape so client-facing
//     error codes stay consistent.

interface AnthropicMessagesResponse {
  content?: Array<{ type: string; text?: string }>
  stop_reason?: string
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProviderError'
  }
}

export class MalformedResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MalformedResponseError'
  }
}

export interface CallProviderOptions {
  apiKey: string
  baseUrl: string
  model: string
  systemPrompt: string
  userPrompt: string
  maxOutputTokens: number
}

/**
 * POST to Anthropic Messages API. Returns the concatenated text of
 * all `text` blocks in the response. Throws ProviderError on any
 * transport / non-2xx / empty-content failure.
 */
export async function callAnthropicMessages(
  opts: CallProviderOptions
): Promise<string> {
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
    throw new ProviderError(
      `Failed to reach the AI provider: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new ProviderError(
      `AI provider returned ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`
    )
  }

  let json: AnthropicMessagesResponse
  try {
    json = (await res.json()) as AnthropicMessagesResponse
  } catch {
    throw new ProviderError('AI provider returned a non-JSON response.')
  }

  // Anthropic returns `content` as a list of blocks; concatenate
  // text blocks so a model that splits its output across blocks
  // still parses.
  const text =
    json.content
      ?.filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text!)
      .join('')
      .trim() ?? ''
  if (!text) {
    throw new ProviderError('AI provider returned no text content.')
  }
  return text
}

/**
 * Parse model output as JSON. Tolerates a leading / trailing code
 * fence (some models occasionally wrap JSON despite instructions).
 * Throws MalformedResponseError on parse failure.
 */
export function parseModelJson(text: string): unknown {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new MalformedResponseError('AI response was not valid JSON.')
  }
}
