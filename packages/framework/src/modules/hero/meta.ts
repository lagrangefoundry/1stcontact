import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_ANCHOR_DIAL,
  GRADIENT_DIRECTION_DIAL,
  HEADING_TREATMENT_DIAL,
  HEIGHT_DIAL,
  SCRIM_DIAL,
  SIZE_DIAL,
  SPACING_DIAL,
  SUBHEAD_COLOR_DIAL,
  SUBHEAD_SIZE_DIAL,
  SURFACE_DIAL,
  TREATMENT_ROLE_DIAL,
} from '../dials'

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
    // Legibility scrim over the background image (REQ-32) — a dark-tint opacity
    // step so overlaid text stays readable on a busy image.
    scrim: SCRIM_DIAL,
    // Vertical anchor of the content within a `fold` band (REQ-32).
    contentAnchor: CONTENT_ANCHOR_DIAL,
    // Subhead/body colour (REQ-33) — tints the whole subhead block a palette
    // role (e.g. a gold lead paragraph), independent of the surface text colour.
    subheadColor: SUBHEAD_COLOR_DIAL,
    // Subhead/body scale (REQ-33) — sizes the lead + body copy independently of
    // the heading `size`, for a prominent lead subtitle under a modest heading.
    subheadSize: SUBHEAD_SIZE_DIAL,
  },
  contentSchema: {
    eyebrow: { type: 'string', required: false },
    heading: { type: 'string', required: true },
    subhead: { type: 'markdown', required: true },
    // { label, href } — rendered only when present.
    cta: { type: 'object', required: false },
    // Required for the `bg-image` variant only (enforced by the variant branch).
    image: { type: 'asset-ref', required: false },
    // Structured gradient for the `gradient` headingTreatment (REQ-32): a
    // direction plus ≥2 palette-role stops. Read only when the treatment
    // dial is `gradient`.
    headingGradient: {
      type: 'object',
      required: false,
      itemSchema: {
        direction: { type: 'enum', required: true, values: GRADIENT_DIRECTION_DIAL },
        stops: {
          type: 'list',
          required: true,
          minItems: 2,
          itemSchema: {
            role: { type: 'enum', required: true, values: TREATMENT_ROLE_DIAL },
          },
        },
      },
    },
  },
} as const satisfies ModuleMeta
