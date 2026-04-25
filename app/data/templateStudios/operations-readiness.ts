import type { TemplateStudio } from '~/types/templateStudio'

export const operationsReadiness: TemplateStudio = {
  title: 'Operations + Inventory Readiness',
  purpose:
    'Make the pop-up run day-of. Inventory counted, SOPs written, handoff documented, baked goods handled safely.',
  learningObjective:
    'Turn a one-day event into a repeatable operation: what happens, who does it, and how we hand it to next cohort.',
  whyItMatters:
    'The Marketing campaign drives foot traffic. The Finance model decides what to charge. Operations is what makes the table actually open at 10am with the right inventory, the right signage, and the right people. Without an ops SOP, next cohort starts from zero.',
  finalOutput:
    'Inventory counts per product, a day-of SOP (setup → selling → handoff), a baked-goods handling SOP, and a continuity note for next cohort.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
      id: 'inventory',
      title: 'What are we actually bringing?',
      lesson:
        'Inventory is the bet. Count what we have, note what is missing, decide what to order.',
      studentPrompts: [
        'How many of each product do we physically have right now?',
        'What is ordered but not delivered? When does it arrive?',
        'What safety stock (extras for damaged units) do we want?'
      ],
      requiredInputs: ['Physical inventory count per product'],
      completionCriteria: [
        'Inventory count is recorded against every /pricing product.',
        'Any gaps vs. planned quantity have a named plan to close.'
      ]
    },
    {
      id: 'day-of-sop',
      title: 'How does pop-up day run?',
      lesson:
        'SOP = Standard Operating Procedure. Write the steps someone who was not in planning meetings could follow.',
      example:
        '08:00 — Load van. 09:00 — Arrive TechTown. 09:15 — Set up table, signage, card reader. 10:00 — Open. 12:00 — Inventory check. 16:00 — Close, count cash, pack out. 17:00 — Handoff.',
      studentPrompts: [
        'Who is on shift at each block?',
        'What is the Square setup step-by-step? Who owns the card reader?',
        'What happens if we run out of a product?'
      ],
      completionCriteria: [
        'Every 30-minute block has a person named.',
        'Stockout response is documented.'
      ]
    },
    {
      id: 'baked-goods-sop',
      title: 'Baked goods — food safety',
      lesson:
        'Humble Oven baked goods need separate handling. Temperature, allergens, labeling, and sell-by timing matter.',
      studentPrompts: [
        'What baked goods are we selling? Who baked them and when?',
        'What allergens need labels at the table?',
        'How do we display them so nothing spoils over a 6-hour pop-up?'
      ],
      requiredInputs: ['Allergen list', 'Ingredient list per item'],
      completionCriteria: [
        'Allergen + ingredient labels are prepared before pop-up day.',
        'Baking-to-selling timeline keeps items inside safe hold window.'
      ]
    },
    {
      id: 'continuity',
      title: 'Handoff to next cohort',
      lesson:
        'Continuity is the Playbook\'s real point. Write what would have saved you a week if the last cohort had written it down.',
      studentPrompts: [
        'What surprised your team during planning?',
        'What is the single most useful thing next cohort should know first?',
        'Where are the files, folders, contacts, and credentials stored?'
      ],
      completionCriteria: [
        'Continuity note covers surprises, top-thing-to-know, and asset locations.',
        'Referenced from the Playbook Decision Log.'
      ]
    }
  ],
  requirements: [
    {
      id: 'ops-inventory-count',
      label: 'Live inventory count per product',
      description:
        'Physical count confirmed against /pricing planned quantity for every product.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      suggestedTaskTitle: 'Collect pop-up inventory counts',
      definitionOfDone:
        'Every product has a counted inventory number; any gap to planned quantity has an owned closure plan.'
    },
    {
      id: 'ops-day-sop',
      label: 'Pop-up day SOP',
      description:
        'Step-by-step setup, selling, and pack-out procedure for TechTown pop-up day.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      evidenceType: 'sop-document',
      suggestedTaskTitle: 'Draft pop-up day SOP',
      definitionOfDone:
        'SOP document linked from the deliverable; COO sign-off recorded.'
    },
    {
      id: 'ops-baked-sop',
      label: 'Baked goods handling SOP',
      description:
        'Food-safety SOP covering allergens, labeling, hold-time, and display for Humble Oven items.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      suggestedTaskTitle: 'Draft baked goods handling SOP'
    },
    {
      id: 'ops-continuity-note',
      label: 'Continuity note for next cohort',
      description:
        'What surprised this cohort; top-thing-to-know; where files/contacts/credentials live.',
      requiredForApproval: false,
      department: 'operations',
      playbookChapter: 9
    }
  ],
  suggestedTasks: [
    {
      title: 'Collect pop-up inventory counts',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-inventory-count',
      definitionOfDone:
        'Inventory counts saved with gap-closure plan per product.',
      dueOffsetDays: 5
    },
    {
      title: 'Draft pop-up day SOP',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-day-sop',
      definitionOfDone:
        'SOP document drafted; every 30-minute block has a named owner.',
      dueOffsetDays: 7
    },
    {
      title: 'Draft baked goods handling SOP',
      department: 'operations',
      ownerRole: 'member',
      requirementId: 'ops-baked-sop',
      definitionOfDone:
        'Allergen list, ingredient list per item, and hold-window plan documented.',
      dueOffsetDays: 6
    },
    {
      title: 'Write continuity note',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-continuity-note',
      definitionOfDone:
        'Continuity note covers surprises, top-thing-to-know, and asset locations.',
      dueOffsetDays: 9
    }
  ],
  requiredEvidence: [
    {
      id: 'inventory-sheet',
      label: 'Inventory count sheet',
      description: 'Per-product counts with planned-vs-actual variance.',
      required: true
    },
    {
      id: 'sop-doc',
      label: 'SOP document',
      description: 'Pop-up day SOP linked from the deliverable.',
      required: true
    },
    {
      id: 'allergen-labels',
      label: 'Allergen + ingredient labels',
      description: 'Ready-to-print labels for every baked item.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest steps you might have missed after you write a first SOP.',
      'Help format or tighten an SOP for readability.',
      'Surface food-safety questions you should ask an instructor.'
    ],
    disallowedHelp: [
      'Inventing inventory numbers you have not counted.',
      'Writing the full SOP from scratch — you know the team and the venue.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
