import type { TemplateStudio } from '~/types/templateStudio'

export const marketingCustomerInsights: TemplateStudio = {
  title: 'Marketing and Customer Insights',
  purpose:
    'Capture what Renni Inc. actually knows about its customers — who they are, what they want, what evidence supports those beliefs — and turn that into the marketing, channel, and pitch decisions that drive the TechTown pop-up and the Phoenix Nest carry pitch.',
  learningObjective:
    'Use real customer evidence (or honestly labeled assumptions) to make marketing decisions, instead of guessing what customers want.',
  whyItMatters:
    'A pop-up that ignores customers gets ignored back. A Phoenix Nest pitch without insight reads as wishful thinking. This chapter is where the team turns conversations, observations, and surveys into messaging, channels, and a feedback loop the next cohort can build on.',
  finalOutput:
    'A short marketing-and-insights chapter that names primary customer groups, the problems and desires they care about, the evidence behind those beliefs, the messaging angles the team will run, the TechTown channels and touchpoints they will use, the Phoenix Nest pitch implications, the feedback plan, and the open risks.',
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
      id: 'messaging-angles',
      title: 'Messaging angles',
      lesson:
        'A messaging angle is a sentence that says "to this customer, we lead with this promise." Insights should drive angles directly — if you cannot link an angle back to an insight, it is not yet a real angle.',
      studentPrompts: [
        'Pick the top 2–3 messaging angles for the pop-up.',
        'For each one, name which customer group it speaks to and which insight it draws from.',
        'Test each angle against the brand voice from chapter 5.'
      ],
      completionCriteria: [
        'Two or three angles are written, each tied to a customer group and an insight.',
        'Angles fit the brand voice.'
      ]
    },
    {
      id: 'channels-and-touchpoints',
      title: 'Channels and touchpoints (TechTown)',
      lesson:
        'A channel is where the message reaches the customer; a touchpoint is the moment they meet the brand. TechTown has signage, the booth, the team conversation at the table, social posts before and after, and the receipt.',
      studentPrompts: [
        'List every TechTown touchpoint: pre-event social, signage, booth experience, conversation at the table, follow-up.',
        'For each touchpoint, decide which messaging angle leads.',
        'Note any touchpoint that is undecided so the team owns the gap.'
      ],
      completionCriteria: [
        'TechTown touchpoints are mapped.',
        'Each touchpoint has a leading angle assigned.'
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
        'Close the chapter with the "so what." Tie the insights to specific decisions the team is making for TechTown and Phoenix Nest.',
      studentPrompts: [
        'List 3–5 launch decisions the team made because of these insights.',
        'For each decision, name the insight that drove it.',
        'Name 2 risks or unknowns that could change the plan.'
      ],
      completionCriteria: [
        'Three to five insight-driven decisions are listed with traceability.',
        'At least two risks or unknowns are named.'
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
      playbookChapter: 6,
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
      playbookChapter: 6,
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
      playbookChapter: 6,
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
      playbookChapter: 6,
      suggestedTaskTitle: 'Translate insights into messaging angles',
      definitionOfDone:
        'CMO drafts angles that fit brand voice and trace to insights.'
    },
    {
      id: 'insights-to-techtown-channels',
      label: 'Connects insights to TechTown channels and touchpoints',
      description:
        'TechTown channels and touchpoints are mapped, each with a leading angle assigned.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 6,
      suggestedTaskTitle: 'Connect channels and touchpoints',
      definitionOfDone:
        'Pop-up touchpoint map is complete with angle assignments.'
    },
    {
      id: 'insights-to-phoenix-nest',
      label: 'Connects insights to the Phoenix Nest carry pitch',
      description:
        'Chapter explains how customer insights inform what gets pitched to Phoenix Nest, at what price, with what reasoning.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 6,
      suggestedTaskTitle: 'Review launch implications for Phoenix Nest',
      definitionOfDone:
        'Co-CEO confirms the Phoenix Nest implications align with the pricing and pitch chapters.'
    },
    {
      id: 'insights-feedback-plan',
      label: 'Includes a plan for collecting more feedback',
      description:
        'Feedback method, two-question script, and storage plan are all named.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 6,
      suggestedTaskTitle: 'Create feedback collection plan',
      definitionOfDone:
        'CSGO writes the feedback plan and confirms with the COO at-booth ops.'
    },
    {
      id: 'insights-risks-or-unknowns',
      label: 'Names at least two risks or unknowns',
      description:
        'Chapter ends with two or more honest risks or unknowns that could change the marketing plan.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 6,
      definitionOfDone:
        'Two or more risks named with a one-line implication each.'
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
      requirementId: 'insights-to-techtown-channels',
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
      title: 'Review launch implications for Phoenix Nest',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'insights-to-phoenix-nest',
      definitionOfDone:
        'Co-CEO signs off on the Phoenix Nest implications and aligns with pricing/pitch chapters.',
      dueOffsetDays: 7
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
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique customer-group definitions for specificity after the team drafts them.',
      'Ask clarifying questions when an insight lacks a source.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing customer quotes or feedback.',
      'Picking which customer group the team should target.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
