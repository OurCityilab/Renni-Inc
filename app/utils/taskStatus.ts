// Shared student-facing labels for task status. Stored values stay raw —
// only the rendered text is humanized. Covers canonical values plus the
// alternative spellings the brief listed so legacy data renders cleanly.

// Sprint 2: rename the student-facing "Blocked" chip to plain
// language. Stored TaskStatus value is unchanged (`'blocked'`); only
// the human-readable label moves to "Stuck — need help" so a teen
// student reads it as something they can fix, not a process error.
const LABELS: Record<string, string> = {
  todo: 'Not started',
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Stuck — need help',
  done: 'Done',
  complete: 'Complete',
  completed: 'Complete'
}

export function taskStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return LABELS[status] ?? status
}
