# Builder Engine Coverage and Architecture

## 1. Purpose

This document maps every Template Studio section to the right builder or engine pattern for the next implementation phase.

The goal is not to create twenty bespoke components. The goal is to cover the maximum number of sections with the smallest reusable architecture, while keeping the student experience clear enough that a tired senior does not have to guess what artifact a section requires.

Core principle:

> Do not reduce rigor. Reduce the hunt.

The platform context:

- Parent company: Renni Inc.
- Flagship brand: House Phoenix.
- Supporting brands: Lumen, Notice, Humble Oven.
- Current products: beanies, sweatshirts, t-shirts, baked goods, donations.
- Final outputs: TechTown pop-up, Brand & Operations Playbook, Phoenix Nest retail carry pitch.

## 2. Current Builder Inventory

| Component | Current supported sections / kinds | Data shape | Save behavior | Direct writes? | Reusable? | Should not be used for |
|---|---|---|---|---|---|---|
| `CustomerProfileBuilder.vue` | Ch. 4 `customer-segments` behind section placement/feature flag | Local primitive selections, deterministic classifier output, copyable profile text | Copy-to-Working-Draft only | No | Pattern source for future Section Engines | Finance math, approvals, status changes, automatic draft writes |
| `KeyActivitiesBuilder.vue` | Ch. 4 `key-activities` | Local activity selections plus reason fields | Copy-to-Working-Draft only | No | Reusable idea for categorized pickers, but current component is specific | Broad tables, finance, brand rules, pitch cards |
| `FinanceTableBuilder.vue` | `unit-cost`, `break-even`, `revenue-scenarios`, `donation-scenarios`, `kpi`, `revenue-streams`, `cost-structure` | Local rows from `kind` config; supports calculated cells and product imports | Copy-to-Working-Draft only | No | Yes, strong base for numeric/table sections | Non-table strategy, brand voice, decision memos |
| `OperationsChecklistBuilder.vue` | `inventory`, `day-of-sop`, `baked-goods-sop`, `continuity` | Local checklist/SOP rows from `kind` config | Copy-to-Working-Draft only | No | Yes, strong base for SOP/checklist sections | Market fit, price math, brand identity systems |
| `MarketFitBuilder.vue` | Ch. 7 pricing/retail sections, Ch. 8 scenarios, Ch. 10 target customers, Ch. 11 offer | Saved `marketFit` nested state on deliverable output section | Uses established `saveMarketFitBuilder` path; does not overwrite sibling fields | Yes, to existing deliverable output nested field | Medium; useful but complex | Simple prompts, quick tables, sections that only need one decision |
| `BrandFitBuilder.vue` | Ch. 5 voice/identity, Ch. 6 brand sheets/rules, Ch. 10 audience/messaging | Saved `brandFit` nested state on deliverable output section | Uses established `saveBrandFitBuilder` path; does not overwrite sibling fields | Yes, to existing deliverable output nested field | Medium; can seed Brand System Builder | Product inventory, finance, SOPs |
| `PricingStrategyBuilder.vue` | Ch. 8 `sale-price` | Saved `pricingStrategy` nested state on deliverable output section | Uses established `savePricingStrategyBuilder` path; does not overwrite sibling fields | Yes, to existing deliverable output nested field | Specialized but valuable | General finance tables already handled by `FinanceTableBuilder` |
| Market Builder editor in `DeliverableOutputWorkspace.vue` | Sections with `marketBuilder.enabled` | `marketBuilderEntries` structured demand/evidence entries | Existing section nested save path | Yes, to existing deliverable output nested field | Existing support layer, not a full builder | Full campaign/pitch/brand decisions |
| Structured Evidence editor in `DeliverableOutputWorkspace.vue` | All sections, with optional guidance | `structuredEvidence` entries | Existing section nested save path | Yes, to existing deliverable output nested field | Yes, cross-cutting rigor layer | Replacing the main artifact |
| `BuilderHandoffCallout.vue` | Used by copy-oriented builders | Static instructional callout | No save | No | Yes | Any automatic write claim |

Current architecture observations:

- Existing copy-only builders are safest for tonight: no new Firestore schema, no hidden Working Draft writes.
- Existing saved-state builders are acceptable only where already established and should not be expanded casually tonight.
- `FinanceTableBuilder` and `OperationsChecklistBuilder` prove the right pattern: one component, declarative variants, copy-as-markdown.
- Missing builder coverage is mostly table, checklist, memo, brand rule, pitch, and strategy card work.

## 3. Section Coverage Matrix

Inventory: 13 chapters, 89 sections.

Abbreviations:

- Current: `RP` recipe panel, `WS` Working Draft/output workspace, `EE` structured evidence editor, `MB` market builder entries, `CPB` Customer Profile Builder, `KAB` Key Activities Builder, `FT` FinanceTableBuilder, `OC` OperationsChecklistBuilder, `MF` MarketFitBuilder, `BF` BrandFitBuilder, `PS` PricingStrategyBuilder.
- Recommended families: Simple Prompt, Recipe Only, Universal Table Builder, Universal Checklist/SOP Builder, Decision Memo Builder, Brand System Builder, Retail Pitch Builder, Strategy Memo Builder, Product Catalog / Inventory Builder, Market / Value Proposition Engine, Campaign Builder, Existing FinanceTableBuilder, Existing OperationsChecklistBuilder, Existing CustomerProfileBuilder, Existing KeyActivitiesBuilder, Existing MarketFitBuilder, Existing BrandFitBuilder, Existing PricingStrategyBuilder.

| Chapter | Section id | Section title | Current interaction | Recommended interaction | Builder family | Existing builder | Missing builder need | Artifact | Final output | Priority | Owner | Reviewer | Dependency | Definition of done | Complexity | Implementation recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ch. 1 | company-overview | What is Renni Inc. and House Phoenix? | RP+WS+EE | Recipe Only | Recipe Only | None | None | Company summary | Playbook | P1 | Co-CEOs | Instructor/Admin | Brand architecture | Clear Renni Inc. + House Phoenix summary saved | Small | Add stronger example only |
| Ch. 1 | launch-focus | What are we launching, and where? | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Launch focus table | Launch summary | TechTown pop-up, Playbook | P0 | Co-CEOs | Instructor/Admin | Product list | Products, location, audience, success measure saved | Small | Cover with table config |
| Ch. 1 | current-progress | What is currently in the lineup? | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Status table | Progress table | Chief management, Playbook | P0 | Co-CEOs | Instructor/Admin | Product/task state | Ready, blocked, owner, next step saved | Small | Cover with table config |
| Ch. 1 | key-risks | What are the open questions or risks? | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Risk register | Risk table | Chief management, Playbook | P0 | Co-CEOs | Instructor/Admin | Launch readiness | Risk, impact, mitigation, owner saved | Small | Cover with table config |
| Ch. 1 | next-steps | What happens next before launch? | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Action checklist | Next-step checklist | TechTown pop-up | P0 | Co-CEOs | Instructor/Admin | P0 status | Owner, due date, dependency, done signal saved | Small | Cover with checklist config |
| Ch. 2 | parent-company | Renni Inc. — the parent company | RP+WS+EE | Simple Prompt | Simple Prompt | None | None | Parent company paragraph | Playbook | P1 | Co-CEOs | Instructor/Admin | None | Parent company role stated clearly | Small | Recipe/example only |
| Ch. 2 | brand-portfolio | The brand portfolio at a glance | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Brand portfolio table | Brand map | Playbook | P1 | CMO | Co-CEOs | Brand list | Each brand has role, audience, product, relationship | Small | Cover with table config |
| Ch. 2 | house-phoenix-role | House Phoenix — the primary brand | RP+WS+EE | Recipe Only | Recipe Only | None | None | Flagship brand role | Playbook | P1 | CMO | Co-CEOs | Ch. 5 | House Phoenix role and value stated | Small | Add example |
| Ch. 2 | supporting-brands | Supporting brands — Lumen, Notice, Humble Oven | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Supporting brand cards | Brand sheet summary | Playbook | P1 | CMO | Co-CEOs | Ch. 6 | Each brand has purpose, product, audience, owner | Small | Cover with table config |
| Ch. 2 | brand-relationship-rules | How the brands feel connected but distinct | RP+WS+EE | Brand System Builder | Brand System Builder | None | Cross-brand rule cards | Brand governance rules | Playbook | P2 | CMO | Co-CEOs | Ch. 5/6 | Shared and distinct rules saved | Medium | Pass B |
| Ch. 2 | future-brand-questions | Open questions for the next cohort | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Open question cards | Open question list | Next-cohort continuity | P2 | Co-CEOs | Instructor/Admin | Brand sheets | Question, owner, next decision saved | Small | Cover with memo config |
| Ch. 2 | mission | Mission — what Renni Inc. does now | RP+WS+EE | Simple Prompt | Simple Prompt | None | None | Mission sentence | Playbook | P1 | Co-CEOs | Instructor/Admin | None | One clear mission sentence saved | Small | Recipe/example only |
| Ch. 2 | vision | Vision — where Renni Inc. is going | RP+WS+EE | Simple Prompt | Simple Prompt | None | None | Vision statement | Playbook | P1 | Co-CEOs | Instructor/Admin | Mission | Plausible future statement saved | Small | Recipe/example only |
| Ch. 2 | values | Values — how Renni Inc. behaves | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Values table | Values list | Playbook | P1 | Co-CEOs | Instructor/Admin | Mission | 3-5 values with definitions saved | Small | Cover with table config |
| Ch. 2 | values-in-action | Values in action | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Behavior table | Values behavior map | Playbook | P1 | Co-CEOs | Instructor/Admin | Values | Value-to-action examples saved | Small | Cover with table config |
| Ch. 2 | decision-rules | Decision rules | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Decision rule cards | Decision rules | Chief management | P1 | Co-CEOs | Instructor/Admin | Values | If/then decision rules saved | Small | Cover with memo config |
| Ch. 3 | company-roles | Company roles | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Role table | Org map | Continuity | P1 | Co-CEOs | Instructor/Admin | Roster | Roles and responsibilities saved | Small | Cover with table config |
| Ch. 3 | decision-rights | Decision rights | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Decision-right cards | Authority map | Chief management | P1 | Co-CEOs | Instructor/Admin | Roles | Decisions, owner, escalation saved | Small | Cover with memo config |
| Ch. 3 | accountability-rhythm | Accountability rhythm | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Cadence checklist | Operating rhythm | Chief management | P1 | COO | Co-CEOs | Roles | Meeting/process cadence saved | Small | Cover with checklist config |
| Ch. 3 | succession-and-handoff | Succession and handoff | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Handoff checklist | Handoff plan | Next-cohort continuity | P0 | Co-CEOs | Instructor/Admin | Roles | Backup, package, lock date saved | Small | Cover with checklist config |
| Ch. 3 | recognition-and-credit | Recognition and credit | RP+WS+EE | Simple Prompt | Simple Prompt | None | None | Recognition norm | Continuity | P2 | Co-CEOs | Instructor/Admin | None | Fair credit norms saved | Small | Recipe/example only |
| Ch. 3 | continuity-risks | Continuity risks | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Continuity risk table | Risk register | Continuity | P1 | COO | Co-CEOs | Handoff | Risk, impact, prevention saved | Small | Cover with table config |
| Ch. 3 | next-cohort-playbook | Next-cohort first 30 days | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | None | First-30-days action cards | Handoff memo | Continuity | P0 | Co-CEOs | Instructor/Admin | Ch. 12/13 | Next cohort can act without translation | Medium | Pass B |
| Ch. 4 | customer-segments | Customer segments | CPB+MB+RP+WS+EE | Existing CustomerProfileBuilder | Existing CustomerProfileBuilder | CustomerProfileBuilder | None | Customer profile | BMC, marketing | P0 | Strategy and Growth | Co-CEOs | Customer evidence | Profile, fit reason, evidence saved | Done | Smoke only |
| Ch. 4 | value-propositions | Value propositions | MB+RP+WS+EE | Market / Value Proposition Engine | Market / Value Proposition Engine | MB support | Value prop engine | Value proposition map | BMC, brand, marketing | P0 | Strategy and Growth | Co-CEOs | Customer segments | Customer pain/gain tied to product proof | Large | Pass C |
| Ch. 4 | channels | Channels | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Channel map table | Channel map | BMC, campaign | P0 | CMO | Co-CEOs | Customer/product | Channels separated from activities | Small | Cover with table config |
| Ch. 4 | customer-relationships | Customer relationships | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Relationship table | Relationship model | BMC | P1 | CMO | Co-CEOs | Customer segments | Before/during/after relationship actions saved | Small | Cover with table config |
| Ch. 4 | revenue-streams | Revenue streams | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Revenue stream table | BMC, finance | P0 | CFO | Co-CEOs | Product/pricing | Revenue streams and assumptions saved | Done | Keep existing |
| Ch. 4 | key-activities | Key activities | KAB+RP+WS+EE | Existing KeyActivitiesBuilder | Existing KeyActivitiesBuilder | KeyActivitiesBuilder | None | Activity set | BMC, operations | P0 | COO | Co-CEOs | Business model | 5-7 repeatable activities with reasons saved | Done | Smoke only |
| Ch. 4 | key-resources | Key resources | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Resource table | Resource map | BMC, operations | P1 | COO | Co-CEOs | Key activities | Resource, role, owner, risk saved | Small | Cover with table config |
| Ch. 4 | key-partners | Key partners | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Partner table | Partner map | BMC, pitch | P1 | Co-CEOs | Instructor/Admin | Channels/resources | Partner, value, ask, owner saved | Small | Cover with table config |
| Ch. 4 | cost-structure | Cost structure | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Cost structure table | BMC, finance | P0 | CFO | Co-CEOs | Unit cost/resources | Fixed/variable costs and assumptions saved | Done | Keep existing |
| Ch. 4 | canvas-insights | Canvas insights | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | None | Insight cards | BMC synthesis | Playbook, strategy | P1 | Strategy and Growth | Co-CEOs | BMC sections | 3 insights and next actions saved | Medium | Pass B |
| Ch. 5 | audience | Who is this for? | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Audience table | Brand audience | Brand Book | P0 | CMO | Co-CEOs | Customer segments | Audience, feeling, evidence saved | Small | Cover with table config |
| Ch. 5 | value-proposition | What do we promise them? | RP+WS+EE | Market / Value Proposition Engine | Market / Value Proposition Engine | None | Brand promise engine | Brand value proposition | Brand Book | P0 | CMO | Co-CEOs | Ch. 4 value prop | Promise, proof, what-not saved | Large | Pass C or recipe fallback |
| Ch. 5 | voice | How does it sound? | BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder | Brand rule output layer | Voice rules | Brand Book, campaign | P0 | CMO | Co-CEOs | Brand audience | Do/don't and example copy saved | Medium | Pass B uses existing BF inputs |
| Ch. 5 | identity | How does it look? | BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder | Visual rule output layer | Visual identity rules | Brand Book | P0 | CMO | Co-CEOs | Brand audience/product | Color/type/logo/image notes saved | Medium | Pass B uses existing BF inputs |
| Ch. 6 | lumen-sheet | Lumen — candles | MB+BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder + MB | Supporting brand card | Brand sheet | Playbook | P1 | CMO | Co-CEOs | Ch. 2/5 | Audience, offer, voice, product, price saved | Medium | Pass B |
| Ch. 6 | notice-sheet | Notice — jewelry | MB+BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder + MB | Supporting brand card | Brand sheet | Playbook | P1 | CMO | Co-CEOs | Ch. 2/5 | Audience, offer, voice, product, price saved | Medium | Pass B |
| Ch. 6 | humble-oven-sheet | Humble Oven — baked goods | MB+BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder + MB | Supporting brand card | Brand sheet | Playbook, operations | P1 | CMO/COO | Co-CEOs | Products/ops | Audience, offer, voice, production cadence saved | Medium | Pass B |
| Ch. 6 | supporting-brand-comparison | Supporting brand comparison | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Comparison table | Brand comparison | Playbook | P1 | CMO | Co-CEOs | Brand sheets | Brand differences and overlap rules saved | Small | Cover with table config |
| Ch. 6 | cross-brand-rules | Cross-brand rules | BF+RP+WS+EE | Brand System Builder | Brand System Builder | BrandFitBuilder | Cross-brand rules | Brand governance | Playbook | P1 | CMO | Co-CEOs | Brand sheets | Shared/distinct do/don't rules saved | Medium | Pass B |
| Ch. 6 | launch-readiness | Launch readiness | MB+RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | MB support | Brand readiness checklist | Launch checklist | TechTown pop-up | P0 | CMO/COO | Co-CEOs | Brand/product | Per-brand readiness and fixes saved | Small | Cover with checklist config |
| Ch. 6 | open-questions | Open questions | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Open question cards | Decision backlog | Continuity | P2 | Co-CEOs | Instructor/Admin | Brand sheets | Question, owner, next action saved | Small | Cover with memo config |
| Ch. 7 | product-list | Current product list | RP+WS+EE | Product Catalog / Inventory Builder | Product Catalog / Inventory Builder | Product catalog utils | Product table | Product catalog | Playbook, finance, ops | P0 | COO/CFO | Co-CEOs | Instructor product list | Product, category, status saved | Medium | Use Universal Table with product options |
| Ch. 7 | product-story | Product story | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Product story table | Product story | Brand Book, campaign | P1 | CMO | Co-CEOs | Product list/audience | Product, customer, proof, story saved | Small | Cover with table config |
| Ch. 7 | pricing-summary | Pricing summary | MF+MB+RP+WS+EE | Existing MarketFitBuilder | Existing MarketFitBuilder | MarketFitBuilder | Optional summary table | Pricing rationale | Finance, pitch | P0 | CFO | Co-CEOs | Unit cost/sale price | Prices, rationale, assumptions saved | Small | Keep MF; add table fallback later |
| Ch. 7 | margin-and-break-even | Margin and break-even | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Margin table | Finance | P0 | CFO | Co-CEOs | Cost/price | Margin and break-even visible | Done | Keep existing |
| Ch. 7 | inventory-readiness | Inventory readiness | RP+WS+EE | Product Catalog / Inventory Builder | Product Catalog / Inventory Builder | Product catalog utils | Inventory readiness table | Inventory readiness | TechTown pop-up, pitch | P0 | COO | Co-CEOs | Product list | On-hand, ordered, ETA, risk saved | Medium | Use Universal Table with product options |
| Ch. 7 | pricing-risks | Pricing risks and open questions | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Pricing risk table | Risk register | Finance | P1 | CFO | Co-CEOs | Pricing tables | Risk, assumption, validation saved | Small | Cover with table config |
| Ch. 7 | retail-recommendations | Retail recommendations for Phoenix Nest | MF+MB+RP+WS+EE | Retail Pitch Builder | Retail Pitch Builder | MarketFitBuilder support | Retail recommendation cards | Retail recommendation | Phoenix Nest pitch | P0 | CFO/CMO | Co-CEOs | Product/pricing/inventory | Recommended carry products with proof saved | Medium | Pass B |
| Ch. 8 | unit-cost | What does a unit cost? | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Unit cost table | Finance | P0 | CFO | Co-CEOs | Product list | Known/assumed unit costs saved | Done | Keep existing |
| Ch. 8 | sale-price | What should we charge? | PS+MB+RP+WS+EE | Existing PricingStrategyBuilder | Existing PricingStrategyBuilder | PricingStrategyBuilder | None | Pricing decision | Finance | P0 | CFO | Co-CEOs | Unit cost | Price, margin, assumption saved | Done | Smoke only |
| Ch. 8 | planned-quantity | How many are we making? | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Quantity table | Quantity plan | Finance, ops | P0 | COO/CFO | Co-CEOs | Inventory/product | Planned quantity and assumption saved | Small | Cover with table config |
| Ch. 8 | break-even | Does the math work? | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Break-even table | Finance | P0 | CFO | Co-CEOs | Cost/price | Break-even table saved | Done | Keep existing |
| Ch. 8 | revenue-scenarios | Revenue scenarios — low / target / stretch | FT+MF+MB+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder + MF | None | Revenue scenario table | Finance | P0 | CFO | Co-CEOs | Price/quantity | Low/base/high scenarios saved | Done | Keep existing |
| Ch. 8 | donation-scenarios | Donation scenarios | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | Donation table | Finance | P1 | CFO | Co-CEOs | Donation plan | Donor count/gift assumptions saved | Done | Keep existing |
| Ch. 8 | key-financial-kpis | Key financial KPIs | FT+RP+WS+EE | Existing FinanceTableBuilder | Existing FinanceTableBuilder | FinanceTableBuilder | None | KPI table | Finance, management | P1 | CFO | Co-CEOs | Finance tables | KPI, target, source, owner saved | Done | Keep existing |
| Ch. 8 | post-event-recap | Post-event recap structure | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Recap table | Post-event recap | Strategy | P1 | CFO | Co-CEOs | Event actuals | Plan vs actual and lesson saved | Small | Cover with table config |
| Ch. 9 | inventory | What are we actually bringing? | OC+RP+WS+EE | Existing OperationsChecklistBuilder | Existing OperationsChecklistBuilder | OperationsChecklistBuilder | None | Inventory checklist | TechTown pop-up | P0 | COO | Co-CEOs | Product list | Quantity, location, owner, risk saved | Done | Keep existing |
| Ch. 9 | day-of-sop | How does pop-up day run? | OC+RP+WS+EE | Existing OperationsChecklistBuilder | Existing OperationsChecklistBuilder | OperationsChecklistBuilder | None | Day-of SOP | TechTown pop-up | P0 | COO | Co-CEOs | Launch details | Timeline, owner, backup saved | Done | Keep existing |
| Ch. 9 | baked-goods-sop | Baked goods — food safety | OC+RP+WS+EE | Existing OperationsChecklistBuilder | Existing OperationsChecklistBuilder | OperationsChecklistBuilder | None | Baked goods SOP | TechTown pop-up | P0 | COO | Instructor/Admin | Product/allergen data | Handling steps and warning saved | Done | Keep existing |
| Ch. 9 | continuity | Handoff to next cohort | OC+RP+WS+EE | Existing OperationsChecklistBuilder | Existing OperationsChecklistBuilder | OperationsChecklistBuilder | None | Continuity checklist | Continuity | P0 | COO | Co-CEOs | Ops outputs | Next owner/location/step saved | Done | Keep existing |
| Ch. 10 | target-customers | Target customers | MF+MB+RP+WS+EE | Existing MarketFitBuilder | Existing MarketFitBuilder | MarketFitBuilder | None | Campaign audience decision | Campaign, Playbook | P0 | CMO | Co-CEOs | Customer segments | Audience, product fit, proof saved | Done | Smoke only |
| Ch. 10 | customer-problems-and-desires | Customer problems and desires | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Problem/desire table | Customer insight | Campaign | P1 | CMO | Co-CEOs | Customer evidence | Problems, desires, evidence saved | Small | Cover with table config |
| Ch. 10 | insight-evidence | Evidence behind the insights | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB + EE support | Insight evidence table | Evidence table | Campaign, strategy | P0 | CMO | Co-CEOs | Feedback/evidence | Claim, source, assumption flag saved | Small | Cover with table config |
| Ch. 10 | feedback-plan | Feedback plan | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Feedback checklist | Feedback plan | TechTown pop-up | P0 | CMO | Co-CEOs | Launch plan | Method, script, storage plan saved | Small | Cover with checklist config |
| Ch. 10 | implications-for-launch | Implications for launch | MB+RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | MB support | Launch implication cards | Launch strategy | Campaign | P1 | CMO | Co-CEOs | Insight evidence | Insight, decision, owner saved | Medium | Pass B |
| Ch. 10 | audience | Who are we trying to reach? | BF+RP+WS+EE | Existing BrandFitBuilder | Existing BrandFitBuilder | BrandFitBuilder | None | Campaign audience | Campaign | P1 | CMO | Co-CEOs | Target customers | Audience and brand fit saved | Done | Keep existing |
| Ch. 10 | touchpoints | What touchpoints? | RP+WS+EE | Campaign Builder | Campaign Builder | None | Touchpoint calendar | Campaign calendar | TechTown pop-up | P0 | CMO | Co-CEOs | Channels | Before/during/after touchpoints saved | Large | Pass C or table fallback |
| Ch. 10 | messaging | What do we say? | BF+RP+WS+EE | Campaign Builder | Campaign Builder | BrandFitBuilder support | Message cards | Campaign copy | Campaign | P0 | CMO | Co-CEOs | Brand voice/audience | Audience, angle, call to action, proof saved | Large | Pass C or BrandSystem fallback |
| Ch. 10 | measurement | How will we know what worked? | MB+RP+WS+EE | Universal Table Builder | Universal Table Builder | MB support | Measurement table | Campaign metrics | Campaign, strategy | P0 | CMO | Co-CEOs | Campaign plan | Metric, target, source, owner saved | Small | Cover with table config |
| Ch. 11 | identity | Who are we? | RP+WS+EE | Retail Pitch Builder | Retail Pitch Builder | None | Pitch identity card | Buyer-facing identity | Phoenix Nest pitch | P0 | Co-CEOs/CMO | Instructor/Admin | Brand/product story | Clear buyer-facing identity saved | Medium | Pass B |
| Ch. 11 | evidence | What did the pop-up actually prove? | MB+RP+WS+EE | Retail Pitch Builder | Retail Pitch Builder | MB + EE support | Proof card/table | Buyer proof | Phoenix Nest pitch | P0 | Strategy and Growth | Co-CEOs | Sales/customer data | Proof points with sources saved | Medium | Pass B |
| Ch. 11 | offer | What would retail carry look like? | MF+MB+RP+WS+EE | Retail Pitch Builder | Retail Pitch Builder | MarketFitBuilder support | Offer card/table | Retail offer | Phoenix Nest pitch | P0 | CFO/COO | Co-CEOs | Product/pricing/inventory | SKU, price, margin, readiness saved | Medium | Pass B |
| Ch. 11 | ask | What is the ask? | MB+RP+WS+EE | Retail Pitch Builder | Retail Pitch Builder | MB support | Ask card | Retail buyer ask | Phoenix Nest pitch | P0 | Co-CEOs | Instructor/Admin | Offer/evidence | Concrete ask and next step saved | Medium | Pass B |
| Ch. 12 | what-we-learned | What we learned from the launch | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | None | Lesson cards | Learning memo | Strategy | P0 | Strategy and Growth | Co-CEOs | Launch evidence | Lessons with assumption tags saved | Medium | Pass B |
| Ch. 12 | customer-and-sales-insights | Customer and sales insights | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | EE support | Insight cards | Insight memo | Strategy | P0 | Strategy and Growth | Co-CEOs | Customer/sales data | Evidence-backed insights saved | Medium | Pass B |
| Ch. 12 | operational-lessons | Operational lessons | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Ops lesson checklist | Ops improvement list | Strategy, continuity | P1 | COO | Co-CEOs | Ch. 9/event | Lesson, fix, owner saved | Small | Cover with checklist config |
| Ch. 12 | brand-and-product-priorities | Brand and product priorities | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | None | Priority cards | Priority memo | Strategy | P1 | CMO | Co-CEOs | Brand/product evidence | Priority, evidence, next step saved | Medium | Pass B |
| Ch. 12 | next-semester-goals | Next-semester goals | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Goal table | Goal plan | Strategy, continuity | P0 | Strategy and Growth | Co-CEOs | Lessons/KPIs | Goal, metric, owner, target saved | Small | Cover with table config |
| Ch. 12 | risks-and-open-questions | Risks and open questions | RP+WS+EE | Universal Table Builder | Universal Table Builder | None | Risk/open question table | Strategy risk list | Strategy | P1 | Co-CEOs | Instructor/Admin | Strategy sections | Risk/question, owner, validation saved | Small | Cover with table config |
| Ch. 12 | recommended-action-plan | Recommended action plan | RP+WS+EE | Strategy Memo Builder | Strategy Memo Builder | None | Action cards | Strategy action plan | Strategy | P0 | Co-CEOs | Instructor/Admin | Ch. 12 sections | Actions with owner, due, dependency saved | Medium | Pass B |
| Ch. 13 | major-decisions | Major decisions | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Decision log cards | Decision log | Handoff | P0 | Co-CEOs | Instructor/Admin | Decision history | Decisions with date, decider, summary saved | Small | Cover with memo config |
| Ch. 13 | decision-rationale | Decision rationale | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Rationale cards | Decision rationale | Handoff | P0 | Co-CEOs | Instructor/Admin | Major decisions | Evidence, tradeoff, risk saved | Small | Cover with memo config |
| Ch. 13 | evidence-appendix | Evidence appendix | RP+WS+EE | Universal Table Builder | Universal Table Builder | EE support | Evidence index table | Evidence appendix | Playbook | P1 | Strategy and Growth | Co-CEOs | Evidence entries | Source, claim, section used saved | Small | Cover with table config |
| Ch. 13 | templates-and-links | Templates and links | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Link checklist | Appendix index | Handoff | P0 | COO | Co-CEOs | Final assets | Link, purpose, access note saved | Small | Cover with checklist config |
| Ch. 13 | unresolved-decisions | Unresolved decisions | RP+WS+EE | Decision Memo Builder | Decision Memo Builder | None | Unresolved decision cards | Open decision list | Handoff | P1 | Co-CEOs | Instructor/Admin | Decision log | Decision, owner, blocker, due saved | Small | Cover with memo config |
| Ch. 13 | next-cohort-instructions | Next-cohort instructions | RP+WS+EE | Universal Checklist/SOP Builder | Universal Checklist/SOP Builder | None | Handoff instruction checklist | Next-cohort guide | Handoff | P0 | Co-CEOs | Instructor/Admin | Ch. 12/13 | Start-here instructions saved | Small | Cover with checklist config |

## 4. Reusable Architecture Recommendation

### Architecture rule

Do not build individual one-off builders for each section. Build a small number of config-driven components and attach them through optional Template Studio config.

### A. `UniversalSectionTableBuilder`

Purpose: cover tables, maps, registers, product lists, KPI lists, goal lists, and evidence indexes.

Config:

```ts
type UniversalTableBuilderConfig = {
  enabled: boolean
  kind: string
  title: string
  intro?: string
  columns: Array<{
    key: string
    label: string
    type: "text" | "number" | "select" | "textarea"
    options?: string[]
    placeholder?: string
    wide?: boolean
    productAutocomplete?: boolean
  }>
  starterRows?: Array<Record<string, string>>
  starterRowCount?: number
  copyTitle?: string
  evidencePrompt?: string
}
```

Behavior:

- Local state only.
- Copy-as-markdown.
- No direct Firestore write.
- No automatic Working Draft mutation.
- Optional product options/autocomplete.
- Existing Working Draft remains visible.

Best tonight coverage:

- Ch. 1 launch/status/risk sections
- Ch. 2 portfolio/values sections
- Ch. 3 roles/risks
- Ch. 4 channels/resources/partners/relationships
- Ch. 7 product/inventory/pricing risk
- Ch. 8 planned quantity/post-event recap
- Ch. 10 insight/measurement
- Ch. 12 goals/risks
- Ch. 13 evidence appendix

### B. `UniversalChecklistBuilder`

Purpose: cover action lists, SOPs, handoff checklists, feedback plans, launch readiness, and next-cohort instructions.

Config:

```ts
type UniversalChecklistBuilderConfig = {
  enabled: boolean
  kind: string
  title: string
  intro?: string
  rows?: Array<{
    label: string
    owner?: string
    due?: string
    status?: "Not started" | "In progress" | "Ready" | "Blocked"
    materials?: string
    backup?: string
    doneSignal?: string
  }>
  fields?: Array<"owner" | "due" | "status" | "materials" | "backup" | "doneSignal" | "risk" | "nextStep">
  copyTitle?: string
}
```

Behavior:

- Local state only.
- Copy-as-markdown.
- No direct Firestore write.
- Works as a generalized sibling to `OperationsChecklistBuilder`.

Best tonight coverage:

- Ch. 1 next steps
- Ch. 3 handoff/accountability
- Ch. 6 launch readiness
- Ch. 10 feedback plan
- Ch. 12 operational lessons
- Ch. 13 templates/links and next-cohort instructions

### C. `DecisionMemoBuilder`

Purpose: cover decisions, rationales, open questions, decision rights, and unresolved choices.

Config:

```ts
type DecisionMemoBuilderConfig = {
  enabled: boolean
  kind: string
  title: string
  intro?: string
  cards: Array<{
    decision?: string
    options?: string
    evidence?: string
    criteria?: string
    recommendation?: string
    risk?: string
    owner?: string
    dueDate?: string
    definitionOfDone?: string
  }>
  copyTitle?: string
}
```

Behavior:

- Local state only.
- Copy-as-markdown.
- Excellent fit for Ch. 13 and chief governance sections.

### D. `BrandSystemBuilder`

Purpose: convert brand work from abstract writing into concrete brand decisions.

Config:

```ts
type BrandSystemBuilderConfig = {
  enabled: boolean
  kind: "house-phoenix" | "supporting-brand" | "cross-brand"
  title: string
  audience?: boolean
  promise?: boolean
  voiceTraits?: boolean
  visualRules?: boolean
  proofPoints?: boolean
  copyExamples?: boolean
  doDontRules?: boolean
}
```

Card fields:

- audience
- promise
- voice trait
- do/don't
- sample copy
- visual rule
- proof

Behavior:

- Prefer copy-to-Working-Draft for V1.
- May read saved Brand Fit state later, but should not silently import or overwrite it.
- Should not become design software.

### E. `RetailPitchBuilder`

Purpose: help students build the Phoenix Nest carry pitch without confusing it with general marketing.

Config:

```ts
type RetailPitchBuilderConfig = {
  enabled: boolean
  kind: "identity" | "evidence" | "offer" | "ask" | "recommendation"
  title: string
  includeBuyer?: boolean
  includeProductSku?: boolean
  includeShelfFit?: boolean
  includePriceMargin?: boolean
  includeProof?: boolean
  includeReadiness?: boolean
  includeAsk?: boolean
  includeRisk?: boolean
  includeNextStep?: boolean
}
```

Behavior:

- Local state only for tonight.
- Copy-as-markdown.
- Product options may prefill suggestions but never overwrite.

### F. `StrategyMemoBuilder`

Purpose: convert learning, insights, and next-semester recommendations into action cards.

Config:

```ts
type StrategyMemoBuilderConfig = {
  enabled: boolean
  kind: "lesson" | "insight" | "priority" | "action-plan" | "first-30-days"
  title: string
  cardCount?: number
  fields: Array<"insight" | "evidence" | "recommendation" | "owner" | "dueDate" | "dependency" | "definitionOfDone" | "nextValidation" | "risk">
}
```

Behavior:

- Local state only.
- Copy-as-markdown.
- Best for Ch. 12 and synthesis sections.

## 5. Data Model / Type Changes Needed

Minimal changes should live in `app/types/templateStudio.ts`.

Add optional config fields only:

```ts
universalTable?: UniversalTableBuilderConfig
universalChecklist?: UniversalChecklistBuilderConfig
decisionMemo?: DecisionMemoBuilderConfig
brandSystem?: BrandSystemBuilderConfig
retailPitch?: RetailPitchBuilderConfig
strategyMemo?: StrategyMemoBuilderConfig
```

Rules:

- No migration required.
- Sections without config render exactly as they do now.
- Config absence means builder is off.
- Existing flags remain valid.
- New builders should be copy-only V1 unless there is an explicit reason to reuse an existing established save path.
- No new Firestore schema is required tonight.

Optional shared types:

```ts
type CopyOnlyBuilderFieldType = "text" | "number" | "select" | "textarea"

type CopyOnlyBuilderColumn = {
  key: string
  label: string
  type: CopyOnlyBuilderFieldType
  options?: string[]
  placeholder?: string
  wide?: boolean
}
```

## 6. Rendering Integration

`DeliverableOutputWorkspace.vue` should render builders in this order:

1. Existing specific builders:
   - `chipPickQuickStart`
   - `keyActivities`
   - `financeTable`
   - `operationsChecklist`
   - `marketFit`
   - `brandFit`
   - `pricingStrategy`
2. New universal config builders:
   - `universalTable`
   - `universalChecklist`
   - `decisionMemo`
   - `brandSystem`
   - `retailPitch`
   - `strategyMemo`
3. Existing cross-cutting editors:
   - Structured Evidence
   - Market Builder entries where enabled
   - Working Draft
   - Final Playbook preview

Conflict rule:

- Never render duplicate/conflicting primary builders.
- If an existing builder is enabled, do not also render a universal builder unless the universal builder is explicitly marked as a secondary support pattern.
- Keep Working Draft visible near the builder.
- Keep Structured Evidence visible.
- Keep `BuilderHandoffCallout` visible for every copy-only builder.

Recommended helper:

```ts
function primaryBuilderForSection(section: TemplateStudioSection): BuilderKind | null {
  if (section.chipPickQuickStart?.enabled) return "customer-profile"
  if (section.keyActivities?.enabled) return "key-activities"
  if (section.financeTable?.enabled) return "finance-table"
  if (section.operationsChecklist?.enabled) return "operations-checklist"
  if (section.pricingStrategy?.enabled) return "pricing-strategy"
  if (section.marketFit?.enabled) return "market-fit"
  if (section.brandFit?.enabled) return "brand-fit"
  if (section.universalTable?.enabled) return "universal-table"
  if (section.universalChecklist?.enabled) return "universal-checklist"
  if (section.decisionMemo?.enabled) return "decision-memo"
  if (section.brandSystem?.enabled) return "brand-system"
  if (section.retailPitch?.enabled) return "retail-pitch"
  if (section.strategyMemo?.enabled) return "strategy-memo"
  return null
}
```

## 7. Builder-To-Working-Draft Standard

Universal copy:

1. Fill the builder, table, or checklist.
2. Copy the useful output.
3. Paste into Working Draft.
4. Edit in your own words.
5. Add structured evidence for major claims.
6. Save.
7. Submit only when ready for chief review.

Builder copy:

> This tool helps you build the answer. It does not submit, approve, or save the final section for you. Copy useful output into Working Draft, revise it in your own words, add evidence for major claims, then save.

## 8. Priority Implementation Passes

### Pass A: Universal Builder Foundation Pack

Components:

- `UniversalSectionTableBuilder`
- `UniversalChecklistBuilder`
- `DecisionMemoBuilder`

Sections covered:

- Roughly 45-55 sections receive a better-fit interaction with three components.
- Highest coverage: Ch. 1, Ch. 2, Ch. 3, Ch. 4 non-engine gaps, Ch. 7 product/inventory gaps, Ch. 8 planned quantity/recap, Ch. 10 feedback/measurement, Ch. 12 goals/risks, Ch. 13 decisions/handoff.

Files to change later:

- `app/types/templateStudio.ts`
- `app/components/UniversalSectionTableBuilder.vue`
- `app/components/UniversalChecklistBuilder.vue`
- `app/components/DecisionMemoBuilder.vue`
- `app/components/DeliverableOutputWorkspace.vue`
- selected `app/data/templateStudios/*.ts`

Risk:

- Low if copy-only and config-driven.
- Main risk is clutter if duplicate builders render.

Expected impact:

- Biggest immediate student usability lift.
- Makes many sections artifact-first without new persistence.

Build/test commands:

```text
npm run typecheck
NITRO_PRESET=node-server npm run build
```

Manual smoke checklist:

- Builder renders only on configured sections.
- Copy works.
- Working Draft remains editable.
- Save path unchanged.
- Submit gate unchanged.
- Structured Evidence remains visible.
- No duplicate builder appears.

### Pass B: Specialized High-Value Builder Pack

Components:

- `BrandSystemBuilder`
- `RetailPitchBuilder`
- `StrategyMemoBuilder`

Sections covered:

- Ch. 5 voice/identity/value proposition
- Ch. 6 supporting brand sheets/rules
- Ch. 7 retail recommendations
- Ch. 10 messaging fallback if Campaign Builder waits
- Ch. 11 Phoenix Nest pitch
- Ch. 12 strategy recommendations

Files to change later:

- `app/types/templateStudio.ts`
- `app/components/BrandSystemBuilder.vue`
- `app/components/RetailPitchBuilder.vue`
- `app/components/StrategyMemoBuilder.vue`
- `app/components/DeliverableOutputWorkspace.vue`
- relevant Template Studio chapter files

Risk:

- Medium. These are more domain-specific and need careful student-facing examples.

Expected impact:

- Major improvement to Brand & Operations Playbook and Phoenix Nest pitch readiness.

Build/test commands:

```text
npm run typecheck
NITRO_PRESET=node-server npm run build
```

Manual smoke checklist:

- Brand rules produce do/don't and sample copy.
- Retail pitch produces buyer, SKU, proof, ask.
- Strategy memo produces insight, evidence, action.
- No AI-generated student deliverables.
- Copy-to-Working-Draft remains manual.

### Pass C: Larger Engines

Components:

- Market / Value Proposition Engine
- Campaign Builder

Sections covered:

- Ch. 4 value propositions
- Ch. 5 value proposition
- Ch. 10 touchpoints and messaging
- Future campaign and audience fit sections

Files to change later:

- New engine utilities
- New builder components
- Template Studio config
- Optional deterministic classifier/rules

Risk:

- High if built before student smoke results.
- More likely to overbuild or overwhelm.

Expected impact:

- High, but should follow Pass A and Pass B unless the team has confirmed existing builder handoffs work for real students.

Build/test commands:

```text
npm run test:classifier
npm run typecheck
NITRO_PRESET=node-server npm run build
```

Manual smoke checklist:

- Student understands why the output was produced.
- No raw scores shown.
- No AI call.
- No hidden save.
- Output handoff is clear.

## 9. Advisor Integration Note

Builder architecture should feed the C-suite Advisor later through metadata, not hidden writes.

Each section should expose:

- artifact type
- completion priority
- owner
- reviewer
- dependency
- definition of done
- builder family
- missing task coverage
- chief review standard
- next action language

Advisor use:

- Daily Chief Brief can point chiefs to P0 sections with missing artifacts.
- Section Rescue can use artifact type and builder family to explain what is weak.
- Task Coverage Doctor can suggest manual task templates.
- Approval Coach can compare output against definition of done.
- Final Week Triage can group sections by lane and priority.

Guardrail:

- Advisor may recommend manual action.
- Advisor must not create tasks, submit, approve, change status, or overwrite student work.

## 10. Guardrails

Do not build:

- Automatic task creation
- Submit, approval, or status mutation
- Hidden Working Draft writes
- POS, payment, checkout, tax, refund, or inventory decrement behavior
- Google Drive or OAuth integration
- AI-generated student deliverables
- New Firestore schema unless explicitly required later
- New dependencies

Use Playbook terminology.

Square may be referenced only as an external point-of-sale system outside Renni Command Center.

## 11. Exact Claude Code Implementation Prompts

### Prompt A: Universal Builder Foundation Pack

```text
You are working in the existing Renni Command Center repo.

This is an implementation pass, not greenfield.

Goal:
Add the universal copy-only builder foundation so many Template Studio sections get the right artifact type without creating bespoke components.

Implement:
1. Add optional Template Studio config types:
   - universalTable
   - universalChecklist
   - decisionMemo
2. Add components:
   - app/components/UniversalSectionTableBuilder.vue
   - app/components/UniversalChecklistBuilder.vue
   - app/components/DecisionMemoBuilder.vue
3. All three components must be local-state and copy-to-Working-Draft only.
4. No direct Firestore writes.
5. No automatic Working Draft mutation.
6. Use BuilderHandoffCallout.
7. Wire rendering in DeliverableOutputWorkspace after existing specific builders.
8. Prevent duplicate/conflicting builders.
9. Configure high-impact sections from Pass A in Template Studio files.

Guardrails:
- No automatic task creation.
- No submit/approval/status changes.
- No POS, payment, checkout, tax, refund, or inventory decrement behavior.
- No Google Drive or OAuth integration.
- No AI-generated student deliverables.
- No package changes.
- Use Playbook terminology.

Run:
npm run typecheck
NITRO_PRESET=node-server npm run build

Return changed files, configured sections, and smoke checklist results.
```

### Prompt B: Specialized Builder Pack

```text
You are working in the existing Renni Command Center repo.

Goal:
Add specialized copy-only builders for high-value final outputs without changing persistence behavior.

Implement:
1. Add optional Template Studio config types:
   - brandSystem
   - retailPitch
   - strategyMemo
2. Add components:
   - app/components/BrandSystemBuilder.vue
   - app/components/RetailPitchBuilder.vue
   - app/components/StrategyMemoBuilder.vue
3. Each component must:
   - use local state only
   - copy markdown output
   - keep Working Draft handoff manual
   - never submit or approve
   - never change task/status/deliverable state
4. Configure:
   - Ch. 5 voice/identity/value-proposition
   - Ch. 6 supporting brand/rules sections
   - Ch. 7 retail recommendations
   - Ch. 11 Phoenix Nest pitch sections
   - Ch. 12 strategy/action sections

Guardrails:
- No new Firestore schema.
- No hidden draft writes.
- No AI-generated student deliverables.
- No POS, payment, checkout, tax, refund, or inventory decrement behavior.
- No Google Drive or OAuth integration.
- Use Playbook terminology.

Run:
npm run typecheck
NITRO_PRESET=node-server npm run build

Return changed files, configured sections, and before/after student workflow summary.
```

### Prompt C: C-suite Advisor Integration With Builder Coverage

```text
You are working in the existing Renni Command Center repo.

Goal:
Feed builder coverage metadata into the C-suite Advisor and Project Navigator without introducing mutations.

Implement:
1. Add a pure utility that derives section coverage metadata:
   - chapter
   - section id
   - priority
   - owner
   - reviewer
   - artifact type
   - builder family
   - definition of done
   - dependency
   - first action
2. Use this metadata in:
   - Project Navigator display-only signals
   - Executive Advisor context V2
   - task coverage gap detection
3. Advisor may recommend manual task titles but must not create tasks.
4. Advisor must cite section ids/source ids for every recommendation.

Guardrails:
- No Firestore writes from metadata utilities.
- No task creation.
- No status, approval, or submit mutation.
- No hidden Working Draft writes.
- No POS, payment, checkout, tax, refund, or inventory decrement behavior.
- No Google Drive or OAuth integration.
- Use Playbook terminology.

Run:
npm run typecheck
NITRO_PRESET=node-server npm run build

Return files changed, context fields added, and read-only verification.
```

### Prompt D: Codex Verification

```text
Audit the latest Renni Command Center branch after the builder coverage implementation.

Review-only. Do not edit files.

Verify:
1. UniversalSectionTableBuilder, UniversalChecklistBuilder, and DecisionMemoBuilder are config-driven.
2. Specialized builders, if implemented, are config-driven.
3. No bespoke per-section components were created.
4. Existing builders still render on existing configured sections.
5. New builders do not render alongside conflicting existing primary builders.
6. Working Draft remains visible.
7. Structured Evidence remains visible.
8. Copy-to-Working-Draft handoff is clear.
9. No automatic draft mutation occurs.
10. No submit/approval/status/task mutation was introduced.
11. No POS, payment, checkout, tax, refund, or inventory decrement behavior exists.
12. No Google Drive or OAuth behavior exists.
13. Build passes.

Run:
git status --short
git log --oneline -10
rg -n "POS|checkout|refund|tax|payment|inventory decrement|decrement|googleapis|drive\\.google|docs\\.google|oauth|scope" app server firestore scripts package.json
rg -n "updateDoc|setDoc|addDoc|deleteDoc|writeBatch|runTransaction" app server
npm run typecheck
NITRO_PRESET=node-server npm run build

Return PASS / PASS WITH WARNINGS / FAIL with exact file and line references.
```

## 12. Implementation Status — Pass A (Universal Builder Foundation Pack)

**Pass A is implemented.** Three reusable copy-only builders ship,
plus `~38 sections` opt in across 11 studio files. The build is
green, classifier tests pass, and zero Firestore / AI / OAuth
introduced.

### Files added
- `app/components/UniversalSectionTableBuilder.vue` — generic table
  builder driven by `section.universalTable`. Supports text /
  number / select / textarea columns, optional product
  autocomplete, and copy-as-markdown.
- `app/components/UniversalChecklistBuilder.vue` — generic checklist
  / SOP builder driven by `section.universalChecklist`. Configurable
  field set (owner / due / status / materials / backup / doneSignal
  / risk / nextStep). Copy-as-markdown.
- `app/components/DecisionMemoBuilder.vue` — generic decision memo
  builder driven by `section.decisionMemo`. Each card carries
  decision · options · evidence · criteria · recommendation · risk
  · owner · dueDate · definitionOfDone. Copy-as-markdown.

### Files updated
- `app/types/templateStudio.ts` — adds optional `universalTable`,
  `universalChecklist`, `decisionMemo` configs on
  `TemplateStudioSection` plus the `CopyOnlyBuilderColumn` /
  `CopyOnlyBuilderFieldType` / config types.
- `app/components/DeliverableOutputWorkspace.vue` — registers the
  three new components, adds `hasPrimaryBuilder()` conflict guard,
  mounts the universal builders directly after the existing
  primary builder mounts (Operations Checklist), with `ust-<id>` /
  `ucl-<id>` / `dmb-<id>` anchor wrappers.
- 11 studio files configured (executive-summary, brand-architecture,
  company-structure-continuity, business-model-canvas,
  house-phoenix-brand-story, supporting-brand-sheets,
  current-product-line, pricing-break-even, pop-up-campaign,
  strategy-next-semester, decision-log-appendices).

### Sections configured (Pass A)

**Universal Table (27):**
- Ch. 1: launch-focus, current-progress, key-risks
- Ch. 2: brand-portfolio, supporting-brands, values, values-in-action
- Ch. 3: company-roles, continuity-risks
- Ch. 4: channels, customer-relationships, key-resources, key-partners
- Ch. 5: audience
- Ch. 6: supporting-brand-comparison
- Ch. 7: product-list, product-story, inventory-readiness, pricing-risks
- Ch. 8: planned-quantity, post-event-recap
- Ch. 10: customer-problems-and-desires, insight-evidence, measurement
- Ch. 12: next-semester-goals, risks-and-open-questions
- Ch. 13: evidence-appendix

**Universal Checklist (8):**
- Ch. 1: next-steps
- Ch. 3: accountability-rhythm, succession-and-handoff
- Ch. 6: launch-readiness
- Ch. 10: feedback-plan
- Ch. 12: operational-lessons
- Ch. 13: templates-and-links, next-cohort-instructions

**Decision Memo (7):**
- Ch. 2: future-brand-questions, decision-rules
- Ch. 3: decision-rights
- Ch. 6: open-questions
- Ch. 13: major-decisions, decision-rationale, unresolved-decisions

### Conflict guard
`hasPrimaryBuilder(section)` short-circuits the universal mount
whenever a section already has an existing primary builder
(chip-pick QuickStart / Customer Profile / Key Activities / Finance
Table / Operations Checklist / Market Fit / Brand Fit / Pricing
Strategy). The existing primary always wins; the universal config
silently no-ops on those sections.

### Known limitations
- The `pricing-summary` (Ch. 7), `target-customers` (Ch. 10), and
  `audience` / `messaging` (Ch. 10) sections have existing primary
  builders (Market Fit / Brand Fit) that already cover their
  artifact need. They were not opted into the universal builders
  per the conflict guard.
- The `next-cohort-playbook` (Ch. 3) and `canvas-insights` (Ch. 4)
  sections were tagged in the doc as Strategy Memo Builder targets —
  Pass B work.
- Brand System Builder (Ch. 5 voice/identity, Ch. 6 brand sheets) is
  Pass B work — not in Pass A scope. The existing Brand Fit Builder
  continues to render on those sections.
- No live browser smoke this pass. Verification is static review +
  green build. Recommend a 60-second click-through on a few
  configured sections before the next class.

## 13. Implementation Status — Pass B (Specialized Builder Pack)

**Pass B is implemented.** Three specialized copy-only builders ship.
12 sections opted in across 6 studio files. 8 sections were
deliberately skipped because an existing saved-state builder
(BrandFit / MarketFit) already covers their primary surface.

### Files added
- `app/components/BrandSystemBuilder.vue` — copy-only brand builder
  driven by `section.brandSystem`. Per-field opt-in for audience /
  promise / voiceTraits / visualRules / proofPoints / copyExamples
  / doDontRules. Three kinds: house-phoenix · supporting-brand ·
  cross-brand.
- `app/components/RetailPitchBuilder.vue` — copy-only retail-carry
  pitch builder driven by `section.retailPitch`. Per-field
  include flags for buyer / productSku / shelfFit / priceMargin /
  proof / readiness / ask / risk / nextStep. Optional product
  autocomplete on the SKU column. Five kinds: identity ·
  evidence · offer · ask · recommendation.
- `app/components/StrategyMemoBuilder.vue` — copy-only strategy
  memo builder driven by `section.strategyMemo`. Configurable
  field set across insight / evidence / recommendation / owner /
  dueDate / dependency / definitionOfDone / nextValidation / risk.
  Five kinds: lesson · insight · priority · action-plan ·
  first-30-days.

### Files updated
- `app/types/templateStudio.ts` — adds `brandSystem` /
  `retailPitch` / `strategyMemo` optional configs on
  `TemplateStudioSection` plus their supporting types.
- `app/components/DeliverableOutputWorkspace.vue` — registers
  the three new components, extends `hasPrimaryBuilder()` and
  introduces `hasOtherPrimaryBuilder()` so universal builders
  short-circuit when a Pass B specialized builder is enabled.
  Mounts the three new builders directly after the Pass A
  universal mounts, with `bsb-<id>` / `rpb-<id>` / `smb-<id>`
  anchor wrappers.

### Sections configured (Pass B — 12 total)

**Brand System Builder (2):**
- Ch. 2 brand-relationship-rules (cross-brand kind)
- Ch. 5 value-proposition (house-phoenix kind)

**Retail Pitch Builder (3):**
- Ch. 11 identity (identity kind)
- Ch. 11 evidence (evidence kind)
- Ch. 11 ask (ask kind)

**Strategy Memo Builder (7):**
- Ch. 3 next-cohort-playbook (first-30-days kind)
- Ch. 4 canvas-insights (insight kind)
- Ch. 10 implications-for-launch (insight kind)
- Ch. 12 what-we-learned (lesson kind)
- Ch. 12 customer-and-sales-insights (insight kind)
- Ch. 12 brand-and-product-priorities (priority kind)
- Ch. 12 recommended-action-plan (action-plan kind)

### Sections intentionally skipped (8 — existing builder conflict)

**BrandSystemBuilder skipped on (BrandFit already mounted):**
- Ch. 5 voice — BrandFitBuilder
- Ch. 5 identity — BrandFitBuilder
- Ch. 6 lumen-sheet — BrandFitBuilder
- Ch. 6 notice-sheet — BrandFitBuilder
- Ch. 6 humble-oven-sheet — BrandFitBuilder
- Ch. 6 cross-brand-rules — BrandFitBuilder

**RetailPitchBuilder skipped on (MarketFit already mounted):**
- Ch. 7 retail-recommendations — MarketFitBuilder
- Ch. 11 offer — MarketFitBuilder

The brief explicitly allowed "If unsure, skip the specialized
config and report it." For V1 we skipped to avoid double-mounting
a saved-state builder alongside a specialized copy-only builder
on the same section. A future pass could mount the specialized
builder as a clearly labeled "Build the buyer-facing pitch" or
"Turn your Brand Fit choices into rules" support builder if the
team wants both surfaces.

### Conflict guard (Pass B)
`hasPrimaryBuilder()` now returns true for brandSystem /
retailPitch / strategyMemo flags — so Pass A universal builders
also short-circuit when a Pass B specialized config is enabled
on the same section.

`hasOtherPrimaryBuilder(s, excluding)` lets the three Pass B
mounts each render exactly when no other primary (existing or
Pass B) wins on the section. In practice no section enables more
than one Pass B flag, but the guard makes the math safe.

### Known limitations
- 8 of the 20 candidate sections were skipped because an existing
  saved-state builder (BrandFit / MarketFit) already covers their
  primary surface. Documented above.
- No live browser smoke this pass. Verification is static review +
  green build. Recommend a 60-second click-through on a Brand
  System, Retail Pitch, and Strategy Memo section before the next
  class.
- Per-field starter copy is generic — real classroom use will
  surface which fields each section actually wants populated.

