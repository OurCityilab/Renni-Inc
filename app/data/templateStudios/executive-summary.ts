import type { TemplateStudio } from '~/types/templateStudio'

export const executiveSummary: TemplateStudio = {
  title: 'Executive Summary',
  purpose:
    'Tell the Renni Inc. and House Phoenix story in one short, clear summary that a teacher, a buyer, or the next cohort can read in two minutes and understand what is being built and why.',
  learningObjective:
    'Summarize a company for stakeholders without overexplaining — name the company, the launch, the artifact, the pitch, the products, the risks, and the next actions.',
  whyItMatters:
    'The executive summary is the first page of the Brand & Operations Playbook. Phoenix Nest buyers, teachers, and the next cohort start here. If this section is vague, everything downstream loses credibility — even if the rest of the work is strong.',
  finalOutput:
    'A one-page executive summary that names Renni Inc. and House Phoenix, explains the TechTown pop-up and the Phoenix Nest pitch, lists current products, and ends with risks and next actions before launch.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'company-overview',
      title: 'What is Renni Inc. and House Phoenix?',
      lesson:
        'Open by naming the parent company and the launch brand. Stakeholders need to know in one paragraph who you are and what you make.',
      example:
        'Renni Inc. is a student-led company at Renaissance High School. Its first launch brand is House Phoenix, a Detroit-student-led merchandise brand built for the TechTown pop-up.',
      studentPrompts: [
        'Write one sentence that names Renni Inc. as the parent company.',
        'Write one sentence that introduces House Phoenix as the launch brand.',
        'Avoid jargon — a parent or teacher should follow it on the first read.'
      ],
      requiredInputs: ['Company sentence', 'Launch brand sentence'],
      completionCriteria: [
        'Renni Inc. is named as the parent company.',
        'House Phoenix is named as the primary launch brand.'
      ],
      expertGuidance: {
        expertRole: 'Co-CEO / strategy operator',
        whyThisMatters:
          'Investors, retailers, and reviewers decide whether to keep reading after this opening. If they cannot tell what Renni Inc. is and what House Phoenix sells in the first paragraph, the rest of the Playbook never lands.',
        whatToGather: [
          'Renni Inc. one-line legal-style description (high school student company at Renaissance, Detroit).',
          'House Phoenix one-line positioning (Detroit-student-led merchandise brand for the TechTown pop-up).',
          'Plain-English explanation a parent or buyer would understand on the first read.'
        ],
        whereToFindIt: [
          'Chapter 2 brand architecture (parent company + flagship + supporting brands).',
          'Chapter 5 House Phoenix Brand Story (audience, value prop, voice).',
          'Existing Playbook chapter intros if any cohort copy already exists.'
        ],
        weakAnswerLooksLike:
          '"Renni Inc. is a company. House Phoenix is one of its brands." — vague, unscoped, no audience or product reference.',
        strongAnswerLooksLike:
          '"Renni Inc. is the student-led parent company at Renaissance High School in Detroit. House Phoenix, our flagship launch brand, makes Detroit-made apparel for students, parents, alumni, and Detroit civic supporters; the team is preparing it for the TechTown pop-up on May 27."',
        expertPushback: [
          'If a parent reads only this paragraph, do they know what you sell?',
          'Does the launch brand feel different from the parent company, or are they used as synonyms?',
          'Is there a one-sentence answer to "why Renni, not just House Phoenix?"'
        ],
        commonMistakes: [
          'Using "Renni Inc." and "House Phoenix" as if they were the same thing.',
          'Adding paragraphs of context before naming what you actually sell.',
          'Forgetting to mention the school or the city.'
        ],
        decisionSupported:
          'Whether reviewers continue reading the rest of the Playbook.',
        connectsTo: [
          'Chapter 2 — Brand architecture',
          'Chapter 5 — House Phoenix Brand Story',
          'Final presentation cover slide'
        ],
        ownerHint: 'Co-CEOs',
        doneLooksLike:
          'A parent or buyer can answer "what is Renni Inc.?" and "what is House Phoenix?" after reading two sentences. Both names appear; the relationship between them is unambiguous.'
      }
    },
    {
      id: 'launch-focus',
      title: 'What are we launching, and where?',
      lesson:
        'The pop-up, the Playbook, and the Phoenix Nest pitch are three different deliverables — name each one so readers can tell them apart.',
      studentPrompts: [
        'Describe the TechTown pop-up in one or two sentences (when, where, who is it for).',
        'Describe the Brand & Operations Playbook — what it is and why the next cohort will use it.',
        'Describe the Phoenix Nest retail carry pitch in plain language.'
      ],
      requiredInputs: [
        'TechTown pop-up description',
        'Playbook description',
        'Phoenix Nest pitch description'
      ],
      completionCriteria: [
        'TechTown pop-up is named and explained.',
        'Brand & Operations Playbook is named and explained.',
        'Phoenix Nest retail carry pitch is named and explained.'
      ],
      expertGuidance: {
        expertRole: 'Co-CEO / strategy operator',
        whyThisMatters:
          'These are three different deliverables with three different audiences (event customers, the next cohort, retail buyers). Confusing them in the executive summary makes every downstream chapter sound vague. Reviewers have to be able to tell which is which.',
        whatToGather: [
          'TechTown pop-up date, location, audience (May 27 event facts).',
          'Brand & Operations Playbook scope (this document, what next cohort uses to start).',
          'Phoenix Nest retail carry pitch scope (the retail ask itself, not the pop-up).'
        ],
        whereToFindIt: [
          'TechTown logistics + the marketing/campaign chapter.',
          'The Playbook itself is what the team is writing — describe it for the next cohort, not yourselves.',
          'Chapter 11 Phoenix Nest carry pitch.'
        ],
        weakAnswerLooksLike:
          '"We are doing the pop-up and writing the Playbook." — collapses three deliverables into one and skips the buyer-facing pitch entirely.',
        strongAnswerLooksLike:
          'Three short paragraphs that name (a) the May 27 TechTown pop-up and what is sold there, (b) the Brand & Operations Playbook the next cohort inherits, (c) the Phoenix Nest retail carry pitch and the ask the team is making. A reader can tell which is which.',
        expertPushback: [
          'If TechTown rains, which of these three is still happening?',
          'Which deliverable is the team most behind on right now?',
          'If a Phoenix Nest buyer reads only this section, do they know what they are being pitched?'
        ],
        commonMistakes: [
          'Treating the Playbook as a school assignment rather than a real handoff document.',
          'Treating Phoenix Nest as the same thing as the pop-up.',
          'Skipping the Phoenix Nest pitch because no meeting is on the calendar yet.'
        ],
        decisionSupported:
          'Which deliverable each chapter actually serves.',
        connectsTo: [
          'Chapter 8 — pop-up revenue scenarios',
          'Chapter 10 — campaign/messaging',
          'Chapter 11 — Phoenix Nest carry pitch'
        ],
        ownerHint: 'Co-CEOs',
        doneLooksLike:
          'A reader can name the audience, date (where applicable), and ask of each deliverable in their own words.'
      }
    },
    {
      id: 'current-progress',
      title: 'What is currently in the lineup?',
      lesson:
        'List the products Renni Inc. is actually selling so the summary matches the pop-up. Donations sit alongside products but should be called out separately.',
      example:
        'Current pop-up lineup: House Phoenix beanies, sweatshirts, t-shirts, and Humble Oven baked goods. Donations are accepted at the table for community programs.',
      studentPrompts: [
        'Name every product on the current pop-up table: beanies, sweatshirts, t-shirts, baked goods.',
        'Name donations explicitly so readers know they are separate from product sales.',
        'If anything has changed since last week, say so — keep this current.'
      ],
      requiredInputs: ['Product list with donations called out separately'],
      completionCriteria: [
        'All five lineup items are named: beanies, sweatshirts, t-shirts, baked goods, donations.',
        'Donations are clearly separated from product sales.'
      ],
      expertGuidance: {
        expertRole: 'retail operator / merchandising lead',
        whyThisMatters:
          'A retail buyer or instructor checks whether the executive summary matches what is actually being sold. If the summary names a product the team is not making this cohort, every downstream pricing / inventory / campaign claim becomes suspect.',
        whatToGather: [
          'Confirmed pop-up SKU list from /pricing or Ch. 7 product line.',
          'Confirmed bake list (Humble Oven items) from Ch. 9 baked-goods SOP.',
          'Donation accept/decline policy and where donations sit at the table.'
        ],
        whereToFindIt: [
          '/pricing — actual seeded pricingScenarios (operational source of truth).',
          'Chapter 7 — current product line.',
          'Chapter 9 — operations readiness (inventory + bake list).'
        ],
        weakAnswerLooksLike:
          '"We sell merch and baked goods." — generic, skips the explicit lineup, mixes donations and products.',
        strongAnswerLooksLike:
          'A short list that names every actual SKU (House Phoenix beanies / sweatshirts / t-shirts plus Humble Oven baked goods), with donations called out as a separate revenue path. Matches /pricing.',
        expertPushback: [
          'Does the list match what is on /pricing today?',
          'If a baked good runs out at hour two, what does the team say to a customer who walks up?',
          'Are donations on the same line as product sales, or visually separate?'
        ],
        commonMistakes: [
          'Listing aspirational products that are not actually being made.',
          'Mixing donations into the product list, which double-counts revenue.',
          'Forgetting Humble Oven baked goods because they live in a different builder.'
        ],
        decisionSupported:
          'What the team can defensibly say about the pop-up lineup to a parent, instructor, or Phoenix Nest buyer.',
        connectsTo: [
          'Chapter 7 — current product line',
          'Chapter 8 — pricing strategy + revenue scenarios',
          '/pricing operational source of truth'
        ],
        ownerHint: 'Co-CEOs · COO support',
        doneLooksLike:
          'Lineup matches /pricing exactly. Donations are separated. A reviewer reading this section can predict the /pricing page contents.'
      }
    },
    {
      id: 'key-risks',
      title: 'What are the open questions or risks?',
      lesson:
        'A real executive summary names risks. Two or three is enough — pick the ones a buyer or teacher would actually want to know about.',
      studentPrompts: [
        'List 2–3 current risks or open questions (inventory, pricing, marketing, time).',
        'For each one, write a one-line explanation of why it matters.',
        'Do not over-promise — risks named honestly read as professional, not weak.'
      ],
      completionCriteria: [
        'Two or three risks are named.',
        'Each risk has a one-line explanation.'
      ],
      expertGuidance: {
        expertRole: 'CFO / risk lead',
        whyThisMatters:
          'Naming risks is what separates a real executive summary from a school project. Investors and buyers trust teams that show they know where they could fail. Hiding risk reads as inexperience.',
        whatToGather: [
          'Two or three highest-likelihood-or-impact risks (price acceptance, inventory miss, weather, vendor delay, time).',
          'For each risk: a one-line "why this matters" explanation.',
          'For each risk: who owns mitigating it (Co-CEO, CFO, CMO, COO, CSGO).'
        ],
        whereToFindIt: [
          'C-Suite Advisor cockpit (/c-suite-advisor) — Stuck + Action today signals.',
          'Intelligence Sync panel — what is missing right now.',
          'Open advisor signals on each chapter hub.'
        ],
        weakAnswerLooksLike:
          '"Our biggest risk is running out of time." — vague, generic, no mitigation owner, no follow-on.',
        strongAnswerLooksLike:
          'Two or three risks named with concrete handles: "Price acceptance is unproven at $100 (CFO + CSGO are running a preorder test before May 12). Inventory has not been counted twice (COO confirms by April 30). Weather contingency for May 27 (CMO drafts an indoor signage plan)."',
        expertPushback: [
          'Which of these risks could actually kill the launch, vs. just complicate it?',
          'For each named risk, who owns the mitigation, and what is the next concrete step?',
          'Are there any risks you are deliberately leaving out because they sound bad?'
        ],
        commonMistakes: [
          'Naming only soft risks (time, motivation) and skipping hard ones (margin, comp evidence, inventory).',
          'Listing risks without owners — leaves them as observations, not commitments.',
          'Adding risks to look thorough rather than because they actually matter.'
        ],
        decisionSupported:
          'Which risks the team will brief instructors and Phoenix Nest buyers on — vs. which they will pretend do not exist.',
        connectsTo: [
          'C-Suite Advisor cockpit',
          'Chapter 8 — pricing risk',
          'Chapter 9 — operations risk',
          'Chapter 11 — Phoenix Nest carry risk'
        ],
        ownerHint: 'Co-CEOs · CFO support',
        doneLooksLike:
          'Two or three named risks, each with an owner + a concrete next mitigation step. A reviewer asks "what could go wrong?" and gets a clear answer.'
      }
    },
    {
      id: 'next-steps',
      title: 'What happens next before launch?',
      lesson:
        'Close the summary with concrete next actions. This is what the team is doing this week — not aspirations.',
      studentPrompts: [
        'List the 3–5 next actions before TechTown.',
        'Name who owns each one (Co-CEO, CMO, CFO, COO, CSGO).',
        'Make sure the actions match what is actually on the timeline.'
      ],
      completionCriteria: [
        'Three to five next actions are listed with owners.',
        'Actions read as real work, not vague intentions.'
      ],
      expertGuidance: {
        expertRole: 'Co-CEO / strategy operator',
        whyThisMatters:
          'The next-steps list is what stakeholders actually scan for: "is this team executing?" Aspirational verbs ("explore", "consider") read as not-started; concrete verbs ("ship", "lock", "preorder") read as in-flight.',
        whatToGather: [
          '3–5 concrete actions before TechTown (May 27) or final presentation (May 12 / 15).',
          'Owner for each action (Co-CEO, CMO, CFO, COO, CSGO).',
          'Cross-check: do these actions appear on /timeline as actual tasks?'
        ],
        whereToFindIt: [
          '/timeline — Final Presentation Backplan and task list.',
          '/c-suite-advisor — Today\'s Moves.',
          'Intelligence Sync — gather-next checklist.'
        ],
        weakAnswerLooksLike:
          '"We will work on the Playbook, finalize pricing, and prepare for the pop-up." — vague verbs, no owner, no due date implied.',
        strongAnswerLooksLike:
          '"CFO locks /pricing for all SKUs by April 30. CMO drafts pop-up signage by May 5. COO confirms inventory + bake list by May 5. CSGO runs a 10-person preorder test at $100 before May 12. Co-CEOs review the final Playbook bundle by May 12."',
        expertPushback: [
          'Are these actions on the timeline, or do they live only here?',
          'Which one is the team most likely to slip on, and what is the recovery plan?',
          'Is anyone accidentally listed twice as the owner?'
        ],
        commonMistakes: [
          'Listing aspirations rather than the work that is actually queued this week.',
          'Forgetting to name the Phoenix Nest carry pitch ask in the next-steps list.',
          'Using vague verbs ("explore", "consider", "look into") that hide whether the work is moving.'
        ],
        decisionSupported:
          'Whether the executive summary feels like a real operating brief or a school project.',
        connectsTo: [
          '/timeline — Gantt + backplan',
          'C-Suite Advisor cockpit — Today\'s Moves',
          'Chapter 12 — strategy / next-semester recommendations (post-launch handoff)'
        ],
        ownerHint: 'Co-CEOs · cross-functional',
        doneLooksLike:
          'Each action has an owner, an implied or explicit deadline, and matches a real task on /timeline. Verbs are concrete.'
      }
    }
  ],
  requirements: [
    {
      id: 'exec-names-renni-and-house-phoenix',
      label: 'Names Renni Inc. and House Phoenix correctly',
      description:
        'Summary opens by naming Renni Inc. as the parent company and House Phoenix as the launch brand.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      suggestedTaskTitle: 'Draft company overview paragraph',
      definitionOfDone:
        'Opening paragraph names Renni Inc. and House Phoenix in plain language.'
    },
    {
      id: 'exec-explains-techtown-popup',
      label: 'Explains the TechTown pop-up',
      description:
        'TechTown pop-up is described well enough that a stranger can picture the event.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add brand and launch language for the pop-up',
      definitionOfDone:
        'TechTown pop-up paragraph names the event, the audience, and the timing.'
    },
    {
      id: 'exec-explains-playbook',
      label: 'Explains the Brand & Operations Playbook',
      description:
        'Reader understands what the Playbook is and why the next cohort uses it.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      definitionOfDone:
        'Playbook paragraph explains the artifact and its purpose for next cohort.'
    },
    {
      id: 'exec-explains-phoenix-nest',
      label: 'Explains the Phoenix Nest retail carry pitch',
      description:
        'Phoenix Nest pitch is named and described so readers can tell it apart from the pop-up.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 1,
      definitionOfDone:
        'Phoenix Nest pitch is named and explained in plain language.'
    },
    {
      id: 'exec-product-list',
      label: 'Lists current products and donations',
      description:
        'Beanies, sweatshirts, t-shirts, baked goods, and donations are all named, with donations called out separately from sales.',
      requiredForApproval: true,
      department: 'finance',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add revenue and pricing status to the summary',
      definitionOfDone:
        'Product list paragraph names all five items and separates donations.'
    },
    {
      id: 'exec-current-risks',
      label: 'Names 2–3 current risks or open questions',
      description:
        'Two or three real risks are listed with a one-line explanation each.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add growth and risk language to the summary',
      definitionOfDone:
        'At least two risks named with short rationale; reads as honest, not generic.'
    },
    {
      id: 'exec-next-actions',
      label: 'Lists next actions before launch',
      description:
        '3–5 next actions are named with owners and match the live timeline.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 1,
      suggestedTaskTitle: 'Add operations readiness status to the summary',
      definitionOfDone:
        'Next actions list mirrors the timeline and names an owner per action.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft company overview paragraph',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'exec-names-renni-and-house-phoenix',
      definitionOfDone:
        'Two-sentence opening that names Renni Inc. and House Phoenix.',
      dueOffsetDays: 2
    },
    {
      title: 'Add brand and launch language for the pop-up',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'exec-explains-techtown-popup',
      definitionOfDone:
        'TechTown pop-up paragraph drafted, reviewed by CMO.',
      dueOffsetDays: 3
    },
    {
      title: 'Add revenue and pricing status to the summary',
      department: 'finance',
      ownerRole: 'cfo',
      requirementId: 'exec-product-list',
      definitionOfDone:
        'Product list reflects current pop-up inventory; donations called out separately.',
      dueOffsetDays: 3
    },
    {
      title: 'Add operations readiness status to the summary',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'exec-next-actions',
      definitionOfDone:
        'Next-actions list mirrors the live timeline with owners named.',
      dueOffsetDays: 3
    },
    {
      title: 'Add growth and risk language to the summary',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'exec-current-risks',
      definitionOfDone:
        'Two or three honest risks named with short rationale.',
      dueOffsetDays: 4
    },
    {
      title: 'Final executive summary review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the summary end-to-end before submission.',
      dueOffsetDays: 5
    }
  ],
  requiredEvidence: [
    {
      id: 'exec-playbook-progress-link',
      label: 'Link to current Playbook progress',
      description:
        'Reference to the Playbook page or a screenshot so readers can verify status.',
      required: true
    },
    {
      id: 'exec-product-reference',
      label: 'Product list or pricing reference',
      description:
        'Link or screenshot of /pricing or the current product tracker.',
      required: true
    },
    {
      id: 'exec-workbench-status',
      label: 'Current task / workbench status',
      description:
        'Link or screenshot of the Workbench so the next-actions list is verifiable.',
      required: true
    },
    {
      id: 'exec-pitch-or-popup-plan',
      label: 'Phoenix Nest pitch or pop-up plan',
      description:
        'Optional link to the carry pitch deck or pop-up day-of plan.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Suggest tighter wording after the team drafts the summary.',
      'Ask clarifying questions about missing detail.',
      'Check the summary against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Writing the summary from scratch.',
      'Inventing risks or next actions the team did not surface.',
      'Approving or submitting the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
