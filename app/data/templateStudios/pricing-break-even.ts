import type { TemplateStudio } from '~/types/templateStudio'

export const pricingBreakEven: TemplateStudio = {
  title: 'Finance and Revenue Model',
  purpose:
    'Build the full Renni Inc. finance picture for the launch — pricing and break-even per product, revenue scenarios, donation scenarios, the KPIs the team is tracking, and the post-event recap structure.',
  learningObjective:
    'Read and explain a finance model end-to-end: unit economics, revenue scenarios, donation flow, KPIs, and what to recap after the pop-up closes.',
  whyItMatters:
    "If pricing is wrong, the pop-up either loses money or leaves money on the table. If the revenue scenarios don't exist, nobody knows what to celebrate or what to fix. Phoenix Nest buyers read the margin before they read the brand story. The Finance chapter is where the next cohort learns whether this cohort shipped real economics.",
  finalOutput:
    'A per-product pricing and break-even view that matches /pricing, plus revenue scenarios (low / target / stretch), a donation scenario plan, a short list of finance KPIs, and a post-event recap template the team will fill in after TechTown.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
      id: 'unit-cost',
      title: 'What does a unit cost?',
      lesson:
        'Unit cost is every dollar spent per item before markup — blank garment, printing, baking ingredients, packaging. If an expense only exists because we sold the unit, it belongs here.',
      example:
        'A House Phoenix beanie: $4 blank + $3 print + $1 tag = $8 unit cost.',
      studentPrompts: [
        'Ask the vendor for an updated quote — do not use last cohort\'s number.',
        'Is there a per-unit packaging or tag cost you forgot?'
      ],
      requiredInputs: ['Vendor quote (linked)', 'Per-unit packaging cost'],
      completionCriteria: [
        'Unit cost cites a current vendor quote.',
        'Packaging/tag cost is explicit or zero with a reason.'
      ]
    },
    {
      id: 'sale-price',
      title: 'What should we charge?',
      lesson:
        'Sale price is a decision about the brand and the margin. Too cheap reads as not-real; too expensive leaves unsold inventory at the end of the pop-up. Pick a price the team can defend to a buyer.',
      studentPrompts: [
        'Compare to 3 comparable items students have bought recently. What was the price, what was the quality signal?',
        'If you ran out in the first hour, did you price too low?'
      ],
      completionCriteria: [
        'Sale price is written on the /pricing page with the reasoning.'
      ],
      sourceGuidance: [
        'Use a clearly labeled demand assumption when the price depends on expected sell-through.',
        'Reference the Chapter 7 demand estimate used to support this price.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each price, log the demand it assumes — buyers per scenario at the proposed sale price. The Phoenix Nest pitch will read this same entry.'
      }
    },
    {
      id: 'planned-quantity',
      title: 'How many are we making?',
      lesson:
        'Planned quantity is your inventory bet. Over-order and you eat leftovers; under-order and you leave revenue behind. Small safety stock is better than stockouts for a one-day pop-up.',
      studentPrompts: [
        'How many students will realistically walk the TechTown floor that day?',
        'What conversion rate does the team assume (10%, 15%)? Why?',
        'What does the COO say about inventory handling capacity?'
      ],
      requiredInputs: ['Expected foot traffic', 'Assumed conversion rate'],
      completionCriteria: [
        'Planned quantity is defended with foot-traffic and conversion math.'
      ],
      sourceGuidance: [
        'Use conservative, base, and ambitious scenarios when planned quantity depends on demand.',
        'Name the source for foot traffic and conversion — observation, prior pop-up, comparable event — or label as an assumption.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Plan inventory against the conservative scenario. Ambitious is the upside; planning to ambitious is how teams over-order.'
      }
    },
    {
      id: 'break-even',
      title: 'Does the math work?',
      lesson:
        'Break-even units = fixed cost share ÷ (sale price − unit cost). Below that number, the product loses money on allocated overhead.',
      example:
        'If T-shirt fixed cost share is $200 and contribution margin is $15, break-even is 14 units. We plan 25 → safe margin of 11.',
      studentPrompts: [
        'Does every product clear its break-even with room?',
        'If one product is "Behind plan", what will we do — drop price, push marketing, or cut it?'
      ],
      completionCriteria: [
        'Break-even units calculated per product on /pricing.',
        'A risk response is written for any product whose break-even is close to planned quantity.'
      ]
    },
    {
      id: 'revenue-scenarios',
      title: 'Revenue scenarios — low / target / stretch',
      lesson:
        'A single revenue number is a guess. Three scenarios — low, target, and stretch — let the team prepare for the best and the worst without sounding overconfident.',
      example:
        'Target: $1,800 (target conversion at planned inventory). Low: $1,100 (half-conversion / weather). Stretch: $2,400 (sellout on at least one product).',
      studentPrompts: [
        'Build a low / target / stretch revenue scenario from /pricing inputs.',
        'For each scenario, name the assumption that drives it — foot traffic, conversion rate, sellout pattern.',
        'Note which scenario the operations and marketing chapters are planned against.'
      ],
      requiredInputs: ['Three revenue scenarios', 'Driving assumption per scenario'],
      completionCriteria: [
        'Three scenarios are listed with traceable assumptions.',
        'Plan-of-record scenario is named.'
      ],
      evidencePrompt:
        'Each scenario should have a structured evidence entry: claim (the revenue number), source (foot-traffic estimate, conversion rate), assumption, calculation, confidence, and risk.',
      sourceGuidance: [
        'Foot-traffic and conversion-rate assumptions should come from CSGO/CMO with CFO signoff — log who provided the number.',
        'If the number is an estimate, mark confidence and name what would tighten it.',
        'Use the Market Builder block on this section to log audience × interest × conversion for each scenario; the revenue here should reconcile with the Market Builder output.',
        'Reference the Chapter 7 Market Builder scenario used for each revenue assumption — the Chapter 7 demand panel above the section list shows the entries to draw from.',
        'Do not present estimates as facts.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Conservative / base / ambitious is required here because the rest of the pop-up plan keys off these numbers. Reconcile with the Chapter 7 demand entry for the same product.'
      },
      marketFit: {
        enabled: true,
        guidance:
          'Pick the segment each scenario is keyed against. Revenue ranges that depend on which buyer the product is reaching (students vs parents vs Detroit supporters) need that buyer named explicitly.'
      }
    },
    {
      id: 'donation-scenarios',
      title: 'Donation scenarios',
      lesson:
        'Donations are a separate revenue stream with their own scenario logic — donor count, average gift, and how the team prompts a donation at the table without making customers feel pressured.',
      studentPrompts: [
        'Estimate donor count and average gift for low / target / stretch.',
        'Describe how donations are prompted at the table (sign, ask, donation card).',
        'Note how donations are recorded in the Command Center vs. Square — donations should never be reported as product revenue.'
      ],
      requiredInputs: [
        'Donor count assumptions',
        'Average gift assumption',
        'Prompt method',
        'Recording method'
      ],
      completionCriteria: [
        'Donation scenarios are written with clear assumptions.',
        'Recording rule keeps donations and product sales separate.'
      ],
      evidencePrompt:
        'Log donor-count and average-gift assumptions as structured evidence — even if both are pure estimates, label them so the post-event recap can compare to actuals.',
      sourceGuidance: [
        'Cite past pop-up donation totals if available; otherwise label the entry as an estimate.',
        'Donations and product revenue belong in separate evidence entries.'
      ]
    },
    {
      id: 'key-financial-kpis',
      title: 'Key financial KPIs',
      lesson:
        'Pick the small set of KPIs the team will actually watch — gross revenue, gross profit, donation total, sell-through rate per product, average transaction. Two or three is plenty; eight is noise.',
      studentPrompts: [
        'List the 3–5 KPIs the team will track during and after the pop-up.',
        'For each KPI, name where it lives (/pricing, /revenue, donation tracker).',
        'Set a target value per KPI tied to the target revenue scenario.'
      ],
      completionCriteria: [
        'Three to five KPIs named with locations and targets.',
        'KPIs match what the next cohort can actually pull from existing tools.'
      ]
    },
    {
      id: 'post-event-recap',
      title: 'Post-event recap structure',
      lesson:
        'A post-event recap is the one chance to compare scenario to actuals while memory is fresh. Write the structure now so on Sunday after the pop-up, the team just fills it in.',
      studentPrompts: [
        'List the recap sections: actual vs. scenario revenue, donation total, top sellers, slow movers, what to change next time.',
        'Name the owner (CFO) and the deadline (within 7 days of the pop-up).',
        'Note where the recap lives — Decision Log appendix or its own doc.'
      ],
      completionCriteria: [
        'Recap section list, owner, and deadline are named.',
        'Recap location is identified so the next cohort can find it.'
      ]
    }
  ],
  requirements: [
    {
      id: 'pricing-vendor-quotes',
      label: 'Current vendor quotes on file',
      description:
        'Every product has a cited unit cost backed by a current quote or receipt.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      evidenceType: 'vendor-quote',
      suggestedTaskTitle: 'Collect updated vendor quotes',
      definitionOfDone:
        'Quote for each product saved to the shared finance folder and linked from the deliverable.'
    },
    {
      id: 'pricing-scenarios-live',
      label: 'Pricing scenarios on /pricing',
      description:
        'Each pop-up product has an entry on /pricing with unitCost, salePrice, and plannedQuantity.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      suggestedTaskTitle: 'Enter all products on /pricing',
      definitionOfDone:
        '/pricing shows every product with a sale price, unit cost, and planned quantity.'
    },
    {
      id: 'pricing-break-even',
      label: 'Break-even unit counts defended',
      description:
        'Every product clears break-even with room, OR a risk response is written.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8
    },
    {
      id: 'pricing-conversion-assumption',
      label: 'Foot-traffic + conversion assumption',
      description:
        'Planned quantities are defended with an explicit foot-traffic estimate and conversion rate.',
      requiredForApproval: false,
      department: 'finance',
      playbookChapter: 8
    },
    {
      id: 'finance-unit-costs-complete',
      label: 'Unit costs complete on /pricing',
      description:
        'Every product has an entry on /pricing with current vendor-quoted unit cost.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      suggestedTaskTitle: 'Confirm unit costs and sale prices',
      definitionOfDone:
        'CFO confirms /pricing reflects current quotes for every product.'
    },
    {
      id: 'finance-sale-prices-listed',
      label: 'Sale prices listed and defended',
      description:
        'Each product has a sale price with a one-line rationale a customer or buyer would accept.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      definitionOfDone:
        'Sale prices match /pricing and the team can defend each price out loud.'
    },
    {
      id: 'finance-break-even-explained',
      label: 'Break-even explained per product',
      description:
        'Every product has its break-even unit count and a risk response if margin is thin.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      definitionOfDone:
        'Break-even values match /pricing and risk responses are written where needed.'
    },
    {
      id: 'finance-revenue-scenarios',
      label: 'Low / target / stretch revenue scenarios written',
      description:
        'Three revenue scenarios with traceable assumptions and a named plan-of-record.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      suggestedTaskTitle: 'Build revenue scenarios',
      definitionOfDone:
        'Scenarios are written and the plan-of-record is named for ops/marketing.'
    },
    {
      id: 'finance-donation-scenarios',
      label: 'Donation scenarios written and recording rule documented',
      description:
        'Donor count, average gift, prompt method, and recording rule keep donations separate from product sales.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      suggestedTaskTitle: 'Define donation scenario assumptions',
      definitionOfDone:
        'CFO + Co-CEO confirm donation flow and reporting separation.'
    },
    {
      id: 'finance-kpis-defined',
      label: 'Finance KPIs defined with targets and locations',
      description:
        '3–5 KPIs the team will actually watch, each with a target value and the tool/page where it lives.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      suggestedTaskTitle: 'Define key finance KPIs',
      definitionOfDone:
        'KPI list is short, named, and pullable from current tools.'
    },
    {
      id: 'finance-post-event-recap-plan',
      label: 'Post-event recap structure written',
      description:
        'Recap section list, owner, deadline, and storage location are documented so the recap can be filled in within 7 days of the pop-up.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 8,
      definitionOfDone:
        'Recap template exists and is reviewed by Co-CEO.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Collect updated vendor quotes',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'pricing-vendor-quotes',
      definitionOfDone:
        'One current quote per product saved and linked.',
      dueOffsetDays: 5
    },
    {
      title: 'Enter all products on /pricing',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'pricing-scenarios-live',
      dependency: 'pricing-vendor-quotes',
      definitionOfDone:
        '/pricing shows every seeded product with salePrice, unitCost, plannedQuantity.',
      dueOffsetDays: 7
    },
    {
      title: 'Estimate foot traffic and conversion rate',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'pricing-conversion-assumption',
      definitionOfDone:
        'CSGO/CMO source the foot-traffic and conversion-rate assumptions, document evidence, and route to CFO for signoff before the model is locked.',
      dueOffsetDays: 6
    },
    {
      title: 'Confirm unit costs and sale prices',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'finance-unit-costs-complete',
      definitionOfDone:
        'CFO confirms /pricing reflects current vendor quotes and defended sale prices.',
      dueOffsetDays: 6
    },
    {
      title: 'Build revenue scenarios',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'finance-revenue-scenarios',
      dependency: 'pricing-scenarios-live',
      definitionOfDone:
        'Low / target / stretch scenarios written with assumptions and a named plan-of-record.',
      dueOffsetDays: 8
    },
    {
      title: 'Define donation scenario assumptions',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'finance-donation-scenarios',
      definitionOfDone:
        'CFO and Co-CEO agree on donor count, average gift, prompt method, and the recording separation rule.',
      dueOffsetDays: 8
    },
    {
      title: 'Define key finance KPIs',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'finance-kpis-defined',
      definitionOfDone:
        '3–5 KPIs documented with targets and the tool/page where each one lives.',
      dueOffsetDays: 9
    },
    {
      title: 'Confirm inventory assumptions used in finance model',
      department: 'operations',
      ownerRole: 'coo',
      definitionOfDone:
        'COO confirms the inventory quantities feeding /pricing and the revenue scenarios.',
      dueOffsetDays: 7
    },
    {
      title: 'Final finance and revenue model review',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'finance-post-event-recap-plan',
      definitionOfDone:
        'Co-CEO and admin review the finance chapter end-to-end before submission.',
      dueOffsetDays: 10
    }
  ],
  requiredEvidence: [
    {
      id: 'vendor-quotes-folder',
      label: 'Vendor quotes folder',
      description: 'One current quote per product, not last cohort\'s.',
      required: true
    },
    {
      id: 'pricing-page-screenshot',
      label: 'Screenshot of /pricing page',
      description: 'Confirms the live scenarios match this summary.',
      required: false
    },
    {
      id: 'finance-revenue-tracker',
      label: 'Revenue / donation tracker reference',
      description:
        'Link to /revenue or the donation tracker so scenarios can be reconciled to actuals.',
      required: true
    },
    {
      id: 'finance-inventory-assumptions',
      label: 'Inventory quantity assumptions',
      description:
        'Per-product inventory quantities the finance model assumes, confirmed by COO.',
      required: true
    },
    {
      id: 'finance-post-event-recap-template',
      label: 'Post-event recap notes or template',
      description:
        'Template the team will fill in within 7 days of the pop-up, with section headers ready.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Explain a unit-economics term you do not recognize.',
      'Check your break-even math after you write it.',
      'Suggest questions to ask a vendor about a quote.'
    ],
    disallowedHelp: [
      'Picking your prices for you.',
      'Fabricating vendor costs without a real quote.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
