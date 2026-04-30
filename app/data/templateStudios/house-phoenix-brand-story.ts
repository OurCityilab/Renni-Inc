import type { TemplateStudio } from '~/types/templateStudio'

export const housePhoenixBrandStory: TemplateStudio = {
  title: 'House Phoenix Brand Book',
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
      universalTable: {
        enabled: true,
        kind: 'brand-audience',
        title: 'Brand Audience Table',
        intro: 'One row per audience. Who they are, the feeling House Phoenix gives them, and the evidence the team has.',
        copyTitle: 'House Phoenix audience',
        columns: [
          { key: 'audience', label: 'Audience', type: 'text', placeholder: 'specific group, not "everyone"', wide: true },
          { key: 'feeling', label: 'Feeling House Phoenix gives them', type: 'textarea', placeholder: 'what they feel when they wear it', wide: true },
          { key: 'evidence', label: 'Evidence', type: 'textarea', placeholder: 'quote / observation / labeled assumption', wide: true },
          { key: 'confidence', label: 'Confidence', type: 'select', options: ['Low', 'Medium', 'High'] }
        ],
        starterRowCount: 2
      },
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
      ],
      expertGuidance: {
        expertRole: 'brand strategist + customer researcher',
        whyThisMatters:
          'Pricing, design, packaging, signage, and Phoenix Nest carry all start with this answer. "Students and parents" is too vague to drive a design decision.',
        whatToGather: [
          '3 specific buyer pictures (a student, a parent, an alumni — actual people, not personas).',
          'Direct conversation notes — who you talked to, what they said.',
          'A pointer to the Ch. 7 Segment Composer template that anchors the audience.'
        ],
        weakAnswerLooksLike: '"Students at Renaissance and people in Detroit." — too broad to design for.',
        strongAnswerLooksLike: 'Three named buyer descriptions plus quotes/observation, anchored to a Ch. 7 PRIZM-inspired segment.',
        expertPushback: ['Could a designer pick a color based on this?', 'Have you talked to 3+ real people who match this audience?'],
        commonMistakes: ['Naming demographics ("teens") instead of buyers.', 'Skipping evidence and writing the audience from imagination.'],
        decisionSupported: 'Design, voice, pricing, and channel decisions in this chapter and downstream.',
        connectsTo: ['Chapter 7 — Segment Composer', 'Chapter 8 — pricing', 'Chapter 10 — campaign'],
        ownerHint: 'CMO · Chief Strategy and Growth Officer support',
        doneLooksLike: 'A designer reading this section can make a real choice (color, photo style, packaging tone).'
      }
    },
    {
      id: 'value-proposition',
      title: 'What do we promise them?',
      lesson:
        'A value proposition is the one thing the audience will believe after the pop-up that they did not before. Keep it short enough to fit on a tag.',
      brandSystem: {
        enabled: true,
        kind: 'house-phoenix',
        title: 'House Phoenix Promise Builder',
        intro: 'Each card pairs a promise with the audience it serves and the proof a customer would believe.',
        copyTitle: 'House Phoenix value proposition',
        audience: true,
        promise: true,
        proofPoints: true,
        copyExamples: true
      },
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
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'The value proposition is what every customer should walk away believing. If it sounds like every other student brand, the pop-up will too.',
        whatToGather: [
          'A one-sentence promise tied to a real product (Detroit-made apparel, premium fit, school-pride packaging).',
          'A "what we are not" line that keeps the brand honest (e.g., "not generic school merch", "not fast-fashion").',
          'Why this segment would believe the promise.'
        ],
        weakAnswerLooksLike: '"Quality apparel for everyone who loves Renaissance." — could fit any school.',
        strongAnswerLooksLike: '"House Phoenix makes Detroit-made student-led apparel that hangs alongside Pure Detroit and Shinola in style and quality." — specific, comparable.',
        expertPushback: ['Would a Civic Premium Buyer believe this on first read?', 'What is the team deliberately NOT?'],
        commonMistakes: ['Slogan instead of promise.', 'No "not" list, so the promise tries to be everything.'],
        decisionSupported: 'Design, packaging, signage, and Phoenix Nest pitch language.',
        connectsTo: ['Chapter 11 — Phoenix Nest carry pitch', 'Chapter 10 — campaign'],
        ownerHint: 'CMO',
        doneLooksLike: 'A buyer or instructor could repeat the promise back; the "not" list reads as honest.'
      }
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
      ],
      brandFit: {
        enabled: true,
        guidance:
          'Use the Brand Fit Builder voice block to argue that tone, vocabulary, and what the brand never says match the customer and the price point.'
      },
      expertGuidance: {
        expertRole: 'brand voice / copywriting strategist',
        whyThisMatters:
          'Voice is what stays consistent when different students post on Instagram, write a tag, or pitch a buyer. Without an explicit voice, every channel sounds different and the brand reads as inconsistent.',
        whatToGather: [
          '3 voice adjectives the team can defend (confident / warm / direct).',
          'A "we never sound like" adjective (e.g., never formal, never hype-bro).',
          'One real Instagram caption rewritten in the chosen voice.'
        ],
        weakAnswerLooksLike: '"Friendly and professional." — could describe any brand.',
        strongAnswerLooksLike: 'Three specific adjectives + an explicit anti-adjective + a worked example caption.',
        expertPushback: ['Would two students using these adjectives produce similar copy?', 'Is the anti-adjective specific enough to actually constrain anything?'],
        commonMistakes: ['Generic adjectives.', 'No worked example, so the voice is theory.'],
        decisionSupported: 'Consistency across signage, social, packaging, and Phoenix Nest pitch language.',
        connectsTo: ['Chapter 10 — campaign / signage', 'Chapter 11 — Phoenix Nest carry pitch'],
        ownerHint: 'CMO',
        doneLooksLike: 'A new student writing for the brand could match voice without coaching.'
      }
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
      ],
      brandFit: {
        enabled: true,
        guidance:
          'Use the Brand Fit Builder to argue that color, font, logo, and packaging choices send the same signal as the price point and target customer the team is claiming.'
      },
      expertGuidance: {
        expertRole: 'brand identity designer',
        whyThisMatters:
          'Identity is the most public part of the brand. Inconsistency here loses pop-up customers and Phoenix Nest carry buyers — both judge the brand visually before reading any copy.',
        whatToGather: [
          'Final wordmark / logo file (linked, not in someone\'s phone).',
          'Color palette with hex codes.',
          'Typography picks with usage rules.',
          'Mockups: garment + sign + package.'
        ],
        weakAnswerLooksLike: '"We have a logo and some colors we like." — no link, no rules.',
        strongAnswerLooksLike: 'Linked asset folder with logo, palette (hex), type system + usage rules; a teammate not in the design meeting could apply correctly.',
        expertPushback: ['Could a printer deliver this without asking questions?', 'Is the price point legible from the visual identity alone?'],
        commonMistakes: ['Logo files in chat history.', 'No color hex codes documented.'],
        decisionSupported: 'Whether design renders consistently across SKUs and signage on May 27.',
        connectsTo: ['Chapter 9 — operations readiness (production)', 'Chapter 10 — campaign signage'],
        ownerHint: 'CMO',
        doneLooksLike: 'A teammate could open the asset folder and produce signage / a mockup without re-asking.'
      }
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
