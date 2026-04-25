import type { TemplateStudio } from '~/types/templateStudio'

export const executiveSummary: TemplateStudio = {
  title: 'Executive Summary',
  purpose:
    'Tell the Renni Inc. and House Phoenix story in one short, clear summary that a teacher, a buyer, or the next cohort can read in two minutes and understand what is being built and why.',
  learningObjective:
    'Summarize a company for stakeholders without overexplaining — name the company, the launch, the artifact, the pitch, the products, the risks, and the next actions.',
  whyItMatters:
    'The executive summary is the first page of the Brand & Operations Playbook. Phoenix Nest buyers, teachers, and the next cohort start here. If this section is vague, everything downstream loses credibility — even if the rest of the work is strong.',
  finalOutput:
    'A one-page executive summary that names Renni Inc. and House Phoenix, explains the TechTown pop-up and the Phoenix Nest pitch, lists current products, and ends with risks and next actions before launch.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'company-overview',
      title: 'What is Renni Inc. and House Phoenix?',
      lesson:
        'Open by naming the parent company and the launch brand. Stakeholders need to know in one paragraph who you are and what you make.',
      example:
        'Renni Inc. is a student-led company at Renaissance High School. Its first launch brand is House Phoenix, a Detroit-student-led merchandise brand built for the TechTown pop-up.',
      studentPrompts: [
        'Write one sentence that names Renni Inc. as the parent company.',
        'Write one sentence that introduces House Phoenix as the launch brand.',
        'Avoid jargon — a parent or teacher should follow it on the first read.'
      ],
      requiredInputs: ['Company sentence', 'Launch brand sentence'],
      completionCriteria: [
        'Renni Inc. is named as the parent company.',
        'House Phoenix is named as the primary launch brand.'
      ]
    },
    {
      id: 'launch-focus',
      title: 'What are we launching, and where?',
      lesson:
        'The pop-up, the Playbook, and the Phoenix Nest pitch are three different deliverables — name each one so readers can tell them apart.',
      studentPrompts: [
        'Describe the TechTown pop-up in one or two sentences (when, where, who is it for).',
        'Describe the Brand & Operations Playbook — what it is and why the next cohort will use it.',
        'Describe the Phoenix Nest retail carry pitch in plain language.'
      ],
      requiredInputs: [
        'TechTown pop-up description',
        'Playbook description',
        'Phoenix Nest pitch description'
      ],
      completionCriteria: [
        'TechTown pop-up is named and explained.',
        'Brand & Operations Playbook is named and explained.',
        'Phoenix Nest retail carry pitch is named and explained.'
      ]
    },
    {
      id: 'current-progress',
      title: 'What is currently in the lineup?',
      lesson:
        'List the products Renni Inc. is actually selling so the summary matches the pop-up. Donations sit alongside products but should be called out separately.',
      example:
        'Current pop-up lineup: House Phoenix beanies, sweatshirts, t-shirts, and Humble Oven baked goods. Donations are accepted at the table for community programs.',
      studentPrompts: [
        'Name every product on the current pop-up table: beanies, sweatshirts, t-shirts, baked goods.',
        'Name donations explicitly so readers know they are separate from product sales.',
        'If anything has changed since last week, say so — keep this current.'
      ],
      requiredInputs: ['Product list with donations called out separately'],
      completionCriteria: [
        'All five lineup items are named: beanies, sweatshirts, t-shirts, baked goods, donations.',
        'Donations are clearly separated from product sales.'
      ]
    },
    {
      id: 'key-risks',
      title: 'What are the open questions or risks?',
      lesson:
        'A real executive summary names risks. Two or three is enough — pick the ones a buyer or teacher would actually want to know about.',
      studentPrompts: [
        'List 2–3 current risks or open questions (inventory, pricing, marketing, time).',
        'For each one, write a one-line explanation of why it matters.',
        'Do not over-promise — risks named honestly read as professional, not weak.'
      ],
      completionCriteria: [
        'Two or three risks are named.',
        'Each risk has a one-line explanation.'
      ]
    },
    {
      id: 'next-steps',
      title: 'What happens next before launch?',
      lesson:
        'Close the summary with concrete next actions. This is what the team is doing this week — not aspirations.',
      studentPrompts: [
        'List the 3–5 next actions before TechTown.',
        'Name who owns each one (Co-CEO, CMO, CFO, COO, CSGO).',
        'Make sure the actions match what is actually on the timeline.'
      ],
      completionCriteria: [
        'Three to five next actions are listed with owners.',
        'Actions read as real work, not vague intentions.'
      ]
    }
  ],
  requirements: [
    {
      id: 'exec-names-renni-and-house-phoenix',
      label: 'Names Renni Inc. and House Phoenix correctly',
      description:
        'Summary opens by naming Renni Inc. as the parent company and House Phoenix as the launch brand.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      suggestedTaskTitle: 'Draft company overview paragraph',
      definitionOfDone:
        'Opening paragraph names Renni Inc. and House Phoenix in plain language.'
    },
    {
      id: 'exec-explains-techtown-popup',
      label: 'Explains the TechTown pop-up',
      description:
        'TechTown pop-up is described well enough that a stranger can picture the event.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add brand and launch language for the pop-up',
      definitionOfDone:
        'TechTown pop-up paragraph names the event, the audience, and the timing.'
    },
    {
      id: 'exec-explains-playbook',
      label: 'Explains the Brand & Operations Playbook',
      description:
        'Reader understands what the Playbook is and why the next cohort uses it.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      definitionOfDone:
        'Playbook paragraph explains the artifact and its purpose for next cohort.'
    },
    {
      id: 'exec-explains-phoenix-nest',
      label: 'Explains the Phoenix Nest retail carry pitch',
      description:
        'Phoenix Nest pitch is named and described so readers can tell it apart from the pop-up.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      definitionOfDone:
        'Phoenix Nest pitch is named and explained in plain language.'
    },
    {
      id: 'exec-product-list',
      label: 'Lists current products and donations',
      description:
        'Beanies, sweatshirts, t-shirts, baked goods, and donations are all named, with donations called out separately from sales.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add revenue and pricing status to the summary',
      definitionOfDone:
        'Product list paragraph names all five items and separates donations.'
    },
    {
      id: 'exec-current-risks',
      label: 'Names 2–3 current risks or open questions',
      description:
        'Two or three real risks are listed with a one-line explanation each.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add growth and risk language to the summary',
      definitionOfDone:
        'At least two risks named with short rationale; reads as honest, not generic.'
    },
    {
      id: 'exec-next-actions',
      label: 'Lists next actions before launch',
      description:
        '3–5 next actions are named with owners and match the live timeline.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add operations readiness status to the summary',
      definitionOfDone:
        'Next actions list mirrors the timeline and names an owner per action.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft company overview paragraph',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'exec-names-renni-and-house-phoenix',
      definitionOfDone:
        'Two-sentence opening that names Renni Inc. and House Phoenix.',
      dueOffsetDays: 2
    },
    {
      title: 'Add brand and launch language for the pop-up',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'exec-explains-techtown-popup',
      definitionOfDone:
        'TechTown pop-up paragraph drafted, reviewed by CMO.',
      dueOffsetDays: 3
    },
    {
      title: 'Add revenue and pricing status to the summary',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'exec-product-list',
      definitionOfDone:
        'Product list reflects current pop-up inventory; donations called out separately.',
      dueOffsetDays: 3
    },
    {
      title: 'Add operations readiness status to the summary',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'exec-next-actions',
      definitionOfDone:
        'Next-actions list mirrors the live timeline with owners named.',
      dueOffsetDays: 3
    },
    {
      title: 'Add growth and risk language to the summary',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'exec-current-risks',
      definitionOfDone:
        'Two or three honest risks named with short rationale.',
      dueOffsetDays: 4
    },
    {
      title: 'Final executive summary review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the summary end-to-end before submission.',
      dueOffsetDays: 5
    }
  ],
  requiredEvidence: [
    {
      id: 'exec-playbook-progress-link',
      label: 'Link to current Playbook progress',
      description:
        'Reference to the Playbook page or a screenshot so readers can verify status.',
      required: true
    },
    {
      id: 'exec-product-reference',
      label: 'Product list or pricing reference',
      description:
        'Link or screenshot of /pricing or the current product tracker.',
      required: true
    },
    {
      id: 'exec-workbench-status',
      label: 'Current task / workbench status',
      description:
        'Link or screenshot of the Workbench so the next-actions list is verifiable.',
      required: true
    },
    {
      id: 'exec-pitch-or-popup-plan',
      label: 'Phoenix Nest pitch or pop-up plan',
      description:
        'Optional link to the carry pitch deck or pop-up day-of plan.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest tighter wording after the team drafts the summary.',
      'Ask clarifying questions about missing detail.',
      'Check the summary against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Writing the summary from scratch.',
      'Inventing risks or next actions the team did not surface.',
      'Approving or submitting the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
