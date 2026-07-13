/**
 * Partial-width band row (REQ-20, gigabytealchemy import; REQ-36 ratios).
 *
 * Consecutive module instances carrying a partial `dials.width` (`half`, `third`,
 * `two-thirds`) are grouped by the render pipeline into a single `fc-row` wrapper
 * (see `renderModules`), so the bands sit side by side as columns rather than
 * stacking. Each band is wrapped in an `fc-col` whose flex-grow encodes its width
 * — `half`/`third` grow 1, `two-thirds` grows 2 — so a `third` + `two-thirds` run
 * splits ~33/67 (the joyfulculinary Offerings: a narrow text column beside a wide
 * card grid) while a `half` + `half` run stays 50/50 (unchanged). On narrow
 * viewports the row stacks back to one column.
 *
 * As with the overlay band (REQ-25), the only CSS here is a static,
 * per-site-identical structural block — no instance-supplied CSS reaches the page.
 */

import { resolveContainerWidth } from './dials'

/** Structural CSS for the partial-width band row. Static for every site. */
export const ROW_CSS = `/* partial-width band row (REQ-20 / REQ-36) */
.fc-row {
  /* Row content measure (REQ-36 capability, REQ-55 mechanism) — a shared rowWidth
     dial boxes the row to --fc-row-width (a named-step token or a literal, set
     inline by composeRow); absent, the row fills the default 6xl (1152px) content
     frame, as it did before. */
  max-width: var(--fc-row-width, var(--container-6xl));
  margin-inline: auto;
  padding-inline: var(--space-4);
  display: flex;
  gap: var(--space-8);
  align-items: flex-start;
}
.fc-col { flex: 1 1 0; min-width: 0; }
.fc-col--two-thirds { flex-grow: 2; }
@media (max-width: 768px) {
  .fc-row { flex-direction: column; }
}
/* Full-bleed band behind a row whose columns share one surface (REQ-36). The
   columns each fill only their own box; without this, page-white shows through
   the inter-column gap and the outer margins where the reference is one
   continuous band. The band paints the shared surface edge-to-edge; the columns'
   own (same-colour) fills sit on top seamlessly. */
.fc-band { width: 100%; }
.fc-band.surface-subtle { background: var(--color-surface-subtle); }
.fc-band.surface-inverse { background: var(--color-surface-inverse); }
.fc-band.surface-accent { background: var(--color-accent); }
.fc-band.surface-secondary { background: var(--color-secondary); }`

/** A band paired with its partial width, for row composition. */
export interface RowColumn {
  html: string
  width: string
  /** The column module's `surface` dial, if any — used to paint a shared
   *  full-bleed band behind the row when every column agrees. */
  surface?: string
  /** The column module's `rowWidth` dial, if any — boxes the whole row to a
   *  narrower centred content measure (first column to declare one wins). A
   *  named step, or a literal (`px` number / CSS length string) — REQ-55. */
  rowWidth?: string | number
}

/** The surface every column shares, or `undefined` if they disagree (or none
 *  declared one). Only a unanimous, non-default surface earns a full-bleed band. */
function sharedSurface(columns: RowColumn[]): string | undefined {
  const first = columns[0]?.surface
  if (!first || first === 'default') return undefined
  return columns.every((c) => c.surface === first) ? first : undefined
}

/** The row's content measure — the first column to declare a non-`bleed`
 *  `rowWidth`, else `undefined` (the full-bleed default). */
function rowMeasure(columns: RowColumn[]): string | number | undefined {
  return columns.map((c) => c.rowWidth).find((v) => v !== undefined && v !== '' && v !== 'bleed')
}

/** Wrap a run of consecutive partial-width bands into one row, each column's
 *  flex-grow encoding its width so a row can carry an asymmetric ratio. When the
 *  columns share one surface, a full-bleed `fc-band` paints it behind the row so
 *  the gap and margins read as one continuous band (not page-white). A shared
 *  `rowWidth` boxes the row to a narrower centred measure. */
export function composeRow(columns: RowColumn[]): string {
  const cols = columns
    .map((c) => `<div class="fc-col fc-col--${c.width}">${c.html}</div>`)
    .join('\n')
  const measureCss = resolveContainerWidth(rowMeasure(columns))
  const rowStyle = measureCss ? ` style="--fc-row-width: ${measureCss}"` : ''
  const row = `<div class="fc-row"${rowStyle}>${cols}</div>`
  const surface = sharedSurface(columns)
  return surface ? `<div class="fc-band surface-${surface}">${row}</div>` : row
}
