const MODULE_LABEL_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/

export const DEFAULT_STUDIO_SESSION_MODULE = 'brand-builder'

/**
 * Resolves the module label stored on aiSessions audit docs from the
 * client-supplied `source` field. Untrusted input: anything that isn't
 * a short lowercase slug falls back to the historical default so audit
 * writes never fail and old docs stay consistent.
 */
export function resolveStudioSessionModule(source: unknown): string {
  if (typeof source !== 'string') return DEFAULT_STUDIO_SESSION_MODULE
  const normalized = source.trim().toLowerCase()
  if (!MODULE_LABEL_PATTERN.test(normalized)) return DEFAULT_STUDIO_SESSION_MODULE
  return normalized
}
