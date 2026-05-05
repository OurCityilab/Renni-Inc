# Renni Command Center Starter Kit

This starter kit is a planning-and-build package for a lightweight, modular command center for the Renni Inc. final project.

It includes:
- project framework
- recommended folder structure
- product requirements
- phased build plan
- Firestore/data model starter
- seeded deliverables CSV template
- Claude Code prompt
- Codex prompt
- Claude/Codex repo guidance files
- example `.mcp.json`

Suggested first move:
1. Read `docs/01-product-requirements.md`
2. Read `docs/02-folder-structure.md`
3. Read `docs/03-build-plan.md`
4. Customize `seeds/seeded_deliverables_template.csv`
5. Hand `prompts/claude-code-implementation-brief.md` to Claude Code
6. Hand `prompts/codex-implementation-brief.md` to Codex for a second pass or focused implementation tasks

## Release gate

Before pushing student-facing changes, run:

```
npm run check:release
```

This runs `npm run typecheck`, `npm run test:classifier`, and a production build (`NITRO_PRESET=node-server npm run build`) in sequence. All three must pass.

## QA smoke lane

Use the QA smoke lane to test student save, chief review, approval, revision, and Playbook preview behavior without touching real cohort work.

Required disposable emails:

- `QA_MEMBER_EMAIL`
- `QA_CHIEF_EMAIL`
- `QA_COCEO_EMAIL`

Each email must include a clear safety token such as `qa`, `smoke`, or `test`. Do not use real student or real cohort chief emails.

```bash
QA_MEMBER_EMAIL=smoke-student@example.com \
QA_CHIEF_EMAIL=smoke-chief@example.com \
QA_COCEO_EMAIL=smoke-coceo@example.com \
npm run seed:qa-smoke-lane
```

If the command reports that `users/{uid}` records are missing:

1. Sign in once as each QA account so the app provisions the user.
2. Run `npm run sync:users`.
3. Re-run the `npm run seed:qa-smoke-lane` command with the same emails.

Routes for the two-account browser smoke:

- `/deliverables/qa-ch-04-business-model-canvas/sections/customer-archetype-local-application`
- `/deliverables/qa-ch-10-marketing-and-campaign-playbook/sections/touchpoints`
- `/deliverables/qa-ch-11-phoenix-nest-retail-carry-pitch/sections/offer`

Use two browser profiles, or one normal window and one private window. Hard reload both sessions before testing production. The QA deliverables use `studioId` to render the real Template Studios while saving QA output under the `qa-*` deliverable ids.
