// Executive Advisor Context V2 — management coach context bundle.
//
// Augments the V1 ExecutiveContextPackage (server/utils/executiveContext.ts)
// with the launch-week artifacts that the V2 coach modes need:
//   - Final-week P0 / P1 / P2 lane map (app/utils/finalWeekCompletion)
//   - Recommended task templates (app/utils/finalWeekTaskTemplates)
//   - Project Navigator dependency signals
//     (app/utils/projectNavigatorSignals)
//   - Section dependency hints (app/utils/sectionDependencyHints)
//   - Product catalog summary (app/utils/productCatalog)
//   - Task coverage gaps — recommended task titles that have no
//     matching real task in the loaded set
//
// POSTURE (do not relax)
// ----------------------
//   - Read-only. Wraps the existing buildExecutiveContextPackage()
//     and adds derived data from pure utilities. No new Firestore
//     reads, no Firestore writes, no /api/* requests.
//   - Pure data assembly. No prompt construction; that lives in
//     the prompt templates.
//   - Explicit unknown markers when context is missing. The model
//     never sees a silently empty field — it sees an `unknowns`
//     array so it can flag the gap to the chief.

import {
  buildExecutiveContextPackage,
  type BuildExecutiveContextOptions,
  type ExecutiveContextPackage
} from '~~/server/utils/executiveContext'
import {
  FINAL_WEEK_LANES,
  type FinalWeekLane,
  type FinalWeekSectionEntry
} from '~~/app/utils/finalWeekCompletion'
import {
  FINAL_WEEK_TASK_TEMPLATES,
  type FinalWeekTaskTemplate
} from '~~/app/utils/finalWeekTaskTemplates'
import {
  buildProjectNavigatorSignals,
  type ProjectNavigatorSignal
} from '~~/app/utils/projectNavigatorSignals'
import { SECTION_DEPENDENCY_HINTS } from '~~/app/utils/sectionDependencyHints'
import { PRODUCT_CATALOG } from '~~/app/utils/productCatalog'
import type {
  Deliverable,
  DeliverableStatus,
  Department,
  IsoDate,
  Task,
  TaskStatus
} from '~~/app/types/models'

function isoDateToday(): IsoDate {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface ExecutiveAdvisorContextV2 {
  /** The V1 base context package — viewer, summary, deliverables,
   *  open tasks, recent decisions, source counts. */
  base: ExecutiveContextPackage
  /** Today's ISO date (yyyy-mm-dd). The V1 package does not carry
   *  this explicitly; V2 surfaces it for prompt templates. */
  todayIso: IsoDate
  /** The full final-week lane map. Static data — same on every
   *  request. Included so the model can name P0 / P1 / P2 sections
   *  by id without re-deriving them from the studio registry. */
  finalWeekLanes: readonly FinalWeekLane[]
  /** Recommended task templates per P0 section. Static data. */
  finalWeekTaskTemplates: readonly FinalWeekTaskTemplate[]
  /** Derived: which P0 / P1 sections have at least one real task
   *  in the loaded task set (rough match by title substring), and
   *  which do not. This is a soft signal — the matcher may miss
   *  task titles that diverge from the template. */
  taskCoverageGaps: TaskCoverageGap[]
  /** Project Navigator dependency signals derived from the loaded
   *  deliverables + tasks. Bounded; same as the navigator UI sees. */
  dependencySignals: ProjectNavigatorSignal[]
  /** Per-section dependency hints — the same lookup the section
   *  workspace renders. Surfaced so the model can name what feeds
   *  what. */
  sectionDependencyHints: Readonly<Record<string, readonly string[]>>
  /** Compact product catalog summary — name, brand, category,
   *  isSellableProduct flag. The Advisor uses this to tell chiefs
   *  which products map to which finance / inventory tables. */
  productCatalog: ProductCatalogContextEntry[]
  /** Explicit unknowns the Advisor should surface to the chief.
   *  Populated by the context builder when a derivation could not
   *  run because of missing inputs. */
  unknowns: string[]
}

export interface TaskCoverageGap {
  /** Final-week section entry id (e.g. "ch-08:unit-cost"). */
  entryId: string
  laneId: string
  deliverableId: string
  sectionId: string
  /** Recommended task title from FINAL_WEEK_TASK_TEMPLATES. */
  recommendedTaskTitle: string
  recommendedOwner: string
  recommendedDueLabel: string
  recommendedDoneWhen: string
  /** True when no loaded task title contains a substring match
   *  against the section's title or recommended title. False when
   *  at least one matching task exists in scope. */
  missing: boolean
  /** Optional id of a matched task when `missing` is false. */
  matchedTaskId?: string
}

export interface ProductCatalogContextEntry {
  id: string
  productName: string
  brand: string
  category: string
  isSellableProduct: boolean
}

export interface BuildExecutiveAdvisorContextV2Options
  extends BuildExecutiveContextOptions {
  /** Optional override for "today" — useful for tests. Defaults to
   *  the server's current UTC date. */
  todayIso?: IsoDate
}

/** Builds the V2 advisor context package. */
export async function buildExecutiveAdvisorContextV2(
  options: BuildExecutiveAdvisorContextV2Options
): Promise<ExecutiveAdvisorContextV2> {
  const unknowns: string[] = []
  const today = options.todayIso ?? isoDateToday()

  const base = await buildExecutiveContextPackage(options)

  // Derive task coverage gaps. The base package already includes
  // open tasks (capped). For each FINAL_WEEK_TASK_TEMPLATE entry,
  // we look for any task whose title contains a 5+ character
  // substring of the recommended title or the section id. This is a
  // soft heuristic; the chief is the source of truth.
  const loadedTasks = base.openTasks
  const coverageGaps: TaskCoverageGap[] = []
  for (const template of FINAL_WEEK_TASK_TEMPLATES) {
    const entry = findEntry(template.sectionId, template.playbookChapter)
    if (!entry) continue
    const match = findMatchingTask(loadedTasks, template, entry)
    coverageGaps.push({
      entryId: entry.id,
      laneId: entry.laneId,
      deliverableId: entry.deliverableId,
      sectionId: entry.sectionId,
      recommendedTaskTitle: template.title,
      recommendedOwner: template.owner,
      recommendedDueLabel: template.dueLabel,
      recommendedDoneWhen: template.doneWhen,
      missing: !match,
      matchedTaskId: match ?? undefined
    })
  }

  if (loadedTasks.length === 0) {
    unknowns.push(
      'No open tasks were loaded into the scope; task-coverage gaps reflect templates only and may overstate real gaps.'
    )
  }

  // Dependency signals — pass the loaded deliverables + a synthesized
  // open-task list (we only have open tasks; we do not see done tasks
  // in this scope, which is fine because dependency signals key on
  // `blocked` / `overdue` / status). Note: the existing
  // buildProjectNavigatorSignals() function takes the full task list
  // including blocked tasks. For V2 we pass what we have.
  const navigatorSignals = buildProjectNavigatorSignals({
    deliverables: contextDeliverablesToNavigatorShape(base.deliverables),
    tasks: contextTasksToNavigatorShape(base.openTasks),
    todayIso: today,
    filterDepartment: filterDeptForViewer(base.viewer)
  })

  if (navigatorSignals.length === 0) {
    unknowns.push(
      'No dependency signals fired; if the company is mid-sprint this may be drift rather than calm.'
    )
  }

  // Product catalog summary — strip the catalog down to the fields
  // the Advisor needs without spilling default cost / price values
  // (those are sensitive in a few cohorts and not relevant to a
  // management coaching prompt).
  const catalog: ProductCatalogContextEntry[] = PRODUCT_CATALOG.map((p) => ({
    id: p.id,
    productName: p.productName,
    brand: p.brand,
    category: p.category,
    isSellableProduct: p.isSellableProduct
  }))

  return {
    base,
    todayIso: today,
    finalWeekLanes: FINAL_WEEK_LANES,
    finalWeekTaskTemplates: FINAL_WEEK_TASK_TEMPLATES,
    taskCoverageGaps: coverageGaps,
    dependencySignals: navigatorSignals,
    sectionDependencyHints: SECTION_DEPENDENCY_HINTS,
    productCatalog: catalog,
    unknowns
  }
}

// ---- helpers -----------------------------------------------------

function findEntry(
  sectionId: string,
  playbookChapter: number
): FinalWeekSectionEntry | null {
  // The lane map is keyed by `id = "ch-XX:section-id"`. The brief
  // already enforces that the recommended task template id matches
  // the lane entry id, but we re-derive here in case a chapter
  // number drifts.
  const chapterPrefix = `ch-${String(playbookChapter).padStart(2, '0')}:`
  for (const lane of FINAL_WEEK_LANES) {
    for (const entry of lane.sections) {
      if (
        entry.id.startsWith(chapterPrefix) &&
        entry.sectionId === sectionId
      ) {
        return entry
      }
    }
  }
  return null
}

function findMatchingTask(
  tasks: readonly { id: string; title: string }[],
  template: FinalWeekTaskTemplate,
  entry: FinalWeekSectionEntry
): string | null {
  const needles = [
    template.title.toLowerCase(),
    entry.title.toLowerCase(),
    entry.sectionId.toLowerCase().replace(/-/g, ' ')
  ]
  for (const t of tasks) {
    const haystack = (t.title ?? '').toLowerCase()
    if (haystack.length < 5) continue
    for (const needle of needles) {
      // Look for any 5+ character substring overlap.
      const tokens = needle.split(/\s+/).filter((s) => s.length >= 5)
      for (const token of tokens) {
        if (haystack.includes(token)) {
          return t.id
        }
      }
    }
  }
  return null
}

// The navigator-signal helper expects rough Deliverable / Task
// shapes. We synthesize the minimum subset from the V1 context
// package so we don't need to reach back into Firestore.
function contextDeliverablesToNavigatorShape(
  deliverables: ExecutiveContextPackage['deliverables']
): Deliverable[] {
  return deliverables.map((d) => ({
    id: d.id,
    title: d.title,
    chapter: d.chapter ?? 0,
    department: d.department ?? 'admin',
    status: (d.status ?? 'draft') as DeliverableStatus,
    dueDate: d.dueDate ?? undefined,
    summary: '',
    deckUrl: undefined,
    finalDocUrl: undefined,
    ownerUid: undefined,
    ownerEmail: d.ownerEmail ?? undefined,
    approverUid: undefined,
    approverEmail: d.approverEmail ?? undefined
    // Other Deliverable fields are optional in the navigator path.
  })) as Deliverable[]
}

function contextTasksToNavigatorShape(
  tasks: ExecutiveContextPackage['openTasks']
): Task[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    department: t.department ?? 'admin',
    status: (t.status ?? 'in_progress') as TaskStatus,
    dueDate: t.dueDate ?? undefined,
    deliverableId: t.deliverableId ?? null,
    ownerUid: undefined,
    ownerEmail: t.ownerEmail ?? undefined,
    description: '',
    priority: 'medium',
    requirementId: undefined
  })) as Task[]
}

function filterDeptForViewer(
  viewer: ExecutiveContextPackage['viewer']
): Department | null {
  if (viewer.isCoCEO || viewer.isAdmin) return null
  if (viewer.role === 'coo') return 'operations'
  if (viewer.role === 'cfo') return 'finance'
  if (viewer.role === 'cmo') return 'marketing'
  if (viewer.role === 'csgo') return 'strategy-growth'
  return viewer.department
}

/** Cheap one-line summary the prompt template can embed. Reduces
 *  token spend on chiefs that only need a roll-up. */
export function summarizeAdvisorContextV2(
  ctx: ExecutiveAdvisorContextV2
): string {
  const counts = ctx.base.summary
  const sigCounts = ctx.dependencySignals.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.severity] = (acc[s.severity] ?? 0) + 1
      return acc
    },
    {}
  )
  const gapCount = ctx.taskCoverageGaps.filter((g) => g.missing).length
  return [
    `Today: ${ctx.todayIso}`,
    `Open tasks: ${counts.openTaskCount} (blocked ${counts.blockedTaskCount}, overdue ${counts.overdueTaskCount})`,
    `Awaiting my approval: ${counts.awaitingMyApprovalCount}`,
    `Needs revision: ${counts.needsRevisionCount}`,
    `Drafts: ${counts.draftCount}`,
    `Dependency signals: ${ctx.dependencySignals.length} (blocked ${sigCounts.blocked ?? 0}, ready ${sigCounts.ready ?? 0}, warning ${sigCounts.warning ?? 0})`,
    `P0 task coverage gaps: ${gapCount}`
  ].join(' · ')
}
