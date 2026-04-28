// Section Engine variant types — Customer Profile Builder.
//
// PURPOSE
// -------
// The platform direction memo identifies a recurring three-layer
// pattern for student writing surfaces:
//   1. Students construct an artifact from PRIMITIVES (axis picks,
//      structured inputs, sometimes free text).
//   2. A deterministic CLASSIFIER explains what they built (e.g.
//      "this profile most closely matches Rising City Renters").
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
// V1 ships the customer-profile-builder classifier (Layer 2). Layer 3
// stays shell-only until a separate AI integration pass.
//
// POSTURE (do not relax in V1):
//   - Pure types. No Firestore, no Vue runtime, no defaults.
//   - Adding a new engine variant is a code change with explicit
//     review, not a runtime toggle.
//   - Engines never gate submit, approval, or Playbook readiness.
//   - The V1 primitive model and 10-archetype set are curriculum-
//     locked. Adding/removing an axis or archetype is a curriculum
//     decision, not an engineering decision.

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
  /** Stable axis id. Persists in `primitiveSelections` keys. */
  id: string
  label: string
  /** Question shown to the student. Phrased like a real question, not
   *  a field label, because the V1 audience is Renaissance students. */
  studentPrompt: string
  inputType: PrimitiveAxisInputType
  required?: boolean
  /** Required for `single-select` / `multi-select` and the
   *  `confidence` 3-option meta input. Ignored for text / number. */
  options?: PrimitiveAxisOption[]
  /** Coaching line that warns curriculum + UI authors what bias to
   *  avoid when authoring or rendering this axis. */
  biasGuardrail?: string
  /** When set, this axis is shown only after the gating axis has the
   *  named option selected. The classifier still scores the axis
   *  whenever a value is provided; the UI uses this to hide the axis
   *  until the gating selection is made. V1 use: `tight-budget-detail`
   *  is conditional on `spending-capacity = tight`. */
  conditionalOn?: {
    axisId: string
    valueId: string
  }
  /** For multi-select axes only. Minimum number of selections required.
   *  Defaults to 0. */
  minSelections?: number
  /** For multi-select axes only. Maximum number of selections allowed.
   *  No cap when undefined. V1 use: `shopping-media-behavior` is
   *  capped at 3 to force prioritization. */
  maxSelections?: number
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
   *  BrandContext to be passed into the prompt. */
  brandContextRequired: boolean
  /** When true, the AI feedback layer needs the active ProgramContext
   *  (audience tone, forbidden terms). */
  programContextRequired: boolean
  /** The PRIMITIVES axis set the student composes from. */
  axes: PrimitiveAxisConfig[]
  /** Layer 2 lifecycle. `'ready'` once the deterministic classifier
   *  is wired and tested. */
  classifierStatus: 'not_started' | 'stubbed' | 'ready'
  /** Layer 3 lifecycle. `'shell_only'` while the endpoint shell exists
   *  but no provider call is wired. */
  aiFeedbackStatus: 'not_started' | 'shell_only' | 'ready'
}

/**
 * Optional per-section opt-in shape (NOT consumed by the workspace
 * render tree in V1). When a TemplateStudio section eventually wants
 * to declare which engine variant should replace its chip-pick
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
 * Layer 2 result shape. Hand-off boundary between the deterministic
 * classifier and the AI feedback layer. Existing fields are preserved
 * unchanged so the section-articulation-feedback endpoint validator
 * continues to accept this shape; the additional V1 fields are all
 * OPTIONAL so existing callers do not break.
 */
export interface SectionClassifierOutput {
  status: 'not_available' | 'stub' | 'ready'
  primaryArchetypeId?: string
  /** Legacy / generic field. Customer Profile Builder uses
   *  `secondaryArchetypeId` for its single-secondary V1 contract. */
  overlapArchetypeIds?: string[]
  explanation?: string
  confidence?: 'low' | 'medium' | 'high'
  /** V1 Customer Profile Builder additive fields. All optional so
   *  existing consumers (the AI feedback endpoint shell) still type-
   *  check unchanged. */
  secondaryArchetypeId?: string
  /** True when the secondary archetype is the Cause-First overlay
   *  layered on top of a geo / demo primary. False otherwise. */
  secondaryIsOverlay?: boolean
  /** Plain-language sentence describing why the final confidence
   *  came out at its current band — names which input (archetype-
   *  derived vs evidence-derived) floored the result. */
  confidenceWhyItIsThisLevel?: string
  /** 2–3 short bullet strings, plain language, for the student-facing
   *  explanation. No numeric scores. */
  topContributingSignals?: string[]
  /** 0–2 short bullet strings describing signals that pull away from
   *  the primary match. */
  contradictingSignals?: string[]
  /** One concrete next step the student can take to raise confidence
   *  or resolve a close-runner-up tie. */
  whatToTestNext?: string
  /** When `status === 'not_available'`, the top closest archetype IDs
   *  ranked by score. Empty otherwise. */
  closestArchetypeIds?: string[]
  /** Internal debug payload. Never exposed to students. The classifier
   *  populates this for tests and curriculum-lead calibration only. */
  teacherDebug?: ClassifierTeacherDebug
}

/**
 * Internal debug payload. Numeric scores live here, not in any
 * student-facing field. Tests and calibration tools may inspect this;
 * the UI must not render it.
 */
export interface ClassifierTeacherDebug {
  /** Per-archetype normalized score (0–100) after caps and negative-
   *  signal subtractions. */
  scores: Record<string, number>
  /** Per-archetype margin to the next-highest archetype. */
  marginsToRunnerUp: Record<string, number>
  /** Archetype-derived confidence band before evidence-derived flooring. */
  archetypeDerivedConfidence: 'low' | 'medium' | 'high'
  /** Evidence-derived confidence band from the meta question. */
  evidenceDerivedConfidence: 'low' | 'medium' | 'high'
  /** Which confidence band ultimately floored the final result.
   *  `'archetype'` when archetype-derived was lower; `'evidence'`
   *  when evidence-derived was lower; `'tie'` when both equal. */
  flooredBy: 'archetype' | 'evidence' | 'tie'
  /** Confidence floor that capped the final result, if any. */
  appliedFloor?: 'rural-fixed-income' | 'multigenerational-urban' | 'cause-first'
  /** True when the Cause-First hard prerequisite blocked CFS from
   *  consideration. */
  causeFirstPrerequisiteFailed: boolean
  /** Number of `other` write-in selections present in the input. */
  writeInCount: number
}

/* -------------------------------------------------------------------
 * Customer Profile Builder V1 — primitive selection input + flags
 * ------------------------------------------------------------------ */

/**
 * Stable archetype id literal union. Mirrors the working-name set
 * approved in the v0.1 data pack. Adding/removing an archetype is a
 * curriculum decision; this union is the single source of truth.
 */
export type CustomerProfileArchetypeId =
  | 'rising-city-renters'
  | 'value-driven-family-households'
  | 'settled-suburban-households'
  | 'established-affluent-households'
  | 'practical-small-town-households'
  | 'legacy-stage-affluent-households'
  | 'rural-fixed-income-households'
  | 'multigenerational-urban-households'
  | 'digital-first-premium-buyers'
  | 'cause-first-supporters'

/**
 * Input shape the classifier accepts. Every required axis must be
 * present; conditional and optional axes may be omitted. Multi-select
 * axes are arrays of stable option ids. Purchase motivation accepts a
 * primary plus optional secondary.
 *
 * Option ids are stored as plain strings so the classifier remains
 * forgiving of curriculum-side edits to option labels; option-id
 * existence is validated against the signal map at runtime.
 */
export interface CustomerProfilePrimitiveSelections {
  'life-stage': string
  'household-composition': string
  urbanicity: string
  'spending-capacity': string
  /** Required only when `spending-capacity` === 'tight'. */
  'tight-budget-detail'?: string
  'housing-context': string
  'education-occupation': string
  /** 1–3 picks. */
  'shopping-media-behavior': string[]
  'purchase-motivation': {
    primary: string
    secondary?: string
  }
  'evidence-confidence': 'low-assumption' | 'medium-some-evidence' | 'high-strong-evidence'
}

/**
 * Optional teacher / curriculum-managed flags that affect confidence
 * floors. V1 has no UI for setting these; they are an authoring-side
 * input the classifier accepts for the three high-false-positive-risk
 * archetypes.
 */
export interface DocumentedEvidenceFlags {
  evidenceFromRuralRespondents?: boolean
  evidenceFromMultigenerationalHousehold?: boolean
  evidenceAboutCauseMotivation?: boolean
}

/**
 * Customer-Profile-specific classifier output. Strictly typed superset
 * of `SectionClassifierOutput`: `primaryArchetypeId` and
 * `secondaryArchetypeId` are typed as the archetype id union when
 * present, and the V1 explanation fields are required (not optional).
 *
 * The classifier function returns this shape; the section-articulation-
 * feedback endpoint shell can still accept it because it structurally
 * satisfies `SectionClassifierOutput`.
 */
export interface CustomerProfileClassifierOutput extends SectionClassifierOutput {
  primaryArchetypeId?: CustomerProfileArchetypeId
  secondaryArchetypeId?: CustomerProfileArchetypeId
  closestArchetypeIds?: CustomerProfileArchetypeId[]
  topContributingSignals: string[]
  contradictingSignals: string[]
}

/**
 * Layer 2 classifier output — closed enum on the existing
 * `status` field. V1 uses `'ready'` for a confident classification
 * and `'not_available'` for the no-confident-fit path.
 */
export type ClassifierStatus = SectionClassifierOutput['status']
