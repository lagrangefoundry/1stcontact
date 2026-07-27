import { siteSchema } from './schema'
import type { Site } from './types'
import { validateL1 } from './l1/validate'

/** A single structural validation failure. */
export interface ValidationError {
  /** JSON-pointer-style path to the offending node (e.g. "/pages/0/modules/1/version"). */
  path: string
  /** Human-readable explanation. */
  message: string
}

/** Discriminated-union result: success carries the typed value, failure the errors. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }

/**
 * Validate an unknown input against the site-definition schema.
 *
 * On success the returned `value` is narrowed to `Site`. On failure every Zod
 * issue is projected to a `{ path, message }` with a JSON-pointer-style path so
 * callers (including AI tool-call validators per DOC-8 §6) can self-correct.
 *
 * REQ-107 — the schema is only half the contract. `pageSchema`'s
 * `l1: l1DocumentSchema.optional()` is the *shape* check (typed axes, closed
 * enums, `.strict()` objects); the *envelope* — numeric ranges, the URL-scheme
 * allowlist, the node-count cap, geometry-track well-formedness, unique ids —
 * lives in {@link validateL1} and, until this ticket, ran only on the
 * reproduction path (fold / probes). That was backwards: a reproduced document
 * derives its values mechanically from a capture, while the *authoring* path is
 * the one with a human or an AI free-typing numbers and URLs into a JSON file.
 * So every page carrying `l1` now clears the envelope too, with the envelope's
 * paths prefixed into the page so an error points at
 * `/pages/0/l1/root/children/2/axes/fontSizePx` rather than a detached `/root/…`.
 *
 * The renderer keeps its own independent `isSafeUrl` degradation at every URL
 * sink — this is a *second* line of defence, not a replacement for the first.
 */
export function validateSite(input: unknown): Result<Site, ValidationError[]> {
  const parsed = siteSchema.safeParse(input)
  if (!parsed.success) {
    const errors: ValidationError[] = parsed.error.issues.map((issue) => ({
      path: '/' + issue.path.map((seg) => String(seg)).join('/'),
      message: issue.message,
    }))
    return { ok: false, errors }
  }

  const site = parsed.data
  const errors: ValidationError[] = []
  site.pages.forEach((page, i) => {
    if (!page.l1) return
    const envelope = validateL1(page.l1)
    if (envelope.ok) return
    for (const error of envelope.errors) {
      errors.push({ path: `/pages/${i}/l1${error.path}`, message: error.message })
    }
  })

  return errors.length === 0 ? { ok: true, value: site } : { ok: false, errors }
}
