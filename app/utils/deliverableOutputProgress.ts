// Display-only progress helpers for the chapter hub. Pure reads from
// a `DeliverableOutput` snapshot keyed by section id; never writes,
// never calls Firestore, never imports outputReadiness.ts.
//
// Important guarantee: nothing in this module feeds the submit gate
// or Playbook readiness. Submit gate continues to depend solely on
// required requirement-task coverage; Playbook readiness continues to
// depend solely on `finalText`. Progress chips here are visual cues
// for the chapter hub.

import type {
  DeliverableOutput,
  DeliverableOutputSection
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'

export interface SectionProgress {
  sectionId: string
  sectionTitle: string
  hasSourceNotes: boolean
  hasDraft: boolean
  hasFinal: boolean
  evidenceCount: number
  structuredEvidenceCount: number
  marketBuilderCount: number
  // Builder "started" flags reflect whether the section's marketFit /
  // brandFit / marketBuilder objects carry any saved content. The
  // chapter hub uses these to render small chips next to each card.
  marketFitStarted: boolean
  brandFitStarted: boolean
  marketBuilderEnabled: boolean
  marketFitEnabled: boolean
  brandFitEnabled: boolean
  // Last-saved timestamp for the section (if any). Surfaced as a
  // small subtitle on each card.
  updatedAt: string | null
  needsAttention: boolean
}

function persistedFor(
  output: DeliverableOutput | null,
  sectionId: string
): DeliverableOutputSection | null {
  return output?.sections?.[sectionId] ?? null
}

function isFilled(s: string | null | undefined): boolean {
  return typeof s === 'string' && s.trim() !== ''
}

// "Needs attention" = the section opted into a builder that hasn't
// been saved yet, OR the section has no final text and no draft. Soft
// signal — a section with notes-only is still considered in-progress.
function computeNeedsAttention(
  section: TemplateStudioSection,
  persisted: DeliverableOutputSection | null
): boolean {
  const hasFinal = isFilled(persisted?.finalText)
  const hasDraft = isFilled(persisted?.draftText)
  if (!hasFinal && !hasDraft) return true

  if (section.marketBuilder?.enabled) {
    if ((persisted?.marketBuilderEntries?.length ?? 0) === 0) return true
  }
  if (section.marketFit?.enabled) {
    const fit = persisted?.marketFit
    const populated =
      Boolean(fit?.productFacts?.productName?.trim()) ||
      (fit?.segments?.length ?? 0) > 0 ||
      (fit?.comparables?.length ?? 0) > 0 ||
      (fit?.evidenceRequests?.length ?? 0) > 0
    if (!populated) return true
  }
  if (section.brandFit?.enabled) {
    const fit = persisted?.brandFit
    const populated =
      Boolean(fit?.brandIntent?.brandName?.trim()) ||
      (fit?.referenceBrands?.length ?? 0) > 0 ||
      (fit?.brandSignals?.length ?? 0) > 0 ||
      Boolean(fit?.recommendation?.brandSignalSummary?.trim())
    if (!populated) return true
  }
  return false
}

export function summarizeSectionProgress(
  section: TemplateStudioSection,
  output: DeliverableOutput | null
): SectionProgress {
  const persisted = persistedFor(output, section.id)
  const fit = persisted?.marketFit
  const brand = persisted?.brandFit
  return {
    sectionId: section.id,
    sectionTitle: section.title,
    hasSourceNotes: isFilled(persisted?.sourceNotes),
    hasDraft: isFilled(persisted?.draftText),
    hasFinal: isFilled(persisted?.finalText),
    evidenceCount: persisted?.evidenceLinks?.length ?? 0,
    structuredEvidenceCount: persisted?.structuredEvidence?.length ?? 0,
    marketBuilderCount: persisted?.marketBuilderEntries?.length ?? 0,
    marketFitStarted:
      Boolean(fit?.productFacts?.productName?.trim()) ||
      (fit?.segments?.length ?? 0) > 0 ||
      (fit?.comparables?.length ?? 0) > 0 ||
      (fit?.evidenceRequests?.length ?? 0) > 0,
    brandFitStarted:
      Boolean(brand?.brandIntent?.brandName?.trim()) ||
      (brand?.referenceBrands?.length ?? 0) > 0 ||
      (brand?.brandSignals?.length ?? 0) > 0 ||
      Boolean(brand?.recommendation?.brandSignalSummary?.trim()),
    marketBuilderEnabled: section.marketBuilder?.enabled === true,
    marketFitEnabled: section.marketFit?.enabled === true,
    brandFitEnabled: section.brandFit?.enabled === true,
    updatedAt: persisted?.updatedAt ?? null,
    needsAttention: computeNeedsAttention(section, persisted)
  }
}

export interface ChapterProgress {
  totalSections: number
  finalDone: number
  draftDone: number
  sourceNotesDone: number
  evidenceCovered: number
  marketBuilderEnabledStarted: number
  marketBuilderEnabledTotal: number
  marketFitEnabledStarted: number
  marketFitEnabledTotal: number
  brandFitEnabledStarted: number
  brandFitEnabledTotal: number
  needsAttention: number
  perSection: SectionProgress[]
}

export function summarizeChapterProgress(
  studio: TemplateStudio,
  output: DeliverableOutput | null
): ChapterProgress {
  const perSection = studio.sections.map((s) =>
    summarizeSectionProgress(s, output)
  )
  let finalDone = 0
  let draftDone = 0
  let sourceNotesDone = 0
  let evidenceCovered = 0
  let mbStarted = 0
  let mbTotal = 0
  let mfStarted = 0
  let mfTotal = 0
  let bfStarted = 0
  let bfTotal = 0
  let needsAttention = 0
  for (const sp of perSection) {
    if (sp.hasFinal) finalDone += 1
    if (sp.hasDraft) draftDone += 1
    if (sp.hasSourceNotes) sourceNotesDone += 1
    if (sp.evidenceCount > 0 || sp.structuredEvidenceCount > 0) {
      evidenceCovered += 1
    }
    if (sp.marketBuilderEnabled) {
      mbTotal += 1
      if (sp.marketBuilderCount > 0) mbStarted += 1
    }
    if (sp.marketFitEnabled) {
      mfTotal += 1
      if (sp.marketFitStarted) mfStarted += 1
    }
    if (sp.brandFitEnabled) {
      bfTotal += 1
      if (sp.brandFitStarted) bfStarted += 1
    }
    if (sp.needsAttention) needsAttention += 1
  }
  return {
    totalSections: perSection.length,
    finalDone,
    draftDone,
    sourceNotesDone,
    evidenceCovered,
    marketBuilderEnabledStarted: mbStarted,
    marketBuilderEnabledTotal: mbTotal,
    marketFitEnabledStarted: mfStarted,
    marketFitEnabledTotal: mfTotal,
    brandFitEnabledStarted: bfStarted,
    brandFitEnabledTotal: bfTotal,
    needsAttention,
    perSection
  }
}
