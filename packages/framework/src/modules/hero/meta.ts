import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_ANCHOR_DIAL,
  CONTENT_COLUMN_DIAL,
  CONTENT_INSET_DIAL,
  CONTENT_OFFSET_TOP_DIAL,
  CONTENT_WIDTH_DIAL,
  CTA_SHAPE_DIAL,
  HEADING_CASE_DIAL,
  HERO_DIVIDER_DIAL,
  HEIGHT_DIAL,
  SCRIM_DIAL,
  SCRIM_GRADIENT_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
} from '../dials'

/**
 * `hero` — primary above-the-fold section.
 *
 * REQ-50: every intrinsic typography/colour axis (family, size, weight, colour,
 * tracking, leading, gradient) is now carried on the text slots themselves as
 * flat *styled runs* (`eyebrow`/`heading`/`subhead`/`cta`), named after the
 * fidelity report's `ValueElement` fields. Only *structural* dials remain — band
 * layout, height, scrim, shape, letter-case, column/width/inset positioning.
 */
export const heroMeta = {
  id: 'hero',
  version: 2,
  variants: ['bg-color', 'bg-image'],
  dials: {
    align: ALIGN_DIAL,
    // Band height (`auto`/`fold`) — `fold` fills the viewport to the fold.
    height: HEIGHT_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Heading letter-case (REQ-36) — `upper` uppercases the heading at render
    // time while the DOM text stays literal (text-transform is not a report
    // field, so it stays a treatment and the verbatim-text check stays clean).
    headingCase: HEADING_CASE_DIAL,
    // CTA corner shape (REQ-36) — `round` (default) pill, `square` hard-corner,
    // `soft` the reference's barely-rounded 2px button. Shape, not typography.
    ctaShape: CTA_SHAPE_DIAL,
    // Top-of-band gradient scrim (REQ-36) — `top` darkens the band's top edge
    // (behind the nav) for legibility; `none` (default) omits it.
    scrimGradient: SCRIM_GRADIENT_DIAL,
    // Divider rule between heading and subhead (REQ-36) — `rule` draws the
    // joyfulculinary hero's short rule under the heading; `none` (default) omits.
    divider: HERO_DIVIDER_DIAL,
    // Content-column horizontal placement (REQ-36) — `left` hugs the band's left
    // gutter; `center` (default) keeps the centred column. Distinct from `align`,
    // which sets text alignment within the column.
    contentColumn: CONTENT_COLUMN_DIAL,
    // Legibility scrim over the background image (REQ-32) — a dark-tint opacity
    // step so overlaid text stays readable on a busy image.
    scrim: SCRIM_DIAL,
    // Vertical anchor of the content within a `fold` band (REQ-32).
    contentAnchor: CONTENT_ANCHOR_DIAL,
    // Fixed top inset for the content within a `fold` band (REQ-49).
    contentOffsetTop: CONTENT_OFFSET_TOP_DIAL,
    // Subhead/body content-column width (REQ-49) — caps the lead/body measure
    // (container scale, incl. the `readable` 768px step); `default` fills the
    // inner frame.
    contentWidth: CONTENT_WIDTH_DIAL,
    // Content horizontal inset / gutter (REQ-49 cap 5) — the `.hero__inner`
    // padding-inline as a token step; aligns the front-door left edge.
    contentInset: CONTENT_INSET_DIAL,
    // Foreground portrait shape (REQ-36) — crops a supplied `portrait` image.
    portraitShape: ['circle', 'square'],
  },
  contentSchema: {
    // Styled runs (REQ-50) — each carries its own text + intrinsic style
    // (fontFamily/fontSizePx/fontWeight/color/letterSpacingPx/lineHeightPx/
    // gradient), a literal in the report's unit or a theme alias per axis.
    eyebrow: { type: 'styled-text', required: false },
    heading: { type: 'styled-text', required: true },
    // One styled run — hero prose no longer splits lead/body; multi-paragraph
    // copy is authored as a `text-block` (REQ-50).
    subhead: { type: 'styled-text', required: false },
    // Styled run carrying `label` + `href` + the button's own intrinsic style.
    cta: { type: 'styled-text', required: false },
    // Required for the `bg-image` variant only (enforced by the variant branch).
    image: { type: 'asset-ref', required: false },
    // Optional foreground portrait (REQ-36) — a testimonial/attribution avatar
    // rendered above the subhead.
    portrait: { type: 'asset-ref', required: false },
  },
} as const satisfies ModuleMeta
