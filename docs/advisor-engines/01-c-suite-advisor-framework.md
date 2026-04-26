# C-Suite Advisor Framework

## Purpose

The C-Suite Advisor is a future read-only management intelligence layer for the Renaissance student leadership team. It should help Co-CEOs, COO, CFO, CMO, and Chief Strategy and Growth Officer understand the current state of Renni Command Center work without taking control away from students.

The advisor helps leadership answer:

- What is the current state of the company?
- What is at risk?
- What is unassigned?
- What is blocked?
- What is falling behind?
- What dependencies matter most?
- What should leadership do next?
- What is the best order of work given the current date, pace, and deadlines?
- What decisions need Co-CEO or instructor attention?

Core principle:

AI can explain the state of the company and recommend management moves. Humans retain authority for review decisions, assignments, due dates, and the plan.

## Product Posture

V1 should be:

- Deterministic signals first.
- Optional AI summary second.
- Read-only.
- Advisory.
- Transparent.
- Non-shaming.
- No automatic changes.

The advisor should not:

- Approve deliverables.
- Submit deliverables.
- Change owners.
- Change due dates.
- Create tasks automatically.
- Move statuses.
- Rank students publicly.
- Infer effort from thin data.
- Shame students.
- Make final decisions.
- Override chiefs, Co-CEOs, instructor, or admin.

Use language like:

- "This workstream has low visible progress."
- "This owner may need support, clarification, or a smaller next task."
- "This is a sequencing risk, not an effort judgment."

Avoid language like:

- "This student is not working."
- "This person is failing."
- "This owner is the problem."

## Deterministic Management Signals

These signals should be rule-based and explainable. They can be calculated without AI from existing tasks, deliverables, goals, Template Studio coverage, Output Workspace content, approval state, and due dates.

| Signal | What it means | Data needed | Scope | Example copy | Recommended leadership response |
| --- | --- | --- | --- | --- | --- |
| Unassigned deliverable | A deliverable has no active owner UID or clear owner assignment. | Deliverables, ownerUid, ownerEmail | Company-wide, department-specific | "Chapter 11 does not have a clear active owner." | Co-CEOs or department chief should confirm who owns the next move. |
| Unassigned required section | A required Template Studio requirement has no linked task. | Deliverable, studio requirements, tasks, requirementId | Deliverable-specific | "This chapter has required work with no task coverage." | Chief should assign a task or confirm the requirement is intentionally handled elsewhere. |
| Overdue deliverable | A non-approved deliverable is past due. | Deliverables, dueDate, status | Company-wide, department-specific | "Chapter 8 is past due and not approved." | Leadership should decide whether to reschedule, narrow scope, or escalate support. |
| Overdue task | A task is past due and not done. | Tasks, dueDate, status | Company-wide, department-specific, deliverable-specific | "Three open finance tasks are overdue." | Owner and chief should either close, rescope, or revise the plan. |
| Blocked task | A task is marked blocked. | Tasks, status, blockedBy, notes | Company-wide, department-specific, deliverable-specific | "This workstream is blocked by a dependency." | Identify who can unblock it and what decision or artifact is missing. |
| Missing dependency | A task depends on another task or deliverable that is not complete. | Tasks, dependsOn, deliverableId, statuses | Deliverable-specific | "Revenue scenario work depends on unfinished customer evidence." | Sequence prerequisite work first before asking Finance to finalize. |
| Approval waiting too long | A deliverable has been in review longer than the agreed threshold. | Deliverables, status, submittedForReviewAt, approverUid | Company-wide, role-specific | "Chapter 10 has been waiting for review for several days." | Approver should review, return with specific notes, or ask for instructor support. |
| Final text missing | A studio-backed section has no final Playbook text. | Deliverable output sections, finalText | Deliverable-specific | "This section has source work but no final Playbook text." | Owner should convert notes and evidence into final student-authored language. |
| Source notes missing | A section has little or no source notes. | Deliverable output sections, sourceNotes | Deliverable-specific | "This claim needs source notes before it becomes final." | Owner should record where the information came from before finalizing. |
| Structured evidence missing | A high-rigor section has no structured evidence entries. | Deliverable output sections, structuredEvidence, studio metadata | Deliverable-specific | "This section makes strategic claims without structured evidence." | Chief should ask for evidence, assumption, risk, confidence, and validation step. |
| Market Fit missing | A product, customer, demand, or revenue section has no Market Fit state. | Deliverable output sections, marketFit, studio metadata | Deliverable-specific | "This product-market section has no Market Fit reasoning yet." | Strategy and Growth should compare segments, evidence, and likely buyers before final text. |
| Source Coach requests still open | A Source Coach evidence request has no recorded outcome. | Market Fit evidenceRequests, source category, notes | Deliverable-specific | "The team identified a source gap but has not recorded what they found." | Assign a research task or mark why the source is not available. |
| Phoenix Nest carry pitch missing support | Chapter 11 lacks pricing, market, or inventory support from earlier chapters. | Ch. 7 output, Ch. 8 output, Ch. 11 output, Market Fit, pricing | Deliverable-specific | "Phoenix Nest pitch language needs pricing, market, and inventory support." | Co-CEOs, CFO, CMO, and Strategy and Growth should align before finalizing the ask. |
| Department overload | One department has a disproportionate number of open, overdue, or blocked tasks. | Tasks, departments, ownerUid, status, dueDate | Department-specific | "Marketing has high visible workload this week." | Chiefs should shift support, split tasks, or reduce scope. |
| Department underuse | A department has few or no active tasks while related work is stalled. | Tasks, departments, statuses | Department-specific | "Strategy and Growth may have capacity to support customer evidence." | Co-CEOs can ask whether that department can take a dependency-clearing task. |
| Stale workstream | A deliverable or task has not changed recently. | updatedAt, statusHistory, task updatedAt | Company-wide, department-specific, deliverable-specific | "This workstream has low visible progress." | Ask whether the owner needs support, a smaller next task, or clearer definition of done. |
| Deliverable near deadline with low completion | A due-soon deliverable has low coverage, missing final text, or few done tasks. | Due dates, tasks, coverage, output readiness | Deliverable-specific | "This chapter is near deadline but does not yet have final output." | Leadership should choose the minimum acceptable final draft and sequence remaining work. |
| Completed work not submitted | Required tasks are done, but the deliverable is still draft. | Tasks, requirement coverage, deliverable status | Deliverable-specific | "The task work looks complete, but the chapter has not been submitted." | Owner should review final text and submit if ready. |
| In-review work waiting too long | A deliverable is in review and has not moved. | Deliverables, status, submittedForReviewAt | Company-wide, role-specific | "This review is waiting on an approver decision." | Approver should approve, return with notes, or escalate uncertainty. |
| Blocked by owner vs dependency | A blocked task needs either owner action or upstream dependency action. | Tasks, blockedBy, notes, dependsOn | Deliverable-specific | "This blocker appears to be a dependency, not an effort issue." | Route the issue to the person or chapter that can remove the blocker. |

## Role-Specific Advisor Briefs

### Co-CEO Brief

Co-CEOs should see company-wide risk and the decisions that need executive attention.

Include:

- Company-wide risk.
- Unassigned work.
- Overdue work.
- Blocked dependencies.
- Approvals waiting.
- Chapters without final output.
- Decision log gaps.
- Departments needing support.
- Leadership decisions needed.

Example brief copy:

"The top company risk is sequencing: Chapter 11 depends on pricing, inventory, and customer evidence that are not fully connected yet. Co-CEOs should decide which evidence is strong enough for the Phoenix Nest ask and which claims need to stay cautious."

### COO Brief

The COO should see readiness, logistics, and handoff risks.

Include:

- Inventory readiness.
- Staffing readiness.
- SOP completion.
- Baked goods handling.
- Pop-up logistics.
- Handoff and continuity gaps.
- Operational blockers.

Example brief copy:

"Operations readiness is at risk if baked goods handling remains in the same path as apparel inventory. Food handling needs a separate readiness check because the risk is different."

### CFO Brief

The CFO should see pricing, margin, revenue, donation, and financial evidence gaps.

Include:

- Pricing gaps.
- Break-even gaps.
- Revenue scenario gaps.
- Donation tracking.
- Transaction readiness.
- Market Fit assumptions needed for Ch. 8.
- Phoenix Nest margin and carry support gaps.

Example brief copy:

"Finance should not finalize the revenue scenario until the target customer and reachable audience assumptions from Chapter 7 are clear."

### CMO Brief

The CMO should see customer-facing clarity and brand/market alignment risks.

Include:

- Campaign readiness.
- Target customer clarity.
- Signage and story gaps.
- Brand/market alignment.
- Phoenix Nest messaging.
- Marketing deliverables blocked by brand or market gaps.

Example brief copy:

"Marketing should review target customer language before signage is finalized. If the buyer is parent/alumni rather than student, the table pitch should sound different."

### Chief Strategy And Growth Officer Brief

The Chief Strategy and Growth Officer should see evidence, validation, and customer-learning gaps.

Include:

- Customer profile evidence.
- Surveys and interviews.
- Comparable product research.
- Source Coach gaps.
- Validation steps.
- Customer feedback gaps.
- Next-semester recommendation inputs.

Example brief copy:

"Strategy and Growth should close the evidence gap between who likes the product and who is likely to pay for it."

## Management Move Recommendations

A management move is a suggested leadership action. It is not an automatic task, assignment, status change, or decision.

Each move should include:

- Issue.
- Why it matters.
- Recommended next action.
- Owner to act.
- Dependency.
- Deadline sensitivity.
- Risk if ignored.

Example moves:

| Issue | Why it matters | Recommended next action | Owner to act | Dependency | Deadline sensitivity | Risk if ignored |
| --- | --- | --- | --- | --- | --- | --- |
| Customer evidence is missing before revenue work. | Ch. 8 scenarios depend on realistic demand assumptions. | Assign Strategy and Growth to finish customer profile evidence before CFO finalizes revenue scenarios. | Chief Strategy and Growth Officer | Ch. 7 Market Fit | High near Ch. 8 deadline | Revenue story may look unsupported. |
| Signage language does not match target customer. | Customer-facing messaging can attract the wrong audience. | Have CMO and Strategy and Growth review target customer language before signage is finalized. | CMO | Ch. 10 campaign language | Medium | TechTown pitch may be inconsistent. |
| Phoenix Nest pitch needs executive alignment. | External asks require strategic coherence. | Co-CEOs should approve pricing assumptions before Phoenix Nest pitch language is finalized. | Co-CEOs | Ch. 7 pricing, Ch. 8 revenue | High | Retail carry ask may overstate confidence. |
| Baked goods have a different risk profile. | Food handling is operationally different from apparel. | Put baked goods into a separate readiness path. | COO | Operations readiness | High near pop-up | Pop-up execution risk increases. |
| A workstream is stale. | Low visible progress may mean unclear scope, not low effort. | Ask the owner if they need a smaller next task or clearer definition of done. | Department chief | Task clarity | Medium | Work may remain stuck without support. |
| Deadline is close but work remains broad. | Broad brainstorming can block final output. | Move from broad brainstorming to narrow approval. | Co-CEOs and relevant chief | Final output deadline | High | Deliverable may miss review window. |

## Task Division Advisor Logic

The advisor should help chiefs choose how to divide work based on consistency, ownership, speed, review burden, and dependencies.

### Option A: Each Person Owns One Section Across All Brands

Pros:

- Improves consistency across brands.
- Makes comparison easier.
- Good for shared templates and repeated criteria.

Cons:

- Can reduce full-brand ownership.
- One weak section owner can slow every brand.
- Students may miss how a full brand fits together.

Best when:

- The team needs consistent analysis across Lumen, Notice, and Humble Oven.
- Sections use the same structure.
- Time allows one person to review several brands.

Risk:

- Brands may feel fragmented.

Example recommendation:

"Divide by section if consistency is the priority and each brand needs the same evidence standard."

### Option B: Each Person Owns One Full Brand

Pros:

- Improves ownership.
- One person can understand the full story.
- Faster if brand information is uneven.

Cons:

- Quality may vary by brand.
- Shared sections may use different standards.
- Reviewers may need to normalize language later.

Best when:

- Each brand has distinct needs.
- Students have strong familiarity with one brand.
- The deadline favors clear ownership.

Risk:

- Final Playbook may feel inconsistent.

Example recommendation:

"Divide by brand if each supporting brand needs a clear owner and the team can do a final consistency review."

### Option C: Pair Model

Pros:

- Combines ownership with review.
- Reduces single-person blind spots.
- Helps newer students learn faster.

Cons:

- Requires coordination.
- Can be slower if pairs wait on each other.

Best when:

- Quality matters and time allows collaboration.
- Work benefits from both brand and market judgment.

Risk:

- Pairs may duplicate work unless definition of done is clear.

Example recommendation:

"Use pairs when the section needs judgment and evidence, not just completion."

### Option D: Lead Plus Reviewers

Pros:

- Fast when time is short.
- Gives one person clear ownership.
- Reviewers can catch gaps without owning the whole draft.

Cons:

- Can overload the lead.
- Review can become shallow if reviewers are not assigned specific checks.

Best when:

- Deadline is close.
- One student already has most context.
- Chiefs need a quick path to review.

Risk:

- Lead becomes a bottleneck.

Example recommendation:

"Use lead plus reviewers when speed matters, but assign each reviewer a specific lens: market, finance, operations, or brand."

### Option E: Dependency-First Sprint

Pros:

- Clears blockers first.
- Helps downstream chapters move.
- Useful before review deadlines.

Cons:

- May leave lower-priority work untouched.
- Requires strong chief coordination.

Best when:

- One chapter is blocking another.
- External output depends on a few key assumptions.
- The team needs sequencing more than even workload distribution.

Risk:

- Students may feel reassigned too often if the reason is not explained.

Example recommendation:

"Use a dependency-first sprint when Ch. 11 cannot move until Ch. 7 and Ch. 8 evidence is settled."

## Sequencing Advisor Logic

The advisor should recommend order of work by considering:

- Current date.
- Due dates.
- Dependencies.
- Blocked status.
- Owner workload.
- Approval path.
- Final output importance.
- Whether work feeds another chapter.
- Whether work is needed for TechTown, Phoenix Nest, or the Playbook.

Sequencing guidance should be explainable. It should not say "do this because AI said so." It should say which dependency, deadline, or risk makes the order important.

Example sequence:

1. Finish customer profile evidence.
2. Finalize pricing assumptions.
3. Update revenue scenario.
4. Draft Phoenix Nest carry language.
5. Submit for review.

Example explanation:

"Chapter 11 should not finalize the retail carry ask before pricing and customer evidence are stable. Finish the evidence first, then update the revenue story, then draft the external ask."

## Advisor Output Format

Recommended C-Suite Brief format:

```text
C-Suite Brief

Top risk:
Chapter 8 revenue story depends on missing Market Fit assumptions from Chapter 7.

Best next move:
Have Strategy and Growth and Marketing finalize target profiles before Finance updates revenue scenarios.

Unassigned work:
2 deliverables have no clear owner.

Blocked dependency:
Phoenix Nest carry pitch needs pricing, inventory, and customer evidence.

Recommended task order:
1. Finish customer profile evidence.
2. Finalize pricing assumptions.
3. Update revenue scenario.
4. Draft Phoenix Nest carry language.
5. Submit for review.

Leadership decision needed:
Should the brand book be divided by brand or by section?

Advisor tradeoff:
Dividing by section improves consistency. Dividing by brand improves ownership. Because deadlines are tight, use section leads with one reviewer per brand.
```

The brief should stay compact. It should prioritize the few moves that leadership can actually act on during the next work session.

## AI Behavior Boundaries

If AI is used later, it should:

- Summarize deterministic signals.
- Explain risks.
- Suggest next management moves.
- Compare task division options.
- Help chiefs think through tradeoffs.
- Draft leadership brief language.
- Ask clarifying questions.
- Recommend but not decide.

AI should not:

- Create tasks automatically.
- Approve or submit work.
- Change dates.
- Change owners.
- Alter Firestore state.
- Infer student effort as a personal judgment.
- Make final management decisions.
- Replace Co-CEO or instructor judgment.

Required posture:

- "Coach, not commander."
- "Recommendations, not decisions."
- "Deterministic signals first; AI summary second."
- "Chiefs and instructor remain the reviewers."
- "This suggestion does not change tasks, owners, dates, or approvals."

## V1 Implementation Recommendation

### Phase 0: Docs And Framework

Build goal:

- Define advisor purpose, boundaries, signals, role briefs, management moves, sequencing logic, and AI posture.

Include:

- This framework doc.
- Shared language for non-shaming management signals.
- Future implementation phases.

Do not include:

- App code.
- Firestore rule changes.
- AI calls.
- Automatic task creation.

Definition of done:

- The product team can build the advisor without debating its authority boundary.

Risks:

- Framework becomes too broad. Keep V1 read-only and deterministic.

### Phase 1: Deterministic Signals Engine

Build goal:

- Create a pure helper that converts tasks, deliverables, goals, output readiness, requirement coverage, and builder/evidence presence into advisor signals.

Include:

- Company-wide signals.
- Department-specific signals.
- Deliverable-specific signals.
- Explainable reason strings.

Do not include:

- AI summary.
- Firestore writes.
- New gates.
- Public student rankings.

Definition of done:

- The helper can be unit-tested with static fixtures.
- Signals match Workbench and Home logic where they overlap.
- No signal changes statuses, owners, due dates, or approvals.

Risks:

- Duplicate logic with Home or Workbench. Prefer shared date/status helpers where practical.

### Phase 2: Read-Only C-Suite Dashboard Panel

Build goal:

- Add a compact advisor panel to the C-Suite dashboard.

Include:

- Top risk.
- Best next move.
- Blocked dependencies.
- Unassigned work.
- Recommended task order.

Do not include:

- Edit controls.
- Apply buttons.
- Task creation.
- Due date changes.

Definition of done:

- Chiefs and Co-CEOs can see the same risk picture without changing data.

Risks:

- Too many signals can overwhelm students. Show the top few and link to source pages.

### Phase 3: Role-Specific Advisor Cards

Build goal:

- Show role-specific briefs for COO, CFO, CMO, Chief Strategy and Growth Officer, and Co-CEOs.

Include:

- One card per relevant role.
- Department-specific risks.
- Recommended management move.

Do not include:

- Private performance judgments.
- Hidden scoring.
- Automated reassignment.

Definition of done:

- Each role sees management-relevant signals without losing company context.

Risks:

- Role cards may duplicate department pages. Keep them brief and action-oriented.

### Phase 4: AI-Generated Brief From Deterministic Signals

Build goal:

- Add optional AI language that summarizes deterministic signals into a student-friendly C-Suite Brief.

Include:

- Server-side endpoint.
- Signed-in auth check.
- Payload limited to deterministic advisor signals and relevant source labels.
- Temporary no-write response.

Do not include:

- Raw database dump.
- Student ranking.
- Firestore write-back.
- Approval or submit behavior.

Definition of done:

- AI can explain the signals but cannot change the plan.

Risks:

- AI may overstate certainty. Prompt must require cautious language and evidence references.

### Phase 5: Optional Draft Task Plan With Human Confirmation

Build goal:

- Let the advisor draft a suggested task plan that chiefs can manually convert into tasks.

Include:

- Suggested task titles.
- Suggested owners by role or department.
- Suggested dependencies.
- Suggested definition of done.

Do not include:

- Automatic task creation.
- Automatic assignment.
- Automatic due date edits.

Definition of done:

- Draft plan is clearly labeled as suggestion and requires human action to implement.

Risks:

- Students may treat drafts as orders. UI must make human confirmation explicit.

### Phase 6: Advisor History Or Log If Useful

Build goal:

- Store advisor briefs only if the team decides history is needed for reflection or continuity.

Include:

- Timestamp.
- Requesting user.
- Deterministic signal snapshot.
- Human-visible note that it is advisory.

Do not include:

- Hidden surveillance.
- Raw AI prompts with unnecessary personal data.
- Permanent critique of individual student performance.

Definition of done:

- History supports management learning without becoming a student ranking tool.

Risks:

- Stored history requires Firestore rules review and retention policy.

## Data Inputs

Likely data sources:

- Users.
- Roles.
- Departments.
- Deliverables.
- Tasks.
- Goals.
- Due dates.
- Statuses.
- Approval checklist.
- Requirement coverage.
- Output readiness.
- Source notes presence.
- Structured evidence presence.
- Market Fit presence.
- Product Positioning and Source Coach gaps.
- Pricing scenarios.
- Donations.
- Transactions.
- Feedback.
- Decision log.

V1 should prefer data that already exists in Renni Command Center. If a signal cannot be explained from visible data, it should not be shown as a fact.

## Integration Points

Recommended eventual placement:

- Home dashboard: small alert card for the top advisor signal.
- C-Suite dashboard: full advisor panel.
- Department dashboard: role-specific advisor card.
- Deliverable detail: deliverable-specific risk/advisor card.
- Decision log: leadership decisions needing record.
- Responsible AI Use: explanation of advisor limits.

The first production implementation should start with the C-Suite dashboard and stay read-only.

## Student-Facing Language Bank

Use:

- "This workstream has low visible progress."
- "This chapter is blocked by missing evidence."
- "This owner may need support or a smaller next task."
- "This is a sequencing risk, not an effort judgment."
- "The advisor recommends a leadership move. Chiefs still decide."
- "This suggestion does not change tasks, owners, dates, or approvals."
- "This deliverable is close to deadline and still missing final Playbook text."
- "This dependency should move before the downstream chapter is finalized."
- "This signal is based on visible app data only."
- "If this signal is wrong, update the task, deliverable, source notes, or status that feeds it."

Avoid:

- "This student failed."
- "This owner is behind because they did not work."
- "The advisor decided."
- "A model cleared this."
- "The system changed the plan."

## Task Map

| Task | Owner | Due date | Dependency | Definition of done | Playbook chapter or platform area |
| --- | --- | --- | --- | --- | --- |
| Document advisor framework | Strategy and Growth with Co-CEO review | TBD before advisor build | Product direction | Framework defines purpose, signals, roles, boundaries, and roadmap | Platform: advisor engines |
| Define deterministic signals | Co-CEOs with COO/CFO/CMO/Chief Strategy and Growth Officer input | TBD before implementation | Advisor framework | Signal list has data source, copy, scope, and leadership response | Platform: C-Suite dashboard |
| Define role-specific briefs | Each chief with Co-CEO review | TBD before role cards | Deterministic signal definitions | Co-CEO, COO, CFO, CMO, and Strategy and Growth briefs are mapped to real responsibilities | Platform: C-Suite and department dashboards |
| Define task division advisor | COO with Co-CEO support | TBD before Phase 2 or 3 | Existing task and department model | Advisor can compare section, brand, pair, lead/reviewer, and dependency-first models | Platform: Workbench and C-Suite dashboard |
| Define sequencing logic | Co-CEOs with chiefs | TBD before deterministic V1 | Due dates, dependencies, deliverable status, requirement coverage | Advisor can explain recommended order of work without changing the plan | Platform: Workbench and C-Suite dashboard |
| Build deterministic advisor V1 | Codex or Claude Code with instructor review | TBD after Brand Fit Builder planning | Signal definitions and existing data model | Read-only helper and C-Suite panel show top risks and next moves without writes | Platform: C-Suite dashboard |
| Add AI summary layer later | Instructor/Admin with Co-CEO review | TBD after deterministic V1 is stable | Deterministic signal engine and Responsible AI posture | AI summarizes signals temporarily, no-write, with auth and provider monitoring | Platform: C-Suite dashboard and Responsible AI Use |

## Review Checklist Before Build

- Does every signal cite visible data?
- Does every recommendation preserve human decision-making?
- Does the advisor avoid personal judgment about effort?
- Does the advisor avoid automatic tasks, owners, dates, statuses, approvals, and submissions?
- Does the advisor explain why the next move matters?
- Does the advisor help chiefs manage dependencies rather than shame students?
- Does AI, if added later, summarize signals instead of inventing company status?
