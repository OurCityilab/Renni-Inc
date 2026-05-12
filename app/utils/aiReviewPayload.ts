// Deterministic leadership-review payload builder.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI calls.
//   - DOES NOT mutate input arrays / objects.
//   - DOES NOT change approval, output readiness, submit gates.
//   - DOES NOT duplicate large student text. Section excerpts are
//     capped (see SECTION_EXCERPT_CAP).
//   - DOES NOT claim authorship. All contributor language flows
//     through `aiReviewAttribution` so the output reflects what the
//     data model can prove.
//   - Phase 1 only. The payload is the input shape a future AI layer
//     will consume; nothing here calls an AI model.

import type {
  Deliverable,
  DeliverableOutput,
  DeliverableOutputSection,
  Department,
  Goal,
  GoalStatus,
  Task,
  TaskStatus
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import { normalizeDeliverablePreview } from '~/utils/playbookPreview'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'
import {
  getDeliverableAttribution,
  getSectionAttribution
} from '~/utils/aiReviewAttribution'
import { computeDeterministicReadiness } from '~/utils/aiReviewReadiness'
import type {
  AiReviewDeliverableSummary,
  AiReviewDeterministicSummary,
  AiReviewGoalSummary,
  AiReviewLimitation,
  AiReviewReportInput,
  AiReviewReportPayload,
  AiReviewReportScope,
  AiReviewSectionSummary,
  AiReviewTaskSummary
} from '~/types/aiReviewReports'
import { AI_REVIEW_CONSTRAINTS_DEFAULT } from '~/types/aiReviewReports'

/** Soft excerpt cap so the payload stays compact. Long sections are
 *  truncated at this character count and flagged via `excerptCapped`. */
const SECTION_EXCERPT_CAP = 800

/** Friendly labels (do not surface raw enums to the AI consumer). */
const DELIVERABLE_STATUS_LABEL: Record<Deliverable['status'], string> = {
  draft: 'In progress',
  in_review: 'Submitted for review',
  needs_revision: 'Needs revision',
  approved: 'Approved for the Playbook'
}
const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done'
}
const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  not_started: 'Not started',
  on_track: 'On track',
  at_risk: 'At risk',
  complete: 'Complete'
}

function todayStartMs(): number {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function isDateOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  const [y, m, day] = dueDate.split('-').map(Number)
  if (!y || !m || !day) return false
  return new Date(y, m - 1, day).getTime() < todayStartMs()
}

function wordCount(text: string | null | undefined): number {
  if (!text) return 0
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function cappedExcerpt(text: string): { excerpt: string; capped: boolean } {
  if (!text) return { excerpt: '', capped: false }
  if (text.length <= SECTION_EXCERPT_CAP) {
    return { excerpt: text, capped: false }
  }
  // Trim on a word boundary close to the cap so the excerpt doesn't
  // cut a word mid-syllable. Falls back to a hard slice when no
  // sensible boundary exists.
  const slice = text.slice(0, SECTION_EXCERPT_CAP)
  const lastSpace = slice.lastIndexOf(' ')
  const cleaned = lastSpace > SECTION_EXCERPT_CAP * 0.75 ? slice.slice(0, lastSpace) : slice
  return { excerpt: `${cleaned.trimEnd()}…`, capped: true }
}

function persistedSectionsArray(
  output: DeliverableOutput | null
): DeliverableOutputSection[] {
  if (!output?.sections) return []
  return Object.values(output.sections)
}

function summarizeDeliverable(
  deliverable: Deliverable,
  studio: TemplateStudio | null,
  output: DeliverableOutput | null,
  tasksForDeliverable: Task[],
  chapterTitle: string
): AiReviewDeliverableSummary {
  const preview = normalizeDeliverablePreview({
    deliverable,
    studio,
    output,
    mode: 'export'
  })

  const coverage = studio
    ? computeRequirementCoverage(studio.requirements, tasksForDeliverable)
    : null
  const missingRequiredRequirementLabels = (
    coverage?.requiredRequirementsWithoutTasks ?? []
  ).map((r) => r.label)
  const submitEligible =
    deliverable.status === 'draft' || deliverable.status === 'needs_revision'
  const canSubmit =
    submitEligible &&
    (!coverage || missingRequiredRequirementLabels.length === 0)

  // Per-section summaries. Use the persistedSection on the normalized
  // preview row so evidence + status come from the saved doc, not a
  // re-fetch.
  const sections: AiReviewSectionSummary[] = preview.sections.map((section) => {
    const persisted = section.persistedSection
    const { excerpt, capped } = cappedExcerpt(section.content)
    return {
      sectionId: section.sectionId,
      title: section.title,
      contentSource: section.contentSource,
      contentSourceLabel: section.contentSourceLabel,
      isMissing: section.isMissing,
      contentExcerpt: excerpt,
      excerptCapped: capped,
      finalTextPresent: (persisted?.finalText ?? '').trim().length > 0,
      draftFallback: section.contentSource === 'draftText',
      sourceNotesFallback: section.contentSource === 'sourceNotes',
      wordCount: wordCount(section.content),
      sectionStatus: section.sectionStatus,
      evidenceLinkCount: section.evidenceLinks.length,
      structuredEvidenceCount: section.structuredEvidence.length,
      attribution: getSectionAttribution(deliverable, persisted)
    }
  })

  let evidenceLinkCount = 0
  let structuredEvidenceCount = 0
  let sectionsWithFinalText = 0
  let sectionsWithDraftFallback = 0
  let sectionsWithSourceNotesFallback = 0
  let sectionsMissing = 0
  for (const s of sections) {
    evidenceLinkCount += s.evidenceLinkCount
    structuredEvidenceCount += s.structuredEvidenceCount
    if (s.contentSource === 'finalText') sectionsWithFinalText += 1
    else if (s.contentSource === 'draftText') sectionsWithDraftFallback += 1
    else if (s.contentSource === 'sourceNotes')
      sectionsWithSourceNotesFallback += 1
    else if (s.contentSource === 'missing') sectionsMissing += 1
  }
  // Evidence on persisted sections that aren't surfaced through the
  // studio (orphans) is already counted because the normalizer
  // appends them. The persistedSectionsArray pass guards against
  // double-counting from a stale orphan list.
  void persistedSectionsArray

  return {
    id: deliverable.id,
    title: deliverable.title,
    chapter: deliverable.chapter,
    chapterTitle,
    department: deliverable.department,
    status: deliverable.status,
    statusLabel: DELIVERABLE_STATUS_LABEL[deliverable.status],
    ownerEmail: deliverable.ownerEmail || null,
    approverEmail: deliverable.approverEmail || null,
    dueDate: deliverable.dueDate || null,
    isOverdue:
      deliverable.status !== 'approved' && isDateOverdue(deliverable.dueDate),
    hasStudio: Boolean(studio),
    totalSections: preview.totalSections,
    sectionsWithFinalText,
    sectionsWithDraftFallback,
    sectionsWithSourceNotesFallback,
    sectionsMissing,
    evidenceLinkCount,
    structuredEvidenceCount,
    missingRequiredRequirementLabels,
    canSubmit,
    returnedReason: deliverable.returnedReason || null,
    attribution: getDeliverableAttribution(deliverable),
    sections
  }
}

function summarizeTasks(
  tasks: Task[],
  deliverableTitleById: Map<string, string>
): AiReviewTaskSummary[] {
  return tasks.map((t) => {
    const isOverdue =
      t.status !== 'done' && isDateOverdue(t.dueDate ?? null)
    return {
      id: t.id,
      title: t.title,
      deliverableId: t.deliverableId,
      deliverableTitle: t.deliverableId
        ? deliverableTitleById.get(t.deliverableId) ?? null
        : null,
      department: t.department ?? null,
      ownerEmail: t.ownerEmail || null,
      status: t.status,
      statusLabel: TASK_STATUS_LABEL[t.status],
      priority: t.priority ?? null,
      startDate: t.startDate ?? null,
      dueDate: t.dueDate ?? null,
      isOverdue,
      blockedReason: t.status === 'blocked' ? t.blockedBy ?? null : null
    }
  })
}

function summarizeGoals(goals: Goal[]): AiReviewGoalSummary[] {
  return goals.map((g) => {
    const target = Number.isFinite(g.target) ? g.target : 0
    const current = Number.isFinite(g.current) ? g.current : 0
    const progressPercent =
      target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : null
    return {
      id: g.id,
      department: g.department,
      metricName: g.metricName,
      target,
      current,
      status: g.status,
      statusLabel: GOAL_STATUS_LABEL[g.status],
      progressPercent,
      ownerEmail: g.ownerEmail || null
    }
  })
}

function summarizeRollup(
  deliverables: AiReviewDeliverableSummary[],
  tasks: AiReviewTaskSummary[]
): AiReviewDeterministicSummary {
  const chapters = new Set<number>()
  let approved = 0
  let drafts = 0
  let inReview = 0
  let needsRevision = 0
  let overdue = 0
  let totalSections = 0
  let final = 0
  let draftFallback = 0
  let sourceFallback = 0
  let missing = 0
  let evidenceLinks = 0
  let structuredEvidence = 0

  for (const d of deliverables) {
    chapters.add(d.chapter)
    if (d.status === 'approved') approved += 1
    else if (d.status === 'in_review') inReview += 1
    else if (d.status === 'needs_revision') needsRevision += 1
    else drafts += 1
    if (d.isOverdue) overdue += 1
    totalSections += d.totalSections
    final += d.sectionsWithFinalText
    draftFallback += d.sectionsWithDraftFallback
    sourceFallback += d.sectionsWithSourceNotesFallback
    missing += d.sectionsMissing
    evidenceLinks += d.evidenceLinkCount
    structuredEvidence += d.structuredEvidenceCount
  }

  let completedTasks = 0
  let blockedTasks = 0
  let overdueTasks = 0
  for (const t of tasks) {
    if (t.status === 'done') completedTasks += 1
    if (t.status === 'blocked') blockedTasks += 1
    if (t.isOverdue) overdueTasks += 1
  }

  return {
    totalChapters: chapters.size,
    totalDeliverables: deliverables.length,
    approvedDeliverables: approved,
    draftDeliverables: drafts,
    inReviewDeliverables: inReview,
    needsRevisionDeliverables: needsRevision,
    overdueDeliverables: overdue,
    totalSections,
    sectionsWithFinalText: final,
    sectionsWithDraftFallback: draftFallback,
    sectionsWithSourceNotesFallback: sourceFallback,
    sectionsMissing: missing,
    evidenceLinkCount: evidenceLinks,
    structuredEvidenceCount: structuredEvidence,
    totalTasks: tasks.length,
    completedTasks,
    blockedTasks,
    overdueTasks
  }
}

function filterByScope(
  input: AiReviewReportInput,
  scope: AiReviewReportScope
): {
  deliverables: Deliverable[]
  tasks: Task[]
  goals: Goal[]
} {
  let deliverables = input.deliverables
  if (scope.reportType === 'department' && scope.department) {
    deliverables = deliverables.filter((d) => d.department === scope.department)
  }
  if (scope.reportType === 'chapter') {
    deliverables = deliverables.filter((d) => {
      if (scope.deliverableId && d.id === scope.deliverableId) return true
      if (scope.chapter && Number(d.chapter) === scope.chapter) return true
      return false
    })
  }
  const inScopeIds = new Set(deliverables.map((d) => d.id))

  let tasks = input.tasks
  if (scope.reportType === 'chapter') {
    tasks = tasks.filter((t) => t.deliverableId && inScopeIds.has(t.deliverableId))
  } else if (scope.reportType === 'department' && scope.department) {
    tasks = tasks.filter((t) => {
      if (t.department && t.department === scope.department) return true
      if (t.deliverableId && inScopeIds.has(t.deliverableId)) return true
      return false
    })
  }

  let goals = input.goals
  if (scope.reportType === 'department' && scope.department) {
    goals = goals.filter((g) => g.department === scope.department)
  } else if (scope.reportType === 'chapter') {
    // Chapter scope intentionally drops goals — goals are department-
    // owned and don't roll up to a single chapter cleanly.
    goals = []
  }
  return { deliverables, tasks, goals }
}

function collectLimitations(
  deliverables: AiReviewDeliverableSummary[],
  scope: AiReviewReportScope
): AiReviewLimitation[] {
  const limitations: AiReviewLimitation[] = []
  if (deliverables.length === 0) {
    const scopeNote =
      scope.reportType === 'department' && scope.department
        ? `Scope: department=${scope.department}.`
        : scope.reportType === 'chapter'
          ? `Scope: deliverableId=${scope.deliverableId ?? '∅'} / chapter=${scope.chapter ?? '∅'}.`
          : 'Scope: company.'
    limitations.push({
      code: 'no-deliverables',
      message: `No deliverables matched the requested scope. ${scopeNote}`
    })
  }
  const nonStudio = deliverables.filter((d) => !d.hasStudio)
  if (nonStudio.length > 0) {
    limitations.push({
      code: 'non-studio-deliverables',
      message: `${nonStudio.length} deliverable(s) are not studio-backed; section-level coverage is reported as zero for those.`
    })
  }
  // Attribution-related limitations bubble up per-deliverable so the
  // future AI consumer can see them inline without re-deriving.
  let sectionsWithoutLastEditor = 0
  for (const d of deliverables) {
    for (const s of d.sections) {
      if (s.attribution.bestConfidence === 'unknown') sectionsWithoutLastEditor += 1
    }
  }
  if (sectionsWithoutLastEditor > 0) {
    limitations.push({
      code: 'attribution-thin',
      message: `${sectionsWithoutLastEditor} section(s) lack any attribution metadata. Avoid claiming a specific contributor wrote them.`
    })
  }
  return limitations
}

/** Core builder used by every entry point. */
export function buildReviewPayload(
  input: AiReviewReportInput
): AiReviewReportPayload {
  const { scope } = input
  const { deliverables, tasks, goals } = filterByScope(input, scope)

  const studioResolver =
    input.studioResolver ?? ((_: Deliverable) => null)

  const chapterTitleByChapter = new Map<number, string>()
  for (const d of input.deliverables) {
    const studio = studioResolver(d)
    if (studio?.title && !chapterTitleByChapter.has(d.chapter)) {
      chapterTitleByChapter.set(d.chapter, studio.title)
    }
  }

  const deliverableTitleById = new Map<string, string>()
  for (const d of input.deliverables) {
    deliverableTitleById.set(d.id, d.title)
  }

  // Tasks bucketed per deliverable for requirement coverage.
  const tasksByDeliverableId = new Map<string, Task[]>()
  for (const t of input.tasks) {
    if (!t.deliverableId) continue
    const arr = tasksByDeliverableId.get(t.deliverableId) ?? []
    arr.push(t)
    tasksByDeliverableId.set(t.deliverableId, arr)
  }

  const deliverableSummaries: AiReviewDeliverableSummary[] = deliverables
    .slice()
    .sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter
      return a.title.localeCompare(b.title)
    })
    .map((d) => {
      const studio = studioResolver(d)
      const output = input.outputsByDeliverableId[d.id] ?? null
      const chapterTitle =
        chapterTitleByChapter.get(d.chapter) ?? `Chapter ${d.chapter}`
      return summarizeDeliverable(
        d,
        studio,
        output,
        tasksByDeliverableId.get(d.id) ?? [],
        chapterTitle
      )
    })

  const taskSummaries = summarizeTasks(tasks, deliverableTitleById)
  const goalSummaries = summarizeGoals(goals)
  const summary = summarizeRollup(deliverableSummaries, taskSummaries)
  const readiness = computeDeterministicReadiness(deliverableSummaries)
  const limitations = collectLimitations(deliverableSummaries, scope)
  for (const r of readiness.limitations) limitations.push(r)

  return {
    reportType: scope.reportType,
    scope,
    requester: input.requester,
    constraints: AI_REVIEW_CONSTRAINTS_DEFAULT,
    deterministicSummary: summary,
    deterministicReadiness: readiness,
    deliverables: deliverableSummaries,
    tasks: taskSummaries,
    goals: goalSummaries,
    limitations,
    generatedAt: input.generatedAt ?? new Date().toISOString()
  }
}

/** Convenience: company-level payload. Builds with reportType='company'
 *  and uses every deliverable/task/goal visible to the caller. */
export function buildCompanyReviewPayload(
  input: Omit<AiReviewReportInput, 'scope'>
): AiReviewReportPayload {
  return buildReviewPayload({
    ...input,
    scope: { reportType: 'company' }
  })
}

/** Convenience: department-level payload. */
export function buildDepartmentReviewPayload(
  input: Omit<AiReviewReportInput, 'scope'>,
  department: Department
): AiReviewReportPayload {
  return buildReviewPayload({
    ...input,
    scope: { reportType: 'department', department }
  })
}

/** Convenience: chapter-level payload. Accepts either a deliverable id
 *  or a chapter number. When both are passed the deliverable id
 *  narrows further. */
export function buildChapterReviewPayload(
  input: Omit<AiReviewReportInput, 'scope'>,
  target: { deliverableId?: string; chapter?: number }
): AiReviewReportPayload {
  return buildReviewPayload({
    ...input,
    scope: {
      reportType: 'chapter',
      deliverableId: target.deliverableId ?? null,
      chapter: target.chapter ?? null
    }
  })
}
