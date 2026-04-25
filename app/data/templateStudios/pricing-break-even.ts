import type { TemplateStudio } from '~/types/templateStudio'

export const pricingBreakEven: TemplateStudio = {
  title: 'Pricing + Break-Even Summary',
  purpose:
    'Decide what to charge for each pop-up product and prove the math works — how many units the team needs to sell to cover costs and hit a revenue goal.',
  learningObjective:
    'Read a unit-economics model well enough to explain it to a customer, a co-CEO, or a retail buyer without notes.',
  whyItMatters:
    "If pricing is wrong, the pop-up either loses money or leaves money on the table. Phoenix Nest buyers read the margin before they read the brand story. The Playbook's Finance chapter is where next cohort learns whether this one shipped real economics.",
  finalOutput:
    'A per-product sale price, unit cost, planned quantity, projected revenue, projected gross profit, and break-even unit count — matching what /pricing shows and what /revenue will reconcile against.',
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
      ]
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
      ]
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
      department: 'finance',
      ownerRole: 'member',
      requirementId: 'pricing-conversion-assumption',
      definitionOfDone:
        'Foot-traffic assumption written, conversion rate cited, total matches planned quantities.',
      dueOffsetDays: 6
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
