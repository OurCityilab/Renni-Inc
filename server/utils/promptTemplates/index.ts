// Prompt template registry — Architectural Scaffolding sprint.
//
// The AI critique endpoint dispatches by `mode`. Each mode is a
// PromptTemplate instance that knows how to build its own system
// prompt, user prompt, and response validator from the active
// brand and program contexts. New modes plug in by exporting a
// PromptTemplate from a sibling file in this directory and adding
// it to the REGISTRY below.
//
// Posture (do not relax):
//   - Templates never read Firestore. They never see auth state.
//     They never see the API key. They take pure data in and
//     produce pure strings out.
//   - The endpoint enforces auth, rate limits, and payload caps
//     before any template runs.
//   - `responseSchema` is a pure validate-and-narrow function.
//     The brief's draft references `ZodSchema`; Zod is not a
//     current dependency in this repo (the existing
//     market-evidence handler hand-rolls validators), so V1 keeps
//     the same hand-rolled style and exposes it as a function
//     pointer. Future modes can opt into a runtime schema library
//     if added.

import type { BrandContext } from '~~/app/config/brandContext'
import type { ProgramContext } from '~~/app/config/programContext'

import {
  marketEvidenceCritiqueTemplate,
  type MarketEvidenceCritiquePayload,
  type MarketEvidenceCritiqueResult
} from './marketEvidenceCritique'

/**
 * A prompt template for one AI critique mode. Generic over the
 * shape of the payload the endpoint hands in and the validated
 * response shape the endpoint hands back to the client.
 */
export interface PromptTemplate<TPayload, TResponse> {
  /** Stable string identifier the endpoint dispatches on. Must
   *  match the `mode` in the request body and the registry key. */
  mode: string
  /** Builds the system prompt from brand + program context. The
   *  template must reference brand.name / program.name etc. via
   *  these arguments, not via hardcoded literals. */
  systemPrompt: (brand: BrandContext, program: ProgramContext) => string
  /** Builds the user prompt from the payload + brand + program.
   *  Future modes can rely on the contexts when they need to
   *  ground student claims in canonical product lists, mission
   *  statements, etc. */
  userPromptBuilder: (
    payload: TPayload,
    brand: BrandContext,
    program: ProgramContext
  ) => string
  /** Pure validator. Receives the parsed JSON from the model and
   *  either returns a typed result or throws — the endpoint
   *  catches and surfaces a generic `ai_invalid_response` error
   *  to the client. */
  responseSchema: (raw: unknown) => TResponse
  /** Hard ceiling on the assembled (system + user) prompt size in
   *  characters. The endpoint compares against this BEFORE the
   *  provider call so a runaway request can't fan out into a
   *  large model bill. ~4 chars/token, so 16_000 chars ≈ 4_000
   *  input tokens for current Anthropic models. */
  maxInputChars: number
  /** Hard ceiling on `max_tokens` passed to the provider for the
   *  response. */
  maxOutputTokens: number
}

/**
 * Registry of supported prompt template modes. V1 declares one
 * mode (`market-evidence-critique`). Future modes register here
 * and become callable through the same `/api/ai/critique` (and the
 * legacy `/api/ai/market-evidence-critique`) endpoint without
 * forking server code.
 *
 * The registry is `Record<string, PromptTemplate<unknown, unknown>>`
 * so the endpoint dispatcher can look up any mode by string. The
 * concrete payload / response shapes are enforced inside each
 * template's own validators.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, PromptTemplate<any, any>> = {
  'market-evidence-critique': marketEvidenceCritiqueTemplate
}

/**
 * Returns the PromptTemplate for a given mode string, or `null`
 * when the mode is unknown. Endpoint should reject unknown modes
 * with a generic `ai_invalid_request` error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolvePromptTemplate(mode: string): PromptTemplate<any, any> | null {
  return REGISTRY[mode] ?? null
}

/**
 * Public list of supported mode strings. Useful for future audit
 * tooling.
 */
export const SUPPORTED_PROMPT_MODES: readonly string[] = Object.freeze(
  Object.keys(REGISTRY)
)

// Re-export the first template's payload / result types so the
// endpoint can type its market-evidence handler without reaching
// into the template module.
export type {
  MarketEvidenceCritiquePayload,
  MarketEvidenceCritiqueResult
}
