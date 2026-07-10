import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  CARD_SURFACE_DIAL,
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
 * Card accent-border colour (REQ-26). A closed set of palette-role names, not a
 * raw colour — each resolves to a semantic token in the module's scoped CSS.
 */
export const CARD_ACCENT = ['primary', 'accent', 'muted', 'secondary', 'neutral-cool'] as const

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
        accent: { type: 'enum', required: false, values: CARD_ACCENT },
        surface: { type: 'enum', required: false, values: CARD_SURFACE },
        badge: {
          type: 'object',
          required: false,
          itemSchema: {
            label: { type: 'string', required: true },
            variant: { type: 'enum', required: false, values: BADGE_VARIANT },
          },
        },
        checklist: { type: 'list', required: false, maxItems: 8 },
      },
    },
  },
} as const satisfies ModuleMeta
