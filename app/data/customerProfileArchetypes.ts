// Customer Profile Builder V1 — archetype records.
//
// V1 ships exactly 10 nationally-balanced PRIZM-inspired /
// ESRI-inspired lifestyle archetypes. These are RENNI-ORIGINAL working
// names — no proprietary segment names are reused. The application
// overlay to House Phoenix and the supporting brands lives in the
// Section 14 teacher-internal notes (NOT in this file).
//
// CURRICULUM POSTURE
// ------------------
//   - Pure data. No Vue runtime, no Firestore, no I/O.
//   - Working names. Some are flagged for revision before student
//     release; see `namingRiskNote` per record.
//   - All 10 archetypes can be primary AND secondary, with the single
//     exception that Cause-First Supporters is structurally an OVERLAY
//     and should usually appear as secondary, not as a peer
//     geo / demo primary.
//   - No PRIZM / ESRI claims of actual segmentation are made.

// Relative import (not `~/`) so this file is loadable by `tsx` for
// the test runner — the audit-script convention.
import type { CustomerProfileArchetypeId } from '../types/sectionEngines'

export interface CustomerProfileArchetypeRecord {
  /** Stable id (kebab-case). The single source of truth for the
   *  archetype identity across data, classifier, tests, and any
   *  future student / teacher UI. */
  id: CustomerProfileArchetypeId
  /** Working display name. Curriculum-lead may rename before student
   *  release; persistence keys are the `id`, not the display name. */
  workingDisplayName: string
  /** Compact name for tight UI surfaces (status chips, tags). */
  shortStudentFacingName: string
  /** One-sentence summary used in student-facing explanation
   *  templates and in teacher reference. */
  oneSentenceSummary: string
  /** Whether the archetype is allowed to be returned as primary. V1
   *  permits all 10, including Cause-First (rarely). */
  canBePrimary: boolean
  /** Whether the archetype is allowed to be returned as secondary. */
  canBeSecondary: boolean
  /** True for archetypes that are STRUCTURALLY motivation-defined and
   *  meant to layer on top of a geo / demo primary. V1: only
   *  `cause-first-supporters` is an overlay. */
  isOverlay: boolean
  /** Tiebreaker priority used when two archetypes score identically.
   *  Higher wins. Reflects the curriculum decision that more
   *  SPECIALIZED archetypes (Tranche 2 splits) win ties over more
   *  GENERAL archetypes (Tranche 1) — e.g., Legacy-Stage Affluent
   *  beats Established Affluent on an empty-nest+gifting tie because
   *  it is the more specific match.
   *
   *  V1 values:
   *    2 = Tranche 2 specialized (LSA, RFI, MUH, DFP)
   *    1 = Tranche 1 general (RCR, VDF, SSH, EAH, PSTH)
   *    0 = motivation overlay (CFS) — should never win a tie against
   *        a geo / demo archetype as primary; CFS reaches primary
   *        only when no other archetype clears the fit threshold. */
  tiebreakerPriority: 0 | 1 | 2
  /** Curriculum-internal note describing naming risk. NOT shown to
   *  students. Drives the pre-student-release name-revision pass. */
  namingRiskNote: string
}

export const CUSTOMER_PROFILE_ARCHETYPES: CustomerProfileArchetypeRecord[] = [
  {
    id: 'rising-city-renters',
    workingDisplayName: 'Rising City Renters',
    shortStudentFacingName: 'Rising City Renters',
    oneSentenceSummary:
      'Early-career adult, often single or partnered, in a rented apartment in a dense city, balancing tight or value-conscious spending with a strong identity orientation built largely through social-media discovery.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 1,
    namingRiskNote: 'Low. "Rising" mildly aspirational; acceptable for V1.'
  },
  {
    id: 'value-driven-family-households',
    workingDisplayName: 'Value-Driven Family Households',
    shortStudentFacingName: 'Value-Driven Families',
    oneSentenceSummary:
      'Family household with one or two working adults and at least one child still at home that prioritizes stretching a finite budget across many household needs and only spends discretionary dollars when value is clear.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 1,
    namingRiskNote: 'Medium. "Value-driven" can be misread as "driven by good values"; needs curriculum gloss.'
  },
  {
    id: 'settled-suburban-households',
    workingDisplayName: 'Settled Suburban Households',
    shortStudentFacingName: 'Settled Suburban Households',
    oneSentenceSummary:
      'Established household, often homeowners in inner-ring or outer suburb, with stable routines, comfortable spending, and strong preference for convenience and trusted brands over hunting for the lowest price.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 1,
    namingRiskNote: 'High. "Settled" can read as patronizing; pilot-test alternates before student release.'
  },
  {
    id: 'established-affluent-households',
    workingDisplayName: 'Established Affluent Households',
    shortStudentFacingName: 'Established Affluent',
    oneSentenceSummary:
      'High-discretionary-spending household, often homeowners in affluent urban or suburban areas, who buy selectively and pay premium prices when they perceive real quality, design, story, or experience.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 1,
    namingRiskNote: 'Medium. "Affluent" is class-coded; needs inline definition. Disambiguation risk vs Legacy-Stage Affluent.'
  },
  {
    id: 'practical-small-town-households',
    workingDisplayName: 'Practical Small-Town Households',
    shortStudentFacingName: 'Practical Small-Town',
    oneSentenceSummary:
      'Household in a small town, second-tier metro, or exurban area, often homeowners across a wide age range, that values products that work, last, and are easy to acquire without a long drive or complicated returns.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 1,
    namingRiskNote: 'Low–medium. Mild urban-centric framing risk; acceptable for V1.'
  },
  {
    id: 'legacy-stage-affluent-households',
    workingDisplayName: 'Legacy-Stage Affluent Households',
    shortStudentFacingName: 'Legacy-Stage Affluent',
    oneSentenceSummary:
      'Empty-nest or near-empty-nest affluent household whose discretionary spending has shifted from raising children toward gifting, hosting, travel, home investment, and deliberate giving.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 2,
    namingRiskNote: 'Medium. "Legacy-stage" can sound euphemistic about aging; pilot-test before student release.'
  },
  {
    id: 'rural-fixed-income-households',
    workingDisplayName: 'Rural Fixed-Income Households',
    shortStudentFacingName: 'Rural Fixed-Income',
    oneSentenceSummary:
      'Household in a rural area or very small town living on a fixed or limited income — often Social Security, pension, disability, or low-wage work — shaped by tight budget AND limited local availability and shipping or returns friction.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 2,
    namingRiskNote: 'Low–medium. "Fixed income" is a finance term; needs inline gloss.'
  },
  {
    id: 'multigenerational-urban-households',
    workingDisplayName: 'Multigenerational Urban Households',
    shortStudentFacingName: 'Multi-Gen Urban',
    oneSentenceSummary:
      'Household where two or three generations live together in an urban or inner-ring setting, pooling income and making many purchase decisions collectively across the generations.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 2,
    namingRiskNote: 'Low. Long but accurate; acceptable for V1 with a short curriculum gloss.'
  },
  {
    id: 'digital-first-premium-buyers',
    workingDisplayName: 'Digital-First Premium Buyers',
    shortStudentFacingName: 'Digital-First Premium',
    oneSentenceSummary:
      'Younger or mid-career adult with comfortable to affluent discretionary spending, who discovers and buys premium products primarily through mobile and social channels.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: false,
    tiebreakerPriority: 2,
    namingRiskNote: 'Medium. Industry jargon; pilot-test alternates before student release.'
  },
  {
    id: 'cause-first-supporters',
    workingDisplayName: 'Cause-First Supporters',
    shortStudentFacingName: 'Cause-First Supporters',
    oneSentenceSummary:
      'Person whose engagement with a brand or organization is driven primarily by the cause, mission, or community impact behind it.',
    canBePrimary: true,
    canBeSecondary: true,
    isOverlay: true,
    tiebreakerPriority: 0,
    namingRiskNote: 'Medium. "Cause" may be narrowed by students to political activism only; needs framing as "any cause".'
  }
]

/**
 * Map for O(1) archetype lookup by id.
 */
export const CUSTOMER_PROFILE_ARCHETYPE_BY_ID: Readonly<
  Record<CustomerProfileArchetypeId, CustomerProfileArchetypeRecord>
> = Object.freeze(
  CUSTOMER_PROFILE_ARCHETYPES.reduce(
    (acc, record) => {
      acc[record.id] = record
      return acc
    },
    {} as Record<CustomerProfileArchetypeId, CustomerProfileArchetypeRecord>
  )
)

/**
 * Stable, ordered list of archetype IDs. Useful for tests and audit
 * scripts that need a deterministic iteration order.
 */
export const CUSTOMER_PROFILE_ARCHETYPE_IDS: readonly CustomerProfileArchetypeId[] =
  CUSTOMER_PROFILE_ARCHETYPES.map((r) => r.id)
