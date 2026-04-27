import type { TemplateStudio } from '~/types/templateStudio'

export const popUpCampaign: TemplateStudio = {
  title: 'Marketing and Campaign Playbook',
  purpose:
    'Capture what Renni Inc. actually knows about its customers, then plan how Renni Inc. and House Phoenix drive attention, foot traffic, and sales to the TechTown pop-up. Document both halves so the next cohort can run a campaign like it again.',
  learningObjective:
    'Use real customer insights (or honestly labeled assumptions) to drive marketing decisions, then translate insights into audience, signage, content, and timing the customer actually sees.',
  whyItMatters:
    "A pop-up that ignores customers gets ignored back. The brand story matters, the pricing math matters, the ops SOP matters — but if nobody walks to the table, none of it moves. Marketing's job is to turn what we know about customers into arrivals.",
  finalOutput:
    'A marketing chapter that names primary customer groups and the evidence behind them, the messaging angles those insights drive, the TechTown audience touchpoints and content calendar, the way the team will measure which channel drove arrivals, and the feedback plan that closes the loop for next cohort.',
  connectedOutcome: 'TechTown pop-up',
  sections: [
    {
      id: 'target-customers',
      title: 'Target customers',
      lesson:
        'Define the customer groups the pop-up and Phoenix Nest pitch are actually trying to reach. Real groups beat demographic placeholders — "Renaissance students who buy a beanie because it represents their school" is a real group.',
      studentPrompts: [
        'Name 2–3 specific customer groups.',
        'For each one, write a one-line description of who they are.',
        'Mark which groups matter most for TechTown vs. Phoenix Nest.'
      ],
      requiredInputs: ['Named customer groups', 'TechTown vs. Phoenix Nest split'],
      completionCriteria: [
        'At least two named groups.',
        'Each group has a one-line description grounded in reality.'
      ],
      evidencePrompt:
        'For each customer group, log structured evidence — claim (who they are), source (conversation, observation, survey, labeled assumption), confidence, risk.',
      sourceGuidance: [
        'Quotes from real customer conversations beat paraphrases or invented personas.',
        'If this is an estimate, mark confidence low / medium / high and name what would tighten it.',
        'For each customer group, use the Market Builder block to size the reachable school audience and the broader Detroit-adjacent audience — keep school and broader as separate numbers.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Size each named group separately. School audience and broader Detroit-adjacent audience are different numbers; do not collapse them.'
      },
      marketFit: {
        enabled: true,
        guidance:
          'Compare segments side-by-side before declaring a primary market. The school can be the primary market for some products and a launch / awareness market for others.'
      },
      expertGuidance: {
        expertRole: 'CMO + customer researcher',
        whyThisMatters:
          'Every channel, sign, post, and price decision downstream depends on naming a real audience. "Detroit students and their families" is too broad to design a campaign around — TechTown foot traffic, parent loyalty, and Phoenix Nest carry are different buyers with different reasons to show up.',
        whatToGather: [
          '2–3 named buyer groups grounded in real conversations or observation, not demographic guesses.',
          'A one-line description per group ("Renaissance underclassmen who wear school identity proudly", "alumni and parents stopping at TechTown after work").',
          'A clear split: which group is the priority for the TechTown pop-up, which is the priority for the Phoenix Nest carry pitch.',
          'A pointer to the Ch. 7 PRIZM-inspired segment that anchors each group.'
        ],
        whereToFindIt: [
          'Chapter 7 — Segments and Customer Insights (use the Segment Composer entries already drafted).',
          'Notes from past pop-ups, school-store conversations, or Phoenix Nest store-walks.',
          'Any TechTown audience research the team has done.'
        ],
        weakAnswerLooksLike:
          '"Students, parents, and the Detroit community." — three buckets a generic school brand could write without ever talking to a customer.',
        strongAnswerLooksLike:
          'Two or three named groups, each tied to a Ch. 7 segment, with a one-line description grounded in a real conversation, and a clear note on which group matters for TechTown vs. Phoenix Nest.',
        expertPushback: [
          'Could a designer or content lead pick a photo, color, and headline based on this audience?',
          'Did this group come from a real conversation, or did the team write it from imagination?',
          'Is the same group somehow showing up as the TechTown buyer AND the Phoenix Nest buyer? If so, which is primary and why?'
        ],
        commonMistakes: [
          'Listing demographics ("teens", "parents") instead of buyer pictures.',
          'Forgetting to name a TechTown vs. Phoenix Nest priority — every group ends up "important".',
          'Skipping the Ch. 7 segment link, so the campaign and brand strategy describe different audiences.'
        ],
        decisionSupported: 'Audience, channels, messaging, and measurement everywhere downstream in this chapter.',
        connectsTo: [
          'Chapter 7 — Segment Composer',
          'Chapter 9 — Brand audience block',
          'Chapter 11 — Phoenix Nest pitch'
        ],
        ownerHint: 'Chief Strategy and Growth Officer · CMO support',
        doneLooksLike:
          'A new student could read this section, repeat back who the campaign is for, and explain who matters most for TechTown vs. Phoenix Nest.'
      }
    },
    {
      id: 'customer-problems-and-desires',
      title: 'Customer problems and desires',
      lesson:
        'A problem is what the customer is trying to fix. A desire is what they are trying to feel. Both shape what the team should make and how the team should sell.',
      studentPrompts: [
        'For each customer group, what problem does Renni Inc. or House Phoenix help solve?',
        'For each customer group, what do they want to feel by buying or wearing the product?',
        'Use customer language, not company language.'
      ],
      completionCriteria: [
        'Each customer group has at least one problem and one desire named.',
        'Language sounds like a customer, not a marketer.'
      ],
      sourceGuidance: [
        'Use a clearly labeled demand assumption when problem-severity is the basis for an interest rate.',
        'Name the source or explain why this is an estimate.',
        'Do not present estimates as facts.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each problem/desire pair, log the segment of the audience that actually has the problem strongly enough to buy. That is the interest rate the campaign should plan against.'
      },
      expertGuidance: {
        expertRole: 'brand strategist + campaign lead',
        whyThisMatters:
          'Customers do not buy product features. They buy a fix to a problem (the beanie keeps me warm, the sweatshirt is durable enough to wear all winter) and a feeling (I look like I belong, I represent my school well). The campaign must hit the right one for the right group, in the right voice, at the right price.',
        whatToGather: [
          'For every customer group, one problem the product fixes — written in the customer\'s words.',
          'For every customer group, one desire the product satisfies — also in the customer\'s words.',
          'Direct quotes if you have them; if not, a labeled assumption that names what would convert it to evidence.',
          'A check that the problem and desire stay believable at the Chapter 8 price point.'
        ],
        whereToFindIt: [
          'Customer conversation notes, interview tabs, or surveys.',
          'Chapter 7 segment notes (problems and motivations are usually drafted there).',
          'Chapter 9 brand value-proposition (the desire side often shows up there first).'
        ],
        weakAnswerLooksLike:
          '"Customers want quality apparel that represents Detroit." — generic, written in marketing language, not customer language.',
        strongAnswerLooksLike:
          'Per group, a sentence the customer would actually say — "I want a sweatshirt that does not pill after one wash so I can wear it for school and weekends" — with at least one source noted, including labeled assumptions where evidence is missing.',
        expertPushback: [
          'Would the customer actually say this sentence, or is this how the team would describe it?',
          'Does the desire match the price the team is charging in Ch. 8?',
          'Have you separated problem from desire, or are they the same line restated?'
        ],
        commonMistakes: [
          'Using company language instead of customer language.',
          'Naming a desire that the product cannot really deliver at the planned price.',
          'Stating an assumption as a fact instead of labeling it.'
        ],
        decisionSupported: 'Messaging angles, table-sign headline, and Phoenix Nest pitch language.',
        connectsTo: [
          'Chapter 7 — Segments and Customer Insights',
          'Chapter 8 — Pricing (problem severity is the basis for interest rate)',
          'Chapter 9 — Brand Value Proposition'
        ],
        ownerHint: 'Chief Strategy and Growth Officer · CMO',
        doneLooksLike:
          'Each customer group has at least one problem and one desire written in customer language; assumptions are clearly labeled.'
      }
    },
    {
      id: 'insight-evidence',
      title: 'Evidence behind the insights',
      lesson:
        'Every insight needs a source. Sources can be conversations, observations, surveys, sales conversations, or assumptions — but assumptions must be labeled as assumptions.',
      studentPrompts: [
        'For each problem or desire, name the source: feedback, observation, survey, sales conversation, or assumption.',
        'Quote real customers if you have notes — quotes are stronger than paraphrases.',
        'Mark anything that is still an assumption so it can be tested later.'
      ],
      requiredInputs: ['Source per insight', 'Assumption flag where applicable'],
      completionCriteria: [
        'Every insight has a labeled source.',
        'Assumptions are clearly marked, not disguised as facts.'
      ],
      evidencePrompt:
        'This is the section where structured evidence pays off most. Each insight gets one entry: claim, evidence, source, confidence, risk, next validation step.',
      sourceGuidance: [
        'Sources include feedback, observation, survey, sales conversation, or labeled assumption.',
        'No insight should ship without a labeled source.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'When an insight implies a number ("most students would pay $25"), back it with a Market Builder entry — audience, interest, conversion, price, confidence.'
      }
    },
    {
      id: 'feedback-plan',
      title: 'Feedback plan',
      lesson:
        'Feedback is what makes the next cohort better than this one. Plan how the team will collect feedback at the pop-up, after the pop-up, and after the Phoenix Nest pitch.',
      studentPrompts: [
        'How will the team collect customer feedback at the booth (paper, link, conversation)?',
        'What two questions will the team ask every customer?',
        'How will the feedback be stored and reviewed?'
      ],
      requiredInputs: ['Feedback method', 'Two-question script', 'Storage plan'],
      completionCriteria: [
        'Feedback collection method is named.',
        'A two-question script is written.',
        'Storage plan is named (Workbench, sheet, doc).'
      ]
    },
    {
      id: 'implications-for-launch',
      title: 'Implications for launch',
      lesson:
        'Close the insights half of the chapter with the "so what." Tie insights to specific decisions the team is making for TechTown and the Phoenix Nest pitch. The campaign half below should follow from these.',
      studentPrompts: [
        'List 3–5 launch decisions the team made because of these insights.',
        'For each decision, name the insight that drove it.',
        'Name 2 risks or unknowns that could change the plan.'
      ],
      completionCriteria: [
        'Three to five insight-driven decisions are listed with traceability.',
        'At least two risks or unknowns are named.'
      ],
      sourceGuidance: [
        'Reference the Chapter 7 demand estimate and Chapter 8 revenue scenario used to support each launch decision.',
        'Use conservative, base, and ambitious scenarios when the launch decision depends on demand.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'For each launch decision tied to demand, log the conservative / base / ambitious split. That is what the Phoenix Nest pitch will reference.'
      }
    },
    {
      id: 'audience',
      title: 'Who are we trying to reach?',
      lesson:
        'Start with the same audience the brand story picked. If the campaign is aimed at someone else, one of them is wrong.',
      studentPrompts: [
        'List the 2-3 groups you most want at the pop-up.',
        'Where do they already spend attention — Instagram, group chats, hallway conversations?'
      ],
      completionCriteria: [
        'Audience list matches the brand story; channels are specific, not generic.'
      ],
      brandFit: {
        enabled: true,
        guidance:
          'Use Brand Fit Builder to check whether the campaign audience signals match the brand identity audience. If the campaign is targeting students but the visual identity reads premium adult, flag the mismatch here.'
      },
      expertGuidance: {
        expertRole: 'CMO + channel strategist',
        whyThisMatters:
          'A campaign aimed at students looks completely different from one aimed at parents or alumni — different posts, different signage, different times of day. If the campaign audience does not match the brand audience, one of them was written from imagination.',
        whatToGather: [
          'The 2–3 audience groups copied forward from the target-customers section (the brand and the campaign should agree).',
          'Where each group already spends attention — Instagram for underclassmen, group chats for student leaders, hallway/Renaissance bulletin for parents stopping by.',
          'A short justification for each named channel — why this audience is actually there, not just "students use Instagram".'
        ],
        whereToFindIt: [
          'Chapter 9 — Brand audience block (campaign and brand should match).',
          'Chapter 7 — Segment Composer (channel preferences sometimes show up there).',
          'Whatever the team has actually observed about how Renaissance students and parents share information.'
        ],
        weakAnswerLooksLike:
          '"We will post on Instagram and TikTok and put up flyers." — every student campaign says this.',
        strongAnswerLooksLike:
          'Each named group is matched to one or two specific channels with a one-line "why" — "underclassmen → IG reels because that is where Renaissance class accounts are watched", "parents → Renaissance email + hallway flyer because we have observed they read both".',
        expertPushback: [
          'Does the campaign audience match the brand audience exactly? If not, which one is wrong?',
          'For each channel named, can the team show why this audience is actually there?',
          'Is the team relying on TikTok / Instagram by reflex even though the audience does not actually live there?'
        ],
        commonMistakes: [
          'Listing every channel the team has access to instead of the ones the audience actually uses.',
          'Diverging from the brand-story audience without flagging the mismatch.',
          'Writing channel names without owners — the touchpoints section will then be impossible to plan.'
        ],
        decisionSupported: 'Touchpoint calendar, where to spend energy in the next two weeks.',
        connectsTo: [
          'Chapter 9 — Brand audience',
          'Touchpoints section below',
          'Chapter 11 — Phoenix Nest pitch (alumni / parent audiences often overlap)'
        ],
        ownerHint: 'CMO',
        doneLooksLike:
          'Every named group has a specific channel pairing with a one-line "why we know they are there".'
      }
    },
    {
      id: 'touchpoints',
      title: 'What touchpoints?',
      lesson:
        'A touchpoint is every moment someone could see us before they show up. Signage, posts, classroom mentions, peer DMs.',
      example:
        'Week-before flyer in hallway → two IG reels → day-before text to 20 friends → day-of table signage.',
      studentPrompts: [
        'Map a 2-week timeline of every touchpoint you plan.',
        'Which touchpoints reach first-time customers vs repeat supporters?'
      ],
      requiredInputs: ['2-week touchpoint calendar'],
      completionCriteria: [
        'Calendar has at least three distinct touchpoint types.',
        'Each touchpoint has a named owner.'
      ]
    },
    {
      id: 'messaging',
      title: 'What do we say?',
      lesson:
        'Use the brand voice. Every piece of content should pass the test: "Could this only be House Phoenix?"',
      studentPrompts: [
        'Write the caption for the first announcement post.',
        'Draft the top line for the table sign.'
      ],
      requiredInputs: ['First post caption', 'Table sign headline'],
      completionCriteria: [
        'Copy reads in the brand voice and names the pop-up, date, and what to bring (cash/card).'
      ],
      brandFit: {
        enabled: true,
        guidance:
          'Use the Brand Fit Builder voice block to argue tone, vocabulary, and what the brand never says agree with the price point and target customer.'
      },
      expertGuidance: {
        expertRole: 'campaign strategist + brand voice lead',
        whyThisMatters:
          'The first post and the table-sign headline are usually the only words a stranger reads before deciding whether to walk over. They have to match the brand voice from Ch. 9, the price point from Ch. 8, and the customer language from the problems-and-desires section above. If the messaging sounds like every other school pop-up, the campaign loses before the doors open.',
        whatToGather: [
          'The first announcement post caption — full text, not a placeholder.',
          'The table-sign headline — short enough to read at six feet.',
          'The chapter-9 brand voice adjectives the team committed to (every line should pass them).',
          'A one-sentence link from each piece of copy back to a specific customer problem or desire from above.'
        ],
        whereToFindIt: [
          'Chapter 9 — Brand voice block.',
          'Chapter 8 — Price point (premium prices need premium-feeling copy; donation-only events need different copy).',
          'Customer-problems-and-desires section above (the customer language is the source).'
        ],
        weakAnswerLooksLike:
          '"Come check out the Renni pop-up at TechTown! Beanies, sweatshirts, baked goods — see you there." — generic, voiceless, no reason to walk over.',
        strongAnswerLooksLike:
          'Copy that could only be House Phoenix — voice adjectives are visible, the customer problem/desire is named, the date and what to bring (cash/card) are clear, and the price feels consistent with the words around it.',
        expertPushback: [
          'Could a different student brand publish this exact caption? If yes, rewrite.',
          'Does the headline pass the chapter-9 voice test ("would the brand never say this")?',
          'Does the copy match the price the team chose in Ch. 8?',
          'Will a Renaissance student or parent walking the hallway actually stop and read it?'
        ],
        commonMistakes: [
          'Writing in generic event-promo voice instead of brand voice.',
          'Forgetting the basics — date, location, cash/card.',
          'Picking a clever headline that does not name a real customer reason to show up.'
        ],
        decisionSupported: 'First-round content shipped (announcement post, hallway flyer, table sign).',
        connectsTo: [
          'Chapter 9 — Brand Voice',
          'Chapter 8 — Pricing tone',
          'Chapter 11 — Phoenix Nest pitch language'
        ],
        ownerHint: 'CMO',
        doneLooksLike:
          'Copy reads in House Phoenix voice, names a real customer reason to come, includes the practical info (date / cash-card), and a CMO would not be embarrassed to publish it.'
      }
    },
    {
      id: 'measurement',
      title: 'How will we know what worked?',
      lesson:
        'Even a single question at the table — "How did you hear about us?" — gives next cohort signal. No analytics required.',
      studentPrompts: [
        'What 1-2 signals will we capture pop-up day?',
        'Who owns asking?'
      ],
      completionCriteria: [
        'At least one measurement plan exists and is owned.',
        'Recap will cite what we learned.'
      ],
      sourceGuidance: [
        'Each measurement should validate one Market Builder assumption — name which scenario the result will tighten.',
        'Do not present estimates as facts; the recap is where assumptions become evidence.'
      ],
      marketBuilder: {
        enabled: true,
        guidance:
          'Use the Next-validation field on each Market Builder entry to name the measurement that tightens the assumption.'
      },
      expertGuidance: {
        expertRole: 'CMO + post-event analyst',
        whyThisMatters:
          'A pop-up that does not measure anything teaches the next cohort nothing. One question at the booth ("How did you hear about us?") is enough to name which channel actually drove arrivals — and which assumptions the team should drop. This section is where Ch. 7 / Ch. 8 / Ch. 10 assumptions become evidence.',
        whatToGather: [
          'One or two real signals the team will capture pop-up day — the question, who asks it, where it gets written down.',
          'The named owner who is responsible at-booth.',
          'The Market Builder assumption each measurement is meant to tighten (audience, interest, conversion, price, channel).',
          'Where the answers will live after the event so the recap can cite them.'
        ],
        whereToFindIt: [
          'Chapter 7 — segment assumptions that need validation.',
          'Chapter 8 — pricing scenarios that depend on conversion or interest rate.',
          'Touchpoints section above (channel signals).'
        ],
        weakAnswerLooksLike:
          '"We will track sales and ask people what they think." — no specific question, no owner, no plan for what to do with the answers.',
        strongAnswerLooksLike:
          'A specific question ("How did you hear about us?"), a named owner, a tally sheet or log it gets written into, and a one-line connection to the assumption it tightens ("validates the Ch. 7 channel hypothesis that IG reels reach underclassmen").',
        expertPushback: [
          'If we get 30 arrivals and 0 captured signals, what did we actually learn?',
          'Who at the booth is responsible for asking — does that owner know it before pop-up day?',
          'Will the recap quote this number, or will it disappear into a notebook?'
        ],
        commonMistakes: [
          'Measuring what is easy (sales count) but not what is decision-useful (channel attribution).',
          'No named owner, so the question never gets asked under booth pressure.',
          'No place to write the answer down, so signal is lost.'
        ],
        decisionSupported: 'Recap, next-cohort handoff, and which Ch. 7 / Ch. 8 / Ch. 10 assumptions get tightened.',
        connectsTo: [
          'Chapter 7 — segment assumptions',
          'Chapter 8 — pricing scenarios',
          'Recap deliverable in Ch. 12'
        ],
        ownerHint: 'CMO · COO support for at-booth ops',
        doneLooksLike:
          'A specific question, a named owner, a place to log answers, and a one-line note on which assumption the answer is meant to tighten.'
      }
    }
  ],
  requirements: [
    {
      id: 'insights-primary-customers',
      label: 'Defines primary customer groups',
      description:
        'At least two specific customer groups are named with a one-line description each.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      suggestedTaskTitle: 'Draft customer segments and insights',
      definitionOfDone:
        'CSGO drafts named customer groups with TechTown vs. Phoenix Nest emphasis.'
    },
    {
      id: 'insights-customer-needs',
      label: 'Explains what customers want or need',
      description:
        'Each customer group has at least one problem and one desire named in customer language.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'Problems and desires are written in plain customer-facing language.'
    },
    {
      id: 'insights-evidence-labeled',
      label: 'Includes labeled evidence behind every insight',
      description:
        'Every insight is tied to a source: feedback, observation, survey, sales conversation, or labeled assumption.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'No insight in the chapter is presented without a source label.'
    },
    {
      id: 'insights-to-messaging',
      label: 'Connects insights to marketing messages',
      description:
        '2–3 messaging angles, each traceable to a customer group and an insight.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      suggestedTaskTitle: 'Translate insights into messaging angles',
      definitionOfDone:
        'CMO drafts angles that fit brand voice and trace to insights.'
    },
    {
      id: 'insights-feedback-plan',
      label: 'Includes a plan for collecting more feedback',
      description:
        'Feedback method, two-question script, and storage plan are all named.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      suggestedTaskTitle: 'Create feedback collection plan',
      definitionOfDone:
        'CSGO writes the feedback plan and confirms with the COO at-booth ops.'
    },
    {
      id: 'insights-launch-implications',
      label: 'Insights tied to launch implications',
      description:
        'Chapter names 3–5 launch decisions traceable back to insights.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 10,
      suggestedTaskTitle: 'Review launch implications',
      definitionOfDone:
        'Co-CEO confirms the launch implications align with the campaign plan and Phoenix Nest pitch.'
    },
    {
      id: 'insights-risks-or-unknowns',
      label: 'Names at least two marketing risks or unknowns',
      description:
        'Two or more honest risks or unknowns that could change the marketing plan.',
      requiredForApproval: true,
      department: 'strategy-growth',
      playbookChapter: 10,
      definitionOfDone:
        'Two or more risks named with a one-line implication each.'
    },
    {
      id: 'campaign-audience-map',
      label: 'Audience + channels map',
      description:
        'Matches the brand story\'s audience with the channels you\'ll actually use.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10
    },
    {
      id: 'campaign-calendar',
      label: 'Two-week touchpoint calendar',
      description:
        'Every touchpoint has a date, a channel, and a named owner.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      suggestedTaskTitle: 'Build the 2-week touchpoint calendar',
      definitionOfDone:
        'Calendar linked from the deliverable; each row has a named owner.'
    },
    {
      id: 'campaign-content-first-round',
      label: 'First-round content shipped',
      description:
        'Announcement post, hallway flyer, and table-sign headline approved by CMO.',
      requiredForApproval: true,
      department: 'marketing',
      playbookChapter: 10,
      evidenceType: 'content-assets'
    },
    {
      id: 'campaign-measurement',
      label: 'Measurement plan',
      description:
        'At least one "how did you hear about us?" signal captured at the pop-up table.',
      requiredForApproval: false,
      department: 'marketing',
      playbookChapter: 10
    }
  ],
  suggestedTasks: [
    {
      title: 'Draft customer segments and insights',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'insights-primary-customers',
      definitionOfDone:
        'CSGO drafts customer groups, problems, desires, and labels evidence sources.',
      dueOffsetDays: 3
    },
    {
      title: 'Translate insights into messaging angles',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'insights-to-messaging',
      dependency: 'insights-primary-customers',
      definitionOfDone:
        'CMO drafts 2–3 angles that fit brand voice and trace back to insights.',
      dueOffsetDays: 5
    },
    {
      title: 'Connect channels and touchpoints',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-audience-map',
      dependency: 'insights-to-messaging',
      definitionOfDone:
        'TechTown touchpoints mapped with leading angles assigned per touchpoint.',
      dueOffsetDays: 6
    },
    {
      title: 'Create feedback collection plan',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'insights-feedback-plan',
      definitionOfDone:
        'Feedback plan written; two-question script confirmed with COO and CMO.',
      dueOffsetDays: 5
    },
    {
      title: 'Review launch implications',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'insights-launch-implications',
      definitionOfDone:
        'Co-CEO confirms launch implications align with the pricing, ops, and pitch chapters.',
      dueOffsetDays: 7
    },
    {
      title: 'Map audience + channels from brand story',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-audience-map',
      dependency: 'brand-audience',
      dueOffsetDays: 3
    },
    {
      title: 'Build the 2-week touchpoint calendar',
      department: 'marketing',
      ownerRole: 'cmo',
      requirementId: 'campaign-calendar',
      definitionOfDone:
        'Calendar has dates, channels, copy stubs, and named owners.',
      dueOffsetDays: 6
    },
    {
      title: 'Ship announcement post + hallway flyer + table sign',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'campaign-content-first-round',
      dependency: 'campaign-calendar',
      dueOffsetDays: 10
    },
    {
      title: 'Capture "how did you hear about us?" at the table',
      department: 'marketing',
      ownerRole: 'member',
      requirementId: 'campaign-measurement',
      dueOffsetDays: 14
    }
  ],
  requiredEvidence: [
    {
      id: 'insights-feedback-notes',
      label: 'Customer feedback notes or survey link',
      description:
        'Notes from real customer feedback, or a survey link if available.',
      required: false
    },
    {
      id: 'insights-observation-notes',
      label: 'Observation notes',
      description:
        'Notes from watching real customers at past pop-ups, the school store, or comparable events.',
      required: false
    },
    {
      id: 'insights-marketing-content',
      label: 'Marketing content examples',
      description:
        'Drafts of social posts, signage, booth scripts that show the angles in action.',
      required: false
    },
    {
      id: 'insights-techtown-channel-plan',
      label: 'TechTown outreach / channel plan',
      description:
        'Plan or schedule for pre-event and at-event marketing.',
      required: true
    },
    {
      id: 'insights-phoenix-nest-assumptions',
      label: 'Phoenix Nest pitch assumptions',
      description:
        'Notes on what the team is assuming about Phoenix Nest buyers and the carry pitch.',
      required: false
    },
    {
      id: 'calendar-doc',
      label: 'Touchpoint calendar',
      description: 'Linked from the deliverable; owners named on each row.',
      required: true
    },
    {
      id: 'content-assets',
      label: 'First-round content assets',
      description: 'Post, flyer, and sign saved to the marketing folder.',
      required: true
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique a caption after you write it.',
      'Suggest missing touchpoints for your audience.',
      'Reformat your calendar for clarity.'
    ],
    disallowedHelp: [
      'Writing the announcement post from scratch.',
      'Inventing audience insight you have not validated.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
