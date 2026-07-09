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

/** Structural CSS for the partial-width band row. Static for every site. */
export const ROW_CSS = `/* partial-width band row (REQ-20 / REQ-36) */
.fc-row {
  max-width: var(--container-default);
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
}

/** The surface every column shares, or `undefined` if they disagree (or none
 *  declared one). Only a unanimous, non-default surface earns a full-bleed band. */
function sharedSurface(columns: RowColumn[]): string | undefined {
  const first = columns[0]?.surface
  if (!first || first === 'default') return undefined
  return columns.every((c) => c.surface === first) ? first : undefined
}

/** Wrap a run of consecutive partial-width bands into one row, each column's
 *  flex-grow encoding its width so a row can carry an asymmetric ratio. When the
 *  columns share one surface, a full-bleed `fc-band` paints it behind the row so
 *  the gap and margins read as one continuous band (not page-white). */
export function composeRow(columns: RowColumn[]): string {
  const cols = columns
    .map((c) => `<div class="fc-col fc-col--${c.width}">${c.html}</div>`)
    .join('\n')
  const row = `<div class="fc-row">${cols}</div>`
  const surface = sharedSurface(columns)
  return surface ? `<div class="fc-band surface-${surface}">${row}</div>` : row
}
