import type {
  DirectWorkLevel,
  TeamPulseLeadershipRatings,
  TeamPulseRatings
} from '~/types/models'

export const TEAM_PULSE_CALIBRATION_COPY =
  'This first pulse is for practice, calibration, and support. It helps the team understand contribution, communication, reliability, and leadership patterns. It is not an automatic grade and does not directly approve or reject deliverables.'

export const TEAM_PULSE_SAFETY_COPY =
  'Team Pulse is not a leaderboard, not an automatic grade, and not an approval workflow. Use it to calibrate teamwork and decide where support is needed.'

export const TEAM_PULSE_RATING_ANCHORS: Record<number, string> = {
  1: 'Rarely demonstrated',
  2: 'Sometimes demonstrated',
  3: 'Usually demonstrated',
  4: 'Consistently demonstrated',
  5: 'Consistently demonstrated and helped others'
}

export const TEAM_PULSE_DIRECT_WORK_LABELS: Record<DirectWorkLevel, string> = {
  none: 'Not enough direct work to rate',
  little: 'A little direct work together',
  some: 'Some direct work together',
  a_lot: 'A lot of direct work together'
}

export const TEAM_PULSE_DIRECT_WORK_HELP: Record<DirectWorkLevel, string> = {
  none: 'Choose this when you did not work closely enough with this person to rate them fairly.',
  little: 'You saw a small amount of their work or communication.',
  some: 'You worked with them enough to give useful calibration feedback.',
  a_lot: 'You worked closely enough to give specific, evidence-backed feedback.'
}

export const TEAM_PULSE_DIMENSIONS: Array<{
  key: keyof TeamPulseRatings
  label: string
  description: string
}> = [
  {
    key: 'contribution',
    label: 'Contribution',
    description: 'Completed meaningful work that moved Renni Inc. forward.'
  },
  {
    key: 'reliability',
    label: 'Reliability',
    description: 'Showed up, followed through, and met commitments.'
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Responded, listened, and kept people updated.'
  },
  {
    key: 'qualityStandard',
    label: 'Quality Standard',
    description: 'Cared about accuracy, polish, evidence, and usefulness.'
  },
  {
    key: 'teamSupportLeadership',
    label: 'Team Support / Leadership',
    description: 'Helped others move forward and contributed to team momentum.'
  }
]

export const TEAM_PULSE_LEADERSHIP_DIMENSIONS: Array<{
  key: keyof TeamPulseLeadershipRatings
  label: string
  description: string
}> = [
  {
    key: 'clearDirection',
    label: 'Clear direction',
    description: 'Made expectations and priorities understandable.'
  },
  {
    key: 'fairDelegation',
    label: 'Fair delegation',
    description: 'Distributed work in a way that felt reasonable and clear.'
  },
  {
    key: 'followUpAccountability',
    label: 'Follow-up / accountability',
    description: 'Checked progress and helped the team close loops.'
  },
  {
    key: 'respectfulCommunication',
    label: 'Respectful communication',
    description: 'Led conversations with respect and clarity.'
  },
  {
    key: 'helpWhenStuck',
    label: 'Help when people are stuck',
    description: 'Helped remove blockers or find the next step.'
  }
]

export function requiresEvidenceExample(score: number | null | undefined): boolean {
  return score === 1 || score === 5
}

export function isRateableDirectWork(level: DirectWorkLevel | null | undefined): boolean {
  return level === 'little' || level === 'some' || level === 'a_lot'
}

export function directWorkWeight(level: DirectWorkLevel): number {
  switch (level) {
    case 'a_lot':
      return 1.25
    case 'some':
      return 1
    case 'little':
      return 0.5
    case 'none':
    default:
      return 0
  }
}

export function ratingHasExtremeScore(
  ratings: Partial<TeamPulseRatings> | Partial<TeamPulseLeadershipRatings> | null | undefined
): boolean {
  if (!ratings) return false
  return Object.values(ratings).some((value) =>
    typeof value === 'number' && requiresEvidenceExample(value)
  )
}
