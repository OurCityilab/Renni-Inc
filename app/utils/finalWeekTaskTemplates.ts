// Final Week Task Templates — display-only / manual-seed guidance.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure data. The platform NEVER auto-creates these tasks. The
//     panel that consumes this data is expected to display the
//     template alongside a "How to seed" hint, not a "Create now"
//     button.
//   - Each template references a P0 section in
//     app/utils/finalWeekCompletion.ts via the same `id` shape so
//     a chief can match a template back to its lane.
//   - No Firestore writes. No task-mutation calls anywhere in this
//     module.

import type { FinalWeekPriority } from '~/utils/finalWeekCompletion'

export interface FinalWeekTaskTemplate {
  /** Matches the `id` field on the corresponding FinalWeekSectionEntry. */
  id: string
  /** Suggested task title. Plain language; matches what a chief
   *  might type into the existing task form. */
  title: string
  owner: string
  reviewer: string
  /** Display-only due-date label (no ISO date — the template never
   *  sets a real date because it never writes a real task). */
  dueLabel: string
  dependency: string | null
  doneWhen: string
  /** Playbook chapter number for grouping. */
  playbookChapter: number
  /** Section id within the chapter studio. */
  sectionId: string
  priority: FinalWeekPriority
}

export const FINAL_WEEK_TASK_TEMPLATES: readonly FinalWeekTaskTemplate[] = [
  // Executive launch summary
  {
    id: 'ch-01:company-overview',
    title: 'Write Renni Inc. company overview',
    owner: 'Co-CEOs',
    reviewer: 'Advisor',
    dueLabel: 'Final week — first',
    dependency: null,
    doneWhen: 'Reviewer can name what Renni Inc. is in two minutes.',
    playbookChapter: 1,
    sectionId: 'company-overview',
    priority: 'P0'
  },
  {
    id: 'ch-01:launch-focus',
    title: 'Write the launch focus paragraph',
    owner: 'Co-CEOs',
    reviewer: 'Advisor',
    dueLabel: 'Final week — first',
    dependency: 'Company overview',
    doneWhen: 'TechTown / Playbook / Phoenix Nest each named in one sentence.',
    playbookChapter: 1,
    sectionId: 'launch-focus',
    priority: 'P0'
  },
  // BMC core
  {
    id: 'ch-04:customer-segments',
    title: 'Compose customer segments with the Customer Builder',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: null,
    doneWhen: 'Two or more named segments with specific needs.',
    playbookChapter: 4,
    sectionId: 'customer-segments',
    priority: 'P0'
  },
  {
    id: 'ch-04:value-propositions',
    title: 'Write one promise per customer segment tied to a real product',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: 'Customer segments',
    doneWhen: 'Each segment has one promise + proof a customer would believe.',
    playbookChapter: 4,
    sectionId: 'value-propositions',
    priority: 'P0'
  },
  {
    id: 'ch-04:revenue-streams',
    title: 'Build the BMC revenue streams table',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Product list (Ch. 7)',
    doneWhen: 'Each stream has type, capture method, source, confidence, ties-to-Ch.8.',
    playbookChapter: 4,
    sectionId: 'revenue-streams',
    priority: 'P0'
  },
  {
    id: 'ch-04:cost-structure',
    title: 'Build the BMC cost structure table',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Unit cost (Ch. 8)',
    doneWhen: 'Variable / fixed / event-only / packaging / pending costs each represented with sources.',
    playbookChapter: 4,
    sectionId: 'cost-structure',
    priority: 'P0'
  },
  // Brand book core
  {
    id: 'ch-05:audience',
    title: 'Write House Phoenix audience paragraph',
    owner: 'CMO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: 'Customer segments',
    doneWhen: 'Audience is concrete enough that a sign could be written for them.',
    playbookChapter: 5,
    sectionId: 'audience',
    priority: 'P0'
  },
  {
    id: 'ch-05:voice',
    title: 'Document House Phoenix voice rules',
    owner: 'CMO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: null,
    doneWhen: 'A new student could write a House Phoenix caption from the rules.',
    playbookChapter: 5,
    sectionId: 'voice',
    priority: 'P0'
  },
  {
    id: 'ch-05:identity',
    title: 'Document House Phoenix identity (colors, marks, type)',
    owner: 'CMO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: null,
    doneWhen: 'A reviewer can apply the rules to a sign without guessing.',
    playbookChapter: 5,
    sectionId: 'identity',
    priority: 'P0'
  },
  // Product / pricing
  {
    id: 'ch-07:product-list',
    title: 'List every Renni Inc. product on its own row',
    owner: 'CFO · COO support',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: null,
    doneWhen: 'Every product: brand, quantity ready, sizes, state, owner.',
    playbookChapter: 7,
    sectionId: 'product-list',
    priority: 'P0'
  },
  {
    id: 'ch-07:margin-and-break-even',
    title: 'Build the per-product margin and break-even table',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: 'Product list · Unit cost',
    doneWhen: 'Each product has unit cost, margin, units-to-break-even.',
    playbookChapter: 7,
    sectionId: 'margin-and-break-even',
    priority: 'P0'
  },
  // Finance
  {
    id: 'ch-08:unit-cost',
    title: 'Build the unit cost table',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: 'Product list',
    doneWhen: 'Each product has a defensible unit cost with components and a source.',
    playbookChapter: 8,
    sectionId: 'unit-cost',
    priority: 'P0'
  },
  {
    id: 'ch-08:break-even',
    title: 'Build the break-even table',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: 'Unit cost',
    doneWhen: 'Units-to-break-even per product with the fixed-cost allocation rule labeled.',
    playbookChapter: 8,
    sectionId: 'break-even',
    priority: 'P0'
  },
  {
    id: 'ch-08:revenue-scenarios',
    title: 'Build low / target / stretch revenue scenarios per product',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Break-even',
    doneWhen: 'Three scenarios per product with quantity, price, revenue, assumption, confidence.',
    playbookChapter: 8,
    sectionId: 'revenue-scenarios',
    priority: 'P0'
  },
  // Operations
  {
    id: 'ch-09:inventory',
    title: 'Build the inventory checklist',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: null,
    doneWhen: 'Every item: quantity, location, owner, issue / risk, packed?',
    playbookChapter: 9,
    sectionId: 'inventory',
    priority: 'P0'
  },
  {
    id: 'ch-09:day-of-sop',
    title: 'Write the Day-of SOP',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: null,
    doneWhen: 'A new student could read the SOP and run the day.',
    playbookChapter: 9,
    sectionId: 'day-of-sop',
    priority: 'P0'
  },
  {
    id: 'ch-09:baked-goods-sop',
    title: 'Write the Baked Goods SOP (food-safety concerns named per step)',
    owner: 'COO · baker',
    reviewer: 'Co-CEOs · advisor',
    dueLabel: 'Final week — first',
    dependency: null,
    doneWhen: 'Preparation, allergen, transport, display rules documented (read the warning banner).',
    playbookChapter: 9,
    sectionId: 'baked-goods-sop',
    priority: 'P0'
  },
  // Business Operations Expansion (Pass — Ch. 9 reframe).
  {
    id: 'ch-09:operating-handoff',
    title: 'Build the operating handoff checklist',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — last',
    dependency: 'Operating cadence · Vendor coordination · Quality control',
    doneWhen: 'Each operating asset has owner + location + next-cohort action; risk-if-lost named for cadence, vendors, and quality standards.',
    playbookChapter: 9,
    sectionId: 'operating-handoff',
    priority: 'P0'
  },
  {
    id: 'ch-09:operating-cadence',
    title: 'Document Renni Inc. weekly + monthly operating cadence',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: null,
    doneWhen: 'Each routine has owner + cadence + done signal + backup.',
    playbookChapter: 9,
    sectionId: 'operating-cadence',
    priority: 'P1'
  },
  {
    id: 'ch-09:fulfillment-workflow',
    title: 'Map the fulfillment workflow (request → handoff)',
    owner: 'COO · CFO support',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Inventory',
    doneWhen: 'Each step has owner + input + output + risk + backup; no payment / checkout language.',
    playbookChapter: 9,
    sectionId: 'fulfillment-workflow',
    priority: 'P1'
  },
  {
    id: 'ch-09:vendor-coordination',
    title: 'Build the vendor / partner tracker',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: null,
    doneWhen: 'Each vendor has owner + next contact + status; at-risk and blocked entries name the blocker.',
    playbookChapter: 9,
    sectionId: 'vendor-coordination',
    priority: 'P1'
  },
  {
    id: 'ch-09:quality-control',
    title: 'Seed the quality control checklist (print, packaging, signage, food)',
    owner: 'COO · baker for food checks',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Baked goods SOP for food-safety checks',
    doneWhen: 'Each check has standard + owner + when checked + fix path.',
    playbookChapter: 9,
    sectionId: 'quality-control',
    priority: 'P1'
  },
  {
    id: 'ch-09:customer-service-issues',
    title: 'Log customer service issues + responses + lessons',
    owner: 'COO · CMO for messaging',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — late',
    dependency: 'Customer feedback from events',
    doneWhen: 'Each issue has owner + response + fix + lesson; no refund / payment language.',
    playbookChapter: 9,
    sectionId: 'customer-service-issues',
    priority: 'P1'
  },
  {
    id: 'ch-09:interest-tracking',
    title: 'Seed the safe interest tracker (non-transactional interest only)',
    owner: 'CMO · COO support',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — late',
    dependency: null,
    doneWhen: 'Each row has customer type + interest + follow-up owner + next step + privacy note. No payment / order / refund / tax data.',
    playbookChapter: 9,
    sectionId: 'interest-tracking',
    priority: 'P1'
  },
  {
    id: 'ch-09:post-launch-operations',
    title: 'Write the post-launch operations memo (3+ evidenced lessons)',
    owner: 'COO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — late',
    dependency: 'Post-event recap actuals',
    doneWhen: 'At least three operating lessons evidenced; each has owner + recommendation + definition of done.',
    playbookChapter: 9,
    sectionId: 'post-launch-operations',
    priority: 'P1'
  },
  // Marketing
  {
    id: 'ch-10:audience',
    title: 'Name the launch campaign audience',
    owner: 'CMO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: 'Customer segments',
    doneWhen: 'A specific audience is named — not "everyone."',
    playbookChapter: 10,
    sectionId: 'audience',
    priority: 'P0'
  },
  {
    id: 'ch-10:messaging',
    title: 'Write the campaign one-line message',
    owner: 'CMO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — early',
    dependency: 'Campaign audience',
    doneWhen: 'One sentence the audience would actually repeat, in House Phoenix voice.',
    playbookChapter: 10,
    sectionId: 'messaging',
    priority: 'P0'
  },
  // Phoenix Nest
  {
    id: 'ch-11:identity',
    title: 'Write the Phoenix Nest pitch identity paragraph',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — first',
    dependency: 'House Phoenix brand book',
    doneWhen: 'A reviewer can repeat what House Phoenix is in one sentence.',
    playbookChapter: 11,
    sectionId: 'identity',
    priority: 'P0'
  },
  {
    id: 'ch-11:evidence',
    title: 'Document the strongest Phoenix Nest pitch evidence points',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'CFO support',
    dueLabel: 'Final week — first',
    dependency: 'Pop-up actuals',
    doneWhen: 'At least two named evidence points with source / observation / labeled assumption.',
    playbookChapter: 11,
    sectionId: 'evidence',
    priority: 'P0'
  },
  {
    id: 'ch-11:offer',
    title: 'Build the retail-carry offer (product + price + margin)',
    owner: 'CFO',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — mid',
    dependency: 'Margin and break-even',
    doneWhen: 'Recommended products + retail / wholesale price + shelf fit + margin story.',
    playbookChapter: 11,
    sectionId: 'offer',
    priority: 'P0'
  },
  {
    id: 'ch-11:ask',
    title: 'Write the Phoenix Nest pitch ask',
    owner: 'Co-CEOs',
    reviewer: 'Advisor',
    dueLabel: 'Final week — mid',
    dependency: 'Offer',
    doneWhen: 'A specific yes/no ask the buyer can act on.',
    playbookChapter: 11,
    sectionId: 'ask',
    priority: 'P0'
  },
  // Strategy
  {
    id: 'ch-12:customer-and-sales-insights',
    title: 'Write 3–5 customer and sales insights tied to evidence',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — late',
    dependency: 'Pop-up actuals · /revenue',
    doneWhen: '3–5 insights tied to a number or quote, each with confidence.',
    playbookChapter: 12,
    sectionId: 'customer-and-sales-insights',
    priority: 'P0'
  },
  {
    id: 'ch-12:next-semester-goals',
    title: 'Write 3–5 next-semester goals with metric + target + owner',
    owner: 'Chief Strategy and Growth Officer',
    reviewer: 'Co-CEOs',
    dueLabel: 'Final week — late',
    dependency: 'Customer and sales insights',
    doneWhen: '3–5 goals each with metric + target + owner; targets defendable from this cohort.',
    playbookChapter: 12,
    sectionId: 'next-semester-goals',
    priority: 'P0'
  },
  // Handoff
  {
    id: 'ch-13:major-decisions',
    title: 'List 8–15 major decisions in chronological order',
    owner: 'Co-CEOs',
    reviewer: 'Advisor',
    dueLabel: 'Final week — late',
    dependency: null,
    doneWhen: '8+ decisions chronological; each has a date, decider, and one-line summary.',
    playbookChapter: 13,
    sectionId: 'major-decisions',
    priority: 'P0'
  },
  {
    id: 'ch-13:decision-rationale',
    title: 'Write rationale for every major decision',
    owner: 'Co-CEOs',
    reviewer: 'Advisor',
    dueLabel: 'Final week — late',
    dependency: 'Major decisions',
    doneWhen: 'Every decision has a short rationale; alternatives considered are named.',
    playbookChapter: 13,
    sectionId: 'decision-rationale',
    priority: 'P0'
  },
  {
    id: 'ch-13:next-cohort-instructions',
    title: 'Write the next-cohort instructions memo',
    owner: 'Co-CEOs · Chief Strategy and Growth Officer',
    reviewer: 'Advisor',
    dueLabel: 'Final week — last',
    dependency: 'Continuity · Major decisions',
    doneWhen: 'A new cohort student could read it in five minutes and know where to start.',
    playbookChapter: 13,
    sectionId: 'next-cohort-instructions',
    priority: 'P0'
  }
] as const

/** Lookup by section-entry id — used by the panel to render the
 *  matching template alongside the section card. */
export function getTaskTemplateForEntry(
  entryId: string
): FinalWeekTaskTemplate | undefined {
  return FINAL_WEEK_TASK_TEMPLATES.find((t) => t.id === entryId)
}
