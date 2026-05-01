import type { TemplateStudio } from '~/types/templateStudio'

export const currentProductLine: TemplateStudio = {
  title: 'Current Product Line and Pricing',
  purpose:
    'Show the current Renni Inc. / House Phoenix product line clearly — what is being sold, what it costs to make, what it sells for, how much margin remains, and what the team would say to a Phoenix Nest buyer who asks about it.',
  learningObjective:
    'Connect product decisions, pricing, margin, inventory, and retail readiness so the chapter reads as one consistent story rather than five disconnected facts.',
  whyItMatters:
    'Phoenix Nest buyers and the next cohort both read this chapter to decide whether the line is real. Pricing without margin reasoning, or product photos without inventory readiness, breaks the story. This studio makes the team align all five before submitting.',
  finalOutput:
    'A product-line and pricing chapter that lists every current product (beanies, sweatshirts, t-shirts, baked goods, donations), tells each product story, summarizes pricing and margin against /pricing, states inventory readiness, and ends with retail recommendations for Phoenix Nest.',
  connectedOutcome: 'Phoenix Nest pitch',
  sections: [
    {
      id: 'product-list',
      title: 'Current product list',
      lesson:
        'Open the chapter by listing every product the pop-up actually sells. The list should match what is on /pricing and on the table at TechTown.',
      universalTable: {
        enabled: true,
        kind: 'product-list',
        title: 'Product List Table',
        intro: 'One row per product. Use the product autocomplete on the Product column to pull from the Renni Inc. catalog.',
        copyTitle: 'Current product list',
        columns: [
          { key: 'product', label: 'Product', type: 'text', placeholder: 'House Phoenix Beanie · Humble Oven Baked Good · Donations', wide: true, productAutocomplete: true },
          { key: 'brand', label: 'Brand', type: 'text', placeholder: 'House Phoenix · Humble Oven · Renni Inc.' },
          { key: 'qtyReady', label: 'Qty ready', type: 'number', placeholder: '12' },
          { key: 'sizes', label: 'Sizes / variants', type: 'text', placeholder: 'S/M/L · flavor', wide: true },
          { key: 'state', label: 'State', type: 'select', options: ['Ready', 'Pending', 'Pilot', 'Not in lineup'] },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' }
        ],
        starterRowCount: 4
      },
      example:
        'House Phoenix beanies, House Phoenix sweatshirts, House Phoenix t-shirts, Humble Oven baked goods, Renni Inc. community donations.',
      studentPrompts: [
        'List all current products: beanies, sweatshirts, t-shirts, baked goods.',
        'List donations as a separate line — donations are not a product.',
        'Cross-check against /pricing — does every line in the engine show up here?'
      ],
      requiredInputs: ['Product list', 'Donation line called out separately'],
      completionCriteria: [
        'All four products are listed.',
        'Donations are listed separately from product sales.'
      ]
    },
    {
      id: 'product-story',
      title: 'Product story',
      lesson:
        'Every product needs a one- or two-sentence story — what it is, who it is for, and why it belongs in the House Phoenix line. This is the language the CMO would use at the table.',
      universalTable: {
        enabled: true,
        kind: 'product-story',
        title: 'Product Story Table',
        intro: 'One row per product. Customer in mind, why it matters, the line a CMO would say at the table.',
        copyTitle: 'Product story',
        columns: [
          { key: 'product', label: 'Product', type: 'text', placeholder: 'product name', wide: true, productAutocomplete: true },
          { key: 'customer', label: 'Customer in mind', type: 'text', placeholder: 'specific segment', wide: true },
          { key: 'why', label: 'Why it matters', type: 'textarea', placeholder: 'what makes it worth more than a generic version', wide: true },
          { key: 'tableLine', label: 'Line at the table', type: 'textarea', placeholder: 'one sentence to say at TechTown', wide: true }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'Write a short product story for each product (1–2 sentences).',
        'Tie each story back to House Phoenix — what makes it a Phoenix product, not just merch?',
        'Use customer-facing language, not internal shorthand.'
      ],
      completionCriteria: [
        'Every product has a customer-ready short description.',
        'Stories sound consistent with the brand voice from chapter 5.'
      ]
    },
    {
      id: 'pricing-summary',
      title: 'Pricing summary',
      lesson:
        'Pricing should match /pricing exactly. If a number is still pending, mark it pending — do not invent it.',
      studentPrompts: [
        'List the retail price for each product, or mark pending with a reason.',
        'Reference /pricing so readers can verify the numbers live.',
        'Note any prices that changed since last cohort and why.'
      ],
      requiredInputs: ['Retail prices or explicit "pending"'],
      completionCriteria: [
        'Every product has a price or an explicit pending note.',
        '/pricing is referenced as the source of truth.'
      ],
      evidencePrompt:
        'Log a structured evidence entry per product price tying it to a vendor quote, comp data, or labeled assumption.',
      sourceGuidance: [
        'If you use a number, name the source or explain the assumption.',
        'Mark confidence low / medium / high so reviewers know what to push on.',
        'Use a clearly labeled demand assumption when the price depends on expected sell-through.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each product price, log the demand the price assumes — buyers per scenario at the proposed retail. The Phoenix Nest pitch and Chapter 8 revenue model both pull from this entry.'
      },
      marketFit: {
        enabled: true,
        guidance:
          'Compare which segment (students, parents, alumni, Detroit supporters, gift buyers, premium apparel buyers) actually fits each product at the proposed price. Renaissance students may not be the primary market for premium items.'
      }
    },
    {
      id: 'margin-and-break-even',
      title: 'Margin and break-even',
      lesson:
        'Pricing without margin reasoning is just a sticker number. Connect each price back to unit cost, contribution margin, and break-even units.',
      financeTable: {
        enabled: true,
        kind: 'break-even',
        guidance:
          'Build the break-even table number-first. Show unit cost, sale price, unit margin, fixed-cost share, and units-to-break-even per product. The builder warns when margin is zero or negative — fix the price before continuing.'
      },
      studentPrompts: [
        'For each product, name the unit cost, sale price, and contribution margin.',
        'Show units-to-break-even per product, with the assumption labeled.',
        'Below the table, write 2–3 sentences explaining the math the team will defend.'
      ],
      completionCriteria: [
        'Each product has unit cost, sale price, unit margin, and units-to-break-even.',
        'Every assumption is labeled.',
        'Below the table, a short explanation defends the math.'
      ]
    },
    {
      id: 'inventory-readiness',
      title: 'Inventory readiness',
      lesson:
        'A buyer or teacher will ask "do you have it?" Inventory readiness is the honest answer — what is on hand, what is ordered, what is at risk.',
      universalTable: {
        enabled: true,
        kind: 'inventory-readiness',
        title: 'Inventory Readiness Table',
        intro: 'One row per product. On hand vs expected vs gap, with owner + close-by date.',
        copyTitle: 'Inventory readiness',
        columns: [
          { key: 'product', label: 'Product', type: 'text', placeholder: 'product name', wide: true, productAutocomplete: true },
          { key: 'onHand', label: 'On hand', type: 'number', placeholder: '0' },
          { key: 'expected', label: 'Expected', type: 'number', placeholder: '0' },
          { key: 'gap', label: 'Gap', type: 'text', placeholder: 'units short or "ready"', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'closeBy', label: 'Close by', type: 'text', placeholder: 'when the gap must close' }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'For each product, state on-hand quantity, ordered quantity, and ETA.',
        'For baked goods, note when production happens and how shelf life is handled.',
        'Flag any product that may not be ready by pop-up day with a one-line plan.'
      ],
      requiredInputs: ['On-hand', 'Ordered', 'ETA / readiness flag'],
      completionCriteria: [
        'Inventory status is named for every product.',
        'At least one risk product has an explicit readiness plan if applicable.'
      ],
      evidencePrompt:
        'For any "ready / behind / blocked" claim, log evidence — count, vendor confirmation, or labeled assumption.',
      sourceGuidance: [
        'If a count is from a recent physical check, name the date and the counter.',
        'If readiness is an estimate, mark confidence and the next validation step.'
      ]
    },
    {
      id: 'pricing-risks',
      title: 'Pricing risks and open questions',
      lesson:
        'Name the pricing risks honestly — too high, too low, vendor cost change, donation tracking. Two or three is enough.',
      universalTable: {
        enabled: true,
        kind: 'pricing-risks',
        title: 'Pricing Risk Register',
        intro: 'One row per pricing risk. Missing data, owner, next step, impact if unresolved.',
        copyTitle: 'Pricing risks',
        columns: [
          { key: 'risk', label: 'Risk', type: 'text', placeholder: 'what could go wrong', wide: true },
          { key: 'missingData', label: 'Missing data', type: 'textarea', placeholder: 'what we still need to know', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'nextStep', label: 'Next step', type: 'text', placeholder: 'what unblocks the risk', wide: true },
          { key: 'impact', label: 'Impact if unresolved', type: 'select', options: ['Low', 'Medium', 'High'] }
        ],
        starterRowCount: 3
      },
      studentPrompts: [
        'List the top pricing risks the team is watching.',
        'For each risk, write one line on what the team will do if it materializes.',
        'Do not list risks the team is not actually monitoring — keep it real.'
      ],
      completionCriteria: [
        'Two or three pricing risks are named.',
        'Each risk has a one-line response plan.'
      ],
      sourceGuidance: [
        'If a pricing risk is "demand could be lower than we think", use the Market Builder block to size that scenario explicitly instead of leaving it as a feeling.',
        'Do not present estimates as facts.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Add a conservative-leaning entry per pricing risk so the response plan has a number behind it.'
      }
    },
    {
      id: 'retail-recommendations',
      title: 'Retail recommendations for Phoenix Nest',
      lesson:
        'Close the chapter with a buyer-facing recommendation — which products belong on a Phoenix Nest shelf, at what price, and why.',
      studentPrompts: [
        'Recommend 1–3 products for Phoenix Nest carry.',
        'For each, name the retail price the team would propose and the wholesale margin behind it.',
        'Explain why the recommended set fits Phoenix Nest specifically.'
      ],
      completionCriteria: [
        'At least one product is recommended for Phoenix Nest carry with a price.',
        'Reasoning is buyer-facing, not internal-only.'
      ],
      sourceGuidance: [
        'For each recommended product, use the Market Builder block to project conservative / base / ambitious buyer counts and revenue at the proposed retail price.',
        'Name the strongest evidence and the weakest assumption — buyers are more persuaded by an honest range than by a single guess.',
        'Reference the Chapter 8 revenue scenario used to support each recommendation.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Phoenix Nest will read this as the demand argument behind the carry ask. Conservative / base / ambitious is required; name the next validation step.'
      },
      marketFit: {
        enabled: true,
        guidance:
          'For each recommended carry product, name the segment most likely to buy at retail and the segment most likely to be reached. They are not always the same.'
      }
    }
  ],
  requirements: [
    {
      id: 'product-line-complete',
      label: 'Product list is complete',
      description:
        'Beanies, sweatshirts, t-shirts, baked goods, and donations are all listed; donations are separated from sales.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 7,
      suggestedTaskTitle: 'Confirm product list and prices',
      definitionOfDone:
        'Product list matches /pricing line-for-line; donations are a separate line.'
    },
    {
      id: 'product-stories',
      label: 'Each product has a short product story',
      description:
        'Every product has a 1–2 sentence customer-ready description in House Phoenix voice.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 7,
      suggestedTaskTitle: 'Add product story and customer-facing language',
      definitionOfDone:
        'Stories drafted by CMO, consistent with the brand voice chapter.'
    },
    {
      id: 'retail-prices-listed',
      label: 'Retail prices listed or marked pending',
      description:
        'Each product has a retail price, or an explicit "pending" with a reason.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 7,
      definitionOfDone:
        'Every product line has a price or an honest pending note tied to /pricing.'
    },
    {
      id: 'pricing-tied-to-engine',
      label: 'Pricing connects to the pricing/break-even engine',
      description:
        'Numbers in this chapter reconcile with /pricing — no fictional numbers.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 7,
      definitionOfDone:
        'CFO has cross-checked every number against /pricing.'
    },
    {
      id: 'inventory-readiness-stated',
      label: 'Inventory readiness is stated per product',
      description:
        'Each product has an on-hand / ordered / ETA note.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 7,
      suggestedTaskTitle: 'Confirm inventory readiness',
      definitionOfDone:
        'Inventory note exists for every product; risk products have a readiness plan.'
    },
    {
      id: 'donations-separated',
      label: 'Donations treated separately from product sales',
      description:
        'Donations have their own line in the product list, pricing summary, and revenue conversation.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 7,
      definitionOfDone:
        'Chapter never folds donations into product revenue language.'
    },
    {
      id: 'pricing-risks-named',
      label: 'Pricing risks or open questions named',
      description:
        'Two or three pricing risks are listed with a one-line response plan each.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 7,
      suggestedTaskTitle: 'Add demand and customer feedback evidence',
      definitionOfDone:
        'At least two real risks named with response plans.'
    },
    {
      id: 'phoenix-nest-relevance',
      label: 'Phoenix Nest carry recommendations addressed',
      description:
        'Chapter ends with a buyer-facing carry recommendation for Phoenix Nest with prices and reasoning.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 7,
      suggestedTaskTitle: 'Review retail recommendations',
      definitionOfDone:
        'At least one product is recommended for Phoenix Nest with reasoning a buyer would accept.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Confirm product list and prices',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'product-line-complete',
      definitionOfDone:
        'CFO cross-checks the product list and prices against /pricing.',
      dueOffsetDays: 3
    },
    {
      title: 'Confirm inventory readiness',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'inventory-readiness-stated',
      definitionOfDone:
        'COO writes on-hand / ordered / ETA per product, flags risks.',
      dueOffsetDays: 4
    },
    {
      title: 'Add product story and customer-facing language',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'product-stories',
      definitionOfDone:
        'CMO drafts short product stories that match the brand voice.',
      dueOffsetDays: 4
    },
    {
      title: 'Add demand and customer feedback evidence',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'pricing-risks-named',
      definitionOfDone:
        'Strategy and Growth links to customer feedback or demand notes that back the risks list.',
      dueOffsetDays: 5
    },
    {
      title: 'Review retail recommendations',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'phoenix-nest-relevance',
      definitionOfDone:
        'Co-CEO signs off on the Phoenix Nest carry recommendation language.',
      dueOffsetDays: 6
    }
  ],
  requiredEvidence: [
    {
      id: 'product-pricing-link',
      label: 'Pricing + break-even screenshot or link',
      description:
        'Link or screenshot of /pricing so readers can verify the numbers.',
      required: true
    },
    {
      id: 'product-inventory-note',
      label: 'Inventory count or readiness note',
      description:
        'Inventory tally per product, or a linked tracker.',
      required: true
    },
    {
      id: 'product-photos',
      label: 'Product photos or design links',
      description:
        'Photos of beanies, sweatshirts, t-shirts, baked goods if available.',
      required: false
    },
    {
      id: 'product-list-tracker',
      label: 'Product list or product tracker link',
      description:
        'Link to the canonical product list (/pricing or a shared sheet).',
      required: true
    },
    {
      id: 'product-customer-feedback',
      label: 'Customer feedback or demand evidence',
      description:
        'Notes or quotes from customers that support the risks and recommendations.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest sharper customer-facing wording after the CMO drafts it.',
      'Ask questions when a price or inventory line looks inconsistent.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing prices, margins, or inventory the team has not verified.',
      'Picking which products to recommend to Phoenix Nest.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
