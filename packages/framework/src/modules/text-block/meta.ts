import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CONTENT_WIDTH_DIAL,
  CTA_SHAPE_DIAL,
  HEADING_CASE_DIAL,
  LIST_MARKER_DIAL,
  PANEL_CORNER_DIAL,
  PANEL_DIAL,
  PANEL_PAD_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
  WIDTH_DIAL,
} from '../dials'

/**
 * `text-block` — prose / manifesto section. The canonical graceful-degradation
 * fallback for prose-shaped content (DOC-7 §7.4): its markdown `body` carries
 * headings, lists, links, images, blockquotes, and code.
 *
 * REQ-50: the discrete `heading` slot and the `cta` are flat styled runs; the
 * markdown `body` stays prose (it flattens into many report elements, so it
 * can't be one run) and takes its block-level typography from a style-only
 * `bodyStyle` run applied to the prose container. Container width is dictated by
 * the variant, not a dial.
 */
export const textBlockMeta = {
  id: 'text-block',
  version: 2,
  variants: ['prose', 'landing'],
  dials: {
    align: ALIGN_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    textAlign: ALIGN_DIAL,
    // Heading letter-case (REQ-36) — `upper` uppercases the rendered heading
    // while the DOM text stays literal.
    headingCase: HEADING_CASE_DIAL,
    // Heading text-alignment (REQ-36), independent of the block/body `align` —
    // the reference centres the section heading over a left-aligned body.
    headingAlign: ALIGN_DIAL,
    // Contained-panel treatment (REQ-36) — `none` (default) fills the band; a role
    // value makes the inner a padded, rounded, inset card in that palette role.
    panel: PANEL_DIAL,
    // Panel corner shape (REQ-36) — `rounded` (default); `square` hard-corners.
    panelCorner: PANEL_CORNER_DIAL,
    // Panel vertical padding (REQ-36) — `lg`/`xl` deepen a contained panel.
    panelPad: PANEL_PAD_DIAL,
    // Body list marker (REQ-36) — `check` = accent ✓; `bullet` (default). A
    // treatment, not a report field, so it stays a dial (like `headingCase`).
    listMarker: LIST_MARKER_DIAL,
    // Partial-width row grouping (REQ-20; REQ-36 ratios).
    width: WIDTH_DIAL,
    // Row content measure (REQ-36) — boxes a partial-width row to a centred measure.
    rowWidth: CONTENT_WIDTH_DIAL,
    // Constrained content column (REQ-45) — caps content within the section frame.
    contentWidth: CONTENT_WIDTH_DIAL,
    // CTA button corner shape (REQ-36) — read only when `content.cta` is present.
    ctaShape: CTA_SHAPE_DIAL,
  },
  contentSchema: {
    // Discrete styled run (REQ-50).
    heading: { type: 'styled-text', required: false },
    // Prose stays markdown (REQ-50).
    body: { type: 'markdown', required: true },
    // Block-level typography for the prose (REQ-50): a style-only styled run
    // (no `text`) whose resolved style is applied to the `body` container, so the
    // whole prose block inherits family/size/weight/colour/leading.
    bodyStyle: { type: 'styled-text', required: false },
    // Optional CTA button below the body (REQ-36) — a styled run carrying
    // `label` + `href` + its own intrinsic style.
    cta: { type: 'styled-text', required: false },
    // Gradient panel fill (REQ-62) — a `{ angleDeg, stops }` gradient painted as
    // the contained panel's background (the gradient analogue of the solid `panel`
    // dial). When present it makes the inner a padded, rounded panel with a
    // gradient surface, reproducing a captured `surfaceGradient`.
    panelGradient: { type: 'gradient', required: false },
    // Section band fill (REQ-79) — an absolute `#hex` value OR a palette role, over
    // the closed `surface` enum. The section analogue of the card-level `surfaceFill`
    // (services-grid/carousel), for a band colour (e.g. a mid-grey) the four-value
    // enum does not cover. Overrides only the background-color; the `surface` class
    // still sets the text colour.
    surfaceFill: { type: 'color', required: false },
  },
} as const satisfies ModuleMeta
