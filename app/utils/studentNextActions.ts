// Student "My Next Actions" — deterministic recipe builder.
//
// Goal: turn a list of tasks (member-owned + department fallback)
// into 1–3 plain-language action cards that tell the student exactly
// what to do, how to do it, where to click, what good looks like,
// when they're done, and who reviews it.
//
// POSTURE (do not relax)
// ----------------------
//   - Pure functions. Same inputs produce the same outputs.
//   - No Firestore writes. No HTTP calls. No AI. No Vue runtime
//     imports.
//   - Never invents tasks. Never claims a task is assigned that
//     isn't. The "department fallback" only fires when the member
//     has no personally-assigned open tasks.
//   - Recipe text is curriculum-friendly and short by design. No
//     walls of text.

import type {
  Deliverable,
  Department,
  IsoDate,
  Task,
  TaskStatus
} from '~/types/models'
import {
  getTemplateStudio,
  templateStudios
} from '~/data/templateStudios'
import type {
  TemplateStudio,
  TemplateStudioSection
} from '~/types/templateStudio'
import { deepLinkForTask } from '~/utils/requirementToSection'
import { getLikelyOwner } from '~/data/chapterOwners'

/* -------------------------------------------------------------------
 * Public types
 * ------------------------------------------------------------------ */

export type NextActionKind =
  | 'blocked'
  | 'overdue'
  | 'due-soon'
  | 'in-progress'
  | 'not-started'
  | 'department-fallback'

export interface NextActionCardModel {
  /** Stable id (the task id). */
  taskId: string
  /** Why this card is on the list — drives the small chip on the card. */
  kind: NextActionKind
  /** Task title, verbatim from Firestore. */
  taskTitle: string
  /** Optional plain-language one-liner above the steps:
   *  "Use the Customer Builder, then turn the result into a Working
   *  Draft." */
  doThis: string
  /** Numbered steps. Short. 4–7 lines. */
  howToDoIt: string[]
  /** "Done when …" completion line. */
  doneWhen: string
  /** "Reviewed by …" reviewer label, full role names. */
  reviewedBy: string
  /** Due date as ISO yyyy-mm-dd, or null. */
  dueDate: IsoDate | null
  /** Button label, e.g. "Open Customer Builder". */
  buttonLabel: string
  /** Button target URL — section deeplink when possible, else
   *  deliverable page, else /tasks. */
  buttonHref: string
  /** When kind === 'blocked', surface a quiet "Ask for help" hint. */
  askForHelp: boolean
  /** Plain-language artifact-type hint shown on the card so the
   *  student knows what they are MAKING before they click through.
   *  Optional; the card hides the row when missing. */
  outputFormat?: string
}

export interface BuildStudentNextActionsInput {
  /** Tasks owned by the viewer (uid match). */
  myTasks: readonly Task[]
  /** All tasks the viewer can see (used only for department fallback
   *  when myTasks is empty). */
  allTasks: readonly Task[]
  /** All deliverables the viewer can see. */
  deliverables: readonly Deliverable[]
  /** Viewer's department (for the department fallback). */
  myDepartment: Department | null
  /** ISO yyyy-mm-dd. Caller passes this so the function stays pure. */
  todayIso: IsoDate
  /** Cap on cards. Default 3 per the brief. */
  maxCards?: number
}

export interface StudentNextActionsView {
  cards: NextActionCardModel[]
  /** True when no personal tasks were available and we're showing
   *  department-fallback cards instead. */
  usingDepartmentFallback: boolean
}

/* -------------------------------------------------------------------
 * Public entry point
 * ------------------------------------------------------------------ */

export function buildStudentNextActions(
  input: BuildStudentNextActionsInput
): StudentNextActionsView {
  const cap = input.maxCards ?? 3

  const ranked = rankMyTasks(input.myTasks, input.todayIso)
  let usingDepartmentFallback = false

  let pick = ranked.slice(0, cap)
  if (pick.length === 0 && input.myDepartment) {
    // Department fallback. The brief explicitly allows this only when
    // the member has no personal open tasks.
    const dept = filterDepartmentTasks(
      input.allTasks,
      input.myDepartment
    )
    pick = rankMyTasks(dept, input.todayIso).slice(0, cap)
    if (pick.length > 0) usingDepartmentFallback = true
  }

  const deliverableIndex: Map<string, Deliverable> = new Map(
    input.deliverables.map((d) => [d.id, d])
  )

  const cards: NextActionCardModel[] = pick.map((row) => {
    const deliverable = row.task.deliverableId
      ? (deliverableIndex.get(row.task.deliverableId) ?? null)
      : null
    return buildCardForTask(
      row.task,
      row.kind,
      deliverable,
      usingDepartmentFallback
    )
  })

  return { cards, usingDepartmentFallback }
}

/* -------------------------------------------------------------------
 * Ranking
 * ------------------------------------------------------------------ */

interface RankedRow {
  task: Task
  kind: NextActionKind
}

function rankMyTasks(
  tasks: readonly Task[],
  todayIso: IsoDate
): RankedRow[] {
  const open = tasks.filter((t) => t.status !== ('done' as TaskStatus))

  // Bucket 1: blocked → "Ask for help"
  const blocked = open
    .filter((t) => t.status === ('blocked' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'blocked' }))

  // Bucket 2: overdue (not blocked)
  const overdue = open
    .filter(
      (t) =>
        t.status !== ('blocked' as TaskStatus) &&
        Boolean(t.dueDate) &&
        (t.dueDate as string) < todayIso
    )
    .map<RankedRow>((task) => ({ task, kind: 'overdue' }))

  // Bucket 3: due within 7 days
  const horizon = addDays(todayIso, 7)
  const dueSoon = open
    .filter(
      (t) =>
        t.status !== ('blocked' as TaskStatus) &&
        Boolean(t.dueDate) &&
        (t.dueDate as string) >= todayIso &&
        (t.dueDate as string) <= horizon
    )
    .map<RankedRow>((task) => ({ task, kind: 'due-soon' }))

  // Bucket 4: in progress
  const inProgress = open
    .filter((t) => t.status === ('in_progress' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'in-progress' }))

  // Bucket 5: not started
  const notStarted = open
    .filter((t) => t.status === ('not_started' as TaskStatus))
    .map<RankedRow>((task) => ({ task, kind: 'not-started' }))

  // De-dupe across buckets (a task picked by an earlier bucket can't
  // re-appear later) and order by bucket precedence, then due date.
  const seen = new Set<string>()
  const out: RankedRow[] = []
  for (const bucket of [blocked, overdue, dueSoon, inProgress, notStarted]) {
    for (const row of bucket.sort(byDueAscending)) {
      if (seen.has(row.task.id)) continue
      seen.add(row.task.id)
      out.push(row)
    }
  }
  return out
}

function filterDepartmentTasks(
  tasks: readonly Task[],
  myDepartment: Department
): Task[] {
  return tasks.filter((t) => t.department === myDepartment)
}

function byDueAscending(a: RankedRow, b: RankedRow): number {
  const ad = a.task.dueDate ?? ''
  const bd = b.task.dueDate ?? ''
  if (ad && bd && ad !== bd) return ad < bd ? -1 : 1
  if (ad && !bd) return -1
  if (!ad && bd) return 1
  return a.task.title.localeCompare(b.task.title)
}

/* -------------------------------------------------------------------
 * Card builder — wires a task to its recipe
 * ------------------------------------------------------------------ */

function buildCardForTask(
  task: Task,
  kind: NextActionKind,
  deliverable: Deliverable | null,
  isDepartmentFallback: boolean
): NextActionCardModel {
  const studio: TemplateStudio | null = task.deliverableId
    ? (getTemplateStudio(task.deliverableId) ?? null)
    : null
  const section: TemplateStudioSection | null = resolveSectionForTask(
    studio,
    task
  )
  const recipe = pickRecipe(task, deliverable, studio, section)
  // Append `?taskId=<id>` so the section page can read it from the
  // route query and thread the task back into buildSectionRecipe()
  // — the dashboard → section continuity path. The deliverable
  // detail page ignores unknown query params, so the same suffix is
  // safe on both deeplink shapes. Skipped on the `/tasks` fallback
  // because the tasks list page does not consume per-task query.
  const baseHref =
    deepLinkForTask({
      deliverableId: task.deliverableId ?? null,
      requirementId: task.requirementId ?? null
    }) ?? '/tasks'
  const buttonHref =
    baseHref === '/tasks'
      ? baseHref
      : `${baseHref}?taskId=${encodeURIComponent(task.id)}`

  // Department-fallback cards have a tighter "kind" override so the
  // chip reads honestly even when the underlying task is "not-started"
  // for someone else.
  const finalKind: NextActionKind = isDepartmentFallback
    ? 'department-fallback'
    : kind

  return {
    taskId: task.id,
    kind: finalKind,
    taskTitle: task.title,
    doThis: recipe.doThis,
    howToDoIt: recipe.howToDoIt,
    doneWhen: buildDoneWhen(section, task, recipe.doneWhenFallback),
    reviewedBy: buildReviewerLabel(task.deliverableId ?? null, task.department ?? null),
    dueDate: task.dueDate ?? null,
    buttonLabel: recipe.buttonLabel,
    buttonHref,
    askForHelp: kind === 'blocked',
    outputFormat: recipe.outputFormat
  }
}

/* -------------------------------------------------------------------
 * Section resolution (best-effort)
 * ------------------------------------------------------------------ */

function resolveSectionForTask(
  studio: TemplateStudio | null,
  task: Task
): TemplateStudioSection | null {
  if (!studio) return null
  if (!task.requirementId) return null
  // Reproduce the heuristic shape used in deepLinkForTask: prefer an
  // explicit requirement.sectionId hint when present.
  const req = studio.requirements.find((r) => r.id === task.requirementId)
  if (req?.sectionId) {
    const explicit = studio.sections.find((s) => s.id === req.sectionId)
    if (explicit) return explicit
  }
  return null
}

/* -------------------------------------------------------------------
 * Recipe library
 *
 * Each recipe is a small object: doThis (one-liner), howToDoIt
 * (4–7 short steps), doneWhenFallback (used if the section has no
 * curriculum-authored completion criteria), and buttonLabel.
 *
 * `pickRecipe` is exported so the section workspace's
 * SectionRecipePanel can reuse the SAME recipe library — no second
 * conflicting copy of recipe text. It accepts an OPTIONAL task; the
 * recipe selection is driven by section / deliverable signals first
 * and never depends on task fields except the deliverableId fallback.
 * ------------------------------------------------------------------ */

export interface Recipe {
  doThis: string
  howToDoIt: string[]
  doneWhenFallback: string
  buttonLabel: string
  /** Plain-language artifact-type hint shown above the steps so the
   *  student knows what they are MAKING before they start writing.
   *  Examples: "You are making a table." / "You are making an SOP." /
   *  "You are making a decision memo." Optional; recipes without this
   *  field render as before. */
  outputFormat?: string
  /** Optional concrete output structure (column list, checklist
   *  shape, memo skeleton) — short string, not a wall of text. Used
   *  by finance + ops sections to show the column headers students
   *  should produce. */
  outputExample?: string
}

export function pickRecipe(
  task: Task | null,
  deliverable: Deliverable | null,
  _studio: TemplateStudio | null,
  section: TemplateStudioSection | null
): Recipe {
  // Section-driven recipes — most specific first.
  // The launch-critical pass adds section-id-specific recipes for
  // Ch. 4 / 7 / 8 / 9 priority sections. They are checked BEFORE the
  // builder-flag and deliverable-id branches so a section-specific
  // recipe always wins. Each recipe carries an `outputFormat` /
  // `outputExample` pair so students see WHAT they are making (table,
  // checklist, SOP, memo) before they start writing.

  /* ================ Ch. 4 — Business Model Canvas ================ */

  if (section?.id === 'value-propositions') {
    return {
      doThis:
        'Write one promise per customer segment that ties to a real Renni Inc. product, plus the proof customers can believe.',
      howToDoIt: [
        'Open the Working Draft for this section.',
        'For each customer segment, write one promise sentence that ties to a real product.',
        'Name what makes the promise believable — customer quote, comparable product, observation, or labeled assumption.',
        'Reject slogan-style copy ("quality apparel everyone loves").',
        'Tie at least one promise to a House Phoenix product (beanie / sweatshirt / t-shirt) and one to a supporting brand or donations.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each segment has one promise tied to a real product, plus the proof a customer would believe.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a value-prop list — one row per customer segment.',
      outputExample:
        'segment | promise sentence | product / brand | proof | confidence'
    }
  }

  if (section?.id === 'channels') {
    return {
      doThis:
        'Map every channel where a Renni Inc. customer can find, buy, receive, or respond — TechTown is one channel, not the whole business.',
      howToDoIt: [
        'List each channel: TechTown pop-up, Phoenix Nest carry, school events, social media, word of mouth.',
        'For each channel, name the customer segment it reaches.',
        'Mark whether the channel is real today or aspirational.',
        'Distinguish AWARENESS channels from CLOSING-THE-SALE channels.',
        'Add evidence — past conversion, comparable, or labeled assumption.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Channels are mapped, classified by stage, owned by a chief, and each one carries evidence or a labeled assumption.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a channel map — one row per channel.',
      outputExample:
        'channel | purpose (awareness / sale / fulfillment / follow-up) | customer | owner | real-today or aspirational | evidence'
    }
  }

  if (section?.id === 'customer-relationships') {
    return {
      doThis:
        'Describe how Renni Inc. treats customers — at the table, online, and after the sale — so a one-time buyer becomes a repeat buyer.',
      howToDoIt: [
        'Name the relationship style for each segment (personal pitch, quick at-table interaction, after-sale follow-up). Renni Command Center does not run any sale system — Square remains the external partner.',
        'Describe how a buyer at TechTown is treated, AND how a buyer through Phoenix Nest carry would be treated.',
        'Name the after-sale moment — thank-you note, social tag, second-purchase offer.',
        'Tie the relationship to brand voice, not generic "customer service" copy.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'The customer relationship is described per segment, named for both pop-up and retail-carry contexts, and tied to brand voice.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a relationship map — one row per segment.',
      outputExample:
        'segment | greeting / pitch | sale moment | after-sale follow-up | brand-voice cue'
    }
  }

  if (section?.id === 'revenue-streams') {
    return {
      doThis:
        'List Renni Inc.\'s revenue streams — apparel sales, baked-goods sales, and donations — and explain how each is captured separately.',
      howToDoIt: [
        'Open the Revenue Streams Table builder.',
        'Use Import Renni Inc. revenue streams to seed one row per product plus a donations row.',
        'Set the type, the capture method (Square / cash / donation form — all external), source, assumption, confidence, risk, and owner.',
        'Mark whether each stream ties to a Ch. 8 finance number.',
        'Copy the table into Working Draft and summarize the streams in your own words.',
        'Add structured evidence for any defended figure, then save.'
      ],
      doneWhenFallback:
        'Each revenue stream is named, capture method is documented, donations are separate from product sales, and Ch. 8 ties are flagged.',
      buttonLabel: 'Open Revenue Streams Table',
      outputFormat: 'You are making a revenue-streams table — one row per stream.',
      outputExample:
        'stream | type | capture method | source | assumption | confidence | risk | owner | ties to Ch. 8?'
    }
  }

  if (section?.id === 'key-resources') {
    return {
      doThis:
        'List the assets, people, tools, systems, data, and inventory Renni Inc. needs to run the business — not just supplies for one event.',
      howToDoIt: [
        'List PEOPLE resources (chiefs, members, advisors, baker).',
        'List PHYSICAL resources (booth, signage, kitchen access, Square POS device).',
        'List INTELLECTUAL resources (brand book, designs, customer feedback log).',
        'List INVENTORY resources (apparel stock, baked-goods supplies).',
        'Match each resource to the activity it enables.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'People, physical, intellectual, and inventory resources are each represented, and each maps to an activity it enables.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a resource table — one row per resource.',
      outputExample:
        'resource | type (people / physical / intellectual / inventory) | activity it enables | owner | risk if missing'
    }
  }

  if (section?.id === 'key-partners') {
    return {
      doThis:
        'Name the business-enabling partners Renni Inc. depends on — vendors, advisors, the school, TechTown, Phoenix Nest, and Square as the external POS — and what each contributes.',
      howToDoIt: [
        'List each partner and the contribution they make.',
        'Distinguish business-enabling PARTNERS from one-time HELPERS.',
        'Note the relationship state — confirmed, in conversation, aspirational.',
        'Name Square as the external POS partner (Renni Command Center is not a POS).',
        'Add the next ask for partners that aren\'t fully landed.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each partner is named with a clear contribution, relationship state, and next ask if not yet confirmed.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a partnership table — one row per partner.',
      outputExample:
        'partner | contribution | relationship state | next ask | risk if they leave'
    }
  }

  if (section?.id === 'cost-structure') {
    return {
      doThis:
        'Name Renni Inc.\'s costs — fixed, variable, product, and event — and tie them to the pricing engine in Ch. 7 / 8.',
      howToDoIt: [
        'Open the Cost Structure Table builder.',
        'Add a row per cost item; tag the cost type (Variable / Fixed / Event-only / Packaging / Pending).',
        'Enter the estimated amount, name the source, the assumption, and your confidence.',
        'Use the Connected product / section column to tie costs back to Ch. 7 / Ch. 8 unit-cost rows.',
        'Copy the table into Working Draft and summarize the buckets in your own words.',
        'Add structured evidence for any defended figure, then save.'
      ],
      doneWhenFallback:
        'Variable, fixed, event-only, packaging, and pending costs are each represented; each row cites a source and a confidence; Ch. 7 / Ch. 8 ties are named.',
      buttonLabel: 'Open Cost Structure Table',
      outputFormat: 'You are making a cost-structure table — one row per cost line.',
      outputExample:
        'cost item | type | estimated amount | source | assumption | confidence | connected product / section | risk | owner'
    }
  }

  if (section?.id === 'canvas-insights') {
    return {
      doThis:
        'Write a short insights paragraph that names what changed or surprised the team after working through all nine BMC blocks.',
      howToDoIt: [
        'Re-read the nine BMC blocks the team filled in.',
        'Name 2–3 things that changed after working through the canvas.',
        'Name one assumption the team is still least sure about.',
        'Tie at least one insight to a downstream chapter (Ch. 7 pricing, Ch. 10 campaign, or Ch. 11 Phoenix Nest pitch).',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'The paragraph names what changed, what is still uncertain, and how at least one insight feeds a downstream chapter.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a short insights paragraph — 4–6 sentences.',
      outputExample:
        'What changed: ___ · Still uncertain: ___ · Feeds Ch. ___: ___'
    }
  }

  /* ================ Ch. 7 — Product Line and Pricing ================ */

  if (section?.id === 'product-list') {
    return {
      doThis:
        'List every product Renni Inc. is selling — beanies, sweatshirts, t-shirts, baked goods — plus donations as a separate line.',
      howToDoIt: [
        'Open the Working Draft.',
        'List each product (beanie / sweatshirt / t-shirt / baked-goods item) on its own row.',
        'Note quantity ready, sizing if relevant, and whether the product is real today or pending.',
        'Add donations as a separate line — not a product sale.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Every product has its own row with quantity ready and current state. Donations are listed separately.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a product list — one row per product.',
      outputExample:
        'product | brand | quantity ready | sizes / variants | state (ready / pending) | owner'
    }
  }

  if (section?.id === 'product-story') {
    return {
      doThis:
        'Write the short story for each product so a customer at TechTown or Phoenix Nest can repeat it.',
      howToDoIt: [
        'For each product, write a one-line origin (who designed / made it).',
        'Add the buyer in mind — the customer segment it speaks to.',
        'Add the why — what makes it worth more than a generic version.',
        'Keep each story short enough to say at the table.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has a 1–3 sentence story a customer could repeat — origin, buyer, and why.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making short product stories — one paragraph per product.',
      outputExample:
        'product | origin (1 sentence) | buyer in mind | why it matters'
    }
  }

  if (section?.id === 'pricing-summary') {
    return {
      doThis:
        'Summarize each product\'s retail price and the reasoning — match it to the Ch. 8 unit-cost and break-even numbers.',
      howToDoIt: [
        'List each product with its retail price.',
        'Note the unit cost from Ch. 8, the margin, and the channel the price is set for (TechTown / Phoenix Nest / school events).',
        'Mark prices that are still pending vendor quotes.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has a price, unit cost, margin, and channel. Pending prices are explicitly flagged.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a pricing table — one row per product.',
      outputExample:
        'product | retail price | unit cost | margin | channel | pending? | assumption'
    }
  }

  if (section?.id === 'margin-and-break-even') {
    return {
      doThis:
        'Show the margin per product and the units required to break even — number-first, prose below.',
      howToDoIt: [
        'Open the Break-Even Table builder.',
        'For each product, enter unit cost, sale price, and the fixed-cost share.',
        'Read the margin and units-to-break-even the builder calculates.',
        'Label every assumption (fixed-cost split, conversion, attendance).',
        'Copy the table into Working Draft and write 2–3 sentences explaining the math.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has unit cost, margin, units-to-break-even, and labeled assumptions, with a short defensible explanation.',
      buttonLabel: 'Open Break-Even Table',
      outputFormat: 'You are making a cost / margin / break-even table — one row per product.',
      outputExample:
        'product | unit cost | sale price | unit margin | fixed cost / goal | units to break even | assumption'
    }
  }

  if (section?.id === 'inventory-readiness') {
    return {
      doThis:
        'Per product, name what is ready to sell and what still has to land before TechTown or Phoenix Nest.',
      howToDoIt: [
        'For each product, list quantity on hand AND quantity expected.',
        'Name the gap — units short, sizes missing, or items not yet started.',
        'Name the owner who closes the gap.',
        'Add a date by which the gap must close.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product\'s inventory state is honest, the gap is named with an owner and a close-by date.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making an inventory-readiness table — one row per product.',
      outputExample:
        'product | on hand | expected | gap | owner | close by'
    }
  }

  if (section?.id === 'pricing-risks') {
    return {
      doThis:
        'List the open pricing questions or risks the team has not resolved — pending vendor quotes, untested prices, missing margin.',
      howToDoIt: [
        'List each open pricing question (e.g., baked-goods cost not finalized).',
        'For each, note the missing data the team needs to resolve it.',
        'Name the owner and the next step.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Every open pricing risk is named with the missing data, owner, and next step.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a pricing-risk list — one row per open question.',
      outputExample:
        'risk | missing data | owner | next step | impact if unresolved'
    }
  }

  if (section?.id === 'retail-recommendations') {
    return {
      doThis:
        'Recommend which products Renni Inc. should pitch for Phoenix Nest carry — buyer, price, margin, and shelf fit.',
      howToDoIt: [
        'Pick the products that fit the Phoenix Nest shelf.',
        'For each, name the recommended retail price and the wholesale price.',
        'Name why this product fits THIS retail buyer (story, design, pricing).',
        'Note any product that the team is NOT recommending for carry, and why.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Recommended products are named with retail and wholesale prices, shelf fit, and a "not recommended" rationale where relevant.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a retail recommendation — one row per product.',
      outputExample:
        'product | recommend? | retail price | wholesale price | shelf fit | reason'
    }
  }

  /* ================ Ch. 8 — Finance and Revenue Model ================ */

  if (section?.id === 'unit-cost') {
    return {
      doThis:
        'Land the unit cost for each Renni Inc. product — vendor-quote-backed where possible, labeled assumption otherwise.',
      howToDoIt: [
        'Open the Unit Cost Table builder.',
        'For each product, enter material, labor, packaging / fees, and any other cost.',
        'Read the total unit cost the builder calculates.',
        'Cite the vendor quote, comparable, or label the assumption.',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has a defensible unit cost with components and source. Pending costs are explicitly flagged.',
      buttonLabel: 'Open Unit Cost Table',
      outputFormat: 'You are making a unit-cost table — one row per product.',
      outputExample:
        'product | material | labor | packaging / fees | other | total unit cost | source | assumption'
    }
  }

  if (section?.id === 'planned-quantity') {
    return {
      doThis:
        'Plan how many of each product Renni Inc. will bring to TechTown and how many it would carry through Phoenix Nest.',
      howToDoIt: [
        'For each product, list planned units for TechTown.',
        'List planned units for Phoenix Nest carry (or 0 if not yet carried).',
        'Cite the basis — past sales, comparable event, or labeled assumption.',
        'Sanity-check planned quantity against inventory readiness.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has planned quantity per channel with a cited basis, and quantity is consistent with inventory readiness.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a planned-quantity table — one row per product per channel.',
      outputExample:
        'product | channel | planned units | basis | confidence'
    }
  }

  if (section?.id === 'break-even') {
    return {
      doThis:
        'Show the units required to break even per product — number-first.',
      howToDoIt: [
        'Open the Break-Even Table builder.',
        'For each product, enter unit cost, sale price, and the fixed-cost share.',
        'Read the unit margin and units-to-break-even the builder calculates.',
        'Write down the fixed-cost allocation rule the team used.',
        'Label every other assumption (attendance, conversion, channel mix).',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Each product has units-to-break-even with the fixed-cost allocation rule and assumptions explicitly labeled.',
      buttonLabel: 'Open Break-Even Table',
      outputFormat: 'You are making a break-even table — one row per product.',
      outputExample:
        'product | unit cost | sale price | unit margin | fixed cost / goal | units to break even | assumption'
    }
  }

  if (section?.id === 'revenue-scenarios') {
    return {
      doThis:
        'Build low / target / stretch revenue scenarios — quantity, price, revenue, and confidence per row.',
      howToDoIt: [
        'Open the Revenue Scenarios Table builder.',
        'For each product, add a row per scenario (low / target / stretch).',
        'Enter quantity and price; the builder calculates revenue.',
        'Name the assumptions that change between scenarios (attendance, conversion, weather, channel mix).',
        'Mark confidence per row (low / medium / high).',
        'Copy the table into Working Draft and write a 2–3 sentence narrative for what each scenario means for the team.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Three scenarios (low / target / stretch) exist with quantity, price, revenue, assumptions, and confidence per product.',
      buttonLabel: 'Open Revenue Scenarios Table',
      outputFormat: 'You are making a revenue-scenarios table — one row per product per scenario.',
      outputExample:
        'scenario | product | quantity | price | revenue | assumption | confidence'
    }
  }

  if (section?.id === 'donation-scenarios') {
    return {
      doThis:
        'Project donation revenue separately from product sales — capture method, recording rule, and the donation goal.',
      howToDoIt: [
        'Open the Donation Scenarios Table builder.',
        'For each donor type, enter expected count and average gift; the builder calculates the total.',
        'In your draft, document how donations are captured (Square donation tile, paper, cash jar, online).',
        'Document the recording rule (who logs it, where it goes).',
        'Tie scenarios to the donation goal in the goals page.',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Donation scenarios exist separately from product sales, the capture method and recording rule are documented, and projections tie to the donation goal.',
      buttonLabel: 'Open Donation Scenarios Table',
      outputFormat: 'You are making a donation-scenarios table — one row per donor type.',
      outputExample:
        'donor type | count | average gift | total | assumption | confidence'
    }
  }

  if (section?.id === 'key-financial-kpis') {
    return {
      doThis:
        'Define Renni Inc.\'s financial KPIs — what to measure, the target, where it lives, and who owns it.',
      howToDoIt: [
        'Open the KPI Table builder.',
        'List 4–7 KPIs (revenue, units sold, average margin, donations, foot-traffic-to-sale conversion, retail-carry committed units).',
        'For each, enter formula / definition, target, source (Ch. 8 / pricing page / goals), owner, and review rhythm.',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        '4–7 KPIs are defined with formula, target, source, owner, and review rhythm.',
      buttonLabel: 'Open KPI Table',
      outputFormat: 'You are making a KPI table — one row per KPI.',
      outputExample:
        'KPI | formula / definition | target | source | owner | review rhythm'
    }
  }

  if (section?.id === 'post-event-recap') {
    return {
      doThis:
        'Lay out the post-event recap structure so the team can fill in actuals after TechTown — revenue, units, donations, lessons, decisions.',
      howToDoIt: [
        'List the actuals to record after TechTown (revenue, units sold, donations, foot traffic, conversion).',
        'List the qualitative lessons to capture (what worked, what surprised, what to change).',
        'List the decisions the team will record in the Decision Log (Ch. 13).',
        'Name the deadline for filling the recap (typically within 48 hours).',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'The recap structure exists with actuals, lessons, decisions, and a fill-by deadline.',
      buttonLabel: 'Start writing',
      outputFormat: 'You are making a post-event recap structure.',
      outputExample:
        'Actuals: revenue · units · donations · conversion · Lessons: ___ · Decisions to log: ___ · Deadline: ___'
    }
  }

  /* ================ Ch. 9 — Operations ================ */

  if (section?.id === 'inventory') {
    return {
      doThis:
        'Build the inventory list — every item Renni Inc. needs to bring, the quantity, the location, and whether it is packed.',
      howToDoIt: [
        'Open the Inventory Checklist builder.',
        'List every item — products, packaging, signage, the Square card reader (external partner — Renni Command Center is not a sale system), baked-goods supplies.',
        'For each item, enter quantity, location, the owner who brings it, any issue, and packed?',
        'Mark issues honestly (missing, damaged, behind on production).',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Every item is listed with quantity, location, owner, issue (if any), and a packed-yet flag.',
      buttonLabel: 'Open Inventory Checklist',
      outputFormat: 'You are making an inventory checklist — one row per item.',
      outputExample:
        'item | quantity | location | owner | issue | packed?'
    }
  }

  if (section?.id === 'day-of-sop') {
    return {
      doThis:
        'Write the pop-up day SOP — every step, the time, the owner, the materials, the done signal, and the backup.',
      howToDoIt: [
        'Open the Day-of SOP builder.',
        'Walk the day in time order (setup, open, mid-day, peak, close, breakdown).',
        'For each step, enter the time, owner, materials, done signal, and a backup person.',
        'Add a backup person for any single-owner step.',
        'Make it usable by another student who hasn\'t done it before.',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Every step has time, owner, materials, done signal, and a backup. A new student could read it and run the day.',
      buttonLabel: 'Open Day-of SOP',
      outputFormat: 'You are making an SOP — one row per step.',
      outputExample:
        'time / order | step | owner | materials | done signal | backup'
    }
  }

  if (section?.id === 'baked-goods-sop') {
    return {
      doThis:
        'Document the baked-goods SOP — food handling, allergens, transport, and display rules a new baker could follow.',
      howToDoIt: [
        'Open the Baked Goods SOP builder.',
        'For each step, name the food-safety concern, the owner, the materials, the done signal, and the backup or notes.',
        'Document allergen labeling and handling rules in the food-safety concern column.',
        'Document transport and display rules (temperature, surface, handling).',
        'Note any health / inspection / school constraint that applies.',
        'Copy the table into Working Draft and edit it in your own words. (Read the warning banner — this is not legal food-safety advice.)',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Preparation, allergen, transport, and display rules are documented and a new baker could follow them safely.',
      buttonLabel: 'Open Baked Goods SOP',
      outputFormat: 'You are making a food-handling SOP — one row per step.',
      outputExample:
        'step | food safety concern | owner | materials | done signal | backup / notes'
    }
  }

  if (section?.id === 'continuity') {
    return {
      doThis:
        'Write the continuity / handoff note — what the next cohort needs to start a Renni Inc. cycle without re-learning everything.',
      howToDoIt: [
        'Open the Continuity Checklist builder.',
        'List the items / processes the next cohort inherits (designs, vendor list, Square account, brand book, customer feedback).',
        'For each, mark status, owner, link / location, the warning or risk, and the next step.',
        'Name the rules they should follow (pricing rule, brand voice, donation handling) in the warning / next-step columns.',
        'Make it short — a memo a student can read in five minutes.',
        'Copy the table into Working Draft and edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'The continuity note names assets, rules, and open questions in a memo a student can read in five minutes.',
      buttonLabel: 'Open Continuity Checklist',
      outputFormat: 'You are making a handoff checklist — one row per item / process.',
      outputExample:
        'item / process | status | owner | link / location | warning / risk | next step'
    }
  }

  // Key Activities Builder pilot: gated on the per-section flag so
  // the recipe only fires on the BMC Ch. 4 key-activities slot. Other
  // chapters that happen to share section ids never trigger it.
  if (section?.keyActivities?.enabled) {
    return {
      doThis:
        'Choose the 5–7 activities Renni Inc. must do well as a retail company, then explain why they matter.',
      howToDoIt: [
        'Open the Key Activities Builder.',
        'Pick activities from product, operations, sales channels, marketing, and learning.',
        'Choose the 5–7 that matter most.',
        'Add a short reason for each.',
        'Copy the draft starter into Working Draft.',
        'Edit it in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your answer names 5–7 repeatable business activities, not just pop-up tasks, and explains why they matter for Renni Inc.',
      buttonLabel: 'Open Key Activities Builder',
      outputFormat: 'You are making a list of 5–7 activities with reasons.',
      outputExample: 'activity | reason it matters for Renni Inc.'
    }
  }

  if (section?.id === 'customer-segments') {
    return {
      doThis:
        'Use the Customer Builder to compose the profile, then turn the result into a Working Draft in your own words.',
      howToDoIt: [
        'Open the section page.',
        'Open the Customer Builder.',
        'Answer the questions about the customer.',
        'Click Analyze.',
        'Paste the result into Working Draft and edit it in your own words.',
        'Add evidence — a quote, observation, or labeled assumption.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your draft explains who the customer is, why they might buy, and what evidence supports it.',
      buttonLabel: 'Open Customer Builder',
      outputFormat: 'You are making a customer profile — composed in the builder, then drafted in your own words.',
      outputExample:
        'Builder output → Working Draft: who they are · why they might buy · evidence (quote / observation / labeled assumption)'
    }
  }

  if (section?.brandFit?.enabled) {
    return {
      doThis:
        'Use the Brand Builder to anchor your brand choices, then write the section in your own words.',
      howToDoIt: [
        'Open the section page.',
        'Open the Brand Builder.',
        'Pick the brand voice, audience, and message anchors.',
        'Read the suggested draft copy and revise it in your own words.',
        'Add evidence — quotes from your team, customers, or comparable brands.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the audience, the brand promise, and the evidence the team is using to back it.',
      buttonLabel: 'Open Brand Builder',
      outputFormat: 'You are making brand anchors — composed in the builder, then drafted in your own words.',
      outputExample:
        'Builder output → Working Draft: audience · promise · voice · evidence'
    }
  }

  if (section?.marketFit?.enabled) {
    return {
      doThis:
        'Use the Market Fit Builder to connect customer needs to a Renni Inc. product, then turn it into a Working Draft.',
      howToDoIt: [
        'Open the section page.',
        'Open the Market Fit Builder.',
        'Pick the customer segment and the product they would buy.',
        'List the proof — what customers said or did.',
        'Edit the suggested draft in your own words.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your draft connects a specific customer to a specific product, and the evidence is labeled — quote, observation, or assumption.',
      buttonLabel: 'Open Market Fit Builder',
      outputFormat: 'You are making a market-fit row — composed in the builder, then drafted in your own words.',
      outputExample:
        'Builder output → Working Draft: customer segment · product · proof · confidence'
    }
  }

  if (section?.pricingStrategy?.enabled) {
    return {
      doThis:
        'Use the Pricing Builder to set the cost, price, margin, and break-even, then write the explanation.',
      howToDoIt: [
        'Open the section page.',
        'Open the Pricing Builder.',
        'Enter unit costs, target price, and target margin.',
        'Read the break-even number — confirm it is a number you can defend.',
        'Write the short explanation in the Working Draft.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the unit cost, the price, the margin, and the break-even unit count — and explains why the team chose them.',
      buttonLabel: 'Open Pricing Builder',
      outputFormat: 'You are making a pricing table — composed in the builder, then drafted in your own words.',
      outputExample:
        'Builder output → Working Draft: product | unit cost | price | margin | break-even units | assumption'
    }
  }

  // Deliverable-driven recipes — match by chapter id.
  const deliverableId = deliverable?.id ?? task?.deliverableId ?? ''
  if (deliverableId === 'ch-11-phoenix-nest-retail-carry-pitch') {
    return {
      doThis:
        'Build the Phoenix Nest carry pitch — name the buyer, prove the shelf fit, and show the margin story.',
      howToDoIt: [
        'Open the section page.',
        'Name the buyer at Phoenix Nest — who is the actual person?',
        'Show the shelf fit — what about this product belongs in their store?',
        'Add proof — sell-through numbers, customer quotes, photos, or a comparable.',
        'Write the margin story — how the price covers cost AND leaves room for retail markup.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your section names the buyer, proves the shelf fit, shows the margin, and explains the ask.',
      buttonLabel: 'Open the section',
      outputFormat: 'You are making a retail carry pitch — short, scannable.',
      outputExample:
        'Buyer | Identity sentence | Evidence | Offer | Margin story | Ask'
    }
  }
  if (deliverableId === 'ch-10-marketing-and-campaign-playbook') {
    return {
      doThis:
        'Build the campaign — name the audience, the message, the channel, and the call to action.',
      howToDoIt: [
        'Open the section page.',
        'Name the audience — be specific. Not "everyone".',
        'Write the message — one sentence the audience would actually repeat.',
        'Pick the channel — where the audience already is.',
        'Write the call to action — the one thing you want them to do.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your campaign names a specific audience, a one-line message, a real channel, and a single call to action.',
      buttonLabel: 'Open the section',
      outputFormat: 'You are making a campaign brief — one row per audience.',
      outputExample:
        'audience | message | channel | call to action | success metric'
    }
  }
  if (deliverableId === 'ch-09-operations-and-continuity-systems') {
    return {
      doThis:
        'Document the process — name the steps, the owner, the handoff, and what it would take for next cohort to use it.',
      howToDoIt: [
        'Open the section page.',
        'List the steps in order — short, plain language.',
        'Name the owner — one person.',
        'Write the handoff — what the next person needs to start.',
        'Add a "next cohort" line — what would let them use this with no extra explanation.',
        'Save your work, then ask your chief to review it.'
      ],
      doneWhenFallback:
        'Your process is short, named-owner, and a next-cohort student could read it without help.',
      buttonLabel: 'Open the section',
      outputFormat: 'You are making an SOP / handoff doc — one row per step.',
      outputExample:
        'step | owner | materials | done signal | backup'
    }
  }

  // Generic fallback recipe.
  return {
    doThis:
      'Open the work page, follow the steps in the Start Here box, and turn your team\'s thinking into a draft.',
    howToDoIt: [
      'Open the work page.',
      'Read the Start Here box.',
      'Write or build your draft.',
      'Add evidence, or clearly label your assumption.',
      'Save your work.',
      'Ask your chief to review it.'
    ],
    doneWhenFallback:
      'Your draft is specific, saved, and clear enough for another student or chief to review.',
    buttonLabel: 'Open the work page',
    outputFormat: 'You are making a draft section — short, specific, and saveable.',
    outputExample: 'Working Draft: claim · evidence · source · assumption · confidence · risk · next validation step'
  }
}

/* -------------------------------------------------------------------
 * "Done when" composer
 *
 * Exported so the section workspace's SectionRecipePanel can reuse
 * the same fallback chain (task.definitionOfDone → section
 * completionCriteria → recipe fallback). Accepts a nullable task so
 * section-level callers without a task can still use it.
 * ------------------------------------------------------------------ */

export function buildDoneWhen(
  section: TemplateStudioSection | null,
  task: Task | null,
  recipeFallback: string
): string {
  if (task?.definitionOfDone && task.definitionOfDone.trim()) {
    return task.definitionOfDone.trim()
  }
  if (section?.completionCriteria && section.completionCriteria.length > 0) {
    return section.completionCriteria.join(' · ')
  }
  return recipeFallback
}

/* -------------------------------------------------------------------
 * Reviewer label
 *
 * Exported so the section workspace can use the SAME role-name
 * vocabulary as the dashboard cards. No CDO; no raw enum strings.
 * ------------------------------------------------------------------ */

export function buildReviewerLabel(
  deliverableId: string | null,
  department: Department | null
): string {
  if (deliverableId) {
    const owner = getLikelyOwner(deliverableId)
    if (owner) return `Reviewed by: ${owner}`
  }
  if (department) {
    return `Reviewed by: ${departmentReviewerLabel(department)}`
  }
  return 'Reviewed by: your chief or department lead'
}

function departmentReviewerLabel(d: Department): string {
  switch (d) {
    case 'executive':
      return 'Co-CEOs'
    case 'operations':
      return 'COO'
    case 'finance':
      return 'CFO'
    case 'marketing':
      return 'CMO'
    case 'strategy-growth':
      return 'Chief Strategy and Growth Officer'
    case 'admin':
      return 'Instructor / Admin'
  }
}

/* -------------------------------------------------------------------
 * Date helpers (ISO yyyy-mm-dd)
 * ------------------------------------------------------------------ */

function addDays(iso: IsoDate, days: number): IsoDate {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/* -------------------------------------------------------------------
 * Note: no longer re-exporting `templateStudios` from here.
 * Callers import it directly from `~/data/templateStudios`.
 * Removing the re-export resolves a Nuxt auto-import
 * duplicate-export warning between this file and
 * app/utils/finalWeekCompletion.ts.
 * ------------------------------------------------------------------ */

/* -------------------------------------------------------------------
 * Section recipe (for the section workspace)
 *
 * The section route mirrors the dashboard's recipe-driven cards by
 * rendering the SAME recipe library at the top of the section page.
 * `buildSectionRecipe` is the entry point for that mirror — it takes
 * a deliverable + section (+ optional task and studio) and returns a
 * panel-ready model with do-this, how-to-do-it steps, done-when,
 * reviewer, button label, and the anchor id of the right work
 * surface inside DeliverableOutputWorkspace.vue.
 *
 * The anchor ids match the wrappers added by the progressive-
 * disclosure pass (commit cae9fe9):
 *   cqs-<id>  → ChipPickQuickStart
 *   cpb-<id>  → CustomerProfileBuilder
 *   mfb-<id>  → Market Fit Builder
 *   bfb-<id>  → Brand Fit Builder
 *   psb-<id>  → Pricing Strategy Builder
 *   dft-<id>  → Working Draft (default fallback)
 * ------------------------------------------------------------------ */

export interface SectionRecipeModel {
  /** "Do this" one-liner. */
  doThis: string
  /** Numbered short steps. */
  howToDoIt: string[]
  /** "Done when …" line — composed via buildDoneWhen. */
  doneWhen: string
  /** "Reviewed by …" line — composed via buildReviewerLabel. */
  reviewedBy: string
  /** Button copy on the panel CTA. */
  buttonLabel: string
  /** DOM anchor id inside DeliverableOutputWorkspace the CTA should
   *  scroll to. Always present; falls back to the Working Draft
   *  wrapper when no builder applies to this section. */
  anchorId: string
  /** Plain-language artifact-type hint shown above the steps so the
   *  student knows what they are MAKING before they start writing
   *  (table / SOP / decision memo / channel map / etc.). Optional;
   *  panel hides the row when missing. */
  outputFormat?: string
  /** Optional concrete output structure — column list / checklist
   *  shape / memo skeleton — surfaced inside the panel as a
   *  monospaced hint. Optional. */
  outputExample?: string
}

export interface BuildSectionRecipeInput {
  deliverable: Deliverable | null
  section: TemplateStudioSection
  /** Optional studio. When omitted, the recipe library still picks
   *  recipes via section / deliverable signals only. */
  studio?: TemplateStudio | null
  /** Optional task. When the student arrived here from a My Next
   *  Actions card the task is the natural source for definitionOfDone
   *  and `requirementId`-driven Done-when overrides. */
  task?: Task | null
  /** Optional explicit override for whether the Customer Profile
   *  Builder beta is enabled. When omitted, the helper assumes the
   *  builder is available for `customer-segments` (matches the
   *  current production flag posture). */
  customerProfileBuilderEnabled?: boolean
}

/**
 * Build the section recipe panel model. Pure deterministic. Reuses
 * `pickRecipe`, `buildDoneWhen`, and `buildReviewerLabel` so the
 * section panel and the My Next Actions card render the SAME recipe
 * vocabulary. No network, no AI, no Firestore.
 */
export function buildSectionRecipe(
  input: BuildSectionRecipeInput
): SectionRecipeModel {
  const { deliverable, section, studio = null, task = null } = input
  const recipe = pickRecipe(task, deliverable, studio, section)
  return {
    doThis: recipe.doThis,
    howToDoIt: recipe.howToDoIt,
    doneWhen: buildDoneWhen(section, task, recipe.doneWhenFallback),
    reviewedBy: buildReviewerLabel(
      deliverable?.id ?? task?.deliverableId ?? null,
      task?.department ?? deliverable?.department ?? null
    ),
    buttonLabel: recipe.buttonLabel,
    anchorId: pickAnchorIdForSection(
      section,
      input.customerProfileBuilderEnabled ?? true
    ),
    outputFormat: recipe.outputFormat,
    outputExample: recipe.outputExample
  }
}

/**
 * Resolve which DOM anchor id inside DeliverableOutputWorkspace.vue
 * the recipe panel's CTA should jump to. Mirrors the priority used
 * by SectionGuidanceStrip's `nextStepCta`.
 *
 * Anchor map (priority order):
 *   ftb-<id>  → Finance Table Builder (launch-critical engines)
 *   ocb-<id>  → Operations Checklist Builder (launch-critical engines)
 *   kab-<id>  → Key Activities Builder
 *   cpb-<id>  → Customer Profile Builder (Ch. 4 customer-segments only)
 *   cqs-<id>  → Chip-pick QuickStart
 *   mfb-<id>  → Market Fit Builder
 *   bfb-<id>  → Brand Fit Builder
 *   psb-<id>  → Pricing Strategy Builder
 *   dft-<id>  → Working Draft (default fallback)
 *
 * Finance / Operations engines are checked FIRST so a section that
 * mounts both a launch engine and another builder always lands the
 * student on the engine — that's the surface that produces the
 * sectioned output the launch sections require.
 */
export function pickAnchorIdForSection(
  section: TemplateStudioSection,
  customerProfileBuilderEnabled: boolean
): string {
  // Launch-critical engines first. A section with `financeTable` or
  // `operationsChecklist` enabled is one of the 9 Ch. 7 / 8 / 9 launch
  // sections; the engine is the work surface, so the CTA jumps there
  // before any other builder anchor.
  if (section.financeTable?.enabled) {
    return `ftb-${section.id}`
  }
  if (section.operationsChecklist?.enabled) {
    return `ocb-${section.id}`
  }
  // Key Activities Builder is checked next when its per-section flag
  // is on, mirroring its position in the recipe library.
  if (section.keyActivities?.enabled) {
    return `kab-${section.id}`
  }
  if (customerProfileBuilderEnabled && section.id === 'customer-segments') {
    return `cpb-${section.id}`
  }
  if (section.chipPickQuickStart?.enabled) {
    return `cqs-${section.id}`
  }
  if (section.marketFit?.enabled) {
    return `mfb-${section.id}`
  }
  if (section.brandFit?.enabled) {
    return `bfb-${section.id}`
  }
  if (section.pricingStrategy?.enabled) {
    return `psb-${section.id}`
  }
  return `dft-${section.id}`
}
