import type { ModuleMeta } from '../types'
import { ALIGN_DIAL, HEADING_TREATMENT_DIAL, HEIGHT_DIAL, SIZE_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/** `hero` — primary above-the-fold section. */
export const heroMeta = {
  id: 'hero',
  version: 1,
  variants: ['bg-color', 'bg-image'],
  dials: {
    size: SIZE_DIAL,
    align: ALIGN_DIAL,
    // Band height (`auto`/`fold`) — `fold` fills the viewport to the fold.
    height: HEIGHT_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Heading colour treatment (REQ-28) — independent of the surface text
    // colour, so a hero can carry e.g. a gold heading over an inverse band.
    headingTreatment: HEADING_TREATMENT_DIAL,
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
