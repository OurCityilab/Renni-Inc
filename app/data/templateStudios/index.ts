// Registry keyed by deliverable doc id (see lib/csv.ts `deliverableDocId`).
// A deliverable without an entry keeps the plain markdown template preview
// — so this is additive, never a blocker.

import type { TemplateStudio } from '~/types/templateStudio'
import type { Deliverable } from '~/types/models'
import { brandArchitecture } from './brand-architecture'
import { businessModelCanvas } from './business-model-canvas'
import { companyStructureContinuity } from './company-structure-continuity'
import { currentProductLine } from './current-product-line'
import { decisionLogAppendices } from './decision-log-appendices'
import { executiveSummary } from './executive-summary'
import { housePhoenixBrandStory } from './house-phoenix-brand-story'
import { operationsReadiness } from './operations-readiness'
import { phoenixNestPitch } from './phoenix-nest-pitch'
import { popUpCampaign } from './pop-up-campaign'
import { pricingBreakEven } from './pricing-break-even'
import { strategyNextSemester } from './strategy-next-semester'
import { supportingBrandSheets } from './supporting-brand-sheets'

export const templateStudios: Record<string, TemplateStudio> = {
  'ch-01-executive-summary': executiveSummary,
  'ch-02-renni-overview-and-brand-architecture': brandArchitecture,
  'ch-03-company-structure-and-continuity': companyStructureContinuity,
  'ch-04-business-model-canvas': businessModelCanvas,
  'ch-05-house-phoenix-brand-book': housePhoenixBrandStory,
  'ch-06-supporting-brand-sheets': supportingBrandSheets,
  'ch-07-current-product-line-and-pricing': currentProductLine,
  'ch-08-finance-and-revenue-model': pricingBreakEven,
  'ch-09-operations-and-continuity-systems': operationsReadiness,
  'ch-10-marketing-and-campaign-playbook': popUpCampaign,
  'ch-11-phoenix-nest-retail-carry-pitch': phoenixNestPitch,
  'ch-12-strategy-and-next-semester-recommendations': strategyNextSemester,
  'ch-13-decision-log-and-appendices': decisionLogAppendices
}

export function getTemplateStudio(deliverableId: string): TemplateStudio | null {
  return templateStudios[deliverableId] ?? null
}

export function templateStudioKeyForDeliverable(
  deliverable: Pick<Deliverable, 'id' | 'studioId'>
): string {
  return deliverable.studioId || deliverable.id
}

export function getTemplateStudioForDeliverable(
  deliverable: Pick<Deliverable, 'id' | 'studioId'>
): TemplateStudio | null {
  return getTemplateStudio(templateStudioKeyForDeliverable(deliverable))
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
