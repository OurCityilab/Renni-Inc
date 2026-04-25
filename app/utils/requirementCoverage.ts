// Pure helper that turns a Template Studio requirement set + the tasks
// linked to a deliverable into a coverage summary. Single source of
// truth for:
//   - the requirement chips on TemplateStudio
//   - the submit-for-review gate on the deliverable detail page
//   - the backfill / audit script that flags uncovered requirements
//
// No Firestore reads here. Inputs in, coverage result out — easy to
// reason about and easy to test if a test runner is added later.

import type { Task } from '~/types/models'
import type { TemplateStudioRequirement } from '~/types/templateStudio'

export type RequirementCoverageState =
  | 'none'
  | 'planned'
  | 'in_progress'
  | 'blocked'
  | 'done'

export interface RequirementCoverageEntry {
  requirementId: string
  label: string
  requiredForApproval: boolean
  linkedTasks: Task[]
  hasTaskCoverage: boolean
  hasBlockedTask: boolean
  hasCompletedTask: boolean
  state: RequirementCoverageState
  stateLabel: string
}

export interface RequirementCoverageSummary {
  totalRequirements: number
  requiredRequirements: number
  coveredRequirements: number
  completeRequirements: number
  blockedRequirements: number
  requiredRequirementsWithoutTasks: RequirementCoverageEntry[]
  byRequirementId: Record<string, RequirementCoverageEntry>
}

export const REQUIREMENT_STATE_LABEL: Record<RequirementCoverageState, string> = {
  none: 'No task yet',
  planned: 'Task planned',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Complete'
}

export function computeRequirementCoverage(
  requirements: TemplateStudioRequirement[],
  relatedTasks: Task[]
): RequirementCoverageSummary {
  const byRequirementId: Record<string, RequirementCoverageEntry> = {}
  const requiredRequirementsWithoutTasks: RequirementCoverageEntry[] = []

  let requiredRequirements = 0
  let coveredRequirements = 0
  let completeRequirements = 0
  let blockedRequirements = 0

  for (const req of requirements) {
    const linkedTasks = relatedTasks.filter((t) => t.requirementId === req.id)
    const hasTaskCoverage = linkedTasks.length > 0
    const hasBlockedTask = linkedTasks.some((t) => t.status === 'blocked')
    const hasCompletedTask =
      linkedTasks.length > 0 && linkedTasks.every((t) => t.status === 'done')

    // Same precedence the Template Studio used to compute locally:
    // blocked beats in-progress beats planned beats none, but a
    // fully-completed set wins over in-progress.
    let state: RequirementCoverageState
    if (!hasTaskCoverage) state = 'none'
    else if (hasBlockedTask) state = 'blocked'
    else if (hasCompletedTask) state = 'done'
    else if (linkedTasks.some((t) => t.status === 'in_progress'))
      state = 'in_progress'
    else state = 'planned'

    const entry: RequirementCoverageEntry = {
      requirementId: req.id,
      label: req.label,
      requiredForApproval: !!req.requiredForApproval,
      linkedTasks,
      hasTaskCoverage,
      hasBlockedTask,
      hasCompletedTask,
      state,
      stateLabel: REQUIREMENT_STATE_LABEL[state]
    }

    byRequirementId[req.id] = entry

    if (entry.requiredForApproval) {
      requiredRequirements += 1
      if (!hasTaskCoverage) requiredRequirementsWithoutTasks.push(entry)
    }
    if (hasTaskCoverage) coveredRequirements += 1
    if (hasCompletedTask) completeRequirements += 1
    if (hasBlockedTask) blockedRequirements += 1
  }

  return {
    totalRequirements: requirements.length,
    requiredRequirements,
    coveredRequirements,
    completeRequirements,
    blockedRequirements,
    requiredRequirementsWithoutTasks,
    byRequirementId
  }
}
