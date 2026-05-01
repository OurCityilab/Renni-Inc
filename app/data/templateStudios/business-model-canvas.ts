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
      // Compressed-view "What to do" microcopy + section-level
      // why-this-matters. Used by the Guidance Compression Sprint
      // helpers; if absent, fallbacks derive from `lesson` /
      // `studentPrompts`.
      whyThisMatters:
        'Naming the actual buyers — not "everyone" — is what makes the pricing, campaign, and Phoenix Nest carry pitch all line up. Vague segments here force every later chapter to guess.',
      actionSummary:
        'Name 2–3 customer groups and explain what each group needs from House Phoenix.',
      // Customer Segments QuickStart Sprint — only this section opts
      // in for V1. The renderer reads these options to seed chip
      // palettes; students can always enter a custom value.
      // Field renamed from `guidedQuickStart` to `chipPickQuickStart`
      // in the Architectural Scaffolding sprint.
      chipPickQuickStart: {
        enabled: true,
        title: 'Identify the customers',
        missionLabel: 'Mission',
        description:
          'Pick 2–3 customer groups, name what each one needs, choose why each matters, and add proof. We will build a starter draft you can edit before saving.',
        draftTarget: 'draftText',
        customerSegmentBuilder: {
          segmentOptions: [
            'Renaissance students',
            'First-time TechTown pop-up buyers',
            'Phoenix Nest retail buyers',
            'Parents and families',
            'Alumni and school supporters',
            'Detroit-made product supporters',
            'Donation-minded community members',
            'Staff and faculty',
            'Young professionals'
          ],
          needOptions: [
            'an affordable school spirit item',
            'a premium Detroit-made apparel piece',
            'a giftable product',
            'a way to support student entrepreneurs',
            'a product that feels professional',
            'a baked good or quick purchase',
            'proof that students can run a real company'
          ],
          importanceOptions: [
            'TechTown sales',
            'Phoenix Nest retail carry',
            'donations',
            'brand awareness',
            'next-semester strategy',
            'school community support'
          ],
          evidenceOptions: [
            'we talked to a student or customer',
            'we observed interest in class or at school',
            'we ran a survey or got feedback',
            'we had a product interest conversation',
            'we have a comparable product or price',
            'assumption only — needs validation'
          ]
        }
      },
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
        'Value propositions are the promises Renni Inc. keeps to its customers. Tie each one to a real product — beanies, sweatshirts, t-shirts, baked goods, donations — so the canvas matches what the BUSINESS sells, not just one event.',
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
        'Channels are where Renni Inc. customers find, buy, receive, and respond. TechTown is one sales channel, Phoenix Nest is another possible retail-carry channel, and student / community reach is how word spreads. Channels are not the same as activities — they are the routes the business uses, repeatedly.',
      universalTable: {
        enabled: true,
        kind: 'channels',
        title: 'Channel Map',
        intro: 'One row per channel. Awareness vs sale vs fulfillment vs follow-up. Square is the external POS — never a checkout you build here.',
        copyTitle: 'Channels',
        columns: [
          { key: 'channel', label: 'Channel', type: 'text', placeholder: 'TechTown · Phoenix Nest · school events · social', wide: true },
          { key: 'stage', label: 'Stage', type: 'select', options: ['Awareness', 'Sale', 'Fulfillment', 'Follow-up'] },
          { key: 'segment', label: 'Customer segment', type: 'text', placeholder: 'who this channel reaches', wide: true },
          { key: 'state', label: 'State', type: 'select', options: ['Real today', 'Aspirational'] },
          { key: 'evidence', label: 'Evidence / assumption', type: 'textarea', placeholder: 'past conversion · comparable · labeled assumption', wide: true }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'List every channel: TechTown pop-up, Phoenix Nest pitch, school / community events, social media, word-of-mouth.',
        'Mark which channels exist today vs. which are aspirational.',
        'Note which channels are best for awareness vs. closing a sale vs. fulfillment vs. follow-up.'
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
        'Customer relationships describe how Renni Inc. treats customers — at TechTown, through Phoenix Nest carry, online, and after the sale. Relationships are how a one-time buyer becomes a repeat buyer or advocate, and they apply across every sales channel, not just one event.',
      universalTable: {
        enabled: true,
        kind: 'customer-relationships',
        title: 'Relationship Model Table',
        intro: 'Each row: customer segment, before-sale interaction, sale moment, after-sale follow-up, brand-voice cue.',
        copyTitle: 'Customer relationships',
        columns: [
          { key: 'segment', label: 'Customer segment', type: 'text', placeholder: 'tie back to Customer Segments', wide: true },
          { key: 'beforeSale', label: 'Before sale', type: 'textarea', placeholder: 'how they hear about us / decide to come', wide: true },
          { key: 'saleMoment', label: 'Sale moment', type: 'textarea', placeholder: 'how the buy itself feels', wide: true },
          { key: 'afterSale', label: 'After sale', type: 'textarea', placeholder: 'thank-you · follow-up · second-purchase', wide: true },
          { key: 'voiceCue', label: 'Brand-voice cue', type: 'text', placeholder: 'tone or scripted line', wide: true }
        ],
        starterRowCount: 2
      },
      studentPrompts: [
        'How are customers treated at the TechTown table — quick at-table interaction, personal pitch, both? (Square is the external partner; Renni Command Center is not a sale system.)',
        'What happens after a buy? Thank-you, social tag, follow-up, none?',
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
          'Pop-up table experience: greeting, story, the at-table interaction, follow-up.',
          'Post-buy: thank-you, follow-up note, social tag, none.',
          'Donor experience vs product-buyer experience.'
        ],
        weakAnswerLooksLike: '"We will be friendly." — no experience.',
        strongAnswerLooksLike: 'A short script (greeting + 1-line story + offer + thank-you) plus a post-buy rule (Square handles transactions externally; no email follow-up this cohort).',
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
        'Revenue streams are how Renni Inc. takes money in across every channel. Product sales (TechTown direct, Phoenix Nest carry if it lands, school events) and donations are different streams — the canvas should treat them separately, with the recording rule named per stream.',
      // BMC Finance Table Cleanup. Mounts the FinanceTableBuilder
      // 'revenue-streams' kind so students fill a structured table
      // (stream name + type + capture method + source + assumption +
      // confidence + risk + owner + ties-to-Ch.8) instead of a prose
      // answer. Pure UI + clipboard. No POS, payment, or checkout
      // behavior — captureMethod is a free-text descriptor.
      financeTable: {
        enabled: true,
        kind: 'revenue-streams',
        guidance:
          'Use the table to separate product sales, baked goods, donations, and any future / retail-carry revenue. Name how each stream is captured externally (Square / cash / donation form) — Renni Command Center is not a checkout.'
      },
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
        'Key activities are the things Renni Inc. must do well — repeatedly — to operate as a student-run retail company. Think product, operations, sales channels, marketing, and learning. Not just one event.',
      whyThisMatters:
        'The Business Model Canvas describes the BUSINESS, not a single launch. The TechTown pop-up is one sales channel. Phoenix Nest is another possible retail channel. Naming the activities Renni Inc. needs to repeat is what makes the company handoff-ready for the next cohort.',
      actionSummary:
        'List the 5–7 activities Renni Inc. must do well to operate as a student-run retail company.',
      // V1: opt this section in to the new Key Activities Builder. The
      // builder mounts a small categorized chip-pick + reasons surface
      // so students think in business-activity terms, not pop-up tasks.
      keyActivities: {
        enabled: true,
        guidance:
          'Pick 5–7 activities across product, operations, sales channels, marketing, and learning. The TechTown pop-up is one sales channel; Phoenix Nest is another possible retail channel. Your answer should describe the business, not just one event.'
      },
      studentPrompts: [
        'List the 5–7 activities Renni Inc. must do well to operate as a student-run retail company.',
        'Cover product, operations, sales channels (TechTown, Phoenix Nest), marketing, and learning.',
        'Add a one-line reason each activity matters for the business.'
      ],
      completionCriteria: [
        'Names 5–7 repeatable business activities, not just pop-up tasks.',
        'Each activity has a one-line reason it matters for Renni Inc.',
        'Activities span at least three of: product, operations, sales channels, marketing, learning.'
      ],
      expertGuidance: {
        expertRole: 'COO / operations lead',
        whyThisMatters:
          'Key activities describe how Renni Inc. earns its money REPEATEDLY. TechTown is one channel; Phoenix Nest is another; future events are others still. Naming the underlying activities is what lets the next cohort run the company, not re-invent it.',
        whatToGather: [
          '5–7 activities Renni Inc. must do well as a student-run retail company.',
          'Coverage across product, operations, sales channels, marketing, and learning.',
          'A one-line reason each activity matters for the business.'
        ],
        weakAnswerLooksLike:
          '"Set up the booth, bake cookies, post on social, sell stuff." — single-event tasks, not repeatable business activities.',
        strongAnswerLooksLike:
          '"Source apparel · prepare baked goods · track inventory · sell through TechTown and Phoenix Nest channels · collect customer feedback · review pricing each cycle · document handoff for next cohort." — describes the BUSINESS.',
        expertPushback: [
          'Which of these activities still matters if TechTown does not happen this semester?',
          'Which activity would the next cohort have to repeat?',
          'Where does Phoenix Nest fit — as an activity, or a channel an activity feeds?'
        ],
        commonMistakes: [
          'Listing pop-up day tasks instead of repeatable business activities.',
          'Treating TechTown as the whole business instead of one sales channel.',
          'Skipping learning activities (feedback, pricing review, handoff).'
        ],
        decisionSupported:
          'Which activities Renni Inc. needs to staff, document, and hand off so the company runs cohort to cohort.',
        connectsTo: [
          'Chapter 9 — operations readiness',
          'Chapter 11 — Phoenix Nest carry pitch',
          'Chapter 12 — strategy / next-semester recommendations'
        ],
        ownerHint: 'COO',
        doneLooksLike:
          'A short list of 5–7 repeatable activities that span product, operations, channels, marketing, and learning — each with a one-line reason it matters.'
      }
    },
    {
      id: 'key-resources',
      title: 'Key resources',
      lesson:
        'Key resources are the assets, people, tools, systems, data, and inventory Renni Inc. depends on to run the business — not just the supplies for a single event. Think about what would still need to exist if the next cohort took over tomorrow.',
      universalTable: {
        enabled: true,
        kind: 'key-resources',
        title: 'Key Resources Map',
        intro: 'One row per resource. Type, role / activity it enables, owner, risk if missing.',
        copyTitle: 'Key resources',
        columns: [
          { key: 'resource', label: 'Resource', type: 'text', placeholder: 'people · physical · intellectual · inventory', wide: true },
          { key: 'type', label: 'Type', type: 'select', options: ['People', 'Physical', 'Intellectual', 'Inventory'] },
          { key: 'enables', label: 'Enables activity', type: 'text', placeholder: 'which key activity', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'risk', label: 'Risk if missing', type: 'textarea', placeholder: 'what breaks without it', wide: true }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'List people resources (chiefs, members, advisors).',
        'List physical resources (booth, signage, Square card reader as the external partner, oven, kitchen).',
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
          'Physical (booth, signage, Square card reader as the external partner, oven, kitchen access).',
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
        'Key partners are the business-enabling relationships Renni Inc. depends on — vendors, advisors, the school, TechTown, Phoenix Nest, and Square as the external POS partner. These are not one-time helpers; they are relationships the business returns to.',
      universalTable: {
        enabled: true,
        kind: 'key-partners',
        title: 'Partner Map',
        intro: 'One row per business-enabling partner. Contribution, relationship state, owner, next ask, risk if they leave.',
        copyTitle: 'Key partners',
        columns: [
          { key: 'partner', label: 'Partner', type: 'text', placeholder: 'vendor · school · TechTown · Phoenix Nest · Square (external POS)', wide: true },
          { key: 'contribution', label: 'Contribution', type: 'textarea', placeholder: 'what they bring', wide: true },
          { key: 'state', label: 'Relationship state', type: 'select', options: ['Confirmed', 'In conversation', 'Aspirational'] },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'nextAsk', label: 'Next ask', type: 'text', placeholder: 'the concrete next move', wide: true },
          { key: 'risk', label: 'Risk if they leave', type: 'textarea', placeholder: 'what we lose', wide: true }
        ],
        starterRowCount: 4
      },
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
        'Renni Inc.\'s cost structure has four buckets: FIXED costs (booth fee, signage, recurring fees), VARIABLE costs that scale with sales (per-unit beanie / shirt / baked-goods cost), PRODUCT costs (materials, packaging, sourcing), and EVENT costs unique to a single channel (transport, day-of supplies). Tie each cost to the unit-cost / fixed-cost work that already lives in Ch. 7 / 8 and /pricing.',
      // BMC Finance Table Cleanup. Mounts the FinanceTableBuilder
      // 'cost-structure' kind so students separate cost types and
      // name the source / confidence per row instead of writing
      // prose. Pure UI + clipboard. No POS, payment, checkout, or
      // tax behavior — `estimatedAmount` is a numeric input that
      // never settles, charges, or decrements anything.
      financeTable: {
        enabled: true,
        kind: 'cost-structure',
        guidance:
          'Use the table to separate variable / fixed / event-only / packaging / pending costs. Each row should name the source and confidence — this is the business-model view, not the detailed CFO model.'
      },
      studentPrompts: [
        'List variable costs per product (blanks, prints, ingredients, packaging).',
        'List fixed costs (booth, signage, kitchen rental, advisor honoraria).',
        'List event costs that only apply to one channel (e.g., TechTown transport).',
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
      strategyMemo: {
        enabled: true,
        kind: 'insight',
        title: 'BMC Insight Memo',
        intro: 'Three insight cards. What changed in the plan, what the canvas exposed, the one thing the team is still uncertain about.',
        copyTitle: 'BMC insights',
        cardCount: 3,
        fields: ['insight', 'evidence', 'recommendation', 'nextValidation']
      },
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
