import { strict as assert } from 'node:assert'
import {
  TEAM_PULSE_CALIBRATION_COPY,
  TEAM_PULSE_RATING_ANCHORS,
  isRateableDirectWork,
  ratingHasExtremeScore,
  requiresEvidenceExample
} from '../utils/teamPulseRubric'

interface Test { name: string; fn: () => void }
const tests: Test[] = []
const test = (name: string, fn: () => void) => tests.push({ name, fn })

test('extreme ratings require evidence examples', () => {
  assert.equal(requiresEvidenceExample(1), true)
  assert.equal(requiresEvidenceExample(5), true)
  assert.equal(requiresEvidenceExample(3), false)
})

test('directWorkLevel none is not rateable', () => {
  assert.equal(isRateableDirectWork('none'), false)
  assert.equal(isRateableDirectWork('little'), true)
  assert.equal(isRateableDirectWork('some'), true)
  assert.equal(isRateableDirectWork('a_lot'), true)
})

test('ratingHasExtremeScore detects 1 or 5', () => {
  assert.equal(
    ratingHasExtremeScore({
      contribution: 3,
      reliability: 4,
      communication: 3,
      qualityStandard: 2,
      teamSupportLeadership: 3
    }),
    false
  )
  assert.equal(
    ratingHasExtremeScore({
      contribution: 5,
      reliability: 4,
      communication: 3,
      qualityStandard: 2,
      teamSupportLeadership: 3
    }),
    true
  )
})

test('rubric copy makes the calibration-only posture explicit', () => {
  assert.match(TEAM_PULSE_CALIBRATION_COPY, /not an automatic grade/i)
  assert.match(TEAM_PULSE_CALIBRATION_COPY, /does not directly approve or reject deliverables/i)
  assert.equal(TEAM_PULSE_RATING_ANCHORS[5], 'Consistently demonstrated and helped others')
})

let failed = 0
for (const t of tests) {
  try {
    t.fn()
    console.log(`ok  - ${t.name}`)
  } catch (err) {
    failed++
    console.error(`FAIL - ${t.name}`)
    console.error(err)
  }
}
if (failed > 0) process.exit(1)
console.log(`\n${tests.length} passed`)
