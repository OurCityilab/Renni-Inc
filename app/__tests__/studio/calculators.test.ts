// Pure unit tests for Our City Studio's Rose City Marketplace
// calculators (app/utils/studio/calculators.ts).
//
// Runner: `tsx app/__tests__/studio/calculators.test.ts`
// (or `npm run test:studio-calculators`). Uses Node's built-in
// `node:assert/strict`, matching the existing test files in
// app/__tests__/ — no vitest/jest dependency.

import { strict as assert } from 'node:assert'
import {
  computeDti,
  computeLandlordQualification,
  computeRentAffordability,
  computeTakeHomePay,
  DEFAULT_COHORT_SETTINGS
} from '../../utils/studio/calculators'

interface Test {
  name: string
  fn: () => void
}

const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

// ---------- take-home pay ----------

test('take-home pay: default 0.75 factor on a $36,000 salary', () => {
  const result = computeTakeHomePay(36000)
  assert.equal(result.monthlyGross, 3000)
  assert.equal(result.estimatedTakeHome, 2250)
})

test('take-home pay: custom factor overrides the default', () => {
  const result = computeTakeHomePay(48000, 0.8)
  assert.equal(result.monthlyGross, 4000)
  assert.equal(result.estimatedTakeHome, 3200)
})

// ---------- DTI ----------

test('DTI: monthly debt over monthly gross income', () => {
  assert.equal(computeDti(500, 2500), 0.2)
})

test('DTI: zero gross income returns null instead of Infinity', () => {
  assert.equal(computeDti(500, 0), null)
})

test('DTI: negative gross income also returns null', () => {
  assert.equal(computeDti(500, -100), null)
})

// ---------- rent affordability ----------

test('rent affordability: default 30%/40% of take-home', () => {
  const result = computeRentAffordability(2250)
  assert.equal(result.maxSafeRent, 675)
  assert.equal(result.maxStretchRent, 900)
})

test('rent affordability: honors custom cohort percentages', () => {
  const result = computeRentAffordability(2000, 0.25, 0.35)
  assert.equal(result.maxSafeRent, 500)
  assert.equal(result.maxStretchRent, 700)
})

// ---------- landlord qualification ----------

test('landlord qualification: passes all three rules', () => {
  const result = computeLandlordQualification({
    monthlyGrossIncome: 3000,
    rent: 900,
    creditScore: 650,
    savings: 2000,
    deposit: 900,
    landlordMinCredit: 600
  })
  assert.equal(result.meetsIncomeRule, true)
  assert.equal(result.meetsCreditRule, true)
  assert.equal(result.meetsSavingsRule, true)
  assert.equal(result.qualifies, true)
})

test('landlord qualification: fails income rule under default 3x multiplier', () => {
  const result = computeLandlordQualification({
    monthlyGrossIncome: 2000,
    rent: 900,
    creditScore: 650,
    savings: 2000,
    deposit: 900,
    landlordMinCredit: 600
  })
  assert.equal(result.meetsIncomeRule, false)
  assert.equal(result.qualifies, false)
})

test('landlord qualification: fails credit rule independently of income/savings', () => {
  const result = computeLandlordQualification({
    monthlyGrossIncome: 5000,
    rent: 900,
    creditScore: 550,
    savings: 5000,
    deposit: 900,
    landlordMinCredit: 600
  })
  assert.equal(result.meetsCreditRule, false)
  assert.equal(result.qualifies, false)
})

test('landlord qualification: fails savings rule when below deposit', () => {
  const result = computeLandlordQualification({
    monthlyGrossIncome: 5000,
    rent: 900,
    creditScore: 650,
    savings: 500,
    deposit: 900,
    landlordMinCredit: 600
  })
  assert.equal(result.meetsSavingsRule, false)
  assert.equal(result.qualifies, false)
})

test('landlord qualification: respects a custom income multiplier', () => {
  const result = computeLandlordQualification({
    monthlyGrossIncome: 3600,
    rent: 900,
    creditScore: 650,
    savings: 2000,
    deposit: 900,
    landlordIncomeMultiplier: 4,
    landlordMinCredit: 600
  })
  // 900 * 4 = 3600 — exactly at the threshold, still qualifies (>=).
  assert.equal(result.meetsIncomeRule, true)
  assert.equal(result.qualifies, true)
})

// ---------- default cohort settings sanity ----------

test('default cohort settings match the confirmed Phase 0b defaults', () => {
  assert.equal(DEFAULT_COHORT_SETTINGS.takeHomePayFactor, 0.75)
  assert.equal(DEFAULT_COHORT_SETTINGS.landlordIncomeMultiplier, 3)
  assert.equal(DEFAULT_COHORT_SETTINGS.safeRentPercentOfTakeHome, 0.3)
  assert.equal(DEFAULT_COHORT_SETTINGS.stretchRentPercentOfTakeHome, 0.4)
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
