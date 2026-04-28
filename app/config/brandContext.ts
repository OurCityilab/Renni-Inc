// Brand context configuration — Architectural Scaffolding sprint.
//
// One-stop config for "what brand is this app teaching against?". The
// platform direction is to support multiple programs and multiple
// flagship brands without re-engineering the section workspace, the
// AI feedback endpoint, or the prompt templates. Hardcoded brand
// strings are an obstacle to that.
//
// Posture (do not relax):
//   - This file describes brand IDENTITY consumed by SYSTEM LOGIC
//     (AI prompt construction, future classifier rules, future
//     brand-coherence builders). It does NOT replace curriculum
//     copy authored on TemplateStudio sections — `lesson`,
//     `whyThisMatters`, `expertGuidance`, sentence starters, and
//     other student-visible strings stay literal and curriculum-
//     authored. Curriculum is the curriculum author's voice; this
//     config is the platform's parameterization point.
//   - Pure data. No Firestore reads. No Vue runtime imports.
//   - One instance per supported brand. V1 ships exactly one
//     (HOUSE_PHOENIX_BRAND_CONTEXT). Adding another brand is
//     additive — declare a new const and route consumers to it
//     without changing existing studios.
//   - Consumers must import the named instance, not assume a
//     "default" or rely on env vars. Explicit > implicit.

export interface BrandContext {
  // Identity ---------------------------------------------------------
  /** Display name students see when this is a chrome / system label. */
  name: string
  /** Parent legal entity. Used in AI system prompts when the model
   *  needs to know who owns the brand. Not used as a student-facing
   *  label; that is curriculum's job. */
  parentCompany: string
  /** Companion brands within the same parent program. AI prompts
   *  reference this to disambiguate cross-brand questions. */
  supportingBrands: string[]

  // Positioning -----------------------------------------------------
  /** One-sentence mission statement. Surfaced into AI system prompts
   *  so the coach can detect drift between student claims and the
   *  brand's stated mission. */
  mission: string
  /** 1–2 sentence positioning summary the coach uses as a sanity
   *  check on student value-prop drafts. */
  positioning: string
  /** Tone description for AI feedback ("warm but professional",
   *  "Detroit civic-pride", etc.). Not the curriculum's voice; the
   *  AI coach's voice for this brand. */
  voice: string

  // Product context -------------------------------------------------
  /** Authoritative product list. Future classifier rules can ground
   *  evidence claims against this list (e.g. "the student wrote about
   *  candles, but the product set is beanies/sweatshirts/baked
   *  goods — flag as off-brand"). */
  productSet: string[]
  /** One-paragraph description of the retail-carry context (Phoenix
   *  Nest in V1). AI system prompts use this when the active section
   *  is in the retail-carry chapter. */
  retailContext: string

  // Audience hint (NOT segmentation) -------------------------------
  /** Rough framing of where the brand operates — geography, civic
   *  context, channel anchors. Deliberately broad; segment-level
   *  audience work happens in Customer Profile / Market Fit
   *  builders, not here. */
  primaryMarketContext: string
}

// V1 ships House Phoenix as the only brand context. Adding a new
// brand is additive: declare another const, route consumers through
// the explicit named import. There is no implicit "current brand"
// resolved at runtime.
export const HOUSE_PHOENIX_BRAND_CONTEXT: BrandContext = {
  name: 'House Phoenix',
  parentCompany: 'Renni Inc.',
  supportingBrands: ['Lumen', 'Notice', 'Humble Oven'],
  mission:
    'House Phoenix is a student-led apparel and goods brand that turns Renaissance student work into real Detroit-made products people are proud to wear and gift.',
  positioning:
    'A premium, Detroit-rooted student brand. House Phoenix earns a higher price than typical school spirit gear by pairing student-run operations with real product quality and a civic story buyers can repeat.',
  voice:
    'Direct, civic, proud of Detroit, never childish. Coach-tone is warm but holds students to evidence — assumptions are named as assumptions, claims are backed by sources.',
  productSet: ['beanies', 'sweatshirts', 't-shirts', 'baked goods', 'donations'],
  retailContext:
    'Phoenix Nest is the school store where House Phoenix products may be carried after the TechTown pop-up. Carry decisions are made by the Phoenix Nest stakeholders; the carry pitch is a deliverable, not a guarantee.',
  primaryMarketContext:
    'Detroit / TechTown pop-up + Renaissance student community + alumni and family supporters.'
}
