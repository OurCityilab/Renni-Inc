# Next-Wave Student Success and Advisor Mentor Architecture

## 1. Executive Verdict

Current verdict: class-ready with warnings. The platform is powerful enough to support final-week execution, but the next wave should focus on student independence, chief management visibility, and business formation learning rather than adding isolated section features.

| Area | Current grade | B+ target | Verdict |
|---|---:|---|---|
| Student UX | B- | Students know the next action, can use the right artifact surface, and can save without instructor translation. | Stronger than before, but still too dependent on students recognizing what a builder/table is for. |
| C-suite management | B | Chiefs can see work state, missing work, dependencies, and review priorities in one visual surface. | Project Navigator and Advisor V2 are useful, but task coverage still needs a deterministic map. |
| Advisor as mentor | C+ | Advisor answers chief questions, coaches management moves, and explains facts grounded in deterministic context. | Current action-card coach is a foundation, not yet a true mentor. |
| Task visualization | C | Chiefs can see task coverage by lane, chapter, owner, status, and dependency. | Signals exist, but not enough visual mapping. |
| Business operations coverage | C+ | Operations covers recurring cadence, fulfillment, vendor coordination, quality, customer service, issues, and continuity. | Current operations is still too event-heavy. |
| Executive/corporate strategy learning | D | Students can compare high-level entity models and draft a review-ready ownership/governance model. | Mostly missing; this is a curriculum gap, not a code bug. |
| Customer archetype selection | B- | Students choose from concrete archetypes, see examples, then customize. | Customer Profile Builder is strong, but archetype discovery needs to become more selectable and less blank. |
| Mobile/classroom usability | B- | Core work surfaces remain usable on phones and small classroom screens. | Builders are usable enough, but tables and dense advisor cards need compact modes. |

Blunt read: the next build should not be another standalone builder first. It should add deterministic task visualization and an Advisor Mentor layer that teaches chiefs how to manage execution using facts the app already has.

## 2. Highest-Impact Recommendation

Recommended build order:

1. **Advisor Mentor + task visualization**: highest leverage because it helps chiefs direct class time, exposes missing task coverage, and gives the Advisor factual grounding.
2. **Customer Archetype Picker upgrade**: improves the most important pattern in the system: students making strategic choices before writing.
3. **Business Operations expansion**: fixes a conceptual gap where operations still reads too much like launch-day execution instead of ongoing company work.
4. **Corporate Structure / Equity Builder**: important and high-value, but it carries educational and adult-review risks, so it should follow the visibility and archetype upgrades.
5. **Additional student-success refinements**: examples, minimum viable answer cards, mobile table improvements, and chief review rubrics.

Why this order: chiefs need to know what to push on before students can finish independently. The Advisor should not invent management insight; deterministic task maps should show facts, and Advisor chat should explain those facts in student-leader language.

## 3. Advisor Mentor Architecture

The C-suite Advisor should evolve from an action-card coach into a management mentor. Deterministic components should show factual task coverage, dependencies, status, and missing work. AI should explain, coach, and translate those facts into management moves.

| Capability | User story | Data needed | Current data available | Missing data | Recommended UI surface | AI or deterministic? | Risk | Complexity | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Chat/Q&A mode | As a chief, I can ask “What should I do next?” and get grounded guidance. | Role, tasks, deliverables, outputs, dependencies, final-week map, builder coverage. | Advisor context V2, task templates, dependency hints, Project Navigator signals. | Stronger source citations and “unknown” display. | Advisor side panel on Project Navigator and C-suite dashboard. | AI for explanation; deterministic context. | Hallucinated facts if context is thin. | Medium | P1 |
| Visual task coverage summary | As a chief, I can see which P0 sections have tasks and which do not. | P0 map, section registry, tasks, owner/reviewer map. | Final-week templates, Template Studio registry, tasks. | Matching utility that maps tasks to required sections. | Project Navigator top band. | Deterministic. | False “covered” if matching is loose. | Medium | P0 |
| Task map by lane/chapter/owner | As a chief, I can see who owns work by lane and chapter. | Lane map, chapter map, owners, tasks, statuses. | Final-week lanes, templates, tasks, chapter owners. | Visual grouping and status rollups. | `LaneCoverageBoard`. | Deterministic. | Overwhelming if every section is shown at once. | Medium | P0 |
| Dependency map | As a chief, I can see what is blocked by missing upstream work. | Dependency hints, section routes, task statuses, output readiness. | `sectionDependencyHints`, Project Navigator signals. | Chain visualization and severity labels. | `DependencyMap` on Project Navigator. | Deterministic with AI explanation optional. | Hard-lock feeling if language is too strict. | Medium | P1 |
| Missing task coverage map | As an admin/chief, I can see P0 sections without task coverage. | Required task templates, current tasks, section registry. | Final-week task templates and tasks. | Task-to-section matching confidence. | `MissingTaskCoveragePanel`. | Deterministic. | Could imply auto-creation; must remain guidance. | Small | P0 |
| Run the room plan | As a chief, I can ask how to use the next 45 minutes. | Current blockers, overdue work, P0 map, lanes, owners. | Advisor mode exists; context exists. | Better task coverage and class-time constraints. | Advisor response cards. | AI. | Too much advice if not grounded in P0. | Medium | P1 |
| Section rescue | As a chief, I can ask what to tell a team whose section is weak. | Section recipe, output readiness, evidence, draft/final text, review rubric. | Section recipes, outputs, structured evidence, readiness. | Concise rubric per artifact type. | Advisor card launched from section page and Project Navigator. | AI with deterministic readiness. | Could sound like it writes the work. | Medium | P1 |
| Approval coaching | As a chief, I can check whether a section should be approved. | Output state, evidence, rubric, done criteria, reviewer. | Approval workflow, output readiness, recipes. | Explicit approve-if / push-back-if rubric per section. | Advisor card near approval rubric. | AI for explanation; deterministic checks first. | Must not approve or submit. | Medium | P1 |
| “Show me why this matters” | As a chief, I can understand downstream impact. | Dependency graph, final outputs, lane map. | Final outputs, dependency hints. | Better downstream impact text. | Inline explainer on dependency signals. | Mostly deterministic; AI optional. | Generic explanations if not section-specific. | Small | P1 |
| “What should I say to this teammate?” | As a chief, I can get exact respectful language to direct work. | Task, owner, blocker, definition of done. | Advisor action cards include teammate language. | Tone presets and role context. | Advisor action card. | AI. | Tone must stay supportive and operational. | Small | P1 |
| “What can we finish today?” | As a chief, I can triage realistic work for this class period. | P0/P1/P2, task status, dependencies, time left. | Final-week triage mode, P0 map. | Class-period time input and quick status rollups. | Advisor mode plus deterministic triage board. | Hybrid. | Overpromising if output state is stale. | Medium | P0 |

Advisor mentor rule: **facts first, coaching second**. The UI should show factual coverage maps before AI advice. The Advisor should cite section/task/source IDs, mark unknowns, and keep `humanReviewRequired: true`.

## 4. Task Visualization Architecture

### Recommended Data Shape

```ts
type TaskCoverageNode = {
  chapterId: string
  sectionId: string
  sectionTitle: string
  lane: string
  owner: string
  reviewer: string
  priority: 'P0' | 'P1' | 'P2'
  requiredTaskTitle: string
  hasTask: boolean
  matchedTaskIds: string[]
  statusSummary: {
    blocked: number
    overdue: number
    inProgress: number
    readyForReview: number
    done: number
  }
  dependency: string
  definitionOfDone: string
  route: string
}
```

Recommended implementation home later:

- `app/utils/taskCoverageMap.ts` for deterministic derivation.
- `app/components/TaskCoverageMap.vue` for the top-level map.
- `app/components/LaneCoverageBoard.vue` for lane cards.
- `app/components/ChapterCoverageMatrix.vue` for chapter grid.
- `app/components/DependencyMap.vue` for dependency chains.
- `app/components/MissingTaskCoveragePanel.vue` for manual task seeding guidance.
- `app/components/ChiefFocusBoard.vue` for “what to push on now.”

| Component | What it shows | Inputs | Output | UI placement | Complexity | Risk | Priority |
|---|---|---|---|---|---|---|---|
| `TaskCoverageMap` | P0/P1/P2 sections, task coverage, missing tasks, status counts. | Template Studio registry, final-week templates, tasks, outputs. | Coverage nodes and summary counts. | Project Navigator above Advisor. | Medium | Incorrect matching if task titles drift. | P0 |
| `LaneCoverageBoard` | Work by C-suite lane, owner, status, overdue/blocked count. | Final-week lanes, tasks, deliverables. | Lane cards with next action. | C-suite dashboard and Project Navigator. | Medium | Too many cards if not filtered. | P0 |
| `ChapterCoverageMatrix` | Chapters vs. coverage state and readiness. | Chapters, sections, tasks, outputs, readiness. | Matrix with missing/ready/in-review labels. | Project Navigator tab or expandable section. | Medium | Dense on mobile. | P1 |
| `DependencyMap` | Upstream/downstream dependency chains. | Dependency hints, output status, task status. | Chain list with blockers and route links. | Project Navigator and section pages. | Medium | Students may read hints as hard locks. | P1 |
| `MissingTaskCoveragePanel` | P0 sections that need manual tasks. | Required task templates and current tasks. | Suggested task rows for manual creation. | Admin/chief-only Project Navigator. | Small | Could be mistaken for automatic task creation. | P0 |
| `ChiefFocusBoard` | Top 5 actions chiefs should push on. | Coverage nodes, dependency signals, due dates, statuses. | Focus cards with owner, next action, done signal. | C-suite landing and Project Navigator. | Medium | Needs clear priority logic. | P0 |

MVP algorithm:

1. Build all required P0/P1/P2 nodes from final-week task templates and Template Studio sections.
2. Match tasks by `sectionId`, route target, requirement ID, or normalized title.
3. Count statuses without writing anything.
4. Mark unmatched required nodes as missing task coverage.
5. Feed summary into Project Navigator and Advisor context.

## 5. Business Operations Expansion

### Current Operations Coverage

Current Ch. 9 sections:

- `inventory`: useful, but mostly launch-readiness oriented.
- `day-of-sop`: useful for the TechTown pop-up, but event-specific.
- `baked-goods-sop`: useful and concrete, but narrow.
- `continuity`: good bridge to handoff, but not enough recurring operating cadence.

The current OperationsChecklistBuilder is a good pattern. The gap is not the component; it is the business operations model.

### What Is Too Pop-Up-Specific

- Day-of execution dominates operations language.
- Inventory readiness is tied to a launch event more than ongoing stock management.
- Vendor coordination, quality control, customer service, issue tracking, and recurring cadence are not prominent enough.
- Order/interest tracking is not framed as a safe, non-transactional lead/interest workflow.

### What Already Supports Broader Operations

- Ch. 4 Key Activities can define repeatable work.
- Ch. 4 Key Resources can identify ongoing resources.
- Ch. 4 Key Partnerships can define vendor/community relationships.
- Ch. 3 continuity can support next-cohort operations.
- Ch. 12 Strategy and Growth can turn post-launch evidence into operating recommendations.

### Recommended Section and Builder Changes

| Area | Recommendation | Belongs in | Builder pattern | Chief review standard |
|---|---|---|---|---|
| Operating cadence | Add or reframe a section for weekly/monthly routines. | Ch. 9 Operations | Universal Checklist/SOP Builder | Approve if routine, owner, cadence, and backup are clear. |
| Fulfillment workflow | Add fulfillment steps from product request/interest to handoff. | Ch. 9 Operations | Checklist/SOP Builder | Approve if steps avoid transaction behavior and name responsible roles. |
| Vendor coordination | Track vendor/contact, need, next contact, risk. | Ch. 4 partnerships and Ch. 9 | Universal Table Builder | Approve if each relationship supports repeatable business activity. |
| Quality control | Define product quality checks before sale/display. | Ch. 9 | Checklist/SOP Builder | Approve if checks are specific enough for another student to run. |
| Customer service/issues | Track issues, owner, response, fix, learning. | Ch. 9 and Ch. 13 | Universal Table Builder / Decision Memo Builder | Approve if issue handling is respectful and action-oriented. |
| Interest tracking | Track interest/signups without becoming a transaction tool. | Ch. 9 and Ch. 10 | Universal Table Builder | Approve if it records non-sensitive interest only and avoids payments. |
| Post-launch operations | Decide what continues after TechTown. | Ch. 12 Strategy and Growth | StrategyMemoBuilder | Approve if recommendation uses evidence and names next validation. |
| Handoff/continuity | Package operating knowledge for next cohort. | Ch. 3, Ch. 9, Ch. 13 | Checklist/SOP Builder | Approve if a new student can run the process. |

Do not build checkout, payment, tax, refund, external POS, or automatic inventory decrement features. Square remains an external point-of-sale tool only.

## 6. Executive / Corporate Strategy Builder Architecture

Recommended name: `CorporateStructureBuilder`.

Purpose: teach students to draft an educational business structure model for Renni Inc. that requires instructor/adult/legal review before any real-world use.

This builder should not provide legal advice, tax advice, accounting advice, securities advice, investment advice, entity formation, automatic equity grants, or a legal cap table. It should produce a draft learning artifact for review.

### Recommended Placement

Primary placement:

- Ch. 3 Structure and Continuity
- New section recommendation: `corporate-structure-and-ownership`

Secondary support:

- Ch. 12 Strategy and Growth for next-semester structure recommendations.
- Ch. 13 Decision Log and Appendices for decision memos and unresolved review questions.

It should support existing structure/continuity work, not replace it.

### Builder Capabilities

| Capability | Student-facing behavior | Guardrail |
|---|---|---|
| Entity type selector | Students compare LLC, C-corp, S-corp, corporation, employee-owned model, co-op, nonprofit-owned subsidiary or affiliated venture, and other high-level forms. | Explanations are educational summaries only. |
| Explanation panel | Shows what the form generally means, common tradeoffs, and what adults must review. | Mark unknowns and require review. |
| Tradeoff comparison | Students compare control, continuity, complexity, fundraising fit, student ownership, and review needs. | No recommendation as final advice. |
| Ownership model builder | Students draft owner categories and percentages. | Draft model only. |
| 70/30 model builder | Default scenario: Our City nonprofit owns 30%, students own 70%. | Requires adult/legal review before any real-world use. |
| Student equity allocation table | Students list participant, role, proposed share, rationale, vesting status. | Not a legal record. |
| Vesting toggle and schedule | Students choose whether vesting applies and draft schedule/rules. | Requires review for enforceability and fairness. |
| Dividends/distributions section | Students describe if/how money might be distributed. | Not tax, accounting, or investment advice. |
| Governance/voting section | Students define who votes on what. | Must include adult review. |
| Graduation/exit rules | Students draft what happens when students graduate or leave early. | Must mark unresolved questions. |
| Next-cohort continuity | Students explain how future students join without erasing prior work. | Must connect to Ch. 3 continuity. |
| Adult/legal review checklist | Students identify decisions that require adult/legal review. | Mandatory before submission. |
| Copy-to-Working-Draft output | Builder produces markdown for the Working Draft. | No hidden draft writes. |

### Proposed Config Type

```ts
type CorporateStructureBuilderConfig = {
  entityTypeOptions: Array<{
    id: string
    label: string
    educationalExplanation: string
    commonTradeoffs: string[]
    adultReviewQuestions: string[]
  }>
  ownershipModel: {
    nonprofitSharePercentDefault: 30
    studentSharePercentDefault: 70
    allowCustomScenario: boolean
  }
  equityParticipants: Array<{
    role: string
    proposedSharePercent: number | null
    rationalePrompt: string
    vestingPrompt: string
  }>
  vesting: {
    enabledDefault: boolean
    scheduleOptions: string[]
    exitRulePrompts: string[]
  }
  dividendPolicyPrompts: string[]
  votingRightsPrompts: string[]
  graduationRulePrompts: string[]
  unresolvedLegalQuestionPrompts: string[]
  adultReviewRequired: true
}
```

### Task Templates Required

| Task title | Owner | Reviewer | Definition of done |
|---|---|---|---|
| Draft Renni Inc. structure options | Co-CEOs | Instructor/Admin | At least 3 entity models compared with tradeoffs and review questions. |
| Draft 70/30 ownership scenario | Co-CEOs | Instructor/Admin | Draft model includes Our City nonprofit 30%, student 70%, participant table, and unresolved questions. |
| Draft vesting and graduation rules | Strategy and Growth lead | Instructor/Admin | Draft includes vesting choice, schedule, exit rules, and adult-review checklist. |
| Record structure decision memo | Co-CEOs | Instructor/Admin | Decision memo includes options, evidence, risks, recommendation, owner, and next review step. |

## 7. Customer Archetype Picker Architecture

### Current Audit

Customer Profile Builder already gives students a deterministic path from choices to profile output. Market Fit Builder helps connect audience/product fit. The missing piece is a selectable archetype library that shows students what common Renni Inc. customer types look like before they start from scratch.

Recommendation: extend Customer Profile Builder with a `CustomerArchetypePicker` subcomponent rather than creating a disconnected new builder. The picker should seed choices, explain the archetype, and still require customization.

### Required Behavior

- Select one or more archetypes.
- Show profile, example quote, likely needs/wants, objections, product fit, channels, evidence prompts, and what not to assume.
- Let students customize after selecting.
- Keep deterministic classifier output.
- Keep copy-to-Working-Draft handoff.
- Do not expose raw numeric scores to students.

### Corrected National Archetype Library

The Customer Archetype Picker should use the same 10 Renni-original,
PRIZM / ESRI-inspired national archetypes as the deterministic
Customer Profile Builder classifier. Local school roles are useful
applications, but they are not the core taxonomy. For example,
"Renaissance student," "alumni," "teacher/staff," "TechTown visitor,"
and "Phoenix Nest buyer" belong in local application notes, not in the
primary archetype labels.

| Archetype | National profile | Local application examples | Evidence to collect | Risk of assumption |
|---|---|---|---|---|
| Rising City Renters | Early-career city renters balancing identity and budget. | Current/recent student, TechTown walk-up buyer. | Price reaction, quick interview, table observation. | Assuming young/urban means high spending power. |
| Value-Driven Family Households | Family household buying when value is concrete. | Parent/family supporter, family buyer. | Family price reaction, sizing/quality questions. | Treating support as unlimited budget. |
| Settled Suburban Households | Established household preferring trusted convenience and quality. | Metro Detroit supporter, school-store end customer. | Adult buyer interview, fulfillment questions. | Assuming trust exists before quality proof. |
| Established Affluent Households | Higher-discretionary household buying premium when quality and story are credible. | Premium retail buyer, Phoenix Nest quality-fit customer. | Willingness-to-pay interview, premium comp research. | Treating mission as a substitute for product quality. |
| Practical Small-Town Households | Practical household outside dense city cores valuing durability and access. | Relative/community supporter outside the school network. | Durability/access questions, local price comps. | Assuming non-urban buyers do not care about design. |
| Legacy-Stage Affluent Households | Later-stage household spending on gifting, legacy, and deliberate giving. | Alumni legacy buyer, adult gift buyer. | Alumni/adult interview, gift-use feedback. | Assuming all alumni share one motivation. |
| Rural Fixed-Income Households | Rural or very small-town household with fixed/limited income and access constraints. | Use only with direct evidence of fixed-budget/access constraints. | Direct respondent evidence, total-cost objection. | Applying this archetype without evidence. |
| Multigenerational Urban Households | Urban household with multiple generations influencing purchase decisions. | Student interest plus adult/guardian buyer approval. | Family buyer interview, cross-age design reaction. | Letting one family member stand in for the household. |
| Digital-First Premium Buyers | Mobile/social-first buyer evaluating premium products through visuals and proof. | Detroit-style buyer, online campaign audience, Phoenix Nest visual proof. | Product photo reaction, mobile interest signal. | Confusing attention with conversion. |
| Cause-First Supporters | Mission-first buyer/donor whose engagement starts with impact. | Teacher/staff, donor, community supporter, student-work advocate. | Supporter quote, donation/share behavior, story-response notes. | Treating mission support as product demand. |

## 8. Other Student-Success Improvements

| # | Problem | Recommended fix | Affected surface | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Priority |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Students still face blank-page moments. | Add minimum viable answer cards to P0 sections. | Section pages | Claude Code | May 1 | Section registry | Each P0 section shows artifact floor and strong pattern. | All P0 | Small | Low | P0 |
| 2 | Examples are uneven. | Add one model answer or output format to each P0 recipe. | SectionRecipePanel | Curriculum Lead | May 1 | P0 map | Each P0 section has a concrete example. | All P0 | Medium | Low | P0 |
| 3 | Chiefs lack explicit review standards. | Add approve-if / push-back-if rubrics to P0 sections. | Section page, Advisor context | Curriculum Lead + Claude Code | May 2 | Artifact type map | Chief sees review standard before approval. | All P0 | Medium | Medium | P0 |
| 4 | Task coverage is not visual. | Build TaskCoverageMap and MissingTaskCoveragePanel. | Project Navigator | Claude Code | May 2 | Final-week templates | Chiefs see missing P0 tasks without creating tasks automatically. | All | Medium | Medium | P0 |
| 5 | Mobile tables can be hard to use. | Add compact stacked row mode for universal tables. | Universal table surfaces | Claude Code | May 3 | Table builder | Tables are usable at phone width without horizontal hunting. | Ch. 4, 7, 8, 10, 13 | Medium | Medium | P1 |
| 6 | Students do not always know who to ask. | Add “Ask your chief” owner/reviewer line near first action. | Section pages | Claude Code | May 2 | Owner map | P0 section header shows reviewer/owner. | All P0 | Small | Low | P0 |
| 7 | Business terms still require translation. | Add inline glossary chips for artifact-specific terms. | SectionRecipePanel | Claude Code | May 4 | Glossary list | Terms open simple student-facing explanation. | All | Medium | Medium | P1 |
| 8 | Builder output handoff varies by component. | Standardize final copy block and handoff language. | Builders | Claude Code | May 2 | Existing builders | Every builder uses the same copy-to-Working-Draft pattern. | All builder sections | Medium | Low | P0 |
| 9 | Evidence quality is not visible enough. | Add evidence quality hints: claim/source/assumption/risk. | Structured evidence editor | Claude Code | May 3 | Evidence fields | Student sees what makes evidence useful. | All | Small | Low | P1 |
| 10 | Post-event learning can be lost. | Add post-event recap template. | Ch. 12, Ch. 13 | Curriculum Lead + Claude Code | May 8 | Event data | Recap captures result, evidence, learning, next step. | Ch. 12, 13 | Medium | Low | P1 |
| 11 | Student roles are not onboarded clearly enough. | Add role onboarding cards by lane. | Home dashboard | Claude Code | May 6 | Role map | Student sees what their role does this week. | All | Medium | Medium | P1 |
| 12 | Remote marketing tasks may be disconnected. | Add campaign lane checklist with channel/output/deadline. | Ch. 10 | Claude Code | May 6 | Campaign task list | Marketing students see what to produce and where it goes. | Ch. 10 | Medium | Low | P1 |
| 13 | Advisor answers need source confidence. | Show context source IDs and unknowns in action cards. | Advisor panel | Claude Code | May 4 | Advisor context | Chief can tell what each card is based on. | All | Medium | Medium | P1 |
| 14 | Ready-for-review can feel hidden. | Add manual “ready to ask chief” guidance, not status mutation. | Section pages | Claude Code | May 3 | Approval flow copy | Students know when to use existing submit/review workflow. | All P0 | Small | Low | P0 |
| 15 | Product data is repeated across sections. | Show “reuse product catalog” suggestions, no overwrite. | Product/pricing/marketing/retail sections | Claude Code | May 7 | Product catalog utility | Student can import or copy product rows explicitly. | Ch. 7, 8, 10, 11 | Medium | Medium | P1 |
| 16 | Chief meeting prep is manual. | Add ChiefFocusBoard with top five next actions. | C-suite dashboard | Claude Code | May 3 | Task coverage map | Chiefs can run the first 15 minutes from one board. | All | Medium | Medium | P0 |
| 17 | Supporting brands can confuse customers. | Add supporting-brand relationship examples. | Ch. 6 | Curriculum Lead | May 8 | Brand system copy | Students distinguish Lumen, Notice, Humble Oven, and House Phoenix. | Ch. 6 | Small | Low | P2 |
| 18 | Corporate structure is missing. | Add CorporateStructureBuilder later with adult-review posture. | Ch. 3 | Claude Code + Curriculum Lead | May 15 | Review-approved curriculum | Draft model is educational and review-ready. | Ch. 3 | Large | High | P2 |

## 9. Implementation Roadmap

### Phase 0 — This Week / Class-Critical

| Item | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Expected impact | Tool |
|---|---|---|---|---|---|---|---|---|---|
| TaskCoverageMap MVP | Claude Code | May 2 | Final-week templates, task data | Project Navigator shows P0 sections with/without tasks and status counts. | All | Medium | Medium | High for chiefs | Claude Code |
| ChiefFocusBoard | Claude Code | May 3 | TaskCoverageMap | Chiefs see top five actions with owner, dependency, done signal, and section link. | All | Medium | Medium | High for class management | Claude Code |
| P0 minimum viable answer cards | Claude Code + Curriculum Lead | May 1 | P0 map | Every P0 section shows the minimum answer and strong pattern. | P0 sections | Small | Low | High for student independence | Claude Code |
| Builder handoff standard cleanup | Claude Code | May 2 | Existing builder inventory | Every builder has consistent copy/paste/edit/evidence/save language. | Builder sections | Medium | Low | High for handoff | Claude Code |
| Codex safety smoke | Codex | May 3 | Above changes | No hidden writes, no duplicate builders, Advisor stays read-only. | All | Small | Low | High for release safety | Codex |

### Phase 1 — Next Sprint

| Item | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Expected impact | Tool |
|---|---|---|---|---|---|---|---|---|---|
| Advisor Mentor chat/Q&A | Claude Code | May 8 | TaskCoverageMap and Advisor context | Chiefs can ask grounded questions; answers cite sources and unknowns. | All | Medium | Medium | High for management learning | Claude Code |
| MissingTaskCoveragePanel | Claude Code | May 8 | Task matching utility | Chiefs/admins see missing manual task templates with no auto-creation. | All | Small | Medium | High for task coverage | Claude Code |
| CustomerArchetypePicker | Claude Code | May 10 | Customer Profile Builder | Students select archetypes, customize, and hand off to draft. | Ch. 4, 10, 11 | Medium | Medium | High for strategy quality | Claude Code |
| Operations cadence expansion | Claude Code + Curriculum Lead | May 10 | Ch. 9 review | Operations includes recurring cadence, fulfillment, vendors, quality, issues. | Ch. 9 | Medium | Medium | Medium-high | Claude Code |
| Mobile compact table mode | Claude Code | May 10 | Universal table builder | Tables stack cleanly on phone-width screens. | Many | Medium | Medium | Medium | Claude Code |

### Phase 2 — Deeper Curriculum Builders

| Item | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Expected impact | Tool |
|---|---|---|---|---|---|---|---|---|---|
| CorporateStructureBuilder | Claude Code + Curriculum Lead | May 15 | Adult-review curriculum approved | Students draft educational structure/ownership model with required review checklist. | Ch. 3 | Large | High | High for business formation learning | Claude Code |
| Value Proposition Fit upgrade | Claude Code | May 15 | Archetype picker smoke-pass | Students connect customer profiles to pains, gains, jobs, and product value. | Ch. 4 | Large | Medium | High | Claude Code |
| Campaign Builder expansion | Claude Code | May 17 | Market/customer archetype data | Students build campaign audience, message, channel, proof, CTA, timing. | Ch. 10 | Large | Medium | Medium-high | Claude Code |
| Phoenix Nest pitch proof upgrade | Claude Code | May 17 | Product/pricing/inventory data | Retail pitch uses buyer proof, margin logic, SKU readiness, and objections. | Ch. 11 | Medium | Medium | High | Claude Code |

### Phase 3 — Durable Platform

| Item | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Expected impact | Tool |
|---|---|---|---|---|---|---|---|---|---|
| Persistent task coverage admin tools | Claude Code | Later | Manual task workflow validated | Admins can manage task templates deliberately without hidden task creation. | All | Large | High | High | Claude Code |
| Richer Advisor source controls | Claude Code | Later | Advisor Mentor V1 | Advisor displays source confidence, stale data, and missing inputs. | All | Medium | Medium | Medium-high | Claude Code |
| Reports/export view | Claude Code | Later | Structured outputs mature | Instructor can review final artifacts and evidence by lane. | All | Large | Medium | Medium | Claude Code |
| Multi-cohort continuity dashboard | Claude Code | Later | Continuity artifacts standardized | Next cohort can see what carried forward and why. | Ch. 3, 12, 13 | Large | Medium | High | Claude Code |

## 10. Recommended Next Prompts

### Claude Code Prompt: Advisor Mentor + Task Visualization P0

```text
You are working in the existing Renni Command Center repo.

This is an implementation pass for deterministic task visualization and Advisor Mentor grounding.

Do not change Firestore rules, Auth, routes, dependencies, submit/approval/status behavior, or Advisor safety posture.

Build:
1. app/utils/taskCoverageMap.ts that derives TaskCoverageNode[] from Template Studio sections, final-week task templates, current tasks, outputs, dependency hints, and chapter/lane owner data.
2. TaskCoverageMap, MissingTaskCoveragePanel, LaneCoverageBoard, and ChiefFocusBoard components.
3. Mount the task coverage surfaces on /c-suite/project-navigator above the Advisor panel.
4. Add the task coverage summary to ExecutiveAdvisorContextV2 without adding writes or automatic task creation.

Rules:
- Deterministic UI shows facts.
- Advisor may explain facts but must not create tasks, submit, approve, or change statuses.
- Missing task rows are display-only guidance for manual seeding.
- Use Playbook terminology.

Run:
npm run test:classifier || true
npm run typecheck || true
NITRO_PRESET=node-server npm run build

Return a summary, files changed, safety notes, and smoke checklist.
```

### Claude Code Prompt: Customer Archetype Picker

```text
You are working in the existing Renni Command Center repo.

Implement a CustomerArchetypePicker inside or alongside CustomerProfileBuilder.

Do not add AI calls, Firestore writes, raw numeric score display, route changes, or approval/status changes.

The picker should let students select and customize national, Renni-original, PRIZM / ESRI-inspired archetypes aligned to the deterministic Customer Profile Builder classifier:
Rising City Renters, Value-Driven Family Households, Settled Suburban Households, Established Affluent Households, Practical Small-Town Households, Legacy-Stage Affluent Households, Rural Fixed-Income Households, Multigenerational Urban Households, Digital-First Premium Buyers, Cause-First Supporters.

Do not use school-role labels as core archetypes. Renaissance student, senior student, underclass student, alumni, parent/family supporter, teacher/staff, TechTown visitor, and Phoenix Nest buyer should appear only as local application contexts where appropriate.

For each archetype show:
- short profile
- example quote
- demographic fingerprint
- lifestyle fingerprint
- likely products
- likely channel
- evidence to collect
- risk of assumption
- local applications

The selected archetype should help seed builder choices and copy-to-Working-Draft output, but students must still edit in their own words and add evidence.

Run build/typecheck and provide smoke steps for Ch. 4 Customer Segments, Ch. 10 Target Customers, and Ch. 11 Phoenix Nest.
```

### Claude Code Prompt: Corporate Structure / Equity Builder

```text
You are working in the existing Renni Command Center repo.

Implement an educational CorporateStructureBuilder for Ch. 3 Structure and Continuity.

This builder must be educational and planning-oriented only. It must not provide legal advice, tax advice, securities advice, investment advice, entity formation, automatic equity grants, or a legal cap table. Outputs require instructor/adult/legal review before any real-world use.

Build a config-driven builder that covers:
- entity type selector
- educational explanations
- tradeoff comparison
- ownership model
- default 70/30 model with Our City nonprofit 30% and students 70%
- student equity allocation table
- vesting toggle and schedule
- dividends/distributions draft policy
- governance/voting
- graduation/exit rules
- next-cohort continuity
- adult/legal review checklist
- copy-to-Working-Draft markdown

Do not change Firestore rules, Auth, routes, dependencies, submit/approval/status behavior, or Advisor prompt posture.

Run build/typecheck and provide safety notes.
```

### Claude Code Prompt: Business Operations Expansion

```text
You are working in the existing Renni Command Center repo.

Expand Ch. 9 operations from pop-up-day readiness into broader business operations using existing builder families where possible.

Do not add checkout, payment, tax, refund, external POS, inventory decrement, Google Drive/OAuth, hidden writes, or automatic task/status/approval changes.

Add or reframe config for:
- recurring operating cadence
- fulfillment workflow
- vendor coordination
- quality control
- customer service / issue tracking
- non-transactional interest tracking
- post-launch operations
- continuity/handoff

Use existing UniversalChecklistBuilder, UniversalSectionTableBuilder, OperationsChecklistBuilder, and StrategyMemoBuilder before creating anything new.

Keep copy-to-Working-Draft handoff and structured evidence visible.

Run build/typecheck and include smoke steps for all Ch. 9 sections.
```

### Codex Verification Prompt

```text
Audit the latest Renni Command Center branch after Advisor Mentor/task visualization and student-success upgrades.

Review-only unless there is a tiny build-blocking or safety-blocking fix.

Verify:
1. Task coverage visualizations are deterministic and display-only.
2. Missing task coverage does not create tasks automatically.
3. Advisor context includes task coverage without mutating Firestore.
4. Advisor responses remain management coaching and do not approve, submit, create tasks, or change statuses.
5. Customer archetype picker, if present, is deterministic/local-state/copy-only.
6. Corporate structure builder, if present, has adult-review guardrails and does not provide legal/tax/securities advice.
7. Operations expansion does not introduce checkout/payment/tax/refund/POS/inventory-decrement behavior.
8. Working Draft, structured evidence, submit gate, approval workflow, and Project Navigator still work.

Run guardrail scans, classifier tests, typecheck if available, and NITRO_PRESET=node-server npm run build.

Return PASS / PASS WITH WARNINGS / FAIL with exact files/lines for any blocker.
```

## 11. Guardrails: Do Not Build

- Do not provide legal advice, tax advice, securities advice, investment advice, accounting advice, or entity formation.
- Do not create automatic legal entity setup.
- Do not create automatic equity grants.
- Do not present any cap table as a legal record.
- Do not add payment, checkout, tax, refund, POS, or inventory decrement behavior.
- Do not turn Renni Command Center into a POS. Square remains external only.
- Do not add Google Drive, OAuth, or external document permissions.
- Do not mutate task, status, approval, deliverable, or output state unless a human uses an existing explicit app workflow.
- Do not let AI replace student deliverable work.
- Do not create hidden writes to Working Draft.
- Do not create tasks automatically.
- Do not claim Advisor output is an approval or final decision.

## 11.5. Implementation status — Customer Archetype Picker

**Shipped.** Pure UI + clipboard. No Firestore writes, no AI calls,
no automatic Working-Draft writes. Reuses the existing
BuilderHandoffCallout posture.

**Taxonomy corrected.** The first shipped picker used 15 school-heavy
roles. That contradicted the Customer Profile Builder classifier
direction. The picker now uses the canonical 10 national archetypes
from `app/data/customerProfileArchetypes.ts`; school/local roles are
application contexts only.

### Files added
- `app/utils/customerArchetypes.ts` — 10 classifier-aligned national
  archetypes, plus helpers (`getCustomerArchetypeById`,
  `archetypesForSection`, `archetypeLibrarySummary`,
  `formatArchetypesAsMarkdown`).
- `app/components/CustomerArchetypePicker.vue` — card-deck UI with
  per-archetype detail panel, demographic/lifestyle fingerprints,
  local-application examples, custom-note textareas, copy-as-markdown,
  and a "Suggested" badge for archetypes whose `bestForSections`
  matches the active section id.

### Files updated
- `app/components/CustomerProfileBuilder.vue` — picker mounts
  inside a collapsed `<details>` block above the slot tabs,
  framed as an *optional starting point*. Existing classifier,
  slot tabs, every output path, and every save flow are
  unchanged.
- `server/utils/executiveAdvisorContext.ts` — V2 context gains
  `customerArchetypeLibrary` (id + label + shortProfile +
  demographic/lifestyle one-liner + bestForSections only).
- `server/utils/executiveAdvisorContextBudget.ts` — compact view
  always includes the archetype library (small by construction).
- `server/utils/promptTemplates/coachModeShared.ts` — one
  posture line directs the model to recommend archetypes only
  as national starting hypotheses, treat local roles as contexts,
  and ask the team to validate with evidence.

### Where it appears today
- **Ch. 4 BMC `customer-segments`** via `CustomerProfileBuilder`.
  Collapsed by default; opens to the full picker.
- **Advisor V2 context** as a compact library only.
- **Other related sections (Ch. 10 target-customers,
  customer-problems-and-desires; Ch. 11 evidence)** intentionally
  NOT touched in this pass to avoid duplicating the Customer
  Profile Builder surface. Adding the picker there can land in a
  follow-up pass once cohort feedback shows it would help.

### Known limitations
- The picker is local-state only. If a student switches sections
  before copying, the selections do not persist — they need to
  copy into Working Draft or save the section first.
- The "Suggested" badge currently fires on `customer-segments`
  through the bestForSections lookup. Other sections that mount
  the picker in a future pass will need their own
  `bestForSections` entries on the relevant archetypes.
- Custom notes are kept as a flat object keyed by archetype id;
  clearing all wipes them (intentional).
- The Advisor receives only the compact library summary. If a
  chief asks the Advisor to deep-dive into one archetype's
  objections / channels list, the model has to ask the chief to
  open the picker for the full detail. Trade-off chosen to keep
  context bounded.

### Future tuning notes
- Monitor which archetypes students select most across cohorts —
  consider re-ordering the card deck to surface the high-signal
  ones first.
- If real Renni Inc. archetypes diverge from the current 15
  entries, amend `customerArchetypes.ts` rather than letting
  students invent ad-hoc archetypes.
- Add a small snapshot test that asserts every archetype has all
  required fields populated, so future contributors catch missing
  copy at PR time.

## 11.6. Implementation status — Business Operations Expansion (Ch. 9)

**Shipped.** Reuses existing copy-only builders. No Firestore writes,
no AI calls, no payment / checkout / inventory-decrement code added.
Every new section carries a guardrail line forbidding those
behaviors.

### Studio header reframed
`operationsReadiness` (Ch. 9):
- Title: `Business Operations + Continuity` (was Operations + Inventory Readiness).
- Purpose: "Build the repeatable system that lets Renni Inc.
  deliver products, fix issues, learn from customers, and hand
  the company off. The TechTown pop-up is one operating test;
  this chapter covers the rest."

### Existing Ch. 9 sections preserved
- `inventory`, `day-of-sop`, `baked-goods-sop`, `continuity` — all
  four still mount the existing OperationsChecklistBuilder. Inventory
  + pop-up readiness coverage is unchanged.

### New Ch. 9 sections added (8 sections)
| section id | builder | priority |
|---|---|---|
| `operating-cadence` | UniversalChecklistBuilder | P1 |
| `fulfillment-workflow` | UniversalChecklistBuilder | P1 |
| `vendor-coordination` | UniversalSectionTableBuilder | P1 |
| `quality-control` | UniversalChecklistBuilder | P1 |
| `customer-service-issues` | UniversalSectionTableBuilder | P1 |
| `interest-tracking` | UniversalSectionTableBuilder + safe-interest evidence prompt | P1 |
| `post-launch-operations` | StrategyMemoBuilder | P1 |
| `operating-handoff` | UniversalChecklistBuilder | **P0** |

### Task coverage / final-week template changes
- 8 new entries in `app/utils/finalWeekCompletion.ts` operations
  lane (1 P0 + 7 P1).
- 8 new entries in `app/utils/finalWeekTaskTemplates.ts` so the
  Task Coverage Map and Advisor `task-coverage-doctor` mode
  surface the recommended task titles for the new sections.

### Section dependency hints
8 new entries in `app/utils/sectionDependencyHints.ts`. Each hint
explains what feeds the section and what it feeds, with the
non-checkout / non-payment guardrail repeated where relevant.

### Advisor posture
Coach prompt gains one line: *"Operations means the repeatable
system that lets Renni Inc. deliver products, fix issues, learn
from customers, and hand off the company. It includes recurring
cadence, fulfillment, vendor coordination, quality control,
customer service, issue tracking, safe (non-transactional) interest
tracking, post-launch operations, and continuity / handoff — not
only the TechTown pop-up. NEVER recommend checkout, payment,
refund, tax, or inventory-decrement features. Square remains the
external POS."*

### Safe interest tracking guardrail
The new `interest-tracking` section ships a non-removable evidence
prompt: *"This is not checkout, payment, refund, tax, or
order-processing software. Use it only to track non-sensitive
interest, questions, and follow-up needs. Square is the external
POS for any actual transaction."* The Privacy note column is
mandatory per row; completion criteria explicitly forbid payment /
order / refund / tax data in the tracker.

### Known limitations
- The 8 new sections inherit the existing chapter route and the
  existing DeliverableOutputWorkspace mount. No new routes added.
- The TaskCoverageMap will show the new sections as "Missing
  task" until chiefs seed tasks manually — the manual-seed posture
  is intentional and surfaced in the MissingTaskCoveragePanel.
- The new sections are P1 except `operating-handoff` (P0). If
  cohort feedback shows another section is launch-critical, bump
  it in `finalWeekCompletion.ts`.
- No live browser smoke this pass. Recommend a 60-second
  click-through on `/deliverables/ch-09-operations-and-continuity-systems`
  to confirm the 8 new sections render and the 4 original
  Operations Checklist sections still mount their builder.

## 11.7. Implementation status — Corporate Structure / Equity Builder

**Shipped.** Educational and planning-oriented only. Renders a
non-removable safety disclaimer on every view. Local-state,
copy-only; no Firestore writes, no AI calls, no hidden writes,
no real cap table, no equity grants.

### Section configured
Ch. 3 (`company-structure-and-continuity` studio) gains a new
section `corporate-structure-and-ownership` titled "Corporate
Structure and Ownership Model." Owner: Co-CEOs. Reviewer:
Instructor / Admin. Priority: P1.

### 70/30 ownership model
Default per the source-of-truth doc: Our City nonprofit 30%,
student ownership pool 70%. Editable when
`ownershipModel.allowCustomScenario` is true (set true on the
configured section). The picker hard-warns when percentages do
not total 100 and the markdown output flags the gap explicitly.

### Builder behavior summary
- Entity-type selector across LLC, C-corp, S-corp, employee-owned,
  co-op, nonprofit-owned subsidiary, classroom venture, and "other
  / needs adult review." Each option ships an educational
  explanation, common tradeoffs, and adult-review questions.
- Editable 70/30 ownership block with total-must-be-100 guard.
- Student equity allocation table: rows of participant /
  proposed % / rationale / vesting Yes/No/Undecided / notes.
  Live total calc + warning when total ≠ student pool %.
- Vesting block: enabled Yes/No/Undecided + schedule option +
  cliff/milestone + graduation rule + leaving-early rule +
  next-cohort rule + unresolved review question.
- Distribution / dividend draft policy block with explicit
  rose-toned "not tax or accounting advice" caption.
- Governance / voting block (product / financial / equity / Our
  City role / instructor review / unresolved governance question).
- Graduation / exit / continuity block.
- Adult / legal review checklist (9 mandatory items including
  "instructor / adult / legal review completed before any
  real-world use").
- Copy markdown output — every output prefixed with the safety
  disclaimer.

### Adult / legal review guardrails
- Non-removable rose-toned banner at the top of the builder view.
- Same disclaimer reprinted at the top of the markdown output.
- Studio `lesson` copy + `completionCriteria` repeat the
  disclaimer.
- Section dependency hint repeats the disclaimer.
- Coach prompt posture: *"Corporate structure and equity outputs
  are DRAFT educational models only. NEVER give legal, tax,
  securities, accounting, or investment advice. Always require
  instructor / adult / legal review before any real-world use.
  Renni Command Center cannot create entities, grant equity, or
  maintain a real cap table."*
- The Tools brief's hard guardrails are honored: no legal /
  tax / securities / investment / accounting advice; no entity
  formation; no equity grants; no cap table; no binding
  ownership records.

### Task coverage / final-week template changes
- New executive-lane entry `ch-03:corporate-structure-and-ownership`
  in `app/utils/finalWeekCompletion.ts` (P1, owner Co-CEOs,
  reviewer Instructor/Admin).
- Matching template in `app/utils/finalWeekTaskTemplates.ts`.

### Known limitations
- The builder is local-state only. Switching sections before
  copying loses selections.
- The output is a draft markdown document — not a legal record.
  Every consumer of the output must keep the safety disclaimer.
- No live browser smoke this pass. Recommend a 60-second
  click-through on the new Ch. 3 section to verify the
  non-removable disclaimer, the entity-type cards, the 70/30
  guard, the allocation table, and the markdown output.

## 12. Bottom Line

Claude Code should build **Advisor Mentor + deterministic task visualization** next because it gives chiefs the map they need to direct the room and gives the Advisor grounded facts to explain.

Codex should review/smoke **task visualization and Advisor context safety** next because the highest risk is not UI rendering; it is accidental mutation, misleading coverage, or Advisor advice that sounds more authoritative than the underlying data.
