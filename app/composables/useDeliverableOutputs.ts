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
  DeliverableEvidenceLink,
  DeliverableOutput,
  DeliverableOutputSection,
  DeliverableOutputSectionStatus,
  EvidenceConfidence,
  EvidenceLinkType,
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
    const next = [...currentEvidence, entry]
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
        ...(patch.confidence !== undefined && { confidence: patch.confidence }),
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
  }

  async function removeStructuredEvidence(
    deliverableId: string,
    sectionId: string,
    currentEvidence: StructuredEvidenceEntry[],
    entryId: string,
    actor: DeliverableOutputActor
  ): Promise<void> {
    const next = currentEvidence.filter((e) => e.id !== entryId)
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

  return {
    watchOutput,
    createOutputIfMissing,
    saveSection,
    addEvidenceLink,
    removeEvidenceLink,
    addStructuredEvidence,
    updateStructuredEvidence,
    removeStructuredEvidence
  }
}
