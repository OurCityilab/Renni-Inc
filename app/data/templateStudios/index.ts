// Registry keyed by deliverable doc id (see lib/csv.ts `deliverableDocId`).
// A deliverable without an entry keeps the plain markdown template preview
// — so this is additive, never a blocker.

import type { TemplateStudio } from '~/types/templateStudio'
import { housePhoenixBrandStory } from './house-phoenix-brand-story'
import { operationsReadiness } from './operations-readiness'
import { phoenixNestPitch } from './phoenix-nest-pitch'
import { popUpCampaign } from './pop-up-campaign'
import { pricingBreakEven } from './pricing-break-even'

export const templateStudios: Record<string, TemplateStudio> = {
  'ch-05-house-phoenix-brand-book': housePhoenixBrandStory,
  'ch-08-finance-and-revenue-model': pricingBreakEven,
  'ch-09-operations-and-continuity-systems': operationsReadiness,
  'ch-10-marketing-and-campaign-playbook': popUpCampaign,
  'ch-11-phoenix-nest-retail-carry-pitch': phoenixNestPitch
}

export function getTemplateStudio(deliverableId: string): TemplateStudio | null {
  return templateStudios[deliverableId] ?? null
}

export function findTemplateRequirement(requirementId: string): {
  deliverableId: string
  studioTitle: string
  requirementLabel: string
} | null {
  for (const [deliverableId, studio] of Object.entries(templateStudios)) {
    const requirement = studio.requirements.find((r) => r.id === requirementId)
    if (!requirement) continue
    return {
      deliverableId,
      studioTitle: studio.title,
      requirementLabel: requirement.label
    }
  }
  return null
}
