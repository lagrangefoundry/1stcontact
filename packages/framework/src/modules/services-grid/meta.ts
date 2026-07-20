import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CARD_BORDER_DIAL,
  CARD_SURFACE_DIAL,
  CARD_VEIL_DIAL,
  CONTENT_WIDTH_DIAL,
  GAP_DIAL,
  HEADING_CASE_DIAL,
  ICON_FONT_DIAL,
  ICON_LAYOUT_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
  WIDTH_DIAL,
} from '../dials'

/**
 * Status-badge colour variant (REQ-26). Semantic, token-backed — never a raw
 * colour. All variants render as a soft pill; the card's checklist ✓ ticks
 * follow the badge variant's colour.
 */
export const BADGE_VARIANT = ['neutral', 'primary', 'accent', 'secondary'] as const

/**
 * Card fill (REQ-20, REQ-32). `default` is the standard surface card; `muted`/
 * `neutral-cool` are filled neutral panels. Token-backed, never a raw colour.
 */
export const CARD_SURFACE = ['default', 'muted', 'neutral-cool'] as const

/**
 * `services-grid` — a grid of service / offering cards. Both multi-col variants
 * collapse to a single column below the `md` breakpoint (DOC-7 §4.2).
 *
 * REQ-50: the grid `heading`, each card `title`, and the CTAs are flat styled
 * runs (the former `headingTreatment`/`cardTitleWeight`/`cardTitleFont`/`size`
 * dials collapse onto each run's own `color`/`fontWeight`/`fontFamily`/
 * `fontSizePx`). Prose (`subhead`, card `body`) stays markdown and takes its
 * typography from a style-only run. The card *chrome* — accent border, status
 * badge, checklist ticks, icon — stays structural (closed, token-backed dials).
 */
export const servicesGridMeta = {
  id: 'services-grid',
  version: 2,
  variants: ['three-col', 'two-col', 'stacked'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    gap: GAP_DIAL,
    // Partial-width row grouping (REQ-20; REQ-36 ratios).
    width: WIDTH_DIAL,
    // Row content measure (REQ-36).
    rowWidth: CONTENT_WIDTH_DIAL,
    // Grid-wide card chrome (REQ-36 / CAP-1) — `bare` strips the card fill/
    // border/radius/padding; `default` leaves cards unchanged.
    cardSurface: CARD_SURFACE_DIAL,
    // Frosted card fill (REQ-58) — a translucent white veil over the band at the
    // given opacity, instead of the solid `--color-surface`. `none` (default) off.
    cardVeil: CARD_VEIL_DIAL,
    // Card border (REQ-58) — `none` drops the 1px hairline for the frosted look.
    cardBorder: CARD_BORDER_DIAL,
    // Heading letter-case (REQ-36) — `upper` uppercases the grid heading + card
    // titles while the DOM text stays literal.
    headingCase: HEADING_CASE_DIAL,
    // Icon rendering (REQ-36) — `icon-font` renders a string card icon as a glyph.
    iconFont: ICON_FONT_DIAL,
    // Card icon layout (REQ-36) — `left` sets the icon beside the title.
    iconLayout: ICON_LAYOUT_DIAL,
    // Constrained content column (REQ-45).
    contentWidth: CONTENT_WIDTH_DIAL,
    // Constrained-column alignment (REQ-36).
    contentAlign: ALIGN_DIAL,
  },
  contentSchema: {
    // Discrete styled run (REQ-50).
    heading: { type: 'styled-text', required: false },
    // Prose intro (REQ-50) — markdown + a style-only style run.
    subhead: { type: 'markdown', required: false },
    subheadStyle: { type: 'styled-text', required: false },
    // Section band fill (REQ-79) — an absolute `#hex` value OR a palette role, over
    // the closed `surface` enum. The section analogue of the card-level `surfaceFill`,
    // for a band colour (e.g. a mid-grey) the four-value enum does not cover. The
    // absolute-or-overlay seam: a captured band colour reproduces exactly.
    surfaceFill: { type: 'color', required: false },
    // Section-level CTA button below the grid (REQ-36) — a styled run.
    cta: { type: 'styled-text', required: false },
    items: {
      type: 'list',
      required: true,
      minItems: 2,
      maxItems: 6,
      itemSchema: {
        icon: { type: 'asset-ref', required: false },
        // Card top-media image (REQ-36).
        image: { type: 'asset-ref', required: false },
        // Card title (REQ-50) — a styled run carrying its own weight/face/size/colour.
        title: { type: 'styled-text', required: true },
        // Card body prose (REQ-50) — markdown + a style-only style run.
        body: { type: 'markdown', required: true },
        bodyStyle: { type: 'styled-text', required: false },
        // Card CTA link (REQ-36) — a styled run.
        cta: { type: 'styled-text', required: false },
        // REQ-26 card chrome — structured, closed-value, token-backed.
        accent: { type: 'color', required: false },
        surface: { type: 'enum', required: false, values: CARD_SURFACE },
        badge: {
          type: 'object',
          required: false,
          itemSchema: {
            label: { type: 'string', required: true },
            variant: { type: 'enum', required: false, values: BADGE_VARIANT },
            // Per-instance escape hatch (REQ-56) — a style-only run overriding the
            // theme `badge` subscale for this one badge (last resort; prefer the
            // subscale). Reuses the REQ-54 run-override style axes.
            labelStyle: { type: 'styled-text', required: false },
          },
        },
        checklist: { type: 'list', required: false, maxItems: 8 },
        // Checklist tick colour (REQ-58) — absolute #hex OR palette role.
        checkColor: { type: 'color', required: false },
        // Per-instance escape hatch (REQ-56) — a style-only run overriding the
        // theme `checklist` subscale for this card's checklist items.
        checklistStyle: { type: 'styled-text', required: false },
      },
    },
  },
} as const satisfies ModuleMeta
