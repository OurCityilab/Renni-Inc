# Claude Code Implementation Brief

Build a lightweight, modular web app called **Renni Command Center**.

## Stack
- Nuxt 3
- Vue 3
- Pinia
- Firebase Auth (Google)
- Cloud Firestore
- Tailwind CSS
- Vercel deployment

## Constraints
- Mobile-responsive from day one
- Read-only Gantt timeline in V1
- No drag-and-drop editor required in V1
- Use soft section locking for BMC and Continuity instead of last-write-wins
- Seed users, deliverables, and goals from CSV
- Approval rubric must be visible on every deliverable
- Sherpa Lite should coach but not approve work
- Treat approval status in Firestore as authoritative

## Core V1 pages
- Home dashboard
- Login
- Tasks
- Goals
- Bible view
- Department dashboards
- C-suite dashboard
- BMC
- Continuity
- Pricing
- Decisions
- Phoenix Nest
- Live mode
- Responsible AI Use

## Core V1 data domains
- users
- deliverables
- tasks
- goals
- bmc
- continuity
- pricingScenarios
- decisions
- donations
- transactions
- feedback

## Business logic
- Chiefs see department metrics and overdue work
- Co-CEOs see company-wide status and approvals
- Finance tracks revenue, donation, pricing scenarios, and transaction ledger
- Operations tracks inventory, staffing, baked goods handling, and handoff readiness
- Marketing tracks brand architecture, brand book, signage, and Phoenix Nest pitch
- Strategy and Growth tracks feedback, customer observations, and recommendation memo status

## Approval workflow
Statuses:
- draft
- in_review
- approved
- blocked

Approval checklist:
1. complete
2. accurate
3. reviewed by chief
4. correct format
5. usable by next cohort

## Deliver now
1. Scaffold app and routes
2. Implement auth
3. Implement Firestore collections + typed models
4. Implement dashboards
5. Implement seeded deliverables/task tracker
6. Implement read-only Gantt view
7. Implement BMC with soft locking
8. Implement Continuity with soft locking
9. Implement Decision Log
10. Implement Pricing and Break-Even
11. Implement Donation + Transaction ledger
12. Implement Sherpa Lite panel with placeholder/mock response layer if API integration is deferred

## Important
Do not overbuild. Optimize for a working system students can use in the next few days.
