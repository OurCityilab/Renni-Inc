import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

// Reads a CSV file into typed rows. `T` is intentionally
// unconstrained beyond `object`: TypeScript does not promote
// concrete interface fields (e.g. `email: string`) to a
// `Record<string, string>` index signature, so any constraint
// stricter than `object` rejected the seed-script Row interfaces
// even though every cell is in fact a string. Papa.parse runs
// with `dynamicTyping: false`, so every present value is a string;
// missing columns come back as `undefined`. The helper does not
// enforce that at the type level.
export function readCsv<T extends object>(relativePath: string): T[] {
  const filePath = path.resolve(process.cwd(), relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`[csv] file not found: ${filePath}`)
  }
  const text = fs.readFileSync(filePath, 'utf8')
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  })
  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      console.warn(`[csv] ${relativePath}:`, err.message, err.row)
    }
  }
  return parsed.data
}

export function readJson<T>(relativePath: string): T {
  const filePath = path.resolve(process.cwd(), relativePath)
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toBool(value: string | undefined): boolean {
  return /^(true|1|yes|y)$/i.test((value || '').trim())
}

// Deliverable document IDs combine a zero-padded chapter prefix with a slug
// of the title, e.g. `ch-01-executive-summary`. Keeping the chapter in the
// prefix preserves sortability and chapter grouping; slugging the title lets
// more than one deliverable share a chapter in the future.
//
// Note: IDs are derived from (chapter, title). If you rename a seeded
// deliverable, the derived ID changes — delete the old doc explicitly before
// re-seeding, or the old one will be orphaned.
export function deliverableDocId(chapter: number | string, title: string): string {
  const n = typeof chapter === 'number' ? chapter : Number(chapter)
  const prefix = `ch-${String(n).padStart(2, '0')}`
  const tail = slugify(title)
  return tail ? `${prefix}-${tail}` : prefix
}

// Chapter-prefixed zero-padded string, used for task IDs and human labels.
export function chapterPrefix(chapter: number | string): string {
  const n = typeof chapter === 'number' ? chapter : Number(chapter)
  return `ch-${String(n).padStart(2, '0')}`
}
