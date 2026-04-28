// Section variant configuration — Architectural Scaffolding sprint.
//
// PURPOSE
// -------
// The platform direction memo identifies a recurring pattern: students
// construct an artifact from primitives → a deterministic classifier
// explains what they built → AI provides directional feedback. Each
// new variant of that pattern (Customer Profile Builder, Brand
// Identity Engine, etc.) plugs into the section workspace via a
// declarative variant declaration in this file, NOT via scattered
// conditionals across DeliverableOutputWorkspace.vue.
//
// V1 STATE
// --------
// V1 declares two variants:
//   - 'none'      — no builder. Default behavior; section uses
//                   plain Think → Draft → Defend with no scaffolding.
//   - 'chip-pick' — the lightweight ChipPickQuickStart pattern
//                   currently mounted on Ch. 4 BMC Customer Segments.
//                   Chips for primitives, deterministic starter
//                   draft, safe write-back to Working Draft. No
//                   classifier output, no AI feedback per-variant.
//
// FUTURE VARIANTS
// ---------------
// When a new variant ships, the work is:
//   1. Add the variant string to `SectionVariant` below.
//   2. Author / extend the section's metadata on its TemplateStudio
//      to point to the variant (today via `chipPickQuickStart` for
//      chip-pick; future variants will get their own metadata fields
//      sibling to `chipPickQuickStart` in TemplateStudioSection).
//   3. Mount the variant component conditionally in the workspace,
//      keyed off the variant string declared here.
//   4. If the variant produces structured artifacts critiqued by
//      AI, register a new prompt-template mode in
//      server/utils/promptTemplates and wire it through the
//      mode-aware `/api/ai/critique` endpoint.
//
// Posture (do not relax):
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - The set of variants is a closed enum at type time. Adding a
//     variant is a code change with explicit review, not a runtime
//     toggle. This keeps the section workspace's render tree
//     statically analyzable and preserves the safety posture of
//     individual variants (e.g., the chip-pick guarantees about
//     never writing to finalText by default).

export type SectionVariant =
  | 'none'
  | 'chip-pick'
// Future:
//   | 'customer-profile-builder'
//   | 'brand-identity-engine'
//   | 'pricing-defense-engine'
//   etc.

/**
 * The default variant for any section that doesn't opt in. Sections
 * with no builder metadata render Think → Draft → Defend exactly as
 * they always have.
 */
export const DEFAULT_SECTION_VARIANT: SectionVariant = 'none'

/**
 * All currently-supported variants. Useful for future code that
 * needs to enumerate (e.g., admin tooling, audit scripts). Kept in
 * sync with the union type by the `satisfies` clause below.
 */
export const SUPPORTED_SECTION_VARIANTS = [
  'none',
  'chip-pick'
] as const satisfies readonly SectionVariant[]

/**
 * Type guard. Future code that loads a variant string from any
 * external source (URL param, admin tool, etc.) can use this to
 * narrow safely.
 */
export function isSectionVariant(value: unknown): value is SectionVariant {
  return (
    typeof value === 'string' &&
    (SUPPORTED_SECTION_VARIANTS as readonly string[]).includes(value)
  )
}
