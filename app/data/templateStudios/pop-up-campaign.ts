import type { TemplateStudio } from '~/types/templateStudio'

export const popUpCampaign: TemplateStudio = {
  title: 'Marketing and Campaign Playbook',
  purpose:
    'Capture what Renni Inc. actually knows about its customers, then plan how Renni Inc. and House Phoenix drive attention, foot traffic, and sales to the TechTown pop-up. Document both halves so the next cohort can run a campaign like it again.',
  learningObjective:
    'Use real customer insights (or honestly labeled assumptions) to drive marketing decisions, then translate insights into audience, signage, content, and timing the customer actually sees.',
  whyItMatters:
    "A pop-up that ignores customers gets ignored back. The brand story matters, the pricing math matters, the ops SOP matters — but if nobody walks to the table, none of it moves. Marketing's job is to turn what we know about customers into arrivals.",
  finalOutput:
    'A marketing chapter that names primary customer groups and the evidence behind them, the messaging angles those insights drive, the TechTown audience touchpoints and content calendar, the way the team will measure which channel drove arrivals, and the feedback plan that closes the loop for next cohort.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
      id: 'target-customers',
      title: 'Target customers',
      lesson:
        'Define the customer groups the pop-up and Phoenix Nest pitch are actually trying to reach. Real groups beat demographic placeholders — "Renaissance students who buy a beanie because it represents their school" is a real group.',
      studentPrompts: [
        'Name 2–3 specific customer groups.',
        'For each one, write a one-line description of who they are.',
        'Mark which groups matter most for TechTown vs. Phoenix Nest.'
      ],
      requiredInputs: ['Named customer groups', 'TechTown vs. Phoenix Nest split'],
      completionCriteria: [
        'At least two named groups.',
        'Each group has a one-line description grounded in reality.'
      ]
    },
    {
      id: 'customer-problems-and-desires',
      title: 'Customer problems and desires',
      lesson:
        'A problem is what the customer is trying to fix. A desire is what they are trying to feel. Both shape what the team should make and how the team should sell.',
      studentPrompts: [
        'For each customer group, what problem does Renni Inc. or House Phoenix help solve?',
        'For each customer group, what do they want to feel by buying or wearing the product?',
        'Use customer language, not company language.'
      ],
      completionCriteria: [
        'Each customer group has at least one problem and one desire named.',
        'Language sounds like a customer, not a marketer.'
      ]
    },
    {
      id: 'insight-evidence',
      title: 'Evidence behind the insights',
      lesson:
        'Every insight needs a source. Sources can be conversations, observations, surveys, sales conversations, or assumptions — but assumptions must be labeled as assumptions.',
      studentPrompts: [
        'For each problem or desire, name the source: feedback, observation, survey, sales conversation, or assumption.',
        'Quote real customers if you have notes — quotes are stronger than paraphrases.',
        'Mark anything that is still an assumption so it can be tested later.'
      ],
      requiredInputs: ['Source per insight', 'Assumption flag where applicable'],
      completionCriteria: [
        'Every insight has a labeled source.',
        'Assumptions are clearly marked, not disguised as facts.'
      ]
    },
    {
      id: 'feedback-plan',
      title: 'Feedback plan',
      lesson:
        'Feedback is what makes the next cohort better than this one. Plan how the team will collect feedback at the pop-up, after the pop-up, and after the Phoenix Nest pitch.',
      studentPrompts: [
        'How will the team collect customer feedback at the booth (paper, link, conversation)?',
        'What two questions will the team ask every customer?',
        'How will the feedback be stored and reviewed?'
      ],
      requiredInputs: ['Feedback method', 'Two-question script', 'Storage plan'],
      completionCriteria: [
        'Feedback collection method is named.',
        'A two-question script is written.',
        'Storage plan is named (Workbench, sheet, doc).'
      ]
    },
    {
      id: 'implications-for-launch',
      title: 'Implications for launch',
      lesson:
        'Close the insights half of the chapter with the "so what." Tie insights to specific decisions the team is making for TechTown and the Phoenix Nest pitch. The campaign half below should follow from these.',
      studentPrompts: [
        'List 3–5 launch decisions the team made because of these insights.',
        'For each decision, name the insight that drove it.',
        'Name 2 risks or unknowns that could change the plan.'
      ],
      completionCriteria: [
        'Three to five insight-driven decisions are listed with traceability.',
        'At least two risks or unknowns are named.'
      ]
    },
    {
      id: 'audience',
      title: 'Who are we trying to reach?',
      lesson:
        'Start with the same audience the brand story picked. If the campaign is aimed at someone else, one of them is wrong.',
      studentPrompts: [
        'List the 2-3 groups you most want at the pop-up.',
        'Where do they already spend attention — Instagram, group chats, hallway conversations?'
      ],
      completionCriteria: [
        'Audience list matches the brand story; channels are specific, not generic.'
      ]
    },
    {
      id: 'touchpoints',
      title: 'What touchpoints?',
      lesson:
        'A touchpoint is every moment someone could see us before they show up. Signage, posts, classroom mentions, peer DMs.',
      example:
        'Week-before flyer in hallway → two IG reels → day-before text to 20 friends → day-of table signage.',
      studentPrompts: [
        'Map a 2-week timeline of every touchpoint you plan.',
        'Which touchpoints reach first-time customers vs repeat supporters?'
      ],
      requiredInputs: ['2-week touchpoint calendar'],
      completionCriteria: [
        'Calendar has at least three distinct touchpoint types.',
        'Each touchpoint has a named owner.'
      ]
    },
    {
      id: 'messaging',
      title: 'What do we say?',
      lesson:
        'Use the brand voice. Every piece of content should pass the test: "Could this only be House Phoenix?"',
      studentPrompts: [
        'Write the caption for the first announcement post.',
        'Draft the top line for the table sign.'
      ],
      requiredInputs: ['First post caption', 'Table sign headline'],
      completionCriteria: [
        'Copy reads in the brand voice and names the pop-up, date, and what to bring (cash/card).'
      ]
    },
    {
      id: 'measurement',
      title: 'How will we know what worked?',
      lesson:
        'Even a single question at the table — "How did you hear about us?" — gives next cohort signal. No analytics required.',
      studentPrompts: [
        'What 1-2 signals will we capture pop-up day?',
        'Who owns asking?'
      ],
      completionCriteria: [
        'At least one measurement plan exists and is owned.',
        'Recap will cite what we learned.'
      ]
    }
  ],
  requirements: [
    {
      id: 'insights-primary-customers',
      label: 'Defines primary customer groups',
      description:
        'At least two specific customer groups are named with a one-line description each.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      suggestedTaskTitle: 'Draft customer segments and insights',
      definitionOfDone:
        'CSGO drafts named customer groups with TechTown vs. Phoenix Nest emphasis.'
    },
    {
      id: 'insights-customer-needs',
      label: 'Explains what customers want or need',
      description:
        'Each customer group has at least one problem and one desire named in customer language.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'Problems and desires are written in plain customer-facing language.'
    },
    {
      id: 'insights-evidence-labeled',
      label: 'Includes labeled evidence behind every insight',
      description:
        'Every insight is tied to a source: feedback, observation, survey, sales conversation, or labeled assumption.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'No insight in the chapter is presented without a source label.'
    },
    {
      id: 'insights-to-messaging',
      label: 'Connects insights to marketing messages',
      description:
        '2–3 messaging angles, each traceable to a customer group and an insight.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      suggestedTaskTitle: 'Translate insights into messaging angles',
      definitionOfDone:
        'CMO drafts angles that fit brand voice and trace to insights.'
    },
    {
      id: 'insights-feedback-plan',
      label: 'Includes a plan for collecting more feedback',
      description:
        'Feedback method, two-question script, and storage plan are all named.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      suggestedTaskTitle: 'Create feedback collection plan',
      definitionOfDone:
        'CSGO writes the feedback plan and confirms with the COO at-booth ops.'
    },
    {
      id: 'insights-launch-implications',
      label: 'Insights tied to launch implications',
      description:
        'Chapter names 3–5 launch decisions traceable back to insights.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 10,
      suggestedTaskTitle: 'Review launch implications',
      definitionOfDone:
        'Co-CEO confirms the launch implications align with the campaign plan and Phoenix Nest pitch.'
    },
    {
      id: 'insights-risks-or-unknowns',
      label: 'Names at least two marketing risks or unknowns',
      description:
        'Two or more honest risks or unknowns that could change the marketing plan.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'Two or more risks named with a one-line implication each.'
    },
    {
      id: 'campaign-audience-map',
      label: 'Audience + channels map',
      description:
        'Matches the brand story\'s audience with the channels you\'ll actually use.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10
    },
    {
      id: 'campaign-calendar',
      label: 'Two-week touchpoint calendar',
      description:
        'Every touchpoint has a date, a channel, and a named owner.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      suggestedTaskTitle: 'Build the 2-week touchpoint calendar',
      definitionOfDone:
        'Calendar linked from the deliverable; each row has a named owner.'
    },
    {
      id: 'campaign-content-first-round',
      label: 'First-round content shipped',
      description:
        'Announcement post, hallway flyer, and table-sign headline approved by CMO.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      evidenceType: 'content-assets'
    },
    {
      id: 'campaign-measurement',
      label: 'Measurement plan',
      description:
        'At least one "how did you hear about us?" signal captured at the pop-up table.',
      requiredForApproval: false,
      department: 'marketing',
      playbookChapter: 10
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft customer segments and insights',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'insights-primary-customers',
      definitionOfDone:
        'CSGO drafts customer groups, problems, desires, and labels evidence sources.',
      dueOffsetDays: 3
    },
    {
      title: 'Translate insights into messaging angles',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'insights-to-messaging',
      dependency: 'insights-primary-customers',
      definitionOfDone:
        'CMO drafts 2–3 angles that fit brand voice and trace back to insights.',
      dueOffsetDays: 5
    },
    {
      title: 'Connect channels and touchpoints',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-audience-map',
      dependency: 'insights-to-messaging',
      definitionOfDone:
        'TechTown touchpoints mapped with leading angles assigned per touchpoint.',
      dueOffsetDays: 6
    },
    {
      title: 'Create feedback collection plan',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'insights-feedback-plan',
      definitionOfDone:
        'Feedback plan written; two-question script confirmed with COO and CMO.',
      dueOffsetDays: 5
    },
    {
      title: 'Review launch implications',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'insights-launch-implications',
      definitionOfDone:
        'Co-CEO confirms launch implications align with the pricing, ops, and pitch chapters.',
      dueOffsetDays: 7
    },
    {
      title: 'Map audience + channels from brand story',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-audience-map',
      dependency: 'brand-audience',
      dueOffsetDays: 3
    },
    {
      title: 'Build the 2-week touchpoint calendar',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-calendar',
      definitionOfDone:
        'Calendar has dates, channels, copy stubs, and named owners.',
      dueOffsetDays: 6
    },
    {
      title: 'Ship announcement post + hallway flyer + table sign',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'campaign-content-first-round',
      dependency: 'campaign-calendar',
      dueOffsetDays: 10
    },
    {
      title: 'Capture "how did you hear about us?" at the table',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'campaign-measurement',
      dueOffsetDays: 14
    }
  ],
  requiredEvidence: [
    {
      id: 'insights-feedback-notes',
      label: 'Customer feedback notes or survey link',
      description:
        'Notes from real customer feedback, or a survey link if available.',
      required: false
    },
    {
      id: 'insights-observation-notes',
      label: 'Observation notes',
      description:
        'Notes from watching real customers at past pop-ups, the school store, or comparable events.',
      required: false
    },
    {
      id: 'insights-marketing-content',
      label: 'Marketing content examples',
      description:
        'Drafts of social posts, signage, booth scripts that show the angles in action.',
      required: false
    },
    {
      id: 'insights-techtown-channel-plan',
      label: 'TechTown outreach / channel plan',
      description:
        'Plan or schedule for pre-event and at-event marketing.',
      required: true
    },
    {
      id: 'insights-phoenix-nest-assumptions',
      label: 'Phoenix Nest pitch assumptions',
      description:
        'Notes on what the team is assuming about Phoenix Nest buyers and the carry pitch.',
      required: false
    },
    {
      id: 'calendar-doc',
      label: 'Touchpoint calendar',
      description: 'Linked from the deliverable; owners named on each row.',
      required: true
    },
    {
      id: 'content-assets',
      label: 'First-round content assets',
      description: 'Post, flyer, and sign saved to the marketing folder.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a caption after you write it.',
      'Suggest missing touchpoints for your audience.',
      'Reformat your calendar for clarity.'
    ],
    disallowedHelp: [
      'Writing the announcement post from scratch.',
      'Inventing audience insight you have not validated.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
