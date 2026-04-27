<script setup lang="ts">
// /remote-marketing — Remote Marketing Studio V1.
//
// Coordination hub for the outside marketing class supporting Renni
// Inc. and House Phoenix. Static / read-only — no Firestore writes,
// no AI, no submissions database, no file upload. The remote class
// drafts; the Renaissance marketing team selects, adapts, and decides.
//
// Posture (do not relax in V1):
//   - never gates submit / approval / readiness
//   - never grants approval rights to remote students
//   - copy / download only (clipboard + Blob); no Drive / OAuth
//   - no AI endpoints
//   - no auto-task creation
//   - the live Playbook (Ch. 5 / 10 / 11 / 13) remains the source of
//     truth — exports here are coordination snapshots
import { ref } from 'vue'

interface Workstream {
  id: string
  title: string
  task: string
  whatToSubmit: string
  whatGoodLooksLike: string
  whatRenniDoesWithIt: string
  remoteOwnerHint: string
  renaissanceOwnerHint: string
  playbookChapters: string
}

const WORKSTREAMS: Workstream[] = [
  {
    id: 'brand-book',
    title: 'Brand Book Support',
    task: 'Help shape the House Phoenix brand book — voice, story, signal language, design adjectives, what the brand never says.',
    whatToSubmit:
      'A short brand-book draft (1–2 pages): mission framing, voice adjectives, do/don\'t list, three reference brands (with what we like and what NOT to copy), one paragraph on what House Phoenix should feel like at TechTown.',
    whatGoodLooksLike:
      'Reads like House Phoenix, not a generic Detroit-student brand. Voice is specific. Reference brands are picked for a reason, not just because they are famous. Do/don\'t list is sharp.',
    whatRenniDoesWithIt:
      'Renaissance CMO + brand lead read it, mark which lines they keep, which they revise, which they reject. Selected lines land in Ch. 5 House Phoenix Brand Story.',
    remoteOwnerHint: 'Remote class — drafts brand book, picks references, proposes language.',
    renaissanceOwnerHint: 'Renaissance CMO — feedback, select, adapt, ship to Ch. 5.',
    playbookChapters: 'Ch. 5'
  },
  {
    id: 'campaign-concepts',
    title: 'Campaign Concepts',
    task: 'Pitch 2–3 campaign concepts for the May 27 TechTown pop-up. Each concept names a target customer, a message, and a 2-week touchpoint shape.',
    whatToSubmit:
      'For each concept: concept name, target customer (named segment), one-line message, three touchpoints (what / when / channel), one risk, one reason this fits House Phoenix.',
    whatGoodLooksLike:
      'Concept could only work for House Phoenix. The customer reason is named. The 2-week shape is realistic before May 27. The message reads in the brand voice.',
    whatRenniDoesWithIt:
      'Renaissance CMO + campaign owner read all three, pick one to run (or pull elements from each), record selection in Ch. 13 Decision Log, push the selected concept into Ch. 10 Marketing/Campaign sections.',
    remoteOwnerHint: 'Remote class — concepts, messaging, touchpoints, copy drafts.',
    renaissanceOwnerHint: 'Renaissance CMO — choose, adapt, integrate to Ch. 10.',
    playbookChapters: 'Ch. 10'
  },
  {
    id: 'social-content',
    title: 'Social / Content Copy',
    task: 'Draft post captions, hallway flyer copy, and table-sign headlines for the chosen campaign.',
    whatToSubmit:
      'For each artifact: full text (no placeholders), brand voice rationale, which segment / objection it answers, which touchpoint slot it fills.',
    whatGoodLooksLike:
      'A different student brand could not publish the same caption. Date / cash-card practicalities are present. Caption invites a real reason to walk over.',
    whatRenniDoesWithIt:
      'Renaissance CMO selects which copy ships, edits in their own voice, posts under existing channels.',
    remoteOwnerHint: 'Remote class — drafts copy options.',
    renaissanceOwnerHint: 'Renaissance CMO — selects + ships.',
    playbookChapters: 'Ch. 10'
  },
  {
    id: 'signage-display',
    title: 'Signage and Display Inspiration',
    task: 'Propose signage / merch display ideas for the TechTown booth that read at six feet.',
    whatToSubmit:
      'Sketches or written descriptions of: table sign headline, signal pieces (what catches attention from across the room), how product hangs/stacks, simple layout map.',
    whatGoodLooksLike:
      'Reads in 1.5 seconds. Premium-feel signal alongside the chosen price point. Practical with cardboard / standard table tools (no fabrication required).',
    whatRenniDoesWithIt:
      'Renaissance COO + CMO walk the booth plan, pick what gets built, decide what is in scope before May 27.',
    remoteOwnerHint: 'Remote class — sketches + inspiration.',
    renaissanceOwnerHint: 'Renaissance COO + CMO — build / cut / adapt.',
    playbookChapters: 'Ch. 10, Ch. 11 (if Phoenix Nest carry shows the same display)'
  },
  {
    id: 'segment-feedback',
    title: 'Customer / Segment Feedback',
    task: 'Stress-test the Ch. 7 PRIZM-inspired segment work. Read the team\'s named segments and ask: would this customer actually walk over?',
    whatToSubmit:
      'Per segment: one paragraph reaction — what is believable, what is thin, one objection the segment would raise, one piece of evidence that would tighten it.',
    whatGoodLooksLike:
      'Reaction is specific to the named buyer, not generic. Names a concrete objection in customer language. Suggests evidence the team can realistically gather before May 27.',
    whatRenniDoesWithIt:
      'Renaissance CSGO + CMO read feedback, decide which objections to address in Ch. 10 messaging, log decisions in Ch. 13.',
    remoteOwnerHint: 'Remote class — segment critique, objection identification.',
    renaissanceOwnerHint: 'Renaissance CSGO + CMO — own segment definitions.',
    playbookChapters: 'Ch. 7, Ch. 10'
  },
  {
    id: 'phoenix-nest',
    title: 'Phoenix Nest Pitch Support',
    task: 'Help shape the Phoenix Nest carry pitch. The pitch argues House Phoenix belongs alongside Detroit-made apparel/gift brands.',
    whatToSubmit:
      'Pitch one-pager: who House Phoenix is for, why it fits Phoenix Nest customers, three carry SKUs with margin/price, a credibility paragraph (Detroit-made, student-led, premium fit), one risk + one mitigation.',
    whatGoodLooksLike:
      'A Phoenix Nest buyer reading the one-pager could decide yes/no without follow-up. Pricing matches Ch. 8. Brand promise matches Ch. 5.',
    whatRenniDoesWithIt:
      'Renaissance CMO + Co-CEO refine the pitch language, ship it through Ch. 11 Phoenix Nest Pitch.',
    remoteOwnerHint: 'Remote class — pitch drafts, carry SKU options, credibility frame.',
    renaissanceOwnerHint: 'Renaissance CMO + Co-CEO — own the pitch.',
    playbookChapters: 'Ch. 5, Ch. 8, Ch. 11'
  }
]

const SUBMISSION_CHECKLIST = [
  'Concept name',
  'Target customer / segment (named — not "everyone")',
  'Campaign message (one sentence)',
  'Visual inspiration (link or sketch description)',
  'Why it fits House Phoenix',
  'What proof / evidence supports it',
  'What it does NOT prove (be honest)',
  'Files / links if applicable',
  'Recommended use: keep / revise / reject / maybe later'
]

const RUBRIC = [
  { dim: 'Brand fit', question: 'Could only House Phoenix publish this?' },
  { dim: 'Segment fit', question: 'Does it speak to the named buyer in their words?' },
  { dim: 'Price-position fit', question: 'Does the tone match the Ch. 8 price point?' },
  { dim: 'Clarity', question: 'Can a Renaissance student read it once and explain it?' },
  { dim: 'Originality', question: 'Is this a generic school-pop-up move or something specific to House Phoenix?' },
  { dim: 'Feasibility before May 12 / 15', question: 'Can the team actually deliver this for the final presentation?' },
  { dim: 'Feasibility before May 27', question: 'Can the team actually run this at TechTown?' },
  { dim: 'Phoenix Nest usefulness', question: 'Does this also help the Ch. 11 carry pitch?' },
  { dim: 'Evidence quality', question: 'Are claims backed by named sources, or is this aspirational?' }
]

const RATING_OPTIONS = ['Use', 'Revise', 'Save for Later', 'Do Not Use']

const FEEDBACK_STARTERS = [
  'This fits because…',
  'This misses the segment because…',
  'We can use this part, but not…',
  'To make this usable, we need…',
  'This should go into Ch. 5 / Ch. 10 / Ch. 11 / Ch. 13.'
]

// ---- markdown export bodies (V1 static content) ----

const CLIENT_BRIEF_MD = `# Remote Marketing Client Brief — Renni Inc. / House Phoenix

## Client
Renni Inc. — student-run company at Renaissance High School (Detroit).
Flagship brand: **House Phoenix** (apparel + goods).

## Products
- Beanies
- Sweatshirts
- T-shirts
- Baked goods
- Donations

## Two near-term outcomes
1. **Final presentation** — May 12 and May 15.
2. **TechTown pop-up** — May 27.
3. **Phoenix Nest carry pitch** — ongoing (retail wholesale).

## Where Renaissance students need help
- House Phoenix brand book (voice, signal language, design adjectives, do/don\'t list).
- Campaign concepts for the TechTown pop-up.
- Social / hallway / signage copy that reads in House Phoenix voice.
- Segment / customer feedback (stress-test the team\'s PRIZM-inspired segments).
- Phoenix Nest pitch language and carry SKU framing.

## Where Renaissance students stay in charge
- Final say on what ships into the Playbook (Ch. 5, 10, 11).
- Final say on which campaign concept runs.
- Final say on Phoenix Nest pitch language.
- Decision Log entries (Ch. 13) — every selected concept, with the why.
- All approvals.

## Operating model
**Remote marketing class = agency / creative support.**
**Renaissance marketing team = client. Client decides.**

## What "good" looks like
- Concepts could only work for House Phoenix.
- Customer reason is named in customer language.
- Tone matches the price point.
- Selected work is recorded in the Decision Log with a "why."
`

const ASSIGNMENT_SHEET_MD = `# Remote Marketing Class Assignment Sheet

## How this works
The Renaissance marketing team gives the brief.
The remote class drafts concepts, copy, brand-book material, and feedback.
The Renaissance team reviews every submission against the rubric and decides what ships.

## Six workstreams

${WORKSTREAMS.map(
    (w) =>
      `### ${w.title}
**Task.** ${w.task}

**What to submit.** ${w.whatToSubmit}

**What good looks like.** ${w.whatGoodLooksLike}

**What Renni does with it.** ${w.whatRenniDoesWithIt}

**Owners.**
- Remote class: ${w.remoteOwnerHint}
- Renaissance: ${w.renaissanceOwnerHint}

**Playbook chapters affected.** ${w.playbookChapters}
`
  ).join('\n')}

## Submission checklist (every concept)
${SUBMISSION_CHECKLIST.map((s) => `- [ ] ${s}`).join('\n')}

## Reminder
Final selection is recorded in **Ch. 13 Decision Log** with: what was selected, who proposed it, why, what was rejected, what changed after feedback.
`

const RUBRIC_MD = `# Renaissance Feedback Rubric

For each remote submission, rate every dimension and write one sentence of the "why."

## Dimensions

${RUBRIC.map((r) => `- **${r.dim}.** ${r.question}`).join('\n')}

## Rating per dimension
${RATING_OPTIONS.map((r) => `- ${r}`).join('\n')}

## Sentence starters

${FEEDBACK_STARTERS.map((s) => `- ${s}`).join('\n')}

## After review
- Use → ship into the named Playbook chapter.
- Revise → return with one-line direction.
- Save for Later → park with a reason.
- Do Not Use → log why, briefly.

Record selected work in **Ch. 13 Decision Log**.
`

// ---- copy + download helpers (mirrors export-center pattern) ----
const copiedKey = ref<string | null>(null)
async function copy(key: string, content: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(content)
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 1500)
  } catch {
    /* ignore */
  }
}
function download(filename: string, content: string, mime: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <main class="space-y-6">
    <NuxtLink to="/" class="text-sm text-phoenix-700 hover:underline">← Home</NuxtLink>

    <!-- Header -->
    <header class="space-y-1">
      <p class="text-xs uppercase tracking-wide text-neutral-500">Collaboration</p>
      <h1 class="text-2xl font-semibold">Remote Marketing Studio</h1>
      <p class="text-sm text-neutral-700">
        Agency-style support for House Phoenix campaign, brand book, and final
        presentation.
      </p>
      <div class="rounded-md border border-phoenix-200 bg-phoenix-50/40 px-3 py-2 text-sm text-neutral-800">
        <p class="font-medium">How this works</p>
        <p class="mt-0.5">
          Remote marketing students <span class="font-semibold">support</span> the
          work — drafts, concepts, references, feedback. Renaissance students
          <span class="font-semibold">own</span> the final decisions and the
          Playbook.
        </p>
      </div>
    </header>

    <!-- Client Brief -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            1. Client Brief
          </p>
          <p class="text-xs text-neutral-500">
            Static V1 — paste this when onboarding the remote class.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('brief', CLIENT_BRIEF_MD)"
          >{{ copiedKey === 'brief' ? 'Copied ✓' : 'Copy brief' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-remote-marketing-brief.md', CLIENT_BRIEF_MD, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <ul class="ml-5 list-disc space-y-1 text-sm text-neutral-800">
        <li>
          <span class="font-medium">Client.</span> Renni Inc. (Renaissance High School).
          Flagship brand: <span class="font-medium">House Phoenix</span>.
        </li>
        <li>
          <span class="font-medium">Products.</span> Beanies, sweatshirts, t-shirts,
          baked goods, donations.
        </li>
        <li>
          <span class="font-medium">Outcomes.</span> Final presentation May 12 / 15;
          TechTown pop-up May 27; Phoenix Nest carry pitch ongoing.
        </li>
        <li>
          <span class="font-medium">What Renaissance students need help with.</span>
          Brand book, campaign concepts, copy, signage inspiration, segment
          feedback, Phoenix Nest pitch language.
        </li>
        <li>
          <span class="font-medium">What Renaissance students keep.</span>
          All final decisions, all approvals, all Playbook chapters, all
          Decision Log entries.
        </li>
      </ul>
    </section>

    <!-- Workstreams -->
    <section class="space-y-2">
      <header>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          2. Remote Class Workstreams
        </p>
        <p class="text-xs text-neutral-500">
          Six places remote students can plug in. Renaissance team owns the call.
        </p>
      </header>
      <div class="grid gap-3 md:grid-cols-2">
        <article
          v-for="w in WORKSTREAMS"
          :key="w.id"
          class="card space-y-2"
        >
          <header class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="text-sm font-semibold text-neutral-900">{{ w.title }}</h3>
            <span class="rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-700">
              {{ w.playbookChapters }}
            </span>
          </header>
          <p class="text-sm text-neutral-800">{{ w.task }}</p>
          <dl class="space-y-1 text-xs text-neutral-700">
            <div>
              <dt class="font-semibold uppercase tracking-wide text-neutral-500">What to submit</dt>
              <dd class="text-neutral-800">{{ w.whatToSubmit }}</dd>
            </div>
            <div>
              <dt class="font-semibold uppercase tracking-wide text-neutral-500">What good work looks like</dt>
              <dd class="text-neutral-800">{{ w.whatGoodLooksLike }}</dd>
            </div>
            <div>
              <dt class="font-semibold uppercase tracking-wide text-neutral-500">What Renni does with it</dt>
              <dd class="text-neutral-800">{{ w.whatRenniDoesWithIt }}</dd>
            </div>
            <div class="grid gap-1 sm:grid-cols-2">
              <div>
                <dt class="font-semibold uppercase tracking-wide text-neutral-500">Remote class owns</dt>
                <dd class="text-neutral-800">{{ w.remoteOwnerHint }}</dd>
              </div>
              <div>
                <dt class="font-semibold uppercase tracking-wide text-neutral-500">Renaissance owns</dt>
                <dd class="text-neutral-800">{{ w.renaissanceOwnerHint }}</dd>
              </div>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <!-- Submission Checklist -->
    <section class="card space-y-2">
      <header>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          3. Submission Checklist
        </p>
        <p class="text-xs text-neutral-500">
          Every concept the remote class hands over should answer all of these.
        </p>
      </header>
      <ul class="ml-5 list-disc space-y-0.5 text-sm text-neutral-800">
        <li v-for="item in SUBMISSION_CHECKLIST" :key="item">{{ item }}</li>
      </ul>
      <p class="text-xs italic text-neutral-600">
        V1 is coordination only. Use the existing class assignment workflow to
        share files / links. Renni Command Center does not store remote-class
        submissions.
      </p>
    </section>

    <!-- Feedback Rubric -->
    <section class="card space-y-2">
      <header class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
            4. Renaissance Feedback Rubric
          </p>
          <p class="text-xs text-neutral-500">
            Renaissance marketing team reviews every submission against this
            rubric. Final decision sits with the Renaissance CMO and Co-CEOs.
          </p>
        </div>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="copy('rubric', RUBRIC_MD)"
          >{{ copiedKey === 'rubric' ? 'Copied ✓' : 'Copy rubric' }}</button>
          <button
            type="button"
            class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
            @click="download('renni-remote-marketing-rubric.md', RUBRIC_MD, 'text/markdown')"
          >Download .md</button>
        </div>
      </header>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-neutral-500">
            <th class="py-1 pr-2">Dimension</th>
            <th class="py-1 pr-2">Question</th>
            <th class="py-1">Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in RUBRIC"
            :key="r.dim"
            class="border-t border-neutral-200 align-top"
          >
            <td class="py-1 pr-2 font-medium text-neutral-900">{{ r.dim }}</td>
            <td class="py-1 pr-2 text-neutral-700">{{ r.question }}</td>
            <td class="py-1 text-neutral-700">{{ RATING_OPTIONS.join(' / ') }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Client Feedback Script -->
    <section class="card space-y-2">
      <header>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          5. Client Feedback Script
        </p>
        <p class="text-xs text-neutral-500">
          Sentence starters for the Renaissance CMO / brand lead when reviewing.
        </p>
      </header>
      <ul class="ml-5 list-disc space-y-0.5 text-sm text-neutral-800">
        <li v-for="s in FEEDBACK_STARTERS" :key="s">{{ s }}</li>
      </ul>
    </section>

    <!-- Decision Log reminder -->
    <section class="card space-y-2 border-amber-200 bg-amber-50/40">
      <header>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          6. Decision Log Reminder
        </p>
      </header>
      <p class="text-sm text-neutral-800">
        Final selected concepts must be recorded in
        <span class="font-medium">Ch. 13 Decision Log</span>. Each entry should
        capture:
      </p>
      <ul class="ml-5 list-disc space-y-0.5 text-sm text-neutral-800">
        <li>What was selected</li>
        <li>Who proposed it (which workstream / contributor)</li>
        <li>Why it was selected</li>
        <li>What was rejected</li>
        <li>What changed after feedback</li>
      </ul>
      <p class="text-xs italic text-neutral-700">
        The Decision Log is the audit trail — if the next cohort asks "why did
        we ship this campaign," the answer lives there, not in a chat thread.
      </p>
    </section>

    <!-- Exports -->
    <section class="card space-y-2">
      <header>
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          7. Exports
        </p>
        <p class="text-xs text-neutral-500">
          Local copy / download only. No Google, no Drive, no API.
        </p>
      </header>
      <div class="grid gap-2 sm:grid-cols-3">
        <div class="rounded border border-neutral-200 p-3">
          <p class="text-sm font-medium">Client Brief</p>
          <p class="mt-1 text-xs text-neutral-600">
            Onboarding context for the remote class.
          </p>
          <div class="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="copy('brief2', CLIENT_BRIEF_MD)"
            >{{ copiedKey === 'brief2' ? 'Copied ✓' : 'Copy' }}</button>
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="download('renni-remote-marketing-brief.md', CLIENT_BRIEF_MD, 'text/markdown')"
            >Download</button>
          </div>
        </div>
        <div class="rounded border border-neutral-200 p-3">
          <p class="text-sm font-medium">Assignment Sheet</p>
          <p class="mt-1 text-xs text-neutral-600">
            Six workstreams + submission checklist.
          </p>
          <div class="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="copy('assignment', ASSIGNMENT_SHEET_MD)"
            >{{ copiedKey === 'assignment' ? 'Copied ✓' : 'Copy' }}</button>
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="download('renni-remote-marketing-assignment.md', ASSIGNMENT_SHEET_MD, 'text/markdown')"
            >Download</button>
          </div>
        </div>
        <div class="rounded border border-neutral-200 p-3">
          <p class="text-sm font-medium">Feedback Rubric</p>
          <p class="mt-1 text-xs text-neutral-600">
            Renaissance team scoring + sentence starters.
          </p>
          <div class="mt-2 flex gap-2 text-xs">
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="copy('rubric2', RUBRIC_MD)"
            >{{ copiedKey === 'rubric2' ? 'Copied ✓' : 'Copy' }}</button>
            <button
              type="button"
              class="rounded border border-phoenix-300 bg-white px-2 py-1 text-phoenix-800 hover:bg-phoenix-50"
              @click="download('renni-remote-marketing-rubric.md', RUBRIC_MD, 'text/markdown')"
            >Download</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
