// Shared CSV export utility.
//
// Posture (do not relax):
//   - PURE: no Firestore, no fetch, no AI, no clipboard / disk IO.
//   - DOES NOT mutate input. Builders receive readonly rows and emit
//     a new string.
//   - DOES NOT expose unnecessary internal IDs / audit fields. Caller
//     decides what columns to include.
//   - Quotes any cell containing a comma, newline, carriage return, or
//     double-quote; embedded quotes are doubled per RFC 4180.
//   - Preserves blank cells (null / undefined → empty string).
//   - Never JSON.stringify()s arbitrary objects automatically — callers
//     must explicitly stringify or join arrays.

const NEEDS_QUOTING = /[",\n\r]/

/** Escape a single CSV cell. null/undefined → empty string. */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (NEEDS_QUOTING.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Join one row of values into a CSV line. Never appends a trailing
 *  newline — `makeCsv` is responsible for line joining. */
export function csvRow(values: readonly unknown[]): string {
  return values.map(csvEscape).join(',')
}

/** Build a complete CSV document from a header row and the data rows.
 *  Always emits the header line, even when `rows` is empty — that lets
 *  empty-state downloads still tell the reader what columns exist. Uses
 *  `\r\n` line endings, which Excel / Sheets / Numbers all handle. */
export function makeCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[]
): string {
  const lines: string[] = [csvRow(headers)]
  for (const row of rows) lines.push(csvRow(row))
  return lines.join('\r\n')
}

/** Treat a value safely for CSV output:
 *   - null / undefined → ''
 *   - booleans → 'true' / 'false'
 *   - numbers → toString (NaN / Infinity → '')
 *   - arrays → joined with '; ' so commas in values don't fight the
 *     escape; callers can pass a custom join if they need different
 *     semantics.
 *   - everything else → String(value)
 */
export function safeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) {
    return value
      .map((item) => safeCsvValue(item))
      .filter((s) => s.length > 0)
      .join('; ')
  }
  return String(value)
}

/** Format an ISO timestamp / date string for CSV output. Falls back
 *  to the raw input when parsing fails so a malformed seed never
 *  becomes silently blank. */
export function formatDateForCsv(input: string | null | undefined): string {
  if (!input) return ''
  // yyyy-mm-dd → leave alone; cleaner for spreadsheet auto-detection.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return input
  // ISO with seconds, no millis. Sheets/Excel parse this cleanly.
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Compute a quick word count for a Markdown / prose cell. Used by the
 *  Playbook section-status CSV so reviewers can sort by length. */
export function wordCount(text: string | null | undefined): number {
  if (!text) return 0
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** Lowercase, hyphen-sanitized filename for downloaded CSVs. Mirrors
 *  the shape `playbookExport.safePlaybookFilename` uses so the two
 *  helpers stay aligned across surfaces. */
export function safeCsvFilename(name: string): string {
  const normalized = (name || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  const capped = normalized.slice(0, 100)
  return capped.length > 0 ? capped : 'renni-export'
}

/** Trigger a client-side CSV download. Browser-only — bail out cleanly
 *  during SSR. Pure aside from the DOM hop; no network, no Firestore. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return
  const safe = safeCsvFilename(filename.replace(/\.csv$/i, '')) + '.csv'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safe
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
