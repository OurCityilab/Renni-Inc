# Student Success, UI/UX, and Operating System Audit

Date: April 30, 2026  
Branch audited: `renni-app-clean`  
Latest expected commit: `88bc4db`

## 1. Executive Readiness Verdict

Renni Command Center is a powerful student-company operating system that is close to class-ready, but its biggest risk is still student independence under time pressure. The system now has the right major building blocks: builders, structured evidence, final-week task maps, Project Navigator, task coverage visualization, and the C-suite Advisor. The next improvement is not more platform breadth. It is sharper student execution: clearer first actions, stronger examples, better mobile table behavior, and more obvious review standards.

| Area | Grade | Why | Biggest risk | Fastest improvement | Evidence from repo |
|---|---:|---|---|---|---|
| Student independence | B | Most P0 work now has a builder, table, checklist, or memo surface. | Students still may not know what counts as good work without examples. | Add P0 start cards with minimum viable answer and strong-answer pattern. | `app/components/DeliverableOutputWorkspace.vue`, `app/data/templateStudios/*.ts` |
| Student engagement | B | Interactive surfaces replaced many blank prompts. | Dense pages can still feel like school software instead of a workbench. | Add 15-minute work mode and visible next-step chips. | Universal/specialized builders in `app/components/*Builder.vue` |
| Concept learning | B+ | Builders teach through choices, not only prose. | Concepts like governance, break-even, and evidence quality need plainer inline explanation. | Add glossary chips and one model answer per P0 section. | `SectionRecipePanel.vue`, `CorporateStructureBuilder.vue`, finance builders |
| Section/task clarity | B | Final-week maps and task templates exist. | Some sections are clear as artifacts but not clearly tied to assigned student tasks. | Mirror task title, owner, reviewer, and done signal at top of section page. | `finalWeekCompletion.ts`, `finalWeekTaskTemplates.ts` |
| Builder/artifact fit | B+ | Most sections now match table/checklist/memo/builder patterns. | A few recipe-only strategy and brand sections still risk shallow writing. | Add example-first recipe blocks where no builder is needed. | Template Studio configs and builder flags |
| Chief management visibility | A- | Project Navigator plus coverage boards provide real management visibility. | Chiefs may treat coverage as certainty when task matching is conservative. | Add “coverage is a signal, not proof” copy and manual verification cues. | `taskCoverageMap.ts`, `ChiefFocusBoard.vue` |
| Advisor usefulness | B+ | Eight modes and action cards are strong management support. | Advisor is not yet a true free-form mentor unless chat/Q&A is added. | Add grounded Q&A mode using the same context and guardrails. | `executiveAdvisorContext.ts`, prompt templates |
| Task coverage visibility | A- | P0/P1/P2 task coverage is visible and deterministic. | False negatives/positives can happen from title matching. | Display matched task IDs and “missing manual task suggestion” separately. | `TaskCoverageMap.vue`, `MissingTaskCoveragePanel.vue` |
| Mobile/classroom usability | B- | Layout is workable, but tables are inherently tight on phones. | Mobile table editing may slow students during class. | Add stacked-card mode for table rows below tablet width. | Universal table and finance table builders |
| Final-output readiness | B+ | The final outputs map well to P0 sections. | Evidence quality and chief review standards remain uneven. | Add P0 review checklist and evidence example beside submit flow. | `DeliverablePlaybookPreview.vue`, structured evidence editor |
| Safety/guardrails | A- | Advisor and builders are read-only/copy-first where appropriate. | Corporate structure copy must keep educational-review posture visible. | Keep disclaimers in banner, output, recipe, dependency hint, and Advisor posture. | `CorporateStructureBuilder.vue`, prompt templates |
| Deployment/live readiness | B+ | Recent builds and audits indicate app is usable with warnings. | Advisor availability depends on deployed runtime config/provider keys. | Verify runtime config before class and keep fallback guidance visible. | Advisor API route and App Hosting config |

Overall verdict: **CLASS READY WITH WARNINGS**. Students can use the platform, but the safest next pass is a student-facing clarity pass, not another large engine.

## 2. Student Journey Audit

The student journey is materially better than the earlier state because My Next Actions, section recipes, builders, handoff callouts, structured evidence, and final-week panels reduce blank-page work. The remaining problem is consistency: every section must answer the same questions in the same place.

### Student Journey Risk List

1. A student may see several useful panels but not know which one is first.
2. Some sections show the artifact indirectly through recipe language instead of a concrete “make this” card.
3. Builder-to-Working-Draft handoff is present, but students can still copy without editing.
4. Structured Evidence is powerful, but students may add it too late or skip it.
5. Save vs submit remains a conceptual distinction students may miss.
6. Mobile tables can be usable but slow.
7. Chief review standards are not equally visible in every section.
8. Task coverage may show a missing task without making clear that it is a manual management signal.
9. Advisor is strong for chiefs but not yet an always-available mentor if provider config is missing.
10. Recipe-only sections still need examples to prevent shallow answers.

### Top 10 Places Students May Still Get Stuck

1. Deciding what to do first on a dense section page.
2. Knowing whether to use the builder or write directly in Working Draft.
3. Understanding what “good evidence” looks like.
4. Personalizing copied builder output instead of pasting it unchanged.
5. Explaining margin, break-even, and assumptions in finance sections.
6. Distinguishing Renni Inc. business model work from a one-day TechTown task.
7. Understanding corporate structure as educational planning, not real-world setup.
8. Using mobile table builders during class.
9. Knowing who reviews a section.
10. Knowing when work is ready to submit.

### Top 10 Fastest UI/UX Fixes

1. Add a P0 “Start Here” card to section pages.
2. Add owner/reviewer/due/done chips beside every P0 section title.
3. Add one model answer or output format for each P0 section.
4. Add a minimum viable answer card: “If stuck, submit 3 clear sentences, 1 source or assumption, 1 risk, and 1 next step.”
5. Add “copy, paste, edit, evidence, save” checklist above Working Draft.
6. Add evidence examples in the structured evidence editor.
7. Add “ask your chief for missing input” prompts where dependencies are unresolved.
8. Add mobile stacked-row mode for universal and finance tables.
9. Add a submit-readiness checklist next to the submit gate.
10. Add a “next 15 minutes” student work panel on dashboard and section pages.

## 3. Section-by-Section Audit

Inventory reconciliation: 13 Template Studio chapters found, 98 sections found, 98 sections audited. All rows below use this review standard: a B+ section must show what to make, how to start, what good looks like, what evidence is needed, who reviews it, and when it is done.

| Playbook chapter | Section ID | Section title | Owner / reviewer | Artifact and final output | Current to recommended interaction | Fit / grade | Learning target | First action, minimum answer, strong answer | Evidence, done, dependency | Task and review improvement | Priority / risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ch. 1 Executive Summary | company-overview | Company Overview | Co-CEOs / instructor | Company summary for Playbook | Recipe only to example-first prompt | Partial / B- | Explain Renni Inc. clearly | Start: answer who we are. Minimum: 3-sentence company summary. Strong: names Renni Inc., brands, products, final outputs. | Evidence: current product/brand facts. Done: a reader understands the company. Dependency: brand architecture. | Add model summary and reviewer chip. | P0 / medium |
| Ch. 1 Executive Summary | launch-focus | Launch Focus | Co-CEOs / COO | Launch priority table for TechTown | Universal Table stays | Yes / B+ | Prioritize final-week launch work | Start: fill top launch priorities. Minimum: 3 rows. Strong: owner, deadline, risk, next action. | Evidence: task status. Done: priorities are actionable. Dependency: final-week map. | Add 15-minute action examples. | P0 / low |
| Ch. 1 Executive Summary | current-progress | Current Progress | Co-CEOs / chiefs | Progress snapshot for management | Universal Table stays | Yes / B | Report status honestly | Start: list completed/in-progress/blocked. Minimum: 3 rows. Strong: names proof and blocker. | Evidence: tasks/outputs. Done: leadership can triage. Dependency: task coverage. | Add status vocabulary chip. | P0 / low |
| Ch. 1 Executive Summary | key-risks | Key Risks | Co-CEOs / instructor | Risk register | Universal Table stays | Yes / B+ | Identify risk and mitigation | Start: add top 5 risks. Minimum: risk, owner, mitigation. Strong: likelihood, impact, trigger. | Evidence: source/task. Done: each risk has owner. Dependency: navigator signals. | Add severity examples. | P0 / low |
| Ch. 1 Executive Summary | next-steps | Next Steps | Co-CEOs / chiefs | Action checklist | Universal Checklist stays | Yes / B+ | Convert strategy into work | Start: add next actions. Minimum: owner/due/done. Strong: dependency and handoff. | Evidence: linked section. Done: work can be assigned. Dependency: priorities. | Add chief review standard. | P0 / low |
| Ch. 2 Brand Architecture | parent-company | Parent Company | Co-CEOs / instructor | Parent company explanation | Recipe only to simple prompt with example | Partial / B- | Parent vs brand distinction | Start: define Renni Inc. Minimum: 3 clear sentences. Strong: explains role over House Phoenix, Lumen, Notice, Humble Oven. | Evidence: brand portfolio. Done: no brand/company confusion. | Add diagram/example. | P1 / medium |
| Ch. 2 Brand Architecture | brand-portfolio | Brand Portfolio | CMO / Co-CEOs | Brand portfolio table | Universal Table stays | Yes / B+ | Compare brand roles | Start: fill brand rows. Minimum: one row per brand. Strong: audience, offer, role, status. | Evidence: product/story facts. Done: brands are distinguishable. | Add local examples. | P1 / low |
| Ch. 2 Brand Architecture | house-phoenix-role | House Phoenix Role | CMO / Co-CEOs | Flagship brand role paragraph | Recipe only to example-first prompt | Partial / B | Define flagship brand | Start: answer why House Phoenix leads. Minimum: 3 sentences. Strong: links mission, products, launch. | Evidence: current product line. Done: role is not vague. | Add strong answer sample. | P1 / medium |
| Ch. 2 Brand Architecture | supporting-brands | Supporting Brands | CMO / Co-CEOs | Supporting brand table | Universal Table stays | Yes / B+ | Explain portfolio support | Start: fill Lumen/Notice/Humble Oven rows. Minimum: role and audience. Strong: product path and next decision. | Evidence: brand sheets. Done: support roles are clear. | Add “not all brands launch now” note. | P1 / low |
| Ch. 2 Brand Architecture | brand-relationship-rules | Brand Relationship Rules | CMO / instructor | Brand system rules | BrandSystemBuilder stays | Yes / B+ | Govern cross-brand consistency | Start: write do/don't rules. Minimum: 3 rules. Strong: examples and proof. | Evidence: brand choices. Done: teammate can apply rules. | Add chief review checklist. | P1 / low |
| Ch. 2 Brand Architecture | future-brand-questions | Future Brand Questions | Strategy and Growth / Co-CEOs | Decision memo | Decision Memo stays | Yes / B+ | Separate open questions from decisions | Start: add unresolved brand decision. Minimum: options/risk/next step. Strong: criteria and evidence. | Evidence: unanswered facts. Done: next decision owner named. | Add example memo. | P2 / low |
| Ch. 2 Brand Architecture | mission | Mission | Co-CEOs / instructor | Mission statement | Recipe only to simple prompt | Partial / B | Write concise mission | Start: write one sentence. Minimum: mission plus who served. Strong: memorable and specific. | Evidence: current work. Done: team can repeat it. | Add examples/non-examples. | P1 / medium |
| Ch. 2 Brand Architecture | vision | Vision | Co-CEOs / instructor | Vision statement | Recipe only to simple prompt | Partial / B | Describe future direction | Start: write future-state sentence. Minimum: 1-2 sentences. Strong: ambitious but grounded. | Evidence: strategy sections. Done: future is understandable. | Add example. | P2 / medium |
| Ch. 2 Brand Architecture | values | Values | Co-CEOs / instructor | Values table | Universal Table stays | Yes / B+ | Translate values into behavior | Start: add values and behaviors. Minimum: 3 values. Strong: specific action examples. | Evidence: team norms. Done: values are observable. | Add behavior examples. | P1 / low |
| Ch. 2 Brand Architecture | values-in-action | Values in Action | Co-CEOs / chiefs | Values behavior table | Universal Table stays | Yes / B+ | Apply values to decisions | Start: list moments values show up. Minimum: 3 examples. Strong: includes tradeoffs. | Evidence: decision log. Done: value has action proof. | Add review prompts. | P1 / low |
| Ch. 2 Brand Architecture | decision-rules | Decision Rules | Co-CEOs / chiefs | Decision memo | Decision Memo stays | Yes / B+ | Define decision rights | Start: write rule for one decision type. Minimum: owner/criteria/escalation. Strong: examples and limits. | Evidence: governance. Done: team knows who decides. | Tie to Ch. 3. | P1 / low |
| Ch. 3 Structure and Continuity | company-roles | Company Roles | Co-CEOs / instructor | Role table | Universal Table stays | Yes / B+ | Understand operating roles | Start: fill each leadership role. Minimum: owner/responsibility. Strong: decisions, review duties. | Evidence: department map. Done: no role ambiguity. | Add reviewer defaults. | P0 / low |
| Ch. 3 Structure and Continuity | decision-rights | Decision Rights | Co-CEOs / instructor | Decision memo | Decision Memo stays | Yes / B+ | Assign authority | Start: add decision and owner. Minimum: decision/owner/escalation. Strong: criteria and example. | Evidence: governance. Done: authority is clear. | Add approval standard. | P1 / low |
| Ch. 3 Structure and Continuity | accountability-rhythm | Accountability Rhythm | COO / Co-CEOs | Operating checklist | Universal Checklist stays | Yes / B+ | Build meeting cadence | Start: fill weekly/daily checks. Minimum: owner/time/done. Strong: escalation trigger. | Evidence: class calendar. Done: cadence can run. | Add calendar example. | P0 / low |
| Ch. 3 Structure and Continuity | succession-and-handoff | Succession and Handoff | Strategy and Growth / instructor | Handoff checklist | Universal Checklist stays | Yes / B+ | Transfer knowledge | Start: list handoff items. Minimum: owner/artifact/location. Strong: next-cohort action. | Evidence: final outputs. Done: next cohort can start. | Add file/location field. | P1 / low |
| Ch. 3 Structure and Continuity | recognition-and-credit | Recognition and Credit | Co-CEOs / instructor | Credit policy paragraph | Recipe only to decision memo | Partial / B- | Define fair recognition | Start: write recognition rule. Minimum: who gets credit and why. Strong: edge cases. | Evidence: role contributions. Done: fair and transparent. | Convert to memo/table. | P2 / medium |
| Ch. 3 Structure and Continuity | continuity-risks | Continuity Risks | Strategy and Growth / Co-CEOs | Risk table | Universal Table stays | Yes / B+ | Spot handoff risk | Start: list risks. Minimum: risk/owner/mitigation. Strong: trigger and next cohort impact. | Evidence: missing docs/tasks. Done: risk has action. | Add severity examples. | P1 / low |
| Ch. 3 Structure and Continuity | next-cohort-playbook | Next Cohort Playbook | Strategy and Growth / instructor | Strategy memo | StrategyMemoBuilder stays | Yes / B+ | Turn lessons into onboarding | Start: write first 30-day actions. Minimum: 3 actions. Strong: owner, dependency, proof. | Evidence: current work. Done: next cohort can use it. | Add model memo. | P1 / low |
| Ch. 3 Structure and Continuity | corporate-structure-and-ownership | Corporate Structure and Ownership | Co-CEOs / adult reviewer | Educational draft ownership model | CorporateStructureBuilder stays | Yes / B | Learn governance and ownership safely | Start: compare models and draft questions. Minimum: draft model plus review questions. Strong: 70/30 model, vesting, governance, exit rules clearly marked draft. | Evidence: assumptions and adult review. Done: educational draft only. | Keep disclaimers prominent and add example output. | P1 / high |
| Ch. 4 Business Model Canvas | customer-segments | Customer Segments | CMO / Co-CEOs | Customer profiles | CustomerProfileBuilder + CustomerArchetypePicker stays | Yes / A- | Segment customers using national archetypes and local context | Start: pick archetype hypothesis. Minimum: one profile. Strong: needs, objections, evidence, local application. | Evidence: observation/sales/interviews. Done: profile explains fit. | Add archetype validation reminder. | P0 / low |
| Ch. 4 Business Model Canvas | value-propositions | Value Propositions | CMO / Co-CEOs | Value proposition statements | Recipe only to value proposition micro-builder | Partial / B- | Match offer to customer need | Start: choose customer and pain/gain. Minimum: one value proposition. Strong: proof and alternative. | Evidence: profile and product data. Done: customer benefit is clear. | Build VP Fit Engine later; add example now. | P0 / medium |
| Ch. 4 Business Model Canvas | channels | Channels | CMO / COO | Channel table | Universal Table stays | Yes / B+ | Distinguish channels from activities | Start: list how customers hear/buy/receive. Minimum: 3 channels. Strong: role, owner, proof. | Evidence: campaign/TechTown/Phoenix Nest. Done: channels are not tasks. | Add channel vs activity warning. | P0 / low |
| Ch. 4 Business Model Canvas | customer-relationships | Customer Relationships | CMO / Co-CEOs | Relationship table | Universal Table stays | Yes / B | Plan retention/support | Start: list relationship moments. Minimum: 3 moments. Strong: tone, owner, follow-up. | Evidence: feedback plan. Done: customer feels supported. | Add examples. | P1 / low |
| Ch. 4 Business Model Canvas | revenue-streams | Revenue Streams | CFO / Co-CEOs | Revenue table | FinanceTable stays | Yes / B+ | Identify how money comes in | Start: add revenue streams. Minimum: product/donation/retail rows. Strong: assumptions and confidence. | Evidence: price/product. Done: streams are quantified. | Add missing-data labels. | P0 / low |
| Ch. 4 Business Model Canvas | key-activities | Key Activities | COO / Co-CEOs | Key activity builder output | KeyActivitiesBuilder stays | Yes / B+ | Separate repeatable business work from event tasks | Start: pick repeatable activities. Minimum: 5 activities with reasons. Strong: category, owner, dependency. | Evidence: operations sections. Done: activities continue beyond TechTown. | Keep event-task warning. | P0 / low |
| Ch. 4 Business Model Canvas | key-resources | Key Resources | COO / Co-CEOs | Resource table | Universal Table stays | Yes / B+ | Name repeatable resources | Start: list resources. Minimum: resource/why/owner. Strong: missing resource risk. | Evidence: activities/inventory. Done: resources support activities. | Add dependency hint. | P0 / low |
| Ch. 4 Business Model Canvas | key-partners | Key Partners | Co-CEOs / instructor | Partner table | Universal Table stays | Yes / B+ | Identify enabling relationships | Start: list partners. Minimum: partner/value/ask. Strong: mutual benefit and next step. | Evidence: outreach. Done: not just helpers. | Add examples. | P1 / low |
| Ch. 4 Business Model Canvas | cost-structure | Cost Structure | CFO / Co-CEOs | Cost table | FinanceTable stays | Yes / B+ | Quantify cost categories | Start: add fixed/variable costs. Minimum: cost/category/assumption. Strong: confidence and source. | Evidence: unit cost/vendor. Done: cost drivers visible. | Add missing-data warning. | P0 / low |
| Ch. 4 Business Model Canvas | canvas-insights | Canvas Insights | Strategy and Growth / Co-CEOs | Strategy memo | StrategyMemoBuilder stays | Yes / B+ | Turn canvas into decisions | Start: write one insight. Minimum: insight/evidence/action. Strong: owner, risk, validation. | Evidence: completed BMC. Done: action is assigned. | Add BMC summary prompt. | P1 / low |
| Ch. 5 House Phoenix Brand Book | audience | Audience | CMO / Co-CEOs | Audience table | Universal Table stays | Yes / B+ | Translate customers into brand audience | Start: list core audiences. Minimum: audience/need/proof. Strong: archetype link. | Evidence: Ch. 4 customer segments. Done: audience is not “everyone.” | Add archetype import suggestion. | P0 / low |
| Ch. 5 House Phoenix Brand Book | value-proposition | Value Proposition | CMO / Co-CEOs | Brand promise/rules | BrandSystemBuilder stays | Yes / B+ | Make brand promise concrete | Start: write promise and proof. Minimum: promise/audience/proof. Strong: do/don't and sample copy. | Evidence: product/customer fit. Done: usable in Playbook. | Add comparison to Ch. 4 VP. | P0 / low |
| Ch. 5 House Phoenix Brand Book | voice | Voice | CMO / Co-CEOs | Voice rules | BrandFitBuilder stays | Yes / B+ | Turn voice traits into copy rules | Start: choose voice traits. Minimum: 3 rules. Strong: examples/non-examples. | Evidence: sample posts. Done: teammate can write captions. | Add before/after example. | P0 / low |
| Ch. 5 House Phoenix Brand Book | identity | Identity | CMO / Co-CEOs | Visual identity rules | BrandFitBuilder stays | Yes / B | Define visual consistency | Start: choose visual rules. Minimum: colors/type/image rules. Strong: use/do-not-use examples. | Evidence: existing assets. Done: teammate can design consistently. | Add asset examples. | P1 / medium |
| Ch. 6 Supporting Brand Sheets | lumen-sheet | Lumen Sheet | CMO / Co-CEOs | Supporting brand sheet | BrandFitBuilder stays | Yes / B | Define Lumen role | Start: fill brand choices. Minimum: audience/promise/voice. Strong: product path and proof. | Evidence: brand architecture. Done: distinct from House Phoenix. | Add example sheet. | P1 / medium |
| Ch. 6 Supporting Brand Sheets | notice-sheet | Notice Sheet | CMO / Co-CEOs | Supporting brand sheet | BrandFitBuilder stays | Yes / B | Define Notice role | Start: fill brand choices. Minimum: audience/promise/voice. Strong: use case and proof. | Evidence: brand architecture. Done: distinct role. | Add example. | P1 / medium |
| Ch. 6 Supporting Brand Sheets | humble-oven-sheet | Humble Oven Sheet | CMO / Co-CEOs | Supporting brand sheet | BrandFitBuilder stays | Yes / B | Define baked goods brand | Start: fill brand choices. Minimum: audience/promise/voice. Strong: food quality and operations links. | Evidence: baked goods SOP. Done: usable brand sheet. | Add food-specific examples. | P1 / medium |
| Ch. 6 Supporting Brand Sheets | supporting-brand-comparison | Supporting Brand Comparison | CMO / Co-CEOs | Comparison table | Universal Table stays | Yes / B+ | Compare portfolio roles | Start: fill comparison rows. Minimum: brand/audience/offer. Strong: boundaries and launch status. | Evidence: brand sheets. Done: no overlap confusion. | Add “pause/launch” field. | P1 / low |
| Ch. 6 Supporting Brand Sheets | cross-brand-rules | Cross-Brand Rules | CMO / Co-CEOs | Brand rules | BrandFitBuilder stays | Partial / B | Govern multi-brand behavior | Start: write cross-brand do/don't. Minimum: 3 rules. Strong: scenario examples. | Evidence: portfolio. Done: team knows when to combine/separate brands. | Consider BrandSystemBuilder later. | P1 / medium |
| Ch. 6 Supporting Brand Sheets | launch-readiness | Launch Readiness | COO / CMO | Readiness checklist | Universal Checklist stays | Yes / B+ | Decide if brands are launch-ready | Start: check readiness rows. Minimum: each brand status. Strong: missing item owner. | Evidence: product/ops/campaign. Done: go/no-go is clear. | Add review threshold. | P0 / low |
| Ch. 6 Supporting Brand Sheets | open-questions | Open Questions | Strategy and Growth / Co-CEOs | Decision memo | Decision Memo stays | Yes / B+ | Track unresolved brand choices | Start: add question. Minimum: owner/decision date. Strong: options and evidence. | Evidence: missing facts. Done: no open question lacks next step. | Add examples. | P2 / low |
| Ch. 7 Product Line and Pricing | product-list | Product List | COO / CFO | Product catalog table | Universal Table stays | Yes / B+ | Define products clearly | Start: add product rows. Minimum: name/category/status. Strong: SKU, owner, launch status. | Evidence: actual products. Done: product catalog usable downstream. | Add product import guidance. | P0 / low |
| Ch. 7 Product Line and Pricing | product-story | Product Story | CMO / Co-CEOs | Product story table | Universal Table stays | Yes / B | Connect products to meaning | Start: add product story row. Minimum: product/audience/why. Strong: evidence and quote. | Evidence: customer archetype. Done: story supports selling. | Add examples. | P0 / medium |
| Ch. 7 Product Line and Pricing | pricing-summary | Pricing Summary | CFO / Co-CEOs | Pricing fit summary | MarketFitBuilder to pricing table preferred | Partial / B- | Summarize price logic | Start: select product and price rationale. Minimum: price/cost/assumption. Strong: margin and competitor context. | Evidence: unit cost/sale price. Done: price is defensible. | Use pricing component or table, not market language. | P0 / medium |
| Ch. 7 Product Line and Pricing | margin-and-break-even | Margin and Break-Even | CFO / Co-CEOs | Finance calculation table | FinanceTable stays | Yes / B+ | Calculate margin/break-even | Start: enter cost/price/quantity. Minimum: one product calculation. Strong: assumptions and sensitivity. | Evidence: cost source. Done: numbers reconcile. | Add formula explainer chip. | P0 / low |
| Ch. 7 Product Line and Pricing | inventory-readiness | Inventory Readiness | COO / CFO | Inventory readiness table | Universal Table to inventory builder later | Partial / B | Check product readiness | Start: add product readiness rows. Minimum: product/quantity/status. Strong: blocker and owner. | Evidence: inventory. Done: launch quantities clear. | Add import from product catalog. | P0 / medium |
| Ch. 7 Product Line and Pricing | pricing-risks | Pricing Risks | CFO / Co-CEOs | Risk table | Universal Table stays | Yes / B+ | Identify price risk | Start: list risks. Minimum: risk/trigger/response. Strong: owner and evidence. | Evidence: costs/sales. Done: risk response exists. | Add risk examples. | P1 / low |
| Ch. 7 Product Line and Pricing | retail-recommendations | Retail Recommendations | Strategy and Growth / Co-CEOs | Product recommendation | MarketFitBuilder to RetailPitchBuilder support | Partial / B | Recommend retail-ready products | Start: choose best products. Minimum: product/reason/risk. Strong: margin, proof, readiness. | Evidence: pricing/inventory/customer. Done: retail shortlist. | Tie to Phoenix Nest pitch. | P1 / medium |
| Ch. 8 Finance and Revenue | unit-cost | Unit Cost | CFO / Co-CEOs | Unit cost table | FinanceTable stays | Yes / B+ | Estimate true cost | Start: enter cost parts. Minimum: material/labor/packaging assumptions. Strong: source/confidence. | Evidence: receipts/vendor. Done: unit cost is traceable. | Add missing source prompt. | P0 / low |
| Ch. 8 Finance and Revenue | sale-price | Sale Price | CFO / Co-CEOs | Pricing strategy output | PricingStrategyBuilder stays | Yes / B+ | Set defensible price | Start: choose product and price. Minimum: price/margin/assumption. Strong: break-even and customer fit. | Evidence: unit cost/customer profile. Done: price is explainable. | Add “missing data” branch. | P0 / low |
| Ch. 8 Finance and Revenue | planned-quantity | Planned Quantity | COO / CFO | Quantity table | Universal Table stays | Yes / B | Forecast quantities | Start: add planned quantities. Minimum: product/quantity/why. Strong: capacity and demand logic. | Evidence: inventory/sales plan. Done: launch quantity set. | Add formula examples. | P0 / medium |
| Ch. 8 Finance and Revenue | break-even | Break-Even | CFO / Co-CEOs | Break-even table | FinanceTable stays | Yes / B+ | Find break-even | Start: select product/enter fixed cost. Minimum: one break-even row. Strong: scenario comparison. | Evidence: cost/price. Done: break-even is numerically clear. | Add visual explanation. | P0 / low |
| Ch. 8 Finance and Revenue | revenue-scenarios | Revenue Scenarios | CFO / Co-CEOs | Scenario table | FinanceTable plus MarketFitBuilder | Partial / B | Model sales outcomes | Start: add low/base/high cases. Minimum: units, price, revenue. Strong: assumptions and risk. | Evidence: planned quantity. Done: scenario set supports decision. | Avoid duplicate builder confusion. | P0 / medium |
| Ch. 8 Finance and Revenue | donation-scenarios | Donation Scenarios | CFO / Co-CEOs | Donation table | FinanceTable stays | Yes / B+ | Model donation revenue | Start: add donation assumptions. Minimum: amount/source/confidence. Strong: sensitivity and source. | Evidence: historical/supporter data. Done: donations are not guessed silently. | Add assumption label. | P1 / low |
| Ch. 8 Finance and Revenue | key-financial-kpis | Key Financial KPIs | CFO / Co-CEOs | KPI table | FinanceTable stays | Yes / B+ | Choose meaningful metrics | Start: add KPIs. Minimum: metric/target/source. Strong: owner and cadence. | Evidence: finance tables. Done: KPIs can be tracked. | Add dashboard link later. | P1 / low |
| Ch. 8 Finance and Revenue | post-event-recap | Post-Event Recap | CFO / Co-CEOs | Post-event results grid | Universal Table stays | Yes / B | Compare plan vs event results | Start: add results after event. Minimum: sales/cost/lesson. Strong: variance and cause. | Evidence: sales records. Done: learning is actionable. | Add variance examples. | P1 / medium |
| Ch. 9 Operations | inventory | Inventory | COO / CFO | Inventory checklist | OperationsChecklist stays | Yes / B+ | Track readiness without becoming sales software | Start: list inventory items. Minimum: item/count/status. Strong: owner and backup. | Evidence: product list. Done: launch inventory is known. | Add mobile stacking. | P0 / low |
| Ch. 9 Operations | day-of-sop | Day-of SOP | COO / Co-CEOs | Event SOP | OperationsChecklist stays | Yes / B+ | Run TechTown smoothly | Start: list day-of steps. Minimum: setup/sell/close steps. Strong: owner/time/backup. | Evidence: launch plan. Done: someone can execute. | Add time-block template. | P0 / low |
| Ch. 9 Operations | baked-goods-sop | Baked Goods SOP | COO / instructor | Food handling SOP | OperationsChecklist stays | Yes / B+ | Manage baked goods safely and professionally | Start: list prep/storage/service steps. Minimum: owner/materials/timing. Strong: quality check and backup. | Evidence: product plan. Done: food workflow is clear. | Add quality-control note. | P0 / low |
| Ch. 9 Operations | continuity | Continuity | COO / Strategy and Growth | Continuity checklist | OperationsChecklist stays | Yes / B+ | Keep operations repeatable | Start: list recurring handoff tasks. Minimum: item/owner/location. Strong: next cohort instruction. | Evidence: current systems. Done: recurring work survives handoff. | Add storage/location field. | P1 / low |
| Ch. 9 Operations | operating-cadence | Operating Cadence | COO / Co-CEOs | Cadence checklist | Universal Checklist stays | Yes / B+ | Establish routine operating rhythm | Start: define weekly checks. Minimum: meeting/check/owner. Strong: escalation and metric. | Evidence: team calendar. Done: cadence can run weekly. | Add rhythm examples. | P1 / low |
| Ch. 9 Operations | fulfillment-workflow | Fulfillment Workflow | COO / CFO | Fulfillment SOP | Universal Checklist stays | Yes / B+ | Move product from order/interest to delivery without sales processing | Start: map steps. Minimum: receive request, pack, handoff. Strong: quality and issue path. | Evidence: inventory. Done: workflow is repeatable. | Add external sales-system boundary note. | P1 / low |
| Ch. 9 Operations | vendor-coordination | Vendor Coordination | COO / CFO | Vendor table | Universal Table stays | Yes / B | Coordinate suppliers | Start: list vendor/contact/need. Minimum: vendor and next action. Strong: lead time, backup. | Evidence: receipts/contacts. Done: supply risk visible. | Add lead-time example. | P1 / medium |
| Ch. 9 Operations | quality-control | Quality Control | COO / instructor | QC checklist | Universal Checklist stays | Yes / B+ | Define quality checks | Start: list checks. Minimum: product/check/owner. Strong: pass/fail and escalation. | Evidence: product standards. Done: quality can be inspected. | Add product-specific examples. | P0 / low |
| Ch. 9 Operations | customer-service-issues | Customer Service Issues | COO / CMO | Issue tracking table | Universal Table stays | Yes / B | Handle issues professionally | Start: add issue types. Minimum: issue/response/owner. Strong: tone and escalation. | Evidence: feedback. Done: issue path clear. | Add sample responses. | P1 / medium |
| Ch. 9 Operations | interest-tracking | Interest Tracking | CMO / COO | Interest table | Universal Table stays | Yes / B | Track interest without sales processing | Start: list signals. Minimum: person/group/product interest. Strong: follow-up and privacy note. | Evidence: feedback forms. Done: interest informs campaign. | Add boundary copy. | P1 / medium |
| Ch. 9 Operations | post-launch-operations | Post-Launch Operations | COO / Strategy and Growth | Strategy memo | StrategyMemoBuilder stays | Yes / B+ | Convert launch learning into operating plan | Start: write operational lesson. Minimum: insight/action/owner. Strong: evidence and cadence. | Evidence: event recap. Done: next operating improvement assigned. | Add example. | P1 / low |
| Ch. 9 Operations | operating-handoff | Operating Handoff | COO / Strategy and Growth | Handoff checklist | Universal Checklist stays | Yes / B+ | Transfer operations to next cohort | Start: list handoff items. Minimum: system/location/owner. Strong: first-week instructions. | Evidence: SOPs. Done: next cohort can operate. | Add chief reviewer. | P1 / low |
| Ch. 10 Marketing Campaign | target-customers | Target Customers | CMO / Co-CEOs | Market fit output | MarketFitBuilder stays | Yes / B+ | Select audience for campaign | Start: choose target audience. Minimum: one audience and proof. Strong: product-channel-message fit. | Evidence: archetypes/feedback. Done: target is specific. | Add progressive disclosure. | P0 / low |
| Ch. 10 Marketing Campaign | customer-problems-and-desires | Customer Problems and Desires | CMO / Co-CEOs | Insight table | Universal Table stays | Yes / B+ | Identify customer motivations | Start: list problems/desires. Minimum: 3 rows. Strong: evidence and product fit. | Evidence: interviews/observations. Done: campaign can use insight. | Add example quote. | P0 / low |
| Ch. 10 Marketing Campaign | insight-evidence | Insight Evidence | CMO / instructor | Evidence table | Universal Table plus Structured Evidence | Yes / B+ | Support claims with proof | Start: add evidence rows. Minimum: source/claim/confidence. Strong: assumption and next validation. | Evidence: required. Done: claim has source. | Add evidence quality examples. | P0 / low |
| Ch. 10 Marketing Campaign | feedback-plan | Feedback Plan | CMO / instructor | Feedback checklist | Universal Checklist stays | Yes / B+ | Plan validation | Start: list feedback actions. Minimum: question/audience/owner. Strong: timing and use. | Evidence: customer segment. Done: feedback is collectable. | Add question examples. | P0 / low |
| Ch. 10 Marketing Campaign | implications-for-launch | Implications for Launch | CMO / Co-CEOs | Strategy memo | StrategyMemoBuilder stays | Yes / B+ | Turn insights into launch decisions | Start: write implication. Minimum: insight/action/owner. Strong: risk and evidence. | Evidence: insight table. Done: launch action assigned. | Add “change/keep” options. | P0 / low |
| Ch. 10 Marketing Campaign | audience | Audience | CMO / Co-CEOs | Campaign audience rules | BrandFitBuilder stays | Partial / B | Define campaign audience | Start: choose audience traits. Minimum: one audience and reason. Strong: link to archetype and channel. | Evidence: target customers. Done: audience is actionable. | Avoid duplicate with target-customers. | P1 / medium |
| Ch. 10 Marketing Campaign | touchpoints | Touchpoints | CMO / COO | Touchpoint list | Recipe only to Universal Table | Partial / B- | Plan where campaign appears | Start: list touchpoints. Minimum: channel/date/owner. Strong: message and asset needed. | Evidence: channels. Done: campaign schedule usable. | Add table builder. | P0 / medium |
| Ch. 10 Marketing Campaign | messaging | Messaging | CMO / Co-CEOs | Message rules | BrandFitBuilder stays | Yes / B | Write campaign message | Start: choose message style. Minimum: headline/body/proof. Strong: audience-specific variants. | Evidence: brand rules. Done: post/copy can be written. | Add sample posts. | P0 / medium |
| Ch. 10 Marketing Campaign | measurement | Measurement | CMO / Co-CEOs | Measurement table | Universal Table stays | Yes / B+ | Define campaign metrics | Start: add metric rows. Minimum: metric/target/source. Strong: decision tied to metric. | Evidence: campaign plan. Done: success can be measured. | Add metric examples. | P1 / low |
| Ch. 11 Phoenix Nest Pitch | identity | Identity | Strategy and Growth / Co-CEOs | Retail pitch identity card | RetailPitchBuilder stays | Yes / B+ | Explain Phoenix Nest fit | Start: define buyer/store fit. Minimum: identity and audience. Strong: shelf story and proof. | Evidence: brand/product. Done: pitch identity clear. | Add retail buyer example. | P0 / low |
| Ch. 11 Phoenix Nest Pitch | evidence | Evidence | Strategy and Growth / instructor | Retail proof card | RetailPitchBuilder stays | Yes / B+ | Prove readiness | Start: add proof. Minimum: sales/customer/product proof. Strong: source/confidence/risk. | Evidence: structured evidence. Done: proof is credible. | Add evidence ranking. | P0 / low |
| Ch. 11 Phoenix Nest Pitch | offer | Offer | CFO / Strategy and Growth | Retail offer | MarketFitBuilder to RetailPitchBuilder later | Partial / B | Define SKU offer | Start: choose products and retail logic. Minimum: SKU/price/margin/readiness. Strong: buyer ask and backup. | Evidence: product/pricing/inventory. Done: offer is pitchable. | Convert to RetailPitchBuilder config. | P0 / medium |
| Ch. 11 Phoenix Nest Pitch | ask | Ask | Strategy and Growth / Co-CEOs | Buyer ask | RetailPitchBuilder stays | Yes / B+ | Make a clear retail ask | Start: write ask. Minimum: what we want and why. Strong: terms, proof, next step. | Evidence: offer/evidence. Done: buyer knows the ask. | Add adult review note if needed. | P0 / low |
| Ch. 12 Strategy and Next Semester | what-we-learned | What We Learned | Strategy and Growth / instructor | Lesson memo | StrategyMemoBuilder stays | Yes / B+ | Turn evidence into learning | Start: write lesson. Minimum: claim/evidence/next step. Strong: confidence and tradeoff. | Evidence: event/sections. Done: lesson is actionable. | Add model lesson. | P1 / low |
| Ch. 12 Strategy and Next Semester | customer-and-sales-insights | Customer and Sales Insights | Strategy and Growth / CMO | Insight memo | StrategyMemoBuilder stays | Yes / B+ | Interpret customer/sales signals | Start: write insight. Minimum: signal/meaning/action. Strong: source and confidence. | Evidence: customer/finance data. Done: strategy uses insight. | Add examples. | P1 / low |
| Ch. 12 Strategy and Next Semester | operational-lessons | Operational Lessons | COO / Strategy and Growth | Operations checklist | Universal Checklist stays | Yes / B | Capture operational learning | Start: list lessons. Minimum: lesson/fix/owner. Strong: SOP update. | Evidence: operations recap. Done: next cohort can improve. | Link to Ch. 9 handoff. | P1 / low |
| Ch. 12 Strategy and Next Semester | brand-and-product-priorities | Brand and Product Priorities | CMO / Co-CEOs | Strategy memo | StrategyMemoBuilder stays | Yes / B+ | Prioritize future brand/product work | Start: add priority. Minimum: priority/why/owner. Strong: evidence and tradeoff. | Evidence: launch outcomes. Done: priorities are ranked. | Add ranking field. | P1 / low |
| Ch. 12 Strategy and Next Semester | next-semester-goals | Next Semester Goals | Co-CEOs / instructor | Goal table | Universal Table stays | Yes / B+ | Set measurable goals | Start: add goals. Minimum: goal/owner/metric. Strong: due date and dependency. | Evidence: strategy memos. Done: goals are measurable. | Add SMART examples. | P1 / low |
| Ch. 12 Strategy and Next Semester | risks-and-open-questions | Risks and Open Questions | Strategy and Growth / Co-CEOs | Risk/question table | Universal Table stays | Yes / B+ | Separate risk from uncertainty | Start: add risk/question. Minimum: owner and next step. Strong: impact and validation plan. | Evidence: all sections. Done: unresolved items assigned. | Add categories. | P1 / low |
| Ch. 12 Strategy and Next Semester | recommended-action-plan | Recommended Action Plan | Co-CEOs / instructor | Strategy action memo | StrategyMemoBuilder stays | Yes / B+ | Convert strategy into action | Start: add top actions. Minimum: action/owner/due. Strong: dependency, done signal, proof. | Evidence: strategy sections. Done: next semester can start. | Add executive summary output. | P1 / low |
| Ch. 13 Decision Log | major-decisions | Major Decisions | Co-CEOs / instructor | Decision memo cards | Decision Memo stays | Yes / B+ | Record important decisions | Start: add decision. Minimum: decision/date/owner. Strong: options and rationale. | Evidence: source. Done: decision is traceable. | Add decision categories. | P1 / low |
| Ch. 13 Decision Log | decision-rationale | Decision Rationale | Co-CEOs / instructor | Rationale memo | Decision Memo stays | Yes / B+ | Explain why decisions happened | Start: choose one decision. Minimum: reason/evidence/risk. Strong: alternatives and tradeoff. | Evidence: related section. Done: rationale is defensible. | Add example. | P1 / low |
| Ch. 13 Decision Log | evidence-appendix | Evidence Appendix | Strategy and Growth / instructor | Evidence table | Universal Table plus Structured Evidence | Yes / B+ | Organize proof | Start: add evidence entries. Minimum: source/claim/section. Strong: confidence and next validation. | Evidence: required. Done: claims trace to sources. | Add source quality meter later. | P1 / low |
| Ch. 13 Decision Log | templates-and-links | Templates and Links | Strategy and Growth / instructor | Resource checklist | Universal Checklist stays | Yes / B | Preserve reusable assets | Start: list template/link. Minimum: name/location/use. Strong: owner and access note. | Evidence: actual links. Done: next cohort can find assets. | Add access warning. | P2 / medium |
| Ch. 13 Decision Log | unresolved-decisions | Unresolved Decisions | Co-CEOs / Strategy and Growth | Decision memo | Decision Memo stays | Yes / B+ | Track decisions not made | Start: add unresolved decision. Minimum: owner/date/question. Strong: options and needed evidence. | Evidence: unknowns. Done: next decision is clear. | Add escalation rules. | P1 / low |
| Ch. 13 Decision Log | next-cohort-instructions | Next Cohort Instructions | Strategy and Growth / instructor | Handoff checklist | Universal Checklist stays | Yes / B+ | Teach next cohort where to begin | Start: list instructions. Minimum: action/location/owner. Strong: first week schedule. | Evidence: final outputs. Done: next cohort can start independently. | Add onboarding sequence. | P1 / low |

## 4. Feature-by-Feature Audit

| Feature | Purpose | Student value | Chief value | Grade | Biggest friction | Fastest improvement | Deeper improvement | Priority |
|---|---|---|---|---:|---|---|---|---|
| Home dashboard | Entry point | Shows assigned work | Shows launch state indirectly | B+ | Can still feel busy | Add “next 15 minutes” panel | Role-specific classroom mode | P0 |
| Student My Next Actions | Personal task path | Reduces wayfinding | Helps assign work | A- | Needs task-title continuity everywhere | Mirror task title on section page | Add progress-by-lane map for students | P0 |
| Final Week Completion Panel | P0/P1/P2 focus | Shows what matters now | Gives urgency | B+ | Needs clearer ignore-now guidance | Add “finish these first” copy | Presentation mode | P0 |
| Section page | Main work surface | Centralizes builder, draft, evidence | Shows review-ready work | B | Too many panels compete | Add Start Here card | Adaptive layout by artifact type | P0 |
| SectionRecipePanel | Instruction layer | Gives steps/done criteria | Sets expectations | B | Some recipes still text-heavy | Compress P0 recipes | Example-first recipes | P0 |
| SectionGuidanceStrip | Concept framing | Explains why | Helps chiefs coach | B | Can be skipped | Add one-line concept chip | Inline glossary | P1 |
| BuilderHandoffCallout | Handoff guidance | Prevents hidden mutation | Clarifies copy flow | B+ | Students may copy without editing | Add “edit in your own words” checkbox | Handoff quality check | P0 |
| DeliverableOutputWorkspace | Draft/evidence/preview/save | Core production area | Reviewable output | B+ | Save vs submit distinction | Add submit-readiness checklist | Version comparison | P0 |
| Working Draft | Student writing | Final human-authored output | Review target | B | Blank if builder output not copied | Add draft starter snippets | Structured draft templates | P0 |
| Structured Evidence editor | Professional rigor | Teaches claims/sources/assumptions | Review proof | B+ | Needs examples | Add evidence examples | Evidence quality scoring | P0 |
| Playbook preview | Final artifact preview | Shows polished output | Review confidence | B+ | Evidence compactness may hide gaps | Add “missing evidence” indicators | Export-ready preview | P1 |
| Universal builders | Broad artifact coverage | Tables/checklists/memos | Standardized review | B+ | Mobile density | Stacked mobile rows | Config-driven examples | P0 |
| Specialized builders | Brand/retail/strategy fit | More relevant choices | Better artifact quality | B+ | Some need sample output | Add strong-answer previews | Deeper validation rules | P1 |
| Customer Profile Builder | Segmentation engine | Teaches customers through choices | Feeds strategy | A- | Classifier can feel magical | Add “why this output” explanation | More validation evidence prompts | P1 |
| Customer Archetype Picker | National customer hypotheses | Gives concrete starting points | Grounds strategy | A- | Needs careful local-context framing | Keep local roles as applications | Archetype-to-channel map | P1 |
| Business Operations sections | Routine work system | Teaches operations beyond event day | COO oversight | B+ | Needs clearer cadence visuals | Add operating rhythm examples | Ops dashboard | P1 |
| Corporate Structure Builder | Educational governance model | Teaches ownership safely | Guides adult review | B | Safety copy is necessarily dense | Add “draft only” summary chip | Adult review workflow later | P2 |
| TaskCoverageMap | Coverage visibility | Indirect clarity | Strong management map | A- | Matching may feel definitive | Show matched task IDs | Manual task template workflow | P1 |
| MissingTaskCoveragePanel | Missing task signals | Prevents uncovered work | Helps chiefs assign | A- | Suggestions are not tasks | Add “manual only” badge | Guided task creation later | P1 |
| LaneCoverageBoard | Lane rollup | Shows department workload | Chief prioritization | A- | Needs classroom-friendly summary | Add P0-first sorting | Drill-down views | P1 |
| ChiefFocusBoard | Priority queue | Helps chiefs act | Very high management value | A- | Needs “verify before acting” copy | Add source links | Advisor-assisted triage | P1 |
| Project Navigator | Executive management | Indirect student support | Central command view | A- | Dense for first-time chiefs | Add first-use mode | Custom lane filters | P1 |
| C-suite Advisor | Management coach | Indirect clarity | Gives exact chief actions | B+ | No natural freeform mentor yet | Add grounded Q&A mode | Visual + chat hybrid | P1 |
| Launch Readiness Checklist | Launch go/no-go | Shows missing work | Strong readiness signal | B+ | Criteria need examples | Add pass/fail examples | Readiness history | P1 |
| Submit/approval workflow | Review control | Teaches quality gate | Preserves approval | B+ | Reviewer standard varies | Add approve-if/push-back-if per section | Rubric side rail | P0 |
| Mobile layout | Classroom access | Necessary fallback | Less relevant | B- | Tables are tight | Stacked row mode | Mobile-first work cards | P0 |

## 5. Essential Concepts Map

| Concept | Where it appears now | Does UI teach it well? | Student artifact | Needed improvement |
|---|---|---|---|---|
| Customer segmentation | Ch. 4 customer-segments, archetype picker | Yes | Customer profile | Add validation examples |
| Customer archetypes | CustomerArchetypePicker | Yes | Archetype-backed hypothesis | Show local application without making local role the segment |
| Value proposition | Ch. 4 value-propositions, Ch. 5 value-proposition | Partial | Value statement/brand promise | Add VP Fit micro-builder |
| Pricing | Ch. 7/8 pricing sections | Yes | Price rationale | Add formula/plain-English chips |
| Unit cost | Ch. 8 unit-cost | Yes | Cost table | Add source quality prompt |
| Break-even | Ch. 7/8 break-even | Yes | Calculation table | Add visual explanation |
| Revenue streams | Ch. 4 revenue-streams | Yes | Finance table | Add confidence labels |
| Cost structure | Ch. 4 cost-structure | Yes | Cost table | Add fixed/variable examples |
| Inventory | Ch. 7 inventory-readiness, Ch. 9 inventory | Yes | Inventory/checklist | Improve mobile editing |
| Operations cadence | Ch. 9 operating-cadence | Yes | Checklist | Add weekly rhythm model |
| Quality control | Ch. 9 quality-control | Yes | QC checklist | Add product-specific examples |
| Customer feedback | Ch. 10 feedback-plan | Yes | Feedback checklist | Add question bank |
| Evidence and assumptions | Structured Evidence, Ch. 10/13 | B+ | Evidence entries | Add quality examples |
| Brand voice and identity | Ch. 5/6 BrandFitBuilder | B+ | Brand rules | Add before/after examples |
| Marketing channels | Ch. 4 channels, Ch. 10 touchpoints | Partial | Channel/touchpoint table | Clarify channel vs activity |
| Retail carry pitch | Ch. 11 RetailPitchBuilder | B+ | Buyer pitch cards | Add strong pitch sample |
| Governance | Ch. 3 and CorporateStructureBuilder | B | Decision rights and ownership draft | Add “adult review required” examples |
| Ownership/equity | CorporateStructureBuilder | B | Educational draft model | Keep safety posture visible |
| Vesting | CorporateStructureBuilder | B | Draft vesting schedule | Add plain-language explainer |
| Decision rights | Ch. 2/3/13 | B+ | Decision memo | Add escalation examples |
| Handoff/continuity | Ch. 3/9/13 | B+ | Checklist | Add next-cohort sequence |
| Task coverage | Project Navigator surfaces | A- | Coverage map | Add source confidence copy |
| Management/delegation | Advisor, ChiefFocusBoard | B+ | Action cards | Add mentor Q&A |
| Approval/review standards | Submit flow, recipes | B | Review gate | Add approve-if/push-back-if for every P0 |

## 6. UI/UX and Engagement Roadmap

| Recommendation | Owner | Due date | Dependency | Definition of done | Playbook chapter | Complexity | Risk | Student impact | Chief impact | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| P0 Start Here cards | Claude Code | May 1, 2026 | Existing P0 map | Every P0 section shows artifact, first action, done, reviewer | All P0 | Small | Low | High | Medium | Highest-impact clarity fix |
| Minimum viable answer cards | Claude Code | May 1, 2026 | Section priority map | P0 sections show fallback answer rule | All P0 | Small | Low | High | Medium | Prevents freezing |
| Strong-answer examples | Curriculum Lead + Claude Code | May 2, 2026 | Example copy | One example/output format per P0 section | All P0 | Medium | Low | High | High | Best rigor lift |
| Mobile stacked table rows | Claude Code | May 2, 2026 | Universal/finance table components | Tables are card-stacked on narrow viewports | Ch. 4/7/8/10/13 | Medium | Medium | High | Low | Protects classroom usability |
| Submit-readiness checklist | Claude Code | May 1, 2026 | Existing submit gate | Draft/evidence/reviewer checklist appears before submit | All P0 | Small | Low | High | High | Does not change approval logic |
| Evidence examples | Claude Code | May 2, 2026 | Structured Evidence editor | Students see source/assumption/example entries | All | Small | Low | Medium | High | Raises quality |
| Ask-your-chief prompts | Claude Code | May 2, 2026 | Dependency hints | Missing dependency shows exact person/question | P0/P1 | Small | Low | Medium | High | Reduces instructor translation |
| Concept glossary chips | Claude Code | May 3, 2026 | Concept copy | Key terms have short expanders | All | Medium | Low | Medium | Medium | Avoids jargon barrier |
| Chief review checklists | Curriculum Lead + Claude Code | May 3, 2026 | Review standards | P0 sections show approve-if/push-back-if | All P0 | Medium | Low | High | High | Supports quality gate |
| Classroom mode / 15-minute plan | Claude Code | May 3, 2026 | Final Week Completion map | Dashboard shows what to finish in current class block | All P0 | Medium | Medium | High | High | Engagement boost |

## 7. C-suite Advisor Roadmap

Current Advisor grade: **B+**. It is a strong action-card management coach, not yet a full mentor. It explains what to do, why it matters, and what chiefs should say, while preserving the rule that Advisor prepares and chiefs decide.

| Question | Current answer | Gap | Roadmap |
|---|---|---|---|
| Can chiefs ask natural-language questions? | Not fully; modes are structured. | Mentor Q&A missing. | Add grounded chat mode with same context and action-card constraints. |
| Does Advisor reference task coverage facts? | Yes, compact task coverage is available. | Needs clearer source IDs in UI. | Show coverage source links and matched task IDs. |
| Does Advisor explain what to do and why? | Yes. | Needs more concept teaching. | Add “why this matters” explanation block per card. |
| Does Advisor give exact teammate language? | Yes. | Good enough for V1. | Keep and expand examples. |
| Does Advisor avoid doing student work? | Yes by posture and schema. | Must be smoke-tested with provider live. | Add regression prompt checks. |
| Does Advisor avoid claiming mutation? | Yes by prompt and validator posture. | Need live output verification. | Codex smoke after provider config. |
| Does Advisor handle context size? | Yes via budgeter. | Risk returns as context grows. | Add token budget tests. |
| Does Advisor surface unknowns? | Yes in context shape. | UI could display unknowns more explicitly. | Add Unknowns panel. |
| Does Advisor teach management concepts? | Partially. | Needs mentor explanations. | Add management glossary + Q&A. |
| What is missing for V2? | Chat, visual grounding, source references, classroom timer. | Build as deterministic UI plus AI explanation. | Phase 1. |

P0 before class: verify Advisor availability, keep inline error fallback, add source IDs if small.  
P1 next sprint: mentor Q&A, unknowns panel, visual task map references.  
P2 later: chief training mode, meeting history, richer management curriculum.

## 8. Task Coverage / Management Audit

Task coverage is now one of the strongest parts of the operating system. The maps are deterministic and display-only, which is the right architecture. The risk is interpretation: “missing task coverage” must not feel like a system failure, and “covered” must not imply the work is complete.

### Task Coverage Risk List

1. Conservative matching can miss legitimate tasks with unusual titles.
2. Loose matching can create false confidence if a task title resembles a section.
3. P1/P2 visibility can overwhelm final-week execution.
4. Suggested task templates may look like auto-created work if labels are not explicit.
5. Students may not know whether task done means section done.
6. Chiefs need reviewer standards, not only task status.
7. Dependencies are visible but need exact unblock language.
8. Ready-for-review counts still require human quality review.
9. Lane rollups can hide one critical blocked P0.
10. Manual task seeding is safer this week than automatic creation.

### Task Template Cleanup Table

| Area | Cleanup needed | Owner | Due date | Definition of done | Priority |
|---|---|---|---|---|---|
| P0 titles | Make every title start with an action verb | Curriculum Lead | May 1, 2026 | Student can understand task without opening details | P0 |
| Dependencies | Add “complete this first” wording | Claude Code | May 1, 2026 | Dependency shown as hint, not hard gate | P0 |
| Definitions of done | Add artifact-specific done signals | Curriculum Lead | May 2, 2026 | Chief can review without translation | P0 |
| Reviewers | Ensure every P0 has a named reviewer | Instructor/Admin | May 1, 2026 | Reviewer chip appears in section and task | P0 |
| P1/P2 display | Collapse optional work during final-week mode | Claude Code | May 2, 2026 | Students see P0 first | P1 |

## 9. Safety / Guardrail Audit

Safety posture is strong. The platform currently appears designed around explicit human actions: copy-to-Working-Draft, manual save, manual submit, manual review, and manual task creation. The C-suite Advisor is framed as management coaching, not a decision-maker. The Corporate Structure Builder must remain educational draft planning and require adult review before any real-world action.

Required guardrails to keep:

- No AI replacing student work.
- No hidden Working Draft writes.
- No automatic task creation.
- No submit, approval, deliverable status, or task status mutation outside explicit existing workflows.
- Square remains external POS only; Renni Command Center should not add checkout, refund, tax, payment, or inventory decrement behavior.
- No Google Drive or OAuth integration in this phase.
- No legal advice, tax advice, securities advice, accounting advice, investment advice, entity formation, cap table, or equity grant functionality.
- Corporate Structure Builder remains an educational draft model only.
- Advisor prepares. Chiefs decide.

Potentially risky language to monitor: any place where “equity,” “vesting,” or “ownership” appears without “draft educational model” and “adult/legal review required.”

## 10. Prioritized Roadmap

### Phase 0: Immediate, Before Next Student Work Session

| Item | Owner | Due date | Dependency | Definition of done | Chapter | Feature/section | Complexity | Risk | Impact | Tool |
|---|---|---|---|---|---|---|---|---|---|---|
| Add P0 Start Here cards | Claude Code | May 1, 2026 | P0 map | Every P0 section answers what/start/done/reviewer above fold | All P0 | Section page | Small | Low | Very high | Claude Code |
| Add minimum viable answer and strong-answer pattern | Claude Code + Curriculum Lead | May 1, 2026 | P0 copy | Every P0 section has fallback and example structure | All P0 | Recipes | Medium | Low | Very high | Claude Code |
| Add submit-readiness checklist | Claude Code | May 1, 2026 | Existing submit flow | Checklist appears without changing submit logic | All P0 | Output workspace | Small | Low | High | Claude Code |
| Verify Advisor runtime config live | Codex | May 1, 2026 | Deployed env vars | Advisor mode request succeeds or inline fallback confirmed | All | C-suite | Small | Low | High | Codex |
| Mobile stacked table smoke/fix | Claude Code | May 2, 2026 | Table components | No unusable horizontal scroll on phone width | Ch. 4/7/8/10/13 | Builders | Medium | Medium | High | Claude Code |

### Phase 1: This Week

| Item | Owner | Due date | Dependency | Definition of done | Chapter | Feature/section | Complexity | Risk | Impact | Tool |
|---|---|---|---|---|---|---|---|---|---|---|
| P0 model answers | Curriculum Lead + Claude Code | May 2, 2026 | Artifact list | One concise example per P0 section | All P0 | Recipes/builders | Medium | Low | Very high | Claude Code |
| Chief review standards | Curriculum Lead + Claude Code | May 3, 2026 | Reviewer map | Approve-if/push-back-if visible for every P0 | All P0 | Review flow | Medium | Low | High | Claude Code |
| Evidence quality examples | Claude Code | May 2, 2026 | Structured Evidence editor | Students see examples for claim/source/assumption/risk | All | Evidence editor | Small | Low | High | Claude Code |
| Advisor source grounding UI | Claude Code | May 3, 2026 | Advisor output schema | Action cards show source IDs/links where present | All | Advisor | Medium | Medium | Medium | Claude Code |

### Phase 2: Next Sprint

| Item | Owner | Due date | Dependency | Definition of done | Chapter | Feature/section | Complexity | Risk | Impact | Tool |
|---|---|---|---|---|---|---|---|---|---|---|
| Advisor Mentor Q&A | Claude Code | May 8, 2026 | Advisor config stable | Chiefs can ask grounded questions without mutations | All | Advisor | Large | Medium | High | Claude Code |
| Value Proposition Fit Engine | Claude Code | May 9, 2026 | Customer Profile smoke passes | Ch. 4 value propositions becomes guided fit builder | Ch. 4 | VP | Large | Medium | High | Claude Code |
| Mobile-first table redesign | Claude Code | May 10, 2026 | Builder usage data | Tables use stacked cards on phones | Finance/ops/campaign | Builders | Medium | Medium | High | Claude Code |
| Evidence quality meter | Claude Code | May 10, 2026 | Evidence standard | Non-blocking quality prompts for claims | All | Evidence | Medium | Medium | Medium | Claude Code |

### Phase 3: Later Platform Growth

| Item | Owner | Due date | Dependency | Definition of done | Chapter | Feature/section | Complexity | Risk | Impact | Tool |
|---|---|---|---|---|---|---|---|---|---|---|
| Persistent builder state | Claude Code | Later | Data model decision | Students can save builder drafts explicitly | All | Builders | Large | High | Medium | Claude Code |
| Admin task template workflow | Claude Code | Later | Manual templates validated | Admin can create tasks from templates explicitly | All | Tasks | Large | Medium | High | Claude Code |
| Export/reporting | Claude Code | Later | Final output formats | Playbook and pitch exports are polished | All | Outputs | Large | Medium | Medium | Claude Code |
| Rich dashboards | Claude Code | Later | Classroom feedback | More durable chief/admin analytics | All | Dashboards | Large | Medium | Medium | Claude Code |

Recommended Phase 0 build: **P0 Start Here cards plus minimum viable answer and submit-readiness checklist**. This directly attacks the main student risk: knowing what to do without instructor translation.

## 11. Exact Next Prompts

### Claude Code Prompt: Phase 0 Student-Success Fix

```text
You are working in the existing Renni Command Center repo on branch renni-app-clean.

This is a focused Phase 0 student-success implementation pass.

Do not change Firestore rules, Auth, routes, dependencies, task creation, submit logic, approval logic, or status mutation behavior.

Goal:
Add a P0 Start Here pattern to section pages so students can answer within 10 seconds:
- what am I making?
- where do I start?
- what is the minimum viable answer?
- what does a strong answer look like?
- what evidence is expected?
- who reviews it?
- when is it ready to submit?

Use existing finalWeekCompletion/task template data where possible.

Implement:
1. A compact Start Here card on deliverable section pages for P0 sections.
2. Minimum viable answer copy:
   "If stuck, submit 3 clear sentences, 1 source or assumption, 1 risk, and 1 next step."
   For table/checklist/calculator sections, adapt this to require at least the minimum rows/calculation first.
3. A submit-readiness checklist near the existing submit area, without changing submit behavior.
4. Reviewer/owner/done chips when data is available.
5. Keep Working Draft, Structured Evidence, builders, and approval workflow unchanged.

Run:
npm run test:classifier || true
npm run typecheck || true
NITRO_PRESET=node-server npm run build

Commit with:
add p0 start here student guidance
```

### Claude Code Prompt: Advisor Mentor V2

```text
You are working in Renni Command Center on branch renni-app-clean.

Build Advisor Mentor V2 as a safe, grounded chief Q&A layer.

Do not add mutations, task creation, approval, submit, status changes, hidden writes, new providers, Google Drive/OAuth, or sales-system behavior.

Add a natural-language "Ask Advisor" mode that uses the existing ExecutiveAdvisorContextV2, context budgeter, and safety prompt posture.

Requirements:
- Advisor answers management questions only.
- Advisor uses only provided context and marks unknowns.
- Advisor gives exact next actions, owner, due date, dependency, definition of done, Playbook chapter, and teammate language when relevant.
- Advisor never claims work was approved, submitted, created, or changed.
- UI shows source IDs/links where present and "Advisor prepares. Chiefs decide."
- Project Navigator must still render if Advisor fails.

Run build/typecheck and commit with:
add advisor mentor question mode
```

### Claude Code Prompt: Mobile/Table/Engagement Polish

```text
You are working in Renni Command Center on branch renni-app-clean.

Improve mobile usability for table-heavy builders without changing data behavior.

Scope:
- UniversalSectionTableBuilder
- FinanceTableBuilder
- any shared table styles used by builder surfaces

Do not change save paths, Firestore writes, submit/approval/status logic, routes, Auth, or dependencies.

Implement:
- stacked card layout for rows on narrow screens
- reachable add/remove/copy buttons
- readable labels for each field
- no horizontal page scroll at phone width
- keep copy-to-Working-Draft manual

Run responsive smoke at desktop and phone widths.
Commit with:
improve mobile builder table layout
```

### Codex Verification Prompt

```text
Audit the latest Renni Command Center branch after the P0 Start Here student guidance pass.

Review-only unless there is a tiny build-blocking or safety-blocking fix.

Verify:
1. P0 sections show what to make, first action, minimum viable answer, strong-answer pattern, evidence expectation, reviewer, and done signal.
2. Existing builders still render without duplication.
3. Working Draft and Structured Evidence remain visible.
4. Submit gate and approval workflow are unchanged.
5. No hidden Working Draft writes, task creation, status mutation, approval mutation, or Firestore schema change was introduced.
6. Mobile layout remains usable.
7. Guardrails remain intact.

Run:
git status --short
git log --oneline -12
npm run test:classifier || true
npm run typecheck || true
NITRO_PRESET=node-server npm run build
Run the standard deprecated-language and safety-boundary guardrail scans from the current audit brief.
rg -n "updateDoc|setDoc|addDoc|deleteDoc|writeBatch|runTransaction" app server

Return PASS / PASS WITH WARNINGS / FAIL.
```

## 12. Guardrail Scan Results

Completed after writing this report.

Document-specific scan:

- Deprecated terminology scan: no hits in this report.
- Sales-system / external integration scan: required guardrail hits only.
- Corporate-structure safety scan: required educational-review guardrail hits only.

Repo-wide scan classification:

- Pre-existing docs still contain deprecated legacy terms in older planning files such as `docs/01-product-requirements.md`, `docs/03-build-plan.md`, `docs/04-bible-chapters-and-owners.md`, and `docs/07-chief-metrics.md`. This report did not introduce those terms.
- Prompt/config files intentionally list forbidden terms so AI outputs avoid them. Classified as required guardrail.
- Product catalog, operations, and final-week docs intentionally state Square/external sales-system boundaries. Classified as required guardrail.
- Existing `app/pages/revenue.vue` and `useTransactions.ts` still contain transaction-oriented legacy surfaces. This audit did not modify them; keep them out of current student workflow unless separately reviewed.
- Corporate structure legal/equity terms appear in required educational draft-model disclaimers and adult-review posture. No new risky advice was introduced by this report.
- Write-call scan shows pre-existing legitimate save, task, roster, deliverable, output, and transaction composables. This documentation pass introduced no mutations.

## 13. Build/Test Results

- `npm run test:classifier`: passed, 16/16 classifier tests.
- `npm run typecheck`: failed with known Nuxt auto-import/global typing errors and seed-script generic constraints. No error is tied to this documentation-only report.
- `NITRO_PRESET=node-server npm run build`: passed. Build emitted existing duplicate auto-import warnings and a chunk-size warning, but completed successfully.

## 14. Open Questions for David

1. Which P0 sections should receive the first model answers if only one class period is available?
2. Should “minimum viable answer” be visible on every section or only P0/P1 during final-week mode?
3. Should chiefs see a stricter approve-if/push-back-if rubric than students?
4. Should Advisor Mentor Q&A be available to all chiefs or admin/instructor only until smoke-tested?
5. Should task template creation remain manual for the rest of this cycle, or should an explicit admin-only task creation flow be considered after student testing?
