// Customer Archetype Library — Renni Inc. national hypotheses.
//
// Pure data + pure helpers. No Firestore, no AI, no /api/* calls.
// Drives the CustomerArchetypePicker so students can choose
// nationally usable customer/lifestyle archetypes from a card deck
// instead of inventing segments from a blank page.
//
// POSTURE (do not relax)
// ----------------------
//   - Archetypes are STARTING HYPOTHESES, not verified facts. Every
//     UI surface that consumes this data must repeat the message
//     so the team validates with real evidence before using an
//     archetype as ground for decisions.
//   - This picker uses the same 10 Renni-original, PRIZM / ESRI-
//     inspired archetype ids as the deterministic Customer Profile
//     Builder classifier. It does not copy proprietary segment names
//     or descriptions.
//   - National archetype first. Local Renaissance / Detroit /
//     TechTown / Phoenix Nest roles appear only as applications or
//     contexts, never as the core archetype label.
//   - The library is intentionally compact so the picker stays
//     scannable on phone width and the Advisor context remains small.

import type { CustomerProfileArchetypeId } from '../types/sectionEngines'

export type CustomerArchetypeId = CustomerProfileArchetypeId

export type CustomerArchetypeApplicationContext =
  | 'Renaissance'
  | 'Detroit'
  | 'TechTown'
  | 'Phoenix Nest'
  | 'General'

export interface CustomerArchetype {
  id: CustomerArchetypeId
  label: string
  shortProfile: string
  exampleQuote: string
  demographicFingerprint: string[]
  lifestyleFingerprint: string[]
  likelyNeeds: string[]
  likelyObjections: string[]
  likelyProducts: string[]
  likelyChannels: string[]
  evidenceToCollect: string[]
  whatNotToAssume: string[]
  localApplications: Array<{
    context: CustomerArchetypeApplicationContext
    example: string
  }>
  /** Section ids this archetype is most useful for. The picker
   *  uses this to suggest relevant archetypes per section. */
  bestForSections: string[]
}

export const customerArchetypes: readonly CustomerArchetype[] = [
  {
    id: 'rising-city-renters',
    label: 'Rising City Renters',
    shortProfile:
      'Early-career city renters building identity while watching discretionary spending.',
    exampleQuote:
      'I like products that feel current, local, and worth the money.',
    demographicFingerprint: [
      'Young adult or early-career household',
      'Often renting with roommates, partner, or alone',
      'Dense city or urban neighborhood',
      'Tight to moderate discretionary spending'
    ],
    lifestyleFingerprint: [
      'Discovers products through mobile, social, local pop-ups, and peers',
      'Uses style to signal identity and belonging',
      'Will compare price against everyday budget pressure'
    ],
    likelyNeeds: [
      'Clear style reason to buy now',
      'Entry price or obvious value at the price',
      'Mobile-friendly story and product proof'
    ],
    likelyObjections: [
      'Is this worth it compared with cheaper apparel?',
      'Will I actually wear this outside one event?',
      'Is the brand for people like me?'
    ],
    likelyProducts: ['T-shirts', 'Beanies', 'lower-price accessories'],
    likelyChannels: [
      'TechTown pop-up',
      'Social proof',
      'Peer recommendation',
      'Short mobile content'
    ],
    evidenceToCollect: [
      'Quick interview with an early-career or college-age buyer',
      'Price reaction at the table',
      'Observation of which design gets picked up first'
    ],
    whatNotToAssume: [
      'Urban or young automatically means high spending power',
      'Social-media interest equals purchase intent',
      'A student buyer role is the whole archetype'
    ],
    localApplications: [
      {
        context: 'Renaissance',
        example:
          'A current or recent student can be a Rising City Renter if the buying logic is style, identity, and budget tradeoff.'
      },
      {
        context: 'TechTown',
        example:
          'A walk-up buyer may impulse-check a beanie or tee if the story and price are clear in under 30 seconds.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'pricing-risks',
      'target-customers',
      'messaging'
    ]
  },
  {
    id: 'value-driven-family-households',
    label: 'Value-Driven Family Households',
    shortProfile:
      'Family household stretching a finite budget and buying when value is concrete.',
    exampleQuote:
      'I can support it if the price makes sense and the product will get used.',
    demographicFingerprint: [
      'Parent, guardian, or family household',
      'One or more children or dependents at home',
      'Urban, suburban, or second-city setting',
      'Tight to value-conscious discretionary budget'
    ],
    lifestyleFingerprint: [
      'Compares purchases against household needs',
      'Responds to practical value and durability',
      'May support student work when the use case is clear'
    ],
    likelyNeeds: [
      'Sizing, quality, and use case clarity',
      'A price that feels fair for the household',
      'A simple explanation of what the purchase supports'
    ],
    likelyObjections: [
      'Will this fit or last?',
      'Is this a fair use of family money?',
      'Is this fundraiser-style support or a product worth buying?'
    ],
    likelyProducts: ['T-shirts', 'Beanies', 'baked goods', 'donations'],
    likelyChannels: [
      'Family communication',
      'School events',
      'In-person table pitch',
      'Simple order-interest form'
    ],
    evidenceToCollect: [
      'Family price reaction',
      'Sizing and quality questions',
      'Which product a family member would actually choose'
    ],
    whatNotToAssume: [
      'Support for students removes price sensitivity',
      'Every parent or family buyer wants the same design',
      'Household role is the same thing as the archetype'
    ],
    localApplications: [
      {
        context: 'Renaissance',
        example:
          'Parent/family supporter becomes a local application when the household is weighing school support against budget.'
      },
      {
        context: 'General',
        example:
          'Any family buyer may fit if value, durability, and practical use drive the decision.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'pricing-summary',
      'target-customers',
      'donation-scenarios'
    ]
  },
  {
    id: 'settled-suburban-households',
    label: 'Settled Suburban Households',
    shortProfile:
      'Established household with stable routines, comfortable spending, and preference for trusted convenience.',
    exampleQuote:
      'If it is easy, good quality, and feels trustworthy, I will consider it.',
    demographicFingerprint: [
      'Midlife or established household',
      'Often homeowner or long-term resident',
      'Inner-ring, outer-suburban, or second-city setting',
      'Moderate to comfortable discretionary spending'
    ],
    lifestyleFingerprint: [
      'Values convenience and reliability',
      'Researches or asks trusted people before buying',
      'Responds to clear quality and a low-friction path'
    ],
    likelyNeeds: [
      'Clear product quality signals',
      'Simple purchase and pickup process',
      'Trust that the student-run operation can fulfill'
    ],
    likelyObjections: [
      'Will this be easy to buy and receive?',
      'Is the product quality predictable?',
      'Is the story strong enough to choose this over a familiar brand?'
    ],
    likelyProducts: ['Sweatshirts', 'Beanies', 'giftable apparel'],
    likelyChannels: [
      'Family and community networks',
      'Retail carry',
      'School events',
      'Trusted adult referral'
    ],
    evidenceToCollect: [
      'Adult buyer interview',
      'Quality and fulfillment questions',
      'Reaction to retail carry or pre-order process'
    ],
    whatNotToAssume: [
      'Suburban household means automatic premium willingness',
      'Trust exists before quality and fulfillment are proven',
      'They will tolerate unclear logistics'
    ],
    localApplications: [
      {
        context: 'Phoenix Nest',
        example:
          'A school-store buyer may care about this end customer because they want reliable, giftable products with low support burden.'
      },
      {
        context: 'Detroit',
        example:
          'A metro Detroit supporter may fit when quality, convenience, and trust drive the decision.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'target-customers',
      'offer',
      'ask'
    ]
  },
  {
    id: 'established-affluent-households',
    label: 'Established Affluent Households',
    shortProfile:
      'High-discretionary-spending household that pays premium prices when quality, design, and story are credible.',
    exampleQuote:
      'I will pay more if the product feels designed, made well, and meaningful.',
    demographicFingerprint: [
      'Established adult household',
      'Comfortable to affluent discretionary spending',
      'Urban, suburban, or destination retail context',
      'Often professional, managerial, or entrepreneurial'
    ],
    lifestyleFingerprint: [
      'Buys selectively rather than only cheaply',
      'Responds to premium presentation and credible story',
      'May compare against boutique, local-made, or premium apparel'
    ],
    likelyNeeds: [
      'Quality proof that supports the price',
      'A brand story that sounds mature and specific',
      'Visual presentation that feels retail-ready'
    ],
    likelyObjections: [
      'Is this actually premium or just priced high?',
      'Does the finish match the story?',
      'Would I choose this over a known premium brand?'
    ],
    likelyProducts: ['Sweatshirts', 'premium tees', 'retail-ready bundles'],
    likelyChannels: [
      'Phoenix Nest pitch',
      'Community retail',
      'Story-led event pitch',
      'Gift recommendation'
    ],
    evidenceToCollect: [
      'Willingness-to-pay interview',
      'Comparable premium product research',
      'Quality reaction to sample materials or photos'
    ],
    whatNotToAssume: [
      'Higher income means automatic purchase',
      'Mission can replace product quality',
      'Premium pricing is credible without comparable evidence'
    ],
    localApplications: [
      {
        context: 'Phoenix Nest',
        example:
          'Useful when arguing that House Phoenix can sit beside higher-quality Detroit-made goods.'
      },
      {
        context: 'TechTown',
        example:
          'A premium-oriented visitor may buy if material proof and story are visible at the table.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'pricing-summary',
      'target-customers',
      'evidence',
      'ask'
    ]
  },
  {
    id: 'practical-small-town-households',
    label: 'Practical Small-Town Households',
    shortProfile:
      'Practical household outside dense city cores that values durability, utility, and easy access.',
    exampleQuote:
      'I like local things, but it has to be useful and not complicated.',
    demographicFingerprint: [
      'Small-town, exurban, rural, or second-city household',
      'Wide age range',
      'Often homeowner or long-term resident',
      'Moderate to value-conscious spending'
    ],
    lifestyleFingerprint: [
      'Values products that last and work',
      'Prefers straightforward purchase and pickup',
      'May support local or school-based work when the offer is practical'
    ],
    likelyNeeds: [
      'Plain product benefits',
      'Durability and care details',
      'Clear access path without complicated ordering'
    ],
    likelyObjections: [
      'Is this practical enough for the price?',
      'How do I get it if I am not near the event?',
      'Will it hold up?'
    ],
    likelyProducts: ['Beanies', 'sweatshirts', 'durable basics'],
    likelyChannels: [
      'Community referral',
      'Pop-up with clear pickup',
      'Retail carry',
      'Simple order-interest list'
    ],
    evidenceToCollect: [
      'Questions about durability and access',
      'Feedback from buyers outside the school building',
      'Comparable local product prices'
    ],
    whatNotToAssume: [
      'Non-urban means disconnected from the brand story',
      'Practical buyers do not care about design',
      'They will navigate a complex purchase path'
    ],
    localApplications: [
      {
        context: 'General',
        example:
          'A relative, community supporter, or local craft buyer may fit if practicality and access drive the decision.'
      },
      {
        context: 'Detroit',
        example:
          'Metro-area buyers outside the immediate school network may still value Detroit-made proof and simple logistics.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'channels',
      'customer-relationships',
      'inventory-readiness',
      'target-customers'
    ]
  },
  {
    id: 'legacy-stage-affluent-households',
    label: 'Legacy-Stage Affluent Households',
    shortProfile:
      'Empty-nest or later-stage affluent household whose spending often shifts toward gifting, hosting, legacy, and deliberate giving.',
    exampleQuote:
      'I like buying things that have a story and can be gifted well.',
    demographicFingerprint: [
      'Later-stage adult household',
      'Often empty-nest or near empty-nest',
      'Comfortable to affluent discretionary spending',
      'May have alumni, civic, or family legacy ties'
    ],
    lifestyleFingerprint: [
      'Uses purchases as gifts, gestures, or legacy support',
      'Responds to polished presentation and continuity story',
      'May support youth, school, or civic ventures deliberately'
    ],
    likelyNeeds: [
      'Gift-ready presentation',
      'A clear legacy or continuity story',
      'Confidence that the purchase supports a durable program'
    ],
    likelyObjections: [
      'Is this meaningful enough to gift?',
      'Will the program continue after this cohort?',
      'Is the quality high enough for the price?'
    ],
    likelyProducts: ['Sweatshirts', 'gift bundles', 'donations'],
    likelyChannels: [
      'Alumni outreach',
      'Family and civic networks',
      'Phoenix Nest retail',
      'Story-led events'
    ],
    evidenceToCollect: [
      'Alumni or adult supporter interview',
      'Gift use-case feedback',
      'Reaction to continuity and next-cohort story'
    ],
    whatNotToAssume: [
      'All alumni fit this archetype',
      'Legacy motivation removes need for product quality',
      'Gift buyers understand the student-company story without a pitch'
    ],
    localApplications: [
      {
        context: 'Renaissance',
        example:
          'Alumni may be a local application when legacy, continuity, and school connection drive the purchase.'
      },
      {
        context: 'Phoenix Nest',
        example:
          'Retail carry can serve this buyer if the product is giftable and the story is shelf-ready.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'donation-scenarios',
      'evidence',
      'ask'
    ]
  },
  {
    id: 'rural-fixed-income-households',
    label: 'Rural Fixed-Income Households',
    shortProfile:
      'Rural or very small-town household with limited or fixed income and high sensitivity to access, shipping, and value.',
    exampleQuote:
      'I need to know the total cost and whether this is really worth it.',
    demographicFingerprint: [
      'Rural, exurban, or very small-town context',
      'Fixed or limited income',
      'Older adult, disability, pension, low-wage, or mixed household possible',
      'Tight discretionary spending'
    ],
    lifestyleFingerprint: [
      'Plans purchases carefully',
      'Avoids unclear fees, returns, or shipping friction',
      'May support causes but needs transparent total cost'
    ],
    likelyNeeds: [
      'Very clear total price',
      'Low-risk product choice',
      'Transparent reason to buy or support'
    ],
    likelyObjections: [
      'Is this too expensive once all costs are included?',
      'How would I receive or return it?',
      'Is this the best use of limited money?'
    ],
    likelyProducts: ['Lower-price items', 'baked goods', 'small donations'],
    likelyChannels: [
      'Direct relationship',
      'Community referral',
      'Simple in-person purchase',
      'No-friction interest capture'
    ],
    evidenceToCollect: [
      'Actual buyer interview before using this archetype',
      'Price and access objections',
      'Whether a lower-price offer is needed'
    ],
    whatNotToAssume: [
      'This archetype fits without direct evidence',
      'Fixed income tells the whole story about values',
      'Cause support cancels budget pressure'
    ],
    localApplications: [
      {
        context: 'General',
        example:
          'Use only when evidence shows fixed-budget and access constraints are central to the decision.'
      },
      {
        context: 'Detroit',
        example:
          'Could apply to a community supporter only if the team has evidence about budget and access constraints.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'pricing-risks',
      'channels',
      'donation-scenarios'
    ]
  },
  {
    id: 'multigenerational-urban-households',
    label: 'Multigenerational Urban Households',
    shortProfile:
      'Urban household where multiple generations share influence over purchases, budgets, and support decisions.',
    exampleQuote:
      'A few people in my family would have opinions before we buy.',
    demographicFingerprint: [
      'Urban or inner-ring household',
      'Two or three generations involved',
      'Shared household income or shared decision-making',
      'Budget may range from tight to comfortable'
    ],
    lifestyleFingerprint: [
      'Purchase decisions may be collective',
      'Family pride, usefulness, and price all matter',
      'Gift and support motivations can overlap'
    ],
    likelyNeeds: [
      'A story that works for more than one age group',
      'Sizing and product choices that fit family use',
      'Clear explanation of who the product is for'
    ],
    likelyObjections: [
      'Who in the household would actually use this?',
      'Does the design appeal across ages?',
      'Is this a student purchase, a parent purchase, or a family gift?'
    ],
    likelyProducts: ['Beanies', 'sweatshirts', 'giftable basics', 'donations'],
    likelyChannels: [
      'Family communication',
      'School events',
      'Community pop-up',
      'Word of mouth'
    ],
    evidenceToCollect: [
      'Family buyer interview',
      'Who influences the purchase',
      'Design and price reactions across age groups'
    ],
    whatNotToAssume: [
      'One family member speaks for the whole household',
      'Student interest means adult buyer approval',
      'Family support is unlimited'
    ],
    localApplications: [
      {
        context: 'Renaissance',
        example:
          'A student may love the item, but a parent, guardian, or grandparent may be the buyer.'
      },
      {
        context: 'TechTown',
        example:
          'A family group at the table may make a fast collective decision if use, price, and story are clear.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'audience',
      'target-customers',
      'messaging'
    ]
  },
  {
    id: 'digital-first-premium-buyers',
    label: 'Digital-First Premium Buyers',
    shortProfile:
      'Younger or mid-career buyer with comfortable spending who discovers premium products through mobile and social channels.',
    exampleQuote:
      'If it looks sharp online and the story feels real, I will check it out.',
    demographicFingerprint: [
      'Young adult to mid-career adult',
      'Comfortable to affluent discretionary spending',
      'Urban, suburban, or digitally connected context',
      'Often mobile-first in discovery and comparison'
    ],
    lifestyleFingerprint: [
      'Evaluates brand through photos, short copy, and social proof',
      'Pays for premium when quality and identity are visible',
      'May respond to drops, scarcity, and polished visual systems'
    ],
    likelyNeeds: [
      'Strong product photography or visual mockup',
      'Clear premium cues',
      'Easy-to-share story and proof'
    ],
    likelyObjections: [
      'Does the product look premium enough online?',
      'Is this just school merch?',
      'Can I trust the quality without seeing it?'
    ],
    likelyProducts: ['Sweatshirts', 'premium tees', 'limited drops'],
    likelyChannels: [
      'Instagram-style visual content',
      'Mobile-friendly campaign',
      'Phoenix Nest retail proof',
      'Event photos and short captions'
    ],
    evidenceToCollect: [
      'Reaction to product photos or mockups',
      'Click or interest signal from mobile content',
      'Comparable premium streetwear or local-made references'
    ],
    whatNotToAssume: [
      'Digital attention equals conversion',
      'Premium visual style removes need for product proof',
      'This buyer is necessarily a student'
    ],
    localApplications: [
      {
        context: 'Detroit',
        example:
          'A Detroit-style or local-made buyer may fit if discovery happens through visuals and premium cues.'
      },
      {
        context: 'Phoenix Nest',
        example:
          'Retail pitch photos should show why the item belongs on a shelf, not only on a school table.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'audience',
      'voice',
      'identity',
      'target-customers',
      'messaging',
      'ask'
    ]
  },
  {
    id: 'cause-first-supporters',
    label: 'Cause-First Supporters',
    shortProfile:
      'Buyer or donor whose engagement starts with mission, community impact, or support for student work.',
    exampleQuote:
      'I want my purchase to support something bigger than the product.',
    demographicFingerprint: [
      'Can appear across age, income, and geography',
      'Defined by motivation, not a demographic role',
      'May be buyer, donor, advocate, or repeat supporter',
      'Often overlaps with another archetype'
    ],
    lifestyleFingerprint: [
      'Responds to impact story and transparency',
      'Wants to know where money or attention goes',
      'May buy, donate, share, or introduce the team to others'
    ],
    likelyNeeds: [
      'Plain explanation of the mission and use of funds',
      'Proof that students are leading real work',
      'A clear next action: buy, donate, share, or introduce'
    ],
    likelyObjections: [
      'Is this impact claim real?',
      'Where does the money go?',
      'Is this a one-time school project or a durable student company?'
    ],
    likelyProducts: ['Donations', 'mission-led apparel', 'gift bundles'],
    likelyChannels: [
      'Story-led event pitch',
      'Community introductions',
      'Family and alumni networks',
      'Donation callout'
    ],
    evidenceToCollect: [
      'Quotes about why someone supports the mission',
      'Donation or sharing behavior',
      'Questions supporters ask before giving'
    ],
    whatNotToAssume: [
      'Mission support proves product demand',
      'Cause motivation identifies income or lifestyle',
      'Supporters do not need transparency'
    ],
    localApplications: [
      {
        context: 'Renaissance',
        example:
          'Teachers, staff, alumni, and families may be Cause-First Supporters when mission is the main reason they engage.'
      },
      {
        context: 'TechTown',
        example:
          'A community visitor may buy or donate after hearing the student-company story.'
      }
    ],
    bestForSections: [
      'customer-segments',
      'value-propositions',
      'donation-scenarios',
      'audience',
      'target-customers',
      'messaging'
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
 *  field is short so the embedded JSON stays small. */
export interface ArchetypeLibrarySummaryEntry {
  id: CustomerArchetypeId
  label: string
  shortProfile: string
  demographicLifestyleSummary: string
  bestForSections: readonly string[]
}

export function archetypeLibrarySummary(): ArchetypeLibrarySummaryEntry[] {
  return customerArchetypes.map((a) => ({
    id: a.id,
    label: a.label,
    shortProfile: a.shortProfile,
    demographicLifestyleSummary: [
      a.demographicFingerprint[0],
      a.lifestyleFingerprint[0]
    ]
      .filter(Boolean)
      .join(' | '),
    bestForSections: a.bestForSections
  }))
}

/** Builds a markdown block the picker can copy into Working Draft.
 *  Skips archetypes the chief / student did not select. Custom
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
  return [
    '## Customer archetypes (national starting hypotheses)',
    '> These are Renni-original, PRIZM / ESRI-inspired learning archetypes. They are not actual PRIZM or ESRI segments. Local roles like students, alumni, staff, retail buyers, or TechTown visitors are application contexts, not the whole segment.',
    ...blocks
  ].join('\n\n')
}

function buildArchetypeBlock(
  a: CustomerArchetype,
  customNote: string
): string {
  const lines: string[] = [`### ${a.label}`]
  lines.push(`- **Profile:** ${a.shortProfile}`)
  lines.push(`- **Example quote:** "${a.exampleQuote}"`)
  if (a.demographicFingerprint.length) {
    lines.push(`- **Demographic fingerprint:** ${a.demographicFingerprint.join('; ')}`)
  }
  if (a.lifestyleFingerprint.length) {
    lines.push(`- **Lifestyle fingerprint:** ${a.lifestyleFingerprint.join('; ')}`)
  }
  if (customNote.trim()) {
    lines.push(`- **Local Renni Inc. application:** ${customNote.trim()}`)
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
  if (a.localApplications.length) {
    lines.push(
      `- **Local applications:** ${a.localApplications
        .map((x) => `${x.context}: ${x.example}`)
        .join('; ')}`
    )
  }
  return lines.join('\n')
}
