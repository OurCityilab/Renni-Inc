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

// Imports are limited to what the registry / dispatcher needs
// here. Per-template payload / result types and request-bound
// factories are imported directly by endpoints from each
// template's own module — see the comment on the removed
// re-export block at the bottom of this file.
import { marketEvidenceCritiqueTemplate } from './marketEvidenceCritique'
import { dailyCommandBriefTemplate } from './dailyCommandBrief'
import { whatsNextTemplate } from './whatsNext'
import { runTheMeetingTemplate } from './runTheMeeting'
import { assignTheWorkTemplate } from './assignTheWork'
import { buildCoachModeRegistryStub } from './coachModeShared'
import { ADVISOR_MODES } from '~~/app/types/executiveAdvisor'

/**
 * A prompt template for one AI critique mode. Generic over the
 * shape of the payload the endpoint hands in and the validated
 * response shape the endpoint hands back to the client.
 */
export interface PromptTemplate<TPayload, TResponse> {
  /** Stable string identifier the endpoint dispatches on. Must
   *  match the `mode` in the request body and the registry key. */
  mode: string
  /** Stable version string written into responses and audit log
   *  entries so chiefs and instructors can correlate behavior
   *  changes with template revisions. Existing templates that
   *  predate this field can omit it (optional in V1). New
   *  templates SHOULD set this. */
  templateVersion?: string
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
  'market-evidence-critique': marketEvidenceCritiqueTemplate,
  // Executive Advisor V1 — four modes added in Pass 1. The endpoint
  // file `server/api/ai/executive-advisor.post.ts` is the only
  // dispatcher today; market-evidence-critique stays on its own
  // legacy URL so the existing client requires no modification.
  'daily-command-brief': dailyCommandBriefTemplate,
  'whats-next': whatsNextTemplate,
  'run-the-meeting': runTheMeetingTemplate,
  'assign-the-work': assignTheWorkTemplate
}

// Executive Advisor V2 — eight management-coach modes added in
// the upgrade pass. They share one prompt + one validator and
// register here so resolvePromptTemplate(mode) treats them the
// same as the V1 modes. Endpoint dispatcher constructs the
// request-bound template via buildCoachModeTemplate(mode, payload).
for (const mode of ADVISOR_MODES) {
  REGISTRY[mode] = buildCoachModeRegistryStub(mode)
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

// Note: convenience re-exports of per-template types and factories
// were removed to resolve Nuxt auto-import duplicate-export
// warnings. Endpoints now import payload / result types and
// request-bound template factories directly from each template's
// own module (`./marketEvidenceCritique`, `./dailyCommandBrief`,
// `./whatsNext`, `./runTheMeeting`, `./assignTheWork`,
// `./coachModeShared`). The dispatcher exports above
// (`PromptTemplate`, `resolvePromptTemplate`,
// `SUPPORTED_PROMPT_MODES`) remain canonical here.
