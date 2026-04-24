# Recommended Folder Structure

```text
renni-command-center/
├── README.md
├── package.json
├── nuxt.config.ts
├── .env.example
├── .gitignore
├── .mcp.json
├── CLAUDE.md
├── AGENTS.md
├── app/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── deliverables/
│   │   ├── gantt/
│   │   ├── bmc/
│   │   ├── structure/
│   │   ├── pricing/
│   │   ├── decisions/
│   │   ├── live-mode/
│   │   ├── sherpa/
│   │   └── ui/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   │   ├── index.vue
│   │   ├── login.vue
│   │   ├── tasks.vue
│   │   ├── bible.vue
│   │   ├── departments/
│   │   ├── c-suite/
│   │   ├── bmc.vue
│   │   ├── continuity.vue
│   │   ├── pricing.vue
│   │   ├── decisions.vue
│   │   ├── goals.vue
│   │   ├── phoenix-nest.vue
│   │   ├── live.vue
│   │   └── ai-use.vue
│   ├── stores/
│   ├── types/
│   └── utils/
├── server/
│   └── api/
│       ├── auth/
│       ├── users/
│       ├── deliverables/
│       ├── bmc/
│       ├── continuity/
│       ├── pricing/
│       ├── donations/
│       ├── transactions/
│       ├── decisions/
│       ├── goals/
│       ├── feedback/
│       └── drive/
├── firestore/
│   ├── rules.txt
│   ├── indexes.json
│   └── schema-notes.md
├── seeds/
│   ├── seeded_deliverables_template.csv
│   ├── seeded_users_template.csv
│   └── seeded_goals_template.csv
├── scripts/
│   ├── seed-users.ts
│   ├── seed-deliverables.ts
│   ├── seed-goals.ts
│   └── create-drive-structure.ts
├── docs/
│   ├── 01-product-requirements.md
│   ├── 02-folder-structure.md
│   ├── 03-build-plan.md
│   ├── 04-bible-chapters-and-owners.md
│   ├── 05-firestore-schema.md
│   ├── 06-routes-and-pages.md
│   ├── 07-chief-metrics.md
│   └── 08-project-folder-framework.md
├── prompts/
│   ├── claude-code-implementation-brief.md
│   ├── codex-implementation-brief.md
│   ├── sherpa-lite-system-prompt.md
│   └── seed-data-task-prompt.md
├── config/
│   ├── drive-folders.json
│   ├── chapter-map.json
│   └── role-map.json
└── public/
```

## Why this shape
- `app/` holds the frontend UI.
- `server/api/` keeps route handlers grouped by business domain.
- `firestore/` keeps security and schema artifacts visible.
- `seeds/` makes day-one launch possible.
- `docs/` keeps the project understandable by humans.
- `prompts/` gives Claude Code and Codex a consistent handoff.

## What should be portal-native
- BMC blocks
- Structure & Continuity sections
- decision log
- pricing scenarios
- donation tracking
- task and approval state

## What can live in linked docs
- House Phoenix brand book
- long-form marketing playbook
- long-form operations manual
- Phoenix Nest pitch deck
