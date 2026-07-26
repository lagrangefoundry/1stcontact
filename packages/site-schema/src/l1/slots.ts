/**
 * REQ-93 — the slot inventory of an L1 tree.
 *
 * A page is one L1 document (the single page body) into which behavior modules
 * mount at declared seams. Binding is by **name**: a module instance names the
 * `slot` it mounts into, and the page validator resolves that name against the
 * names actually present in the tree. This walk is that resolution's input.
 *
 * Duplicates are returned rather than deduped: two slots sharing a name make the
 * mount point ambiguous, and the caller must be able to see that.
 */
import type { L1Document, L1Node } from './types'

/** Every `slot` node's name in `root`, in document order, duplicates included. */
export function l1SlotNames(root: L1Node): string[] {
  const names: string[] = []
  const walk = (node: L1Node): void => {
    if (node.kind === 'slot') names.push(node.name)
    else if (node.kind === 'container') node.children.forEach(walk)
    else if (node.kind === 'box') (node.children ?? []).forEach(walk)
  }
  walk(root)
  return names
}

/** {@link l1SlotNames} over a whole document. */
export function l1DocumentSlotNames(doc: L1Document): string[] {
  return l1SlotNames(doc.root)
}

/**
 * REQ-96 — every `control` node's declared element name in `root`, in document
 * order, duplicates included. The mirror of {@link l1SlotNames} for the *other*
 * composition direction: a slot name resolves a module onto the tree, a control
 * name resolves an element of that module onto a leaf of the tree. The behavior
 * validator uses it to prove every control node binds to a declared element.
 */
export function l1ControlNames(root: L1Node): string[] {
  const names: string[] = []
  const walk = (node: L1Node): void => {
    if (node.kind === 'control') names.push(node.control)
    else if (node.kind === 'container') node.children.forEach(walk)
    else if (node.kind === 'box') (node.children ?? []).forEach(walk)
  }
  walk(root)
  return names
}
