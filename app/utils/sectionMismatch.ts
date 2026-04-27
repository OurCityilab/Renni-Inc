// Pure helpers that detect "false-progress" mismatches between a task
// and a section's persisted output, or within a section alone.
//
// These warnings are non-blocking — they never gate task status changes,
// section saves, the submit-for-review gate, or approval. They surface
// inline so a student (and their chief / instructor) can see when a
// task is marked done but the section is empty, or when a section has
// final Playbook text without supporting proof on a high-rigor chapter.
//
// Posture (do not relax):
//   - no Firestore reads
//   - no Vue / runtime imports — pure functions over plain data
//   - never invent a warning; every warning quotes real persisted state
//   - never block submit / approve / save
//   - severity vocabulary matches the audit's unified set
//     (stuck / action-today / look-at-soon)

import type {
  DeliverableOutputSection,
  Task
} from '~/types/models'

export type SectionMismatchSeverity =
  | 'stuck'
  | 'action-today'
  | 'look-at-soon'

export type SectionMismatchCode =
  | 'task-done-section-empty'
  | 'task-done-no-final'
  | 'task-in-progress-section-empty'
  | 'final-without-evidence'
  | 'thinking-without-draft'
  | 'draft-without-final'

export interface SectionMismatchWarning {
  code: SectionMismatchCode
  severity: SectionMismatchSeverity
  // One-line, student-facing copy. Safe to render as-is.
  message: string
}

// High-rigor chapters require evidence to back final Playbook text.
// Mirrors the AI-critique chapter set + the chapters with structured
// evidence prompts in the Template Studio.
export const HIGH_RIGOR_CHAPTER_IDS = new Set<string>([
  'ch-07-current-product-line-and-pricing',
  'ch-08-finance-and-revenue-model',
  'ch-10-marketing-and-campaign-playbook',
  'ch-11-phoenix-nest-retail-carry-pitch'
])

export function isHighRigorChapter(deliverableId: string): boolean {
  return HIGH_RIGOR_CHAPTER_IDS.has(deliverableId)
}

function hasText(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasEvidence(persisted: DeliverableOutputSection | null): boolean {
  if (!persisted) return false
  if ((persisted.evidenceLinks?.length ?? 0) > 0) return true
  if ((persisted.structuredEvidence?.length ?? 0) > 0) return true
  if ((persisted.marketBuilderEntries?.length ?? 0) > 0) return true
  return false
}

// Section-only warnings that don't depend on a linked task. Safe to
// render in the section workspace where we never have task context.
export function getSectionWarnings(args: {
  deliverableId: string
  section: DeliverableOutputSection | null
}): SectionMismatchWarning[] {
  const out: SectionMismatchWarning[] = []
  const { deliverableId, section } = args
  if (!section) return out

  const hasNotes = hasText(section.sourceNotes)
  const hasDraft = hasText(section.draftText)
  const hasFinal = hasText(section.finalText)
  const high = isHighRigorChapter(deliverableId)

  if (hasNotes && !hasDraft && !hasFinal) {
    out.push({
      code: 'thinking-without-draft',
      severity: 'look-at-soon',
      message:
        "Your team's thinking is saved, but there's no Working draft yet. Next: turn the notes into 3–5 sentences."
    })
  }
  if (hasDraft && !hasFinal) {
    out.push({
      code: 'draft-without-final',
      severity: 'look-at-soon',
      message:
        'Working draft is saved, but Final Playbook text is empty. Next: polish your draft into the publishable version.'
    })
  }
  if (high && hasFinal && !hasEvidence(section)) {
    out.push({
      code: 'final-without-evidence',
      severity: 'action-today',
      message:
        'This section has Final Playbook text but no Sources or Defend-your-claim entries. High-rigor chapters need at least one source.'
    })
  }
  return out
}

// Task-aware warnings. Render on /tasks rows and (if the page can
// resolve the linked section) on the member next-action card.
export function getTaskMismatchWarnings(args: {
  task: Task
  // Persisted section the task points to, if any. null when the
  // deliverable has no requirementId or the section hasn't been
  // provisioned yet.
  section: DeliverableOutputSection | null
  // True when the task's deliverable lives in a high-rigor chapter
  // (Ch 7/8/10/11). Caller resolves; the helper stays pure.
  isHighRigor: boolean
}): SectionMismatchWarning[] {
  const out: SectionMismatchWarning[] = []
  const { task, section } = args
  // Only check work-tracking statuses; not_started and blocked are not
  // "false progress" cases.
  if (task.status === 'done') {
    if (!section || (!hasText(section.sourceNotes) && !hasText(section.draftText) && !hasText(section.finalText))) {
      out.push({
        code: 'task-done-section-empty',
        severity: 'stuck',
        message:
          'This task is marked done, but the linked section has no saved content. Open the section and write your team\'s thinking, or reopen the task.'
      })
      return out
    }
    if (!hasText(section.finalText)) {
      out.push({
        code: 'task-done-no-final',
        severity: 'action-today',
        message:
          'This task is marked done, but the linked section has no Final Playbook text. Add the publishable version, or reopen the task.'
      })
    }
    return out
  }
  if (task.status === 'in_progress') {
    if (!section || (!hasText(section.sourceNotes) && !hasText(section.draftText))) {
      out.push({
        code: 'task-in-progress-section-empty',
        severity: 'look-at-soon',
        message:
          'This task is in progress, but the linked section is still empty. Open it and start with your team\'s thinking.'
      })
    }
  }
  return out
}
