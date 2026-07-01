// Our City Studio prompt template registry — parallel to, but
// deliberately separate from, server/utils/promptTemplates/index.ts
// (Renni Command Center).
//
// The Renni PromptTemplate interface parameterizes systemPrompt/
// userPromptBuilder over BrandContext + ProgramContext (House
// Phoenix, Renaissance). Studio has no brand/program context of its
// own and must never leak Renni brand or program language into
// student-facing output — so StudioPromptTemplate takes no such
// arguments at all.
//
// Posture (mirrors server/utils/promptTemplates/index.ts, do not
// relax):
//   - Templates never read Firestore. They never see auth state.
//     They never see the API key. They take pure data in and
//     produce pure strings (or a mock response object) out.
//   - The endpoint enforces auth, Studio enrollment, rate limits,
//     and payload caps before any template runs.
//   - `responseSchema` is a pure validate-and-narrow function, hand-
//     rolled (no Zod dependency in this repo), same style as the
//     Renni templates.
//   - `mockResponse` is a pure, deterministic function used when no
//     provider API key is configured. It must never fabricate facts
//     or numbers — it may only restructure the student's own
//     submitted words.

export interface StudioPromptTemplate<TPayload, TResponse> {
  /** Stable string identifier the endpoint dispatches on. Must
   *  match the `mode` in the request body and the registry key. */
  mode: string
  /** Stable version string written into aiSessions audit entries so
   *  coaches/admins can correlate behavior changes with template
   *  revisions. */
  templateVersion?: string
  /** Builds the system prompt. No brand/program arguments — Studio
   *  prompts are self-contained. */
  systemPrompt: () => string
  /** Builds the user prompt from the validated payload. */
  userPromptBuilder: (payload: TPayload) => string
  /** Pure validator. Receives the parsed JSON from the model and
   *  either returns a typed result or throws — the endpoint catches
   *  and surfaces a generic invalid-response error to the client. */
  responseSchema: (raw: unknown) => TResponse
  /** Deterministic, non-LLM fallback used when no provider API key
   *  is configured (local dev, or a cost-controlled preview
   *  environment). Must produce a response satisfying the same
   *  contract as `responseSchema`, built only from the student's
   *  own submitted words. */
  mockResponse: (payload: TPayload) => TResponse
  /** Hard ceiling on the assembled (system + user) prompt size in
   *  characters, checked before the provider call. */
  maxInputChars: number
  /** Hard ceiling on `max_tokens` passed to the provider. */
  maxOutputTokens: number
}

import { brandSherpaTemplate } from './brandSherpa'

/**
 * Registry of supported Studio AI modes. V1 declares one mode
 * (`brand-sherpa`). Future Sherpa tools (STAR/TMAY, resume,
 * LinkedIn, Markets coaching) register here without forking the
 * endpoint.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, StudioPromptTemplate<any, any>> = {
  'brand-sherpa': brandSherpaTemplate
}

/**
 * Returns the StudioPromptTemplate for a given mode string, or
 * `null` when the mode is unknown.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveStudioPromptTemplate(mode: string): StudioPromptTemplate<any, any> | null {
  return REGISTRY[mode] ?? null
}

/** Public list of supported mode strings. */
export const SUPPORTED_STUDIO_PROMPT_MODES: readonly string[] = Object.freeze(
  Object.keys(REGISTRY)
)
