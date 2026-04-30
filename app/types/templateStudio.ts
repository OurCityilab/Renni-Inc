// Template Studio metadata — curriculum content shipped with the app,
// not stored in Firestore. A studio turns a deliverable's template into
// an interactive workspace that teaches the concept, guides decisions,
// captures required evidence, and links requirements to tasks.
//
// Intentionally separate from Firestore storage so instructors can
// iterate on pedagogy in source control while student output (notes,
// tasks, approvals) stays in Firestore as the source of truth.

import type { Department } from './models'

export type ConnectedOutcome =
  | 'TechTown pop-up'
  | 'Playbook'
  | 'Phoenix Nest pitch'

export interface TemplateStudioSection {
  // Stable, unique-per-studio identifier used as the persistence key for
  // student-authored output (notes / draft / final / evidence). Section
  // titles change as curriculum is refined; ids must not.
  id: string
  title: string
  lesson: string
  example?: string
  studentPrompts: string[]
  requiredInputs?: string[]
  completionCriteria?: string[]
  // Guidance Compression Sprint additions (both optional, both
  // additive). Studios that don't set them get a deterministic
  // fallback derived from `lesson` / `studentPrompts` /
  // `completionCriteria`, so no studio file needs an update for the
  // compressed student view to render correctly.
  //
  //   - whyThisMatters: 1–2 sentence section-level reason a student
  //     should care, narrower than the studio-level whyItMatters.
  //   - actionSummary: one-sentence "What to do" instruction shown
  //     above the writing surface in the compressed view.
  whyThisMatters?: string
  actionSummary?: string
  // Customer Segments QuickStart Sprint addition. Optional metadata
  // that turns a section into a guided plug-and-play scaffolding
  // experience: chip-pick choices → deterministic starter draft →
  // safe write-back to Working Draft. Intentionally narrow in V1:
  // only `customerSegmentBuilder` is supported, and only the Ch. 4
  // Customer Segments section opts in. The shape can grow as new
  // chip-pick variants are needed; we deliberately do not generalize
  // to a giant universal form engine until real student testing on
  // this first variant says it's worth it.
  //
  // Renamed from `guidedQuickStart` to `chipPickQuickStart` in the
  // Architectural Scaffolding sprint to make explicit that this is
  // the LIGHTWEIGHT chip-pick pattern, not the upcoming full
  // Customer Profile Builder pattern. Both will coexist; sections
  // opt into one OR the other.
  chipPickQuickStart?: ChipPickQuickStartConfig
  // Structured Evidence Standard V1 — optional per-section guidance shown
  // next to the structured-evidence editor in the Output Workspace.
  // Authors can leave them blank; the editor falls back to generic copy.
  evidencePrompt?: string
  analysisPrompt?: string
  sourceGuidance?: string[]
  // Market Builder visibility metadata. Market Builder defaults to OFF
  // for any section that doesn't opt in — the editor block was rendering
  // unconditionally before this flag landed, which made it appear in
  // every chapter regardless of whether market sizing was relevant.
  // Sections explicitly enable it and may attach a short coaching line
  // shown above the editor.
  marketBuilder?: {
    enabled: boolean
    guidance?: string
  }
  // Market Fit Builder visibility metadata. Same opt-in pattern as
  // marketBuilder: sections that don't set it default to off so the
  // tool only appears in market/product-fit-relevant sections (Ch 7,
  // 8, 10, 11). Independent of marketBuilder so a section can have
  // one without the other.
  marketFit?: {
    enabled: boolean
    guidance?: string
  }
  // Brand Fit Builder visibility metadata. Same opt-in pattern again:
  // sections default to off so the tool only appears in identity-
  // relevant sections (House Phoenix Brand Story, Supporting Brand
  // Sheets, Pop-up Campaign audience/messaging). Independent of
  // marketFit and marketBuilder.
  brandFit?: {
    enabled: boolean
    guidance?: string
  }
  // Pricing Strategy Builder visibility metadata. Opt-in: sections
  // default to off so the tool only appears in pricing-relevant
  // sections. V1 enables this only on Ch. 8 Section 2 (sale-price).
  // Independent of every other builder.
  pricingStrategy?: {
    enabled: boolean
    guidance?: string
  }
  // Key Activities Builder visibility metadata. Same opt-in pattern.
  // V1 enables this only on Ch. 4 BMC Key Activities — the BMC's
  // repeatable-business framing benefits from a small categorized
  // chip-pick + reasons builder so students don't default to
  // "ship-the-pop-up" tasks. Independent of every other builder.
  keyActivities?: {
    enabled: boolean
    guidance?: string
  }
  // Finance Table Builder visibility metadata. Same opt-in pattern.
  // The `kind` selector picks which finance table the shared
  // FinanceTableBuilder renders for this section:
  //   unit-cost          — Ch. 8 unit-cost: per-product cost rollup.
  //   break-even         — Ch. 7 margin-and-break-even / Ch. 8
  //                        break-even: margin + break-even units.
  //   revenue-scenarios  — Ch. 8 revenue-scenarios: low/target/stretch.
  //   donation-scenarios — Ch. 8 donation-scenarios: donor count × gift.
  //   kpi                — Ch. 8 key-financial-kpis: KPI definitions.
  // Local component state, copy-only output. No Firestore writes.
  financeTable?: {
    enabled: boolean
    kind:
      | 'unit-cost'
      | 'break-even'
      | 'revenue-scenarios'
      | 'donation-scenarios'
      | 'kpi'
      // BMC Finance Table Cleanup additions. Both are taxonomy-first
      // (text + select columns; no calc fields) and were added so the
      // Ch. 4 BMC revenue-streams and cost-structure sections render
      // structured tables instead of prose-only inputs.
      | 'revenue-streams'
      | 'cost-structure'
    guidance?: string
  }
  // Universal builder configs (Pass A — Universal Builder Foundation Pack).
  // Three reusable copy-only builders that cover most table /
  // checklist / decision-memo sections without forcing per-section
  // bespoke components. Local-state only; no Firestore writes; no
  // automatic Working-Draft writes; no save handler. Each builder
  // surfaces a "Copy as markdown" button for the standard handoff:
  // build → copy → paste → edit → add evidence → save → submit.
  //
  // Sections without these configs render exactly as they do today.
  // When an existing primary builder (financeTable / operationsChecklist
  // / chipPickQuickStart / keyActivities / marketFit / brandFit /
  // pricingStrategy) is enabled on the same section, the workspace
  // does NOT mount the universal builder — the existing primary
  // wins to prevent duplicate / conflicting surfaces.
  universalTable?: UniversalTableBuilderConfig
  universalChecklist?: UniversalChecklistBuilderConfig
  decisionMemo?: DecisionMemoBuilderConfig
  // Pass B specialized builders. Each one is treated as a PRIMARY
  // surface for its section: when enabled, the workspace
  // suppresses any Pass A universal builder on the same section so
  // the chief-facing layout never doubles up. Existing saved-state
  // builders (BrandFit / MarketFit / PricingStrategy) still take
  // precedence; sections that already render a saved-state primary
  // are NOT opted into the specialized builders in V1.
  brandSystem?: BrandSystemBuilderConfig
  retailPitch?: RetailPitchBuilderConfig
  strategyMemo?: StrategyMemoBuilderConfig
  // Corporate Structure / Equity Builder. Educational + planning-
  // oriented only; the workspace and the underlying component MUST
  // surface the "draft educational model — instructor/adult/legal
  // review required before any real-world use" disclaimer on every
  // render. This builder is treated as a primary surface; when
  // enabled, Pass A universal builders are suppressed on the same
  // section.
  corporateStructure?: CorporateStructureBuilderConfig
  // Operations Checklist / SOP Builder visibility metadata. Same
  // opt-in pattern. The `kind` selector picks which checklist /
  // SOP shape the shared OperationsChecklistBuilder renders:
  //   inventory       — Ch. 9 inventory: item · quantity · location ·
  //                     owner · issue · packed?
  //   day-of-sop      — Ch. 9 day-of-sop: time · step · owner ·
  //                     materials · done signal · backup.
  //   baked-goods-sop — Ch. 9 baked-goods-sop: step · food safety
  //                     concern · owner · materials · done signal ·
  //                     backup. Carries the "not legal food-safety
  //                     advice" student-facing warning.
  //   continuity      — Ch. 9 continuity: item / process · status ·
  //                     owner · link · warning · next step.
  // Local component state, copy-only output. No Firestore writes.
  operationsChecklist?: {
    enabled: boolean
    kind: 'inventory' | 'day-of-sop' | 'baked-goods-sop' | 'continuity'
    guidance?: string
  }
  // Expert Chapter Guidance (Sprint — Expert Guidance). Optional
  // additive metadata that lifts a section from "static template"
  // to "guided by a field expert." Curriculum content only — no
  // Firestore impact, no submit gate, no Playbook readiness change.
  // Renders via ExpertGuidanceCard inside the section workspace
  // alongside the existing SectionGuidanceSummary.
  expertGuidance?: ExpertGuidance
}

// Universal builder field types — Pass A.
//
// Three optional configs on TemplateStudioSection (universalTable,
// universalChecklist, decisionMemo) drive three reusable copy-only
// builders. Each renders a structured surface, ships a markdown
// copy, and lets the student paste into Working Draft. None save
// to Firestore.

export type CopyOnlyBuilderFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'textarea'

export interface CopyOnlyBuilderColumn {
  /** Field key on the row object. */
  key: string
  /** Visible label. */
  label: string
  type: CopyOnlyBuilderFieldType
  /** Options for select columns. */
  options?: string[]
  placeholder?: string
  /** Whether the column should span two grid columns on the row
   *  editor (used for free-text columns like assumption / source). */
  wide?: boolean
  /** When true and the parent passes `productOptions`, the column's
   *  text input renders an HTML5 `<datalist>` autocomplete sourced
   *  from the Renni Inc. product catalog. The input remains free
   *  text — autocomplete only suggests. */
  productAutocomplete?: boolean
}

export interface UniversalTableBuilderConfig {
  enabled: boolean
  /** Stable string used in copy headers and analytics. */
  kind: string
  title: string
  intro?: string
  columns: CopyOnlyBuilderColumn[]
  /** Pre-populated rows. Each row is a map of column-key → string
   *  value. The builder mounts these into local state on first
   *  render. */
  starterRows?: Array<Record<string, string>>
  /** When `starterRows` is omitted, this many empty rows are seeded. */
  starterRowCount?: number
  /** Header label for the markdown copy block. */
  copyTitle?: string
  /** Optional one-line evidence reminder shown above the editor. */
  evidencePrompt?: string
}

export interface UniversalChecklistBuilderRow {
  label: string
  owner?: string
  due?: string
  status?: 'Not started' | 'In progress' | 'Ready' | 'Blocked'
  materials?: string
  backup?: string
  doneSignal?: string
  risk?: string
  nextStep?: string
}

export type UniversalChecklistBuilderField =
  | 'owner'
  | 'due'
  | 'status'
  | 'materials'
  | 'backup'
  | 'doneSignal'
  | 'risk'
  | 'nextStep'

export interface UniversalChecklistBuilderConfig {
  enabled: boolean
  kind: string
  title: string
  intro?: string
  /** Pre-populated rows. The builder mounts these into local state. */
  rows?: UniversalChecklistBuilderRow[]
  /** Optional explicit field list. When omitted, the builder shows
   *  every supported field column. */
  fields?: UniversalChecklistBuilderField[]
  copyTitle?: string
}

export interface DecisionMemoBuilderCard {
  decision?: string
  options?: string
  evidence?: string
  criteria?: string
  recommendation?: string
  risk?: string
  owner?: string
  dueDate?: string
  definitionOfDone?: string
}

export interface DecisionMemoBuilderConfig {
  enabled: boolean
  kind: string
  title: string
  intro?: string
  /** Pre-populated cards. The builder mounts these into local state. */
  starterCards?: DecisionMemoBuilderCard[]
  /** When `starterCards` is omitted, this many empty cards are seeded. */
  cardCount?: number
  copyTitle?: string
}

// Pass B — specialized builder configs.
//
// Each one is local-state copy-only (same posture as Pass A
// universal builders): no Firestore writes, no AI calls, no save
// handler, no automatic Working-Draft mutation. The workspace
// treats them as primary surfaces — when one is enabled on a
// section, the matching Pass A universal builder is suppressed.

export interface BrandSystemBuilderStarterCard {
  label?: string
  audience?: string
  promise?: string
  voiceTrait?: string
  doRule?: string
  dontRule?: string
  sampleCopy?: string
  visualRule?: string
  proof?: string
}

export interface BrandSystemBuilderConfig {
  enabled: boolean
  kind: 'house-phoenix' | 'supporting-brand' | 'cross-brand'
  title: string
  intro?: string
  // Per-field opt-in. Omitted means "do not render that field on
  // any card." A studio that wants the full picker enables every
  // flag explicitly.
  audience?: boolean
  promise?: boolean
  voiceTraits?: boolean
  visualRules?: boolean
  proofPoints?: boolean
  copyExamples?: boolean
  doDontRules?: boolean
  starterCards?: BrandSystemBuilderStarterCard[]
  copyTitle?: string
}

export interface RetailPitchBuilderStarterCard {
  buyer?: string
  productSku?: string
  shelfFit?: string
  priceMargin?: string
  proof?: string
  readiness?: string
  ask?: string
  risk?: string
  nextStep?: string
}

export interface RetailPitchBuilderConfig {
  enabled: boolean
  kind: 'identity' | 'evidence' | 'offer' | 'ask' | 'recommendation'
  title: string
  intro?: string
  includeBuyer?: boolean
  includeProductSku?: boolean
  includeShelfFit?: boolean
  includePriceMargin?: boolean
  includeProof?: boolean
  includeReadiness?: boolean
  includeAsk?: boolean
  includeRisk?: boolean
  includeNextStep?: boolean
  starterCards?: RetailPitchBuilderStarterCard[]
  copyTitle?: string
}

export type StrategyMemoBuilderField =
  | 'insight'
  | 'evidence'
  | 'recommendation'
  | 'owner'
  | 'dueDate'
  | 'dependency'
  | 'definitionOfDone'
  | 'nextValidation'
  | 'risk'

export interface StrategyMemoBuilderStarterCard {
  insight?: string
  evidence?: string
  recommendation?: string
  owner?: string
  dueDate?: string
  dependency?: string
  definitionOfDone?: string
  nextValidation?: string
  risk?: string
}

export interface StrategyMemoBuilderConfig {
  enabled: boolean
  kind: 'lesson' | 'insight' | 'priority' | 'action-plan' | 'first-30-days'
  title: string
  intro?: string
  cardCount?: number
  fields: StrategyMemoBuilderField[]
  starterCards?: StrategyMemoBuilderStarterCard[]
  copyTitle?: string
}

// Corporate Structure / Equity Builder — educational + planning
// only. Under no circumstances is this builder, its config, or its
// output a legal cap table, an equity grant, or legal / tax /
// securities / investment / accounting advice. The component
// renders a non-removable safety disclaimer on every view; the
// workspace is REQUIRED to keep that disclaimer visible.

export interface CorporateStructureEntityTypeOption {
  id: string
  label: string
  /** Plain-English description of what the entity type generally
   *  is. Educational only. */
  educationalExplanation: string
  /** Common tradeoffs students should think through. Each entry is
   *  a short string, not legal language. */
  commonTradeoffs: string[]
  /** Questions the team should bring to the instructor / adult /
   *  legal reviewer. Drives the unresolved-question list. */
  adultReviewQuestions: string[]
}

export interface CorporateStructureBuilderConfig {
  enabled: boolean
  title: string
  intro?: string
  /** The 70/30 default lives here so the picker can show it on
   *  first render. Students may edit the percentages locally; the
   *  builder warns when they don't sum to 100%. */
  ownershipModel: {
    nonprofitSharePercentDefault: number
    studentSharePercentDefault: number
    /** When true, the UI exposes editable percentages with a
     *  "must total 100%" guard. When false, the percentages are
     *  read-only and only the 70/30 model renders. */
    allowCustomScenario: boolean
  }
  vesting: {
    enabledDefault: boolean
    scheduleOptions: string[]
    exitRulePrompts: string[]
  }
  entityTypeOptions: CorporateStructureEntityTypeOption[]
  dividendPolicyPrompts: string[]
  votingRightsPrompts: string[]
  graduationRulePrompts: string[]
  unresolvedLegalQuestionPrompts: string[]
  /** Always true. Kept on the type for documentation; the
   *  component never lets this be false. */
  adultReviewRequired: true
  copyTitle?: string
}

// ChipPickQuickStartConfig — Customer Segments QuickStart Sprint.
//
// Narrow-by-design V1 scaffolding metadata. The shape supports the
// Customer Segments use case (chip-pick segments → needs → importance →
// evidence → deterministic starter draft) without committing to a
// universal form engine across all 99 requirements. Future sections
// that opt in can add their own chip-pick sub-config without breaking
// existing studios because every field is optional and the renderer
// only fires when `enabled` is true and the matching builder config
// is present.
//
// Renamed from `GuidedQuickStartConfig` in the Architectural
// Scaffolding sprint to make explicit this is the lightweight
// chip-pick pattern, not the forthcoming Customer Profile Builder.
//
// Posture (do not relax in V1):
//   - never required: every studio without `chipPickQuickStart` renders
//     exactly as before
//   - never auto-saves: the QuickStart only emits a payload; the
//     parent workspace decides when to assign and dirty-flag
//   - never overwrites Final Playbook text by default; the student
//     must explicitly target Working Draft (`draftText`) or Team
//     Thinking (`sourceNotes`)
//   - never invokes AI; draft generation is a deterministic template
//     with bracketed placeholders the student must fill in
//   - never gates submit, status, approval, or Playbook readiness
export interface ChipPickQuickStartConfig {
  enabled: boolean
  // Section-level mission / framing copy. Kept short so the surface
  // stays calm, not gamified.
  title: string
  missionLabel?: string
  description?: string
  // Where the generated starter draft lands by default. The student
  // can still target Team Thinking via a secondary action. We do
  // NOT default to `finalText` — final Playbook text remains the
  // publishable student-owned version per the brief.
  draftTarget?: 'sourceNotes' | 'draftText'
  // First QuickStart variant: customer-segment composer. Other
  // variants can be added as siblings as new sections opt in.
  customerSegmentBuilder?: {
    // Picklist of suggested customer groups. Students can also enter
    // a custom group via the "Custom" affordance in the UI; this
    // metadata only seeds the chip palette.
    segmentOptions: string[]
    // What each group might need. Custom entry also allowed.
    needOptions: string[]
    // Why the group matters (which downstream output it serves).
    importanceOptions: string[]
    // Evidence / proof tier. The renderer triggers a non-blocking
    // confidence warning when the student picks an "assumption only"
    // variant of these strings.
    evidenceOptions: string[]
  }
}

export interface ExpertGuidance {
  // Who would normally critique this section in a real company.
  // Pure copy ("retail operator", "CFO", "brand strategist"); no
  // role enum so studios stay flexible.
  expertRole?: string
  // Plain-English why-this-matters paragraph from the expert's
  // perspective. Different from section.lesson — that explains
  // what to do; this explains why a real company would care.
  whyThisMatters?: string
  // Concrete inputs / facts a student should collect before they
  // can write a strong answer.
  whatToGather?: string[]
  // Where to look for those inputs (existing app surfaces, vendor
  // docs, real-world sources). Avoids "go research" hand-waving.
  whereToFindIt?: string[]
  // What a generic / shallow answer would look like.
  weakAnswerLooksLike?: string
  // What a defensible / strong answer would prove.
  strongAnswerLooksLike?: string
  // 1–4 questions an expert would ask if the team handed this
  // section to them today.
  expertPushback?: string[]
  // Mistakes the curriculum has seen across cohorts.
  commonMistakes?: string[]
  // The downstream decision this section actually supports.
  decisionSupported?: string
  // Other chapters / surfaces this section feeds.
  connectsTo?: string[]
  // Free-form hint about which chief should drive the work.
  // Display-only; never overrides ownership semantics elsewhere.
  ownerHint?: string
  // What the section reads like when it is genuinely complete —
  // not just submit-eligible.
  doneLooksLike?: string
  // Optional copy-only LLM prompt students can paste into Claude /
  // ChatGPT. Renni Command Center never sends this anywhere.
  // When omitted the card auto-builds one from the other fields.
  aiCoachPrompt?: string
}

export interface TemplateStudioRequirement {
  id: string
  label: string
  description: string
  requiredForApproval: boolean
  department?: Department | null
  playbookChapter?: number | null
  evidenceType?: string
  suggestedTaskTitle?: string
  definitionOfDone?: string
  // Optional explicit pointer to the section a task created from this
  // requirement should deep-link to. When unset, the deep-link helper
  // (utils/requirementToSection.ts) falls back to a tokenized
  // overlap heuristic across the studio's sections. Setting this is
  // a low-risk override for cases where the heuristic chooses a
  // related-but-not-quite-right section.
  sectionId?: string
}

export interface TemplateStudioTask {
  title: string
  department?: Department | null
  ownerRole?: string
  requirementId?: string
  dependency?: string
  definitionOfDone?: string
  dueOffsetDays?: number
}

export interface TemplateStudioEvidence {
  id: string
  label: string
  description: string
  required: boolean
}

export interface TemplateStudioAiGuidance {
  allowedHelp: string[]
  disallowedHelp: string[]
  studentMustProvideSourceNotes: boolean
  approvalGuardrail: string
}

export interface TemplateStudio {
  title: string
  purpose: string
  learningObjective: string
  whyItMatters: string
  finalOutput: string
  connectedOutcome: ConnectedOutcome
  sections: TemplateStudioSection[]
  requirements: TemplateStudioRequirement[]
  suggestedTasks: TemplateStudioTask[]
  requiredEvidence: TemplateStudioEvidence[]
  aiGuidance?: TemplateStudioAiGuidance
  version?: string
}
