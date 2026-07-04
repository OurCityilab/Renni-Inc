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

export interface BudgetSplitInput {
  monthlyTakeHome: number
  needsPercent: number
  wantsPercent: number
  savingsPercent: number
  givingPercent: number
}

export interface BudgetSplit {
  needs: number
  wants: number
  savings: number
  giving: number
  totalPercent: number
  leftoverPercent: number
  isBalanced: boolean
}

// Percent-based budget allocation. isBalanced means the four
// percents account for the whole take-home (within a rounding hair);
// leftoverPercent can be negative when the student over-allocates.
export function computeBudgetSplit(input: BudgetSplitInput): BudgetSplit {
  const totalPercent =
    input.needsPercent + input.wantsPercent + input.savingsPercent + input.givingPercent
  const dollars = (percent: number) => (input.monthlyTakeHome * percent) / 100
  return {
    needs: dollars(input.needsPercent),
    wants: dollars(input.wantsPercent),
    savings: dollars(input.savingsPercent),
    giving: dollars(input.givingPercent),
    totalPercent,
    leftoverPercent: 100 - totalPercent,
    isBalanced: Math.abs(100 - totalPercent) < 0.01
  }
}

export interface DebtPayoffInput {
  balance: number
  aprPercent: number
  monthlyPayment: number
}

export type DebtPayoffResult =
  | { paysOff: true; months: number; totalPaid: number; totalInterest: number }
  | {
      paysOff: false
      reason: 'payment_below_interest' | 'longer_than_cap'
      firstMonthInterest: number
    }

// Month-by-month simulation of a fixed payment against a balance
// with monthly compounding (APR / 12). Two ways to never pay off:
// the payment doesn't beat the first month's interest (the classic
// "minimum payment trap"), or it barely beats it and payoff would
// take longer than the 1200-month (100-year) cap — reported as
// not paying off rather than pretending the cap was a payoff.
export function computeDebtPayoff(input: DebtPayoffInput): DebtPayoffResult {
  if (input.balance <= 0) {
    return { paysOff: true, months: 0, totalPaid: 0, totalInterest: 0 }
  }
  const monthlyRate = input.aprPercent / 100 / 12
  const firstMonthInterest = input.balance * monthlyRate
  if (input.monthlyPayment <= 0 || input.monthlyPayment <= firstMonthInterest) {
    return { paysOff: false, reason: 'payment_below_interest', firstMonthInterest }
  }
  let balance = input.balance
  let months = 0
  let totalPaid = 0
  while (balance > 0 && months < 1200) {
    const interest = balance * monthlyRate
    const payment = Math.min(input.monthlyPayment, balance + interest)
    balance = balance + interest - payment
    totalPaid += payment
    months += 1
  }
  if (balance > 0) {
    return { paysOff: false, reason: 'longer_than_cap', firstMonthInterest }
  }
  return {
    paysOff: true,
    months,
    totalPaid,
    totalInterest: totalPaid - input.balance
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
