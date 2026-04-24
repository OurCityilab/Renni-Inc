// Seeds pricingScenarios/{brand-slug}-{product-slug} from
// seeds/seeded_pricing_live.csv.
//
// Idempotency: canonical seed fields (productName, brand, category,
// unitCost, salePrice, plannedQuantity, fixedCostShare, ownerEmail/Uid,
// department, notes) refresh on every run. Mutable state (soldQuantity)
// is only set on first create — running seed again won't reset actuals
// the team has already recorded.

import { buildEmailToUidMap, db } from './lib/admin'
import { readCsv, slugify } from './lib/csv'

interface PricingRow {
  productName: string
  brand: string
  category: string
  unitCost: string
  salePrice: string
  plannedQuantity: string
  fixedCostShare: string
  soldQuantity: string
  ownerEmail: string
  department: string
  notes: string
}

const KNOWN_CATEGORIES = new Set(['apparel', 'baked-goods', 'donation', 'other'])

function toNumberOrNull(v: string): number | null {
  const t = (v || '').trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function toNumber(v: string, fallback = 0): number {
  const n = toNumberOrNull(v)
  return n === null ? fallback : n
}

async function main() {
  const rows = readCsv<PricingRow>('seeds/seeded_pricing_live.csv')
  const firestore = db()
  const emailToUid = await buildEmailToUidMap()
  const now = new Date().toISOString()

  let creates = 0
  let updates = 0
  let skipped = 0

  for (const row of rows) {
    const productName = (row.productName || '').trim()
    const brand = (row.brand || '').trim()
    const category = (row.category || 'other').trim()
    if (!productName || !brand) {
      console.warn('[seed-pricing] skipping row with missing productName or brand')
      skipped += 1
      continue
    }
    if (!KNOWN_CATEGORIES.has(category)) {
      console.warn(
        `[seed-pricing] skipping "${brand} ${productName}": unknown category "${category}". ` +
          `Allowed: ${[...KNOWN_CATEGORIES].join(', ')}.`
      )
      skipped += 1
      continue
    }

    const email = (row.ownerEmail || '').trim().toLowerCase()
    const id = `${slugify(brand)}-${slugify(productName)}`
    const ref = firestore.collection('pricingScenarios').doc(id)

    const seedFields = {
      productName,
      brand,
      category,
      unitCost: toNumber(row.unitCost),
      salePrice: toNumber(row.salePrice),
      plannedQuantity: toNumber(row.plannedQuantity),
      fixedCostShare: toNumberOrNull(row.fixedCostShare),
      ownerEmail: email,
      ownerUid: emailToUid.get(email) ?? null,
      department: (row.department || 'finance').trim(),
      notes: row.notes?.trim() || null,
      updatedAt: now
    }

    const existing = await ref.get()
    if (existing.exists) {
      await ref.update(seedFields)
      updates += 1
    } else {
      await ref.set({
        id,
        ...seedFields,
        soldQuantity: toNumberOrNull(row.soldQuantity),
        createdAt: now
      })
      creates += 1
    }
  }
  console.log(
    `[seed-pricing] new: ${creates}, updated: ${updates}, skipped: ${skipped}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
