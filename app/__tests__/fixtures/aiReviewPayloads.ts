// Fixture AiReviewReportPayloads for the leadership-review test
// suites. Three scenarios cover the curriculum lifecycle:
//   - earlySemester: high-risk, no final text, no evidence
//   - midSemester:   needs-work, some final text, scattered evidence
//   - finalWeek:     near-ready, most final text, several approved
//
// Posture (do not relax):
//   - PURE data. No Firestore calls, no AI calls.
//   - Mirrors the shape `buildReviewPayload` emits so the validator,
//     readiness scorer, copy helper, and AI prompt builder can all
//     consume the same fixtures.

import {
  AI_REVIEW_CONSTRAINTS_DEFAULT,
  type AiReviewReportPayload
} from '../../types/aiReviewReports'

const DEFAULT_REQUESTER = {
  email: 'instructor@example.com',
  role: 'admin' as const,
  department: 'admin' as const
}

/** Empty deterministic-readiness slot — tests that exercise the
 *  scorer should regenerate this from `computeDeterministicReadiness`
 *  on the deliverables in the fixture. */
const READINESS_PLACEHOLDER = {
  deterministicScore: 0,
  label: 'high-risk' as const,
  scoringBreakdown: [],
  limitations: []
}

export const earlySemesterCompanyPayload: AiReviewReportPayload = {
  reportType: 'company',
  scope: { reportType: 'company' },
  requester: DEFAULT_REQUESTER,
  constraints: AI_REVIEW_CONSTRAINTS_DEFAULT,
  deterministicSummary: {
    totalChapters: 2,
    totalDeliverables: 2,
    approvedDeliverables: 0,
    draftDeliverables: 2,
    inReviewDeliverables: 0,
    needsRevisionDeliverables: 0,
    overdueDeliverables: 1,
    totalSections: 6,
    sectionsWithFinalText: 0,
    sectionsWithDraftFallback: 1,
    sectionsWithSourceNotesFallback: 1,
    sectionsMissing: 4,
    evidenceLinkCount: 0,
    structuredEvidenceCount: 0,
    totalTasks: 4,
    completedTasks: 0,
    blockedTasks: 1,
    overdueTasks: 2
  },
  deterministicReadiness: {
    ...READINESS_PLACEHOLDER,
    deterministicScore: 18,
    label: 'high-risk'
  },
  deliverables: [
    {
      id: 'd-ch01-exec',
      title: 'Executive Summary',
      chapter: 1,
      chapterTitle: 'Executive Summary',
      department: 'executive',
      status: 'draft',
      statusLabel: 'In progress',
      ownerEmail: 'coceo@example.com',
      approverEmail: 'coceo@example.com',
      dueDate: '2026-02-01',
      isOverdue: true,
      hasStudio: true,
      totalSections: 3,
      sectionsWithFinalText: 0,
      sectionsWithDraftFallback: 1,
      sectionsWithSourceNotesFallback: 0,
      sectionsMissing: 2,
      evidenceLinkCount: 0,
      structuredEvidenceCount: 0,
      missingRequiredRequirementLabels: ['Mission statement', 'Launch plan'],
      canSubmit: false,
      returnedReason: null,
      attribution: {
        assignedOwnerEmail: 'coceo@example.com',
        approverEmail: 'coceo@example.com',
        lastSavedByEmail: null,
        evidenceContributorEmails: [],
        bestConfidence: 'assigned',
        summaryStatement: 'Assigned to coceo@example.com'
      },
      sections: [
        {
          sectionId: 'mission',
          title: 'Mission statement',
          contentSource: 'draftText',
          contentSourceLabel: 'Draft text fallback',
          isMissing: false,
          contentExcerpt: 'Early thoughts on the mission…',
          excerptCapped: false,
          finalTextPresent: false,
          draftFallback: true,
          sourceNotesFallback: false,
          wordCount: 6,
          sectionStatus: 'in_progress',
          evidenceLinkCount: 0,
          structuredEvidenceCount: 0,
          attribution: {
            assignedOwnerEmail: 'coceo@example.com',
            approverEmail: 'coceo@example.com',
            lastSavedByEmail: 'coceo@example.com',
            evidenceContributorEmails: [],
            bestConfidence: 'assigned',
            summaryStatement:
              'Assigned to coceo@example.com · Last saved by coceo@example.com'
          }
        },
        {
          sectionId: 'launch-plan',
          title: 'Launch plan',
          contentSource: 'missing',
          contentSourceLabel: 'No saved section text yet',
          isMissing: true,
          contentExcerpt: '',
          excerptCapped: false,
          finalTextPresent: false,
          draftFallback: false,
          sourceNotesFallback: false,
          wordCount: 0,
          sectionStatus: 'empty',
          evidenceLinkCount: 0,
          structuredEvidenceCount: 0,
          attribution: {
            assignedOwnerEmail: 'coceo@example.com',
            approverEmail: 'coceo@example.com',
            lastSavedByEmail: null,
            evidenceContributorEmails: [],
            bestConfidence: 'assigned',
            summaryStatement: 'Assigned to coceo@example.com'
          }
        },
        {
          sectionId: 'audience',
          title: 'Audience',
          contentSource: 'missing',
          contentSourceLabel: 'No saved section text yet',
          isMissing: true,
          contentExcerpt: '',
          excerptCapped: false,
          finalTextPresent: false,
          draftFallback: false,
          sourceNotesFallback: false,
          wordCount: 0,
          sectionStatus: null,
          evidenceLinkCount: 0,
          structuredEvidenceCount: 0,
          attribution: {
            assignedOwnerEmail: null,
            approverEmail: null,
            lastSavedByEmail: null,
            evidenceContributorEmails: [],
            bestConfidence: 'unknown',
            summaryStatement:
              'Authorship cannot be confirmed from current data.'
          }
        }
      ]
    },
    {
      id: 'd-ch05-brand',
      title: 'House Phoenix Brand Book',
      chapter: 5,
      chapterTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      status: 'draft',
      statusLabel: 'In progress',
      ownerEmail: 'cmo@example.com',
      approverEmail: 'cmo@example.com',
      dueDate: '2026-05-10',
      isOverdue: false,
      hasStudio: true,
      totalSections: 3,
      sectionsWithFinalText: 0,
      sectionsWithDraftFallback: 0,
      sectionsWithSourceNotesFallback: 1,
      sectionsMissing: 2,
      evidenceLinkCount: 0,
      structuredEvidenceCount: 0,
      missingRequiredRequirementLabels: ['Brand promise'],
      canSubmit: false,
      returnedReason: null,
      attribution: {
        assignedOwnerEmail: 'cmo@example.com',
        approverEmail: 'cmo@example.com',
        lastSavedByEmail: null,
        evidenceContributorEmails: [],
        bestConfidence: 'assigned',
        summaryStatement: 'Assigned to cmo@example.com'
      },
      sections: []
    }
  ],
  tasks: [
    {
      id: 't-1',
      title: 'Draft Mission Statement',
      deliverableId: 'd-ch01-exec',
      deliverableTitle: 'Executive Summary',
      department: 'executive',
      ownerEmail: 'coceo@example.com',
      status: 'in_progress',
      statusLabel: 'In progress',
      priority: 'high',
      startDate: null,
      dueDate: '2026-02-05',
      isOverdue: true,
      blockedReason: null
    },
    {
      id: 't-2',
      title: 'Schedule audience research',
      deliverableId: 'd-ch01-exec',
      deliverableTitle: 'Executive Summary',
      department: 'executive',
      ownerEmail: 'coceo@example.com',
      status: 'blocked',
      statusLabel: 'Blocked',
      priority: 'medium',
      startDate: null,
      dueDate: '2026-02-08',
      isOverdue: true,
      blockedReason: 'Waiting on interview list from CSGO.'
    },
    {
      id: 't-3',
      title: 'Brand promise workshop',
      deliverableId: 'd-ch05-brand',
      deliverableTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      ownerEmail: 'cmo@example.com',
      status: 'not_started',
      statusLabel: 'Not started',
      priority: 'medium',
      startDate: null,
      dueDate: null,
      isOverdue: false,
      blockedReason: null
    },
    {
      id: 't-4',
      title: 'Customer archetype synthesis',
      deliverableId: 'd-ch05-brand',
      deliverableTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      ownerEmail: 'cmo@example.com',
      status: 'not_started',
      statusLabel: 'Not started',
      priority: 'low',
      startDate: null,
      dueDate: null,
      isOverdue: false,
      blockedReason: null
    }
  ],
  goals: [],
  limitations: [
    {
      code: 'attribution-thin',
      message:
        '1 section(s) lack any attribution metadata. Avoid claiming a specific contributor wrote them.'
    }
  ],
  generatedAt: '2026-02-01T00:00:00.000Z'
}

export const midSemesterDepartmentPayload: AiReviewReportPayload = {
  reportType: 'department',
  scope: { reportType: 'department', department: 'marketing' },
  requester: { ...DEFAULT_REQUESTER, department: 'marketing', role: 'cmo' },
  constraints: AI_REVIEW_CONSTRAINTS_DEFAULT,
  deterministicSummary: {
    totalChapters: 2,
    totalDeliverables: 2,
    approvedDeliverables: 0,
    draftDeliverables: 1,
    inReviewDeliverables: 1,
    needsRevisionDeliverables: 0,
    overdueDeliverables: 0,
    totalSections: 6,
    sectionsWithFinalText: 2,
    sectionsWithDraftFallback: 2,
    sectionsWithSourceNotesFallback: 1,
    sectionsMissing: 1,
    evidenceLinkCount: 3,
    structuredEvidenceCount: 1,
    totalTasks: 5,
    completedTasks: 2,
    blockedTasks: 0,
    overdueTasks: 0
  },
  deterministicReadiness: {
    ...READINESS_PLACEHOLDER,
    deterministicScore: 52,
    label: 'needs-work'
  },
  deliverables: [
    {
      id: 'd-ch05-brand',
      title: 'House Phoenix Brand Book',
      chapter: 5,
      chapterTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      status: 'in_review',
      statusLabel: 'Submitted for review',
      ownerEmail: 'cmo@example.com',
      approverEmail: 'instructor@example.com',
      dueDate: '2026-05-10',
      isOverdue: false,
      hasStudio: true,
      totalSections: 3,
      sectionsWithFinalText: 1,
      sectionsWithDraftFallback: 1,
      sectionsWithSourceNotesFallback: 1,
      sectionsMissing: 0,
      evidenceLinkCount: 2,
      structuredEvidenceCount: 1,
      missingRequiredRequirementLabels: [],
      canSubmit: false,
      returnedReason: null,
      attribution: {
        assignedOwnerEmail: 'cmo@example.com',
        approverEmail: 'instructor@example.com',
        lastSavedByEmail: 'cmo@example.com',
        evidenceContributorEmails: ['mkt-1@example.com'],
        bestConfidence: 'assigned',
        summaryStatement:
          'Assigned to cmo@example.com · Last saved by cmo@example.com · Evidence added by 1 contributor'
      },
      sections: []
    },
    {
      id: 'd-ch10-campaign',
      title: 'Pop-up Campaign Playbook',
      chapter: 10,
      chapterTitle: 'Pop-up Campaign Playbook',
      department: 'marketing',
      status: 'draft',
      statusLabel: 'In progress',
      ownerEmail: 'cmo@example.com',
      approverEmail: 'cmo@example.com',
      dueDate: '2026-04-25',
      isOverdue: false,
      hasStudio: true,
      totalSections: 3,
      sectionsWithFinalText: 1,
      sectionsWithDraftFallback: 1,
      sectionsWithSourceNotesFallback: 0,
      sectionsMissing: 1,
      evidenceLinkCount: 1,
      structuredEvidenceCount: 0,
      missingRequiredRequirementLabels: ['Channel mix'],
      canSubmit: false,
      returnedReason: null,
      attribution: {
        assignedOwnerEmail: 'cmo@example.com',
        approverEmail: 'cmo@example.com',
        lastSavedByEmail: null,
        evidenceContributorEmails: [],
        bestConfidence: 'assigned',
        summaryStatement: 'Assigned to cmo@example.com'
      },
      sections: []
    }
  ],
  tasks: [
    {
      id: 't-mkt-1',
      title: 'Final brand promise text',
      deliverableId: 'd-ch05-brand',
      deliverableTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      ownerEmail: 'cmo@example.com',
      status: 'in_progress',
      statusLabel: 'In progress',
      priority: 'high',
      startDate: null,
      dueDate: '2026-04-15',
      isOverdue: false,
      blockedReason: null
    }
  ],
  goals: [
    {
      id: 'g-mkt-revenue',
      department: 'marketing',
      metricName: 'Pop-up brand reach',
      target: 500,
      current: 130,
      status: 'on_track',
      statusLabel: 'On track',
      progressPercent: 26,
      ownerEmail: 'cmo@example.com'
    }
  ],
  limitations: [],
  generatedAt: '2026-03-15T00:00:00.000Z'
}

export const finalWeekChapterPayload: AiReviewReportPayload = {
  reportType: 'chapter',
  scope: { reportType: 'chapter', deliverableId: 'd-ch05-brand', chapter: 5 },
  requester: { ...DEFAULT_REQUESTER, department: 'marketing', role: 'cmo' },
  constraints: AI_REVIEW_CONSTRAINTS_DEFAULT,
  deterministicSummary: {
    totalChapters: 1,
    totalDeliverables: 1,
    approvedDeliverables: 0,
    draftDeliverables: 0,
    inReviewDeliverables: 1,
    needsRevisionDeliverables: 0,
    overdueDeliverables: 0,
    totalSections: 4,
    sectionsWithFinalText: 4,
    sectionsWithDraftFallback: 0,
    sectionsWithSourceNotesFallback: 0,
    sectionsMissing: 0,
    evidenceLinkCount: 5,
    structuredEvidenceCount: 3,
    totalTasks: 4,
    completedTasks: 4,
    blockedTasks: 0,
    overdueTasks: 0
  },
  deterministicReadiness: {
    ...READINESS_PLACEHOLDER,
    deterministicScore: 84,
    label: 'ready'
  },
  deliverables: [
    {
      id: 'd-ch05-brand',
      title: 'House Phoenix Brand Book',
      chapter: 5,
      chapterTitle: 'House Phoenix Brand Book',
      department: 'marketing',
      status: 'in_review',
      statusLabel: 'Submitted for review',
      ownerEmail: 'cmo@example.com',
      approverEmail: 'instructor@example.com',
      dueDate: '2026-05-10',
      isOverdue: false,
      hasStudio: true,
      totalSections: 4,
      sectionsWithFinalText: 4,
      sectionsWithDraftFallback: 0,
      sectionsWithSourceNotesFallback: 0,
      sectionsMissing: 0,
      evidenceLinkCount: 5,
      structuredEvidenceCount: 3,
      missingRequiredRequirementLabels: [],
      canSubmit: false,
      returnedReason: null,
      attribution: {
        assignedOwnerEmail: 'cmo@example.com',
        approverEmail: 'instructor@example.com',
        lastSavedByEmail: 'cmo@example.com',
        evidenceContributorEmails: ['mkt-1@example.com', 'mkt-2@example.com'],
        bestConfidence: 'assigned',
        summaryStatement:
          'Assigned to cmo@example.com · Last saved by cmo@example.com · Evidence added by 2 contributors'
      },
      sections: [
        {
          sectionId: 'promise',
          title: 'Brand promise',
          contentSource: 'finalText',
          contentSourceLabel: 'Final Playbook text',
          isMissing: false,
          contentExcerpt:
            'House Phoenix promises a bold rebirth. The story is grounded in Detroit makers and student leadership.',
          excerptCapped: false,
          finalTextPresent: true,
          draftFallback: false,
          sourceNotesFallback: false,
          wordCount: 18,
          sectionStatus: 'ready',
          evidenceLinkCount: 2,
          structuredEvidenceCount: 1,
          attribution: {
            assignedOwnerEmail: 'cmo@example.com',
            approverEmail: 'instructor@example.com',
            lastSavedByEmail: 'cmo@example.com',
            evidenceContributorEmails: ['mkt-1@example.com'],
            bestConfidence: 'assigned',
            summaryStatement:
              'Assigned to cmo@example.com · Last saved by cmo@example.com · Evidence added by mkt-1@example.com'
          }
        }
      ]
    }
  ],
  tasks: [],
  goals: [],
  limitations: [],
  generatedAt: '2026-05-12T00:00:00.000Z'
}

export const allFixtures = [
  earlySemesterCompanyPayload,
  midSemesterDepartmentPayload,
  finalWeekChapterPayload
] as const
