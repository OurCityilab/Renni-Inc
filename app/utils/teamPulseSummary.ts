import type {
  Department,
  DirectWorkLevel,
  TeamPulseFlag,
  TeamPulseFlagType,
  TeamPulseLeadershipRatings,
  TeamPulseRatings,
  TeamPulseResponse,
  TeamPulseSummary
} from '~/types/models'
import {
  TEAM_PULSE_DIMENSIONS,
  TEAM_PULSE_LEADERSHIP_DIMENSIONS,
  directWorkWeight,
  isRateableDirectWork
} from '~/utils/teamPulseRubric'

type RatingKey = keyof TeamPulseRatings
type LeaderRatingKey = keyof TeamPulseLeadershipRatings

const LOW_CONFIDENCE_COPY =
  'Pattern needs review: several responses have low direct-work confidence. Treat this as calibration data, not a final judgment.'

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function emptyBreakdown(): Record<DirectWorkLevel, number> {
  return { none: 0, little: 0, some: 0, a_lot: 0 }
}

function flag(
  flagType: TeamPulseFlagType,
  message: string,
  reviewCopy: string,
  severity: TeamPulseFlag['severity'] = 'review'
): TeamPulseFlag {
  return { flagType, severity, message, reviewCopy }
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined
  return round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function weightedAverage(
  values: Array<{ value: number; weight: number }>
): number | undefined {
  const usable = values.filter((v) => v.weight > 0)
  const totalWeight = usable.reduce((sum, v) => sum + v.weight, 0)
  if (totalWeight <= 0) return undefined
  return round(
    usable.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight
  )
}

function averageRatings(responses: TeamPulseResponse[]): Partial<TeamPulseRatings> {
  const out: Partial<TeamPulseRatings> = {}
  for (const dim of TEAM_PULSE_DIMENSIONS) {
    const values = responses
      .map((r) => r.ratings?.[dim.key])
      .filter((v): v is number => typeof v === 'number')
    const avg = average(values)
    if (avg !== undefined) out[dim.key] = avg
  }
  return out
}

function weightedRatings(responses: TeamPulseResponse[]): Partial<TeamPulseRatings> {
  const out: Partial<TeamPulseRatings> = {}
  for (const dim of TEAM_PULSE_DIMENSIONS) {
    const values = responses
      .map((r) => ({
        value: r.ratings?.[dim.key],
        weight: directWorkWeight(r.directWorkLevel)
      }))
      .filter((v): v is { value: number; weight: number } => typeof v.value === 'number')
    const avg = weightedAverage(values)
    if (avg !== undefined) out[dim.key] = avg
  }
  return out
}

function averageLeadershipRatings(
  responses: TeamPulseResponse[]
): Partial<TeamPulseLeadershipRatings> {
  const out: Partial<TeamPulseLeadershipRatings> = {}
  for (const dim of TEAM_PULSE_LEADERSHIP_DIMENSIONS) {
    const values = responses
      .map((r) => r.leadershipRatings?.[dim.key])
      .filter((v): v is number => typeof v === 'number')
    const avg = average(values)
    if (avg !== undefined) out[dim.key] = avg
  }
  return out
}

function overallCoreAverage(ratings: Partial<TeamPulseRatings>): number | null {
  const values = TEAM_PULSE_DIMENSIONS
    .map((d) => ratings[d.key])
    .filter((v): v is number => typeof v === 'number')
  return average(values) ?? null
}

function variance(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
}

function addStudentFlags(args: {
  selfAverages: Partial<TeamPulseRatings>
  peerAverages: Partial<TeamPulseRatings>
  peerResponses: TeamPulseResponse[]
  directWorkBreakdown: Record<DirectWorkLevel, number>
}): TeamPulseFlag[] {
  const flags: TeamPulseFlag[] = []
  const selfAvg = overallCoreAverage(args.selfAverages)
  const peerAvg = overallCoreAverage(args.peerAverages)
  if (
    selfAvg !== null &&
    peerAvg !== null &&
    args.peerResponses.length >= 2 &&
    Math.abs(selfAvg - peerAvg) >= 1.5
  ) {
    flags.push(
      flag(
        'self_peer_gap',
        'Self-rating and peer feedback differ by at least 1.5 points.',
        'Calibration discussion recommended: self-rating and aggregated peer feedback differ. Use the comments and examples to align expectations.'
      )
    )
  }

  const lowConfidence =
    args.directWorkBreakdown.none + args.directWorkBreakdown.little
  const total = Object.values(args.directWorkBreakdown).reduce((sum, v) => sum + v, 0)
  if (total > 0 && lowConfidence / total >= 0.5) {
    flags.push(
      flag(
        'low_direct_work_confidence',
        'At least half of responses had none or little direct-work confidence.',
        LOW_CONFIDENCE_COPY,
        'info'
      )
    )
  }

  for (const dim of TEAM_PULSE_DIMENSIONS) {
    const values = args.peerResponses
      .map((r) => r.ratings?.[dim.key])
      .filter((v): v is number => typeof v === 'number')
    if (values.length >= 3 && variance(values) >= 1.25) {
      flags.push(
        flag(
          'peer_disagreement',
          `Peer responses vary on ${dim.label}.`,
          `Pattern needs review: teammates do not see ${dim.label.toLowerCase()} the same way. Ask for examples before drawing conclusions.`
        )
      )
      break
    }
  }
  return flags
}

export function buildTeamPulseStudentSummary(args: {
  cycleId: string
  subjectUid: string
  subjectEmail: string
  department: Department
  responses: TeamPulseResponse[]
  now?: string
}): TeamPulseSummary {
  const now = args.now ?? new Date().toISOString()
  const subjectResponses = args.responses.filter((r) => r.rateeUid === args.subjectUid)
  const selfResponses = subjectResponses.filter((r) => r.relationship === 'self')
  const peerResponses = subjectResponses.filter(
    (r) => r.relationship !== 'self' && isRateableDirectWork(r.directWorkLevel)
  )
  const leaderResponses = subjectResponses.filter((r) => r.leadershipRatings)
  const directWorkBreakdown = emptyBreakdown()
  for (const r of subjectResponses) {
    directWorkBreakdown[r.directWorkLevel] += 1
  }
  const selfAverages = averageRatings(selfResponses)
  const peerAverages = averageRatings(peerResponses)
  const leaderAverages = averageLeadershipRatings(leaderResponses)
  const averages = weightedRatings(subjectResponses)
  const flags = addStudentFlags({
    selfAverages,
    peerAverages,
    peerResponses,
    directWorkBreakdown
  })
  const peerCount = peerResponses.length
  const coachingSummary =
    peerCount >= 2
      ? 'Use this calibration summary to pick one teamwork strength, one growth area, and one next-sprint goal.'
      : 'Not enough peer responses yet for a full student summary. Use the self-reflection and wait for more feedback before drawing conclusions.'
  return {
    id: `${args.cycleId}_${args.subjectUid}`,
    cycleId: args.cycleId,
    subjectUid: args.subjectUid,
    subjectEmail: args.subjectEmail,
    subjectDepartment: args.department,
    scope: 'student',
    averages,
    selfAverages,
    peerAverages,
    leaderAverages,
    responseCount: subjectResponses.length,
    peerResponseCount: peerCount,
    selfResponseCount: selfResponses.length,
    leaderResponseCount: leaderResponses.length,
    directWorkBreakdown,
    flags,
    coachingSummary,
    createdAt: now,
    updatedAt: now
  }
}

export function buildTeamPulseDepartmentSummary(args: {
  cycleId: string
  department: Department
  responses: TeamPulseResponse[]
  now?: string
}): TeamPulseSummary {
  const now = args.now ?? new Date().toISOString()
  const scoped = args.responses.filter((r) => r.rateeDepartment === args.department)
  const rateable = scoped.filter((r) => isRateableDirectWork(r.directWorkLevel))
  const directWorkBreakdown = emptyBreakdown()
  for (const r of scoped) directWorkBreakdown[r.directWorkLevel] += 1
  const averages = weightedRatings(rateable)
  const leaderAverages = averageLeadershipRatings(scoped)
  const lowConfidence = directWorkBreakdown.none + directWorkBreakdown.little
  const flags: TeamPulseFlag[] = []
  if (scoped.length > 0 && lowConfidence / scoped.length >= 0.5) {
    flags.push(
      flag(
        'low_direct_work_confidence',
        'Department feedback has limited direct-work confidence.',
        LOW_CONFIDENCE_COPY,
        'info'
      )
    )
  }
  return {
    id: `${args.cycleId}_${args.department}`,
    cycleId: args.cycleId,
    subjectDepartment: args.department,
    scope: 'department',
    averages,
    leaderAverages,
    responseCount: scoped.length,
    peerResponseCount: rateable.length,
    directWorkBreakdown,
    flags,
    coachingSummary:
      scoped.length > 0
        ? 'Use this department summary to identify support needs and plan the next coaching conversation.'
        : 'No responses are available for this department yet.',
    createdAt: now,
    updatedAt: now
  }
}

export function buildTeamPulseCompanySummary(args: {
  cycleId: string
  responses: TeamPulseResponse[]
  now?: string
}): TeamPulseSummary {
  const now = args.now ?? new Date().toISOString()
  const rateable = args.responses.filter((r) => isRateableDirectWork(r.directWorkLevel))
  const directWorkBreakdown = emptyBreakdown()
  for (const r of args.responses) directWorkBreakdown[r.directWorkLevel] += 1
  return {
    id: `${args.cycleId}_company`,
    cycleId: args.cycleId,
    subjectDepartment: 'company',
    scope: 'company',
    averages: weightedRatings(rateable),
    leaderAverages: averageLeadershipRatings(args.responses),
    responseCount: args.responses.length,
    peerResponseCount: rateable.length,
    directWorkBreakdown,
    flags: [],
    coachingSummary:
      'Use this company summary as a calibration signal for Renni Inc. leadership. It does not rank students or change approvals.',
    createdAt: now,
    updatedAt: now
  }
}

export function buildRaterPatternFlags(responses: TeamPulseResponse[]): Array<{
  raterUid: string
  raterEmail: string
  flags: TeamPulseFlag[]
}> {
  const byRater = new Map<string, TeamPulseResponse[]>()
  for (const r of responses) {
    if (!r.ratings || r.relationship === 'self') continue
    byRater.set(r.raterUid, [...(byRater.get(r.raterUid) ?? []), r])
  }
  const out: Array<{ raterUid: string; raterEmail: string; flags: TeamPulseFlag[] }> = []
  for (const [raterUid, rows] of byRater) {
    const values = rows.flatMap((r) =>
      TEAM_PULSE_DIMENSIONS
        .map((d) => r.ratings?.[d.key])
        .filter((v): v is number => typeof v === 'number')
    )
    const flags: TeamPulseFlag[] = []
    if (values.length >= 10 && values.every((v) => v >= 4)) {
      flags.push(
        flag(
          'uniform_high_scorer',
          'Rater gave uniformly high feedback.',
          'Pattern needs review: this rater gave consistently high scores. Use examples to calibrate whether the scores distinguish different behaviors.',
          'info'
        )
      )
    }
    if (values.length >= 10 && values.every((v) => v <= 2)) {
      flags.push(
        flag(
          'uniform_low_scorer',
          'Rater gave uniformly low feedback.',
          'Pattern needs review: this rater gave consistently low scores. Use examples to calibrate whether expectations were understood.',
          'info'
        )
      )
    }
    if (flags.length > 0) {
      out.push({ raterUid, raterEmail: rows[0]?.raterEmail ?? '', flags })
    }
  }
  return out
}

export function summaryHidesRawPeerIdentity(summary: TeamPulseSummary): boolean {
  const serialized = JSON.stringify(summary)
  return !serialized.includes('raterEmail') && !serialized.includes('raterUid')
}
