# Our City Studio — Calibration & Perfection Notes

Running list of things to revisit after Financial Literacy V1 and the Brand Coach
word-choice calibration are live on staging. Documentation only — nothing here is
implemented yet.

Last updated: 2026-07-04 (after commit `0ebe501`, Financial Literacy V1).

## 1. Brand Builder / Sherpa calibration

- **Preserve student voice.** Final drafts should still sound like the student —
  refined raw-material summaries, not college essays. Spot-check real submissions.
- **No role upgrades without evidence.** "Volunteered" must never become
  "led/organized/coordinated/mentored/managed." Bracketed prompts
  (`[describe your role]`) are the correct fallback — verify the model holds this
  under real student input, not just tests.
- **Political/sensitive language coaching.** Coach word choice ("orange man" →
  casual/risky for this audience) without erasing the underlying concern. Watch
  for the model either lecturing or sanitizing.
- **Word-choice mini-lessons.** Seven-part flags (word → definition → audience
  read → evidence fit → alternatives → best fit → revised sentence) capped at
  3–5 high-impact flags. Confirm it stays a coaching moment, not a vocabulary
  lesson, on long submissions.
- **Avoid over-polishing.** These are high schoolers; a too-perfect draft reads
  as not-theirs to colleges and employers. If drafts start sounding uniform,
  recalibrate the prompt.
- **Watch for invented facts.** Final drafts must not add organizations, numbers,
  or achievements the student never wrote. Any invention is a prompt bug.
- **Token cap (2,600).** Raised from 2,000 to protect resume_draft + rich flags
  from truncation (truncated JSON fails strict validation and loses the whole
  response). Confirm it's enough after real classroom use; check server logs for
  truncation errors.

## 2. Final Draft / Preview UX

- Confirm students can copy the **full** final draft (not a clipped version).
- Confirm save to Portfolio works from the preview and shows up under My Portfolio.
- Confirm print / save-as-PDF captures the full preview, not just the visible pane.
- Confirm mobile usability — most students are on phones; check textarea sizing,
  button reachability, and the editable preview on small screens.
- Consider a future "Apply suggestion" workflow (one-tap accept of a Sherpa
  rewrite into the draft) instead of manual copy-editing. V2; needs design so it
  doesn't erode student ownership.

## 3. Financial Literacy V1 calibration

- **Session length.** Five modules ≈ 90 min total. Watch whether one class
  session covers 1–2 modules max and whether the index needs "pick up where you
  left off" affordances.
- **Validate calculator assumptions with coaches.** 75% take-home factor, 3×
  income rule, 30%/40% rent thresholds, and the hardcoded 620 scenario credit
  minimum (in `renting-homeownership.vue`, not in cohort settings). Adjust if
  coaches see them mislead.
- **Non-shaming language.** Re-read all "not yet" / debt-trap / over-allocation
  copy after real student use; any place a student feels judged is a copy bug.
- **Estimates vs. exact numbers.** Confirm students understand the calculators
  are rounded learning tools ("estimate only" labels), not paycheck predictions
  or financial advice.
- **Cohort settings.** `DEFAULT_COHORT_SETTINGS` is compile-time. Decide whether
  coaches need runtime-editable settings (a `useStudioCohort` loader + Firestore
  doc) or whether defaults are fine for this cohort.
- **Mission seeding.** `money-basics` / `keys-credit` deep-links exist on Today,
  but no financial-literacy missions are seeded yet. Decide whether V1 runs
  Lab-only or gets missions with due dates.

## 4. V2 candidates

- Mortgage/car amortization calculators (13_CALCULATOR_RULES has the mortgage
  back-end ratio ≤ 0.43 rule ready).
- Rose City Marketplace simulation in The Markets tab.
- Sherpa reflection coaching on money answers (coach the thinking, never give
  licensed financial advice).
- Dynamic cohort settings (runtime-loaded, per-cohort calculator assumptions).
- Mission seeding for the five financial literacy modules.
- Coach dashboard review of saved Money Plans / Budget Plans (artifacts already
  land in `portfolioArtifacts` with `coachStatus`, so the data model is ready).
