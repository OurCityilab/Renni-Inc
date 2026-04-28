// Curriculum context configuration — Customer Profile Builder Foundation Pass 1.
//
// Sibling to brandContext.ts and programContext.ts. Brand context
// describes the brand the app teaches against (House Phoenix); program
// context describes the program the app runs inside (Renaissance);
// curriculum context describes the SHIPPING CURRICULUM and what
// "professional rigor" looks like inside it.
//
// PURPOSE
// -------
// Engine-layer code (classifiers, AI feedback prompts, future critique
// modes) needs three things from the curriculum that brand + program
// context don't carry:
//   1. The CURRENT chapter list — so a coach can ground "you skipped
//      this earlier" feedback against the actual playbook structure.
//   2. The FINAL OUTPUTS — so feedback can tie loose claims back to a
//      specific deliverable instead of vague "your work".
//   3. The EVIDENCE STANDARD the curriculum has settled on — so the
//      AI feedback layer (Layer 3 of the section-engine pattern) can
//      ask "where is your evidence?" in the curriculum's own vocabulary.
//
// FORBIDDEN CLAIMS
// ----------------
// `forbiddenClaims` mirrors `programContext.forbiddenTerms` for the
// AI prompt builder. Both lists exist on purpose: programContext is
// the "never EMIT these words" list (legacy program names like Bible,
// R&D, CDO, JRLA, Renni Enterprises). curriculumContext.forbiddenClaims
// is the "never invent THIS KIND of fact" list — the ones that matter
// most for Customer Profile Builder critique (no fabricated demographic
// data, no invented spending numbers, no made-up customer quotes).
// Today the lists overlap; that is intentional. Both will evolve.
//
// POSTURE (do not relax in V1):
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - Curriculum copy on TemplateStudio sections stays literal — this
//     config is for SYSTEM consumers (engine prompts, classifier
//     coaching), not student-facing strings.
//   - One instance per supported curriculum. V1 ships exactly one.

export interface EvidenceStandard {
  claim: string
  evidence: string
  source: string
  assumption: string
  confidence: string
  risk: string
  nextValidation: string
}

export interface CurriculumContext {
  /** Display name. Surfaces into engine system prompts. */
  curriculumName: string
  /** Authoritative, in-order list of playbook chapter titles SHIPPING
   *  in V1. Engines reference this when grounding cross-chapter
   *  feedback ("see Chapter 7 — Current Product Line"). Keep in sync
   *  with app/data/templateStudios/index.ts manually for now;
   *  the audit script (npm run audit:requirement-sections) is the
   *  canonical cross-check. */
  currentPlaybookChapters: string[]
  /** Final outputs the curriculum drives toward. Mirrors
   *  programContext.finalOutputs but lives here so engine code can
   *  consume it without reaching into program context. */
  finalOutputs: string[]
  /** The seven-field evidence standard the playbook teaches.
   *  Engine AI feedback uses these LABELS verbatim when asking
   *  students to articulate missing evidence. */
  evidenceStandard: EvidenceStandard
  /** "Never invent THIS" list for engine AI feedback. Distinct from
   *  programContext.forbiddenTerms (legacy program names). Forbidden
   *  CLAIMS are kinds of fabrication, not specific words. */
  forbiddenClaims: string[]
}

export const RENNI_PLAYBOOK_CURRICULUM_CONTEXT: CurriculumContext = {
  curriculumName: 'Renni Inc. Brand & Operations Playbook',
  currentPlaybookChapters: [
    'Executive Summary',
    'Renni Overview and Brand Architecture',
    'Company Structure and Continuity',
    'Business Model Canvas Summary',
    'House Phoenix Brand Book',
    'Supporting Brand Sheets',
    'Current Product Line and Pricing',
    'Finance and Revenue Model',
    'Operations + Inventory Readiness',
    'Marketing and Campaign Playbook',
    'Phoenix Nest Retail Carry Pitch',
    'Strategy and Next-Semester Recommendations',
    'Decision Log and Appendices'
  ],
  finalOutputs: [
    'TechTown pop-up',
    'Brand & Operations Playbook',
    'Phoenix Nest retail carry pitch'
  ],
  evidenceStandard: {
    claim: 'The thing the team is asserting.',
    evidence: 'The actual proof — quote, count, observation, photo, document.',
    source: 'Where the evidence came from (named person, named survey, dated event).',
    assumption: 'What the team is taking for granted underneath the claim.',
    confidence: 'How sure the team is — low / medium / high — given the evidence.',
    risk: 'What breaks if the claim turns out to be wrong.',
    nextValidation: 'The next concrete step that would raise confidence.'
  },
  forbiddenClaims: [
    'invented demographic facts about real people',
    'invented spending data not backed by a source',
    'invented customer quotes',
    'fabricated PRIZM or ESRI segmentation results (PRIZM- and ESRI-INSPIRED framing is allowed; claiming actual classification is not)',
    'approval, submission, or status changes — those are student decisions, not engine output'
  ]
}
