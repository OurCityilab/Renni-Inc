// PRIZM-inspired segment templates for the Universal Segment Framework
// V1. Helps Renaissance students get past vague "students / parents /
// staff / alumni" labels and reason about real customer profiles —
// income, life stage, geography, spending power, buying behavior,
// motivations, objections, evidence — before they argue for a price.
//
// Important — do NOT misrepresent these:
//   - These are PRIZM-inspired *templates*, not Claritas PRIZM
//     segments. Claritas PRIZM is a licensed, proprietary commercial
//     dataset; Renni Command Center has no Claritas integration and
//     does not import licensed PRIZM data.
//   - Templates are starting points. Students still have to argue
//     fit, log evidence, and validate. Picking a template never
//     proves demand.
//   - Templates seed the structured profile fields on a Market Fit
//     segment. They never write to Firestore by themselves; the
//     existing MarketFitBuilder save flow is the only write path.

import type {
  MarketFitCustomerProfile,
  MarketFitSignal,
  SegmentBuyingBehavior,
  SegmentEvidenceConfidence,
  SegmentGeography,
  SegmentIncomeBracket,
  SegmentLifeStage,
  SegmentSpendingPower,
  SegmentUrbanicity
} from '~/types/models'

// Each template carries the structured enum fields plus short prose
// for motivations / objections / channel fit / product use case.
// `signature` is a one-line student-facing summary the picker UI
// uses below the template name so students can see the shape of
// the segment before applying it.
export interface CustomerSegmentTemplate {
  id: string
  name: string
  signature: string
  // The actual values a student gets when they apply this template.
  // Subset of MarketFitCustomerProfile so we never seed a free-text
  // field with curriculum content the student should write themselves
  // (profileName, ageRange, etc. stay blank).
  profile: Partial<MarketFitCustomerProfile> & {
    relationshipRole?: string
    lifeStage?: SegmentLifeStage
    incomeBracket?: SegmentIncomeBracket
    geography?: SegmentGeography
    urbanicity?: SegmentUrbanicity
    spendingPower?: SegmentSpendingPower
    priceSensitivity?: MarketFitSignal
    buyingBehavior?: SegmentBuyingBehavior
    motivations?: string
    likelyObjections?: string
    channelFit?: string
    productUseCase?: string
    evidenceConfidence?: SegmentEvidenceConfidence
    validationStep?: string
  }
}

export const CUSTOMER_SEGMENT_TEMPLATES: CustomerSegmentTemplate[] = [
  {
    id: 'value-school-spirit-student',
    name: 'Value School Spirit Student',
    signature:
      'Teen, school-community, constrained budget, high price sensitivity. Useful for awareness/validation; weak as primary $100 buyer.',
    profile: {
      relationshipRole: 'student',
      lifeStage: 'teen',
      incomeBracket: 'under-35k',
      geography: 'school-community',
      urbanicity: 'urban',
      spendingPower: 'constrained',
      priceSensitivity: 'high',
      buyingBehavior: 'value-shopper',
      motivations: 'Identity, belonging, school pride, peer visibility.',
      likelyObjections: 'Price above student budget; perceived as not for them.',
      channelFit: 'School, Phoenix Nest, student survey, hallway feedback.',
      productUseCase: 'Awareness / validation / lower-price items.',
      evidenceConfidence: 'low',
      validationStep:
        'Survey students at multiple price points and capture preorder interest.'
    }
  },
  {
    id: 'style-conscious-young-metro-buyer',
    name: 'Style-Conscious Young Metro Buyer',
    signature:
      'College-age or young-adult metro buyer with moderate budget. Will pay for design/identity if culturally credible.',
    profile: {
      relationshipRole: 'young metro adult',
      lifeStage: 'young-adult',
      incomeBracket: '35k-60k',
      geography: 'detroit',
      urbanicity: 'urban',
      spendingPower: 'moderate',
      priceSensitivity: 'medium',
      buyingBehavior: 'planned',
      motivations:
        'Fashion, identity, social proof, local culture, aesthetic credibility.',
      likelyObjections:
        'Design must feel culturally credible — not generic school merch.',
      channelFit: 'Pop-up, social media, word of mouth, street drops.',
      productUseCase: 'Streetwear-style purchase tied to a moment or drop.',
      evidenceConfidence: 'low',
      validationStep:
        'Side-by-side test against a known streetwear comp; gather social signal.'
    }
  },
  {
    id: 'metro-middle-income-school-pride-parent',
    name: 'Metro Middle-Income School Pride Parent',
    signature:
      'Parent/guardian, $60–100k household, supports student through purchases. Will accept moderate price with clear quality + story.',
    profile: {
      relationshipRole: 'parent / guardian',
      lifeStage: 'parent-guardian',
      incomeBracket: '60k-100k',
      geography: 'inner-ring-suburb',
      urbanicity: 'inner-ring-suburban',
      spendingPower: 'moderate',
      priceSensitivity: 'medium',
      buyingBehavior: 'planned',
      motivations:
        'School pride, student support, family connection, visible care.',
      likelyObjections:
        'Price has to be justified by quality, story, or a tangible student benefit.',
      channelFit: 'Parent outreach, school events, TechTown.',
      productUseCase: 'Family-visible school-pride purchase.',
      evidenceConfidence: 'low',
      validationStep:
        'Interview parents at the next school event about price tolerance and what would tip them.'
    }
  },
  {
    id: 'premium-parent-supporter',
    name: 'Premium Parent Supporter',
    signature:
      'Parent or established adult, $100k+ household, comfortable. Will pay premium when student benefit + quality are clear.',
    profile: {
      relationshipRole: 'parent supporter',
      lifeStage: 'parent-guardian',
      incomeBracket: '100k-150k',
      geography: 'inner-ring-suburb',
      urbanicity: 'suburban',
      spendingPower: 'comfortable',
      priceSensitivity: 'low',
      buyingBehavior: 'gift',
      motivations:
        'Student benefit, quality, pride, giftability, supporting the program.',
      likelyObjections:
        'Needs premium feel and a clear, visible student benefit.',
      channelFit: 'Parent network, school events, premium pop-up display.',
      productUseCase: 'Pride purchase + gift to student or family.',
      evidenceConfidence: 'low',
      validationStep:
        'Show two presentation options (basic vs premium packaging) and capture preference + price.'
    }
  },
  {
    id: 'alumni-legacy-buyer',
    name: 'Alumni Legacy Buyer',
    signature:
      'Established adult alumnus. Will pay premium when product reads as legacy, limited, or year-marked — not generic merch.',
    profile: {
      relationshipRole: 'alumnus',
      lifeStage: 'established-adult',
      incomeBracket: '60k-100k',
      geography: 'out-of-town-supporter',
      urbanicity: 'mixed',
      spendingPower: 'comfortable',
      priceSensitivity: 'medium',
      buyingBehavior: 'collector',
      motivations:
        'Nostalgia, legacy, school identity, limited-run scarcity.',
      likelyObjections:
        'Product must feel tied to legacy / year — not generic merch.',
      channelFit:
        'Alumni email, reunion / homecoming events, online drop, Phoenix Nest.',
      productUseCase: 'Legacy / commemorative purchase.',
      evidenceConfidence: 'low',
      validationStep:
        'Interview alumni about year-marker design + limited-run framing; gauge willingness for a premium.'
    }
  },
  {
    id: 'premium-metro-civic-localist',
    name: 'Premium Metro Civic Localist',
    signature:
      'Established adult, $100k+ urban/inner-ring metro buyer. Will pay premium when Detroit-made, design, and civic story are credible.',
    profile: {
      relationshipRole: 'civic premium buyer',
      lifeStage: 'established-adult',
      incomeBracket: '100k-150k',
      geography: 'detroit',
      urbanicity: 'urban',
      spendingPower: 'premium-discretionary',
      priceSensitivity: 'low',
      buyingBehavior: 'planned',
      motivations:
        'Detroit-made, local production, civic pride, design quality, supporting young Detroit makers.',
      likelyObjections:
        'Quality and sourcing must be credible — Detroit-made claim has to be visible and provable.',
      channelFit:
        'TechTown, local retail (Phoenix Nest), civic networks, premium pop-up context.',
      productUseCase:
        'Premium civic apparel purchase, sometimes given as a gift.',
      evidenceConfidence: 'low',
      validationStep:
        'Show production proof (vendor, materials) at the price point and interview 5+ civic premium buyers.'
    }
  },
  {
    id: 'detroit-made-gift-buyer',
    name: 'Detroit-Made Gift Buyer',
    signature:
      'Adult metro buyer purchasing for someone else. Story + packaging carry the price.',
    profile: {
      relationshipRole: 'gift buyer',
      lifeStage: 'established-adult',
      incomeBracket: '60k-100k',
      geography: 'detroit',
      urbanicity: 'urban',
      spendingPower: 'comfortable',
      priceSensitivity: 'medium',
      buyingBehavior: 'gift',
      motivations:
        'Local pride, occasion purchase, story, packaging, giftability.',
      likelyObjections:
        'Has to feel giftable and well presented — gift packaging matters more than logo placement.',
      channelFit:
        'TechTown, Phoenix Nest, holiday/event drops, local retail.',
      productUseCase: 'Gift for a Detroit-connected friend or family member.',
      evidenceConfidence: 'low',
      validationStep:
        'Show the product in two presentation states (gift packaging vs basic) and capture which converts.'
    }
  },
  {
    id: 'event-impulse-buyer',
    name: 'Event Impulse Buyer',
    signature:
      'Mixed life stage, walks into TechTown. Buys on energy, story, and display — not pre-planning.',
    profile: {
      relationshipRole: 'event visitor',
      lifeStage: 'mixed',
      incomeBracket: 'unknown',
      geography: 'event-visitor',
      urbanicity: 'mixed',
      spendingPower: 'unknown',
      priceSensitivity: 'medium',
      buyingBehavior: 'impulse',
      motivations: 'Event energy, discovery, mission support.',
      likelyObjections:
        'Price may be too high without a strong pitch, story, or display.',
      channelFit: 'TechTown pop-up only.',
      productUseCase: 'Walk-up impulse purchase tied to the event itself.',
      evidenceConfidence: 'low',
      validationStep:
        'Track conversion at the pop-up at this price; compare against an alternate price test if feasible.'
    }
  }
]

export function findCustomerSegmentTemplate(
  id: string | null | undefined
): CustomerSegmentTemplate | null {
  if (!id) return null
  return CUSTOMER_SEGMENT_TEMPLATES.find((t) => t.id === id) ?? null
}
