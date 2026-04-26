// Pricing Strategy Engine V1.2 — pasted-text comp source assistant.
//
// Pure deterministic helper that turns pasted product-page text into a
// SUGGESTION the student must review. The function is the only entry
// point; everything below is private. Posture (do not relax in V1.2):
//
//   - never fetches a URL, never opens a network connection
//   - never calls AI
//   - never writes to Firestore
//   - never invents a price; if no number resembling a price exists
//     the helper returns no candidate and asks the student to verify
//   - never claims market value or proves demand
//   - caps input at MAX_INPUT_CHARS so a giant paste can't lock the
//     main thread
//
// The student is the source of truth. The helper just trims, splits,
// and labels — every output field is explicitly suggested, not chosen.

export const MAX_INPUT_CHARS = 8000

export type ExtractCompSourceInput = {
  pastedText: string
}

export type ExtractedPriceCandidateConfidence = 'low' | 'medium' | 'high'
export type ExtractedCompConfidence = 'low' | 'medium' | 'high'

export interface ExtractedPriceCandidate {
  // Numeric value (e.g., 145, 89.99). Always finite; never 0 unless
  // 0 was actually present in the text — but band-classification
  // demotes lone $0 hits to 'low' and emits a warning.
  value: number
  // The exact substring matched, e.g. "$145.00" or "Sale $89.99".
  raw: string
  // Confidence in this specific number being a real price. High =
  // labelled (Sale Price / Regular Price / Price), explicit currency
  // marker. Medium = bare $X with no junk-context flag. Low = $0,
  // suspicious context (Cart, Shipping, Recently Viewed).
  confidence: ExtractedPriceCandidateConfidence
  reason?: string
}

export interface ExtractedCompSourceSuggestion {
  name?: string
  sourceName?: string
  url?: string
  sourceDate?: string
  priceCandidates: ExtractedPriceCandidate[]
  productType?: string
  qualityTier?: string
  warnings: string[]
  extractionConfidence: ExtractedCompConfidence
}

// ---------- internal: line classification ----------

// Lines that are almost certainly chrome/navigation, not product
// metadata. Lower-cased exact match plus prefix matches handle most
// retail page footers/headers.
const NAV_LINE_EXACT = new Set([
  'home',
  'cart',
  'shopping cart',
  'wishlist',
  'sign in',
  'log in',
  'account',
  'menu',
  'search',
  'shop',
  'help',
  'support',
  'shipping',
  'returns',
  'size chart',
  'size guide',
  'reviews',
  'recently viewed',
  'related products',
  'you may also like',
  'free shipping',
  'free returns',
  'add to cart',
  'add to bag',
  'buy now',
  'subscribe',
  'newsletter',
  'follow us',
  'about us',
  'careers',
  'privacy policy',
  'terms of service',
  'cookie policy',
  'select size',
  'select color',
  'select quantity',
  'quantity',
  'in stock',
  'out of stock'
])

const NAV_LINE_INCLUDES = [
  'shipping',
  'free returns',
  'size chart',
  'select size',
  'select color',
  'select quantity',
  'recently viewed',
  'add to cart',
  'add to bag',
  'newsletter',
  'subscribe',
  'free shipping'
]

function isNavLine(rawLine: string): boolean {
  const l = rawLine.trim().toLowerCase()
  if (!l) return true
  if (NAV_LINE_EXACT.has(l)) return true
  for (const tok of NAV_LINE_INCLUDES) {
    if (l.includes(tok)) return true
  }
  return false
}

// ---------- internal: URL detection ----------

// First-match URL detection. We don't extract every URL — students
// usually paste one product-page URL, and the helper just surfaces
// the most likely one. Anything that's not http/https is dropped at
// the safe-parse step.
function findFirstUrl(text: string): { url: string; hostname: string | null } | null {
  const re = /https?:\/\/[^\s<>"')]+/i
  const m = text.match(re)
  if (!m) return null
  const raw = m[0].replace(/[.,;:!?]+$/, '') // trim trailing punctuation
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  return {
    url: parsed.toString(),
    hostname: parsed.hostname || null
  }
}

// Map a URL hostname to a likely store name. Conservative — we only
// match a handful of well-known retailers we've seen in the brief's
// scenarios. Anything unrecognized falls back to the hostname's
// second-level label (e.g., shinola.com → "Shinola"), which the
// student can correct.
const KNOWN_HOST_TO_STORE: Record<string, string> = {
  'shinola.com': 'Shinola',
  'www.shinola.com': 'Shinola',
  'nordstrom.com': 'Nordstrom',
  'www.nordstrom.com': 'Nordstrom',
  'fearofgod.com': 'Fear of God',
  'www.fearofgod.com': 'Fear of God',
  'amazon.com': 'Amazon',
  'www.amazon.com': 'Amazon',
  'etsy.com': 'Etsy',
  'www.etsy.com': 'Etsy',
  'puredetroit.com': 'Pure Detroit',
  'www.puredetroit.com': 'Pure Detroit'
}

function storeNameFromHostname(hostname: string | null): string | null {
  if (!hostname) return null
  const known = KNOWN_HOST_TO_STORE[hostname.toLowerCase()]
  if (known) return known
  // Strip leading "www." then take the second-level label and
  // capitalize the first letter.
  const stripped = hostname.replace(/^www\./i, '')
  const parts = stripped.split('.')
  if (!parts.length || !parts[0]) return null
  const root = parts[0]
  return root.charAt(0).toUpperCase() + root.slice(1)
}

// ---------- internal: price detection ----------

// Match $123, $123.45, USD 123, US$ 123. Also accept "Price: $123".
// Numbers WITHOUT a currency marker are not extracted — we'd rather
// miss a price than invent one from a tracking number.
const PRICE_RE =
  /(?:\b(?:USD|US\$|US\s*\$)\s*|\$\s*)([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/gi

// Words next to a price that change confidence. Order matters: the
// helper picks the highest-confidence label that appears within
// PRICE_LABEL_WINDOW chars before or after the match.
const PRICE_LABEL_WINDOW = 24
const PRICE_LABEL_HIGH = ['price', 'list price', 'msrp']
const PRICE_LABEL_SALE = ['sale', 'sale price', 'now', 'reduced', 'clearance']
const PRICE_LABEL_REGULAR = ['regular', 'regular price', 'was', 'orig', 'original']
const PRICE_LABEL_VARIANT = ['from', 'starting at', 'as low as']
const PRICE_LABEL_LOW = [
  'cart',
  'subtotal',
  'total',
  'shipping',
  'tax',
  'recently',
  'viewed'
]

function priceContextLabel(text: string, idx: number, length: number): string {
  const start = Math.max(0, idx - PRICE_LABEL_WINDOW)
  const end = Math.min(text.length, idx + length + PRICE_LABEL_WINDOW)
  return text.slice(start, end).toLowerCase()
}

function classifyPrice(
  raw: string,
  value: number,
  context: string
): { confidence: ExtractedPriceCandidateConfidence; reason: string } {
  if (value <= 0) {
    return {
      confidence: 'low',
      reason: 'Zero or negative price — likely cart placeholder, not a comp.'
    }
  }
  // Order matters: labelled prices ("Sale Price", "Regular Price",
  // "MSRP") win over LOW chrome words because retailers often show
  // a labelled price on the same line as a "Free shipping" footer.
  // We only fall through to LOW when there's no explicit price
  // label nearby.
  for (const w of PRICE_LABEL_SALE) {
    if (context.includes(w)) {
      return {
        confidence: 'high',
        reason: 'Labelled as a sale price — verify whether the team should comp against sale or regular.'
      }
    }
  }
  for (const w of PRICE_LABEL_REGULAR) {
    if (context.includes(w)) {
      return {
        confidence: 'high',
        reason: 'Labelled as a regular/original price.'
      }
    }
  }
  for (const w of PRICE_LABEL_VARIANT) {
    if (context.includes(w)) {
      return {
        confidence: 'medium',
        reason: '"From"/"starting at" usually marks a variant — not the price for the specific item.'
      }
    }
  }
  for (const w of PRICE_LABEL_HIGH) {
    if (context.includes(w)) {
      return {
        confidence: 'high',
        reason: 'Found near "price" label.'
      }
    }
  }
  for (const w of PRICE_LABEL_LOW) {
    if (context.includes(w)) {
      return {
        confidence: 'low',
        reason: `Found near "${w}" — looks like cart/checkout chrome, not a product price.`
      }
    }
  }
  return { confidence: 'medium', reason: 'Currency marker present but no surrounding label.' }
}

function extractPriceCandidates(text: string): ExtractedPriceCandidate[] {
  const out: ExtractedPriceCandidate[] = []
  // Reset stateful regex
  PRICE_RE.lastIndex = 0
  let m: RegExpExecArray | null
  const seen = new Set<string>()
  while ((m = PRICE_RE.exec(text)) !== null) {
    const numStr = m[1].replace(/,/g, '')
    const value = Number(numStr)
    if (!Number.isFinite(value)) continue
    const raw = m[0].trim()
    // Dedup identical raw matches at distinct positions — a footer
    // that says "$0.00 | $0.00 | $0.00" should count as one weak hit.
    const dedupKey = `${value}::${raw.toLowerCase()}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    const context = priceContextLabel(text, m.index, m[0].length)
    const { confidence, reason } = classifyPrice(raw, value, context)
    out.push({ value, raw, confidence, reason })
    // Cap at 6 candidates — anything beyond that is noise the student
    // shouldn't have to scroll through.
    if (out.length >= 6) break
  }
  return out
}

// ---------- internal: name detection ----------

// Pick the first non-empty, non-nav, non-price-only line as the
// suggested product name. We bias toward longer "title-like" lines
// (>= 6 chars) and skip lines that are almost entirely a price.
function findProductName(lines: string[]): string | null {
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (isNavLine(line)) continue
    // Skip lines that are almost entirely a single price token.
    if (/^\$\s*[0-9]/.test(line) && line.length < 16) continue
    if (/^[\s$0-9.,]+$/.test(line)) continue
    // Reasonable "title-ish" floor.
    if (line.length < 3) continue
    return line
  }
  return null
}

// ---------- internal: source name fallback ----------
// Look for a "Sold by X" / "Brand: X" pattern near the top of the
// pasted text. Only fires when a hostname-derived store name didn't
// already supply a value.
const SOLD_BY_RE = /(?:sold by|brand|by)\s*[:\-]?\s*([a-z0-9 .&'-]{2,40})/i

function findSoldBy(text: string): string | null {
  const m = text.match(SOLD_BY_RE)
  if (!m) return null
  const candidate = m[1].trim()
  // Filter obvious non-brand junk.
  if (candidate.length < 2) return null
  if (NAV_LINE_EXACT.has(candidate.toLowerCase())) return null
  return candidate
}

// ---------- internal: source date detection ----------
// Cheap, conservative date matcher. Only emits a date if it parses
// cleanly to a sane year (2015–2099) — avoids treating "$2024" or
// SKU-like numbers as a date.
const DATE_RE =
  /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/

function findSourceDate(text: string): string | null {
  const m = text.match(DATE_RE)
  if (!m) return null
  // Quick sanity check on year.
  const yr = m[0].match(/(\d{4})/)
  if (!yr) return null
  const y = Number(yr[1])
  if (y < 2015 || y > 2099) return null
  return m[0]
}

// ---------- internal: product type / quality tier hints ----------

const PRODUCT_TYPE_KEYWORDS: Array<{ match: RegExp; label: string }> = [
  { match: /\b(sweatshirt|sweat\s*shirt|hoody|hoodie|crewneck)\b/i, label: 'sweatshirt' },
  { match: /\b(t-?shirt|tee)\b/i, label: 't-shirt' },
  { match: /\b(beanie|knit\s*cap)\b/i, label: 'beanie' },
  { match: /\b(cap|hat|trucker)\b/i, label: 'hat' },
  { match: /\b(candle)\b/i, label: 'candle' },
  { match: /\b(bracelet)\b/i, label: 'bracelet' },
  { match: /\b(necklace)\b/i, label: 'necklace' },
  { match: /\b(cookie|cookies)\b/i, label: 'baked good' },
  { match: /\b(brownie|brownies)\b/i, label: 'baked good' },
  { match: /\b(muffin|cupcake|loaf|bread)\b/i, label: 'baked good' },
  { match: /\b(mug|tumbler)\b/i, label: 'mug' },
  { match: /\b(tote\s*bag|bag)\b/i, label: 'bag' },
  { match: /\b(sticker)\b/i, label: 'sticker' },
  { match: /\b(jacket|fleece|pullover)\b/i, label: 'jacket' }
]

function findProductType(text: string): string | null {
  for (const k of PRODUCT_TYPE_KEYWORDS) {
    if (k.match.test(text)) return k.label
  }
  return null
}

const QUALITY_KEYWORDS: Array<{ match: RegExp; label: string }> = [
  { match: /\b(luxury|luxe)\b/i, label: 'luxury' },
  { match: /\b(premium|high[-\s]end|heritage|heavyweight)\b/i, label: 'premium' },
  { match: /\b(limited\s*(run|edition)|capsule|small\s*batch|handmade|hand-?made|artisan)\b/i, label: 'limited / handmade' },
  { match: /\b(standard|classic|everyday)\b/i, label: 'standard' },
  { match: /\b(basic|budget|value|entry-level)\b/i, label: 'basic' }
]

function findQualityTier(text: string): string | null {
  for (const k of QUALITY_KEYWORDS) {
    if (k.match.test(text)) return k.label
  }
  return null
}

// ---------- public entry point ----------

export function extractCompSource(
  input: ExtractCompSourceInput
): ExtractedCompSourceSuggestion {
  const warnings: string[] = []
  const raw = (input.pastedText ?? '').toString()
  const trimmed = raw.trim()

  // Empty / very short paste → low confidence, refuse to guess.
  if (trimmed.length === 0) {
    warnings.push('Paste some text from the product page first.')
    return {
      priceCandidates: [],
      warnings,
      extractionConfidence: 'low'
    }
  }
  if (trimmed.length < 12) {
    warnings.push(
      'Pasted text is very short. Add the product page name, price, and source so the suggestion has something to work with.'
    )
    return {
      priceCandidates: [],
      warnings,
      extractionConfidence: 'low'
    }
  }

  // Cap input. Anything beyond MAX_INPUT_CHARS is dropped — students
  // shouldn't be pasting whole pages anyway, and capping keeps the
  // regex passes bounded.
  let text = trimmed
  if (text.length > MAX_INPUT_CHARS) {
    text = text.slice(0, MAX_INPUT_CHARS)
    warnings.push(
      `Pasted text was truncated to ${MAX_INPUT_CHARS} characters. Paste a smaller snippet (product name, price, store) for cleaner results.`
    )
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  // ---- URL ----
  const urlHit = findFirstUrl(text)
  const url = urlHit?.url

  // ---- source name ----
  let sourceName: string | undefined
  const fromHost = storeNameFromHostname(urlHit?.hostname ?? null)
  if (fromHost) sourceName = fromHost
  if (!sourceName) {
    const soldBy = findSoldBy(text)
    if (soldBy) sourceName = soldBy
  }

  // ---- product name ----
  // If a known store hostname matches one of the early lines, bias
  // away from picking that line as the product name.
  const linesForName = lines.filter((l) => {
    if (!sourceName) return true
    return l.toLowerCase() !== sourceName.toLowerCase()
  })
  const name = findProductName(linesForName) ?? undefined

  // ---- source date ----
  const sourceDate = findSourceDate(text) ?? undefined

  // ---- price candidates ----
  const priceCandidates = extractPriceCandidates(text)
  if (priceCandidates.length === 0) {
    warnings.push('No clear price found. Enter the price manually after checking the source.')
  } else if (priceCandidates.length > 1) {
    warnings.push(
      'Multiple prices found. Student should verify whether this is regular price, sale price, or variant price.'
    )
  } else {
    const sole = priceCandidates[0]
    if (sole.confidence === 'low') {
      warnings.push(
        'The only price candidate looks weak (cart/checkout context or zero). Verify against the live page before saving.'
      )
    }
  }

  // ---- product type / quality tier ----
  const productType = findProductType(text) ?? undefined
  const qualityTier = findQualityTier(text) ?? undefined

  // ---- standard verification reminders ----
  warnings.push(
    'Suggestions are a starting point. Check the product page before using this as evidence.'
  )
  warnings.push('This does not prove demand.')
  warnings.push(
    'Do not rely on sale prices or variant prices without checking the page.'
  )
  warnings.push('Student must verify before saving.')

  // ---- composite extraction confidence ----
  // High = we got name, source/URL, and at least one medium+ price
  // candidate. Medium = name + (source or price). Low = anything less.
  const hasName = !!name
  const hasSource = !!sourceName || !!url
  const hasGoodPrice = priceCandidates.some(
    (p) => p.confidence === 'high' || p.confidence === 'medium'
  )
  let extractionConfidence: ExtractedCompConfidence = 'low'
  if (hasName && hasSource && hasGoodPrice) extractionConfidence = 'high'
  else if (hasName && (hasSource || hasGoodPrice)) extractionConfidence = 'medium'

  return {
    name,
    sourceName,
    url,
    sourceDate,
    priceCandidates,
    productType,
    qualityTier,
    warnings,
    extractionConfidence
  }
}
