import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_ANCHOR_DIAL,
  CONTENT_INSET_DIAL,
  CONTENT_OFFSET_TOP_DIAL,
  CONTENT_WIDTH_DIAL,
  GRADIENT_DIRECTION_DIAL,
  HEADING_CASE_DIAL,
  HEADING_TREATMENT_DIAL,
  HEIGHT_DIAL,
  LINE_HEIGHT_DIAL,
  SCRIM_DIAL,
  SIZE_DIAL,
  SPACING_DIAL,
  SUBHEAD_COLOR_DIAL,
  SUBHEAD_SIZE_DIAL,
  SUBHEAD_WEIGHT_DIAL,
  SURFACE_DIAL,
  TRACKING_DIAL,
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
    // Heading letter-case (REQ-36) — `upper` uppercases the heading at render
    // time while the DOM text stays literal (the joyfulculinary hero types
    // mixed-case and uppercases via CSS).
    headingCase: HEADING_CASE_DIAL,
    // Legibility scrim over the background image (REQ-32) — a dark-tint opacity
    // step so overlaid text stays readable on a busy image.
    scrim: SCRIM_DIAL,
    // Vertical anchor of the content within a `fold` band (REQ-32).
    contentAnchor: CONTENT_ANCHOR_DIAL,
    // Fixed top inset for the content within a `fold` band (REQ-49) — pins the
    // content a deliberate token-backed distance from the band top (the
    // reference `pt-80`), a separate axis from the flex `contentAnchor`. `none`
    // (default) applies no inset.
    contentOffsetTop: CONTENT_OFFSET_TOP_DIAL,
    // Subhead/body colour (REQ-33) — tints the whole subhead block a palette
    // role (e.g. a gold lead paragraph), independent of the surface text colour.
    subheadColor: SUBHEAD_COLOR_DIAL,
    // Subhead/body scale (REQ-33) — sizes the lead + body copy independently of
    // the heading `size`, for a prominent lead subtitle under a modest heading.
    subheadSize: SUBHEAD_SIZE_DIAL,
    // Subhead/body content-column width (REQ-49) — caps the lead/body measure
    // (reusing the shared `contentWidth` container scale, incl. the `readable`
    // 768px step) so it can match a reference's column; `default` fills the inner
    // frame (prior behaviour was a hardcoded 60ch — now removed).
    contentWidth: CONTENT_WIDTH_DIAL,
    // Content horizontal inset / gutter (REQ-49 cap 5) — the `.hero__inner`
    // padding-inline as a token step; `sm` (default) is the prior 16px, `md`
    // 24px (the reference `px-6`), `lg` 32px. Aligns the front-door left edge.
    contentInset: CONTENT_INSET_DIAL,
    // Subhead/body font-weight (REQ-49) — sets the lead/body weight independently
    // of the heading; `regular` (default) keeps the inherited body weight,
    // `light` gives a delicate lead (e.g. gigabytealchemy's `font-light`).
    subheadWeight: SUBHEAD_WEIGHT_DIAL,
    // Heading letter-spacing (REQ-45) — `normal` (default) leaves the heading
    // untracked; `tight`/`tighter` pull a large display heading's glyphs in.
    tracking: TRACKING_DIAL,
    // Subhead line-height (REQ-45; `snug` added REQ-49) — set the lead/body
    // leading independently of the global relaxed default; `relaxed` (default)
    // preserves the prior value, `snug` (~1.33) is the intermediate step.
    subheadLeading: LINE_HEIGHT_DIAL,
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
