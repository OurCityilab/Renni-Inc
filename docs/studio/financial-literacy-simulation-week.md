# Money in Real Life: Financial Literacy Simulation Week

**Our City / Rose City Studio — curriculum master document**

## Why this exists

The five Financial Literacy Lab modules (`/studio/lab/financial-literacy/*`) are solid but thin for the program schedule: 15–20 minutes each cannot carry a 4-hour instructional day. This correction reframes them: **the modules are not the curriculum — they are checkpoints inside a week-long financial life simulation.** Cases, team decisions, surprise events, role play, debate, and presentations carry the day; the platform is the capture/output layer where students save what's theirs.

## The week at a glance

| Day | Title | Case | Platform checkpoint |
|---|---|---|---|
| Mon | Your First Check Is Not Your Whole Check | The GDYT Paycheck Case | Take-Home Pay |
| Tue | The Budget Is the Decision | The $1,300 Month | Budget Builder |
| Wed | Credit Can Help You or Trap You | 4 credit mini-cases + minimum-payment trap | Credit & Debt |
| Thu | Could You Really Move Out? | The First Apartment Decision | Renting & Ownership + My Money Plan |
| Fri | Money in the Real World | Field trip observation | (optional) reflection into My Money Plan |

## The daily rhythm (every 4-hour day)

1. Hook / real-life scenario (15 min)
2. Mini-lesson (20 min)
3. Case simulation, round 1 (45 min)
4. Team decision round (part of 3–6)
5. Surprise/event card (10 min)
6. Rebudget / revise decision (25 min)
7. Debrief (15 min)
8. **Platform checkpoint** (30 min — the Studio module, done AFTER the case)
9. Coach clinic (20 min)
10. Share-out / exit ticket (25 min)
(+ breaks and buffer; full minute-by-minute tables in the instructor guide)

## Design rules

- **Case first, platform second.** Students arrive at each module already carrying real numbers and a real argument — the module confirms, captures, and saves.
- **Teams of 3–4, roles dealt, events deterministic.** The coach chooses which event cards hit which teams; nothing is random-shamed.
- **Non-shaming by design.** Practice numbers, not personal disclosures. "Helping at home" is framed as a real, respectable line item, never a burden narrative. Feedback language is student-safe: "hard to picture," "needs a number," never "wrong about your life."
- **Everything ends in an artifact.** Every day produces a physical deliverable AND a saved Studio draft. Friday's reflection can be added to My Money Plan.
- **Numbers match the platform.** All cases use the platform's 75% take-home estimate (`DEFAULT_COHORT_SETTINGS.takeHomePayFactor`), so hand math and the calculator agree.

## The file set

| File | Audience | Purpose |
|---|---|---|
| `docs/studio/financial-literacy-instructor-guide.md` | Coach | Full 4-day facilitation guide (scripts, timing, misconceptions, coaching moves) |
| `public/studio/curriculum/financial-literacy-case-packet.md` | Students | Cases, decision sheets, event cards, role cards, reflection prompts, pitch template (printable; served at `/studio/curriculum/financial-literacy-case-packet.md`) |
| `public/studio/curriculum/financial-literacy-field-trip-guide.md` | Students | Friday observation guide (printable; served at `/studio/curriculum/financial-literacy-field-trip-guide.md`) |
| `docs/studio/financial-literacy-scoreboard-rubric.md` | Coach | Team scoreboard + simulation rubric |
| `docs/studio/financial-literacy-slide-deck.md` | Coach | Slide-by-slide deck source (Markdown, convertible to PPTX/Slides) |
| `docs/studio/financial-literacy-tomorrow-run-of-show.md` | Coach | One-page emergency run-of-show for Day 1 |
| `app/data/studio/simulationWeekFinancialLiteracy.ts` | Platform | Simulation Week day cards on the lab landing page |

## Platform integration (what changed in the app)

- The Financial Literacy Lab landing page now shows a **Simulation Week** section: one card per day with the case title, big question, "do the case first, then complete this Studio module" guidance, a link to the module, and links to the printable packet/guide.
- **Nothing else changed.** All five modules, calculators, routes, drafts, and Firestore behavior are untouched.

## Facilitation staffing

Runs with one coach; better with two (second adult plays landlord on Day 4 and floats during team rounds). Any adult can run it from the instructor guide — the scripts are written to be read aloud if needed.
