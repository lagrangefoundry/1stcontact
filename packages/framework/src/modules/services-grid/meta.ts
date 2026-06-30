import type { ModuleMeta } from '../types'
import { GAP_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/**
 * `services-grid` — a grid of service / offering cards. Both variants collapse
 * to a single column below the `md` breakpoint (DOC-7 §4.2 mobile-first).
 *
 * The `items` list is bounded 2..6: a single card is not a grid, and beyond six
 * the layout stops reading as a scannable grid. The bound is enforced at the
 * content-schema level via {@link validateModuleContent}.
 */
export const servicesGridMeta = {
  id: 'services-grid',
  version: 1,
  variants: ['three-col', 'two-col'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    gap: GAP_DIAL,
  },
  contentSchema: {
    heading: { type: 'string', required: false },
    subhead: { type: 'markdown', required: false },
    // Each item: { icon?: AssetRef | string, title, body (markdown), cta? }.
    items: { type: 'list', required: true, minItems: 2, maxItems: 6 },
  },
} as const satisfies ModuleMeta
