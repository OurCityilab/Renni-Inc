# Final Week Completion Mode and C-suite Advisor Framework

## 1. Purpose

This document is the source-of-truth framework for the next implementation phase of Renni Command Center.

The next phase is not about adding more complexity. It is about helping students finish meaningful work and helping chiefs manage execution. The platform already has strong building blocks: Template Studios, section recipes, structured evidence, builders, finance tables, operations checklists, dependency hints, Project Navigator signals, and read-only advisor foundations.

The immediate need is to reduce the hunt. Students should open the app, see what matters first, know what they are making, know how to start, know when they are done, and know who reviews it. Chiefs should know what is late, blocked, weak, or missing, and what to say to move the team forward.

Core principle:

> Do not reduce rigor. Reduce the hunt.

## 2. Current Readiness Verdict

Current verdict: **powerful platform, student-completion risk still present**.

What is strong:

- The app has real operating-system capability for a student company.
- Structured evidence raises the professional standard.
- Finance tables, operations checklists, and builder handoffs are moving sections toward the right interaction type.
- Project Navigator gives chiefs/admins a useful read-only management view.
- The Executive Advisor server foundation is safety-aware and mutation-free.

What is still risky:

- Students can still see too much system complexity before they see the next best action.
- Some sections still feel like open writing tasks when the artifact should be a table, checklist, memo, or pitch.
- Chiefs need stronger management guidance: what to push on, why it matters, who owns it, and what “done” means.
- Final-week clarity is now more important than additional engines.

Priority:

1. Finish critical student work.
2. Make P0 work visible and actionable.
3. Give chiefs a management coach.
4. Defer nonessential builders until the final-week flow is stable.

## 3. Final Week Completion Mode

### Student Goal

A student should be able to open the home dashboard and answer:

- What do I need to do first?
- What am I making?
- Where do I click?
- What does good enough look like?
- Who reviews this?

### Teacher Goal

The teacher should be able to see whether the final outputs are viable without translating every section page:

- TechTown pop-up readiness
- Brand & Operations Playbook readiness
- Phoenix Nest retail carry pitch readiness
- Missing owners, missing evidence, and missing review targets

### Chief Goal

Chiefs should see a management lane, not just a list of pages:

- What is late
- What is blocked
- What is weak
- What is missing
- Who owns the next action
- What to check before approving

### P0/P1/P2 Logic

| Priority | Meaning | Student treatment | Chief/admin treatment |
|---|---|---|---|
| P0 | Must finish for final output viability | Show first, with owner, reviewer, due date, and done signal | Treat as management priority and Project Navigator signal |
| P1 | Important if time allows | Show after P0 or inside chapter view | Track as quality improvement |
| P2 | Next-cohort or polish | Keep available but not dominant | Mention only when P0/P1 is stable |

### Home Dashboard

The home dashboard should show:

- Final Week Completion panel
- P0 sections grouped by lane
- My Next Actions
- Due date and reviewer
- Done signal
- Link to exact section route
- Safe empty states if no tasks are assigned

### Department And Chief Surfaces

Department and chief surfaces should show:

- P0 lane health
- Missing task coverage
- Blocked or stale P0 sections
- Pending reviews
- Sections with weak or missing evidence
- Links to exact sections

### What Should Not Be Automated

Final Week Completion Mode must not:

- Create tasks automatically
- Assign students automatically
- Submit work
- Approve work
- Change statuses
- Hide unfinished work
- Silently overwrite student writing
- Create product, sale, inventory, or finance records

## 4. P0/P1/P2 Section Map

P0 rows are the default final-week must-finish sections. P1 and P2 sections remain available in Template Studios, but they should not dominate the home dashboard during final-week mode unless a teacher/chief intentionally promotes them.

Route pattern:

`/deliverables/{chapterId}/sections/{sectionId}`

| Priority | Lane | Playbook chapter | Section id | Section title | Owner | Reviewer | Dependency | Definition of done | First action | Artifact type | Route/link target |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P0 | Executive launch summary | Ch. 1 Executive Summary | launch-focus | What are we launching, and where? | Co-CEOs | Instructor/Admin | Product list | Launch focus names products, audience, location, and success measure | Name what launches where | Summary | `/deliverables/ch-01-executive-summary/sections/launch-focus` |
| P0 | Executive launch summary | Ch. 1 Executive Summary | current-progress | What is currently in the lineup? | Co-CEOs | Instructor/Admin | Product and task status | Ready/not ready status is clear for each major lane | List what is ready and blocked | Status table | `/deliverables/ch-01-executive-summary/sections/current-progress` |
| P0 | Executive launch summary | Ch. 1 Executive Summary | key-risks | What are the open questions or risks? | Co-CEOs | Instructor/Admin | Launch readiness | Top risks have owner, impact, and mitigation | Add top risks | Risk register | `/deliverables/ch-01-executive-summary/sections/key-risks` |
| P0 | Executive launch summary | Ch. 1 Executive Summary | next-steps | What happens next before launch? | Co-CEOs | Instructor/Admin | P0 status | Next actions have owner, due date, dependency, and done signal | Build next-step list | Action checklist | `/deliverables/ch-01-executive-summary/sections/next-steps` |
| P0 | BMC core | Ch. 4 Business Model Canvas | customer-segments | Customer Segments | Strategy and Growth | Co-CEOs | Customer evidence | At least one clear House Phoenix customer profile with evidence | Open Customer Builder | Customer profile | `/deliverables/ch-04-business-model-canvas/sections/customer-segments` |
| P0 | BMC core | Ch. 4 Business Model Canvas | value-propositions | Value Propositions | Strategy and Growth | Co-CEOs | Customer segments | Value proposition connects customer pain/gain to product value and proof | Connect customer to value | Value proposition memo | `/deliverables/ch-04-business-model-canvas/sections/value-propositions` |
| P0 | BMC core | Ch. 4 Business Model Canvas | channels | Channels | CMO | Co-CEOs | Product list and audience | Sales and marketing channels are separated from activities | Sort the channels | Channel map | `/deliverables/ch-04-business-model-canvas/sections/channels` |
| P0 | BMC core | Ch. 4 Business Model Canvas | revenue-streams | Revenue Streams | CFO | Co-CEOs | Product list and pricing | Revenue table names streams, assumptions, and launch relevance | Fill revenue table | Finance table | `/deliverables/ch-04-business-model-canvas/sections/revenue-streams` |
| P0 | BMC core | Ch. 4 Business Model Canvas | key-activities | Key Activities | COO | Co-CEOs | Business model | 5-7 repeatable Renni Inc. activities with reasons | Choose key activities | Activity builder output | `/deliverables/ch-04-business-model-canvas/sections/key-activities` |
| P0 | BMC core | Ch. 4 Business Model Canvas | cost-structure | Cost Structure | CFO | Co-CEOs | Unit cost and resources | Cost table separates known costs from assumptions | Fill cost table | Finance table | `/deliverables/ch-04-business-model-canvas/sections/cost-structure` |
| P0 | House Phoenix brand | Ch. 5 House Phoenix Brand Book | audience | Audience | CMO | Co-CEOs | Customer segments | Brand audience is clear and connected to product decisions | Define the audience | Brand audience note | `/deliverables/ch-05-house-phoenix-brand-book/sections/audience` |
| P0 | House Phoenix brand | Ch. 5 House Phoenix Brand Book | value-proposition | Value Proposition | CMO | Co-CEOs | BMC value proposition | Brand promise is specific, believable, and proof-backed | State the promise | Brand promise | `/deliverables/ch-05-house-phoenix-brand-book/sections/value-proposition` |
| P0 | House Phoenix brand | Ch. 5 House Phoenix Brand Book | voice | Voice | CMO | Co-CEOs | Brand audience | Voice rules include do, don't, and example copy | Choose voice rules | Brand rule card | `/deliverables/ch-05-house-phoenix-brand-book/sections/voice` |
| P0 | House Phoenix brand | Ch. 5 House Phoenix Brand Book | identity | Identity | CMO | Co-CEOs | Brand audience and products | Visual direction has color, type, image, and do/don't notes | Choose identity rules | Brand rule card | `/deliverables/ch-05-house-phoenix-brand-book/sections/identity` |
| P0 | Product and pricing | Ch. 7 Product Line and Pricing | product-list | Product List | COO/CFO | Co-CEOs | Instructor product list if available | Product catalog includes launch products and status | Fill product table | Product catalog | `/deliverables/ch-07-current-product-line-and-pricing/sections/product-list` |
| P0 | Product and pricing | Ch. 7 Product Line and Pricing | pricing-summary | Pricing Summary | CFO | Co-CEOs | Unit cost and sale price | Prices are listed with rationale and assumptions | Review pricing | Pricing table | `/deliverables/ch-07-current-product-line-and-pricing/sections/pricing-summary` |
| P0 | Product and pricing | Ch. 7 Product Line and Pricing | margin-and-break-even | Margin and Break-even | CFO | Co-CEOs | Cost and price | Margin and break-even are calculated for key products | Fill calculator | Calculation table | `/deliverables/ch-07-current-product-line-and-pricing/sections/margin-and-break-even` |
| P0 | Product and pricing | Ch. 7 Product Line and Pricing | inventory-readiness | Inventory Readiness | COO | Co-CEOs | Product list | Inventory state is known or missing data is named | Fill readiness table | Inventory table | `/deliverables/ch-07-current-product-line-and-pricing/sections/inventory-readiness` |
| P0 | Product and pricing | Ch. 7 Product Line and Pricing | retail-recommendations | Retail Recommendations | CFO/CMO | Co-CEOs | Pricing and inventory | Recommended retail items have product, margin, readiness, and proof | Recommend carry items | Retail recommendation | `/deliverables/ch-07-current-product-line-and-pricing/sections/retail-recommendations` |
| P0 | Finance | Ch. 8 Finance and Revenue Model | unit-cost | Unit Cost | CFO | Co-CEOs | Product list | Unit costs are entered or missing data is clearly marked | Fill cost rows | Finance table | `/deliverables/ch-08-finance-and-revenue-model/sections/unit-cost` |
| P0 | Finance | Ch. 8 Finance and Revenue Model | sale-price | Sale Price | CFO | Co-CEOs | Unit cost | Sale price includes margin logic and assumptions | Set sale price | Pricing decision | `/deliverables/ch-08-finance-and-revenue-model/sections/sale-price` |
| P0 | Finance | Ch. 8 Finance and Revenue Model | planned-quantity | Planned Quantity | COO/CFO | Co-CEOs | Inventory | Planned quantity is stated with assumption or evidence | Enter quantities | Quantity table | `/deliverables/ch-08-finance-and-revenue-model/sections/planned-quantity` |
| P0 | Finance | Ch. 8 Finance and Revenue Model | break-even | Break-even | CFO | Co-CEOs | Cost and price | Break-even math is visible and defensible | Calculate break-even | Calculation table | `/deliverables/ch-08-finance-and-revenue-model/sections/break-even` |
| P0 | Finance | Ch. 8 Finance and Revenue Model | revenue-scenarios | Revenue Scenarios | CFO | Co-CEOs | Quantity and price | Low/base/high scenarios include assumptions | Build scenarios | Scenario table | `/deliverables/ch-08-finance-and-revenue-model/sections/revenue-scenarios` |
| P0 | Operations | Ch. 9 Operations | inventory | Inventory | COO | Co-CEOs | Product list | Inventory tracker names quantity, owner, location, and risk | Check inventory | Inventory tracker | `/deliverables/ch-09-operations/sections/inventory` |
| P0 | Operations | Ch. 9 Operations | day-of-sop | Day-of SOP | COO | Co-CEOs | Launch details | Day-of checklist is executable by time and owner | Build day-of checklist | SOP checklist | `/deliverables/ch-09-operations/sections/day-of-sop` |
| P0 | Operations | Ch. 9 Operations | baked-goods-sop | Baked Goods SOP | COO | Co-CEOs | Humble Oven product plan | Baked goods handling is clear before, during, and after event | Build baked goods checklist | SOP checklist | `/deliverables/ch-09-operations/sections/baked-goods-sop` |
| P0 | Operations | Ch. 9 Operations | continuity | Continuity | COO | Co-CEOs | Operations outputs | Handoff checklist tells next team where things are and what to do | Build handoff checklist | SOP checklist | `/deliverables/ch-09-operations/sections/continuity` |
| P0 | Marketing | Ch. 10 Marketing | target-customers | Target Customers | CMO | Co-CEOs | Customer segments | Campaign audience has product fit and evidence | Open Market Fit | Audience decision | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/target-customers` |
| P0 | Marketing | Ch. 10 Marketing | insight-evidence | Insight Evidence | CMO | Co-CEOs | Customer feedback | Evidence entries support campaign claims | Add evidence entries | Structured evidence table | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/insight-evidence` |
| P0 | Marketing | Ch. 10 Marketing | feedback-plan | Feedback Plan | CMO | Co-CEOs | Launch plan | Feedback plan names questions, method, timing, and owner | Build feedback checklist | Feedback checklist | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/feedback-plan` |
| P0 | Marketing | Ch. 10 Marketing | touchpoints | Touchpoints | CMO | Co-CEOs | Channels | Before/during/after touchpoints are assigned | Map touchpoints | Campaign map | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/touchpoints` |
| P0 | Marketing | Ch. 10 Marketing | messaging | Messaging | CMO | Co-CEOs | Brand voice and audience | Messages include audience, angle, call to action, and proof | Draft message set | Campaign copy | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/messaging` |
| P0 | Marketing | Ch. 10 Marketing | measurement | Measurement | CMO | Co-CEOs | Campaign plan | Metrics are measurable and tied to launch learning | Choose metrics | KPI table | `/deliverables/ch-10-marketing-and-campaign-playbook/sections/measurement` |
| P0 | Phoenix Nest pitch | Ch. 11 Phoenix Nest Retail Carry Pitch | identity | Identity | Co-CEOs/CMO | Instructor/Admin | Brand/product story | Phoenix Nest identity is clear to a retail buyer | Define buyer-facing identity | Pitch section | `/deliverables/ch-11-phoenix-nest-retail-carry-pitch/sections/identity` |
| P0 | Phoenix Nest pitch | Ch. 11 Phoenix Nest Retail Carry Pitch | evidence | Evidence | Strategy and Growth | Co-CEOs | Sales/customer proof | Pitch evidence includes claim, source, confidence, and risk | Add proof entries | Structured evidence table | `/deliverables/ch-11-phoenix-nest-retail-carry-pitch/sections/evidence` |
| P0 | Phoenix Nest pitch | Ch. 11 Phoenix Nest Retail Carry Pitch | offer | Offer | CFO/COO | Co-CEOs | Product, pricing, inventory | Offer names SKUs, price/margin logic, and readiness | Build offer table | Retail offer | `/deliverables/ch-11-phoenix-nest-retail-carry-pitch/sections/offer` |
| P0 | Phoenix Nest pitch | Ch. 11 Phoenix Nest Retail Carry Pitch | ask | Ask | Co-CEOs | Instructor/Admin | Offer and evidence | The ask is concrete and includes next step | Write the ask | Buyer ask | `/deliverables/ch-11-phoenix-nest-retail-carry-pitch/sections/ask` |
| P0 | Strategy | Ch. 12 Strategy and Next-Semester Recommendations | what-we-learned | What We Learned | Strategy and Growth | Co-CEOs | Launch/customer evidence | Lessons cite evidence and lead to next action | Write top lessons | Strategy memo | `/deliverables/ch-12-strategy-and-next-semester-recommendations/sections/what-we-learned` |
| P0 | Strategy | Ch. 12 Strategy and Next-Semester Recommendations | customer-and-sales-insights | Customer and Sales Insights | Strategy and Growth | Co-CEOs | Sales/customer data | Insights separate evidence from assumptions | Add insight evidence | Structured evidence table | `/deliverables/ch-12-strategy-and-next-semester-recommendations/sections/customer-and-sales-insights` |
| P0 | Strategy | Ch. 12 Strategy and Next-Semester Recommendations | next-semester-goals | Next-Semester Goals | Strategy and Growth | Co-CEOs | Lessons and KPIs | Goals have metric, owner, and deadline | Set goals | Goal table | `/deliverables/ch-12-strategy-and-next-semester-recommendations/sections/next-semester-goals` |
| P0 | Strategy | Ch. 12 Strategy and Next-Semester Recommendations | recommended-action-plan | Recommended Action Plan | Co-CEOs | Instructor/Admin | Strategy sections | Action plan has owner, due date, dependency, and done signal | Write action memo | Strategy memo | `/deliverables/ch-12-strategy-and-next-semester-recommendations/sections/recommended-action-plan` |
| P0 | Handoff | Ch. 13 Decision Log and Appendices | major-decisions | Major Decisions | Co-CEOs | Instructor/Admin | Decision history | Major decisions are recorded with owner and date | Add decisions | Decision memo | `/deliverables/ch-13-decision-log-and-appendices/sections/major-decisions` |
| P0 | Handoff | Ch. 13 Decision Log and Appendices | decision-rationale | Decision Rationale | Co-CEOs | Instructor/Admin | Major decisions | Rationale names evidence, tradeoff, and risk | Explain decisions | Decision memo | `/deliverables/ch-13-decision-log-and-appendices/sections/decision-rationale` |
| P0 | Handoff | Ch. 13 Decision Log and Appendices | templates-and-links | Templates and Links | COO | Co-CEOs | Final files/assets | Useful templates and links are named with purpose | Add links/templates | Link checklist | `/deliverables/ch-13-decision-log-and-appendices/sections/templates-and-links` |
| P0 | Handoff | Ch. 13 Decision Log and Appendices | next-cohort-instructions | Next-Cohort Instructions | Co-CEOs | Instructor/Admin | Ch. 12 and Ch. 13 | Next team can start without teacher translation | Write instructions | Handoff checklist | `/deliverables/ch-13-decision-log-and-appendices/sections/next-cohort-instructions` |

## 5. P0 Task Template Standard

Task templates are static guidance for manual seeding or display-only planning. They do not create tasks automatically.

Recommended shape:

```ts
type FinalWeekTaskTemplate = {
  title: string
  owner: string
  dueDate: string
  dependency: string
  definitionOfDone: string
  reviewer: string
  playbookChapter: string
  sectionId: string
  priority: "P0" | "P1" | "P2"
  suggestedLane: string
  creationTiming: "manual-now" | "manual-later" | "never"
}
```

Rules:

- No automatic task creation in this phase.
- No hidden assignments.
- No status mutation.
- Templates may appear as guidance or be manually seeded by Instructor/Admin.
- Every P0 task must include owner, reviewer, due date, dependency, and definition of done.

Example:

```ts
{
  title: "Finish Customer Segments for House Phoenix",
  owner: "Strategy and Growth",
  dueDate: "Final week",
  dependency: "Customer evidence or clear assumption",
  definitionOfDone: "At least one profile is drafted, edited in student language, supported by evidence or assumption, and saved.",
  reviewer: "Co-CEOs",
  playbookChapter: "Ch. 4 Business Model Canvas",
  sectionId: "customer-segments",
  priority: "P0",
  suggestedLane: "BMC core",
  creationTiming: "manual-now"
}
```

## 6. Section UX Standard

Every P0 section page should show these items before deeper guidance:

1. **What you are making**
2. **Start here**
3. **Done when**
4. **Who reviews it**
5. **Minimum viable answer**
6. **Strong answer pattern**
7. **Evidence expectation**
8. **Builder/table/checklist/prompt type**

Preferred first actions:

- Fill this table
- Build this checklist
- Choose from these options
- Answer these 3 prompts
- Add evidence entries
- Write this decision memo
- Copy builder output into Working Draft
- Ask your chief for missing input

Regular students should see the simplest next action first. Chiefs/admins should still see review context, dependencies, requirement coverage, and evidence weakness.

## 7. Minimum Viable Answer Rule

If stuck, submit:

> 3 clear sentences, 1 source or assumption, 1 risk, and 1 next step.

This applies to open writing sections where a student might freeze.

It does not replace required structured artifacts. If the section is a finance table, inventory tracker, checklist, decision memo, or structured evidence table, the student must still complete the required structure. The minimum viable rule is a recovery path for writing, not permission to skip the artifact.

## 8. Builder-To-Working-Draft Handoff Standard

Universal handoff pattern:

1. Use the builder, table, or checklist.
2. Copy the useful output.
3. Paste it into Working Draft.
4. Edit in your own words.
5. Add evidence for major claims.
6. Save.
7. Submit only when ready for review.

Required student-facing copy:

> This tool helps you think. It does not submit or approve your work. Copy useful output into Working Draft, revise it in your own words, add evidence for major claims, then save.

## 9. C-suite Advisor V1 Purpose

The C-suite Advisor is a management coach for chiefs. It helps chiefs direct execution. It is not a student work generator.

Allowed:

- Tell chiefs what is late, blocked, weak, or missing
- Tell chiefs who owns what
- Give exact next action
- Give exact language to say to teammates
- Help run the room
- Help define done
- Help check approval readiness
- Explain dependencies
- Identify missing task coverage

Not allowed:

- No auto-approval
- No auto-submit
- No hidden task creation
- No status mutation
- No invented facts
- No student deliverable replacement
- No POS, payment, checkout, tax, refund, or inventory decrement behavior
- No Google Drive or OAuth integration

## 10. Advisor Modes

### Daily Chief Brief

- **Purpose:** Answer “What should I push on today?”
- **Prompt:** “What should I push on today?”
- **Data inputs:** P0 map, deliverables, tasks, due dates, blocked/stale status, Project Navigator signals, evidence weakness
- **Output format:** Top 5 priorities with owner, due date, dependency, section link, exact next action, chief language, done signal, risk
- **Example action card:** “Finish revenue scenarios today. Owner: CFO. Say: ‘Give me low/base/high scenarios with assumptions before the end of class.’ Done when the table is saved and assumptions are labeled.”
- **Priority:** P0
- **Implementation complexity:** Medium

### Run the Room

- **Purpose:** Help a chief use a 45-minute class period well.
- **Prompt:** “I have 45 minutes of class. How should I use it?”
- **Data inputs:** P0 sections, owners, blocked tasks, pending reviews, lane health
- **Output format:** first 5 minutes, next 15 minutes, next 20 minutes, final 5 minutes, lane checks, exit ticket
- **Example action card:** “First 5 minutes: assign CFO to pricing table, COO to inventory checklist, CMO to messaging. Final 5 minutes: each chief names saved artifact and blocker.”
- **Priority:** P0
- **Implementation complexity:** Medium

### Section Rescue

- **Purpose:** Help a chief improve a weak section.
- **Prompt:** “This section is weak. What do I tell the team?”
- **Data inputs:** section recipe, output summary, structured evidence, reviewer standard, dependency hints
- **Output format:** missing pieces, minimum viable answer, better structure, evidence needed, teammate instruction
- **Example action card:** “Customer Segments is weak because it names a buyer but gives no evidence. Ask the student: ‘What makes this customer likely to buy House Phoenix, and what evidence or assumption supports that?’”
- **Priority:** P0
- **Implementation complexity:** Medium

### Task Coverage Doctor

- **Purpose:** Identify missing P0 task coverage.
- **Prompt:** “Are we missing tasks?”
- **Data inputs:** P0 map, current tasks, deliverable IDs, section IDs, owners, due dates
- **Output format:** missing task title, owner, due date, dependency, definition of done, reviewer, manual-now/manual-later
- **Example action card:** “Missing task: Finish Phoenix Nest offer. Owner: CFO/COO. Done when SKU, price, margin, inventory readiness, and risk are saved.”
- **Priority:** P0
- **Implementation complexity:** Medium

### Approval Coach

- **Purpose:** Help chiefs decide whether a section is ready for review.
- **Prompt:** “Should I approve this?”
- **Data inputs:** output readiness, final text, structured evidence summary, requirement coverage, approval rubric
- **Output format:** complete, accurate, reviewed by chief, correct format, evidence, recommended decision
- **Example action card:** “Return for revision. The answer has a price but no assumption for unit cost, so the margin is not defensible.”
- **Priority:** P1
- **Implementation complexity:** Medium

### Dependency Explainer

- **Purpose:** Explain why work is blocked and how to unblock it.
- **Prompt:** “Why is this blocked?”
- **Data inputs:** dependency hints, blocked tasks, missing upstream sections, downstream affected sections
- **Output format:** upstream missing work, downstream impact, section to open, teammate to ask, 15-minute unblock plan
- **Example action card:** “Pricing Summary is blocked by Unit Cost. Ask CFO to enter known or assumed unit cost for one product, then return to pricing.”
- **Priority:** P1
- **Implementation complexity:** Small

### Phoenix Nest Pitch Coach

- **Purpose:** Help leaders decide whether the retail carry pitch is ready.
- **Prompt:** “Are we ready to pitch Phoenix Nest?”
- **Data inputs:** product catalog, pricing, inventory, customer evidence, Ch. 11 identity/evidence/offer/ask
- **Output format:** buyer proof, SKU offer, margin story, inventory readiness, risk, next 3 fixes
- **Example action card:** “Not ready yet. Offer names products but does not show margin or inventory readiness. Fix offer table before pitching.”
- **Priority:** P1
- **Implementation complexity:** Medium

### Final Week Triage

- **Purpose:** Tell chiefs what can realistically finish this week.
- **Prompt:** “What can we realistically finish this week?”
- **Data inputs:** P0/P1/P2 map, due dates, task status, output readiness, review status, blocked/stale signals
- **Output format:** must-finish, if-time, ignore-for-now, owner by lane, daily schedule, done signal
- **Example action card:** “Ignore supporting brand polish until P0 finance, operations, and Phoenix Nest offer are saved.”
- **Priority:** P0
- **Implementation complexity:** Medium

## 11. Advisor Context Architecture

Recommended future type:

```ts
type ExecutiveAdvisorContext = {
  role: string
  mode: string
  today: string
  finalOutputs: string[]
  activeLanes: Array<{
    lane: string
    owner: string
    status: string
  }>
  deliverableSummaries: Array<{
    id: string
    title: string
    chapter: string
    status: string
    owner?: string
    reviewer?: string
    dueDate?: string
  }>
  taskSummaries: Array<{
    id: string
    title: string
    sectionId?: string
    owner?: string
    status: string
    dueDate?: string
    dependency?: string
    definitionOfDone?: string
  }>
  sectionSummaries: Array<{
    chapterId: string
    sectionId: string
    title: string
    priority: "P0" | "P1" | "P2"
    artifact: string
    recommendedInteraction: string
    readiness: string
  }>
  priorityMap: Array<{
    priority: "P0" | "P1" | "P2"
    lane: string
    chapterId: string
    sectionId: string
    owner: string
    reviewer: string
    definitionOfDone: string
  }>
  dependencySignals: Array<{
    sectionId: string
    missingUpstream: string
    downstreamImpact: string
  }>
  readinessSignals: Array<{
    sectionId: string
    signal: string
    severity: "high" | "medium" | "low"
  }>
  structuredEvidenceSummary: Array<{
    sectionId: string
    evidenceCount: number
    weakClaims: string[]
    missingSources: string[]
  }>
  taskCoverageGaps: Array<{
    sectionId: string
    missingTaskTitle: string
    suggestedOwner: string
    suggestedDueDate: string
    definitionOfDone: string
  }>
  productCatalogSummary: Array<{
    product: string
    hasCost: boolean
    hasPrice: boolean
    hasInventory: boolean
  }>
  guardrails: string[]
}
```

Can be derived now:

- Deliverable summaries
- Task summaries
- Template Studio section metadata
- P0/P1/P2 map
- Dependency hints
- Project Navigator signals
- Structured evidence counts
- Product catalog options
- Existing output readiness signals

Missing or thin:

- Full task coverage gap utility
- Section-level reviewer map for every P0 row
- Compact output summaries for focused section rescue
- Approval-coach rubric per artifact type

Defer:

- Hidden task creation
- Status writeback
- Approval decisions
- Full raw draft ingestion across all sections
- External files
- Product sales or sale-record integrations

Future code locations:

- `server/utils/executiveAdvisorContext.ts`
- `app/types/executiveAdvisor.ts`

## 12. Advisor Action Card Schema

```ts
type AdvisorActionCard = {
  title: string
  priority: "P0" | "P1" | "P2"
  whyItMatters: string
  owner: string
  dueDate: string
  dependency: string
  playbookChapter: string
  sectionLink?: string
  exactNextAction: string
  whatChiefShouldSay: string
  doneSignal: string
  riskIfIgnored: string
  sourceIds: string[]
  humanReviewRequired: true
}
```

Required behavior:

- Every card must be grounded in context.
- Unknowns must be marked explicitly.
- The Advisor may recommend manual task titles but must not create them.
- The Advisor may recommend returning work for revision but must not approve or reject.

## 13. Implementation Order

### Phase 0: Immediate Final-Week Clarity

1. Final Week Completion Mode
2. P0 task templates
3. P0 first-action compression
4. Structured evidence example
5. Builder handoff standard

### Phase 1: Chief Management Layer

1. Advisor context V2
2. Advisor mode expansion
3. Advisor action cards
4. Project Navigator task coverage gaps

### Phase 2: Section-Specific Improvements

1. Section-specific UI improvements
2. BMC category micro-builders
3. Phoenix Nest pitch builder
4. Brand System builder
5. Decision Memo builder

## 14. Guardrails

Do not build this week:

- POS, payment, checkout, tax, refund, or inventory decrement behavior
- Google Drive or OAuth integration
- Automatic task creation
- Automatic approvals
- Automatic submissions
- Silent status changes
- Hidden assignments
- AI-generated student deliverable replacement
- Large visual redesigns not tied to P0 completion
- New dependencies
- Firestore rules changes
- Auth changes

Square may be referenced only as an external point-of-sale system outside Renni Command Center.

## 15. Exact Next Implementation Prompts

### Claude Prompt: Final Week Completion Mode

```text
You are working in the existing Renni Command Center repo.

This is an implementation pass, not greenfield.

Goal:
Build Final Week Completion Mode and P0 section/task readiness without changing Auth, Firebase config, Firestore rules, routes, package dependencies, or approval/status behavior.

Implement:
1. A P0/P1/P2 section priority map for the final week.
2. A FinalWeekCompletionPanel on the home dashboard that shows:
   - P0 must-finish sections
   - owner/reviewer
   - due date
   - dependency
   - definition of done
   - link to section
   - current task/status signal if available
3. Static P0 task template data, but do NOT auto-create tasks.
4. Section page first-action compression for P0 sections:
   - What you are making
   - Start here
   - Done when
   - Who reviews it
5. Add one model structured-evidence example for regular students.
6. Standardize builder handoff copy:
   - copy into Working Draft
   - edit in your own words
   - add evidence
   - save
   - builder does not submit or approve

Guardrails:
- No automatic task creation.
- No status mutation.
- No submit/approval changes.
- No POS, payment, checkout, tax, refund, or inventory decrement behavior.
- No Google Drive or OAuth integration.
- Use Playbook language.

Files to inspect:
app/data/templateStudios/*
app/utils/studentNextActions.ts
app/components/SectionRecipePanel.vue
app/components/DeliverableOutputWorkspace.vue
app/pages/index.vue
app/pages/c-suite/project-navigator.vue
app/utils/projectNavigatorSignals.ts

Run:
npm run typecheck || true
NITRO_PRESET=node-server npm run build

Return changed files, behavior summary, and test results.
```

### Claude Prompt: C-suite Advisor V1

```text
You are working in the existing Renni Command Center repo.

Goal:
Upgrade the Executive Advisor into a read-only C-suite management coach.

Do not mutate tasks, deliverables, outputs, approvals, statuses, Firestore rules, Auth, routes, env vars, or package dependencies.

Implement Advisor V1 with:
1. Server-side ExecutiveAdvisorContext V2 including:
   - role
   - mode
   - deliverable summaries
   - task summaries
   - section summaries
   - P0/P1/P2 priority map
   - dependency signals
   - readiness signals
   - structured evidence summary
   - task coverage gaps
   - product catalog summary
   - guardrails
2. Add advisor modes:
   - Daily Chief Brief
   - Run the Room
   - Section Rescue
   - Task Coverage Doctor
   - Approval Coach
   - Dependency Explainer
   - Phoenix Nest Pitch Coach
   - Final Week Triage
3. Return action cards with:
   - title
   - priority
   - why it matters
   - owner
   - due date
   - dependency
   - Playbook chapter
   - section link
   - exact next action
   - what the chief should say
   - done signal
   - risk if ignored
   - source IDs
   - humanReviewRequired: true
4. Use only provided context.
5. Mark unknowns explicitly.
6. Never approve, submit, change status, create tasks, or claim work is done.

Use existing server/api/ai/executive-advisor.post.ts and server utilities.
Keep invocation metadata logging only.
No hidden mutations.

Run:
npm run typecheck || true
NITRO_PRESET=node-server npm run build

Return changed files, mode list, context fields, and guardrail verification.
```

### Codex Verification Prompt

```text
Audit the latest Renni Command Center branch after Final Week Completion Mode and Executive Advisor V1.

Review-only. Do not edit files.

Verify:
1. FinalWeekCompletionPanel renders on home.
2. P0/P1/P2 map includes all required final-week sections.
3. No automatic task creation occurs.
4. No submit/approval/status mutation changed.
5. P0 section pages show artifact, start action, done signal, reviewer.
6. Builder handoff copy is consistent.
7. Structured evidence example appears without blocking submit.
8. Project Navigator shows missing P0 task coverage as display-only.
9. Executive Advisor V1 has all 8 modes.
10. Advisor context is read-only and grounded in provided data.
11. Advisor does not approve, submit, create tasks, mutate statuses, or invent facts.
12. No POS, payment, checkout, tax, refund, or inventory decrement behavior exists.
13. No Google Drive or OAuth drift exists.

Run:
git status --short
git log --oneline -10
rg -n "POS|checkout|refund|tax|payment|inventory decrement|decrement|googleapis|drive\\.google|docs\\.google|oauth|scope" app server firestore scripts package.json
rg -n "updateDoc|setDoc|addDoc|deleteDoc|writeBatch|runTransaction" app server
npm run typecheck || true
NITRO_PRESET=node-server npm run build

Return PASS / PASS WITH WARNINGS / FAIL with exact files and lines.
```
