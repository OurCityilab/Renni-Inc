import type {
  MissionProgressStatus,
  PortfolioArtifactType,
  StudioModule
} from '~/types/studio/models'

export const studioModuleLabels: Record<StudioModule, string> = {
  'brand-builder': 'Personal Brand Builder',
  'story-bank': 'Story Bank',
  'star-tmay': 'STAR/TMAY Sherpa',
  resume: 'Resume Sherpa',
  linkedin: 'LinkedIn Sherpa',
  'pitch-builder': 'Pitch Builder',
  'money-basics': 'Money Basics',
  'keys-credit': 'Keys & Credit',
  marketplace: 'Rose City Marketplace',
  'market-day': 'Rose City Market Day',
  'real-estate': 'Real Estate Deal Builder'
}

export const portfolioArtifactTypeLabels: Record<PortfolioArtifactType, string> = {
  brand_sentence: 'Brand Sentence',
  intro_pitch: 'Intro / Pitch',
  star_answer: 'STAR Answer',
  resume_bullet: 'Resume Bullet',
  linkedin_section: 'LinkedIn Section',
  budget: 'Budget',
  credit_plan: 'Credit Plan',
  money_report: 'Money Report',
  p_and_l: 'P&L',
  kpi_report: 'KPI Report',
  sell_sheet: 'Sell Sheet',
  pro_forma: 'Pro Forma',
  reflection: 'Reflection'
}

export const missionStatusLabels: Record<MissionProgressStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  needs_revision: 'Needs revision',
  complete: 'Complete'
}

export const missionStatusChipClass: Record<MissionProgressStatus, string> = {
  not_started: 'chip-draft',
  in_progress: 'chip-review',
  submitted: 'chip-review',
  needs_revision: 'chip-revision',
  complete: 'chip-approved'
}
