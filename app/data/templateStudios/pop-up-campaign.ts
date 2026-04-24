import type { TemplateStudio } from '~/types/templateStudio'

export const popUpCampaign: TemplateStudio = {
  title: 'TechTown Pop-Up Campaign + Readiness',
  purpose:
    'Plan how Renni Inc. and House Phoenix drive attention, foot traffic, and sales to the TechTown pop-up — and how the next cohort can run a campaign like it again.',
  learningObjective:
    'Connect audience, signage, content, and timing into a campaign a customer actually sees, and document it so the Playbook can teach the pattern.',
  whyItMatters:
    'The brand story matters, the pricing math matters, the ops SOP matters — but if nobody walks to the table, none of it moves. Marketing\'s job is to turn attention into arrivals.',
  finalOutput:
    'A campaign plan with audience touchpoints, signage, content calendar, and a simple way to measure which channel drove arrivals on pop-up day.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
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
