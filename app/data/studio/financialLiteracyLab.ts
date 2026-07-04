// Financial Literacy Lab — module registry and the "My Money Plan"
// composer. Five in-app modules: deterministic calculators plus
// structured reflection, no AI required. Calculators live in
// app/utils/studio/calculators.ts (see 13_CALCULATOR_RULES.md);
// drafts persist through useWorksheetResponse with worksheetType
// `financial-literacy-<slug>`, which needs no Firestore rule changes.

export interface FinancialLiteracyModule {
  slug: string
  number: number
  title: string
  /** Student-facing card copy on the lab index. */
  tagline: string
  route: string
  estimatedMinutes: number
}

export const financialLiteracyModules: FinancialLiteracyModule[] = [
  {
    slug: 'take-home-pay',
    number: 1,
    title: 'Take-Home Pay',
    tagline:
      'See the difference between what a job pays and what actually lands in your account — and why.',
    route: '/studio/lab/financial-literacy/take-home-pay',
    estimatedMinutes: 15
  },
  {
    slug: 'budget-builder',
    number: 2,
    title: 'Budget Builder',
    tagline:
      'Split your real take-home number across needs, wants, savings, and giving — your plan, your percentages.',
    route: '/studio/lab/financial-literacy/budget-builder',
    estimatedMinutes: 20
  },
  {
    slug: 'credit-debt',
    number: 3,
    title: 'Credit & Debt',
    tagline:
      'How credit works, what a credit score is, and why minimum payments can keep you paying for years.',
    route: '/studio/lab/financial-literacy/credit-debt',
    estimatedMinutes: 20
  },
  {
    slug: 'renting-homeownership',
    number: 4,
    title: 'Renting & Ownership',
    tagline:
      'What landlords check before saying yes, what rent you can actually afford, and how ownership builds wealth over time.',
    route: '/studio/lab/financial-literacy/renting-homeownership',
    estimatedMinutes: 20
  },
  {
    slug: 'money-plan',
    number: 5,
    title: 'My Money Plan',
    tagline:
      'Pull everything together into one plan you own — savable to your Portfolio.',
    route: '/studio/lab/financial-literacy/money-plan',
    estimatedMinutes: 15
  }
]

export function getFinancialLiteracyModule(slug: string): FinancialLiteracyModule | undefined {
  return financialLiteracyModules.find((m) => m.slug === slug)
}

export const FINANCIAL_LITERACY_DRAFT_PREFIX = 'financial-literacy-'

// ---- My Money Plan composer ----
// Builds the Portfolio artifact from ONLY the student's own words.
// Empty sections become bracketed prompts, never invented content.

export interface MoneyPlanInputs {
  incomeEstimate: string
  budgetPlan: string
  creditDebtTakeaways: string
  housingGoal: string
  moneyHabit: string
  openQuestion: string
}

export const MONEY_PLAN_SECTIONS: Array<{ key: keyof MoneyPlanInputs; heading: string; emptyPrompt: string }> = [
  {
    key: 'incomeEstimate',
    heading: 'MY INCOME ESTIMATE',
    emptyPrompt: '[add your income estimate from the Take-Home Pay module]'
  },
  {
    key: 'budgetPlan',
    heading: 'MY NEEDS / WANTS / SAVINGS PLAN',
    emptyPrompt: '[add your split from the Budget Builder module]'
  },
  {
    key: 'creditDebtTakeaways',
    heading: 'MY CREDIT & DEBT TAKEAWAYS',
    emptyPrompt: '[add what you want to remember from the Credit & Debt module]'
  },
  {
    key: 'housingGoal',
    heading: 'MY HOUSING OR OWNERSHIP GOAL',
    emptyPrompt: '[add your goal from the Renting & Ownership module]'
  },
  {
    key: 'moneyHabit',
    heading: 'ONE MONEY HABIT I WILL PRACTICE THIS SUMMER',
    emptyPrompt: '[name one habit you will actually do]'
  },
  {
    key: 'openQuestion',
    heading: 'ONE QUESTION I STILL NEED ANSWERED',
    emptyPrompt: '[write the money question you want to ask a coach]'
  }
]

export function composeMoneyPlan(inputs: MoneyPlanInputs): string {
  return MONEY_PLAN_SECTIONS.map(({ key, heading, emptyPrompt }) => {
    const value = inputs[key].trim()
    return `${heading}\n${value || emptyPrompt}`
  }).join('\n\n')
}

export function hasAnyMoneyPlanAnswer(inputs: MoneyPlanInputs): boolean {
  return MONEY_PLAN_SECTIONS.some(({ key }) => inputs[key].trim().length > 0)
}

// ---- My Budget Plan composer ----
// Same rule: the artifact is built from the student's own numbers
// and lists; blanks become bracketed prompts.

export interface BudgetPlanInputs {
  monthlyTakeHome: string
  needsPercent: string
  wantsPercent: string
  savingsPercent: string
  givingPercent: string
  needsList: string
  wantsList: string
}

export function composeBudgetPlan(inputs: BudgetPlanInputs): string {
  const takeHome = inputs.monthlyTakeHome.trim()
  const line = (label: string, percent: string) =>
    `${label}: ${percent.trim() ? `${percent.trim()}%` : '[add %]'}`
  return [
    `MY MONTHLY TAKE-HOME (ESTIMATE)\n${takeHome ? `$${takeHome}` : '[add your estimated monthly take-home]'}`,
    `MY SPLIT\n${[
      line('Needs', inputs.needsPercent),
      line('Wants', inputs.wantsPercent),
      line('Savings', inputs.savingsPercent),
      line('Giving', inputs.givingPercent)
    ].join('\n')}`,
    `MY NEEDS\n${inputs.needsList.trim() || '[list your real needs]'}`,
    `MY WANTS\n${inputs.wantsList.trim() || '[list your real wants]'}`
  ].join('\n\n')
}
