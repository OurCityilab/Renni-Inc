# Independent Student Readiness Smoke Test

Purpose: confirm a regular student member can complete meaningful work at home
without instructor help. This is a manual checklist; run end-to-end before any
release that touches member surfaces.

Pass standard: a 7th–12th grader completes steps 1–17 in under 10 minutes
without asking the instructor "Where do I type?", "What is this asking me?",
"Did it save?", "Am I done?", or "What if I'm stuck?"

## Prereqs

- Run on a clean browser session (no admin / chief account in localStorage).
- Dev server running: `npm run dev`.
- Or built preview: `NITRO_PRESET=node-server npm run build && node .output/server/index.mjs`.
- Sign in as a rostered regular student (no chief role, no admin).

## Test the breakpoints
- `390 x 844` (phone)
- `768 x 1024` (tablet)
- `1366 x 768` (school laptop)

## Member smoke test

1. **Log in** as a regular member.
   - [ ] Redirected to `/`.

2. **Member Home: one obvious next action.**
   - [ ] "Do this next" card is the first non-header card on the page.
   - [ ] Card has a single primary CTA button.
   - [ ] If a task is open, "Why this matters" line connects to TechTown / Playbook / Phoenix Nest.
   - [ ] If no tasks are open, the card directs to "Open my department."

3. **Member nav simplicity.**
   - [ ] Top nav does **not** show Workbench, C-Suite, C-Suite Advisor, Presentation, Export, Team, or Users.
   - [ ] Top nav shows: Home, Tasks, Deliverables, Departments, Playbook, plus Support tools (Canvas, Timeline, Goals, Pricing, Revenue, Remote Marketing).

4. **Advanced/reference tools are progressively disclosed.**
   - [ ] Member Home does **not** show ApprovalRubric ("What the chief is looking for") above the fold.
   - [ ] Reference tools (Goals, Pricing, Revenue, Canvas, Timeline) live behind a single "Reference & support tools" disclosure (or equivalent collapsed group).

5. **Task deep-link works.**
   - [ ] Click "Do this next" primary CTA.
   - [ ] Land in `/deliverables/{id}/sections/{sectionId}` (or `/deliverables/{id}` if no requirementId).
   - [ ] No console errors.

6. **Section workspace opens.**
   - [ ] Header shows section title, "Why this matters," and "← Chapter overview" breadcrumb.
   - [ ] Think / Draft accordions are open by default.

7. **Help Me Understand is visible.**
   - [ ] A "Help me understand this" panel renders near the top of the section card or just under the header.
   - [ ] Panel answers: What am I doing? · What should I write first? · What counts as good? · What proof might I need? · What should I do if I'm stuck?

8. **Student can type in Think and Draft.**
   - [ ] Type in "Your team's thinking" textarea.
   - [ ] Type in "Working draft" textarea.
   - [ ] No console error on input.

9. **Unsaved warning appears.**
   - [ ] An inline banner appears once content is dirty: "You have unsaved changes. Save before leaving."
   - [ ] Attempt to navigate away (close tab or in-app link). Browser prompts via `beforeunload`. In-app navigation prompts via `onBeforeRouteLeave`.

10. **Save success appears.**
    - [ ] Click "Save section."
    - [ ] Inline confirmation appears: "Saved at HH:MM."
    - [ ] Next-step hint appears, e.g. "Next: add a working draft." or "Next: add proof in Defend if this section makes a claim."
    - [ ] If more sections exist, "Open next section →" link appears.

11. **Final Playbook text is visually distinct.**
    - [ ] Final text textarea sits inside a clearly different (gold/amber) container.
    - [ ] A "PUBLISHABLE" tag is visible on the container.
    - [ ] Helper copy: "This is the version another team could use next semester."
    - [ ] Working draft container is plain (no gold treatment).

12. **Status & stuck buttons are visible.**
    - [ ] Three buttons are visible above or near the save button: "Still working" · "Ready for review" · "I'm stuck."
    - [ ] Selecting "I'm stuck" reveals a small note input or a clear instruction to go to Tasks and mark stuck.

13. **Heavy context is collapsed.**
    - [ ] On Ch 8 or Ch 11 sections, cross-chapter reference panels (Demand from Ch 7, etc.) are collapsed behind a "Show context from earlier chapters" disclosure.
    - [ ] Builders (Market Builder, Market Fit, Brand Fit, Pricing Strategy, AI critique) are individually collapsed behind disclosures with one-line copy ("Use this if your section talks about price, cost, or margin." etc.).

14. **Mark task done / stuck.**
    - [ ] From the section workspace, the user can navigate back to Tasks to mark the linked task done or stuck.
    - [ ] On `/tasks`, marking a task done while the linked section has no Final Playbook text shows a non-blocking warning on the row.

15. **Refresh persistence.**
    - [ ] Refresh the page.
    - [ ] Saved Think/Draft/Final content is still there.
    - [ ] Unsaved buffer is cleared (no false "unsaved" banner).

16. **Permission boundaries (regular member must not).**
    - [ ] Cannot see Approve / Return-for-revision buttons on a deliverable detail page.
    - [ ] Cannot edit due dates (InstructorDueDate is read-only).
    - [ ] Cannot navigate to `/admin/users`, `/team`, `/c-suite`, `/c-suite-advisor`, `/presentation-readiness`, `/export-center`. (Routes either redirect or display "not authorized.")

17. **Stuck path is visible.**
    - [ ] PlaybookWritingScaffold "Need help? Ask: …" is reachable from the section workspace.
    - [ ] The "Copy help message" affordance prefills a short message the student can paste into chat.

## Mismatch warnings (false-progress detection)

Run after the main smoke test using the same student account.

- [ ] Mark a task done while the linked section's Final text is empty. Row warns "Task is marked done, but the linked section has no Final Playbook text."
- [ ] Save a section with Think only (no Draft, no Final). Section card shows "Next: add a working draft."
- [ ] On Ch 7 / 8 / 10 / 11: save a section with Final text but no evidence (Sources or Defend-your-claim). Section card warns about missing proof.
- [ ] Workspace warnings never block save, never block submit, never block status changes. Submit gate logic is unchanged.

## Quality gates (developer)

Run before opening a PR:

```sh
npm run audit:requirement-sections
NITRO_PRESET=node-server npm run build
npm run typecheck
rg -n "Bible|R&D|CDO|JRLA|Renni Enterprises" app public seeds scripts
```

The forbidden-term `rg` should return only comments that explain *not* to use those terms (chapterOwners.ts, scripts that explicitly clean up legacy data). Any new student-facing copy hit is a fail.
