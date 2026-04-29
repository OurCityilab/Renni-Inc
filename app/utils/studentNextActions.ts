// Student "My Next Actions" — deterministic recipe builder.
//
// Goal: turn a list of tasks (member-owned + department fallback)
// into 1–3 plain-language action cards that tell the student exactly
// what to do, how to do it, where to click, what good looks like,
// when they're done, and who reviews it.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure functions. Same inputs produce the same outputs.
//   - No Firestore writes. No HTTP calls. No AI. No Vue runtime
//     imports.
//   - Never invents tasks. Never claims a task is assigned that
//     isn't. The "department fallback" only fires when the member
//     has no personally-assigned open tasks.
//   - Recipe text is curriculum-friendly and short by design. No
//     walls of text.

import type {
  Deliverable,
  Department,
  IsoDate,
  Task,
  TaskStatus
} from '~/types/models'
import {
  getTemplateStudio,
  templateStudios
} from '~/data/templateStudios'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import { deepLinkForTask } from '~/utils/requirementToSection'
import { getLikelyOwner } from '~/data/chapterOwners'

/* -------------------------------------------------------------------
 * Public types
 * ------------------------------------------------------------------ */

export type NextActionKind =
  | 'blocked'
  | 'overdue'
  | 'due-soon'
  | 'in-progress'
  | 'not-started'
  | 'department-fallback'

export interface NextActionCardModel {
  /** Stable id (the task id). */
  taskId: string
  /** Why this card is on the list — drives the small chip on the card. */
  kind: NextActionKind
  /** Task title, verbatim from Firestore. */
  taskTitle: string
  /** Optional plain-language one-liner above the steps:
   *  "Use the Customer Builder, then turn the result into a Working
   *  Draft." */
  doThis: string
  /** Numbered steps. Short. 4–7 lines. */
  howToDoIt: string[]
  /** "Done when …" completion line. */
  doneWhen: string
  /** "Reviewed by …" reviewer label, full role names. */
  reviewedBy: string
  /** Due date as ISO yyyy-mm-dd, or null. */
  dueDate: IsoDate | null
  /** Button label, e.g. "Open Customer Builder". */
  buttonLabel: string
  /** Button target URL — section deeplink when possible, else
   *  deliverable page, else /tasks. */
  buttonHref: string
  /** When kind === 'blocked', surface a quiet "Ask for help" hint. */
  askForHelp: boolean
}

export interface BuildStudentNextActionsInput {
  /** Tasks owned by the viewer (uid match). */
  myTasks: readonly Task[]
  /** All tasks the viewer can see (used only for department fallback
   *  when myTasks is empty). */
  allTasks: readonly Task[]
  /** All deliverables the viewer can see. */
  deliverables: readonly Deliverable[]
  /** Viewer's department (for the department fallback). */
  myDepartment: Department | null
  /** ISO yyyy-mm-dd. Caller passes this so the function stays pure. */
  todayIso: IsoDate
  /** Cap on cards. Default 3 per the brief. */
  maxCards?: number
}

export interface StudentNextActionsView {
  cards: NextActionCardModel[]
  /** True when no personal tasks were available and we're showing
   *  department-fallback cards instead. */
  usingDepartmentFallback: boolean
}

/* -------------------------------------------------------------------
 * Public entry point
 * ------------------------------------------------------------------ */

export function buildStudentNextActions(
  input: BuildStudentNextActionsInput
): StudentNextActionsView {
  const cap = input.maxCards ?? 3

  const ranked = rankMyTasks(input.myTasks, input.todayIso)
  let usingDepartmentFallback = false

  let pick = ranked.slice(0, cap)
  if (pick.length === 0 && input.myDepartment) {
    // Department fallback. The brief explicitly allows this only when
    // the member has no personal open tasks.
    const dept = filterDepartmentTasks(
      input.allTasks,
      input.myDepartment
    )
    pick = rankMyTasks(dept, input.todayIso).slice(0, cap)
    if (pick.length > 0) usingDepartmentFallback = true
  }

  const deliverableIndex: Map<string, Deliverable> = new Map(
    input.deliverables.map((d) => [d.id, d])
  )

  const cards: NextActionCardModel[] = pick.map((row) => {
    const deliverable = row.task.deliverableId
      ? (deliverableIndex.get(row.task.deliverableId) ?? null)
      : null
    return buildCardForTask(
      row.task,
      row.kind,
      deliverable,
      usingDepartmentFallback
    )
  })

  return { cards, usingDepartmentFallback }
}

/* -------------------------------------------------------------------
 * Ranking
 * ------------------------------------------------------------------ */

interface RankedRow {
  task: Task
  kind: NextActionKind
}

function rankMyTasks(
  tasks: readonly Task[],
  todayIso: IsoDate
): RankedRow[] {
  const open = tasks.filter((t) => t.status !== ('done' as TaskStatus))

  // Bucket 1: blocked → "Ask for help"
  const blocked = open
    .filter((t) => t.status === ('blocked' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'blocked' }))

  // Bucket 2: overdue (not blocked)
  const overdue = open
    .filter(
      (t) =>
        t.status !== ('blocked' as TaskStatus) &&
        Boolean(t.dueDate) &&
        (t.dueDate as string) < todayIso
    )
    .map<RankedRow>((task) => ({ task, kind: 'overdue' }))

  // Bucket 3: due within 7 days
  const horizon = addDays(todayIso, 7)
  const dueSoon = open
    .filter(
      (t) =>
        t.status !== ('blocked' as TaskStatus) &&
        Boolean(t.dueDate) &&
        (t.dueDate as string) >= todayIso &&
        (t.dueDate as string) <= horizon
    )
    .map<RankedRow>((task) => ({ task, kind: 'due-soon' }))

  // Bucket 4: in progress
  const inProgress = open
    .filter((t) => t.status === ('in_progress' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'in-progress' }))

  // Bucket 5: not started
  const notStarted = open
    .filter((t) => t.status === ('not_started' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'not-started' }))

  // De-dupe across buckets (a task picked by an earlier bucket can't
  // re-appear later) and order by bucket precedence, then due date.
  const seen = new Set<string>()
  const out: RankedRow[] = []
  for (const bucket of [blocked, overdue, dueSoon, inProgress, notStarted]) {
    for (const row of bucket.sort(byDueAscending)) {
      if (seen.has(row.task.id)) continue
      seen.add(row.task.id)
      out.push(row)
    }
  }
  return out
}

function filterDepartmentTasks(
  tasks: readonly Task[],
  myDepartment: Department
): Task[] {
  return tasks.filter((t) => t.department === myDepartment)
}

function byDueAscending(a: RankedRow, b: RankedRow): number {
  const ad = a.task.dueDate ?? ''
  const bd = b.task.dueDate ?? ''
  if (ad && bd && ad !== bd) return ad < bd ? -1 : 1
  if (ad && !bd) return -1
  if (!ad && bd) return 1
  return a.task.title.localeCompare(b.task.title)
}

/* -------------------------------------------------------------------
 * Card builder — wires a task to its recipe
 * ------------------------------------------------------------------ */

function buildCardForTask(
  task: Task,
  kind: NextActionKind,
  deliverable: Deliverable | null,
  isDepartmentFallback: boolean
): NextActionCardModel {
  const studio: TemplateStudio | null = task.deliverableId
    ? (getTemplateStudio(task.deliverableId) ?? null)
    : null
  const section: TemplateStudioSection | null = resolveSectionForTask(
    studio,
    task
  )
  const recipe = pickRecipe(task, deliverable, studio, section)
  const buttonHref =
    deepLinkForTask({
      deliverableId: task.deliverableId ?? null,
      requirementId: task.requirementId ?? null
    }) ?? '/tasks'

  // Department-fallback cards have a tighter "kind" override so the
  // chip reads honestly even when the underlying task is "not-started"
  // for someone else.
  const finalKind: NextActionKind = isDepartmentFallback
    ? 'department-fallback'
    : kind

  return {
    taskId: task.id,
    kind: finalKind,
    taskTitle: task.title,
    doThis: recipe.doThis,
    howToDoIt: recipe.howToDoIt,
    doneWhen: buildDoneWhen(section, task, recipe.doneWhenFallback),
    reviewedBy: buildReviewerLabel(task.deliverableId ?? null, task.department ?? null),
    dueDate: task.dueDate ?? null,
    buttonLabel: recipe.buttonLabel,
    buttonHref,
    askForHelp: kind === 'blocked'
  }
}

/* -------------------------------------------------------------------
 * Section resolution (best-effort)
 * ------------------------------------------------------------------ */

function resolveSectionForTask(
  studio: TemplateStudio | null,
  task: Task
): TemplateStudioSection | null {
  if (!studio) return null
  if (!task.requirementId) return null
  // Reproduce the heuristic shape used in deepLinkForTask: prefer an
  // explicit requirement.sectionId hint when present.
  const req = studio.requirements.find((r) => r.id === task.requirementId)
  if (req?.sectionId) {
    const explicit = studio.sections.find((s) => s.id === req.sectionId)
    if (explicit) return explicit
  }
  return null
}

/* -------------------------------------------------------------------
 * Recipe library
 *
 * Each recipe is a small object: doThis (one-liner), howToDoIt
 * (4–7 short steps), doneWhenFallback (used if the section has no
 * curriculum-authored completion criteria), and buttonLabel.
 * ------------------------------------------------------------------ */

interface Recipe {
  doThis: string
  howToDoIt: string[]
  doneWhenFallback: string
  buttonLabel: string
}

function pickRecipe(
  task: Task,
  deliverable: Deliverable | null,
  _studio: TemplateStudio | null,
  section: TemplateStudioSection | null
): Recipe {
  // Section-driven recipes — most specific first.
  if (section?.id === 'customer-segments') {
    return {
      doThis:
        'Use the Customer Builder to compose the profile, then turn the result into a Working Draft in your own words.',
      howToDoIt: [
        'Open the section page.',
        'Open the Customer Builder.',
        'Answer the questions about the customer.',
        'Click Analyze.',
        'Paste the result into Working Draft and edit it in your own words.',
        'Add evidence — a quote, observation, or labeled assumption.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your draft explains who the customer is, why they might buy, and what evidence supports it.',
      buttonLabel: 'Open Customer Builder'
    }
  }

  if (section?.brandFit?.enabled) {
    return {
      doThis:
        'Use the Brand Builder to anchor your brand choices, then write the section in your own words.',
      howToDoIt: [
        'Open the section page.',
        'Open the Brand Builder.',
        'Pick the brand voice, audience, and message anchors.',
        'Read the suggested draft copy and revise it in your own words.',
        'Add evidence — quotes from your team, customers, or comparable brands.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the audience, the brand promise, and the evidence the team is using to back it.',
      buttonLabel: 'Open Brand Builder'
    }
  }

  if (section?.marketFit?.enabled) {
    return {
      doThis:
        'Use the Market Fit Builder to connect customer needs to a Renni Inc. product, then turn it into a Working Draft.',
      howToDoIt: [
        'Open the section page.',
        'Open the Market Fit Builder.',
        'Pick the customer segment and the product they would buy.',
        'List the proof — what customers said or did.',
        'Edit the suggested draft in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your draft connects a specific customer to a specific product, and the evidence is labeled — quote, observation, or assumption.',
      buttonLabel: 'Open Market Fit Builder'
    }
  }

  if (section?.pricingStrategy?.enabled) {
    return {
      doThis:
        'Use the Pricing Builder to set the cost, price, margin, and break-even, then write the explanation.',
      howToDoIt: [
        'Open the section page.',
        'Open the Pricing Builder.',
        'Enter unit costs, target price, and target margin.',
        'Read the break-even number — confirm it is a number you can defend.',
        'Write the short explanation in the Working Draft.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the unit cost, the price, the margin, and the break-even unit count — and explains why the team chose them.',
      buttonLabel: 'Open Pricing Builder'
    }
  }

  // Deliverable-driven recipes — match by chapter id.
  const deliverableId = deliverable?.id ?? task.deliverableId ?? ''
  if (deliverableId === 'ch-11-phoenix-nest-retail-carry-pitch') {
    return {
      doThis:
        'Build the Phoenix Nest carry pitch — name the buyer, prove the shelf fit, and show the margin story.',
      howToDoIt: [
        'Open the section page.',
        'Name the buyer at Phoenix Nest — who is the actual person?',
        'Show the shelf fit — what about this product belongs in their store?',
        'Add proof — sell-through numbers, customer quotes, photos, or a comparable.',
        'Write the margin story — how the price covers cost AND leaves room for retail markup.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the buyer, proves the shelf fit, shows the margin, and explains the ask.',
      buttonLabel: 'Open the section'
    }
  }
  if (deliverableId === 'ch-10-marketing-and-campaign-playbook') {
    return {
      doThis:
        'Build the campaign — name the audience, the message, the channel, and the call to action.',
      howToDoIt: [
        'Open the section page.',
        'Name the audience — be specific. Not "everyone".',
        'Write the message — one sentence the audience would actually repeat.',
        'Pick the channel — where the audience already is.',
        'Write the call to action — the one thing you want them to do.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your campaign names a specific audience, a one-line message, a real channel, and a single call to action.',
      buttonLabel: 'Open the section'
    }
  }
  if (deliverableId === 'ch-09-operations-and-continuity-systems') {
    return {
      doThis:
        'Document the process — name the steps, the owner, the handoff, and what it would take for next cohort to use it.',
      howToDoIt: [
        'Open the section page.',
        'List the steps in order — short, plain language.',
        'Name the owner — one person.',
        'Write the handoff — what the next person needs to start.',
        'Add a "next cohort" line — what would let them use this with no extra explanation.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your process is short, named-owner, and a next-cohort student could read it without help.',
      buttonLabel: 'Open the section'
    }
  }

  // Generic fallback recipe.
  return {
    doThis:
      'Open the work page, follow the steps in the Start Here box, and turn your team\'s thinking into a draft.',
    howToDoIt: [
      'Open the work page.',
      'Read the Start Here box.',
      'Write or build your draft.',
      'Add evidence, or clearly label your assumption.',
      'Save your work.',
      'Ask your chief to review it.'
    ],
    doneWhenFallback:
      'Your draft is specific, saved, and clear enough for another student or chief to review.',
    buttonLabel: 'Open the work page'
  }
}

/* -------------------------------------------------------------------
 * "Done when" composer
 * ------------------------------------------------------------------ */

function buildDoneWhen(
  section: TemplateStudioSection | null,
  task: Task,
  recipeFallback: string
): string {
  if (task.definitionOfDone && task.definitionOfDone.trim()) {
    return task.definitionOfDone.trim()
  }
  if (section?.completionCriteria && section.completionCriteria.length > 0) {
    return section.completionCriteria.join(' · ')
  }
  return recipeFallback
}

/* -------------------------------------------------------------------
 * Reviewer label
 * ------------------------------------------------------------------ */

function buildReviewerLabel(
  deliverableId: string | null,
  department: Department | null
): string {
  if (deliverableId) {
    const owner = getLikelyOwner(deliverableId)
    if (owner) return `Reviewed by: ${owner}`
  }
  if (department) {
    return `Reviewed by: ${departmentReviewerLabel(department)}`
  }
  return 'Reviewed by: your chief or department lead'
}

function departmentReviewerLabel(d: Department): string {
  switch (d) {
    case 'executive':
      return 'Co-CEOs'
    case 'operations':
      return 'COO'
    case 'finance':
      return 'CFO'
    case 'marketing':
      return 'CMO'
    case 'strategy-growth':
      return 'Chief Strategy and Growth Officer'
    case 'admin':
      return 'Instructor / Admin'
  }
}

/* -------------------------------------------------------------------
 * Date helpers (ISO yyyy-mm-dd)
 * ------------------------------------------------------------------ */

function addDays(iso: IsoDate, days: number): IsoDate {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/* -------------------------------------------------------------------
 * Helpful re-export so the page doesn't need to chase down the
 * studio registry.
 * ------------------------------------------------------------------ */

export { templateStudios }
