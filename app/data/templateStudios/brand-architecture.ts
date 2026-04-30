import type { TemplateStudio } from '~/types/templateStudio'

export const brandArchitecture: TemplateStudio = {
  title: 'Renni Overview and Brand Architecture',
  purpose:
    'Explain how Renni Inc. and its brands fit together — what the parent company is, which brand leads the launch, how the supporting brands relate to it — and the mission, vision, and values that hold the system together.',
  learningObjective:
    'Use the language of brand architecture (parent / primary / supporting brands) and ground it in the Renni Inc. mission, vision, and values so a customer at the pop-up or a buyer at Phoenix Nest understands the system and the company behind it on the first read.',
  whyItMatters:
    "If a customer can't tell whether the beanie is a Renni Inc. product, a House Phoenix product, or something else entirely, the brand work is undermined before the pitch even starts. The Phoenix Nest buyer reads brand architecture before product specs. Mission, vision, and values keep the brand decisions consistent when no chief is in the room. Getting this chapter right makes every downstream chapter easier to write.",
  finalOutput:
    'A short Renni overview and brand architecture chapter that names Renni Inc. as the parent company, House Phoenix as the primary brand, Lumen / Notice / Humble Oven as supporting brands, explains how each one shows up to customers, and grounds the brand system in a one-sentence mission, a one-sentence vision, three to five values with examples, and decision rules students can actually use.',
  connectedOutcome: 'Playbook',
  sections: [
    {
      id: 'parent-company',
      title: 'Renni Inc. — the parent company',
      lesson:
        'The parent company is the legal and strategic umbrella every other brand sits under. Stakeholders need to know it exists even if customers rarely interact with it directly.',
      example:
        'Renni Inc. is the student-led parent company at Renaissance High School. It owns and operates House Phoenix and the supporting brand line.',
      studentPrompts: [
        'Write one sentence that introduces Renni Inc. as the parent company.',
        'Explain in one line how Renni Inc. shows up to customers (or why it stays in the background).',
        'Note how Renni Inc. is governed — Co-CEOs, chiefs, advisors.'
      ],
      requiredInputs: ['Parent company sentence', 'Customer visibility note'],
      completionCriteria: [
        'Renni Inc. is named as the parent company.',
        'Reader understands whether Renni Inc. appears on packaging or not.'
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'A real parent company is rarely visible to customers but is always visible to investors, partners, and retailers. Reviewers want to see "who actually owns this work" before they trust the launch brand.',
        whatToGather: [
          'One legal-style sentence: who Renni Inc. is, where it sits (Renaissance High School, Detroit), what it owns.',
          'Customer visibility rule: where Renni Inc. appears (e.g., a small parent-company endorsement on a hangtag) vs. where House Phoenix carries the front-of-product brand.',
          'Governance: Co-CEOs, chiefs (CFO, COO, CMO, CSGO), instructor / admin advisor.'
        ],
        whereToFindIt: [
          'Chapter 3 — company structure & continuity (roles, decision rights).',
          'Chapter 5 — House Phoenix audience for contrast.',
          'Existing org-chart docs from prior cohorts.'
        ],
        weakAnswerLooksLike:
          '"Renni Inc. is the company we run." — collapses parent and product brand into one, no governance.',
        strongAnswerLooksLike:
          '"Renni Inc. is the student-led parent company at Renaissance High School in Detroit. Co-CEOs lead it; chiefs run finance, operations, marketing, and strategy/growth. Renni Inc. owns House Phoenix (apparel) and the supporting brand line (Lumen, Notice, Humble Oven). Renni Inc. carries a small parent endorsement on hangtags but does not appear on the front of any product."',
        expertPushback: [
          'Where does Renni Inc. show up to a customer at TechTown?',
          'If a Phoenix Nest buyer asks "who legally owns the brand?" — what is the answer?',
          'Are governance roles documented anywhere outside of student memory?'
        ],
        commonMistakes: [
          'Treating the parent company as a school assignment label rather than the actual operating umbrella.',
          'Letting Renni Inc. and House Phoenix sound interchangeable.',
          'Skipping governance because no one has asked for it yet.'
        ],
        decisionSupported:
          'Whether the brand portfolio reads as a real business or as a worksheet.',
        connectsTo: [
          'Chapter 3 — company structure & continuity',
          'Chapter 5 — House Phoenix Brand Story',
          'Chapter 13 — decision log (governance evidence)'
        ],
        ownerHint: 'Co-CEOs',
        doneLooksLike:
          'A reader can answer "who owns the work" and "where does the parent show up to customers" without re-reading.'
      }
    },
    {
      id: 'brand-portfolio',
      title: 'The brand portfolio at a glance',
      lesson:
        'A brand portfolio diagram or list shows the family in one view: parent, primary, supporting. Use a simple diagram or a clear list — fancy is not the goal, clarity is.',
      universalTable: {
        enabled: true,
        kind: 'brand-portfolio',
        title: 'Brand Portfolio Table',
        intro: 'One row per brand: parent, primary, supporting. Name role, audience, products, and how it relates to House Phoenix.',
        copyTitle: 'Brand portfolio',
        columns: [
          { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Renni Inc. · House Phoenix · Lumen · Notice · Humble Oven' },
          { key: 'role', label: 'Role', type: 'select', options: ['Parent', 'Primary', 'Supporting'] },
          { key: 'audience', label: 'Audience', type: 'text', placeholder: 'who it serves', wide: true },
          { key: 'products', label: 'Products', type: 'text', placeholder: 'what it sells', wide: true },
          { key: 'relationship', label: 'Relationship to House Phoenix', type: 'textarea', placeholder: 'how it connects but stays distinct', wide: true }
        ],
        starterRows: [
          { brand: 'Renni Inc.', role: 'Parent' },
          { brand: 'House Phoenix', role: 'Primary' },
          { brand: 'Lumen', role: 'Supporting' },
          { brand: 'Notice', role: 'Supporting' },
          { brand: 'Humble Oven', role: 'Supporting' }
        ]
      },
      studentPrompts: [
        'List Renni Inc. (parent), House Phoenix (primary), and Lumen / Notice / Humble Oven (supporting).',
        'For each brand, write one line that names what it sells or represents.',
        'Mark which brands are active today vs. planned for later.'
      ],
      completionCriteria: [
        'All five brands are listed in the right tier.',
        'Each brand has a one-line "what it is" description.'
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'A portfolio diagram answers "what is the family, and what does each member sell?" in one glance. Without it, every downstream chapter has to re-explain the cast.',
        whatToGather: [
          'Tiering: Renni Inc. (parent) · House Phoenix (primary launch) · Lumen / Notice / Humble Oven (supporting).',
          'One line per brand stating product category and intended buyer.',
          'Active-vs-planned status per brand for this cohort.'
        ],
        weakAnswerLooksLike:
          'A flat list of brand names with no tier indication and no buyer for each.',
        strongAnswerLooksLike:
          'A simple tree or table with parent / primary / supporting tiers; each brand named with category, buyer, and active/planned flag.',
        expertPushback: [
          'If a parent or buyer reads only this, do they know which brand they would buy from?',
          'Are any brands listed that are not actually shipping this cohort?'
        ],
        commonMistakes: [
          'Listing brands at the same tier when they are not.',
          'Adding aspirational brands that have no product yet.'
        ],
        decisionSupported: 'Which brands the team actively defends in pitches and which are placeholders.',
        connectsTo: ['Chapter 5 — House Phoenix Brand Story', 'Chapter 6 — supporting brand sheets'],
        ownerHint: 'Co-CEOs · CMO support',
        doneLooksLike:
          'Tiering is visible at a glance; every named brand has a buyer + product category.'
      }
    },
    {
      id: 'house-phoenix-role',
      title: 'House Phoenix — the primary brand',
      lesson:
        'House Phoenix carries the launch. Explain why it leads — the apparel category, the TechTown pop-up, the Phoenix Nest pitch — so the rest of the chapter knows where the spotlight sits.',
      studentPrompts: [
        'Why is House Phoenix the primary brand for the launch?',
        'What does House Phoenix sell — beanies, sweatshirts, t-shirts?',
        'How will House Phoenix appear at TechTown and in the Phoenix Nest pitch?'
      ],
      completionCriteria: [
        'Reader understands why House Phoenix leads.',
        'House Phoenix product categories are listed.'
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'Reviewers ask "why this brand at the front?" If the answer is "because we picked one," the launch reads as arbitrary. If the answer is grounded in product category, audience reach, or pop-up logistics, the rest of the chapter follows.',
        whatToGather: [
          'Reasons House Phoenix carries the launch (Detroit-made apparel, broadest audience, premium positioning, pop-up readiness).',
          'Categories House Phoenix actually sells this cohort.',
          'Where House Phoenix shows up: TechTown pop-up + Phoenix Nest pitch.'
        ],
        weakAnswerLooksLike:
          '"House Phoenix is our main brand because we like it." — no audience or product reasoning.',
        strongAnswerLooksLike:
          'Two or three paragraphs naming the brand role: apparel category leader for Detroit student / civic / parent / alumni buyers, primary product line for the May 27 TechTown pop-up, and the brand the team is pitching to Phoenix Nest carry buyers.',
        expertPushback: [
          'If House Phoenix did not exist, which supporting brand could lead — and what would change?',
          'Is "primary" defined by revenue, audience, or storytelling reach?'
        ],
        commonMistakes: [
          'Calling House Phoenix primary without explaining why.',
          'Listing every product Renaissance has ever made instead of this cohort\'s lineup.'
        ],
        decisionSupported: 'How the team frames House Phoenix in the executive summary, the pop-up campaign, and the Phoenix Nest pitch.',
        connectsTo: ['Chapter 5 — House Phoenix Brand Story', 'Chapter 8 — pricing + revenue scenarios', 'Chapter 11 — Phoenix Nest carry'],
        ownerHint: 'CMO · Co-CEO support',
        doneLooksLike: 'A reader can defend "why House Phoenix leads" in one or two sentences.'
      }
    },
    {
      id: 'supporting-brands',
      title: 'Supporting brands — Lumen, Notice, Humble Oven',
      lesson:
        'Supporting brands add range without diluting the primary. Each one needs a clear role: candles, jewelry, baked goods. Write each as if you were introducing them to a Phoenix Nest buyer.',
      universalTable: {
        enabled: true,
        kind: 'supporting-brands',
        title: 'Supporting Brand Cards',
        intro: 'One row per supporting brand. Purpose, product, audience, owner, current state.',
        copyTitle: 'Supporting brands',
        columns: [
          { key: 'brand', label: 'Brand', type: 'select', options: ['Lumen', 'Notice', 'Humble Oven'] },
          { key: 'purpose', label: 'Purpose', type: 'textarea', placeholder: 'why it exists', wide: true },
          { key: 'product', label: 'Product', type: 'text', placeholder: 'what it sells', wide: true },
          { key: 'audience', label: 'Audience', type: 'text', placeholder: 'who it serves', wide: true },
          { key: 'owner', label: 'Owner', type: 'text', placeholder: 'role / name' },
          { key: 'state', label: 'State', type: 'select', options: ['Live', 'Pilot', 'Pending', 'Pause'] }
        ],
        starterRows: [
          { brand: 'Lumen' },
          { brand: 'Notice' },
          { brand: 'Humble Oven' }
        ]
      },
      studentPrompts: [
        'Lumen: what does the candle brand sell, and who is it for?',
        'Notice: what does the jewelry brand sell, and who is it for?',
        'Humble Oven: what baked goods does it serve at the pop-up?',
        'For each one, name the chief or member who owns it.'
      ],
      requiredInputs: ['One paragraph per supporting brand', 'Owner per brand'],
      completionCriteria: [
        'Lumen, Notice, and Humble Oven each have a customer-ready paragraph.',
        'Each supporting brand has a named owner.'
      ],
      expertGuidance: {
        expertRole: 'brand portfolio operator',
        whyThisMatters:
          'Supporting brands either expand reach or dilute focus. A retail buyer wants to see real categories with named owners — not "we also have ideas."',
        whatToGather: [
          'Lumen — what category, who the buyer is, what is shipping this cohort.',
          'Notice — same.',
          'Humble Oven — bake list, allergen story, who runs the table.',
          'Owner per brand and current activity status.'
        ],
        weakAnswerLooksLike:
          '"Lumen makes candles, Notice makes jewelry, Humble Oven bakes." — generic, no owner, no buyer.',
        strongAnswerLooksLike:
          'A short paragraph per brand naming category, target buyer, owner, and what is actually being made for May 27. A reader can predict what they would see at each table.',
        expertPushback: [
          'For each supporting brand, is the team actually producing inventory this cohort, or is it reserved?',
          'Does each supporting brand share enough with House Phoenix to feel like family?'
        ],
        commonMistakes: [
          'Listing supporting brands without an owner.',
          'Treating supporting brands as conceptual when they need real SKUs for the pop-up.'
        ],
        decisionSupported: 'Which supporting brands the team actually defends at TechTown and which stay future-state.',
        connectsTo: ['Chapter 6 — supporting brand sheets', 'Chapter 9 — operations (bake list, allergen labels)'],
        ownerHint: 'CMO · Co-CEO + chief support',
        doneLooksLike: 'Each supporting brand has a named owner and a paragraph a buyer could read at a Phoenix Nest pitch.'
      }
    },
    {
      id: 'brand-relationship-rules',
      title: 'How the brands feel connected but distinct',
      lesson:
        'A good brand system signals "same family" without making everything look the same. Rules are simple: shared mark, shared voice, distinct visual identity per brand.',
      studentPrompts: [
        'What signals belong to Renni Inc. (e.g., parent endorsement on tags)?',
        'What signals are unique to House Phoenix vs. Lumen vs. Notice vs. Humble Oven?',
        'What should *never* carry the Renni Inc. name (e.g., placeholder student work)?'
      ],
      completionCriteria: [
        'At least one shared signal across the family is named.',
        'At least one rule about what should NOT carry the Renni Inc. name is named.'
      ],
      expertGuidance: {
        expertRole: 'brand systems designer',
        whyThisMatters:
          'A real brand system has explicit rules, not vibes. Without rules, a future cohort accidentally collapses everything into one look or invents inconsistent siblings.',
        whatToGather: [
          'Shared signals (a tag line on hangtags, a "by Renni Inc." endorsement, a shared brand mark size).',
          'Distinct signals (color, voice, packaging, photography per brand).',
          'Rules about what should NOT carry the Renni Inc. name (placeholder student work, unfinished ideas).'
        ],
        weakAnswerLooksLike:
          '"All our brands look kind of similar." — no concrete rules.',
        strongAnswerLooksLike:
          'A list of explicit shared elements + per-brand distinct elements + at least one "never put this on a Renni Inc. tag" rule.',
        expertPushback: [
          'If the next cohort has to add a fifth supporting brand, what stays and what changes?',
          'Has the team accidentally signaled "school project" anywhere a buyer would see?'
        ],
        commonMistakes: ['Stating taste preferences instead of rules.', 'Not naming a single thing the parent brand should never carry.'],
        decisionSupported: 'How the next cohort extends or trims the brand family without breaking it.',
        connectsTo: ['Chapter 5 — House Phoenix Brand Story', 'Chapter 6 — supporting brand sheets'],
        ownerHint: 'CMO',
        doneLooksLike: 'A future cohort could read these rules and stay consistent without asking.'
      }
    },
    {
      id: 'future-brand-questions',
      title: 'Open questions for the next cohort',
      lesson:
        'The brand system will keep evolving. Naming the open questions honestly is more useful than pretending everything is decided.',
      decisionMemo: {
        enabled: true,
        kind: 'future-brand-questions',
        title: 'Future Brand Decisions',
        intro: 'One card per open question the next cohort will need to answer. Decision (the question), options on the table, evidence so far, owner.',
        copyTitle: 'Future brand questions',
        cardCount: 3
      },
      studentPrompts: [
        'What brand questions are still unresolved (new sub-brand, naming, retired brand)?',
        'What customer confusion has the team observed so far?',
        'What should the next cohort decide first?'
      ],
      completionCriteria: [
        'At least two open questions are named.',
        'Reader understands what the next cohort should tackle first.'
      ],
      expertGuidance: {
        expertRole: 'continuity-minded operator (preparing next cohort)',
        whyThisMatters:
          'The most valuable handoff naming what is unresolved. The next cohort works faster when they inherit a clear list of decisions to make rather than a fake-finished system.',
        whatToGather: [
          '2–3 honest open questions (sub-brand split, new brand, retired brand, naming conflicts).',
          'Real customer or partner confusion observed this cohort.',
          'A one-line "this is what we would tackle first if we had another semester."'
        ],
        weakAnswerLooksLike: '"We are still figuring it out." — no specifics, no order.',
        strongAnswerLooksLike: 'A short numbered list naming the open question, the evidence behind it, and which chief should lead the decision.',
        expertPushback: ['Are these the questions the next cohort would actually want to inherit?', 'Have you marked any pretend-resolved decisions as "still open"?'],
        commonMistakes: ['Hiding open questions to look done.', 'Naming so many open questions that none feel actionable.'],
        decisionSupported: 'Which decisions the next cohort gets first.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A reader can predict what the next cohort tackles in week one.'
      }
    },
    {
      id: 'mission',
      title: 'Mission — what Renni Inc. does now',
      lesson:
        'A mission says what the company does today, for whom, and why. Keep it to one sentence. If it could describe any school project, it is too generic.',
      example:
        'Renni Inc. equips Renaissance students to launch real student-led brands and produce a pop-up that funds the next cohort.',
      studentPrompts: [
        'Who does Renni Inc. serve right now?',
        'What does Renni Inc. actually do for them?',
        'Write the mission as one sentence — no abstract jargon.'
      ],
      requiredInputs: ['One-sentence mission'],
      completionCriteria: [
        'Mission fits in one sentence.',
        'Mission is specific to Renni Inc., not generic to any student company.'
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'A mission anchors every campaign decision. If the mission could fit any student club, the team will lose pop-up customers and Phoenix Nest buyers in the first sentence.',
        whatToGather: [
          'Who Renni Inc. serves today (Renaissance students + Detroit civic / parent / alumni buyers).',
          'What Renni Inc. actually does (launches student-led brands, runs the pop-up, funds the next cohort).',
          'A specific verb that is true of Renni Inc. and not true of any other school project.'
        ],
        weakAnswerLooksLike: '"Empower students to do their best." — could describe any school anywhere.',
        strongAnswerLooksLike: 'A one-sentence mission that names Renaissance + Detroit + the launch + the funding mechanism.',
        expertPushback: ['Does this mission distinguish Renni Inc. from a generic entrepreneurship class?', 'Could the team defend this sentence to a Phoenix Nest buyer in 10 seconds?'],
        commonMistakes: ['Reaching for inspirational verbs like "empower" or "transform" with no concrete what.', 'Writing the mission first and shaping behavior to match it later.'],
        decisionSupported: 'Whether the brand-architecture chapter has a real anchor for downstream decisions.',
        connectsTo: ['Chapter 5 — House Phoenix Brand Story', 'Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A reader can answer "who does Renni serve and what does it do?" from one sentence.'
      }
    },
    {
      id: 'vision',
      title: 'Vision — where Renni Inc. is going',
      lesson:
        'A vision is a believable future state. It should stretch but stay grounded — Phoenix Nest carry, sustained student leadership, a recognizable brand family.',
      studentPrompts: [
        'In three years, what does success look like for Renni Inc.?',
        'What change in the school, the city, or the cohort would prove the vision worked?',
        'Avoid "be the best" language — name the change concretely.'
      ],
      completionCriteria: [
        'Vision describes a believable future state, not a slogan.',
        'A reader can picture the change.'
      ],
      expertGuidance: {
        expertRole: 'brand strategist',
        whyThisMatters:
          'A vision tells the next cohort and the school what success would actually look like. Without one, every win feels like "we did the assignment."',
        whatToGather: [
          'A 3-year future state — Phoenix Nest carry, named brands, a sustained student leadership pipeline.',
          'Concrete change in school / city / cohort that would prove the vision.',
          'What would be visibly different about TechTown in 3 years.'
        ],
        weakAnswerLooksLike: '"Be the best student company." — slogan, no picture.',
        strongAnswerLooksLike: 'A few sentences naming Phoenix Nest carry success, named recurring brands, and a measurable funding rhythm for the next cohort.',
        expertPushback: ['Could a reader picture this change?', 'Is the vision believable for a high-school student company in 3 years?'],
        commonMistakes: ['"Best in the world" language.', 'Vision indistinguishable from mission.'],
        decisionSupported: 'Whether next cohort feels they are continuing a real arc.',
        connectsTo: ['Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A reader can describe a different and recognisable future without re-reading.'
      }
    },
    {
      id: 'values',
      title: 'Values — how Renni Inc. behaves',
      lesson:
        'Values are short and memorable. Three to five is the sweet spot. Each value should be specific enough that two students would behave the same way under it, and tied to student ownership and a professional standard.',
      universalTable: {
        enabled: true,
        kind: 'values',
        title: 'Values Table',
        intro: 'Three to five values. Each row: value, definition, what it means in practice.',
        copyTitle: 'Values',
        columns: [
          { key: 'value', label: 'Value', type: 'text', placeholder: 'one or two words' },
          { key: 'definition', label: 'Definition', type: 'textarea', placeholder: 'one sentence', wide: true },
          { key: 'inPractice', label: 'In practice', type: 'textarea', placeholder: 'a behavior anyone could repeat', wide: true }
        ],
        starterRowCount: 4
      },
      studentPrompts: [
        'List 3–5 values. Pick words you can defend, not words that sound good.',
        'For each one, write a single line about what it means inside Renni Inc.',
        'Reject any value that sounds like every other student company.'
      ],
      requiredInputs: ['Three to five values', 'One-line definition per value'],
      completionCriteria: [
        'Three to five values are listed.',
        'Each value has a definition specific to Renni Inc.',
        'At least one value references student ownership; at least one references a professional standard.'
      ],
      expertGuidance: {
        expertRole: 'culture / brand strategist',
        whyThisMatters:
          'Values become how teams behave under pressure. If they read as poster words, the next cohort copies them and nothing changes.',
        whatToGather: [
          '3–5 values defended with a reason ("why this not that?").',
          'A one-line definition per value naming behavior.',
          'At least one value about student ownership and one about a professional standard.'
        ],
        weakAnswerLooksLike: '"Integrity, excellence, teamwork" — generic stock list.',
        strongAnswerLooksLike: 'Values that two students could disagree about and that drive an actual decision (e.g., "we name what we don\'t know").',
        expertPushback: ['Have you ever NOT done something because of one of these values?', 'Could two students apply this value the same way without coaching?'],
        commonMistakes: ['Picking values to sound good.', 'Defining values too vaguely to apply.'],
        decisionSupported: 'How the team behaves in moments not covered by SOPs.',
        connectsTo: ['Chapter 3 — company structure & continuity', 'Chapter 12 — strategy / next-semester recommendations'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'Each value has a behavior, not just a definition.'
      }
    },
    {
      id: 'values-in-action',
      title: 'Values in action',
      lesson:
        'A value only counts if it changes behavior. Pair each value with a real example from a product, pricing, marketing, or operations decision the team has actually made.',
      universalTable: {
        enabled: true,
        kind: 'values-in-action',
        title: 'Values in Action Table',
        intro: 'Each row pairs a value with a real decision the team made under it. Vague examples do not count.',
        copyTitle: 'Values in action',
        columns: [
          { key: 'value', label: 'Value', type: 'text', placeholder: 'tie back to the values list' },
          { key: 'decision', label: 'Real decision', type: 'textarea', placeholder: 'what we actually did', wide: true },
          { key: 'why', label: 'Why this proves the value', type: 'textarea', placeholder: 'how it shows the value in practice', wide: true }
        ],
        starterRowCount: 3
      },
      studentPrompts: [
        'For each value, name one decision the team made because of it.',
        'For each value, name one decision the team would refuse because of it.',
        'If you cannot name a real example, the value may be inspirational rather than usable — rewrite it.'
      ],
      completionCriteria: [
        'Each value has at least one real "did" example.',
        'At least one value also has a "would refuse" example.'
      ],
      expertGuidance: {
        expertRole: 'culture / brand strategist',
        whyThisMatters:
          'Naming a value without a decision behind it is decoration. The "we refused this" examples are usually more powerful than "we did this" because they show the value cost something.',
        whatToGather: [
          'For each value, one real decision the team made because of it.',
          'For each value, one decision the team refused because of it (if you cannot name one, the value may be inspirational, not operating).',
          'Concrete artifacts: vendor email, pricing change, design choice.'
        ],
        weakAnswerLooksLike: '"We always try to live this value." — no decision artifact.',
        strongAnswerLooksLike: 'Each value has a "did this" + at least one has a "refused this" with a real story.',
        expertPushback: ['If you swap two values, would the team actually behave differently?', 'Are the "did" examples real or aspirational?'],
        commonMistakes: ['Using future-tense examples.', 'Skipping the "refused" examples because they sound negative.'],
        decisionSupported: 'Whether values become operating muscle or decoration.',
        connectsTo: ['Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A reader could predict how the team would behave under a new pressure.'
      }
    },
    {
      id: 'decision-rules',
      title: 'Decision rules',
      lesson:
        'Translate the values into 3–5 simple rules the team can use when an in-the-moment call needs to be made — at the pop-up table, in a vendor email, in a Phoenix Nest pitch.',
      decisionMemo: {
        enabled: true,
        kind: 'decision-rules',
        title: 'Decision Rules Memo',
        intro: 'One card per rule: the rule (decision), when it applies (criteria), the recommendation, owner, definition of done.',
        copyTitle: 'Decision rules',
        cardCount: 4
      },
      studentPrompts: [
        'Write decision rules in the form "If X, we will Y."',
        'Make sure each rule traces back to a value.',
        'Pick rules a Renaissance student could apply without re-reading the chapter.'
      ],
      completionCriteria: [
        'Three to five decision rules are written in the "If X, we will Y" form.',
        'Each rule maps to a value above.'
      ],
      expertGuidance: {
        expertRole: 'operating-rules author',
        whyThisMatters:
          'In-the-moment calls happen at the table, in vendor emails, on social — not in chapter writing. Decision rules turn values into shortcuts the team can apply without re-reading anything.',
        whatToGather: [
          '3–5 "If X, we will Y" rules.',
          'Each rule traces back to a named value.',
          'Rules a Renaissance student could apply without re-reading the chapter.'
        ],
        weakAnswerLooksLike: '"We try to make good decisions." — not a rule.',
        strongAnswerLooksLike: 'Rules like "If a vendor cannot share a current quote, we do not list their item on /pricing." — concrete, testable.',
        expertPushback: ['Could a new chief read these rules and act without coaching?', 'Has the team applied any of these rules in the last two weeks?'],
        commonMistakes: ['Writing rules so abstract they apply to anything.', 'Rules that ignore the values list.'],
        decisionSupported: 'Whether the team handles unscripted moments consistently.',
        connectsTo: ['Chapter 9 — operations readiness (SOPs)', 'Chapter 13 — decision log'],
        ownerHint: 'Co-CEOs',
        doneLooksLike: 'A new chief could resolve a vendor or pop-up moment using only these rules.'
      }
    }
  ],
  requirements: [
    {
      id: 'brand-arch-parent-named',
      label: 'Renni Inc. named as the parent company',
      description:
        'Chapter opens by naming Renni Inc. as the parent company in plain language.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      suggestedTaskTitle: 'Confirm parent and sub-brand structure',
      definitionOfDone:
        'Opening paragraph names Renni Inc. and explains its role.'
    },
    {
      id: 'brand-arch-primary-named',
      label: 'House Phoenix identified as the primary brand',
      description:
        'Chapter explains why House Phoenix leads the launch and what category it owns.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      definitionOfDone:
        'House Phoenix is named as primary, with category and launch role explained.'
    },
    {
      id: 'brand-arch-supporting-named',
      label: 'Lumen, Notice, and Humble Oven identified',
      description:
        'All three supporting brands are listed with their categories and customer-facing descriptions.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Confirm which products belong to which brand',
      definitionOfDone:
        'Each supporting brand has a one-paragraph customer-ready description.'
    },
    {
      id: 'brand-arch-what-each-sells',
      label: 'Explains what each brand sells or represents',
      description:
        'Reader can tell what each brand makes (apparel, candles, jewelry, baked goods) without prior context.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      definitionOfDone:
        'Every brand has a one-line "what it sells" description.'
    },
    {
      id: 'brand-arch-connected-but-distinct',
      label: 'Explains how brands feel connected but distinct',
      description:
        'At least one shared family signal and one distinct per-brand signal are named.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Draft brand relationship explanation',
      definitionOfDone:
        'Family-level rules are written so future students know how to apply them.'
    },
    {
      id: 'brand-arch-renni-name-rules',
      label: 'States what should and should not carry the Renni Inc. name',
      description:
        'Chapter names at least one thing that should carry the Renni Inc. name and one that should not.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      definitionOfDone:
        'Rule list captured; COO can apply it to packaging and signage decisions.'
    },
    {
      id: 'brand-arch-future-questions',
      label: 'Names at least two open brand questions',
      description:
        'Two or more honest open questions about how the brand system should evolve.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 2,
      suggestedTaskTitle: 'Identify customer confusion risks',
      definitionOfDone:
        'Two or more unresolved questions named with a one-line note each.'
    },
    {
      id: 'values-mission-current-work',
      label: 'Mission explains what Renni Inc. does now',
      description:
        'One-sentence mission specific to Renni Inc., naming who is served and what is done for them.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      suggestedTaskTitle: 'Draft mission and vision',
      definitionOfDone:
        'Mission sentence drafted by Co-CEO and reviewed for specificity.'
    },
    {
      id: 'values-vision-future-state',
      label: 'Vision explains where Renni Inc. is going',
      description:
        'Vision describes a believable future state with concrete change, not slogans.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 2,
      definitionOfDone:
        'Vision passes the "could a reader picture this?" check.'
    },
    {
      id: 'values-clear-and-usable',
      label: 'Values are clear, memorable, and usable',
      description:
        'Three to five values, each with a one-line Renni-specific definition.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 2,
      suggestedTaskTitle: 'Refine values language',
      definitionOfDone:
        'Each value passes the "two students would behave the same way" check.'
    },
    {
      id: 'values-tied-to-student-ownership',
      label: 'Values tied to student ownership and professional standards',
      description:
        'Values explicitly reference student ownership and the professional bar the team holds itself to.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 2,
      suggestedTaskTitle: 'Connect values to customer and community impact',
      definitionOfDone:
        'At least one value references student ownership; at least one references professional standards.'
    },
    {
      id: 'values-in-action',
      label: 'Values translated into real examples',
      description:
        'Each value has a real "did" example from a team decision.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      suggestedTaskTitle: 'Connect values to operations and handoff behavior',
      definitionOfDone:
        'Every value has at least one example pulled from a real product, pricing, marketing, or ops call.'
    },
    {
      id: 'values-decision-rules',
      label: 'Decision rules translate values into behavior',
      description:
        '3–5 decision rules in the "If X, we will Y" form, each traceable to a value.',
      requiredForApproval: true,
      department: 'operations',
      playbookChapter: 2,
      definitionOfDone:
        'Decision rules are written and traceable to a specific value.'
    }
  ],
  suggestedTasks: [
    {
      title: 'Confirm parent and sub-brand structure',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'brand-arch-parent-named',
      definitionOfDone:
        'Co-CEO confirms the parent / primary / supporting tier list with advisors.',
      dueOffsetDays: 3
    },
    {
      title: 'Draft brand relationship explanation',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'brand-arch-connected-but-distinct',
      definitionOfDone:
        'CMO drafts the family-rule paragraph and the per-brand distinct signals.',
      dueOffsetDays: 4
    },
    {
      title: 'Identify customer confusion risks',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'brand-arch-future-questions',
      definitionOfDone:
        'CSGO captures at least two real customer questions or confusions and turns them into open questions.',
      dueOffsetDays: 5
    },
    {
      title: 'Confirm which products belong to which brand',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'brand-arch-supporting-named',
      definitionOfDone:
        'COO maps every current product to its brand and confirms with the chiefs.',
      dueOffsetDays: 4
    },
    {
      title: 'Draft mission and vision',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'values-mission-current-work',
      definitionOfDone:
        'Co-CEO drafts a one-sentence mission and a believable vision for the next three years.',
      dueOffsetDays: 5
    },
    {
      title: 'Refine values language',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'values-clear-and-usable',
      definitionOfDone:
        'CMO refines the values so they are memorable and match the Renni Inc. voice.',
      dueOffsetDays: 6
    },
    {
      title: 'Connect values to customer and community impact',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'values-tied-to-student-ownership',
      definitionOfDone:
        'CSGO ties at least one value to a real customer or community decision.',
      dueOffsetDays: 6
    },
    {
      title: 'Connect values to operations and handoff behavior',
      department: 'operations',
      ownerRole: 'coo',
      requirementId: 'values-decision-rules',
      definitionOfDone:
        'COO writes 3–5 decision rules in the "If X, we will Y" form, traceable to values.',
      dueOffsetDays: 7
    },
    {
      title: 'Final Renni overview and brand architecture review',
      department: 'executive',
      ownerRole: 'coceo',
      definitionOfDone:
        'Co-CEO and admin review the chapter end-to-end before submission.',
      dueOffsetDays: 8
    }
  ],
  requiredEvidence: [
    {
      id: 'brand-arch-family-list',
      label: 'Brand family list',
      description:
        'A simple list or diagram showing parent / primary / supporting brands.',
      required: true
    },
    {
      id: 'brand-arch-visual-identity-refs',
      label: 'Logo or visual identity references',
      description:
        'Links or files showing each brand’s wordmark or visual identity if available.',
      required: false
    },
    {
      id: 'brand-arch-product-category-list',
      label: 'Product / category list',
      description:
        'Mapping of every product to its parent brand (apparel, candles, jewelry, baked goods).',
      required: true
    },
    {
      id: 'brand-arch-decision-notes',
      label: 'Brand-system decision notes',
      description:
        'Notes from any class discussion or decision about the brand system.',
      required: false
    },
    {
      id: 'values-class-discussion-notes',
      label: 'Class discussion notes for mission, vision, and values',
      description:
        'Notes that show how the team agreed on the mission, vision, and values.',
      required: true
    },
    {
      id: 'values-real-decisions',
      label: 'Examples of values applied to real decisions',
      description:
        'Specific product, pricing, operations, or marketing calls the team made because of a value.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique the brand-tier explanation after the team drafts it.',
      'Ask clarifying questions when a brand description sounds vague.',
      'Check the chapter against the requirement list for completeness.'
    ],
    disallowedHelp: [
      'Inventing brand names, descriptions, or owners.',
      'Picking which products belong to which brand.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
