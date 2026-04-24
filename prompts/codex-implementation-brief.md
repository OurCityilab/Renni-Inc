# Codex Implementation Brief

You are assisting on an existing Nuxt 3 + Firebase project called **Renni Command Center**.

## Goal
Help implement and refine a lightweight command center for a student-led company project.

## Focus areas for Codex
Use Codex for focused implementation passes, bug fixing, refactors, and testable feature slices.

## Priority tasks
1. Review the repo structure and identify missing files.
2. Implement or tighten typed Firestore models.
3. Build the read-only Gantt timeline from deliverables/tasks.
4. Build approval rubric UI and state transitions.
5. Build soft-locking for BMC and Continuity sections.
6. Build the transaction ledger and donation tracker.
7. Improve mobile responsiveness on dashboard pages.
8. Add seed scripts for CSV-based user/deliverable/goal import.
9. Add simple unit/integration tests for critical flows.

## Constraints
- Do not replace the stack.
- Keep V1 simple.
- Favor explicit, readable code over abstraction-heavy patterns.
- Preserve Firestore as approval-state source of truth.
- Do not implement drag-and-drop editing in V1.
- Do not add AI approval logic.

## Done looks like
- students can log in
- chiefs can see what to push on
- seeded deliverables appear immediately
- timeline is visible
- approval state is easy to understand
- transaction and donation data are captured cleanly
