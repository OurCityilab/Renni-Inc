// Customer Archetype Library — Renni Inc. starter hypotheses.
//
// Pure data + pure helpers. No Firestore, no AI, no /api/* calls.
// Drives the CustomerArchetypePicker so students can choose
// likely customer types from a card deck instead of inventing
// archetypes from a blank page.
//
// POSTURE (do not relax)
// ----------------------
//   - Archetypes are STARTING HYPOTHESES, not verified facts. Every
//     UI surface that consumes this data must repeat the message
//     so the team validates with real evidence before using an
//     archetype as ground for decisions.
//   - Profile / quote / needs / objections / channels copy is
//     drawn from docs/next-wave-student-success-and-advisor-mentor-architecture.md.
//     If the source-of-truth doc shifts, sync this file before
//     the next deploy.
//   - The library is intentionally small (15 archetypes) so the
//     picker stays scannable on phone width.

export type CustomerArchetypeId =
  | 'renaissance-student'
  | 'senior-student'
  | 'underclass-student'
  | 'alumni'
  | 'parent-family-supporter'
  | 'teacher-staff'
  | 'school-spirit-buyer'
  | 'gift-buyer'
  | 'community-supporter'
  | 'pop-up-impulse-buyer'
  | 'phoenix-nest-retail-buyer'
  | 'donation-supporter'
  | 'brand-story-buyer'
  | 'budget-conscious-student'
  | 'premium-support-the-mission-buyer'

export interface CustomerArchetype {
  id: CustomerArchetypeId
  label: string
  shortProfile: string
  exampleQuote: string
  likelyNeeds: string[]
  likelyObjections: string[]
  likelyProducts: string[]
  likelyChannels: string[]
  evidenceToCollect: string[]
  whatNotToAssume: string[]
  /** Section ids this archetype is most useful for. The picker
   *  uses this to suggest relevant archetypes per section. */
  bestForSections: string[]
}

export const customerArchetypes: readonly CustomerArchetype[] = [
  {
    id: 'renaissance-student',
    label: 'Renaissance student',
    shortProfile:
      'Current student who wants identity and school connection.',
    exampleQuote: 'I want something that feels like us.',
    likelyNeeds: [
      'Visible school identity in everyday wear',
      'Designs that signal pride to peers',
      'Confidence the gear looks like Renaissance, not generic'
    ],
    likelyObjections: [
      'Is this only for one type of student?',
      'Will I actually wear this outside school?',
      'Will my friends recognize the design?'
    ],
    likelyProducts: ['T-shirts', 'Beanies', 'Sweatshirts'],
    likelyChannels: [
      'School events',
      'Student word of mouth',
      'Hallway / cafeteria buzz'
    ],
    evidenceToCollect: [
      'Student survey or hallway feedback on designs',
      'Pre-order interest count',
      'Photos of students wearing comparable gear'
    ],
    whatNotToAssume: [
      'All students want the same style or fit',
      'Identity gear sells itself — even peers need a story'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'target-customers',
      'customer-problems-and-desires'
    ]
  },
  {
    id: 'senior-student',
    label: 'Senior student',
    shortProfile:
      'Student near graduation who wants memory, status, or legacy.',
    exampleQuote: 'I want something that marks senior year.',
    likelyNeeds: [
      'Sentimental keepsake gear they can wear after graduation',
      'A "senior" feel — nicer fabric or more thoughtful design',
      'Something they would wear at college or in a hometown setting'
    ],
    likelyObjections: [
      'Is this priced too high for what I get?',
      'Will I still wear this in a year?',
      'Is the design too tied to underclass kids?'
    ],
    likelyProducts: ['Sweatshirts', 'Premium tees', 'Donations'],
    likelyChannels: [
      'Senior events',
      'Class-of channels',
      'Senior parent newsletters'
    ],
    evidenceToCollect: [
      'Senior class feedback on premium options',
      'Past senior-event demand patterns',
      'Willingness-to-pay informal survey'
    ],
    whatNotToAssume: [
      'Seniors will pay any price because they\'re leaving',
      'A general design works just because it has the year on it'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'pricing-summary',
      'target-customers'
    ]
  },
  {
    id: 'underclass-student',
    label: 'Underclass student',
    shortProfile:
      'Younger student looking for belonging and affordable gear.',
    exampleQuote: 'I want something I can wear all year.',
    likelyNeeds: [
      'Something that signals they belong here',
      'Price low enough to fit allowance or family budget',
      'Designs that look good in everyday school photos'
    ],
    likelyObjections: [
      'Is this too expensive for my parents to say yes?',
      'Will the older kids think this is for them?',
      'Will I outgrow it before I get to wear it?'
    ],
    likelyProducts: ['T-shirts', 'Beanies'],
    likelyChannels: [
      'School announcements',
      'Peer recommendation',
      'Family communications'
    ],
    evidenceToCollect: [
      'Grade-level interest snapshot',
      'Price-sensitivity comments',
      'Sample order forms returned'
    ],
    whatNotToAssume: [
      'Underclass students already know the brand story',
      'They have direct buying power — most decisions go through family'
    ],
    bestForSections: [
      'customer-segments',
      'audience',
      'pricing-risks',
      'target-customers'
    ]
  },
  {
    id: 'alumni',
    label: 'Alumni',
    shortProfile: 'Former student who wants connection to Renaissance.',
    exampleQuote: 'I still want to support the school.',
    likelyNeeds: [
      'A way to stay connected to Renaissance after graduating',
      'Gear that signals continued affiliation, not nostalgia overload',
      'A path to support the school beyond a one-time donation'
    ],
    likelyObjections: [
      'Is this just current-student gear with a new color?',
      'Where do I even buy this if I\'m not on campus?',
      'Will my donation actually reach students?'
    ],
    likelyProducts: ['Sweatshirts', 'Donations', 'Gift items'],
    likelyChannels: [
      'Alumni outreach',
      'School network email lists',
      'LinkedIn / class-year groups'
    ],
    evidenceToCollect: [
      'Alumni replies to outreach',
      'Donation interest signals',
      'Purchase intent in informal alumni conversations'
    ],
    whatNotToAssume: [
      'Alumni want exactly what current students want',
      'All alumni have the same comfort with online ordering'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'target-customers',
      'donation-scenarios'
    ]
  },
  {
    id: 'parent-family-supporter',
    label: 'Parent / family supporter',
    shortProfile:
      'Adult buying to support a student or the school mission.',
    exampleQuote: 'I want to support what students built.',
    likelyNeeds: [
      'A simple way to buy that respects their time',
      'Confidence the product is real and shipped well',
      'Something the student will actually wear or use'
    ],
    likelyObjections: [
      'Is the sizing reliable?',
      'Will my student be embarrassed by this?',
      'Is this a fair price for what I\'m getting?'
    ],
    likelyProducts: ['Sweatshirts', 'Donations', 'Baked goods'],
    likelyChannels: [
      'School events',
      'Family communications',
      'Parent / family newsletters'
    ],
    evidenceToCollect: [
      'Parent interest at events',
      'Donation intent comments',
      'Sizing / quality feedback from past purchases'
    ],
    whatNotToAssume: [
      'Family budgets are unlimited or all-in for the school',
      'Parents will accept any price tag because it supports students'
    ],
    bestForSections: [
      'customer-segments',
      'audience',
      'donation-scenarios',
      'target-customers'
    ]
  },
  {
    id: 'teacher-staff',
    label: 'Teacher / staff',
    shortProfile:
      'School staff member buying for school pride and support.',
    exampleQuote: 'I want to back the students.',
    likelyNeeds: [
      'A wearable way to back the team without speech-making',
      'Designs that read professional in school settings',
      'Easy in-school purchase'
    ],
    likelyObjections: [
      'Is this only sized for students?',
      'Will the design read OK on staff at parent night?',
      'Can I order without having to chase students down?'
    ],
    likelyProducts: ['T-shirts', 'Baked goods', 'Donations'],
    likelyChannels: [
      'Staff announcements',
      'In-school sales',
      'Staff lounge flyer'
    ],
    evidenceToCollect: [
      'Staff feedback on past sales',
      'Repeat-purchase comments',
      'Sizing / fit feedback'
    ],
    whatNotToAssume: [
      'Staff want the same designs students want',
      'Every staff member is comfortable wearing branded gear publicly'
    ],
    bestForSections: [
      'customer-segments',
      'audience',
      'target-customers'
    ]
  },
  {
    id: 'school-spirit-buyer',
    label: 'School-spirit buyer',
    shortProfile: 'Buyer motivated by Renaissance identity.',
    exampleQuote: 'I want gear that shows pride.',
    likelyNeeds: [
      'A clear Renaissance identity on the product',
      'Pride-forward design that reads at distance',
      'A reason to buy beyond the logo'
    ],
    likelyObjections: [
      'Is this just a logo on a generic blank?',
      'Does this look like every other school\'s gear?',
      'Will the design hold up after a few washes?'
    ],
    likelyProducts: ['Tees', 'Sweatshirts', 'Beanies'],
    likelyChannels: ['Pop-up', 'School events'],
    evidenceToCollect: [
      'Design preference votes',
      'Past spirit-week sale data',
      'Photos of comparable gear in use'
    ],
    whatNotToAssume: [
      'School spirit converts on logo alone — story matters',
      'Designs work everywhere — venue matters'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'target-customers'
    ]
  },
  {
    id: 'gift-buyer',
    label: 'Gift buyer',
    shortProfile: 'Buyer purchasing for someone else.',
    exampleQuote: 'I need something easy to give.',
    likelyNeeds: [
      'A safe choice in size / color',
      'Wrappable or display-ready packaging',
      'Confidence the recipient will use or wear it'
    ],
    likelyObjections: [
      'What size do they wear?',
      'Is this gift-presentable without effort from me?',
      'What if it doesn\'t fit?'
    ],
    likelyProducts: ['Beanies', 'Sweatshirts', 'Baked goods'],
    likelyChannels: ['Events', 'Family outreach'],
    evidenceToCollect: [
      'Gift use cases the team has heard',
      'Sizing / color preference signals'
    ],
    whatNotToAssume: [
      'Gift buyers will pay for premium packaging without seeing it',
      'Returns are available; they often are not'
    ],
    bestForSections: [
      'customer-segments',
      'audience',
      'target-customers'
    ]
  },
  {
    id: 'community-supporter',
    label: 'Community supporter',
    shortProfile:
      'Local supporter motivated by the student-business story.',
    exampleQuote: 'I want to support young entrepreneurs.',
    likelyNeeds: [
      'A clear story about the student-run business',
      'A path to support beyond a single purchase',
      'Confidence the money goes back into the program'
    ],
    likelyObjections: [
      'Where exactly does the money go?',
      'Is this a school activity or a real company?',
      'How is this different from a fundraiser?'
    ],
    likelyProducts: ['Donations', 'Sweatshirts', 'Baked goods'],
    likelyChannels: [
      'TechTown pop-up',
      'Community events',
      'Local business newsletters'
    ],
    evidenceToCollect: [
      'Story-response notes from conversations',
      'Donation behavior at past events',
      'Comments and questions at the table'
    ],
    whatNotToAssume: [
      'Supporters already know what House Phoenix is',
      'Supporters\' interest is unconditional — story has to land'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'donation-scenarios',
      'target-customers'
    ]
  },
  {
    id: 'pop-up-impulse-buyer',
    label: 'Pop-up impulse buyer',
    shortProfile: 'Event visitor deciding quickly.',
    exampleQuote: 'This looks good. How much is it?',
    likelyNeeds: [
      'A 10-second hook that lands at the table',
      'A clear price they can decide on without doing math',
      'Quick checkout — Square is the external POS'
    ],
    likelyObjections: [
      'I do not have time for a long pitch',
      'I am not sure I want to carry this around the rest of the day',
      'Is the price worth it for an event purchase?'
    ],
    likelyProducts: ['Baked goods', 'Beanies', 'Tees'],
    likelyChannels: ['TechTown pop-up'],
    evidenceToCollect: [
      'Table observations of fast-vs-slow buyers',
      'Quick-sale notes after the event',
      'Common questions overheard at the table'
    ],
    whatNotToAssume: [
      'Long pitches will work mid-event',
      'A complicated price will land in 10 seconds'
    ],
    bestForSections: [
      'customer-segments',
      'channels',
      'target-customers',
      'messaging'
    ]
  },
  {
    id: 'phoenix-nest-retail-buyer',
    label: 'Phoenix Nest retail buyer',
    shortProfile:
      'School-store decision maker evaluating carry fit.',
    exampleQuote: 'Will this sell and be easy to manage?',
    likelyNeeds: [
      'Defensible margin and pricing logic',
      'Clear inventory readiness story',
      'A small set of SKUs that fit the shelf'
    ],
    likelyObjections: [
      'Will this actually sell in our store?',
      'Will reorders / restocks be reliable?',
      'Is the wholesale price viable for our model?'
    ],
    likelyProducts: ['Core SKUs with margin proof'],
    likelyChannels: ['Phoenix Nest pitch'],
    evidenceToCollect: [
      'Margin and break-even tables',
      'Inventory-readiness signals',
      'Past shelf-fit comparables or photos'
    ],
    whatNotToAssume: [
      'A retail buyer is the same as the end customer',
      'Their decision criteria match a student\'s'
    ],
    bestForSections: [
      'evidence',
      'offer',
      'ask',
      'retail-recommendations'
    ]
  },
  {
    id: 'donation-supporter',
    label: 'Donation supporter',
    shortProfile: 'Person who contributes because of mission.',
    exampleQuote: 'I may not need a product, but I want to help.',
    likelyNeeds: [
      'A no-friction way to give',
      'Clarity on what the donation funds',
      'A short story they can repeat to others'
    ],
    likelyObjections: [
      'Is this a real donation or a sale in disguise?',
      'How will I know my contribution mattered?',
      'Will my employer match this?'
    ],
    likelyProducts: ['Donations'],
    likelyChannels: [
      'Events',
      'Family / community outreach',
      'TechTown pop-up donation tile'
    ],
    evidenceToCollect: [
      'Donation notes from past events',
      'Story-response feedback',
      'Recurring donor signals'
    ],
    whatNotToAssume: [
      'Donations behave like product sales',
      'Donations roll into product margin or break-even calculations'
    ],
    bestForSections: [
      'donation-scenarios',
      'revenue-streams',
      'customer-segments'
    ]
  },
  {
    id: 'brand-story-buyer',
    label: 'Brand / story buyer',
    shortProfile:
      'Customer buying because the story feels meaningful.',
    exampleQuote: 'I like what this represents.',
    likelyNeeds: [
      'A story that lands in 1–2 sentences',
      'Visual cues that match the story',
      'A reason this product exists, not just what it is'
    ],
    likelyObjections: [
      'Is this story real or marketing?',
      'Why does this exist if every school sells branded gear?',
      'Will the story age well in a year?'
    ],
    likelyProducts: ['Sweatshirts', 'Tees', 'Donations'],
    likelyChannels: ['Social content', 'Event storytelling'],
    evidenceToCollect: [
      'Story-resonance feedback',
      'Comments on social posts',
      'Interview snippets from supporters'
    ],
    whatNotToAssume: [
      'Adding more story always helps — sometimes it overloads',
      'Every customer cares equally about the story'
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'voice',
      'identity'
    ]
  },
  {
    id: 'budget-conscious-student',
    label: 'Budget-conscious student',
    shortProfile: 'Student with limited spending power.',
    exampleQuote: 'I like it, but I need it to be affordable.',
    likelyNeeds: [
      'A real entry-level product they can afford',
      'A clear "what does $X get me" choice',
      'Confidence they\'re not getting cheaper-than-the-friend version'
    ],
    likelyObjections: [
      'Is the cheaper item just a worse version?',
      'Will I regret saving the $5?',
      'Will I miss out on the design everyone is wearing?'
    ],
    likelyProducts: [
      'T-shirts',
      'Baked goods',
      'Lower-price items'
    ],
    likelyChannels: ['School events', 'Peer sales'],
    evidenceToCollect: [
      'Price-feedback signals at events',
      'Affordability survey or short poll',
      'Conversion delta vs. premium item'
    ],
    whatNotToAssume: [
      'Lowest price is the only thing they value',
      'Cheaper products always sell more — design + brand still matter'
    ],
    bestForSections: [
      'pricing-summary',
      'pricing-risks',
      'customer-segments',
      'target-customers'
    ]
  },
  {
    id: 'premium-support-the-mission-buyer',
    label: 'Premium / support-the-mission buyer',
    shortProfile:
      'Buyer willing to pay more for quality and mission.',
    exampleQuote: 'I\'ll pay more if it feels worth it.',
    likelyNeeds: [
      'Material / craftsmanship that matches the price',
      'A story that justifies the premium',
      'A choice that signals support, not just consumption'
    ],
    likelyObjections: [
      'Is this actually higher quality, or just priced higher?',
      'Is the mission story believable?',
      'Where does the extra dollar actually go?'
    ],
    likelyProducts: ['Sweatshirts', 'Premium tees', 'Donations'],
    likelyChannels: [
      'Story-driven pitch',
      'Community events',
      'Phoenix Nest pitch'
    ],
    evidenceToCollect: [
      'Willingness-to-pay feedback',
      'Story resonance at premium price point',
      'Past comparable premium purchases'
    ],
    whatNotToAssume: [
      'Premium price alone signals premium quality',
      'Mission story will land for every premium buyer'
    ],
    bestForSections: [
      'pricing-summary',
      'value-propositions',
      'donation-scenarios',
      'target-customers'
    ]
  }
] as const

// ---- Helpers -----------------------------------------------------

const ARCHETYPE_INDEX: Readonly<Record<CustomerArchetypeId, CustomerArchetype>> =
  Object.freeze(
    customerArchetypes.reduce<Record<string, CustomerArchetype>>((acc, a) => {
      acc[a.id] = a
      return acc
    }, {}) as Record<CustomerArchetypeId, CustomerArchetype>
  )

export function getCustomerArchetypeById(
  id: string | undefined | null
): CustomerArchetype | null {
  if (!id) return null
  return (
    (ARCHETYPE_INDEX as Record<string, CustomerArchetype | undefined>)[id] ??
    null
  )
}

/** Returns archetypes whose `bestForSections` includes the given
 *  section id. Empty array when sectionId is missing or no
 *  archetype lists it. The picker uses this to highlight the
 *  most relevant archetypes for the active section. */
export function archetypesForSection(
  sectionId: string | undefined | null
): CustomerArchetype[] {
  if (!sectionId) return []
  return customerArchetypes.filter((a) =>
    a.bestForSections.includes(sectionId)
  )
}

/** Compact archetype summary used by the Advisor V2 context. Every
 *  field is a short string so the embedded JSON stays small. */
export interface ArchetypeLibrarySummaryEntry {
  id: CustomerArchetypeId
  label: string
  shortProfile: string
  bestForSections: readonly string[]
}

export function archetypeLibrarySummary(): ArchetypeLibrarySummaryEntry[] {
  return customerArchetypes.map((a) => ({
    id: a.id,
    label: a.label,
    shortProfile: a.shortProfile,
    bestForSections: a.bestForSections
  }))
}

/** Builds a markdown block the picker can copy into Working Draft.
 *  Skips archetypes the chief / student didn't select. Custom
 *  notes are inlined per archetype when present. */
export function formatArchetypesAsMarkdown(
  selectedIds: readonly CustomerArchetypeId[],
  customNotes?: Readonly<Partial<Record<CustomerArchetypeId, string>>>
): string {
  if (selectedIds.length === 0) {
    return '_No customer archetypes selected yet._'
  }
  const blocks = selectedIds
    .map((id) => getCustomerArchetypeById(id))
    .filter((a): a is CustomerArchetype => a !== null)
    .map((a) => buildArchetypeBlock(a, customNotes?.[a.id] ?? ''))
  return ['## Customer archetypes (starting hypotheses)', ...blocks].join('\n\n')
}

function buildArchetypeBlock(
  a: CustomerArchetype,
  customNote: string
): string {
  const lines: string[] = [`### ${a.label}`]
  lines.push(`- **Profile:** ${a.shortProfile}`)
  lines.push(`- **Example quote:** "${a.exampleQuote}"`)
  if (customNote.trim()) {
    lines.push(`- **How this customer shows up for Renni Inc.:** ${customNote.trim()}`)
  }
  if (a.likelyNeeds.length) {
    lines.push(`- **Likely needs:** ${a.likelyNeeds.join('; ')}`)
  }
  if (a.likelyObjections.length) {
    lines.push(`- **Likely objections:** ${a.likelyObjections.join('; ')}`)
  }
  if (a.likelyProducts.length) {
    lines.push(`- **Likely products:** ${a.likelyProducts.join(', ')}`)
  }
  if (a.likelyChannels.length) {
    lines.push(`- **Likely channels:** ${a.likelyChannels.join(', ')}`)
  }
  if (a.evidenceToCollect.length) {
    lines.push(`- **Evidence to collect:** ${a.evidenceToCollect.join('; ')}`)
  }
  if (a.whatNotToAssume.length) {
    lines.push(`- **What not to assume:** ${a.whatNotToAssume.join('; ')}`)
  }
  return lines.join('\n')
}
