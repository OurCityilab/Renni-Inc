# Financial Literacy Platform Roadmap — "Money in Real Life"

Durable product roadmap for growing the Studio Financial Literacy Lab from
five short modules into a 5–10 hour student pathway. This is the source of
truth for phasing, scope, and guardrails. Keep it updated as slices ship.

Status at time of writing: Phase 1 (pathway shell) in progress on branch
`staging`, baseline commit `1993fa2`. The Simulation Week curriculum is
already live on `renni-cc-staging`.

---

## 1. Current state summary

The Financial Literacy Lab is five working in-app modules — deterministic
calculators plus structured reflection, no AI required. A student can finish
each module in 15–20 minutes, so the full set is well under two hours. The
"Money in Real Life" Simulation Week wraps these five modules as classroom
checkpoints inside case-driven days, but the app itself is still a thin
lesson set, not a self-guided 5–10 hour pathway. Drafts persist to Firestore
with no schema or rules changes; two modules also emit deduped Portfolio
artifacts. There is no progress tracking.

## 2. Current file map

| Role | Path |
|---|---|
| Module registry + composers | `app/data/studio/financialLiteracyLab.ts` |
| Simulation week data | `app/data/studio/simulationWeekFinancialLiteracy.ts` |
| Pathway shell data (Phase 1, new) | `app/data/studio/financialLiteracyPathway.ts` |
| Draft save composable | `app/composables/useFinancialLiteracyDraft.ts` |
| Portfolio artifact composable (dedup) | `app/composables/usePortfolioArtifact.ts` |
| Worksheet response composable (Firestore) | `app/composables/useWorksheetResponse.ts` |
| Calculators | `app/utils/studio/calculators.ts` |
| Landing page | `app/pages/studio/lab/financial-literacy/index.vue` |
| Module 1 page | `app/pages/studio/lab/financial-literacy/take-home-pay.vue` |
| Module 2 page | `app/pages/studio/lab/financial-literacy/budget-builder.vue` |
| Module 3 page | `app/pages/studio/lab/financial-literacy/credit-debt.vue` |
| Module 4 page | `app/pages/studio/lab/financial-literacy/renting-homeownership.vue` |
| Module 5 page | `app/pages/studio/lab/financial-literacy/money-plan.vue` |
| Tests | `app/__tests__/studio/financialLiteracy.test.ts` |
| Printable: case packet | `public/studio/curriculum/financial-literacy-case-packet.md` |
| Printable: field trip guide | `public/studio/curriculum/financial-literacy-field-trip-guide.md` |
| Curriculum docs | `docs/studio/financial-literacy-*.md` |

## 3. Current module map

Five modules, numbered 1–5 in `financialLiteracyModules`. Routes follow the
strict pattern `/studio/lab/financial-literacy/<slug>`.

| # | Slug | Title | Est. min |
|---|---|---|---|
| 1 | `take-home-pay` | Take-Home Pay | 15 |
| 2 | `budget-builder` | Budget Builder | 20 |
| 3 | `credit-debt` | Credit & Debt | 20 |
| 4 | `renting-homeownership` | Renting & Ownership | 20 |
| 5 | `money-plan` | My Money Plan | 15 |

Lookup is `getFinancialLiteracyModule(slug)`. The constant
`FINANCIAL_LITERACY_DRAFT_PREFIX = 'financial-literacy-'` namespaces draft
records and is pinned by tests.

## 4. Current save / artifact behavior

Two-layer save, consistently applied:

1. **Draft inputs (all five modules)** — `useFinancialLiteracyDraft(slug,
   answers)` wraps `useWorksheetResponse`, writing to the Firestore
   `worksheetResponses` collection keyed by `(studentUid,
   'financial-literacy-<slug>')`. Upsert via a stored `draftId`; re-hydrates
   on mount. No Firestore rule changes are needed for new slugs.
2. **Portfolio artifact (modules 2 and 5 only)** — `usePortfolioArtifact()
   .createOrUpdateDraft(...)` pushes a composed text artifact into the
   `portfolioArtifacts` collection, deduped by `(artifactType, title,
   coachStatus === 'draft')`. Once a coach moves the artifact off `draft`, a
   fresh one is created to preserve the audit trail.

Composers (`composeMoneyPlan`, `composeBudgetPlan`) build artifacts from ONLY
the student's own words; blank sections become bracketed prompts, never
invented content or numbers.

## 5. Current test coverage

`app/__tests__/studio/financialLiteracy.test.ts`, run via
`npm run test:studio-financial-literacy` (plain `tsx` + `node:assert/strict`,
no vitest). Part of the `check:release` chain. It pins:

- Registry integrity: exactly five modules, numbered in order, unique slugs,
  route pattern, non-empty copy, realistic time range, lookup behavior, and
  the draft-prefix contract.
- Page files exist on disk for `index.vue` and every module slug.
- Link wiring: The Lab index, the Financial Literacy index (imports the
  registry, not hardcoded routes), and the Today page missions.
- Composer correctness: student-only content, bracketed prompts for blanks,
  no invented numbers, and the `hasAny*` gate functions.
- Simulation Week: four ordered days, resolvable module slugs, Day 4 ends on
  the Money Plan, required copy, printable assets exist, landing page renders
  the section and keeps module cards + case-first copy.

## 6. Current completion-time estimate

Five modules at 15–20 minutes each ≈ **90 minutes** of app time. Simulation
Week adds classroom case time, but the self-guided app experience is short.

## 7. Gap to the 5-hour minimum

To reach a ~5-hour core path we need roughly 3.5 more hours of substance:
four new modules (Money Story, Banking/Cash Flow, Saving/Emergency,
Work/Career) plus deeper scenarios, event cards, and revision prompts inside
the existing five. See the pathway table in Section 10 for target per-module
core-path minutes summing to ~5 hours.

## 8. Gap to the 8–10-hour ideal

The full path adds, on top of the core: richer multi-round cases, a capstone
presentation builder, per-artifact revision cycles, and AI plan review. Full
per-module estimates roughly double the core minutes, reaching **8–10+
hours** for the complete path.

## 9. Target "Money in Real Life" platform vision

Every module should feel like: *"I am making real decisions about my money,
seeing the consequences, revising my choices, and leaving with a plan I can
actually use."* The guiding principle: **the cases carry the learning; the
platform captures, coaches, and saves the work.** Each module should carry a
real-life situation, a money decision, a calculator/planning tool, a surprise
event, a revision, a reflection, a saved portfolio artifact, and a next step.

## 10. Target 9-module pathway

| Step | Module | Big question | Live now? | Existing slug |
|---|---|---|---|---|
| 1 | Money Story & Goals | What do I believe about money, and what am I trying to change? | Upcoming | — |
| 2 | Earning Money & Reading a Paycheck | How much of my check is actually mine to plan with? | Live | `take-home-pay` |
| 3 | Banking, Cash Flow & Money Safety | Where should my money go when I get paid? | Upcoming | — |
| 4 | Budgeting Under Pressure | What do I protect first when I cannot afford everything? | Live | `budget-builder` |
| 5 | Saving, Emergencies & Big Goals | How do I prepare for what I know is coming and what I don't? | Upcoming | — |
| 6 | Credit, Debt & Buy Now Pay Later | When does borrowing help me, and when does it trap me? | Live | `credit-debt` |
| 7 | Transportation, Housing & Independence | What does independence really cost? | Live | `renting-homeownership` |
| 8 | Work, Taxes, Benefits & Career Money | How do jobs, benefits, taxes, and career choices affect my money? | Upcoming | — |
| 9 | Final 12-Month Money Plan Capstone | What is my realistic money plan for the next year? | Live | `money-plan` |

Five steps are live today (mapped to the existing registry); four are
upcoming and intentionally unlinked until their pages exist.

## 11. Target artifacts

Each pathway step produces one saved Portfolio artifact:

1. My Money Starting Point
2. My First Check Plan
3. My Banking & Cash Flow Setup
4. My Budget Plan
5. My Savings & Emergency Plan
6. My Credit Rulebook
7. My Independence Readiness Plan
8. My Work & Income Strategy
9. My 12-Month Money Plan

## 12. Recommended phases

- **Phase 1 — Pathway shell (this slice):** Make the landing page present the
  full 9-step "Money in Real Life" pathway with core/full time framing,
  live/upcoming status, per-step artifacts, and capstone framing. No new
  module pages; no calculator changes.
- **Phase 2 — Missing low-risk modules:** Add Money Story & Goals, Banking &
  Cash Flow, Saving & Emergencies, Work & Career as decision/reflection pages
  reusing `useFinancialLiteracyDraft`. No Firestore rule changes.
- **Phase 3 — Deepen existing modules:** Add scenarios, event cards, revision
  prompts, and stronger reflections to the five live modules without
  rewriting calculator logic.
- **Phase 4 — Progress & capstone:** Add module completion states (can be
  inferred from `worksheetResponses`), an artifact checklist, capstone
  readiness, and a final plan/presentation builder.
- **Phase 5 — AI plan review:** Add AI review of written artifacts, following
  the Evidence Interviewer Lite model (ask for missing detail, flag
  unrealistic assumptions, preserve student voice, never invent numbers,
  never present as professional financial advice).

## 13. Do-not-touch list

- Production project and any production deploy.
- `apphosting.yaml`, secrets, environment config.
- `firestore.rules` — existing rules already permit `worksheetResponses`
  writes for any slug.
- Auth, roster, and provisioning logic / stores / seed scripts.
- Financial Literacy calculators (`app/utils/studio/calculators.ts`) and the
  five existing module pages' calculator logic.
- The `usePortfolioArtifact` `coachStatus` dedup guard (audit-trail contract).
- The existing five Financial Literacy routes and registry invariants.

## 14. First safe implementation slice

Phase 1 pathway shell, delivered as:

- A new isolated data file `app/data/studio/financialLiteracyPathway.ts`
  holding the 9-step pathway (title, core/full time copy, per-step big
  question, artifact, estimated minutes, live/upcoming status, and the
  existing registry slug for live steps).
- Landing-page (`index.vue`) additions that render the pathway section while
  keeping the existing five module cards and the Simulation Week section
  untouched.
- New tests locking the pathway shape and copy.

New modules (Phase 2) should reuse `useFinancialLiteracyDraft` (existing
collection, no rule changes) and add `usePortfolioArtifact` only where a
composed artifact belongs.

## 15. Risks and rollback notes

- **Risk:** editing the shared landing page could disturb the five module
  cards or the Simulation Week block. **Mitigation:** additive changes only;
  tests assert both still render.
- **Risk:** upcoming steps could link to non-existent routes. **Mitigation:**
  upcoming steps carry no route/slug and render as "coming next"; a test
  asserts upcoming steps are unlinked and live steps resolve to real routes.
- **Risk:** registry drift. **Mitigation:** the pathway file references the
  registry by slug for live steps; a test asserts every live slug resolves.
- **Rollback:** Phase 1 is confined to one new data file, additive edits to
  `index.vue`, and new tests. Revert the commit `feat(studio): add financial
  literacy pathway shell` to fully restore the prior landing page. No data,
  rules, or deploy state is affected.
