import { formatL1Path, type L1Node } from '@1stcontact/site-schema'

/**
 * The derived segment model (REQ-129, REQ-131).
 *
 * ONE DERIVATION, THREE CONSUMERS. The editor draws its outlines from it
 * (DOC-28 §6.2), the assistant's page map is it, and the change journal labels
 * its records with it. It lives here rather than beside any one of them because
 * the moment two of those derive "what is this thing called" separately, the
 * journal starts describing a change in words the map never used — and a record
 * whose label the reader cannot find on the page is worse than no label.
 *
 * L1 has no notion of a "section": it is a low-level tree of boxes within boxes,
 * so a segment is DERIVED from what a node IS, never declared on it. That choice
 * and its known weakness (a painted wrapper reading as a section) are DOC-28
 * §6.2 and §6.4; nothing here re-argues them.
 */

/** One addressable place on a page, as the model needs to see it. */
export interface Segment {
  /** The dotted address, in the form every write operation takes. */
  path: string
  kind: string
  /** The component instance this address is scoped to, when it is inside one. */
  module?: string
  slot?: string
  /** Enough of the node to recognise it in a listing. Never its axes. */
  label: string
}

/** How long a text run's own words survive into the map before being cut. */
const LABEL_CHARS = 60

/**
 * Enough of a node to recognise it by, and no more (REQ-129).
 *
 * The map's job is "where is everything", so a label has to identify a node
 * among its siblings without reproducing it — the whole reason the map and
 * `get_l1` are separate operations is that the page is too big to pull in order
 * to change a heading. Axes never appear here for the same reason.
 */
export function labelOf(node: L1Node): string {
  if (node.kind === 'text') {
    const text = node.text.replace(/\s+/g, ' ').trim()
    return text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS - 1)}…` : text
  }
  if (node.kind === 'image') return node.alt || node.src
  if (node.kind === 'control') return node.control
  if (node.kind === 'slot') return node.behavior ? `${node.name} (${node.behavior})` : node.name
  const children = (node as { children?: L1Node[] }).children?.length ?? 0
  const layout = node.kind === 'container' ? node.layout : 'box'
  return `${layout}, ${children} ${children === 1 ? 'child' : 'children'}`
}

/**
 * Walk an L1 root list, emitting EVERY node.
 *
 * The addressing rule is `resolveL1Node`'s and is not re-derived here: index the
 * root list, then walk `children`. Emitting the address with `formatL1Path` — the
 * same function the renderer stamps `data-l1-path` with — is what guarantees the
 * addresses this map hands out are the addresses the write path resolves. That
 * correspondence IS the addressing contract (DOC-30 R4); the declaration states
 * its render-scoped lifetime, and this walk is why the statement is true.
 *
 * REQ-129 WIDENED THIS FROM "what can I edit" TO "where is everything". It used
 * to emit only nodes `copyFieldsOf` exposes fields for, which was right when the
 * only write was a four-field copy edit: an address the caller could do nothing
 * with was noise. It is exactly wrong now. On `xgd/home` that projection reached
 * 67 of 122 nodes, and the 55 it skipped were the layout containers — precisely
 * what a caller composing a page needs to see.
 */
function walkSegments(
  roots: readonly L1Node[],
  scope: { module?: string; slot?: string },
  prefix: readonly number[] = [],
): Segment[] {
  const out: Segment[] = []
  roots.forEach((node, index) => {
    const at = [...prefix, index]
    out.push({
      path: formatL1Path(at),
      kind: node.kind,
      ...(scope.module ? { module: scope.module, slot: scope.slot } : {}),
      label: labelOf(node),
    })
    const children = (node as { children?: L1Node[] }).children
    if (children?.length) out.push(...walkSegments(children, scope, at))
  })
  return out
}

/**
 * Every addressable node on a page — the page's own L1, then each behavior
 * module instance's slots.
 *
 * Both spaces are walked because both are addressable, and a model shown only
 * the first would conclude the words inside a contact form or a carousel slide
 * are not editable. They are; they just carry a `module` and `slot` scope, which
 * is why those travel with the address here rather than being something the
 * model has to infer.
 */
export function pageSegments(page: Record<string, unknown>): Segment[] {
  const out: Segment[] = []
  const root = (page.l1 as { root?: L1Node } | undefined)?.root
  if (root) out.push(...walkSegments([root], {}))

  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  for (const instance of modules) {
    const id = typeof instance.id === 'string' ? instance.id : undefined
    if (!id) continue
    const slots = (instance.slots ?? {}) as Record<string, unknown>
    for (const [slot, raw] of Object.entries(slots)) {
      const roots = Array.isArray(raw) ? (raw as L1Node[]) : [raw as L1Node]
      out.push(...walkSegments(roots, { module: id, slot }))
    }
  }
  return out
}
