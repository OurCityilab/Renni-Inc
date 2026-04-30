# Tonight Completion + Classroom Checklist

Final pre-class snapshot. Pair with:
- `docs/launch-morning-student-quick-start.md` (student handbook)
- `docs/launch-morning-priority-flow.md` (group-by-group routes)
- `docs/cross-section-prefill-and-dependency-map.md` (engineering map)

## Latest commits on `renni-app-clean`

| hash | message |
|---|---|
| `d6967df` | add product catalog prefill helpers |
| `08eca9f` | add launch morning priority workflow |
| `88e8c2f` | polish launch student work surfaces |
| `4eabe8f` | add launch finance and operations engines |
| `6812e8c` | improve launch-critical section guidance |
| `2232a42` | add key activities retail builder pilot |
| `118274e` | carry task context into section recipes |
| `d0c209f` | mirror next action recipes in section workspace |

This pass adds: chief-facing **Launch Readiness Checklist** on the
Project Navigator page and explicit deferral notes for productOptions
wiring on Market Fit / Pricing Strategy.

## What students should use tomorrow

1. Open the home dashboard.
2. Read **My Next Actions** if anything is personally assigned.
3. Open the matching card under **Launch Morning Priorities** if
   nothing is assigned yet.
4. Click into the section.
5. Read the **Use this first** callout — six steps: build → copy →
   paste → edit → save → ask chief.
6. Use the builder / table / checklist at the top of the section.
   - Finance and inventory tables now have **Import product list**
     to seed rows from the Renni Inc. catalog.
   - Donations import a single starter row only.
   - KPI table has **Add starter KPIs** (5 baseline KPIs).
7. Check the **How this section connects** hint — names what feeds
   in and what flows out. Hints are non-blocking.
8. Copy the table, paste into Working Draft, edit in your own words,
   save, ask chief to review.

## What chiefs should use tomorrow

1. Open `/c-suite/project-navigator`.
2. Read the ranked **What needs attention now** cards.
3. Step through **Launch readiness checks** (new this pass) — click
   each of the 10 launch-critical sections and confirm the builder
   underneath has real values, not starter assumptions.
4. Use the existing Tasks / Deliverables surfaces to act.
5. Project Navigator never mutates anything.

## Five-minute pre-class click check

Run this with the projector before students sit down:

1. Sign in as a member account.
2. Confirm the home dashboard shows three sections: **My Next
   Actions** (or empty-state copy), **Launch Morning Priorities**
   (5 cards), **Start Your Day** (orientation ladder).
3. Click "Open Unit Cost Table" → confirm the section page loads,
   the BuilderHandoffCallout shows, the row editor renders, and an
   **Import product list** button appears alongside Add row / Clear
   all.
4. Click **Import product list** → confirm 4 sellable products
   appear, status line reports the import, and a second click shows
   "Nothing new to import."
5. Click "Open Inventory Checklist" (Ch. 9) → repeat the import
   check. The packed? field should be a Yes/No select.
6. Click "Open Baked Goods SOP" → confirm the rose **non-legal
   food-safety advice** banner is visible.
7. Sign in as Co-CEO / admin → open `/c-suite/project-navigator` →
   confirm **Launch readiness checks** appears below the priority
   cards with 10 deeplink items.
8. Hard refresh once on every page checked.

## Sections with product import

| Builder · kind | Button | Catalog rows imported |
|---|---|---|
| FinanceTableBuilder · unit-cost | Import product list | 4 sellable products (apparel + baked good) |
| FinanceTableBuilder · break-even | Import product list | 4 sellable products with default cost + price, fixed-cost left blank |
| FinanceTableBuilder · revenue-scenarios | Import product list | 4 sellable products as Target-scenario rows |
| FinanceTableBuilder · donation-scenarios | Import donation starter row | Single "Friends and family" starter row |
| FinanceTableBuilder · kpi | Add starter KPIs | 5 baseline KPIs with owners and review rhythms set; targets blank |
| OperationsChecklistBuilder · inventory | Import product list | 4 sellable products with planned quantity + risk note |
| OperationsChecklistBuilder · day-of-sop | (no import) | SOP is a process surface |
| OperationsChecklistBuilder · baked-goods-sop | (no import) | SOP is a process surface |
| OperationsChecklistBuilder · continuity | (no import) | Handoff surface |

Every import is **append-only**: existing rows are never touched,
case-insensitive product-name dedupe, blank starter rows are
replaced in place. Repeated clicks are safe.

## Sections with dependency hints

In-app hints appear above all builders for these sections (driven
by `app/utils/sectionDependencyHints.ts`):

- **Ch. 7**: product-list, margin-and-break-even
- **Ch. 8**: unit-cost, break-even, revenue-scenarios,
  donation-scenarios, key-financial-kpis
- **Ch. 9**: inventory, day-of-sop, baked-goods-sop, continuity
- **Ch. 4**: customer-segments, value-propositions, key-activities,
  key-resources, key-partners

Hints describe directional helpfulness ("Customer Segments helps
Value Propositions"); they never block, gate, or mutate.

## Known limitations

- **Product catalog is in-app data, not Firestore-backed.** Updating
  products requires editing `app/utils/productCatalog.ts` and
  re-deploying. Out of scope this sprint per the brief.
- **productOptions wiring on Market Fit / Pricing Strategy / Brand
  Fit / Customer Profile builders is deferred.** Exact line numbers
  are documented in `docs/cross-section-prefill-and-dependency-map.md`.
  Launch students do not depend on this — the launch-critical
  finance / ops / BMC paths use separate builders that already
  import from the catalog.
- **Project Navigator can't see builder row counts.** Builder state
  is local-only by design. The new "Launch readiness checks" panel
  is a click-through prompt, not a derived signal.
- **Executive Advisor still does not consume the dependency map.**
  Documented as a future opportunity.
- **No live browser smoke this sprint.** Static review only — five-
  minute pre-class click check above is the substitute.

## What NOT to build before class

- Persisted product catalog (Firestore schema + rules — multi-day).
- Rich productOptions wiring on Market Fit / Pricing Strategy.
- AI critique on builder rows.
- Auto-write of builder output into Working Draft.
- POS, payment, checkout, refund, tax, or inventory-decrement
  behavior. Square remains the external POS.
- Any Firestore rule, Auth, or route-structure change.
- Any submit / approval / status mutation in the new flows.
- Onboarding tour, modal, or dashboard redesign.

If something needs fixing during class, prefer a **copy-only** edit
(text in a builder config, doc clarification) over a structural
change.
