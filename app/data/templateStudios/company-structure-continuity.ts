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
      modelAnswerCard: {
        title: 'What good looks like — company roles',
        minimumViableAnswer:
          'A role list that covers the C-Suite (Co-CEOs, COO, CFO, CMO, CSGO), names the current student in each, and gives each role a one-sentence "owns this" scope.',
        strongAnswerPattern:
          'Renni Inc. roles for this cohort:\n— [role]: [student name] owns [scope]; pairs with [reviewer / advisor].\n— Repeat per role, including advisors and instructor.\n— Add a one-sentence note if any role is currently shared or open.',
        evidenceExpectation:
          'Cite each student name from the live roster. Note advisors / instructor only after confirming they have agreed.',
        avoid: [
          'Listing roles without an owner.',
          'Two roles claiming the same scope (write a tiebreaker if it happens).',
          'Skipping the advisors / instructor entry — they are part of the team for routing.'
        ]
      },
      universalTable: {
        enabled: true,
        kind: 'company-roles',
        title: 'Company Roles Table',
        intro: 'Every role on the team. Name the role, person, what they own, and who reports / supports.',
        copyTitle: 'Company roles',
        columns: [
          { key: 'role', label: 'Role', type: 'text', placeholder: 'Co-CEO · COO · CFO · CMO · CSGO · member · advisor' },
          { key: 'person', label: 'Person', type: 'text', placeholder: 'name' },
          { key: 'ownership', label: 'What they own', type: 'textarea', placeholder: 'one sentence', wide: true },
          { key: 'reportsTo', label: 'Reports / supports', type: 'text', placeholder: 'who they pair with', wide: true },
          { key: 'departments', label: 'Departments', type: 'text', placeholder: 'finance · ops · marketing · …', wide: true }
        ],
        starterRowCount: 5
      },
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
      decisionMemo: {
        enabled: true,
        kind: 'decision-rights',
        title: 'Decision Rights Memo',
        intro: 'One card per decision type. Decision (the call), criteria (who decides + when), recommendation (the rule), owner, escalation path under risk.',
        copyTitle: 'Decision rights',
        cardCount: 4
      },
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
      universalChecklist: {
        enabled: true,
        kind: 'accountability-rhythm',
        title: 'Operating Rhythm Checklist',
        intro: 'Each row = one recurring meeting / check-in / report. Owner, cadence, what gets reported.',
        copyTitle: 'Operating rhythm',
        fields: ['owner', 'due', 'doneSignal']
      },
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
          'A consistent rhythm catches risks before they become Stuck signals. An inconsistent rhythm means risks surface in the last week and the team scrambles.',
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
      modelAnswerCard: {
        title: 'What good looks like — succession & handoff',
        minimumViableAnswer:
          'A list pairing every C-Suite role with a backup / shadow, the handoff package contents, and a locked handoff date the next cohort can rely on.',
        strongAnswerPattern:
          'Succession plan:\n— [role]: primary [student], backup / shadow [student].\nHandoff package (locked by [date]):\n— Roster + contacts\n— Decision log link (Ch. 13)\n— Vendor / advisor list\n— Asset folder + brand book\n— KPI snapshot + open risks\nFirst-30-days note for next cohort: [one-paragraph "start here"].',
        evidenceExpectation:
          'Cite the live roster, the decision log location, and the asset folder. Confirm advisors are named with their permission.',
        avoid: [
          'Listing a backup who has not actually agreed.',
          'Skipping the lock date — the package needs a hard cut-off.',
          'Dropping the first-30-days note (the next cohort will need it on day one).'
        ]
      },
      universalChecklist: {
        enabled: true,
        kind: 'succession-and-handoff',
        title: 'Handoff Checklist',
        intro: 'Each row = one handoff item (asset / process / contact). Backup, lock date, done signal.',
        copyTitle: 'Succession & handoff plan',
        fields: ['owner', 'due', 'status', 'backup', 'doneSignal']
      },
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
      universalTable: {
        enabled: true,
        kind: 'continuity-risks',
        title: 'Continuity Risk Register',
        intro: 'One row per continuity risk. Risk, impact, prevention, owner.',
        copyTitle: 'Continuity risks',
        columns: [
          { key: 'risk', label: 'Risk', type: 'text', placeholder: 'what could go wrong between cohorts', wide: true },
          { key: 'impact', label: 'Impact', type: 'select', options: ['Low', 'Medium', 'High'] },
          { key: 'prevention', label: 'Prevention', type: 'textarea', placeholder: 'what we do now to prevent it', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'lockDate', label: 'Lock by', type: 'text', placeholder: 'when prevention must be done' }
        ],
        starterRowCount: 3
      },
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
      strategyMemo: {
        enabled: true,
        kind: 'first-30-days',
        title: 'First-30-Days Action Plan',
        intro: 'One card per concrete first-30-days action. Insight (why it matters), recommendation, owner, due, dependency, definition of done.',
        copyTitle: 'Next cohort — first 30 days',
        cardCount: 6,
        fields: ['insight', 'recommendation', 'owner', 'dueDate', 'dependency', 'definitionOfDone']
      },
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
    },
    {
      id: 'corporate-structure-and-ownership',
      title: 'Corporate Structure and Ownership Model',
      lesson:
        'Draft an educational model for how Renni Inc. could be structured and owned. Compare entity types, define the 30% Our City nonprofit / 70% student ownership split, propose how the 70% student pool gets allocated, draft vesting + distribution policy, sketch governance, and list every question the instructor / adult / legal reviewer needs to answer before any of this is real. This builder is NOT legal, tax, securities, accounting, or investment advice; Renni Command Center cannot create entities, grant equity, or maintain a real cap table.',
      modelAnswerCard: {
        title: 'What good looks like — corporate structure draft',
        minimumViableAnswer:
          'A short paragraph that names the entity type the team is studying, locks in the 30 % Our City nonprofit / 70 % student split, sketches how the 70 % is shared, and lists every adult / legal review question still open.',
        strongAnswerPattern:
          'We are drafting [entity type] for Renni Inc.\nOwnership model: 30 % Our City nonprofit / 70 % student pool, allocated across cohorts as [allocation rule].\nVesting: [schedule]; exit rules cover graduation, transfer, and re-allocation.\nDistributions: [policy] — educational language only.\nGovernance: [Co-CEOs / COO / CFO / advisor] decide [scope]; [reviewer] reviews [scope].\nContinuity: handoff to next cohort happens through [process].\nUnresolved adult-review questions: [list with named owner].',
        evidenceExpectation:
          'Cite which entity-type tradeoffs were considered, which adults / legal reviewers will see the draft, and which questions are still open. The output is a draft educational model — never a real cap table.',
        avoid: [
          'Claiming the model is legal, tax, securities, or investment advice.',
          'Promising real equity, real distributions, or real entity formation in the app.',
          'Skipping the unresolved-review questions list.'
        ]
      },
      glossaryChips: [
        {
          term: 'Entity',
          definition:
            'The legal form a business takes (LLC, C-corp, S-corp, co-op, etc.). Different entities follow different rules about ownership, taxes, and decision rights.',
          safetyNote:
            'Educational draft only. Adult / legal review required before forming any real entity.'
        },
        {
          term: 'Ownership model',
          definition:
            'How a company is split among the people or groups that own it. For Renni Inc. the educational draft uses a 30 % Our City nonprofit / 70 % student pool model.',
          safetyNote:
            'Educational draft only. Not a real cap table or equity grant.'
        },
        {
          term: 'Governance',
          definition:
            'The rules for who gets to decide what and how decisions are reviewed. Includes who chairs meetings, who breaks ties, and who has veto rights.',
          safetyNote:
            'Educational draft only. Real governance rules require adult / legal review.'
        },
        {
          term: 'Voting rights',
          definition:
            'Who is allowed to vote on which decisions, and how votes are weighted. In an educational draft these are sketches — not enforceable.'
        },
        {
          term: 'Vesting',
          definition:
            'A schedule for when someone earns a right over time — for example, equity that becomes the student\'s only after they finish a cohort or hit a milestone.',
          safetyNote:
            'This is only an educational draft. Adult / legal review required before any real vesting policy.'
        },
        {
          term: 'Distributions',
          definition:
            'Money paid out to owners after costs, taxes (handled externally), and rules are taken care of. In an educational draft these are planning rules, not real payouts.',
          safetyNote:
            'Not legal, tax, or investment advice. Real distributions require adult / legal / tax review.'
        },
        {
          term: 'Dividends',
          definition:
            'A specific kind of distribution — money a company pays out to its owners, usually from profit. In an educational draft this is planning language.',
          safetyNote:
            'Not legal, tax, or investment advice. Educational draft only.'
        },
        {
          term: 'Continuity',
          definition:
            'How the team makes sure the company keeps running when people leave — graduation, role changes, or end-of-cohort handoffs. Continuity is the plan that survives the team.'
        },
        {
          term: 'Handoff',
          definition:
            'The hand-over from this cohort to the next: who owns what, where the work lives, and what the next team needs to know on day one.'
        },
        {
          term: 'Review checklist',
          definition:
            'The list of questions an adult / instructor / legal reviewer needs to answer before any draft becomes real. Every Ch. 3 entry should produce a review checklist.',
          safetyNote:
            'Always required for corporate / equity drafts. Adult / legal review must clear the list before any real-world use.'
        }
      ],
      corporateStructure: {
        enabled: true,
        title: 'Corporate Structure and Ownership Model (draft)',
        intro:
          'Pick entity types to compare, set the 70/30 ownership model, draft how the student pool gets allocated, sketch vesting / distribution / governance / continuity, and list every adult-review question. Output is a draft educational model — instructor / adult / legal review is required before any real-world use.',
        copyTitle: 'Corporate Structure and Ownership Model (draft)',
        adultReviewRequired: true,
        ownershipModel: {
          nonprofitSharePercentDefault: 30,
          studentSharePercentDefault: 70,
          allowCustomScenario: true
        },
        vesting: {
          enabledDefault: true,
          scheduleOptions: [
            'Annual cohort vest (one-time at year end)',
            'Semester milestone vest',
            'Project / launch milestone vest',
            'Cliff + monthly continued vest',
            'Other (describe)'
          ],
          exitRulePrompts: [
            'What happens to unvested student shares when a student graduates?',
            'What happens when a student leaves early or transfers?',
            'How are inherited shares re-allocated to next cohort participants?',
            'Are there any conditions that should accelerate vesting (e.g. major launch milestone)?'
          ]
        },
        entityTypeOptions: [
          {
            id: 'llc',
            label: 'LLC',
            educationalExplanation:
              'A limited liability company. Often used by small ventures because it is flexible about ownership and tax treatment.',
            commonTradeoffs: [
              'Members can hold different shares without complex stock structures',
              'Tax treatment depends on adult / accounting review',
              'May not fit a school-owned-subsidiary model without legal review'
            ],
            adultReviewQuestions: [
              'Can a school-affiliated nonprofit own 30% of an LLC under our state\'s rules?',
              'Who signs the operating agreement?',
              'How are student members documented in a way the school can sign off on?'
            ]
          },
          {
            id: 'c-corp',
            label: 'C-corporation',
            educationalExplanation:
              'A standard corporation. Has shares and a clear ownership model, but more reporting overhead.',
            commonTradeoffs: [
              'Clear cap-table model maps to formal share grants',
              'Double-tax on dividends in many cases',
              'More formal annual filings'
            ],
            adultReviewQuestions: [
              'Is this overkill for a student-led venture today?',
              'Who are the directors, and how does adult oversight work?',
              'How are minor students named on share records, if at all?'
            ]
          },
          {
            id: 's-corp',
            label: 'S-corporation',
            educationalExplanation:
              'A corporation with pass-through tax treatment. Limited eligibility rules.',
            commonTradeoffs: [
              'Pass-through taxation may be simpler',
              'Has restrictions on who can be a shareholder',
              'School / nonprofit ownership may not fit'
            ],
            adultReviewQuestions: [
              'Can a nonprofit hold S-corp shares in our state?',
              'Are minor students eligible shareholders?',
              'Do we have an adult tax / accounting reviewer?'
            ]
          },
          {
            id: 'employee-owned',
            label: 'Employee-owned model (e.g. ESOP-style)',
            educationalExplanation:
              'A model where the people who work in the company own shares of it through a structured plan.',
            commonTradeoffs: [
              'Strong fit with student-as-worker-owner ethos',
              'Real ESOPs are heavily regulated and not student-friendly',
              'May be educational concept only — not a real legal structure'
            ],
            adultReviewQuestions: [
              'Is this a real ESOP or only the educational idea?',
              'How does this work in a school-affiliated venture?',
              'Who oversees compliance?'
            ]
          },
          {
            id: 'co-op',
            label: 'Cooperative (co-op)',
            educationalExplanation:
              'A member-owned and member-governed organization. Often one-member-one-vote.',
            commonTradeoffs: [
              'Strong democratic / student-voice fit',
              'State co-op laws vary',
              'Tax treatment differs from corporations'
            ],
            adultReviewQuestions: [
              'Does our state have a youth-friendly co-op statute?',
              'Who can be a member?',
              'How do we keep the 70/30 model inside the co-op rules?'
            ]
          },
          {
            id: 'nonprofit-subsidiary',
            label: 'Nonprofit-owned subsidiary or affiliated venture',
            educationalExplanation:
              'A separate entity owned (in whole or part) by a nonprofit parent. The nonprofit keeps oversight; the venture operates under it.',
            commonTradeoffs: [
              'Fits well with Our City nonprofit owning 30%',
              'Requires careful governance to keep the nonprofit\'s mission protected',
              'UBIT (unrelated business income tax) considerations may apply'
            ],
            adultReviewQuestions: [
              'How does the nonprofit\'s mission protect itself from venture risk?',
              'Who serves on a venture board the nonprofit can rely on?',
              'How do distributions back to the nonprofit work?'
            ]
          },
          {
            id: 'classroom-venture',
            label: 'Informal classroom venture (not yet a formed entity)',
            educationalExplanation:
              'Renni Inc. operates as a classroom learning venture today. There is no real legal entity yet; this is the most common posture for student work.',
            commonTradeoffs: [
              'No filings, no ownership records',
              'Cannot hold real assets, sign real contracts, or grant real equity',
              'Best for educational draft modeling and instructor review'
            ],
            adultReviewQuestions: [
              'Does the school want to keep Renni Inc. as a learning venture?',
              'When (if ever) should formation happen?',
              'Who decides?'
            ]
          },
          {
            id: 'other',
            label: 'Other / needs adult review',
            educationalExplanation:
              'A different structure the team wants to explore. Capture what it is and what the team needs answered.',
            commonTradeoffs: [
              'Tradeoffs depend on the model',
              'Adult / legal review required before treating it as real'
            ],
            adultReviewQuestions: [
              'What is this structure called?',
              'Who has used it for a similar venture?',
              'What questions does the instructor need answered first?'
            ]
          }
        ],
        dividendPolicyPrompts: [
          'If distributions are allowed, how often are they considered (annual, post-launch, never)?',
          'What expenses must be paid before any distribution?',
          'How much of net is reinvested in Renni Inc. vs distributed?',
          'How is a distribution recorded in a way the instructor / accountant can review?',
          'What happens to a graduating student\'s eligibility for future distributions?'
        ],
        votingRightsPrompts: [
          'Does each student get one vote, or vote share with their equity?',
          'Does the Our City nonprofit (30%) hold veto rights on certain decisions?',
          'Which decisions require unanimous chief approval?',
          'Which decisions require instructor / adult sign-off?',
          'How are tied votes resolved?'
        ],
        graduationRulePrompts: [
          'What happens to a graduating student\'s vested shares?',
          'What happens to unvested shares?',
          'Do alumni keep any rights or roles?',
          'How are new students invited into the student pool?',
          'How does the team prevent share concentration over time?'
        ],
        unresolvedLegalQuestionPrompts: [
          'Confirm whether minor students can hold equity in our state without a guardian arrangement.',
          'Confirm whether a school-affiliated nonprofit can legally own a percentage of the chosen entity type.',
          'Confirm tax treatment for any distributions, including distributions back to the nonprofit.',
          'Confirm whether vesting milestones constitute a securities-law triggering event.',
          'Confirm what filings (if any) Renni Inc. needs to make if the entity is formed.',
          'Confirm what insurance / liability coverage applies once the venture moves beyond classroom learning.'
        ]
      },
      studentPrompts: [
        'Pick one or two entity types to compare. Read the explanations and tradeoffs.',
        'Set or confirm the 70/30 ownership model (Our City nonprofit 30%, student pool 70%).',
        'Sketch how the 70% student pool gets allocated. Drafts can be partial.',
        'Decide how vesting, distributions, governance, and graduation work in your draft.',
        'Tick the adult / legal review checklist as the team confirms each step has been reviewed.',
        'Copy the draft into Working Draft and add structured evidence for any assumption that needs to be tested.'
      ],
      requiredInputs: [
        'Entity-type comparison (one or more options selected)',
        '30/70 ownership model (default or edited to total 100%)',
        'At least one student-allocation row',
        'A vesting decision (Yes / No / Undecided + rule)',
        'A distribution-policy stance (Yes / No / Undecided + reasoning)',
        'A governance sketch (who votes on what)',
        'Graduation / exit / continuity rules',
        'A populated adult / legal review checklist with unresolved questions'
      ],
      completionCriteria: [
        'Draft model includes entity comparison, 70/30 ownership, student allocation, vesting / exit rules, governance, and adult / legal review checklist.',
        'Every output document carries the "draft educational model — instructor / adult / legal review required" disclaimer.',
        'No claim is made that this is legal, tax, securities, accounting, or investment advice.',
        'No claim is made that Renni Inc. has formed an entity, granted real equity, or has a legal cap table.'
      ],
      expertGuidance: {
        expertRole: 'Co-CEOs · Instructor / adult reviewer',
        whyThisMatters:
          'Students learn the most by working through ownership and governance decisions in plain language and then handing the draft to an adult who can answer the legal questions. The draft is the learning artifact; the real decisions live with the school + adult reviewer.',
        whatToGather: [
          'Entity-type comparison + selected option(s)',
          '30/70 ownership numbers (or edited percentages that total 100%)',
          'A first-pass student-allocation table',
          'Vesting + distribution + governance sketches',
          'Graduation / exit / continuity rules',
          'A list of unresolved legal / tax / securities / accounting questions'
        ],
        weakAnswerLooksLike:
          '"We will be an LLC owned 70/30 with vesting." — no entity comparison, no allocation table, no review checklist, no unresolved questions list.',
        strongAnswerLooksLike:
          'A draft that compares 2–3 entity types in plain language, a clear 30/70 split with student allocation totaling 70%, a real vesting schedule + exit rules, a distribution policy with named approver, governance sketch with Our City\'s role, graduation rules, and an honest unresolved-questions list the instructor can act on.',
        expertPushback: [
          'Where is the legal / tax / securities review happening?',
          'Have we been clear that this is a draft, not a real cap table?',
          'What happens when students graduate?',
          'Who decides the entity type — the cohort or the school?'
        ],
        commonMistakes: [
          'Treating the draft as if it were a real cap table.',
          'Claiming the model is legal, tax, or securities advice.',
          'Forgetting that minors may not be able to hold equity directly.',
          'Skipping the 30% Our City nonprofit role in governance.'
        ],
        decisionSupported:
          'Whether — and when — the school should consider real entity formation, and what protections / questions need answers first.',
        connectsTo: [
          'Chapter 3 — company roles, decision rights, continuity',
          'Chapter 13 — decision log + appendices'
        ],
        ownerHint: 'Co-CEOs · Instructor / adult reviewer',
        doneLooksLike:
          'A reader can follow the draft model and tell what the team is proposing AND what still needs an adult / legal answer before any real-world use.'
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
