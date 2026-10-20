/**
 * The nodes directly under a node — the one answer every tree walk shares.
 *
 * Before REQ-418 the answer was "`children`, on a box or a container", restated
 * at every walk. A table's cells live in rows rather than in `children`, so the
 * answer is stated here once and each walk asks it: the validator, the address
 * rule the editor and `set_l1` resolve by, the slot inventory.
 *
 * A TABLE'S CELLS ARE ADDRESSED IN READING ORDER — the header's cells, then each
 * row left to right. The address is one index per step like every other node's,
 * so a cell is `…​.n` exactly as a container's n-th child is, and the structure
 * that keeps a row together stays in the document rather than in its address.
 */
import type { L1Node, L1Table, L1TableCell } from './types'

/** REQ-418 — a table's cells in address order: the header's, then each row's left to right. */
export function l1TableCells(table: L1Table): L1TableCell[] {
  return [...(table.header ?? []), ...table.rows.flat()]
}

/** The nodes directly under `node`, in address order. A leaf has none. */
export function l1Children(node: L1Node): L1Node[] {
  if (node.kind === 'container') return node.children
  if (node.kind === 'box') return node.children ?? []
  if (node.kind === 'table') return l1TableCells(node)
  return []
}

/**
 * The same children, each with where it sits in the document as a JSON-pointer
 * step (`children/2`, `header/0`, `rows/3/1`) — what a refusal names, so the
 * author is pointed at the cell rather than at its position in reading order.
 */
export function l1ChildEntries(node: L1Node): { node: L1Node; at: string }[] {
  if (node.kind !== 'table') return l1Children(node).map((child, i) => ({ node: child, at: `children/${i}` }))
  const header = (node.header ?? []).map((cell, i) => ({ node: cell as L1Node, at: `header/${i}` }))
  const rows = node.rows.flatMap((row, r) => row.map((cell, c) => ({ node: cell as L1Node, at: `rows/${r}/${c}` })))
  return [...header, ...rows]
}

/**
 * Put `replacement` at child index `i` of `parent`, in place — the write half of
 * {@link l1Children}. Reports whether that child existed. A table cell is
 * written into its row, so the row structure is never disturbed by an edit.
 */
export function setL1Child(parent: L1Node, i: number, replacement: L1Node): boolean {
  if (parent.kind === 'container' || parent.kind === 'box') {
    const kids = parent.children
    if (!kids || kids[i] === undefined) return false
    kids[i] = replacement
    return true
  }
  if (parent.kind === 'table') {
    const header = parent.header ?? []
    if (i < header.length) {
      header[i] = replacement as L1TableCell
      return true
    }
    const width = parent.columns.length
    const at = i - header.length
    const row = parent.rows[Math.floor(at / width)]
    if (!row || row[at % width] === undefined) return false
    row[at % width] = replacement as L1TableCell
    return true
  }
  return false
}

/**
 * A copy of `node` with its children replaced by `kids`, in {@link l1Children}'s
 * order — the immutable counterpart of {@link setL1Child}, for a walk that
 * rebuilds the tree. A table's cells go back into the rows they came from.
 */
export function withL1Children(node: L1Node, kids: L1Node[]): L1Node {
  if (node.kind === 'container' || node.kind === 'box') return { ...node, children: kids } as L1Node
  if (node.kind === 'table') {
    const cells = kids as L1TableCell[]
    const head = node.header?.length ?? 0
    const width = node.columns.length
    return {
      ...node,
      ...(node.header ? { header: cells.slice(0, head) } : {}),
      rows: node.rows.map((_, r) => cells.slice(head + r * width, head + (r + 1) * width)),
    }
  }
  return node
}
