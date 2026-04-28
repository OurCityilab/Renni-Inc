// Customer Profile Builder V1 — student-facing explanation templates.
//
// Six templates cover the V1 classifier output cases. The classifier
// composes a final explanation by selecting one template and filling
// `{{double-brace}}` placeholders. NO numeric scores ever appear in
// student-facing strings.
//
// POSTURE
// -------
//   - Pure data. No Vue runtime, no Firestore, no I/O.
//   - Templates are author-editable. Curriculum lead may rewrite the
//     copy; the placeholder set is the contract.
//   - Signal labels are short, plain-language strings the classifier
//     uses to populate `topContributingSignals` and
//     `contradictingSignals` bullets. They mirror the primitive
//     option labels but stay tight enough for bullet form.

/**
 * Template IDs — one per V1 classifier output pattern.
 */
export type CustomerProfileExplanationTemplateId =
  | 'clean-primary'
  | 'primary-with-secondary'
  | 'cause-first-overlay'
  | 'low-evidence-overlay'
  | 'contradictory-signals'
  | 'no-confident-fit'

export interface ExplanationTemplate {
  id: CustomerProfileExplanationTemplateId
  /** Plain-language template with `{{placeholder}}` slots. The
   *  classifier's explanation builder substitutes placeholders before
   *  returning the final string. Markdown is allowed but minimal —
   *  bold headers and short bullet lines only. */
  template: string
}

export const EXPLANATION_TEMPLATES: Record<
  CustomerProfileExplanationTemplateId,
  ExplanationTemplate
> = {
  'clean-primary': {
    id: 'clean-primary',
    template: [
      '**Most signals point to {{primaryName}}** ({{primaryShortName}}).',
      '',
      '{{primaryOneLineSummary}}',
      '',
      'What pointed us here:',
      '{{topContributingSignalsList}}',
      '',
      'Confidence: **{{confidenceBand}}**. {{confidenceWhy}}',
      '',
      'What to test next: {{whatToTestNext}}'
    ].join('\n')
  },

  'primary-with-secondary': {
    id: 'primary-with-secondary',
    template: [
      '**Most signals point to {{primaryName}}** ({{primaryShortName}}), with **{{secondaryName}}** as a close runner-up.',
      '',
      '{{primaryOneLineSummary}}',
      '',
      'The customer also shows traits of {{secondaryName}}: {{secondaryOneLineSummary}}',
      '',
      'What pointed us toward {{primaryName}}:',
      '{{topContributingSignalsList}}',
      '',
      'Confidence: **{{confidenceBand}}**. {{confidenceWhy}}',
      '',
      'What to test next: {{whatToTestNext}}'
    ].join('\n')
  },

  'cause-first-overlay': {
    id: 'cause-first-overlay',
    template: [
      '**Most signals point to {{primaryName}}** ({{primaryShortName}}). The customer is also a **Cause-First Supporter** — their engagement is driven by the cause behind the work, not just the product itself.',
      '',
      '{{primaryOneLineSummary}}',
      '',
      'What pointed us to {{primaryName}}:',
      '{{topContributingSignalsList}}',
      '',
      'What pointed us to the Cause-First overlay:',
      '- The customer chose "supporting a cause" as a purchase motivation',
      '',
      'Confidence: **{{confidenceBand}}**. {{confidenceWhy}}',
      '',
      'What to test next: {{whatToTestNext}}'
    ].join('\n')
  },

  'low-evidence-overlay': {
    id: 'low-evidence-overlay',
    template: [
      '**Confidence is low because the evidence is thin.**',
      '',
      'Even if the archetype match feels right, the team has not yet gathered enough real-world evidence to be confident.',
      '',
      'Suggested next steps:',
      '- Talk to 2–3 more people who fit this profile',
      '- Compare the team\'s assumptions against what real customers say'
    ].join('\n')
  },

  'contradictory-signals': {
    id: 'contradictory-signals',
    template: [
      '**Most signals point to {{primaryName}}** ({{primaryShortName}}), but a few signals push the other way.',
      '',
      'What pointed us here:',
      '{{topContributingSignalsList}}',
      '',
      'What pulled away:',
      '{{contradictingSignalsList}}',
      '',
      'The contradicting signals are not strong enough to change the primary match, but they suggest the customer may not be a typical example of {{primaryName}}.',
      '',
      'Confidence: **{{confidenceBand}}**. {{confidenceWhy}}',
      '',
      'What to test next: {{whatToTestNext}}'
    ].join('\n')
  },

  'no-confident-fit': {
    id: 'no-confident-fit',
    template: [
      '**We could not confidently match this profile to any of our V1 archetypes.**',
      '',
      'The profile sits in a gap. The closest archetypes are:',
      '{{closestArchetypesList}}',
      '',
      'What kept the match from being confident: {{noFitReason}}',
      '',
      'Suggested next steps:',
      '- Gather more evidence on this customer, especially on the weakest axes',
      '- OR flag this customer to your team as a possible gap for a future archetype tranche'
    ].join('\n')
  }
}

/* -------------------------------------------------------------------
 * Signal labels (plain-language, for bullets in explanation)
 * ------------------------------------------------------------------ */

/**
 * Plain-language label for each (axisId, optionId) pair, used by the
 * classifier to populate `topContributingSignals` and
 * `contradictingSignals` bullets. Curriculum lead may rephrase these
 * to taste; the keys are stable.
 */
export const SIGNAL_LABELS: Record<string, Record<string, string>> = {
  'life-stage': {
    'young-singles-couples': 'Young singles or couples life stage',
    'young-families': 'Young-families life stage',
    'established-families': 'Established-families life stage',
    'midlife-households': 'Midlife household life stage',
    'empty-nesters': 'Empty-nest life stage',
    retirees: 'Retiree life stage',
    multigenerational: 'Multigenerational life stage'
  },
  'household-composition': {
    'single-adult': 'Single-adult household',
    roommates: 'Roommates household',
    'couple-no-kids': 'Couple without children',
    'family-with-kids': 'Family with children at home',
    'single-parent': 'Single-parent household',
    multigenerational: 'Multigenerational household composition',
    'empty-nest': 'Empty-nest household'
  },
  urbanicity: {
    'dense-urban-core': 'Dense urban core setting',
    'urban-neighborhood': 'Urban neighborhood',
    'inner-ring-suburb': 'Inner-ring suburb',
    'outer-suburb': 'Outer suburb',
    'second-city': 'Second city or small metro',
    'small-town': 'Small-town setting',
    'rural-exurban': 'Rural or exurban setting'
  },
  'spending-capacity': {
    tight: 'Tight budget',
    'value-conscious': 'Value-conscious spending',
    'moderate-discretionary': 'Moderate discretionary spending',
    comfortable: 'Comfortable spending',
    affluent: 'Affluent spending capacity',
    'high-net-worth': 'High-net-worth spending capacity'
  },
  'tight-budget-detail': {
    'by-constraint': 'Tight by limited income or high fixed costs',
    'by-choice': 'Tight by deliberate frugality',
    both: 'Tight by both income and choice'
  },
  'housing-context': {
    renter: 'Renter',
    homeowner: 'Homeowner',
    'student-shared': 'Student or shared housing',
    'apartment-condo': 'Apartment or condo housing',
    'single-family-home': 'Single-family home',
    'multigenerational-home': 'Multigenerational home'
  },
  'education-occupation': {
    'student-early-workforce': 'Student or early workforce',
    'service-hourly': 'Service or hourly work',
    'skilled-trades': 'Skilled trades',
    'professional-managerial': 'Professional or managerial work',
    'creative-entrepreneurial': 'Creative or entrepreneurial work',
    'retired-fixed-income': 'Retired or fixed income',
    'mixed-household': 'Mixed-household occupations'
  },
  'shopping-media-behavior': {
    'mobile-first-social-commerce': 'Mobile-first / social-commerce shopping',
    'online-convenience': 'Online convenience shopping',
    'big-box-value': 'Big-box value shopping',
    'warehouse-bulk': 'Warehouse / bulk shopping',
    'local-boutique': 'Local boutique shopping',
    'premium-retail': 'Premium retail shopping',
    'thrift-resale': 'Thrift / resale shopping',
    'research-before-buying': 'Researches before buying',
    'cause-driven': 'Cause-driven shopping',
    'brand-loyal': 'Brand-loyal shopping'
  },
  'purchase-motivation': {
    'price-value': 'Price / value motivation',
    convenience: 'Convenience motivation',
    'quality-durability': 'Quality / durability motivation',
    'style-identity': 'Style / identity motivation',
    'status-achievement': 'Status / achievement motivation',
    'family-home': 'Family / home motivation',
    'local-community-pride': 'Local / community pride motivation',
    'ethics-sustainability': 'Ethics / sustainability motivation',
    'supporting-a-cause': 'Supporting-a-cause motivation',
    giftability: 'Giftability motivation'
  }
}

/**
 * Resolve a plain-language label for a primitive selection. Falls
 * back to the option id when no label is registered.
 */
export function resolveSignalLabel(axisId: string, optionId: string): string {
  const axisLabels = SIGNAL_LABELS[axisId]
  if (!axisLabels) return optionId
  return axisLabels[optionId] ?? optionId
}

/* -------------------------------------------------------------------
 * Confidence-explanation phrases
 * ------------------------------------------------------------------ */

/**
 * Phrases the classifier composes into the `confidenceWhyItIsThisLevel`
 * field. Curriculum lead may edit; the keys are stable.
 */
export const CONFIDENCE_PHRASES = {
  high: 'The archetype match is clean and the evidence is strong.',
  mediumArchetypeFloor:
    'The archetype match is solid, but the runner-up is close — gather more evidence to widen the gap.',
  mediumEvidenceFloor:
    'The archetype match is strong, but the team\'s evidence is only at the medium level — more interviews would raise this to high.',
  lowArchetypeFloor:
    'The signals do not point clearly to one archetype yet — the closest matches are within reach of each other.',
  lowEvidenceFloor:
    'The team\'s evidence is mostly assumption — talk to real customers before committing to this archetype.',
  appliedFloorRural:
    'Rural-Fixed-Income classifications stay at medium until the team logs at least one interview with a rural-resident respondent.',
  appliedFloorMultigen:
    'Multigenerational-Urban classifications stay at medium until the team logs at least one interview with a confirmed multigenerational household.',
  appliedFloorCauseFirst:
    'Cause-First classifications stay at medium until the team documents WHY the supporter shows up, not just THAT they show up.',
  writeInLowering:
    'Confidence is reduced because one or more "Other (write-in)" answers cannot be reasoned about numerically.'
} as const

/**
 * Reasons for a no-confident-fit result. The classifier picks the
 * most relevant phrase based on which axes contributed to the gap.
 */
export const NO_FIT_REASONS = {
  noArchetypeAboveThreshold:
    'No archetype scored high enough to be a confident match.',
  multipleClose:
    'Three or more archetypes scored within reach of one another, leaving the match ambiguous.',
  multipleWriteIns:
    'Several "Other (write-in)" selections prevented the classifier from reasoning about key axes.',
  knownGap:
    'This combination of selections may sit in a known V1 gap (such as practical working households without children, or college-town renters).'
} as const

/**
 * Message surfaced when `supporting-a-cause` is selected as a
 * purchase motivation but neither corroborating signal is present
 * (no `cause-driven` shopping behavior pick AND no
 * `evidenceAboutCauseMotivation` flag). The classifier suppresses
 * the Cause-First overlay in this case and surfaces this message in
 * `contradictingSignals` so the team understands why CFS did not
 * appear.
 *
 * Curriculum-coherent: students should not get a free CFS overlay
 * from a single picklist choice; the cause claim needs at least one
 * other behavioral or evidence anchor.
 */
export const CAUSE_FIRST_NOT_CORROBORATED_MESSAGE =
  'You selected "supporting a cause" as a motivation, but the profile needs more evidence before we call this customer cause-led. Add "cause-driven" to shopping behavior, OR document why the supporter shows up.'
