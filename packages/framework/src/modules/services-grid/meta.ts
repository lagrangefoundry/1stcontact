import type { ModuleMeta } from '../types'
import {
  CARD_SURFACE_DIAL,
  CONTENT_WIDTH_DIAL,
  GAP_DIAL,
  HEADING_COLOR_DIAL,
  SIZE_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
} from '../dials'

/**
 * Card accent-border colour (REQ-26). A closed set of palette-role names, not a
 * raw colour — each resolves to a semantic token in the module's scoped CSS
 * (`accent` → `--color-accent`, `primary` → `--color-primary`, `muted` →
 * `--color-muted`). `none` (the absence of the field) draws no accent bar.
 */
export const CARD_ACCENT = ['primary', 'accent', 'muted', 'secondary', 'neutral-cool'] as const

/**
 * Status-badge colour variant (REQ-26). Semantic, token-backed — never a raw
 * colour. `primary`/`accent`/`secondary` key off the brand tokens; `neutral`
 * uses the muted pair for a low-emphasis pill. All variants render as a soft
 * pill (a light tint of the role behind the role-coloured label), matching the
 * captured gigabytealchemy badges. The card's checklist ✓ ticks follow the
 * badge variant's colour.
 */
export const BADGE_VARIANT = ['neutral', 'primary', 'accent', 'secondary'] as const

/**
 * Card fill (REQ-20, REQ-32). `default` is the standard surface card; `muted` is
 * a filled neutral panel (a subtle warm-grey tint); `neutral-cool` is the same
 * treatment keyed to the cool-neutral role, so a panel can read cool (slate)
 * rather than warm. Token-backed, never a raw colour.
 */
export const CARD_SURFACE = ['default', 'muted', 'neutral-cool'] as const

/**
 * `services-grid` — a grid of service / offering cards. Both variants collapse
 * to a single column below the `md` breakpoint (DOC-7 §4.2 mobile-first).
 *
 * The `items` list is bounded 2..6: a single card is not a grid, and beyond six
 * the layout stops reading as a scannable grid. The bound is enforced at the
 * content-schema level via {@link validateModuleContent}.
 *
 * Each card's structured fields (REQ-26) carry the "expensive" card treatments
 * seen in the gigabytealchemy import — an accent left border, a status badge,
 * and a green ✓ checklist — as closed, validated values rather than markdown
 * italics and plain bullets. All three are optional; a card declaring none
 * renders exactly as before.
 */
export const servicesGridMeta = {
  id: 'services-grid',
  version: 1,
  // `stacked` (REQ-30) keeps each card full-width in a single column at every
  // breakpoint (the multi-col variants only spread from `md` up).
  variants: ['three-col', 'two-col', 'stacked'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    gap: GAP_DIAL,
    // Grid-wide card chrome (REQ-36 / CAP-1) — `bare` strips the card fill/
    // border/radius/padding so cards read as plain text columns on the band
    // (dark art-directed grids). `default` leaves cards unchanged.
    cardSurface: CARD_SURFACE_DIAL,
    // Heading colour treatment (REQ-36) — colours the grid heading and card
    // titles (`accent`/`gold`); `plain` (default) inherits the band colour.
    headingTreatment: HEADING_COLOR_DIAL,
    // Card type scale (REQ-20). `md` (default) preserves the prior scale; `lg`
    // steps the card heading/subhead/badge/checklist typography up one notch
    // (the gigabytealchemy reference runs its cards at a larger scale); `sm`
    // steps down. Consistent with the `size` dial on hero / text-block.
    size: SIZE_DIAL,
    // Constrained content column (REQ-45) — caps the grid's content within the
    // section frame, pinned to the left gutter, so the intro copy and cards
    // read as a narrow left-aligned measure (collapsing vertical drift) rather
    // than a wide centred one. `default` leaves the content filling the frame,
    // so a grid that omits the dial is unchanged.
    contentWidth: CONTENT_WIDTH_DIAL,
  },
  contentSchema: {
    heading: { type: 'string', required: false },
    subhead: { type: 'markdown', required: false },
    items: {
      type: 'list',
      required: true,
      minItems: 2,
      maxItems: 6,
      itemSchema: {
        icon: { type: 'asset-ref', required: false },
        title: { type: 'string', required: true },
        body: { type: 'markdown', required: true },
        // Per-card type scale (REQ-20) — `lg` is a featured card (larger title /
        // body / badge), `md` (default) the standard scale. Lets one grid mix
        // headline offerings and a quieter companion panel.
        size: { type: 'enum', required: false, values: SIZE_DIAL },
        cta: { type: 'object', required: false },
        // REQ-26 card treatments — structured, closed-value, token-backed.
        accent: { type: 'enum', required: false, values: CARD_ACCENT },
        // Card fill (REQ-20) — `muted` renders a filled neutral panel.
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
