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
 *   user sees copy, and the derivation is what decides that. Phase 1 exposes the
 *   words and nothing else — no axis, no dial, no token name — so there is no
 *   path through this module that can produce anything but a plain string.
 */
import type { L1Node } from './types'

// ── the stamp ────────────────────────────────────────────────────────────────

/** The render-scoped address of an editable region, as child indices. */
export const L1_EDIT_PATH_ATTR = 'data-l1-path'
/** Which kind of region it is, so the client knows which editor to open. */
export const L1_EDIT_SEGMENT_ATTR = 'data-l1-segment'
/** Set on `<body>` in the edit channel — the client's "am I in edit mode?" test. */
export const L1_EDIT_MARKER_ATTR = 'data-fc-edit'
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
 * `type` is `'string'` and only `'string'`. That is the exposure rule (DOC-28
 * §3) expressed as a type: there is no descriptor this module can emit whose
 * control could produce raw HTML or CSS, because there is no such control.
 */
export interface L1FieldDescriptor {
  /** Value key — also the key of the change map a Save produces. */
  name: string
  label: string
  type: 'string'
  /** `'textarea'` selects `mountFields`' multi-line control. */
  widget?: 'textarea'
}

/** The descriptors for one segment, with the draft's current values. */
export interface L1SegmentFields {
  fields: L1FieldDescriptor[]
  values: Record<string, string>
}

/**
 * A run wide enough that a single-line control would hide most of it. The full
 * string is present either way — a form field never truncates its value — but
 * DOC-28 §9.1's guard is that the user can *see* what they typed, and a textarea
 * is what makes that true for copy that overruns its box.
 */
const MULTILINE_AT = 80

/**
 * The copy fields of a segment, or `null` when it has none — which is what makes
 * "clicking a segment with no editable fields opens nothing" a property of the
 * derivation rather than a check the client has to remember.
 *
 * Phase 1 is copy. An image segment's asset and framing are T4; a container's
 * background and a module's `config` are phase 2. Each arrives by extending this
 * one function, so every editor surface keeps deriving from the node rather than
 * accumulating its own idea of what is editable.
 */
export function copyFieldsOf(node: L1Node): L1SegmentFields | null {
  if (node.kind !== 'text') return null
  const text = node.text
  return {
    fields: [
      {
        name: 'text',
        label: 'Text',
        type: 'string',
        ...(text.length > MULTILINE_AT || text.includes('\n') ? { widget: 'textarea' as const } : {}),
      },
    ],
    values: { text },
  }
}

/** Applying an edit either succeeds, naming what changed, or explains why not. */
export type L1CopyEditResult =
  | { ok: true; changed: string[] }
  | { ok: false; field?: string; message: string }

/**
 * Apply one modal's worth of copy changes to `node`, in place.
 *
 * Whole-or-nothing: every value is checked before any is written, so a rejected
 * change map leaves the node byte-identical. The caller holds a clone of the
 * page, validates the *result* against the shared site validator, and only then
 * writes — which is what keeps a failed edit from ever reaching disk.
 *
 * Unknown keys are refused rather than ignored. A change map naming a field this
 * segment does not have means the client resolved against a different node than
 * the one it is now writing to; silently dropping it would land a partial edit.
 */
export function applyCopyFields(node: L1Node, values: Record<string, unknown>): L1CopyEditResult {
  const derived = copyFieldsOf(node)
  if (!derived) {
    return { ok: false, message: `Node of kind '${node.kind}' has no editable copy.` }
  }
  const known = new Set(derived.fields.map((f) => f.name))
  for (const [name, value] of Object.entries(values)) {
    if (!known.has(name)) {
      return { ok: false, field: name, message: `Unknown copy field '${name}' for this segment.` }
    }
    if (typeof value !== 'string') {
      return { ok: false, field: name, message: `Copy field '${name}' must be a string.` }
    }
  }
  const changed: string[] = []
  for (const [name, value] of Object.entries(values)) {
    if (name === 'text' && node.kind === 'text' && node.text !== value) {
      node.text = value as string
      changed.push(name)
    }
  }
  return { ok: true, changed }
}
