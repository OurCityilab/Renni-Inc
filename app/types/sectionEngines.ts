// Section Engine variant types — Customer Profile Builder Foundation Pass 1.
//
// PURPOSE
// -------
// The platform direction memo identifies a recurring three-layer
// pattern for student writing surfaces:
//   1. Students construct an artifact from PRIMITIVES (axis picks,
//      structured inputs, sometimes free text).
//   2. A deterministic CLASSIFIER explains what they built (e.g.
//      "this profile most closely matches the Civic Premium Buyer
//      archetype").
//   3. AI provides DIRECTIONAL FEEDBACK on how they articulated it
//      (sharper questions, missing evidence, vague writing) — never
//      inventing facts, never approving, never submitting.
//
// `SectionVariant` (app/config/sectionVariants.ts) toggles WHICH
// rendering path a section uses today (`'none'` vs `'chip-pick'`).
// `SectionEngineVariantId` is a SEPARATE concept: it identifies a
// FAMILY of three-layer engines that will progressively replace
// chip-pick scaffolding for richer artifacts (customer profiles,
// brand identity, value propositions, marketing messages).
//
// Pass 1 only DEFINES the customer-profile-builder shell. It does
// not render to students, does not classify, does not call AI, and
// does not replace the existing Customer Segments QuickStart.
//
// POSTURE (do not relax in V1):
//   - Pure types. No Firestore, no Vue runtime, no defaults.
//   - Adding a new engine variant is a code change with explicit
//     review, not a runtime toggle.
//   - Engines never gate submit, approval, or Playbook readiness.
//   - The seven approved axes are V1-canonical for Customer Profile
//     Builder. Adding/removing an axis is a curriculum decision, not
//     an engineering decision.

export type SectionEngineVariantId =
  | 'customer-profile-builder'
  | 'brand-identity-engine'
  | 'value-proposition-engine'
  | 'marketing-message-engine'

export type PrimitiveAxisInputType =
  | 'single-select'
  | 'multi-select'
  | 'text'
  | 'number'
  | 'confidence'

export interface PrimitiveAxisOption {
  /** Stable id used when persisting axis selections. Curriculum
   *  authors can rename `label` without breaking saved selections. */
  id: string
  label: string
  /** Optional one-line teacher note shown beneath the option. */
  helperText?: string
}

export interface PrimitiveAxisConfig {
  /** Stable axis id. Persists in `primitiveSelections` keys when the
   *  builder UI lands. */
  id: string
  label: string
  /** Question shown to the student. Phrased like a real question, not
   *  a field label, because the V1 audience is Renaissance students. */
  studentPrompt: string
  inputType: PrimitiveAxisInputType
  required?: boolean
  /** Required for `single-select` / `multi-select`. Ignored for
   *  text / number / confidence. */
  options?: PrimitiveAxisOption[]
  /** Coaching line that warns curriculum + UI authors what bias to
   *  avoid when authoring or rendering this axis. Surfaces in
   *  curriculum review and (later) in coach-tone microcopy. */
  biasGuardrail?: string
}

/**
 * One engine family's foundation config. The classifier and AI-
 * feedback layers each carry an explicit lifecycle status so the
 * UI / endpoint can degrade gracefully when only the primitives
 * exist.
 */
export interface SectionEngineVariantConfig {
  id: SectionEngineVariantId
  label: string
  description: string
  /** When true, the AI feedback layer (Layer 3) needs the active
   *  BrandContext to be passed into the prompt. Customer Profile
   *  Builder is `true` (House Phoenix grounding matters). */
  brandContextRequired: boolean
  /** When true, the AI feedback layer needs the active
   *  ProgramContext (audience tone, forbidden terms). */
  programContextRequired: boolean
  /** The PRIMITIVES axis set the student composes from. */
  axes: PrimitiveAxisConfig[]
  /** Layer 2 lifecycle. `not_started` is the V1 honest answer for
   *  customer-profile-builder — archetype curriculum is not finalized,
   *  so no classifier rules can be authored yet. */
  classifierStatus: 'not_started' | 'stubbed' | 'ready'
  /** Layer 3 lifecycle. `shell_only` is the V1 honest answer once
   *  the endpoint shell ships but no provider call is wired. */
  aiFeedbackStatus: 'not_started' | 'shell_only' | 'ready'
}

/**
 * Optional per-section opt-in shape (NOT consumed by the workspace
 * render tree in Pass 1). When a TemplateStudio section eventually
 * wants to declare which engine variant should replace its chip-pick
 * scaffolding, it can attach this shape — the renderer will only
 * mount the engine when `status === 'active'`. V1 authoring should
 * use `status: 'planned'` so the section continues to render as it
 * does today.
 */
export interface SectionEngineVariantBinding {
  id: SectionEngineVariantId
  status: 'planned' | 'active'
}

/**
 * Layer 2 result shape. Hand-off boundary between the (future)
 * deterministic classifier and the AI feedback layer. Pass 1 ships
 * this type so the endpoint validator can describe the field
 * without depending on a real classifier.
 */
export interface SectionClassifierOutput {
  status: 'not_available' | 'stub' | 'ready'
  primaryArchetypeId?: string
  overlapArchetypeIds?: string[]
  explanation?: string
  confidence?: 'low' | 'medium' | 'high'
}
