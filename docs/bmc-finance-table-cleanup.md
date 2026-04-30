# BMC Finance Table Cleanup

Ch. 4 (Business Model Canvas) is the conceptual spine of Renni
Command Center. The audit found that **revenue-streams** and
**cost-structure** were rendering prose-only inputs where structured
finance logic is needed. This pass turns both sections into
table-first surfaces while preserving every existing gate.

## Sections changed

| Section | Builder | Kind |
|---|---|---|
| `ch-04-business-model-canvas / revenue-streams` | FinanceTableBuilder | `revenue-streams` |
| `ch-04-business-model-canvas / cost-structure`  | FinanceTableBuilder | `cost-structure`  |

The shared `FinanceTableBuilder` component gained two new `kind`
variants. The row editor, copy-as-markdown, dedupe / append-only
import, and BuilderHandoffCallout all come for free from the existing
launch-finance scaffolding.

## What the tables do

### Revenue Streams Table (`revenue-streams`)
Columns: stream name · type (Product sale / Baked good / Donation /
Retail carry / Future) · how it is captured · source · assumption ·
confidence · risk · owner / reviewer · ties to Ch. 8?

The **Import Renni Inc. revenue streams** button seeds:
- one row per sellable product from the catalog (apparel + baked
  goods, type defaulted to "Product sale" or "Baked good");
- one explicit "Donations" row, type "Donation".

Imports are append-only with case-insensitive name dedupe — the
button is safe to click repeatedly.

### Cost Structure Table (`cost-structure`)
Columns: cost item · cost type (Variable / Fixed / Event-only /
Packaging / Pending) · estimated amount · source · assumption ·
confidence · connected product / section · risk · owner / reviewer.

Costs are deliberately **not** seeded from the product catalog — every
team has different fixed-cost shares and event costs, so a generic
seed would mislead more than it would help. Students enter the rows
from real vendor quotes and Ch. 7 / Ch. 8 numbers.

## Student framing copy

Both tables ship with two mandatory framings rendered above the row
editor:

- **Revenue streams intro:** "This is not a checkout system. This is
  a map of how Renni Inc. earns or receives money. List each stream
  — product sale, baked good, donation, retail carry — with how it
  is captured, the source, and the assumption."
- **Cost structure intro:** "This is not the detailed CFO model.
  This is the business-model view of what costs Renni Inc. must plan
  for. Tag each cost as variable / fixed / event-only / packaging /
  pending and name the source."

Both kinds also render a shared warning banner: *"Separate the
business model from the TechTown event. TechTown is one sales / test
channel, not the whole company."*

## Student workflow

1. Open the section page (recipe panel + dependency hint render).
2. Use the **Use this first** callout — six-step workflow from the
   shared BuilderHandoffCallout.
3. Fill the table. For revenue-streams, optionally click **Import
   Renni Inc. revenue streams** to seed rows.
4. Review source and confidence per row. The columns push students
   to defend each entry rather than just type a number.
5. Click **Copy table** → paste into Working Draft → summarize the
   important points in your own words.
6. Add **Defend your claim** structured-evidence entries for any
   major figure (the existing Structured Evidence Standard editor
   sits below the Working Draft).
7. Save with the existing Save button. Mark the section ready for
   chief review when ready.

The handoff to Working Draft is **manual**. Builders never auto-
write into Working Draft.

## What these tables intentionally do not do

- **No POS / payment / checkout / refund / tax / inventory-decrement
  behavior.** The `captureMethod` and `estimatedAmount` columns are
  free-text / numeric inputs that record the team's plan; nothing
  settles, charges, or moves stock. Square remains the external POS.
- **No Square integration.** The captureMethod text references Square
  as the external POS the team uses, with no API call attached.
- **No autosave.** The builder owns local component state. Only the
  existing Save button on Working Draft persists anything.
- **No automatic Working Draft writes.** Copy-only output via the
  existing markdown table copy button.
- **No new Firestore collections, no rule changes, no auth changes,
  no route changes.**
- **No submit / approval / status / readiness mutation.** The two
  sections still gate on the existing requirement-task coverage and
  output-readiness signals.

## Anchors and recipe surfaces

- The new sections inherit the existing `ftb-<id>` anchor pattern.
  `pickAnchorIdForSection` already prefers `financeTable.enabled`
  before any other builder anchor, so My Next Actions and the
  SectionRecipePanel CTA both deeplink directly into the new
  builders.
- `SectionGuidanceStrip.financeTableLabel` was extended to emit
  "Open Revenue Streams Table" and "Open Cost Structure Table" CTAs
  for the leader-facing strip.
- Section recipes (`studentNextActions.pickRecipe`) updated to
  reflect the new builders — button label, output format, output
  example, six-step instructions.
- `SectionDependencyHint` lookup gained entries for revenue-streams,
  cost-structure, channels, and customer-relationships so the four
  Ch. 4 sections that previously had no hint now describe their
  upstream / downstream relationships.

## Future improvements

- **Optional adjacent-field pre-fill for revenue-streams** when a
  catalog product is selected (seed `captureMethod` from product
  metadata). Would require explicit student confirmation; intentionally
  not done in V1 per the never-overwrite-student-work principle.
- **Cost catalog seed** for common Renni Inc. cost categories (booth
  fee, signage, transaction fees) once instructors have stable
  per-event values to share. Same in-app seed pattern as
  `productCatalog.ts`.
- **Cross-section reconciliation hint** that surfaces when a
  revenue-streams row claims `tiesToCh8: 'Yes'` but the matching
  Ch. 8 deliverable is still in `draft`. Would extend the existing
  Project Navigator dependency-signal utility.
- **Persisted product / cost catalog** in Firestore (new collection +
  read-rule for members + write-rule for chiefs/admins), mirroring
  the future-work list in `docs/cross-section-prefill-and-dependency-map.md`.
