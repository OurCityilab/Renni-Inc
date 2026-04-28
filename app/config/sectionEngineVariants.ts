// Section Engine variant config — Customer Profile Builder Foundation Pass 1.
//
// V1 declares ONE engine variant: `customer-profile-builder`. The
// other three IDs in `SectionEngineVariantId` are intentionally NOT
// instantiated yet — adding them is a curriculum decision, not a
// scaffolding decision.
//
// The customer-profile-builder config defines the seven approved V1
// axes ONLY. It does NOT define archetypes, classifier rules, or AI
// prompts. Those layers ship in subsequent passes once the
// archetype curriculum is finalized.
//
// Curriculum decisions already locked in (see brief):
//   - Use PRIMARY PURCHASE MOTIVATION as the V1 motivation axis,
//     not a broad multi-select values dump.
//   - Cut style / identity posture as a standalone V1 axis.
//   - Cut channel preference as a standalone V1 input.
//   - Cut price sensitivity as a standalone V1 input.
//   - Treat retailers as SIGNALS, not stereotypes (so "shopping
//     behavior" stays about behavior, not a list of stores).
//   - Evidence confidence is a META-question that appears AFTER the
//     profile, not as a customer trait.
//
// Posture (do not relax in V1):
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - Renders to NO students. Workspace render tree is unchanged.
//   - classifierStatus = 'not_started' and aiFeedbackStatus =
//     'shell_only' are the honest V1 lifecycle values.

import type {
  PrimitiveAxisConfig,
  SectionEngineVariantConfig,
  SectionEngineVariantId
} from '~/types/sectionEngines'

const CUSTOMER_PROFILE_AXES: PrimitiveAxisConfig[] = [
  {
    id: 'life-stage',
    label: 'Life stage',
    studentPrompt: 'Where is this customer in their life right now?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Life stage describes situation, not age stereotypes. Avoid claims like "young people always" or "older people never". Stage is a frame, not a personality.',
    options: [
      { id: 'student', label: 'Student' },
      { id: 'early-career', label: 'Early career / first job' },
      { id: 'parent-of-student', label: 'Parent of a student' },
      { id: 'established-professional', label: 'Established professional' },
      { id: 'community-supporter', label: 'Community supporter / alum' },
      { id: 'retired', label: 'Retired' },
      { id: 'other', label: 'Other (write-in)' }
    ]
  },
  {
    id: 'spending-capacity',
    label: 'Spending capacity',
    studentPrompt: 'What can this customer comfortably spend on a single House Phoenix item?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Spending capacity is what someone CAN spend on this category, not a judgment of their worth. A tight budget on apparel does not mean a tight budget on everything.',
    options: [
      { id: 'tight', label: 'Tight — under $20', helperText: 'Watching every purchase.' },
      { id: 'moderate', label: 'Moderate — $20–$50', helperText: 'Will spend on something they like.' },
      { id: 'comfortable', label: 'Comfortable — $50–$100', helperText: 'Premium gear is reachable.' },
      { id: 'premium', label: 'Premium — $100+', helperText: 'Will pay for quality and story.' }
    ]
  },
  {
    id: 'geography-community',
    label: 'Geography / community context',
    studentPrompt: 'Where does this customer live or work, and what community are they part of?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Geography is context, not a stereotype. A Detroit ZIP code does not predict taste. Use this to ground civic relevance, not to assume identity.',
    options: [
      { id: 'detroit-resident', label: 'Detroit resident' },
      { id: 'metro-detroit', label: 'Metro Detroit (suburbs)' },
      { id: 'techtown-walk-in', label: 'Walks past TechTown / nearby worker' },
      { id: 'renaissance-family', label: 'Renaissance student / parent / staff' },
      { id: 'alumni-supporter', label: 'Renaissance alum or supporter from afar' },
      { id: 'visiting', label: 'Visiting Detroit' },
      { id: 'other', label: 'Other (write-in)' }
    ]
  },
  {
    id: 'education',
    label: 'Education',
    studentPrompt: 'What is this customer’s education background?',
    inputType: 'single-select',
    required: false,
    biasGuardrail:
      'Education is one input, not a measure of intelligence or value. Use it to predict vocabulary and reference points, not character.',
    options: [
      { id: 'in-high-school', label: 'In high school' },
      { id: 'high-school-graduate', label: 'High school graduate' },
      { id: 'some-college', label: 'Some college / trade school' },
      { id: 'college-graduate', label: 'College graduate' },
      { id: 'graduate-degree', label: 'Graduate / professional degree' },
      { id: 'unknown', label: 'Not known' }
    ]
  },
  {
    id: 'shopping-behavior',
    label: 'Shopping behavior',
    studentPrompt: 'How does this customer usually decide to buy something like House Phoenix?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Behavior describes how they shop, not who they are. Avoid mapping a behavior to a single retailer or store name; treat retailers as signals, not labels.',
    options: [
      { id: 'impulse', label: 'Buys on impulse when something catches their eye' },
      { id: 'researches', label: 'Researches before buying' },
      { id: 'asks-friends', label: 'Asks friends or family before buying' },
      { id: 'loyal-to-brands', label: 'Sticks to brands they already trust' },
      { id: 'supports-local', label: 'Goes out of their way to support local makers' },
      { id: 'gift-driven', label: 'Buys mostly when they need a gift' }
    ]
  },
  {
    id: 'primary-purchase-motivation',
    label: 'Primary purchase motivation',
    studentPrompt: 'What is the ONE main reason this customer would buy from House Phoenix?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Pick the single strongest motivation. A laundry list of values is not a motivation. If two feel equally strong, write a one-line note explaining the trade-off.',
    options: [
      { id: 'civic-pride', label: 'Civic pride / Detroit story' },
      { id: 'school-support', label: 'Supporting Renaissance students' },
      { id: 'product-quality', label: 'Product quality and design' },
      { id: 'gift-occasion', label: 'A specific gift or occasion' },
      { id: 'price-value', label: 'Price-to-value (a good deal)' },
      { id: 'belonging', label: 'Belonging / wearing the school identity' },
      { id: 'donation-motive', label: 'Donating to support the program' }
    ]
  },
  {
    id: 'evidence-confidence',
    label: 'Evidence confidence',
    studentPrompt: 'How confident are we in this profile, and what evidence do we have?',
    inputType: 'confidence',
    required: true,
    biasGuardrail:
      'This is a META-question about the team’s certainty, not a customer trait. "We talked to one person at lunch" is medium at best; "we have 20 survey responses and 5 interviews" is high.'
  }
]

export const CUSTOMER_PROFILE_BUILDER_VARIANT: SectionEngineVariantConfig = {
  id: 'customer-profile-builder',
  label: 'Customer Profile Builder',
  description:
    'Three-layer engine: students compose a customer profile from seven primitive axes, a deterministic classifier explains which archetype the profile most closely matches, and AI gives directional feedback on the articulation. V1 ships the primitives shell only.',
  brandContextRequired: true,
  programContextRequired: true,
  axes: CUSTOMER_PROFILE_AXES,
  classifierStatus: 'not_started',
  aiFeedbackStatus: 'shell_only'
}

/**
 * Registry of currently-defined engine variants. Other IDs in
 * `SectionEngineVariantId` are intentionally absent until their
 * curriculum lands. Resolving an undefined variant returns `null`.
 */
const REGISTRY: Partial<
  Record<SectionEngineVariantId, SectionEngineVariantConfig>
> = {
  'customer-profile-builder': CUSTOMER_PROFILE_BUILDER_VARIANT
}

export function resolveSectionEngineVariant(
  id: SectionEngineVariantId
): SectionEngineVariantConfig | null {
  return REGISTRY[id] ?? null
}

export function isSectionEngineVariantId(
  value: unknown
): value is SectionEngineVariantId {
  return (
    value === 'customer-profile-builder' ||
    value === 'brand-identity-engine' ||
    value === 'value-proposition-engine' ||
    value === 'marketing-message-engine'
  )
}

/**
 * The seven approved V1 axes for Customer Profile Builder, exported
 * by id so future audit / curriculum scripts can assert the set
 * without parsing the config object.
 */
export const CUSTOMER_PROFILE_AXIS_IDS = [
  'life-stage',
  'spending-capacity',
  'geography-community',
  'education',
  'shopping-behavior',
  'primary-purchase-motivation',
  'evidence-confidence'
] as const
