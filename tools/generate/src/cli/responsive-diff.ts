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
 *
 * REQ-157 — the TABLE ITSELF moved to `responsive-table.ts`; what is left here is
 * the command. See that file for why: `l1/fold.ts` imports the builder, so the
 * command's `node:fs` graph was reaching every consumer of the L1 fold.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { readMultiState, selectProjectionAtWidth } from './capture'
import { fsReferenceBundle } from '../store/fs-reference-store'
import { VIEWPORTS, type ViewportName } from './shot'
import { buildResponsiveTable } from './responsive-table'
import type { LabelledProjection, ResponsiveTable } from './responsive-table'

// Re-exported so no caller moved with the split.
export {
  buildResponsiveTable,
  classifyResponsiveTable,
  elementKey,
  formatClassifiedTable,
  formatResponsiveTable,
} from './responsive-table'
export type {
  ClassifiedTable,
  LabelledProjection,
  ResponsiveCell,
  ResponsiveChangeKind,
  ResponsiveRow,
  ResponsiveSize,
  ResponsiveTable,
  RowClassification,
} from './responsive-table'

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
export async function cmdResponsiveDiff(opts: ResponsiveDiffOptions): Promise<ResponsiveTable> {
  // REQ-155 — `--ref` is a directory the operator typed, so the handle is the
  // filesystem one. What moved is the *read*, not the argument (AC6).
  const reference = await readMultiState(fsReferenceBundle(opts.refBundleDir))
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
