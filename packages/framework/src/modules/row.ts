/**
 * Half-width band row (REQ-20, gigabytealchemy import).
 *
 * Consecutive module instances carrying `dials.width === 'half'` are grouped by
 * the render pipeline into a single `fc-row` wrapper (see `renderModules`), so
 * two bands — e.g. a subscribe form and a contact form — sit side by side as
 * two columns rather than stacking. The wrapper supplies the container width and
 * the inter-column gutter; each child flexes to fill its column and relaxes its
 * own inner container (see the module's `width-half` rule). On narrow viewports
 * the row stacks back to one column.
 *
 * As with the overlay band (REQ-25), the only CSS here is a static,
 * per-site-identical structural block — no instance-supplied CSS reaches the
 * page.
 */

/** Structural CSS for the half-width band row. Static for every site. */
export const ROW_CSS = `/* half-width band row (REQ-20) */
.fc-row {
  max-width: var(--container-default);
  margin-inline: auto;
  padding-inline: var(--space-4);
  display: flex;
  gap: var(--space-8);
  align-items: flex-start;
}
.fc-row > * { flex: 1 1 0; min-width: 0; }
@media (max-width: 768px) {
  .fc-row { flex-direction: column; }
}`

/** Wrap a run of consecutive half-width bands into one row. */
export function composeRow(bands: string[]): string {
  return `<div class="fc-row">${bands.join('\n')}</div>`
}
