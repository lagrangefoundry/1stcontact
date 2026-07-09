import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_WIDTH_DIAL,
  HEADING_CASE_DIAL,
  HEADING_COLOR_DIAL,
  HEADING_SIZE_DIAL,
  HEADING_WEIGHT_DIAL,
  LINE_HEIGHT_DIAL,
  LIST_MARKER_DIAL,
  PANEL_DIAL,
  SIZE_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
  WIDTH_DIAL,
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
    // Heading letter-case (REQ-36) — `upper` uppercases the rendered heading
    // while the DOM text stays literal.
    headingCase: HEADING_CASE_DIAL,
    // Heading font-weight (REQ-36) — `bold` (default) preserves the prior weight;
    // lighter steps reach the extralight/light section headings (Oswald 200–300).
    headingWeight: HEADING_WEIGHT_DIAL,
    // Heading font-size step (REQ-36), independent of the body `size` dial —
    // `md` (default = 3xl) preserves the prior heading size; `lg`/`xl` step up
    // (the joyfulculinary headings are `lg` = 4xl = 44px).
    headingSize: HEADING_SIZE_DIAL,
    // Heading text-alignment (REQ-36), independent of the block/body `align` —
    // the reference centres the section heading over a left-aligned body. `start`
    // (default) inherits the block alignment, so an omitting section is unchanged.
    headingAlign: ALIGN_DIAL,
    // Body line-height (REQ-36) — `relaxed` (default) preserves the prior leading;
    // tighter steps match a reference's denser body (the joyfulculinary body is
    // ~snug), collapsing the cumulative vertical drift a loose default injects.
    leading: LINE_HEIGHT_DIAL,
    // Contained-panel treatment (REQ-36) — `none` (default) fills the band; a role
    // value makes the inner a padded, rounded, inset card in that palette role
    // (the grey Holistic card, the grey-green testimonial panel).
    panel: PANEL_DIAL,
    // Body list marker (REQ-36) — `check` replaces bullets with an accent ✓ (the
    // "Who Uses Our Services" checklist); `bullet` (default) is unchanged.
    listMarker: LIST_MARKER_DIAL,
    // Partial-width row grouping (REQ-20; REQ-36 ratios) — `full` (default) is a
    // normal band; `half`/`third`/`two-thirds` group with adjacent partial bands
    // into one `fc-row` (the Offerings text column beside the card grid).
    width: WIDTH_DIAL,
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
