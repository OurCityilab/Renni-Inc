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
  'operating-cadence': [
    'Names the weekly + monthly routines that keep Renni Inc. running between events.',
    'Feeds the operating handoff so the next cohort inherits a rhythm, not a single event.'
  ],
  'fulfillment-workflow': [
    'Maps the steps from customer interest to product in hand. Square is the external POS — Renni Command Center is not a checkout.',
    'Pulls from inventory + vendors; feeds the customer service issue tracker.'
  ],
  'vendor-coordination': [
    'Tracks vendors and partners (printer, baker, school, TechTown, Phoenix Nest).',
    'Feeds quality control and the operating handoff.'
  ],
  'quality-control': [
    'Defines what "good enough" looks like for product, packaging, signage, and food.',
    'References the Baked Goods SOP for food-safety checks; feeds customer service issue tracking.'
  ],
  'customer-service-issues': [
    'Logs issues + response + fix + lesson. Not a refund engine — Renni Command Center never processes payments.',
    'Feeds post-launch operations and next-cohort instructions.'
  ],
  'interest-tracking': [
    'Tracks non-transactional interest only (name + need, never PII or payment data). Square remains the external POS.',
    'Feeds post-launch operations and the campaign feedback plan.'
  ],
  'post-launch-operations': [
    'The operating recap — keep / change / kill on routines, vendors, and SOPs.',
    'Pulls from event actuals; feeds Ch. 12 strategy + Ch. 13 decision log.'
  ],
  'operating-handoff': [
    'The next cohort inherits a running operating system, not just an inventory list.',
    'Pulls from operating cadence + vendors + quality control + interest tracker; feeds Ch. 13 next-cohort instructions.'
  ],
  'corporate-structure-and-ownership': [
    'Easier after company roles, decision rights, continuity risks, and major decisions are drafted.',
    'Output is a DRAFT educational model. Not legal, tax, securities, accounting, or investment advice. Instructor / adult / legal review is required before any real-world use.'
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
  ],
  'revenue-streams': [
    'Pulls from the Renni Inc. product list and donations. Use the Import button to seed rows.',
    'Feeds Ch. 8 revenue scenarios + the Phoenix Nest pitch margin story. Square is the external POS — this section is a map, not a checkout.'
  ],
  'cost-structure': [
    'Pulls from Ch. 7 unit costs and Ch. 8 break-even. Tag costs as variable / fixed / event-only / packaging / pending.',
    'Feeds the Phoenix Nest pitch margin story and the next-cohort handoff.'
  ],
  channels: [
    'Pulls from Customer Segments. Map awareness vs sale vs fulfillment vs follow-up.',
    'Feeds the Campaign channel choice (Ch. 10) and the Phoenix Nest pitch (Ch. 11).'
  ],
  'customer-relationships': [
    'Pulls from Customer Segments. Describe how Renni Inc. treats buyers per segment, not generic customer service.',
    'Feeds the Campaign messaging tone (Ch. 10) and supports House Phoenix brand voice.'
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
