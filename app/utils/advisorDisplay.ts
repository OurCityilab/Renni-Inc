// C-Suite Advisor — student-facing display labels + handhold copy.
//
// Sprint 1B: collapse the chip vocabulary to the four-tier student
// language used everywhere else in the app:
//
//   blocker → "Stuck"          (red)
//   risk    → "Action today"   (amber)
//   watch   → "Look at soon"   (sky)
//   info    → "All good"       (emerald)
//
// The internal severity enum (info / watch / risk / blocker) stays as
// the source of truth for sorting and rule branching — only the chip
// text + explanation copy change. The previous label trinity (Stops
// Submit / Blocked Task / Major Issue) is no longer surfaced as a
// chip; the source-specific detail lives in `whyItMatters` /
// `howToFix` and the existing source chip renders next to severity
// in every signal card, so no diagnostic information is lost.
//
// Pure function. No persistence, no AI, no side effects. Renaissance
// students should be able to read every line of this file and trace
// "this label appears because of this rule" without help.

import type {
  AdvisorSignal,
  AdvisorSignalSeverity
} from '~/types/advisor'

export type AdvisorDisplayLabel =
  | 'Stuck'
  | 'Action today'
  | 'Look at soon'
  | 'All good'

export interface AdvisorDisplayInfo {
  // Student-facing label for the severity chip.
  label: AdvisorDisplayLabel
  // Short explanation of what the label means in plain English.
  // Always present so the UI can render a hover/expand line.
  explanation: string
  // Why the team should care today. Falls back to a deterministic
  // default per (severity + source) when the rule didn't supply
  // signal.whyItMatters.
  whyItMatters: string
  // How a chief actually fixes it. Falls back to signal.nextAction
  // when the rule didn't supply signal.howToFix — the UI then
  // renders a single line rather than two.
  howToFix: string
}

const LABEL_EXPLANATIONS: Record<AdvisorDisplayLabel, string> = {
  'Stuck':
    'Submit-for-review or section progress is stuck on this. Fix it or plan the unblock before moving on.',
  'Action today':
    'Work can continue, but this gap could weaken the chapter or final pitch. Push it today.',
  'Look at soon': 'Not urgent yet, but do not ignore it.',
  'All good': 'Background information; no action required today.'
}

// Map a signal to a display label. The internal severity enum drives
// the chip text directly — the (severity + source) pair still
// determines `whyItMatters` and `howToFix` below, so the diagnostic
// copy stays specific even though the chip vocabulary is now four
// student-friendly words.
export function chooseDisplayLabel(
  signal: Pick<AdvisorSignal, 'severity' | 'source'>
): AdvisorDisplayLabel {
  switch (signal.severity) {
    case 'blocker':
      return 'Stuck'
    case 'risk':
      return 'Action today'
    case 'watch':
      return 'Look at soon'
    case 'info':
    default:
      return 'All good'
  }
}

// Default why-it-matters per (severity + source). Used only when the
// rule didn't supply signal.whyItMatters. Short — the UI shows this
// inline.
function defaultWhy(
  severity: AdvisorSignalSeverity,
  source: AdvisorSignal['source']
): string {
  if (severity === 'blocker' && source === 'requirements') {
    return 'A required Template Studio requirement has no linked task. Submit-for-review will not unlock until at least one task is linked.'
  }
  if (severity === 'blocker' && source === 'tasks') {
    return 'A linked task is blocked. The work behind it is not moving until the dependency clears.'
  }
  if (severity === 'blocker' && source === 'pricing') {
    return 'The price-cost math is broken in a way that loses money on every unit sold. The team should not push past this.'
  }
  if (severity === 'blocker') {
    return 'A required piece of work is incomplete. Submit-for-review or chapter readiness depends on this.'
  }
  if (severity === 'risk' && source === 'pricing') {
    return 'The pricing argument has a soft spot a buyer or chief will press on. Better to fix it before the pitch.'
  }
  if (severity === 'risk' && source === 'marketFit') {
    return 'The segment argument rests on assumption rather than evidence. Pricing and campaigns downstream depend on this.'
  }
  if (severity === 'risk' && source === 'segments') {
    return 'A segment-side gap that downstream chapters lean on. Worth pushing today.'
  }
  if (severity === 'risk' && source === 'outputs') {
    return 'A claim is on the page without supporting evidence. Reviewers will ask for it.'
  }
  if (severity === 'risk' && source === 'dueDate') {
    return 'A linked task is overdue. The chapter is at risk of falling behind submit readiness.'
  }
  if (severity === 'risk' && source === 'tasks') {
    return 'Task ownership or status needs attention before the work can move.'
  }
  if (severity === 'risk') {
    return 'Work can continue, but this gap could weaken the chapter or the pitch.'
  }
  if (severity === 'watch' && source === 'outputs') {
    return 'The team has source notes / draft / evidence but not final Playbook text yet. This is not a submit blocker, but the Playbook reads stronger when finalText is present.'
  }
  if (severity === 'watch') {
    return 'Not urgent yet, but track it; a watch left alone often becomes a risk.'
  }
  if (severity === 'info' && source === 'approval') {
    return 'Status-only. Use these signals for handoff or revision context, not edits.'
  }
  return 'Background information; no action required today.'
}

// Default how-to-fix per (severity + source). Used only when the
// rule didn't supply signal.howToFix. Always one sentence.
function defaultHow(
  severity: AdvisorSignalSeverity,
  source: AdvisorSignal['source'],
  nextAction: string
): string {
  // If the rule already wrote a tight nextAction, prefer that — it's
  // already the imperative line the chief needs.
  if (nextAction && nextAction.trim()) return nextAction
  if (severity === 'blocker' && source === 'requirements') {
    return 'Create or link a task that covers this requirement; an owner with a clear definition of done is enough.'
  }
  if (severity === 'blocker' && source === 'tasks') {
    return 'Unblock the task or reassign if the dependency cannot clear in time.'
  }
  if (severity === 'blocker' && source === 'pricing') {
    return 'Either raise the price or lower the unit cost; do not pitch the current numbers to anyone outside the team.'
  }
  if (severity === 'risk' && source === 'pricing') {
    return 'Tighten cost, raise price, or add comps + validation evidence before locking the recommendation.'
  }
  if (severity === 'risk' && source === 'marketFit') {
    return 'Pick a segment, log evidence sources, and name the validation step that would prove or break the fit.'
  }
  if (severity === 'risk' && source === 'segments') {
    return 'Compose at least one structured segment in the Segment Composer with evidence and a validation step.'
  }
  if (severity === 'risk' && source === 'outputs') {
    return 'Attach evidence links or add structured evidence entries that back the claims in this section.'
  }
  if (severity === 'risk' && source === 'dueDate') {
    return 'Confirm a new due date with the task owner today, or reassign if the original owner is the bottleneck.'
  }
  if (severity === 'watch' && source === 'outputs') {
    return 'Turn the source notes and builder work into a clean final Playbook paragraph for this section.'
  }
  return 'Address it during the next working session.'
}

// Public entry point. Always returns all four fields so the UI never
// has to special-case missing labels.
export function getAdvisorDisplayLabel(
  signal: AdvisorSignal
): AdvisorDisplayInfo {
  const label = chooseDisplayLabel(signal)
  const explanation = LABEL_EXPLANATIONS[label]
  const whyItMatters =
    signal.whyItMatters?.trim() || defaultWhy(signal.severity, signal.source)
  const howToFix =
    signal.howToFix?.trim() ||
    defaultHow(signal.severity, signal.source, signal.nextAction)
  return { label, explanation, whyItMatters, howToFix }
}

export const DISPLAY_LABEL_CHIP_CLASS: Record<AdvisorDisplayLabel, string> = {
  'Stuck': 'border-rose-300 bg-rose-50 text-rose-800',
  'Action today': 'border-amber-300 bg-amber-50 text-amber-800',
  'Look at soon': 'border-sky-300 bg-sky-50 text-sky-800',
  'All good': 'border-emerald-300 bg-emerald-50 text-emerald-800'
}
