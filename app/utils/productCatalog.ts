// Product Catalog — lightweight in-app source-of-truth for the
// products Renni Inc. is selling at the TechTown pop-up plus the
// donations revenue stream. Used by FinanceTableBuilder and
// OperationsChecklistBuilder to prefill row sets without forcing
// the student to retype the same product list across five sections.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure data + pure functions. No Firestore reads, no Firestore
//     writes, no AI calls, no network.
//   - Donations are NOT a sellable product. Donations are a separate
//     revenue stream — the donation row helper exists so a Donation
//     Scenarios import is possible, but donations never appear in
//     the unit-cost, break-even, revenue-scenarios, or inventory
//     row helpers. This protects student finance work from rolling
//     gifts into product margin.
//   - Square is the external POS. The catalog never invokes a POS
//     flow, never decrements inventory, never records a sale. Its
//     job is to seed editable starter rows.
//   - Imports are append-only: caller must dedupe against existing
//     rows by product name (case-insensitive) and only append the
//     missing entries. Helpers in this file build candidate rows;
//     the caller decides what to keep.
//
// VOCABULARY
// ----------
//   `defaultUnitCost`, `defaultSalePrice`, and `defaultPlannedQuantity`
//   are STARTER ASSUMPTIONS, not vendor-confirmed numbers. The
//   builder UI must surface this clearly: imported values exist so
//   students can react to a number rather than a blank, then
//   replace the assumption with a vendor quote / comparable / real
//   measurement before submitting.

export type ProductCategory =
  | 'apparel'
  | 'baked-goods'
  | 'donations'

export interface ProductCatalogItem {
  id: string
  productName: string
  brand: string
  category: ProductCategory
  /** Per-unit cost the team should expect to land on. Empty string
   *  means "no defensible default — student must enter." */
  defaultUnitCost: string
  /** Retail price the team should expect to charge. Empty string
   *  means "no defensible default — student must enter." */
  defaultSalePrice: string
  /** Expected quantity available for the launch event. Empty string
   *  means "not yet planned." */
  defaultPlannedQuantity: string
  /** Where the default came from. "starter assumption" is the V1
   *  baseline; later passes can replace with vendor quote refs. */
  source: string
  /** Confidence the team should treat the default with. */
  confidence: 'low' | 'medium' | 'high'
  /** Free-text scaffolding line for the assumption column. */
  notes: string
  /** When false, the item is excluded from product-row helpers
   *  (unit-cost / break-even / revenue / inventory). Donations
   *  are the canonical false case. */
  isSellableProduct: boolean
}

// V1 catalog. House Phoenix (flagship) + Humble Oven (supporting
// brand for baked goods) + Donations row. Lumen and Notice do not
// have a launch-day product yet, so they are deliberately not in
// the catalog — adding empty rows would clutter every import.
export const PRODUCT_CATALOG: readonly ProductCatalogItem[] = [
  {
    id: 'house-phoenix-beanie',
    productName: 'House Phoenix Beanie',
    brand: 'House Phoenix',
    category: 'apparel',
    defaultUnitCost: '8.00',
    defaultSalePrice: '20.00',
    defaultPlannedQuantity: '12',
    source: 'starter assumption',
    confidence: 'low',
    notes: 'Replace with vendor quote before submit.',
    isSellableProduct: true
  },
  {
    id: 'house-phoenix-sweatshirt',
    productName: 'House Phoenix Sweatshirt',
    brand: 'House Phoenix',
    category: 'apparel',
    defaultUnitCost: '18.00',
    defaultSalePrice: '40.00',
    defaultPlannedQuantity: '8',
    source: 'starter assumption',
    confidence: 'low',
    notes: 'Replace with vendor quote before submit.',
    isSellableProduct: true
  },
  {
    id: 'house-phoenix-tshirt',
    productName: 'House Phoenix T-shirt',
    brand: 'House Phoenix',
    category: 'apparel',
    defaultUnitCost: '6.00',
    defaultSalePrice: '18.00',
    defaultPlannedQuantity: '15',
    source: 'starter assumption',
    confidence: 'low',
    notes: 'Replace with vendor quote before submit.',
    isSellableProduct: true
  },
  {
    id: 'humble-oven-baked-good',
    productName: 'Humble Oven Baked Good',
    brand: 'Humble Oven',
    category: 'baked-goods',
    defaultUnitCost: '1.50',
    defaultSalePrice: '4.00',
    defaultPlannedQuantity: '24',
    source: 'starter assumption',
    confidence: 'low',
    notes: 'Confirm baker materials cost and food-safety approval.',
    isSellableProduct: true
  },
  {
    id: 'donations',
    productName: 'Donations',
    brand: 'Renni Inc.',
    category: 'donations',
    defaultUnitCost: '',
    defaultSalePrice: '',
    defaultPlannedQuantity: '',
    source: 'starter assumption',
    confidence: 'low',
    notes:
      'Donations are recorded separately from product sales and never roll into product margin or break-even.',
    isSellableProduct: false
  }
] as const

// ---- Public selectors --------------------------------------------

export function sellableProducts(): readonly ProductCatalogItem[] {
  return PRODUCT_CATALOG.filter((p) => p.isSellableProduct)
}

export function donationItems(): readonly ProductCatalogItem[] {
  return PRODUCT_CATALOG.filter((p) => p.category === 'donations')
}

/** Product-name list suitable for a `<select>` or chip palette in
 *  any builder that wants a shared product picker. Donations are
 *  excluded — pickers never want "Donations" as a product. */
export function productNameOptions(): string[] {
  return sellableProducts().map((p) => p.productName)
}

// ---- Row builder helpers -----------------------------------------
//
// Each helper returns one starter row per relevant catalog item.
// The caller is responsible for:
//   1. filtering against the existing rows (dedupe by product name,
//      case-insensitive) before appending; and
//   2. surfacing the "Imported values are starter assumptions"
//      message so students know to edit before saving.

export type Row = Record<string, string>

export interface ImportTarget {
  /** Existing rows already in the table. Used for dedupe. */
  existingRows: readonly Row[]
  /** Field on each row that holds the product name. */
  productKey: string
}

/** Lower-cased trimmed product names already present in the table.
 *  Used by every product helper for dedupe. */
function productNameSet(rows: readonly Row[], productKey: string): Set<string> {
  return new Set(
    rows
      .map((r) => (r[productKey] ?? '').trim().toLowerCase())
      .filter((s) => s.length > 0)
  )
}

export function unitCostRowsToImport(target: ImportTarget): Row[] {
  const taken = productNameSet(target.existingRows, target.productKey)
  return sellableProducts()
    .filter((p) => !taken.has(p.productName.toLowerCase()))
    .map((p) => ({
      product: p.productName,
      materialCost: p.defaultUnitCost,
      laborCost: '',
      packagingFees: '',
      otherCost: '',
      source: p.source,
      assumption: p.notes
    }))
}

export function breakEvenRowsToImport(target: ImportTarget): Row[] {
  const taken = productNameSet(target.existingRows, target.productKey)
  return sellableProducts()
    .filter((p) => !taken.has(p.productName.toLowerCase()))
    .map((p) => ({
      product: p.productName,
      unitCost: p.defaultUnitCost,
      salePrice: p.defaultSalePrice,
      // Fixed cost is intentionally blank — it depends on the
      // team's allocation rule, which the catalog cannot know.
      fixedCost: '',
      assumption:
        p.notes +
        ' Fixed-cost share must be set by the team before submit.'
    }))
}

export function revenueScenarioRowsToImport(target: ImportTarget): Row[] {
  const taken = productNameSet(target.existingRows, target.productKey)
  return sellableProducts()
    .filter((p) => !taken.has(p.productName.toLowerCase()))
    .map((p) => ({
      scenario: 'Target',
      product: p.productName,
      quantity: p.defaultPlannedQuantity,
      price: p.defaultSalePrice,
      assumption: `${p.notes} Quantity reflects starter plan.`,
      confidence: p.confidence
    }))
}

/** Donation Scenarios import — single starter row only. We do NOT
 *  pre-fill numbers because donor count and average gift are highly
 *  context-specific (event size, ask script, channel). The starter
 *  row exists so students see the shape before typing. */
export function donationScenarioRowsToImport(target: ImportTarget): Row[] {
  // Use product name as dedupe key against the donor-type column.
  // Any existing row with donor type "Friends and family" blocks
  // the import to avoid duplicating the starter shape.
  const taken = productNameSet(target.existingRows, target.productKey)
  const seed = {
    donorType: 'Friends and family',
    count: '',
    avgGift: '',
    assumption:
      'Set donor count and average gift after the team agrees on the ask script.',
    confidence: 'low'
  } as Row
  if (taken.has(seed.donorType.toLowerCase())) return []
  return [seed]
}

export function inventoryRowsToImport(target: ImportTarget): Row[] {
  const taken = productNameSet(target.existingRows, target.productKey)
  return sellableProducts()
    .filter((p) => !taken.has(p.productName.toLowerCase()))
    .map((p) => ({
      item: p.productName,
      quantity: p.defaultPlannedQuantity,
      location: '',
      owner: '',
      issue: 'Confirm quantity and vendor delivery date.',
      packed: 'No'
    }))
}

// ---- BMC revenue-streams import ---------------------------------
//
// Used by the BMC Ch. 4 revenue-streams table (FinanceTableBuilder
// kind 'revenue-streams'). Imports one row per sellable product
// labelled as a "Product sale" stream, plus an explicit "Donations"
// stream — donations are a separate revenue stream from product
// sales by the CFO posture in the Ch. 4 expert guidance.
//
// The import does NOT invoke any POS / payment / checkout flow.
// The captureMethod column is seeded with neutral text describing
// where the stream is recorded externally; students edit it to
// reflect the team's real recording rule before saving.

export function revenueStreamRowsToImport(target: ImportTarget): Row[] {
  const taken = productNameSet(target.existingRows, target.productKey)
  const rows: Row[] = []
  for (const p of sellableProducts()) {
    if (taken.has(p.productName.toLowerCase())) continue
    rows.push({
      streamName: p.productName,
      streamType: p.category === 'baked-goods' ? 'Baked good' : 'Product sale',
      captureMethod: 'Square (external POS) — confirm with CFO',
      source: p.source,
      assumption: p.notes,
      confidence: p.confidence,
      risk: 'Vendor delivery / sell-through assumption may shift.',
      owner: 'CFO',
      tiesToCh8: 'Yes'
    })
  }
  for (const d of donationItems()) {
    if (taken.has(d.productName.toLowerCase())) continue
    rows.push({
      streamName: d.productName,
      streamType: 'Donation',
      captureMethod: 'Donation form / cash jar — recorded externally',
      source: d.source,
      assumption: d.notes,
      confidence: d.confidence,
      risk: 'Donor count + average gift assumption.',
      owner: 'CFO',
      tiesToCh8: 'Yes'
    })
  }
  return rows
}

// ---- KPI starter pack --------------------------------------------
//
// KPIs are surfaced behind a separate button (not "Import product
// list") because there is no per-product mapping. The starter pack
// is intentionally short — five KPIs that almost every Renni Inc.
// launch needs to track, with explicit blanks for the team to set.

export function starterKpiRows(target: ImportTarget): Row[] {
  // Dedupe against the existing KPI name (the productKey for the
  // KPI table is the kpi name column, not "product").
  const taken = productNameSet(target.existingRows, target.productKey)
  const starters: Row[] = [
    {
      kpi: 'Gross revenue',
      formula: 'sum of all product sales (Square + cash)',
      target: '',
      source: '/revenue',
      owner: 'CFO',
      reviewRhythm: 'Weekly · post-event'
    },
    {
      kpi: 'Units sold',
      formula: 'count of all units sold across products',
      target: '',
      source: '/revenue',
      owner: 'CFO',
      reviewRhythm: 'Weekly · post-event'
    },
    {
      kpi: 'Average margin',
      formula: 'average of (sale price − unit cost) per product',
      target: '',
      source: 'Ch. 8 unit-cost · /pricing',
      owner: 'CFO',
      reviewRhythm: 'Weekly'
    },
    {
      kpi: 'Donations raised',
      formula: 'sum of donation gifts (separate from product sales)',
      target: '',
      source: '/revenue · donation log',
      owner: 'CFO',
      reviewRhythm: 'Weekly · post-event'
    },
    {
      kpi: 'Foot-traffic-to-sale conversion',
      formula: 'units sold ÷ visitors at table',
      target: '',
      source: 'Day-of tally',
      owner: 'COO',
      reviewRhythm: 'Post-event'
    }
  ]
  return starters.filter((r) => !taken.has((r.kpi ?? '').toLowerCase()))
}
