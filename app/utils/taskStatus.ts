// Shared student-facing labels for task status. Stored values stay raw —
// only the rendered text is humanized. Covers canonical values plus the
// alternative spellings the brief listed so legacy data renders cleanly.

const LABELS: Record<string, string> = {
  todo: 'Not started',
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  complete: 'Complete',
  completed: 'Complete'
}

export function taskStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return LABELS[status] ?? status
}
