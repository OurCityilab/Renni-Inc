import type { TemplateStudio } from '~/types/templateStudio'

export const strategyNextSemester: TemplateStudio = {
  title: 'Strategy and Next-Semester Recommendations',
  purpose:
    'Turn TechTown outcomes, customer feedback, operational lessons, and unresolved questions into a practical next-semester strategy that the next cohort can pick up and run.',
  learningObjective:
    'Translate "what happened" into "what we recommend doing next" — a strategic action plan grounded in actual results, not just opinions.',
  whyItMatters:
    'Without a strategy chapter, every cohort starts from scratch. With one, the next cohort gets a head start on what to keep, what to change, and what to retire. This is the chapter that turns Renni Inc. from a one-time project into a sustained company.',
  finalOutput:
    'A strategy chapter naming the lessons of the launch, the customer/sales insights worth keeping, the operational lessons, the brand and product priorities, the next-semester goals, the open risks, and a recommended action plan with owners and timing.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'what-we-learned',
      title: 'What we learned from the launch',
      lesson:
        'The honest version, not the press release. Name the 5–7 biggest lessons of the cohort — what worked, what surprised the team, what failed.',
      strategyMemo: {
        enabled: true,
        kind: 'lesson',
        title: 'Launch Lessons Memo',
        intro: '5–7 cards. Each lesson is honest, evidenced, and actionable. Recommendation = what to keep, change, or kill.',
        copyTitle: 'What we learned from the launch',
        cardCount: 5,
        fields: ['insight', 'evidence', 'recommendation', 'owner', 'risk']
      },
      studentPrompts: [
        'List 5–7 lessons from launch — be specific about which decision or moment taught it.',
        'For each lesson, mark whether it confirmed an assumption or broke one.',
        'Avoid generic lessons that could apply to any project ("we learned to communicate better"). Pick ones tied to a real moment.'
      ],
      requiredInputs: ['5–7 lessons', 'Confirmed/broke-an-assumption tag per lesson'],
      completionCriteria: [
        'Lessons are concrete and traceable to a moment.',
        'A reader can act on each lesson, not just nod at it.'
      ],
      expertGuidance: {
        expertRole: 'operator preparing the next cohort',
        whyThisMatters:
          'Most "lessons learned" pages are forgotten because they read as essays. Lessons tied to a specific moment + a "confirmed / broke an assumption" tag turn into operating muscle the next cohort actually uses.',
        whatToGather: [
          '5–7 lessons tied to a specific moment, decision, or vendor interaction.',
          'Per lesson: did this confirm an assumption (so we keep doing X) or break one (so we change X)?',
          'For each lesson, the chief who would inherit it.'
        ],
        weakAnswerLooksLike: '"We learned to communicate better." — generic, no moment, no action.',
        strongAnswerLooksLike: '"April 19 vendor quote arrived 3 days late and caught us with no buffer — broke our assumption that vendors confirm same-week. Action: 1-week buffer in next cohort\'s timeline. Owner: COO."',
        expertPushback: ['Could a stranger read this and act on it?', 'Have you confused observations with lessons?'],
        commonMistakes: ['Generic life-lesson language.', 'Missing the "confirmed / broke" tag.'],
        decisionSupported: 'What the next cohort changes vs what they keep.',
        connectsTo: ['Chapter 13 — decision log', 'Chapter 3 — continuity'],
        ownerHint: 'Chief Strategy and Growth Officer · Co-CEO sign-off',
        doneLooksLike: 'Each lesson has a moment, a tag, and a chief.'
      }
    },
    {
      id: 'customer-and-sales-insights',
      title: 'Customer and sales insights',
      lesson:
        'Pull the actual customer data — feedback, sales data, donation patterns, observed behavior at the table — and turn it into 3–5 insights that should shape next semester.',
      strategyMemo: {
        enabled: true,
        kind: 'insight',
        title: 'Customer & Sales Insights Memo',
        intro: '3–5 insights tied to evidence. Each card: insight, evidence (number or quote), recommendation, next validation.',
        copyTitle: 'Customer and sales insights',
        cardCount: 4,
        fields: ['insight', 'evidence', 'recommendation', 'nextValidation', 'risk']
      },
      studentPrompts: [
        'What did customers actually say or do at the pop-up that surprised the team?',
        'Which products sold faster than expected and why? Which ones lagged?',
        'What does this say about who Renni Inc. should target next semester?'
      ],
      completionCriteria: [
        'Three to five customer/sales insights are written and tied to evidence.',
        'Implications for next semester are spelled out.'
      ],
      evidencePrompt:
        'Each insight should be a structured evidence entry — claim, evidence, source (/revenue, customer feedback, observation), confidence, risk, next validation.',
      sourceGuidance: [
        'Pull numbers from /revenue and the post-event recap; do not invent figures.',
        'If an insight is one cohort\'s opinion, label it as such with confidence.'
      ],
      expertGuidance: {
        expertRole: 'Chief Strategy and Growth Officer / customer researcher',
        whyThisMatters:
          'Real customer + sales data is the most defensible thing the team has post-launch. Insights without it become opinion. The next cohort needs honest signal, not a victory lap.',
        whatToGather: [
          'Customer-conversation observations from the table (what surprised the team).',
          'Sales-by-SKU data from /revenue (what sold faster / slower than expected).',
          'Donation patterns (separate from product sales).',
          '3–5 insights with structured-evidence backing.'
        ],
        weakAnswerLooksLike: '"Beanies sold well." — no number, no comparison.',
        strongAnswerLooksLike: '"Beanies sold 28 units (90% of base scenario) by 1pm vs. t-shirts at 12 (60% of base). Insight: at $25, beanies hit a price-elasticity sweet spot for the Civic Premium Buyer segment. Confidence: medium (one cohort)."',
        expertPushback: ['What did customers say that contradicted what the team expected?', 'Are insights tied to /revenue or to memory?'],
        commonMistakes: ['Insights stated as facts without confidence.', 'Skipping donation patterns because they\'re smaller.'],
        decisionSupported: 'Which next-semester product / pricing / campaign decisions are evidence-backed.',
        connectsTo: ['Chapter 7 — segment composer', 'Chapter 8 — pricing strategy', '/revenue'],
        ownerHint: 'Chief Strategy and Growth Officer',
        doneLooksLike: '3–5 insights, each tied to a number or quote, each with confidence and an implication.'
      }
    },
    {
      id: 'operational-lessons',
      title: 'Operational lessons',
      lesson:
        'The COO\'s view: which SOPs held up under pop-up pressure, which broke, and what the next cohort should change. Include staffing, inventory, baked-goods handling, handoff.',
      universalChecklist: {
        enabled: true,
        kind: 'operational-lessons',
        title: 'Operational Lessons Checklist',
        intro: 'Each row = one operational lesson. Owner of the change, what next cohort should do, done signal.',
        copyTitle: 'Operational lessons',
        fields: ['owner', 'status', 'doneSignal', 'nextStep']
      },
      studentPrompts: [
        'Which SOP saved the team time? Which one cost the team time?',
        'What was the biggest day-of operational surprise?',
        'What three operational changes would you make first next semester?'
      ],
      completionCriteria: [
        'At least three operational lessons named with concrete recommendations.',
        'Recommendations are specific enough to act on without re-debating.'
      ],
      expertGuidance: {
        expertRole: 'COO',
        whyThisMatters:
          'Operations is where launches succeed or fail. The next cohort cares less about strategy and more about which SOPs to keep, change, or cut.',
        whatToGather: [
          'SOPs that held up under pop-up pressure (keep).',
          'SOPs that broke (change, with a specific recommendation).',
          'Day-of operational surprises (the ones nobody planned for).',
          'Top 3 changes the next cohort should make first.'
        ],
        weakAnswerLooksLike: '"Operations went mostly fine." — no detail.',
        strongAnswerLooksLike: '"Cash reconciliation took 35 minutes — change to dual-counter SOP next cohort. Square offline for 8 minutes at 11:15 — keep paper backup ready. Bake-list timing held."',
        expertPushback: ['What broke that nobody predicted?', 'Which SOP would the team copy as-is for the next pop-up?'],
        commonMistakes: ['Praise ops generally without specifics.', 'Missing the surprises (the most useful lessons).'],
        decisionSupported: 'What ops the next cohort inherits vs. rewrites.',
        connectsTo: ['Chapter 9 — operations readiness'],
        ownerHint: 'COO',
        doneLooksLike: '3+ operational lessons, each with a concrete next-cohort change.'
      }
    },
    {
      id: 'brand-and-product-priorities',
      title: 'Brand and product priorities',
      lesson:
        'What stays, what evolves, what retires. Clear product and brand priorities prevent next cohort from rebuilding the lineup from scratch.',
      strategyMemo: {
        enabled: true,
        kind: 'priority',
        title: 'Brand & Product Priorities Memo',
        intro: 'One card per priority: what stays / evolves / retires. Recommendation must be specific enough to act on.',
        copyTitle: 'Brand and product priorities',
        cardCount: 4,
        fields: ['insight', 'recommendation', 'owner', 'risk', 'nextValidation']
      },
      studentPrompts: [
        'Which products keep their slot next semester?',
        'Which products need a redesign, repackage, or repricing?',
        'Which products should retire, and why?',
        'For House Phoenix and each supporting brand, name one priority direction.'
      ],
      completionCriteria: [
        'Every current product has a keep / change / retire recommendation.',
        'Each brand (House Phoenix + supporting) has a priority direction.'
      ],
      expertGuidance: {
        expertRole: 'merchandising / brand portfolio operator',
        whyThisMatters:
          'The next cohort will rebuild the lineup from scratch unless this section explicitly says "keep this, change this, retire this." That rebuild costs them a month.',
        whatToGather: [
          'For each current SKU: keep, change (redesign / repackage / reprice), or retire.',
          'For each brand (House Phoenix + supporting): a one-line priority direction.',
          'Evidence: sales data + customer feedback that supports the call.'
        ],
        weakAnswerLooksLike: '"Beanies are good, t-shirts could be better." — no decision, no evidence.',
        strongAnswerLooksLike: '"Beanies KEEP at $25 (sold through). T-shirts CHANGE — redesign neckline before next pop-up (3 customer complaints). Brownies RETIRE — under-sold, food-safety load too high."',
        expertPushback: ['Are any retire decisions sentimental rather than evidence-backed?', 'Did any product earn its keep beyond first-cohort momentum?'],
        commonMistakes: ['Vague "improve" language.', 'No retire calls (every product survives).'],
        decisionSupported: 'Lineup the next cohort starts with.',
        connectsTo: ['Chapter 7 — current product line', 'Chapter 8 — pricing strategy'],
        ownerHint: 'CMO · Co-CEO sign-off',
        doneLooksLike: 'Every product has a verb attached (keep / change / retire) with a one-line reason.'
      }
    },
    {
      id: 'next-semester-goals',
      title: 'Next-semester goals',
      lesson:
        'A short list of measurable goals — three to five — for the next cohort. These should be ambitious but defensible against the actual results of this semester.',
      universalTable: {
        enabled: true,
        kind: 'next-semester-goals',
        title: 'Next-Semester Goals Table',
        intro: 'Each row = one measurable goal. Metric, target, owner, baseline from this cohort.',
        copyTitle: 'Next-semester goals',
        columns: [
          { key: 'goal', label: 'Goal', type: 'text', placeholder: 'one short headline', wide: true },
          { key: 'metric', label: 'Metric', type: 'text', placeholder: 'gross revenue · units · segments validated' },
          { key: 'target', label: 'Target', type: 'text', placeholder: 'e.g. $X,XXX or 25%' },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'CFO · CMO · CSGO · COO' },
          { key: 'baseline', label: 'Baseline (this cohort)', type: 'text', placeholder: 'the actual number this cohort hit', wide: true },
          { key: 'confidence', label: 'Confidence', type: 'select', options: ['Low', 'Medium', 'High'] }
        ],
        starterRowCount: 3
      },
      studentPrompts: [
        'List 3–5 next-semester goals tied to measurable outcomes.',
        'For each goal, name the metric and the rough target.',
        'Note which department owns which goal.'
      ],
      requiredInputs: ['3–5 goals', 'Metric and target per goal', 'Owner department per goal'],
      completionCriteria: [
        'Goals are measurable and have owners.',
        'Targets are defended by the data in this chapter.'
      ],
      evidencePrompt:
        'Each goal should be a structured evidence entry — claim (the goal), evidence (this cohort\'s baseline number), source (/revenue · post-event recap), confidence, risk if missed, next validation step.',
      sourceGuidance: [
        'Pull baselines from /revenue and Ch. 8 actuals; do not invent the prior number.',
        'If a target is aspirational without baseline, mark confidence low.'
      ],
      expertGuidance: {
        expertRole: 'strategy operator / Co-CEO',
        whyThisMatters:
          'A goal without a metric is a wish. The next cohort needs measurable, owner-tagged goals so they can tell at month two whether they\'re on track.',
        whatToGather: [
          '3–5 goals tied to a specific metric (revenue, units sold, segments validated, carry pitches).',
          'Rough target per goal, defended by this cohort\'s actuals.',
          'Owner department per goal.'
        ],
        weakAnswerLooksLike: '"Grow the brand and sell more." — no metric.',
        strongAnswerLooksLike: '"Grow gross revenue 25% over this cohort\'s baseline ($X,XXX) — owner CFO. Validate Civic Premium Buyer segment at $100 with 20+ direct customer signals — owner CSGO."',
        expertPushback: ['Are these targets defensible against this semester\'s data?', 'Are any goals so vague no one could fail at them?'],
        commonMistakes: ['Aspirational percentages without baseline.', 'Goals with no department owner.'],
        decisionSupported: 'How the next cohort spends time and prioritizes work.',
        connectsTo: ['Chapter 1 — executive summary', 'Chapter 13 — decision log'],
        ownerHint: 'Chief Strategy and Growth Officer · Co-CEO sign-off',
        doneLooksLike: '3–5 goals, each with metric + target + owner.'
      }
    },
    {
      id: 'risks-and-open-questions',
      title: 'Risks and open questions',
      lesson:
        'Strategy without risks is wishful thinking. Name the things that could derail next semester and the questions the team did not have time to answer.',
      universalTable: {
        enabled: true,
        kind: 'risks-and-open-questions',
        title: 'Risks & Open Questions Table',
        intro: 'One row per risk OR open question. Type, response option, owner.',
        copyTitle: 'Risks and open questions',
        columns: [
          { key: 'item', label: 'Risk or question', type: 'textarea', placeholder: 'state it as a risk or as a real question', wide: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Risk', 'Open question'] },
          { key: 'response', label: 'Response / experiment', type: 'textarea', placeholder: 'one-line plan', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'List 2–4 strategic risks for next semester.',
        'For each one, write a one-line response option.',
        'List 2–4 open questions that need experimentation, not just opinion.'
      ],
      completionCriteria: [
        'Risks are real and not just rephrased lessons.',
        'Open questions are framed as questions, not declarations.'
      ],
      expertGuidance: {
        expertRole: 'CFO / risk operator',
        whyThisMatters:
          'Strategy without risks is wishful thinking. The cohorts that survive name the things that could derail them honestly.',
        whatToGather: [
          '2–4 strategic risks for next semester (vendor concentration, pricing acceptance, leadership turnover).',
          'A one-line response option per risk.',
          '2–4 open questions framed as questions, not declarations.'
        ],
        weakAnswerLooksLike: '"We might run out of time again." — soft risk, no response.',
        strongAnswerLooksLike: '"Risk: vendor X is the only print partner — single point of failure. Response: source 2nd vendor in week 2. Open question: would Phoenix Nest carry pitch survive an alumni-only segment?"',
        expertPushback: ['Are any of these risks the same as last cohort\'s?', 'Have you confused risks with lessons?'],
        commonMistakes: ['Restating lessons as risks.', 'Open questions written as statements.'],
        decisionSupported: 'What the next cohort experiments on early.',
        connectsTo: ['Chapter 1 — executive summary risks', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs · CFO support',
        doneLooksLike: 'Each risk has a response; each open question is a real question.'
      }
    },
    {
      id: 'recommended-action-plan',
      title: 'Recommended action plan',
      lesson:
        'Close the chapter with a concrete first-90-days action plan for the next cohort: who does what, in roughly what order, with rough timing.',
      strategyMemo: {
        enabled: true,
        kind: 'action-plan',
        title: 'First-90-Days Action Plan',
        intro: '6–10 sequenced actions. Each card: insight (why it matters), recommendation, owner, due, dependency, definition of done.',
        copyTitle: 'Recommended action plan',
        cardCount: 6,
        fields: ['insight', 'recommendation', 'owner', 'dueDate', 'dependency', 'definitionOfDone']
      },
      studentPrompts: [
        'List 6–10 next-cohort actions in order, with owners and rough timing.',
        'Mark which actions are sequencing-critical (must come first).',
        'Note which actions depend on a decision the next cohort still has to make.'
      ],
      completionCriteria: [
        'Action plan is sequenced with owners and rough timing.',
        'Sequencing-critical actions are flagged.'
      ],
      evidencePrompt:
        'For any action that depends on a number (cohort size, vendor lead time, expected reach), add a structured evidence entry naming the source, the assumption, and the next validation step.',
      sourceGuidance: [
        'Cite Ch. 3 (next-cohort first 30 days), /revenue, and the post-event recap rather than asserting timing from memory.',
        'If timing is a guess, mark confidence low and name what would make it certain.'
      ],
      expertGuidance: {
        expertRole: 'strategy operator (preparing next cohort)',
        whyThisMatters:
          'Closing with a 90-day action plan turns the chapter into a real handoff. Without it, the next cohort gets opinions but no timeline.',
        whatToGather: [
          '6–10 actions in sequenced order with rough timing (week 1 / month 1 / month 2 / month 3).',
          'Owner per action.',
          'Sequencing-critical flag where order matters (segment work before pricing before campaign).',
          'Decisions that next cohort still has to make before acting.'
        ],
        weakAnswerLooksLike: '"Plan the next pop-up, work on the brand, talk to vendors." — no order, no owners.',
        strongAnswerLooksLike: 'A sequenced list with rough weeks/months, owner per item, sequencing-critical flags, and explicit "next cohort decides X first" notes.',
        expertPushback: ['Could the next cohort start week one without you in the room?', 'What order is the team most likely to break?'],
        commonMistakes: ['Action plans without owners.', 'Skipping the "they have to decide X first" notes.'],
        decisionSupported: 'How the next cohort sequences the first 90 days.',
        connectsTo: ['Chapter 3 — company structure & continuity (next-cohort first 30 days)'],
        ownerHint: 'Chief Strategy and Growth Officer · Co-CEO sign-off',
        doneLooksLike: 'A sequenced 6–10-step plan a new cohort could execute on day one without you.'
      }
    }
  ],
  requirements: [
    {
      id: 'strategy-lessons-from-launch',
      label: 'Lessons from the launch are written',
      description:
        '5–7 concrete lessons tied to specific moments, with confirmed/broke-an-assumption tags.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      suggestedTaskTitle: 'Draft lessons and strategic priorities',
      definitionOfDone:
        'CSGO drafts lessons and confirms each one is traceable to a real moment.'
    },
    {
      id: 'strategy-customer-sales-insights',
      label: 'Customer and sales insights with evidence',
      description:
        '3–5 insights pulled from feedback, observation, and sales/donation data.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add marketing/customer lessons',
      definitionOfDone:
        'CMO and CSGO confirm each insight is grounded in evidence and points to a next-semester implication.'
    },
    {
      id: 'strategy-operational-lessons',
      label: 'Operational lessons captured',
      description:
        'At least three operational lessons with concrete next-semester recommendations.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add operational lessons',
      definitionOfDone:
        'COO writes operational lessons that are specific enough to act on.'
    },
    {
      id: 'strategy-brand-product-priorities',
      label: 'Brand and product priorities documented',
      description:
        'Every current product has a keep/change/retire recommendation; each brand has a priority direction.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      definitionOfDone:
        'Recommendations cover every current product and every brand in the family.'
    },
    {
      id: 'strategy-next-semester-goals',
      label: '3–5 next-semester goals with metrics and owners',
      description:
        'Goals are measurable, ambitious-but-defensible, and assigned to a department.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 12,
      suggestedTaskTitle: 'Add finance/revenue lessons',
      definitionOfDone:
        'CFO confirms metrics and targets are achievable based on this semester\'s data.'
    },
    {
      id: 'strategy-risks-open-questions',
      label: 'Risks and open questions named',
      description:
        '2–4 strategic risks with response options and 2–4 open questions framed as questions.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 12,
      definitionOfDone:
        'Risks and open questions are real and survive a Co-CEO review.'
    },
    {
      id: 'strategy-action-plan',
      label: 'First-90-days action plan written',
      description:
        '6–10 sequenced actions with owners, rough timing, and sequencing-critical flags.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 12,
      definitionOfDone:
        'Co-CEO and admin confirm the action plan is actionable on the next cohort\'s day one.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft lessons and strategic priorities',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-lessons-from-launch',
      definitionOfDone:
        'CSGO drafts the lessons section and the brand/product priorities.',
      dueOffsetDays: 3
    },
    {
      title: 'Add operational lessons',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'strategy-operational-lessons',
      definitionOfDone:
        'COO writes operational lessons and three concrete recommendations.',
      dueOffsetDays: 4
    },
    {
      title: 'Draft next-semester goals with finance support',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-next-semester-goals',
      definitionOfDone:
        'CSGO drafts measurable next-semester goals; CFO confirms metric logic and targets are defensible.',
      dueOffsetDays: 4
    },
    {
      title: 'Draft customer and sales insights',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-customer-sales-insights',
      definitionOfDone:
        'CSGO writes customer and sales insights from evidence; CMO reviews customer-facing language and brand implications.',
      dueOffsetDays: 4
    },
    {
      title: 'Draft brand and product priorities',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-brand-product-priorities',
      definitionOfDone:
        'CSGO recommends keep/change/retire calls for current products and priority directions for every brand.',
      dueOffsetDays: 5
    },
    {
      title: 'Frame risks and open questions',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'strategy-risks-open-questions',
      definitionOfDone:
        'CSGO names the strategic risks and open questions, then routes them to Co-CEO for coherence review.',
      dueOffsetDays: 5
    },
    {
      title: 'Final strategy and next-semester review',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'strategy-action-plan',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end, confirm the action plan is actionable.',
      dueOffsetDays: 7
    }
  ],
  requiredEvidence: [
    {
      id: 'strategy-techtown-results',
      label: 'TechTown pop-up results',
      description:
        'Sales summary, donation totals, and any pop-up day notes.',
      required: true
    },
    {
      id: 'strategy-revenue-summary',
      label: 'Revenue / donation summary',
      description:
        'Final /revenue snapshot or summary used to back the goals.',
      required: true
    },
    {
      id: 'strategy-customer-feedback',
      label: 'Customer feedback',
      description:
        'Notes or quotes from customers at the pop-up or after.',
      required: true
    },
    {
      id: 'strategy-task-closeout',
      label: 'Workbench / task closeout notes',
      description:
        'Closeout notes from the Workbench so the next cohort can see what got done and what was deferred.',
      required: false
    },
    {
      id: 'strategy-department-handoffs',
      label: 'Department handoff notes',
      description:
        'Per-department handoff snapshots feeding the strategy chapter.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a lesson or recommendation for vagueness after the team drafts it.',
      'Ask clarifying questions when an insight lacks evidence.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing lessons, customer quotes, or recommendations the team did not arrive at.',
      'Choosing the next-semester goals.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
