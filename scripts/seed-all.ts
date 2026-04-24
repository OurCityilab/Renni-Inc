// Orchestrates every seed step in order. Each step is idempotent, so re-running
// this is safe. Deliverables/goals/tasks depend on the users collection for
// uid backfill, so the order matters only on the first run after fresh logins.

import { spawnSync } from 'node:child_process'

const steps = [
  'scripts/seed-users.ts',
  'scripts/seed-deliverables.ts',
  'scripts/seed-goals.ts',
  'scripts/seed-tasks.ts',
  'scripts/seed-pricing.ts',
  'scripts/seed-bmc.ts'
]

for (const script of steps) {
  console.log(`\n▶ tsx ${script}`)
  const result = spawnSync('npx', ['tsx', script], { stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`[seed-all] ${script} failed (exit ${result.status})`)
    process.exit(result.status ?? 1)
  }
}

console.log('\n[seed-all] all seed steps completed.')
