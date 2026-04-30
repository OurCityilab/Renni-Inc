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

## Product-data wiring (V1 — shipped)

These builders accept an optional `productOptions?: string[]` prop.
When the parent passes the list (the workspace passes
`productNameOptions()` from `productCatalog.ts`), the product-name
text input renders an HTML5 `<datalist>` for native autocomplete.
The input remains free-text — the v-model binding, save flow, and
form shape are unchanged. Empty / missing prop preserves the legacy
free-text input.

**Wired:**
- `FinanceTableBuilder` — per-row `product` column on every kind
  that has one (unit-cost, break-even, revenue-scenarios). One
  shared `<datalist>` per builder instance, referenced by every
  row's product input.
- `MarketFitBuilder` — `form.productFacts.productName` input around
  line 1106. Carries the supportive disclaimer copy: "Use the
  product list to keep your market-fit work aligned with finance
  and operations. Selecting a product here does not overwrite your
  saved answer."
- `PricingStrategyBuilder` — `form.productName` input around line
  715. Same supportive disclaimer pattern.

**Not wired (no product-named field today):**
- `BrandFitBuilder` — no productName field.
- `CustomerProfileBuilder` — uses internal classifier state with
  no product-facing field.

**Read-only / copy-only / not-synced:**
- The datalist surfaces a list of catalog product names. Selecting
  one fills the bound input with the chosen string. Nothing else
  changes — no Firestore write, no auto-save, no auto-population
  of other fields, no overwrite of any other v-model state.
- Existing student-saved text in any input is **never** overwritten
  by the datalist or by changing the prop.
- The catalog itself is in-app data (`app/utils/productCatalog.ts`).
  Updating products requires editing that file and re-deploying;
  there is no Firestore-backed catalog yet.

**Future persisted catalog work would require:**
- A new Firestore collection (e.g. `productCatalog/{itemId}`).
- Firestore rule additions (read for any authed member; write for
  chiefs / admins only).
- A `useProductCatalog` composable mirroring the read-pattern of
  `useDeliverables` / `useTasks`.
- A migration of the seed array in `productCatalog.ts` into the
  collection, plus a fallback path so existing pages keep rendering
  if the collection is empty.
- This is intentionally **out of scope** for the connected-classroom
  passes — see the launch-week posture in
  `docs/tonight-completion-and-classroom-checklist.md`.

A future pass could optionally extend the wiring to pre-fill
adjacent numeric fields (e.g. seed `PricingStrategyBuilder`'s unit
cost and target price from the catalog defaults the moment a
catalog product is picked). That requires careful UX design — auto-
filling adjacent fields can silently overwrite student work — so
it is intentionally not done in V1.

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

## Project Navigator dependency signals (V1 — shipped)

The Project Navigator surfaces a "Dependency signals" panel above
the existing blocked / pending-review lists, derived from
`app/utils/projectNavigatorSignals.ts`. **Display-only** — every
signal is a label + reason + optional deeplink. The chief decides
what to do; the platform never mutates anything in response.

### Severity rank
- **`blocked`** — work cannot move (blocked tasks, overdue
  deliverables not yet approved).
- **`ready`** — work is waiting on a chief review (`in_review`).
- **`warning`** — a launch-critical chapter is still in `draft` or
  `needs_revision` and downstream sections will be weaker without
  it ("missing X" signals).
- **`info`** — soft heads-up, e.g. a deliverable still in `draft`
  inside its 3-day landing window.

### Signal kinds (V1)
| id prefix | severity | what it means |
|---|---|---|
| `blocked-task:<id>` | blocked | a task is marked `blocked`; ask the owner what's in the way |
| `overdue-deliverable:<id>` | blocked | dueDate has passed and the deliverable isn't `approved` |
| `ready-for-review:<id>` | ready | deliverable is `in_review` — needs a yes / no / revise |
| `needs-revision:<id>` | warning | deliverable came back from review with notes |
| `missing-dependency:ch-04-…` | warning | customer profile not landed → Value Props / Channels / Campaign weaker |
| `missing-dependency:ch-07-…` | warning | product list not landed → Unit Cost / Revenue / Inventory weaker |
| `missing-dependency:ch-08-…` | warning | unit cost / break-even not landed → pricing & margin story weaker |
| `missing-dependency:ch-09-…` | warning | inventory / SOPs not landed → day-of execution weaker |
| `missing-dependency:ch-10-…` | warning | campaign benefits from customer profile + demand proof |
| `missing-dependency:ch-11-…` | warning | Phoenix Nest pitch needs buyer + shelf-fit + margin story |
| `missing-final-output:<id>` | info | `draft` deliverable is within 3 days of its due date and still owes final Playbook text |

### Conservative defaults (do not relax)
- "Missing X" signals fire **only** when the underlying deliverable
  exists AND is in `draft` or `needs_revision`. Once it moves to
  `in_review` or `approved`, the warning auto-clears.
- Every signal label is supportive ("may be easier after finance
  adds unit cost"), never accusatory ("you are blocked"). The
  c-suite middleware keeps students out of the page today, but the
  copy stays student-safe in case a future pass surfaces a subset
  on student pages.
- Signals are computed from existing watcher data — `liveDeliverables`
  and `liveTasks`. No new Firestore collection, no new index, no
  new rule. The util is pure (`buildProjectNavigatorSignals`).

### What's intentionally NOT automated
- The platform does not create tasks from a signal.
- The platform does not change task / deliverable / approval
  status from a signal.
- The platform does not write builder rows or draft text from a
  signal.
- The platform does not gate or block any user from working — the
  worst a signal does is recommend an order of operations.
- The platform does not call AI or any /api/* endpoint from a
  signal computation.

### Future opportunities (not in V1)
- Per-section signals reading `DeliverableOutputSection.finalText`
  presence: would require `useDeliverableOutputs.watchAll()` (a
  collection-wide list watcher that does not exist today). When
  added, the existing signal shape supports it directly — the
  derivation just needs richer input.
- Cross-deliverable dependency edges via the optional
  `dependencies?` / `prefillSources?` metadata on
  `TemplateStudioSection` (deferred earlier in this doc). Adding
  that metadata would let `missing-dependency` signals reference
  specific upstream sections instead of chapter-level wording.

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
