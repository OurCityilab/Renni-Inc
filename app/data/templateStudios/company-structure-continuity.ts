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
      ],
      expertGuidance: {
        expertRole: 'COO / org-design operator',
        whyThisMatters:
          'A reviewer or next-cohort student should be able to read this once and know who to email about pricing, packaging, social, or research. If they cannot, the team becomes a bottleneck.',
        whatToGather: [
          'Every C-Suite role + current student name (Co-CEOs, COO, CFO, CMO, CSGO).',
          'A one-line "owns this" scope per role.',
          'Advisors and instructor and what each helps with.'
        ],
        weakAnswerLooksLike: '"We have a CMO and a CFO and a COO and we work together." — no scope, no names.',
        strongAnswerLooksLike: 'Each role with a named student and a single sentence scope a stranger can route to.',
        expertPushback: ['If pricing is wrong tomorrow, who fixes it?', 'If a vendor calls, who answers?'],
        commonMistakes: ['Listing roles without owners.', 'Letting two roles claim the same scope.'],
        decisionSupported: 'Day-to-day routing of decisions and questions.',
        connectsTo: ['Chapter 1 — executive summary', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A new student could route any inbound question to a specific person without asking.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'COO / org-design operator',
        whyThisMatters:
          'Decision rights answer "what can I decide alone, what needs a chief, and what needs Co-CEOs?" Without them, every call becomes a meeting and the team slows down before launch.',
        whatToGather: [
          'For each role, 3–5 decisions made alone.',
          '1–2 decisions that always require a Co-CEO sign-off.',
          '1–2 decisions that require chief consultation across departments.'
        ],
        weakAnswerLooksLike: '"We talk things over and decide together." — no rights, no shortcuts.',
        strongAnswerLooksLike: '"CFO decides /pricing changes under 20%; Co-CEOs approve above 20%; CMO sets pop-up signage but consults CSGO when buyer claims change."',
        expertPushback: ['What is the most expensive decision a chief can make alone?', 'Have any meetings happened recently that should have been a chief decision?'],
        commonMistakes: ['Vague verbs like "consult" with no trigger.', 'Routing every interesting decision to Co-CEOs.'],
        decisionSupported: 'Pace and clarity of operating decisions.',
        connectsTo: ['Chapter 13 — decision log', 'Chapter 9 — operations readiness'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A chief can answer "do I need a Co-CEO for this?" without asking.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'operations lead',
        whyThisMatters:
          'A consistent rhythm catches risks before they become Stops Submit signals. An inconsistent rhythm means risks surface in the last week and the team scrambles.',
        whatToGather: [
          'Recurring meetings (weekly stand-up, pre-pop-up review, post-pop-up debrief).',
          'Owner per meeting + decisions usually made there.',
          'How blockers / risks get raised between meetings (channel, owner, response time).'
        ],
        weakAnswerLooksLike: '"We meet when needed." — no rhythm.',
        strongAnswerLooksLike: 'A weekly stand-up + pre-pop-up review + post-pop-up debrief, each with owner and decision scope; a clear "raise a risk in this channel" path between meetings.',
        expertPushback: ['Has the team actually held these meetings in the last two weeks?', 'Where do silent blockers go to die?'],
        commonMistakes: ['Documenting meetings the team does not actually run.', 'Not naming a channel for off-meeting risk surfacing.'],
        decisionSupported: 'Whether risks reach chiefs in time to fix them.',
        connectsTo: ['/timeline backplan', 'C-Suite Advisor cockpit'],
        ownerHint: 'COO',
        doneLooksLike: 'The next cohort could open the calendar and join the rhythm without re-inventing it.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'continuity operator (preparing next cohort)',
        whyThisMatters:
          'Most school companies die at the handoff. A backup per role + a documented handoff package is the difference between Renni Inc. surviving August and starting from scratch.',
        whatToGather: [
          'Named backup or shadow per C-Suite role.',
          'Handoff package contents (roster, decision log, vendor list, asset folder, KPI snapshot, /pricing).',
          'A locked handoff date so the package becomes real, not aspirational.'
        ],
        weakAnswerLooksLike: '"We will hand things off in August." — no contents, no backups, no date.',
        strongAnswerLooksLike: 'Each role has a shadow named; the handoff package contents are listed with owners; a specific date is locked (e.g., "Aug 15 handoff package locked, Aug 25 next cohort kickoff").',
        expertPushback: ['If a chief leaves in May, who runs that desk on day one?', 'Is the handoff package something the next cohort could open without you in the room?'],
        commonMistakes: ['Treating handoff as a soft topic instead of a deliverable.', 'No backup for the COO or CFO desk.'],
        decisionSupported: 'Whether Renni Inc. continues across cohorts.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs · Instructor/Admin support',
        doneLooksLike: 'Next cohort week one is described in writing and a backup is named for every chief seat.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'culture / org operator',
        whyThisMatters:
          'Recognition is the cheapest retention tool a student company has. Rules — not vibes — make recognition consistent across departments and across cohorts.',
        whatToGather: [
          'Recognition in the Playbook (signed sections, contributor list, role attribution).',
          'Recognition at the pop-up (intro at the table, signage credits).',
          'Recognition outside school (résumé / college language, LinkedIn-style summaries).'
        ],
        weakAnswerLooksLike: '"We thank everyone in the end." — no surfaces, no rules.',
        strongAnswerLooksLike: 'Three explicit rules: who signs what in the Playbook, how the team is credited at the pop-up, what wording students can use on a résumé.',
        expertPushback: ['Would the next cohort apply these rules without you?', 'Have any contributions slipped through the cracks this cohort?'],
        commonMistakes: ['Rules that depend on someone remembering.', 'Different rules per department.'],
        decisionSupported: 'Whether contribution is consistently visible.',
        connectsTo: ['Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A reader can predict who gets credited where without re-asking.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'continuity operator',
        whyThisMatters:
          'Knowledge dies between cohorts more often than people leave. Naming the risks honestly tells the next cohort what they\'re inheriting and what they need to fix first.',
        whatToGather: [
          '2–3 specific continuity risks (vendor relationship in one inbox, tracker nobody renews, undocumented decision).',
          'A mitigation per risk (or a flag that it is unmitigated today).',
          'Concrete trail markers — vendor name, tracker URL, decision date.'
        ],
        weakAnswerLooksLike: '"We need to document things better." — no specifics.',
        strongAnswerLooksLike: 'Each risk names a system / vendor / decision, says where the knowledge lives, and proposes a one-line fix.',
        expertPushback: ['What dies if the COO graduates without warning?', 'Is any vendor relationship in one student\'s phone?'],
        commonMistakes: ['Listing soft risks (motivation, energy) and skipping system risks.', 'Hiding unmitigated risks to look done.'],
        decisionSupported: 'What the next cohort fixes in week one.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'Co-CEOs · COO support',
        doneLooksLike: 'A reader can list 2–3 specific things that would break if a chief left tomorrow.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'continuity operator (preparing next cohort)',
        whyThisMatters:
          'A first-30-days plan is the most useful page in the Playbook for the next cohort. Without it, they spend September figuring out what August already knew.',
        whatToGather: [
          'Day 1 — which Playbook chapters they read first.',
          'Week 1 — chiefs and advisors they meet.',
          'Week 2 — trackers they open (Workbench, /pricing, /revenue, C-Suite Advisor).',
          'Week 4 — decisions to ratify or reopen.'
        ],
        weakAnswerLooksLike: '"Read everything and meet the team." — not actionable.',
        strongAnswerLooksLike: 'A short numbered timeline with named chapters / chiefs / trackers / decisions per week.',
        expertPushback: ['Could a brand-new student execute week one without you?', 'Which decisions need ratification on day 30 because they were soft this cohort?'],
        commonMistakes: ['Vague onboarding language.', 'Skipping decision ratification.'],
        decisionSupported: 'How quickly the next cohort gets productive.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'Next cohort has 4 weeks of named, executable activities they could follow without you in the room.'
      }
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
