/**
 * `1c responsive-diff` — the responsive analysis eye (REQ-61).
 *
 * A standalone analysis of ONE site across sizes (NOT a reproduction-vs-target
 * comparison). It reads the per-width value manifests a capture already persisted
 * (`multistate.json`) and lines them up into an **N-way per-node table**: one row
 * per DOM node, one column per size, so each node's value trajectory reads
 * left-to-right. That artifact is what the AI reads to author per-breakpoint
 * overrides, and what the change-classifier (Phase 2) runs over.
 *
 * The objective is "looks the same at each of the N sizes", not fidelity to the
 * transitions between them — so this captures the *discrete* state at each size
 * and never tries to infer a continuous relationship. For CSS-responsive design
 * it is one shared DOM across all sizes, so the same node aligns by its join key
 * (normalized text, or `a11yRole`/`role` for text-free nodes) in document order;
 * a node that departs on mobile is simply absent from that column (a presence
 * flip), and a nav that collapses to a hamburger shows up as two presence flips.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { readMultiState, selectProjectionAtWidth, type ValueElement, type ValueManifest } from './capture'
import { VIEWPORTS, type ViewportName } from './shot'

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
function elementKey(el: ValueElement): string {
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
 * Build the N-way per-node table. Elements at each size are grouped into FIFO
 * queues by join key (mirroring the values-diff pairing), then aligned
 * occurrence-by-occurrence across sizes — so repeated identical texts pair in
 * document order and a node missing from one size leaves that column absent.
 */
export function buildResponsiveTable(projections: LabelledProjection[]): ResponsiveTable {
  const sizes = projections.map((p) => p.size)

  // Per-size FIFO queues keyed by join key, preserving document order.
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
    // How many occurrences of this key exist at the size that has the most (a
    // node present at every size occurs once per size; a repeated text N times).
    const occurrences = Math.max(...perSize.map((q) => q.get(key)?.length ?? 0))
    for (let i = 0; i < occurrences; i++) {
      const cells: ResponsiveCell[] = projections.map((p, si) => {
        const el = perSize[si].get(key)?.[i]
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

export interface ResponsiveDiffOptions {
  /** Capture bundle directory whose persisted ladder (`multistate.json`) is analysed. */
  refBundleDir: string
  /** Named sizes to line up, in table order (default `mobile`, `tablet`, `desktop`). */
  sizes?: ViewportName[]
  /** Write the table JSON here in addition to returning it. */
  out?: string
}

/**
 * REQ-61 — the `1c responsive-diff` command. Reads a capture's persisted viewport
 * ladder and lines up the projections at the requested named sizes into the N-way
 * per-node table. A bundle with no ladder is a STALE REFERENCE (terminal-fail with
 * re-capture guidance); a ladder that never reached a requested width fails loudly
 * with the widths it does carry — never silently drop a column.
 */
export function cmdResponsiveDiff(opts: ResponsiveDiffOptions): ResponsiveTable {
  const reference = readMultiState(opts.refBundleDir)
  if (!reference || reference.projections.length === 0) {
    throw new Error(
      `responsive-diff needs a multi-viewport reference, but '${opts.refBundleDir}' has no multistate.json ` +
        `(or it is empty). Re-capture with '1c capture page <url>' to persist the reference across the viewport ` +
        `ladder, then re-run.`,
    )
  }
  const sizeNames = opts.sizes ?? ['mobile', 'tablet', 'desktop']
  const projections: LabelledProjection[] = sizeNames.map((name) => {
    const width = VIEWPORTS[name].width
    const projection = selectProjectionAtWidth(reference, width)
    if (!projection) {
      const widths = [...new Set(reference.projections.map((p) => p.viewport.width))].sort((a, b) => a - b)
      throw new Error(
        `responsive-diff: reference has no projection at width ${width}px for size '${name}' ` +
          `(ladder carries ${widths.join(', ')}). Re-capture to include ${width}px, then re-run.`,
      )
    }
    return { size: { name, width }, manifest: projection.manifest }
  })

  const table = buildResponsiveTable(projections)
  if (opts.out) writeFileSync(path.resolve(opts.out), JSON.stringify(table, null, 2))
  return table
}

// ── Phase 2 — the change classifier ───────────────────────────────────────────

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
