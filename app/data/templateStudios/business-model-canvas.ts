import type { TemplateStudio } from '~/types/templateStudio'

export const businessModelCanvas: TemplateStudio = {
  title: 'Business Model Canvas Summary',
  purpose:
    'Turn the Renni Inc. and House Phoenix idea into a clear operating model — who the customers are, what is being promised, how value is delivered, and how the company makes and spends money.',
  learningObjective:
    'Use the nine Business Model Canvas blocks plus a short insights section to explain how Renni Inc. creates, delivers, and captures value, and what the team learned by mapping it.',
  whyItMatters:
    'The Business Model Canvas is the bridge between the brand story and the operations plan. If the canvas is sloppy, the pricing, marketing, and operations chapters drift apart. A clean canvas keeps every other chapter honest.',
  finalOutput:
    'A student-friendly canvas summary with all nine blocks filled in for Renni Inc./House Phoenix, plus a short insights paragraph explaining what changed or surprised the team after working through it.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'customer-segments',
      title: 'Customer segments',
      lesson:
        'Customer segments name the actual people the business serves. Be specific — first-time pop-up buyers, retail buyers at Phoenix Nest, and donation-minded community members are different segments with different needs.',
      studentPrompts: [
        'Name 2–3 specific customer segments — not "everyone".',
        'For each segment, write one line about what they need from House Phoenix.',
        'Note which segments matter most for the TechTown pop-up vs. Phoenix Nest.'
      ],
      requiredInputs: ['Named customer segments', 'Why each one matters'],
      completionCriteria: [
        'At least two segments are named specifically.',
        'Each segment has a one-line need or use-case.'
      ],
      evidencePrompt:
        'Support customer claims with feedback, observation, survey results, or clearly labeled assumptions.',
      analysisPrompt:
        'If you use a number for segment size or willingness to pay, name the source or explain the assumption.',
      sourceGuidance: [
        'Quotes from real customer conversations beat paraphrases.',
        'If this is an estimate, mark confidence low / medium / high.',
        'Name the next validation step so the next cohort can test it.',
        'Use a clearly labeled demand assumption, not a guess.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Size each customer segment using the Market Builder block — name the audience, the interest and conversion assumptions, and a confidence level. Use estimates, not facts.'
      }
    },
    {
      id: 'value-propositions',
      title: 'Value propositions',
      lesson:
        'Value propositions are the promises the business keeps. Tie each one to a real product — beanies, sweatshirts, t-shirts, baked goods, donations — so the canvas matches what the pop-up actually sells.',
      studentPrompts: [
        'Write one value proposition per segment.',
        'Tie each value proposition to a specific product or experience.',
        'Reject anything that sounds like a marketing slogan instead of a real promise.'
      ],
      completionCriteria: [
        'Value propositions are tied to House Phoenix products or the donation experience.',
        'Each promise reads like a sentence a customer would believe.'
      ],
      sourceGuidance: [
        'Use a clearly labeled demand assumption, not a guess.',
        'Name the source or explain why this is an estimate.',
        'Do not present estimates as facts.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each value proposition, log the demand the promise depends on — who would buy it, at what price, and how confident the team is in that estimate.'
      }
    },
    {
      id: 'channels',
      title: 'Channels',
      lesson:
        'Channels are how customers reach the brand. TechTown is the main channel today, Phoenix Nest is the wholesale channel, and student/community reach is how word spreads.',
      studentPrompts: [
        'List every channel: TechTown pop-up, Phoenix Nest pitch, social media, community word-of-mouth.',
        'Mark which channels exist today vs. which are aspirational.',
        'Note which channels are best for awareness vs. actually closing a sale.'
      ],
      completionCriteria: [
        'TechTown pop-up is named.',
        'Phoenix Nest is named.',
        'Student/community reach is named where appropriate.'
      ],
      sourceGuidance: [
        'Use a clearly labeled demand assumption when channel reach is the basis for a number.',
        'Name the source or explain why this is an estimate.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each channel, log the reachable audience and the interest/conversion assumption that turns reach into buyers. Conservative, base, and ambitious scenarios are required.'
      }
    },
    {
      id: 'customer-relationships',
      title: 'Customer relationships',
      lesson:
        'Customer relationships describe how the brand treats customers — at the pop-up table, online, and after the sale. Relationships are how a one-time buyer becomes a repeat buyer or advocate.',
      studentPrompts: [
        'How are customers treated at the TechTown table — fast checkout, personal pitch, both?',
        'What happens after a sale? Receipts, follow-up, none?',
        'How do donors and product buyers experience the brand differently?'
      ],
      completionCriteria: [
        'Pop-up customer experience is described.',
        'Post-sale relationship is described, even if it is "none yet".'
      ]
    },
    {
      id: 'revenue-streams',
      title: 'Revenue streams',
      lesson:
        'Revenue streams are how the business takes money in. Product sales and donations are different streams — the canvas should treat them separately.',
      studentPrompts: [
        'List each revenue stream: beanies, sweatshirts, t-shirts, baked goods, donations.',
        'For each stream, name how money is captured (Square, cash, donation form).',
        'Note which streams are essential for break-even vs. nice-to-have.'
      ],
      completionCriteria: [
        'Product sales and donations are listed as separate streams.',
        'Capture method is named for each stream.'
      ],
      evidencePrompt:
        'For any revenue figure, log a structured evidence entry tying it back to /pricing or a real sales scenario.',
      sourceGuidance: [
        'If the number is an estimate, mark confidence and name the assumption.',
        'Donations and product revenue belong in separate evidence entries.'
      ]
    },
    {
      id: 'key-activities',
      title: 'Key activities',
      lesson:
        'Key activities are the work the company has to actually do — design, ordering, baking, staffing the table, posting on social, pitching to retailers.',
      studentPrompts: [
        'List the 5–7 activities Renni Inc. has to do well to ship the pop-up.',
        'Mark which activities run before, during, and after pop-up day.',
        'Flag any activity the team is unsure how to do yet.'
      ],
      completionCriteria: [
        'Activities cover before, during, and after the pop-up.',
        'At least one activity has an honest "still figuring out" note if appropriate.'
      ]
    },
    {
      id: 'key-resources',
      title: 'Key resources',
      lesson:
        'Key resources are what the company needs to do those activities — people, designs, vendors, the Square device, the booth, the kitchen for baked goods.',
      studentPrompts: [
        'List people resources (chiefs, members, advisors).',
        'List physical resources (booth, signage, Square POS, oven, kitchen).',
        'List intellectual resources (brand book, designs, customer feedback).'
      ],
      completionCriteria: [
        'People, physical, and intellectual resources are each represented.',
        'Resources match the activities listed in the previous block.'
      ]
    },
    {
      id: 'key-partners',
      title: 'Key partners',
      lesson:
        'Partners do work the team cannot or should not do alone — vendors, advisors, the school, TechTown, Phoenix Nest, payment processors.',
      studentPrompts: [
        'Name garment, baking, and printing vendors.',
        'Name advisors, teachers, and any community partners.',
        'Note Square as the external POS partner — Renni Command Center is not a POS.'
      ],
      completionCriteria: [
        'At least one vendor is named.',
        'At least one advisor or community partner is named.'
      ]
    },
    {
      id: 'cost-structure',
      title: 'Cost structure',
      lesson:
        'Cost structure connects directly to the pricing and break-even chapter. List the costs and tie them to the unit cost / fixed cost work that already lives on /pricing.',
      studentPrompts: [
        'List variable costs per product (blanks, prints, ingredients, packaging).',
        'List fixed costs (booth, signage, kitchen rental, advisor honoraria).',
        'Cross-check: do these costs match the unit costs and fixed-cost shares on /pricing?'
      ],
      requiredInputs: ['Variable costs', 'Fixed costs', '/pricing cross-check'],
      completionCriteria: [
        'Variable and fixed costs are both listed.',
        'Costs reconcile with the pricing/break-even summary.'
      ]
    },
    {
      id: 'canvas-insights',
      title: 'Canvas insights',
      lesson:
        'After mapping the canvas, the team should be able to name what they learned. This block is the "why this exercise mattered" paragraph.',
      studentPrompts: [
        'What surprised the team while filling out the canvas?',
        'What changed in the plan because of something the canvas exposed?',
        'What is the team still uncertain about?'
      ],
      completionCriteria: [
        'Team-authored paragraph names at least one insight.',
        'At least one open question or uncertainty is named.'
      ]
    }
  ],
  requirements: [
    {
      id: 'bmc-customer-segments-specific',
      label: 'Customer segments are specific',
      description:
        'At least two named customer segments with a one-line need each — not "everyone".',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 4,
      suggestedTaskTitle: 'Review customer segment assumptions',
      definitionOfDone:
        'Two or more segments named, each with a specific need or use-case.'
    },
    {
      id: 'bmc-value-props-tied-to-products',
      label: 'Value propositions tied to House Phoenix / products',
      description:
        'Each value proposition is tied to a real product or experience the pop-up actually delivers.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 4,
      suggestedTaskTitle: 'Review value propositions and channels',
      definitionOfDone:
        'Every value prop names a product or experience and reads like a real promise.'
    },
    {
      id: 'bmc-channels-include-techtown-and-phoenix-nest',
      label: 'Channels include TechTown and Phoenix Nest',
      description:
        'TechTown pop-up and Phoenix Nest are both listed as channels; community/student reach is acknowledged where relevant.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 4
    },
    {
      id: 'bmc-revenue-streams-products-and-donations',
      label: 'Revenue streams cover products and donations',
      description:
        'Product sales and donations are both listed as revenue streams, with capture methods named.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 4,
      suggestedTaskTitle: 'Review revenue streams and cost structure',
      definitionOfDone:
        'Streams enumerated; donations are separated from product sales.'
    },
    {
      id: 'bmc-cost-structure-connects-to-pricing',
      label: 'Cost structure connects to pricing/break-even',
      description:
        'Costs reconcile with the unit costs and fixed-cost shares already on /pricing.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 4,
      definitionOfDone:
        'Variable and fixed costs match the pricing engine; deltas are explained if any exist.'
    },
    {
      id: 'bmc-partners-and-resources-realistic',
      label: 'Key partners and resources are realistic',
      description:
        'Partners are real (vendors, advisors, school) and resources match the listed activities.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 4,
      suggestedTaskTitle: 'Review key activities and resources',
      definitionOfDone:
        'Partners and resources are named and tied to live activities.'
    },
    {
      id: 'bmc-canvas-insights',
      label: 'Canvas insights paragraph written',
      description:
        'Team has written what they learned and at least one open question after working through the canvas.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 4,
      suggestedTaskTitle: 'Final canvas summary review',
      definitionOfDone:
        'Insights paragraph names at least one learning and one open question.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Review customer segment assumptions',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'bmc-customer-segments-specific',
      definitionOfDone:
        'Customer segments named with evidence from real conversations or observations.',
      dueOffsetDays: 3
    },
    {
      title: 'Review value propositions and channels',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'bmc-value-props-tied-to-products',
      definitionOfDone:
        'CSGO ties value props to products, names TechTown and Phoenix Nest channels, and routes customer-facing language to CMO for review.',
      dueOffsetDays: 4
    },
    {
      title: 'Review revenue streams and cost structure',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'bmc-revenue-streams-products-and-donations',
      definitionOfDone:
        'Streams and costs reconcile with /pricing and the break-even summary.',
      dueOffsetDays: 4
    },
    {
      title: 'Review key activities and resources',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'bmc-partners-and-resources-realistic',
      definitionOfDone:
        'CSGO confirms activities, resources, and partners support the strategy; COO verifies the operational pieces are realistic.',
      dueOffsetDays: 4
    },
    {
      title: 'Final canvas summary review',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'bmc-canvas-insights',
      definitionOfDone:
        'Co-CEO reviews the canvas end-to-end and signs off on the insights paragraph.',
      dueOffsetDays: 6
    }
  ],
  requiredEvidence: [
    {
      id: 'bmc-canvas-module-link',
      label: 'Link to Canvas module',
      description:
        'Reference the in-app /bmc canvas or the source canvas worksheet.',
      required: true
    },
    {
      id: 'bmc-pricing-link',
      label: 'Pricing / break-even reference',
      description:
        'Link or screenshot of /pricing showing the cost reconciliation.',
      required: true
    },
    {
      id: 'bmc-customer-feedback',
      label: 'Customer feedback evidence',
      description:
        'Notes from real customer conversations or observations.',
      required: false
    },
    {
      id: 'bmc-product-list',
      label: 'Current product list',
      description:
        'Snapshot or link of the current product line so the canvas matches reality.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a canvas block after the team drafts it.',
      'Ask questions when a block reads vague or generic.',
      'Check the canvas against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Filling in canvas blocks for the team.',
      'Inventing customer segments or partners that do not exist.',
      'Approving the canvas summary.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
