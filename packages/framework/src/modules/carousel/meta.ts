import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CARD_SURFACE_DIAL,
  CAROUSEL_CONTROLS_DIAL,
  CAROUSEL_VIEW_DIAL,
  CONTENT_WIDTH_DIAL,
  GAP_DIAL,
  HEADING_CASE_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
} from '../dials'

/**
 * `carousel` (REQ-79) — a horizontally-paged row of slides: a testimonial
 * rotator, a photo gallery, a logo strip, or a feature carousel. Generalized,
 * not testimonial-specific: a slide carries the same styled-run vocabulary as a
 * services-grid card (`image`, `title`, `subtitle`, `body`, `cta`) so any of
 * those content shapes maps onto it (a quote = `body`, its author = `title`,
 * their role = `subtitle`; a gallery = `image` + `title` caption; a logo strip =
 * `image` only).
 *
 * The track is a pure CSS `scroll-snap` row — genuinely swipeable / scrollable
 * with no client JS, honouring DOC-7's SSR-only rule. The `view` dial picks how
 * many slides show at once; `controls: dots` adds a decorative position
 * indicator (the real affordance is the scrollable track).
 */
export const carouselMeta = {
  id: 'carousel',
  version: 1,
  // Slides-per-view is the `view` dial, not a variant; the single variant keeps
  // the module's structural contract stable across content shapes.
  variants: ['default'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Slides per view — single / peek / multi (see CAROUSEL_VIEW_DIAL).
    view: CAROUSEL_VIEW_DIAL,
    // Gap between slides (REQ-58 absolute-or-overlay) — named step OR absolute px.
    gap: GAP_DIAL,
    // Slide chrome — `bare` strips the card fill/border/radius/padding.
    cardSurface: CARD_SURFACE_DIAL,
    // Pagination affordance — `dots` adds a decorative indicator row.
    controls: CAROUSEL_CONTROLS_DIAL,
    // Heading letter-case (REQ-36) — `upper` uppercases the section heading.
    headingCase: HEADING_CASE_DIAL,
    // Constrained content column (REQ-45) for the heading/subhead/track.
    contentWidth: CONTENT_WIDTH_DIAL,
    // Constrained-column alignment.
    contentAlign: ALIGN_DIAL,
    // Text alignment WITHIN each slide.
    align: ALIGN_DIAL,
  },
  contentSchema: {
    // Section heading (REQ-50 styled run) — e.g. "What people are saying".
    heading: { type: 'styled-text', required: false },
    // Prose intro — markdown + a style-only run.
    subhead: { type: 'markdown', required: false },
    subheadStyle: { type: 'styled-text', required: false },
    // Section-level CTA below the track — a styled run.
    cta: { type: 'styled-text', required: false },
    // Section band fill (REQ-79) — absolute `#hex` OR palette role, over the closed
    // `surface` enum (a band colour the four-value enum does not cover). Overrides
    // only the background-color; the `surface` class still sets the text colour.
    surfaceFill: { type: 'color', required: false },
    items: {
      type: 'list',
      required: true,
      minItems: 1,
      maxItems: 20,
      itemSchema: {
        // Slide media — an avatar (testimonial), photo (gallery), or logo.
        image: { type: 'asset-ref', required: false },
        // Primary styled run — author name / gallery caption.
        title: { type: 'styled-text', required: false },
        // Secondary styled run — author role, location, or detail.
        subtitle: { type: 'styled-text', required: false },
        // Slide prose (the quote / description) — markdown + a style-only run.
        body: { type: 'markdown', required: false },
        bodyStyle: { type: 'styled-text', required: false },
        // Slide CTA link — a styled run.
        cta: { type: 'styled-text', required: false },
        // Slide accent bar colour — absolute `#hex` OR palette role.
        accent: { type: 'color', required: false },
        // Raw slide fill — absolute `#hex` OR palette role, over the card surface.
        surfaceFill: { type: 'color', required: false },
      },
    },
  },
} as const satisfies ModuleMeta
