// Project milestones — V1 typed config.
//
// Source of truth for the final-presentation target / fallback dates and
// the TechTown pop-up date. Read by /timeline (display) and the C-Suite
// Advisor Milestone Backplan card (suggested upcoming dates).
//
// Posture (do not relax in V1):
//   - editable admin controls were deferred. Storing this in Firestore
//     would require a new rule block, and the brief explicitly said
//     "Do not change Firestore rules unless absolutely necessary."
//   - changes to these dates ship with a code change + redeploy.
//   - none of these dates auto-mutate any deliverable.dueDate or
//     task.dueDate. Suggested dates are display-only.
//   - the live deliverable detail page remains the only place where
//     instructor / Co-CEO edits an actual due date.

import type { IsoDate, IsoTimestamp } from '~/types/models'

export interface ProjectMilestones {
  finalPresentationTargetDate?: IsoDate
  finalPresentationFallbackDate?: IsoDate
  techTownPopUpDate?: IsoDate
  // Audit metadata — populated only if a future iteration moves this
  // into Firestore. The static config file leaves these undefined.
  updatedAt?: IsoTimestamp
  updatedByUid?: string
  updatedByEmail?: string
}

export const PROJECT_MILESTONES: ProjectMilestones = {
  finalPresentationTargetDate: '2026-05-12',
  finalPresentationFallbackDate: '2026-05-15',
  techTownPopUpDate: '2026-05-27'
}
