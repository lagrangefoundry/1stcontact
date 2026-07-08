import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_WIDTH_DIAL,
  HEADING_COLOR_DIAL,
  SIZE_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
} from '../dials'

/**
 * `text-block` — prose / manifesto section. The canonical graceful-degradation
 * fallback for prose-shaped content (DOC-7 §7.4): its markdown `body` carries
 * headings, lists, links, images, blockquotes, and code.
 *
 * Container width is dictated by the variant, not a dial — that is what keeps
 * the two variants meaningful: `prose` is narrow (article column), `landing` is
 * the default width (marketing breathing room).
 */
export const textBlockMeta = {
  id: 'text-block',
  version: 1,
  variants: ['prose', 'landing'],
  dials: {
    size: SIZE_DIAL,
    align: ALIGN_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    textAlign: ALIGN_DIAL,
    // Heading colour treatment (REQ-36) — `accent`/`gold` colour the section
    // heading (the joyfulculinary gold headings); `plain` (default) inherits the
    // band colour, so a section that omits the dial is unchanged.
    headingTreatment: HEADING_COLOR_DIAL,
    // Constrained content column (REQ-45) — caps the content within the section
    // frame; the `align` dial then pins it left (default) or centres it. A
    // narrow left-pinned measure wraps prose like the reference, collapsing
    // cumulative vertical drift. `default` leaves the variant width unchanged.
    contentWidth: CONTENT_WIDTH_DIAL,
  },
  contentSchema: {
    heading: { type: 'string', required: false },
    body: { type: 'markdown', required: true },
  },
} as const satisfies ModuleMeta
