// Report-only audit for live Firestore rows that can drift when Template
// Studio requirement or section ids are realigned.
//
// Reads:
//   - tasks
//   - deliverableOutputs
//
// Writes: none.
//
// Usage:
//   npm run audit:studio-alignment

import { templateStudios, findTemplateRequirement } from '../app/data/templateStudios'
import type { DeliverableOutput, Task } from '../app/types/models'
import { db } from './lib/admin'

interface StaleTaskRequirement {
  taskId: string
  title: string | null
  deliverableId: string | null
  requirementId: string
}

interface MismatchedTaskRequirement extends StaleTaskRequirement {
  expectedDeliverableId: string | null
  expectedStudioTitle: string | null
}

interface OutputWithoutStudio {
  outputId: string
  deliverableId: string
  sectionKeys: string[]
}

interface OrphanedOutputSection {
  outputId: string
  deliverableId: string
  studioTitle: string
  sectionKey: string
}

function taskTitle(task: Partial<Task>): string | null {
  return typeof task.title === 'string' && task.title.trim()
    ? task.title.trim()
    : null
}

function outputDeliverableId(docId: string, output: Partial<DeliverableOutput>): string {
  return typeof output.deliverableId === 'string' && output.deliverableId.trim()
    ? output.deliverableId.trim()
    : docId
}

function printTaskSection(
  title: string,
  rows: Array<StaleTaskRequirement | MismatchedTaskRequirement>
) {
  console.log(`\n${title}: ${rows.length}`)
  if (rows.length === 0) {
    console.log('  none')
    return
  }

  for (const row of rows) {
    const label = row.title ? `${row.taskId} ("${row.title}")` : row.taskId
    const base =
      `  - ${label}: requirementId="${row.requirementId}", ` +
      `deliverableId="${row.deliverableId ?? 'missing'}"`
    if ('expectedDeliverableId' in row) {
      console.log(
        `${base}, expectedDeliverableId="${row.expectedDeliverableId ?? 'none'}"` +
          `${row.expectedStudioTitle ? ` (${row.expectedStudioTitle})` : ''}`
      )
    } else {
      console.log(base)
    }
  }
}

function printOutputWithoutStudio(rows: OutputWithoutStudio[]) {
  console.log(`\nOutput docs without a current studio: ${rows.length}`)
  if (rows.length === 0) {
    console.log('  none')
    return
  }

  for (const row of rows) {
    console.log(
      `  - ${row.outputId}: deliverableId="${row.deliverableId}", ` +
        `sectionKeys=[${row.sectionKeys.join(', ')}]`
    )
  }
}

function printOrphanedSections(rows: OrphanedOutputSection[]) {
  console.log(`\nOrphaned output sections: ${rows.length}`)
  if (rows.length === 0) {
    console.log('  none')
    return
  }

  for (const row of rows) {
    console.log(
      `  - ${row.outputId}: deliverableId="${row.deliverableId}", ` +
        `sectionKey="${row.sectionKey}", studio="${row.studioTitle}"`
    )
  }
}

async function main() {
  console.log('[audit-studio-alignment] mode: READ-ONLY (no writes)')
  console.log(
    `[audit-studio-alignment] loaded studios: ${Object.keys(templateStudios).length}`
  )

  const firestore = db()
  const tasksSnap = await firestore.collection('tasks').get()
  const outputsSnap = await firestore.collection('deliverableOutputs').get()

  const staleTasks: StaleTaskRequirement[] = []
  const mismatchedTasks: MismatchedTaskRequirement[] = []
  const outputsWithoutStudio: OutputWithoutStudio[] = []
  const orphanedSections: OrphanedOutputSection[] = []

  for (const doc of tasksSnap.docs) {
    const task = doc.data() as Partial<Task>
    const requirementId =
      typeof task.requirementId === 'string' && task.requirementId.trim()
        ? task.requirementId.trim()
        : null
    if (!requirementId) continue

    const deliverableId =
      typeof task.deliverableId === 'string' && task.deliverableId.trim()
        ? task.deliverableId.trim()
        : null
    const resolved = findTemplateRequirement(requirementId)
    const base = {
      taskId: doc.id,
      title: taskTitle(task),
      deliverableId,
      requirementId
    }

    if (!resolved) {
      staleTasks.push(base)
      continue
    }

    const taskStudio = deliverableId ? templateStudios[deliverableId] : null
    const taskStudioHasRequirement =
      taskStudio?.requirements.some((r) => r.id === requirementId) ?? false

    if (!deliverableId || !taskStudioHasRequirement) {
      mismatchedTasks.push({
        ...base,
        expectedDeliverableId: resolved.deliverableId,
        expectedStudioTitle: resolved.studioTitle
      })
    }
  }

  for (const doc of outputsSnap.docs) {
    const output = doc.data() as Partial<DeliverableOutput>
    const deliverableId = outputDeliverableId(doc.id, output)
    const sectionKeys = output.sections ? Object.keys(output.sections) : []
    const studio = templateStudios[deliverableId]

    if (!studio) {
      outputsWithoutStudio.push({
        outputId: doc.id,
        deliverableId,
        sectionKeys
      })
      continue
    }

    const currentSectionIds = new Set(studio.sections.map((section) => section.id))
    for (const sectionKey of sectionKeys) {
      if (currentSectionIds.has(sectionKey)) continue
      orphanedSections.push({
        outputId: doc.id,
        deliverableId,
        studioTitle: studio.title,
        sectionKey
      })
    }
  }

  console.log(`\nTasks scanned: ${tasksSnap.size}`)
  console.log(`Deliverable outputs scanned: ${outputsSnap.size}`)
  printTaskSection('Stale task requirement IDs', staleTasks)
  printTaskSection('Mismatched task requirement IDs', mismatchedTasks)
  printOutputWithoutStudio(outputsWithoutStudio)
  printOrphanedSections(orphanedSections)

  console.log('\nSuggested manual action:')
  if (
    staleTasks.length === 0 &&
    mismatchedTasks.length === 0 &&
    outputsWithoutStudio.length === 0 &&
    orphanedSections.length === 0
  ) {
    console.log('  none; live task and output alignment matches the current registry.')
    return
  }

  console.log('  - Review each listed task before editing live Firestore data.')
  console.log('  - Re-link stale or mismatched requirementId values to the current studio ids.')
  console.log('  - Preserve authored output text before removing obsolete section keys.')
  console.log('  - Re-run this audit after any manual cleanup.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
