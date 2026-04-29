# Section Engine Expansion Plan

The Section Engine pattern is a recurring three-layer scaffold for student
writing surfaces:

1. **Primitives** — students compose an artifact from a small, opinionated
   set of axes.
2. **Classifier** — a pure deterministic function explains what they built.
3. **AI feedback** — directional critique on the articulation, never
   inventing facts.

This doc tracks which engines are active, what comes next, and why.

> Forward-looking — informational only. Do NOT use this doc to activate a
> new engine variant; activation requires a separate sprint with curriculum
> review, signal-map authoring, classifier tests, UI scoping, and a feature
> flag.

---

## Currently active

### Customer Profile Builder

- **Status:** Beta, feature-flagged ON in production via
  `NUXT_CUSTOMER_PROFILE_BUILDER_ENABLED`.
- **Section:** BMC `customer-segments` (mounts below the existing
  ChipPickQuickStart; chip-pick is preserved).
- **Layer 1 (primitives):** 10-axis V1 primitive model (life-stage,
  household-composition, urbanicity, spending-capacity, conditional
  tight-budget-detail, housing-context, education-occupation,
  shopping-media-behavior, purchase-motivation, evidence-confidence).
- **Layer 2 (classifier):** `app/utils/customerProfileClassifier.ts` —
  pure deterministic function. 10 nationally-balanced PRIZM-inspired /
  ESRI-inspired archetypes. Cause-First overlay tightened to require
  motivation + corroboration. 16 fixture tests.
- **Layer 3 (AI feedback):** Shell only. The
  `/api/ai/section-articulation-feedback` endpoint exists with
  feature-flag gate (`NUXT_SECTION_ENGINE_FEEDBACK_ENABLED`, default
  OFF) but does not call a provider in V1.
- **Profiles per section:** Up to three (Primary / Secondary /
  Tertiary). All three slots are local component state. No Firestore
  persistence in V1.

---

## Next recommended engine

### Value Proposition Fit Engine

The next engine should target **BMC Value Propositions** (the section
immediately downstream of Customer Segments). Three reasons it is the
right next pick:

1. **It depends directly on Customer Segments.** Students who have
   composed a customer profile are ready to articulate WHAT they are
   promising that customer. The hand-off from Customer Profile to
   Value Proposition is the single tightest cross-section dependency
   in the BMC.
2. **It helps students connect customer needs to product features.**
   Value propositions in V1 are largely free-text and tend to drift
   into slogan language. A primitive scaffold forces the student to
   name the customer's job, the pain or gain, the offer, and the
   proof — concrete decisions instead of marketing copy.
3. **It reduces text-heavy BMC work.** BMC Value Propositions is one
   of the longest free-text sections in the playbook today. A
   primitives-first scaffold paired with a deterministic fit-check
   compresses the writing surface and lets students iterate faster.

> Authoring status: **planned** / **not_started**. Do not render
> student-facing UI yet.

#### Possible primitives (outline only — DO NOT activate)

| # | Primitive id | Notes |
|---|---|---|
| 1 | `selected-customer-profile` | Reference to a profile composed by the Customer Profile Builder. Not a free-text axis; the student picks one of their own analyzed Primary / Secondary / Tertiary profiles. |
| 2 | `customer-job` | The job the customer is trying to get done in this category. Single-select from a curated list, with "Other (write-in)" fallback. |
| 3 | `customer-pain` | The pain or friction the customer wants to remove. Single-select. |
| 4 | `customer-gain` | The desired gain or upside the customer wants. Single-select. |
| 5 | `our-offer` | Which Renni-brand product or sub-offer is being proposed to the customer. Single-select from House Phoenix / Lumen / Notice / Humble Oven / donations. |
| 6 | `proof-or-evidence` | Concrete proof tied to the offer (a sample, a price test, a customer quote, a comparable product). |
| 7 | `evidence-confidence` | Meta-question. Same low / medium / high model as the Customer Profile Builder. |

#### Possible classifier output (outline only — DO NOT activate)

A deterministic function would consume the seven primitives above
plus the linked customer profile's archetype and produce:

- **Value proposition statement** — composed plain-language sentence
  built from the picks.
- **Strongest fit** — which primitive(s) most clearly back the
  proposition (e.g., "the proof you offered is the strongest part of
  this fit").
- **Weakest evidence** — which primitive most needs more support
  (e.g., "no comparable-product check yet").
- **What to test next** — one concrete next step.
- **Draft starter** — a non-polished sentence frame for the Working
  Draft, in the same posture as the Customer Profile Builder
  (clipboard-only, never auto-write).

#### Curriculum-side prerequisites before sprint

Before a Value Proposition Fit Engine implementation sprint can be
scoped:

- Curriculum lead authors the primitive option lists (jobs, pains,
  gains).
- Curriculum lead decides whether the engine should support multiple
  value props per section (e.g., one per archetype) or one per
  section.
- Curriculum lead authors the deterministic "fit" rules — what makes
  a proposition coherent vs incoherent against an archetype.
- Confirm the cross-section dependency story (Customer Profile →
  Value Proposition) for student UX: do we link the profile picker
  to whatever the team analyzed in Customer Segments, or is the
  picker ad-hoc?

---

## Future engines (roadmap, not committed)

These are reasonable future engines that fit the Section Engine
pattern. None are scheduled. Each would need its own curriculum
review and sprint.

| Engine | Section it would target | Why it fits the pattern |
|---|---|---|
| **Channels Fit Engine** | BMC Channels | Channel choice is structured: where the customer already is, what the channel actually delivers, and whether the offer matches the channel's strengths. Primitives map cleanly to a fit check. |
| **Revenue Logic Engine** | Finance and Revenue Model | Revenue scenarios decompose into traffic / conversion / price / mix. A scaffold here helps students name the assumptions instead of skipping straight to a target number. |
| **Brand Message Engine** | Marketing and Campaign Playbook | Message construction follows audience → promise → proof → call to action. Primitive-first scaffold prevents slogan-only outputs. |
| **Evidence Check Engine** | Cross-cutting | Could overlay every section to surface "your strongest claim has weakest evidence." Different posture from the others (no archetype set). Worth scoping carefully — could become noise. |

---

## Engine activation checklist (general)

Whenever a future engine moves from "planned" to "active":

1. Curriculum-lead-authored primitive option lists land in
   `app/data/...`.
2. Deterministic classifier function in `app/utils/...` with at
   least 6 fixture tests.
3. New `SectionEngineVariantConfig` registered in
   `app/config/sectionEngineVariants.ts` with `classifierStatus:
   'ready'` and `aiFeedbackStatus: 'shell_only'`.
4. New Vue component in `app/components/`, mounted from
   `DeliverableOutputWorkspace.vue` only when (a) the matching
   feature flag is on AND (b) the active section id matches.
5. Stereotype guardrail and any required disclaimers visible above
   the form.
6. Numeric scores never visible to students; teacher debug gated by
   `auth.isChief`.
7. No Firestore writes from the classifier or component.
8. Existing chip-pick QuickStart, save behavior, soft locking,
   submit gate, approval workflow remain unchanged.
9. Build-time feature flag added to `apphosting.yaml` only after
   smoke tests pass.

The Customer Profile Builder is the reference implementation.
