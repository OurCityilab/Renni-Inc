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
import {
  SIMULATION_WEEK_NOTE,
  SIMULATION_WEEK_TITLE,
  simulationWeekDays,
  simulationWeekPrintables
} from '../../data/studio/simulationWeekFinancialLiteracy'
import {
  PATHWAY_CORE_PATH,
  PATHWAY_FULL_PATH,
  PATHWAY_TITLE,
  financialLiteracyPathway
} from '../../data/studio/financialLiteracyPathway'

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

test('registry: six modules — Module 0 (Money Story) then calculators 1–5 in order', () => {
  assert.equal(financialLiteracyModules.length, 6)
  // Module 0 is the reflection starting point; numbers run 0..5 so the five
  // calculator modules keep their stable 1–5 numbers.
  financialLiteracyModules.forEach((m, i) => assert.equal(m.number, i))
  assert.equal(financialLiteracyModules[0]!.slug, 'money-story-goals')
})

test('registry: the five calculator module slugs stay numbered 1–5 and stable', () => {
  const calculators = ['take-home-pay', 'budget-builder', 'credit-debt', 'renting-homeownership', 'money-plan']
  calculators.forEach((slug, i) => {
    const mod = getFinancialLiteracyModule(slug)
    assert.ok(mod, `calculator module "${slug}" must remain registered`)
    assert.equal(mod!.number, i + 1, `${slug} must keep its stable number`)
    assert.equal(mod!.route, `/studio/lab/financial-literacy/${slug}`)
  })
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

// ---------- simulation week ----------

test('simulation week: four days, Day 1 through Day 4 in order', () => {
  assert.equal(simulationWeekDays.length, 4)
  simulationWeekDays.forEach((d, i) => assert.equal(d.day, `Day ${i + 1}`))
})

test('simulation week: every module slug resolves to a registered module', () => {
  for (const d of simulationWeekDays) {
    assert.ok(d.moduleSlugs.length > 0, `${d.day} must have at least one checkpoint module`)
    for (const slug of d.moduleSlugs) {
      const mod = getFinancialLiteracyModule(slug)
      assert.ok(mod, `${d.day} references unknown module slug "${slug}"`)
    }
  }
})

test('simulation week: Day 4 ends with the Money Plan capstone', () => {
  const day4 = simulationWeekDays[3]
  assert.ok(day4)
  assert.equal(day4.moduleSlugs[day4.moduleSlugs.length - 1], 'money-plan')
})

test('simulation week: every day has a title, case title, and big question', () => {
  for (const d of simulationWeekDays) {
    assert.ok(d.title.trim().length > 0)
    assert.ok(d.caseTitle.trim().length > 0)
    assert.ok(d.bigQuestion.trim().length > 0)
  }
})

test('simulation week: header copy is present and case-first', () => {
  assert.ok(SIMULATION_WEEK_TITLE.includes('Money in Real Life'))
  assert.ok(SIMULATION_WEEK_NOTE.toLowerCase().includes('case'))
})

test('simulation week: printable assets exist under public/', () => {
  assert.ok(simulationWeekPrintables.length >= 2)
  for (const p of simulationWeekPrintables) {
    assert.ok(p.href.startsWith('/studio/curriculum/'), `unexpected printable path ${p.href}`)
    const file = join(process.cwd(), 'public', p.href)
    assert.ok(existsSync(file), `printable asset missing: ${file}`)
    assert.ok(p.label.trim().length > 0)
  }
})

test('simulation week: landing page renders the section and keeps module cards', () => {
  const indexSource = readFileSync(join(pagesDir, 'index.vue'), 'utf8')
  assert.ok(indexSource.includes('simulationWeekDays'))
  assert.ok(indexSource.includes('SIMULATION_WEEK_TITLE'))
  assert.ok(indexSource.includes('financialLiteracyModules'), 'module registry cards must remain')
  assert.ok(
    indexSource.includes('Do the case with your team first'),
    'checkpoint guidance must tell students the platform comes after the case'
  )
})

// ---------- Money in Real Life pathway shell (Phase 1) ----------

const EXPECTED_ARTIFACTS = [
  'My Money Starting Point',
  'My First Check Plan',
  'My Banking & Cash Flow Setup',
  'My Budget Plan',
  'My Savings & Emergency Plan',
  'My Credit Rulebook',
  'My Independence Readiness Plan',
  'My Work & Income Strategy',
  'My 12-Month Money Plan'
]

test('pathway: has nine steps, numbered 1 through 9 in order', () => {
  assert.equal(financialLiteracyPathway.length, 9)
  financialLiteracyPathway.forEach((step, i) => assert.equal(step.step, i + 1))
})

test('pathway: every LIVE step maps to a registered module route', () => {
  const live = financialLiteracyPathway.filter((s) => s.status === 'live')
  // The five current modules are the five live pathway steps.
  assert.equal(live.length, financialLiteracyModules.length)
  for (const step of live) {
    assert.ok(step.moduleSlug, `live step "${step.title}" must reference a module slug`)
    const mod = getFinancialLiteracyModule(step.moduleSlug!)
    assert.ok(mod, `live step "${step.title}" references unknown slug "${step.moduleSlug}"`)
    assert.equal(mod!.route, `/studio/lab/financial-literacy/${step.moduleSlug}`)
  }
})

test('pathway: UPCOMING steps carry no route so nothing links to a missing page', () => {
  const upcoming = financialLiteracyPathway.filter((s) => s.status === 'upcoming')
  // Three remain upcoming after Money Story & Goals went live in Phase 2.
  assert.equal(upcoming.length, 3)
  for (const step of upcoming) {
    assert.equal(step.moduleSlug, undefined, `upcoming step "${step.title}" must not link to a route`)
  }
})

test('pathway: Money Story & Goals is live and links to its real route', () => {
  const step = financialLiteracyPathway.find((s) => s.title === 'Money Story & Goals')
  assert.ok(step, 'Money Story & Goals must be a pathway step')
  assert.equal(step!.status, 'live')
  assert.equal(step!.moduleSlug, 'money-story-goals')
  const mod = getFinancialLiteracyModule('money-story-goals')
  assert.ok(mod, 'money-story-goals must resolve in the registry')
  assert.equal(mod!.route, '/studio/lab/financial-literacy/money-story-goals')
})

test('pathway: copy states the 5-hour minimum and 8–10-hour full path', () => {
  const source = readFileSync(join(pagesDir, 'index.vue'), 'utf8')
  assert.ok(PATHWAY_CORE_PATH.includes('5-hour minimum'))
  assert.ok(PATHWAY_FULL_PATH.includes('8–10-hour full path'))
  // The landing page must actually render both framings.
  assert.ok(source.includes('PATHWAY_CORE_PATH'))
  assert.ok(source.includes('PATHWAY_FULL_PATH'))
})

test('pathway: includes all nine target artifacts', () => {
  const artifacts = financialLiteracyPathway.map((s) => s.artifact)
  for (const expected of EXPECTED_ARTIFACTS) {
    assert.ok(artifacts.includes(expected), `pathway missing artifact "${expected}"`)
  }
  assert.equal(new Set(artifacts).size, 9, 'artifacts must be unique')
})

test('pathway: every step has a big question and a realistic time estimate', () => {
  for (const step of financialLiteracyPathway) {
    assert.ok(step.title.trim().length > 0, `step ${step.step} needs a title`)
    assert.ok(step.bigQuestion.trim().length > 0, `step ${step.step} needs a big question`)
    assert.ok(step.estimatedMinutes >= 15 && step.estimatedMinutes <= 120, `step ${step.step} minutes out of range`)
  }
})

test('pathway: landing page renders the pathway, keeps module cards, and keeps case links', () => {
  const source = readFileSync(join(pagesDir, 'index.vue'), 'utf8')
  assert.ok(source.includes('financialLiteracyPathway'), 'pathway steps must render')
  assert.ok(source.includes('PATHWAY_TITLE'), 'pathway title must render')
  assert.ok(source.includes('financialLiteracyModules'), 'the five module cards must remain')
  assert.ok(source.includes('simulationWeekDays'), 'the Simulation Week section must remain')
  // Case packet + field trip guide links stay reachable from the page.
  assert.ok(source.includes('simulationWeekPrintables'), 'case material links must remain')
  assert.equal(PATHWAY_TITLE, 'Money in Real Life')
})

// ---------- Money Story & Goals module (Phase 2, slice 1) ----------

test('money story: registered as Module 0 with the right route and time', () => {
  const mod = getFinancialLiteracyModule('money-story-goals')
  assert.ok(mod, 'money-story-goals must be registered')
  assert.equal(mod!.number, 0)
  assert.equal(mod!.route, '/studio/lab/financial-literacy/money-story-goals')
  assert.equal(mod!.estimatedMinutes, 45)
  assert.ok(/habit|pressure|goal/i.test(mod!.tagline), 'tagline should signal habits/pressures/goals')
})

test('money story: page exists and saves via the shared draft key', () => {
  const page = join(pagesDir, 'money-story-goals.vue')
  assert.ok(existsSync(page), 'money-story-goals.vue must exist')
  const source = readFileSync(page, 'utf8')
  // Save reuses the existing worksheet-draft pattern, no new collection.
  assert.ok(
    source.includes("useFinancialLiteracyDraft('money-story-goals'"),
    'page must persist via useFinancialLiteracyDraft with its own slug'
  )
  // The persisted worksheetType is the prefix + slug (no rule changes).
  assert.equal(FINANCIAL_LITERACY_DRAFT_PREFIX + 'money-story-goals', 'financial-literacy-money-story-goals')
  // First slice: worksheet draft only, no Portfolio artifact write yet.
  assert.ok(!source.includes('usePortfolioArtifact'), 'first slice saves a draft only')
  // Flows into the next module.
  assert.ok(source.includes('/studio/lab/financial-literacy/take-home-pay'), 'must point to Take-Home Pay next')
})

test('money story: landing page lists the five calculator checkpoints, not Module 0', () => {
  const source = readFileSync(join(pagesDir, 'index.vue'), 'utf8')
  // Module 0 is surfaced through the pathway section; the legacy card grid
  // stays the five numbered calculators.
  assert.ok(source.includes('checkpointModules'), 'legacy grid must use the filtered checkpoint list')
  assert.ok(source.includes('financialLiteracyPathway'), 'pathway (where Money Story is live) must render')
})

test('no regression: Budget Builder and Money Plan still write Portfolio artifacts', () => {
  for (const slug of ['budget-builder', 'money-plan']) {
    const source = readFileSync(join(pagesDir, `${slug}.vue`), 'utf8')
    assert.ok(source.includes('usePortfolioArtifact'), `${slug} must still create its Portfolio artifact`)
  }
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
