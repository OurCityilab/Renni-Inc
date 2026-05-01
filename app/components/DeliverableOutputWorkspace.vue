<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  useDeliverableOutputs,
  sectionLockIsExpired,
  sectionLockIsOwnedBy,
  SECTION_LOCK_REFRESH_MS,
  SECTION_LOCK_TTL_MS,
  type NewEvidenceLinkInput,
  type NewMarketBuilderInput,
  type NewStructuredEvidenceInput,
  type SectionSavePayload
} from '~/composables/useDeliverableOutputs'
import type {
  BrandFitBuilder as BrandFitBuilderState,
  Deliverable,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputBuilderState,
  DeliverableOutputSection,
  DeliverableOutputSectionStatus,
  EvidenceConfidence,
  EvidenceLinkType,
  MarketBuilderEntry,
  MarketBuilderScenario,
  MarketFitBuilder as MarketFitBuilderState,
  MarketFitSegment,
  MarketScenarioLevel,
  PricingStrategyBuilder as PricingStrategyBuilderState,
  SectionLock,
  StructuredEvidenceEntry
} from '~/types/models'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import {
  SCENARIO_LABEL_COPY,
  confidenceTone,
  deriveBuyers,
  deriveRevenue,
  fmtCurrency,
  fmtNumber
} from '~/utils/marketBuilderMath'
import MarketEvidenceReferencePanel, {
  type ReferencedMarketEntry
} from '~/components/MarketEvidenceReferencePanel.vue'
import MarketEvidenceCritiquePanel from '~/components/MarketEvidenceCritiquePanel.vue'
import SectionGuidanceSummary from '~/components/SectionGuidanceSummary.vue'
import ExpertGuidanceCard from '~/components/ExpertGuidanceCard.vue'
import PlaybookWritingScaffold from '~/components/PlaybookWritingScaffold.vue'
import HelpMeUnderstand from '~/components/HelpMeUnderstand.vue'
import ChipPickQuickStart from '~/components/ChipPickQuickStart.vue'
import CustomerProfileBuilder from '~/components/CustomerProfileBuilder.vue'
import CustomerArchetypePicker from '~/components/CustomerArchetypePicker.vue'
import KeyActivitiesBuilder from '~/components/KeyActivitiesBuilder.vue'
import FinanceTableBuilder from '~/components/FinanceTableBuilder.vue'
import OperationsChecklistBuilder from '~/components/OperationsChecklistBuilder.vue'
import UniversalSectionTableBuilder from '~/components/UniversalSectionTableBuilder.vue'
import UniversalChecklistBuilder from '~/components/UniversalChecklistBuilder.vue'
import DecisionMemoBuilder from '~/components/DecisionMemoBuilder.vue'
import BrandSystemBuilder from '~/components/BrandSystemBuilder.vue'
import RetailPitchBuilder from '~/components/RetailPitchBuilder.vue'
import StrategyMemoBuilder from '~/components/StrategyMemoBuilder.vue'
import CorporateStructureBuilder from '~/components/CorporateStructureBuilder.vue'
import SectionDependencyHint from '~/components/SectionDependencyHint.vue'
import { getSectionDependencyHints } from '~/utils/sectionDependencyHints'
import CrossChapterReferencePanel from '~/components/CrossChapterReferencePanel.vue'
import ModelAnswerCard from '~/components/ModelAnswerCard.vue'
import GlossaryChips from '~/components/GlossaryChips.vue'
import { productNameOptions } from '~/utils/productCatalog'
import MarketFitBuilder from '~/components/MarketFitBuilder.vue'
import MarketFitReferencePanel, {
  type ReferencedMarketFitRow
} from '~/components/MarketFitReferencePanel.vue'
import BrandFitBuilder from '~/components/BrandFitBuilder.vue'
import PricingStrategyBuilder from '~/components/PricingStrategyBuilder.vue'
import {
  getSectionWarnings,
  isHighRigorChapter,
  type SectionMismatchWarning
} from '~/utils/sectionMismatch'
import { effectiveActionSummary } from '~/utils/sectionGuidance'
import {
  buildBrandFitSnapshot,
  type BrandFitSnapshot
} from '~/utils/brandFitNarrative'
import {
  buildDemandSnapshot,
  buildDemandToRevenueNarrative,
  buildPhoenixNestCarrySummary,
  findStrongestCompType,
  type DemandSnapshot,
  type PhoenixNestCarrySummary
} from '~/utils/marketFitNarrative'
import type {
  AiCritiqueRequirementInput,
  MarketEvidenceCritiqueRequest
} from '~/types/aiCritique'

const props = defineProps<{
  deliverable: Deliverable
  studio: TemplateStudio
  // Page-level permission check (admin / Co-CEO / COO / owner / dept chief).
  canEdit: boolean
  // When set, render only the matching section's editor and hide the
  // chapter-wide affordances (orientation card, readiness summary,
  // section navigation, Playbook-ready preview). The chapter hub
  // surfaces those separately. Default mode (undefined) is unchanged
  // — every existing caller gets the legacy chapter-wide layout, so
  // a rollback can swap the page back without touching this prop.
  sectionFilterId?: string
}>()

const auth = useAuthStore()
const outputs = useDeliverableOutputs()
const { data: output, loading } = outputs.watchOutput(() => props.deliverable.id)

// Customer Profile Builder beta gate. Default OFF unless the
// runtime config flag is explicitly set. The builder also requires
// the section id to match `customer-segments` (see template). The
// existing chip-pick QuickStart is unaffected by this gate.
const runtimeConfig = useRuntimeConfig()
const customerProfileBuilderEnabled = computed<boolean>(
  () => runtimeConfig.public?.customerProfileBuilderEnabled === true
)

// Shared product-name list from the in-app product catalog. Passed
// to FinanceTableBuilder, MarketFitBuilder, and PricingStrategyBuilder
// so their product-name inputs offer a native HTML5 <datalist>
// autocomplete instead of forcing students to retype "House Phoenix
// Beanie" / "Humble Oven Baked Good" each time. Builders accept the
// list as an optional prop; missing/empty preserves the legacy
// free-text input. Read-only — no save side effects.
const productNameList: string[] = productNameOptions()

// In section-filter mode the chapter hub renders the orientation,
// readiness, navigation, and preview; the workspace only renders the
// per-section editor + cross-chapter reference panels (which stay
// useful while editing). Default = false preserves legacy behavior.
const sectionMode = computed(() => Boolean(props.sectionFilterId))
const visibleSections = computed(() => {
  if (!props.sectionFilterId) return props.studio.sections
  return props.studio.sections.filter((s) => s.id === props.sectionFilterId)
})
// Section header always shows the section's original 1-based index in
// the studio, even in filter mode (so a section that was originally
// #4 in the studio still reads "Section 4" on the section page).
function originalSectionIndex(sectionId: string): number {
  const idx = props.studio.sections.findIndex((s) => s.id === sectionId)
  return idx >= 0 ? idx + 1 : 1
}

// --- Chapter 7 → Chapter 8 demand assumption reference (read-only) ---
// When the workspace is rendering Chapter 8 (Finance and Revenue Model),
// pull the Chapter 7 (Current Product Line and Pricing) output so we
// can show the Market Builder demand entries the team already produced.
// This is a one-way *reference* — Chapter 8 never writes back to
// Chapter 7, never copies values into local state, and never gates
// submit on the presence (or absence) of these entries.
const CH7_DELIVERABLE_ID = 'ch-07-current-product-line-and-pricing'
const CH8_DELIVERABLE_ID = 'ch-08-finance-and-revenue-model'
const CH11_DELIVERABLE_ID = 'ch-11-phoenix-nest-retail-carry-pitch'
const isChapter7 = computed(
  () => props.deliverable.id === CH7_DELIVERABLE_ID
)
const isChapter8 = computed(
  () => props.deliverable.id === CH8_DELIVERABLE_ID
)
const isChapter11 = computed(
  () => props.deliverable.id === CH11_DELIVERABLE_ID
)
// AI Critique V1 is gated to the three market-evidence chapters. The
// section-level marketBuilder flag still has to be set; this computed
// only handles the chapter scope so we can short-circuit cleanly.
const aiCritiqueChapterEligible = computed(
  () => isChapter7.value || isChapter8.value || isChapter11.value
)

// Market Fit Builder V1 — broader segment-comparison tool. Visible
// only on the four high-rigor market/product chapters and only on
// sections that explicitly opt in via studio metadata.
const MARKET_FIT_CHAPTER_IDS = new Set([
  CH7_DELIVERABLE_ID,
  CH8_DELIVERABLE_ID,
  'ch-10-marketing-and-campaign-playbook',
  CH11_DELIVERABLE_ID
])
const isMarketFitChapter = computed(() =>
  MARKET_FIT_CHAPTER_IDS.has(props.deliverable.id)
)
// The watcher returns loading=false / data=null when the id is an
// empty string, so each cross-chapter listener stays a no-op on every
// chapter that doesn't reference it. Chapter 7 is read by both Chapter
// 8 and Chapter 11; Chapter 8 finalText is read by Chapter 11 only.
const { data: ch7Output, loading: ch7Loading } = outputs.watchOutput(() =>
  isChapter8.value || isChapter11.value ? CH7_DELIVERABLE_ID : ''
)
const { data: ch8Output, loading: ch8Loading } = outputs.watchOutput(() =>
  isChapter11.value ? CH8_DELIVERABLE_ID : ''
)
// Flatten Market Builder entries across every Chapter 7 section so the
// panel reads as one product list, not a nested section view. Section
// title comes along so the reference still names where each entry was
// authored. Shape matches the panel component's `ReferencedMarketEntry`
// prop type so we can hand the array straight in.
const ch7MarketEntries = computed<ReferencedMarketEntry[]>(() => {
  if (!ch7Output.value) return []
  const rows: ReferencedMarketEntry[] = []
  for (const section of Object.values(ch7Output.value.sections ?? {})) {
    if (!section?.marketBuilderEntries?.length) continue
    for (const entry of section.marketBuilderEntries) {
      rows.push({
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitleSnapshot || section.sectionId,
        entry
      })
    }
  }
  return rows
})

// Cross-chapter Market Fit reference rows. A section is considered
// "has Market Fit content" only when there's something worth reading
// — at least one segment, comparable, evidence request, a named
// product, or a positioning sentence. Otherwise an empty fit doc
// would render as a noisy empty card.
function flattenMarketFitFromOutput(
  output: DeliverableOutput | null,
  sourceLabel: string
): ReferencedMarketFitRow[] {
  if (!output) return []
  const rows: ReferencedMarketFitRow[] = []
  for (const section of Object.values(output.sections ?? {})) {
    const fit = section?.marketFit
    if (!fit) continue
    const hasContent =
      (fit.segments?.length ?? 0) > 0 ||
      (fit.comparables?.length ?? 0) > 0 ||
      (fit.evidenceRequests?.length ?? 0) > 0 ||
      Boolean(fit.productFacts?.productName?.trim()) ||
      Boolean(fit.recommendation?.positioningSummary?.trim())
    if (!hasContent) continue
    rows.push({
      sourceLabel,
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitleSnapshot || section.sectionId,
      fit
    })
  }
  return rows
}

const ch7MarketFitRows = computed<ReferencedMarketFitRow[]>(() =>
  flattenMarketFitFromOutput(ch7Output.value, 'Chapter 7')
)
const ch8MarketFitRows = computed<ReferencedMarketFitRow[]>(() =>
  flattenMarketFitFromOutput(ch8Output.value, 'Chapter 8')
)
// Concatenated source rows for Ch 11 — Ch 7 product/demand thinking
// plus any Ch 8 revenue-side fit work. Order preserved (Ch 7 first)
// so the carry pitch reads in the upstream → downstream sequence.
const ch11MarketFitRows = computed<ReferencedMarketFitRow[]>(() => [
  ...ch7MarketFitRows.value,
  ...ch8MarketFitRows.value
])

// Pre-compute carry summaries per row so the template doesn't call
// the (deterministic but non-trivial) helper twice on each render.
const ch11CarrySummaries = computed<
  Array<{ row: ReferencedMarketFitRow; summary: PhoenixNestCarrySummary }>
>(() =>
  ch11MarketFitRows.value.map((row) => ({
    row,
    summary: buildPhoenixNestCarrySummary(row.fit)
  }))
)

// Chapter 8 → Chapter 11 finalText status, used by the Ch 11 reference
// panel only. We surface section titles where finalText exists (so a
// Ch 11 author can see which revenue blocks the Ch 8 team has actually
// finalized) and a compact excerpt of the `revenue-scenarios` section
// when present. We never copy or summarize beyond a length-capped
// snippet — the brief explicitly forbids generating new content.
interface Ch8FinalSectionRow {
  sectionId: string
  sectionTitle: string
}
const REVENUE_SCENARIOS_SECTION_ID = 'revenue-scenarios'
const CH8_EXCERPT_MAX_CHARS = 320
const ch8FinalSections = computed<Ch8FinalSectionRow[]>(() => {
  if (!ch8Output.value) return []
  const rows: Ch8FinalSectionRow[] = []
  for (const section of Object.values(ch8Output.value.sections ?? {})) {
    if (!section?.finalText || !section.finalText.trim()) continue
    rows.push({
      sectionId: section.sectionId,
      sectionTitle: section.sectionTitleSnapshot || section.sectionId
    })
  }
  return rows
})
const ch8RevenueScenariosExcerpt = computed<string | null>(() => {
  const section = ch8Output.value?.sections?.[REVENUE_SCENARIOS_SECTION_ID]
  const text = section?.finalText?.trim()
  if (!text) return null
  if (text.length <= CH8_EXCERPT_MAX_CHARS) return text
  return `${text.slice(0, CH8_EXCERPT_MAX_CHARS).trimEnd()}…`
})

// Editing is only the active path while the deliverable is in
// draft/needs_revision. in_review and approved render read-only so
// reviewers see a stable artifact and authors can't quietly mutate
// content under review. Firestore rules match this V1 behavior so the
// lock is enforced server-side, not just by the UI.
const editingEnabled = computed(
  () =>
    props.canEdit &&
    (props.deliverable.status === 'draft' ||
      props.deliverable.status === 'needs_revision')
)

const lockMessage = computed(() => {
  if (props.deliverable.status === 'in_review') {
    return 'This deliverable is in review. Output is read-only until the approver returns it or approves it.'
  }
  if (props.deliverable.status === 'approved') {
    return 'This deliverable is approved. Output is preserved as the final Playbook artifact.'
  }
  if (!props.canEdit) {
    return 'You can read this output. Editing is limited to the owner, the department chief, Co-CEOs, the COO, and the program lead.'
  }
  return ''
})

// Lazy-create the output doc the first time an authorized editor opens
// the workspace. Idempotent — does nothing if the doc already exists.
const provisioningError = ref<string | null>(null)
async function ensureOutputDoc() {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  if (output.value) return
  if (loading.value) return
  try {
    await outputs.createOutputIfMissing(props.deliverable.id, props.studio, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
  } catch (e) {
    provisioningError.value = e instanceof Error ? e.message : String(e)
  }
}
watch(
  [output, loading],
  ([o, l]) => {
    if (!l && !o) ensureOutputDoc()
  },
  { immediate: true }
)
onMounted(() => {
  // Cover the case where snapshot resolves before the watch handler
  // gets a chance to run on first load.
  if (!loading.value && !output.value) ensureOutputDoc()
})

// --- per-section local drafts. Each section keeps its own dirty buffer
// so saving one section never drops in-progress edits in another.
interface LocalDraft {
  sourceNotes: string
  draftText: string
  finalText: string
  status: DeliverableOutputSectionStatus
  builderState: DeliverableOutputBuilderState
}
const drafts = ref<Record<string, LocalDraft>>({})
const dirty = ref<Record<string, boolean>>({})
const savingSectionId = ref<string | null>(null)
const sectionError = ref<Record<string, string>>({})

// --- Independent Student Mode: save confidence + stuck UI -----------
// Per-section "saved at HH:MM" stamp. Set immediately after a
// successful save() so the student sees confirmation. Cleared when
// the section becomes dirty again.
const lastSavedAt = ref<Record<string, string>>({})
// Per-section "show me the next-step hint" flag. Auto-clears so a
// student who saved 10 minutes ago doesn't keep seeing the same
// "Next: add a working draft" line forever; the persisted progress
// chips above still surface the same state.
const recentlySaved = ref<Record<string, boolean>>({})
// Per-section "I'm stuck" panel toggle. Display-only. The panel
// instructs the student to open the linked task and mark it stuck —
// section-level stuckness is not a separate Firestore field, and
// this sprint deliberately keeps the task as the source of truth
// (per the brief: "Keep task-level stuck flow as the actual source
// of truth.").
const stuckPanelOpen = ref<Record<string, boolean>>({})

function fmtSavedTime(): string {
  const d = new Date()
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function persistedSection(s: TemplateStudioSection): DeliverableOutputSection | null {
  return output.value?.sections?.[s.id] ?? null
}

function deriveStatus(d: LocalDraft): DeliverableOutputSectionStatus {
  if (d.status === 'ready') return 'ready'
  const filled =
    d.sourceNotes.trim() !== '' ||
    d.draftText.trim() !== '' ||
    d.finalText.trim() !== '' ||
    rowsHaveContent(d.builderState.universalTable?.rows ?? []) ||
    rowsHaveContent(d.builderState.retailPitch?.rows ?? [])
  return filled ? 'in_progress' : 'empty'
}

type PersistedBuilderKey = 'universalTable' | 'retailPitch'
type BuilderRows = Array<Record<string, string>>

function cloneRows(rows: BuilderRows | undefined): BuilderRows {
  return (rows ?? []).map((row) => ({ ...row }))
}

function cloneBuilderState(
  state: DeliverableOutputBuilderState | undefined
): DeliverableOutputBuilderState {
  return {
    ...(state?.universalTable
      ? { universalTable: { ...state.universalTable, rows: cloneRows(state.universalTable.rows) } }
      : {}),
    ...(state?.retailPitch
      ? { retailPitch: { ...state.retailPitch, rows: cloneRows(state.retailPitch.rows) } }
      : {})
  }
}

function builderRowsFor(
  s: TemplateStudioSection,
  key: PersistedBuilderKey
): BuilderRows {
  const draftRows = drafts.value[s.id]?.builderState?.[key]?.rows
  if (draftRows && draftRows.length) return cloneRows(draftRows)
  return cloneRows(persistedSection(s)?.builderState?.[key]?.rows)
}

function rowsHaveContent(rows: BuilderRows): boolean {
  return rows.some((row) =>
    Object.values(row).some((value) => String(value ?? '').trim().length > 0)
  )
}

function updateBuilderRows(
  s: TemplateStudioSection,
  key: PersistedBuilderKey,
  rows: BuilderRows
): void {
  ensureDraft(s)
  const d = drafts.value[s.id]
  if (!d) return
  d.builderState = {
    ...d.builderState,
    [key]: {
      rows: cloneRows(rows),
      updatedAt: new Date().toISOString(),
      updatedByUid: auth.user?.uid ?? null,
      updatedByEmail: auth.profile?.email || auth.user?.email || null
    }
  }
  markDirty(s)
}

function ensureDraft(s: TemplateStudioSection) {
  if (!drafts.value[s.id]) {
    const persisted = persistedSection(s)
    drafts.value[s.id] = {
      sourceNotes: persisted?.sourceNotes ?? '',
      draftText: persisted?.draftText ?? '',
      finalText: persisted?.finalText ?? '',
      status: persisted?.status ?? 'empty',
      builderState: cloneBuilderState(persisted?.builderState)
    }
    dirty.value[s.id] = false
  }
}

// Snapshot watcher: refresh drafts for any section the editor hasn't
// touched. Same dirty-state pattern Canvas uses to preserve in-progress
// typing while picking up collaborator edits.
watch(
  output,
  (o) => {
    if (!o) return
    for (const s of props.studio.sections) {
      const persisted = o.sections?.[s.id]
      if (!persisted) continue
      if (!drafts.value[s.id]) {
        drafts.value[s.id] = {
          sourceNotes: persisted.sourceNotes ?? '',
          draftText: persisted.draftText ?? '',
          finalText: persisted.finalText ?? '',
          status: persisted.status ?? 'empty',
          builderState: cloneBuilderState(persisted.builderState)
        }
        dirty.value[s.id] = false
      } else if (!dirty.value[s.id]) {
        drafts.value[s.id] = {
          sourceNotes: persisted.sourceNotes ?? '',
          draftText: persisted.draftText ?? '',
          finalText: persisted.finalText ?? '',
          status: persisted.status ?? 'empty',
          builderState: cloneBuilderState(persisted.builderState)
        }
      }
    }
  },
  { deep: true, immediate: true }
)

function markDirty(s: TemplateStudioSection) {
  dirty.value[s.id] = true
  // A new edit invalidates the prior save success — don't keep
  // showing "Saved at 3:14pm" once the student is typing again.
  if (lastSavedAt.value[s.id]) {
    lastSavedAt.value[s.id] = ''
    recentlySaved.value[s.id] = false
  }
  // Soft Section Locking sprint: chapter-mode acquire-on-first-edit.
  // Section-filter mode acquires on mount (see acquireOnMount watch
  // below). In chapter mode many sections are visible at once; we
  // delay acquisition until the student actually starts editing the
  // section so a chief who's just scrolling past doesn't claim every
  // lock on the page. Best-effort — failure is silent here; the
  // banner + disabled-state derive from output.sectionLocks.
  if (!sectionMode.value) {
    void attemptAcquireLock(s)
  }
}

function hasChanges(s: TemplateStudioSection): boolean {
  if (!dirty.value[s.id]) return false
  const d = drafts.value[s.id]
  const persisted = persistedSection(s)
  if (!persisted) {
    return Boolean(
      d.sourceNotes ||
        d.draftText ||
        d.finalText ||
        rowsHaveContent(d.builderState.universalTable?.rows ?? []) ||
        rowsHaveContent(d.builderState.retailPitch?.rows ?? [])
    )
  }
  return (
    d.sourceNotes !== (persisted.sourceNotes ?? '') ||
    d.draftText !== (persisted.draftText ?? '') ||
    d.finalText !== (persisted.finalText ?? '') ||
    d.status !== (persisted.status ?? 'empty') ||
    JSON.stringify(d.builderState) !==
      JSON.stringify(cloneBuilderState(persisted.builderState))
  )
}

async function save(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  // Soft Section Locking sprint: defensive guard. The Save button is
  // already :disabled when locked-by-other, but a programmatic call
  // (or a stale click after the lock changed mid-render) shouldn't
  // slip through. saveSection in the composable also re-checks the
  // lock against a fresh getDoc, so we have a server-side backstop.
  if (isLockedByOther(s)) return
  const d = drafts.value[s.id]
  if (!d) return
  savingSectionId.value = s.id
  sectionError.value[s.id] = ''
  try {
    const payload: SectionSavePayload = {
      sectionTitleSnapshot: s.title,
      sourceNotes: d.sourceNotes,
      draftText: d.draftText,
      finalText: d.finalText,
      status: deriveStatus(d),
      builderState: d.builderState
    }
    await outputs.saveSection(props.deliverable.id, s.id, payload, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
    dirty.value[s.id] = false
    // Independent Student Mode: confirm the save inline so a student
    // working at home can trust their work landed. The next-step
    // hint stays visible until the next edit (markDirty clears it).
    lastSavedAt.value[s.id] = fmtSavedTime()
    recentlySaved.value[s.id] = true
    // Soft Section Locking sprint: saveSection atomically clears
    // sectionLocks.{sid} via deleteField() in the same updateDoc call.
    // Mirror that locally so the per-section refresh timer stops and
    // we don't try to re-release on the next unmount.
    acquiredLockSectionIds.value.delete(s.id)
    stopRefreshTimer(s.id)
  } catch (e) {
    sectionError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    savingSectionId.value = null
  }
}

// --- Independent Student Mode: status quick-actions ----------------
// Three-button row replaces the inline status <select> in the Draft
// accordion. Each button sets the local draft status and marks the
// section dirty so the existing Save handler persists exactly the
// same status field as before. We do NOT auto-save and we do NOT
// submit — approval flow is unchanged.
function setSectionStatus(
  s: TemplateStudioSection,
  next: DeliverableOutputSectionStatus
) {
  if (!editingEnabled.value) return
  const d = drafts.value[s.id]
  if (!d) return
  if (d.status === next) return
  d.status = next
  markDirty(s)
}

function toggleStuckPanel(s: TemplateStudioSection) {
  stuckPanelOpen.value[s.id] = !stuckPanelOpen.value[s.id]
}

// --- Guidance Compression Sprint: viewer role + action summary ----
// Regular members default to the compressed view (writing surface
// first, full curriculum guide collapsed). Leaders (admin / Co-CEO /
// chief / COO) keep the full guide open by default so they can
// review what students are seeing. Both audiences see HelpMeUnderstand
// and the "What to do" microcopy — the only difference is whether
// the deeper SectionGuidanceSummary / ExpertGuidanceCard /
// PlaybookWritingScaffold cards are open by default.
const viewerIsLeader = computed<boolean>(
  () =>
    auth.isAdmin ||
    auth.isCoCEO ||
    auth.isChief ||
    auth.profile?.role === 'coo'
)

function actionSummaryFor(s: TemplateStudioSection): string {
  return effectiveActionSummary(s)
}

// --- ChipPickQuickStart apply handler ----------------------------
// ChipPickQuickStart emits a payload describing where the generated
// starter draft should land (sourceNotes / draftText) and how
// (set / append / replace). The workspace decides how to merge into
// the existing local draft and dirty-flag — the QuickStart itself
// never touches Firestore and never marks dirty on its own.
//
// Posture (do not relax):
//   - target is never `finalText`; the apply API doesn't expose it
//   - 'set' implies the target was empty; just assign
//   - 'replace' implies the student confirmed overwrite in the prompt
//   - 'append' implies the student confirmed append in the prompt
//   - we never autosave; markDirty(s) is the only persistence-side
//     change so the existing Save flow stays in charge
function handleQuickStartApply(
  s: TemplateStudioSection,
  payload: {
    target: 'sourceNotes' | 'draftText'
    mode: 'set' | 'replace' | 'append'
    text: string
  }
) {
  if (!editingEnabled.value) return
  const d = drafts.value[s.id]
  if (!d) return
  const text = payload.text || ''
  if (!text.trim()) return
  if (payload.target === 'sourceNotes') {
    if (payload.mode === 'append' && d.sourceNotes.trim()) {
      d.sourceNotes = `${d.sourceNotes.trimEnd()}\n\n${text}`
    } else {
      d.sourceNotes = text
    }
  } else {
    // draftText
    if (payload.mode === 'append' && d.draftText.trim()) {
      d.draftText = `${d.draftText.trimEnd()}\n\n${text}`
    } else {
      d.draftText = text
    }
  }
  markDirty(s)
}

// --- Independent Student Mode: section warnings -------------------
// Surface non-blocking false-progress warnings inside the section
// editor itself. Pure helper from app/utils/sectionMismatch.ts; no
// task context here (we don't have it on the workspace), so the
// task-aware warnings render on /tasks instead.
function sectionWarningsFor(
  s: TemplateStudioSection
): SectionMismatchWarning[] {
  return getSectionWarnings({
    deliverableId: props.deliverable.id,
    section: persistedSection(s)
  })
}

// --- Independent Student Mode: navigation between sections --------
// "Open next section →" CTA after save. Returns the studio section
// after the current one or null when at the end. Falls back to the
// chapter overview link in template.
function nextSectionAfter(
  s: TemplateStudioSection
): TemplateStudioSection | null {
  const idx = props.studio.sections.findIndex((x) => x.id === s.id)
  if (idx < 0) return null
  return props.studio.sections[idx + 1] ?? null
}

// --- Independent Student Mode: next-step hint ---------------------
// Plain-language coach line shown immediately after save. Reads the
// just-persisted section state so the hint matches what the chip
// row also shows.
function nextStepHint(s: TemplateStudioSection): string {
  const persisted = persistedSection(s)
  if (!persisted) return 'Saved.'
  const hasNotes = (persisted.sourceNotes ?? '').trim().length > 0
  const hasDraft = (persisted.draftText ?? '').trim().length > 0
  const hasFinal = (persisted.finalText ?? '').trim().length > 0
  const high = isHighRigorChapter(props.deliverable.id)
  const hasEvidence =
    (persisted.evidenceLinks?.length ?? 0) > 0 ||
    (persisted.structuredEvidence?.length ?? 0) > 0 ||
    (persisted.marketBuilderEntries?.length ?? 0) > 0
  if (!hasNotes && !hasDraft && !hasFinal) return 'Saved. Add your team\'s thinking next.'
  if (hasNotes && !hasDraft) return 'Next: add a working draft.'
  if (hasDraft && !hasFinal) return 'Next: polish into Final Playbook text.'
  if (hasFinal && high && !hasEvidence) {
    return 'Next: add proof in Defend if this section makes a claim.'
  }
  if (hasFinal) return 'Strong progress. This may be ready for chief review.'
  return 'Saved.'
}

// --- Soft Section Locking sprint ----------------------------------
// State: which sections this user currently holds a lock on, plus a
// 30-second tick the template reads to render the live remaining-time
// countdown on the locked-by-other banner. Lock objects themselves
// live on output.sectionLocks (read-only from this component's
// perspective); we just remember which ones we *acquired* so we know
// what to release on unmount / before-unload / save.
const acquiredLockSectionIds = ref<Set<string>>(new Set())
const lockNowMs = ref<number>(Date.now())
const lockRefreshTimers = new Map<string, ReturnType<typeof setInterval>>()
let lockTickTimer: ReturnType<typeof setInterval> | null = null

function currentSectionLock(s: TemplateStudioSection): SectionLock | null {
  return output.value?.sectionLocks?.[s.id] ?? null
}

// "Locked by another user, and the lock is still alive." Drives the
// banner and the disabled bindings on textareas / save / status row /
// QuickStart inside the section card.
function isLockedByOther(s: TemplateStudioSection): boolean {
  const lock = currentSectionLock(s)
  if (!lock) return false
  if (sectionLockIsExpired(lock, lockNowMs.value)) return false
  if (!auth.user) return true
  return !sectionLockIsOwnedBy(lock, auth.user.uid)
}

// Remaining time until the active lock expires, in ms. Used by the
// banner countdown. Returns 0 when there's no active lock or it has
// already expired.
function lockRemainingMs(s: TemplateStudioSection): number {
  const lock = currentSectionLock(s)
  if (!lock) return 0
  const t = Date.parse(lock.lockedAt)
  if (Number.isNaN(t)) return 0
  return Math.max(0, t + SECTION_LOCK_TTL_MS - lockNowMs.value)
}

// "Try again in X minutes" copy for the banner. Floors to whole
// minutes when ≥ 60s remain so the line stays calm; switches to
// seconds once we're under a minute.
function lockRemainingLabel(s: TemplateStudioSection): string {
  const ms = lockRemainingMs(s)
  if (ms <= 0) return 'any moment'
  const sec = Math.ceil(ms / 1000)
  if (sec >= 60) {
    const min = Math.ceil(sec / 60)
    return `${min} minute${min === 1 ? '' : 's'}`
  }
  return `${sec} second${sec === 1 ? '' : 's'}`
}

async function attemptAcquireLock(s: TemplateStudioSection): Promise<void> {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  if (acquiredLockSectionIds.value.has(s.id)) return
  // Already-held check: if the live snapshot says we own it, just
  // adopt it without a Firestore round-trip. Avoids spurious writes
  // on rapid markDirty calls.
  const existing = currentSectionLock(s)
  if (
    existing &&
    sectionLockIsOwnedBy(existing, auth.user.uid) &&
    !sectionLockIsExpired(existing, lockNowMs.value)
  ) {
    acquiredLockSectionIds.value.add(s.id)
    startRefreshTimer(s)
    return
  }
  try {
    const result = await outputs.acquireSectionLock(
      props.deliverable.id,
      s.id,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      },
      auth.profile.displayName || auth.profile.email || auth.user.email || ''
    )
    if (result.acquired) {
      acquiredLockSectionIds.value.add(s.id)
      startRefreshTimer(s)
    }
    // If acquired === false, the live snapshot will show the other
    // user's lock and the banner / disabled bindings render.
    // Nothing else to do here.
  } catch {
    // Best-effort. A network blip during acquire just means the next
    // markDirty (in chapter mode) or the periodic snapshot tick
    // gives us another chance.
  }
}

function startRefreshTimer(s: TemplateStudioSection): void {
  if (lockRefreshTimers.has(s.id)) return
  if (typeof window === 'undefined') return
  const timer = setInterval(() => {
    if (!auth.user || !auth.profile) return
    if (!acquiredLockSectionIds.value.has(s.id)) {
      stopRefreshTimer(s.id)
      return
    }
    void outputs
      .refreshSectionLock(
        props.deliverable.id,
        s.id,
        {
          uid: auth.user.uid,
          email: auth.profile.email || auth.user.email || ''
        },
        auth.profile.displayName || auth.profile.email || auth.user.email || ''
      )
      .then((ok) => {
        // If a takeover happened mid-refresh, drop our claim so the
        // banner / disabled bindings update on the next snapshot.
        if (!ok) {
          acquiredLockSectionIds.value.delete(s.id)
          stopRefreshTimer(s.id)
        }
      })
      .catch(() => {
        // Best-effort. TTL is the safety net.
      })
  }, SECTION_LOCK_REFRESH_MS)
  lockRefreshTimers.set(s.id, timer)
}

function stopRefreshTimer(sectionId: string): void {
  const t = lockRefreshTimers.get(sectionId)
  if (t) {
    clearInterval(t)
    lockRefreshTimers.delete(sectionId)
  }
}

async function releaseHeldLock(s: TemplateStudioSection): Promise<void> {
  if (!auth.user || !auth.profile) return
  if (!acquiredLockSectionIds.value.has(s.id)) return
  acquiredLockSectionIds.value.delete(s.id)
  stopRefreshTimer(s.id)
  try {
    await outputs.releaseSectionLock(props.deliverable.id, s.id, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
  } catch {
    // Best-effort; TTL is the safety net.
  }
}

// Section-filter mode: the user has navigated to a single section to
// edit, so acquire on mount. Chapter mode acquires on first edit (see
// markDirty above). Watcher form so the page can swap section ids
// without a re-mount and we still release+acquire correctly.
watch(
  () => [
    props.sectionFilterId,
    editingEnabled.value,
    auth.user?.uid,
    visibleSections.value.map((s) => s.id).join('|')
  ],
  () => {
    if (!props.sectionFilterId) return
    const s = visibleSections.value.find((x) => x.id === props.sectionFilterId)
    if (s) void attemptAcquireLock(s)
  },
  { immediate: true }
)

// 30-second tick for the live countdown. The tick also opportunistically
// re-attempts acquire on a section whose lock has just expired — a
// student waiting out another user's lock should get edit access back
// without a refresh once the TTL elapses.
onMounted(() => {
  if (typeof window === 'undefined') return
  lockTickTimer = setInterval(() => {
    lockNowMs.value = Date.now()
    if (props.sectionFilterId) {
      const s = visibleSections.value.find(
        (x) => x.id === props.sectionFilterId
      )
      if (s && !isLockedByOther(s) && !acquiredLockSectionIds.value.has(s.id)) {
        void attemptAcquireLock(s)
      }
    }
  }, 30_000)
})

// --- Independent Student Mode: unsaved-changes guard --------------
// "Any section dirty?" — drives the inline unsaved banner per
// section AND a global beforeunload warning. Tab close / refresh
// triggers the browser's native confirmation; in-app navigation
// guards live on the section route page so the workspace stays
// composable in both chapter and section mode.
const anyDirty = computed<boolean>(() =>
  Object.values(dirty.value).some(Boolean)
)

function beforeUnloadHandler(e: BeforeUnloadEvent) {
  // Soft Section Locking sprint: best-effort release on tab close /
  // reload. We can't await the Firestore writes here — the browser
  // doesn't wait — but firing the request gives most networks a
  // 50–100ms window where the release lands. Failures fall back to
  // the 5-minute TTL.
  for (const sid of acquiredLockSectionIds.value) {
    if (!auth.user || !auth.profile) break
    void outputs
      .releaseSectionLock(props.deliverable.id, sid, {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      })
      .catch(() => {})
  }
  if (!anyDirty.value) return
  // Modern browsers ignore custom strings but require preventDefault
  // + returnValue assignment to actually prompt. Both are safe to
  // set unconditionally when we know there's dirty state.
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', beforeUnloadHandler)
  }
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  }
  // Soft Section Locking sprint: in-app navigation cleanup. Release
  // every lock we still hold and stop every per-section refresh
  // timer. The composable releaseSectionLock is no-op-on-takeover
  // (only releases locks we still own), so this is safe even if a
  // race already cleared our claim.
  if (lockTickTimer) {
    clearInterval(lockTickTimer)
    lockTickTimer = null
  }
  for (const t of lockRefreshTimers.values()) clearInterval(t)
  lockRefreshTimers.clear()
  if (auth.user && auth.profile) {
    const actor = {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    }
    for (const sid of acquiredLockSectionIds.value) {
      void outputs.releaseSectionLock(props.deliverable.id, sid, actor).catch(() => {})
    }
    acquiredLockSectionIds.value.clear()
  }
})

// Expose the dirty-state to parents (e.g. the section route page's
// onBeforeRouteLeave guard). defineExpose is a no-op in chapter mode
// since the page mounts the chapter hub instead.
defineExpose({
  anyDirty
})

// --- evidence link form state ---
const linkForms = ref<Record<string, NewEvidenceLinkInput>>({})
const linkErrors = ref<Record<string, string>>({})
const evidenceBusy = ref<string | null>(null)

const EVIDENCE_TYPES: EvidenceLinkType[] = [
  'doc',
  'sheet',
  'slide',
  'folder',
  'image',
  'design',
  'external',
  'other'
]

function ensureLinkForm(s: TemplateStudioSection) {
  if (!linkForms.value[s.id]) {
    linkForms.value[s.id] = {
      label: '',
      url: '',
      type: 'doc',
      requirementId: null
    }
  }
}

function isLikelyUrl(v: string): boolean {
  const t = v.trim()
  return /^https?:\/\/.+/i.test(t)
}

async function addLink(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  ensureLinkForm(s)
  const f = linkForms.value[s.id]
  linkErrors.value[s.id] = ''
  if (!f.label.trim()) {
    linkErrors.value[s.id] = 'Label is required.'
    return
  }
  if (!isLikelyUrl(f.url)) {
    linkErrors.value[s.id] = 'Link must start with http:// or https://.'
    return
  }
  evidenceBusy.value = s.id
  try {
    const persisted = persistedSection(s)
    await outputs.addEvidenceLink(
      props.deliverable.id,
      s.id,
      persisted?.evidenceLinks ?? [],
      f,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
    linkForms.value[s.id] = {
      label: '',
      url: '',
      type: 'doc',
      requirementId: null
    }
  } catch (e) {
    linkErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusy.value = null
  }
}

async function removeLink(s: TemplateStudioSection, linkId: string) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  evidenceBusy.value = s.id
  try {
    const persisted = persistedSection(s)
    await outputs.removeEvidenceLink(
      props.deliverable.id,
      s.id,
      persisted?.evidenceLinks ?? [],
      linkId,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
  } catch (e) {
    sectionError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusy.value = null
  }
}

// --- readiness summary (non-blocking signal) ---
const readiness = computed(() => {
  const sections = props.studio.sections
  let withSourceNotes = 0
  let withDraft = 0
  let withFinal = 0
  let withEvidence = 0
  let withStructuredEvidence = 0
  let totalStructuredEvidence = 0
  let totalMarketBuilder = 0
  let missingFinal = 0
  for (const s of sections) {
    const p = persistedSection(s)
    if ((p?.sourceNotes ?? '').trim()) withSourceNotes += 1
    if ((p?.draftText ?? '').trim()) withDraft += 1
    if ((p?.finalText ?? '').trim()) withFinal += 1
    else missingFinal += 1
    if ((p?.evidenceLinks?.length ?? 0) > 0) withEvidence += 1
    const seCount = p?.structuredEvidence?.length ?? 0
    if (seCount > 0) withStructuredEvidence += 1
    totalStructuredEvidence += seCount
    totalMarketBuilder += p?.marketBuilderEntries?.length ?? 0
  }
  return {
    total: sections.length,
    withSourceNotes,
    withDraft,
    withFinal,
    withEvidence,
    withStructuredEvidence,
    totalStructuredEvidence,
    totalMarketBuilder,
    missingFinal
  }
})

// --- structured evidence editor state ---
// Each section gets its own form buffer + editing-entry id so the Add /
// Edit forms don't bleed across sections.
function emptyEvidenceForm(): NewStructuredEvidenceInput {
  return {
    claim: '',
    evidence: '',
    source: '',
    assumption: '',
    calculation: '',
    confidence: undefined,
    risk: '',
    nextValidation: '',
    requirementId: null
  }
}
const evidenceForms = ref<Record<string, NewStructuredEvidenceInput>>({})
const evidenceEditing = ref<Record<string, string | null>>({})
const evidenceErrors = ref<Record<string, string>>({})
const evidenceBusyId = ref<string | null>(null)
const evidenceFormOpen = ref<Record<string, boolean>>({})
const CONFIDENCE_OPTIONS: EvidenceConfidence[] = ['low', 'medium', 'high']

function ensureEvidenceForm(sectionId: string) {
  if (!evidenceForms.value[sectionId]) {
    evidenceForms.value[sectionId] = emptyEvidenceForm()
  }
  if (evidenceEditing.value[sectionId] === undefined) {
    evidenceEditing.value[sectionId] = null
  }
}

function startNewEvidence(sectionId: string) {
  evidenceForms.value[sectionId] = emptyEvidenceForm()
  evidenceEditing.value[sectionId] = null
  evidenceErrors.value[sectionId] = ''
  evidenceFormOpen.value[sectionId] = true
}

function startEditEvidence(sectionId: string, entry: StructuredEvidenceEntry) {
  evidenceForms.value[sectionId] = {
    claim: entry.claim,
    evidence: entry.evidence,
    source: entry.source,
    assumption: entry.assumption ?? '',
    calculation: entry.calculation ?? '',
    confidence: entry.confidence,
    risk: entry.risk ?? '',
    nextValidation: entry.nextValidation ?? '',
    requirementId: entry.requirementId ?? null
  }
  evidenceEditing.value[sectionId] = entry.id
  evidenceErrors.value[sectionId] = ''
  evidenceFormOpen.value[sectionId] = true
}

function cancelEvidenceForm(sectionId: string) {
  evidenceForms.value[sectionId] = emptyEvidenceForm()
  evidenceEditing.value[sectionId] = null
  evidenceErrors.value[sectionId] = ''
  evidenceFormOpen.value[sectionId] = false
}

function evidenceFormValid(form: NewStructuredEvidenceInput): string | null {
  if (!form.claim.trim()) return 'Claim is required.'
  if (!form.evidence.trim()) return 'Evidence is required.'
  if (!form.source.trim()) return 'Source is required.'
  return null
}

async function submitEvidence(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  ensureEvidenceForm(s.id)
  const form = evidenceForms.value[s.id]
  const err = evidenceFormValid(form)
  if (err) {
    evidenceErrors.value[s.id] = err
    return
  }
  evidenceErrors.value[s.id] = ''
  evidenceBusyId.value = s.id
  try {
    const persisted = persistedSection(s)
    const current = persisted?.structuredEvidence ?? []
    const editingId = evidenceEditing.value[s.id]
    const actor = {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    }
    if (editingId) {
      await outputs.updateStructuredEvidence(
        props.deliverable.id,
        s.id,
        current,
        editingId,
        form,
        actor
      )
    } else {
      await outputs.addStructuredEvidence(
        props.deliverable.id,
        s.id,
        current,
        form,
        actor
      )
    }
    cancelEvidenceForm(s.id)
  } catch (e) {
    evidenceErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusyId.value = null
  }
}

async function removeEvidenceEntry(s: TemplateStudioSection, entryId: string) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  evidenceBusyId.value = s.id
  try {
    const persisted = persistedSection(s)
    const current = persisted?.structuredEvidence ?? []
    await outputs.removeStructuredEvidence(
      props.deliverable.id,
      s.id,
      current,
      entryId,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
    if (evidenceEditing.value[s.id] === entryId) {
      cancelEvidenceForm(s.id)
    }
  } catch (e) {
    evidenceErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    evidenceBusyId.value = null
  }
}

function fmtWhen(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
}

// --- market builder state (Market Builder V1) ---
// Per-section form buffer + editing-entry id. Same edit/cancel pattern
// as structured evidence so the two blocks behave the same.
const SCENARIO_LABELS: MarketScenarioLevel[] = [
  'conservative',
  'base',
  'ambitious'
]
function blankScenarios(): MarketBuilderScenario[] {
  return SCENARIO_LABELS.map((label) => ({
    // Form-buffer ids; the real ids land when the composable persists.
    id: `mb-scn-${label}`,
    label,
    reachableAudience: null,
    interestRatePercent: null,
    conversionRatePercent: null,
    estimatedBuyers: null,
    price: null,
    estimatedRevenue: null,
    notes: undefined
  }))
}

function emptyMarketForm(): NewMarketBuilderInput {
  return {
    productName: '',
    productStory: '',
    primaryMarket: '',
    secondaryMarket: '',
    targetAgeRange: '',
    customerAssumption: '',
    valueBasedFactor: '',
    schoolMarketSize: null,
    broaderMarketSize: null,
    evidenceSource: '',
    sourceType: '',
    confidence: undefined,
    weakestAssumption: '',
    strongestEvidence: '',
    nextValidation: '',
    scenarios: blankScenarios(),
    linkedRequirementId: null
  }
}

const marketForms = ref<Record<string, NewMarketBuilderInput>>({})
const marketEditing = ref<Record<string, string | null>>({})
const marketErrors = ref<Record<string, string>>({})
const marketBusyId = ref<string | null>(null)
const marketFormOpen = ref<Record<string, boolean>>({})

function ensureMarketForm(sectionId: string) {
  if (!marketForms.value[sectionId]) {
    marketForms.value[sectionId] = emptyMarketForm()
  }
  if (marketEditing.value[sectionId] === undefined) {
    marketEditing.value[sectionId] = null
  }
}

function startNewMarket(sectionId: string) {
  marketForms.value[sectionId] = emptyMarketForm()
  marketEditing.value[sectionId] = null
  marketErrors.value[sectionId] = ''
  marketFormOpen.value[sectionId] = true
}

function startEditMarket(sectionId: string, entry: MarketBuilderEntry) {
  // Clone scenarios into the form buffer so edits don't mutate the
  // persisted snapshot directly. Pre-seed any missing rows so the
  // editor always renders all three levels even if a legacy entry
  // saved fewer rows.
  const byLabel = new Map<MarketScenarioLevel, MarketBuilderScenario>()
  for (const s of entry.scenarios ?? []) byLabel.set(s.label, s)
  const scenarios: MarketBuilderScenario[] = SCENARIO_LABELS.map((label) => {
    const existing = byLabel.get(label)
    return existing
      ? { ...existing }
      : {
          id: `mb-scn-${label}`,
          label,
          reachableAudience: null,
          interestRatePercent: null,
          conversionRatePercent: null,
          estimatedBuyers: null,
          price: null,
          estimatedRevenue: null,
          notes: undefined
        }
  })
  marketForms.value[sectionId] = {
    productName: entry.productName,
    productStory: entry.productStory ?? '',
    primaryMarket: entry.primaryMarket ?? '',
    secondaryMarket: entry.secondaryMarket ?? '',
    targetAgeRange: entry.targetAgeRange ?? '',
    customerAssumption: entry.customerAssumption ?? '',
    valueBasedFactor: entry.valueBasedFactor ?? '',
    schoolMarketSize: entry.schoolMarketSize ?? null,
    broaderMarketSize: entry.broaderMarketSize ?? null,
    evidenceSource: entry.evidenceSource ?? '',
    sourceType: entry.sourceType ?? '',
    confidence: entry.confidence,
    weakestAssumption: entry.weakestAssumption ?? '',
    strongestEvidence: entry.strongestEvidence ?? '',
    nextValidation: entry.nextValidation ?? '',
    scenarios,
    linkedRequirementId: entry.linkedRequirementId ?? null
  }
  marketEditing.value[sectionId] = entry.id
  marketErrors.value[sectionId] = ''
  marketFormOpen.value[sectionId] = true
}

function cancelMarketForm(sectionId: string) {
  marketForms.value[sectionId] = emptyMarketForm()
  marketEditing.value[sectionId] = null
  marketErrors.value[sectionId] = ''
  marketFormOpen.value[sectionId] = false
}

function recomputeFormScenarios(sectionId: string) {
  const f = marketForms.value[sectionId]
  if (!f?.scenarios) return
  for (const s of f.scenarios) {
    s.estimatedBuyers = deriveBuyers(s)
    s.estimatedRevenue = deriveRevenue(s)
  }
}

// Numeric inputs come back as either '' (empty) or a string. Coerce
// explicitly so blank fields stay null instead of NaN.
function setMarketNumber(
  sectionId: string,
  key: 'schoolMarketSize' | 'broaderMarketSize',
  raw: string
) {
  const f = marketForms.value[sectionId]
  if (!f) return
  if (raw === '' || raw == null) {
    f[key] = null
    return
  }
  const n = Number(raw)
  f[key] = Number.isFinite(n) ? n : null
}

function setScenarioNumber(
  sectionId: string,
  scenarioIndex: number,
  key: 'reachableAudience' | 'interestRatePercent' | 'conversionRatePercent' | 'price',
  raw: string
) {
  const f = marketForms.value[sectionId]
  if (!f?.scenarios?.[scenarioIndex]) return
  if (raw === '' || raw == null) {
    f.scenarios[scenarioIndex][key] = null
  } else {
    const n = Number(raw)
    f.scenarios[scenarioIndex][key] = Number.isFinite(n) ? n : null
  }
  recomputeFormScenarios(sectionId)
}

// Numeric guardrails for Market Builder. We block save (rather than
// silently clamping) so students see that an assumption was rejected
// and have to fix it themselves — the chapter is meant to teach
// disciplined assumptions, not to round bad numbers into looking ok.
//
// Empty stays empty: a null value means "not entered yet" and should
// keep rendering as "—". Only entered-but-invalid values trip the
// validator. NaN / Infinity already get coerced to null by the input
// handlers (setMarketNumber / setScenarioNumber), so by the time we
// get here every field is either null or a finite number.
function isNegative(n: number | null | undefined): boolean {
  return n != null && Number.isFinite(n) && n < 0
}
function isOutOfPercentRange(n: number | null | undefined): boolean {
  if (n == null || !Number.isFinite(n)) return false
  return n < 0 || n > 100
}

function marketFormValid(form: NewMarketBuilderInput): string | null {
  if (!form.productName.trim()) return 'Product name is required.'

  const hasNegative =
    isNegative(form.schoolMarketSize) ||
    isNegative(form.broaderMarketSize) ||
    (form.scenarios?.some(
      (s) => isNegative(s.reachableAudience) || isNegative(s.price)
    ) ?? false)

  const hasOutOfRangePercent =
    form.scenarios?.some(
      (s) =>
        isOutOfPercentRange(s.interestRatePercent) ||
        isOutOfPercentRange(s.conversionRatePercent)
    ) ?? false

  const messages: string[] = []
  if (hasNegative) {
    messages.push('Audience, market size, and price cannot be negative.')
  }
  if (hasOutOfRangePercent) {
    messages.push('Interest and conversion rates must be between 0 and 100.')
  }
  return messages.length ? messages.join(' ') : null
}

async function submitMarket(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  ensureMarketForm(s.id)
  const form = marketForms.value[s.id]
  const err = marketFormValid(form)
  if (err) {
    marketErrors.value[s.id] = err
    return
  }
  // Recompute one more time so the persisted scenarios match the
  // numbers the student saw when they hit save.
  recomputeFormScenarios(s.id)
  marketErrors.value[s.id] = ''
  marketBusyId.value = s.id
  try {
    const persisted = persistedSection(s)
    const current = persisted?.marketBuilderEntries ?? []
    const editingId = marketEditing.value[s.id]
    const actor = {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    }
    if (editingId) {
      await outputs.updateMarketBuilderEntry(
        props.deliverable.id,
        s.id,
        current,
        editingId,
        form,
        actor
      )
    } else {
      await outputs.addMarketBuilderEntry(
        props.deliverable.id,
        s.id,
        current,
        form,
        actor
      )
    }
    cancelMarketForm(s.id)
  } catch (e) {
    marketErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    marketBusyId.value = null
  }
}

async function removeMarketEntry(s: TemplateStudioSection, entryId: string) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
  marketBusyId.value = s.id
  try {
    const persisted = persistedSection(s)
    const current = persisted?.marketBuilderEntries ?? []
    await outputs.removeMarketBuilderEntry(
      props.deliverable.id,
      s.id,
      current,
      entryId,
      {
        uid: auth.user.uid,
        email: auth.profile.email || auth.user.email || ''
      }
    )
    if (marketEditing.value[s.id] === entryId) {
      cancelMarketForm(s.id)
    }
  } catch (e) {
    marketErrors.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    marketBusyId.value = null
  }
}

// --- AI Critique V1 helpers ----------------------------------------
// We assemble the section-scoped request payload here so the panel
// component stays a dumb renderer. The payload includes only what the
// student already sees on screen for this section, plus the same
// upstream cross-chapter references the workspace already shows. No
// auth tokens, no Firebase config, no other deliverables.
function sectionHasAiInput(s: TemplateStudioSection): boolean {
  const p = persistedSection(s)
  if (!p) return false
  if ((p.sourceNotes ?? '').trim()) return true
  if ((p.draftText ?? '').trim()) return true
  if ((p.finalText ?? '').trim()) return true
  if ((p.evidenceLinks?.length ?? 0) > 0) return true
  if ((p.structuredEvidence?.length ?? 0) > 0) return true
  if ((p.marketBuilderEntries?.length ?? 0) > 0) return true
  return false
}

function shouldShowAiCritique(s: TemplateStudioSection): boolean {
  if (!aiCritiqueChapterEligible.value) return false
  if (!s.marketBuilder?.enabled) return false
  return sectionHasAiInput(s)
}

function shouldShowMarketFit(s: TemplateStudioSection): boolean {
  if (!isMarketFitChapter.value) return false
  return s.marketFit?.enabled === true
}

function persistedMarketFit(s: TemplateStudioSection): MarketFitBuilderState | null {
  return persistedSection(s)?.marketFit ?? null
}

// Brand Fit Builder gate. Independent of marketFit so a section can
// surface either, both, or neither. Studio sections opt in via
// `s.brandFit?.enabled` (set on the Ch 5 / Ch 6 / Ch 10 brand-relevant
// sections).
function shouldShowBrandFit(s: TemplateStudioSection): boolean {
  return s.brandFit?.enabled === true
}

function persistedBrandFit(s: TemplateStudioSection): BrandFitBuilderState | null {
  return persistedSection(s)?.brandFit ?? null
}

// Pricing Strategy Builder gate. Independent of every other builder.
// Studio sections opt in via `s.pricingStrategy?.enabled` (V1 enables
// only on Ch. 8 Section 2 / sale-price). The mount also reads the
// already-fetched Ch. 7 marketFit + marketBuilder entries as
// read-only context — those listeners only fire on Ch. 8 anyway, so
// non-Ch.8 sections that opt in (none in V1) would simply receive
// nulls.
function shouldShowPricingStrategy(s: TemplateStudioSection): boolean {
  return s.pricingStrategy?.enabled === true
}

// Pass A — Universal Builder Foundation Pack.
// Conflict guard: when a section already has a primary specialized
// builder (chip-pick QuickStart / Customer Profile / Key Activities
// / Finance Table / Operations Checklist / Market Fit / Brand Fit
// / Pricing Strategy), the universal builder is suppressed to
// prevent duplicate / conflicting surfaces. The existing primary
// builder always wins; the universal config silently no-ops on
// those sections.
function hasPrimaryBuilder(s: TemplateStudioSection): boolean {
  if (s.chipPickQuickStart?.enabled) return true
  if (s.keyActivities?.enabled) return true
  if (s.financeTable?.enabled) return true
  if (s.operationsChecklist?.enabled) return true
  if (s.marketFit?.enabled) return true
  if (s.brandFit?.enabled) return true
  if (s.pricingStrategy?.enabled) return true
  if (customerProfileBuilderEnabled.value && s.id === 'customer-segments') return true
  // Pass B specialized builders count as primary surfaces too —
  // when one is enabled, the matching Pass A universal builder is
  // suppressed below so the chief-facing layout never doubles up.
  if (s.brandSystem?.enabled) return true
  if (s.retailPitch?.enabled) return true
  if (s.strategyMemo?.enabled) return true
  // Corporate Structure / Equity Builder is a primary surface too.
  if (s.corporateStructure?.enabled) return true
  return false
}

// Pass B specialized builders (brandSystem / retailPitch /
// strategyMemo) are themselves primary surfaces. They render only
// when their own enabled flag is true AND no existing saved-state
// or Pass A primary already wins on the same section. Because
// hasPrimaryBuilder() returns true for each Pass B flag, we
// re-derive a "no other primary except the one we want to render"
// helper here so the three Pass B mounts can coexist with each
// other in principle (one section enabling more than one Pass B
// flag is unusual but the math should still work).
function hasOtherPrimaryBuilder(
  s: TemplateStudioSection,
  excluding:
    | 'brandSystem'
    | 'retailPitch'
    | 'strategyMemo'
    | 'corporateStructure'
): boolean {
  if (s.chipPickQuickStart?.enabled) return true
  if (s.keyActivities?.enabled) return true
  if (s.financeTable?.enabled) return true
  if (s.operationsChecklist?.enabled) return true
  if (s.marketFit?.enabled) return true
  if (s.brandFit?.enabled) return true
  if (s.pricingStrategy?.enabled) return true
  if (customerProfileBuilderEnabled.value && s.id === 'customer-segments') return true
  if (excluding !== 'brandSystem' && s.brandSystem?.enabled) return true
  if (excluding !== 'retailPitch' && s.retailPitch?.enabled) return true
  if (excluding !== 'strategyMemo' && s.strategyMemo?.enabled) return true
  if (excluding !== 'corporateStructure' && s.corporateStructure?.enabled) return true
  return false
}

function shouldShowCorporateStructureBuilder(
  s: TemplateStudioSection
): boolean {
  if (s.corporateStructure?.enabled !== true) return false
  return !hasOtherPrimaryBuilder(s, 'corporateStructure')
}

function shouldShowBrandSystemBuilder(s: TemplateStudioSection): boolean {
  if (s.brandSystem?.enabled !== true) return false
  return !hasOtherPrimaryBuilder(s, 'brandSystem')
}

function shouldShowRetailPitchBuilder(s: TemplateStudioSection): boolean {
  if (s.retailPitch?.enabled !== true) return false
  return !hasOtherPrimaryBuilder(s, 'retailPitch')
}

function shouldShowStrategyMemoBuilder(s: TemplateStudioSection): boolean {
  if (s.strategyMemo?.enabled !== true) return false
  return !hasOtherPrimaryBuilder(s, 'strategyMemo')
}

function shouldShowUniversalTable(s: TemplateStudioSection): boolean {
  if (s.universalTable?.enabled !== true) return false
  return !hasPrimaryBuilder(s)
}

function shouldShowUniversalChecklist(s: TemplateStudioSection): boolean {
  if (s.universalChecklist?.enabled !== true) return false
  return !hasPrimaryBuilder(s)
}

function shouldShowDecisionMemo(s: TemplateStudioSection): boolean {
  if (s.decisionMemo?.enabled !== true) return false
  return !hasPrimaryBuilder(s)
}

function persistedPricingStrategy(
  s: TemplateStudioSection
): PricingStrategyBuilderState | null {
  return persistedSection(s)?.pricingStrategy ?? null
}

// First Ch. 7 Market Fit row (if any). The Pricing Strategy Builder
// only needs one upstream context; flattening keeps the prop scalar.
const ch7MarketFitForPricing = computed<MarketFitBuilderState | null>(() => {
  const rows = ch7MarketFitRows.value
  if (rows.length === 0) return null
  return rows[0].fit
})
// Flatten the ReferencedMarketEntry rows down to plain MarketBuilderEntry
// records — the Pricing Strategy Builder only needs the entries, not
// the source-section metadata that the cross-chapter reference panel
// needs. Empty when this workspace isn't on Ch. 8 (the listener
// returns no rows in that case).
const ch7MarketEntriesForPricing = computed<MarketBuilderEntry[]>(() =>
  ch7MarketEntries.value.map((r) => r.entry)
)

// Synthesize MarketBuilderEntry rows from the section's Market Fit
// Builder so the existing AI critique payload carries the segment-
// comparison context without a schema change to the endpoint. Each
// segment becomes one entry tagged "Market Fit:" so the model can
// distinguish synthesized rows from the student's original Market
// Builder entries. The selected segment gets the conservative / base
// / ambitious split; non-selected segments get a single base scenario
// derived from the segment's own interest/conversion pcts.
function synthesizeMarketBuilderFromFit(
  fit: MarketFitBuilderState | null
): MarketBuilderEntry[] {
  if (!fit) return []
  const segments = fit.segments ?? []
  if (segments.length === 0) return []
  const product = fit.productFacts ?? {}
  const sa = fit.scenarioAssumptions ?? {}
  const selectedId = sa.selectedSegmentId ?? null
  const productPrice =
    typeof product.price === 'number' && Number.isFinite(product.price)
      ? product.price
      : null
  const productNamePrefix = product.productName?.trim()
    ? `Market Fit: ${product.productName.trim()}`
    : 'Market Fit'

  function buildScenario(
    label: MarketScenarioLevel,
    audience: number | null,
    interestPct: number | null,
    conversionPct: number | null,
    price: number | null,
    seg: MarketFitSegment
  ): MarketBuilderScenario {
    return {
      id: `mfb-scn-${seg.id}-${label}`,
      label,
      reachableAudience: audience,
      interestRatePercent: interestPct,
      conversionRatePercent: conversionPct,
      // Derived numbers are recomputed by the panel renderer; we ship
      // null here so the model isn't shown a stale precomputed value.
      estimatedBuyers: null,
      price,
      estimatedRevenue: null
    }
  }

  return segments.map((seg) => {
    const audience =
      typeof seg.reachableAudience === 'number' &&
      Number.isFinite(seg.reachableAudience)
        ? seg.reachableAudience
        : null
    const isSelected = seg.id === selectedId
    const scenarios: MarketBuilderScenario[] = isSelected
      ? [
          buildScenario(
            'conservative',
            audience,
            sa.conservativeInterestRatePct ?? null,
            sa.conservativeConversionRatePct ?? null,
            productPrice,
            seg
          ),
          buildScenario(
            'base',
            audience,
            sa.baseInterestRatePct ?? null,
            sa.baseConversionRatePct ?? null,
            productPrice,
            seg
          ),
          buildScenario(
            'ambitious',
            audience,
            sa.ambitiousInterestRatePct ?? null,
            sa.ambitiousConversionRatePct ?? null,
            productPrice,
            seg
          )
        ]
      : [
          buildScenario(
            'base',
            audience,
            seg.interestRatePct ?? null,
            seg.conversionRatePct ?? null,
            productPrice,
            seg
          )
        ]
    // Bake the Customer Profile into the synthesized customer
    // assumption — gives the AI critique a clean "Profile: X. Why: Y"
    // line without changing the request schema. Same for the
    // strongest comp type which we fold into the value-based factor
    // so the model sees what the team is comparing against.
    const profileName = seg.profile?.profileName?.trim() || ''
    const customerAssumptionParts: string[] = []
    if (profileName) {
      customerAssumptionParts.push(`Profile: ${profileName}.`)
    }
    if (seg.whyItMightFit?.trim()) {
      customerAssumptionParts.push(seg.whyItMightFit.trim())
    }
    if (seg.profile?.motivation?.trim()) {
      customerAssumptionParts.push(`Motivation: ${seg.profile.motivation.trim()}.`)
    }
    const customerAssumption =
      customerAssumptionParts.join(' ').trim() || undefined

    const compSummary = findStrongestCompType(fit.comparables)
    const valueBasedParts: string[] = []
    if (product.madeInStory?.trim()) {
      valueBasedParts.push(product.madeInStory.trim())
    }
    if (compSummary) {
      valueBasedParts.push(
        `Strongest comp type: ${compSummary.label.toLowerCase()} (${compSummary.strongCount} strong of ${compSummary.totalCount}).`
      )
    }
    const valueBasedFactor = valueBasedParts.join(' ').trim() || undefined

    return {
      id: `mfb-${seg.id}`,
      productName: `${productNamePrefix} · ${seg.name || 'segment'}`,
      productStory: product.brandStory?.trim() || undefined,
      primaryMarket: seg.name?.trim() || undefined,
      secondaryMarket: seg.roleInStrategy
        ? `Role in strategy: ${seg.roleInStrategy.replace(/_/g, ' ')}`
        : undefined,
      customerAssumption,
      valueBasedFactor,
      schoolMarketSize: null,
      broaderMarketSize: null,
      evidenceSource: seg.evidenceSource?.trim() || undefined,
      sourceType: undefined,
      confidence: undefined,
      weakestAssumption: seg.risk?.trim() || undefined,
      strongestEvidence: undefined,
      nextValidation: seg.nextValidationStep?.trim() || undefined,
      scenarios,
      linkedRequirementId: null
    }
  })
}

function sectionRequirementsForAi(
  s: TemplateStudioSection
): AiCritiqueRequirementInput[] {
  // Linked-requirement ids on the section's structured-evidence and
  // market-builder entries are the most direct signal that a
  // requirement is in scope. Fall back to the requirements whose
  // playbookChapter matches the section so we still surface relevant
  // requirements for sections that haven't linked entries yet.
  const persisted = persistedSection(s)
  const linkedIds = new Set<string>()
  for (const e of persisted?.structuredEvidence ?? []) {
    if (e.requirementId) linkedIds.add(e.requirementId)
  }
  for (const m of persisted?.marketBuilderEntries ?? []) {
    if (m.linkedRequirementId) linkedIds.add(m.linkedRequirementId)
  }
  const studioReqs = props.studio.requirements
  const picked = studioReqs.filter((r) => linkedIds.has(r.id))
  // Cap the request payload — too many requirement descriptions push
  // the prompt size up without much critique signal. The endpoint
  // also caps at 30 as a hard backstop.
  const list = picked.length > 0 ? picked : studioReqs.slice(0, 12)
  return list.map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    requiredForApproval: r.requiredForApproval === true
  }))
}

function buildAiRequest(s: TemplateStudioSection): MarketEvidenceCritiqueRequest {
  const persisted = persistedSection(s)
  const evidenceLinks = (persisted?.evidenceLinks ?? []).map((l) => ({
    label: l.label,
    url: l.url,
    type: l.type as string,
    requirementId: l.requirementId ?? null
  }))
  const structuredEvidence = (persisted?.structuredEvidence ?? []).map((e) => ({
    claim: e.claim,
    evidence: e.evidence,
    source: e.source,
    assumption: e.assumption ?? null,
    calculation: e.calculation ?? null,
    confidence: e.confidence ?? null,
    risk: e.risk ?? null,
    nextValidation: e.nextValidation ?? null
  }))
  // Merge real Market Builder entries with synthesized rows from the
  // Market Fit Builder so the AI critique sees both layers without a
  // schema change to the endpoint. Synthesized rows are clearly tagged
  // in productName so the model can distinguish them.
  const realMarketEntries = persisted?.marketBuilderEntries ?? []
  const fitSynthesized = synthesizeMarketBuilderFromFit(
    persisted?.marketFit ?? null
  )
  const marketBuilderEntries = [...realMarketEntries, ...fitSynthesized]

  // Cross-chapter context only travels with chapters that already
  // surface that context on screen. Ch 7 is self-contained.
  const upstreamCh7MarketEntries =
    isChapter8.value || isChapter11.value
      ? ch7MarketEntries.value
      : undefined
  const upstreamCh8Context = isChapter11.value
    ? {
        finalSectionIds: ch8FinalSections.value.map((row) => row.sectionId),
        revenueScenariosExcerpt: ch8RevenueScenariosExcerpt.value
      }
    : undefined

  return {
    deliverableId: props.deliverable.id,
    deliverableTitle: props.deliverable.title,
    chapterTitle: props.studio.title,
    sectionId: s.id,
    sectionTitle: s.title,
    sectionLesson: s.lesson,
    requirements: sectionRequirementsForAi(s),
    sourceNotes: persisted?.sourceNotes ?? '',
    draftText: persisted?.draftText ?? '',
    finalText: persisted?.finalText ?? '',
    evidenceLinks,
    structuredEvidence,
    marketBuilderEntries,
    upstreamCh7MarketEntries,
    upstreamCh8Context
  }
}

// Make sure each section has a draft + link form + evidence form
// initialized so the template can bind v-model into them safely on
// first render.
watch(
  () => props.studio.sections,
  (sections) => {
    for (const s of sections) {
      ensureDraft(s)
      ensureLinkForm(s)
      ensureEvidenceForm(s.id)
      ensureMarketForm(s.id)
    }
  },
  { immediate: true }
)

// --- Sprint 2: Think / Draft / Defend phase helpers ----------------
// Display-only. Do not persist anything; do not change submit gate
// or Playbook readiness. The phasing reorganizes how the section's
// existing fields appear on screen — none of the underlying save
// paths, builder mounts, or read-only states change.

// "Think complete" — student has captured rough thinking.
function isThinkComplete(s: TemplateStudioSection): boolean {
  const p = persistedSection(s)
  if (!p) return false
  return Boolean((p.sourceNotes ?? '').trim())
}

// "Draft complete" — student has either a working draft or final
// Playbook text saved. We do not require both — the working draft
// alone counts as drafting underway.
function isDraftComplete(s: TemplateStudioSection): boolean {
  const p = persistedSection(s)
  if (!p) return false
  return (
    Boolean((p.draftText ?? '').trim()) ||
    Boolean((p.finalText ?? '').trim())
  )
}

// "Defend started" — any evidence link, structured-evidence entry,
// market-builder entry, or builder doc exists for the section. This
// also drives the default-open behavior of the Defend accordion so
// students who already have data don't have to expand to find it.
function isDefendStarted(s: TemplateStudioSection): boolean {
  const p = persistedSection(s)
  if (!p) return false
  if ((p.evidenceLinks?.length ?? 0) > 0) return true
  if ((p.structuredEvidence?.length ?? 0) > 0) return true
  if ((p.marketBuilderEntries?.length ?? 0) > 0) return true
  if (p.marketFit) {
    const f = p.marketFit
    if ((f.segments?.length ?? 0) > 0) return true
    if ((f.comparables?.length ?? 0) > 0) return true
    if ((f.evidenceRequests?.length ?? 0) > 0) return true
    if (f.productFacts?.productName?.trim()) return true
    if (f.recommendation?.positioningSummary?.trim()) return true
  }
  if (p.brandFit) return true
  if (p.pricingStrategy) return true
  return false
}

// Defend defaults open when:
//   - the section already has data (above), OR
//   - the section is on a high-rigor / market-evidence chapter
//     (Ch 7, 8, 10, 11) — those sections need the defense surface
//     visible without the student having to discover it.
// Otherwise Defend stays collapsed so the first screen is the
// writing flow, not the form farm.
function shouldOpenDefend(s: TemplateStudioSection): boolean {
  if (isDefendStarted(s)) return true
  return (
    isMarketFitChapter.value ||
    isChapter7.value ||
    isChapter8.value ||
    isChapter11.value
  )
}
</script>

<template>
  <section class="space-y-4">
    <header v-if="!sectionMode" class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Build this section
      </p>
      <h2 class="text-lg font-semibold text-neutral-900">
        Build the {{ studio.title }}
      </h2>
      <p class="text-sm text-neutral-600">
        This is where your team writes the actual deliverable, section by
        section. Each section is split into <strong>Think</strong> (your team's
        thinking and guidance), <strong>Draft</strong> (working draft and final
        Playbook text), and <strong>Defend</strong> (sources, structured
        evidence, and any builder tools that apply).
      </p>
    </header>

    <!-- How to use this workspace — short orientation so students know
         which field to use when. Soft guidance, not a process gate.
         Hidden in section-filter mode; the chapter hub orients
         students before they enter a single-section workspace. -->
    <section
      v-if="!sectionMode"
      class="rounded-md border border-phoenix-100 bg-phoenix-50/60 p-3"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-phoenix-800">
        How to use this workspace
      </p>
      <ol class="mt-1 list-decimal space-y-0.5 pl-5 text-xs text-neutral-700">
        <li>Read the section title and the section guidance.</li>
        <li><strong>Think:</strong> in <em>Your team's thinking</em>, capture rough notes, customer comments, and class discussion in your own words.</li>
        <li><strong>Draft:</strong> turn those notes into a <em>Working draft</em>, then polish a <em>Final Playbook text</em> another team could publish.</li>
        <li><strong>Defend:</strong> add sources, structured evidence, and any builder data that supports your claims.</li>
        <li>Save when ready. The chief reviews against "What the chief is looking for".</li>
      </ol>
    </section>

    <p v-if="lockMessage" class="rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
      {{ lockMessage }}
    </p>
    <p v-if="provisioningError" class="text-xs text-rose-600">
      Couldn't initialize the output workspace: {{ provisioningError }}
    </p>

    <!-- Readiness summary (soft signal only; submit gate stays requirement-coverage).
         Hidden in section-filter mode — the chapter hub renders its
         own progress chips. -->
    <section
      v-if="!sectionMode"
      class="rounded-md border border-neutral-200 bg-white p-3"
    >
      <p class="text-sm font-medium text-neutral-900">
        Output readiness signal:
        {{ readiness.withFinal }} of {{ readiness.total }} sections have final Playbook text.
      </p>
      <p class="mt-1 text-xs text-neutral-500">
        This is a soft signal to help you see how complete the artifact feels —
        it does <strong>not</strong> block submitting for review.
      </p>
      <p v-if="readiness.missingFinal" class="mt-1 text-xs text-neutral-600">
        {{ readiness.missingFinal }}
        {{ readiness.missingFinal === 1 ? 'section still needs' : 'sections still need' }}
        final Playbook text before this artifact reads as finished.
      </p>
      <p v-else class="mt-1 text-xs text-emerald-700">
        Every section has final Playbook text. Nice.
      </p>
      <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-6">
        <div><dt class="inline">Your team's thinking</dt><dd class="inline"> · {{ readiness.withSourceNotes }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Working draft</dt><dd class="inline"> · {{ readiness.withDraft }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Final text</dt><dd class="inline"> · {{ readiness.withFinal }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Sources and proof</dt><dd class="inline"> · {{ readiness.withEvidence }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Defend-your-claim entries</dt><dd class="inline"> · {{ readiness.totalStructuredEvidence }}</dd></div>
        <div><dt class="inline">Demand entries</dt><dd class="inline"> · {{ readiness.totalMarketBuilder }}</dd></div>
      </dl>
      <p class="mt-1 text-xs text-neutral-500">
        Defendable claims use the structured evidence editor below — claim, source,
        assumption, confidence, risk. Soft signal only; never blocks submit.
      </p>
    </section>

    <!-- Chapter 7 demand-assumption reference panel.
         Read-only: never writes back to Chapter 7, never seeds Chapter
         8 fields, never participates in submit/Playbook readiness.
         Visible only when this workspace is rendering the Chapter 8
         deliverable so the cross-chapter listener is a no-op
         elsewhere.
         Independent Student Mode: in section-filter mode this
         collapses by default so a student opening one Ch 8 section
         sees the writing path before earlier-chapter context. In
         chapter mode :open stays true so the existing layout is
         unchanged. -->
    <details
      v-if="isChapter8"
      :open="!sectionMode"
      class="card space-y-3 border-amber-200 bg-amber-50/40"
    >
      <summary class="cursor-pointer space-y-0.5 list-none [&::-webkit-details-marker]:hidden">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Show context from earlier chapters · Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Demand assumptions from Chapter 7
        </h3>
        <p class="text-xs text-neutral-600">
          Use these Chapter 7 demand assumptions when writing Chapter 8
          revenue scenarios. Do not treat estimates as facts. Name the
          assumption and confidence level.
        </p>
      </summary>
      <MarketEvidenceReferencePanel
        source-label="Chapter 7"
        :entries="ch7MarketEntries"
        :loading="ch7Loading"
        empty-message="No Chapter 7 demand estimates have been saved yet."
      />
    </details>

    <!-- Chapter 8 Market Fit cross-section panel.
         Surfaces the segment / scenario thinking from Chapter 7's
         Market Fit Builder plus a deterministic demand-to-revenue
         narrative per section. Read-only — no editing affordance, no
         writes, no AI. The narrative explicitly names the boundary
         between demand-side estimates and the CFO pricing/break-even
         engine. Visible only on Chapter 8 and only when there's at
         least one populated Chapter 7 fit row. -->
    <details
      v-if="isChapter8 && ch7MarketFitRows.length > 0"
      :open="!sectionMode"
      class="card space-y-3 border-violet-200 bg-violet-50/40"
    >
      <summary class="cursor-pointer space-y-0.5 list-none [&::-webkit-details-marker]:hidden">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Show context from earlier chapters · Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Demand model from Chapter 7 (Market Fit)
        </h3>
        <p class="text-xs text-neutral-600">
          Use these Chapter 7 segment and scenario decisions when writing
          revenue scenarios here. Demand scenarios estimate possible buyers
          and revenue. Pricing/break-even still controls cost, margin, and
          break-even decisions.
        </p>
      </summary>
      <MarketFitReferencePanel
        :rows="ch7MarketFitRows"
        :loading="ch7Loading"
        empty-message="No Chapter 7 Market Fit data has been saved yet."
      />
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Demand-to-revenue narrative
        </p>
        <div
          v-for="row in ch7MarketFitRows"
          :key="`mfit-narrative-${row.sectionId}`"
          class="rounded-md border border-neutral-200 bg-white p-2 text-xs"
        >
          <p class="font-medium text-neutral-700">
            From Chapter 7 · {{ row.sectionTitle }}
          </p>
          <p class="mt-1 whitespace-pre-wrap text-neutral-800">
            {{ buildDemandToRevenueNarrative(row.fit) }}
          </p>
        </div>
      </div>
    </details>

    <!-- Chapter 11 retail-carry evidence reference panel.
         Combines Chapter 7 demand entries with a Chapter 8 finalText
         status block so a Phoenix Nest pitch author can see which
         demand and revenue claims have actually been authored upstream.
         Read-only end-to-end: no writes, no copies, no summarization
         beyond a length-capped excerpt of the revenue-scenarios final
         text. The cross-chapter listeners only fire when this section
         is the active deliverable.
         Independent Student Mode: collapses by default in section
         mode (see twin Ch 8 panels above). -->
    <details
      v-if="isChapter11"
      :open="!sectionMode"
      class="card space-y-3 border-amber-200 bg-amber-50/40"
    >
      <summary class="cursor-pointer space-y-0.5 list-none [&::-webkit-details-marker]:hidden">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Show context from earlier chapters · Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Retail carry evidence from Chapters 7 and 8
        </h3>
        <p class="text-xs text-neutral-600">
          Use this evidence to write the Phoenix Nest carry ask. Do not
          treat estimates as facts. Name the buyer, scenario, price,
          weakest assumption, and next validation step.
        </p>
      </summary>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Chapter 7 demand assumptions
        </p>
        <MarketEvidenceReferencePanel
          source-label="Chapter 7"
          :entries="ch7MarketEntries"
          :loading="ch7Loading"
          empty-message="No Chapter 7 demand estimates have been saved yet."
        />
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Chapter 8 revenue reasoning
        </p>
        <p v-if="ch8Loading" class="text-xs text-neutral-500">
          Loading Chapter 8 revenue reasoning…
        </p>
        <p
          v-else-if="ch8FinalSections.length === 0"
          class="text-xs italic text-neutral-500"
        >
          Chapter 8 revenue reasoning has not been finalized yet.
        </p>
        <ul
          v-else
          class="space-y-0.5 text-xs text-neutral-700"
        >
          <li
            v-for="row in ch8FinalSections"
            :key="`ch8-final-${row.sectionId}`"
          >
            ✓ {{ row.sectionTitle }}
          </li>
        </ul>
        <div
          v-if="ch8RevenueScenariosExcerpt"
          class="mt-2 rounded-md border border-neutral-200 bg-white p-2 text-xs"
        >
          <p class="font-medium uppercase tracking-wide text-neutral-500">
            Revenue scenarios excerpt
          </p>
          <p class="mt-1 whitespace-pre-wrap text-neutral-800">
            {{ ch8RevenueScenariosExcerpt }}
          </p>
        </div>
      </div>
    </details>

    <!-- Chapter 11 Phoenix Nest carry-readiness panel.
         Surfaces every Chapter 7 / Chapter 8 Market Fit row alongside
         a deterministic carry-readiness call (validate first / limited
         carry / awareness or test / stronger pitch / no clear signal).
         Each call is advisory: the headline + bulleted reasoning lets
         the pitch author read both the recommendation and why. Read-
         only — no writes, no AI involvement, no final decision.
         Independent Student Mode: collapses by default in section
         mode (see twin Ch 8 panels above). -->
    <details
      v-if="isChapter11 && ch11MarketFitRows.length > 0"
      :open="!sectionMode"
      class="card space-y-3 border-violet-200 bg-violet-50/40"
    >
      <summary class="cursor-pointer space-y-0.5 list-none [&::-webkit-details-marker]:hidden">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Show context from earlier chapters · Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Phoenix Nest carry readiness from Market Fit
        </h3>
        <p class="text-xs text-neutral-600">
          Use this advisory readiness summary to shape — but not decide —
          the carry pitch. The Co-CEO and Phoenix Nest stakeholders still
          own the final call.
        </p>
      </summary>
      <MarketFitReferencePanel
        :rows="ch11MarketFitRows"
        :loading="ch7Loading || ch8Loading"
        empty-message="No Market Fit data from Chapters 7 or 8 has been saved yet."
      />
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Carry-readiness signal per source row
        </p>
        <article
          v-for="row in ch11CarrySummaries"
          :key="`mfit-carry-${row.row.sectionId}`"
          class="rounded-md border border-neutral-200 bg-white p-2 text-xs"
        >
          <p class="text-neutral-500">
            From {{ row.row.sourceLabel }} · {{ row.row.sectionTitle }}
          </p>
          <p class="mt-1 font-medium text-neutral-900">{{ row.summary.headline }}</p>
          <ul
            v-if="row.summary.reasoning.length"
            class="mt-1 list-disc space-y-0.5 pl-5 text-neutral-700"
          >
            <li
              v-for="(line, i) in row.summary.reasoning"
              :key="`mfit-carry-reason-${row.row.sectionId}-${i}`"
            >{{ line }}</li>
          </ul>
        </article>
      </div>
    </details>

    <p v-if="loading" class="text-sm text-neutral-500">Loading workspace…</p>

    <!-- Phase 1 hybrid layout: section-by-section orientation note +
         compact anchor navigation. Hidden in section-filter mode (the
         chapter hub already covers the navigation surface; the
         section page only ever renders one section). -->
    <section
      v-if="!loading && !sectionMode && studio.sections.length"
      class="card space-y-2"
    >
      <p class="text-xs text-neutral-700">
        Work one section at a time. Each section is organized into
        <strong>Think</strong> (your team's thinking and guidance),
        <strong>Draft</strong> (working draft and final Playbook text),
        and <strong>Defend</strong> (sources, structured evidence, and any
        builder tools). Jump directly to a section using the links below.
      </p>
      <nav aria-label="Output section navigation">
        <ol class="flex flex-wrap gap-1.5 text-xs">
          <li
            v-for="(s, i) in studio.sections"
            :key="`nav-${s.id}`"
          >
            <a
              :href="`#output-section-${s.id}`"
              class="rounded border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-neutral-700 hover:bg-neutral-100"
            >{{ i + 1 }}. {{ s.title }}</a>
          </li>
        </ol>
      </nav>
    </section>

    <ol v-if="!loading && visibleSections.length" class="space-y-3">
      <li
        v-for="(s, i) in visibleSections"
        :key="s.id"
        :id="`output-section-${s.id}`"
        class="card space-y-3 scroll-mt-4"
      >
        <!-- Guidance Compression Sprint: in section-filter mode the
             page-level sticky header above already shows the section
             title, the chapter context, and the why-this-matters
             callout. Repeating the section title inside the workspace
             card pushed the writing surface below the fold on a
             1366x768 laptop. We keep the "Last saved" line because
             it's per-section freshness state the sticky header can't
             show. In chapter mode the header still renders fully
             since the page only displays the chapter overview. -->
        <header v-if="!sectionMode" class="space-y-0.5">
          <p class="text-xs uppercase tracking-wide text-neutral-500">
            Section {{ originalSectionIndex(s.id) }}
          </p>
          <h3 class="font-medium text-neutral-900">{{ s.title }}</h3>
          <p
            v-if="persistedSection(s)?.updatedAt"
            class="text-xs text-neutral-500"
          >
            Last saved {{ fmtWhen(persistedSection(s)!.updatedAt) }}
            <span v-if="persistedSection(s)?.updatedByEmail">
              · {{ persistedSection(s)!.updatedByEmail }}
            </span>
          </p>
        </header>
        <p
          v-else-if="persistedSection(s)?.updatedAt"
          class="text-xs text-neutral-500"
        >
          Last saved {{ fmtWhen(persistedSection(s)!.updatedAt) }}
          <span v-if="persistedSection(s)?.updatedByEmail">
            · {{ persistedSection(s)!.updatedByEmail }}
          </span>
        </p>

        <!-- Soft Section Locking sprint: "X is editing this" banner.
             Renders only when another user holds an unexpired lock on
             this section. The countdown reads the lockNowMs reactive
             tick (30 s) so the remaining-time line stays current
             without a refresh. When the TTL elapses, isLockedByOther
             flips to false, this banner clears, edit access is
             restored, and the section-mode acquire watcher takes the
             lock. The PUBLISHABLE gold container, HelpMeUnderstand,
             full section guide, cross-chapter references, and other
             read surfaces remain visible and interactive — they're
             read-only by nature. -->
        <div
          v-if="isLockedByOther(s)"
          class="rounded-md border border-rose-200 bg-rose-50/40 p-3 text-sm text-rose-900"
          role="status"
          aria-live="polite"
        >
          <p class="font-semibold">
            {{ currentSectionLock(s)?.lockedByDisplayName || currentSectionLock(s)?.lockedByEmail || 'Another student' }}
            is editing this section right now.
          </p>
          <p class="mt-1 text-xs text-rose-800">
            You can read but not edit. Try again in
            <span class="font-semibold">{{ lockRemainingLabel(s) }}</span>,
            or check with
            {{ currentSectionLock(s)?.lockedByDisplayName || 'them' }}.
          </p>
        </div>

        <!-- Sprint 2: Think / Draft / Defend phasing.
             Display-only reorganization. None of the underlying save
             paths, builder mounts, or read-only states change — the
             same fields appear under three accordions so a student
             sees a guided writing flow instead of every input at
             once. The accordions use native <details>; user toggles
             are preserved by the DOM during the lifetime of the
             section card. -->
        <ul
          class="flex flex-wrap gap-1.5 text-[11px]"
          aria-label="Section phase progress"
        >
          <li
            :class="[
              'rounded-full border px-2 py-0.5 uppercase tracking-wide',
              isThinkComplete(s)
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-neutral-300 bg-neutral-50 text-neutral-600'
            ]"
          >Build / Think {{ isThinkComplete(s) ? '✓' : '—' }}</li>
          <li
            :class="[
              'rounded-full border px-2 py-0.5 uppercase tracking-wide',
              isDraftComplete(s)
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-neutral-300 bg-neutral-50 text-neutral-600'
            ]"
          >Draft {{ isDraftComplete(s) ? '✓' : '—' }}</li>
          <li
            :class="[
              'rounded-full border px-2 py-0.5 uppercase tracking-wide',
              isDefendStarted(s)
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-neutral-300 bg-neutral-50 text-neutral-600'
            ]"
          >Defend {{ isDefendStarted(s) ? '✓' : '—' }}</li>
          <!-- Review stage — chapter-level. Lights up when the
               deliverable enters in_review / approved. Always shows
               so students see the full flow on every section. -->
          <li
            :class="[
              'rounded-full border px-2 py-0.5 uppercase tracking-wide',
              deliverable.status === 'in_review' || deliverable.status === 'approved'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-neutral-300 bg-neutral-50 text-neutral-600'
            ]"
          >Review {{ deliverable.status === 'approved' ? '✓' : (deliverable.status === 'in_review' ? '…' : '—') }}</li>
        </ul>

        <!-- Guidance Compression Sprint: section-level "What to do"
             microcopy. One sentence, derived deterministically from
             section.actionSummary → studentPrompts[0] → completionCriteria[0]
             → generic fallback (utils/sectionGuidance.ts). Renders
             above HelpMeUnderstand so a student who skips the help
             panel still sees a concrete one-line instruction before
             the writing surface. Curriculum-only; no Firestore reads,
             no AI, no save path. -->
        <p
          class="rounded-md border border-sky-200 bg-sky-50/60 p-2 text-xs text-sky-900"
        >
          <span class="font-semibold uppercase tracking-wide text-sky-700">What to do:</span>
          {{ actionSummaryFor(s) }}
        </p>

        <!-- Independent Student Mode: Help me understand this.
             Deterministic Q&A panel built from existing curriculum
             metadata. No AI, no Firestore, no save path. Sits above
             the writing accordions so a student opening the section
             at home gets the five-question explainer before they
             scroll past the writing surface to find help. -->
        <HelpMeUnderstand
          :studio="studio"
          :section="s"
          :deliverable-id="deliverable.id"
        />

        <!-- SectionDependencyHint — non-blocking copy that names the
             upstream sections this one pulls from and the downstream
             sections it feeds. Hints only; no hard locks, no soft
             locks, no status changes, no Firestore writes. The
             hint set lives in app/utils/sectionDependencyHints.ts
             so adding / editing a hint never touches studio files
             or completion criteria. The component renders nothing
             when the section has no entry. -->
        <SectionDependencyHint :hints="getSectionDependencyHints(s.id)" />

        <!-- ModelAnswerCard — student-facing "what good looks like"
             pattern. Renders only when section.modelAnswerCard is
             populated. Pure curriculum metadata; no Firestore
             writes, no AI, no submit-gate behavior. -->
        <ModelAnswerCard
          v-if="s.modelAnswerCard"
          :card="s.modelAnswerCard"
        />

        <!-- GlossaryChips — compact "Key terms" card. Renders only
             when section.glossaryChips is populated. Definitions
             are plain-language student copy; Ch. 3 entries carry
             the educational-draft safety note inline. -->
        <GlossaryChips
          v-if="s.glossaryChips && s.glossaryChips.length"
          :chips="s.glossaryChips"
        />

        <!-- CrossChapterReferencePanel — small read-only callout that
             reminds students working in Ch. 10 audience / touchpoints
             and Ch. 11 offer to pull from the Ch. 4 local archetype
             application table. Pure navigation hint; never
             auto-imports rows, never overwrites, never gates submit. -->
        <CrossChapterReferencePanel
          v-if="(s.id === 'audience' || s.id === 'touchpoints') && deliverable.id === 'ch-10-marketing-and-campaign-playbook'"
          title="Ch. 4 local archetype application"
          description="Pull from Ch. 4. Your local archetype application explains who this buyer is for Renni, where we reach them, what product fits, what proof we need, and what risk to watch."
          to="/deliverables/ch-04-business-model-canvas/sections/customer-archetype-local-application"
          link-text="Open the Ch. 4 local archetype application"
          :pull-forward="[
            'Local context (Renaissance student / parent / alumni / TechTown visitor / Phoenix Nest buyer / donor)',
            'Product fit (beanie · sweatshirt · t-shirt · baked good · donation)',
            'Message or hook in the buyer\'s language',
            'Proof / evidence needed before this buyer trusts us',
            'Risk or objection that could make the assumption wrong'
          ]"
        />
        <CrossChapterReferencePanel
          v-if="s.id === 'offer' && deliverable.id === 'ch-11-phoenix-nest-retail-carry-pitch'"
          title="Ch. 4 local archetype application"
          description="Pull from Ch. 4. The shelf-fit story per SKU should name the local context (Phoenix Nest buyer, donor / supporter, alumni, etc.) tied back to the canonical national archetype."
          to="/deliverables/ch-04-business-model-canvas/sections/customer-archetype-local-application"
          link-text="Open the Ch. 4 local archetype application"
          :pull-forward="[
            'Local context the buyer plays (Phoenix Nest buyer / donor / alumni / parent)',
            'Product fit per SKU (beanie · sweatshirt · t-shirt · baked good · donation)',
            'Message or hook the buyer would repeat',
            'Proof the buyer needs to feel the SKU is ready',
            'Risk or objection the offer must answer'
          ]"
        />

        <!-- ChipPickQuickStart — lightweight chip-pick scaffolding.
             Renders ONLY for sections that opt in via
             section.chipPickQuickStart.enabled (V1: Ch. 4 customer-segments
             only). Mounts above "Your team's thinking" so a student
             opening the section at home gets a chip-pick scaffolding
             flow that produces a starter draft they can edit before
             saving. The component never autosaves, never targets
             finalText by default, and never overwrites existing
             student writing without an explicit append/replace
             confirmation. The workspace's handleQuickStartApply
             merges the emitted payload and marks dirty so the
             existing Save button stays in charge.
             This pattern is distinct from the upcoming Customer
             Profile Builder pattern; sections opt into one or the
             other via separate metadata fields. -->
        <div
          v-if="s.chipPickQuickStart?.enabled"
          :id="`cqs-${s.id}`"
          class="space-y-1"
        >
          <p class="text-[11px] italic text-neutral-600">
            Use this first if you are stuck. Then paste or adapt your
            result into the draft.
          </p>
          <ChipPickQuickStart
            :section="s"
            :deliverable-id="deliverable.id"
            :current-source-notes="drafts[s.id]?.sourceNotes ?? ''"
            :current-draft-text="drafts[s.id]?.draftText ?? ''"
            :editing-enabled="editingEnabled && !isLockedByOther(s)"
            @apply="(payload) => handleQuickStartApply(s, payload)"
          />
        </div>

        <!-- Customer Archetype Picker — always available on Ch. 4
             customer-segments regardless of the Customer Profile
             Builder beta flag. P0 student-readiness: students need a
             reliable card-deck starting point for the customer
             segment work. Local state, copy-only; never overwrites
             Working Draft. The picker is collapsible inside the
             component, so it stays calm next to the chip-pick
             QuickStart above. -->
        <div
          v-if="s.id === 'customer-segments'"
          :id="`cap-${s.id}`"
          class="space-y-1"
        >
          <CustomerArchetypePicker
            :section-id="s.id"
            :compact="true"
          />
        </div>

        <!-- Customer Profile Builder beta panel.
             Mounted ONLY when:
               1. runtimeConfig.public.customerProfileBuilderEnabled
                  is true (NUXT_CUSTOMER_PROFILE_BUILDER_ENABLED env
                  var); AND
               2. The active section id is `customer-segments` (the
                  Ch. 4 BMC customer-segments slot).
             Sits below the existing ChipPickQuickStart and never
             replaces it. State is local to the component. No
             Firestore writes. Copy Draft Starter writes to
             clipboard only. -->
        <div
          v-if="customerProfileBuilderEnabled && s.id === 'customer-segments'"
          :id="`cpb-${s.id}`"
          class="space-y-1"
        >
          <p class="text-[11px] italic text-neutral-600">
            Use this first if you are stuck. Then paste or adapt your
            result into the draft.
          </p>
          <!-- The page-level CustomerArchetypePicker mounted just
               above already gives students an archetype entry
               point. Hide the CPB-internal collapsible picker so
               students see one clear path on Ch. 4
               customer-segments. -->
          <CustomerProfileBuilder :hide-archetype-picker="true" />
        </div>

        <!-- Key Activities Builder (V1 pilot, BMC Ch. 4 only).
             Mounts when `section.keyActivities?.enabled` is true. V1
             ships this flag enabled only on Ch. 4 BMC's
             `key-activities` section, so the builder never appears on
             Value Propositions or any other BMC block. Local state
             only; no Firestore writes; no AI; copy-only draft starter.
             The kab-<id> wrapper id matches the anchor pickAnchorId-
             ForSection points at, so the SectionRecipePanel CTA can
             smooth-scroll the student into this builder. -->
        <div
          v-if="s.keyActivities?.enabled"
          :id="`kab-${s.id}`"
          class="space-y-1"
        >
          <p class="text-[11px] italic text-neutral-600">
            Use this first if you are stuck. Then paste the draft
            starter into Working Draft and edit it in your own words.
          </p>
          <KeyActivitiesBuilder />
        </div>

        <!-- Finance Table Builder (Ch. 7 / 8 launch sections).
             Mounts when `section.financeTable?.enabled` is true. The
             `kind` selector lives on the section's metadata and picks
             which finance table renders (unit-cost / break-even /
             revenue-scenarios / donation-scenarios / kpi). Local state
             only; no Firestore writes; no AI; copy-only markdown
             output. The ftb-<id> wrapper id matches the anchor
             pickAnchorIdForSection points at so the My Next Actions
             CTA can smooth-scroll the student straight into the
             builder. -->
        <div
          v-if="s.financeTable?.enabled"
          :id="`ftb-${s.id}`"
          class="space-y-1"
        >
          <p
            v-if="s.financeTable?.guidance"
            class="text-[11px] italic text-neutral-600"
          >
            {{ s.financeTable.guidance }}
          </p>
          <FinanceTableBuilder
            :kind="s.financeTable.kind"
            :product-options="productNameList"
          />
        </div>

        <!-- Operations Checklist Builder (Ch. 9 launch sections).
             Mounts when `section.operationsChecklist?.enabled` is
             true. The `kind` selector picks which checklist renders
             (inventory / day-of-sop / baked-goods-sop / continuity).
             Local state only; no Firestore writes; no AI; copy-only
             markdown output. The ocb-<id> wrapper id matches the
             anchor pickAnchorIdForSection points at. The baked-goods
             variant carries a "not legal food-safety advice" warning
             banner inside the component itself. -->
        <div
          v-if="s.operationsChecklist?.enabled"
          :id="`ocb-${s.id}`"
          class="space-y-1"
        >
          <p
            v-if="s.operationsChecklist?.guidance"
            class="text-[11px] italic text-neutral-600"
          >
            {{ s.operationsChecklist.guidance }}
          </p>
          <OperationsChecklistBuilder :kind="s.operationsChecklist.kind" />
        </div>

        <!-- Universal Section Table Builder (Pass A).
             Mounts only when section.universalTable.enabled is true
             AND no other primary builder is enabled on the same
             section. Pure UI + clipboard; no Firestore writes. -->
        <div
          v-if="shouldShowUniversalTable(s)"
          :id="`ust-${s.id}`"
          class="space-y-1"
        >
          <UniversalSectionTableBuilder
            :config="s.universalTable!"
            :product-options="productNameList"
            :initial-rows="builderRowsFor(s, 'universalTable')"
            @update:rows="(rows) => updateBuilderRows(s, 'universalTable', rows)"
          />
        </div>

        <!-- Universal Checklist Builder (Pass A).
             Same conflict guard as Universal Table. -->
        <div
          v-if="shouldShowUniversalChecklist(s)"
          :id="`ucl-${s.id}`"
          class="space-y-1"
        >
          <UniversalChecklistBuilder :config="s.universalChecklist!" />
        </div>

        <!-- Decision Memo Builder (Pass A).
             Same conflict guard as Universal Table. -->
        <div
          v-if="shouldShowDecisionMemo(s)"
          :id="`dmb-${s.id}`"
          class="space-y-1"
        >
          <DecisionMemoBuilder :config="s.decisionMemo!" />
        </div>

        <!-- Brand System Builder (Pass B).
             Mounts only when section.brandSystem.enabled is true AND
             no other primary builder is enabled on the same section.
             Pure UI + clipboard; no Firestore writes. -->
        <div
          v-if="shouldShowBrandSystemBuilder(s)"
          :id="`bsb-${s.id}`"
          class="space-y-1"
        >
          <BrandSystemBuilder :config="s.brandSystem!" />
        </div>

        <!-- Retail Pitch Builder (Pass B).
             Same conflict guard as Brand System Builder. Optional
             productOptions wires through to the SKU column. -->
        <div
          v-if="shouldShowRetailPitchBuilder(s)"
          :id="`rpb-${s.id}`"
          class="space-y-1"
        >
          <RetailPitchBuilder
            :config="s.retailPitch!"
            :product-options="productNameList"
            :initial-cards="builderRowsFor(s, 'retailPitch')"
            @update:cards="(cards) => updateBuilderRows(s, 'retailPitch', cards)"
          />
        </div>

        <!-- Strategy Memo Builder (Pass B).
             Same conflict guard as Brand System Builder. -->
        <div
          v-if="shouldShowStrategyMemoBuilder(s)"
          :id="`smb-${s.id}`"
          class="space-y-1"
        >
          <StrategyMemoBuilder :config="s.strategyMemo!" />
        </div>

        <!-- Corporate Structure / Equity Builder. Primary builder;
             Pass A universal builders are suppressed on the same
             section. The component itself renders the non-removable
             "draft educational model — instructor / adult / legal
             review required before any real-world use" disclaimer.
             Local-state, copy-only; no Firestore writes. -->
        <div
          v-if="shouldShowCorporateStructureBuilder(s)"
          :id="`csb-${s.id}`"
          class="space-y-1"
        >
          <CorporateStructureBuilder :config="s.corporateStructure!" />
        </div>

        <!-- Independent Student Mode: section-level mismatch warnings.
             Surfaces "false progress" cases (Think only, draft without
             final, final without evidence on high-rigor chapters).
             Non-blocking; never gates save, status, submit, or
             approval. Pure helper from app/utils/sectionMismatch.ts. -->
        <ul
          v-if="sectionWarningsFor(s).length"
          class="space-y-1"
          aria-label="Section progress warnings"
        >
          <li
            v-for="(warning, wi) in sectionWarningsFor(s)"
            :key="`warn-${s.id}-${wi}`"
            :class="[
              'rounded-md border p-2 text-xs',
              warning.severity === 'stuck'
                ? 'border-rose-300 bg-rose-50 text-rose-900'
                : warning.severity === 'action-today'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-sky-200 bg-sky-50 text-sky-900'
            ]"
          >
            {{ warning.message }}
          </li>
        </ul>

        <!-- THINK — your team's thinking (rough notes) + a single
             collapsible "Show full section guide" disclosure.
             Guidance Compression Sprint: the writing surface comes
             FIRST so a student opening the section reaches the
             textarea without scrolling past three guidance cards.
             The full guide (SectionGuidanceSummary + ExpertGuidanceCard
             + PlaybookWritingScaffold) sits behind a single
             `<details>` that defaults open for leaders (admin /
             Co-CEO / chief / COO) and collapsed for regular members.
             No component is removed; no save path or guidance
             content is changed; only the default-visibility tier. -->
        <details open class="rounded-md border border-emerald-200 bg-emerald-50/30">
          <summary class="cursor-pointer select-none p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Think
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — what is this section asking, and what does your team already know?
            </span>
          </summary>
          <div class="space-y-3 border-t border-emerald-200 p-3">
            <div>
              <label class="block text-xs font-medium text-neutral-800">
                Your team's thinking
                <textarea
                  v-model="drafts[s.id].sourceNotes"
                  rows="3"
                  :disabled="!editingEnabled || isLockedByOther(s)"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                  placeholder="e.g. Customers at TechTown said the beanies felt premium. Three asked about price."
                  @input="markDirty(s)"
                />
              </label>
              <p class="mt-1 text-xs text-neutral-500">
                Rough notes, customer comments, class discussion, or links you
                found. Write what you know — it does not need to be polished.
              </p>
            </div>

            <!-- Full section guide. Open by default for leaders so
                 chiefs / Co-CEOs / COO / admin can see what students
                 are reading. Collapsed by default for regular members
                 so the writing surface stays above the fold. Once
                 open, the inner cards (SectionGuidanceSummary,
                 ExpertGuidanceCard, PlaybookWritingScaffold) render
                 with their existing content unchanged — sentence
                 starters, evidence guidance, AI coach prompt copy
                 block, "before finalizing" checklist all remain
                 reachable in one click. -->
            <details
              :open="viewerIsLeader"
              class="rounded-md border border-emerald-200 bg-white"
            >
              <summary class="cursor-pointer p-2 text-xs font-medium text-emerald-900">
                Show full section guide
                <span class="ml-1 font-normal text-neutral-600">
                  — section guide, expert guidance, sentence starters, AI coach prompt
                </span>
              </summary>
              <div class="space-y-3 border-t border-emerald-100 p-2">
                <SectionGuidanceSummary
                  :section="s"
                  :section-index="originalSectionIndex(s.id)"
                />

                <ExpertGuidanceCard
                  :section="s"
                  :section-index="originalSectionIndex(s.id)"
                />

                <PlaybookWritingScaffold
                  :deliverable-id="deliverable.id"
                  :section="s"
                />
              </div>
            </details>
          </div>
        </details>

        <!-- DRAFT — working draft + final Playbook text + save. -->
        <details open class="rounded-md border border-sky-200 bg-sky-50/30">
          <summary class="cursor-pointer select-none p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-sky-800">
              Draft
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — turn your team's thinking into Playbook text. Save when ready.
            </span>
          </summary>
          <div class="space-y-3 border-t border-sky-200 p-3">
            <div :id="`dft-${s.id}`">
              <label class="block text-xs font-medium text-neutral-800">
                Working draft
                <textarea
                  v-model="drafts[s.id].draftText"
                  rows="4"
                  :disabled="!editingEnabled || isLockedByOther(s)"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                  placeholder="e.g. House Phoenix beanies are priced for the Civic Premium Buyer at TechTown. Vendor cost is $X; we sell at $Y."
                  @input="markDirty(s)"
                />
              </label>
              <p class="mt-1 text-xs text-neutral-500">
                Write 3–5 sentences. It does not need to be perfect — your team
                can polish later.
              </p>
            </div>
            <!-- Independent Student Mode: PUBLISHABLE Final Playbook
                 text container. Gold border + tag + helper copy make
                 the publishable surface visually distinct from the
                 plain Working draft above. The textarea, v-model,
                 disabled state, and save path are unchanged — only
                 the wrapping. -->
            <div class="rounded-md border-2 border-amber-300 bg-amber-50/40 p-3">
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <span
                  class="rounded-full border border-amber-400 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800"
                >Publishable</span>
                <span class="text-[11px] italic text-amber-900">
                  Final Playbook text — visible to another cohort
                </span>
              </div>
              <label class="mt-2 block text-xs font-medium text-neutral-800">
                Final Playbook text
                <textarea
                  v-model="drafts[s.id].finalText"
                  rows="5"
                  :disabled="!editingEnabled || isLockedByOther(s)"
                  class="mt-1 w-full rounded border border-amber-300 bg-white p-2 text-sm disabled:bg-neutral-50"
                  placeholder="The polished version another team could use next semester."
                  @input="markDirty(s)"
                />
              </label>
              <p class="mt-1 text-xs text-amber-900/90">
                This is the version another team could use next semester. Polish
                the wording, name the claim, and only paste content you have read
                end-to-end.
              </p>
            </div>

            <!-- Independent Student Mode: status quick-action row.
                 Replaces the inline <select> so a student understands
                 the I'm-not-done / I'm-done / I'm-stuck choice without
                 instructor explanation. The status field on the local
                 draft is unchanged; clicking a button sets the same
                 value the <select> used to set, and Save persists it
                 exactly as before. Approval workflow is unchanged. -->
            <div
              v-if="editingEnabled"
              class="space-y-2"
            >
              <p class="text-xs font-medium text-neutral-700">How is this section going?</p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  :class="[
                    'rounded border px-3 py-1 text-xs',
                    drafts[s.id].status === 'in_progress'
                      ? 'border-sky-400 bg-sky-50 text-sky-900 font-semibold'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
                    isLockedByOther(s) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="isLockedByOther(s)"
                  @click="setSectionStatus(s, 'in_progress')"
                >Still working</button>
                <button
                  type="button"
                  :class="[
                    'rounded border px-3 py-1 text-xs',
                    drafts[s.id].status === 'ready'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
                    isLockedByOther(s) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="isLockedByOther(s)"
                  @click="setSectionStatus(s, 'ready')"
                >Ready for review</button>
                <button
                  type="button"
                  :class="[
                    'rounded border px-3 py-1 text-xs',
                    stuckPanelOpen[s.id]
                      ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
                    isLockedByOther(s) ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                  :disabled="isLockedByOther(s)"
                  @click="toggleStuckPanel(s)"
                >I'm stuck</button>
              </div>
              <!-- Stuck panel guidance. Section-level "stuck" is not
                   a Firestore field today; the source of truth for a
                   stuck student is the linked task's blocked state.
                   Per the brief, we point the student back at the
                   task instead of inventing a new field. -->
              <div
                v-if="stuckPanelOpen[s.id]"
                class="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900"
              >
                <p class="font-medium">If you're stuck, do this:</p>
                <ol class="mt-1 list-decimal space-y-0.5 pl-5">
                  <li>
                    <NuxtLink to="/tasks" class="font-medium underline">
                      Open Tasks
                    </NuxtLink>
                    and find the task that sent you here.
                  </li>
                  <li>Click "Mark stuck" on that task and add a one-sentence reason.</li>
                  <li>
                    Use the "Need help? Ask…" copy-message helper in the Think
                    panel above to ping your chief in your team chat.
                  </li>
                </ol>
                <p class="mt-1 italic">
                  Marking the task stuck is the source of truth — it's how your
                  chief sees the blocker.
                </p>
              </div>
            </div>

            <!-- Independent Student Mode: unsaved-changes inline banner.
                 Rendered above the save button so a student who
                 navigates back to the chapter after typing sees the
                 "you have unsaved changes" cue before they leave. The
                 browser-level beforeunload handler is set up in the
                 script block. -->
            <p
              v-if="editingEnabled && hasChanges(s)"
              class="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
            >
              You have unsaved changes. Save before leaving the page.
            </p>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] text-neutral-500">
                Saving stores Think, Draft, Final Playbook text, and saved builder rows together.
              </span>
              <button
                v-if="editingEnabled"
                class="btn-primary text-xs"
                :disabled="savingSectionId === s.id || !hasChanges(s) || isLockedByOther(s)"
                @click="save(s)"
              >
                {{ savingSectionId === s.id ? 'Saving…' : 'Save section' }}
              </button>
            </div>

            <!-- Independent Student Mode: save success + next-step
                 hint + Open next section / Back to chapter links.
                 Renders only after a successful save until the next
                 edit (markDirty clears lastSavedAt). -->
            <div
              v-if="recentlySaved[s.id] && lastSavedAt[s.id]"
              class="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
            >
              <p class="font-medium">Saved at {{ lastSavedAt[s.id] }}.</p>
              <p class="mt-0.5">{{ nextStepHint(s) }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <NuxtLink
                  v-if="nextSectionAfter(s)"
                  :to="`/deliverables/${deliverable.id}/sections/${nextSectionAfter(s)!.id}`"
                  class="rounded border border-emerald-300 bg-white px-2 py-0.5 font-medium text-emerald-900 hover:bg-emerald-50"
                >Open next section →</NuxtLink>
                <NuxtLink
                  :to="`/deliverables/${deliverable.id}`"
                  class="rounded border border-neutral-300 bg-white px-2 py-0.5 text-neutral-700 hover:bg-neutral-50"
                >Back to chapter</NuxtLink>
              </div>
            </div>

            <p v-if="sectionError[s.id]" class="text-xs text-rose-600">
              {{ sectionError[s.id] }}
            </p>
          </div>
        </details>

        <!-- DEFEND — sources, structured evidence, builders, AI critique.
             Cognitive-load pass: tightened from "open whenever the
             chapter is high-rigor" to "open when the section already
             has data, OR the viewer is a leader (admin / Co-CEO /
             chief / COO)." This means a regular student opening a
             Ch 7 / 8 / 10 / 11 section with no data sees the writing
             flow first instead of the form farm; a chief / Co-CEO /
             admin still gets the Defend surface pre-opened so review
             context is one glance away. The inner builders and the
             AI critique panel keep their own defaults. The wrapper
             closes near the bottom of the section card, just before
             the closing </li>. -->
        <details
          :open="isDefendStarted(s) || viewerIsLeader"
          class="rounded-md border border-amber-200 bg-amber-50/30"
        >
          <summary class="cursor-pointer select-none p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Defend
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — sources, evidence, builder tools, and the calculations behind your claims.
            </span>
          </summary>
          <div class="space-y-3 border-t border-amber-200 p-3">

        <!-- Evidence links per section. Manual links only — no Drive API. -->
        <section class="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
          <header class="flex items-baseline justify-between">
            <h4 class="text-xs font-medium text-neutral-800">Sources and proof</h4>
            <span class="text-xs text-neutral-500">
              {{ persistedSection(s)?.evidenceLinks?.length ?? 0 }} linked
            </span>
          </header>
          <p class="text-xs text-neutral-500">
            Attach Google Docs, Slides, folders, images, or other proof that
            supports this section.
          </p>
          <ul
            v-if="persistedSection(s) && (persistedSection(s)!.evidenceLinks?.length ?? 0) > 0"
            class="space-y-1 text-sm"
          >
            <li
              v-for="link in persistedSection(s)!.evidenceLinks"
              :key="link.id"
              class="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-neutral-200 bg-white p-2"
            >
              <div class="min-w-0">
                <a
                  :href="link.url"
                  target="_blank"
                  rel="noopener"
                  class="font-medium text-phoenix-700 hover:underline"
                >{{ link.label }}</a>
                <span class="ml-2 text-xs uppercase tracking-wide text-neutral-500">
                  {{ link.type }}
                </span>
                <p class="text-xs text-neutral-500 truncate">{{ link.url }}</p>
              </div>
              <button
                v-if="editingEnabled"
                class="text-xs text-rose-700 hover:underline"
                :disabled="evidenceBusy === s.id"
                @click="removeLink(s, link.id)"
              >Remove</button>
            </li>
          </ul>
          <p v-else class="text-xs text-neutral-500">
            No evidence linked yet. Paste a Doc, Sheet, Slide, folder, or image URL.
          </p>

          <div v-if="editingEnabled" class="grid gap-2 sm:grid-cols-3">
            <label class="text-xs font-medium text-neutral-800">
              Label
              <input
                v-model="linkForms[s.id].label"
                type="text"
                placeholder="e.g. Beanie vendor quote"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              />
            </label>
            <label class="text-xs font-medium text-neutral-800 sm:col-span-2">
              URL
              <input
                v-model="linkForms[s.id].url"
                type="url"
                placeholder="https://…"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              />
            </label>
            <label class="text-xs font-medium text-neutral-800">
              Type
              <select
                v-model="linkForms[s.id].type"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              >
                <option v-for="t in EVIDENCE_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label
              v-if="studio.requirements.length"
              class="text-xs font-medium text-neutral-800 sm:col-span-2"
            >
              Linked requirement (optional)
              <select
                v-model="linkForms[s.id].requirementId"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
              >
                <option :value="null">— None —</option>
                <option
                  v-for="r in studio.requirements"
                  :key="r.id"
                  :value="r.id"
                >{{ r.label }}</option>
              </select>
            </label>
            <div class="sm:col-span-3 flex items-center justify-between gap-2">
              <p v-if="linkErrors[s.id]" class="text-xs text-rose-600">
                {{ linkErrors[s.id] }}
              </p>
              <button
                class="btn-primary text-xs"
                :disabled="evidenceBusy === s.id"
                @click="addLink(s)"
              >
                {{ evidenceBusy === s.id ? 'Adding…' : 'Add evidence link' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Structured evidence editor (Evidence Standard V1).
             Defendable claims live here: claim / evidence / source /
             assumption / calculation / confidence / risk / next
             validation step. Soft signal — never gates submit. -->
        <section class="space-y-2 rounded-md border border-phoenix-100 bg-phoenix-50/40 p-2">
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h4 class="text-xs font-medium text-neutral-800">Defend your claim</h4>
              <p class="text-xs text-neutral-600">
                {{
                  s.evidencePrompt ||
                  'Log structured evidence for any major claim in this section — claim, source, assumption, confidence, risk, next validation step.'
                }}
              </p>
              <p
                v-if="s.analysisPrompt"
                class="text-xs text-neutral-500"
              >{{ s.analysisPrompt }}</p>
            </div>
            <span class="text-xs text-neutral-500">
              Evidence entries: {{ persistedSection(s)?.structuredEvidence?.length ?? 0 }}
            </span>
          </header>

          <p
            v-if="(persistedSection(s)?.structuredEvidence?.length ?? 0) === 0"
            class="text-xs text-neutral-500"
          >
            No structured evidence entries yet. Add at least one for any major claim.
          </p>

          <ul
            v-if="persistedSection(s) && (persistedSection(s)!.structuredEvidence?.length ?? 0) > 0"
            class="space-y-2"
          >
            <li
              v-for="entry in persistedSection(s)!.structuredEvidence"
              :key="entry.id"
              class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="font-medium text-neutral-900">{{ entry.claim }}</p>
                <span
                  v-if="entry.confidence"
                  class="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
                  :class="confidenceTone(entry.confidence)"
                >{{ entry.confidence }} confidence</span>
              </div>
              <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
                <div><dt class="inline font-medium text-neutral-600">Evidence:</dt> {{ entry.evidence }}</div>
                <div><dt class="inline font-medium text-neutral-600">Source:</dt> {{ entry.source }}</div>
                <div v-if="entry.assumption">
                  <dt class="inline font-medium text-neutral-600">Assumption:</dt> {{ entry.assumption }}
                </div>
                <div v-if="entry.calculation">
                  <dt class="inline font-medium text-neutral-600">Calculation:</dt> {{ entry.calculation }}
                </div>
                <div v-if="entry.risk">
                  <dt class="inline font-medium text-neutral-600">Risk:</dt> {{ entry.risk }}
                </div>
                <div v-if="entry.nextValidation">
                  <dt class="inline font-medium text-neutral-600">Next validation:</dt> {{ entry.nextValidation }}
                </div>
                <div v-if="entry.requirementId">
                  <dt class="inline font-medium text-neutral-600">Linked requirement:</dt>
                  {{
                    studio.requirements.find((r) => r.id === entry.requirementId)?.label
                      || entry.requirementId
                  }}
                </div>
              </dl>
              <div v-if="editingEnabled" class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <button
                  class="text-phoenix-700 hover:underline"
                  @click="startEditEvidence(s.id, entry)"
                >Edit</button>
                <button
                  class="text-rose-700 hover:underline"
                  :disabled="evidenceBusyId === s.id"
                  @click="removeEvidenceEntry(s, entry.id)"
                >Remove</button>
                <span
                  v-if="entry.updatedAt"
                  class="text-neutral-400"
                >Last edited {{ fmtWhen(entry.updatedAt) }}</span>
              </div>
            </li>
          </ul>

          <div v-if="editingEnabled" class="space-y-2">
            <button
              v-if="!evidenceFormOpen[s.id]"
              class="text-xs text-phoenix-700 hover:underline"
              @click="startNewEvidence(s.id)"
            >+ Add evidence entry</button>

            <div
              v-if="evidenceFormOpen[s.id]"
              class="space-y-2 rounded-md border border-neutral-200 bg-white p-2"
            >
              <p class="text-xs font-semibold text-neutral-800">
                {{ evidenceEditing[s.id] ? 'Edit evidence entry' : 'New evidence entry' }}
              </p>
              <ul
                v-if="s.sourceGuidance && s.sourceGuidance.length"
                class="list-disc space-y-0.5 pl-4 text-xs text-neutral-500"
              >
                <li v-for="(g, gi) in s.sourceGuidance" :key="gi">{{ g }}</li>
              </ul>
              <!-- Structured evidence example. Help text only — never
                   saved into student work. Collapsed by default so it
                   doesn't crowd the form. -->
              <details
                class="rounded border border-neutral-200 bg-neutral-50/60 p-2 text-[11px] text-neutral-700"
              >
                <summary class="cursor-pointer font-semibold text-neutral-800">
                  See an example
                </summary>
                <dl class="mt-1 space-y-0.5">
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Claim:</dt>
                    House Phoenix sweatshirts are likely strongest with
                    students and alumni who value school identity.
                  </div>
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Evidence:</dt>
                    Students already respond to school-linked apparel and
                    House Phoenix is the flagship launch brand.
                  </div>
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Source:</dt>
                    Student observation / customer conversations.
                  </div>
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Assumption:</dt>
                    Interest will increase if the design and story are strong.
                  </div>
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Confidence:</dt>
                    Medium.
                  </div>
                  <div>
                    <dt class="inline font-semibold text-neutral-700">Next validation:</dt>
                    Ask 10 students if they would buy at the proposed price.
                  </div>
                </dl>
                <p class="mt-1 italic text-neutral-500">
                  Example only — this is not saved into your work.
                </p>
              </details>
              <label class="block text-xs font-medium text-neutral-800">
                Claim
                <input
                  v-model="evidenceForms[s.id].claim"
                  type="text"
                  placeholder="What are we saying?"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Evidence
                <textarea
                  v-model="evidenceForms[s.id].evidence"
                  rows="2"
                  placeholder="What supports this — feedback, observation, sales data, vendor quote?"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Source
                <input
                  v-model="evidenceForms[s.id].source"
                  type="text"
                  placeholder="Where did the evidence come from? (Person, doc, link description)"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <div class="grid gap-2 sm:grid-cols-2">
                <label class="block text-xs font-medium text-neutral-800">
                  Assumption (optional)
                  <textarea
                    v-model="evidenceForms[s.id].assumption"
                    rows="2"
                    placeholder="What are we estimating or taking on faith?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Calculation (optional)
                  <textarea
                    v-model="evidenceForms[s.id].calculation"
                    rows="2"
                    placeholder="How did we get the number?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
              </div>
              <div class="grid gap-2 sm:grid-cols-3">
                <label class="block text-xs font-medium text-neutral-800">
                  Confidence (optional)
                  <select
                    v-model="evidenceForms[s.id].confidence"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  >
                    <option :value="undefined">— Not set —</option>
                    <option v-for="c in CONFIDENCE_OPTIONS" :key="c" :value="c">{{ c }}</option>
                  </select>
                </label>
                <label class="block text-xs font-medium text-neutral-800 sm:col-span-2">
                  Risk (optional)
                  <input
                    v-model="evidenceForms[s.id].risk"
                    type="text"
                    placeholder="What could make this wrong?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
              </div>
              <label class="block text-xs font-medium text-neutral-800">
                Next validation step (optional)
                <input
                  v-model="evidenceForms[s.id].nextValidation"
                  type="text"
                  placeholder="What do we need to test or check next?"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label
                v-if="studio.requirements.length"
                class="block text-xs font-medium text-neutral-800"
              >
                Linked requirement (optional)
                <select
                  v-model="evidenceForms[s.id].requirementId"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option :value="null">— None —</option>
                  <option
                    v-for="r in studio.requirements"
                    :key="r.id"
                    :value="r.id"
                  >{{ r.label }}</option>
                </select>
              </label>
              <p v-if="evidenceErrors[s.id]" class="text-xs text-rose-600">
                {{ evidenceErrors[s.id] }}
              </p>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <button
                  class="text-xs text-neutral-600 hover:underline"
                  :disabled="evidenceBusyId === s.id"
                  @click="cancelEvidenceForm(s.id)"
                >Cancel</button>
                <button
                  class="btn-primary text-xs"
                  :disabled="evidenceBusyId === s.id"
                  @click="submitEvidence(s)"
                >
                  {{
                    evidenceBusyId === s.id
                      ? 'Saving…'
                      : evidenceEditing[s.id]
                        ? 'Save changes'
                        : 'Add entry'
                  }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Market Builder V1 — demand estimate per section.
             Soft signal only: students name the likely buyer, size the
             reachable market, log assumptions, and produce conservative
             / base / ambitious revenue scenarios. Never gates submit.
             Numbers re-derive from inputs in real time so the visible
             math always matches what gets persisted.
             Visibility is opt-in per section via studio metadata
             (s.marketBuilder?.enabled). Sections that don't opt in skip
             the editor entirely; any pre-existing entries on disabled
             sections stay in Firestore untouched. -->
        <section
          v-if="s.marketBuilder?.enabled"
          class="space-y-2 rounded-md border border-amber-200 bg-amber-50/40 p-2"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h4 class="text-xs font-medium text-neutral-800">Market Builder</h4>
              <p class="text-xs text-neutral-600">
                {{
                  s.marketBuilder?.guidance ||
                  'Quantify the demand assumption for this section. Name the likely buyer, size the reachable market, and project conservative, base, and ambitious scenarios. Estimates only — do not present them as facts.'
                }}
              </p>
            </div>
            <span class="text-xs text-neutral-500">
              Demand entries: {{ persistedSection(s)?.marketBuilderEntries?.length ?? 0 }}
            </span>
          </header>

          <p
            v-if="(persistedSection(s)?.marketBuilderEntries?.length ?? 0) === 0"
            class="text-xs text-neutral-500"
          >
            No demand estimates yet. Add one for any product or audience claim
            in this section.
          </p>

          <ul
            v-if="persistedSection(s) && (persistedSection(s)!.marketBuilderEntries?.length ?? 0) > 0"
            class="space-y-2"
          >
            <li
              v-for="entry in persistedSection(s)!.marketBuilderEntries"
              :key="entry.id"
              class="rounded-md border border-neutral-200 bg-white p-2 text-sm"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-2">
                <p class="font-medium text-neutral-900">{{ entry.productName }}</p>
                <span
                  v-if="entry.confidence"
                  class="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
                  :class="confidenceTone(entry.confidence)"
                >{{ entry.confidence }} confidence</span>
              </div>
              <dl class="mt-1 space-y-0.5 text-xs text-neutral-700">
                <div v-if="entry.primaryMarket">
                  <dt class="inline font-medium text-neutral-600">Primary market:</dt> {{ entry.primaryMarket }}
                </div>
                <div v-if="entry.secondaryMarket">
                  <dt class="inline font-medium text-neutral-600">Secondary market:</dt> {{ entry.secondaryMarket }}
                </div>
                <div v-if="entry.targetAgeRange">
                  <dt class="inline font-medium text-neutral-600">Target age:</dt> {{ entry.targetAgeRange }}
                </div>
                <div v-if="entry.schoolMarketSize != null">
                  <dt class="inline font-medium text-neutral-600">School market:</dt> {{ fmtNumber(entry.schoolMarketSize) }}
                </div>
                <div v-if="entry.broaderMarketSize != null">
                  <dt class="inline font-medium text-neutral-600">Broader market:</dt> {{ fmtNumber(entry.broaderMarketSize) }}
                </div>
                <div v-if="entry.customerAssumption">
                  <dt class="inline font-medium text-neutral-600">Customer assumption:</dt> {{ entry.customerAssumption }}
                </div>
                <div v-if="entry.valueBasedFactor">
                  <dt class="inline font-medium text-neutral-600">Value-based factor:</dt> {{ entry.valueBasedFactor }}
                </div>
                <div v-if="entry.evidenceSource">
                  <dt class="inline font-medium text-neutral-600">Evidence / source:</dt> {{ entry.evidenceSource }}
                  <span v-if="entry.sourceType"> · {{ entry.sourceType }}</span>
                </div>
                <div v-if="entry.strongestEvidence">
                  <dt class="inline font-medium text-neutral-600">Strongest evidence:</dt> {{ entry.strongestEvidence }}
                </div>
                <div v-if="entry.weakestAssumption">
                  <dt class="inline font-medium text-neutral-600">Weakest assumption:</dt> {{ entry.weakestAssumption }}
                </div>
                <div v-if="entry.nextValidation">
                  <dt class="inline font-medium text-neutral-600">Next validation:</dt> {{ entry.nextValidation }}
                </div>
                <div v-if="entry.linkedRequirementId">
                  <dt class="inline font-medium text-neutral-600">Linked requirement:</dt>
                  {{
                    studio.requirements.find((r) => r.id === entry.linkedRequirementId)?.label
                      || entry.linkedRequirementId
                  }}
                </div>
              </dl>
              <div
                v-if="(entry.scenarios?.length ?? 0) > 0"
                class="mt-2 overflow-x-auto"
              >
                <table class="min-w-full text-xs">
                  <thead>
                    <tr class="text-left text-neutral-500">
                      <th class="py-1 pr-2 font-medium">Scenario</th>
                      <th class="py-1 pr-2 font-medium">Audience</th>
                      <th class="py-1 pr-2 font-medium">Interest %</th>
                      <th class="py-1 pr-2 font-medium">Conversion %</th>
                      <th class="py-1 pr-2 font-medium">Buyers</th>
                      <th class="py-1 pr-2 font-medium">Price</th>
                      <th class="py-1 pr-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="scn in entry.scenarios"
                      :key="scn.id"
                      class="align-top"
                    >
                      <td class="py-1 pr-2 font-medium text-neutral-800">
                        {{ SCENARIO_LABEL_COPY[scn.label] }}
                      </td>
                      <td class="py-1 pr-2 text-neutral-700">{{ fmtNumber(scn.reachableAudience) }}</td>
                      <td class="py-1 pr-2 text-neutral-700">
                        {{ scn.interestRatePercent != null ? `${scn.interestRatePercent}%` : '—' }}
                      </td>
                      <td class="py-1 pr-2 text-neutral-700">
                        {{ scn.conversionRatePercent != null ? `${scn.conversionRatePercent}%` : '—' }}
                      </td>
                      <td class="py-1 pr-2 text-neutral-800">{{ fmtNumber(deriveBuyers(scn)) }}</td>
                      <td class="py-1 pr-2 text-neutral-700">{{ fmtCurrency(scn.price) }}</td>
                      <td class="py-1 pr-2 font-medium text-neutral-900">{{ fmtCurrency(deriveRevenue(scn)) }}</td>
                    </tr>
                  </tbody>
                </table>
                <p class="mt-1 text-[11px] text-neutral-500">
                  Buyers = audience × (interest % ÷ 100) × (conversion % ÷ 100). Revenue = buyers × price.
                </p>
              </div>
              <div v-if="editingEnabled" class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <button
                  class="text-phoenix-700 hover:underline"
                  @click="startEditMarket(s.id, entry)"
                >Edit</button>
                <button
                  class="text-rose-700 hover:underline"
                  :disabled="marketBusyId === s.id"
                  @click="removeMarketEntry(s, entry.id)"
                >Remove</button>
                <span
                  v-if="entry.updatedAt"
                  class="text-neutral-400"
                >Last edited {{ fmtWhen(entry.updatedAt) }}</span>
              </div>
            </li>
          </ul>

          <div v-if="editingEnabled" class="space-y-2">
            <button
              v-if="!marketFormOpen[s.id]"
              class="text-xs text-phoenix-700 hover:underline"
              @click="startNewMarket(s.id)"
            >+ Add demand estimate</button>

            <div
              v-if="marketFormOpen[s.id]"
              class="space-y-2 rounded-md border border-neutral-200 bg-white p-2"
            >
              <p class="text-xs font-semibold text-neutral-800">
                {{ marketEditing[s.id] ? 'Edit demand estimate' : 'New demand estimate' }}
              </p>
              <ul class="list-disc space-y-0.5 pl-4 text-xs text-neutral-500">
                <li>If you use a number, name the source or clearly label the assumption.</li>
                <li>Use conservative, base, and ambitious scenarios — not a single guess.</li>
                <li>Explain the weakest assumption before relying on this number.</li>
                <li>Name the next validation step (survey, preorder, customer interview, pop-up observation).</li>
              </ul>

              <label class="block text-xs font-medium text-neutral-800">
                Product
                <input
                  v-model="marketForms[s.id].productName"
                  type="text"
                  placeholder="House Phoenix beanie, Humble Oven cookies, etc."
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Product story (optional)
                <textarea
                  v-model="marketForms[s.id].productStory"
                  rows="2"
                  placeholder="One or two sentences a Phoenix Nest buyer would understand."
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <div class="grid gap-2 sm:grid-cols-2">
                <label class="block text-xs font-medium text-neutral-800">
                  Primary market
                  <input
                    v-model="marketForms[s.id].primaryMarket"
                    type="text"
                    placeholder="Who is the most likely buyer?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Secondary market
                  <input
                    v-model="marketForms[s.id].secondaryMarket"
                    type="text"
                    placeholder="Who else might buy this?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Target age range
                  <input
                    v-model="marketForms[s.id].targetAgeRange"
                    type="text"
                    placeholder="e.g. 14–18 students, 30–55 parents"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Value-based factor
                  <input
                    v-model="marketForms[s.id].valueBasedFactor"
                    type="text"
                    placeholder="What makes this worth the price to them?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  School market size
                  <input
                    :value="marketForms[s.id].schoolMarketSize ?? ''"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Reachable inside Renaissance"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                    @input="(event) => setMarketNumber(s.id, 'schoolMarketSize', (event.target as HTMLInputElement).value)"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Broader Detroit-adjacent market size
                  <input
                    :value="marketForms[s.id].broaderMarketSize ?? ''"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Estimated reach beyond Renaissance"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                    @input="(event) => setMarketNumber(s.id, 'broaderMarketSize', (event.target as HTMLInputElement).value)"
                  />
                </label>
              </div>
              <label class="block text-xs font-medium text-neutral-800">
                Customer assumption
                <textarea
                  v-model="marketForms[s.id].customerAssumption"
                  rows="2"
                  placeholder="What are we assuming about who buys and why?"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <div class="grid gap-2 sm:grid-cols-2">
                <label class="block text-xs font-medium text-neutral-800">
                  Evidence / source
                  <input
                    v-model="marketForms[s.id].evidenceSource"
                    type="text"
                    placeholder="Where does the demand signal come from?"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Source type
                  <input
                    v-model="marketForms[s.id].sourceType"
                    type="text"
                    placeholder="Survey, interview, observation, preorder, comp brand…"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Confidence
                  <select
                    v-model="marketForms[s.id].confidence"
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  >
                    <option :value="undefined">— Not set —</option>
                    <option v-for="c in CONFIDENCE_OPTIONS" :key="c" :value="c">{{ c }}</option>
                  </select>
                </label>
                <label class="block text-xs font-medium text-neutral-800">
                  Strongest evidence
                  <input
                    v-model="marketForms[s.id].strongestEvidence"
                    type="text"
                    placeholder="The single best proof point we have."
                    class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                  />
                </label>
              </div>
              <label class="block text-xs font-medium text-neutral-800">
                Weakest assumption
                <textarea
                  v-model="marketForms[s.id].weakestAssumption"
                  rows="2"
                  placeholder="What could most easily make this estimate wrong?"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label class="block text-xs font-medium text-neutral-800">
                Next validation step
                <input
                  v-model="marketForms[s.id].nextValidation"
                  type="text"
                  placeholder="e.g. preorder test, intercept survey at the pop-up"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                />
              </label>
              <label
                v-if="studio.requirements.length"
                class="block text-xs font-medium text-neutral-800"
              >
                Linked requirement (optional)
                <select
                  v-model="marketForms[s.id].linkedRequirementId"
                  class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm"
                >
                  <option :value="null">— None —</option>
                  <option
                    v-for="r in studio.requirements"
                    :key="r.id"
                    :value="r.id"
                  >{{ r.label }}</option>
                </select>
              </label>

              <!-- Scenarios -->
              <div class="space-y-1">
                <p class="text-xs font-semibold text-neutral-800">
                  Conservative · Base · Ambitious
                </p>
                <p class="text-[11px] text-neutral-500">
                  Buyers = audience × (interest % ÷ 100) × (conversion % ÷ 100). Revenue = buyers × price.
                </p>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-xs">
                    <thead>
                      <tr class="text-left text-neutral-500">
                        <th class="py-1 pr-2 font-medium">Scenario</th>
                        <th class="py-1 pr-2 font-medium">Reachable audience</th>
                        <th class="py-1 pr-2 font-medium">Interest %</th>
                        <th class="py-1 pr-2 font-medium">Conversion %</th>
                        <th class="py-1 pr-2 font-medium">Buyers</th>
                        <th class="py-1 pr-2 font-medium">Price</th>
                        <th class="py-1 pr-2 font-medium">Revenue</th>
                        <th class="py-1 pr-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(scn, scnIndex) in marketForms[s.id].scenarios"
                        :key="scn.id"
                        class="align-top"
                      >
                        <td class="py-1 pr-2 font-medium text-neutral-800">
                          {{ SCENARIO_LABEL_COPY[scn.label] }}
                        </td>
                        <td class="py-1 pr-2">
                          <input
                            :value="scn.reachableAudience ?? ''"
                            type="number"
                            min="0"
                            step="1"
                            class="w-24 rounded border border-neutral-300 p-1 text-xs"
                            @input="(event) => setScenarioNumber(s.id, scnIndex, 'reachableAudience', (event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-1 pr-2">
                          <input
                            :value="scn.interestRatePercent ?? ''"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            class="w-20 rounded border border-neutral-300 p-1 text-xs"
                            @input="(event) => setScenarioNumber(s.id, scnIndex, 'interestRatePercent', (event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-1 pr-2">
                          <input
                            :value="scn.conversionRatePercent ?? ''"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            class="w-20 rounded border border-neutral-300 p-1 text-xs"
                            @input="(event) => setScenarioNumber(s.id, scnIndex, 'conversionRatePercent', (event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-1 pr-2 text-neutral-800">{{ fmtNumber(deriveBuyers(scn)) }}</td>
                        <td class="py-1 pr-2">
                          <input
                            :value="scn.price ?? ''"
                            type="number"
                            min="0"
                            step="0.01"
                            class="w-20 rounded border border-neutral-300 p-1 text-xs"
                            @input="(event) => setScenarioNumber(s.id, scnIndex, 'price', (event.target as HTMLInputElement).value)"
                          />
                        </td>
                        <td class="py-1 pr-2 font-medium text-neutral-900">
                          {{ fmtCurrency(deriveRevenue(scn)) }}
                        </td>
                        <td class="py-1 pr-2">
                          <input
                            v-model="scn.notes"
                            type="text"
                            placeholder="Anything to flag?"
                            class="w-32 rounded border border-neutral-300 p-1 text-xs"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p v-if="marketErrors[s.id]" class="text-xs text-rose-600">
                {{ marketErrors[s.id] }}
              </p>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <button
                  class="text-xs text-neutral-600 hover:underline"
                  :disabled="marketBusyId === s.id"
                  @click="cancelMarketForm(s.id)"
                >Cancel</button>
                <button
                  class="btn-primary text-xs"
                  :disabled="marketBusyId === s.id"
                  @click="submitMarket(s)"
                >
                  {{
                    marketBusyId === s.id
                      ? 'Saving…'
                      : marketEditing[s.id]
                        ? 'Save changes'
                        : 'Add demand estimate'
                  }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Market Fit Builder V1 — broader segment-comparison tool.
             Visible only on Ch 7 / 8 / 10 / 11 sections that opt in
             via studio metadata. Independent of Market Builder and AI
             Critique: a section can have any combination.
             Independent Student Mode: collapsed by default with a
             one-line student-friendly explainer above the click
             target. The builder itself, the editing-enabled gate,
             and every save path are unchanged. -->
        <details
          v-if="shouldShowMarketFit(s)"
          :id="`mfb-${s.id}`"
          class="rounded-md border border-violet-200 bg-violet-50/30"
        >
          <summary class="cursor-pointer p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Market Fit Builder
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — use this first if you are stuck on customers or demand. Then paste or adapt your result into the draft.
            </span>
          </summary>
          <div class="border-t border-violet-200 p-3">
            <MarketFitBuilder
              :deliverable-id="deliverable.id"
              :section-id="s.id"
              :section-title="s.title"
              :initial="persistedMarketFit(s)"
              :editing-enabled="editingEnabled && !isLockedByOther(s)"
              :guidance="s.marketFit?.guidance ?? null"
              :product-options="productNameList"
            />
          </div>
        </details>

        <!-- Brand Fit Builder V1 — section-level identity-vs-market
             signal tool. Visible only on sections that opt in via
             studio metadata (Ch 5 / Ch 6 / Ch 10 brand-relevant
             sections). Independent of Market Fit / Market Builder /
             AI Critique. We pass the same section's Market Fit state
             as a read-only context callout so the team can validate
             that brand identity signals the same target customer.
             Brand Fit works without Market Fit data.
             Independent Student Mode: collapsed by default. -->
        <details
          v-if="shouldShowBrandFit(s)"
          :id="`bfb-${s.id}`"
          class="rounded-md border border-rose-200 bg-rose-50/30"
        >
          <summary class="cursor-pointer p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-rose-800">
              Brand Fit Builder
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — use this first if you are stuck on identity, voice, or references. Then paste or adapt your result into the draft.
            </span>
          </summary>
          <div class="border-t border-rose-200 p-3">
            <BrandFitBuilder
              :deliverable-id="deliverable.id"
              :section-id="s.id"
              :section-title="s.title"
              :initial="persistedBrandFit(s)"
              :editing-enabled="editingEnabled && !isLockedByOther(s)"
              :guidance="s.brandFit?.guidance ?? null"
              :market-fit-context="persistedMarketFit(s)"
            />
          </div>
        </details>

        <!-- Pricing Strategy Builder V1 — Ch. 8 Section 2 only.
             Deterministic pricing decision tool. Reads Ch. 7 market
             fit + demand entries as read-only context but never
             writes upstream and never writes to pricingScenarios.
             /pricing remains the operational source of truth.
             Independent Student Mode: collapsed by default. -->
        <details
          v-if="shouldShowPricingStrategy(s)"
          :id="`psb-${s.id}`"
          class="rounded-md border border-amber-200 bg-amber-50/30"
        >
          <summary class="cursor-pointer p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Pricing Strategy Builder
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — use this first if you are stuck on price, cost, or margin. Then paste or adapt your result into the draft.
            </span>
          </summary>
          <div class="border-t border-amber-200 p-3">
            <PricingStrategyBuilder
              :deliverable-id="deliverable.id"
              :section-id="s.id"
              :section-title="s.title"
              :initial="persistedPricingStrategy(s)"
              :editing-enabled="editingEnabled && !isLockedByOther(s)"
              :guidance="s.pricingStrategy?.guidance ?? null"
              :ch7-market-fit="ch7MarketFitForPricing"
              :ch7-market-entries="ch7MarketEntriesForPricing"
              :product-options="productNameList"
            />
          </div>
        </details>

        <!-- AI Critique V1 — read-only coach panel for the Market
             Evidence Suite. Visible only when:
               (a) the chapter is one of the three market-evidence
                   chapters (Ch 7 / 8 / 11),
               (b) the section opted into Market Builder, and
               (c) the section has at least some student-authored
                   input (source notes / draft / final / evidence /
                   structured evidence / market builder entries).
             The panel never writes back to the document, never
             auto-runs, and renders only after a user click.
             Independent Student Mode: collapsed by default. The
             panel itself still requires a Review-button click to
             call the model — collapsing this <details> does not
             change the existing user-triggered semantics. -->
        <details
          v-if="shouldShowAiCritique(s)"
          class="rounded-md border border-sky-200 bg-sky-50/30"
        >
          <summary class="cursor-pointer p-3">
            <span class="text-xs font-semibold uppercase tracking-wide text-sky-800">
              AI critique
            </span>
            <span class="ml-1 text-xs text-neutral-700">
              — coach this section against the market evidence rubric. Suggestions only; nothing is saved or submitted. Optional.
            </span>
          </summary>
          <div class="border-t border-sky-200 p-3">
            <MarketEvidenceCritiquePanel
              :request="buildAiRequest(s)"
            />
          </div>
        </details>
          </div>
        </details>
      </li>
    </ol>

    <!-- Playbook-ready preview — read-only roll-up of every section's final text.
         Hidden in section-filter mode; the chapter hub renders its own
         (extracted) DeliverablePlaybookPreview so editors don't see a
         cluttered roll-up of unrelated sections while focused on one. -->
    <section v-if="!sectionMode" class="card space-y-3">
      <header>
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Playbook-ready preview
        </p>
        <h3 class="font-medium text-neutral-900">{{ studio.title }}</h3>
        <p class="text-xs text-neutral-600">
          Read-only roll-up of the final Playbook text from each section above.
          This is what your team is preparing for the Brand &amp; Operations
          Playbook.
        </p>
      </header>
      <ol class="space-y-3">
        <li
          v-for="s in studio.sections"
          :key="`preview-${s.id}`"
          class="rounded-md border border-neutral-200 p-3"
        >
          <p class="text-sm font-medium text-neutral-900">{{ s.title }}</p>
          <p
            v-if="(persistedSection(s)?.finalText ?? '').trim()"
            class="mt-1 whitespace-pre-wrap text-sm text-neutral-800"
          >{{ persistedSection(s)!.finalText }}</p>
          <p v-else class="mt-1 text-xs italic text-neutral-500">
            Final text not added yet.
          </p>
          <SavedBuilderStatePreview
            :section="s"
            :builder-state="persistedSection(s)?.builderState"
          />
          <ul
            v-if="(persistedSection(s)?.evidenceLinks?.length ?? 0) > 0"
            class="mt-2 space-y-0.5 text-xs"
          >
            <li
              v-for="link in persistedSection(s)!.evidenceLinks"
              :key="`preview-link-${link.id}`"
            >
              ↳
              <a
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="text-phoenix-700 hover:underline"
              >{{ link.label }}</a>
              <span class="ml-1 uppercase tracking-wide text-neutral-500">
                {{ link.type }}
              </span>
            </li>
          </ul>
          <!-- Structured evidence roll-up under the section's final text. -->
          <div
            v-if="(persistedSection(s)?.structuredEvidence?.length ?? 0) > 0"
            class="mt-2 space-y-1.5"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Evidence
            </p>
            <ul class="space-y-1.5 text-xs">
              <li
                v-for="entry in persistedSection(s)!.structuredEvidence"
                :key="`preview-evidence-${entry.id}`"
                class="rounded border border-neutral-200 bg-neutral-50 p-2"
              >
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <p class="font-medium text-neutral-900">{{ entry.claim }}</p>
                  <span
                    v-if="entry.confidence"
                    class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="confidenceTone(entry.confidence)"
                  >{{ entry.confidence }}</span>
                </div>
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Evidence:</span> {{ entry.evidence }}
                </p>
                <p class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Source:</span> {{ entry.source }}
                </p>
                <p v-if="entry.risk" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Risk:</span> {{ entry.risk }}
                </p>
                <p v-if="entry.nextValidation" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Next validation:</span> {{ entry.nextValidation }}
                </p>
              </li>
            </ul>
          </div>
          <!-- Market Builder roll-up under the section's final text.
               Compact format: product + target market on top, scenarios
               on a single row, then strongest evidence / weakest
               assumption / next validation. Mirrors the Playbook
               sentence the chapter is meant to produce.
               Same opt-in gate as the editor: sections that haven't
               enabled Market Builder skip the roll-up so the Playbook
               preview matches what the section can actually author. -->
          <div
            v-if="s.marketBuilder?.enabled && (persistedSection(s)?.marketBuilderEntries?.length ?? 0) > 0"
            class="mt-2 space-y-1.5"
          >
            <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Demand estimate
            </p>
            <ul class="space-y-1.5 text-xs">
              <li
                v-for="entry in persistedSection(s)!.marketBuilderEntries"
                :key="`preview-market-${entry.id}`"
                class="rounded border border-neutral-200 bg-neutral-50 p-2"
              >
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <p class="font-medium text-neutral-900">{{ entry.productName }}</p>
                  <span
                    v-if="entry.confidence"
                    class="rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="confidenceTone(entry.confidence)"
                  >{{ entry.confidence }}</span>
                </div>
                <p
                  v-if="entry.primaryMarket || entry.secondaryMarket"
                  class="text-neutral-700"
                >
                  <span class="font-medium text-neutral-600">Likely buyer:</span>
                  {{ entry.primaryMarket || '—' }}
                  <span v-if="entry.secondaryMarket"> · also {{ entry.secondaryMarket }}</span>
                </p>
                <p
                  v-if="entry.schoolMarketSize != null || entry.broaderMarketSize != null"
                  class="text-neutral-700"
                >
                  <span class="font-medium text-neutral-600">Market size:</span>
                  <span v-if="entry.schoolMarketSize != null">school {{ fmtNumber(entry.schoolMarketSize) }}</span>
                  <span v-if="entry.schoolMarketSize != null && entry.broaderMarketSize != null"> · </span>
                  <span v-if="entry.broaderMarketSize != null">broader {{ fmtNumber(entry.broaderMarketSize) }}</span>
                </p>
                <ul
                  v-if="(entry.scenarios?.length ?? 0) > 0"
                  class="mt-1 space-y-0.5"
                >
                  <li
                    v-for="scn in entry.scenarios"
                    :key="`preview-market-${entry.id}-${scn.id}`"
                    class="text-neutral-700"
                  >
                    <span class="font-medium text-neutral-600">
                      {{ SCENARIO_LABEL_COPY[scn.label] }}:
                    </span>
                    {{ fmtNumber(deriveBuyers(scn)) }} buyers ·
                    {{ fmtCurrency(deriveRevenue(scn)) }} revenue
                  </li>
                </ul>
                <p v-if="entry.strongestEvidence" class="mt-1 text-neutral-700">
                  <span class="font-medium text-neutral-600">Strongest evidence:</span>
                  {{ entry.strongestEvidence }}
                </p>
                <p v-if="entry.weakestAssumption" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Weakest assumption:</span>
                  {{ entry.weakestAssumption }}
                </p>
                <p v-if="entry.nextValidation" class="text-neutral-700">
                  <span class="font-medium text-neutral-600">Next validation:</span>
                  {{ entry.nextValidation }}
                </p>
              </li>
            </ul>
          </div>
          <!-- Market Fit Builder roll-up. Compact on purpose: product +
               price, named primary/launch markets, strongest evidence
               and weakest assumption, plus the pinned tradeoff line so
               the Playbook reads as a defended positioning statement
               and not a single guess. -->
          <div
            v-if="s.marketFit?.enabled && persistedMarketFit(s)"
            class="mt-2 space-y-1 text-xs"
          >
            <p class="font-medium uppercase tracking-wide text-neutral-500">
              Market fit
            </p>
            <p
              v-if="(persistedMarketFit(s)!.productFacts?.productName || '').trim() ||
                    (persistedMarketFit(s)!.productFacts?.price != null)"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Product:</span>
              {{ persistedMarketFit(s)!.productFacts?.productName || '—' }}
              <span v-if="persistedMarketFit(s)!.productFacts?.price != null">
                · {{ fmtCurrency(persistedMarketFit(s)!.productFacts!.price ?? null) }}
              </span>
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.likelyPrimaryMarket || '').trim()"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Primary market:</span>
              {{ persistedMarketFit(s)!.recommendation!.likelyPrimaryMarket }}
              <span v-if="(persistedMarketFit(s)!.recommendation?.likelySecondaryMarket || '').trim()">
                · secondary: {{ persistedMarketFit(s)!.recommendation!.likelySecondaryMarket }}
              </span>
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.launchOrValidationMarket || '').trim()"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Launch / validation market:</span>
              {{ persistedMarketFit(s)!.recommendation!.launchOrValidationMarket }}
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.positioningSummary || '').trim()"
              class="whitespace-pre-wrap text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Positioning:</span>
              {{ persistedMarketFit(s)!.recommendation!.positioningSummary }}
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.strongestEvidence || '').trim()"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Strongest evidence:</span>
              {{ persistedMarketFit(s)!.recommendation!.strongestEvidence }}
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.weakestAssumption || '').trim()"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Weakest assumption:</span>
              {{ persistedMarketFit(s)!.recommendation!.weakestAssumption }}
            </p>
            <p
              v-if="(persistedMarketFit(s)!.recommendation?.recommendedNextValidation || '').trim()"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Next validation:</span>
              {{ persistedMarketFit(s)!.recommendation!.recommendedNextValidation }}
            </p>
            <!-- Compact demand snapshot — only renders when the
                 student has selected a segment and entered scenario
                 percentages. Same numbers the editor and the
                 cross-chapter panels use, kept short for the
                 Playbook-ready preview. -->
            <template v-if="buildDemandSnapshot(persistedMarketFit(s))">
              <p class="text-neutral-700">
                <span class="font-medium text-neutral-600">Selected segment:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.segmentName }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.targetProfile"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Target profile:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.targetProfile }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.profileLogic"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Profile logic:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.profileLogic }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.baseBuyers != null
                      || buildDemandSnapshot(persistedMarketFit(s))!.baseRevenue != null"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Base scenario:</span>
                {{ fmtNumber(buildDemandSnapshot(persistedMarketFit(s))!.baseBuyers) }} buyers ·
                {{ fmtCurrency(buildDemandSnapshot(persistedMarketFit(s))!.baseRevenue) }} revenue
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.strongestCompType"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Strongest comp type:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.strongestCompType }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.sourceGap"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Source gap:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.sourceGap }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.tradeoff"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Key tradeoff:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.tradeoff }}
              </p>
              <p
                v-if="buildDemandSnapshot(persistedMarketFit(s))!.validationStep"
                class="text-neutral-700"
              >
                <span class="font-medium text-neutral-600">Validation step:</span>
                {{ buildDemandSnapshot(persistedMarketFit(s))!.validationStep }}
              </p>
            </template>
          </div>

          <!-- Brand Fit Builder roll-up. Compact: brand signal +
               target match + perceived price/quality + strongest
               reference + production risk + recommended adjustment +
               validation step. Same opt-in gate as the editor —
               sections that haven't enabled Brand Fit skip the
               roll-up so the preview matches what the section can
               actually author. -->
          <div
            v-if="s.brandFit?.enabled && buildBrandFitSnapshot(persistedBrandFit(s))"
            class="mt-2 space-y-1 text-xs"
          >
            <p class="font-medium uppercase tracking-wide text-neutral-500">
              Brand fit
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.brandSignal"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Brand signal:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.brandSignal }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.targetCustomerMatch"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Target match:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.targetCustomerMatch }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.perceivedPriceQuality"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Perceived price / quality:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.perceivedPriceQuality }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.strongestReference"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Strongest reference:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.strongestReference }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.productionRisk"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Production risk:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.productionRisk }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.recommendedAdjustment"
              class="whitespace-pre-wrap text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Recommended adjustment:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.recommendedAdjustment }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.validationStep"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Validation step:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.validationStep }}
            </p>
            <p
              v-if="buildBrandFitSnapshot(persistedBrandFit(s))!.nextBestMove"
              class="text-neutral-700"
            >
              <span class="font-medium text-neutral-600">Next best move:</span>
              {{ buildBrandFitSnapshot(persistedBrandFit(s))!.nextBestMove }}
            </p>
          </div>
        </li>
      </ol>
    </section>
  </section>
</template>
