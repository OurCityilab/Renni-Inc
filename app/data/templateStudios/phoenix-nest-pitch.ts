import type { TemplateStudio } from '~/types/templateStudio'

export const phoenixNestPitch: TemplateStudio = {
  title: 'Phoenix Nest Retail Carry Pitch',
  purpose:
    'Persuade a Phoenix Nest retail buyer to carry House Phoenix merch — with a real story, real numbers, and a real plan.',
  learningObjective:
    'Package what the pop-up proved into a short pitch a retail buyer can say yes to: who, what, the numbers, and what happens next.',
  whyItMatters:
    'The pop-up is one day. Retail carry is continuity — revenue for next cohort, credibility for Renni Inc., and real-world validation that the brand holds up outside Renaissance. A weak pitch gets a polite no. A real one gets carried.',
  finalOutput:
    'A short pitch deck or one-pager with: who we are, what we sell, what the pop-up proved, what carry would look like, and one clear ask.',
  connectedOutcome: 'Phoenix Nest pitch',
  sections: [
    {
      id: 'identity',
      title: 'Who are we?',
      lesson:
        'Start with a one-line identity a buyer can repeat. Borrow from the House Phoenix brand story — do not reinvent it here.',
      studentPrompts: [
        'One sentence: who made this, for whom, and why it exists.',
        'Attribution: who led this cohort? Include Co-CEOs, CSGO, CMO.'
      ],
      completionCriteria: [
        'Identity sentence matches the brand story word-for-word where it matters.'
      ]
    },
    {
      id: 'evidence',
      title: 'What did the pop-up actually prove?',
      lesson:
        'A buyer wants evidence, not optimism. Use real numbers from /revenue and /pricing.',
      studentPrompts: [
        'How many units of each product sold?',
        'What was average gross margin across the portfolio?',
        'What feedback did customers give at the table?'
      ],
      requiredInputs: ['Unit-sold counts', 'Revenue total', 'Margin %'],
      completionCriteria: [
        'Numbers cited here match /revenue and /pricing actuals exactly.',
        'At least three customer quotes or paraphrased reactions included.'
      ],
      evidencePrompt:
        'Every pitch number deserves a structured evidence entry — claim, evidence, source (/revenue, /pricing, customer quote), confidence, risk.',
      sourceGuidance: [
        'If a number is from /revenue or /pricing, name it explicitly so the buyer can verify.',
        'Customer quotes belong as their own evidence entries with the customer source identified.'
      ]
    },
    {
      id: 'offer',
      title: 'What would retail carry look like?',
      lesson:
        'Buyers need a concrete offer: what SKUs, what quantities, what margin, what timing. Vague pitches die in the meeting.',
      studentPrompts: [
        'Which 1-3 SKUs would we offer for carry? Why those?',
        'What wholesale margin are we proposing?',
        'What reorder cadence makes sense (one-time, seasonal, monthly)?'
      ],
      completionCriteria: [
        'Specific SKUs, wholesale price, and suggested reorder cadence are written.'
      ]
    },
    {
      id: 'ask',
      title: 'What is the ask?',
      lesson:
        'End every pitch with one concrete next step the buyer can say yes to. Do not ask for the whole commitment in the first meeting.',
      example:
        'Ask: a 30-unit test order of the House Phoenix beanie, by August, for the fall floor.',
      studentPrompts: [
        'What is the single smallest commitment that moves this forward?'
      ],
      completionCriteria: [
        'One-line ask exists and is believable.'
      ]
    }
  ],
  requirements: [
    {
      id: 'pitch-identity',
      label: 'Identity sentence from brand story',
      description:
        'One sentence that mirrors the House Phoenix brand story value proposition.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 11
    },
    {
      id: 'pitch-evidence',
      label: 'Real pop-up evidence',
      description:
        'Unit-sold counts, revenue total, margin percent — matches /revenue and /pricing actuals.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 11,
      evidenceType: 'metrics',
      suggestedTaskTitle: 'Pull pop-up actuals into pitch',
      definitionOfDone:
        'Numbers in the pitch match /revenue + /pricing within $1 / 1 unit.'
    },
    {
      id: 'pitch-offer',
      label: 'Retail carry offer',
      description:
        'Named SKUs, wholesale price, reorder cadence.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 11
    },
    {
      id: 'pitch-ask',
      label: 'Concrete next-step ask',
      description:
        'One-line, believable, smaller than the full commitment.',
      requiredForApproval: true,
      department: 'executive',
      playbookChapter: 11
    },
    {
      id: 'pitch-customer-quotes',
      label: 'Customer quotes from pop-up',
      description:
        'At least 3 real quotes or paraphrased reactions captured at the table.',
      requiredForApproval: false,
      department: 'marketing',
      playbookChapter: 11
    }
  ],
  suggestedTasks: [
    {
      title: 'Pull pop-up actuals into the pitch',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'pitch-evidence',
      dependency: 'pricing-scenarios-live',
      definitionOfDone:
        'Co-CEO owns the buyer-facing proof story; CFO verifies revenue, units sold, and margin from /revenue + /pricing.',
      dueOffsetDays: 2
    },
    {
      title: 'Draft retail carry offer (SKUs, price, cadence)',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'pitch-offer',
      definitionOfDone:
        'Offer reviewed by CFO for margin math, COO for inventory/cadence feasibility, and CMO for brand fit.',
      dueOffsetDays: 4
    },
    {
      title: 'Write the one-line ask',
      department: 'executive',
      ownerRole: 'coceo',
      requirementId: 'pitch-ask',
      dependency: 'pitch-offer',
      dueOffsetDays: 5
    },
    {
      title: 'Capture 3 customer quotes at the pop-up',
      department: 'strategy-growth',
      ownerRole: 'csgo',
      requirementId: 'pitch-customer-quotes',
      definitionOfDone:
        'CSGO collects or verifies at least three customer quotes, with CMO support for clean buyer-facing wording.',
      dueOffsetDays: 1
    }
  ],
  requiredEvidence: [
    {
      id: 'pitch-deck',
      label: 'Pitch deck or one-pager',
      description: 'Final artifact linked from the deliverable.',
      required: true
    },
    {
      id: 'numbers-screenshots',
      label: 'Screenshots of actuals',
      description: '/revenue and /pricing screenshots that back the pitch numbers.',
      required: true
    },
    {
      id: 'quote-notes',
      label: 'Customer quote notes',
      description: 'Real quotes from pop-up day.',
      required: false
    }
  ],
  aiGuidance: {
    allowedHelp: [
      'Critique your ask for clarity after you write it.',
      'Suggest questions a tough buyer might ask.',
      'Check that numbers in the pitch match /revenue and /pricing.'
    ],
    disallowedHelp: [
      'Inventing pop-up numbers.',
      'Writing the ask for you.',
      'Approving the deliverable.'
    ],
    studentMustProvideSourceNotes: true,
    approvalGuardrail: 'AI cannot approve deliverables.'
  },
  version: '1.0'
}
