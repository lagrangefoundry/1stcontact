/**
 * The **edit bridge's definition half** (REQ-117; DOC-28 §5.2, §9.1).
 *
 * REQ-116 gave the renderer the *stamping* half: walking the L1 tree, it writes
 * each editable region's render-scoped address onto the element it emits. This
 * module is everything the other side of that stamp needs, and deliberately
 * nothing else — it is pure data, so the same code serves the client that reads
 * a clicked element, the write path that applies the edit, and any future AI
 * tool that addresses a node the same way.
 *
 * Three things live here, and they are here rather than in the renderer because
 * they are the *contract*, not the rendering of it:
 *
 * - **The attribute names.** One definition site, imported by the emitter that
 *   writes them and the client that reads them, so the two cannot drift.
 * - **The address**, and the single rule that resolves it: index the render's
 *   root node LIST, then `children` at every later step. That one rule covers a
 *   document (`[doc.root]`) and a behavior module's slot (the subtree array)
 *   alike, which is why a slot's copy needs no second addressing scheme.
 * - **The exposed fields of a segment.** DOC-28 §3's exposure rule in code: the
 *   user sees copy and which image goes here, and the derivation is what decides
 *   that. Phase 1 exposes the words and the choice of asset and nothing else —
 *   no axis, no dial, no token name — so there is no path through this module
 *   that can produce anything but a plain string or a pick from a closed list.
 */
import type { L1Node } from './types'

// ── the stamp ────────────────────────────────────────────────────────────────

/** The render-scoped address of an editable region, as child indices. */
export const L1_EDIT_PATH_ATTR = 'data-l1-path'
/** Which kind of region it is, so the client knows which editor to open. */
export const L1_EDIT_SEGMENT_ATTR = 'data-l1-segment'
/** Set on `<body>` in the edit channel — the client's "am I in edit mode?" test. */
export const L1_EDIT_MARKER_ATTR = 'data-fc-edit'
/**
 * REQ-117 — the definition `id` of the page this document was rendered from.
 *
 * An address is only half a coordinate: `copy get`/`copy set` need the page too,
 * and the client cannot derive it from the URL. `index.html` is an ALIAS for the
 * home page, so the file name is not the id; resolving it would mean the client
 * re-implementing the renderer's home-page rule and drifting from it. The render
 * already carries every other part of the address, so it carries this part too.
 *
 * It is the `id`, never the `slug`: the slug names the file, the id is what
 * `findPageFile` matches, and the two are free to differ.
 */
export const L1_EDIT_PAGE_ATTR = 'data-fc-page'
/** Names the behavior-module instance an address is rooted in (CHAT-9 M1). */
export const L1_EDIT_MODULE_ATTR = 'data-fc-module'
/** Names the slot within that instance whose subtree array the address indexes. */
export const L1_EDIT_SLOT_ATTR = 'data-l1-slot'
/**
 * REQ-117 — the segment under the pointer. The client puts this class on; the
 * edit channel's stylesheet says what it looks like. Both need the name, and
 * neither owns it, so it lives with the rest of the stamp's vocabulary.
 */
export const L1_EDIT_HOT_CLASS = 'l1-edit-hot'

/** The kinds of region the editor exposes controls for (DOC-28 §6.2). */
export type L1SegmentKind = 'copy' | 'image' | 'container' | 'module'

// ── the address ──────────────────────────────────────────────────────────────

/**
 * Where an edit lands. `moduleId`/`slot` are absent for a node in the page's own
 * L1 document, and present together for one inside a behavior module's slot —
 * the two are separate address spaces that reuse the same short paths by design
 * (REQ-116), so a path without its scope is ambiguous.
 */
export interface L1EditTarget {
  moduleId?: string
  slot?: string
  path: readonly number[]
}

/**
 * Parse a stamped path. Returns `null` for anything that is not a dotted run of
 * non-negative integers — the client reads this off a DOM attribute, so it is
 * untrusted input and a malformed address must fail closed rather than resolve
 * to some neighbouring node.
 */
export function parseL1Path(raw: string): number[] | null {
  if (raw === '') return null
  const parts = raw.split('.')
  const out: number[] = []
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null
    out.push(Number(part))
  }
  return out
}

/** Render the address back to its attribute form. */
export function formatL1Path(path: readonly number[]): string {
  return path.join('.')
}

/**
 * The **one** resolution rule (REQ-116): index the render's root node list, then
 * walk `children` at each later step. `roots` is `[doc.root]` for a document and
 * the slot's subtree array for a behavior module's fragment.
 */
export function resolveL1Node(
  roots: readonly L1Node[],
  path: readonly number[],
): L1Node | undefined {
  if (path.length === 0) return undefined
  let node: L1Node | undefined = roots[path[0]]
  for (const i of path.slice(1)) {
    const kids: L1Node[] | undefined = (node as { children?: L1Node[] } | undefined)?.children
    node = kids?.[i]
    if (!node) return undefined
  }
  return node
}

// ── the exposed fields ───────────────────────────────────────────────────────

/**
 * One field descriptor, in the shape `mountFields` consumes (DOC-8 §9.3). The
 * modal is that widget, not a hand-rolled form, so this module's whole job is to
 * produce this list — deriving it is the work; rendering it is not ours.
 *
 * `type` is `'string'` or `'enum'`, and nothing else. That is the exposure rule
 * (DOC-28 §3) expressed as a type: a string control writes plain text, which the
 * renderer escapes (DOC-2), and an enum control can only return one of the
 * options this module put in front of the user. Neither can produce raw HTML or
 * CSS, because there is no such control — and `'enum'` is the *narrower* of the
 * two, not a widening of the surface. Every later phase's parameters (a colour
 * from the site palette, a module `config` value) are the same closed-list
 * shape, which is why this is the axis the vocabulary grows along.
 */
export interface L1FieldDescriptor {
  /** Value key — also the key of the change map a Save produces. */
  name: string
  label: string
  type: 'string' | 'enum'
  /**
   * The closed option list, present iff `type === 'enum'`. `mountFields` renders
   * it as a select and refuses anything outside it; {@link applyCopyFields}
   * enforces the same membership on the write side, so a stale client cannot
   * post an option the segment never offered.
   */
  enum?: readonly string[]
  /** Suppresses the widget's empty option — the field must hold a value. */
  required?: boolean
  /** `'textarea'` selects `mountFields`' multi-line control. */
  widget?: 'textarea'
}

/** The descriptors for one segment, with the draft's current values. */
export interface L1SegmentFields {
  fields: L1FieldDescriptor[]
  values: Record<string, string>
}

/**
 * What the derivation needs that the node itself cannot supply (REQ-118).
 *
 * A `text` run carries its whole editable state; an `image` node carries only
 * the handle it currently points at, and the *choices* are a property of the
 * site, not of the node. Passing them in keeps this module pure data — it never
 * reads a directory — while still letting the picker be a closed list.
 */
export interface L1SegmentFieldOptions {
  /**
   * The site-local image handles a picker may offer, in the exact form an L1
   * `image.src` holds them (`/assets/<name>` — the same vocabulary the capture
   * fold writes, never a parallel one; DOC-28 §13 Q5).
   */
  assets?: readonly string[]
}

/**
 * A run wide enough that a single-line control would hide most of it. The full
 * string is present either way — a form field never truncates its value — but
 * DOC-28 §9.1's guard is that the user can *see* what they typed, and a textarea
 * is what makes that true for copy that overruns its box.
 */
const MULTILINE_AT = 80

/** `widget: 'textarea'` for a value a single-line control would hide most of. */
function widgetFor(value: string): { widget?: 'textarea' } {
  return value.length > MULTILINE_AT || value.includes('\n') ? { widget: 'textarea' } : {}
}

/**
 * The options an image picker offers: the site's assets, plus whatever the node
 * points at now.
 *
 * Including the current handle is not a convenience — it is what stops the modal
 * changing the image behind the user's back. A folded reproduction can hold a
 * handle that is not in `draft/assets/` (a remote URL the fold could not
 * mirror), and a select whose options omit its own value renders with the FIRST
 * option selected. Saving would then silently swap the image for an unrelated
 * one, with the user having touched only the alt text.
 */
function imageChoices(assets: readonly string[], current: string): string[] {
  const seen = new Set(assets)
  if (current !== '') seen.add(current)
  return [...seen].sort()
}

/**
 * The exposed fields of a segment, or `null` when it has none — which is what
 * makes "clicking a segment with no editable fields opens nothing" a property of
 * the derivation rather than a check the client has to remember.
 *
 * Phase 1 is copy (REQ-117) and image selection (REQ-118). A container's
 * background and a module's `config` are phase 2. Each arrives by extending this
 * one function, so every editor surface keeps deriving from the node rather than
 * accumulating its own idea of what is editable.
 *
 * An image exposes *which image* and its alt text — and deliberately nothing
 * else. Framing (crop, scale, scrim, rotation) is blocked on DOC-28 §13 Q5:
 * the capture fold already writes those fields, and the editor must write the
 * same ones rather than inventing a parallel vocabulary, so they wait until that
 * is confirmed. Everything here is a structured field on the node; no control on
 * this surface touches a file, so choosing an asset can never bake a new one.
 */
export function copyFieldsOf(
  node: L1Node,
  opts: L1SegmentFieldOptions = {},
): L1SegmentFields | null {
  if (node.kind === 'text') {
    const text = node.text
    return {
      fields: [{ name: 'text', label: 'Text', type: 'string', ...widgetFor(text) }],
      values: { text },
    }
  }
  if (node.kind === 'image') {
    const { src, alt } = node
    return {
      fields: [
        {
          name: 'src',
          label: 'Image',
          type: 'enum',
          enum: imageChoices(opts.assets ?? [], src),
          required: true,
        },
        { name: 'alt', label: 'Alt text', type: 'string', ...widgetFor(alt) },
      ],
      values: { src, alt },
    }
  }
  return null
}

/** Applying an edit either succeeds, naming what changed, or explains why not. */
export type L1CopyEditResult =
  | { ok: true; changed: string[] }
  | { ok: false; field?: string; message: string }

/**
 * Apply one modal's worth of changes to `node`, in place.
 *
 * Whole-or-nothing: every value is checked before any is written, so a rejected
 * change map leaves the node byte-identical. The caller holds a clone of the
 * page, validates the *result* against the shared site validator, and only then
 * writes — which is what keeps a failed edit from ever reaching disk.
 *
 * Unknown keys are refused rather than ignored. A change map naming a field this
 * segment does not have means the client resolved against a different node than
 * the one it is now writing to; silently dropping it would land a partial edit.
 *
 * An `enum` field's value must be one of the options the derivation offered
 * (REQ-118). The shared validator would already refuse an unsafe handle, but it
 * cannot refuse a *safe* one the site does not have — a client holding a stale
 * asset listing would otherwise point the node at a file that is not there and
 * get a broken image with no error. Checking membership here fails it at the
 * field, naming what was refused.
 */
export function applyCopyFields(
  node: L1Node,
  values: Record<string, unknown>,
  opts: L1SegmentFieldOptions = {},
): L1CopyEditResult {
  const derived = copyFieldsOf(node, opts)
  if (!derived) {
    return { ok: false, message: `Node of kind '${node.kind}' has no editable fields.` }
  }
  const known = new Map(derived.fields.map((f) => [f.name, f]))
  for (const [name, value] of Object.entries(values)) {
    const field = known.get(name)
    if (!field) {
      return { ok: false, field: name, message: `Unknown field '${name}' for this segment.` }
    }
    if (typeof value !== 'string') {
      return { ok: false, field: name, message: `Field '${name}' must be a string.` }
    }
    if (field.type === 'enum' && !field.enum?.includes(value)) {
      return {
        ok: false,
        field: name,
        message: `'${value}' is not one of this segment's ${name} options.`,
      }
    }
  }
  const changed: string[] = []
  for (const [name, value] of Object.entries(values)) {
    const next = value as string
    if (node.kind === 'text' && name === 'text' && node.text !== next) {
      node.text = next
      changed.push(name)
    } else if (node.kind === 'image' && name === 'src' && node.src !== next) {
      node.src = next
      changed.push(name)
    } else if (node.kind === 'image' && name === 'alt' && node.alt !== next) {
      node.alt = next
      changed.push(name)
    }
  }
  return { ok: true, changed }
}
