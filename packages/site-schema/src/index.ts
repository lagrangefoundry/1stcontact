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

// Site locale identity (REQ-151) — country → locale/currency/timezone derivation,
// text direction, and the one `resolveSiteLocale` both renderers call.
export * from './locale'

// Font provenance registry (REQ-101) — the licence index over every font file.
export * from './fonts'

// Generated-asset content validation (REQ-130) — the closed grammar an SVG the
// assistant composed must satisfy before its bytes reach the site.
export * from './svg'
