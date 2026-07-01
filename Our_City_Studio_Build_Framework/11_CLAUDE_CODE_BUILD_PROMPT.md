# Claude Code Build Prompt

Use this prompt to start Claude Code.

---

You are building **Our City Studio**, a mobile-first learning and portfolio platform for Rose City / Our City Summer Academy students.

Read all docs in this repository before coding.

The platform has two main product areas:

1. **The Lab** — professional development: personal brand, STAR/TMAY, resume, LinkedIn, pitch builder, and portfolio artifacts.
2. **The Markets** — financial literacy simulations: Rose City Marketplace for housing/credit and Rose City Market Day for goods/services business finance.

Build posture:
- mobile-first
- simple navigation
- one task per screen
- no dense command-center dashboard
- autosave student work
- AI-assisted improvement flow
- portfolio artifacts
- coach review later

Core UX:
- Today
- The Lab
- The Markets
- My Portfolio

First MVP target:
1. Auth can be stubbed if needed.
2. Create layout shell.
3. Create Today page.
4. Create The Lab Personal Brand Builder.
5. Create AI Sherpa mock service with deterministic placeholder responses if API keys are not available.
6. Save outputs as portfolio artifacts.
7. Create initial data structures for simulations but do not overbuild.

Important AI behavior:
For every AI improvement, show:
- Your words
- Professional version
- Why it works
- What is missing
- Try again

Do not invent student achievements or numbers. Ask for missing numbers.

Technical expectations:
- Prefer clean component architecture.
- Use TypeScript if available.
- Create reusable components for MissionCard, WorksheetPrompt, AISherpaPanel, PortfolioArtifactCard, GameCard, KPIBlock, PAndLTable.
- Keep business logic separated from UI.
- Include seed data for students, missions, career cards, credit cards, properties, NPC stores, and market events.
- Add basic tests for calculators and game logic.

Before implementing, produce:
1. Proposed app structure
2. Data model implementation plan
3. First milestone task list
4. Any assumptions

Then begin implementation.

---
