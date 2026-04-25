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
  EvidenceLinkType
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

  return {
    watchOutput,
    createOutputIfMissing,
    saveSection,
    addEvidenceLink,
    removeEvidenceLink
  }
}
