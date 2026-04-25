import type { TemplateStudio } from '~/types/templateStudio'

export const brandArchitecture: TemplateStudio = {
  title: 'Renni Overview and Brand Architecture',
  purpose:
    'Explain how Renni Inc. and its brands fit together — what the parent company is, which brand leads the launch, how the supporting brands relate to it — and the mission, vision, and values that hold the system together.',
  learningObjective:
    'Use the language of brand architecture (parent / primary / supporting brands) and ground it in the Renni Inc. mission, vision, and values so a customer at the pop-up or a buyer at Phoenix Nest understands the system and the company behind it on the first read.',
  whyItMatters:
    "If a customer can't tell whether the beanie is a Renni Inc. product, a House Phoenix product, or something else entirely, the brand work is undermined before the pitch even starts. The Phoenix Nest buyer reads brand architecture before product specs. Mission, vision, and values keep the brand decisions consistent when no chief is in the room. Getting this chapter right makes every downstream chapter easier to write.",
  finalOutput:
    'A short Renni overview and brand architecture chapter that names Renni Inc. as the parent company, House Phoenix as the primary brand, Lumen / Notice / Humble Oven as supporting brands, explains how each one shows up to customers, and grounds the brand system in a one-sentence mission, a one-sentence vision, three to five values with examples, and decision rules students can actually use.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'parent-company',
      title: 'Renni Inc. — the parent company',
      lesson:
        'The parent company is the legal and strategic umbrella every other brand sits under. Stakeholders need to know it exists even if customers rarely interact with it directly.',
      example:
        'Renni Inc. is the student-led parent company at Renaissance High School. It owns and operates House Phoenix and the supporting brand line.',
      studentPrompts: [
        'Write one sentence that introduces Renni Inc. as the parent company.',
        'Explain in one line how Renni Inc. shows up to customers (or why it stays in the background).',
        'Note how Renni Inc. is governed — Co-CEOs, chiefs, advisors.'
      ],
      requiredInputs: ['Parent company sentence', 'Customer visibility note'],
      completionCriteria: [
        'Renni Inc. is named as the parent company.',
        'Reader understands whether Renni Inc. appears on packaging or not.'
      ]
    },
    {
      id: 'brand-portfolio',
      title: 'The brand portfolio at a glance',
      lesson:
        'A brand portfolio diagram or list shows the family in one view: parent, primary, supporting. Use a simple diagram or a clear list — fancy is not the goal, clarity is.',
      studentPrompts: [
        'List Renni Inc. (parent), House Phoenix (primary), and Lumen / Notice / Humble Oven (supporting).',
        'For each brand, write one line that names what it sells or represents.',
        'Mark which brands are active today vs. planned for later.'
      ],
      completionCriteria: [
        'All five brands are listed in the right tier.',
        'Each brand has a one-line "what it is" description.'
      ]
    },
    {
      id: 'house-phoenix-role',
      title: 'House Phoenix — the primary brand',
      lesson:
        'House Phoenix carries the launch. Explain why it leads — the apparel category, the TechTown pop-up, the Phoenix Nest pitch — so the rest of the chapter knows where the spotlight sits.',
      studentPrompts: [
        'Why is House Phoenix the primary brand for the launch?',
        'What does House Phoenix sell — beanies, sweatshirts, t-shirts?',
        'How will House Phoenix appear at TechTown and in the Phoenix Nest pitch?'
      ],
      completionCriteria: [
        'Reader understands why House Phoenix leads.',
        'House Phoenix product categories are listed.'
      ]
    },
    {
      id: 'supporting-brands',
      title: 'Supporting brands — Lumen, Notice, Humble Oven',
      lesson:
        'Supporting brands add range without diluting the primary. Each one needs a clear role: candles, jewelry, baked goods. Write each as if you were introducing them to a Phoenix Nest buyer.',
      studentPrompts: [
        'Lumen: what does the candle brand sell, and who is it for?',
        'Notice: what does the jewelry brand sell, and who is it for?',
        'Humble Oven: what baked goods does it serve at the pop-up?',
        'For each one, name the chief or member who owns it.'
      ],
      requiredInputs: ['One paragraph per supporting brand', 'Owner per brand'],
      completionCriteria: [
        'Lumen, Notice, and Humble Oven each have a customer-ready paragraph.',
        'Each supporting brand has a named owner.'
      ]
    },
    {
      id: 'brand-relationship-rules',
      title: 'How the brands feel connected but distinct',
      lesson:
        'A good brand system signals "same family" without making everything look the same. Rules are simple: shared mark, shared voice, distinct visual identity per brand.',
      studentPrompts: [
        'What signals belong to Renni Inc. (e.g., parent endorsement on tags)?',
        'What signals are unique to House Phoenix vs. Lumen vs. Notice vs. Humble Oven?',
        'What should *never* carry the Renni Inc. name (e.g., placeholder student work)?'
      ],
      completionCriteria: [
        'At least one shared signal across the family is named.',
        'At least one rule about what should NOT carry the Renni Inc. name is named.'
      ]
    },
    {
      id: 'future-brand-questions',
      title: 'Open questions for the next cohort',
      lesson:
        'The brand system will keep evolving. Naming the open questions honestly is more useful than pretending everything is decided.',
      studentPrompts: [
        'What brand questions are still unresolved (new sub-brand, naming, retired brand)?',
        'What customer confusion has the team observed so far?',
        'What should the next cohort decide first?'
      ],
      completionCriteria: [
        'At least two open questions are named.',
        'Reader understands what the next cohort should tackle first.'
      ]
    },
    {
      id: 'mission',
      title: 'Mission — what Renni Inc. does now',
      lesson:
        'A mission says what the company does today, for whom, and why. Keep it to one sentence. If it could describe any school project, it is too generic.',
      example:
        'Renni Inc. equips Renaissance students to launch real student-led brands and produce a pop-up that funds the next cohort.',
      studentPrompts: [
        'Who does Renni Inc. serve right now?',
        'What does Renni Inc. actually do for them?',
        'Write the mission as one sentence — no abstract jargon.'
      ],
      requiredInputs: ['One-sentence mission'],
      completionCriteria: [
        'Mission fits in one sentence.',
        'Mission is specific to Renni Inc., not generic to any student company.'
      ]
    },
    {
      id: 'vision',
      title: 'Vision — where Renni Inc. is going',
      lesson:
        'A vision is a believable future state. It should stretch but stay grounded — Phoenix Nest carry, sustained student leadership, a recognizable brand family.',
      studentPrompts: [
        'In three years, what does success look like for Renni Inc.?',
        'What change in the school, the city, or the cohort would prove the vision worked?',
        'Avoid "be the best" language — name the change concretely.'
      ],
      completionCriteria: [
        'Vision describes a believable future state, not a slogan.',
        'A reader can picture the change.'
      ]
    },
    {
      id: 'values',
      title: 'Values — how Renni Inc. behaves',
      lesson:
        'Values are short and memorable. Three to five is the sweet spot. Each value should be specific enough that two students would behave the same way under it, and tied to student ownership and a professional standard.',
      studentPrompts: [
        'List 3–5 values. Pick words you can defend, not words that sound good.',
        'For each one, write a single line about what it means inside Renni Inc.',
        'Reject any value that sounds like every other student company.'
      ],
      requiredInputs: ['Three to five values', 'One-line definition per value'],
      completionCriteria: [
        'Three to five values are listed.',
        'Each value has a definition specific to Renni Inc.',
        'At least one value references student ownership; at least one references a professional standard.'
      ]
    },
    {
      id: 'values-in-action',
      title: 'Values in action',
      lesson:
        'A value only counts if it changes behavior. Pair each value with a real example from a product, pricing, marketing, or operations decision the team has actually made.',
      studentPrompts: [
        'For each value, name one decision the team made because of it.',
        'For each value, name one decision the team would refuse because of it.',
        'If you cannot name a real example, the value may be inspirational rather than usable — rewrite it.'
      ],
      completionCriteria: [
        'Each value has at least one real "did" example.',
        'At least one value also has a "would refuse" example.'
      ]
    },
    {
      id: 'decision-rules',
      title: 'Decision rules',
      lesson:
        'Translate the values into 3–5 simple rules the team can use when an in-the-moment call needs to be made — at the pop-up table, in a vendor email, in a Phoenix Nest pitch.',
      studentPrompts: [
        'Write decision rules in the form "If X, we will Y."',
        'Make sure each rule traces back to a value.',
        'Pick rules a Renaissance student could apply without re-reading the chapter.'
      ],
      completionCriteria: [
        'Three to five decision rules are written in the "If X, we will Y" form.',
        'Each rule maps to a value above.'
      ]
    }
  ],
  requirements: [
    {
      id: 'brand-arch-parent-named',
      label: 'Renni Inc. named as the parent company',
      description:
        'Chapter opens by naming Renni Inc. as the parent company in plain language.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      suggestedTaskTitle: 'Confirm parent and sub-brand structure',
      definitionOfDone:
        'Opening paragraph names Renni Inc. and explains its role.'
    },
    {
      id: 'brand-arch-primary-named',
      label: 'House Phoenix identified as the primary brand',
      description:
        'Chapter explains why House Phoenix leads the launch and what category it owns.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      definitionOfDone:
        'House Phoenix is named as primary, with category and launch role explained.'
    },
    {
      id: 'brand-arch-supporting-named',
      label: 'Lumen, Notice, and Humble Oven identified',
      description:
        'All three supporting brands are listed with their categories and customer-facing descriptions.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Confirm which products belong to which brand',
      definitionOfDone:
        'Each supporting brand has a one-paragraph customer-ready description.'
    },
    {
      id: 'brand-arch-what-each-sells',
      label: 'Explains what each brand sells or represents',
      description:
        'Reader can tell what each brand makes (apparel, candles, jewelry, baked goods) without prior context.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      definitionOfDone:
        'Every brand has a one-line "what it sells" description.'
    },
    {
      id: 'brand-arch-connected-but-distinct',
      label: 'Explains how brands feel connected but distinct',
      description:
        'At least one shared family signal and one distinct per-brand signal are named.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Draft brand relationship explanation',
      definitionOfDone:
        'Family-level rules are written so future students know how to apply them.'
    },
    {
      id: 'brand-arch-renni-name-rules',
      label: 'States what should and should not carry the Renni Inc. name',
      description:
        'Chapter names at least one thing that should carry the Renni Inc. name and one that should not.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      definitionOfDone:
        'Rule list captured; COO can apply it to packaging and signage decisions.'
    },
    {
      id: 'brand-arch-future-questions',
      label: 'Names at least two open brand questions',
      description:
        'Two or more honest open questions about how the brand system should evolve.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 2,
      suggestedTaskTitle: 'Identify customer confusion risks',
      definitionOfDone:
        'Two or more unresolved questions named with a one-line note each.'
    },
    {
      id: 'values-mission-current-work',
      label: 'Mission explains what Renni Inc. does now',
      description:
        'One-sentence mission specific to Renni Inc., naming who is served and what is done for them.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      suggestedTaskTitle: 'Draft mission and vision',
      definitionOfDone:
        'Mission sentence drafted by Co-CEO and reviewed for specificity.'
    },
    {
      id: 'values-vision-future-state',
      label: 'Vision explains where Renni Inc. is going',
      description:
        'Vision describes a believable future state with concrete change, not slogans.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      definitionOfDone:
        'Vision passes the "could a reader picture this?" check.'
    },
    {
      id: 'values-clear-and-usable',
      label: 'Values are clear, memorable, and usable',
      description:
        'Three to five values, each with a one-line Renni-specific definition.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Refine values language',
      definitionOfDone:
        'Each value passes the "two students would behave the same way" check.'
    },
    {
      id: 'values-tied-to-student-ownership',
      label: 'Values tied to student ownership and professional standards',
      description:
        'Values explicitly reference student ownership and the professional bar the team holds itself to.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 2,
      suggestedTaskTitle: 'Connect values to customer and community impact',
      definitionOfDone:
        'At least one value references student ownership; at least one references professional standards.'
    },
    {
      id: 'values-in-action',
      label: 'Values translated into real examples',
      description:
        'Each value has a real "did" example from a team decision.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      suggestedTaskTitle: 'Connect values to operations and handoff behavior',
      definitionOfDone:
        'Every value has at least one example pulled from a real product, pricing, marketing, or ops call.'
    },
    {
      id: 'values-decision-rules',
      label: 'Decision rules translate values into behavior',
      description:
        '3–5 decision rules in the "If X, we will Y" form, each traceable to a value.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      definitionOfDone:
        'Decision rules are written and traceable to a specific value.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Confirm parent and sub-brand structure',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'brand-arch-parent-named',
      definitionOfDone:
        'Co-CEO confirms the parent / primary / supporting tier list with advisors.',
      dueOffsetDays: 3
    },
    {
      title: 'Draft brand relationship explanation',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'brand-arch-connected-but-distinct',
      definitionOfDone:
        'CMO drafts the family-rule paragraph and the per-brand distinct signals.',
      dueOffsetDays: 4
    },
    {
      title: 'Identify customer confusion risks',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'brand-arch-future-questions',
      definitionOfDone:
        'CSGO captures at least two real customer questions or confusions and turns them into open questions.',
      dueOffsetDays: 5
    },
    {
      title: 'Confirm which products belong to which brand',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'brand-arch-supporting-named',
      definitionOfDone:
        'COO maps every current product to its brand and confirms with the chiefs.',
      dueOffsetDays: 4
    },
    {
      title: 'Draft mission and vision',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'values-mission-current-work',
      definitionOfDone:
        'Co-CEO drafts a one-sentence mission and a believable vision for the next three years.',
      dueOffsetDays: 5
    },
    {
      title: 'Refine values language',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'values-clear-and-usable',
      definitionOfDone:
        'CMO refines the values so they are memorable and match the Renni Inc. voice.',
      dueOffsetDays: 6
    },
    {
      title: 'Connect values to customer and community impact',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'values-tied-to-student-ownership',
      definitionOfDone:
        'CSGO ties at least one value to a real customer or community decision.',
      dueOffsetDays: 6
    },
    {
      title: 'Connect values to operations and handoff behavior',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'values-decision-rules',
      definitionOfDone:
        'COO writes 3–5 decision rules in the "If X, we will Y" form, traceable to values.',
      dueOffsetDays: 7
    },
    {
      title: 'Final Renni overview and brand architecture review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 8
    }
  ],
  requiredEvidence: [
    {
      id: 'brand-arch-family-list',
      label: 'Brand family list',
      description:
        'A simple list or diagram showing parent / primary / supporting brands.',
      required: true
    },
    {
      id: 'brand-arch-visual-identity-refs',
      label: 'Logo or visual identity references',
      description:
        'Links or files showing each brand’s wordmark or visual identity if available.',
      required: false
    },
    {
      id: 'brand-arch-product-category-list',
      label: 'Product / category list',
      description:
        'Mapping of every product to its parent brand (apparel, candles, jewelry, baked goods).',
      required: true
    },
    {
      id: 'brand-arch-decision-notes',
      label: 'Brand-system decision notes',
      description:
        'Notes from any class discussion or decision about the brand system.',
      required: false
    },
    {
      id: 'values-class-discussion-notes',
      label: 'Class discussion notes for mission, vision, and values',
      description:
        'Notes that show how the team agreed on the mission, vision, and values.',
      required: true
    },
    {
      id: 'values-real-decisions',
      label: 'Examples of values applied to real decisions',
      description:
        'Specific product, pricing, operations, or marketing calls the team made because of a value.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique the brand-tier explanation after the team drafts it.',
      'Ask clarifying questions when a brand description sounds vague.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing brand names, descriptions, or owners.',
      'Picking which products belong to which brand.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
