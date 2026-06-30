import type { ModuleMeta } from '../types'
import { ALIGN_DIAL, SIZE_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/** `hero` — primary above-the-fold section. */
export const heroMeta = {
  id: 'hero',
  version: 1,
  variants: ['bg-color', 'bg-image'],
  dials: {
    size: SIZE_DIAL,
    align: ALIGN_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
  },
  contentSchema: {
    eyebrow: { type: 'string', required: false },
    heading: { type: 'string', required: true },
    subhead: { type: 'markdown', required: true },
    // { label, href } — rendered only when present.
    cta: { type: 'object', required: false },
    // Required for the `bg-image` variant only (enforced by the variant branch).
    image: { type: 'asset-ref', required: false },
  },
} as const satisfies ModuleMeta
