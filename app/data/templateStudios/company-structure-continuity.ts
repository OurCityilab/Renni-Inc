import type { TemplateStudio } from '~/types/templateStudio'

export const companyStructureContinuity: TemplateStudio = {
  title: 'Company Structure and Continuity',
  purpose:
    'Document how Renni Inc. is organized, how decisions actually get made, who is accountable for what, how responsibilities transfer between cohorts, and how the company keeps running when this cohort moves on.',
  learningObjective:
    'Describe a real company structure (roles, decision rights, accountability rhythm, succession, recognition) clearly enough that the next cohort can continue without losing momentum.',
  whyItMatters:
    "Renni Inc. is bigger than any one cohort. If decision rights, handoff, and recognition aren't written down, every August the new students start from scratch. This chapter is the contract between cohorts — it's how the company stays a company.",
  finalOutput:
    'A short structure-and-continuity chapter naming the C-Suite and team roles, the decision rights for each role, the team\'s accountability rhythm, the handoff plan to next cohort, recognition and credit rules, the continuity risks the team is watching, and a clear "first 30 days" guide for the next cohort.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'company-roles',
      title: 'Company roles',
      lesson:
        'Start by naming the team — Co-CEOs, chiefs (COO, CFO, CMO, CSGO), members, advisors. Each role gets a one-line "what this person owns" description so a stranger could read the chapter and tell who to ask about what.',
      studentPrompts: [
        'List the C-Suite roles and the current student in each one.',
        'Write a one-line "what this role owns" description per role.',
        'Name the advisors and what they help with.'
      ],
      requiredInputs: ['Role list with current students', 'One-line role descriptions'],
      completionCriteria: [
        'Every C-Suite role is listed with a current student.',
        'Each role has a one-line scope description.'
      ]
    },
    {
      id: 'decision-rights',
      title: 'Decision rights',
      lesson:
        'Decision rights say who gets to decide what without asking. A clean rule beats a meeting. Co-CEOs make company-wide calls; chiefs decide inside their department; some calls need both chiefs and Co-CEOs.',
      example:
        '"CFO decides product pricing inside /pricing. Co-CEOs approve any price change above 20% from last cohort."',
      studentPrompts: [
        'For each role, list 3–5 decisions they make alone.',
        'List 1–2 decisions that always require a Co-CEO sign-off.',
        'List 1–2 decisions that require a chief consultation across departments.'
      ],
      completionCriteria: [
        'Each role has 3–5 solo decisions named.',
        'Cross-role and Co-CEO escalation paths are explicit.'
      ]
    },
    {
      id: 'accountability-rhythm',
      title: 'Accountability rhythm',
      lesson:
        'Accountability rhythm is how often the team checks in, who runs the check-in, and what gets reported. A simple weekly + pre-pop-up + post-pop-up rhythm beats inconsistent ad hoc meetings.',
      studentPrompts: [
        'Name the recurring meetings — weekly stand-up, pre-pop-up review, post-pop-up debrief.',
        'For each meeting, name the owner and the decisions made there.',
        'Describe how blockers and risks get surfaced between meetings.'
      ],
      completionCriteria: [
        'At least three recurring touchpoints are listed with owners.',
        'Path for raising blockers between meetings is documented.'
      ]
    },
    {
      id: 'succession-and-handoff',
      title: 'Succession and handoff',
      lesson:
        'Succession is who takes over when someone leaves a role mid-semester. Handoff is the package the next cohort receives in August — roster, trackers, decisions, contacts.',
      studentPrompts: [
        'For each C-Suite role, name the backup or shadow.',
        'List what the next cohort receives at handoff: roster, decision log, vendor list, asset folder, KPI snapshot.',
        'Name the date the handoff package gets locked.'
      ],
      requiredInputs: ['Backup/shadow per role', 'Handoff package contents', 'Lock date'],
      completionCriteria: [
        'Every C-Suite role has a named backup or shadow.',
        'Handoff package contents are listed with owners.',
        'A handoff lock date is named.'
      ]
    },
    {
      id: 'recognition-and-credit',
      title: 'Recognition and credit',
      lesson:
        'Recognition rules say how contribution gets credited — at the pop-up, in the Playbook, in college applications, in next-semester onboarding. A clear rule beats favoritism.',
      studentPrompts: [
        'How are members credited in the Playbook (e.g., signed sections, contributor list)?',
        'How is recognition surfaced at the pop-up (e.g., team intro at the booth)?',
        'How does Renni Inc. document contribution for college / résumé use?'
      ],
      completionCriteria: [
        'Recognition rules cover Playbook, pop-up, and outside-school surfaces.',
        'Rules apply consistently across departments.'
      ]
    },
    {
      id: 'continuity-risks',
      title: 'Continuity risks',
      lesson:
        'Continuity risks are the ways the company could lose knowledge between cohorts — a key student leaving, a vendor relationship that lives only in one inbox, a tool nobody renews.',
      studentPrompts: [
        'List 2–3 real continuity risks the team is watching.',
        'For each one, write a one-line mitigation the next cohort can apply.',
        'Flag any risk that is currently unmitigated.'
      ],
      completionCriteria: [
        'Two or three continuity risks are named with mitigations.',
        'Unmitigated risks are flagged so the next cohort sees them.'
      ]
    },
    {
      id: 'next-cohort-playbook',
      title: 'Next-cohort first 30 days',
      lesson:
        'Close the chapter with a "first 30 days" guide so the next cohort knows where to start: who to meet, what to read in the Playbook, which trackers to open, which decisions to ratify.',
      studentPrompts: [
        'Day 1: which Playbook chapters do they read first?',
        'Week 1: which advisors and chiefs do they meet?',
        'Week 2: which trackers (Workbench, /pricing, /revenue) do they open?',
        'Week 4: which decisions from this cohort do they ratify or reopen?'
      ],
      completionCriteria: [
        'A 30-day plan is written with at least four named milestones.',
        'A reader can act on it without asking for clarification.'
      ]
    }
  ],
  requirements: [
    {
      id: 'continuity-org-structure',
      label: 'Company roles documented',
      description:
        'Every C-Suite role and the current student in it is listed with a one-line scope description.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      suggestedTaskTitle: 'Confirm leadership structure and decision rights',
      definitionOfDone:
        'Role list confirmed by Co-CEO and reflected in the chapter.'
    },
    {
      id: 'continuity-decision-rights',
      label: 'Decision rights are explicit per role',
      description:
        'Each role has 3–5 named solo decisions and at least one Co-CEO escalation path.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'Decision rights table is reviewed by Co-CEO and the affected chiefs.'
    },
    {
      id: 'continuity-accountability-rhythm',
      label: 'Accountability rhythm is documented',
      description:
        'At least three recurring touchpoints are named with owners and the decisions made at each.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 3,
      suggestedTaskTitle: 'Document accountability rhythm and handoff process',
      definitionOfDone:
        'Rhythm is named, owners are assigned, blocker-escalation path is written.'
    },
    {
      id: 'continuity-handoff-plan',
      label: 'Handoff plan to next cohort is written',
      description:
        'Backup/shadow per role, handoff package contents, and a handoff lock date are all named.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 3,
      definitionOfDone:
        'Handoff package and lock date are confirmed by COO and Co-CEO.'
    },
    {
      id: 'continuity-recognition-rules',
      label: 'Recognition and credit rules are documented',
      description:
        'Rules cover Playbook signing, pop-up recognition, and outside-school documentation.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'Recognition rules apply consistently across departments and roles.'
    },
    {
      id: 'continuity-risks',
      label: 'Continuity risks are named with mitigations',
      description:
        'Two or three continuity risks are listed with one-line mitigations; unmitigated risks are flagged.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 3,
      suggestedTaskTitle: 'Identify continuity risks and next-semester recommendations',
      definitionOfDone:
        'CSGO captures real risks the team is watching; mitigations are written or explicitly missing.'
    },
    {
      id: 'continuity-next-cohort-guidance',
      label: 'Next-cohort first 30 days plan is written',
      description:
        'A 30-day onboarding plan with at least four named milestones the next cohort can act on.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 3,
      definitionOfDone:
        'Plan is reviewed by Co-CEO and admin and reads as actionable on day one.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Confirm leadership structure and decision rights',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'continuity-org-structure',
      definitionOfDone:
        'Co-CEO confirms the C-Suite roster and the decision rights per role.',
      dueOffsetDays: 3
    },
    {
      title: 'Document accountability rhythm and handoff process',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'continuity-accountability-rhythm',
      definitionOfDone:
        'COO writes the recurring meeting cadence, owners, and the handoff package contents.',
      dueOffsetDays: 5
    },
    {
      title: 'Identify continuity risks and next-semester recommendations',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'continuity-risks',
      definitionOfDone:
        'CSGO captures 2–3 continuity risks with mitigations and flags any that are unmitigated.',
      dueOffsetDays: 5
    },
    {
      title: 'Add marketing handoff notes',
      department: 'marketing',
      ownerRole: 'cmo',
      definitionOfDone:
        'CMO writes the marketing handoff snapshot — channels, content folder, audience notes — so the next CMO can pick up.',
      dueOffsetDays: 6
    },
    {
      title: 'Add finance handoff notes',
      department: 'finance',
      ownerRole: 'cfo',
      definitionOfDone:
        'CFO writes the finance handoff snapshot — vendor contacts, /pricing state, /revenue state — for the next CFO.',
      dueOffsetDays: 6
    },
    {
      title: 'Final company structure and continuity review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 7
    }
  ],
  requiredEvidence: [
    {
      id: 'continuity-team-roster',
      label: 'Current C-Suite / team roster',
      description:
        'Roster showing every role and the student currently in it.',
      required: true
    },
    {
      id: 'continuity-decision-log-link',
      label: 'Decision log reference',
      description:
        'Link to the Decision Log so decisions can be cross-referenced.',
      required: false
    },
    {
      id: 'continuity-department-ownership-notes',
      label: 'Department ownership notes',
      description:
        'Per-department notes on what each chief owns and how it transfers.',
      required: true
    },
    {
      id: 'continuity-handoff-notes',
      label: 'Handoff or next-cohort recommendation notes',
      description:
        'Drafts of the handoff package or next-cohort recommendations.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique the decision-rights table after the team drafts it.',
      'Ask clarifying questions when a role description sounds vague.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing roles, decisions, or recognition rules the team has not actually agreed to.',
      'Picking who succeeds whom.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
