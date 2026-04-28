// Customer Profile Builder V1 — signal map.
//
// PURPOSE
// -------
// The signal map is the single source of truth for how the
// deterministic classifier scores each archetype against each
// primitive selection. Encoded directly as data so curriculum lead
// can edit it without touching classifier logic.
//
// SIGNAL STRENGTHS
// ----------------
//   +3  strong (defining)
//   +2  moderate
//   +1  weak
//    0  neutral (entry omitted = 0)
//   -2  negative (subtracts from the archetype's raw score)
//   +5  reserved override — used ONLY for `supporting-a-cause` →
//       `cause-first-supporters`. This is the single weight in V1
//       that exceeds the +3 cap, by curriculum decision.
//
// SCORING CAPS (enforced by the classifier, not the data file)
// ------------------------------------------------------------
//   - Single-select axes: max +3 contribution per archetype per axis.
//   - shopping-media-behavior (multi-select): max +6 across the 1–3
//     selected options.
//   - purchase-motivation (primary + optional secondary): max +5
//     across both picks (primary +3 cap; secondary +2 cap). The +5
//     CFS override does NOT participate in this cap — see classifier
//     implementation.
//
// CAUSE-FIRST POSTURE
// -------------------
// CFS is motivation-defined. All geo / demo axes (life-stage,
// household-composition, urbanicity, spending-capacity, tight-budget-
// detail, housing-context, education-occupation) score 0 for CFS by
// design. Only shopping-media-behavior and purchase-motivation
// contribute. The classifier enforces the hard prerequisite
// separately: CFS is dropped from consideration unless
// `supporting-a-cause` is selected as primary OR secondary motivation.
//
// POSTURE
// -------
//   - Pure data. No Vue runtime, no Firestore, no I/O.
//   - Missing entries default to 0 at scoring time.
//   - Curriculum lead is the canonical author. Engineering changes
//     should be limited to fixing typos or option-id mismatches.

// Relative import (not `~/`) so this file is loadable by `tsx` for
// the test runner — the audit-script convention.
import type { CustomerProfileArchetypeId } from '../types/sectionEngines'

/** All allowed signal score values. */
export type SignalScore = -2 | 0 | 1 | 2 | 3 | 5

/** Signal contributions for one archetype, grouped by axis id. */
export interface ArchetypeSignalMap {
  'life-stage'?: Record<string, SignalScore>
  'household-composition'?: Record<string, SignalScore>
  urbanicity?: Record<string, SignalScore>
  'spending-capacity'?: Record<string, SignalScore>
  'tight-budget-detail'?: Record<string, SignalScore>
  'housing-context'?: Record<string, SignalScore>
  'education-occupation'?: Record<string, SignalScore>
  'shopping-media-behavior'?: Record<string, SignalScore>
  'purchase-motivation'?: Record<string, SignalScore>
}

/** Full per-archetype signal map. */
export const SIGNAL_MAP: Record<CustomerProfileArchetypeId, ArchetypeSignalMap> = {
  'rising-city-renters': {
    'life-stage': {
      'young-singles-couples': 3
    },
    'household-composition': {
      'single-adult': 3,
      roommates: 3,
      'couple-no-kids': 2,
      'family-with-kids': -2,
      'single-parent': -2,
      multigenerational: -2,
      'empty-nest': -2
    },
    urbanicity: {
      'dense-urban-core': 3,
      'urban-neighborhood': 3,
      'small-town': -2,
      'rural-exurban': -2
    },
    'spending-capacity': {
      tight: 3,
      'value-conscious': 2,
      'moderate-discretionary': 1,
      affluent: -2,
      'high-net-worth': -2
    },
    'tight-budget-detail': {
      'by-choice': 2,
      both: 1
    },
    'housing-context': {
      renter: 3,
      homeowner: -2,
      'student-shared': 3,
      'apartment-condo': 3,
      'single-family-home': -2,
      'multigenerational-home': -2
    },
    'education-occupation': {
      'student-early-workforce': 3,
      'service-hourly': 2,
      'professional-managerial': 1,
      'creative-entrepreneurial': 2,
      'retired-fixed-income': -2
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': 3,
      'online-convenience': 2,
      'local-boutique': 2,
      'thrift-resale': 3,
      'research-before-buying': 1,
      'cause-driven': 1,
      'brand-loyal': 2
    },
    'purchase-motivation': {
      'price-value': 3,
      convenience: 2,
      'quality-durability': 1,
      'style-identity': 3,
      'status-achievement': 1,
      'local-community-pride': 1,
      'ethics-sustainability': 2,
      'supporting-a-cause': 1,
      giftability: 1
    }
  },

  'value-driven-family-households': {
    'life-stage': {
      'young-families': 3,
      'established-families': 3,
      multigenerational: 1
    },
    'household-composition': {
      'single-adult': -2,
      'family-with-kids': 3,
      'single-parent': 3,
      multigenerational: 1
    },
    urbanicity: {
      'dense-urban-core': -2,
      'urban-neighborhood': 1,
      'inner-ring-suburb': 2,
      'outer-suburb': 2,
      'second-city': 2
    },
    'spending-capacity': {
      tight: 3,
      'value-conscious': 3,
      'moderate-discretionary': 1,
      affluent: -2,
      'high-net-worth': -2
    },
    'tight-budget-detail': {
      'by-constraint': 1,
      'by-choice': 1,
      both: 1
    },
    'housing-context': {
      renter: 2,
      homeowner: 2,
      'apartment-condo': 2,
      'single-family-home': 2,
      'multigenerational-home': 1
    },
    'education-occupation': {
      'service-hourly': 3,
      'skilled-trades': 2,
      'mixed-household': 2
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 2,
      'big-box-value': 3,
      'warehouse-bulk': 3,
      'premium-retail': -2,
      'thrift-resale': 1,
      'research-before-buying': 1,
      'cause-driven': 2,
      'brand-loyal': 3
    },
    'purchase-motivation': {
      'price-value': 3,
      convenience: 1,
      'quality-durability': 2,
      'style-identity': -2,
      'status-achievement': -2,
      'family-home': 3,
      'local-community-pride': 1,
      'ethics-sustainability': 1,
      'supporting-a-cause': 2,
      giftability: 1
    }
  },

  'settled-suburban-households': {
    'life-stage': {
      'established-families': 3,
      'midlife-households': 3,
      'empty-nesters': 3,
      retirees: 1
    },
    'household-composition': {
      'couple-no-kids': 2,
      'family-with-kids': 2,
      'empty-nest': 3
    },
    urbanicity: {
      'dense-urban-core': -2,
      'inner-ring-suburb': 3,
      'outer-suburb': 3,
      'second-city': 2
    },
    'spending-capacity': {
      tight: -2,
      'value-conscious': -2,
      'moderate-discretionary': 3,
      comfortable: 3,
      affluent: 1
    },
    'housing-context': {
      renter: -2,
      homeowner: 3,
      'single-family-home': 3
    },
    'education-occupation': {
      'skilled-trades': 2,
      'professional-managerial': 3,
      'retired-fixed-income': 1,
      'mixed-household': 2
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 3,
      'big-box-value': 2,
      'warehouse-bulk': 3,
      'local-boutique': 1,
      'premium-retail': 2,
      'research-before-buying': 3,
      'cause-driven': 1,
      'brand-loyal': 3
    },
    'purchase-motivation': {
      convenience: 3,
      'quality-durability': 3,
      'style-identity': -2,
      'status-achievement': -2,
      'family-home': 2,
      'local-community-pride': 1,
      'ethics-sustainability': 1,
      'supporting-a-cause': 1,
      giftability: 3
    }
  },

  'established-affluent-households': {
    'life-stage': {
      'young-singles-couples': 1,
      'established-families': 2,
      'midlife-households': 3,
      'empty-nesters': 3
    },
    'household-composition': {
      'couple-no-kids': 2,
      'family-with-kids': 2,
      'empty-nest': 3
    },
    urbanicity: {
      'dense-urban-core': 2,
      'urban-neighborhood': 2,
      'inner-ring-suburb': 2,
      'outer-suburb': 2
    },
    'spending-capacity': {
      tight: -2,
      'value-conscious': -2,
      comfortable: 2,
      affluent: 3,
      'high-net-worth': 3
    },
    'housing-context': {
      renter: -2,
      homeowner: 3,
      'student-shared': -2,
      'apartment-condo': 2,
      'single-family-home': 3
    },
    'education-occupation': {
      'student-early-workforce': -2,
      'service-hourly': -2,
      'professional-managerial': 3,
      'creative-entrepreneurial': 3,
      'retired-fixed-income': -2,
      'mixed-household': 1
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 1,
      'big-box-value': -2,
      'warehouse-bulk': 1,
      'local-boutique': 3,
      'premium-retail': 3,
      'research-before-buying': 3,
      'cause-driven': 2,
      'brand-loyal': 2
    },
    'purchase-motivation': {
      'price-value': -2,
      convenience: -2,
      'quality-durability': 3,
      'style-identity': 3,
      'status-achievement': 2,
      'family-home': 1,
      'local-community-pride': 1,
      'ethics-sustainability': 2,
      'supporting-a-cause': 2,
      giftability: 3
    }
  },

  'practical-small-town-households': {
    'life-stage': {
      'young-families': 2,
      'established-families': 2,
      'midlife-households': 2,
      'empty-nesters': 2,
      retirees: 3,
      multigenerational: 2
    },
    'household-composition': {
      'couple-no-kids': 2,
      'family-with-kids': 2,
      multigenerational: 2,
      'empty-nest': 2
    },
    urbanicity: {
      'dense-urban-core': -2,
      'second-city': 2,
      'small-town': 3,
      'rural-exurban': 3
    },
    'spending-capacity': {
      tight: 2,
      'value-conscious': 2,
      'moderate-discretionary': 2,
      comfortable: 1
    },
    'tight-budget-detail': {
      'by-constraint': 1,
      both: 1
    },
    'housing-context': {
      renter: -2,
      homeowner: 3,
      'single-family-home': 3,
      'multigenerational-home': 1
    },
    'education-occupation': {
      'service-hourly': 3,
      'skilled-trades': 3,
      'professional-managerial': 1,
      'retired-fixed-income': 3,
      'mixed-household': 2
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 2,
      'big-box-value': 3,
      'warehouse-bulk': 2,
      'local-boutique': 1,
      'premium-retail': -2,
      'thrift-resale': 1,
      'research-before-buying': 2,
      'cause-driven': 3,
      'brand-loyal': 3
    },
    'purchase-motivation': {
      'price-value': 3,
      convenience: 1,
      'quality-durability': 3,
      'style-identity': -2,
      'status-achievement': -2,
      'family-home': 2,
      'local-community-pride': 3,
      'supporting-a-cause': 2,
      giftability: 1
    }
  },

  'legacy-stage-affluent-households': {
    'life-stage': {
      'midlife-households': 2,
      'empty-nesters': 3,
      retirees: 1
    },
    'household-composition': {
      'couple-no-kids': 2,
      'family-with-kids': -2,
      'empty-nest': 3
    },
    urbanicity: {
      'urban-neighborhood': 1,
      'inner-ring-suburb': 2,
      'outer-suburb': 2,
      'second-city': 1
    },
    'spending-capacity': {
      tight: -2,
      'value-conscious': -2,
      comfortable: 3,
      affluent: 3,
      'high-net-worth': 3
    },
    'housing-context': {
      renter: -2,
      homeowner: 3,
      'student-shared': -2,
      'single-family-home': 3
    },
    'education-occupation': {
      'student-early-workforce': -2,
      'service-hourly': -2,
      'professional-managerial': 3,
      'retired-fixed-income': 1,
      'mixed-household': 1
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 1,
      'big-box-value': 1,
      'warehouse-bulk': 2,
      'local-boutique': 1,
      'premium-retail': 3,
      'research-before-buying': 3,
      'cause-driven': 2,
      'brand-loyal': 2
    },
    'purchase-motivation': {
      'price-value': -2,
      'quality-durability': 3,
      'style-identity': -2,
      'status-achievement': 1,
      'family-home': 1,
      'local-community-pride': 1,
      'ethics-sustainability': 2,
      'supporting-a-cause': 2,
      giftability: 3
    }
  },

  'rural-fixed-income-households': {
    'life-stage': {
      'young-families': 1,
      'midlife-households': 2,
      'empty-nesters': 2,
      retirees: 3,
      multigenerational: 2
    },
    'household-composition': {
      'single-adult': 1,
      'couple-no-kids': 1,
      'single-parent': 1,
      multigenerational: 2,
      'empty-nest': 2
    },
    urbanicity: {
      'dense-urban-core': -2,
      'small-town': 2,
      'rural-exurban': 3
    },
    'spending-capacity': {
      tight: 3,
      'value-conscious': 2,
      'moderate-discretionary': 1,
      comfortable: -2,
      affluent: -2,
      'high-net-worth': -2
    },
    'tight-budget-detail': {
      'by-constraint': 2,
      both: 1
    },
    'housing-context': {
      renter: -2,
      homeowner: 3,
      'single-family-home': 3,
      'multigenerational-home': 2
    },
    'education-occupation': {
      'service-hourly': 3,
      'skilled-trades': 2,
      'retired-fixed-income': 3,
      'mixed-household': 1
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': -2,
      'online-convenience': 2,
      'big-box-value': 3,
      'warehouse-bulk': 1,
      'premium-retail': -2,
      'thrift-resale': 1,
      'research-before-buying': 1,
      'cause-driven': 1,
      'brand-loyal': 3
    },
    'purchase-motivation': {
      'price-value': 3,
      convenience: 1,
      'quality-durability': 3,
      'style-identity': -2,
      'status-achievement': -2,
      'family-home': 1,
      'local-community-pride': 1,
      'supporting-a-cause': 1
    }
  },

  'multigenerational-urban-households': {
    'life-stage': {
      'young-families': 1,
      'established-families': 1,
      'midlife-households': 1,
      retirees: 1,
      multigenerational: 3
    },
    'household-composition': {
      'single-adult': -2,
      roommates: -2,
      'family-with-kids': 2,
      multigenerational: 3,
      'empty-nest': -2
    },
    urbanicity: {
      'dense-urban-core': 2,
      'urban-neighborhood': 3,
      'inner-ring-suburb': 2,
      'second-city': 1,
      'small-town': -2,
      'rural-exurban': -2
    },
    'spending-capacity': {
      tight: 2,
      'value-conscious': 2,
      'moderate-discretionary': 2,
      comfortable: 1
    },
    'tight-budget-detail': {
      'by-constraint': 1,
      both: 1
    },
    'housing-context': {
      renter: 1,
      homeowner: 2,
      'apartment-condo': 1,
      'single-family-home': 2,
      'multigenerational-home': 3
    },
    'education-occupation': {
      'student-early-workforce': 1,
      'service-hourly': 2,
      'skilled-trades': 1,
      'professional-managerial': 1,
      'creative-entrepreneurial': 1,
      'retired-fixed-income': 1,
      'mixed-household': 3
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': 1,
      'online-convenience': 2,
      'big-box-value': 2,
      'warehouse-bulk': 3,
      'research-before-buying': 1,
      'cause-driven': 1,
      'brand-loyal': 2
    },
    'purchase-motivation': {
      'price-value': 2,
      convenience: 1,
      'quality-durability': 3,
      'style-identity': -2,
      'status-achievement': -2,
      'family-home': 3,
      'local-community-pride': 2,
      'ethics-sustainability': 1,
      'supporting-a-cause': 1,
      giftability: 1
    }
  },

  'digital-first-premium-buyers': {
    'life-stage': {
      'young-singles-couples': 3,
      'young-families': 1,
      'midlife-households': 1
    },
    'household-composition': {
      'single-adult': 2,
      roommates: 1,
      'couple-no-kids': 2,
      'family-with-kids': 1
    },
    urbanicity: {
      'dense-urban-core': 3,
      'urban-neighborhood': 3,
      'inner-ring-suburb': 1,
      'small-town': -2,
      'rural-exurban': -2
    },
    'spending-capacity': {
      tight: -2,
      'value-conscious': -2,
      'moderate-discretionary': 1,
      comfortable: 3,
      affluent: 3,
      'high-net-worth': 1
    },
    'housing-context': {
      renter: 1,
      homeowner: 1,
      'apartment-condo': 2,
      'single-family-home': 1
    },
    'education-occupation': {
      'student-early-workforce': 1,
      'professional-managerial': 3,
      'creative-entrepreneurial': 3,
      'retired-fixed-income': -2
    },
    'shopping-media-behavior': {
      'mobile-first-social-commerce': 3,
      'online-convenience': 1,
      'big-box-value': -2,
      'local-boutique': 2,
      'premium-retail': 3,
      'thrift-resale': 1,
      'research-before-buying': 2,
      'cause-driven': 2,
      'brand-loyal': 1
    },
    'purchase-motivation': {
      'price-value': -2,
      convenience: 1,
      'quality-durability': 3,
      'style-identity': 3,
      'status-achievement': 2,
      'local-community-pride': 1,
      'ethics-sustainability': 3,
      'supporting-a-cause': 2,
      giftability: 1
    }
  },

  'cause-first-supporters': {
    // CFS is motivation-defined. All geo / demo axes score 0 by
    // design (omitted entries default to 0).
    'shopping-media-behavior': {
      'research-before-buying': 1,
      'cause-driven': 3,
      'brand-loyal': 1
    },
    'purchase-motivation': {
      'local-community-pride': 1,
      'ethics-sustainability': 2,
      // The +5 override. The classifier honors this above the +3
      // primary-motivation cap because CFS is defined by this signal.
      'supporting-a-cause': 5
    }
  }
}

/* -------------------------------------------------------------------
 * Calibration constants
 * ------------------------------------------------------------------ */

/**
 * V1 calibration constants. Editable by curriculum lead. Changes
 * here affect classification behavior without touching classifier
 * code.
 */
export const CALIBRATION = {
  /** Minimum normalized score (0–100) for an archetype to be returned
   *  as primary. Below this, the classifier returns
   *  `status: 'not_available'`. */
  minimumFitThreshold: 40,

  /** Maximum margin (in 0–100 normalized points) between the primary
   *  and runner-up for the runner-up to be reported as a secondary
   *  (close-runner-up) match. */
  closeRunnerUpThreshold: 10,

  /** Margin to runner-up required for `'high'` archetype-derived
   *  confidence. */
  highConfidenceMargin: 20,
  /** Minimum primary score required for `'high'` archetype-derived
   *  confidence. */
  highConfidenceMinimumScore: 60,

  /** Margin to runner-up required for `'medium'` archetype-derived
   *  confidence. */
  mediumConfidenceMargin: 10,
  /** Minimum primary score required for `'medium'` archetype-derived
   *  confidence. */
  mediumConfidenceMinimumScore: 50,

  /** Cap on shopping-media-behavior contribution (sum of the 1–3
   *  selected options) per archetype. */
  shoppingMediaCap: 6,

  /** Cap on purchase-motivation contribution (primary + optional
   *  secondary) per archetype. The +5 CFS supporting-a-cause override
   *  is NOT subject to this cap by curriculum decision. */
  purchaseMotivationCap: 5,

  /** Per-axis cap for any single-select axis (other than
   *  purchase-motivation). Defensive — protects against accidental
   *  signal-map entries above +3. */
  singleSelectCap: 3,

  /** Maximum theoretical aggregate per archetype (used for
   *  normalization). Conservative upper bound across the 8 scoring
   *  axes; the classifier normalizes (clamped 0..max → 0..100)
   *  uniformly across archetypes. */
  theoreticalMaxScore: 30
} as const

/* -------------------------------------------------------------------
 * Lookup helpers
 * ------------------------------------------------------------------ */

/**
 * Resolve a signal score for an (archetype, axis, optionId) triple.
 * Missing entries return 0 (neutral). The classifier should call this
 * rather than reaching into the SIGNAL_MAP directly.
 */
export function getSignalScore(
  archetypeId: CustomerProfileArchetypeId,
  axisId: keyof ArchetypeSignalMap,
  optionId: string
): SignalScore {
  const archetypeMap = SIGNAL_MAP[archetypeId]
  if (!archetypeMap) return 0
  const axisMap = archetypeMap[axisId]
  if (!axisMap) return 0
  return axisMap[optionId] ?? 0
}

/**
 * The +5 CFS override token. Exported so the classifier can
 * recognize it when applying the per-axis cap.
 */
export const SUPPORTING_A_CAUSE_OVERRIDE_SCORE: 5 = 5
