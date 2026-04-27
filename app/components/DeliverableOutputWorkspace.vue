<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  useDeliverableOutputs,
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
import MarketFitBuilder from '~/components/MarketFitBuilder.vue'
import MarketFitReferencePanel, {
  type ReferencedMarketFitRow
} from '~/components/MarketFitReferencePanel.vue'
import BrandFitBuilder from '~/components/BrandFitBuilder.vue'
import PricingStrategyBuilder from '~/components/PricingStrategyBuilder.vue'
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
}
const drafts = ref<Record<string, LocalDraft>>({})
const dirty = ref<Record<string, boolean>>({})
const savingSectionId = ref<string | null>(null)
const sectionError = ref<Record<string, string>>({})

function persistedSection(s: TemplateStudioSection): DeliverableOutputSection | null {
  return output.value?.sections?.[s.id] ?? null
}

function deriveStatus(d: LocalDraft): DeliverableOutputSectionStatus {
  if (d.status === 'ready') return 'ready'
  const filled =
    d.sourceNotes.trim() !== '' ||
    d.draftText.trim() !== '' ||
    d.finalText.trim() !== ''
  return filled ? 'in_progress' : 'empty'
}

function ensureDraft(s: TemplateStudioSection) {
  if (!drafts.value[s.id]) {
    const persisted = persistedSection(s)
    drafts.value[s.id] = {
      sourceNotes: persisted?.sourceNotes ?? '',
      draftText: persisted?.draftText ?? '',
      finalText: persisted?.finalText ?? '',
      status: persisted?.status ?? 'empty'
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
          status: persisted.status ?? 'empty'
        }
        dirty.value[s.id] = false
      } else if (!dirty.value[s.id]) {
        drafts.value[s.id] = {
          sourceNotes: persisted.sourceNotes ?? '',
          draftText: persisted.draftText ?? '',
          finalText: persisted.finalText ?? '',
          status: persisted.status ?? 'empty'
        }
      }
    }
  },
  { deep: true, immediate: true }
)

function markDirty(s: TemplateStudioSection) {
  dirty.value[s.id] = true
}

function hasChanges(s: TemplateStudioSection): boolean {
  if (!dirty.value[s.id]) return false
  const d = drafts.value[s.id]
  const persisted = persistedSection(s)
  if (!persisted) return Boolean(d.sourceNotes || d.draftText || d.finalText)
  return (
    d.sourceNotes !== (persisted.sourceNotes ?? '') ||
    d.draftText !== (persisted.draftText ?? '') ||
    d.finalText !== (persisted.finalText ?? '') ||
    d.status !== (persisted.status ?? 'empty')
  )
}

async function save(s: TemplateStudioSection) {
  if (!editingEnabled.value) return
  if (!auth.user || !auth.profile) return
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
      status: deriveStatus(d)
    }
    await outputs.saveSection(props.deliverable.id, s.id, payload, {
      uid: auth.user.uid,
      email: auth.profile.email || auth.user.email || ''
    })
    dirty.value[s.id] = false
  } catch (e) {
    sectionError.value[s.id] = e instanceof Error ? e.message : String(e)
  } finally {
    savingSectionId.value = null
  }
}

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
</script>

<template>
  <section class="space-y-4">
    <header v-if="!sectionMode" class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">
        Output workspace
      </p>
      <h2 class="text-lg font-semibold text-neutral-900">
        Build the {{ studio.title }}
      </h2>
      <p class="text-sm text-neutral-600">
        This is where your team writes the actual deliverable, section by
        section. Source notes capture your thinking, the draft response is
        your working answer, and the final Playbook text is what will roll
        into the Brand &amp; Operations Playbook.
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
        <li>Read the section title and any guidance from your chief.</li>
        <li><strong>Source notes:</strong> capture your team's own thinking, decisions, and evidence in your own words.</li>
        <li><strong>Draft response:</strong> turn those notes into a working answer for the section. It can be rough.</li>
        <li><strong>Final Playbook text:</strong> polish the draft so it reads like part of the final Playbook.</li>
        <li>Add <strong>evidence links</strong> (Docs, Slides, folders, images) that back up what you wrote, then save.</li>
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
        <div><dt class="inline">Source notes</dt><dd class="inline"> · {{ readiness.withSourceNotes }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Draft text</dt><dd class="inline"> · {{ readiness.withDraft }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Final text</dt><dd class="inline"> · {{ readiness.withFinal }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Links</dt><dd class="inline"> · {{ readiness.withEvidence }}/{{ readiness.total }}</dd></div>
        <div><dt class="inline">Evidence entries</dt><dd class="inline"> · {{ readiness.totalStructuredEvidence }}</dd></div>
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
         elsewhere. -->
    <section
      v-if="isChapter8"
      class="card space-y-3 border-amber-200 bg-amber-50/40"
    >
      <header class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Demand assumptions from Chapter 7
        </h3>
        <p class="text-xs text-neutral-600">
          Use these Chapter 7 demand assumptions when writing Chapter 8
          revenue scenarios. Do not treat estimates as facts. Name the
          assumption and confidence level.
        </p>
      </header>
      <MarketEvidenceReferencePanel
        source-label="Chapter 7"
        :entries="ch7MarketEntries"
        :loading="ch7Loading"
        empty-message="No Chapter 7 demand estimates have been saved yet."
      />
    </section>

    <!-- Chapter 8 Market Fit cross-section panel.
         Surfaces the segment / scenario thinking from Chapter 7's
         Market Fit Builder plus a deterministic demand-to-revenue
         narrative per section. Read-only — no editing affordance, no
         writes, no AI. The narrative explicitly names the boundary
         between demand-side estimates and the CFO pricing/break-even
         engine. Visible only on Chapter 8 and only when there's at
         least one populated Chapter 7 fit row. -->
    <section
      v-if="isChapter8 && ch7MarketFitRows.length > 0"
      class="card space-y-3 border-violet-200 bg-violet-50/40"
    >
      <header class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Cross-chapter reference
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
      </header>
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
    </section>

    <!-- Chapter 11 retail-carry evidence reference panel.
         Combines Chapter 7 demand entries with a Chapter 8 finalText
         status block so a Phoenix Nest pitch author can see which
         demand and revenue claims have actually been authored upstream.
         Read-only end-to-end: no writes, no copies, no summarization
         beyond a length-capped excerpt of the revenue-scenarios final
         text. The cross-chapter listeners only fire when this section
         is the active deliverable. -->
    <section
      v-if="isChapter11"
      class="card space-y-3 border-amber-200 bg-amber-50/40"
    >
      <header class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Retail carry evidence from Chapters 7 and 8
        </h3>
        <p class="text-xs text-neutral-600">
          Use this evidence to write the Phoenix Nest carry ask. Do not
          treat estimates as facts. Name the buyer, scenario, price,
          weakest assumption, and next validation step.
        </p>
      </header>
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
    </section>

    <!-- Chapter 11 Phoenix Nest carry-readiness panel.
         Surfaces every Chapter 7 / Chapter 8 Market Fit row alongside
         a deterministic carry-readiness call (validate first / limited
         carry / awareness or test / stronger pitch / no clear signal).
         Each call is advisory: the headline + bulleted reasoning lets
         the pitch author read both the recommendation and why. Read-
         only — no writes, no AI involvement, no final decision. -->
    <section
      v-if="isChapter11 && ch11MarketFitRows.length > 0"
      class="card space-y-3 border-violet-200 bg-violet-50/40"
    >
      <header class="space-y-0.5">
        <p class="text-xs uppercase tracking-wide text-neutral-500">
          Cross-chapter reference
        </p>
        <h3 class="font-medium text-neutral-900">
          Phoenix Nest carry readiness from Market Fit
        </h3>
        <p class="text-xs text-neutral-600">
          Use this advisory readiness summary to shape — but not decide —
          the carry pitch. The Co-CEO and Phoenix Nest stakeholders still
          own the final call.
        </p>
      </header>
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
    </section>

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
        Work one section at a time. Each section below includes its guidance,
        source notes, draft response, final Playbook text, evidence, and any
        builder tools that apply. Jump directly to a section using the links
        below.
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
        <header class="space-y-0.5">
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

        <!-- Compact display-only guidance summary for this section.
             Same content the Template Studio block above carries, but
             positioned next to the inputs so students don't have to
             scroll back up to remember what the section is asking. -->
        <SectionGuidanceSummary
          :section="s"
          :section-index="originalSectionIndex(s.id)"
        />

        <!-- Expert Chapter Guidance — only renders when the studio
             section authored an expertGuidance block. Sections
             without it (V1 studios) keep rendering exactly as
             before. Read-only / display-only / copy-only AI prompt. -->
        <ExpertGuidanceCard
          :section="s"
          :section-index="originalSectionIndex(s.id)"
        />

        <!-- Display-only writing scaffolds: suggested workflow, likely
             owner cue, chapter-aware sentence starters, and the final
             Playbook text checklist. Nothing here saves, calls AI, or
             changes status. The cue appears above the inputs so
             students see the recommended sequence (notes → builder →
             draft → final → save) before they start writing. -->
        <PlaybookWritingScaffold
          :deliverable-id="deliverable.id"
          :section="s"
        />

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Source notes
              <textarea
                v-model="drafts[s.id].sourceNotes"
                rows="3"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="What did your team decide, why, and what evidence backs it up?"
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              Start here. Capture your team's own thinking, decisions, evidence,
              and questions in your own words.
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Draft response
              <textarea
                v-model="drafts[s.id].draftText"
                rows="4"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="A working answer for this section — turn your source notes into sentences."
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              Use this as the working version. It can be rough while your team
              is still improving the section.
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-neutral-800">
              Final Playbook text
              <textarea
                v-model="drafts[s.id].finalText"
                rows="5"
                :disabled="!editingEnabled"
                class="mt-1 w-full rounded border border-neutral-300 p-2 text-sm disabled:bg-neutral-50"
                placeholder="The polished version that should read like part of the final Playbook."
                @input="markDirty(s)"
              />
            </label>
            <p class="mt-1 text-xs text-neutral-500">
              This is the polished version that should read like part of the
              final Brand &amp; Operations Playbook.
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <label
              v-if="editingEnabled"
              class="text-xs text-neutral-700"
            >
              Mark this section
              <select
                v-model="drafts[s.id].status"
                class="ml-1 rounded border border-neutral-300 p-1 text-xs"
                @change="markDirty(s)"
              >
                <option value="empty">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="ready">Ready for review</option>
              </select>
            </label>
            <button
              v-if="editingEnabled"
              class="btn-primary text-xs"
              :disabled="savingSectionId === s.id || !hasChanges(s)"
              @click="save(s)"
            >
              {{ savingSectionId === s.id ? 'Saving…' : 'Save section' }}
            </button>
          </div>
          <p v-if="sectionError[s.id]" class="text-xs text-rose-600">
            {{ sectionError[s.id] }}
          </p>
        </div>

        <!-- Evidence links per section. Manual links only — no Drive API. -->
        <section class="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
          <header class="flex items-baseline justify-between">
            <h4 class="text-xs font-medium text-neutral-800">Evidence links</h4>
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
             Critique: a section can have any combination. -->
        <MarketFitBuilder
          v-if="shouldShowMarketFit(s)"
          :deliverable-id="deliverable.id"
          :section-id="s.id"
          :section-title="s.title"
          :initial="persistedMarketFit(s)"
          :editing-enabled="editingEnabled"
          :guidance="s.marketFit?.guidance ?? null"
        />

        <!-- Brand Fit Builder V1 — section-level identity-vs-market
             signal tool. Visible only on sections that opt in via
             studio metadata (Ch 5 / Ch 6 / Ch 10 brand-relevant
             sections). Independent of Market Fit / Market Builder /
             AI Critique. We pass the same section's Market Fit state
             as a read-only context callout so the team can validate
             that brand identity signals the same target customer.
             Brand Fit works without Market Fit data. -->
        <BrandFitBuilder
          v-if="shouldShowBrandFit(s)"
          :deliverable-id="deliverable.id"
          :section-id="s.id"
          :section-title="s.title"
          :initial="persistedBrandFit(s)"
          :editing-enabled="editingEnabled"
          :guidance="s.brandFit?.guidance ?? null"
          :market-fit-context="persistedMarketFit(s)"
        />

        <!-- Pricing Strategy Builder V1 — Ch. 8 Section 2 only.
             Deterministic pricing decision tool. Reads Ch. 7 market
             fit + demand entries as read-only context but never
             writes upstream and never writes to pricingScenarios.
             /pricing remains the operational source of truth. -->
        <PricingStrategyBuilder
          v-if="shouldShowPricingStrategy(s)"
          :deliverable-id="deliverable.id"
          :section-id="s.id"
          :section-title="s.title"
          :initial="persistedPricingStrategy(s)"
          :editing-enabled="editingEnabled"
          :guidance="s.pricingStrategy?.guidance ?? null"
          :ch7-market-fit="ch7MarketFitForPricing"
          :ch7-market-entries="ch7MarketEntriesForPricing"
        />

        <!-- AI Critique V1 — read-only coach panel for the Market
             Evidence Suite. Visible only when:
               (a) the chapter is one of the three market-evidence
                   chapters (Ch 7 / 8 / 11),
               (b) the section opted into Market Builder, and
               (c) the section has at least some student-authored
                   input (source notes / draft / final / evidence /
                   structured evidence / market builder entries).
             The panel never writes back to the document, never
             auto-runs, and renders only after a user click. -->
        <MarketEvidenceCritiquePanel
          v-if="shouldShowAiCritique(s)"
          :request="buildAiRequest(s)"
        />
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
