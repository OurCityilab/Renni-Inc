// "Money in Real Life" pathway shell — the full 9-step student journey
// rendered on the Financial Literacy Lab landing page. Five steps are LIVE
// today (each maps to an existing module in financialLiteracyLab.ts by
// slug); four are UPCOMING and intentionally carry no route until their
// pages exist. Deliberately separate from the module registry so the
// registry's invariants (exactly five modules, route pattern, draft prefix)
// stay untouched. See docs/studio/financial-literacy-platform-roadmap.md.

export const PATHWAY_TITLE = 'Money in Real Life'

// Copy strings kept as constants so the landing page and tests share one
// source of truth for the time framing.
export const PATHWAY_CORE_PATH = '5-hour minimum core path'
export const PATHWAY_FULL_PATH = '8–10-hour full path'

export const PATHWAY_INTRO =
  'You will make real-life money decisions, revise your plan when life changes, and leave with a 12-month money plan.'

export const PATHWAY_CASE_FIRST_NOTE =
  'The cases carry the learning; each Studio module is the checkpoint where you run your numbers and save what’s yours.'

export const PATHWAY_CAPSTONE_NOTE =
  'Everything you save along the way feeds the capstone: your own 12-Month Money Plan, ready to present.'

export interface PathwayModule {
  step: number
  title: string
  /** The one question this step answers. */
  bigQuestion: string
  /** The saved Portfolio artifact this step produces. */
  artifact: string
  /** Core-path time estimate in minutes. */
  estimatedMinutes: number
  status: 'live' | 'upcoming'
  /**
   * Existing registry slug for LIVE steps (resolves to a real route via
   * getFinancialLiteracyModule). Undefined for UPCOMING steps so the UI
   * never links to a page that does not exist yet.
   */
  moduleSlug?: string
}

export const financialLiteracyPathway: PathwayModule[] = [
  {
    step: 1,
    title: 'Money Story & Goals',
    bigQuestion: 'What do I believe about money, and what am I trying to change?',
    artifact: 'My Money Starting Point',
    estimatedMinutes: 45,
    status: 'live',
    moduleSlug: 'money-story-goals'
  },
  {
    step: 2,
    title: 'Earning Money & Reading a Paycheck',
    bigQuestion: 'How much of my check is actually mine to plan with?',
    artifact: 'My First Check Plan',
    estimatedMinutes: 45,
    status: 'live',
    moduleSlug: 'take-home-pay'
  },
  {
    step: 3,
    title: 'Banking, Cash Flow & Money Safety',
    bigQuestion: 'Where should my money go when I get paid?',
    artifact: 'My Banking & Cash Flow Setup',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'banking-cash-flow'
  },
  {
    step: 4,
    title: 'Budgeting Under Pressure',
    bigQuestion: 'What do I protect first when I cannot afford everything?',
    artifact: 'My Budget Plan',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'budget-builder'
  },
  {
    step: 5,
    title: 'Saving, Emergencies & Big Goals',
    bigQuestion: 'How do I prepare for what I know is coming and what I don’t?',
    artifact: 'My Savings & Emergency Plan',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'savings-emergencies'
  },
  {
    step: 6,
    title: 'Credit, Debt & Buy Now Pay Later',
    bigQuestion: 'When does borrowing help me, and when does it trap me?',
    artifact: 'My Credit Rulebook',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'credit-debt'
  },
  {
    step: 7,
    title: 'Transportation, Housing & Independence',
    bigQuestion: 'What does independence really cost?',
    artifact: 'My Independence Readiness Plan',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'renting-homeownership'
  },
  {
    step: 8,
    title: 'Work, Taxes, Benefits & Career Money',
    bigQuestion: 'How do jobs, benefits, taxes, and career choices affect my money?',
    artifact: 'My Work & Income Strategy',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'work-career-money'
  },
  {
    step: 9,
    title: 'Final 12-Month Money Plan Capstone',
    bigQuestion: 'What is my realistic money plan for the next year?',
    artifact: 'My 12-Month Money Plan',
    estimatedMinutes: 60,
    status: 'live',
    moduleSlug: 'money-plan'
  }
]
