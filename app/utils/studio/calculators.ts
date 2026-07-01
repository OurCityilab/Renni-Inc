// Pure calculators for The Markets — Rose City Marketplace.
//
// See Our_City_Studio_Build_Framework/13_CALCULATOR_RULES.md for the
// source formulas. These are educational approximations, not
// financial advice; callers are responsible for surfacing the
// assumptions (take-home factor, rent %, multiplier) to the student.
import type { CohortSettings } from '~/types/studio/models'

export const DEFAULT_COHORT_SETTINGS: CohortSettings = {
  takeHomePayFactor: 0.75,
  landlordIncomeMultiplier: 3,
  safeRentPercentOfTakeHome: 0.3,
  stretchRentPercentOfTakeHome: 0.4
}

export interface TakeHomePay {
  monthlyGross: number
  estimatedTakeHome: number
}

export function computeTakeHomePay(
  annualSalary: number,
  takeHomePayFactor: number = DEFAULT_COHORT_SETTINGS.takeHomePayFactor
): TakeHomePay {
  const monthlyGross = annualSalary / 12
  return {
    monthlyGross,
    estimatedTakeHome: monthlyGross * takeHomePayFactor
  }
}

// DTI = monthly_debt_payments / monthly_gross_income. Returns null
// when gross income is zero/negative — there is no meaningful ratio
// to report, and dividing would produce Infinity/NaN.
export function computeDti(
  monthlyDebtPayments: number,
  monthlyGrossIncome: number
): number | null {
  if (monthlyGrossIncome <= 0) return null
  return monthlyDebtPayments / monthlyGrossIncome
}

export interface RentAffordability {
  maxSafeRent: number
  maxStretchRent: number
}

export function computeRentAffordability(
  estimatedTakeHome: number,
  safePercentOfTakeHome: number = DEFAULT_COHORT_SETTINGS.safeRentPercentOfTakeHome,
  stretchPercentOfTakeHome: number = DEFAULT_COHORT_SETTINGS.stretchRentPercentOfTakeHome
): RentAffordability {
  return {
    maxSafeRent: estimatedTakeHome * safePercentOfTakeHome,
    maxStretchRent: estimatedTakeHome * stretchPercentOfTakeHome
  }
}

export interface LandlordQualificationInput {
  monthlyGrossIncome: number
  rent: number
  creditScore: number
  savings: number
  deposit: number
  landlordIncomeMultiplier?: number
  landlordMinCredit?: number
}

export interface LandlordQualificationResult {
  qualifies: boolean
  meetsIncomeRule: boolean
  meetsCreditRule: boolean
  meetsSavingsRule: boolean
}

// Landlord qualification: monthly_gross_income >= rent *
// landlord_income_multiplier; credit_score >= landlord_min_credit;
// savings >= deposit. All three must hold.
export function computeLandlordQualification(
  input: LandlordQualificationInput
): LandlordQualificationResult {
  const multiplier = input.landlordIncomeMultiplier ?? DEFAULT_COHORT_SETTINGS.landlordIncomeMultiplier
  const minCredit = input.landlordMinCredit ?? 0
  const meetsIncomeRule = input.monthlyGrossIncome >= input.rent * multiplier
  const meetsCreditRule = input.creditScore >= minCredit
  const meetsSavingsRule = input.savings >= input.deposit
  return {
    qualifies: meetsIncomeRule && meetsCreditRule && meetsSavingsRule,
    meetsIncomeRule,
    meetsCreditRule,
    meetsSavingsRule
  }
}
