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
      },
      expertGuidance: {
        expertRole: 'Chief Strategy and Growth Officer / market researcher',
        whyThisMatters:
          'The canvas falls apart if "everyone" is the answer. Real segments shape pricing, channel, message, and Phoenix Nest carry. The structured Segment Composer in Ch. 7 is where the real work happens — this section names the segments the canvas commits to.',
        whatToGather: [
          '2–3 segments with concrete buyer descriptions (Civic Premium Buyer, Premium Parent Supporter, Alumni Legacy Buyer).',
          'Why each segment matters for TechTown vs. Phoenix Nest.',
          'Pointer to the Ch. 7 PRIZM-inspired segment template that anchors each one.'
        ],
        weakAnswerLooksLike: '"Students, parents, and the community." — labels, not segments.',
        strongAnswerLooksLike: 'Each segment is named with income/spending power, geography, and one buying motivation. Cross-references the Ch. 7 Segment Composer.',
        expertPushback: ['If a buyer asks "who specifically pays $100?", do you have an answer?', 'Does any segment overlap so much it should be one?'],
        commonMistakes: ['Listing demographic groups instead of buying segments.', 'Skipping the Ch. 7 segment work.'],
        decisionSupported: 'Pricing, campaign, and Phoenix Nest carry argument.',
        connectsTo: ['Chapter 7 — Segment Composer', 'Chapter 8 — pricing strategy', 'Chapter 10 — campaign'],
        ownerHint: 'Chief Strategy and Growth Officer · CMO support',
        doneLooksLike: 'Each named segment has a buyer, a buying motivation, and a Ch. 7 anchor.'
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
      },
      expertGuidance: {
        expertRole: 'CMO / brand strategist',
        whyThisMatters:
          'A value proposition is a promise. If the customer cannot believe it, the rest of the canvas (channel, revenue, pricing) is built on a wish.',
        whatToGather: [
          'One promise per segment that ties to a real product or experience.',
          'Why this segment would believe the promise (Detroit-made story, premium quality, school connection, gift presentation).',
          'A test that would prove the promise (preorder, side-by-side, interview).'
        ],
        weakAnswerLooksLike: '"Quality apparel students love." — slogan, not a believed promise.',
        strongAnswerLooksLike: '"For the Civic Premium Buyer, House Phoenix is Detroit-made apparel that signals local pride at a defendable premium price." — segment + product + why-believed.',
        expertPushback: ['Could a customer in this segment repeat the promise back to you?', 'Is the promise different from any other student-merch brand in the city?'],
        commonMistakes: ['Promises that any brand could make.', 'Generic segments with generic promises.'],
        decisionSupported: 'What the campaign and Phoenix Nest pitch lead with.',
        connectsTo: ['Chapter 5 — House Phoenix Brand Story', 'Chapter 10 — campaign'],
        ownerHint: 'CMO',
        doneLooksLike: 'One segment-specific promise per segment, traced to a believable test.'
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
      },
      expertGuidance: {
        expertRole: 'CMO / channel operator',
        whyThisMatters:
          'Channels are how customers actually meet the brand. TechTown is the only channel that closes a sale today; Phoenix Nest is the carry channel. Treating these the same loses the pop-up.',
        whatToGather: [
          'TechTown pop-up — the only sales channel on May 27.',
          'Phoenix Nest — wholesale pitch channel.',
          'Awareness channels (school events, social, alumni network).',
          'Status: real-today vs aspirational.'
        ],
        weakAnswerLooksLike: '"We will use social and word of mouth." — too vague.',
        strongAnswerLooksLike: 'TechTown named as the closing channel; Phoenix Nest named as the carry channel; awareness channels listed with current vs aspirational.',
        expertPushback: ['Which channel is closest to closing a sale this week?', 'Is any channel listed because it is real or because it sounds good?'],
        commonMistakes: ['Treating "social media" as a single channel.', 'Putting Phoenix Nest in the closing column when it has not signed yet.'],
        decisionSupported: 'Where the team invests time before May 12 / May 27.',
        connectsTo: ['Chapter 10 — campaign / channel plan', 'Chapter 11 — Phoenix Nest carry'],
        ownerHint: 'CMO · Co-CEO support',
        doneLooksLike: 'Each channel has a status and a primary owner.'
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
      ],
      expertGuidance: {
        expertRole: 'retail / customer-experience operator',
        whyThisMatters:
          'How a customer is treated at the table is the brand. Pop-up customer experience is also the rehearsal for the Phoenix Nest carry pitch — buyers ask "how do customers experience your product?" before they buy.',
        whatToGather: [
          'Pop-up table experience: greeting, story, checkout, follow-up.',
          'Post-sale: receipt, follow-up email, social tag, none.',
          'Donor experience vs product-buyer experience.'
        ],
        weakAnswerLooksLike: '"We will be friendly." — no experience.',
        strongAnswerLooksLike: 'A short script (greeting + 1-line story + offer + thank-you) plus a post-sale rule (receipt by Square, no email follow-up this cohort).',
        expertPushback: ['Have you rehearsed the table experience?', 'Are donors thanked differently from buyers?'],
        commonMistakes: ['Skipping post-sale entirely.', 'Treating donors and buyers identically when they have different reasons.'],
        decisionSupported: 'Pop-up day customer flow + Phoenix Nest "how customers experience us" answer.',
        connectsTo: ['Chapter 9 — operations readiness (day-of SOP)', 'Chapter 11 — Phoenix Nest carry pitch'],
        ownerHint: 'CMO · COO support',
        doneLooksLike: 'A new student running the table could deliver the experience without coaching.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'CFO / revenue operator',
        whyThisMatters:
          'Donations and product sales sound similar but they are different revenue streams with different reporting rules. Mixing them makes the finance chapter unreadable to a real reviewer.',
        whatToGather: [
          'Each product SKU as its own stream (beanies, sweatshirts, t-shirts, baked goods).',
          'Donation as a separate stream with its own capture mechanism.',
          'Capture method per stream (Square card / cash / donation form).',
          'Which streams are essential for break-even.'
        ],
        weakAnswerLooksLike: '"We make money from sales and donations." — collapsed, untraceable.',
        strongAnswerLooksLike: 'Separate lines for each product + donations, each with capture method and importance to break-even.',
        expertPushback: ['Are donations being double-counted as sales?', 'Which one stream most affects break-even?'],
        commonMistakes: ['Putting donations in the product line.', 'Not naming Square explicitly as the closing tool.'],
        decisionSupported: 'How finance reports actuals vs scenarios after the pop-up.',
        connectsTo: ['Chapter 8 — pricing + revenue scenarios', '/pricing operational source of truth'],
        ownerHint: 'CFO',
        doneLooksLike: 'Donations and product sales are completely separable, with capture method and break-even impact called out.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'COO / operations lead',
        whyThisMatters:
          'Key activities are what the team has to do well. Naming them honestly catches the things nobody currently owns before they slip on May 27.',
        whatToGather: [
          '5–7 activities across before / during / after the pop-up.',
          'Owner per activity (named student, not "the team").',
          'Honest "still figuring out" note where the team has not done it before.'
        ],
        weakAnswerLooksLike: '"Designing, baking, selling, marketing." — generic verbs, no owner.',
        strongAnswerLooksLike: 'A short list per phase with owner per activity and uncertainty flagged where appropriate.',
        expertPushback: ['Which activity has no owner today?', 'Which activity is the team newest at and has not rehearsed?'],
        commonMistakes: ['Optimistic ownership ("the team" / "all of us").', 'Skipping post-event activities.'],
        decisionSupported: 'Where the team allocates time before, during, and after pop-up day.',
        connectsTo: ['Chapter 9 — operations readiness', 'Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'COO',
        doneLooksLike: 'Each activity has a named owner and a phase. "Still figuring out" notes are honest.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'COO / operations lead',
        whyThisMatters:
          'Resources are the inputs the team needs to ship. If the activity list says "bake 200 cookies" but the resource list does not name the kitchen, the plan is incomplete.',
        whatToGather: [
          'People (chiefs, members, advisors).',
          'Physical (booth, signage, Square POS, oven, kitchen access).',
          'Intellectual (brand book, designs, customer feedback log).',
          'Map: which activity needs which resource.'
        ],
        weakAnswerLooksLike: '"We need a team and supplies." — no specifics.',
        strongAnswerLooksLike: 'Three resource categories with named items; each item maps to an activity that needs it.',
        expertPushback: ['Which resource is shared and could be a bottleneck on May 27?', 'Is anything aspirational rather than confirmed?'],
        commonMistakes: ['Skipping intellectual resources (designs, brand book).', 'Treating advisors as fixed when their availability is not confirmed.'],
        decisionSupported: 'What the COO confirms before May 12 / May 27.',
        connectsTo: ['Chapter 9 — operations readiness'],
        ownerHint: 'COO',
        doneLooksLike: 'Every activity in the canvas has at least one resource backing it; every resource has a confirmed status.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'COO / partnerships lead',
        whyThisMatters:
          'Partners are leverage. The team should not own work they can outsource and should not pretend a partner exists without confirmation.',
        whatToGather: [
          'Garment / blank vendor (current quote on file).',
          'Print / decoration vendor.',
          'Baking / kitchen partner.',
          'Advisor / instructor / community partners.',
          'Square as the external POS partner (Renni Command Center is not a POS).'
        ],
        weakAnswerLooksLike: '"We have great partners." — names missing.',
        strongAnswerLooksLike: 'Each partner named with role + current status + the contact person who runs the relationship.',
        expertPushback: ['Which partner is in one student\'s phone with no backup contact?', 'Is any "partner" actually a hope?'],
        commonMistakes: ['Listing aspirational partners as confirmed.', 'No backup contact for the vendor relationship.'],
        decisionSupported: 'Vendor + advisor commitments before May 12.',
        connectsTo: ['Chapter 9 — operations readiness', 'Chapter 13 — decision log'],
        ownerHint: 'COO',
        doneLooksLike: 'Each named partner has a status, a contact, and a backup.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'CFO',
        whyThisMatters:
          'Costs in the canvas must reconcile with /pricing and Chapter 8 break-even. If they don\'t, finance loses credibility in a single meeting.',
        whatToGather: [
          'Variable cost per SKU (blank + decoration + labor + packaging + transaction fee).',
          'Fixed cost shares (booth, signage, kitchen, advisor honoraria).',
          'Cross-check: do these numbers match /pricing and Ch. 8?'
        ],
        weakAnswerLooksLike: '"Costs are about $X per shirt." — single rolled-up number, no reconciliation.',
        strongAnswerLooksLike: 'A table of variable + fixed costs that reconciles with /pricing and Ch. 8 break-even units.',
        expertPushback: ['Open /pricing in another tab — do these numbers match?', 'Are any costs missing entirely (transaction fees, returns, allergen labels)?'],
        commonMistakes: ['Costs that diverge from /pricing.', 'Forgetting transaction fees (they\'re real and they affect margin).'],
        decisionSupported: 'Whether the canvas reconciles with /pricing for finance review.',
        connectsTo: ['Chapter 8 — pricing strategy + break-even', '/pricing operational source of truth'],
        ownerHint: 'CFO',
        doneLooksLike: 'Numbers in this section match /pricing and Chapter 8 within rounding.'
      }
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
      ],
      expertGuidance: {
        expertRole: 'strategy operator / Co-CEO',
        whyThisMatters:
          'A canvas without a takeaway is a worksheet. The "what changed in the plan" line is what reviewers look for to decide whether the team is using the canvas or just filling boxes.',
        whatToGather: [
          'One thing the team did NOT know before mapping the canvas.',
          'A plan change the canvas exposed.',
          'An open question the canvas surfaced for the next cohort.'
        ],
        weakAnswerLooksLike: '"The canvas helped us understand our business." — generic, untraceable.',
        strongAnswerLooksLike: '"Mapping costs against /pricing exposed that fixed-cost share is too high to break even at base scenario; CFO is rerunning at $100 vs $90 by April 30."',
        expertPushback: ['Did anything actually change because of this canvas?', 'What did the team intentionally leave unresolved?'],
        commonMistakes: ['Treating insights as decoration.', 'No open question (everything sounds figured out).'],
        decisionSupported: 'Whether the team uses the canvas as an operating artifact, not just an assignment.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'Co-CEOs · Chief Strategy and Growth Officer support',
        doneLooksLike: 'A reader can name what changed in the plan because of this canvas.'
      }
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
