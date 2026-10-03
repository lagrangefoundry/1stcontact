/**
 * REQ-157 — the responsive table, with no host in it.
 *
 * WHY THIS FILE EXISTS, and it is the third time the same seam has been cut in
 * this codebase for the same reason (`perceptual-core.ts`, then `gate-core.ts`).
 * `responsive-diff.ts` was one module doing two things: BUILDING the N-way
 * per-node table from projections already in hand, and being the
 * `1c responsive-diff` command — which reads a bundle directory the operator
 * typed and writes JSON to a path they chose.
 *
 * The table builder is pure. The command needs `node:fs`, the filesystem
 * reference store, and `shot.ts` — which reaches a loopback server and
 * Playwright. And `l1/fold.ts` imports the BUILDER, so every consumer of the L1
 * fold inherited the command's whole graph: REQ-146's boundary test named
 * `serve.ts`, `shot.ts`, `fs-store.ts` and `fs-reference-store.ts` as reachable
 * from the Worker the moment REQ-157's `check_fidelity` imported the structural
 * gate. The fold has always been portable; only its import was not.
 *
 * NOTHING CHANGED BUT THE FILE. The functions below are moved, not rewritten,
 * and `responsive-diff.ts` re-exports every one of them, so `1c responsive-diff`
 * and every existing caller reach exactly the code they always did.
 */
import { selectProjectionAtWidth } from './capture/values-diff'
import type { ValueElement, ValueManifest } from './capture/values-diff'
import type { ViewportName } from './capture/screenshot'

/** A named viewport column: the size label and the width it was measured at. */
export interface ResponsiveSize {
  name: string
  width: number
}

/** One node's value at one size — absent when the node is not in that column. */
export interface ResponsiveCell {
  size: string
  width: number
  present: boolean
  /** The captured element at this size, when present. */
  element?: ValueElement
}

/** One DOM node aligned across every size column. */
export interface ResponsiveRow {
  /** The join key the node aligned on (normalized text, or role for text-free). */
  key: string
  /** A human label — the node's verbatim text, or its role. */
  label: string
  role: string
  /** One cell per size, in the table's size order. */
  cells: ResponsiveCell[]
  /** True when the node is present in some columns but not all (a presence flip). */
  presenceFlips: boolean
  /** True when any tracked property differs across the columns the node is present in. */
  changed: boolean
}

/** The N-way per-node table across the requested sizes. */
export interface ResponsiveTable {
  sizes: ResponsiveSize[]
  rows: ResponsiveRow[]
}

/** One size's manifest, labelled with the size name it was projected at. */
export interface LabelledProjection {
  size: ResponsiveSize
  manifest: ValueManifest
}

/** Normalize text to a join key: lowercased, whitespace-collapsed, trimmed. */
function norm(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** The join key for an element — text-free nodes key on their role, not text. */
export function elementKey(el: ValueElement): string {
  if (el.textless) return `role:${el.a11yRole ?? el.role}`
  return `text:${norm(el.text)}`
}

/**
 * The properties whose change across sizes marks a row as `changed`. Deliberately
 * small: this is the discrete-state signal the AI acts on (a font step, a reflow,
 * a colour change), not an exhaustive style diff. Geometry is rounded so sub-pixel
 * layout jitter never reads as a change.
 */
function propertySignature(el: ValueElement): string {
  const box = el.box ? `${Math.round(el.box.x)},${Math.round(el.box.y)},${Math.round(el.box.width)},${Math.round(el.box.height)}` : '—'
  return [
    `fs=${el.fontSizePx}`,
    `fw=${el.fontWeight}`,
    `color=${el.color}`,
    `box=${box}`,
    `arr=${el.arrangement ?? '—'}`,
  ].join('|')
}

/**
 * REQ-366 — where an element sits down its page, as a fraction of that page's
 * extent (0 = top, 1 = bottom of the lowest captured box). Undefined when the
 * element carries no box. Page heights differ by thousands of pixels across a
 * ladder, so raw `y` cannot be compared between widths; the fraction can.
 */
function pagePositionOf(el: ValueElement, extent: number): number | undefined {
  if (!el.box || !(extent > 0)) return undefined
  return (el.box.y + el.box.height / 2) / extent
}

/** The lowest captured box edge in a manifest — the page extent {@link pagePositionOf} divides by. */
function pageExtentOf(manifest: ValueManifest): number {
  let extent = 0
  for (const el of manifest.elements) {
    if (el.box) extent = Math.max(extent, el.box.y + el.box.height)
  }
  return extent
}

/**
 * REQ-366 — align two occurrence lists of one key whose LENGTHS DIFFER.
 *
 * Returns `pairs[i] = j` (or -1) for each `a[i]`. Every element of the shorter
 * list is matched, the order of both lists is preserved, and among those
 * alignments the one whose matched pairs sit closest down the page wins. Ties go
 * to the earliest candidates, so where geometry cannot tell the occurrences apart
 * the result is exactly the document-order FIFO this replaced.
 */
function alignByPosition(a: (number | undefined)[], b: (number | undefined)[]): number[] {
  const n = a.length
  const m = b.length
  const cost = (i: number, j: number): number => {
    const x = a[i]
    const y = b[j]
    return x === undefined || y === undefined ? 0 : Math.abs(x - y)
  }
  // f[i][j] — the cheapest alignment of a[0..i) with b[0..j) that matches every
  // element of the shorter list's prefix; Infinity where that is impossible.
  const f: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity))
  f[0][0] = 0
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue
      let best = Infinity
      if (i > 0 && j > 0) best = f[i - 1][j - 1] + cost(i - 1, j - 1)
      // Skip an element of the LONGER list only — the shorter one is matched whole.
      if (n < m && j > 0) best = Math.min(best, f[i][j - 1])
      if (n > m && i > 0) best = Math.min(best, f[i - 1][j])
      f[i][j] = best
    }
  }
  const pairs = new Array<number>(n).fill(-1)
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    // Prefer skipping a TRAILING element: the matches then fall on the earliest
    // candidates whenever costs tie, which is the FIFO behaviour.
    if (n < m && j > 0 && f[i][j] === f[i][j - 1]) j--
    else if (n > m && i > 0 && f[i][j] === f[i - 1][j]) i--
    else {
      pairs[i - 1] = j - 1
      i--
      j--
    }
  }
  return pairs
}

/**
 * Build the N-way per-node table. Elements at each size are grouped into queues
 * by join key in document order, then aligned occurrence-by-occurrence across
 * sizes, so repeated identical texts pair in document order and a node missing
 * from one size leaves that column absent.
 *
 * REQ-366 — ONLY WHILE THE COUNT HOLDS. A label can occur once below a breakpoint
 * and twice above it: a primary nav that collapses into a hamburger on a phone,
 * repeating its links in a footer that never collapses. Pairing those by
 * document order made occurrence 0 the HEADER link at 1280 and the FOOTER link at
 * 320–1024, one row stitched across 4500px of page; the fold then built one node
 * from it and the footer's clipping container swallowed the header nav whole.
 * So when a key's count changes between adjacent sizes, the occurrences are
 * aligned by where they sit down the page ({@link alignByPosition}) and the one
 * with no counterpart starts (or ends) its own row: a presence flip, which is
 * what it is. Equal counts pair in document order exactly as before.
 */
export function buildResponsiveTable(projections: LabelledProjection[]): ResponsiveTable {
  const sizes = projections.map((p) => p.size)

  // Per-size queues keyed by join key, preserving document order.
  const perSize = projections.map((p) => {
    const queues = new Map<string, ValueElement[]>()
    for (const el of p.manifest.elements) {
      const key = elementKey(el)
      const q = queues.get(key)
      if (q) q.push(el)
      else queues.set(key, [el])
    }
    return queues
  })
  const extents = projections.map((p) => pageExtentOf(p.manifest))

  // The union of keys, in first-seen order across sizes (stable output order).
  const keyOrder: string[] = []
  const seen = new Set<string>()
  for (const queues of perSize) {
    for (const key of queues.keys()) {
      if (!seen.has(key)) {
        seen.add(key)
        keyOrder.push(key)
      }
    }
  }

  const rows: ResponsiveRow[] = []
  for (const key of keyOrder) {
    // One track per row: the element at each size index, plus the row's most
    // recent sighting (what the next size is aligned against).
    type Track = { at: (ValueElement | undefined)[]; last?: { el: ValueElement; si: number } }
    let tracks: Track[] = []
    perSize.forEach((queues, si) => {
      const cur = queues.get(key) ?? []
      if (!cur.length) return
      const live = tracks.filter((t) => t.last)
      const match: number[] =
        live.length === cur.length
          ? live.map((_, i) => i)
          : alignByPosition(
              live.map((t) => pagePositionOf(t.last!.el, extents[t.last!.si])),
              cur.map((el) => pagePositionOf(el, extents[si])),
            )
      const owner = new Map<number, Track>()
      match.forEach((j, i) => {
        if (j >= 0) owner.set(j, live[i])
      })
      // Rebuild the track order: existing tracks keep their relative order, and a
      // new one is inserted where its element falls in this size's document order.
      const next: Track[] = []
      const placed = new Set<Track>()
      let cursor = 0
      cur.forEach((el, j) => {
        let t = owner.get(j)
        if (t) {
          while (cursor < tracks.length && !placed.has(t)) {
            const u = tracks[cursor++]
            if (!placed.has(u)) {
              next.push(u)
              placed.add(u)
            }
          }
        } else {
          t = { at: new Array(projections.length).fill(undefined) }
          next.push(t)
          placed.add(t)
        }
        t.at[si] = el
        t.last = { el, si }
      })
      for (; cursor < tracks.length; cursor++) if (!placed.has(tracks[cursor])) next.push(tracks[cursor])
      tracks = next
    })

    for (const track of tracks) {
      const cells: ResponsiveCell[] = projections.map((p, si) => {
        const el = track.at[si]
        return { size: p.size.name, width: p.size.width, present: !!el, element: el }
      })
      const present = cells.filter((c) => c.element)
      const presenceFlips = present.length > 0 && present.length < cells.length
      const signatures = new Set(present.map((c) => propertySignature(c.element!)))
      const changed = presenceFlips || signatures.size > 1
      const sample = present[0]?.element
      const label = sample ? (sample.textless ? sample.a11yRole ?? sample.role : sample.text) : key
      rows.push({
        key,
        label,
        role: sample?.role ?? '',
        cells,
        presenceFlips,
        changed,
      })
    }
  }

  return { sizes, rows }
}

/**
 * How a node changes across sizes (REQ-61 Phase 2). Each maps to a distinct
 * reproduction move:
 *   - `value-step`    → a per-breakpoint value override (font 48→32, padding shrinks)
 *   - `presence-flip` → per-breakpoint visibility (a node departs / appears)
 *   - `layout-swap`   → module-internal responsive behaviour (row→stack, nav→hamburger)
 */
export type ResponsiveChangeKind = 'value-step' | 'presence-flip' | 'layout-swap'

/** One changed node classified, with the properties that drove the call. */
export interface RowClassification {
  row: ResponsiveRow
  kind: ResponsiveChangeKind
  /** The signals behind the classification (`presence`, `arrangement`, `fontSizePx`…). */
  signals: string[]
}

/** The classifier's output — only the rows that change, each labelled. */
export interface ClassifiedTable {
  sizes: ResponsiveSize[]
  classifications: RowClassification[]
}

/**
 * The scalar properties whose variation across sizes is a value-step. Geometry is
 * rounded so sub-pixel jitter never reads as a step; `arrangement` is handled
 * separately (it is the layout-swap signal, not a value).
 */
const VALUE_PROPS: { name: string; of: (el: ValueElement) => string }[] = [
  { name: 'fontSizePx', of: (el) => String(el.fontSizePx) },
  { name: 'fontWeight', of: (el) => String(el.fontWeight) },
  { name: 'color', of: (el) => el.color },
  { name: 'paddingLeftPx', of: (el) => String(el.paddingLeftPx ?? '—') },
  { name: 'lineHeightPx', of: (el) => String(el.lineHeightPx ?? '—') },
  { name: 'letterSpacingPx', of: (el) => String(el.letterSpacingPx ?? '—') },
  {
    name: 'box',
    of: (el) => (el.box ? `${Math.round(el.box.x)},${Math.round(el.box.y)},${Math.round(el.box.width)},${Math.round(el.box.height)}` : '—'),
  },
]

/** The properties (of {@link VALUE_PROPS} plus `arrangement`) that vary across the
 * columns a node is present in. */
function changedProperties(row: ResponsiveRow): string[] {
  const present = row.cells.map((c) => c.element).filter((e): e is ValueElement => !!e)
  if (present.length < 2) return []
  const changed: string[] = []
  for (const prop of VALUE_PROPS) {
    if (new Set(present.map(prop.of)).size > 1) changed.push(prop.name)
  }
  if (new Set(present.map((el) => el.arrangement ?? '—')).size > 1) changed.push('arrangement')
  return changed
}

/**
 * Classify each changed node into its reproduction move. Precedence follows how
 * structural the change is: a node that appears/departs is a `presence-flip`
 * (per-breakpoint visibility) regardless of what else differs; among nodes present
 * everywhere, an `arrangement` flip (row↔stack) is a `layout-swap` (module-internal
 * behaviour); anything else is a `value-step` (a per-breakpoint value override).
 * Steady nodes are omitted — the classifier reports only what the operator must act on.
 */
export function classifyResponsiveTable(table: ResponsiveTable): ClassifiedTable {
  const classifications: RowClassification[] = []
  for (const row of table.rows) {
    if (!row.changed) continue
    const props = changedProperties(row)
    if (row.presenceFlips) {
      classifications.push({ row, kind: 'presence-flip', signals: ['presence', ...props] })
    } else if (props.includes('arrangement')) {
      classifications.push({ row, kind: 'layout-swap', signals: props })
    } else {
      classifications.push({ row, kind: 'value-step', signals: props })
    }
  }
  return { sizes: table.sizes, classifications }
}

/**
 * Human rendering of the classifier — grouped by kind (presence flips and layout
 * swaps first, the structural moves; value steps last), each node with the signals
 * that drove its call. A clean site collapses to a single ✓ line.
 */
export function formatClassifiedTable(classified: ClassifiedTable): string {
  const order: ResponsiveChangeKind[] = ['presence-flip', 'layout-swap', 'value-step']
  const lines: string[] = [
    `responsive-diff classify: ${classified.classifications.length} changed node(s) across ${classified.sizes.length} size(s)`,
  ]
  if (classified.classifications.length === 0) {
    lines.push('  ✓ every node holds steady across all sizes')
    return lines.join('\n')
  }
  for (const kind of order) {
    const rows = classified.classifications.filter((c) => c.kind === kind)
    if (rows.length === 0) continue
    lines.push('')
    lines.push(`  ${kind} (${rows.length}):`)
    for (const c of rows) {
      lines.push(`    ${trunc(c.row.label).padEnd(32)} [${c.signals.join(', ')}]`)
    }
  }
  return lines.join('\n')
}

/** Truncate a label so a row stays one terminal line. */
function trunc(s: string, max = 32): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** A compact per-cell value for the human table — presence, font size, box. */
function cellText(cell: ResponsiveCell): string {
  if (!cell.element) return '—'
  const el = cell.element
  const box = el.box ? `${Math.round(el.box.width)}×${Math.round(el.box.height)}@${Math.round(el.box.x)},${Math.round(el.box.y)}` : ''
  return `${el.fontSizePx}px ${box}`.trim()
}

/**
 * Human rendering of the N-way table — changed rows first (the AI's focus), each
 * node's value across the size columns left-to-right, then a count of the rows
 * that hold steady across every size.
 */
export function formatResponsiveTable(table: ResponsiveTable): string {
  const header = table.sizes.map((s) => `${s.name}(${s.width})`).join('  ')
  const lines: string[] = [
    `responsive-diff: ${table.rows.length} node(s) across ${table.sizes.length} size(s)`,
    `  node ${' '.repeat(30)}${header}`,
  ]
  const changed = table.rows.filter((r) => r.changed)
  const steady = table.rows.filter((r) => !r.changed)

  if (changed.length > 0) {
    lines.push('')
    lines.push(`  ${changed.length} node(s) change across sizes:`)
    for (const r of changed) {
      const flag = r.presenceFlips ? '⚑' : '±'
      const cols = r.cells.map((c) => cellText(c).padEnd(14)).join(' ')
      lines.push(`  ${flag} ${trunc(r.label).padEnd(32)} ${cols}`)
    }
  }
  if (steady.length > 0) {
    lines.push('')
    lines.push(`  ✓ ${steady.length} node(s) hold steady across every size`)
  }
  return lines.join('\n')
}
