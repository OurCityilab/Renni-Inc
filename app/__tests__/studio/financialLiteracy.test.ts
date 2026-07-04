// Tests for the Financial Literacy Lab's module registry, route/link
// presence, and the Money Plan / Budget Plan composers
// (app/data/studio/financialLiteracyLab.ts).
//
// Runner: `tsx app/__tests__/studio/financialLiteracy.test.ts`
// (or `npm run test:studio-financial-literacy`). Uses Node's built-in
// `node:assert/strict`, matching the existing test files in
// app/__tests__/ — no vitest/jest dependency.

import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FINANCIAL_LITERACY_DRAFT_PREFIX,
  composeBudgetPlan,
  composeMoneyPlan,
  financialLiteracyModules,
  getFinancialLiteracyModule,
  hasAnyBudgetPlanAnswer,
  hasAnyMoneyPlanAnswer,
  MONEY_PLAN_SECTIONS,
  type BudgetPlanInputs,
  type MoneyPlanInputs
} from '../../data/studio/financialLiteracyLab'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

const pagesDir = join(process.cwd(), 'app/pages/studio/lab/financial-literacy')

const emptyMoneyPlan: MoneyPlanInputs = {
  incomeEstimate: '',
  budgetPlan: '',
  creditDebtTakeaways: '',
  housingGoal: '',
  moneyHabit: '',
  openQuestion: ''
}

// ---------- module registry integrity ----------

test('registry: exactly five modules, numbered 1 through 5 in order', () => {
  assert.equal(financialLiteracyModules.length, 5)
  financialLiteracyModules.forEach((m, i) => assert.equal(m.number, i + 1))
})

test('registry: slugs are unique', () => {
  const slugs = financialLiteracyModules.map((m) => m.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})

test('registry: every route follows /studio/lab/financial-literacy/<slug>', () => {
  for (const m of financialLiteracyModules) {
    assert.equal(m.route, `/studio/lab/financial-literacy/${m.slug}`)
  }
})

test('registry: every module has a title, tagline, and realistic time estimate', () => {
  for (const m of financialLiteracyModules) {
    assert.ok(m.title.trim().length > 0, `${m.slug} needs a title`)
    assert.ok(m.tagline.trim().length > 0, `${m.slug} needs a tagline`)
    assert.ok(m.estimatedMinutes >= 5 && m.estimatedMinutes <= 60, `${m.slug} minutes out of range`)
  }
})

test('registry: getFinancialLiteracyModule finds real slugs, misses fake ones', () => {
  assert.equal(getFinancialLiteracyModule('take-home-pay')?.number, 1)
  assert.equal(getFinancialLiteracyModule('crypto-day-trading'), undefined)
})

test('registry: draft prefix stays stable (worksheetType contract)', () => {
  assert.equal(FINANCIAL_LITERACY_DRAFT_PREFIX, 'financial-literacy-')
})

// ---------- page files exist for every route ----------

test('pages: index.vue and one page file per module exist on disk', () => {
  assert.ok(existsSync(join(pagesDir, 'index.vue')), 'missing financial-literacy/index.vue')
  for (const m of financialLiteracyModules) {
    assert.ok(existsSync(join(pagesDir, `${m.slug}.vue`)), `missing page for ${m.slug}`)
  }
})

// ---------- link presence ----------

test('links: The Lab index links to the Financial Literacy Lab', () => {
  const labIndex = readFileSync(join(process.cwd(), 'app/pages/studio/lab/index.vue'), 'utf8')
  assert.ok(labIndex.includes('/studio/lab/financial-literacy'))
})

test('links: the Financial Literacy index renders every module route', () => {
  const source = readFileSync(join(pagesDir, 'index.vue'), 'utf8')
  // The index iterates the registry, so it must import it rather than
  // hardcode routes that could drift from the module list.
  assert.ok(source.includes('financialLiteracyModules'))
})

test('links: Today page routes money-basics and keys-credit missions into the lab', () => {
  const today = readFileSync(join(process.cwd(), 'app/pages/studio/today.vue'), 'utf8')
  assert.ok(today.includes("'money-basics': '/studio/lab/financial-literacy'"))
  assert.ok(today.includes("'keys-credit': '/studio/lab/financial-literacy/credit-debt'"))
})

// ---------- Money Plan composer ----------

test('money plan: uses only the student\'s own words when provided', () => {
  const plan = composeMoneyPlan({
    ...emptyMoneyPlan,
    incomeEstimate: 'About $2,100/month take-home from a $16/hr warehouse job.',
    moneyHabit: 'Move $20 to savings every payday before I spend anything.'
  })
  assert.ok(plan.includes('MY INCOME ESTIMATE\nAbout $2,100/month take-home from a $16/hr warehouse job.'))
  assert.ok(plan.includes('ONE MONEY HABIT I WILL PRACTICE THIS SUMMER\nMove $20 to savings every payday before I spend anything.'))
})

test('money plan: blank sections become bracketed prompts, never invented content', () => {
  const plan = composeMoneyPlan(emptyMoneyPlan)
  for (const section of MONEY_PLAN_SECTIONS) {
    assert.ok(plan.includes(section.heading), `missing heading ${section.heading}`)
    assert.ok(plan.includes(section.emptyPrompt), `missing prompt for ${section.key}`)
    assert.ok(section.emptyPrompt.startsWith('[') && section.emptyPrompt.endsWith(']'))
  }
  // No invented numbers: an all-blank plan contains no digits at all.
  assert.ok(!/\d/.test(plan), 'blank plan should not contain any numbers')
})

test('money plan: whitespace-only answers count as blank', () => {
  const plan = composeMoneyPlan({ ...emptyMoneyPlan, housingGoal: '   ' })
  assert.ok(plan.includes('[add your goal from the Renting & Ownership module]'))
})

test('money plan: hasAnyMoneyPlanAnswer gates the build button correctly', () => {
  assert.equal(hasAnyMoneyPlanAnswer(emptyMoneyPlan), false)
  assert.equal(hasAnyMoneyPlanAnswer({ ...emptyMoneyPlan, openQuestion: ' ' }), false)
  assert.equal(hasAnyMoneyPlanAnswer({ ...emptyMoneyPlan, openQuestion: 'How do I start a credit history at 18?' }), true)
})

// ---------- Budget Plan composer ----------

const emptyBudgetPlan: BudgetPlanInputs = {
  monthlyTakeHome: '',
  needsPercent: '',
  wantsPercent: '',
  savingsPercent: '',
  givingPercent: '',
  needsList: '',
  wantsList: ''
}

test('budget plan: renders the student\'s numbers and lists verbatim', () => {
  const plan = composeBudgetPlan({
    monthlyTakeHome: '1200',
    needsPercent: '50',
    wantsPercent: '30',
    savingsPercent: '15',
    givingPercent: '5',
    needsList: 'Bus pass, phone bill, food at home',
    wantsList: 'Sneakers, eating out'
  })
  assert.ok(plan.includes('MY MONTHLY TAKE-HOME (ESTIMATE)\n$1200'))
  assert.ok(plan.includes('Needs: 50%'))
  assert.ok(plan.includes('Giving: 5%'))
  assert.ok(plan.includes('MY NEEDS\nBus pass, phone bill, food at home'))
  assert.ok(plan.includes('MY WANTS\nSneakers, eating out'))
})

test('budget plan: blanks become bracketed prompts', () => {
  const plan = composeBudgetPlan(emptyBudgetPlan)
  assert.ok(plan.includes('[add your estimated monthly take-home]'))
  assert.ok(plan.includes('Needs: [add %]'))
  assert.ok(plan.includes('[list your real needs]'))
  assert.ok(plan.includes('[list your real wants]'))
  assert.ok(!/\d/.test(plan), 'blank budget plan should not contain any numbers')
})

test('budget plan: hasAnyBudgetPlanAnswer is false when everything is empty', () => {
  assert.equal(hasAnyBudgetPlanAnswer(emptyBudgetPlan), false)
})

test('budget plan: hasAnyBudgetPlanAnswer treats whitespace-only fields as empty', () => {
  assert.equal(
    hasAnyBudgetPlanAnswer({ ...emptyBudgetPlan, needsList: '   ', wantsPercent: '\n' }),
    false
  )
})

test('budget plan: hasAnyBudgetPlanAnswer is true with any single field filled', () => {
  assert.equal(hasAnyBudgetPlanAnswer({ ...emptyBudgetPlan, monthlyTakeHome: '1200' }), true)
  assert.equal(hasAnyBudgetPlanAnswer({ ...emptyBudgetPlan, wantsList: 'sneakers' }), true)
})

/* -------------------------------------------------------------------
 * Runner
 * ------------------------------------------------------------------ */

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    // eslint-disable-next-line no-console
    console.log(`ok  - ${t.name}`)
  } catch (err) {
    failed++
    // eslint-disable-next-line no-console
    console.error(`FAIL - ${t.name}`)
    console.error(err)
  }
}

if (failed > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n${failed} test(s) failed`)
  process.exit(1)
}
// eslint-disable-next-line no-console
console.log(`\n${tests.length} passed`)
