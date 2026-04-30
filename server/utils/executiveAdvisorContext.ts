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
import { templateStudios } from '~~/app/data/templateStudios'
import type { TemplateStudioSection } from '~~/app/types/templateStudio'
import {
  deriveTaskCoverageNodes,
  summarizeTaskCoverage,
  topMissingCoverage,
  topBlockedCoverage,
  topChiefFocusItems,
  type TaskCoverageNode
} from '~~/app/utils/taskCoverageMap'
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
  /** Per-section builder coverage summary derived from
   *  app/data/templateStudios. Lets the model recommend the right
   *  surface ("open the Universal Table on Ch. 4 channels") rather
   *  than guessing what kind of artifact the section produces. */
  builderCoverage: BuilderCoverageEntry[]
  /** Roll-up counts for the builder coverage summary so a prompt
   *  template can name the headline state without iterating the
   *  full per-section list. */
  builderCoverageSummary: BuilderCoverageSummary
  /** Deterministic task coverage signals derived from the live
   *  task list plus the FINAL_WEEK_LANES + FINAL_WEEK_TASK_TEMPLATES
   *  registry. The Advisor uses these as facts ("3 P0 sections
   *  have no matching task") rather than inferring coverage from
   *  prose. Compact by design — see CompactTaskCoverageContext for
   *  the embedded shape (summary + top-N missing + top-N blocked
   *  + top-N chief focus, capped). */
  taskCoverage: CompactTaskCoverageContext
  /** Explicit unknowns the Advisor should surface to the chief.
   *  Populated by the context builder when a derivation could not
   *  run because of missing inputs. */
  unknowns: string[]
}

export interface CompactTaskCoverageContext {
  summary: {
    totalRequiredSections: number
    withTaskCoverage: number
    missingTaskCoverage: number
    totals: {
      blocked: number
      overdue: number
      inProgress: number
      readyForReview: number
      done: number
    }
    byPriority: Record<
      'P0' | 'P1' | 'P2',
      { total: number; withTask: number; missing: number }
    >
    byLane: Array<{
      lane: string
      laneTitle: string
      total: number
      withTask: number
      missing: number
      blocked: number
      overdue: number
    }>
  }
  topMissingCoverage: Array<{
    id: string
    sectionId: string
    sectionTitle: string
    chapterId: string
    lane: string
    priority: 'P0' | 'P1' | 'P2'
    requiredTaskTitle: string
    owner: string
    reviewer: string
    dependency: string
    definitionOfDone: string
    route: string
  }>
  topBlockedCoverage: Array<{
    id: string
    sectionId: string
    sectionTitle: string
    chapterId: string
    lane: string
    priority: 'P0' | 'P1' | 'P2'
    blocked: number
    overdue: number
    inProgress: number
    owner: string
    route: string
  }>
  chiefFocusItems: Array<{
    id: string
    sectionTitle: string
    chapterId: string
    priority: 'P0' | 'P1' | 'P2'
    reason: string
    suggestedChiefMove: string
    route: string
  }>
}

/** Family taxonomy the model uses to reason about which section
 *  has which artifact surface. `recipe-only` means no builder is
 *  mounted — the section relies on the recipe panel + Working
 *  Draft alone. */
export type BuilderFamily =
  | 'customer-profile-builder'
  | 'key-activities-builder'
  | 'finance-table-builder'
  | 'operations-checklist-builder'
  | 'market-fit-builder'
  | 'brand-fit-builder'
  | 'pricing-strategy-builder'
  | 'chip-pick-quickstart'
  | 'universal-table'
  | 'universal-checklist'
  | 'decision-memo'
  | 'brand-system-builder'
  | 'retail-pitch-builder'
  | 'strategy-memo-builder'
  | 'recipe-only'

export interface BuilderCoverageEntry {
  deliverableId: string
  sectionId: string
  sectionTitle: string
  /** First builder family that fires on the section, in priority
   *  order: existing primary builders first (saved-state and
   *  Pass A primaries), then Pass B specialized builders, then
   *  Pass A universals, then `recipe-only`. */
  primaryFamily: BuilderFamily
  /** Optional secondary builder families also enabled on the same
   *  section. Empty when only one builder fires. */
  secondaryFamilies: BuilderFamily[]
  /** Whether the section produces structured artifact output beyond
   *  free-text Working Draft. True when any builder family fires. */
  hasBuilder: boolean
}

export interface BuilderCoverageSummary {
  totalSections: number
  withAnyBuilder: number
  recipeOnly: number
  byFamily: Partial<Record<BuilderFamily, number>>
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
  /** Whether the Customer Profile Builder is currently enabled in
   *  the workspace. Mirrors the
   *  `runtimeConfig.public.customerProfileBuilderEnabled` flag the
   *  workspace gates the panel on (see
   *  app/components/DeliverableOutputWorkspace.vue). The endpoint
   *  reads `useRuntimeConfig()` and passes the resolved boolean
   *  here so the context builder stays pure. When omitted or
   *  false, builderCoverage reports the customer-segments section
   *  as recipe-only with a conditional note rather than claiming
   *  the Customer Profile Builder is visible. */
  customerProfileBuilderEnabled?: boolean
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

  // Builder coverage derivation. Pure read of the studio registry —
  // no Firestore call. Produces one entry per section across every
  // chapter so the model can name the right surface to open.
  const builderCoverage = deriveBuilderCoverage({
    customerProfileBuilderEnabled:
      options.customerProfileBuilderEnabled ?? false
  })
  const builderCoverageSummary = summarizeBuilderCoverage(builderCoverage)

  // Deterministic task coverage. Reuses the same util the Project
  // Navigator components consume so the Advisor's view of coverage
  // exactly matches what chiefs see in the deterministic UI. The
  // V1 base context.openTasks list is filtered to the same Task
  // shape the util needs.
  const taskCoverageInputs = {
    tasks: base.openTasks.map(taskContextEntryToTask),
    todayIso: today
  }
  const taskCoverageNodes = deriveTaskCoverageNodes(taskCoverageInputs)
  const taskCoverageSummary = summarizeTaskCoverage(taskCoverageNodes)
  const taskCoverage = compactTaskCoverageForAdvisor(
    taskCoverageNodes,
    taskCoverageSummary
  )

  return {
    base,
    todayIso: today,
    finalWeekLanes: FINAL_WEEK_LANES,
    finalWeekTaskTemplates: FINAL_WEEK_TASK_TEMPLATES,
    taskCoverageGaps: coverageGaps,
    dependencySignals: navigatorSignals,
    sectionDependencyHints: SECTION_DEPENDENCY_HINTS,
    productCatalog: catalog,
    builderCoverage,
    builderCoverageSummary,
    taskCoverage,
    unknowns
  }
}

// ---- Task coverage helpers --------------------------------------

/** Convert the V1 ExecutiveContextTask shape (the trimmed task
 *  payload Advisor V1 already carries) back into the minimum
 *  Task shape the deriveTaskCoverageNodes() helper expects. The
 *  helper only reads `id`, `title`, `deliverableId`, `status`, and
 *  `dueDate`, so we synthesize defaults for the rest. */
function taskContextEntryToTask(
  t: ExecutiveContextPackage['openTasks'][number]
): Parameters<typeof deriveTaskCoverageNodes>[0]['tasks'][number] {
  return {
    id: t.id,
    title: t.title,
    deliverableId: t.deliverableId ?? null,
    ownerEmail: t.ownerEmail ?? '',
    ownerUid: null,
    status: (t.status ?? 'in_progress') as
      | 'not_started'
      | 'in_progress'
      | 'blocked'
      | 'done',
    startDate: null,
    dueDate: t.dueDate ?? null,
    blockedBy: t.blockedBy ?? null,
    dependsOn: [],
    progress: 0,
    notes: null,
    department: t.department ?? null,
    definitionOfDone: null,
    priority: null,
    assignedByEmail: null,
    playbookChapter: null,
    requirementId: null,
    createdAt: '',
    updatedAt: ''
  }
}

const TASK_COVERAGE_TOP_N = 8

function compactTaskCoverageForAdvisor(
  nodes: readonly TaskCoverageNode[],
  summary: ReturnType<typeof summarizeTaskCoverage>
): CompactTaskCoverageContext {
  const missing = topMissingCoverage(nodes, TASK_COVERAGE_TOP_N).map((n) => ({
    id: n.id,
    sectionId: n.sectionId,
    sectionTitle: n.sectionTitle,
    chapterId: n.chapterId,
    lane: n.lane,
    priority: n.priority,
    requiredTaskTitle: n.requiredTaskTitle,
    owner: n.owner,
    reviewer: n.reviewer,
    dependency: n.dependency,
    definitionOfDone: n.definitionOfDone,
    route: n.route
  }))
  const blocked = topBlockedCoverage(nodes, TASK_COVERAGE_TOP_N).map((n) => ({
    id: n.id,
    sectionId: n.sectionId,
    sectionTitle: n.sectionTitle,
    chapterId: n.chapterId,
    lane: n.lane,
    priority: n.priority,
    blocked: n.statusSummary.blocked,
    overdue: n.statusSummary.overdue,
    inProgress: n.statusSummary.inProgress,
    owner: n.owner,
    route: n.route
  }))
  const focus = topChiefFocusItems(nodes, 5).map((item) => ({
    id: item.node.id,
    sectionTitle: item.node.sectionTitle,
    chapterId: item.node.chapterId,
    priority: item.node.priority,
    reason: item.reason,
    suggestedChiefMove: item.suggestedChiefMove,
    route: item.node.route
  }))
  return {
    summary: {
      totalRequiredSections: summary.totalRequiredSections,
      withTaskCoverage: summary.withTaskCoverage,
      missingTaskCoverage: summary.missingTaskCoverage,
      totals: summary.totals,
      byPriority: summary.byPriority,
      byLane: summary.byLane.map((l) => ({
        lane: l.lane,
        laneTitle: l.laneTitle,
        total: l.total,
        withTask: l.withTask,
        missing: l.missing,
        blocked: l.blocked,
        overdue: l.overdue
      }))
    },
    topMissingCoverage: missing,
    topBlockedCoverage: blocked,
    chiefFocusItems: focus
  }
}

// ---- Builder coverage derivation --------------------------------

interface BuilderCoverageDerivationOptions {
  /** Mirrors the workspace gate. When false, the customer-segments
   *  section does NOT report `customer-profile-builder` as visible
   *  — that builder is feature-flagged and only mounts when the
   *  flag is on. */
  customerProfileBuilderEnabled: boolean
}

/** Walk every chapter in the studio registry and classify each
 *  section by the first builder family that fires on it. Priority
 *  order matches DeliverableOutputWorkspace.hasPrimaryBuilder() so
 *  the model's view of the platform stays consistent with what the
 *  workspace actually mounts. */
function deriveBuilderCoverage(
  derivationOptions: BuilderCoverageDerivationOptions
): BuilderCoverageEntry[] {
  const out: BuilderCoverageEntry[] = []
  for (const [deliverableId, studio] of Object.entries(templateStudios)) {
    for (const section of studio.sections) {
      const families = enabledBuilderFamilies(section, derivationOptions)
      const primaryFamily = families[0] ?? 'recipe-only'
      const secondaryFamilies = families.slice(1)
      out.push({
        deliverableId,
        sectionId: section.id,
        sectionTitle: section.title,
        primaryFamily,
        secondaryFamilies,
        hasBuilder: primaryFamily !== 'recipe-only'
      })
    }
  }
  return out
}

/** Returns enabled builder families for a section in priority order:
 *  existing primary builders first, then Pass B specialized, then
 *  Pass A universals. Mirrors hasPrimaryBuilder + the workspace
 *  mount order so the model never sees a phantom builder. */
function enabledBuilderFamilies(
  section: TemplateStudioSection,
  derivationOptions: BuilderCoverageDerivationOptions
): BuilderFamily[] {
  const families: BuilderFamily[] = []
  // Existing primary surfaces (saved-state and Pass A primaries).
  // Customer Profile Builder is feature-flagged in the workspace —
  // only report it as visible when the same flag is on. When the
  // flag is off, the section falls through to its other builder
  // (chip-pick QuickStart) or to recipe-only.
  if (
    section.id === 'customer-segments' &&
    derivationOptions.customerProfileBuilderEnabled
  ) {
    families.push('customer-profile-builder')
  }
  if (section.keyActivities?.enabled) families.push('key-activities-builder')
  if (section.financeTable?.enabled) families.push('finance-table-builder')
  if (section.operationsChecklist?.enabled) families.push('operations-checklist-builder')
  if (section.marketFit?.enabled) families.push('market-fit-builder')
  if (section.brandFit?.enabled) families.push('brand-fit-builder')
  if (section.pricingStrategy?.enabled) families.push('pricing-strategy-builder')
  if (section.chipPickQuickStart?.enabled) families.push('chip-pick-quickstart')
  // Pass B specialized.
  if (section.brandSystem?.enabled) families.push('brand-system-builder')
  if (section.retailPitch?.enabled) families.push('retail-pitch-builder')
  if (section.strategyMemo?.enabled) families.push('strategy-memo-builder')
  // Pass A universals — only if no primary fires above (the
  // workspace conflict guard suppresses universals when a primary
  // is enabled).
  if (families.length === 0) {
    if (section.universalTable?.enabled) families.push('universal-table')
    if (section.universalChecklist?.enabled) families.push('universal-checklist')
    if (section.decisionMemo?.enabled) families.push('decision-memo')
  }
  return families
}

function summarizeBuilderCoverage(
  entries: readonly BuilderCoverageEntry[]
): BuilderCoverageSummary {
  const byFamily: Partial<Record<BuilderFamily, number>> = {}
  let withAnyBuilder = 0
  let recipeOnly = 0
  for (const e of entries) {
    if (e.hasBuilder) {
      withAnyBuilder++
    } else {
      recipeOnly++
    }
    byFamily[e.primaryFamily] = (byFamily[e.primaryFamily] ?? 0) + 1
  }
  return {
    totalSections: entries.length,
    withAnyBuilder,
    recipeOnly,
    byFamily
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
//
// `buildProjectNavigatorSignals` only reads a narrow subset of
// each shape — d.id / d.title / d.department / d.status / d.dueDate
// for deliverables, and t.id / t.title / t.department / t.status /
// t.dueDate / t.deliverableId for tasks. The synthesized objects
// supply every field the signals helper actually consumes; other
// `Deliverable` / `Task` fields are intentionally omitted.
//
// TypeScript flags the direct cast because the synthesized objects
// don't structurally satisfy the full Deliverable / Task interfaces.
// Bridging through `unknown` (as the compiler itself suggests) is
// the cleanest documentation that the narrowing is deliberate —
// neither broadening to `any` nor expanding the types in
// app/types/models.ts which would weaken type safety elsewhere.
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
  })) as unknown as Deliverable[]
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
  })) as unknown as Task[]
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
  const cov = ctx.builderCoverageSummary
  return [
    `Today: ${ctx.todayIso}`,
    `Open tasks: ${counts.openTaskCount} (blocked ${counts.blockedTaskCount}, overdue ${counts.overdueTaskCount})`,
    `Awaiting my approval: ${counts.awaitingMyApprovalCount}`,
    `Needs revision: ${counts.needsRevisionCount}`,
    `Drafts: ${counts.draftCount}`,
    `Dependency signals: ${ctx.dependencySignals.length} (blocked ${sigCounts.blocked ?? 0}, ready ${sigCounts.ready ?? 0}, warning ${sigCounts.warning ?? 0})`,
    `P0 task coverage gaps: ${gapCount}`,
    `Builder coverage: ${cov.withAnyBuilder}/${cov.totalSections} sections (recipe-only ${cov.recipeOnly})`,
    `Task coverage: ${ctx.taskCoverage.summary.withTaskCoverage}/${ctx.taskCoverage.summary.totalRequiredSections} required sections covered (missing ${ctx.taskCoverage.summary.missingTaskCoverage})`
  ].join(' · ')
}
