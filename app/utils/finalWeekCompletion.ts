// Final Week Completion Mode — declarative P0 / P1 / P2 priority map
// for the launch-week student dashboard.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure data + pure functions. No Firestore reads, no Firestore
//     writes, no AI calls, no /api/* requests.
//   - Display-only. The map drives the FinalWeekCompletionPanel
//     and the Final Week Chief Push panel — neither component
//     creates tasks, changes status, submits, or approves anything.
//   - The lane structure mirrors the launch-week audit: 10 lanes,
//     each with 1–6 P0 sections. Adding a P1 / P2 inside a lane
//     is fine; the panel renders P0 prominently and P1 / P2 as
//     a quieter "next-up" tier.
//
// VOCABULARY
// ----------
//   P0 — must finish for a Playbook + pop-up + Phoenix Nest pitch
//        to read as complete. Without these, the launch deliverable
//        does not hold up to a real reviewer.
//   P1 — strongly recommended for completeness; not strictly
//        required for the deliverable to be reviewable.
//   P2 — nice-to-have polish; defer if time-constrained.

import {
  getTemplateStudio,
  templateStudios
} from '~/data/templateStudios'

export type FinalWeekPriority = 'P0' | 'P1' | 'P2'

export type FinalWeekLaneId =
  | 'executive'
  | 'bmc'
  | 'brand'
  | 'product-pricing'
  | 'finance'
  | 'operations'
  | 'marketing'
  | 'phoenix-nest'
  | 'strategy'
  | 'handoff'

export interface FinalWeekSectionEntry {
  /** Stable id; combines deliverableId + sectionId. */
  id: string
  laneId: FinalWeekLaneId
  /** Deliverable id (chapter id from app/data/templateStudios/index.ts). */
  deliverableId: string
  /** Section id within the deliverable's studio. */
  sectionId: string
  /** Display title — usually mirrors the section's studio title. */
  title: string
  /** What the student is producing in plain language ("a table",
   *  "an SOP", "a 1-page pitch"). */
  artifact: string
  priority: FinalWeekPriority
  /** Owner role (CFO / COO / CMO / etc. — display strings, not enums). */
  owner: string
  /** Reviewer role. */
  reviewer: string
  /** Display-only due-date label. The platform never sets the date. */
  dueLabel: string
  /** Plain-language upstream dependency, or null when none applies. */
  dependency: string | null
  /** Concrete completion standard ("done when …"). */
  doneWhen: string
  /** First action a student should take when they open the section. */
  firstAction: string
}

export interface FinalWeekLane {
  id: FinalWeekLaneId
  /** Lane heading shown on the panel. */
  title: string
  /** What the team that owns this lane is responsible for. */
  ownerSummary: string
  /** P0/P1/P2 sections in priority order. */
  sections: FinalWeekSectionEntry[]
}

// ---- The map -----------------------------------------------------

/** P0 / P1 / P2 sections per lane.
 *
 *  Each section's deliverableId + sectionId must exist in
 *  app/data/templateStudios/*.ts. The static lookup in
 *  validateFinalWeekMap (called by the panel on mount) flags any
 *  drift — useful when section ids are renamed in a studio file. */
export const FINAL_WEEK_LANES: readonly FinalWeekLane[] = [
  {
    id: 'executive',
    title: 'Executive launch summary',
    ownerSummary: 'Co-CEOs · Strategy and Growth — the front-page snapshot of Renni Inc.',
    sections: [
      {
        id: 'ch-01:company-overview',
        laneId: 'executive',
        deliverableId: 'ch-01-executive-summary',
        sectionId: 'company-overview',
        title: 'Company overview',
        artifact: 'A short paragraph that names Renni Inc., House Phoenix, the supporting brands, and the three final outputs.',
        priority: 'P0',
        owner: 'Co-CEOs',
        reviewer: 'Co-CEOs · advisor',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'A reviewer who has never seen the project understands what Renni Inc. is in two minutes.',
        firstAction: 'Open the section and paste the four-sentence company summary from the team consensus.'
      },
      {
        id: 'ch-01:launch-focus',
        laneId: 'executive',
        deliverableId: 'ch-01-executive-summary',
        sectionId: 'launch-focus',
        title: 'Launch focus',
        artifact: 'A 3–5 sentence paragraph naming the launch focus across TechTown, Playbook, and the Phoenix Nest pitch.',
        priority: 'P0',
        owner: 'Co-CEOs',
        reviewer: 'Advisor',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'A reviewer can name the three final outputs without scrolling.',
        firstAction: 'Write one sentence per final output, then connect them with the team\'s launch theme.'
      },
      {
        id: 'ch-03:corporate-structure-and-ownership',
        laneId: 'executive',
        deliverableId: 'ch-03-company-structure-and-continuity',
        sectionId: 'corporate-structure-and-ownership',
        title: 'Corporate structure & ownership (draft model)',
        artifact:
          'Draft educational model — entity comparison, 70/30 ownership, student allocation, vesting, distribution policy, governance, graduation rules, adult / legal review checklist.',
        priority: 'P1',
        owner: 'Co-CEOs',
        reviewer: 'Instructor / Admin',
        dueLabel: 'Final week — late',
        dependency:
          'Executive summary and company structure basics (company roles, decision rights, continuity risks)',
        doneWhen:
          'Draft model includes entity comparison, 70/30 ownership, student allocation, vesting / exit rules, governance, and adult / legal review checklist. Output carries the "draft educational model — instructor / adult / legal review required" disclaimer.',
        firstAction:
          'Open the Corporate Structure Builder, pick 2 entity types to compare, and confirm the 30/70 ownership defaults.'
      }
    ]
  },
  {
    id: 'bmc',
    title: 'BMC core',
    ownerSummary: 'Strategy and Growth — the business-model spine the rest of the chapters reference.',
    sections: [
      {
        id: 'ch-04:customer-segments',
        laneId: 'bmc',
        deliverableId: 'ch-04-business-model-canvas',
        sectionId: 'customer-segments',
        title: 'Customer segments',
        artifact: 'Two or more named segments with one-line needs.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: null,
        doneWhen: 'Two or more segments with specific needs — never "everyone."',
        firstAction: 'Open the Customer Builder above the writing surface and compose one segment.'
      },
      {
        id: 'ch-04:customer-archetype-local-application',
        laneId: 'bmc',
        deliverableId: 'ch-04-business-model-canvas',
        sectionId: 'customer-archetype-local-application',
        title: 'Local archetype application',
        artifact: 'Local buyer-context table — one row per national archetype the team uses.',
        priority: 'P1',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'CMO support · Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: 'Customer Segments',
        doneWhen:
          'Each selected national archetype is mapped to a local context, product fit, message, proof, risk, and next validation step. Ch. 10 audience/touchpoints and Ch. 11 Phoenix Nest buyer fit pull from this table.',
        firstAction: 'Open the Ch. 4 local archetype application table.'
      },
      {
        id: 'ch-04:value-propositions',
        laneId: 'bmc',
        deliverableId: 'ch-04-business-model-canvas',
        sectionId: 'value-propositions',
        title: 'Value propositions',
        artifact: 'One promise per segment tied to a real Renni Inc. product.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'CMO support · Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: 'Customer Segments',
        doneWhen: 'Each segment has one promise tied to a product, plus the proof a customer would believe.',
        firstAction: 'Open Working Draft and write one promise sentence per segment.'
      },
      {
        id: 'ch-04:revenue-streams',
        laneId: 'bmc',
        deliverableId: 'ch-04-business-model-canvas',
        sectionId: 'revenue-streams',
        title: 'Revenue streams',
        artifact: 'A revenue-streams table — one row per stream.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Product list (Ch. 7)',
        doneWhen: 'Each stream is named with capture method, source, confidence, and tie-to-Ch. 8.',
        firstAction: 'Open the Revenue Streams Table builder and click Import Renni Inc. revenue streams.'
      },
      {
        id: 'ch-04:cost-structure',
        laneId: 'bmc',
        deliverableId: 'ch-04-business-model-canvas',
        sectionId: 'cost-structure',
        title: 'Cost structure',
        artifact: 'A cost-structure table — one row per cost line.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Unit Cost (Ch. 8) + Break-Even (Ch. 7 / 8)',
        doneWhen: 'Variable / fixed / event-only / packaging / pending costs each represented; each row cites a source.',
        firstAction: 'Open the Cost Structure Table builder and add the four most material cost lines first.'
      }
    ]
  },
  {
    id: 'brand',
    title: 'Brand book core',
    ownerSummary: 'CMO — House Phoenix identity rules other students can apply.',
    sections: [
      {
        id: 'ch-05:audience',
        laneId: 'brand',
        deliverableId: 'ch-05-house-phoenix-brand-book',
        sectionId: 'audience',
        title: 'Brand audience',
        artifact: 'A short paragraph naming the audience House Phoenix is for.',
        priority: 'P0',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: 'Customer Segments (Ch. 4)',
        doneWhen: 'The audience is concrete enough that a sign or caption could be written for them tomorrow.',
        firstAction: 'Open the section and paraphrase the Ch. 4 customer segments in House Phoenix language.'
      },
      {
        id: 'ch-05:voice',
        laneId: 'brand',
        deliverableId: 'ch-05-house-phoenix-brand-book',
        sectionId: 'voice',
        title: 'Brand voice',
        artifact: 'Voice rules another student could use for captions, signs, and product copy.',
        priority: 'P0',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: null,
        doneWhen: 'A new student could write a House Phoenix caption from the rules without asking.',
        firstAction: 'Open the section and write three "House Phoenix sounds like" sentences.'
      },
      {
        id: 'ch-05:identity',
        laneId: 'brand',
        deliverableId: 'ch-05-house-phoenix-brand-book',
        sectionId: 'identity',
        title: 'Brand identity',
        artifact: 'Identity rules — colors, marks, type, image direction.',
        priority: 'P0',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: null,
        doneWhen: 'A reviewer can apply the rules to a single sign without guessing.',
        firstAction: 'Open the section and document the colors, marks, and type the team is actually using.'
      },
      {
        id: 'ch-05:value-proposition',
        laneId: 'brand',
        deliverableId: 'ch-05-house-phoenix-brand-book',
        sectionId: 'value-proposition',
        title: 'Brand value proposition',
        artifact: 'One sentence: what House Phoenix promises its audience.',
        priority: 'P1',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Brand audience',
        doneWhen: 'One sentence the audience would actually repeat.',
        firstAction: 'Write one promise sentence; tie it to the audience paragraph.'
      }
    ]
  },
  {
    id: 'product-pricing',
    title: 'Product line and pricing',
    ownerSummary: 'CFO + Operations — the product list and per-product margin story.',
    sections: [
      {
        id: 'ch-07:product-list',
        laneId: 'product-pricing',
        deliverableId: 'ch-07-current-product-line-and-pricing',
        sectionId: 'product-list',
        title: 'Product list',
        artifact: 'One row per product: brand, quantity ready, sizes, state, owner.',
        priority: 'P0',
        owner: 'CFO · COO support',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'Every product has its own row with quantity ready and current state. Donations listed separately.',
        firstAction: 'Open the section and list every Renni Inc. product on its own row.'
      },
      {
        id: 'ch-07:margin-and-break-even',
        laneId: 'product-pricing',
        deliverableId: 'ch-07-current-product-line-and-pricing',
        sectionId: 'margin-and-break-even',
        title: 'Margin and break-even',
        artifact: 'Break-Even Table — one row per product.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: 'Product list + Unit Cost (Ch. 8)',
        doneWhen: 'Each product has unit cost, margin, and units-to-break-even with assumptions labeled.',
        firstAction: 'Open the Break-Even Table builder; enter unit cost, sale price, fixed-cost share per product.'
      },
      {
        id: 'ch-07:pricing-summary',
        laneId: 'product-pricing',
        deliverableId: 'ch-07-current-product-line-and-pricing',
        sectionId: 'pricing-summary',
        title: 'Pricing summary',
        artifact: 'Per-product retail price + margin + channel.',
        priority: 'P1',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Margin and break-even',
        doneWhen: 'Pending prices are explicitly flagged.',
        firstAction: 'Open Working Draft and list the retail price + reasoning per product.'
      },
      {
        id: 'ch-07:inventory-readiness',
        laneId: 'product-pricing',
        deliverableId: 'ch-07-current-product-line-and-pricing',
        sectionId: 'inventory-readiness',
        title: 'Inventory readiness',
        artifact: 'Per-product readiness table.',
        priority: 'P1',
        owner: 'COO',
        reviewer: 'CFO',
        dueLabel: 'Final week — mid',
        dependency: 'Product list',
        doneWhen: 'Each product\'s on-hand vs expected vs gap is honest, with an owner and a close-by date.',
        firstAction: 'Open Working Draft; for each product list on-hand, expected, and the gap.'
      }
    ]
  },
  {
    id: 'finance',
    title: 'Finance and revenue model',
    ownerSummary: 'CFO — the defendable cost / margin / revenue story behind the launch.',
    sections: [
      {
        id: 'ch-08:unit-cost',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'unit-cost',
        title: 'Unit cost',
        artifact: 'Unit Cost Table — one row per product.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: 'Product list (Ch. 7)',
        doneWhen: 'Each product has a defensible unit cost with components and a source.',
        firstAction: 'Open the Unit Cost Table builder and Import Renni Inc. revenue streams… use the import button.'
      },
      {
        id: 'ch-08:break-even',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'break-even',
        title: 'Break-even',
        artifact: 'Break-Even Table — one row per product.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: 'Unit cost',
        doneWhen: 'Units-to-break-even per product with the fixed-cost allocation rule labeled.',
        firstAction: 'Open the Break-Even Table builder and import the product list.'
      },
      {
        id: 'ch-08:revenue-scenarios',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'revenue-scenarios',
        title: 'Revenue scenarios',
        artifact: 'Low / target / stretch revenue rows per product.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Break-even',
        doneWhen: 'Three scenarios per product with quantity, price, revenue, assumption, confidence.',
        firstAction: 'Open the Revenue Scenarios Table builder and add a Target row per product.'
      },
      {
        id: 'ch-08:donation-scenarios',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'donation-scenarios',
        title: 'Donation scenarios',
        artifact: 'Donor type × count × average gift table.',
        priority: 'P1',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: null,
        doneWhen: 'Donation revenue is projected separately from product sales with capture method documented.',
        firstAction: 'Open the Donation Scenarios Table builder; add one donor-type row.'
      },
      {
        id: 'ch-08:key-financial-kpis',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'key-financial-kpis',
        title: 'Key financial KPIs',
        artifact: '4–7 KPIs with formula, target, source, owner, review rhythm.',
        priority: 'P1',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Unit cost · Break-even · Revenue scenarios',
        doneWhen: '4–7 KPIs are defined; each has a real source field.',
        firstAction: 'Open the KPI Table builder and click Add starter KPIs.'
      },
      {
        id: 'ch-08:sale-price',
        laneId: 'finance',
        deliverableId: 'ch-08-finance-and-revenue-model',
        sectionId: 'sale-price',
        title: 'Sale price strategy',
        artifact: 'A defensible per-product price (Pricing Strategy Builder).',
        priority: 'P1',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Unit cost',
        doneWhen: 'Each product\'s price names cost, margin, and break-even with a labeled assumption.',
        firstAction: 'Open the Pricing Strategy Builder; pick a product and enter cost + target price.'
      }
    ]
  },
  {
    id: 'operations',
    title: 'Operations and continuity',
    ownerSummary: 'COO — the SOPs and inventory another student could pick up cold.',
    sections: [
      {
        id: 'ch-09:inventory',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'inventory',
        title: 'Inventory checklist',
        artifact: 'Inventory checklist — every item the team brings.',
        priority: 'P0',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'Every item: quantity, location, owner, issue / risk, packed?',
        firstAction: 'Open the Inventory Checklist builder and Import product list.'
      },
      {
        id: 'ch-09:day-of-sop',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'day-of-sop',
        title: 'Day-of SOP',
        artifact: 'Day-of SOP — time-ordered steps with owners and backups.',
        priority: 'P0',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'A new student could read the SOP and run the day.',
        firstAction: 'Open the Day-of SOP builder and walk the day in time order.'
      },
      {
        id: 'ch-09:baked-goods-sop',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'baked-goods-sop',
        title: 'Baked goods SOP',
        artifact: 'Food-handling SOP with food-safety concerns named per step.',
        priority: 'P0',
        owner: 'COO · baker',
        reviewer: 'Co-CEOs · advisor',
        dueLabel: 'Final week — first',
        dependency: null,
        doneWhen: 'Preparation, allergen, transport, and display rules are documented (read the warning banner).',
        firstAction: 'Open the Baked Goods SOP builder and document the first three food-touching steps.'
      },
      {
        id: 'ch-09:continuity',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'continuity',
        title: 'Continuity checklist',
        artifact: 'Continuity checklist — what the next cohort inherits.',
        priority: 'P1',
        owner: 'COO · CFO support',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Inventory · Day-of SOP · Baked goods SOP',
        doneWhen: 'Every system / process the next cohort inherits has status, owner, link, warning, next step.',
        firstAction: 'Open the Continuity Checklist builder and list the top 5 inherited assets.'
      },
      {
        id: 'ch-09:operating-handoff',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'operating-handoff',
        title: 'Operating handoff',
        artifact: 'Operating handoff checklist — cadence, vendors, QC, follow-up tracker.',
        priority: 'P0',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — last',
        dependency: 'Operating cadence · Vendor coordination · Quality control',
        doneWhen: 'Each operating asset has owner + location + next-cohort action; risk-if-lost named for cadence, vendors, and quality standards.',
        firstAction: 'Open the Operating Handoff Checklist and list the top operating assets the next cohort needs.'
      },
      {
        id: 'ch-09:operating-cadence',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'operating-cadence',
        title: 'Operating cadence',
        artifact: 'Weekly / monthly operating rhythm checklist.',
        priority: 'P1',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: null,
        doneWhen: 'Each routine has owner + cadence + done signal + backup.',
        firstAction: 'Open the Operating Cadence builder and seed weekly + monthly routines.'
      },
      {
        id: 'ch-09:fulfillment-workflow',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'fulfillment-workflow',
        title: 'Fulfillment workflow',
        artifact: 'Fulfillment steps checklist (request → handoff).',
        priority: 'P1',
        owner: 'COO · CFO support',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Inventory',
        doneWhen: 'Each step has owner + input + output + risk + backup; no payment / checkout language.',
        firstAction: 'Open the Fulfillment Workflow builder and walk one customer through end-to-end.'
      },
      {
        id: 'ch-09:vendor-coordination',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'vendor-coordination',
        title: 'Vendor coordination',
        artifact: 'Vendor / partner tracker.',
        priority: 'P1',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: null,
        doneWhen: 'Each vendor has owner + next contact + status; at-risk and blocked entries name the blocker.',
        firstAction: 'Open the Vendor Tracker and list every vendor / partner Renni Inc. depends on.'
      },
      {
        id: 'ch-09:quality-control',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'quality-control',
        title: 'Quality control',
        artifact: 'Quality control checklist.',
        priority: 'P1',
        owner: 'COO · baker for food checks',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Baked goods SOP for food-safety checks',
        doneWhen: 'Each check has standard + owner + when checked + fix path.',
        firstAction: 'Open the Quality Control builder and seed checks for print, packaging, signage, and food.'
      },
      {
        id: 'ch-09:customer-service-issues',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'customer-service-issues',
        title: 'Customer service / issues',
        artifact: 'Customer issue tracker.',
        priority: 'P1',
        owner: 'COO · CMO for messaging',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Customer feedback from events',
        doneWhen: 'Each issue has owner + response + fix + lesson; no refund / payment language.',
        firstAction: 'Open the Customer Issue Tracker and log known issues from past interactions.'
      },
      {
        id: 'ch-09:interest-tracking',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'interest-tracking',
        title: 'Safe interest tracking',
        artifact: 'Non-transactional interest tracker.',
        priority: 'P1',
        owner: 'CMO · COO support',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: null,
        doneWhen: 'Each row has customer type + interest + follow-up owner + next step + privacy note. No payment / order / refund / tax data.',
        firstAction: 'Open the Safe Interest Tracker and seed two real interest signals from recent conversations.'
      },
      {
        id: 'ch-09:post-launch-operations',
        laneId: 'operations',
        deliverableId: 'ch-09-operations-and-continuity-systems',
        sectionId: 'post-launch-operations',
        title: 'Post-launch operations',
        artifact: 'Post-launch operations memo.',
        priority: 'P1',
        owner: 'COO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Post-event recap actuals',
        doneWhen: 'At least three operating lessons evidenced; each has owner + recommendation + definition of done.',
        firstAction: 'Open the Post-Launch Operations memo and write the strongest lesson card first.'
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing and campaign',
    ownerSummary: 'CMO — the campaign the launch audience actually sees.',
    sections: [
      {
        id: 'ch-10:audience',
        laneId: 'marketing',
        deliverableId: 'ch-10-marketing-and-campaign-playbook',
        sectionId: 'audience',
        title: 'Campaign audience',
        artifact: 'The specific audience for the launch campaign.',
        priority: 'P0',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: 'Customer Segments (Ch. 4)',
        doneWhen: 'A specific audience is named — not "everyone."',
        firstAction: 'Open the section and name the one audience the campaign is for first.'
      },
      {
        id: 'ch-10:messaging',
        laneId: 'marketing',
        deliverableId: 'ch-10-marketing-and-campaign-playbook',
        sectionId: 'messaging',
        title: 'Campaign messaging',
        artifact: 'A one-line message the audience would actually repeat.',
        priority: 'P0',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — early',
        dependency: 'Campaign audience',
        doneWhen: 'One sentence the audience would actually repeat, tied to House Phoenix voice.',
        firstAction: 'Open the section and write three one-line message candidates.'
      },
      {
        id: 'ch-10:touchpoints',
        laneId: 'marketing',
        deliverableId: 'ch-10-marketing-and-campaign-playbook',
        sectionId: 'touchpoints',
        title: 'Channel touchpoints',
        artifact: 'A structured channel × touchpoint table.',
        priority: 'P1',
        owner: 'CMO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Campaign audience',
        doneWhen:
          'Each row in the touchpoints table has channel, date, owner, audience, message, proof, dependency, and done signal.',
        firstAction:
          'Open the Ch. 10 touchpoints table. Add channel, date, owner, audience, message, proof, dependency, and done signal. Use the table before writing final Playbook language.'
      },
      {
        id: 'ch-10:measurement',
        laneId: 'marketing',
        deliverableId: 'ch-10-marketing-and-campaign-playbook',
        sectionId: 'measurement',
        title: 'Campaign measurement',
        artifact: '2–4 measurable signals.',
        priority: 'P1',
        owner: 'CMO',
        reviewer: 'CFO support',
        dueLabel: 'Final week — late',
        dependency: 'Campaign messaging',
        doneWhen: '2–4 signals named, each with a source the team can actually pull.',
        firstAction: 'Open Working Draft and pick 2–4 signals; name the source per signal.'
      }
    ]
  },
  {
    id: 'phoenix-nest',
    title: 'Phoenix Nest retail carry pitch',
    ownerSummary: 'Strategy and Growth + CMO + CFO — the proposal to a real retail buyer.',
    sections: [
      {
        id: 'ch-11:identity',
        laneId: 'phoenix-nest',
        deliverableId: 'ch-11-phoenix-nest-retail-carry-pitch',
        sectionId: 'identity',
        title: 'Identity',
        artifact: 'A short identity paragraph the buyer can repeat.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — first',
        dependency: 'House Phoenix brand book',
        doneWhen: 'A reviewer can repeat what House Phoenix is in one sentence.',
        firstAction: 'Open the section and paste the one-sentence House Phoenix identity from Ch. 5.'
      },
      {
        id: 'ch-11:evidence',
        laneId: 'phoenix-nest',
        deliverableId: 'ch-11-phoenix-nest-retail-carry-pitch',
        sectionId: 'evidence',
        title: 'Evidence',
        artifact: 'The proof points the pitch leans on.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'CFO support',
        dueLabel: 'Final week — first',
        dependency: 'Pop-up actuals · customer quotes',
        doneWhen: 'At least two named evidence points with source / observation / labeled assumption.',
        firstAction: 'Open the section and list the two strongest pop-up evidence points.'
      },
      {
        id: 'ch-11:offer',
        laneId: 'phoenix-nest',
        deliverableId: 'ch-11-phoenix-nest-retail-carry-pitch',
        sectionId: 'offer',
        title: 'Offer',
        artifact: 'The retail-carry offer: what + price + margin.',
        priority: 'P0',
        owner: 'CFO',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — mid',
        dependency: 'Margin and break-even (Ch. 7 / 8)',
        doneWhen: 'Recommended products + retail price + wholesale price + shelf fit + margin story.',
        firstAction: 'Open the section and pick the 2–3 products you would propose for the shelf first.'
      },
      {
        id: 'ch-11:ask',
        laneId: 'phoenix-nest',
        deliverableId: 'ch-11-phoenix-nest-retail-carry-pitch',
        sectionId: 'ask',
        title: 'Ask',
        artifact: 'A concrete next-step ask.',
        priority: 'P0',
        owner: 'Co-CEOs',
        reviewer: 'Advisor',
        dueLabel: 'Final week — mid',
        dependency: 'Offer',
        doneWhen: 'A specific yes/no ask the buyer can act on (test slot? carry pilot? meeting?).',
        firstAction: 'Open the section and write the ask in one sentence.'
      }
    ]
  },
  {
    id: 'strategy',
    title: 'Strategy and next semester',
    ownerSummary: 'Chief Strategy and Growth Officer — what the next cohort should do first.',
    sections: [
      {
        id: 'ch-12:customer-and-sales-insights',
        laneId: 'strategy',
        deliverableId: 'ch-12-strategy-and-next-semester-recommendations',
        sectionId: 'customer-and-sales-insights',
        title: 'Customer and sales insights',
        artifact: '3–5 insights tied to evidence.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Pop-up actuals · /revenue',
        doneWhen: '3–5 insights tied to a number or quote, each with confidence.',
        firstAction: 'Open the section and write the strongest insight first; mark its confidence honestly.'
      },
      {
        id: 'ch-12:next-semester-goals',
        laneId: 'strategy',
        deliverableId: 'ch-12-strategy-and-next-semester-recommendations',
        sectionId: 'next-semester-goals',
        title: 'Next-semester goals',
        artifact: '3–5 measurable goals with metric + target + owner.',
        priority: 'P0',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Customer and sales insights',
        doneWhen: '3–5 goals each with metric + target + owner; targets defendable from this cohort\'s actuals.',
        firstAction: 'Open the section and list 3 goals; tie each to a baseline number from this cohort.'
      },
      {
        id: 'ch-12:recommended-action-plan',
        laneId: 'strategy',
        deliverableId: 'ch-12-strategy-and-next-semester-recommendations',
        sectionId: 'recommended-action-plan',
        title: 'Recommended action plan',
        artifact: 'A sequenced 6–10 step action plan.',
        priority: 'P1',
        owner: 'Chief Strategy and Growth Officer',
        reviewer: 'Co-CEOs',
        dueLabel: 'Final week — late',
        dependency: 'Next-semester goals',
        doneWhen: 'A sequenced 6–10-step plan a new cohort could execute on day one.',
        firstAction: 'Open the section and list the first 3 actions in week-by-week order.'
      }
    ]
  },
  {
    id: 'handoff',
    title: 'Decision log and handoff',
    ownerSummary: 'Co-CEOs · Chief Strategy and Growth Officer — what the next cohort needs to start.',
    sections: [
      {
        id: 'ch-13:major-decisions',
        laneId: 'handoff',
        deliverableId: 'ch-13-decision-log-and-appendices',
        sectionId: 'major-decisions',
        title: 'Major decisions',
        artifact: '8–15 major decisions in chronological order.',
        priority: 'P0',
        owner: 'Co-CEOs',
        reviewer: 'Advisor',
        dueLabel: 'Final week — late',
        dependency: null,
        doneWhen: '8+ decisions chronological; each has a date, decider, and one-line summary.',
        firstAction: 'Open the section and list the 5 most material decisions of the semester first.'
      },
      {
        id: 'ch-13:decision-rationale',
        laneId: 'handoff',
        deliverableId: 'ch-13-decision-log-and-appendices',
        sectionId: 'decision-rationale',
        title: 'Decision rationale',
        artifact: '2–4 sentences of rationale per major decision.',
        priority: 'P0',
        owner: 'Co-CEOs',
        reviewer: 'Advisor',
        dueLabel: 'Final week — late',
        dependency: 'Major decisions',
        doneWhen: 'Every decision has a short rationale; alternatives considered are named.',
        firstAction: 'Open the section and write rationale for the 3 most material decisions first.'
      },
      {
        id: 'ch-13:next-cohort-instructions',
        laneId: 'handoff',
        deliverableId: 'ch-13-decision-log-and-appendices',
        sectionId: 'next-cohort-instructions',
        title: 'Next-cohort instructions',
        artifact: 'A short memo a new cohort can read in five minutes.',
        priority: 'P0',
        owner: 'Co-CEOs · Chief Strategy and Growth Officer',
        reviewer: 'Advisor',
        dueLabel: 'Final week — last',
        dependency: 'Continuity (Ch. 9) · Major decisions',
        doneWhen: 'A new cohort student could read it in five minutes and know where to start.',
        firstAction: 'Open the section and list the first three things the next cohort should open.'
      }
    ]
  }
] as const

// ---- Selectors ----------------------------------------------------

/** Flat list of every section in priority order across all lanes.
 *  Used by selectors that don't care about lane grouping (e.g. the
 *  chief panel's blocked-or-overdue filter). */
export function allFinalWeekSections(): FinalWeekSectionEntry[] {
  return FINAL_WEEK_LANES.flatMap((lane) => lane.sections)
}

/** Returns the deeplink to the section page. */
export function sectionLink(entry: FinalWeekSectionEntry): string {
  return `/deliverables/${entry.deliverableId}/sections/${entry.sectionId}`
}

/** Severity-ordered priorities so a panel can sort within a lane. */
export const PRIORITY_RANK: Record<FinalWeekPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2
}

// ---- Drift validation (cheap, runs once on panel mount) -----------

export interface FinalWeekDriftIssue {
  laneId: FinalWeekLaneId
  entryId: string
  reason: string
}

/** Runs a cheap consistency check. Catches drift when a studio
 *  renames a section id but the lane map still references the old
 *  one. Returns an empty array when everything is wired correctly. */
export function validateFinalWeekMap(): FinalWeekDriftIssue[] {
  const issues: FinalWeekDriftIssue[] = []
  for (const lane of FINAL_WEEK_LANES) {
    for (const entry of lane.sections) {
      const studio = getTemplateStudio(entry.deliverableId)
      if (!studio) {
        issues.push({
          laneId: lane.id,
          entryId: entry.id,
          reason: `Unknown deliverableId "${entry.deliverableId}"`
        })
        continue
      }
      const section = studio.sections.find((s) => s.id === entry.sectionId)
      if (!section) {
        issues.push({
          laneId: lane.id,
          entryId: entry.id,
          reason: `Unknown sectionId "${entry.sectionId}" in studio "${entry.deliverableId}"`
        })
      }
    }
  }
  return issues
}

// Re-export the studio registry so callers don't have to chase the
// path themselves.
export { templateStudios }
