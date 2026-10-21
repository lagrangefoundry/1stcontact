/**
 * REQ-420 — reading a page's VERTICAL RHYTHM back off its laid-out text: the
 * unit, and the space each heading level and body text takes above and below
 * itself, in that unit.
 *
 * It is the inverse of what a rhythm container renders, so it is what lets a
 * reproduction keep the reference's spacing when its pinned geometry is later
 * restyled into rhythm stacks, and what the REQ-82 round trip measures:
 * `read(capture(render(doc)))` recovers the unit and the styles' spacing.
 *
 * THE MEASUREMENT. Text blocks are sorted top to bottom, and each is paired with
 * the nearest block above it in the same column. The gap between a pair is the
 * larger of the upper one's space below and the lower one's space above — which
 * is what rhythm renders — so each kind of pair isolates one value:
 *
 * | upper → lower | the gap is |
 * |---|---|
 * | body → body | body's space below (body asks for nothing above) |
 * | heading N → body | heading N's space below |
 * | body → heading N | heading N's space above (it is the larger) |
 *
 * The unit is one line of body text: the median body line height, the same
 * definition a site with no declared unit uses. Each value is the median of its
 * samples, in units, to the nearest quarter. A gap wider than
 * {@link MAX_GAP_UNITS} is a section break or a column change, not rhythm.
 */
import { evaluateLayout } from './probes'
import type { L1Document, L1Node } from '@1stcontact/site-schema'

/** One laid-out text block: its box, and what it is. */
export interface RhythmBlock {
  top: number
  bottom: number
  left: number
  right: number
  /** The heading level, or absent for body text. */
  headingLevel?: number
  lineHeightPx?: number
}

/** One space, in rhythm units; a side with no sample is absent. */
export interface ReadSpace {
  spaceAbove?: number
  spaceBelow?: number
}

/** What a page's rhythm reads as. */
export interface ReadRhythm {
  unitPx: number
  body: ReadSpace
  /** By heading level. */
  headings: Record<number, ReadSpace>
}

/** Beyond this many units a gap is a section break, not rhythm. */
const MAX_GAP_UNITS = 8

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const quarter = (v: number): number => Math.round(v * 4) / 4

/** Horizontal overlap as a share of the narrower block. */
function overlapX(a: RhythmBlock, b: RhythmBlock): number {
  const w = Math.min(a.right - a.left, b.right - b.left)
  if (w <= 0) return 0
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) / w
}

/**
 * Merge the pieces of one block: runs of one paragraph are captured as separate
 * elements, which overlap it vertically and sit in its column.
 */
function mergeBlocks(blocks: readonly RhythmBlock[]): RhythmBlock[] {
  const out: RhythmBlock[] = []
  for (const b of [...blocks].sort((p, q) => p.top - q.top || p.left - q.left)) {
    const host = out.find(
      (o) =>
        o.headingLevel === b.headingLevel &&
        Math.min(o.bottom, b.bottom) - Math.max(o.top, b.top) > 0.5 * Math.min(o.bottom - o.top, b.bottom - b.top) &&
        b.left <= o.right + 1 &&
        b.right >= o.left - 1,
    )
    if (host) {
      host.top = Math.min(host.top, b.top)
      host.bottom = Math.max(host.bottom, b.bottom)
      host.left = Math.min(host.left, b.left)
      host.right = Math.max(host.right, b.right)
    } else {
      out.push({ ...b })
    }
  }
  return out
}

/**
 * The rhythm of one or more pages' text blocks, or `null` when there is no body
 * text to take a unit from.
 */
export function readRhythm(pages: readonly (readonly RhythmBlock[])[]): ReadRhythm | null {
  const merged = pages.map(mergeBlocks)
  const lines = merged.flat().flatMap((b) => (b.headingLevel === undefined && b.lineHeightPx ? [b.lineHeightPx] : []))
  if (lines.length === 0) return null
  const unitPx = median(lines)
  const bodyBelow: number[] = []
  const above = new Map<number, number[]>()
  const below = new Map<number, number[]>()
  const push = (m: Map<number, number[]>, level: number, v: number): void => void m.set(level, [...(m.get(level) ?? []), v])
  for (const blocks of merged) {
    const sorted = [...blocks].sort((p, q) => p.top - q.top)
    sorted.forEach((b, i) => {
      // The nearest block above this one, in its column.
      let upper: RhythmBlock | undefined
      for (let k = i - 1; k >= 0; k--) {
        const c = sorted[k]
        if (c.bottom <= b.top + 1 && overlapX(c, b) >= 0.5 && (!upper || c.bottom > upper.bottom)) upper = c
      }
      if (!upper) return
      const gap = (b.top - upper.bottom) / unitPx
      if (gap < 0 || gap > MAX_GAP_UNITS) return
      const up = upper.headingLevel
      const down = b.headingLevel
      if (up === undefined && down === undefined) bodyBelow.push(gap)
      else if (up !== undefined && down === undefined) push(below, up, gap)
      else if (up === undefined && down !== undefined) push(above, down, gap)
    })
  }
  const headings: Record<number, ReadSpace> = {}
  for (const level of new Set([...above.keys(), ...below.keys()])) {
    const space: ReadSpace = {}
    if (above.has(level)) space.spaceAbove = quarter(median(above.get(level)!))
    if (below.has(level)) space.spaceBelow = quarter(median(below.get(level)!))
    headings[level] = space
  }
  return {
    unitPx: Math.round(unitPx * 100) / 100,
    body: bodyBelow.length ? { spaceAbove: 0, spaceBelow: quarter(median(bodyBelow)) } : {},
    headings,
  }
}

/**
 * What a capture's manifest says about one element, as far as rhythm reads it —
 * stated structurally rather than imported, because this module is reachable
 * from the Worker (through `1c type assign`) and the capture module is not.
 */
interface CapturedText {
  text: string
  box?: { x: number; y: number; width: number; height: number }
  headingLevel?: number | null
  lineHeightPx?: number
}

/** The text blocks of a capture: every element that carries text and a box. */
export function rhythmBlocksOfManifest(manifest: { elements: readonly CapturedText[] }): RhythmBlock[] {
  return manifest.elements.flatMap((el) => {
    if (!el.box || el.text.trim() === '') return []
    const level = el.headingLevel ?? undefined
    return [
      {
        top: el.box.y,
        bottom: el.box.y + el.box.height,
        left: el.box.x,
        right: el.box.x + el.box.width,
        ...(level ? { headingLevel: level } : {}),
        ...(el.lineHeightPx ? { lineHeightPx: el.lineHeightPx } : {}),
      },
    ]
  })
}

/** The text blocks of a stored document, laid out by the analytic evaluator at `width`. */
export function rhythmBlocksOfDocument(doc: L1Document, width: number): RhythmBlock[] {
  const { leaves } = evaluateLayout(doc, width)
  return leaves.flatMap((leaf) => {
    if (leaf.kind !== 'text') return []
    const node = nodeAt(doc.root, leaf.path)
    if (!node || node.kind !== 'text') return []
    const level = node.heading?.level
    const lh = node.axes?.lineHeightPx
    return [
      {
        top: leaf.box.y,
        bottom: leaf.box.y + leaf.box.height,
        left: leaf.box.x,
        right: leaf.box.x + leaf.box.width,
        ...(level ? { headingLevel: level } : {}),
        ...(lh ? { lineHeightPx: lh } : {}),
      },
    ]
  })
}

/** The node at an evaluator path (`0.2.1`, rooted at the document root). */
function nodeAt(root: L1Node, path: string): L1Node | undefined {
  const steps = path.split('.').slice(1).map(Number)
  let node: L1Node | undefined = root
  for (const i of steps) {
    const kids: L1Node[] = node && (node.kind === 'container' || node.kind === 'box') ? (node.children ?? []) : []
    node = kids[i]
  }
  return node
}
