// Pure Playbook export helpers.
//
// V1 export: Markdown only (copy or client-side Blob download). Reuses
// the shared preview normalizer so the fallback chain (finalText →
// draftText → sourceNotes → missing) and the section-source labels
// stay identical to what students see in the in-app Playbook preview.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI calls.
//   - DOES NOT mutate input objects. The output / studio / deliverable
//     references are read-only — never copy draftText into finalText,
//     never overwrite anything.
//   - DOES NOT change approval, output readiness, submit gates.
//   - DOES NOT require every section / chapter to be approved or final.
//     Incomplete chapters are exported with explicit fallback labels.
//   - No PDF/DOCX, no server-side route, no Drive/OAuth.

import type {
  Deliverable,
  DeliverableOutput
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import {
  normalizeDeliverablePreview,
  renderSectionMarkdown,
  type NormalizedDeliverablePreview,
  type PreviewMode
} from '~/utils/playbookPreview'
import { makeCsv, wordCount } from '~/utils/csvExport'

export type PlaybookExportMode = PreviewMode

const MODE_BANNER: Record<PlaybookExportMode, string> = {
  final:
    'Export mode: Final Playbook text only. Missing final sections are labeled.',
  current:
    'Export mode: Current Saved State. Draft and source-note fallback may appear where final Playbook text is missing.',
  export:
    'Export mode: Current Saved State. Draft and source-note fallback may appear where final Playbook text is missing.'
}

const STATUS_LABEL: Record<Deliverable['status'], string> = {
  draft: 'In progress',
  in_review: 'Submitted for review',
  needs_revision: 'Needs revision',
  approved: 'Approved for the Playbook'
}

export interface DeliverableExportInput {
  deliverable: Pick<
    Deliverable,
    | 'id'
    | 'title'
    | 'chapter'
    | 'department'
    | 'status'
    | 'ownerEmail'
    | 'approverEmail'
    | 'dueDate'
  >
  studio: TemplateStudio | null
  output: DeliverableOutput | null
}

export interface DeliverableMarkdownOptions {
  mode?: PlaybookExportMode
  /** When set, an ISO-like timestamp line is added to the header. */
  exportedAt?: string | null
  /** Hide the document-level title and timestamp banner — used when a
   *  chapter / full-Playbook builder embeds this output under its own
   *  heading. */
  asNestedSection?: boolean
}

export interface ChapterExportInput {
  chapter: number
  title?: string
  deliverables: DeliverableExportInput[]
}

export interface ChapterMarkdownOptions extends DeliverableMarkdownOptions {}

export interface FullPlaybookExportInput {
  /**
   * Optional brand / playbook label for the document title. Defaults to
   * "Renni Inc. Brand & Operations Playbook" so the parent company /
   * Playbook naming the project uses stays consistent.
   */
  title?: string
  chapters: ChapterExportInput[]
}

export interface FullPlaybookMarkdownOptions extends DeliverableMarkdownOptions {}

/**
 * Lowercases, replaces unsafe characters with hyphens, collapses runs
 * of hyphens, trims leading/trailing hyphens, and keeps the result
 * within a reasonable filename length. Pure — never touches disk.
 */
export function safePlaybookFilename(name: string): string {
  const normalized = (name || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  // Cap length so an OS-level filename limit isn't ever hit by a long
  // chapter title. 100 chars is generous and still readable.
  const capped = normalized.slice(0, 100)
  return capped.length > 0 ? capped : 'renni-playbook-export'
}

export function fullPlaybookFilename(
  exportedAt?: string | null,
  mode: PlaybookExportMode = 'export'
): string {
  const base =
    mode === 'final'
      ? 'renni-playbook-final-state'
      : 'renni-playbook-current-state'
  if (!exportedAt) return `${safePlaybookFilename(base)}.md`
  const stamp = exportedAt.replace(/[:.]/g, '-')
  return `${safePlaybookFilename(`${base}-${stamp}`)}.md`
}

export function chapterFilename(input: ChapterExportInput): string {
  const slug = safePlaybookFilename(
    `${input.title ?? deriveChapterTitle(input) ?? `chapter-${input.chapter}`}`
  )
  const padded = String(input.chapter).padStart(2, '0')
  return `${safePlaybookFilename(`renni-playbook-chapter-${padded}-${slug}`)}.md`
}

export function deliverableFilename(input: DeliverableExportInput): string {
  const slug = safePlaybookFilename(input.deliverable.id)
  return `${safePlaybookFilename(`renni-deliverable-${slug}`)}.md`
}

function deriveChapterTitle(input: ChapterExportInput): string | null {
  if (input.title) return input.title
  const first = input.deliverables[0]
  if (!first) return null
  return first.studio?.title || first.deliverable.title
}

function joinLines(lines: string[]): string {
  return lines.join('\n')
}

function appendBlank(lines: string[]): void {
  if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('')
}

function describeDeliverableHeader(
  deliverable: DeliverableExportInput['deliverable'],
  mode: PlaybookExportMode
): string[] {
  const lines: string[] = []
  const meta: string[] = []
  meta.push(`Chapter ${deliverable.chapter}`)
  meta.push(`Department: ${deliverable.department}`)
  meta.push(`Status: ${STATUS_LABEL[deliverable.status]}`)
  if (deliverable.ownerEmail) meta.push(`Owner: ${deliverable.ownerEmail}`)
  if (deliverable.approverEmail) meta.push(`Approver: ${deliverable.approverEmail}`)
  if (deliverable.dueDate) meta.push(`Due: ${deliverable.dueDate}`)
  lines.push(`_${meta.join(' · ')}_`)
  lines.push('')
  lines.push(`_${MODE_BANNER[mode]}_`)
  return lines
}

function buildDeliverableSectionBlock(
  preview: NormalizedDeliverablePreview
): string {
  const blocks: string[] = []
  for (const section of preview.sections) {
    blocks.push(renderSectionMarkdown(section))
  }
  // renderSectionMarkdown already starts with `## …`, so blank-line
  // separated joins look right in Markdown.
  return blocks.join('\n\n')
}

/**
 * Build Markdown for a single deliverable in the requested preview
 * mode. The fallback chain (finalText → draftText → sourceNotes →
 * missing) is provided by `normalizeDeliverablePreview`; section
 * Markdown comes from `renderSectionMarkdown`.
 *
 * Defaults to mode='export' so callers that only want "current saved
 * state" don't need to specify it.
 */
export function buildDeliverableMarkdown(
  input: DeliverableExportInput,
  options: DeliverableMarkdownOptions = {}
): string {
  const mode = options.mode ?? 'export'
  const preview = normalizeDeliverablePreview({
    deliverable: input.deliverable,
    studio: input.studio,
    output: input.output,
    mode
  })

  const lines: string[] = []

  if (!options.asNestedSection) {
    lines.push(`# ${preview.title}`)
    lines.push('')
    if (options.exportedAt) {
      lines.push(`_Exported ${options.exportedAt}_`)
      lines.push('')
    }
    lines.push(...describeDeliverableHeader(input.deliverable, mode))
    appendBlank(lines)
  } else {
    // Nested mode: render under a chapter / full-Playbook H1. Use H2
    // for the deliverable title so the chapter / full doc owns H1.
    lines.push(`## ${preview.title}`)
    lines.push('')
    lines.push(...describeDeliverableHeader(input.deliverable, mode))
    appendBlank(lines)
  }

  if (!input.studio) {
    lines.push('_(This deliverable is not studio-backed.)_')
    return joinLines(lines)
  }

  const summary = preview
  lines.push(
    `_${summary.sectionsWithFinalText} of ${summary.totalSections} sections have final Playbook text` +
      (summary.sectionsWithFallback > 0
        ? ` · ${summary.sectionsWithFallback} showing fallback content`
        : '') +
      (summary.sectionsMissing > 0
        ? ` · ${summary.sectionsMissing} still missing`
        : '') +
      '._'
  )
  appendBlank(lines)

  const sectionBlock = buildDeliverableSectionBlock(preview)
  if (sectionBlock) {
    // When nested, downgrade ## section headings to ### so the chapter
    // / full-doc H1/H2 hierarchy stays clean.
    if (options.asNestedSection) {
      lines.push(downgradeHeadings(sectionBlock))
    } else {
      lines.push(sectionBlock)
    }
  } else {
    lines.push('_(no sections defined)_')
  }

  return joinLines(lines)
}

function downgradeHeadings(md: string): string {
  // ## → ###, ### → ####, etc. Only at line start.
  return md.replace(/^(#{2,5}) /gm, (_match, hashes: string) => `${hashes}# `)
}

/**
 * Build Markdown for a chapter — one or more deliverables under a
 * single chapter heading. Deliverables without a studio are still
 * included; their section list is replaced by a clear non-studio
 * notice.
 */
export function buildChapterMarkdown(
  input: ChapterExportInput,
  options: ChapterMarkdownOptions = {}
): string {
  const mode = options.mode ?? 'export'
  const title = deriveChapterTitle(input) ?? `Chapter ${input.chapter}`

  const lines: string[] = []
  if (!options.asNestedSection) {
    lines.push(`# ${title}`)
    lines.push('')
    if (options.exportedAt) {
      lines.push(`_Exported ${options.exportedAt}_`)
      lines.push('')
    }
    lines.push(`_${MODE_BANNER[mode]}_`)
    appendBlank(lines)
  } else {
    lines.push(`## Chapter ${input.chapter} · ${title}`)
    appendBlank(lines)
  }

  if (input.deliverables.length === 0) {
    lines.push('_(no deliverables in this chapter)_')
    return joinLines(lines)
  }

  for (const d of input.deliverables) {
    lines.push(
      buildDeliverableMarkdown(d, {
        mode,
        asNestedSection: true
      })
    )
    appendBlank(lines)
  }

  return joinLines(lines).trimEnd()
}

/**
 * Build Markdown for the entire Playbook — every studio-backed
 * chapter, including incomplete chapters. Each chapter is rendered
 * via `buildChapterMarkdown` in nested mode so the document keeps a
 * single H1.
 */
export function buildFullPlaybookMarkdown(
  input: FullPlaybookExportInput,
  options: FullPlaybookMarkdownOptions = {}
): string {
  const mode = options.mode ?? 'export'
  const title = input.title || 'Renni Inc. Brand & Operations Playbook'
  const lines: string[] = []
  lines.push(`# ${title}`)
  lines.push('')
  if (options.exportedAt) {
    lines.push(`_Exported ${options.exportedAt}_`)
    lines.push('')
  }
  lines.push(`_${MODE_BANNER[mode]}_`)
  appendBlank(lines)

  if (input.chapters.length === 0) {
    lines.push('_(no chapters available)_')
    return joinLines(lines)
  }

  // Roll-up stats so reviewers can see at a glance how complete the
  // export actually is.
  let totalDeliverables = 0
  let totalSections = 0
  let sectionsWithFinalText = 0
  let sectionsWithFallback = 0
  let sectionsMissing = 0
  for (const ch of input.chapters) {
    for (const d of ch.deliverables) {
      totalDeliverables += 1
      const preview = normalizeDeliverablePreview({
        deliverable: d.deliverable,
        studio: d.studio,
        output: d.output,
        mode
      })
      totalSections += preview.totalSections
      sectionsWithFinalText += preview.sectionsWithFinalText
      sectionsWithFallback += preview.sectionsWithFallback
      sectionsMissing += preview.sectionsMissing
    }
  }
  lines.push('## Export summary')
  lines.push('')
  lines.push(
    `- Chapters: ${input.chapters.length}`
  )
  lines.push(`- Deliverables: ${totalDeliverables}`)
  lines.push(`- Sections total: ${totalSections}`)
  lines.push(`- Final Playbook text: ${sectionsWithFinalText}`)
  lines.push(`- Fallback content: ${sectionsWithFallback}`)
  lines.push(`- Missing: ${sectionsMissing}`)
  appendBlank(lines)

  // Sorted chapter order so the export is deterministic regardless of
  // input ordering.
  const ordered = [...input.chapters].sort((a, b) => a.chapter - b.chapter)
  for (const ch of ordered) {
    lines.push(
      buildChapterMarkdown(ch, {
        mode,
        asNestedSection: true
      })
    )
    appendBlank(lines)
  }

  return joinLines(lines).trimEnd()
}

// ============================================================
// CSV exports
// ============================================================
//
// Both CSV builders reuse `normalizeDeliverablePreview` so the
// per-section content source / fallback labels match the in-app
// preview and the Markdown export exactly. The builders never read
// Firestore and never mutate the input objects.

const SECTION_STATUS_HEADERS = [
  'chapter',
  'chapterTitle',
  'deliverableTitle',
  'department',
  'owner',
  'approver',
  'deliverableStatus',
  'sectionTitle',
  'sectionStatus',
  'contentSource',
  'contentSourceLabel',
  'wordCount',
  'hasFinalText',
  'hasDraftText',
  'hasSourceNotes',
  'isMissing',
  'evidenceLinkCount',
  'structuredEvidenceCount'
] as const

/** Build a one-row-per-section CSV. Includes incomplete sections and
 *  fallback content-source labels. Headers are always emitted, even
 *  when no rows match. */
export function buildPlaybookSectionStatusCsv(
  input: FullPlaybookExportInput,
  options: { mode?: PlaybookExportMode } = {}
): string {
  const mode = options.mode ?? 'export'
  const rows: unknown[][] = []
  const ordered = [...input.chapters].sort((a, b) => a.chapter - b.chapter)
  for (const ch of ordered) {
    const chapterTitle = deriveChapterTitle(ch) ?? `Chapter ${ch.chapter}`
    for (const d of ch.deliverables) {
      const preview = normalizeDeliverablePreview({
        deliverable: d.deliverable,
        studio: d.studio,
        output: d.output,
        mode
      })
      const deliverableTitle = preview.title
      for (const section of preview.sections) {
        const persisted = section.persistedSection
        const hasFinalText =
          ((persisted?.finalText ?? '').trim().length > 0)
        const hasDraftText =
          ((persisted?.draftText ?? '').trim().length > 0)
        const hasSourceNotes =
          ((persisted?.sourceNotes ?? '').trim().length > 0)
        rows.push([
          ch.chapter,
          chapterTitle,
          deliverableTitle,
          d.deliverable.department,
          d.deliverable.ownerEmail ?? '',
          d.deliverable.approverEmail ?? '',
          STATUS_LABEL[d.deliverable.status],
          section.title,
          section.sectionStatus ?? '',
          section.contentSource,
          section.contentSourceLabel,
          wordCount(section.content),
          hasFinalText,
          hasDraftText,
          hasSourceNotes,
          section.isMissing,
          section.evidenceLinks.length,
          section.structuredEvidence.length
        ])
      }
    }
  }
  return makeCsv(SECTION_STATUS_HEADERS, rows)
}

const EVIDENCE_HEADERS = [
  'chapter',
  'chapterTitle',
  'deliverableTitle',
  'department',
  'sectionTitle',
  'evidenceType',
  'labelOrClaim',
  'evidence',
  'source',
  'url',
  'confidence',
  'risk',
  'nextValidation',
  'relatedRequirement',
  'contentSource'
] as const

/** Build a one-row-per-evidence-item CSV covering both linked evidence
 *  and structured evidence. Section context (chapter, deliverable,
 *  section title, content source) is duplicated on every row so the
 *  output is sortable / filterable on its own in a spreadsheet. */
export function buildPlaybookEvidenceCsv(
  input: FullPlaybookExportInput,
  options: { mode?: PlaybookExportMode } = {}
): string {
  const mode = options.mode ?? 'export'
  const rows: unknown[][] = []
  const ordered = [...input.chapters].sort((a, b) => a.chapter - b.chapter)
  for (const ch of ordered) {
    const chapterTitle = deriveChapterTitle(ch) ?? `Chapter ${ch.chapter}`
    for (const d of ch.deliverables) {
      const preview = normalizeDeliverablePreview({
        deliverable: d.deliverable,
        studio: d.studio,
        output: d.output,
        mode
      })
      const deliverableTitle = preview.title
      for (const section of preview.sections) {
        for (const link of section.evidenceLinks) {
          rows.push([
            ch.chapter,
            chapterTitle,
            deliverableTitle,
            d.deliverable.department,
            section.title,
            'link',
            link.label ?? '',
            '',
            '',
            link.url ?? '',
            '',
            '',
            '',
            link.requirementId ?? '',
            section.contentSource
          ])
        }
        for (const entry of section.structuredEvidence) {
          rows.push([
            ch.chapter,
            chapterTitle,
            deliverableTitle,
            d.deliverable.department,
            section.title,
            'structured',
            entry.claim ?? '',
            entry.evidence ?? '',
            entry.source ?? '',
            '',
            entry.confidence ?? '',
            entry.risk ?? '',
            entry.nextValidation ?? '',
            entry.requirementId ?? '',
            section.contentSource
          ])
        }
      }
    }
  }
  return makeCsv(EVIDENCE_HEADERS, rows)
}
