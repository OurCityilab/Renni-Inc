import type { TemplateStudio } from '~/types/templateStudio'

export const housePhoenixBrandStory: TemplateStudio = {
  title: 'House Phoenix Brand Story',
  purpose:
    "Define House Phoenix so that anyone — a customer at the pop-up, a retail buyer, or the next cohort — understands what the brand stands for, who it's for, and why it exists.",
  learningObjective:
    'Translate a brand from "a product with a logo" into a coherent story: audience, promise, voice, and look.',
  whyItMatters:
    'A pop-up buyer picks up the beanie in seconds. If the story on the tag, signage, and packaging is unclear, they put it back down. The Phoenix Nest pitch fails the same way. The brand story is the spine every other chapter hangs off of.',
  finalOutput:
    'A short brand book with audience, promise, voice, wordmark/color/type decisions, and three application examples a non-designer teammate can use on signage and packaging.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'audience',
      title: 'Who is this for?',
      lesson:
        'Every strong brand starts with a specific audience. "Everyone" is not an audience — it is how brands get bland.',
      example:
        'For Renaissance students and the Renni Inc. cohort audience who are first-time pop-up buyers at TechTown.',
      studentPrompts: [
        'Name 3 specific people you picture buying a beanie at TechTown. Not demographics — real people.',
        'What do those people already know about Renaissance, TechTown, or House Phoenix?',
        'What would make them feel proud to wear the merch home?'
      ],
      requiredInputs: ['Audience description', 'Evidence (who you talked to)'],
      completionCriteria: [
        'Audience is specific enough that a designer could make a choice based on it.',
        'At least one real customer conversation or observation is cited.'
      ]
    },
    {
      id: 'value-proposition',
      title: 'What do we promise them?',
      lesson:
        'A value proposition is the one thing the audience will believe after the pop-up that they did not before. Keep it short enough to fit on a tag.',
      example:
        'House Phoenix makes Detroit-student-led merch that actually fits and looks like it could hang in a real store.',
      studentPrompts: [
        'Finish the sentence: "A House Phoenix customer should leave believing that ____."',
        'What do we NOT promise? (Name one thing we are deliberately not.)'
      ],
      requiredInputs: ['Value proposition sentence', 'What we are not'],
      completionCriteria: [
        'The value proposition reads like a sentence a customer would nod at.',
        'The "not" list keeps the brand honest.'
      ]
    },
    {
      id: 'voice',
      title: 'How does it sound?',
      lesson:
        'Voice is how the brand writes, posts, and signs. Decide it once so the team sounds consistent everywhere.',
      studentPrompts: [
        'Pick three voice adjectives (e.g., confident, warm, direct). Name an adjective you reject (e.g., formal).',
        'Rewrite one Instagram caption in the voice you chose.'
      ],
      completionCriteria: [
        'Three adjectives are specific enough to guide writing decisions.'
      ]
    },
    {
      id: 'identity',
      title: 'How does it look?',
      lesson:
        'Identity decisions — wordmark, color, type — lock down how the brand shows up on merch, signage, and packaging.',
      studentPrompts: [
        'Attach or link the final wordmark, color palette, and typography picks.',
        'Show how the brand looks on one garment, one sign, and one package.'
      ],
      requiredInputs: ['Logo file', 'Color palette', 'Type picks'],
      completionCriteria: [
        'Every element is in a linked working doc or asset folder.',
        'A teammate who was not in the design meeting could apply the brand correctly.'
      ]
    }
  ],
  requirements: [
    {
      id: 'brand-audience',
      label: 'Named audience with evidence',
      description:
        'At least one specific audience segment with real observation or conversation cited.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 5,
      evidenceType: 'customer-conversations',
      suggestedTaskTitle: 'Talk to 3 potential pop-up buyers',
      definitionOfDone:
        'Notes from 3 conversations captured in owner notes or linked doc.'
    },
    {
      id: 'brand-value-prop',
      label: 'Value proposition sentence',
      description:
        'One sentence the team agrees to; stays consistent across tag, signage, and Phoenix Nest pitch.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 5,
      suggestedTaskTitle: 'Draft and test the value proposition',
      definitionOfDone:
        'Sentence reviewed by CMO and approved by a Co-CEO.'
    },
    {
      id: 'brand-voice',
      label: 'Voice guidelines',
      description:
        'Three voice adjectives plus one rejected adjective, with a caption rewrite example.',
      requiredForApproval: false,
      department: 'marketing',
      playbookChapter: 5
    },
    {
      id: 'brand-identity',
      label: 'Logo, color palette, and type picks',
      description:
        'Final wordmark, color palette (HEX), and typography picks linked from the deliverable.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 5,
      evidenceType: 'design-files',
      suggestedTaskTitle: 'Finalize House Phoenix color + type system',
      definitionOfDone:
        'Files exported to the brand assets folder; link added to the deliverable.'
    },
    {
      id: 'brand-applications',
      label: 'Three application examples',
      description:
        'One garment tag, one pop-up sign, one package — showing the brand in use.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 5,
      evidenceType: 'mockups'
    }
  ],
  suggestedTasks: [
    {
      title: 'Talk to 3 potential pop-up buyers',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'brand-audience',
      definitionOfDone:
        'Three conversations captured with quotes and what they want from the brand.',
      dueOffsetDays: 5
    },
    {
      title: 'Draft and test the value proposition',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'brand-value-prop',
      definitionOfDone:
        'One sentence reviewed by CMO, tested with one customer, approved by a Co-CEO.',
      dueOffsetDays: 7
    },
    {
      title: 'Finalize House Phoenix color + type system',
      department: 'marketing',
      ownerRole: 'chief',
      requirementId: 'brand-identity',
      dependency: 'brand-voice',
      definitionOfDone:
        'Swatches and type specs exported; linked from the deliverable.',
      dueOffsetDays: 10
    },
    {
      title: 'Build application mockups (tag, sign, package)',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'brand-applications',
      dependency: 'brand-identity',
      dueOffsetDays: 12
    }
  ],
  requiredEvidence: [
    {
      id: 'audience-notes',
      label: 'Customer conversation notes',
      description: 'Quotes or paraphrases from real people, not made up.',
      required: true
    },
    {
      id: 'brand-assets',
      label: 'Final brand asset files',
      description: 'Logo, palette, and typography files in the shared folder.',
      required: true
    },
    {
      id: 'mockup-photos',
      label: 'Mockup photos or images',
      description: 'One garment tag, one sign, one package.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest edits to clarify your value proposition after you draft it.',
      'Critique your voice adjectives for consistency after you pick them.',
      'Point out missing audience specificity after you write a first draft.'
    ],
    disallowedHelp: [
      'Writing your value proposition from scratch.',
      'Picking your audience for you.',
      'Approving a chapter (only chiefs and Co-CEOs approve).'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
