# Customer Profile Builder — Foundation (Pass 1)

This is the **foundation** for the Customer Profile Builder. It is **not** the final builder, the archetype set, or a replacement for the existing Customer Segments QuickStart. It exists so that the eventual builder can plug into the workspace, AI feedback layer, and curriculum context with no scaffolding work left to do.

## The engine pattern

Three layers, applied in order:

1. **Primitives.** Students compose an artifact from a small, opinionated set of axes. The set is curriculum-locked — adding/removing an axis is a curriculum decision, not an engineering one.
2. **Classifier (deterministic).** A pure-function rule set explains what the student built ("this profile most closely matches the Civic Premium Buyer archetype, with overlap on Premium Parent Supporter"). The classifier never invents facts; it reports.
3. **AI feedback (directional only).** AI critiques how the student articulated the result — sharper questions, missing evidence, vague writing — without inventing demographic facts, spending data, customer quotes, or judgments of student character.

The same pattern will eventually back several engine variants: `customer-profile-builder`, `brand-identity-engine`, `value-proposition-engine`, `marketing-message-engine`. Pass 1 only defines the customer-profile-builder shell.

## What exists now (Pass 1)

| Layer | What ships in Pass 1 |
| --- | --- |
| Engine variant types | `app/types/sectionEngines.ts` — `SectionEngineVariantId`, `PrimitiveAxisConfig`, `SectionEngineVariantConfig`, `SectionClassifierOutput`, `SectionEngineVariantBinding` |
| Engine variant config | `app/config/sectionEngineVariants.ts` — only `customer-profile-builder` is registered. Seven approved axes, no archetypes |
| Curriculum context | `app/config/curriculumContext.ts` — chapter list, final outputs, evidence standard, forbidden-claim list |
| Layer 3 endpoint shell | `server/api/ai/section-articulation-feedback.post.ts` — feature-flag gated, validates request shape, returns deterministic safe response |
| Feature flag | `NUXT_SECTION_ENGINE_FEEDBACK_ENABLED` (default OFF) registered in `nuxt.config.ts` |

## What is intentionally NOT built in Pass 1

- The final archetype set (curriculum is not finalized)
- Fake placeholder archetypes visible to students
- Any classifier rules — `classifierStatus: 'not_started'`
- The Customer Profile Builder UI — `aiFeedbackStatus: 'shell_only'`
- Any provider call from the new endpoint — flag-on still returns a deterministic shell response
- A replacement for the Customer Segments QuickStart — the existing chip-pick path is preserved
- Market Builder, Decision Memo Builder, new dashboards, task creation, approval changes, submit-gate changes
- Firestore rule changes

## Seven approved V1 axes

Locked in for `customer-profile-builder` (see `CUSTOMER_PROFILE_BUILDER_VARIANT.axes`):

1. **Life stage** — student, early career, parent of student, established professional, community supporter / alum, retired, other
2. **Spending capacity** — tight, moderate, comfortable, premium (what they can spend on a single House Phoenix item)
3. **Geography / community context** — Detroit resident, metro Detroit, TechTown walk-in, Renaissance family, alumni supporter from afar, visiting, other
4. **Education** — in high school, high school graduate, some college / trade school, college graduate, graduate / professional degree, not known
5. **Shopping behavior** — impulse, researches, asks friends, loyal to brands, supports local, gift-driven (retailers are signals, not labels)
6. **Primary purchase motivation** — civic pride, school support, product quality, gift occasion, price-to-value, belonging, donation motive (single pick — no broad multi-select values dump)
7. **Evidence confidence** — META question after the profile, not a customer trait. Surfaces "How confident are we, and what evidence do we have?"

Cuts already locked: style/identity posture, channel preference, price sensitivity (handled elsewhere or downstream).

## Where archetypes will go later

A future pass will add `app/config/customerProfileArchetypes.ts` and a `app/utils/customerProfileClassifier.ts` deterministic rule set. The classifier will read `primitiveSelections` shaped against the seven axes and return a `SectionClassifierOutput`. The endpoint shell already accepts `classifierOutput` in its request body — the classifier just hasn't been written yet.

## How chip-pick and customer-profile-builder coexist

- The current Customer Segments QuickStart (`section.chipPickQuickStart` on Ch. 4 BMC `customer-segments`) **stays the active student-facing path** in V1.
- `app/config/sectionVariants.ts` (the rendering toggle: `'none' | 'chip-pick'`) is **untouched**.
- `SectionEngineVariantConfig` is a different concept: it identifies an ENGINE FAMILY, not a renderer. A section can have both a `chipPickQuickStart` and an inactive `sectionEngineVariant` binding (`status: 'planned'`) without affecting render.
- When the Customer Profile Builder UI eventually ships, it will mount conditionally on a section's binding status, and chip-pick will remain a fallback for sections that don't opt in.

## Future steps

1. **Archetype curriculum finalized.** Curriculum authors lock the V1 archetype set (likely 4–6 archetypes for House Phoenix).
2. **Deterministic classifier config.** Rules from primitives → archetype + overlaps + confidence. Pure function, no AI. Audit-friendly.
3. **Customer Profile Builder UI.** Renders the seven axes, shows classifier output, surfaces evidence-confidence as a meta-question.
4. **AI articulation feedback enabled.** Flip `aiFeedbackStatus` to `'ready'`, add a `PromptTemplate` to `server/utils/promptTemplates`, replace the deterministic shell response with a real provider call. Same request shape, real response content.
5. **Smoke test with students.** Two-cohort dogfood before relacing chip-pick anywhere.

## Endpoint contract reference

Request (V1):

```
POST /api/ai/section-articulation-feedback
Authorization: Bearer <Firebase ID token>

{
  "mode": "customer-profile-articulation-feedback",
  "variantId": "customer-profile-builder",
  "sectionId": "<string>",
  "primitiveSelections": { "<axisId>": <unknown> },
  "classifierOutput": {                       // optional
    "status": "not_available" | "stub" | "ready",
    "primaryArchetypeId": "<string>",
    "overlapArchetypeIds": ["<string>", ...],
    "explanation": "<string>",
    "confidence": "low" | "medium" | "high"
  },
  "studentDraft": "<string>"                  // required, non-empty
}
```

Response (V1, when feature flag is on):

```
{
  "mode": "customer-profile-articulation-feedback",
  "variantId": "customer-profile-builder",
  "feedbackVersion": "section-articulation-feedback@v0.1-shell",
  "strengths": [ ... ],
  "questionsToAnswer": [ ... ],
  "missingEvidence": [ ... ],
  "clarityIssues": [ ... ],
  "nextValidationSteps": [ ... ],
  "reminder": "AI here is a coach. It does not approve, submit, or change status..."
}
```

When the flag is off, the endpoint returns `503 ai_disabled` BEFORE validation or auth so the call is cheap.

## What remains for the AI integration pass

- Add a `customer-profile-articulation-feedback` `PromptTemplate` under `server/utils/promptTemplates/` that consumes `BrandContext` + `ProgramContext` + `CurriculumContext` to build system + user prompts.
- Wire the template into a registry resolver (mirror the `market-evidence-critique` registry pattern, or create a sibling registry for engine-feedback modes).
- In `section-articulation-feedback.post.ts`, replace `buildShellResponse(validated)` with a provider-backed call following the same posture as `market-evidence-critique.post.ts`: pre-flight payload cap, provider call, JSON parse, schema validate, return verbatim.
- Add `aiCritiqueApiKey` consumption (or a dedicated key) and the per-user daily-limit guard (`aiRateLimit.ts`).
- Add a safety scan on the AI output (mirror `executiveAdvisor/aiSafetyScan`) that rejects responses violating `curriculumContext.forbiddenClaims`.
- Flip `aiFeedbackStatus` from `'shell_only'` to `'ready'` in `sectionEngineVariants.ts` once the above lands.
