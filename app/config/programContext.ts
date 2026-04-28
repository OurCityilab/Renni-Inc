// Program context configuration — Architectural Scaffolding sprint.
//
// Companion to brandContext.ts. This file describes the PROGRAM the
// app is being run inside (Renaissance, in V1; community college
// entrepreneurship classes or youth nonprofits in future). Program
// identity influences AI tone, allowed/forbidden vocabulary, and
// the list of canonical final outputs the curriculum drives toward.
//
// Posture (do not relax):
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - One instance per supported program. V1 ships exactly one
//     (RENAISSANCE_PROGRAM_CONTEXT). Adding another program is
//     additive — declare a new const and route consumers to it
//     without changing existing studios or AI handlers.
//   - Curriculum copy on TemplateStudio sections (lesson,
//     whyThisMatters, expertGuidance, etc.) stays literal and is
//     NOT derived from this config. Program-specific context lives
//     here only when it influences platform behavior — primarily
//     AI prompt construction and forbidden-term enforcement.
//   - Forbidden terms are a hard list the AI system prompt
//     enforces. Curriculum authors are also expected to avoid them,
//     but this config is what the AI coach is told never to emit.

export interface ProgramContext {
  /** Display name of the program. Surfaced into AI system prompts
   *  so the coach knows the audience it is speaking to. */
  name: string
  /** Short categorization (e.g., "high school student business
   *  program", "community college entrepreneurship class"). Used
   *  by AI prompts to pitch tone and reading level. */
  programType: string
  /** One-sentence description of who the students are. */
  cohortDescription: string
  /** Authoritative list of the program's final deliverable outputs.
   *  AI prompts reference this so the coach can ground student work
   *  in the actual finish line, not a generic capstone. */
  finalOutputs: string[]
  /** One-paragraph framing the AI coach should use when explaining
   *  what the curriculum teaches. Curriculum studios still author
   *  their own per-section lesson; this is the umbrella framing. */
  curriculumFraming: string
  /** Tone notes for AI feedback. Examples:
   *  - "middle-to-high-school" — short sentences, plain language
   *  - "early-college" — more technical language allowed
   *  V1 ships middle-to-high-school for Renaissance. */
  audienceTone: string
  /** Hard-list of legacy / deprecated program terms the AI coach
   *  must never use. Curriculum authors are also expected to avoid
   *  them, but the AI system prompt enforces them at the model
   *  layer. Add new entries here when terminology evolves; the AI
   *  prompt builder reads this list at request time. */
  forbiddenTerms: string[]
}

export const RENAISSANCE_PROGRAM_CONTEXT: ProgramContext = {
  name: 'Renaissance',
  programType: 'high school student business program',
  cohortDescription:
    'Middle and high school students at the Renaissance program, organized into student-led functional teams (Co-CEOs, COO, CFO, CMO, Chief Strategy and Growth Officer, regular members) running a real student company.',
  finalOutputs: [
    'TechTown pop-up',
    'Brand & Operations Playbook',
    'Phoenix Nest carry pitch'
  ],
  curriculumFraming:
    'Students build a Brand and Operations Playbook through Think → Draft → Defend writing surfaces, plug-and-play scaffolding builders, and structured evidence. The curriculum teaches operating thinking — naming claims, backing them with evidence, and writing publishable text another cohort can use next semester. Final Playbook text is the publishable deliverable; AI is a coach, never an approver.',
  audienceTone: 'middle-to-high-school',
  // Hard list. The AI system prompt enforces these — curriculum
  // authors are also expected to avoid them. The cleanup-bible-goal
  // and chapterOwners reference comments are documentation that
  // these terms are LEGACY and not to be re-introduced.
  forbiddenTerms: ['Bible', 'R&D', 'CDO', 'JRLA', 'Renni Enterprises']
}
