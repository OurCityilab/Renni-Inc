// Shared Playbook preview normalizer.
//
// Single source of truth for "what text and fallback label should each
// section show in the read-only preview?". Both the in-app preview
// component (DeliverablePlaybookPreview.vue) and future export helpers
// (exportCenter.ts) consume the same normalized shape so the labels,
// fallbacks, and missing-section copy stay consistent.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI calls.
//   - DOES NOT MUTATE input objects. The function reads `output` and
//     returns a fresh array of normalized sections — the original
//     DeliverableOutput / DeliverableOutputSection objects are never
//     touched. (No `Object.assign(output, …)`, no in-place edits.)
//   - DOES NOT change approval semantics or output readiness. Final
//     readiness lives in outputReadiness.ts; this helper is display-
//     only.
//   - DOES NOT copy draftText into finalText. The current/export
//     fallback chain is a read-time presentation choice; the stored
//     section payload is untouched.

import type {
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  DeliverableOutputSectionStatus,
  StructuredEvidenceEntry
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'

export type PreviewMode = 'final' | 'current' | 'export'

export type PreviewContentSource =
  | 'finalText'
  | 'draftText'
  | 'sourceNotes'
  | 'missing'

export const PREVIEW_CONTENT_SOURCE_LABEL: Record<
  PreviewContentSource,
  string
> = {
  finalText: 'Final Playbook text',
  draftText: 'Draft text fallback',
  sourceNotes: 'Source notes fallback',
  missing: 'No saved section text yet'
}

export const PREVIEW_MODE_LABEL: Record<PreviewMode, string> = {
  final: 'Final preview',
  current: 'Current saved preview',
  export: 'Current saved preview'
}

export interface NormalizedPreviewSection {
  sectionId: string
  title: string
  content: string
  contentSource: PreviewContentSource
  contentSourceLabel: string
  isMissing: boolean
  // Plain-language message for the missing/fallback case. Empty string
  // when contentSource === 'finalText'.
  missingLabel: string
  // Pass-through references to existing section payload so the renderer
  // can keep rendering evidence/builders without re-reading the output.
  // These reference the same objects as the input; do not mutate.
  evidenceLinks: DeliverableEvidenceLink[]
  structuredEvidence: StructuredEvidenceEntry[]
  // Section workflow status from the persisted output (empty / in_progress
  // / ready). Null when no output / no persisted section exists.
  sectionStatus: DeliverableOutputSectionStatus | null
  // Whether the section is present in the persisted output map at all.
  // Used by export and current modes to distinguish "studio expected
  // this section but nothing is saved" from "section exists but text
  // is empty".
  hasPersistedSection: boolean
  // The original persisted section, for components that need direct
  // access to builder fields (marketFit, brandFit, pricingStrategy,
  // marketBuilderEntries, builderState). Null when nothing is saved.
  persistedSection: DeliverableOutputSection | null
}

export interface NormalizedDeliverablePreview {
  deliverableId: string
  title: string
  chapter: number
  status: Deliverable['status']
  mode: PreviewMode
  modeLabel: string
  sections: NormalizedPreviewSection[]
  // Count summary used by the preview header and the export adapter.
  totalSections: number
  sectionsWithFinalText: number
  sectionsWithFallback: number
  sectionsMissing: number
}

function normalizeText(s: string | null | undefined): string {
  return (s ?? '').trim()
}

function pickContent(
  persisted: DeliverableOutputSection | null,
  mode: PreviewMode
): { content: string; contentSource: PreviewContentSource } {
  const finalText = normalizeText(persisted?.finalText)
  if (mode === 'final') {
    return finalText
      ? { content: finalText, contentSource: 'finalText' }
      : { content: '', contentSource: 'missing' }
  }
  // current / export — fall back finalText → draftText → sourceNotes.
  if (finalText) return { content: finalText, contentSource: 'finalText' }
  const draftText = normalizeText(persisted?.draftText)
  if (draftText) return { content: draftText, contentSource: 'draftText' }
  const sourceNotes = normalizeText(persisted?.sourceNotes)
  if (sourceNotes) return { content: sourceNotes, contentSource: 'sourceNotes' }
  return { content: '', contentSource: 'missing' }
}

function missingLabelFor(
  mode: PreviewMode,
  contentSource: PreviewContentSource
): string {
  if (contentSource === 'finalText') return ''
  if (contentSource === 'missing') {
    return mode === 'final'
      ? 'Missing final Playbook text'
      : 'No saved section text yet'
  }
  // Fallback content present — surface why the reader is seeing it.
  if (contentSource === 'draftText') {
    return 'Showing draft text — final Playbook text has not been written yet.'
  }
  if (contentSource === 'sourceNotes') {
    return 'Showing source notes — neither final nor draft text has been written yet.'
  }
  return ''
}

export interface NormalizeDeliverablePreviewInput {
  deliverable: Pick<Deliverable, 'id' | 'title' | 'chapter' | 'status'>
  studio: TemplateStudio | null
  output: DeliverableOutput | null
  mode: PreviewMode
}

/**
 * Normalize a single deliverable's output into a display-ready preview.
 *
 * Section order comes from the studio (when available) so each preview
 * iterates the curriculum-defined sections in stable order. If a
 * persisted section carries an id not present in the studio (legacy /
 * orphaned), it is appended at the end so the renderer never silently
 * drops saved content.
 */
export function normalizeDeliverablePreview(
  input: NormalizeDeliverablePreviewInput
): NormalizedDeliverablePreview {
  const { deliverable, studio, output, mode } = input
  const persistedMap: Record<string, DeliverableOutputSection> =
    output?.sections ?? {}
  const studioSections: TemplateStudioSection[] = studio?.sections ?? []
  const seenIds = new Set<string>()

  const sections: NormalizedPreviewSection[] = []

  for (const s of studioSections) {
    const persisted = persistedMap[s.id] ?? null
    if (persisted) seenIds.add(s.id)
    const { content, contentSource } = pickContent(persisted, mode)
    sections.push({
      sectionId: s.id,
      title: s.title,
      content,
      contentSource,
      contentSourceLabel: PREVIEW_CONTENT_SOURCE_LABEL[contentSource],
      isMissing: contentSource === 'missing',
      missingLabel: missingLabelFor(mode, contentSource),
      evidenceLinks: persisted?.evidenceLinks ?? [],
      structuredEvidence: persisted?.structuredEvidence ?? [],
      sectionStatus: persisted?.status ?? null,
      hasPersistedSection: !!persisted,
      persistedSection: persisted
    })
  }

  // Orphan / legacy sections: persisted but not in the studio. Append in
  // stable map order so saved content is never silently dropped.
  for (const sid of Object.keys(persistedMap)) {
    if (seenIds.has(sid)) continue
    const persisted = persistedMap[sid]!
    const { content, contentSource } = pickContent(persisted, mode)
    sections.push({
      sectionId: sid,
      title: persisted.sectionTitleSnapshot || sid,
      content,
      contentSource,
      contentSourceLabel: PREVIEW_CONTENT_SOURCE_LABEL[contentSource],
      isMissing: contentSource === 'missing',
      missingLabel: missingLabelFor(mode, contentSource),
      evidenceLinks: persisted.evidenceLinks ?? [],
      structuredEvidence: persisted.structuredEvidence ?? [],
      sectionStatus: persisted.status ?? null,
      hasPersistedSection: true,
      persistedSection: persisted
    })
  }

  let sectionsWithFinalText = 0
  let sectionsWithFallback = 0
  let sectionsMissing = 0
  for (const n of sections) {
    if (n.contentSource === 'finalText') sectionsWithFinalText += 1
    else if (n.contentSource === 'missing') sectionsMissing += 1
    else sectionsWithFallback += 1
  }

  return {
    deliverableId: deliverable.id,
    title: studio?.title || deliverable.title,
    chapter: deliverable.chapter,
    status: deliverable.status,
    mode,
    modeLabel: PREVIEW_MODE_LABEL[mode],
    sections,
    totalSections: sections.length,
    sectionsWithFinalText,
    sectionsWithFallback,
    sectionsMissing
  }
}

/**
 * Adapter used by the future export pass. Renders one section as a
 * Markdown block honoring the preview mode's fallback rules. Kept here
 * so exportCenter.ts (and any other export target) can call into the
 * same labels and fallback chain the in-app preview already uses.
 *
 * Pure: returns a new string; never touches Firestore.
 */
export function renderSectionMarkdown(
  section: NormalizedPreviewSection
): string {
  const lines: string[] = []
  lines.push(`## ${section.title}`)
  lines.push('')
  if (section.contentSource === 'missing') {
    lines.push(`_(${section.missingLabel})_`)
  } else {
    if (section.contentSource !== 'finalText') {
      lines.push(`_${section.missingLabel}_`)
      lines.push('')
    }
    lines.push(section.content)
  }
  if (section.evidenceLinks.length) {
    lines.push('')
    lines.push('### Evidence links')
    for (const l of section.evidenceLinks) {
      lines.push(`- [${l.label}](${l.url}) (${l.type})`)
    }
  }
  if (section.structuredEvidence.length) {
    lines.push('')
    lines.push('### Structured evidence')
    for (const e of section.structuredEvidence) {
      lines.push(`- **${e.claim}** — ${e.evidence} (source: ${e.source})`)
    }
  }
  return lines.join('\n')
}
