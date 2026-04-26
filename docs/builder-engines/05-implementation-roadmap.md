# Builder Engine Implementation Roadmap

This roadmap keeps the builder family lean. Each phase should ship a small, reviewable step that preserves existing gates, readiness, statuses, and student-authored source notes.

## Recommended Sequence

1. Market Fit Builder V1
2. Revenue scenario connection
3. Product Positioning Intelligence and Source Coach
4. Brand Fit Builder V1
5. Builder interconnection refinement
6. Decision Memo Builder
7. Broader AI critique refinement

## Phase 1: Market Fit Builder V1

Build:

- Section-scoped Market Fit Builder.
- Opt-in Template Studio metadata.
- Segment comparison inputs.
- Product facts inputs.
- Comparable product notes.
- Evidence strength notes.
- Tradeoff summary.
- Playbook-ready support summary.

Do not build:

- External data import.
- Automatic final text writing.
- New submit gate.
- New approval gate.
- Payment or checkout behavior.
- Broad dashboard.

Dependencies:

- Current Deliverable Output Workspace save pattern.
- Structured Evidence Standard.
- Existing Market Builder scenario entries.
- Template Studio section metadata.

Definition of done:

- Builder appears only in intended sections.
- Entries persist without overwriting sibling section data.
- Empty old documents still render.
- Builder outputs are optional.
- Submit and Playbook readiness are unchanged.

Manual smoke checks:

- Add, edit, clear, and remove an entry.
- Refresh and confirm persistence.
- Confirm disabled sections do not show the builder.
- Confirm final preview remains student-authored.

## Phase 2: Revenue Scenario Connection

Build:

- Read-only connection from Market Fit Builder outputs into Ch. 8 revenue reasoning.
- Compact reference panel that helps finance reason from market assumptions.
- No copy, migration, autofill, or write-back.

Do not build:

- Automatic revenue assumptions.
- Automatic inventory recommendation.
- Automatic final text.
- New approval or submit logic.

Dependencies:

- Market Fit Builder V1 entries.
- Existing Ch. 7 to Ch. 8 reference pattern.

Definition of done:

- Ch. 8 can read Ch. 7 market-fit entries.
- Viewing Ch. 8 does not write to Ch. 7 or Ch. 8.
- Empty state is clear.
- Listener cleanup follows existing composable patterns.

## Phase 3: Product Positioning Intelligence And Source Coach

Build:

- Product scan guidance inside Market Fit refinement.
- Comp alignment notes that explain whether a comp is useful for category, price, quality, story, customer, channel, style, or local-made signals.
- Customer profile naming support.
- Source Coach prompts for surveys, interviews, public data, comparable products, retail observation, stakeholder feedback, pop-up feedback, and preorder tests.
- Affordability vs demand warnings.
- "Worn by" vs "targeted by" warnings.

Do not build:

- Paid data integration.
- Automatic external data import.
- Automatic market-size claims.
- Automatic final text.
- Any change to submit or readiness logic.

Dependencies:

- Market Fit Builder V1.
- Revenue scenario connection.
- Structured Evidence Standard.
- Current no-write critique posture.

Definition of done:

- Students can identify what kind of product they have and what evidence they still need.
- Comparable products are labeled by usefulness, not treated as proof.
- Customer profiles remain student-friendly and evidence-bound.
- Source prompts help students gather better data without inventing it.

Manual smoke checks:

- Add a premium apparel product and confirm the guidance points beyond basic school merch.
- Add a weak comp and confirm the guidance asks for a better-aligned comp.
- Confirm no output is required for submit or Playbook readiness.

## Phase 4: Brand Fit Builder V1

Build:

- Section-scoped Brand Fit Builder.
- Brand intent inputs.
- Visual signal inputs.
- Audience perception check.
- Production and accessibility checks.
- Reference brand board notes.
- Validation plan.
- Reference-brand perception analysis that uses Product Positioning Intelligence rather than raw style preference.

Do not build:

- Logo generation.
- File upload.
- Design asset storage.
- Automatic brand decision.
- Automatic final text.

Dependencies:

- Template Studio metadata.
- Existing Output Workspace save pattern.
- Structured Evidence Standard.
- Market Fit Builder outputs if available.
- Product Positioning Intelligence profile and comp guidance.

Definition of done:

- Builder appears only in intended Ch. 5, Ch. 6, and Ch. 10 sections.
- Students can describe signals, tradeoffs, evidence, and validation steps.
- Output supports Playbook writing without replacing it.

## Phase 5: Builder Interconnection Refinement

Build:

- Read-only reference panels between Market Fit and Brand Fit where useful.
- Shared helper text for price, quality, brand signal, market, and channel fit.
- Shared Product Positioning Intelligence summaries where they reduce duplicate student work.
- Compact summaries that reduce duplicate student work.

Do not build:

- Hidden automatic decisions.
- Cross-document writes.
- Broad builder registry unless the component logic becomes hard to maintain.

Dependencies:

- Stable Market Fit and Brand Fit entries.
- Stable product scan, comp, and profile patterns.
- Confirmed section IDs.
- Manual milestone feedback.

Definition of done:

- Students can see how market and brand choices affect each other.
- No builder requires another builder to submit work.
- Existing data remains valid.

## Phase 6: Decision Memo Builder

Build:

- Decision framing.
- Options considered.
- Evidence for each option.
- Tradeoffs.
- Recommendation.
- Owner and next action.

Do not build:

- Automatic executive decisions.
- Approval replacement.
- Hidden AI decisioning.

Dependencies:

- Stable evidence, market, brand, and revenue reasoning.
- Clear instructor review expectations.

Definition of done:

- Students can explain why a decision was made.
- The memo links to evidence.
- Chiefs and instructor remain final reviewers.

## Phase 7: Broader AI Critique Refinement

Build:

- Carefully scoped critique for additional builder outputs.
- Prompt updates that reference new builder data.
- Critique of product specs, comp quality, customer profiles, source gaps, and positioning claims.
- Clear student-facing safety copy.

Do not build:

- Background critique.
- Critique on every keystroke.
- Stored critique history without rules review.
- Any model-based approval or submission.

Dependencies:

- Stable builder data shapes.
- Provider monitoring.
- Manual testing feedback.

Definition of done:

- Critique remains temporary and no-write.
- It reviews only student-authored evidence and builder entries.
- It does not affect gates, readiness, statuses, or approval.

## Task Map

| Phase | Owner | Due date | Dependency | Definition of done | Playbook chapter |
| --- | --- | --- | --- | --- | --- |
| Market Fit Builder V1 | Strategy and Growth with CFO/CMO support | TBD before next milestone | Current Market Builder and Structured Evidence | Segment comparison saves safely and remains optional | Ch. 7, Ch. 10, Ch. 11 |
| Revenue scenario connection | CFO with Strategy and Growth support | TBD after Market Fit V1 | Market Fit entries | Ch. 8 reads market-fit context without writing back | Ch. 8 |
| Product Positioning Intelligence and Source Coach | Strategy and Growth with CMO/CFO support | TBD before Brand Fit V1 | Market Fit V1 and revenue reference | Product scan, comp alignment, customer profiles, and source prompts are evidence-bound | Ch. 7, Ch. 8, Ch. 10, Ch. 11, Ch. 12 |
| Brand Fit Builder V1 | CMO with Strategy and Growth support | TBD after positioning layer | Template Studio opt-in sections and product positioning guidance | Brand signals, tradeoffs, and validation plan save safely | Ch. 5, Ch. 6, Ch. 10 |
| Builder interconnection refinement | Strategy and Growth with Co-CEO review | TBD after both builders stabilize | Market Fit, positioning, and Brand Fit entries | Read-only connections clarify tradeoffs without creating gates | Ch. 7, Ch. 8, Ch. 10, Ch. 11 |
| Decision Memo Builder | Co-CEOs with department support | TBD later | Stable builder evidence patterns | Decisions show options, evidence, tradeoffs, and next action | Ch. 13 |
| Broader AI critique refinement | Instructor/Admin with chiefs | TBD after manual testing | Stable prompts and provider monitoring | Critique remains temporary, no-write, and evidence-bound | Relevant chapters |

## Guardrail Checks For Every Phase

Run or review:

- Build passes.
- Studio alignment audit passes.
- Submit gate remains requirement-task coverage only.
- Playbook readiness remains final text only.
- No Firestore rules change unless explicitly planned.
- No automatic final text write.
- No payment, checkout, refund, tax, or inventory-decrement behavior.
- No file upload, external drive integration, or new dashboard unless explicitly scoped.
