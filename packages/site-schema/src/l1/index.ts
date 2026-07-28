/**
 * L1 layout substrate (REQ-82). Public surface: the Zod schemas, the inferred
 * types, and the envelope validator.
 */
export * from './schema'
export * from './types'
export { validateL1, isSafeUrl, L1_ENVELOPE } from './validate'
// REQ-93 — the slot inventory a page's behavior modules bind against.
export { l1SlotNames, l1DocumentSlotNames, l1ControlNames } from './slots'
// REQ-104 — the one place the renderer and the analytic evaluator agree on which
// layout mode a container is in at a given width.
export { resolveLayoutMode } from './layout'
