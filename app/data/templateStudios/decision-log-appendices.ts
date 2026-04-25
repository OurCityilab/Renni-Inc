import type { TemplateStudio } from '~/types/templateStudio'

export const decisionLogAppendices: TemplateStudio = {
  title: 'Decision Log and Appendices',
  purpose:
    'Preserve the major decisions Renni Inc. made this semester, the rationale behind them, and the templates, evidence, and links the next cohort will need to keep the company moving.',
  learningObjective:
    'Document decisions in a way that survives the cohort — rationale, evidence, links, unresolved items, and clear instructions for the next cohort.',
  whyItMatters:
    "Every cohort makes important calls and forgets why six months later. A decision log plus a clean appendix is the difference between a Playbook that teaches and a Playbook that decorates a shelf.",
  finalOutput:
    'A decision log naming the major decisions and rationale, an evidence appendix with links, a templates-and-links appendix, the unresolved decisions explicitly handed off to the next cohort, and clear "first day" instructions for whoever picks up this Playbook next.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'major-decisions',
      title: 'Major decisions',
      lesson:
        "List the big calls of the semester — pricing, product, brand, partnerships, ops. A 'major decision' is any call that would have changed downstream chapters if it went the other way.",
      studentPrompts: [
        'List 8–15 major decisions from the semester.',
        'For each, name the date (or week), the decider, and a one-line summary.',
        'Order them roughly chronologically so the next cohort sees the arc.'
      ],
      requiredInputs: ['8–15 decisions', 'Date', 'Decider', 'Summary'],
      completionCriteria: [
        'At least eight decisions are listed in chronological order.',
        'Each decision has a named decider and a one-line summary.'
      ]
    },
    {
      id: 'decision-rationale',
      title: 'Decision rationale',
      lesson:
        'For each major decision, write a short rationale — what the alternatives were, what the team chose, and why. This is the single most useful thing for the next cohort.',
      studentPrompts: [
        'For each decision, write 2–4 sentences of rationale.',
        'Name the alternatives that were considered and rejected.',
        'Note any decision that the team would now make differently.'
      ],
      completionCriteria: [
        'Every decision has a rationale.',
        'At least one "we would change this" note is included if applicable.'
      ],
      evidencePrompt:
        'For decisions backed by data (pricing, inventory, customer demand), log a structured evidence entry — claim, evidence, source, confidence, risk.',
      sourceGuidance: [
        'Cite the document, conversation, or measurement that informed the call.',
        'If a decision was made on cohort consensus alone, label it that way honestly.'
      ]
    },
    {
      id: 'evidence-appendix',
      title: 'Evidence appendix',
      lesson:
        'Decisions are stronger when the evidence is one click away. Link the customer feedback, vendor quotes, sales data, photos, or notes that backed each major decision.',
      studentPrompts: [
        'For each major decision, link the supporting evidence (or note that it was qualitative / cohort consensus).',
        'Include the post-event recap when the pop-up closes.',
        'Group evidence by chapter so the next cohort can find it fast.'
      ],
      completionCriteria: [
        'At least half of the listed decisions have linked evidence.',
        'Evidence is grouped by chapter for findability.'
      ]
    },
    {
      id: 'templates-and-links',
      title: 'Templates and links',
      lesson:
        "Catalog the templates, trackers, and folders the next cohort needs. /pricing, /revenue, the marketing folder, the inventory tracker, the Decision Log itself, and the Playbook source — all of it.",
      studentPrompts: [
        'List every internal tool and folder the team used (Workbench, /pricing, /revenue, shared drive folders).',
        'List every external tool (Square, vendors, photo storage).',
        'For each, note who currently has access and how the next cohort gets it.'
      ],
      completionCriteria: [
        'Internal and external tools are both listed.',
        'Access path is named for each tool.'
      ]
    },
    {
      id: 'unresolved-decisions',
      title: 'Unresolved decisions',
      lesson:
        'Decisions explicitly punted to the next cohort. Naming them here keeps next cohort from rediscovering each one painfully.',
      studentPrompts: [
        'List 3–5 decisions the team did not finish.',
        'For each, name the trigger that would force a decision (a date, a buyer ask, a sales threshold).',
        'Note who in the next cohort role should own it.'
      ],
      completionCriteria: [
        'At least three unresolved decisions are listed with triggers and owners.',
        'Each one is framed so the next cohort can act, not just notice.'
      ]
    },
    {
      id: 'next-cohort-instructions',
      title: 'Next-cohort instructions',
      lesson:
        'A short, plain-language guide to using the appendices. "Read this first, ratify these decisions, ask about these unresolved items, do not lose access to these tools."',
      studentPrompts: [
        'Write a 1–2 paragraph "how to use this appendix" intro for the next cohort.',
        'List the 3 things they must do in their first week.',
        'List the 3 things they should not change before learning why this cohort chose them.'
      ],
      completionCriteria: [
        'Intro is written in plain language.',
        '"Must do" and "do not change" lists are short and specific.'
      ]
    }
  ],
  requirements: [
    {
      id: 'appendix-major-decisions-listed',
      label: 'Major decisions listed',
      description:
        '8–15 major decisions with date, decider, and one-line summary in chronological order.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 13,
      suggestedTaskTitle: 'Compile major decisions',
      definitionOfDone:
        'Co-CEO confirms the decision list captures the cohort\'s real arc.'
    },
    {
      id: 'appendix-rationale-included',
      label: 'Decision rationale written for every decision',
      description:
        '2–4 sentences per decision plus the alternatives that were considered.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 13,
      suggestedTaskTitle: 'Add decision rationale and open questions',
      definitionOfDone:
        'CSGO reviews rationales for honesty and includes "we would change this" notes where they apply.'
    },
    {
      id: 'appendix-evidence-linked',
      label: 'Evidence linked to decisions',
      description:
        'At least half of the listed decisions have supporting evidence linked, grouped by chapter.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 13,
      suggestedTaskTitle: 'Add brand/marketing evidence links',
      definitionOfDone:
        'CMO confirms evidence links land on real assets, not placeholders.'
    },
    {
      id: 'appendix-templates-linked',
      label: 'Templates, trackers, and tools linked with access notes',
      description:
        'Every internal and external tool used this semester is catalogued with access path.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 13,
      suggestedTaskTitle: 'Add templates / SOP links',
      definitionOfDone:
        'COO confirms next cohort can actually open every tool from this list.'
    },
    {
      id: 'appendix-unresolved-decisions',
      label: 'Unresolved decisions handed off',
      description:
        '3–5 unresolved decisions with triggers and named next-cohort owners.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 13,
      definitionOfDone:
        'Each unresolved item is framed so the next cohort can act on it.'
    },
    {
      id: 'appendix-next-cohort-instructions',
      label: 'Next-cohort instructions written',
      description:
        'Plain-language intro plus "must do" and "do not change" lists.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 13,
      definitionOfDone:
        'Co-CEO and admin confirm the instructions are usable on day one.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Compile major decisions',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'appendix-major-decisions-listed',
      definitionOfDone:
        'Co-CEO drafts the chronological decision list with deciders and summaries.',
      dueOffsetDays: 3
    },
    {
      title: 'Add decision rationale and open questions',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'appendix-rationale-included',
      definitionOfDone:
        'CSGO writes rationales and unresolved decisions; flags "would change" calls.',
      dueOffsetDays: 5
    },
    {
      title: 'Add templates / SOP links',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'appendix-templates-linked',
      definitionOfDone:
        'COO catalogues internal + external tools with access paths.',
      dueOffsetDays: 5
    },
    {
      title: 'Add finance tracker links',
      department: 'finance',
      ownerRole: 'cfo',
      definitionOfDone:
        'CFO links /pricing, /revenue, donation tracker, and the post-event recap.',
      dueOffsetDays: 5
    },
    {
      title: 'Add brand/marketing evidence links',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'appendix-evidence-linked',
      definitionOfDone:
        'CMO links the brand assets, customer feedback, and content folders.',
      dueOffsetDays: 5
    },
    {
      title: 'Final decision log and appendices review',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'appendix-next-cohort-instructions',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 7
    }
  ],
  requiredEvidence: [
    {
      id: 'appendix-decision-log',
      label: 'Decision log',
      description:
        'The running decision log used during the semester.',
      required: true
    },
    {
      id: 'appendix-template-links',
      label: 'Template links',
      description:
        'Links to every Playbook chapter template and tracker.',
      required: true
    },
    {
      id: 'appendix-evidence-folder',
      label: 'Evidence folder links',
      description:
        'Links to customer feedback, vendor quotes, photos, sales data.',
      required: true
    },
    {
      id: 'appendix-final-tracker-links',
      label: 'Final tracker links',
      description:
        '/pricing, /revenue, donation tracker, and the post-event recap.',
      required: true
    },
    {
      id: 'appendix-handoff-notes',
      label: 'Department handoff notes',
      description:
        'Per-department handoff snapshots referenced by the appendix.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a decision rationale for missing context after the team drafts it.',
      'Ask clarifying questions when an unresolved decision is vague.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing decisions or rationales the team did not actually agree on.',
      'Choosing which decisions to mark unresolved.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
