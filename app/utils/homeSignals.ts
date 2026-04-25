// Pure helper that turns scoped tasks + deliverables + studio registry
// into the dynamic Home banner + signal cards. Same precedence rules
// as the Workbench so Home doesn't tell a different story.
//
// Inputs in, signals out. No Firestore reads here. The caller decides
// the audience and the loading state — we just compute.

import type { Deliverable, Department, Task } from '~/types/models'
import type { TemplateStudio } from '~/types/templateStudio'
import { computeRequirementCoverage } from '~/utils/requirementCoverage'

export type HomeAudience = 'admin' | 'coceo' | 'chief' | 'member'

export interface HomeAction {
  label: string
  to: string
}

export interface HomeSignalCard {
  id: string
  label: string
  value: number | string
  blurb: string
  to: string
  tone: 'default' | 'warn' | 'good'
}

export interface HomeSignalSet {
  primary: { headline: string; body: string }
  primaryAction: HomeAction
  secondaryAction: HomeAction | null
  cards: HomeSignalCard[]
}

export interface HomeSignalInput {
  audience: HomeAudience
  myUid: string | null
  myDept: Department | null
  myTasks: Task[]
  allTasks: Task[]
  allDeliverables: Deliverable[]
  studios: Record<string, TemplateStudio>
}

// ---- date helpers (local-midnight based) ----
function midnight(): number {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
}
function dueDateMs(iso?: string | null): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).getTime()
}
function isPastDue(iso?: string | null): boolean {
  const ms = dueDateMs(iso)
  if (ms === null) return false
  return ms < midnight()
}
function isDueSoon(iso?: string | null, days = 7): boolean {
  const ms = dueDateMs(iso)
  if (ms === null) return false
  const m = midnight()
  return ms >= m && ms <= m + days * 86_400_000
}

// ---- studio coverage gap counter ----
// A deliverable is a "studio coverage gap" when it has a studio, is
// draft/needs_revision, and has at least one requiredForApproval
// requirement with zero linked tasks. Mirrors the submit gate exactly.
function countStudioGaps(
  scopedDeliverables: Deliverable[],
  scopedTasks: Task[],
  studios: Record<string, TemplateStudio>
): number {
  let gaps = 0
  for (const d of scopedDeliverables) {
    if (d.status !== 'draft' && d.status !== 'needs_revision') continue
    const studio = studios[d.id]
    if (!studio) continue
    const linked = scopedTasks.filter((t) => t.deliverableId === d.id)
    const summary = computeRequirementCoverage(studio.requirements, linked)
    if (summary.requiredRequirementsWithoutTasks.length > 0) gaps += 1
  }
  return gaps
}

// ---- audience-specific signal sets ----

function memberSignals(input: HomeSignalInput): HomeSignalSet {
  const { myDept, myTasks } = input
  const open = myTasks.filter((t) => t.status !== 'done')
  const blocked = open.filter((t) => t.status === 'blocked')
  const overdue = open.filter(
    (t) => t.status !== 'blocked' && isPastDue(t.dueDate)
  )
  const dueSoon = open.filter(
    (t) =>
      t.status !== 'blocked' &&
      !isPastDue(t.dueDate) &&
      isDueSoon(t.dueDate, 7)
  )

  const myDeptHref = myDept && myDept !== 'admin' ? `/departments/${myDept}` : '/departments'
  const primaryAction: HomeAction = { label: 'Open Tasks', to: '/tasks' }
  const secondaryAction: HomeAction = {
    label: 'View my department',
    to: myDeptHref
  }

  let headline: string
  let body: string
  if (blocked.length) {
    headline = `You have ${blocked.length} blocked ${blocked.length === 1 ? 'task' : 'tasks'}.`
    body = 'Open Tasks and update what is holding you up so the team can unblock you.'
  } else if (overdue.length) {
    headline = `You have ${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}.`
    body = 'Open Tasks and reschedule or close these out first.'
  } else if (dueSoon.length) {
    headline = `You have ${dueSoon.length} ${dueSoon.length === 1 ? 'task' : 'tasks'} due soon.`
    body = 'Open Tasks and mark progress as you go.'
  } else if (open.length) {
    headline = `You have ${open.length} open ${open.length === 1 ? 'task' : 'tasks'}.`
    body = 'Open Tasks to update status as you finish work.'
  } else {
    headline = 'You are clear right now.'
    body = 'No urgent blockers on your work. Check your department to see what your team is moving.'
  }

  const cards: HomeSignalCard[] = [
    {
      id: 'my-blocked',
      label: 'Blocked',
      value: blocked.length,
      blurb: 'Tasks waiting on someone else. Mark blockers visible.',
      to: '/tasks',
      tone: blocked.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'my-overdue',
      label: 'Overdue',
      value: overdue.length,
      blurb: 'Past their due date. Reschedule or finish.',
      to: '/tasks',
      tone: overdue.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'my-due-soon',
      label: 'Due this week',
      value: dueSoon.length,
      blurb: 'Due in the next 7 days.',
      to: '/tasks',
      tone: 'default'
    },
    {
      id: 'my-open',
      label: 'Open tasks',
      value: open.length,
      blurb: 'Everything assigned to you that isn\'t done.',
      to: '/tasks',
      tone: 'default'
    },
    {
      id: 'my-department',
      label: 'My department',
      value: myDept && myDept !== 'admin' ? 'View team' : 'Browse',
      blurb: 'See who is on your team and what they own.',
      to: myDeptHref,
      tone: 'default'
    }
  ]

  return {
    primary: { headline, body },
    primaryAction,
    secondaryAction,
    cards
  }
}

function chiefSignals(input: HomeSignalInput): HomeSignalSet {
  const { allTasks, allDeliverables, myDept, studios } = input
  const deptTasks = allTasks.filter((t) => myDept && t.department === myDept)
  const open = deptTasks.filter((t) => t.status !== 'done')
  const blocked = open.filter((t) => t.status === 'blocked')
  const overdue = open.filter(
    (t) => t.status !== 'blocked' && isPastDue(t.dueDate)
  )
  const deptDeliverables = allDeliverables.filter(
    (d) => myDept && d.department === myDept
  )
  const needsRevision = deptDeliverables.filter(
    (d) => d.status === 'needs_revision'
  )
  const studioGaps = countStudioGaps(deptDeliverables, deptTasks, studios)

  const myDeptHref = myDept && myDept !== 'admin' ? `/departments/${myDept}` : '/departments'
  const primaryAction: HomeAction = { label: 'Open Workbench', to: '/workbench' }
  const secondaryAction: HomeAction = {
    label: 'View my department',
    to: myDeptHref
  }

  let headline: string
  let body: string
  if (blocked.length) {
    headline = `Your department has ${blocked.length} blocked ${blocked.length === 1 ? 'task' : 'tasks'}.`
    body = 'Start in Workbench — clear blockers so the team can keep moving.'
  } else if (overdue.length) {
    headline = `Your department has ${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}.`
    body = 'Open Workbench to reschedule or escalate.'
  } else if (needsRevision.length) {
    headline = `Your department has ${needsRevision.length} ${needsRevision.length === 1 ? 'deliverable' : 'deliverables'} needing revision.`
    body = 'Open Workbench to see what owners need to address before resubmitting.'
  } else if (studioGaps) {
    headline = `${studioGaps} studio ${studioGaps === 1 ? 'deliverable' : 'deliverables'} can't submit yet — required requirements still need task coverage.`
    body = 'Open Workbench or the deliverable detail to assign the missing work.'
  } else {
    headline = 'Your department is clear right now.'
    body = 'No blockers or revisions on the board. Check Workbench for due-soon work.'
  }

  const cards: HomeSignalCard[] = [
    {
      id: 'dept-blocked',
      label: 'Department blocked',
      value: blocked.length,
      blurb: 'Tasks in your department flagged as blocked.',
      to: '/workbench',
      tone: blocked.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'dept-overdue',
      label: 'Department overdue',
      value: overdue.length,
      blurb: 'Past due in your department. Reschedule or finish.',
      to: '/workbench',
      tone: overdue.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'dept-needs-revision',
      label: 'Needs revision',
      value: needsRevision.length,
      blurb: 'Deliverables an approver returned to your team.',
      to: '/workbench',
      tone: needsRevision.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'dept-studio-gaps',
      label: 'Studio coverage gaps',
      value: studioGaps,
      blurb: 'Studio deliverables blocked from submission until required requirements have tasks.',
      to: '/workbench',
      tone: studioGaps > 0 ? 'warn' : 'default'
    }
  ]

  return {
    primary: { headline, body },
    primaryAction,
    secondaryAction,
    cards
  }
}

function executiveSignals(input: HomeSignalInput, isAdmin: boolean): HomeSignalSet {
  const { allTasks, allDeliverables, studios } = input
  const open = allTasks.filter((t) => t.status !== 'done')
  const blocked = open.filter((t) => t.status === 'blocked')
  const overdue = open.filter(
    (t) => t.status !== 'blocked' && isPastDue(t.dueDate)
  )
  const inReview = allDeliverables.filter((d) => d.status === 'in_review')
  const needsRevision = allDeliverables.filter((d) => d.status === 'needs_revision')
  const studioGaps = countStudioGaps(allDeliverables, allTasks, studios)

  const primaryAction: HomeAction = { label: 'Open Workbench', to: '/workbench' }
  const secondaryAction: HomeAction = isAdmin
    ? { label: 'Open Team / Admin', to: '/team' }
    : { label: 'Open Playbook', to: '/playbook' }

  let headline: string
  let body: string
  if (blocked.length) {
    headline = `${blocked.length} blocked ${blocked.length === 1 ? 'task' : 'tasks'} across the company.`
    body = 'Open Workbench to coordinate unblocks.'
  } else if (overdue.length) {
    headline = `${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'} across the company.`
    body = 'Open Workbench to reschedule or escalate.'
  } else if (needsRevision.length) {
    headline = `${needsRevision.length} ${needsRevision.length === 1 ? 'deliverable' : 'deliverables'} need revision.`
    body = 'Open Workbench to see who owns each.'
  } else if (inReview.length) {
    headline = `${inReview.length} ${inReview.length === 1 ? 'deliverable is' : 'deliverables are'} waiting for review.`
    body = 'Open Workbench to clear the approval queue.'
  } else if (studioGaps) {
    headline = `${studioGaps} studio ${studioGaps === 1 ? 'deliverable' : 'deliverables'} can't submit yet.`
    body = 'Required requirements still need task coverage. Open Workbench to dispatch the missing work.'
  } else {
    headline = 'Company queue is clear right now.'
    body = 'No urgent risk on the board. Check Workbench for due-soon work and approvals.'
  }

  const cards: HomeSignalCard[] = [
    {
      id: 'co-blocked',
      label: 'Blocked tasks',
      value: blocked.length,
      blurb: 'Across every department.',
      to: '/workbench',
      tone: blocked.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'co-overdue',
      label: 'Overdue tasks',
      value: overdue.length,
      blurb: 'Past due across every department.',
      to: '/workbench',
      tone: overdue.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'co-in-review',
      label: 'In review',
      value: inReview.length,
      blurb: 'Deliverables waiting on an approver.',
      to: '/workbench',
      tone: inReview.length > 0 ? 'default' : 'default'
    },
    {
      id: 'co-needs-revision',
      label: 'Needs revision',
      value: needsRevision.length,
      blurb: 'Returned to owners; revision in progress.',
      to: '/workbench',
      tone: needsRevision.length > 0 ? 'warn' : 'default'
    },
    {
      id: 'co-studio-gaps',
      label: 'Studio coverage gaps',
      value: studioGaps,
      blurb: 'Studio deliverables blocked from submission.',
      to: '/workbench',
      tone: studioGaps > 0 ? 'warn' : 'default'
    }
  ]

  return {
    primary: { headline, body },
    primaryAction,
    secondaryAction,
    cards
  }
}

export function computeHomeSignals(input: HomeSignalInput): HomeSignalSet {
  switch (input.audience) {
    case 'member':
      return memberSignals(input)
    case 'chief':
      return chiefSignals(input)
    case 'coceo':
      return executiveSignals(input, false)
    case 'admin':
      return executiveSignals(input, true)
  }
}
