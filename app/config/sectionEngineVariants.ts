// Section Engine variant config — Customer Profile Builder V1.
//
// V1 declares ONE engine variant: `customer-profile-builder`. The
// other three IDs in `SectionEngineVariantId` are intentionally NOT
// instantiated yet — adding them is a curriculum decision, not a
// scaffolding decision.
//
// V1 PRIMITIVE MODEL
// ------------------
// 10 primitives (the V1 primitive model — NOT the older "seven-axis"
// shorthand from the Foundation pass):
//   1. life-stage
//   2. household-composition
//   3. urbanicity
//   4. spending-capacity
//   5. tight-budget-detail (conditional on spending-capacity = tight)
//   6. housing-context
//   7. education-occupation
//   8. shopping-media-behavior (multi-select 1–3)
//   9. purchase-motivation (primary + optional secondary; secondary
//      input is captured in the classifier-side selection shape, not
//      here, since this config describes the option set for one pick)
//  10. evidence-confidence (meta-only)
//
// CURRICULUM POSTURE
// ------------------
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - Renders to NO students in V1. Workspace render tree is unchanged.
//   - classifierStatus = 'ready' once the deterministic classifier
//     ships in app/utils/customerProfileClassifier.ts.
//   - aiFeedbackStatus stays 'shell_only' — Layer 3 endpoint exists
//     but does not call a provider yet.
//   - Renaissance / Detroit / House Phoenix overlays live in Section
//     14 of each archetype draft (teacher-internal); they do not
//     appear in any axis option here.

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
      { id: 'young-singles-couples', label: 'Young singles or couples', helperText: 'Adults early in their twenties or thirties without children.' },
      { id: 'young-families', label: 'Young families', helperText: 'Households with very young children (often pre-school age).' },
      { id: 'established-families', label: 'Established families', helperText: 'Households with school-age or older children still at home.' },
      { id: 'midlife-households', label: 'Midlife households', helperText: 'Adults in their forties and fifties; children may be older or grown.' },
      { id: 'empty-nesters', label: 'Empty nesters', helperText: 'Households where children have moved out.' },
      { id: 'retirees', label: 'Retirees', helperText: 'Adults primarily living on retirement income.' },
      { id: 'multigenerational', label: 'Multigenerational household', helperText: 'Two or three generations living together.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'household-composition',
    label: 'Household composition',
    studentPrompt: 'Who lives in this customer’s household?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Household structure is not a moral judgment. Single-parent, multigenerational, and roommate households are not "less than" married-couple households.',
    options: [
      { id: 'single-adult', label: 'Single adult', helperText: 'One adult, no children at home.' },
      { id: 'roommates', label: 'Roommates', helperText: 'Two or more unrelated adults sharing housing.' },
      { id: 'couple-no-kids', label: 'Couple without children', helperText: 'Partnered adults without children at home.' },
      { id: 'family-with-kids', label: 'Family with children at home', helperText: 'At least one child still living with at least one adult.' },
      { id: 'single-parent', label: 'Single-parent household', helperText: 'One adult raising at least one child at home.' },
      { id: 'multigenerational', label: 'Multigenerational household', helperText: 'Two or three generations under one roof.' },
      { id: 'empty-nest', label: 'Empty-nest household', helperText: 'Couple or single adult whose children have moved out.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'urbanicity',
    label: 'Urbanicity / settlement pattern',
    studentPrompt: 'Where does this customer live?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Geography is context, not character. Where someone lives does not predict their politics, taste, education, or values.',
    options: [
      { id: 'dense-urban-core', label: 'Dense urban core', helperText: 'Downtown of a major city.' },
      { id: 'urban-neighborhood', label: 'Urban neighborhood', helperText: 'A residential city neighborhood, not downtown.' },
      { id: 'inner-ring-suburb', label: 'Inner-ring suburb', helperText: 'Suburb closest to the city.' },
      { id: 'outer-suburb', label: 'Outer suburb', helperText: 'Suburb farther from the city.' },
      { id: 'second-city', label: 'Second city or small metro', helperText: 'Mid-sized city such as a state capital or regional center.' },
      { id: 'small-town', label: 'Small town', helperText: 'A town with a single main street and limited big-box retail.' },
      { id: 'rural-exurban', label: 'Rural or exurban', helperText: 'Countryside or very low-density area.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'spending-capacity',
    label: 'Spending capacity',
    studentPrompt: 'How much can this customer comfortably spend on a single non-essential purchase?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Spending capacity is what someone CAN spend on this category, not a judgment of their worth. A tight budget on apparel does not mean a tight budget on everything.',
    options: [
      { id: 'tight', label: 'Tight budget', helperText: 'Watching every purchase.' },
      { id: 'value-conscious', label: 'Value-conscious', helperText: 'Spends carefully; looks for value.' },
      { id: 'moderate-discretionary', label: 'Moderate discretionary spending', helperText: 'Some money left over after bills.' },
      { id: 'comfortable', label: 'Comfortable', helperText: 'Can afford planned purchases without stress.' },
      { id: 'affluent', label: 'Affluent', helperText: 'High income or wealth; selective spender.' },
      { id: 'high-net-worth', label: 'High-net-worth or premium', helperText: 'Very high income or wealth.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'tight-budget-detail',
    label: 'Tight-budget detail',
    studentPrompt: 'Why is the budget tight?',
    inputType: 'single-select',
    required: false,
    conditionalOn: { axisId: 'spending-capacity', valueId: 'tight' },
    biasGuardrail:
      'Tight by constraint and tight by choice are different situations. Limited income with high fixed costs is not the same as deliberate frugality. Treat both with respect.',
    options: [
      { id: 'by-constraint', label: 'Tight by limited income or high fixed costs', helperText: 'Income is low, or fixed costs (rent, utilities, healthcare) take most of it.' },
      { id: 'by-choice', label: 'Tight by deliberate frugality or saving', helperText: 'Income may be moderate; budget is tight by choice.' },
      { id: 'both', label: 'Both', helperText: 'Limited income AND deliberate frugality.' }
    ]
  },
  {
    id: 'housing-context',
    label: 'Housing context',
    studentPrompt: 'What kind of housing best describes this customer?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Renting and owning are housing situations, not virtues. Many high-income people rent; many lower-income people own. Pick what is descriptive, not what sounds aspirational.',
    options: [
      { id: 'renter', label: 'Renter', helperText: 'Rents their housing.' },
      { id: 'homeowner', label: 'Homeowner', helperText: 'Owns their housing.' },
      { id: 'student-shared', label: 'Student or shared housing', helperText: 'Lives in dorms, group housing, or with roommates.' },
      { id: 'apartment-condo', label: 'Apartment or condo', helperText: 'Multi-unit building.' },
      { id: 'single-family-home', label: 'Single-family home', helperText: 'Stand-alone house.' },
      { id: 'multigenerational-home', label: 'Multigenerational home', helperText: 'A home shared by multiple generations of one family.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'education-occupation',
    label: 'Education / occupation orientation',
    studentPrompt: 'What best describes this customer’s education or work?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Education is one input, not a measure of intelligence or value. Skilled trades and creative work are not "less than" professional / managerial work. Use this to predict reference points, not character.',
    options: [
      { id: 'student-early-workforce', label: 'Student or early workforce', helperText: 'In school or in their first job.' },
      { id: 'service-hourly', label: 'Service or hourly work', helperText: 'Restaurant, retail, healthcare aide, gig work, etc.' },
      { id: 'skilled-trades', label: 'Skilled trades', helperText: 'Construction, electrical, mechanical, etc.' },
      { id: 'professional-managerial', label: 'Professional or managerial', helperText: 'Office or knowledge work, often salaried.' },
      { id: 'creative-entrepreneurial', label: 'Creative or entrepreneurial', helperText: 'Design, media, founder, freelance, content creator.' },
      { id: 'retired-fixed-income', label: 'Retired or fixed income', helperText: 'Primarily on Social Security, pension, or disability.' },
      { id: 'mixed-household', label: 'Mixed household', helperText: 'Different members in different categories.' },
      { id: 'other', label: 'Other (write-in)', helperText: 'If none of the above fit.' }
    ]
  },
  {
    id: 'shopping-media-behavior',
    label: 'Shopping and media behavior',
    studentPrompt: 'How does this customer usually shop and discover what they buy? Pick 1–3.',
    inputType: 'multi-select',
    required: true,
    minSelections: 1,
    maxSelections: 3,
    biasGuardrail:
      'Channel is a signal, not proof. A store name does not prove income, class, race, values, or identity. Allow contradictions: many customers shop both cheap and premium.',
    options: [
      { id: 'mobile-first-social-commerce', label: 'Mobile-first / social commerce', helperText: 'Discovers and buys mostly through Instagram, TikTok, or similar.' },
      { id: 'online-convenience', label: 'Online convenience shopper', helperText: 'Amazon, brand websites, delivery for routine purchases.' },
      { id: 'big-box-value', label: 'Big-box value', helperText: 'Walmart, Target, Meijer for routine needs.' },
      { id: 'warehouse-bulk', label: 'Warehouse / bulk', helperText: 'Costco, Sam’s Club, BJ’s.' },
      { id: 'local-boutique', label: 'Local boutique', helperText: 'Small local stores.' },
      { id: 'premium-retail', label: 'Premium retail', helperText: 'Nordstrom, Anthropologie, designer stores.' },
      { id: 'thrift-resale', label: 'Thrift / resale', helperText: 'Goodwill, Depop, ThredUp, vintage.' },
      { id: 'research-before-buying', label: 'Researches before buying', helperText: 'Reads reviews, compares before purchase.' },
      { id: 'cause-driven', label: 'Cause-driven shopping', helperText: 'Chooses brands based on cause or mission.' },
      { id: 'brand-loyal', label: 'Brand-loyal', helperText: 'Sticks with brands they already trust.' }
    ]
  },
  {
    id: 'purchase-motivation',
    label: 'Purchase motivation',
    studentPrompt: 'What is the strongest reason this customer would buy?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'Pick the single strongest motivation. A laundry list of values is not a motivation. The classifier supports an optional secondary motivation; capture that separately when two feel close.',
    options: [
      { id: 'price-value', label: 'Price / value', helperText: 'Best price for what they get.' },
      { id: 'convenience', label: 'Convenience', helperText: 'Saves time and hassle.' },
      { id: 'quality-durability', label: 'Quality / durability', helperText: 'Lasts; built well.' },
      { id: 'style-identity', label: 'Style / identity', helperText: 'Reflects who they are.' },
      { id: 'status-achievement', label: 'Status / achievement', helperText: 'Signals success or accomplishment.' },
      { id: 'family-home', label: 'Family / home', helperText: 'For the household, not for self.' },
      { id: 'local-community-pride', label: 'Local / community pride', helperText: 'Supporting their place.' },
      { id: 'ethics-sustainability', label: 'Ethics / sustainability', helperText: 'Aligns with their values about people or planet.' },
      { id: 'supporting-a-cause', label: 'Supporting a cause', helperText: 'Drives money or attention to a mission.' },
      { id: 'giftability', label: 'Giftability', helperText: 'Bought to give to someone else.' }
    ]
  },
  {
    id: 'evidence-confidence',
    label: 'Evidence confidence',
    studentPrompt: 'How confident are we in this profile, and what evidence do we have?',
    inputType: 'single-select',
    required: true,
    biasGuardrail:
      'This is a META-question about the team’s certainty, not a customer trait. "We talked to one person at lunch" is medium at best; "we have 20 survey responses and 5 interviews" is high.',
    options: [
      { id: 'low-assumption', label: 'Low — mostly assumption or one conversation', helperText: 'We are guessing or have one data point.' },
      { id: 'medium-some-evidence', label: 'Medium — multiple conversations or one survey', helperText: 'Some real signal but not yet strong.' },
      { id: 'high-strong-evidence', label: 'High — multiple interviews + observation + comparable-product check', helperText: 'We have done the work.' }
    ]
  }
]

export const CUSTOMER_PROFILE_BUILDER_VARIANT: SectionEngineVariantConfig = {
  id: 'customer-profile-builder',
  label: 'Customer Profile Builder',
  description:
    'Three-layer engine: students compose a customer profile from the V1 primitive model, a deterministic classifier explains which national lifestyle archetype the profile most closely matches, and AI gives directional feedback on the articulation. V1 ships the primitive model and the classifier; AI feedback layer stays shell-only until a separate pass.',
  brandContextRequired: true,
  programContextRequired: true,
  axes: CUSTOMER_PROFILE_AXES,
  classifierStatus: 'ready',
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
 * The V1 primitive model axis ids for Customer Profile Builder,
 * exported as a stable list so future audit / curriculum scripts can
 * assert the set without parsing the config object. Order matches the
 * axis order in `CUSTOMER_PROFILE_AXES`.
 */
export const CUSTOMER_PROFILE_AXIS_IDS = [
  'life-stage',
  'household-composition',
  'urbanicity',
  'spending-capacity',
  'tight-budget-detail',
  'housing-context',
  'education-occupation',
  'shopping-media-behavior',
  'purchase-motivation',
  'evidence-confidence'
] as const
