// Executive Advisor V2 — management-coach types.
//
// V2 expands the V1 prompt-template advisor (4 modes, action-card
// schema in server/utils/executiveAdvisor/actionCard.ts) into 8
// coach modes purpose-built to handhold student chiefs through
// final-week execution. The existing V1 modes are preserved
// unchanged for backward compatibility; V2 modes register
// alongside in the same prompt-template registry.
//
// POSTURE (do not relax)
// ----------------------
//   - The Advisor prepares; chiefs decide. Every action card carries
//     humanReviewRequired: true and is explicitly framed as a
//     suggestion the chief reviews before acting.
//   - No auto-approval. No auto-submit. No hidden task creation.
//     No status mutation. No replacement of student work.
//   - The Advisor must mark unknowns explicitly when context is
//     missing — never invent facts.
//   - All UI consumers must render humanReviewRequired prominently.

export type AdvisorMode =
  | 'daily-chief-brief'
  | 'run-the-room'
  | 'section-rescue'
  | 'task-coverage-doctor'
  | 'approval-coach'
  | 'dependency-explainer'
  | 'phoenix-nest-pitch-coach'
  | 'final-week-triage'

export const ADVISOR_MODES: readonly AdvisorMode[] = [
  'daily-chief-brief',
  'run-the-room',
  'section-rescue',
  'task-coverage-doctor',
  'approval-coach',
  'dependency-explainer',
  'phoenix-nest-pitch-coach',
  'final-week-triage'
] as const

/** Match the brief's shape exactly. The model returns these as a
 *  flat array under `cards`; the response validator coerces missing
 *  fields and forces humanReviewRequired: true on every card. */
export interface AdvisorActionCard {
  title: string
  priority: 'P0' | 'P1' | 'P2'
  whyItMatters: string
  owner: string
  /** Coarse due-date label ("today", "this week", "before approval"
   *  etc.). The Advisor never sets a calendar date. */
  dueDate: string
  dependency: string
  /** Free-text Playbook chapter reference ("Ch. 8 finance" etc.). */
  playbookChapter: string
  /** Optional deeplink to the section page when known. */
  sectionLink?: string
  exactNextAction: string
  whatChiefShouldSay: string
  doneSignal: string
  riskIfIgnored: string
  /** Provenance — the IDs from ExecutiveAdvisorContext the model
   *  used to ground this card. Empty array = ungrounded card; the
   *  UI must surface that state. */
  sourceIds: string[]
  /** Always true. Forced by the response validator. */
  humanReviewRequired: true
}

/** Top-level shape every V2 mode emits. Cards are the primary
 *  output; modes that need additional structured output (e.g.
 *  "Run the Room" needs a 4-segment schedule) carry it under
 *  `extra` so the validator stays generic. */
export interface AdvisorModeResult {
  mode: AdvisorMode
  templateVersion: string
  /** Plain-language headline for the mode result. Always 1
   *  sentence. */
  headline: string
  cards: AdvisorActionCard[]
  /** Mode-specific structured supplement. Optional; modes that
   *  don't need it omit the field. The shape varies per mode and
   *  is loosely typed by design — the chief-facing UI renders a
   *  small mode-specific view per response. */
  extra?: Record<string, unknown>
  /** Explicit unknowns flagged by the model. Any field the Advisor
   *  could not ground in context goes here so the chief sees what
   *  is missing. */
  unknowns?: string[]
}

/** Mode metadata the UI uses to render the mode picker. Pure data;
 *  no Firestore. Mirrors the lane structure on the home dashboard
 *  so the mode picker reads as a coach toolkit rather than a model
 *  selector. */
export interface AdvisorModeMeta {
  mode: AdvisorMode
  /** Short title for the mode button. */
  title: string
  /** One-sentence description of when to use this mode. */
  whenToUse: string
  /** The exact prompt the chief might naturally ask. Renders
   *  alongside the title so the mode picker reads conversationally. */
  promptPhrase: string
}

export const ADVISOR_MODE_META: Readonly<Record<AdvisorMode, AdvisorModeMeta>> = {
  'daily-chief-brief': {
    mode: 'daily-chief-brief',
    title: 'Daily Chief Brief',
    whenToUse: 'Top of the day — what should I push on first?',
    promptPhrase: 'What should I push on today?'
  },
  'run-the-room': {
    mode: 'run-the-room',
    title: 'Run the Room',
    whenToUse: 'Before a class block — how should I split 45 minutes?',
    promptPhrase: 'I have 45 minutes of class. How should I use it?'
  },
  'section-rescue': {
    mode: 'section-rescue',
    title: 'Section Rescue',
    whenToUse: 'A draft is weak — what do I tell the team?',
    promptPhrase: 'This section is weak. What do I tell the team?'
  },
  'task-coverage-doctor': {
    mode: 'task-coverage-doctor',
    title: 'Task Coverage Doctor',
    whenToUse: 'Are P0 sections actually covered by tasks?',
    promptPhrase: 'Are we missing tasks?'
  },
  'approval-coach': {
    mode: 'approval-coach',
    title: 'Approval Coach',
    whenToUse: 'Before approving a deliverable — what should I check?',
    promptPhrase: 'Should I approve this?'
  },
  'dependency-explainer': {
    mode: 'dependency-explainer',
    title: 'Dependency Explainer',
    whenToUse: 'Work seems blocked — what is the upstream gap?',
    promptPhrase: 'Why is this blocked?'
  },
  'phoenix-nest-pitch-coach': {
    mode: 'phoenix-nest-pitch-coach',
    title: 'Phoenix Nest Pitch Coach',
    whenToUse: 'Before sending the carry pitch — are we ready?',
    promptPhrase: 'Are we ready to pitch Phoenix Nest?'
  },
  'final-week-triage': {
    mode: 'final-week-triage',
    title: 'Final Week Triage',
    whenToUse: 'It is the final week — what can we realistically finish?',
    promptPhrase: 'What can we realistically finish this week?'
  }
}

export function isAdvisorMode(value: unknown): value is AdvisorMode {
  return typeof value === 'string' && (ADVISOR_MODES as readonly string[]).includes(value)
}
