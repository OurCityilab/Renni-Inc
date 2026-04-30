# Final Week Completion Mode

The launch-week prioritization layer. Helps a checked-out senior
find what to finish first in under 10 seconds, and gives chiefs a
display-only pushback frame. **No Firestore writes, no AI, no
auto-task creation, no status mutation.** Pair with:

- `docs/launch-morning-student-quick-start.md` (student handbook)
- `docs/launch-morning-priority-flow.md` (group-by-group routes)
- `docs/cross-section-prefill-and-dependency-map.md` (dependency map)
- `docs/bmc-finance-table-cleanup.md` (Ch. 4 table builders)

## P0 / P1 / P2 logic

The lane map lives in `app/utils/finalWeekCompletion.ts`. Each
lane carries 1–6 sections; each section has a priority, owner,
reviewer, dependency, definition-of-done, and first action.

### Priority labels
- **P0** — must finish for the Playbook + pop-up + Phoenix Nest
  pitch to read as complete. Without these, the launch deliverable
  does not hold up to a real reviewer.
- **P1** — strongly recommended for completeness; not strictly
  required for the deliverable to be reviewable.
- **P2** — nice-to-have polish; defer if time-constrained.

### Lanes (in priority order on the panel)
1. **Executive launch summary** — Co-CEOs · Strategy and Growth.
2. **BMC core** — Strategy and Growth.
3. **Brand book core** — CMO.
4. **Product line and pricing** — CFO + Operations.
5. **Finance and revenue model** — CFO.
6. **Operations and continuity** — COO.
7. **Marketing and campaign** — CMO.
8. **Phoenix Nest retail carry pitch** — Strategy and Growth + CMO + CFO.
9. **Strategy and next semester** — Chief Strategy and Growth Officer.
10. **Decision log and handoff** — Co-CEOs.

The P0 set spans every lane. A complete Playbook + pop-up + Phoenix
Nest pitch is achievable by finishing the P0 set even if every P1 /
P2 stays in draft.

## Student workflow

1. Open the home dashboard.
2. Read **Final Week: Finish the work that matters first** (the
   panel mounted above My Next Actions).
3. Pick your lane chip (Co-CEO sees the company-wide view; a
   member can filter to just their team's lane).
4. Read the P0 cards in order. Each card shows:
   - **What you are making** — the artifact (a table, an SOP,
     a 1-page pitch).
   - **Start here** — the very first action.
   - **Done when** — the concrete completion standard.
   - **Owner / Reviewer** — who runs it, who reviews it.
   - **Depends on** — upstream work that makes this easier.
   - **Recommended task title** (collapsed by default) — a
     copy-paste suggestion a chief can paste into the existing
     Tasks form. **The platform never auto-creates tasks.**
5. Click **Open the section →** to deeplink into the section page.
6. Inside the section page: existing recipe panel + builder /
   table / checklist + Working Draft. Standard six-step handoff
   (build → copy → paste → edit → save → ask chief).
7. Add **Defend your claim** structured-evidence entries for major
   figures (the editor sits below Working Draft; the help panel
   now includes a worked example).

## Minimum viable answer rule

Above the lane chips:

> **Stuck? Write the minimum viable answer.**
> 3 clear sentences · 1 source or assumption · 1 risk · 1 next
> step. That clears the bar. You can polish later.

This is the explicit posture for any senior who is checked out
emotionally but still on the hook for a P0 section. Polish is
optional; clearing the bar is not.

## Chief workflow

1. Open `/c-suite/project-navigator`.
2. Read the existing **What needs attention now** priority cards.
3. Read the existing **Dependency signals** panel (blocked /
   ready-for-review / warning / heads-up).
4. Read the new **Final Week Chief Push** panel — four
   reminders:
   - Start with P0.
   - Review blocked / overdue first.
   - Push back on vague work.
   - Approve only when useful to the Playbook, the pop-up, or
     the Phoenix Nest pitch.
5. Read the existing **Launch readiness checks** panel — 10
   click-through items for the launch builders.
6. Use the existing Tasks / Deliverables surfaces to act.

## Task template posture

`app/utils/finalWeekTaskTemplates.ts` exports `FINAL_WEEK_TASK_TEMPLATES`
with one suggested title + owner + reviewer + due-label per P0
section. The student panel renders the matching template under each
section card behind a `<details>` so it is visible only when a chief
explicitly expands it.

**The platform never auto-creates tasks from templates.** Each
template is a copy-paste suggestion — a chief who wants to seed the
tasks pastes the title into the existing Tasks form. This is the
same posture the launch-engine briefs held: no auto-mutation, no
hidden writes.

## Structured evidence example

`DeliverableOutputWorkspace.vue` adds a collapsed "See an example"
panel inside the existing **Defend your claim** new-entry form. The
example uses House Phoenix sweatshirts as the worked claim:

> **Claim:** House Phoenix sweatshirts are likely strongest with
> students and alumni who value school identity.
> **Evidence:** Students already respond to school-linked apparel
> and House Phoenix is the flagship launch brand.
> **Source:** Student observation / customer conversations.
> **Assumption:** Interest will increase if the design and story are
> strong.
> **Confidence:** Medium.
> **Next validation:** Ask 10 students if they would buy at the
> proposed price.

The example is **help text only**. It is not saved into student
work. The "Example only — this is not saved into your work" italic
caption underneath makes the posture explicit.

## What is intentionally not automated

- **No auto-task creation.** The recommended task titles are
  copy-paste suggestions. A chief who wants tasks pastes them into
  the existing Tasks form.
- **No auto-Working-Draft writes.** Builders never push their
  output into Working Draft. The student copies markdown to the
  clipboard and pastes manually.
- **No auto-status changes.** Final Week Mode does not move a
  deliverable from `draft` → `in_review` based on P0 completion.
  The student / chief moves it via the existing flow.
- **No auto-approval.** Final Week Mode does not approve anything.
  The chief approves via the existing approval flow when ready.
- **No new Firestore collections, no rule changes, no auth
  changes, no route changes.**
- **No POS, payment, checkout, refund, tax, or inventory-decrement
  behavior.** Square remains the external POS.
- **No AI calls** from Final Week Mode utilities, panels, or
  templates. The Executive Advisor remains a separate, AI-powered
  surface that this pass does not modify.

## Drift validation

`validateFinalWeekMap()` runs on `FinalWeekCompletionPanel` mount
and walks every lane entry, confirming the deliverable id and
section id exist in the studio registry. Drift (a renamed section
id, a removed deliverable) is flagged in the browser console and
**never blocks render** — the panel still shows every other lane
entry while the bad one is logged for fix.

## Adding a section to the lane map

To add or move a section in / out of the P0 map:

1. Edit the relevant lane in `FINAL_WEEK_LANES`
   (`app/utils/finalWeekCompletion.ts`). Each entry needs a unique
   `id` (we use `ch-XX:section-id`), the `deliverableId` and
   `sectionId` from the studio file, and the eight display fields.
2. If the section warrants a recommended task, add a parallel
   `FinalWeekTaskTemplate` entry in
   `app/utils/finalWeekTaskTemplates.ts` keyed by the same `id`.
3. Build (`NITRO_PRESET=node-server npm run build`). The drift
   validator will warn at render time if the section id no longer
   resolves to a real studio section.

No code changes required in the panels — both are generic over
the lane / template arrays.
