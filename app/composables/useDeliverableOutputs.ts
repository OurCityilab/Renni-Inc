import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe
} from 'firebase/firestore'
import {
  onMounted,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from 'vue'
import type {
  BrandFitBuilder,
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  DeliverableOutputSectionStatus,
  EvidenceConfidence,
  EvidenceLinkType,
  MarketBuilderEntry,
  MarketBuilderScenario,
  MarketFitBuilder,
  MarketScenarioLevel,
  PricingStrategyBuilder,
  StructuredEvidenceEntry
} from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'

// Actor passed in by the page so this composable doesn't reach into the
// auth store directly — keeps the Firestore writes' provenance explicit.
export interface DeliverableOutputActor {
  uid: string
  email: string
}

// Section-save payload. The composable applies the value via dotted
// updateDoc paths so a single section save never touches sibling sections.
export interface SectionSavePayload {
  sectionTitleSnapshot: string
  sourceNotes: string
  draftText: string
  finalText: string
  status: DeliverableOutputSectionStatus
}

// New evidence link input — caller supplies label/url/type/optional
// requirementId; composable assigns id, sectionId, and audit fields.
export interface NewEvidenceLinkInput {
  label: string
  url: string
  type: EvidenceLinkType
  requirementId?: string | null
}

// Structured Evidence Standard V1 — caller supplies the claim/evidence
// fields; composable assigns id and audit fields. Optional fields stay
// optional so a student can save a partially-filled entry and finish it
// later without a hard schema gate.
export interface NewStructuredEvidenceInput {
  claim: string
  evidence: string
  source: string
  assumption?: string
  calculation?: string
  confidence?: EvidenceConfidence
  risk?: string
  nextValidation?: string
  requirementId?: string | null
}

// Patch shape for updating a structured evidence entry. Only the fields
// the caller passes are written; everything else is preserved.
export type StructuredEvidencePatch = Partial<NewStructuredEvidenceInput>

// Market Builder V1 — caller supplies product / market / assumption
// fields and (optionally) a starter scenarios array. The composable
// fills in id / audit fields. Scenarios that the caller doesn't pass
// are seeded at conservative / base / ambitious so the UI always has
// the three rows ready to fill in.
export interface NewMarketBuilderInput {
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
  scenarios?: MarketBuilderScenario[]
  linkedRequirementId?: string | null
}

export type MarketBuilderPatch = Partial<NewMarketBuilderInput>

function genId(): string {
  // crypto.randomUUID is available on App Hosting's Node runtime and in
  // every modern browser. Fall back to a timestamp+random if missing.
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  return `link-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

export function useDeliverableOutputs() {
  function db() {
    return useNuxtApp().$firebase.db
  }
  function ref_(deliverableId: string) {
    return doc(db(), 'deliverableOutputs', deliverableId)
  }

  // Reactive watcher that rebinds when the route param changes. Same
  // shape useDeliverables.watchOne uses, so the page can pass a computed
  // id ref in.
  function watchOutput(idSource: MaybeRefOrGetter<string>) {
    const data = ref<DeliverableOutput | null>(null)
    const loading = ref(true)
    let unsub: Unsubscribe | null = null

    onMounted(() => {
      watch(
        () => toValue(idSource),
        (id) => {
          if (unsub) {
            unsub()
            unsub = null
          }
          data.value = null
          loading.value = true
          if (!id) {
            loading.value = false
            return
          }
          unsub = onSnapshot(ref_(id), (snap) => {
            data.value = snap.exists() ? (snap.data() as DeliverableOutput) : null
            loading.value = false
          })
        },
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      if (unsub) unsub()
    })
    return { data, loading }
  }

  // Read-only fan-out subscription for many deliverable outputs.
  // Used by /c-suite-advisor to aggregate signals across studio-
  // backed deliverables. Posture (do not relax):
  //   - read-only only, never provisions, never writes
  //   - missing docs are tolerated (returned as `null` in the map)
  //   - rebinds when the id list changes (length or contents)
  //   - cleans up every subscription on scope dispose
  //   - simple by design: one onSnapshot per id, no batched query
  //     or aggregation hops the rules layer
  function watchManyOutputs(idsSource: MaybeRefOrGetter<string[]>) {
    const data = ref<Record<string, DeliverableOutput | null>>({})
    // True until the first snapshot lands for *every* requested id;
    // flips to false once we've heard back from each subscription
    // (or the id list is empty).
    const loading = ref(true)
    const subs: Map<string, Unsubscribe> = new Map()
    const heard: Set<string> = new Set()
    let currentIds: string[] = []

    function refreshLoading() {
      if (currentIds.length === 0) {
        loading.value = false
        return
      }
      loading.value = currentIds.some((id) => !heard.has(id))
    }

    function rebind(nextIds: string[]) {
      const next = Array.from(new Set(nextIds.filter(Boolean)))
      // Drop subscriptions for ids that left the list.
      for (const [id, unsub] of subs) {
        if (!next.includes(id)) {
          unsub()
          subs.delete(id)
          heard.delete(id)
          // Remove from data so callers see the id has gone.
          if (id in data.value) {
            const copy = { ...data.value }
            delete copy[id]
            data.value = copy
          }
        }
      }
      // Add subscriptions for new ids.
      for (const id of next) {
        if (subs.has(id)) continue
        const unsub = onSnapshot(ref_(id), (snap) => {
          const value = snap.exists() ? (snap.data() as DeliverableOutput) : null
          data.value = { ...data.value, [id]: value }
          heard.add(id)
          refreshLoading()
        })
        subs.set(id, unsub)
      }
      currentIds = next
      refreshLoading()
    }

    onMounted(() => {
      watch(
        () => toValue(idsSource),
        (next) => rebind(next ?? []),
        { immediate: true }
      )
    })
    onScopeDispose(() => {
      for (const [, unsub] of subs) unsub()
      subs.clear()
      heard.clear()
    })

    return { data, loading }
  }

  // Lazy create of the output doc. Called when the workspace is first
  // opened on a deliverable that doesn't have one yet. Idempotent — does
  // nothing if the doc already exists, so it's safe to call on every
  // mount.
  async function createOutputIfMissing(
    deliverableId: string,
    studio: TemplateStudio,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const r = ref_(deliverableId)
    const existing = await getDoc(r)
    if (existing.exists()) return
    const now = new Date().toISOString()
    const sections: Record<string, DeliverableOutputSection> = {}
    for (const s of studio.sections) {
      sections[s.id] = {
        sectionId: s.id,
        sectionTitleSnapshot: s.title,
        sourceNotes: '',
        draftText: '',
        finalText: '',
        evidenceLinks: [],
        status: 'empty',
        updatedAt: null,
        updatedByUid: null,
        updatedByEmail: null
      }
    }
    const payload: DeliverableOutput = {
      id: deliverableId,
      deliverableId,
      studioVersion: studio.version ?? null,
      studioTitleSnapshot: studio.title,
      sections,
      createdAt: now,
      createdByUid: actor.uid,
      createdByEmail: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    }
    await setDoc(r, payload)
  }

  // Save one section. Uses dotted-path updateDoc so other sections are
  // untouched — no risk of a stale tab clobbering work in another section.
  async function saveSection(
    deliverableId: string,
    sectionId: string,
    payload: SectionSavePayload,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const r = ref_(deliverableId)
    const now = new Date().toISOString()
    await updateDoc(r, {
      [`sections.${sectionId}.sectionId`]: sectionId,
      [`sections.${sectionId}.sectionTitleSnapshot`]: payload.sectionTitleSnapshot,
      [`sections.${sectionId}.sourceNotes`]: payload.sourceNotes,
      [`sections.${sectionId}.draftText`]: payload.draftText,
      [`sections.${sectionId}.finalText`]: payload.finalText,
      [`sections.${sectionId}.status`]: payload.status,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  async function addEvidenceLink(
    deliverableId: string,
    sectionId: string,
    currentLinks: DeliverableEvidenceLink[],
    input: NewEvidenceLinkInput,
    actor: DeliverableOutputActor
  ): Promise<DeliverableEvidenceLink> {
    const link: DeliverableEvidenceLink = {
      id: genId(),
      label: input.label.trim(),
      url: input.url.trim(),
      type: input.type,
      sectionId,
      requirementId: input.requirementId ?? null,
      addedByUid: actor.uid,
      addedByEmail: actor.email,
      addedAt: new Date().toISOString()
    }
    // Replace the entire array so the list survives concurrent edits in
    // the same field — arrayUnion would risk merging stale objects.
    const next = [...currentLinks, link]
    const r = ref_(deliverableId)
    const now = new Date().toISOString()
    await updateDoc(r, {
      [`sections.${sectionId}.evidenceLinks`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    return link
  }

  async function removeEvidenceLink(
    deliverableId: string,
    sectionId: string,
    currentLinks: DeliverableEvidenceLink[],
    linkId: string,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const next = currentLinks.filter((l) => l.id !== linkId)
    const r = ref_(deliverableId)
    const now = new Date().toISOString()
    await updateDoc(r, {
      [`sections.${sectionId}.evidenceLinks`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  // --- structured evidence (Evidence Standard V1) ---
  // The same array-replacement pattern evidenceLinks uses: caller passes
  // the current array, we append/patch/filter and write the whole list
  // back. Avoids arrayUnion's stale-merge risk.
  async function addStructuredEvidence(
    deliverableId: string,
    sectionId: string,
    currentEvidence: StructuredEvidenceEntry[],
    input: NewStructuredEvidenceInput,
    actor: DeliverableOutputActor
  ): Promise<StructuredEvidenceEntry> {
    const now = new Date().toISOString()
    const entry: StructuredEvidenceEntry = {
      id: genId(),
      claim: input.claim.trim(),
      evidence: input.evidence.trim(),
      source: input.source.trim(),
      assumption: input.assumption?.trim() || undefined,
      calculation: input.calculation?.trim() || undefined,
      confidence: input.confidence,
      risk: input.risk?.trim() || undefined,
      nextValidation: input.nextValidation?.trim() || undefined,
      requirementId: input.requirementId ?? null,
      addedByUid: actor.uid,
      addedByEmail: actor.email,
      addedAt: now,
      updatedAt: now
    }
    // Same Firestore-undefined risk Market Builder hit: blank optional
    // fields (assumption, calculation, risk, nextValidation) leave the
    // form as `undefined`, and a "Not set" confidence is also undefined.
    // Sanitize the array before writing so updateDoc never sees those.
    const next = stripUndefinedDeep([...currentEvidence, entry])
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.structuredEvidence`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    return entry
  }

  async function updateStructuredEvidence(
    deliverableId: string,
    sectionId: string,
    currentEvidence: StructuredEvidenceEntry[],
    entryId: string,
    patch: StructuredEvidencePatch,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const now = new Date().toISOString()
    const hasConfidencePatch = Object.prototype.hasOwnProperty.call(
      patch,
      'confidence'
    )
    const next = currentEvidence.map((e) => {
      if (e.id !== entryId) return e
      return {
        ...e,
        ...(patch.claim !== undefined && { claim: patch.claim.trim() }),
        ...(patch.evidence !== undefined && { evidence: patch.evidence.trim() }),
        ...(patch.source !== undefined && { source: patch.source.trim() }),
        ...(patch.assumption !== undefined && {
          assumption: patch.assumption.trim() || undefined
        }),
        ...(patch.calculation !== undefined && {
          calculation: patch.calculation.trim() || undefined
        }),
        ...(hasConfidencePatch && { confidence: patch.confidence }),
        ...(patch.risk !== undefined && {
          risk: patch.risk.trim() || undefined
        }),
        ...(patch.nextValidation !== undefined && {
          nextValidation: patch.nextValidation.trim() || undefined
        }),
        ...(patch.requirementId !== undefined && {
          requirementId: patch.requirementId
        }),
        updatedAt: now
      }
    })
    const sanitized = stripUndefinedDeep(next)
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.structuredEvidence`]: sanitized,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  async function removeStructuredEvidence(
    deliverableId: string,
    sectionId: string,
    currentEvidence: StructuredEvidenceEntry[],
    entryId: string,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const next = stripUndefinedDeep(
      currentEvidence.filter((e) => e.id !== entryId)
    )
    const r = ref_(deliverableId)
    const now = new Date().toISOString()
    await updateDoc(r, {
      [`sections.${sectionId}.structuredEvidence`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  // --- market builder (Market Builder V1) ---
  // Same array-replacement pattern as evidenceLinks / structuredEvidence:
  // caller passes the current array, we append / patch / filter and
  // write the whole list back. Sibling sections and other section fields
  // (sourceNotes / draftText / finalText / evidenceLinks /
  // structuredEvidence) are untouched because every write uses dotted
  // paths into `sections.${sectionId}.marketBuilderEntries`.

  function makeDefaultScenarios(): MarketBuilderScenario[] {
    const labels: MarketScenarioLevel[] = ['conservative', 'base', 'ambitious']
    return labels.map((label) => ({
      id: genId(),
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

  // Defense in depth — Firestore should never receive NaN or Infinity
  // for these fields, so coerce non-finite values to null at write time
  // even if a future caller bypasses the form-level validation. Negative
  // values, which are blocked by the form, are *not* silently clamped
  // here: we surface them as-is so a regression in the UI guard is
  // easier to spot than to mask.
  function safeNumeric(n: number | null | undefined): number | null {
    if (n == null) return null
    return Number.isFinite(n) ? n : null
  }
  function normalizeScenario(s: MarketBuilderScenario): MarketBuilderScenario {
    const reachableAudience = safeNumeric(s.reachableAudience)
    const interestRatePercent = safeNumeric(s.interestRatePercent)
    const conversionRatePercent = safeNumeric(s.conversionRatePercent)
    const price = safeNumeric(s.price)
    return {
      ...s,
      reachableAudience,
      interestRatePercent,
      conversionRatePercent,
      price,
      estimatedBuyers: safeNumeric(s.estimatedBuyers),
      estimatedRevenue: safeNumeric(s.estimatedRevenue)
    }
  }

  // Recursively remove keys whose value is `undefined` from plain
  // objects, walking arrays in place. The Firestore web SDK rejects any
  // `undefined` value in an updateDoc payload — including values nested
  // inside objects inside arrays — and Market Builder entries carry
  // several optional text fields that the form leaves as `undefined`
  // when blank (productStory, secondaryMarket, etc.). Without this scrub
  // a save with any blank optional fails with
  //   "Function updateDoc() called with invalid data. Unsupported field
  //    value: undefined"
  // so we sanitize the array right before it lands in the dotted-path
  // payload. Primitives, null, Date, and arrays pass through untouched.
  function stripUndefinedDeep<T>(value: T): T {
    if (value === null || value === undefined) return value
    if (Array.isArray(value)) {
      return value.map((item) => stripUndefinedDeep(item)) as unknown as T
    }
    // Don't walk class instances (Date, Timestamp, etc.). Plain objects
    // come from JSON-shaped Firestore data and form buffers; they have
    // Object.prototype as their prototype.
    if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v === undefined) continue
        out[k] = stripUndefinedDeep(v)
      }
      return out as unknown as T
    }
    return value
  }

  async function addMarketBuilderEntry(
    deliverableId: string,
    sectionId: string,
    currentEntries: MarketBuilderEntry[],
    input: NewMarketBuilderInput,
    actor: DeliverableOutputActor
  ): Promise<MarketBuilderEntry> {
    const now = new Date().toISOString()
    const entry: MarketBuilderEntry = {
      id: genId(),
      productName: input.productName.trim(),
      productStory: input.productStory?.trim() || undefined,
      primaryMarket: input.primaryMarket?.trim() || undefined,
      secondaryMarket: input.secondaryMarket?.trim() || undefined,
      targetAgeRange: input.targetAgeRange?.trim() || undefined,
      customerAssumption: input.customerAssumption?.trim() || undefined,
      valueBasedFactor: input.valueBasedFactor?.trim() || undefined,
      schoolMarketSize: safeNumeric(input.schoolMarketSize),
      broaderMarketSize: safeNumeric(input.broaderMarketSize),
      evidenceSource: input.evidenceSource?.trim() || undefined,
      sourceType: input.sourceType?.trim() || undefined,
      confidence: input.confidence,
      weakestAssumption: input.weakestAssumption?.trim() || undefined,
      strongestEvidence: input.strongestEvidence?.trim() || undefined,
      nextValidation: input.nextValidation?.trim() || undefined,
      scenarios:
        input.scenarios && input.scenarios.length > 0
          ? input.scenarios.map(normalizeScenario)
          : makeDefaultScenarios(),
      linkedRequirementId: input.linkedRequirementId ?? null,
      addedByUid: actor.uid,
      addedByEmail: actor.email,
      addedAt: now,
      updatedAt: now
    }
    const next = stripUndefinedDeep([...currentEntries, entry])
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.marketBuilderEntries`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    return entry
  }

  async function updateMarketBuilderEntry(
    deliverableId: string,
    sectionId: string,
    currentEntries: MarketBuilderEntry[],
    entryId: string,
    patch: MarketBuilderPatch,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const now = new Date().toISOString()
    // hasOwnProperty checks let callers explicitly clear an optional
    // field by passing `undefined` (same trick the structured-evidence
    // editor uses to clear `confidence`).
    const has = (k: keyof MarketBuilderPatch) =>
      Object.prototype.hasOwnProperty.call(patch, k)
    const next = currentEntries.map((e) => {
      if (e.id !== entryId) return e
      return {
        ...e,
        ...(patch.productName !== undefined && {
          productName: patch.productName.trim()
        }),
        ...(patch.productStory !== undefined && {
          productStory: patch.productStory.trim() || undefined
        }),
        ...(patch.primaryMarket !== undefined && {
          primaryMarket: patch.primaryMarket.trim() || undefined
        }),
        ...(patch.secondaryMarket !== undefined && {
          secondaryMarket: patch.secondaryMarket.trim() || undefined
        }),
        ...(patch.targetAgeRange !== undefined && {
          targetAgeRange: patch.targetAgeRange.trim() || undefined
        }),
        ...(patch.customerAssumption !== undefined && {
          customerAssumption: patch.customerAssumption.trim() || undefined
        }),
        ...(patch.valueBasedFactor !== undefined && {
          valueBasedFactor: patch.valueBasedFactor.trim() || undefined
        }),
        ...(has('schoolMarketSize') && {
          schoolMarketSize: safeNumeric(patch.schoolMarketSize)
        }),
        ...(has('broaderMarketSize') && {
          broaderMarketSize: safeNumeric(patch.broaderMarketSize)
        }),
        ...(patch.evidenceSource !== undefined && {
          evidenceSource: patch.evidenceSource.trim() || undefined
        }),
        ...(patch.sourceType !== undefined && {
          sourceType: patch.sourceType.trim() || undefined
        }),
        ...(has('confidence') && { confidence: patch.confidence }),
        ...(patch.weakestAssumption !== undefined && {
          weakestAssumption: patch.weakestAssumption.trim() || undefined
        }),
        ...(patch.strongestEvidence !== undefined && {
          strongestEvidence: patch.strongestEvidence.trim() || undefined
        }),
        ...(patch.nextValidation !== undefined && {
          nextValidation: patch.nextValidation.trim() || undefined
        }),
        ...(patch.scenarios !== undefined && {
          scenarios: patch.scenarios.map(normalizeScenario)
        }),
        ...(has('linkedRequirementId') && {
          linkedRequirementId: patch.linkedRequirementId ?? null
        }),
        updatedAt: now
      }
    })
    const sanitized = stripUndefinedDeep(next)
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.marketBuilderEntries`]: sanitized,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  async function removeMarketBuilderEntry(
    deliverableId: string,
    sectionId: string,
    currentEntries: MarketBuilderEntry[],
    entryId: string,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const next = stripUndefinedDeep(
      currentEntries.filter((e) => e.id !== entryId)
    )
    const r = ref_(deliverableId)
    const now = new Date().toISOString()
    await updateDoc(r, {
      [`sections.${sectionId}.marketBuilderEntries`]: next,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  // --- market fit builder (Market Fit Builder V1) ---
  // Whole-section save: the builder's state lives as a single nested
  // object on the section, and the editor writes the full state back
  // each save. That's intentional — segments / comparables /
  // evidence-requests are short lists with field-level interplay
  // (e.g., recommendation references segments by id), so a per-list
  // patch API would just expose the caller to merge bugs. The dotted
  // path keeps sibling sections and other section fields (sourceNotes
  // / draftText / finalText / evidenceLinks / structuredEvidence /
  // marketBuilderEntries) untouched on every save. Output passed
  // through stripUndefinedDeep so blank optional fields never reach
  // Firestore as `undefined`.
  async function saveMarketFitBuilder(
    deliverableId: string,
    sectionId: string,
    sectionTitleSnapshot: string,
    fit: MarketFitBuilder,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const now = new Date().toISOString()
    const payload: MarketFitBuilder = stripUndefinedDeep({
      ...fit,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.sectionId`]: sectionId,
      [`sections.${sectionId}.sectionTitleSnapshot`]: sectionTitleSnapshot,
      [`sections.${sectionId}.marketFit`]: payload,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  // --- brand fit builder (Brand Fit Builder V1) ---
  // Same whole-section save pattern Market Fit uses: the editor sends
  // the full builder state and we write it as one nested map at
  // sections.${sectionId}.brandFit. Sibling fields (sourceNotes,
  // draftText, finalText, evidenceLinks, structuredEvidence,
  // marketBuilderEntries, marketFit) are untouched on every save.
  // stripUndefinedDeep guards against the same Firestore-undefined
  // payload risk the Market Builder + Structured Evidence paths
  // already handle.
  async function saveBrandFitBuilder(
    deliverableId: string,
    sectionId: string,
    sectionTitleSnapshot: string,
    fit: BrandFitBuilder,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const now = new Date().toISOString()
    const payload: BrandFitBuilder = stripUndefinedDeep({
      ...fit,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.sectionId`]: sectionId,
      [`sections.${sectionId}.sectionTitleSnapshot`]: sectionTitleSnapshot,
      [`sections.${sectionId}.brandFit`]: payload,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  // --- pricing strategy builder (Pricing Strategy Engine V1) ---
  // Same whole-section save pattern that Market Fit and Brand Fit use:
  // the editor sends the full builder state and we write it as one
  // nested map at sections.${sectionId}.pricingStrategy. Sibling
  // fields (sourceNotes, draftText, finalText, evidenceLinks,
  // structuredEvidence, marketBuilderEntries, marketFit, brandFit)
  // are untouched on every save. This composable NEVER writes to
  // pricingScenarios — that collection stays the /pricing operational
  // source of truth and is governed by its own Firestore rule.
  // stripUndefinedDeep guards against the same Firestore-undefined
  // payload risk every other builder save handles.
  async function savePricingStrategyBuilder(
    deliverableId: string,
    sectionId: string,
    sectionTitleSnapshot: string,
    pricing: PricingStrategyBuilder,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const now = new Date().toISOString()
    const payload: PricingStrategyBuilder = stripUndefinedDeep({
      ...pricing,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
    const r = ref_(deliverableId)
    await updateDoc(r, {
      [`sections.${sectionId}.sectionId`]: sectionId,
      [`sections.${sectionId}.sectionTitleSnapshot`]: sectionTitleSnapshot,
      [`sections.${sectionId}.pricingStrategy`]: payload,
      [`sections.${sectionId}.updatedAt`]: now,
      [`sections.${sectionId}.updatedByUid`]: actor.uid,
      [`sections.${sectionId}.updatedByEmail`]: actor.email,
      updatedAt: now,
      updatedByUid: actor.uid,
      updatedByEmail: actor.email
    })
  }

  return {
    watchOutput,
    watchManyOutputs,
    createOutputIfMissing,
    saveSection,
    addEvidenceLink,
    removeEvidenceLink,
    addStructuredEvidence,
    updateStructuredEvidence,
    removeStructuredEvidence,
    addMarketBuilderEntry,
    updateMarketBuilderEntry,
    removeMarketBuilderEntry,
    saveMarketFitBuilder,
    saveBrandFitBuilder,
    savePricingStrategyBuilder
  }
}
