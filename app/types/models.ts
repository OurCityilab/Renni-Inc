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
//
// V1 access manager added optional fields below so an instructor/admin can
// approve a second login email for a student whose LTU Google account is
// blocked. The roster doc id remains the primary email; alternateEmail is
// only consulted on the provision fallback path.
export type EmailStatus =
  | 'active'
  | 'pending-signup'
  | 'email-issue'
  | 'needs-review'

export interface RosterEntry {
  email: string
  displayName: string
  role: Role
  title: string
  department: Department
  isChief: boolean
  // Instructor/admin-approved alternate login email (lowercased). When
  // a sign-in's Google account email matches this field on any roster
  // row, provision treats that row as the match. Empty string means
  // "no alternate set" and is ignored at provision time.
  alternateEmail?: string
  // Display-only label admins use to flag access issues. Never gates
  // provision, never affects /pricing, advisor, or readiness.
  emailStatus?: EmailStatus | ''
  accessNotes?: string
  updatedAt?: IsoTimestamp
  updatedByUid?: string
  updatedByEmail?: string
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
  // V1 access manager — populated on provision so we can trace whether
  // a user signed in through their roster primary email or through an
  // instructor-approved alternateEmail. Both fields are optional so
  // legacy users/{uid} docs without them keep rendering.
  rosterEmail?: string
  alternateLoginUsed?: boolean
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
  // Optional link to a Template Studio requirement on the parent
  // deliverable. Legacy tasks have no requirementId and render fine.
  requirementId?: string | null
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

// -------- deliverableOutputs/{deliverableId} --------
// Student-authored artifact content keyed by deliverable. One doc per
// deliverable; sections live in a map keyed by stable Template Studio
// section id. Authored content (notes / draft / final / evidence) is
// kept separate from the Deliverable doc so the deliverable model stays
// small and approvals stay decoupled from authorship.
export type DeliverableOutputSectionStatus = 'empty' | 'in_progress' | 'ready'

export type EvidenceLinkType =
  | 'doc'
  | 'sheet'
  | 'slide'
  | 'folder'
  | 'image'
  | 'design'
  | 'external'
  | 'other'

export interface DeliverableEvidenceLink {
  id: string
  label: string
  url: string
  type: EvidenceLinkType
  sectionId: string
  requirementId?: string | null
  addedByUid?: string | null
  addedByEmail?: string | null
  addedAt?: IsoTimestamp | null
}

// Structured Evidence Standard V1 — students log defendable claims
// alongside the prose drafts. A structured evidence entry forces the
// team to name the claim, the supporting evidence, the source, the
// assumption, the calculation (if any), confidence, the risk, and the
// next validation step. Optional everywhere on the section so legacy
// output docs without entries keep working without migration.
export type EvidenceConfidence = 'low' | 'medium' | 'high'

export interface StructuredEvidenceEntry {
  id: string
  claim: string
  evidence: string
  source: string
  assumption?: string
  calculation?: string
  confidence?: EvidenceConfidence
  risk?: string
  nextValidation?: string
  requirementId?: string | null
  addedByUid?: string | null
  addedByEmail?: string | null
  addedAt?: IsoTimestamp | null
  updatedAt?: IsoTimestamp | null
}

// Market Builder V1 — optional, additive demand-estimation block per
// section. Students name a likely buyer, size the reachable market,
// log assumptions, and produce conservative / base / ambitious revenue
// scenarios. Soft signal only: it informs the Playbook narrative and
// the Phoenix Nest pitch but never gates submit or approval.
export type MarketScenarioLevel = 'conservative' | 'base' | 'ambitious'

export interface MarketBuilderScenario {
  id: string
  label: MarketScenarioLevel
  reachableAudience: number | null
  interestRatePercent: number | null
  conversionRatePercent: number | null
  // estimatedBuyers and estimatedRevenue are persisted alongside the
  // inputs so Firestore reads stay self-contained, but the UI always
  // re-derives them from the inputs so a stale snapshot can't quietly
  // present a wrong number.
  estimatedBuyers: number | null
  price: number | null
  estimatedRevenue: number | null
  notes?: string
}

export interface MarketBuilderEntry {
  id: string
  productName: string
  productStory?: string
  primaryMarket?: string
  secondaryMarket?: string
  targetAgeRange?: string
  customerAssumption?: string
  valueBasedFactor?: string
  schoolMarketSize?: number | null
  broaderMarketSize?: number | null
  evidenceSource?: string
  sourceType?: string
  confidence?: EvidenceConfidence
  weakestAssumption?: string
  strongestEvidence?: string
  nextValidation?: string
  scenarios: MarketBuilderScenario[]
  linkedRequirementId?: string | null
  addedByUid?: string | null
  addedByEmail?: string | null
  addedAt?: IsoTimestamp | null
  updatedAt?: IsoTimestamp | null
}

// Market Fit Builder V1 — broader than Market Builder. Where Market
// Builder lets a student log demand for a single product/scenario, the
// Fit Builder helps the team compare *which segment to target* given
// brand identity, design, quality, price, and Detroit-made story.
// Renaissance students might be the primary market, a launch market,
// an awareness market, or a weaker buying market depending on price
// and product. The Fit Builder supports all four.
//
// Stored alongside the existing fields on DeliverableOutputSection;
// nothing is required, nothing migrates, nothing affects the submit
// gate or Playbook readiness.
export type MarketFitQualityLevel =
  | 'budget'
  | 'standard'
  | 'premium'
  | 'luxury'
  | ''

export type MarketFitSignal = 'low' | 'medium' | 'high' | ''

export type MarketFitSegmentType =
  | 'students'
  | 'parents'
  | 'alumni'
  | 'staff'
  | 'detroit_supporters'
  | 'techtown_shoppers'
  | 'gift_buyers'
  | 'premium_apparel_buyers'
  | 'custom'

export type MarketFitSegmentRole =
  | 'primary_market'
  | 'secondary_market'
  | 'launch_market'
  | 'awareness_market'
  | 'validation_market'
  | ''

// Source categories used by the Source Coach. Existing legacy values
// ('survey', 'interview', 'school_data', 'stakeholder_feedback') stay
// in the union so any pre-positioning-pass entries still resolve;
// students authoring new requests pick from the more specific
// student_survey / parent_adult_interview / school_enrollment_data /
// phoenix_nest_stakeholder labels surfaced by the editor.
export type MarketFitEvidenceSourceType =
  | 'survey'
  | 'student_survey'
  | 'interview'
  | 'parent_adult_interview'
  | 'alumni_staff_interview'
  | 'census_acs'
  | 'school_data'
  | 'school_enrollment_data'
  | 'comparable_products'
  | 'retail_observation'
  | 'stakeholder_feedback'
  | 'phoenix_nest_stakeholder'
  | 'techtown_popup_feedback'
  | 'preorder_test'
  | 'custom'

export type MarketFitEvidenceStatus =
  | 'needed'
  | 'in_progress'
  | 'found'
  | 'not_available'

export interface MarketFitProductFacts {
  productName?: string
  productCategory?: string
  price?: number | null
  qualityLevel?: MarketFitQualityLevel
  madeInStory?: string
  brandStory?: string
  styleDirection?: string
  channel?: string
  productionLimit?: number | null
  notes?: string
}

// PRIZM-inspired segment enum dimensions (V1 Universal Segment
// Framework). PRIZM is a third-party segmentation system; we use the
// vocabulary as inspiration only — Renni Command Center never imports
// licensed PRIZM data, never integrates Claritas APIs, and never
// claims any segment template is an official Claritas segment.
//
// All enums end with `'unknown'` (and `''`) so legacy segments that
// don't carry the new structured fields still render and save without
// the form forcing a value.
export type SegmentLifeStage =
  | 'teen'
  | 'college-age'
  | 'young-adult'
  | 'parent-guardian'
  | 'established-adult'
  | 'empty-nester'
  | 'retiree'
  | 'mixed'
  | ''

export type SegmentIncomeBracket =
  | 'under-35k'
  | '35k-60k'
  | '60k-100k'
  | '100k-150k'
  | '150k-plus'
  | 'unknown'
  | ''

export type SegmentGeography =
  | 'school-community'
  | 'detroit'
  | 'inner-ring-suburb'
  | 'outer-metro'
  | 'out-of-town-supporter'
  | 'online'
  | 'event-visitor'
  | 'unknown'
  | ''

export type SegmentUrbanicity =
  | 'urban'
  | 'inner-ring-suburban'
  | 'suburban'
  | 'small-town-rural'
  | 'mixed'
  | 'unknown'
  | ''

export type SegmentSpendingPower =
  | 'constrained'
  | 'moderate'
  | 'comfortable'
  | 'premium-discretionary'
  | 'unknown'
  | ''

export type SegmentBuyingBehavior =
  | 'impulse'
  | 'planned'
  | 'preorder'
  | 'gift'
  | 'collector'
  | 'value-shopper'
  | 'supporter'
  | 'repeat-everyday'
  | 'unknown'
  | ''

export type SegmentEvidenceConfidence = 'low' | 'medium' | 'high' | ''

export type SegmentExternalReferenceSystem =
  | 'PRIZM-inspired'
  | 'ACS/Census'
  | 'Other'
  | ''

export interface SegmentExternalReference {
  system?: SegmentExternalReferenceSystem
  segmentName?: string
  geography?: string
  sourceUrl?: string
  notes?: string
}

// Customer profile fields layered on top of a segment. Renaissance
// students can add a profile name (e.g. "Civic Premium Buyer") plus
// the supporting context — age, income context, geography, motivation
// — that turns a raw segment into something researchable. All
// optional so old segments without a profile still render. The
// nested object intentionally avoids any "primary profile" boolean;
// the team argues fit through the existing segment signals + the
// product positioning summary.
//
// V1.x Universal Segment Framework added the PRIZM-inspired
// structured fields below the original free-text fields. The
// free-text fields stay so old saved profiles render unchanged AND
// so the team can add narrative annotation alongside the structured
// enums. priceSensitivity (MarketFitSignal) and validationStep
// already cover what the new framework would have called
// SegmentPriceSensitivity / validationStep — we reuse them rather
// than create duplicate fields.
export interface MarketFitCustomerProfile {
  profileName?: string
  ageRange?: string
  incomeRange?: string
  geographyContext?: string
  urbanSuburbanContext?: string
  lifestyleContext?: string
  motivation?: string
  priceSensitivity?: MarketFitSignal
  values?: string
  likelyChannel?: string
  evidenceNeeded?: string
  risk?: string
  validationStep?: string
  // V1 PRIZM-inspired structured fields. Additive only — every legacy
  // saved profile still renders without these set.
  relationshipRole?: string
  lifeStage?: SegmentLifeStage
  incomeBracket?: SegmentIncomeBracket
  geography?: SegmentGeography
  urbanicity?: SegmentUrbanicity
  spendingPower?: SegmentSpendingPower
  buyingBehavior?: SegmentBuyingBehavior
  lifestyleValues?: string
  motivations?: string
  likelyObjections?: string
  channelFit?: string
  productUseCase?: string
  evidenceSources?: string
  evidenceConfidence?: SegmentEvidenceConfidence
  externalReference?: SegmentExternalReference
}

export interface MarketFitSegment {
  id: string
  name: string
  segmentType?: MarketFitSegmentType
  whyItMightFit?: string
  priceFit?: MarketFitSignal
  storyFit?: MarketFitSignal
  reachability?: MarketFitSignal
  willingnessToPay?: MarketFitSignal
  evidenceStrength?: MarketFitSignal
  reachableAudience?: number | null
  interestRatePct?: number | null
  conversionRatePct?: number | null
  evidenceSource?: string
  risk?: string
  nextValidationStep?: string
  roleInStrategy?: MarketFitSegmentRole
  // Optional Customer Profile add-on. Old segments without it render
  // exactly as before; new authoring surfaces an inline editor.
  profile?: MarketFitCustomerProfile
}

// Why a comparable matters. A sweatshirt isn't automatically a
// useful comp because it's a sweatshirt — students mark which
// dimensions actually align so the deterministic feedback engine
// can describe what the comp proves and what it does not.
export interface MarketFitCompTypeFlags {
  product?: boolean
  price?: boolean
  quality?: boolean
  story?: boolean
  customer?: boolean
  channel?: boolean
  style?: boolean
  localMade?: boolean
}

export type MarketFitCompAlignment = 'strong' | 'partial' | 'weak' | 'unsure' | ''

export interface MarketFitComparable {
  id: string
  brandOrProduct: string
  price?: number | null
  qualityNotes?: string
  styleNotes?: string
  targetCustomer?: string
  salesChannel?: string
  similarity?: string
  difference?: string
  lessonForRenni?: string
  source?: string
  // Comp alignment metadata — drives the deterministic feedback line.
  compTypes?: MarketFitCompTypeFlags
  compAlignment?: MarketFitCompAlignment
}

export interface MarketFitEvidenceRequest {
  id: string
  question: string
  whyItMatters?: string
  suggestedSourceType?: MarketFitEvidenceSourceType
  assignedToRole?: string
  status?: MarketFitEvidenceStatus
  notes?: string
  // Source Coach prompts — optional textareas the editor seeds when a
  // source category is picked. Stay free-text so students can edit.
  questionAnswered?: string
  whenToUse?: string
  whatToRecord?: string
  claimConnection?: string
}

export interface MarketFitScenarioAssumptions {
  selectedSegmentId?: string | null
  conservativeInterestRatePct?: number | null
  conservativeConversionRatePct?: number | null
  baseInterestRatePct?: number | null
  baseConversionRatePct?: number | null
  ambitiousInterestRatePct?: number | null
  ambitiousConversionRatePct?: number | null
}

export interface MarketFitRecommendation {
  likelyPrimaryMarket?: string
  likelySecondaryMarket?: string
  launchOrValidationMarket?: string
  positioningSummary?: string
  strongestEvidence?: string
  weakestAssumption?: string
  recommendedNextValidation?: string
}

export interface MarketFitBuilder {
  productFacts?: MarketFitProductFacts
  segments?: MarketFitSegment[]
  comparables?: MarketFitComparable[]
  evidenceRequests?: MarketFitEvidenceRequest[]
  scenarioAssumptions?: MarketFitScenarioAssumptions
  recommendation?: MarketFitRecommendation
  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
  updatedByEmail?: string | null
}

// Brand Fit Builder V1 — section-level decision tool that connects
// brand identity choices to market signals. Stored alongside marketFit
// on DeliverableOutputSection; co-exists with everything that came
// before. Renaissance students use it to argue that fonts, colors,
// logos, voice, and production methods *agree* with the price point
// and target customer the team is claiming. Pure additive — never
// gates submit, never affects Playbook readiness, never writes back
// to the pricing engine.
export type BrandFitQualityLevel =
  | 'budget'
  | 'standard'
  | 'premium'
  | 'luxury'
  | ''

export type BrandFitRole =
  | 'parent'
  | 'apparel_goods'
  | 'candles'
  | 'jewelry'
  | 'baked_goods'
  | 'other'
  | ''

export type BrandFitAlignment = 'strong' | 'partial' | 'weak' | 'unsure' | ''

export type BrandFitRiskLevel = 'low' | 'medium' | 'high' | ''

export type BrandFitProductionUseCase =
  | 'embroidery'
  | 'screen_print'
  | 'patch'
  | 'hang_tag'
  | 'packaging'
  | 'signage'
  | 'social'
  | 'pitch_deck'
  | 'other'

export type BrandFitFeedbackMethod =
  | 'survey'
  | 'interview'
  | 'side_by_side_test'
  | 'social_poll'
  | 'retail_observation'
  | 'custom'
  | ''

export interface BrandFitIntent {
  brandName?: string
  brandRole?: BrandFitRole
  targetCustomer?: string
  targetProfileName?: string
  pricePoint?: string
  qualityLevel?: BrandFitQualityLevel
  targetFeeling?: string
  brandPromise?: string
  primaryChannel?: string
  notes?: string
}

export interface BrandFitVisualIdentity {
  colorPalette?: string
  colorSignal?: string
  fontDirection?: string
  fontSignal?: string
  logoStyle?: string
  logoSignal?: string
  iconSymbolDirection?: string
  photographyMood?: string
  packagingDisplayDirection?: string
  designAdjectives?: string
  stylesToAvoid?: string
}

export interface BrandFitVoice {
  toneWords?: string
  vocabulary?: string
  phrasesToUse?: string
  phrasesToAvoid?: string
  whatBrandNeverSays?: string
  storyAlignmentNotes?: string
}

export interface BrandFitReferenceBrand {
  id: string
  brandOrExample: string
  whatWeLike?: string
  likelyCustomer?: string
  priceQualitySignal?: string
  visualSignal?: string
  voiceSignal?: string
  whatNotToCopy?: string
  lessonForRenni?: string
  source?: string
  alignment?: BrandFitAlignment
}

export interface BrandFitAudiencePerception {
  whoItAttracts?: string
  whoItMayTurnAway?: string
  perceivedPrice?: string
  perceivedQuality?: string
  perceivedAgeRange?: string
  perceivedIncomeContext?: string
  urbanSuburbanSignal?: string
  schoolMerchVsPremiumSignal?: string
  targetMatch?: BrandFitAlignment
  mismatchRisk?: string
}

export interface BrandFitProductionCheck {
  id: string
  useCase: BrandFitProductionUseCase
  concern?: string
  riskLevel?: BrandFitRiskLevel
  adjustment?: string
}

export interface BrandFitValidationPlan {
  testAudience?: string
  questionToAnswer?: string
  feedbackMethod?: BrandFitFeedbackMethod
  sampleSizeGoal?: number | null
  whatToRecord?: string
  successSignal?: string
  nextStep?: string
}

export interface BrandFitRecommendation {
  brandSignalSummary?: string
  strongestAlignment?: string
  weakestMismatch?: string
  recommendedAdjustment?: string
  validationStep?: string
}

export interface BrandFitBuilder {
  brandIntent?: BrandFitIntent
  visualIdentity?: BrandFitVisualIdentity
  voice?: BrandFitVoice
  referenceBrands?: BrandFitReferenceBrand[]
  audiencePerception?: BrandFitAudiencePerception
  productionChecks?: BrandFitProductionCheck[]
  validationPlan?: BrandFitValidationPlan
  recommendation?: BrandFitRecommendation
  // Optional brand signal chips ("premium", "school-spirit", etc.).
  // Free-form list — the builder seeds a curated chip palette but
  // students can save any subset. Drives the signal-tradeoff coach
  // notes and feeds the deterministic summary alongside designAdjectives.
  brandSignals?: string[]
  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
  updatedByEmail?: string | null
}

// Pricing Strategy Builder V1 — Ch. 8 Section 2 only ("sale-price").
// Deterministic pricing strategy worksheet that connects cost, margin,
// market comps, customer segment, brand positioning, and validation.
// Posture (do not relax in V1):
//   - additive layer on the existing deliverableOutputs document
//   - never gates submit / never gates Playbook readiness
//   - read-only when the deliverable is in_review / approved
//   - Save button writes the whole PricingStrategyBuilder object back
//     via the composable; sibling fields are untouched
//   - never writes to pricingScenarios; never writes to Ch. 7 / Ch. 11
//   - no AI; no automatic market value scraping; no final approval
export type PricingStrategyProductType =
  | 'sweatshirt'
  | 'beanie'
  | 't-shirt'
  | 'baked-good'
  | 'donation'
  | 'other'
  | ''

export type PricingStrategyQualityLevel =
  | 'basic'
  | 'standard'
  | 'premium'
  | 'limited-run'
  | ''

export type PricingStrategyConfidence = 'low' | 'medium' | 'high' | ''

// Comparable evidence about why a price is defensible. V1.1 expanded
// the row to capture not just the comp itself but what the comp *proves*
// and what it does *not* prove — students should be able to argue
// "Detroit-made premium reads at $145 (Shinola)" without us claiming the
// market value is $145. The added fields are all optional so V1 entries
// without them keep rendering.
export type PricingStrategyCompRelevance = 'low' | 'medium' | 'high' | ''

// V1.2 — provenance metadata for a comp row. Pure provenance; never
// changes save behavior or feeds the submit gate. Default for legacy
// rows is 'manual' (or just absent — both render the same).
export type PricingStrategyCompExtractionMethod =
  | 'manual'
  | 'pasted_text'
  | 'url_metadata'
  | 'ai_suggested'
  | ''

export type PricingStrategyCompExtractionConfidence =
  | 'low'
  | 'medium'
  | 'high'
  | ''

export interface PricingStrategyComparable {
  id: string
  name: string
  price: number | null
  source?: string
  notes?: string
  alignment?: string
  // V1.1 — optional comp evidence detail. Render-only; never fetched
  // server-side, never used to scrape product data.
  url?: string
  sourceName?: string
  sourceDate?: string
  productType?: string
  qualityTier?: string
  relevance?: PricingStrategyCompRelevance
  proves?: string
  doesNotProve?: string
  // V1.2 — provenance for rows created via the Comp Source Assistant.
  // Optional and additive; legacy rows render unchanged. Display-only;
  // does not affect submit or readiness.
  extractionMethod?: PricingStrategyCompExtractionMethod
  extractionConfidence?: PricingStrategyCompExtractionConfidence
  reviewedByStudent?: boolean
  reviewedAt?: IsoTimestamp | null
}

export interface PricingStrategyPriceTest {
  id: string
  price: number | null
  expectedUnitsSold?: number | null
  notes?: string
}

export interface PricingStrategyBuilder {
  // Optional reference to a /pricing scenario for traceability only.
  // The builder NEVER writes to pricingScenarios; this id is read-only
  // metadata so the team can name which scenario this strategy informs.
  linkedPricingScenarioId?: string | null

  productName?: string
  productType?: PricingStrategyProductType
  qualityLevel?: PricingStrategyQualityLevel
  productionStory?: string
  materialNotes?: string
  packagingNotes?: string
  brandStoryNotes?: string
  targetSegment?: string
  positioningMode?: string

  baseProductCost?: number | null
  decorationCost?: number | null
  laborCost?: number | null
  packagingCost?: number | null
  transactionFee?: number | null
  otherUnitCost?: number | null
  fixedCosts?: number | null
  expectedUnitsSold?: number | null

  proposedPrice?: number | null
  desiredGrossMarginPct?: number | null

  comparablePrices?: PricingStrategyComparable[]
  priceTests?: PricingStrategyPriceTest[]

  confidence?: PricingStrategyConfidence
  validationStep?: string

  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
  updatedByEmail?: string | null
}

export interface DeliverableOutputSection {
  sectionId: string
  sectionTitleSnapshot: string
  sourceNotes: string
  draftText: string
  finalText: string
  evidenceLinks: DeliverableEvidenceLink[]
  // Optional structured evidence entries that defend the section's
  // claims with source / assumption / confidence / risk metadata.
  structuredEvidence?: StructuredEvidenceEntry[]
  // Optional Market Builder entries — demand estimates with scenarios.
  // Old output docs without this field render fine; we never migrate.
  marketBuilderEntries?: MarketBuilderEntry[]
  // Optional Market Fit Builder — broader segment-comparison tool that
  // helps decide *which* market to target. Co-exists with
  // marketBuilderEntries; either, both, or neither may be present.
  marketFit?: MarketFitBuilder
  // Optional Brand Fit Builder — section-level identity-vs-market
  // signal tool. Independent of marketFit so a section can have
  // either, both, or neither.
  brandFit?: BrandFitBuilder
  // Optional Pricing Strategy Builder V1 — Ch. 8 Section 2 only.
  // Deterministic pricing decision tool. Co-exists with everything
  // else; never required, never migrates, never affects submit gate
  // or Playbook readiness, never writes to pricingScenarios.
  pricingStrategy?: PricingStrategyBuilder
  status?: DeliverableOutputSectionStatus
  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
  updatedByEmail?: string | null
}

export interface DeliverableOutput {
  id: string
  deliverableId: string
  studioVersion?: string | null
  studioTitleSnapshot?: string | null
  sections: Record<string, DeliverableOutputSection>
  createdAt?: IsoTimestamp | null
  createdByUid?: string | null
  createdByEmail?: string | null
  updatedAt?: IsoTimestamp | null
  updatedByUid?: string | null
  updatedByEmail?: string | null
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
