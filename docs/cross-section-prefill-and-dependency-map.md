# Cross-Section Prefill and Dependency Map

V1 design: enter once, reuse where useful, **never silently overwrite
student work.** The platform's launch surfaces all rely on the same
small set of facts (the products Renni Inc. is selling, the donations
revenue stream, the customer profiles, the key activities). This doc
maps where those facts originate and where they feed.

## Source-of-truth concept

The **Product Catalog** (`app/utils/productCatalog.ts`) is the V1
source of truth for products. It is in-app data — not a Firestore
collection — because shipping a Firestore-backed catalog would have
required new schema and rules in a launch-week sprint. Treat the V1
catalog as an editable seed: when the team confirms vendor quotes,
update `productCatalog.ts` and re-deploy.

`PRODUCT_CATALOG` ships with five entries:
- House Phoenix Beanie / Sweatshirt / T-shirt (apparel, sellable)
- Humble Oven Baked Good (baked-goods, sellable)
- Donations (donations, **not sellable** — never imported into
  product / margin / break-even tables)

The catalog never invokes a POS flow, never decrements inventory,
never records a sale. **Square is the external POS.** The catalog
exists only to seed editable starter rows.

## Where products prefill today

| Section | Builder | Import button | Helper |
|---|---|---|---|
| Ch. 8 unit-cost | FinanceTableBuilder | Import product list | `unitCostRowsToImport` |
| Ch. 7 / 8 break-even | FinanceTableBuilder | Import product list | `breakEvenRowsToImport` |
| Ch. 8 revenue-scenarios | FinanceTableBuilder | Import product list | `revenueScenarioRowsToImport` |
| Ch. 8 donation-scenarios | FinanceTableBuilder | Import donation starter row | `donationScenarioRowsToImport` |
| Ch. 8 key-financial-kpis | FinanceTableBuilder | Add starter KPIs | `starterKpiRows` |
| Ch. 9 inventory | OperationsChecklistBuilder | Import product list | `inventoryRowsToImport` |

**Every import is append-only:**
- Existing rows are never edited or removed.
- Catalog products already present in the table (case-insensitive
  match on the row's product name) are skipped.
- Fully-blank starter rows in the table are replaced in place so
  the import doesn't leave empty rows hanging at the top.
- A status line below the import button names what was imported
  and reminds the student to edit the values before saving.

**Sections that deliberately don't get a product import:**
- Day-of SOP, Baked Goods SOP, Continuity Checklist — these are
  process surfaces; importing the product list would clutter the
  SOP without helping. The team writes inventory rows in the
  inventory section and references them in the SOP narrative.

## Future product-data wiring (deferred this pass)

These builders already accept a single `productName` text field but
do not yet pick from a shared product list. Adding a `productOptions`
prop would make them consistent with the finance / inventory
imports. **All four are deferred** because the changes touch large
files (`PricingStrategyBuilder` ~1870 lines, `MarketFitBuilder` ~2605
lines) and the connected-classroom sprint did not justify the
regression risk on launch eve. The launch finance / ops / BMC paths
do not depend on this wiring — `FinanceTableBuilder` and
`OperationsChecklistBuilder` already import from the catalog
directly:

- **MarketFitBuilder** (`app/components/MarketFitBuilder.vue`):
  `form.productFacts.productName` is a free-text field around line
  1106. A future pass should accept `productOptions: string[]` from
  the parent, render a `<select>` populated with `productNameOptions()`
  from `productCatalog.ts`, and fall back to a free-text input when
  the prop is empty.
- **PricingStrategyBuilder** (`app/components/PricingStrategyBuilder.vue`):
  `form.productName` text input around line 715. Same wiring as
  MarketFitBuilder; defaults from the catalog could also pre-fill
  the unit cost and target price inputs in the same pass.
- **CustomerProfileBuilder** (`app/components/CustomerProfileBuilder.vue`):
  Currently uses internal state with no product-facing field. If a
  future iteration asks "what would this customer buy?", that
  field is the natural place to wire `productOptions`.
- **BrandFitBuilder** (`app/components/BrandFitBuilder.vue`): No
  product-named field today. Lower priority.

## Section dependency map

Surfaced in-app via `SectionDependencyHint.vue`, driven by
`app/utils/sectionDependencyHints.ts`. **Hints only — no hard locks,
no soft locks, no status changes, no readiness gating.** A student
is always free to ignore a hint and draft in any order.

### Ch. 7 — Product Line and Pricing
- `product-list` → helps Unit Cost, Revenue Scenarios, Inventory.
- `margin-and-break-even` → pulls Unit Cost; feeds Pricing Risks
  and the Phoenix Nest pitch margin story.

### Ch. 8 — Finance and Revenue Model
- `unit-cost` → helps Break-Even, Pricing Risks, the Phoenix Nest
  margin story. Land this first.
- `break-even` → pulls Unit Cost + fixed-cost allocation rule;
  feeds Revenue Scenarios and the day-of revenue goal.
- `revenue-scenarios` → pulls product list + Unit Cost + Break-Even;
  feeds Day-of SOP target and Post-Event Recap.
- `donation-scenarios` → tracked separately from product sales.
- `key-financial-kpis` → pulls every Ch. 8 table; feeds Co-CEO
  weekly review and Post-Event Recap.

### Ch. 9 — Operations and Continuity
- `inventory` → helps Day-of SOP, Baked Goods SOP, Phoenix Nest
  readiness.
- `day-of-sop` → pulls Inventory + day-of revenue target; feeds
  Post-Event Recap.
- `baked-goods-sop` → pulls Inventory baked-goods rows + food-safety
  constraints; feeds Continuity Checklist.
- `continuity` → pulls every Ch. 9 SOP + Ch. 13 Decision Log; the
  next-cohort handoff surface.

### Ch. 4 — Business Model Canvas
- `customer-segments` → helps Value Propositions, Channels,
  Customer Relationships, and Campaign audience.
- `value-propositions` → pulls Customer Segments; feeds Channels,
  Revenue Streams, Campaign message.
- `key-activities` → helps Key Resources and Key Partnerships.
- `key-resources` → pulls Key Activities; feeds Key Partnerships
  and Cost Structure.
- `key-partners` → pulls Key Activities + Key Resources. **Square is
  the external POS partner**; Renni Command Center is not a POS.

## Project Navigator opportunities (future)

The Project Navigator already shows blocked / overdue / ready work.
A future pass could add structured prefill-state signals — none of
which exist today:

- "Blocked by missing product list" — flag any section whose
  `Import product list` button has never been clicked AND whose
  table contains zero non-starter rows.
- "Missing unit cost" — flag Break-Even / Revenue Scenarios sections
  whose draft references unit costs that are still blank in the
  Unit Cost table.
- "Missing inventory status" — flag Day-of SOP rows that name an
  item missing from the Inventory checklist.
- "Missing customer profile" — flag Value Propositions sections
  drafted without a corresponding Customer Segments draft.

All of these are **read-only signals**, not auto-mutations: the
chief decides what to do.

## Executive Advisor opportunities (future)

The Executive Advisor (server endpoint at
`server/api/ai/executive-advisor.post.ts`) could use the dependency
map to draft daily briefs and what's-next suggestions:

- "Three teams need Unit Cost before they can finish Break-Even."
- "Inventory is empty — Day-of SOP cannot reference real items."
- "Customer Segments has a low-confidence draft; Value Propositions
  is being drafted on top of it."

The advisor **prepares**; chiefs and Co-CEOs **decide**. No
automatic mutations — the advisor never changes status, never
submits, never approves, never writes builder rows.

## Hard gates to avoid

- **No automatic Working Draft writes.** Imports populate builder
  rows; the student still copies into Working Draft and saves.
- **No silent overwrite of edited rows.** Imports are append-only
  with case-insensitive product-name dedupe.
- **No Firestore writes from imports.** Every import is local
  component state.
- **No POS, payment, checkout, refund, tax, or inventory-decrement
  behavior.** Square is the external POS.
- **No Google Drive / OAuth integration.** Copy-paste only.
- **No AI calls from imports or hints.** Pure data + pure functions.
- **No status, submit, approval, or readiness side effects from
  any prefill or hint.**
