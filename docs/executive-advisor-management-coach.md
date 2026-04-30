# Executive Advisor V2 — management coach upgrade

V1 of the Executive Advisor shipped four read-only modes
(`daily-command-brief` · `whats-next` · `run-the-meeting` ·
`assign-the-work`) tuned for senior leaders observing work state.

V2 layers eight management-coach modes on top, designed to
**handhold student chiefs** through final-week execution. The V1
modes are preserved unchanged; V2 modes register alongside in the
same prompt-template registry and share auth, rate limits, safety
scan, and invocation logging.

## Posture

- **The Advisor prepares; chiefs decide.** Every action card
  carries `humanReviewRequired: true`. The UI surfaces this on
  every card and the panel header.
- **No auto-mutation.** No auto-approval. No auto-submit. No
  hidden task creation. No status changes. No Working-Draft
  writes. No deliverable-status writes.
- **No invented facts.** When context cannot ground a claim, the
  model marks it under `unknowns` and the validator passes that
  array straight through to the chief.
- **Read-only beyond invocation metadata.** The endpoint's only
  Firestore write is the existing `aiAdvisorInvocations` audit row
  (Admin SDK; client read/write denied by Firestore rules).

## Modes (V2)

| mode | prompt phrase | when to use |
|---|---|---|
| `daily-chief-brief` | "What should I push on today?" | top of the day |
| `run-the-room` | "I have 45 minutes of class. How should I use it?" | before a class block |
| `section-rescue` | "This section is weak. What do I tell the team?" | a draft is weak |
| `task-coverage-doctor` | "Are we missing tasks?" | check P0 coverage |
| `approval-coach` | "Should I approve this?" | before approving |
| `dependency-explainer` | "Why is this blocked?" | work seems stuck |
| `phoenix-nest-pitch-coach` | "Are we ready to pitch Phoenix Nest?" | pre-pitch readiness |
| `final-week-triage` | "What can we realistically finish this week?" | final-week scope |

## Files

- `app/types/executiveAdvisor.ts` — `AdvisorMode`, `AdvisorActionCard`,
  `AdvisorModeResult`, `AdvisorModeMeta`, `ADVISOR_MODES`,
  `ADVISOR_MODE_META`, `isAdvisorMode`.
- `server/utils/executiveAdvisorContext.ts` —
  `buildExecutiveAdvisorContextV2()` augments the V1 context with
  the final-week lane map, recommended task templates, derived
  task-coverage gaps, Project Navigator dependency signals,
  per-section dependency hints, and a compact product-catalog
  summary. Explicit `unknowns` array surfaces missing inputs.
- `server/utils/promptTemplates/coachModeShared.ts` —
  shared coach system prompt + per-mode instructions + response
  validator. Forces `humanReviewRequired: true` on every card.
- `server/utils/promptTemplates/index.ts` — registers all eight V2
  modes via `buildCoachModeRegistryStub`. The endpoint constructs
  the request-bound template via `buildCoachModeTemplate(mode, payload)`.
- `server/api/ai/executive-advisor.post.ts` — dispatches V1 modes
  through the V1 path and V2 modes through the V2 coach context +
  coach template. Same auth, rate limit, and safety scan apply.
- `app/components/ExecutiveAdvisorCoachPanel.vue` — chief-facing UI
  on the Project Navigator. Mode chips + optional focus / focusHint
  inputs + result rendering + non-removable disclaimer. Failure
  errors are surfaced inline; the rest of the Navigator keeps
  rendering.

## Action card schema

Every V2 mode emits `cards: AdvisorActionCard[]`. Each card:

```ts
{
  title: string
  priority: 'P0' | 'P1' | 'P2'
  whyItMatters: string
  owner: string
  dueDate: string                 // coarse label, never a calendar date
  dependency: string
  playbookChapter: string
  sectionLink?: string            // when known
  exactNextAction: string
  whatChiefShouldSay: string
  doneSignal: string
  riskIfIgnored: string
  sourceIds: string[]             // empty array = ungrounded
  humanReviewRequired: true       // forced by validator
}
```

`AdvisorModeResult` wraps the cards with `mode`, `templateVersion`,
`headline`, optional mode-specific `extra`, and optional `unknowns`.

## Context shape

`ExecutiveAdvisorContextV2`:

- `base` — V1 `ExecutiveContextPackage` (viewer, summary, deliverables,
  open tasks, recent decisions, source counts).
- `todayIso` — server's current ISO date.
- `finalWeekLanes` — full P0 / P1 / P2 lane map (10 lanes).
- `finalWeekTaskTemplates` — recommended task titles per P0 section.
- `taskCoverageGaps` — derived: which P0 sections have/lack a
  matching real task in the loaded set (substring heuristic).
- `dependencySignals` — Project Navigator signals derived from the
  same deliverables + tasks the V1 builder loaded.
- `sectionDependencyHints` — per-section directional hints.
- `productCatalog` — name + brand + category + isSellableProduct
  flag (no default cost / price values).
- `unknowns` — explicit markers when a derivation could not run.

## What the V2 modes are NOT allowed to do

- Approve a deliverable.
- Submit a deliverable.
- Change task status.
- Change deliverable status.
- Create a task.
- Replace student work.
- Invent facts the context does not contain.
- Mutate Firestore beyond the existing `aiAdvisorInvocations`
  audit row.
- Add POS / payment / checkout / refund / tax /
  inventory-decrement behavior.
- Add Google Drive / OAuth integration.

These constraints are enforced by:
- The shared system prompt (`buildCoachSystemPrompt`).
- The per-mode user-prompt instructions in
  `server/utils/promptTemplates/coachModeShared.ts`.
- The response validator that forces `humanReviewRequired: true`
  on every card.
- The existing `scanForPersonalJudgment` safety scan that runs on
  the validated output and rejects the response on hit.
- The Firestore rules that already deny client writes to
  `aiAdvisorInvocations`.

## Failure modes

- **Feature flag disabled** (`executiveAdvisorEnabled = false` or
  missing API key) → endpoint returns `503 ai_disabled`.
- **Unauthorized caller** (member or unprovisioned account) →
  `403 ai_forbidden`.
- **Rate limit exceeded** (25/day per uid) → `429 ai_rate_limited`.
- **Provider error** → `502 ai_provider_error` with a generic
  message.
- **Malformed model JSON** → `502 ai_invalid_response`.
- **Safety scan hit** → `422 ai_safety_check_failed`. The daily
  quota is **not** decremented on safety hits so the chief can
  retry.

The UI panel surfaces every failure inline; the Project Navigator
continues to render.

## Future opportunities

- A dedicated `/c-suite/advisor` route with the full mode picker
  alongside the panel — V1 has `app/pages/c-suite-advisor.vue`;
  V2 currently lives on `/c-suite/project-navigator`.
- Streaming responses so the chief sees partial cards while the
  model finishes the rest of the JSON.
- Cohort-level audit dashboard reading `aiAdvisorInvocations` so
  instructors can see how chiefs are using the coach.
- Per-mode Firestore-backed tuning (e.g. customizing
  `whatChiefShouldSay` tone per cohort).
