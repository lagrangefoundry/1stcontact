/**
 * @1stcontact/site-schema
 *
 * The foundational data contract for 1st Contact site definitions: Zod schemas,
 * derived TypeScript types, and a structural validator. Imported by
 * `packages/framework`, `tools/generate`, `apps/control-app`, and eventually the
 * D1 site_definitions table.
 */

export * from './types'
export * from './schema'
export { validateSite } from './validate'
export type { ValidationError, Result } from './validate'

// L1 layout substrate (REQ-82) — the typed element tree + envelope validator.
export * from './l1'
