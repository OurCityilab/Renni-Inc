// Pure Playbook readiness aggregator.
//
// Builds a single summary (counts of chapters, deliverables, sections
// by content source, evidence items) by walking the same
// `normalizeDeliverablePreview` shape the in-app preview and the
// Markdown / CSV exports already use. Drives the readiness page on
// /playbook/print and the chapter-level overview rendered there.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI calls.
//   - DOES NOT mutate input arrays / objects.
//   - DOES NOT change approval semantics, output readiness,
//     submit-gate logic, or any other workflow surface.
//   - WARNING-ONLY: the summary is informational; it is never a hard
//     gate on submit, approval, or print.

import type {
  Deliverable,
  DeliverableOutput
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import {
  normalizeDeliverablePreview,
  type PreviewMode
} from '~/utils/playbookPreview'

export interface ReadinessChapterInput {
  chapter: number
  title?: string
  deliverables: Array<{
    deliverable: Pick<
      Deliverable,
      'id' | 'title' | 'chapter' | 'department' | 'status'
    >
    studio: TemplateStudio | null
    output: DeliverableOutput | null
  }>
}

export interface ReadinessInput {
  chapters: ReadinessChapterInput[]
  /** Preview mode that drives the section content-source counts. The
   *  print route uses 'export' (current saved state with the standard
   *  fallback chain) by default. */
  mode?: PreviewMode
}

export interface PlaybookReadinessSummary {
  totalChapters: number
  totalDeliverables: number
  approvedDeliverables: number
  draftDeliverables: number
  inReviewDeliverables: number
  needsRevisionDeliverables: number
  totalSections: number
  sectionsWithFinalText: number
  sectionsWithDraftFallback: number
  sectionsWithSourceNotesFallback: number
  sectionsMissing: number
  evidenceLinkCount: number
  structuredEvidenceCount: number
  /** Per-chapter slim summary for the printable TOC + chapter overview. */
  chapters: Array<{
    chapter: number
    title: string
    deliverableCount: number
    approvedCount: number
    totalSections: number
    sectionsWithFinalText: number
    sectionsMissing: number
    statusLabel: string
  }>
  /** A flat list of "missing" gaps surfaced on the appendix page so a
   *  reader can see at-a-glance what is still incomplete. Never
   *  blocks anything. */
  missingItems: Array<{
    chapter: number
    chapterTitle: string
    deliverableTitle: string
    sectionTitle: string
    note: string
  }>
}

const STATUS_LABEL: Record<Deliverable['status'], string> = {
  draft: 'In progress',
  in_review: 'Submitted for review',
  needs_revision: 'Needs revision',
  approved: 'Approved for the Playbook'
}

function classifyChapterStatus(
  approvedCount: number,
  totalDeliverables: number,
  inReviewCount: number,
  needsRevisionCount: number
): string {
  if (totalDeliverables === 0) return 'Not started'
  if (approvedCount === totalDeliverables) return 'Approved'
  if (needsRevisionCount > 0) return 'Needs revision'
  if (inReviewCount > 0) return 'Submitted for review'
  return 'In progress'
}

export function summarizePlaybookReadiness(
  input: ReadinessInput
): PlaybookReadinessSummary {
  const mode: PreviewMode = input.mode ?? 'export'

  let totalDeliverables = 0
  let approvedDeliverables = 0
  let draftDeliverables = 0
  let inReviewDeliverables = 0
  let needsRevisionDeliverables = 0

  let totalSections = 0
  let sectionsWithFinalText = 0
  let sectionsWithDraftFallback = 0
  let sectionsWithSourceNotesFallback = 0
  let sectionsMissing = 0

  let evidenceLinkCount = 0
  let structuredEvidenceCount = 0

  const chapters: PlaybookReadinessSummary['chapters'] = []
  const missingItems: PlaybookReadinessSummary['missingItems'] = []

  const ordered = [...input.chapters].sort((a, b) => a.chapter - b.chapter)
  for (const ch of ordered) {
    let chapterDeliverableCount = 0
    let chapterApprovedCount = 0
    let chapterInReviewCount = 0
    let chapterNeedsRevisionCount = 0
    let chapterTotalSections = 0
    let chapterSectionsWithFinalText = 0
    let chapterSectionsMissing = 0
    let chapterTitle: string | null = ch.title ?? null

    for (const d of ch.deliverables) {
      totalDeliverables += 1
      chapterDeliverableCount += 1
      switch (d.deliverable.status) {
        case 'approved':
          approvedDeliverables += 1
          chapterApprovedCount += 1
          break
        case 'in_review':
          inReviewDeliverables += 1
          chapterInReviewCount += 1
          break
        case 'needs_revision':
          needsRevisionDeliverables += 1
          chapterNeedsRevisionCount += 1
          break
        default:
          draftDeliverables += 1
      }
      const preview = normalizeDeliverablePreview({
        deliverable: d.deliverable,
        studio: d.studio,
        output: d.output,
        mode
      })
      if (!chapterTitle) chapterTitle = preview.title

      for (const section of preview.sections) {
        totalSections += 1
        chapterTotalSections += 1
        switch (section.contentSource) {
          case 'finalText':
            sectionsWithFinalText += 1
            chapterSectionsWithFinalText += 1
            break
          case 'draftText':
            sectionsWithDraftFallback += 1
            break
          case 'sourceNotes':
            sectionsWithSourceNotesFallback += 1
            break
          case 'missing':
            sectionsMissing += 1
            chapterSectionsMissing += 1
            missingItems.push({
              chapter: ch.chapter,
              chapterTitle: chapterTitle ?? `Chapter ${ch.chapter}`,
              deliverableTitle: preview.title,
              sectionTitle: section.title,
              note: section.missingLabel || 'No saved section text yet'
            })
            break
        }
        evidenceLinkCount += section.evidenceLinks.length
        structuredEvidenceCount += section.structuredEvidence.length
      }
    }

    chapters.push({
      chapter: ch.chapter,
      title: chapterTitle ?? `Chapter ${ch.chapter}`,
      deliverableCount: chapterDeliverableCount,
      approvedCount: chapterApprovedCount,
      totalSections: chapterTotalSections,
      sectionsWithFinalText: chapterSectionsWithFinalText,
      sectionsMissing: chapterSectionsMissing,
      statusLabel: classifyChapterStatus(
        chapterApprovedCount,
        chapterDeliverableCount,
        chapterInReviewCount,
        chapterNeedsRevisionCount
      )
    })
  }

  return {
    totalChapters: ordered.length,
    totalDeliverables,
    approvedDeliverables,
    draftDeliverables,
    inReviewDeliverables,
    needsRevisionDeliverables,
    totalSections,
    sectionsWithFinalText,
    sectionsWithDraftFallback,
    sectionsWithSourceNotesFallback,
    sectionsMissing,
    evidenceLinkCount,
    structuredEvidenceCount,
    chapters,
    missingItems
  }
}

/** Friendly label for a single deliverable status, mirrors the export /
 *  CSV labels so the print route never shows a raw enum. */
export function readinessStatusLabel(status: Deliverable['status']): string {
  return STATUS_LABEL[status]
}
