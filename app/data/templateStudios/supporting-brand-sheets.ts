import type { TemplateStudio } from '~/types/templateStudio'

export const supportingBrandSheets: TemplateStudio = {
  title: 'Supporting Brand Sheets',
  purpose:
    "Build short brand sheets for Renni Inc.'s supporting brands — Lumen (candles), Notice (jewelry), and Humble Oven (baked goods) — so the supporting line gets the same coaching House Phoenix gets in chapter 5.",
  learningObjective:
    'Translate a supporting brand from "extra products on the table" into a short, customer-ready sheet a buyer at TechTown or Phoenix Nest can understand on the first read.',
  whyItMatters:
    'Supporting brands carry weight at the pop-up — baked goods bring foot traffic, candles and jewelry add range and gift-ability. If their brand sheets are sloppy, customers default to thinking "this is just House Phoenix overflow." A sharp sheet protects the supporting brand on its own terms.',
  finalOutput:
    'A chapter with a one-page sheet per supporting brand (Lumen, Notice, Humble Oven), a comparison view of where each brand fits in the family, the cross-brand rules everyone follows, a launch-readiness check, and the open questions for next cohort.',
  connectedOutcome: 'Phoenix Nest pitch',
  sections: [
    {
      id: 'lumen-sheet',
      title: 'Lumen — candles',
      lesson:
        'Lumen makes candles. The sheet should sound like a candle brand a buyer at Phoenix Nest would consider carrying — voice, audience, products, price points, packaging, story.',
      studentPrompts: [
        'Who is Lumen for? Be specific — students who want a small gift, parents who want a mood, alumni?',
        'What scents and sizes does Lumen actually carry today?',
        'What is Lumen\'s voice — calm, warm, bold? Pick three adjectives.',
        'What does the packaging look like, and what does it say on the label?',
        'What price points work today and where might they go for retail carry?'
      ],
      requiredInputs: [
        'Audience for Lumen',
        'Current product line',
        'Voice adjectives',
        'Packaging description',
        'Price points'
      ],
      completionCriteria: [
        'Lumen sheet reads as a real candle brand, not a placeholder.',
        'A buyer would be able to make a stocking decision from the sheet.'
      ],
      evidencePrompt:
        'Back the Lumen audience and price-point claims with feedback, comparable brands, or labeled assumptions.',
      sourceGuidance: [
        'If a price point is "what we hope to charge", mark it as an assumption with confidence.',
        'Name the next validation step (vendor confirmation, buyer feedback, comp analysis).'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Size Lumen demand by audience × interest × conversion at the proposed price. Conservative / base / ambitious — the buyer will weigh the range, not a single number.'
      },
      brandFit: {
        enabled: true,
        guidance:
          'Use Brand Fit Builder to argue that Lumen\'s palette, packaging, voice, and references signal the candle buyer the team is targeting.'
      }
    },
    {
      id: 'notice-sheet',
      title: 'Notice — jewelry',
      lesson:
        'Notice makes jewelry. The sheet should treat it as a real jewelry line — material, design language, who it suits, how it photographs, what makes it Renni.',
      studentPrompts: [
        'Who is Notice for? Specific — students buying for themselves, gifts for family, statement pieces?',
        'What pieces does Notice currently carry, and in what materials?',
        'What is the design language in three words?',
        'How does the team photograph Notice for social and the booth?',
        'What price points are sustainable and what would Phoenix Nest stock?'
      ],
      requiredInputs: [
        'Audience for Notice',
        'Current pieces and materials',
        'Design language',
        'Photography approach',
        'Price points'
      ],
      completionCriteria: [
        'Notice sheet describes a real jewelry brand with a clear design language.',
        'A buyer can picture what would arrive in the case.'
      ],
      evidencePrompt:
        'Defend the Notice audience and price points with real customer reactions or labeled comp data.',
      sourceGuidance: [
        'Photo-of-comp-piece + price = a stronger source than "we think it should cost X".',
        'Name the assumption behind material costs if vendor quotes are pending.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Size Notice demand at the proposed retail and wholesale prices. Use comparable jewelry brands as your interest-rate baseline and label the assumption.'
      },
      brandFit: {
        enabled: true,
        guidance:
          'Use Brand Fit Builder to argue that Notice\'s design language, photography, and case display signal the right jewelry buyer at the right price.'
      }
    },
    {
      id: 'humble-oven-sheet',
      title: 'Humble Oven — baked goods',
      lesson:
        'Humble Oven makes baked goods. Because food has shelf life and food-safety rules, the sheet should cover what House Phoenix\'s sheet does plus production cadence, allergens, and packaging.',
      studentPrompts: [
        'Who is Humble Oven for at the pop-up — impulse buyers, snack stop, themed gifts?',
        'What does the line look like (cookies, brownies, seasonal items)?',
        'What is the voice — homey, witty, indulgent?',
        'How is production handled — bake the morning of, day before, par-baked?',
        'What allergen notes ship on every label?'
      ],
      requiredInputs: [
        'Audience',
        'Current baked-goods line',
        'Voice',
        'Production cadence',
        'Allergen labeling rule'
      ],
      completionCriteria: [
        'Sheet covers brand and food-handling realities together.',
        'A new student baker could prep for a pop-up from the sheet.'
      ],
      evidencePrompt:
        'Treat production cadence and allergen rules as claims that need a source — kitchen capacity, real recipe yields, school food-safety guidance.',
      sourceGuidance: [
        'If shelf-life is "we think 48 hours", mark confidence and name the validation step.',
        'Allergen labeling rules should cite the school/kitchen policy or a credible source.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Size Humble Oven demand at the pop-up. Audience is foot traffic; interest and conversion should be based on prior bake-sale or pop-up patterns, not a guess.'
      },
      brandFit: {
        enabled: true,
        guidance:
          'Use Brand Fit Builder to argue that Humble Oven\'s packaging, allergen labeling, voice, and pop-up display signal the food buyer at the right impulse-purchase price.'
      }
    },
    {
      id: 'supporting-brand-comparison',
      title: 'Supporting brand comparison',
      lesson:
        'A side-by-side view of all three supporting brands — audience, products, voice, price points — exposes overlaps and gaps the team should fix before launch.',
      universalTable: {
        enabled: true,
        kind: 'supporting-brand-comparison',
        title: 'Supporting Brand Comparison',
        intro: 'One row per supporting brand. Compare audience, products, voice, price, overlap risk.',
        copyTitle: 'Supporting brand comparison',
        columns: [
          { key: 'brand', label: 'Brand', type: 'select', options: ['Lumen', 'Notice', 'Humble Oven'] },
          { key: 'audience', label: 'Audience', type: 'text', placeholder: 'who it serves', wide: true },
          { key: 'products', label: 'Products', type: 'text', placeholder: 'what it sells', wide: true },
          { key: 'voice', label: 'Voice', type: 'text', placeholder: 'how it sounds', wide: true },
          { key: 'pricePoints', label: 'Price points', type: 'text', placeholder: 'rough range' },
          { key: 'overlapRisk', label: 'Overlap / risk', type: 'textarea', placeholder: 'where it might step on House Phoenix or another brand', wide: true }
        ],
        starterRows: [
          { brand: 'Lumen' },
          { brand: 'Notice' },
          { brand: 'Humble Oven' }
        ]
      },
      studentPrompts: [
        'Build a comparison table: brand × audience × products × voice × price range × launch status.',
        'Where do two brands compete for the same customer? Is that fine or a fix?',
        'Where is the lineup obviously thin?'
      ],
      completionCriteria: [
        'Comparison covers every supporting brand on the same dimensions.',
        'At least one overlap or gap is named with a one-line response.'
      ],
      sourceGuidance: [
        'When comparing, use clearly labeled demand assumptions, not guesses.',
        'Reference each brand sheet\'s Market Builder entry so the comparison is grounded.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Add a comparison-level entry per supporting brand so overlaps and gaps come from real demand math, not vibes.'
      }
    },
    {
      id: 'cross-brand-rules',
      title: 'Cross-brand rules',
      lesson:
        'Cross-brand rules are the family-level constraints every supporting brand obeys — the Renni Inc. endorsement rule from Chapter 2, voice consistency, packaging signals, who signs off on a new product idea.',
      studentPrompts: [
        'Which Renni Inc. signals appear on every supporting brand (tag, sticker, "Made by Renaissance students")?',
        'Which voice rules are shared across all three (e.g., never sarcastic, always direct)?',
        'Who has to sign off before a supporting brand adds a new SKU?'
      ],
      completionCriteria: [
        'At least one shared signal across the three is named.',
        'Sign-off path for new SKUs is named.'
      ],
      brandFit: {
        enabled: true,
        guidance:
          'Use Brand Fit Builder to argue the family rules send a coherent signal across House Phoenix and the supporting brands without forcing any single brand to copy the others.'
      }
    },
    {
      id: 'launch-readiness',
      title: 'Launch readiness',
      lesson:
        'Each supporting brand has its own readiness state for TechTown and Phoenix Nest. Lay it out honestly — production status, inventory, signage, photography, pricing.',
      universalChecklist: {
        enabled: true,
        kind: 'launch-readiness',
        title: 'Launch Readiness Checklist',
        intro: 'One row per supporting brand readiness item. Status, owner, fix needed, lock date.',
        copyTitle: 'Launch readiness',
        fields: ['owner', 'due', 'status', 'risk', 'nextStep']
      },
      studentPrompts: [
        'For each supporting brand, name TechTown readiness on a "ready / behind / blocked" scale.',
        'For each, name Phoenix Nest carry readiness — could a buyer place an order today?',
        'Flag the single biggest gap per brand and who owns closing it.'
      ],
      requiredInputs: ['Per-brand TechTown readiness', 'Per-brand Phoenix Nest readiness'],
      completionCriteria: [
        'Every supporting brand has a TechTown and Phoenix Nest readiness flag.',
        'Largest gap per brand is named with an owner.'
      ],
      sourceGuidance: [
        'When readiness depends on demand ("can we sell enough to justify the inventory?"), use a clearly labeled demand assumption.',
        'Name the source or explain why this is an estimate.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Project conservative / base / ambitious demand per supporting brand at launch. Inventory and prep decisions should reconcile with the conservative scenario.'
      }
    },
    {
      id: 'open-questions',
      title: 'Open questions',
      lesson:
        'Close the chapter with the questions the next cohort should pick up — new SKUs, shared production, brand consolidation, retail-only lines.',
      decisionMemo: {
        enabled: true,
        kind: 'supporting-brand-open-questions',
        title: 'Open Question Memo',
        intro: 'One card per open question. Decision (the question), options the team weighed, evidence so far, owner, definition of done.',
        copyTitle: 'Open questions',
        cardCount: 3
      },
      studentPrompts: [
        'List 2–3 open questions about the supporting brands as a system.',
        'For each, name the trigger that would resolve it (a sales threshold, a buyer ask, a cohort decision).',
        'Mark anything currently undecided so it stops drifting.'
      ],
      completionCriteria: [
        'Two or three open questions are named with resolution triggers.',
        'Undecided items are flagged.'
      ]
    }
  ],
  requirements: [
    {
      id: 'brand-sheet-lumen-defined',
      label: 'Lumen sheet defines audience, products, voice, packaging, price',
      description:
        'Lumen sheet covers all five inputs in customer-ready language.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 6,
      suggestedTaskTitle: 'Draft supporting brand voice and customer-facing descriptions',
      definitionOfDone:
        'CMO drafts the Lumen sheet so a Phoenix Nest buyer could decide on a stocking call.'
    },
    {
      id: 'brand-sheet-notice-defined',
      label: 'Notice sheet defines audience, pieces, design language, photography, price',
      description:
        'Notice sheet reads as a real jewelry brand with a clear design language and current pieces.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 6,
      definitionOfDone:
        'CMO drafts the Notice sheet so a buyer can picture the case.'
    },
    {
      id: 'brand-sheet-humble-oven-defined',
      label: 'Humble Oven sheet covers brand and food-handling realities',
      description:
        'Sheet describes the line, voice, production cadence, and allergen labeling.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 6,
      definitionOfDone:
        'CMO + COO confirm the Humble Oven sheet covers brand and food-safety basics.'
    },
    {
      id: 'brand-sheet-product-categories',
      label: 'Product categories listed per supporting brand',
      description:
        'Every supporting brand has a current SKU/category list verifiable against the pop-up table.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 6,
      suggestedTaskTitle: 'Confirm product readiness for each supporting brand',
      definitionOfDone:
        'COO confirms category lists match what is actually on the booth or in production.'
    },
    {
      id: 'brand-sheet-customer-fit',
      label: 'Customer fit and retail/launch assumptions named',
      description:
        'Each supporting brand sheet names the audience and at least one retail or launch assumption.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 6,
      suggestedTaskTitle: 'Identify customer fit and retail/launch assumptions',
      definitionOfDone:
        'Strategy and Growth writes audience and retail assumptions per brand and flags any unverified ones.'
    },
    {
      id: 'brand-sheet-cross-brand-rules',
      label: 'Cross-brand rules documented',
      description:
        'Family-level signals, shared voice rules, and SKU sign-off path are written.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 6,
      definitionOfDone:
        'Cross-brand rules apply consistently and tie back to chapter 2 brand architecture.'
    },
    {
      id: 'brand-sheet-launch-readiness',
      label: 'Launch readiness flagged per brand',
      description:
        'Every supporting brand has a TechTown and Phoenix Nest readiness flag, plus the biggest gap and an owner.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 6,
      suggestedTaskTitle: 'Confirm pricing or pricing status for supporting brand products',
      definitionOfDone:
        'CFO and COO confirm pricing/readiness flags are honest.'
    },
    {
      id: 'brand-sheet-open-questions',
      label: 'Open questions for next cohort named',
      description:
        '2–3 open questions about the supporting brand system are listed with resolution triggers.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 6,
      definitionOfDone:
        'Open questions are written so the next cohort can act on them.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft supporting brand voice and customer-facing descriptions',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'brand-sheet-lumen-defined',
      definitionOfDone:
        'CMO drafts the Lumen, Notice, and Humble Oven sheets in customer-ready language.',
      dueOffsetDays: 5
    },
    {
      title: 'Confirm product readiness for each supporting brand',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'brand-sheet-product-categories',
      definitionOfDone:
        'COO confirms current SKUs and production status for all three supporting brands.',
      dueOffsetDays: 4
    },
    {
      title: 'Confirm pricing or pricing status for supporting brand products',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'brand-sheet-launch-readiness',
      definitionOfDone:
        'CFO confirms or marks pending the price points on every supporting brand sheet.',
      dueOffsetDays: 5
    },
    {
      title: 'Identify customer fit and retail/launch assumptions',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'brand-sheet-customer-fit',
      definitionOfDone:
        'Strategy and Growth writes per-brand audience and retail assumptions, flags unverified ones.',
      dueOffsetDays: 5
    },
    {
      title: 'Final supporting brand sheets review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 7
    }
  ],
  requiredEvidence: [
    {
      id: 'brand-sheet-product-list',
      label: 'Product / category list per supporting brand',
      description:
        'Lumen, Notice, and Humble Oven SKU/category list with current production status.',
      required: true
    },
    {
      id: 'brand-sheet-photos',
      label: 'Product photos or design references',
      description:
        'Photos of candles, jewelry pieces, and baked goods if available.',
      required: false
    },
    {
      id: 'brand-sheet-pricing-notes',
      label: 'Pricing or pricing status notes',
      description:
        'Confirmed prices or "pending" notes per supporting brand product.',
      required: true
    },
    {
      id: 'brand-sheet-launch-readiness-notes',
      label: 'Launch readiness notes',
      description:
        'Per-brand readiness notes for TechTown and Phoenix Nest with named gap owners.',
      required: true
    },
    {
      id: 'brand-sheet-customer-feedback',
      label: 'Customer feedback (optional)',
      description:
        'Notes from real customers about Lumen, Notice, or Humble Oven if available.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a brand sheet for vague or generic language.',
      'Ask clarifying questions when an audience or price feels unsupported.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing audiences, products, or prices for a supporting brand.',
      'Picking which supporting brand should lead the lineup.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
