// Our City Studio — typed Firestore models.
// Mirrors the entities documented in
// Our_City_Studio_Build_Framework/08_DATA_MODEL.md, translated to
// camelCase to match this repo's existing Firestore conventions
// (see app/types/models.ts).
//
// Deliberately kept in its own module/collections rather than
// extending the Renni `AppUser`/`users` shape: Studio identity
// (studentProfiles) is fully decoupled from Renni Command Center
// identity (users) so the two permission systems never leak into
// each other. A person can hold both a users/{uid} doc (Renni) and
// a studentProfiles/{uid} doc (Studio) under the same Firebase Auth
// uid without either schema knowing about the other.

import type { IsoDate, IsoTimestamp } from '~/types/models'

// -------- identity --------

export type StudioRole = 'student' | 'coach' | 'admin'

// Spec (08_DATA_MODEL.md) names this field but does not enumerate
// values. Assumption, flagged for confirmation: a simple lifecycle
// covering "hasn't filled anything in yet" through "profile looks
// complete enough for coaches to rely on it."
export type StudentProfileStatus = 'new' | 'active' | 'needs_attention'

// -------- studioRoster/{email} --------
// Seed-populated registry of enrolled Studio accounts, mirrors the
// Renni roster/{email} pattern but is a separate collection so
// Studio enrollment never depends on (or grants) Renni Command
// Center access.
export interface StudioRosterEntry {
  email: string
  displayName: string
  studioRole: StudioRole
  cohortIds: string[]
  gradeLevel?: string
  school?: string
  worksite?: string
  alternateEmail?: string
  updatedAt?: IsoTimestamp
}

// -------- cohorts/{id} --------
export interface CohortSettings {
  // Calculator assumptions — admin-adjustable per cohort, per the
  // confirmed build decision. GameSession.settings may override
  // these for an individual simulation.
  takeHomePayFactor: number
  landlordIncomeMultiplier: number
  safeRentPercentOfTakeHome: number
  stretchRentPercentOfTakeHome: number
}

export interface Cohort {
  id: string
  name: string
  startDate: IsoDate
  endDate: IsoDate
  programType: string
  settings: CohortSettings
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- studentProfiles/{uid} --------
// The Studio identity + profile doc. Doc id == Firebase Auth uid.
// Coach/admin Studio users get a (thin) doc here too — the
// student-only fields are simply omitted for them.
export interface StudentProfile {
  uid: string
  email: string
  displayName: string
  studioRole: StudioRole
  studioCohortIds: string[]
  activeStudioCohortId: string | null
  gradeLevel?: string
  school?: string
  worksite?: string
  interests?: string
  goals?: string
  profileStatus: StudentProfileStatus
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- missions/{id} --------
export type StudioModule =
  | 'brand-builder'
  | 'story-bank'
  | 'star-tmay'
  | 'resume'
  | 'linkedin'
  | 'pitch-builder'
  | 'money-basics'
  | 'keys-credit'
  | 'marketplace'
  | 'market-day'
  | 'real-estate'

export interface Mission {
  id: string
  title: string
  description: string
  module: StudioModule
  estimatedMinutes: number
  dueDate?: IsoDate | null
  order: number
  requiredOutputType: PortfolioArtifactType
  active: boolean
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- studentMissionProgress/{id} --------
export type MissionProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'needs_revision'
  | 'complete'

export interface StudentMissionProgress {
  id: string
  studentUid: string
  missionId: string
  status: MissionProgressStatus
  startedAt?: IsoTimestamp | null
  submittedAt?: IsoTimestamp | null
  reviewedAt?: IsoTimestamp | null
  coachFeedback?: string | null
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- worksheetResponses/{id} --------
export interface WorksheetResponse {
  id: string
  studentUid: string
  worksheetType: StudioModule
  missionId?: string | null
  rawInputs: Record<string, unknown>
  aiQuestions?: string[]
  aiOutputs?: Record<string, unknown>
  selectedOutput?: Record<string, unknown> | null
  version: number
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- portfolioArtifacts/{id} --------
export type PortfolioArtifactStatus = 'draft' | 'needs_review' | 'approved'

export type PortfolioArtifactType =
  | 'brand_sentence'
  | 'intro_pitch'
  | 'star_answer'
  | 'resume_bullet'
  | 'linkedin_section'
  | 'budget'
  | 'credit_plan'
  | 'money_report'
  | 'p_and_l'
  | 'kpi_report'
  | 'sell_sheet'
  | 'pro_forma'
  | 'reflection'

export interface PortfolioArtifact {
  id: string
  studentUid: string
  artifactType: PortfolioArtifactType
  title: string
  content: string
  sourceWorksheetId?: string | null
  coachStatus: PortfolioArtifactStatus
  coachFeedback?: string | null
  exportedAt?: IsoTimestamp | null
  version: number
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- AI Sherpa contract --------
// Every AI-improvement response, Lab or Markets, takes this shape.
// See Our_City_Studio_Build_Framework/07_AI_SHERPA_SPEC.md.
export interface SherpaResponse {
  yourWords: string
  professionalVersion: string
  whyItWorks: string
  whatIsMissing: string[]
  tryAgainQuestion: string
}

// -------- Brand Coach contract (mode: brand-coach) --------
// Worksheet-driven coaching response: teaches word choice and
// audience awareness rather than just rewriting. Used by the
// Personal Brand Builder's "Get Sherpa Feedback" flow.
export type SherpaAudience =
  | 'admissions'
  | 'recruiter'
  | 'employer'
  | 'scholarship'
  | 'customer'
  | 'general'

export type SherpaOutputType =
  | 'word_choice'
  | 'pitch_3s'
  | 'pitch_30s'
  | 'pitch_1min_tmay'
  | 'star_story'
  | 'resume_bullets'

export interface WordChoiceFlag {
  word: string
  howItMayLand: string
  alternatives: string[]
  why: string
}

export interface BrandCoachResponse {
  strengths: string
  wordChoiceFlags: WordChoiceFlag[]
  audienceRead: string
  polishedVersion: string
  followUpQuestions: string[]
}

// -------- aiSessions/{id} --------
export interface AISession {
  id: string
  studentUid: string
  module: StudioModule
  inputText: string
  aiResponse: SherpaResponse
  promptVersion: string
  createdAt: IsoTimestamp
}

// -------- gameSessions/{id} --------
export type GameType = 'marketplace_housing' | 'market_day'
export type GameSessionStatus = 'setup' | 'active' | 'complete'

export interface GameSession {
  id: string
  cohortId: string
  gameType: GameType
  title: string
  status: GameSessionStatus
  round: number
  settings: Partial<CohortSettings> & Record<string, unknown>
  createdByUid: string
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- playerGameStates/{id} --------
export interface PlayerGameState {
  id: string
  gameSessionId: string
  studentUid: string
  role: string
  profile: Record<string, unknown>
  cash: number
  creditScore: number
  income: number
  savings: number
  debt: number
  assets: Record<string, unknown>
  liabilities: Record<string, unknown>
  currentStatus: Record<string, unknown>
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- properties/{id} --------
// Session-scoped clone of a property seed card (see
// app/config/studio/seedData/propertyCards.ts) — cloned into the
// session at setup time per the confirmed hybrid seed-data approach.
export interface Property {
  id: string
  gameSessionId: string
  ownerStudentUid?: string | null
  npcOwnerName?: string | null
  propertyType: 'rental' | 'for_sale'
  name: string
  neighborhood: string
  price?: number | null
  rent?: number | null
  deposit?: number | null
  minCreditScore: number
  incomeMultiplier?: number
  estimatedPayment?: number | null
  taxes?: number | null
  insurance?: number | null
  maintenance?: number | null
  expectedRent?: number | null
  resaleValue?: number | null
  riskRating: 'low' | 'medium' | 'high'
  quality?: string
  scarcity?: string
  status: 'available' | 'pending' | 'occupied' | 'sold'
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- housingApplications/{id} --------
export interface HousingApplication {
  id: string
  gameSessionId: string
  propertyId: string
  studentUid: string
  applicationType: 'rent' | 'buy'
  offeredPrice?: number | null
  status: 'pending' | 'approved' | 'rejected' | 'countered'
  rejectionReason?: string | null
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- studentBusinesses/{id} --------
export interface StudentBusiness {
  id: string
  gameSessionId: string
  studentUid: string
  businessName: string
  category: string
  productOrService: string
  targetCustomer: string
  customerProblem?: string
  valueProposition: string
  inputLevel: 'budget' | 'standard' | 'premium'
  qualityScore: number
  unitCost: number
  price: number
  inventoryOrCapacity: number
  marketingSpend: number
  status: 'setup' | 'active' | 'closed'
  createdAt: IsoTimestamp
  updatedAt?: IsoTimestamp
}

// -------- purchases/{id} --------
export interface Purchase {
  id: string
  gameSessionId: string
  buyerStudentUid: string
  sellerBusinessId?: string | null
  npcStoreId?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  satisfactionRating?: number | null
  round: number
  createdAt: IsoTimestamp
}

// -------- marketEvents/{id} --------
export interface MarketEvent {
  id: string
  gameSessionId: string
  eventType: string
  title: string
  description: string
  effects: Record<string, unknown>
  roundApplied: number
  createdAt: IsoTimestamp
}

// -------- pAndLs/{id} --------
export interface PAndL {
  id: string
  businessId: string
  gameSessionId: string
  revenue: number
  cogs: number
  grossProfit: number
  operatingExpenses: number
  netProfit: number
  // null == "N/A" (zero revenue), per 13_CALCULATOR_RULES.md
  profitMargin: number | null
  unitsSold: number
  inventoryLeft: number
  customerSatisfaction: number
  createdAt: IsoTimestamp
}
