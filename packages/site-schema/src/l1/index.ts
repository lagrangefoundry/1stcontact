/**
 * L1 layout substrate (REQ-82). Public surface: the Zod schemas, the inferred
 * types, and the envelope validator.
 */
export * from './schema'
export * from './types'
// REQ-114 — the palette colour model (DOC-23 §5): literal base, palette overlay.
export {
  l1ColorSchema,
  l1HexSchema,
  l1OpaqueHexSchema,
  l1PaletteSchema,
  l1PaletteEntrySchema,
  l1PaletteNameSchema,
  l1PaletteRefSchema,
  isL1PaletteRef,
  alphaByteHex,
  resolveL1Color,
  resolveL1Palette,
  collectL1PaletteRefs,
} from './palette'
export type { L1Color, L1Palette, L1PaletteEntry, L1PaletteRef } from './palette'
export { validateL1, checkPaletteRefs, isSafeUrl, L1_ENVELOPE } from './validate'
export type { ValidateL1Options } from './validate'
// REQ-93 — the slot inventory a page's behavior modules bind against.
export { l1SlotNames, l1DocumentSlotNames, l1ControlNames } from './slots'
// REQ-104 — the one place the renderer and the analytic evaluator agree on which
// layout mode a container is in at a given width.
export { resolveLayoutMode } from './layout'
// REQ-116/117 — the edit bridge's definition half: the stamp's attribute names,
// the address and its one resolution rule, and a segment's exposed copy fields.
export {
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_MODULE_ATTR,
  L1_EDIT_SLOT_ATTR,
  L1_EDIT_HOT_CLASS,
  parseL1Path,
  formatL1Path,
  resolveL1Node,
  replaceL1Node,
  copyFieldsOf,
  applyCopyFields,
} from './edit'
export type {
  L1SegmentKind,
  L1EditTarget,
  L1FieldDescriptor,
  L1FieldValue,
  L1SegmentFields,
  L1SegmentFieldOptions,
  L1CopyEditResult,
} from './edit'
