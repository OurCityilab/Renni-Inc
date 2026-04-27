// Canonical "likely owner" map for the 13 Renni Inc. Playbook
// chapters. Display / guidance only — never overrides any deliverable
// ownerUid / ownerEmail / approverUid field on disk.
//
// Why this lives in app/data: prior to Sprint 1B the same 13-row map
// was duplicated across DeliverableChapterHub.vue and
// PlaybookWritingScaffold.vue, and the two copies disagreed on Ch 11
// (one used "CSGO", the other spelled out "Chief Strategy and Growth
// Officer"). Centralizing it here gives one source of truth and lets
// future student-facing surfaces (Home, Workbench cards, Ping-chief
// affordances) read the same labels everywhere.
//
// Posture (do not relax in V1):
//   - no Firestore reads
//   - no Vue / runtime imports — pure data + tiny helpers
//   - student-facing copy uses full role names so the project
//     glossary stays consistent: "Chief Strategy and Growth Officer"
//     (not "CSGO"), "Playbook" (not "Bible"), no "R&D" / "CDO" /
//     "JRLA" / "Renni Enterprises".

export const CHAPTER_OWNERS: Record<string, string> = {
  'ch-01-executive-summary': 'Co-CEOs',
  'ch-02-renni-overview-and-brand-architecture': 'Co-CEOs · CMO support',
  'ch-03-company-structure-and-continuity': 'Co-CEOs · COO support',
  'ch-04-business-model-canvas':
    'Chief Strategy and Growth Officer · Co-CEO sign-off',
  'ch-05-house-phoenix-brand-book': 'CMO',
  'ch-06-supporting-brand-sheets': 'CMO · Co-CEO support',
  'ch-07-current-product-line-and-pricing': 'CFO · COO support',
  'ch-08-finance-and-revenue-model':
    'CFO · Chief Strategy and Growth Officer support',
  'ch-09-operations-and-continuity-systems': 'COO',
  'ch-10-marketing-and-campaign-playbook':
    'CMO · Chief Strategy and Growth Officer support',
  'ch-11-phoenix-nest-retail-carry-pitch':
    'Co-CEOs · CFO / CMO / COO / Chief Strategy and Growth Officer support',
  'ch-12-strategy-and-next-semester-recommendations':
    'Chief Strategy and Growth Officer · Co-CEO sign-off',
  'ch-13-decision-log-and-appendices': 'Co-CEOs · cross-functional support'
}

// Used when the deliverableId is unknown or hasn't landed in the map
// yet. Generic enough that it never lies about who owns work.
export const FALLBACK_LIKELY_OWNER = 'Co-CEOs · cross-functional'

// Primary "likely owner" string for a chapter, e.g.
//   "CFO · Chief Strategy and Growth Officer support"
export function getLikelyOwner(
  deliverableId: string | null | undefined
): string {
  if (!deliverableId) return FALLBACK_LIKELY_OWNER
  return CHAPTER_OWNERS[deliverableId] ?? FALLBACK_LIKELY_OWNER
}

// Alias for sites that prefer a more descriptive name. Returns the
// same string as getLikelyOwner.
export const getLikelyOwnerLabel = getLikelyOwner

// First role from the owner string — the chief most likely to push
// the work next. Used by the Ping-chief affordance so we can name
// one person to ask, not the whole support cast.
//
// Examples:
//   "CFO · COO support"                  → "CFO"
//   "Co-CEOs"                            → "Co-CEOs"
//   "Co-CEOs · CMO support"              → "Co-CEOs"
//   "Chief Strategy and Growth Officer · Co-CEO sign-off"
//                                        → "Chief Strategy and Growth Officer"
export function getPrimaryHelpRole(
  deliverableId: string | null | undefined
): string {
  const owner = getLikelyOwner(deliverableId)
  const idx = owner.indexOf(' · ')
  return idx > 0 ? owner.slice(0, idx).trim() : owner.trim()
}
