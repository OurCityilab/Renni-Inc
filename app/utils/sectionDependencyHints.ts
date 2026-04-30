// Section Dependency Hints — non-blocking copy that tells students
// which sections feed which other sections.
//
// POSTURE (do not relax)
// ----------------------
//   - Hints only. No hard locks, no soft locks, no status changes,
//     no readiness gating, no Firestore writes, no AI calls.
//   - Pure data. A small lookup keyed by section id; the workspace
//     reads it and passes the lines to <SectionDependencyHint /> for
//     display. Adding a new entry never affects approval logic.
//   - Kept here (not as TemplateStudioSection metadata) so adding /
//     editing a hint never touches studio files or section
//     completion criteria. Studios remain the source of truth for
//     what students MUST do; this file is the source of truth for
//     "what flows where."
//
// VOCABULARY
// ----------
//   Hints describe directional helpfulness, not blocking dependence:
//   "Customer Segments helps Value Propositions" means a stronger
//   Customer Segments draft makes Value Propositions easier — it
//   does NOT mean a student is blocked from drafting Value Props
//   first. The student is always free to ignore the hint.

export type SectionDependencyHints = Readonly<Record<string, readonly string[]>>

export const SECTION_DEPENDENCY_HINTS: SectionDependencyHints = {
  // Ch. 7 — Product Line and Pricing
  'product-list': [
    'A clear product list helps prefill Unit Cost, Revenue Scenarios, and Inventory.',
    'Use the Import product list button on those tables to skip retyping.'
  ],
  'margin-and-break-even': [
    'Pulls from Unit Cost (Ch. 8). If Unit Cost is empty, your margin numbers are guesses.',
    'Feeds Pricing Risks and the Phoenix Nest pitch margin story.'
  ],

  // Ch. 8 — Finance and Revenue Model
  'unit-cost': [
    'Helps Break-Even (Ch. 7 + Ch. 8) and Pricing Risks. Land this first.',
    'Feeds the margin story in the Phoenix Nest retail carry pitch.'
  ],
  'break-even': [
    'Pulls from Unit Cost. The team also needs the fixed-cost allocation rule.',
    'Feeds Revenue Scenarios and the day-of revenue goal.'
  ],
  'revenue-scenarios': [
    'Pulls from product list, Unit Cost, and Break-Even.',
    'Feeds the Day-of SOP revenue target and the Post-Event Recap.'
  ],
  'donation-scenarios': [
    'Donations are tracked separately from product sales — never roll them into product margin.',
    'Feeds the Donation goal and Day-of SOP donation handling.'
  ],
  'key-financial-kpis': [
    'Pulls from every Ch. 8 table. Each KPI needs a real source field.',
    'Feeds the Co-CEO weekly review and the Post-Event Recap.'
  ],

  // Ch. 9 — Operations and Continuity
  inventory: [
    'A clear inventory list helps Day-of SOP, Baked Goods SOP, and Phoenix Nest readiness.',
    'Use the Import product list button to start from the Renni Inc. catalog.'
  ],
  'day-of-sop': [
    'Pulls from Inventory and the day-of revenue target.',
    'Feeds the Post-Event Recap (what worked, what didn\'t).'
  ],
  'baked-goods-sop': [
    'Pulls from Inventory (baked-goods rows) and food-safety constraints.',
    'Feeds the Continuity Checklist for next-cohort handoff.'
  ],
  continuity: [
    'Lists everything the next cohort inherits — accounts, processes, vendor list, designs.',
    'Pulls from every Ch. 9 SOP and from Ch. 13 Decision Log.'
  ],

  // Ch. 4 — Business Model Canvas
  'customer-segments': [
    'Helps Value Propositions, Channels, Customer Relationships, and the Campaign audience.',
    'Use the Customer Profile Builder above before drafting.'
  ],
  'value-propositions': [
    'Pulls from Customer Segments. Each promise should tie to one segment.',
    'Feeds Channels, Revenue Streams, and the Campaign message.'
  ],
  'key-activities': [
    'Helps Key Resources and Key Partnerships. Pick activities Renni Inc. must do well as a real retail company.',
    'Use the Key Activities Builder above before drafting.'
  ],
  'key-resources': [
    'Pulls from Key Activities — every activity needs the resources to run it.',
    'Feeds Key Partnerships and Cost Structure.'
  ],
  'key-partners': [
    'Pulls from Key Activities and Key Resources. Square is the external POS partner.',
    'Feeds Cost Structure and the Phoenix Nest retail buyer relationship.'
  ]
}

/** Lookup helper. Returns an empty list when the section has no
 *  hints — the renderer hides the panel entirely in that case. */
export function getSectionDependencyHints(
  sectionId: string | undefined
): readonly string[] {
  if (!sectionId) return []
  return SECTION_DEPENDENCY_HINTS[sectionId] ?? []
}
