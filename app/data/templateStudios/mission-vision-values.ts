import type { TemplateStudio } from '~/types/templateStudio'

export const missionVisionValues: TemplateStudio = {
  title: 'Mission, Vision, and Values',
  purpose:
    'Write the mission, vision, and values for Renni Inc., and translate the values into decision rules students can actually use.',
  learningObjective:
    'Tell the difference between mission (what we do now), vision (where we are going), and values (how we behave), and turn each one into language a teammate or next-cohort student can apply.',
  whyItMatters:
    'Mission, vision, and values are the test every other chapter has to pass. When pricing, marketing, or operations decisions feel off, the team falls back on these statements. Vague inspirational language fails this test — concrete, usable language survives it.',
  finalOutput:
    'A short chapter with a one-sentence mission, a one-sentence vision, three to five values, examples of each value in action, decision rules students can apply, and a note about how future cohorts should own and update the language.',
  connectedOutcome: 'Playbook',
  sections: [
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
        'Values are short and memorable. Three to five is the sweet spot — fewer is harder to apply, more is hard to remember. Each value should be specific enough that two people would behave the same way under it.',
      studentPrompts: [
        'List 3–5 values. Pick words you can defend, not words that sound good.',
        'For each one, write a single line about what it means inside Renni Inc.',
        'Reject any value that sounds like every other student company.'
      ],
      requiredInputs: ['Three to five values', 'One-line definition per value'],
      completionCriteria: [
        'Three to five values are listed.',
        'Each value has a definition specific to Renni Inc.'
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
    },
    {
      id: 'student-ownership',
      title: 'Student ownership and continuity',
      lesson:
        'These statements should outlive any one cohort. Explain how next year’s students should own and update the language without rewriting it from scratch.',
      studentPrompts: [
        'How should the next cohort review and update the values?',
        'What is the team committing to keep the same?',
        'What is the team explicitly leaving open for the next cohort to decide?'
      ],
      completionCriteria: [
        'A short paragraph explains how future cohorts should use this language.',
        'At least one item is named as "fixed" and one as "open" for next cohort.'
      ]
    }
  ],
  requirements: [
    {
      id: 'mission-says-what-renni-does-now',
      label: 'Mission explains what Renni Inc. does now',
      description:
        'One-sentence mission specific to Renni Inc., naming who is served and what is done for them.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      suggestedTaskTitle: 'Draft mission and vision',
      definitionOfDone:
        'Mission sentence drafted by Co-CEO and reviewed for specificity.'
    },
    {
      id: 'mission-vision-future-state',
      label: 'Vision explains where Renni Inc. is going',
      description:
        'Vision describes a believable future state with concrete change, not slogans.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'Vision passes the "could a reader picture this?" check.'
    },
    {
      id: 'mission-values-clear-and-usable',
      label: 'Values are clear, memorable, and usable',
      description:
        'Three to five values, each with a one-line Renni-specific definition.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      suggestedTaskTitle: 'Refine tone and clarity of mission, vision, values',
      definitionOfDone:
        'Each value passes the "two people would behave the same way" check.'
    },
    {
      id: 'mission-values-tied-to-ownership',
      label: 'Values connect to student ownership and professional standards',
      description:
        'Values explicitly reference student ownership and the professional bar the team holds itself to.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'At least one value references student ownership; at least one references professional standards.'
    },
    {
      id: 'mission-values-in-action',
      label: 'Values translated into behavior or decision rules',
      description:
        'Each value has a real "did" example and 3–5 decision rules in the "If X, we will Y" form.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 3,
      suggestedTaskTitle: 'Connect values to operations and handoff behavior',
      definitionOfDone:
        'Decision rules are written and traceable to a specific value.'
    },
    {
      id: 'mission-no-empty-inspiration',
      label: 'Avoids vague inspirational language',
      description:
        'No values, mission, or vision lines that could appear on any other student company poster.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 3,
      suggestedTaskTitle: 'Connect values to customer and community impact',
      definitionOfDone:
        'CSGO confirms each statement is specific to Renni Inc. and tied to real customer or community impact.'
    },
    {
      id: 'mission-future-cohort-ownership',
      label: 'Explains how future cohorts should use these statements',
      description:
        'A short paragraph names what is fixed, what is open, and how the next cohort should review and update the language.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'Continuity paragraph names at least one fixed item and one open item for next cohort.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft mission and vision',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'mission-says-what-renni-does-now',
      definitionOfDone:
        'Co-CEO drafts a one-sentence mission and a believable vision for the next three years.',
      dueOffsetDays: 3
    },
    {
      title: 'Refine tone and clarity of mission, vision, values',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'mission-values-clear-and-usable',
      definitionOfDone:
        'CMO refines the language so it is memorable and matches the Renni Inc. voice.',
      dueOffsetDays: 4
    },
    {
      title: 'Connect values to customer and community impact',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'mission-no-empty-inspiration',
      definitionOfDone:
        'CSGO ties at least one value to a real customer or community decision.',
      dueOffsetDays: 4
    },
    {
      title: 'Connect values to operations and handoff behavior',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'mission-values-in-action',
      definitionOfDone:
        'COO writes 3–5 decision rules in the "If X, we will Y" form, traceable to values.',
      dueOffsetDays: 5
    },
    {
      title: 'Final mission, vision, values review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 6
    }
  ],
  requiredEvidence: [
    {
      id: 'mission-class-discussion-notes',
      label: 'Notes from class discussion or decision',
      description:
        'Notes that show how the team agreed on the mission, vision, and values.',
      required: true
    },
    {
      id: 'mission-values-real-decisions',
      label: 'Examples of values applied to real decisions',
      description:
        'Specific product, pricing, operations, or marketing calls the team made because of a value.',
      required: true
    },
    {
      id: 'mission-link-to-exec-summary',
      label: 'Link to Playbook or executive summary',
      description:
        'Reference to where these statements appear elsewhere in the Playbook.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique drafts for vagueness or generic language.',
      'Ask clarifying questions when a value lacks an example.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Writing the mission, vision, or values from scratch.',
      'Inventing decision examples the team did not actually make.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
