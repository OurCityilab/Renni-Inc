import type { TemplateStudio } from '~/types/templateStudio'

export const strategyNextSemester: TemplateStudio = {
  title: 'Strategy and Next-Semester Recommendations',
  purpose:
    'Turn TechTown outcomes, customer feedback, operational lessons, and unresolved questions into a practical next-semester strategy that the next cohort can pick up and run.',
  learningObjective:
    'Translate "what happened" into "what we recommend doing next" — a strategic action plan grounded in actual results, not just opinions.',
  whyItMatters:
    'Without a strategy chapter, every cohort starts from scratch. With one, the next cohort gets a head start on what to keep, what to change, and what to retire. This is the chapter that turns Renni Inc. from a one-time project into a sustained company.',
  finalOutput:
    'A strategy chapter naming the lessons of the launch, the customer/sales insights worth keeping, the operational lessons, the brand and product priorities, the next-semester goals, the open risks, and a recommended action plan with owners and timing.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'what-we-learned',
      title: 'What we learned from the launch',
      lesson:
        'The honest version, not the press release. Name the 5–7 biggest lessons of the cohort — what worked, what surprised the team, what failed.',
      studentPrompts: [
        'List 5–7 lessons from launch — be specific about which decision or moment taught it.',
        'For each lesson, mark whether it confirmed an assumption or broke one.',
        'Avoid generic lessons that could apply to any project ("we learned to communicate better"). Pick ones tied to a real moment.'
      ],
      requiredInputs: ['5–7 lessons', 'Confirmed/broke-an-assumption tag per lesson'],
      completionCriteria: [
        'Lessons are concrete and traceable to a moment.',
        'A reader can act on each lesson, not just nod at it.'
      ]
    },
    {
      id: 'customer-and-sales-insights',
      title: 'Customer and sales insights',
      lesson:
        'Pull the actual customer data — feedback, sales data, donation patterns, observed behavior at the table — and turn it into 3–5 insights that should shape next semester.',
      studentPrompts: [
        'What did customers actually say or do at the pop-up that surprised the team?',
        'Which products sold faster than expected and why? Which ones lagged?',
        'What does this say about who Renni Inc. should target next semester?'
      ],
      completionCriteria: [
        'Three to five customer/sales insights are written and tied to evidence.',
        'Implications for next semester are spelled out.'
      ]
    },
    {
      id: 'operational-lessons',
      title: 'Operational lessons',
      lesson:
        'The COO\'s view: which SOPs held up under pop-up pressure, which broke, and what the next cohort should change. Include staffing, inventory, baked-goods handling, handoff.',
      studentPrompts: [
        'Which SOP saved the team time? Which one cost the team time?',
        'What was the biggest day-of operational surprise?',
        'What three operational changes would you make first next semester?'
      ],
      completionCriteria: [
        'At least three operational lessons named with concrete recommendations.',
        'Recommendations are specific enough to act on without re-debating.'
      ]
    },
    {
      id: 'brand-and-product-priorities',
      title: 'Brand and product priorities',
      lesson:
        'What stays, what evolves, what retires. Clear product and brand priorities prevent next cohort from rebuilding the lineup from scratch.',
      studentPrompts: [
        'Which products keep their slot next semester?',
        'Which products need a redesign, repackage, or repricing?',
        'Which products should retire, and why?',
        'For House Phoenix and each supporting brand, name one priority direction.'
      ],
      completionCriteria: [
        'Every current product has a keep / change / retire recommendation.',
        'Each brand (House Phoenix + supporting) has a priority direction.'
      ]
    },
    {
      id: 'next-semester-goals',
      title: 'Next-semester goals',
      lesson:
        'A short list of measurable goals — three to five — for the next cohort. These should be ambitious but defensible against the actual results of this semester.',
      studentPrompts: [
        'List 3–5 next-semester goals tied to measurable outcomes.',
        'For each goal, name the metric and the rough target.',
        'Note which department owns which goal.'
      ],
      requiredInputs: ['3–5 goals', 'Metric and target per goal', 'Owner department per goal'],
      completionCriteria: [
        'Goals are measurable and have owners.',
        'Targets are defended by the data in this chapter.'
      ]
    },
    {
      id: 'risks-and-open-questions',
      title: 'Risks and open questions',
      lesson:
        'Strategy without risks is wishful thinking. Name the things that could derail next semester and the questions the team did not have time to answer.',
      studentPrompts: [
        'List 2–4 strategic risks for next semester.',
        'For each one, write a one-line response option.',
        'List 2–4 open questions that need experimentation, not just opinion.'
      ],
      completionCriteria: [
        'Risks are real and not just rephrased lessons.',
        'Open questions are framed as questions, not declarations.'
      ]
    },
    {
      id: 'recommended-action-plan',
      title: 'Recommended action plan',
      lesson:
        'Close the chapter with a concrete first-90-days action plan for the next cohort: who does what, in roughly what order, with rough timing.',
      studentPrompts: [
        'List 6–10 next-cohort actions in order, with owners and rough timing.',
        'Mark which actions are sequencing-critical (must come first).',
        'Note which actions depend on a decision the next cohort still has to make.'
      ],
      completionCriteria: [
        'Action plan is sequenced with owners and rough timing.',
        'Sequencing-critical actions are flagged.'
      ]
    }
  ],
  requirements: [
    {
      id: 'strategy-lessons-from-launch',
      label: 'Lessons from the launch are written',
      description:
        '5–7 concrete lessons tied to specific moments, with confirmed/broke-an-assumption tags.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      suggestedTaskTitle: 'Draft lessons and strategic priorities',
      definitionOfDone:
        'CSGO drafts lessons and confirms each one is traceable to a real moment.'
    },
    {
      id: 'strategy-customer-sales-insights',
      label: 'Customer and sales insights with evidence',
      description:
        '3–5 insights pulled from feedback, observation, and sales/donation data.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add marketing/customer lessons',
      definitionOfDone:
        'CMO and CSGO confirm each insight is grounded in evidence and points to a next-semester implication.'
    },
    {
      id: 'strategy-operational-lessons',
      label: 'Operational lessons captured',
      description:
        'At least three operational lessons with concrete next-semester recommendations.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add operational lessons',
      definitionOfDone:
        'COO writes operational lessons that are specific enough to act on.'
    },
    {
      id: 'strategy-brand-product-priorities',
      label: 'Brand and product priorities documented',
      description:
        'Every current product has a keep/change/retire recommendation; each brand has a priority direction.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      definitionOfDone:
        'Recommendations cover every current product and every brand in the family.'
    },
    {
      id: 'strategy-next-semester-goals',
      label: '3–5 next-semester goals with metrics and owners',
      description:
        'Goals are measurable, ambitious-but-defensible, and assigned to a department.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add finance/revenue lessons',
      definitionOfDone:
        'CFO confirms metrics and targets are achievable based on this semester\'s data.'
    },
    {
      id: 'strategy-risks-open-questions',
      label: 'Risks and open questions named',
      description:
        '2–4 strategic risks with response options and 2–4 open questions framed as questions.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      definitionOfDone:
        'Risks and open questions are real and survive a Co-CEO review.'
    },
    {
      id: 'strategy-action-plan',
      label: 'First-90-days action plan written',
      description:
        '6–10 sequenced actions with owners, rough timing, and sequencing-critical flags.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 12,
      definitionOfDone:
        'Co-CEO and admin confirm the action plan is actionable on the next cohort\'s day one.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft lessons and strategic priorities',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-lessons-from-launch',
      definitionOfDone:
        'CSGO drafts the lessons section and the brand/product priorities.',
      dueOffsetDays: 3
    },
    {
      title: 'Add operational lessons',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'strategy-operational-lessons',
      definitionOfDone:
        'COO writes operational lessons and three concrete recommendations.',
      dueOffsetDays: 4
    },
    {
      title: 'Add finance/revenue lessons',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'strategy-next-semester-goals',
      definitionOfDone:
        'CFO writes finance/revenue lessons and confirms next-semester metric targets.',
      dueOffsetDays: 4
    },
    {
      title: 'Add marketing/customer lessons',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'strategy-customer-sales-insights',
      definitionOfDone:
        'CMO writes customer and sales insights and ties each one to evidence.',
      dueOffsetDays: 4
    },
    {
      title: 'Final strategy and next-semester review',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'strategy-action-plan',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end, confirm the action plan is actionable.',
      dueOffsetDays: 7
    }
  ],
  requiredEvidence: [
    {
      id: 'strategy-techtown-results',
      label: 'TechTown pop-up results',
      description:
        'Sales summary, donation totals, and any pop-up day notes.',
      required: true
    },
    {
      id: 'strategy-revenue-summary',
      label: 'Revenue / donation summary',
      description:
        'Final /revenue snapshot or summary used to back the goals.',
      required: true
    },
    {
      id: 'strategy-customer-feedback',
      label: 'Customer feedback',
      description:
        'Notes or quotes from customers at the pop-up or after.',
      required: true
    },
    {
      id: 'strategy-task-closeout',
      label: 'Workbench / task closeout notes',
      description:
        'Closeout notes from the Workbench so the next cohort can see what got done and what was deferred.',
      required: false
    },
    {
      id: 'strategy-department-handoffs',
      label: 'Department handoff notes',
      description:
        'Per-department handoff snapshots feeding the strategy chapter.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a lesson or recommendation for vagueness after the team drafts it.',
      'Ask clarifying questions when an insight lacks evidence.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing lessons, customer quotes, or recommendations the team did not arrive at.',
      'Choosing the next-semester goals.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
