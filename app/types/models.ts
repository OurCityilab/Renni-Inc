// Renni Command Center — typed Firestore models.
// Firestore is the source of truth for approvals, ownership, and structured data.
// Shapes here mirror the collection layout documented in docs/05-firestore-schema.md.

// -------- enums / literal unions --------

export type Role =
  | 'coceo'
  | 'coo'
  | 'cfo'
  | 'cmo'
  | 'csgo'
  | 'member'
  | 'admin'

export type Department =
  | 'executive'
  | 'operations'
  | 'finance'
  | 'marketing'
  | 'strategy-growth'
  | 'admin'

export type DeliverableStatus =
  | 'draft'
  | 'in_review'
  | 'needs_revision'
  | 'approved'

// "blocked" is a task-level flag only, never a deliverable review outcome.
export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type GoalStatus =
  | 'not_started'
  | 'on_track'
  | 'at_risk'
  | 'complete'

export type SectionStatus =
  | 'empty'
  | 'draft'
  | 'ready'
  | 'approved'

export type DecisionStatus =
  | 'proposed'
  | 'decided'
  | 'revisited'

// ISO date strings (yyyy-mm-dd) and ISO-8601 timestamps travel as strings to
// stay portable between client, admin SDK, and JSON responses.
export type IsoDate = string
export type IsoTimestamp = string

// -------- shared roster --------
// roster/{email} — seeded from CSV, read by the auth provisioning endpoint
// to decide whether a signed-in Google account is allowed in.
export interface RosterEntry {
  email: string
  displayName: string
  role: Role
  title: string
  department: Department
  isChief: boolean
  updatedAt?: IsoTimestamp
}

// -------- users/{uid} --------
export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: Role
  title: string
  department: Department
  isChief: boolean
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- deliverables/{id} --------
// Statuses: draft | in_review | needs_revision | approved
// Owners can move draft <-> in_review. Approvers route in_review -> approved | needs_revision.

// Inline audit trail. Appended to deliverables/{id}.statusHistory on every
// lifecycle mutation so the detail page can render a debuggable activity feed
// without a subcollection read. Keep entries compact.
export type DeliverableEventAction =
  | 'submitted'
  | 'approved'
  | 'returned'
  | 'due_date_edited'

export interface DeliverableEvent {
  action: DeliverableEventAction
  fromStatus: DeliverableStatus | null
  toStatus: DeliverableStatus | null
  actorEmail: string
  actorRole?: Role
  note?: string | null
  createdAt: IsoTimestamp
}

export interface Deliverable {
  id: string
  title: string
  chapter: number
  department: Department
  ownerEmail: string
  ownerUid: string | null
  approverEmail: string
  approverUid: string | null
  dueDate: IsoDate
  suggestedDueDate: IsoDate
  instructorCanEditDueDate: boolean
  dueDateNotes?: string | null
  lastDueDateEditedBy?: string | null
  lastDueDateEditedAt?: IsoTimestamp | null
  dueDateOverrideReason?: string | null
  status: DeliverableStatus
  templateUrl?: string
  definitionOfDone: string
  rubricChecklist: string[]
  linkedDocUrl?: string | null
  notes?: string | null
  submittedForReviewAt?: IsoTimestamp | null
  approvalNotes?: string | null
  returnedReason?: string | null
  approvedAt?: IsoTimestamp | null
  approvedByUid?: string | null
  approvedByRole?: Role | null
  statusHistory?: DeliverableEvent[]
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

// -------- tasks/{id} --------
// Added fields (department, definitionOfDone, priority, assignedByEmail,
// playbookChapter) are all optional and only populated by the Timeline
// Planner. Seeded tasks without these still render correctly.
export interface Task {
  id: string
  title: string
  deliverableId: string | null
  ownerEmail: string
  ownerUid: string | null
  status: TaskStatus
  startDate?: IsoDate | null
  dueDate?: IsoDate | null
  blockedBy?: string | null
  dependsOn?: string[]
  progress?: number
  notes?: string | null
  department?: Department | null
  definitionOfDone?: string | null
  priority?: TaskPriority | null
  assignedByEmail?: string | null
  playbookChapter?: number | null
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

// -------- goals/{id} --------
export interface Goal {
  id: string
  department: Department
  metricName: string
  target: number
  current: number
  ownerEmail: string
  ownerUid: string | null
  status: GoalStatus
  notes?: string | null
  updatedAt: IsoTimestamp
}

// -------- bmcBlocks/{blockKey} --------
// V1 flat collection (one doc per Canvas block) so per-block editing and
// per-department ownership stay legible. The older BmcCanvas / StructuredSection
// soft-lock stubs below remain untouched but are unused.
export const BMC_BLOCK_KEYS = [
  'customer_segments',
  'value_propositions',
  'channels',
  'customer_relationships',
  'revenue_streams',
  'key_resources',
  'key_activities',
  'key_partners',
  'cost_structure'
] as const
export type BmcBlockKey = (typeof BMC_BLOCK_KEYS)[number]

export interface BmcBlock {
  id: BmcBlockKey
  title: string
  prompt: string
  content: string
  ownerDepartment?: Department | null
  ownerEmail?: string | null
  status?: 'draft' | 'reviewed'
  updatedAt?: IsoTimestamp
  updatedByEmail?: string | null
}

// -------- bmc/{canvasId} --------
export type BmcSectionName =
  | 'customerSegments'
  | 'valuePropositions'
  | 'channels'
  | 'customerRelationships'
  | 'revenueStreams'
  | 'keyResources'
  | 'keyActivities'
  | 'keyPartnerships'
  | 'costStructure'

// Soft-lock fields mean app code enforces single-editor sections with a TTL.
export interface StructuredSection {
  content: string
  why: string
  ownerUid?: string | null
  status: SectionStatus
  lockedByUid?: string | null
  lockedByName?: string | null
  lockedAt?: IsoTimestamp | null
  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
}

export interface BmcCanvas {
  id: string
  sections: Partial<Record<BmcSectionName, StructuredSection>>
  updatedAt?: IsoTimestamp
}

// -------- continuity/{docId} --------
export type ContinuitySectionName =
  | 'companyOverview'
  | 'leadershipSuccession'
  | 'decisionRights'
  | 'ownershipLogic'
  | 'recognition'
  | 'handoff'

export interface ContinuityDoc {
  id: string
  sections: Partial<Record<ContinuitySectionName, StructuredSection>>
  updatedAt?: IsoTimestamp
}

// -------- decisions/{id} --------
export interface Decision {
  id: string
  title: string
  category: string
  decision: string
  rationale: string // required "why" — portal must reject empty values
  alternativesConsidered: string
  expectedOutcome: string
  decidedByUid: string
  status: DecisionStatus
  relatedChapter?: number | null
  relatedDeliverableId?: string | null
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- pricingScenarios/{scenarioId} --------
// One pricing / break-even scenario per pop-up product. Derived math
// (revenue, margin, break-even units) is computed in the UI; we only store
// inputs so edits stay legible and don't drift.
export type PricingCategory = 'apparel' | 'baked-goods' | 'donation' | 'other'

export interface PricingScenario {
  id: string
  productName: string
  brand: string
  category: PricingCategory
  unitCost: number
  salePrice: number
  plannedQuantity: number
  // Optional inputs. Present when the team has started tracking actuals or
  // has a specific fixed-cost allocation for this scenario.
  soldQuantity?: number | null
  fixedCostShare?: number | null
  notes?: string | null
  ownerEmail: string
  ownerUid: string | null
  department: Department
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

// -------- donations/{donationId} --------
export interface Donation {
  id: string
  amount: number
  sourceType: string
  paymentMethod: string
  recordedByUid: string
  note?: string | null
  createdAt: IsoTimestamp
}

// -------- transactions/{transactionId} --------
export interface Transaction {
  id: string
  sku: string
  productName: string
  quantity: number
  amount: number
  paymentType: string
  sellerUid: string
  donationAttached?: boolean
  createdAt: IsoTimestamp
}

// -------- popUpTransactions/{id} --------
// Simple append-mostly ledger of money taken in during the pop-up. Unified
// across sales, donations, and admin adjustments so the revenue page has
// one collection to watch.
//
// Derived totals (grossRevenue, estimatedGrossProfit) are stored so the
// dashboard KPIs don't recompute per snapshot; the client also recomputes
// on write so the stored value is always consistent with quantity/price.
export type PopUpTransactionType = 'sale' | 'donation' | 'adjustment'

export interface PopUpTransaction {
  id: string
  type: PopUpTransactionType
  productName: string
  pricingScenarioId?: string | null
  brand: string
  category: PricingCategory
  quantity: number
  unitPrice: number
  unitCost?: number | null
  grossRevenue: number
  estimatedGrossProfit: number
  paymentMethod?: string | null
  note?: string | null
  recordedByUid: string
  recordedByEmail: string
  department: Department
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

// -------- feedback/{feedbackId} --------
export interface FeedbackEntry {
  id: string
  customerType: string
  productInterest: string
  note: string
  capturedByUid: string
  createdAt: IsoTimestamp
}

// -------- helpers --------

export const APPROVAL_RUBRIC: readonly string[] = [
  'complete',
  'accurate',
  'reviewed by chief',
  'correct format',
  'usable by next cohort'
] as const

export const DEPARTMENTS: readonly Department[] = [
  'executive',
  'operations',
  'finance',
  'marketing',
  'strategy-growth',
  'admin'
] as const

export const DELIVERABLE_STATUSES: readonly DeliverableStatus[] = [
  'draft',
  'in_review',
  'needs_revision',
  'approved'
] as const

export const GOAL_STATUSES: readonly GoalStatus[] = [
  'not_started',
  'on_track',
  'at_risk',
  'complete'
] as const
