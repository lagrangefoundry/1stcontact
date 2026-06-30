import { siteSchema } from './schema'
import type { Site } from './types'

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
 */
export function validateSite(input: unknown): Result<Site, ValidationError[]> {
  const parsed = siteSchema.safeParse(input)
  if (parsed.success) {
    return { ok: true, value: parsed.data }
  }
  const errors: ValidationError[] = parsed.error.issues.map((issue) => ({
    path: '/' + issue.path.map((seg) => String(seg)).join('/'),
    message: issue.message,
  }))
  return { ok: false, errors }
}
