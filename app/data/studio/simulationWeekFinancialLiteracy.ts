// "Money in Real Life" Simulation Week — day cards rendered on the
// Financial Literacy Lab landing page. The five modules stay the
// checkpoints; the cases carry the classroom day. Curriculum source:
// docs/studio/financial-literacy-simulation-week.md. Printable packets
// live in public/studio/curriculum/ (served as static assets).
// Deliberately separate from financialLiteracyLab.ts so the module
// registry and its invariants stay untouched.

export interface SimulationWeekDay {
  day: string
  title: string
  caseTitle: string
  /** The question the whole day argues about. */
  bigQuestion: string
  /** Module slugs from financialLiteracyLab.ts completed AFTER the case. */
  moduleSlugs: string[]
}

export const SIMULATION_WEEK_TITLE = 'Money in Real Life: Financial Literacy Simulation Week'

export const SIMULATION_WEEK_NOTE =
  'In Simulation Week, your crew works a real-life case first — then you come here to run your numbers and save what’s yours. The module is your receipt; the case is the work.'

export const simulationWeekDays: SimulationWeekDay[] = [
  {
    day: 'Day 1',
    title: 'Your First Check Is Not Your Whole Check',
    caseTitle: 'The GDYT Paycheck Case',
    bigQuestion: 'What did you think was yours that actually wasn’t?',
    moduleSlugs: ['take-home-pay']
  },
  {
    day: 'Day 2',
    title: 'The Budget Is the Decision',
    caseTitle: 'The $1,300 Month',
    bigQuestion: 'When two things you need fight over the same dollars, what wins — and why?',
    moduleSlugs: ['budget-builder']
  },
  {
    day: 'Day 3',
    title: 'Credit Can Help You or Trap You',
    caseTitle: 'Four credit calls: sneakers, a secured card, a car lot, an emergency',
    bigQuestion: '“Looks affordable” and “is affordable” — what’s the difference in real numbers?',
    moduleSlugs: ['credit-debt']
  },
  {
    day: 'Day 4',
    title: 'Could You Really Move Out?',
    caseTitle: 'The First Apartment Decision',
    bigQuestion: 'What’s the honest date you could move out — and are you okay with it?',
    moduleSlugs: ['renting-homeownership', 'money-plan']
  }
]

/** Printable student materials (static assets under public/). */
export const simulationWeekPrintables = [
  {
    label: 'Student case packet (print me)',
    href: '/studio/curriculum/financial-literacy-case-packet.md'
  },
  {
    label: 'Friday field trip money guide',
    href: '/studio/curriculum/financial-literacy-field-trip-guide.md'
  }
]
