// Pure operations CSV builders.
//
// Posture (do not relax):
//   - PURE: no Firestore reads, no writes, no AI.
//   - DOES NOT mutate input arrays / objects.
//   - DOES NOT expose internal uids (ownerUid / approverUid /
//     recordedByUid / sellerUid), Firestore audit fields, or
//     statusHistory. Email-based identifiers stay; uid fields do not.
//   - DOES NOT recompute anything — uses stored fields as-is so the
//     export reflects the exact numbers visible in the app.

import type {
  Deliverable,
  DeliverableStatus,
  Goal,
  GoalStatus,
  PopUpTransaction,
  PricingScenario,
  Task,
  TaskStatus
} from '~/types/models'
import { formatDateForCsv, makeCsv } from '~/utils/csvExport'

const DELIVERABLE_STATUS_LABEL: Record<DeliverableStatus, string> = {
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

// --------------- deliverables ---------------

const DELIVERABLES_HEADERS = [
  'title',
  'chapter',
  'department',
  'owner',
  'approver',
  'status',
  'dueDate',
  'submittedForReviewAt',
  'approvedAt',
  'updatedAt'
] as const

export function buildDeliverablesCsv(
  deliverables: readonly Deliverable[]
): string {
  // Stable order: chapter ascending, then title.
  const ordered = [...deliverables].sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter
    return a.title.localeCompare(b.title)
  })
  const rows = ordered.map((d) => [
    d.title,
    d.chapter,
    d.department,
    d.ownerEmail ?? '',
    d.approverEmail ?? '',
    DELIVERABLE_STATUS_LABEL[d.status],
    d.dueDate ?? '',
    formatDateForCsv(d.submittedForReviewAt ?? null),
    formatDateForCsv(d.approvedAt ?? null),
    formatDateForCsv(d.updatedAt)
  ])
  return makeCsv(DELIVERABLES_HEADERS, rows)
}

// --------------- tasks ---------------

const TASKS_HEADERS = [
  'title',
  'department',
  'owner',
  'status',
  'priority',
  'startDate',
  'dueDate',
  'deliverableTitle',
  'dependencyCount',
  'updatedAt'
] as const

export interface TasksCsvInput {
  tasks: readonly Task[]
  // Optional join: caller passes deliverables so we can resolve
  // deliverableId → human title. When omitted, the title cell falls
  // back to the deliverable id (or empty when null).
  deliverables?: readonly Pick<Deliverable, 'id' | 'title'>[]
}

export function buildTasksCsv(input: TasksCsvInput): string {
  const titleByDeliverableId = new Map<string, string>()
  for (const d of input.deliverables ?? []) {
    if (d.id) titleByDeliverableId.set(d.id, d.title)
  }
  // Stable order: dueDate ascending (no due → end), then title.
  const ordered = [...input.tasks].sort((a, b) => {
    const ad = a.dueDate || '9999-12-31'
    const bd = b.dueDate || '9999-12-31'
    if (ad !== bd) return ad < bd ? -1 : 1
    return a.title.localeCompare(b.title)
  })
  const rows = ordered.map((t) => {
    const dTitle = t.deliverableId
      ? titleByDeliverableId.get(t.deliverableId) ?? t.deliverableId
      : ''
    return [
      t.title,
      t.department ?? '',
      t.ownerEmail ?? '',
      TASK_STATUS_LABEL[t.status],
      t.priority ?? '',
      t.startDate ?? '',
      t.dueDate ?? '',
      dTitle,
      Array.isArray(t.dependsOn) ? t.dependsOn.length : 0,
      formatDateForCsv(t.updatedAt)
    ]
  })
  return makeCsv(TASKS_HEADERS, rows)
}

// --------------- goals ---------------

const GOALS_HEADERS = [
  'metric',
  'department',
  'target',
  'current',
  'status',
  'owner',
  'notes',
  'updatedAt'
] as const

export function buildGoalsCsv(goals: readonly Goal[]): string {
  const ordered = [...goals].sort((a, b) => {
    if (a.department !== b.department) {
      return a.department.localeCompare(b.department)
    }
    return a.metricName.localeCompare(b.metricName)
  })
  const rows = ordered.map((g) => [
    g.metricName,
    g.department,
    g.target,
    g.current,
    GOAL_STATUS_LABEL[g.status],
    g.ownerEmail ?? '',
    g.notes ?? '',
    formatDateForCsv(g.updatedAt)
  ])
  return makeCsv(GOALS_HEADERS, rows)
}

// --------------- pricing scenarios ---------------

const PRICING_HEADERS = [
  'product',
  'brand',
  'category',
  'unitCost',
  'salePrice',
  'plannedQuantity',
  'soldQuantity',
  'fixedCostShare',
  'unitMargin',
  'department',
  'owner',
  'notes',
  'updatedAt'
] as const

export function buildPricingScenariosCsv(
  scenarios: readonly PricingScenario[]
): string {
  const ordered = [...scenarios].sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand)
    return a.productName.localeCompare(b.productName)
  })
  const rows = ordered.map((s) => {
    // Derived unit margin is presented for review only and matches what
    // the in-app pricing page already shows. Source field math is
    // unchanged — we read salePrice and unitCost as stored.
    const unitMargin =
      Number.isFinite(s.salePrice) && Number.isFinite(s.unitCost)
        ? Math.round((s.salePrice - s.unitCost) * 100) / 100
        : ''
    return [
      s.productName,
      s.brand,
      s.category,
      s.unitCost,
      s.salePrice,
      s.plannedQuantity,
      s.soldQuantity ?? '',
      s.fixedCostShare ?? '',
      unitMargin,
      s.department,
      s.ownerEmail ?? '',
      s.notes ?? '',
      formatDateForCsv(s.updatedAt)
    ]
  })
  return makeCsv(PRICING_HEADERS, rows)
}

// --------------- pop-up transactions (revenue ledger) ---------------

const TRANSACTIONS_HEADERS = [
  'dateTime',
  'type',
  'productName',
  'brand',
  'category',
  'quantity',
  'unitPrice',
  'unitCost',
  'grossRevenue',
  'estimatedGrossProfit',
  'paymentMethod',
  'department',
  'recordedByEmail',
  'note'
] as const

export function buildTransactionsCsv(
  transactions: readonly PopUpTransaction[]
): string {
  // Stable order: createdAt ascending so the ledger reads chronologically.
  const ordered = [...transactions].sort((a, b) =>
    (a.createdAt || '').localeCompare(b.createdAt || '')
  )
  const rows = ordered.map((t) => [
    formatDateForCsv(t.createdAt),
    t.type,
    t.productName,
    t.brand,
    t.category,
    t.quantity,
    t.unitPrice,
    t.unitCost ?? '',
    t.grossRevenue,
    t.estimatedGrossProfit,
    t.paymentMethod ?? '',
    t.department,
    t.recordedByEmail ?? '',
    t.note ?? ''
  ])
  return makeCsv(TRANSACTIONS_HEADERS, rows)
}
