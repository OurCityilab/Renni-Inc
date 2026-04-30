import type { TemplateStudio } from '~/types/templateStudio'

export const operationsReadiness: TemplateStudio = {
  title: 'Business Operations + Continuity',
  purpose:
    'Build the repeatable system that lets Renni Inc. deliver products, fix issues, learn from customers, and hand the company off. The TechTown pop-up is one operating test; this chapter covers the rest.',
  learningObjective:
    'Operations is the repeatable system that lets Renni Inc. deliver products, fix issues, learn from customers, and hand off the company to the next team. Inventory + day-of SOP + baked-goods handling + cadence + fulfillment + vendor coordination + quality control + customer service + safe interest tracking + post-launch operations + continuity all live here.',
  whyItMatters:
    'Marketing drives foot traffic. Finance decides what to charge. Operations is what makes the table actually open at 10am AND keeps Renni Inc. running between events. Without a broader operating system, the next cohort inherits a one-day playbook instead of a company.',
  finalOutput:
    'Inventory counts, day-of SOP, baked-goods handling SOP, weekly / monthly operating cadence, fulfillment workflow, vendor and partner tracker, quality-control checklist, customer-service issue tracker, safe interest tracker, post-launch operations memo, and a continuity / handoff plan.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
      id: 'inventory',
      title: 'What are we actually bringing?',
      lesson:
        'Inventory is the bet. Count what we have, note what is missing, decide what to order.',
      operationsChecklist: {
        enabled: true,
        kind: 'inventory',
        guidance:
          'Build the inventory checklist. Item, quantity, location, owner, issue/risk, and packed?-checkbox per row. Use it pre-event AND day-of to track packing.'
      },
      studentPrompts: [
        'How many of each product do we physically have right now?',
        'What is ordered but not delivered? When does it arrive?',
        'What safety stock (extras for damaged units) do we want?'
      ],
      requiredInputs: ['Physical inventory count per product'],
      completionCriteria: [
        'Inventory count is recorded against every /pricing product.',
        'Any gaps vs. planned quantity have a named plan to close.'
      ],
      expertGuidance: {
        expertRole: 'COO / retail operations lead',
        whyThisMatters:
          'Inventory is the only physical thing on the table at TechTown. Off counts here mean stockouts (lost revenue) or leftovers (eaten margin). Pop-up day is too late to find out the count was wrong.',
        whatToGather: [
          'Physical count per SKU today, not last week.',
          'In-flight orders with delivery dates.',
          'Safety stock per SKU (the extras for damages, returns, signage).',
          'Cross-check against /pricing plannedQuantity.'
        ],
        weakAnswerLooksLike: '"We have about 100 of each." — eyeballing.',
        strongAnswerLooksLike: 'A spreadsheet/list with counted-today + ordered + safety stock per SKU; gaps named with a closure owner.',
        expertPushback: ['Have you physically touched every box?', 'If a SKU sells out at noon, what does the team say?'],
        commonMistakes: ['Estimating instead of counting.', 'Skipping baked goods because they live in a different builder.'],
        decisionSupported: 'What the COO commits to producing or ordering before May 27.',
        connectsTo: ['/pricing operational source of truth', 'Chapter 8 — revenue scenarios'],
        ownerHint: 'COO',
        doneLooksLike: 'Every /pricing SKU has a counted-today number; gaps have a closure date and owner.'
      }
    },
    {
      id: 'day-of-sop',
      title: 'How does pop-up day run?',
      lesson:
        'SOP = Standard Operating Procedure. Write the steps someone who was not in planning meetings could follow.',
      example:
        '08:00 — Load van. 09:00 — Arrive TechTown. 09:15 — Set up table, signage, card reader. 10:00 — Open. 12:00 — Inventory check. 16:00 — Close, count cash, pack out. 17:00 — Handoff.',
      operationsChecklist: {
        enabled: true,
        kind: 'day-of-sop',
        guidance:
          'Build the day-of SOP step by step in time order. Each row is a time / step with owner, materials, done signal, and backup. A new student should be able to read it and run a block.'
      },
      studentPrompts: [
        'Who is on shift at each block?',
        'What is the Square setup step-by-step? Who owns the card reader?',
        'What happens if we run out of a product?'
      ],
      completionCriteria: [
        'Every 30-minute block has a person named.',
        'Stockout response is documented.'
      ],
      expertGuidance: {
        expertRole: 'COO / retail floor manager',
        whyThisMatters:
          'A SOP a stranger could follow is the difference between a smooth pop-up and a frantic one. The team will be tired and customer-facing — decisions made now save real time on May 27.',
        whatToGather: [
          'Time-blocked schedule (30-minute granularity) from load-in to pack-out.',
          'Owner for each block (greeter, runner, cashier, baked-goods specialist).',
          'Square setup steps (who pairs the reader, who opens the till).',
          'Stockout response (what staff say, where the substitute lives).',
          'Cash + card reconciliation steps at close.'
        ],
        weakAnswerLooksLike: '"We will set up at 9 and run through 4." — no owners, no flow.',
        strongAnswerLooksLike: 'A printable hour-by-hour schedule with named owners per block, named Square setup steps, and a written stockout response.',
        expertPushback: ['If the cashier needs a bathroom break, who steps in?', 'What does the team say if Square is offline for 10 minutes?'],
        commonMistakes: ['Skipping pack-out and reconciliation.', 'Owners assigned generically ("a chief") rather than named.'],
        decisionSupported: 'How smoothly the team executes on May 27.',
        connectsTo: ['Chapter 4 — BMC customer relationships', 'Chapter 8 — revenue scenarios'],
        ownerHint: 'COO',
        doneLooksLike: 'A new student handed the SOP could run a block of the day without re-asking.'
      }
    },
    {
      id: 'baked-goods-sop',
      title: 'Baked goods — food safety',
      lesson:
        'Humble Oven baked goods need separate handling. Temperature, allergens, labeling, and sell-by timing matter.',
      operationsChecklist: {
        enabled: true,
        kind: 'baked-goods-sop',
        guidance:
          'Build the baked-goods SOP. Each row is a step with food-safety concern, owner, materials, done signal, and backup notes. The builder shows a clear "this is not legal food-safety advice — follow school, event, and instructor requirements" warning above the table.'
      },
      studentPrompts: [
        'What baked goods are we selling? Who baked them and when?',
        'What allergens need labels at the table?',
        'How do we display them so nothing spoils over a 6-hour pop-up?'
      ],
      requiredInputs: ['Allergen list', 'Ingredient list per item'],
      completionCriteria: [
        'Allergen + ingredient labels are prepared before pop-up day.',
        'Baking-to-selling timeline keeps items inside safe hold window.'
      ],
      expertGuidance: {
        expertRole: 'food-safety operator (baked-goods focus)',
        whyThisMatters:
          'Selling food at a public event has rules. An undeclared allergen or an out-of-window pastry is a real liability for Renaissance and Renni Inc. — not a minor mistake.',
        whatToGather: [
          'Bake list per item with quantities for May 27.',
          'Allergen list (gluten, dairy, eggs, nuts, soy) per item.',
          'Ingredient list per item, in order.',
          'Bake-to-sell timeline so items stay in safe hold window.',
          'Display + signage with allergen labels printed and ready.'
        ],
        weakAnswerLooksLike: '"We will label things." — no list, no timeline.',
        strongAnswerLooksLike: 'A bake-list spreadsheet, ingredient + allergen labels printed, a bake-to-sell timeline that keeps items safe over a 6-hour pop-up.',
        expertPushback: ['Has someone double-checked the labels for missing allergens?', 'What is the protocol if a customer asks "is this gluten-free?" and you are not sure?'],
        commonMistakes: ['Treating baked goods like apparel.', 'No bake timeline (items get stale or unsafe).'],
        decisionSupported: 'Whether Humble Oven runs cleanly and safely on May 27.',
        connectsTo: ['Chapter 2 — supporting brands (Humble Oven)', 'Chapter 6 — supporting brand sheet (Humble Oven)'],
        ownerHint: 'COO · CMO support (signage)',
        doneLooksLike: 'Allergen + ingredient labels printed; bake timeline locked; substitute response written.'
      }
    },
    {
      id: 'continuity',
      title: 'Handoff to next cohort',
      lesson:
        'Continuity is the Playbook\'s real point. Write what would have saved you a week if the last cohort had written it down.',
      operationsChecklist: {
        enabled: true,
        kind: 'continuity',
        guidance:
          'Build the continuity checklist. Each row is an item / process — current status, owner, link / location, warning / risk, and the next step. A reader should be able to act in week one without asking for clarification.'
      },
      studentPrompts: [
        'What surprised your team during planning?',
        'What is the single most useful thing next cohort should know first?',
        'Where are the files, folders, contacts, and credentials stored?'
      ],
      completionCriteria: [
        'Continuity note covers surprises, top-thing-to-know, and asset locations.',
        'Referenced from the Playbook Decision Log.'
      ],
      expertGuidance: {
        expertRole: 'continuity operator (preparing next cohort)',
        whyThisMatters:
          'The single most useful page for the next cohort is "what would have saved us a week if last cohort had written it down." This is that page.',
        whatToGather: [
          'Things that surprised the team during planning.',
          'The top-1 thing the next cohort should know first.',
          'Where assets live (asset folder, vendor contacts, credentials, brand book).',
          'Lessons from the day-of SOP that did not match plan.'
        ],
        weakAnswerLooksLike: '"Read everything in the folder." — not actionable.',
        strongAnswerLooksLike: 'A short paragraph naming 1–2 surprises, a single "do this first" line, and explicit pointers to file locations.',
        expertPushback: ['What knowledge currently lives only in one student\'s phone?', 'What is the next cohort about to repeat that we already learned?'],
        commonMistakes: ['Vague "be organized" advice.', 'Missing concrete asset pointers.'],
        decisionSupported: 'How fast the next cohort gets to running operations.',
        connectsTo: ['Chapter 3 — company structure & continuity', 'Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'COO',
        doneLooksLike: 'A reader can act in week one without asking for clarification.'
      }
    },
    // ===== Business Operations Expansion (Pass — Ch. 9 reframe).
    // The four sections above cover pop-up readiness. The eight
    // sections below cover the rest of the operating system: cadence,
    // fulfillment, vendors, quality, customer service, safe interest
    // tracking, post-launch operations, and continuity. Every new
    // section is a copy-only builder — no Firestore writes, no AI
    // calls, no payment / checkout / inventory-decrement code.
    {
      id: 'operating-cadence',
      title: 'Operating cadence',
      lesson:
        'Operations is what happens *between* events. A weekly / monthly rhythm — short stand-up, restock check, vendor follow-up, customer follow-up — keeps Renni Inc. running so the next cohort inherits a company, not a single event.',
      universalChecklist: {
        enabled: true,
        kind: 'operating-cadence',
        title: 'Weekly / Monthly Operating Cadence',
        intro:
          'Each row = one recurring routine. Owner, cadence, dependency, done signal, backup, next review date.',
        copyTitle: 'Operating cadence',
        fields: ['owner', 'due', 'status', 'doneSignal', 'backup', 'nextStep']
      },
      studentPrompts: [
        'List the routines Renni Inc. runs every week (chief sync, restock check, customer follow-up).',
        'List the routines we run monthly (financial review, partner outreach, brand audit).',
        'For each, name the owner, cadence, and how we know it is done.'
      ],
      completionCriteria: [
        'Each routine has an owner + cadence + done signal.',
        'A backup person is named for any single-owner routine.'
      ]
    },
    {
      id: 'fulfillment-workflow',
      title: 'Fulfillment workflow',
      lesson:
        'How does a customer interest become a delivered product? Map the steps from order / interest to handoff: confirm, prepare, package, hand to customer, follow up. Renni Command Center does not process payments or run a checkout — Square is the external POS.',
      universalChecklist: {
        enabled: true,
        kind: 'fulfillment-workflow',
        title: 'Fulfillment Workflow Steps',
        intro:
          'Each row = one step from request to handoff. Owner, input, output, risk, backup, done signal.',
        copyTitle: 'Fulfillment workflow',
        fields: ['owner', 'materials', 'doneSignal', 'risk', 'backup', 'nextStep']
      },
      studentPrompts: [
        'Walk a customer through the steps from "I want this" to "I have this in my hand."',
        'For each step, name the owner, what they need (input), what they hand off (output), and the risk if it stalls.',
        'Add a backup person for any solo step.'
      ],
      completionCriteria: [
        'Steps cover the path from request → fulfilled → followed up.',
        'Each step has an owner + done signal + backup.',
        'No POS / payment / checkout / refund / tax behavior is implied — Square is external.'
      ]
    },
    {
      id: 'vendor-coordination',
      title: 'Vendor and partner coordination',
      lesson:
        'Vendors and partners (apparel printer, baker, school, TechTown organizers, Phoenix Nest contact) are the relationships Renni Inc. depends on. Track who, what, when, and the next contact so things do not slip through email threads.',
      universalTable: {
        enabled: true,
        kind: 'vendor-coordination',
        title: 'Vendor / Partner Tracker',
        intro:
          'One row per vendor or partner. Need, contact owner, next contact date, dependency, risk, status.',
        copyTitle: 'Vendor / partner coordination',
        columns: [
          { key: 'partner', label: 'Vendor / partner', type: 'text', placeholder: 'apparel printer · baker · school · TechTown · Phoenix Nest', wide: true },
          { key: 'need', label: 'What we need from them', type: 'textarea', placeholder: 'product · venue · approval', wide: true },
          { key: 'owner', label: 'Contact owner', type: 'text', placeholder: 'role / name' },
          { key: 'nextContact', label: 'Next contact', type: 'text', placeholder: 'date / trigger' },
          { key: 'dependency', label: 'Dependency', type: 'text', placeholder: 'what blocks them or us', wide: true },
          { key: 'risk', label: 'Risk', type: 'text', placeholder: 'what could go wrong', wide: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'In progress', 'At risk', 'Blocked', 'Not started'] }
        ],
        starterRowCount: 3
      },
      studentPrompts: [
        'List the vendors / partners Renni Inc. depends on.',
        'For each, name the contact owner, the next contact date, and what we need.',
        'Mark status honestly. "In progress" means a real next step exists.'
      ],
      completionCriteria: [
        'Each vendor/partner has owner + next contact + status.',
        'At-risk and blocked entries name the blocker.'
      ]
    },
    {
      id: 'quality-control',
      title: 'Quality control',
      lesson:
        'Quality control is what stops a customer from getting a sweatshirt with a bad print or a baked good with the wrong allergen note. Define the checks Renni Inc. runs, who runs them, and what counts as "good enough."',
      universalChecklist: {
        enabled: true,
        kind: 'quality-control',
        title: 'Quality Control Checklist',
        intro:
          'Each row = one quality check. Standard, owner, when checked, issue found (if any), fix, done signal.',
        copyTitle: 'Quality control',
        fields: ['owner', 'due', 'status', 'doneSignal', 'risk']
      },
      studentPrompts: [
        'List the quality checks Renni Inc. runs (print quality, packaging, allergen labels, signage, table setup).',
        'For each, name the standard ("good enough" definition), the owner, and when it gets checked.',
        'Add the fix path when a check fails.'
      ],
      completionCriteria: [
        'Each check has a standard + owner + when checked.',
        'A failure path / fix is named for each check.',
        'Baked-goods checks reference the existing food-safety SOP, not new legal claims.'
      ]
    },
    {
      id: 'customer-service-issues',
      title: 'Customer service and issue tracking',
      lesson:
        'Customers will tell us what is wrong (or not buy). Operations needs a place to log issues, decide who responds, and pull the lesson into the next round. Issue tracking is not a refund engine — Renni Command Center never processes payments or refunds.',
      universalTable: {
        enabled: true,
        kind: 'customer-service-issues',
        title: 'Customer Issue Tracker',
        intro:
          'One row per issue or complaint. Customer impact, owner, response, fix, lesson, status.',
        copyTitle: 'Customer service / issue tracking',
        columns: [
          { key: 'issueType', label: 'Issue type', type: 'select', options: ['Quality', 'Sizing', 'Wait time', 'Communication', 'Pricing concern', 'Other'] },
          { key: 'customerImpact', label: 'Customer impact', type: 'textarea', placeholder: 'what the customer experienced', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'response', label: 'Response', type: 'textarea', placeholder: 'what the team said / did', wide: true },
          { key: 'fix', label: 'Fix', type: 'textarea', placeholder: 'what changed so it does not happen again', wide: true },
          { key: 'lesson', label: 'Lesson', type: 'text', placeholder: 'one-line takeaway', wide: true },
          { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In progress', 'Resolved', 'Pending'] }
        ],
        starterRowCount: 2
      },
      studentPrompts: [
        'List any customer complaints or issues from past events or test interactions.',
        'For each, name the owner who responded, what we said / did, and the fix.',
        'Capture the lesson so the next cohort does not repeat it.'
      ],
      completionCriteria: [
        'Each issue has owner + response + fix + lesson.',
        'No refund / payment / checkout language — Square handles all transactions externally.'
      ]
    },
    {
      id: 'interest-tracking',
      title: 'Safe interest tracking',
      lesson:
        'Sometimes a customer wants something we do not have on hand — a different size, a future product, a Phoenix Nest carry note. Track non-sensitive interest so the team can follow up, without turning Renni Command Center into a checkout, payment, refund, tax, or order-processing system. Square remains the external POS for any actual transaction.',
      universalTable: {
        enabled: true,
        kind: 'interest-tracking',
        title: 'Safe Interest Tracker',
        intro:
          'One row per non-transactional interest signal. Customer type, product interest, question / need, follow-up owner, evidence source, next step, privacy note.',
        copyTitle: 'Safe interest tracking',
        columns: [
          { key: 'customerType', label: 'Customer type', type: 'text', placeholder: 'archetype or short description', wide: true },
          { key: 'productInterest', label: 'Product interest', type: 'text', placeholder: 'what they asked about', wide: true },
          { key: 'questionNeed', label: 'Question or need', type: 'textarea', placeholder: 'their actual ask', wide: true },
          { key: 'followUpOwner', label: 'Follow-up owner', type: 'text', placeholder: 'role / name' },
          { key: 'evidenceSource', label: 'Evidence source', type: 'text', placeholder: 'event / email / conversation', wide: true },
          { key: 'nextStep', label: 'Next step', type: 'text', placeholder: 'what we will do', wide: true },
          { key: 'privacyNote', label: 'Privacy note', type: 'text', placeholder: 'no payment / no PII beyond name + need', wide: true }
        ],
        starterRowCount: 2,
        evidencePrompt:
          'This is not checkout, payment, refund, tax, or order-processing software. Use it only to track non-sensitive interest, questions, and follow-up needs. Square is the external POS for any actual transaction.'
      },
      studentPrompts: [
        'List people who told us they were interested but did not (or could not) buy.',
        'For each, name the customer type, what they asked about, and the follow-up.',
        'Keep the data non-sensitive — name + need, never payment info or PII beyond contact preference.'
      ],
      completionCriteria: [
        'Each row has customer type + interest + follow-up owner + next step.',
        'No payment / order / refund / tax data appears in the tracker.',
        'Privacy note is set on every row.'
      ]
    },
    {
      id: 'post-launch-operations',
      title: 'Post-launch operations',
      lesson:
        'After the pop-up: what worked, what broke, what we should do differently. This is not the marketing recap — it is the operating recap that tells next cohort which routines, vendors, and SOPs to keep, change, or kill.',
      strategyMemo: {
        enabled: true,
        kind: 'lesson',
        title: 'Post-Launch Operations Memo',
        intro:
          'One card per operating lesson from the launch. Insight, evidence, recommendation, owner, dependency, definition of done, next validation, risk.',
        copyTitle: 'Post-launch operations',
        cardCount: 4,
        fields: ['insight', 'evidence', 'recommendation', 'owner', 'dependency', 'definitionOfDone', 'nextValidation', 'risk']
      },
      studentPrompts: [
        'Three operating lessons from the launch — keep, change, or kill?',
        'For each, cite the evidence (numbers, observations, customer quotes).',
        'Name the owner who will act on the recommendation and what proves it is done.'
      ],
      completionCriteria: [
        'At least three lessons are evidenced (numbers / quotes / observation), not opinion.',
        'Each lesson has owner + recommendation + definition of done.'
      ]
    },
    {
      id: 'operating-handoff',
      title: 'Operating handoff and continuity',
      lesson:
        'The next cohort needs to inherit a running operating system, not just an inventory list. Document the operating knowledge: cadence schedules, vendor contacts, quality standards, issue patterns, follow-up tracker, and where to find each system.',
      universalChecklist: {
        enabled: true,
        kind: 'operating-handoff',
        title: 'Operating Handoff Checklist',
        intro:
          'Each row = one operating asset or knowledge package the next cohort inherits. Owner, where it lives, next-cohort action, risk if lost, done signal.',
        copyTitle: 'Operating handoff',
        fields: ['owner', 'due', 'status', 'doneSignal', 'risk', 'nextStep']
      },
      studentPrompts: [
        'List the operating knowledge the next cohort needs to inherit (cadence schedules, vendor contacts, quality standards, issue tracker, follow-up tracker).',
        'For each, name the owner, where it lives, and what next cohort should do in week one.',
        'Mark the risk if any of these is lost or unclear.'
      ],
      completionCriteria: [
        'Each operating asset has owner + location + next-cohort action.',
        'Risk-if-lost is named for at least the cadence schedule, vendor list, and quality standards.'
      ]
    }
  ],
  requirements: [
    {
      id: 'ops-inventory-count',
      label: 'Live inventory count per product',
      description:
        'Physical count confirmed against /pricing planned quantity for every product.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      suggestedTaskTitle: 'Collect pop-up inventory counts',
      definitionOfDone:
        'Every product has a counted inventory number; any gap to planned quantity has an owned closure plan.'
    },
    {
      id: 'ops-day-sop',
      label: 'Pop-up day SOP',
      description:
        'Step-by-step setup, selling, and pack-out procedure for TechTown pop-up day.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      evidenceType: 'sop-document',
      suggestedTaskTitle: 'Draft pop-up day SOP',
      definitionOfDone:
        'SOP document linked from the deliverable; COO sign-off recorded.'
    },
    {
      id: 'ops-baked-sop',
      label: 'Baked goods handling SOP',
      description:
        'Food-safety SOP covering allergens, labeling, hold-time, and display for Humble Oven items.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 9,
      suggestedTaskTitle: 'Draft baked goods handling SOP'
    },
    {
      id: 'ops-continuity-note',
      label: 'Continuity note for next cohort',
      description:
        'What surprised this cohort; top-thing-to-know; where files/contacts/credentials live.',
      requiredForApproval: false,
      department: 'operations',
      playbookChapter: 9
    }
  ],
  suggestedTasks: [
    {
      title: 'Collect pop-up inventory counts',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-inventory-count',
      definitionOfDone:
        'Inventory counts saved with gap-closure plan per product.',
      dueOffsetDays: 5
    },
    {
      title: 'Draft pop-up day SOP',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-day-sop',
      definitionOfDone:
        'SOP document drafted; every 30-minute block has a named owner.',
      dueOffsetDays: 7
    },
    {
      title: 'Draft baked goods handling SOP',
      department: 'operations',
      ownerRole: 'member',
      requirementId: 'ops-baked-sop',
      definitionOfDone:
        'Allergen list, ingredient list per item, and hold-window plan documented.',
      dueOffsetDays: 6
    },
    {
      title: 'Write continuity note',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'ops-continuity-note',
      definitionOfDone:
        'Continuity note covers surprises, top-thing-to-know, and asset locations.',
      dueOffsetDays: 9
    }
  ],
  requiredEvidence: [
    {
      id: 'inventory-sheet',
      label: 'Inventory count sheet',
      description: 'Per-product counts with planned-vs-actual variance.',
      required: true
    },
    {
      id: 'sop-doc',
      label: 'SOP document',
      description: 'Pop-up day SOP linked from the deliverable.',
      required: true
    },
    {
      id: 'allergen-labels',
      label: 'Allergen + ingredient labels',
      description: 'Ready-to-print labels for every baked item.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest steps you might have missed after you write a first SOP.',
      'Help format or tighten an SOP for readability.',
      'Surface food-safety questions you should ask an instructor.'
    ],
    disallowedHelp: [
      'Inventing inventory numbers you have not counted.',
      'Writing the full SOP from scratch — you know the team and the venue.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
